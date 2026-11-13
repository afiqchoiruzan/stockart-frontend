"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { formatRupiah, isLowStock, normalizeProduct } from "@/lib/mockProducts";
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
  const [cart, setCart] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFromBackend, setIsFromBackend] = useState(false);

  // Load products from backend (hanya produk aktif)
  const loadProducts = useCallback(() => {
    return apiGetProducts()
      .then((res) => {
        const list = (res?.data || []).map(normalizeProduct);
        setProducts(list);
        setIsFromBackend(true);

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
        setErrorMessage(err.message || "Gagal mengambil data produk dari server.");
        setIsFromBackend(false);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filter products based on search (nama / kode barcode / kategori)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q === "") return products;
    return products.filter((p) => {
      return (
        p.nama.toLowerCase().includes(q) ||
        p.kodeProduk.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery]);

  // Cart calculations
  const totalHarga = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.harga * item.qty, 0);
  }, [cart]);

  const paymentNum = Number(paymentAmount) || 0;
  const kembalian = paymentNum - totalHarga;

  // Add item to cart
  const handleAddToCart = (product) => {
    setErrorMessage("");
    const prodId = product.id;
    const maxStock = product.stok;

    const existing = cart.find((item) => item.id === prodId);
    if (existing) {
      if (existing.qty + 1 > maxStock) {
        setErrorMessage(`Stok "${product.nama}" hanya tersisa ${maxStock}`);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === prodId ? { ...item, qty: item.qty + 1 } : item
        )
      );
      return;
    }
    if (maxStock < 1) {
      setErrorMessage(`Stok "${product.nama}" habis`);
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        id: prodId,
        nama: product.nama,
        harga: product.hargaJual,
        kodeProduk: product.kodeProduk,
        stok: maxStock,
        qty: 1,
      },
    ]);
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
      prev.map((item) => (item.id === productId ? { ...item, qty: newQty } : item))
    );
  };

  // Handle payment & checkout to backend
  const handleBayar = async () => {
    if (cart.length === 0 || paymentNum < totalHarga) return;
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
      const kembalianServer = paymentNum - totalServer;

      if (kembalianServer < 0) {
        // Harga berubah di server sehingga uang bayar kurang (kasus jarang)
        setErrorMessage(
          `Perhatian: total dari server ${formatRupiah(totalServer)} lebih besar dari uang bayar.`
        );
      }

      savePaymentInfo(trx._id, {
        metodePembayaran: "Tunai",
        uangBayar: paymentNum,
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
        items: (trx.detailBarang || []).map((item) => ({
          nama: item.namaProduk,
          qty: item.jumlah,
          harga: item.hargaSatuan,
          subtotal: item.subtotal,
        })),
        total: totalServer,
        bayar: paymentNum,
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
      // Stok mungkin berubah (409) — muat ulang agar kasir melihat stok terbaru
      if (err.status === 409 || err.status === 404) loadProducts();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close invoice and go back to POS
  const handleCloseInvoice = () => {
    setShowInvoice(false);
    setLastInvoice(null);
  };

  // Invoice view
  if (showInvoice && lastInvoice) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <header className="flex items-center justify-between pb-4 border-b-2 border-black">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Transaksi</h1>
            <p className="text-xs text-neutral-500">
              Transaksi berhasil dicatat ke sistem
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseInvoice}
            className="px-4 py-2 min-h-[44px] border-2 border-black rounded text-sm font-bold bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            ← Kembali ke POS
          </button>
        </header>

        {/* Invoice Card */}
        <div className="border-2 border-black rounded p-6 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          {/* Invoice Header */}
          <div className="text-center pb-4 border-b border-dashed border-black">
            <p className="font-bold text-lg">INVOICE {lastInvoice.noInvoice}</p>
            <p className="text-sm text-neutral-600">{lastInvoice.namaToko}</p>
            <p className="text-xs text-neutral-500 mt-1">
              Kasir: {lastInvoice.namaKasir} | {lastInvoice.tanggal} — {lastInvoice.waktu}
            </p>
          </div>

          {/* Invoice Items */}
          <div className="py-4 space-y-2">
            {lastInvoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>
                  {item.qty}x {item.nama}
                </span>
                <span className="font-mono">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Invoice Totals */}
          <div className="pt-4 border-t border-dashed border-black space-y-1">
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL</span>
              <span className="text-red-600">{formatRupiah(lastInvoice.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Bayar:</span>
              <span>{formatRupiah(lastInvoice.bayar)}</span>
            </div>
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Kembali:</span>
              <span>{formatRupiah(lastInvoice.kembalian)}</span>
            </div>
          </div>

          {/* Print Button */}
          <div className="mt-6 pt-4 border-t border-black">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full min-h-[48px] px-4 py-3 border-2 border-black rounded text-sm font-bold bg-white hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
                />
              </svg>
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    );
  }

  // POS View
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Buat Transaksi Penjualan (POS) → Payment → Invoice
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Kasir: <span className="font-bold text-black">{user?.nama || "Kasir"}</span>
            {isFromBackend
              ? " | Backend Connected"
              : loadingProducts
              ? " | Memuat..."
              : " | Backend Tidak Terhubung"}
          </p>
        </div>
      </header>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 border-2 border-black rounded bg-red-100 text-sm font-medium text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">[!]</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-xs font-bold underline"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Product Search & Selection */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Scan Barcode / Pilih Barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                // Scanner barcode biasanya mengirim Enter setelah kode
                if (e.key !== "Enter") return;
                const code = searchQuery.trim().toLowerCase();
                const match = products.find((p) => p.kodeProduk.toLowerCase() === code);
                if (match) {
                  e.preventDefault();
                  handleAddToCart(match);
                  setSearchQuery("");
                }
              }}
              className="w-full pl-9 pr-3 py-2.5 min-h-[44px] border-2 border-black rounded text-sm bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {loadingProducts && products.length === 0 && (
            <div className="p-8 border-2 border-black rounded text-center text-sm font-mono bg-neutral-50">
              Memuat produk dari server...
            </div>
          )}
          {!loadingProducts && filteredProducts.length === 0 && (
            <div className="p-8 border-2 border-dashed border-black/50 rounded text-center text-sm text-neutral-600 bg-neutral-50">
              {products.length === 0
                ? "Belum ada produk aktif di database."
                : "Produk tidak ditemukan. Coba kata kunci / kode lain."}
            </div>
          )}

          {/* Product Grid for Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const prodId = product.id;
              const price = product.hargaJual;
              const stock = product.stok;
              const inCart = cart.find((c) => c.id === prodId);
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={prodId}
                  className={`border-2 rounded bg-white overflow-hidden transition-shadow ${
                    inCart
                      ? "border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "border-black/60 hover:border-black hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {/* Item Image Placeholder */}
                  <div className="aspect-[4/3] border-b-2 border-black bg-neutral-100 flex items-center justify-center relative">
                    <svg
                      className="absolute inset-0 w-full h-full text-neutral-300"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 75"
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="100"
                        y2="75"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                      <line
                        x1="100"
                        y1="0"
                        x2="0"
                        y2="75"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                    </svg>
                    <span className="relative z-10 text-xs font-bold text-neutral-500 bg-white/80 px-2 py-0.5 border border-neutral-300">
                      ITEM
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-black truncate">
                      {product.nama}
                    </h3>
                    <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                      {formatRupiah(price)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Stok:{" "}
                      <span className={isLowStock(product) ? "font-bold text-red-600" : "font-medium"}>
                        {stock}
                      </span>
                    </p>
                  </div>

                  {/* Add Button */}
                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className="w-full min-h-[40px] px-3 py-2 border-2 border-black rounded text-xs font-bold bg-white hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    >
                      {isOutOfStock ? "Stok Habis" : `+ Tambah${inCart ? ` (${inCart.qty})` : ""}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart & Payment */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0">
          <div className="border-2 border-black rounded bg-white sticky top-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {/* Cart Header */}
            <div className="px-4 py-3 border-b-2 border-black bg-neutral-50">
              <h2 className="font-bold text-sm">Keranjang &amp; Payment</h2>
            </div>

            {/* Cart Items */}
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-4">
                  Belum ada barang di keranjang
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm py-1 border-b border-neutral-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="truncate">{item.nama}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                          className="w-6 h-6 border border-black rounded text-xs font-bold bg-white hover:bg-neutral-200 flex items-center justify-center"
                          aria-label={`Kurangi ${item.nama}`}
                        >
                          −
                        </button>
                        <span className="text-xs font-bold w-5 text-center">
                          {item.qty}x
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                          className="w-6 h-6 border border-black rounded text-xs font-bold bg-white hover:bg-neutral-200 flex items-center justify-center"
                          aria-label={`Tambah ${item.nama}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <span className="font-mono text-xs ml-2 shrink-0">
                      {formatRupiah(item.harga * item.qty)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Totals & Payment */}
            <div className="px-4 py-3 border-t-2 border-black space-y-3">
              {/* Total */}
              <div className="flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span className="text-red-600">{formatRupiah(totalHarga)}</span>
              </div>

              {/* Payment Input */}
              <div>
                <label
                  htmlFor="payment"
                  className="block text-xs font-bold mb-1 text-neutral-700"
                >
                  Payment Tunai:
                </label>
                <input
                  id="payment"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 min-h-[40px] border-2 border-black rounded text-sm text-right font-mono bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Kembalian */}
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Kembalian:</span>
                <span
                  className={`font-bold font-mono ${
                    kembalian >= 0 ? "text-black" : "text-red-600"
                  }`}
                >
                  {paymentNum > 0 ? formatRupiah(Math.max(0, kembalian)) : "-"}
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <div className="p-4 pt-0">
              <button
                type="button"
                onClick={handleBayar}
                disabled={cart.length === 0 || paymentNum < totalHarga || isSubmitting}
                className="w-full min-h-[48px] px-4 py-3 border-2 border-black rounded text-sm font-bold bg-black text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                {isSubmitting ? "Memproses Transaksi..." : "Bayar & Cetak Invoice"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
