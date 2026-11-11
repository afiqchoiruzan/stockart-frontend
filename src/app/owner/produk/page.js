"use client";

import { useState, useMemo } from "react";
import { INITIAL_PRODUCTS, LOW_STOCK_THRESHOLD } from "@/lib/mockProducts";
import LowStockDropdown from "@/components/owner/LowStockDropdown";
import ProductToolbar from "@/components/owner/ProductToolbar";
import ProductCard from "@/components/owner/ProductCard";

export default function OwnerProdukPage() {
  const [products] = useState(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");

  // Filter low stock products for the header dropdown
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => Number(p.stok) <= LOW_STOCK_THRESHOLD);
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "Semua Kategori" || p.kategori === selectedCategory;
      const matchSearch =
        q === "" ||
        p.nama.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleOpenEdit = (product) => {
    // Will be wired to the Drawer in Task 5
    void product;
  };

  const handleOpenAdd = () => {
    // Will be wired to the Drawer in Task 5
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Menu Produk
          </h1>
        </div>

        {/* Action Group: Low Stock Dropdown + Tambah Produk */}
        <div className="flex items-center gap-3">
          <LowStockDropdown
            items={lowStockProducts}
            onSelectProduct={handleOpenEdit}
          />

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] border-2 border-black rounded text-sm font-bold bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <span>+</span>
            <span>Tambah Produk</span>
          </button>
        </div>
      </header>

      {/* Product Search & Filter Toolbar */}
      <ProductToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        totalResults={filteredProducts.length}
      />

      {/* Full-Width Lo-Fi Product Grid */}
      <section aria-label="Daftar Produk Toko">
        {filteredProducts.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-black/50 rounded text-center flex flex-col items-center justify-center gap-3 bg-neutral-50">
            <p className="font-bold text-base text-black">
              Tidak ada produk yang cocok
            </p>
            <p className="text-xs text-neutral-600 max-w-sm">
              Coba gunakan kata kunci pencarian lain atau pilih kategori &quot;Semua Kategori&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Semua Kategori");
              }}
              className="mt-2 px-4 py-2 min-h-[40px] border border-black rounded text-xs font-bold bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
