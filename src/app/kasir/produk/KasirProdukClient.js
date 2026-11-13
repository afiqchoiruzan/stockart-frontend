"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ALL_CATEGORIES,
  buildCategoryList,
  formatRupiah,
  isLowStock,
  normalizeProduct,
} from "@/lib/mockProducts";
import { apiGetProducts } from "@/lib/api";

export default function KasirProdukClient() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [isFromBackend, setIsFromBackend] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Kasir hanya melihat produk aktif (default backend)
  const loadProducts = useCallback(() => {
    return apiGetProducts()
      .then((res) => {
        setProducts((res?.data || []).map(normalizeProduct));
        setErrorMsg("");
        setIsFromBackend(true);
      })
      .catch((err) => {
        setErrorMsg(err.message || "Gagal mengambil data produk dari server.");
        setIsFromBackend(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const refreshProducts = () => {
    setLoading(true);
    loadProducts();
  };

  // Kategori diambil dari data produk backend
  const categoryList = useMemo(() => buildCategoryList(products), [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === ALL_CATEGORIES || p.kategori === selectedCategory;
      const matchSearch =
        q === "" ||
        (p.nama && p.nama.toLowerCase().includes(q)) ||
        (p.kodeProduk && p.kodeProduk.toLowerCase().includes(q)) ||
        (p.kategori && p.kategori.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Katalog Produk — Read &amp; Search Stok
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {isFromBackend ? `● Terhubung dengan database backend • ${products.length} produk` : loading ? "Memuat data dari server..." : "○ Tidak terhubung ke backend"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshProducts}
            disabled={loading}
            className="px-3 py-1.5 border-2 border-black rounded text-xs font-bold bg-white hover:bg-neutral-100 disabled:opacity-50"
            title="Refresh produk dari backend"
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>
          <div className="border-2 border-black rounded px-3 py-1.5 text-xs font-bold bg-neutral-100 select-none">
            Read-Only
          </div>
        </div>
      </header>

      {/* Error / Warning Notice if any */}
      {errorMsg && (
        <div role="alert" className="p-3 border-2 border-black rounded bg-red-50 text-xs font-medium text-red-800 flex items-center justify-between">
          <span>[!] {errorMsg}</span>
          <button
            type="button"
            onClick={refreshProducts}
            className="text-xs font-bold underline"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
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
            placeholder="Search nama barang / scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 min-h-[44px] border-2 border-black rounded text-sm bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2.5 min-h-[44px] border-2 border-black rounded text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
        >
          {categoryList.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      <section aria-label="Daftar Produk">
        {loading && products.length === 0 ? (
          <div className="p-12 border-2 border-black rounded text-center">
            <p className="font-bold text-sm">Memuat katalog produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-black/50 rounded text-center flex flex-col items-center justify-center gap-3 bg-neutral-50">
            <p className="font-bold text-base text-black">
              Tidak ada produk yang cocok
            </p>
            <p className="text-xs text-neutral-600 max-w-sm">
              Coba gunakan kata kunci pencarian lain atau pilih kategori
              &quot;Semua Kategori&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(ALL_CATEGORIES);
              }}
              className="mt-2 px-4 py-2 min-h-[40px] border border-black rounded text-xs font-bold bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const productId = product.id;
              const price = product.hargaJual;
              const stock = product.stok;
              const lowStock = isLowStock(product);

              return (
                <div
                  key={productId}
                  className="border-2 border-black rounded bg-white overflow-hidden hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  {/* Product Image Placeholder */}
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
                      PRODUK
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-bold text-sm text-black truncate flex-1">
                        {product.nama}
                      </h3>
                      {product.satuan && (
                        <span className="text-[10px] text-neutral-500 font-mono border border-neutral-200 px-1 rounded">
                          {product.satuan}
                        </span>
                      )}
                    </div>
                    {product.kodeProduk && (
                      <p className="text-[11px] font-mono text-neutral-500">
                        {product.kodeProduk}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-neutral-800 mt-1">
                      {formatRupiah(price)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Stok:{" "}
                      <span
                        className={`font-bold ${
                          lowStock ? "text-red-600" : "text-black"
                        }`}
                      >
                        {stock}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
