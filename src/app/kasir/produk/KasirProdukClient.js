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
  const [errorMsg, setErrorMsg] = useState("");

  // Kasir hanya melihat produk aktif (default backend)
  const loadProducts = useCallback(() => {
    return apiGetProducts()
      .then((res) => {
        setProducts((res?.data || []).map(normalizeProduct));
        setErrorMsg("");
      })
      .catch((err) => {
        setErrorMsg(err.message || "Gagal mengambil data produk dari server.");
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
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Error / Warning Notice if any */}
      {errorMsg && (
        <div
          role="alert"
          className="px-4 py-3 border border-[#EBC5C1] rounded-lg bg-[#F8E8E6] text-xs font-medium text-[#C4574F] flex items-center justify-between"
        >
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={refreshProducts}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Bar */}
        <div className="flex-1 min-w-[240px] relative">
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
            type="text"
            placeholder="Cari nama produk atau kode barcode…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] bg-white placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 transition-all"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 px-3 border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] bg-white focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer"
        >
          {categoryList.map((cat) => (
            <option key={cat} value={cat}>
              {cat === ALL_CATEGORIES ? "Semua kategori" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Product Table Card */}
      <section
        aria-label="Daftar Produk"
        className="bg-white border border-[#E1E4E0] rounded-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#FAFBF9] border-b border-[#E1E4E0]">
                <th className="text-left px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
                  Produk
                </th>
                <th className="text-left px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
                  Kategori
                </th>
                <th className="text-right px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
                  Harga
                </th>
                <th className="text-right px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
                  Stok
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF0EC]">
              {loading && products.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-[#6B7773]"
                  >
                    Memuat katalog produk…
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-[#6B7773]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span>Tidak ada produk yang cocok.</span>
                      {(searchQuery || selectedCategory !== ALL_CATEGORIES) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory(ALL_CATEGORIES);
                          }}
                          className="px-3 py-1.5 border border-[#E1E4E0] rounded-md text-xs font-semibold text-[#1F2A27] bg-white hover:bg-[#FAFBF9] cursor-pointer"
                        >
                          Reset filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = Number(product.stok || 0);
                  const out = stock === 0;
                  const low = !out && isLowStock(product);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#FAFBF9] transition-colors"
                    >
                      <td className="px-3.5 py-2.5">
                        <div className="font-medium text-[#1F2A27]">
                          {product.nama}
                        </div>
                        <div className="text-[11px] text-[#6B7773] font-mono mt-0.5">
                          {product.kodeProduk}
                          {product.satuan ? ` · ${product.satuan}` : ""}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-[#6B7773]">
                        {product.kategori || "Umum"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-[#1F2A27]">
                        {formatRupiah(product.hargaJual)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono">
                        <span className="font-medium text-[#1F2A27]">
                          {stock}
                        </span>
                        {out && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8E8E6] text-[#C4574F]">
                            Habis
                          </span>
                        )}
                        {low && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBF1DC] text-[#D9A441]">
                            Menipis
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
