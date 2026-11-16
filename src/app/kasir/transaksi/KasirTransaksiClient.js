"use client";

import {
  useState,
  useMemo,
  useEffect,
  useEffectEvent,
  useCallback,
  useRef,
} from "react";
import {
  ALL_CATEGORIES,
  buildCategoryList,
  formatRupiah,
  isLowStock,
  normalizeProduct,
} from "@/lib/mockProducts";
import {
  formatTanggalSingkat,
  makeInvoiceNo,
  savePaymentInfo,
  toDateKey,
  toTimeLabel,
} from "@/lib/mockTransactions";
import {
  apiGetProducts,
  apiCheckout,
  apiCreateQrisPayment,
  apiGetTransactionStatus,
  getProductByBarcode,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import dynamic from "next/dynamic";
import QrisPaymentModal from "@/components/kasir/QrisPaymentModal";

// Scanner kamera hanya berjalan di browser; dimuat terpisah saat dibutuhkan.
const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), {
  ssr: false,
});

// Jeda antar pengecekan status QRIS. Pengecekan berikutnya baru dijadwalkan
// setelah respons sebelumnya diterima, jadi request tidak pernah menumpuk.
const QRIS_POLL_MS = 2500;

/** Cocokkan kode hasil scan dengan barcode atau kodeProduk (tanpa beda huruf). */
function findProductByCode(products, code) {
  const q = String(code || "").trim().toLowerCase();
  if (!q) return null;
  return (
    products.find(
      (p) =>
        (p.barcode || "").toLowerCase() === q ||
        (p.kodeProduk || "").toLowerCase() === q
    ) || null
  );
}

/**
 * Perkirakan hasil handleAddToCart (aturan stok yang sama) untuk pesan
 * konfirmasi di modal scanner. Tidak mengubah keranjang.
 */
function getScanAddFeedback(product, cartItems) {
  if (product.stok < 1) {
    return { type: "error", message: `Stok "${product.nama}" habis` };
  }
  const existing = cartItems.find((item) => item.id === product.id);
  if (existing && existing.qty + 1 > product.stok) {
    return {
      type: "error",
      message: `Stok "${product.nama}" hanya tersisa ${product.stok}`,
    };
  }
  const qty = (existing?.qty || 0) + 1;
  return {
    type: "success",
    message: `${product.nama} ditambahkan${qty > 1 ? ` (×${qty})` : ""}`,
  };
}

export default function KasirTransaksiClient() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const searchRef = useRef(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(null);
  // Pembayaran QRIS: modal QR, status pembuatan QR, dan data QR dari backend
  const [qrisOpen, setQrisOpen] = useState(false);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisError, setQrisError] = useState("");
  const [qrisPayment, setQrisPayment] = useState(null);
  // Status dari backend: pending | paid (dengan catatan) | expired | failed
  const [qrisStatus, setQrisStatus] = useState("pending");
  const [qrisNote, setQrisNote] = useState("");
  const [qrisPollWarning, setQrisPollWarning] = useState("");
  // Salinan keranjang terbaru untuk handler scan (dipanggil dari luar render).
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Load products from backend (hanya produk aktif)
  const loadProducts = useCallback(() => {
    return apiGetProducts()
      .then((res) => {
        const list = (res?.data || []).map(normalizeProduct);
        setProducts(list);

        // Sinkronkan batas stok item di keranjang dengan stok terbaru
        setCart((prev) =>
          prev
            .map((item) => {
              const fresh = list.find((p) => p.id === item.id);
              if (!fresh) return null;
              return { ...item, stok: fresh.stok, harga: fresh.hargaJual };
            })
            .filter(Boolean)
        );
      })
      .catch((err) => {
        setErrorMessage(
          err.message || "Gagal mengambil data produk dari server."
        );
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Kategori unik dari produk aktif
  const categoryList = useMemo(() => buildCategoryList(products), [products]);

  // Filter products based on search (nama / kode barcode / kategori) & category chip
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat =
        selectedCategory === ALL_CATEGORIES || p.kategori === selectedCategory;
      const matchQ =
        q === "" ||
        p.nama.toLowerCase().includes(q) ||
        p.kodeProduk.toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart calculations
  const totalHarga = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.harga * item.qty, 0);
  }, [cart]);

  const totalQty = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  const paidNum =
    paymentMethod === "QRIS"
      ? totalHarga
      : Number(String(paymentAmount).replace(/\D/g, "")) || 0;
  const kembalian = Math.max(0, paidNum - totalHarga);
  const canPay =
    cart.length > 0 &&
    !isSubmitting &&
    (paymentMethod === "QRIS" || paidNum >= totalHarga);

  // Add item to cart
  const handleAddToCart = useCallback(
    (product) => {
      setErrorMessage("");
      const prodId = product.id;
      const maxStock = product.stok;

      if (maxStock < 1) {
        setErrorMessage(`Stok "${product.nama}" habis`);
        return;
      }

      setCart((prev) => {
        const existing = prev.find((item) => item.id === prodId);
        if (existing) {
          if (existing.qty + 1 > maxStock) {
            setErrorMessage(`Stok "${product.nama}" hanya tersisa ${maxStock}`);
            return prev;
          }
          return prev.map((item) =>
            item.id === prodId ? { ...item, qty: item.qty + 1 } : item
          );
        }
        return [
          ...prev,
          {
            id: prodId,
            nama: product.nama,
            harga: product.hargaJual,
            kodeProduk: product.kodeProduk,
            stok: maxStock,
            qty: 1,
          },
        ];
      });
    },
    []
  );

  // Kode dari scanner kamera: cari di daftar produk lokal dulu, jika tidak ada
  // tanyakan ke backend. Modal tetap terbuka untuk scan berikutnya.
  const handleScanDetected = useCallback(
    (rawCode) => {
      const code = String(rawCode || "").trim();
      if (!code) return;

      const addScanned = (product) => {
        setScanFeedback(getScanAddFeedback(product, cartRef.current));
        handleAddToCart(product);
      };

      const local = findProductByCode(products, code);
      if (local) {
        addScanned(local);
        return;
      }

      setScanFeedback({ type: "info", message: `Mencari kode ${code}…` });
      getProductByBarcode(code)
        .then((product) => {
          addScanned(product);
          // Daftar lokal belum memuat produk ini; segarkan agar scan
          // berikutnya tidak perlu ke server.
          loadProducts();
        })
        .catch((err) => {
          const message =
            err.status === 404
              ? `Barcode tidak terdaftar: ${code}`
              : err.message || "Gagal mencari produk berdasarkan barcode.";
          setErrorMessage(message);
          setScanFeedback({ type: "error", message });
        });
    },
    [products, handleAddToCart, loadProducts]
  );

  const handleOpenScanner = () => {
    setScanFeedback(null);
    setScannerOpen(true);
  };

  // Remove item from cart
  const handleRemoveFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Update quantity
  const handleUpdateQty = (productId, newQty) => {
    setErrorMessage("");
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const target = cart.find((item) => item.id === productId);
    if (target && newQty > target.stok) {
      setErrorMessage(`Stok maksimal "${target.nama}" hanya ${target.stok}`);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, qty: newQty } : item
      )
    );
  };

  // Clear cart
  const handleClearCart = () => {
    setCart([]);
    setPaymentAmount("");
    setErrorMessage("");
  };

  // Handle payment & checkout to backend
  const handleBayar = useCallback(async () => {
    if (!canPay) return;
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload = cart.map((item) => ({
        produk: item.id,
        jumlah: item.qty,
      }));

      // Backend menghitung ulang harga, memotong stok, dan menyimpan transaksi
      const res = await apiCheckout(payload);
      const trx = res.data;
      const totalServer = Number(trx.totalHarga || 0);
      const effectivePaid =
        paymentMethod === "QRIS" ? totalServer : paidNum;
      const kembalianServer = effectivePaid - totalServer;

      if (kembalianServer < 0) {
        setErrorMessage(
          `Perhatian: total dari server ${formatRupiah(
            totalServer
          )} lebih besar dari uang bayar.`
        );
      }

      savePaymentInfo(trx._id, {
        metodePembayaran: paymentMethod,
        uangBayar: effectivePaid,
        kembalian: Math.max(0, kembalianServer),
      });

      const createdAt = trx.createdAt ? new Date(trx.createdAt) : new Date();

      const invoice = {
        noInvoice: makeInvoiceNo(trx._id),
        backendId: trx._id,
        namaKasir: user?.nama || "Kasir",
        namaToko: "Toko Kelontong Berkah",
        tanggal: formatTanggalSingkat(toDateKey(createdAt)),
        waktu: toTimeLabel(createdAt),
        metode: paymentMethod,
        items: (trx.detailBarang || []).map((item) => ({
          nama: item.namaProduk,
          qty: item.jumlah,
          harga: item.hargaSatuan,
          subtotal: item.subtotal,
        })),
        total: totalServer,
        bayar: effectivePaid,
        kembalian: Math.max(0, kembalianServer),
      };

      setLastInvoice(invoice);
      setShowInvoice(true);
      setCart([]);
      setPaymentAmount("");
      setSearchQuery("");

      // Refresh product list to reflect reduced stock in backend
      loadProducts();
    } catch (err) {
      console.error("Checkout failed:", err);
      setErrorMessage(err.message || "Gagal memproses transaksi di server.");
      if (err.status === 409 || err.status === 404) loadProducts();
    } finally {
      setIsSubmitting(false);
    }
  }, [canPay, cart, paymentMethod, paidNum, user, loadProducts]);

  // QRIS: backend menyimpan transaksi pending (stok belum dipotong) dan membuat
  // QR di Midtrans sandbox. Keranjang dipertahankan sampai pembayaran
  // terkonfirmasi; status lunas hanya diubah webhook di backend.
  const handleStartQris = useCallback(async () => {
    if (cart.length === 0) return;
    setErrorMessage("");
    setQrisError("");
    setQrisPayment(null);
    setQrisStatus("pending");
    setQrisNote("");
    setQrisPollWarning("");
    setQrisOpen(true);
    setQrisLoading(true);

    try {
      const payload = cart.map((item) => ({
        produk: item.id,
        jumlah: item.qty,
      }));
      const res = await apiCreateQrisPayment(payload);
      const trx = res.data;
      setQrisPayment({
        transactionId: trx._id,
        noInvoice: makeInvoiceNo(trx._id),
        qrString: trx.qrString,
        expiresAt: trx.expiresAt,
        totalHarga: Number(trx.totalHarga || 0),
        qrImageUrl: trx.qrImageUrl || null,
        // Disimpan untuk struk setelah lunas (endpoint status tidak memuat item)
        items: (trx.detailBarang || []).map((item) => ({
          nama: item.namaProduk,
          qty: item.jumlah,
          harga: item.hargaSatuan,
          subtotal: item.subtotal,
        })),
      });
    } catch (err) {
      console.error("Create QRIS failed:", err);
      setQrisError(err.message || "Gagal membuat kode QR.");
      if (err.status === 409 || err.status === 404) loadProducts();
    } finally {
      setQrisLoading(false);
    }
  }, [cart, loadProducts]);

  // Batal hanya menutup modal. Transaksi pending di backend akan kedaluwarsa
  // sendiri; stok tidak pernah dipotong untuk QRIS yang belum dibayar.
  const handleCancelQris = () => {
    setQrisOpen(false);
    setQrisPayment(null);
    setQrisError("");
    setQrisStatus("pending");
    setQrisNote("");
    setQrisPollWarning("");
  };

  // Lunas (diputuskan webhook di backend): tutup modal, kosongkan keranjang,
  // tampilkan struk dengan modal yang sama seperti tunai.
  const completeQrisPayment = (payment, statusData) => {
    const total = Number(statusData.totalHarga ?? payment.totalHarga) || 0;
    const paidAt = statusData.paidAt ? new Date(statusData.paidAt) : new Date();

    savePaymentInfo(payment.transactionId, {
      metodePembayaran: "QRIS",
      uangBayar: total,
      kembalian: 0,
    });

    setLastInvoice({
      noInvoice: payment.noInvoice,
      backendId: payment.transactionId,
      namaKasir: user?.nama || "Kasir",
      namaToko: "Toko Kelontong Berkah",
      tanggal: formatTanggalSingkat(toDateKey(paidAt)),
      waktu: toTimeLabel(paidAt),
      metode: "QRIS",
      items: payment.items || [],
      total,
      bayar: total,
      kembalian: 0,
    });
    setShowInvoice(true);
    handleCancelQris();
    setCart([]);
    setPaymentAmount("");
    setSearchQuery("");
    // Stok dipotong oleh webhook; muat ulang daftar produk
    loadProducts();
  };

  // Hasil satu kali pengecekan status. Mengembalikan true jika polling selesai.
  const handleQrisStatus = useEffectEvent((statusData) => {
    const status = statusData?.paymentStatus;
    setQrisPollWarning("");
    if (status === "paid") {
      if (statusData.paymentNote) {
        // Uang masuk tapi transaksi tidak bisa diselesaikan normal: bukan sukses.
        setQrisStatus("paid");
        setQrisNote(statusData.paymentNote);
        loadProducts();
      } else if (qrisPayment) {
        completeQrisPayment(qrisPayment, statusData);
      }
      return true;
    }
    if (status === "expired" || status === "failed") {
      setQrisStatus(status);
      return true;
    }
    return false;
  });

  // Error pengecekan status. Jaringan / 5xx: coba lagi. 4xx: hentikan.
  const handleQrisPollError = useEffectEvent((err) => {
    if (err.status === 0 || err.status >= 500 || !err.status) {
      setQrisPollWarning("Gagal memeriksa status, mencoba lagi…");
      return false;
    }
    setQrisError(err.message || "Status pembayaran tidak dapat diperiksa.");
    return true;
  });

  // Polling status QRIS: hanya selama modal terbuka dan status masih pending.
  // Menutup modal, status final, QR baru, atau unmount -> cleanup mematikan timer.
  const pollTransactionId =
    qrisOpen && !qrisError && qrisStatus === "pending"
      ? qrisPayment?.transactionId || null
      : null;

  useEffect(() => {
    if (!pollTransactionId) return undefined;
    let stopped = false;
    let timer = null;

    const tick = () => {
      apiGetTransactionStatus(pollTransactionId)
        .then((res) => (stopped ? true : handleQrisStatus(res?.data)))
        .catch((err) => (stopped ? true : handleQrisPollError(err)))
        .then((done) => {
          if (!stopped && !done) timer = setTimeout(tick, QRIS_POLL_MS);
        });
    };

    timer = setTimeout(tick, QRIS_POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [pollTransactionId]);

  // Tombol Bayar / F9: tunai memakai alur checkout lama, QRIS membuka modal QR.
  const handlePay = useCallback(() => {
    if (!canPay) return;
    if (paymentMethod === "QRIS") {
      handleStartQris();
    } else {
      handleBayar();
    }
  }, [canPay, paymentMethod, handleStartQris, handleBayar]);

  // Keyboard shortcuts: F2 focus search, F4 uang pas, F9 bayar
  useEffect(() => {
    const onKey = (e) => {
      // Saat modal scanner terbuka, pintasan halaman dinonaktifkan agar
      // tidak ada pembayaran tak sengaja di balik modal.
      if (scannerOpen || qrisOpen) return;
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (totalHarga > 0) setPaymentAmount(String(totalHarga));
      } else if (e.key === "F9") {
        e.preventDefault();
        handlePay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalHarga, handlePay, scannerOpen, qrisOpen]);

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    // Scanner USB mengetik kode lalu Enter: cocokkan barcode atau kodeProduk.
    const exact = findProductByCode(products, q);
    const target =
      exact || (filteredProducts.length === 1 ? filteredProducts[0] : null);
    if (target && target.stok > 0) {
      e.preventDefault();
      handleAddToCart(target);
      setSearchQuery("");
    }
  };

  // Close invoice and go back to POS
  const handleCloseInvoice = () => {
    setShowInvoice(false);
    setLastInvoice(null);
  };

  return (
    <div className="flex flex-col gap-3 max-w-7xl mx-auto">
      {/* Error Notice */}
      {errorMessage && (
        <div
          role="alert"
          className="px-4 py-2.5 border border-[#EBC5C1] rounded-lg bg-[#F8E8E6] text-xs font-medium text-[#C4574F] flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Split POS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Left: Product Search & Catalog */}
        <div className="flex flex-col gap-3 min-w-0">
          {/* Search Bar + tombol Scan kamera */}
          <div className="flex gap-2 w-full">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7773] pointer-events-none">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Scan barcode atau cari barang, lalu Enter"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full h-9 pl-9 pr-12 border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] bg-white placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] px-1.5 py-0.5 rounded border border-[#E1E4E0] bg-white text-[#6B7773] pointer-events-none">
                F2
              </kbd>
            </div>
            <button
              type="button"
              onClick={handleOpenScanner}
              aria-label="Scan barcode dengan kamera"
              className="shrink-0 h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[#2F6F5E] text-[13px] font-semibold text-white hover:bg-[#255a4c] transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                <path d="M7 8v8M10 8v8M13 8v8M17 8v8" />
              </svg>
              Scan
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {categoryList.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${active
                    ? "bg-[#2F6F5E] text-white border-[#2F6F5E]"
                    : "bg-white text-[#6B7773] border-[#E1E4E0] hover:text-[#1F2A27]"
                    }`}
                >
                  {cat === ALL_CATEGORIES ? "Semua" : cat}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          {loadingProducts && products.length === 0 ? (
            <div className="p-8 bg-white border border-[#E1E4E0] rounded-lg text-center text-[13px] text-[#6B7773]">
              Memuat produk dari server…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 bg-white border border-[#E1E4E0] rounded-lg text-center text-[13px] text-[#6B7773]">
              {products.length === 0
                ? "Belum ada produk aktif di database."
                : "Produk tidak ditemukan."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((product) => {
                const prodId = product.id;
                const price = product.hargaJual;
                const stock = Number(product.stok || 0);
                const inCart = cart.find((c) => c.id === prodId);
                const isOut = stock <= 0;
                const low = !isOut && isLowStock(product);

                return (
                  <button
                    key={prodId}
                    type="button"
                    disabled={isOut}
                    onClick={() => handleAddToCart(product)}
                    className={`text-left bg-white border rounded-lg p-3 flex flex-col justify-between gap-2 min-h-[96px] transition-all ${isOut
                      ? "opacity-45 cursor-not-allowed border-[#E1E4E0]"
                      : inCart
                        ? "border-[#2F6F5E] ring-1 ring-[#2F6F5E]/30 cursor-pointer"
                        : "border-[#E1E4E0] hover:border-[#2F6F5E] cursor-pointer"
                      }`}
                  >
                    <div className="text-[13px] font-semibold text-[#1F2A27] leading-[1.3] line-clamp-2">
                      {product.nama}
                    </div>
                    <div className="flex items-center justify-between gap-1.5 w-full mt-1">
                      <span className="font-mono text-[13px] font-bold text-[#2F6F5E]">
                        {formatRupiah(price)}
                      </span>
                      {inCart ? (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E0A458] text-[#1F2A27]">
                          ×{inCart.qty}
                        </span>
                      ) : isOut ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8E8E6] text-[#C4574F]">
                          Habis
                        </span>
                      ) : low ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBF1DC] text-[#D9A441]">
                          Sisa {stock}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-[#6B7773]">
                          Stok {stock}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart & Payment Panel */}
        <div className="bg-white border border-[#E1E4E0] rounded-lg flex flex-col lg:sticky lg:top-4 max-h-[calc(100vh-88px)] overflow-hidden">
          {/* Cart Header */}
          <div className="px-4 py-3 border-b border-[#E1E4E0] flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#1F2A27]">
                Pesanan
              </div>
              <div className="text-xs text-[#6B7773]">
                {totalQty > 0 ? `${totalQty} item` : "Belum ada item"}
              </div>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="px-2.5 py-1 text-xs font-medium text-[#C4574F] hover:bg-[#FAFBF9] rounded-md transition-colors cursor-pointer"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-3.5 py-2 divide-y divide-[#EEF0EC] min-h-[160px]">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#6B7773]">
                Klik produk atau scan barcode untuk menambahkan ke pesanan.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 grid grid-cols-[1fr_auto_auto] gap-2.5 items-center"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#1F2A27] truncate">
                      {item.nama}
                    </div>
                    <div className="text-[11px] text-[#6B7773] font-mono">
                      {formatRupiah(item.harga)} ·{" "}
                      <strong className="text-[#1F2A27]">
                        {formatRupiah(item.harga * item.qty)}
                      </strong>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="inline-flex items-center border border-[#E1E4E0] rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                      className="w-6 h-6 bg-white hover:bg-[#E6F0ED] hover:text-[#2F6F5E] text-xs font-semibold flex items-center justify-center cursor-pointer"
                      aria-label={`Kurangi ${item.nama}`}
                    >
                      −
                    </button>
                    <span className="min-w-[26px] text-center font-mono text-xs font-semibold text-[#1F2A27]">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                      className="w-6 h-6 bg-white hover:bg-[#E6F0ED] hover:text-[#2F6F5E] text-xs font-semibold flex items-center justify-center cursor-pointer"
                      aria-label={`Tambah ${item.nama}`}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFromCart(item.id)}
                    title="Hapus"
                    className="px-1.5 py-1 text-[#6B7773] hover:text-[#C4574F] text-sm leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer / Checkout */}
          <div className="p-3.5 border-t border-[#E1E4E0] bg-[#FAFBF9] flex flex-col gap-2.5">
            {/* Total Row */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-[#6B7773]">
                Total
              </span>
              <span className="font-mono text-lg font-bold text-[#1F2A27]">
                {formatRupiah(totalHarga)}
              </span>
            </div>

            {/* Payment Method Segmented Control */}
            <div className="grid grid-cols-2 gap-1.5">
              {["Tunai", "QRIS"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 px-2.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${paymentMethod === m
                    ? "bg-[#E6F0ED] border-[#2F6F5E] text-[#2F6F5E]"
                    : "bg-white border-[#E1E4E0] text-[#6B7773] hover:text-[#1F2A27]"
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Cash Input & Quick Nominal */}
            {paymentMethod === "Tunai" && (
              <>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="payment"
                    className="text-xs font-medium text-[#1F2A27]"
                  >
                    Uang diterima
                  </label>
                  <input
                    id="payment"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={
                      paymentAmount
                        ? Number(paymentAmount).toLocaleString("id-ID")
                        : ""
                    }
                    onChange={(e) =>
                      setPaymentAmount(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full h-9 px-3 border border-[#E1E4E0] rounded-lg text-[13px] font-mono text-[#1F2A27] bg-white placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    disabled={totalHarga === 0}
                    onClick={() => setPaymentAmount(String(totalHarga))}
                    className="py-1 px-1.5 text-[11px] font-mono border border-[#E1E4E0] rounded-md bg-white text-[#6B7773] hover:border-[#2F6F5E] hover:text-[#2F6F5E] disabled:opacity-40 cursor-pointer"
                  >
                    Pas
                  </button>
                  {[20000, 50000, 100000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPaymentAmount(String(v))}
                      className="py-1 px-1.5 text-[11px] font-mono border border-[#E1E4E0] rounded-md bg-white text-[#6B7773] hover:border-[#2F6F5E] hover:text-[#2F6F5E] cursor-pointer"
                    >
                      {(v / 1000).toFixed(0)}.000
                    </button>
                  ))}
                </div>

                {/* Kembalian Row */}
                <div className="flex items-center justify-between text-xs text-[#6B7773]">
                  <span>Kembalian</span>
                  <strong className="font-mono text-[#1F2A27]">
                    {formatRupiah(kembalian)}
                  </strong>
                </div>
              </>
            )}

            {/* Pay Button */}
            <button
              type="button"
              disabled={!canPay || qrisOpen}
              onClick={handlePay}
              className="w-full py-2.5 px-4 rounded-lg bg-[#2F6F5E] hover:bg-[#255a4c] text-white font-semibold text-[13px] disabled:opacity-45 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? "Memproses…" : "Bayar (F9)"}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && lastInvoice && (
        <div
          className="fixed inset-0 z-50 bg-[#1F2A27]/40 flex items-center justify-center p-5"
          onClick={handleCloseInvoice}
        >
          <div
            id="printable-receipt"
            className="bg-white border border-[#E1E4E0] rounded-xl w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-[#E1E4E0] flex items-center justify-between print:hidden">
              <h3 className="text-[15px] font-semibold text-[#1F2A27]">
                Transaksi berhasil
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F2EC] text-[#3E8E6A]">
                Lunas
              </span>
            </div>

            {/* Modal Receipt Body */}
            <div className="p-4 text-xs">
              <div className="text-center">
                <h4 className="text-sm font-bold text-[#1F2A27]">
                  {lastInvoice.namaToko}
                </h4>
                <p className="text-[11px] text-[#6B7773]">
                  Jl. Kaliurang Km 5, Yogyakarta
                </p>
              </div>

              <div className="border-t border-dashed border-[#E1E4E0] my-2.5" />

              <div className="space-y-1 text-[#1F2A27]">
                <div className="flex justify-between">
                  <span className="text-[#6B7773]">Invoice</span>
                  <span className="font-mono font-medium">
                    {lastInvoice.noInvoice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7773]">Waktu</span>
                  <span className="font-mono">
                    {lastInvoice.tanggal}, {lastInvoice.waktu}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7773]">Kasir</span>
                  <span>{lastInvoice.namaKasir}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7773]">Metode</span>
                  <span>{lastInvoice.metode || "Tunai"}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-[#E1E4E0] my-2.5" />

              <div className="space-y-1.5">
                {lastInvoice.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="font-medium text-[#1F2A27]">{item.nama}</div>
                    <div className="flex justify-between text-[#6B7773] font-mono">
                      <span>
                        {item.qty} × {formatRupiah(item.harga)}
                      </span>
                      <span className="text-[#1F2A27]">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-[#E1E4E0] my-2.5" />

              <div className="space-y-1 font-mono">
                <div className="flex justify-between font-bold text-[13px] text-[#1F2A27] pt-0.5">
                  <span>Total</span>
                  <span>{formatRupiah(lastInvoice.total)}</span>
                </div>
                <div className="flex justify-between text-[#6B7773]">
                  <span>Dibayar</span>
                  <span>{formatRupiah(lastInvoice.bayar)}</span>
                </div>
                <div className="flex justify-between text-[#6B7773]">
                  <span>Kembali</span>
                  <span>{formatRupiah(lastInvoice.kembalian)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-[#E1E4E0] flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 border border-[#E1E4E0] rounded-lg text-[13px] font-semibold text-[#1F2A27] bg-white hover:bg-[#FAFBF9] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Cetak struk
              </button>
              <button
                type="button"
                onClick={handleCloseInvoice}
                className="px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#2F6F5E] hover:bg-[#255a4c] transition-colors cursor-pointer"
              >
                Transaksi baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pembayaran QRIS */}
      <QrisPaymentModal
        open={qrisOpen}
        loading={qrisLoading}
        error={qrisError}
        payment={qrisPayment}
        status={qrisStatus}
        note={qrisNote}
        pollWarning={qrisPollWarning}
        onCancel={handleCancelQris}
        onRetry={handleStartQris}
      />

      {/* Modal scanner kamera: tetap terbuka untuk scan berturut-turut */}
      <BarcodeScanner
        open={scannerOpen}
        onDetected={handleScanDetected}
        onClose={() => setScannerOpen(false)}
        feedback={scanFeedback}
      />
    </div>
  );
}
