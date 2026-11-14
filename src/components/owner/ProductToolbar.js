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
  totalResults,
}) {
  return (
    <div className="w-full flex flex-col md:flex-row items-stretch md:items-center gap-3">
      {/* Search Input Bar (Memanjang) */}
      <div className="relative flex-1">
        <label htmlFor="product-search" className="sr-only">
          Cari Produk, Kode, atau Kategori
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
          <svg
            aria-hidden="true"
            className="w-5 h-5 stroke-current"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
        </div>
        <input
          id="product-search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Produk / Kode / Kategori..."
          className="w-full min-h-[44px] pl-10 pr-10 py-2 border-2 border-black rounded text-sm bg-white placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Bersihkan pencarian"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold font-mono text-neutral-600 hover:text-black cursor-pointer"
          >
            [X]
          </button>
        )}
      </div>

      {/* Filter Kategori, Filter Status Aktif, & Counter */}
      <div className="shrink-0 flex flex-wrap items-center gap-2">
        <label htmlFor="category-select" className="sr-only">
          Filter Kategori
        </label>
        <div className="relative">
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="min-h-[44px] px-3.5 py-2 pr-9 border-2 border-black rounded text-sm font-semibold bg-white text-black appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div
            className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>

        {/* Status Filter Dropdown (Aktif / Nonaktif / Semua -> query ?aktif=) */}
        {typeof onStatusFilterChange === "function" && (
          <>
            <label htmlFor="status-select" className="sr-only">
              Filter Status Produk
            </label>
            <div className="relative">
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 pr-9 border-2 border-black rounded text-sm font-semibold bg-white text-black appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                aria-hidden="true"
              >
                <svg
                  className="w-4 h-4 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>
          </>
        )}

        {/* Counter Badge */}
        <span
          className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-3 border border-black rounded text-xs font-mono bg-neutral-100 text-neutral-700"
          aria-live="polite"
        >
          {totalResults} produk
        </span>
      </div>
    </div>
  );
}
