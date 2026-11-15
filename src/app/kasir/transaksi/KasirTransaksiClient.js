"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { apiGetProducts, apiCheckout } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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

  // Keyboard shortcuts: F2 focus search, F4 uang pas, F9 bayar
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (totalHarga > 0) setPaymentAmount(String(totalHarga));
      } else if (e.key === "F9") {
        e.preventDefault();
        if (canPay) handleBayar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalHarga, canPay, handleBayar]);

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const exact = products.find((p) => p.kodeProduk.toLowerCase() === q);
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
          {/* Search Bar */}
          <div className="relative w-full">
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
              disabled={!canPay}
              onClick={handleBayar}
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
    </div>
  );
}
