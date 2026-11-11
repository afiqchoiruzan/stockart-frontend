"use client";

import { useState, useMemo } from "react";
import { INITIAL_PRODUCTS, LOW_STOCK_THRESHOLD } from "@/lib/mockProducts";
import LowStockDropdown from "@/components/owner/LowStockDropdown";

export default function OwnerProdukPage() {
  const [products] = useState(INITIAL_PRODUCTS);

  // Filter low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => Number(p.stok) <= LOW_STOCK_THRESHOLD);
  }, [products]);

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

      {/* Main Content Placeholder for Task 4 */}
      <div className="p-8 border-2 border-dashed border-black/40 rounded text-center text-neutral-500 font-mono text-sm">
        [Area Kontrol Pencarian & Grid Produk - Task 4]
      </div>
    </div>
  );
}
