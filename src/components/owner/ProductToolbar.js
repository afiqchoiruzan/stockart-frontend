"use client";

import { CATEGORIES } from "@/lib/mockProducts";

const STATUS_OPTIONS = [
  { value: "true", label: "Status: Aktif" },
  { value: "false", label: "Status: Nonaktif" },
  { value: "all", label: "Status: Semua" },
];

export default function ProductToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  statusFilter = "true",
  onStatusFilterChange,
  categories = CATEGORIES,
  onAddProduct,
  onOpenScheduleSettings,
}) {
  return (
    <div className="w-full flex flex-wrap items-center gap-2.5">
      {/* Search Input Bar */}
      <div className="relative flex-1 min-w-[240px]">
        <label htmlFor="product-search" className="sr-only">
          Cari produk, kode, atau kategori
        </label>
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7773]">
          <svg
            aria-hidden="true"
            className="w-4 h-4 stroke-current"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <input
          id="product-search"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama produk atau kode barcode…"
          className="w-full min-h-[40px] pl-9 pr-4 bg-white border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 transition-all"
        />
      </div>

      {/* Filter Kategori */}
      <div>
        <label htmlFor="category-select" className="sr-only">
          Filter Kategori
        </label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="min-h-[40px] px-3.5 bg-white border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "Semua Kategori" ? "Semua kategori" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Status Aktif / Nonaktif */}
      {typeof onStatusFilterChange === "function" && (
        <div>
          <label htmlFor="status-select" className="sr-only">
            Filter Status Produk
          </label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="min-h-[40px] px-3.5 bg-white border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tombol Jadwal Alert Stok */}
      {typeof onOpenScheduleSettings === "function" && (
        <button
          type="button"
          onClick={onOpenScheduleSettings}
          className="min-h-[40px] px-3.5 rounded-lg border border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] hover:border-[#2F6F5E] text-[#1F2A27] text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 stroke-current text-[#2F6F5E]"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 15" />
          </svg>
          <span>Jadwal Alert</span>
        </button>
      )}

      {/* Tombol Tambah Produk */}
      {typeof onAddProduct === "function" && (
        <button
          type="button"
          onClick={onAddProduct}
          className="min-h-[40px] px-4 rounded-lg bg-[#2F6F5E] hover:bg-[#255a4c] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 stroke-current"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Tambah produk</span>
        </button>
      )}
    </div>
  );
}
