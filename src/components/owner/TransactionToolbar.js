"use client";

import { CASHIERS, TRANSACTION_STATUSES } from "@/lib/mockTransactions";

export default function TransactionToolbar({
  cashiers = CASHIERS,
  searchQuery,
  onSearchChange,
  selectedKasirId = "semua",
  onKasirChange,
  showKasirFilter = true,
  selectedDate = "",
  onDateChange,
  selectedStatus = "semua",
  onStatusChange,
  totalResults = 0,
}) {
  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    (showKasirFilter && selectedKasirId !== "semua") ||
    selectedDate !== "" ||
    selectedStatus !== "semua";

  const handleResetAll = () => {
    onSearchChange("");
    if (showKasirFilter && onKasirChange) onKasirChange("semua");
    onDateChange("");
    onStatusChange("semua");
  };

  return (
    <div className="w-full flex flex-col gap-3 p-3.5 border-2 border-black rounded bg-neutral-50">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Input Bar */}
        <div className="relative flex-1">
          <label htmlFor="transaction-search" className="sr-only">
            Cari ID Struk, Nama Barang, atau Kasir
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
            <svg
              aria-hidden="true"
              className="w-4 h-4 stroke-current"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <input
            id="transaction-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari ID Struk (#TRX-...), nama barang, atau kasir..."
            className="w-full min-h-[42px] pl-9 pr-10 py-2 border-2 border-black rounded text-sm bg-white placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Bersihkan pencarian"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold font-mono text-neutral-600 hover:text-black"
            >
              [X]
            </button>
          )}
        </div>

        {/* Filter Group: Kasir, Tanggal, Status */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Dropdown Pilih Kasir */}
          {showKasirFilter && (
            <div className="relative flex-1 sm:flex-initial">
              <label htmlFor="filter-kasir" className="sr-only">
                Filter Kasir
              </label>
              <select
                id="filter-kasir"
                value={selectedKasirId}
                onChange={(e) => onKasirChange && onKasirChange(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 pr-8 border-2 border-black rounded text-xs sm:text-sm font-semibold bg-white text-black appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <option value="semua">Filter Kasir: Semua Kasir</option>
                {cashiers.map((k, idx) => (
                  <option key={k.id} value={k.id}>
                    Kasir {idx + 1} - {k.panggilan} ({k.nama})
                  </option>
                ))}
              </select>
              <span
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-xs font-mono font-bold text-black"
                aria-hidden="true"
              >
                [v]
              </span>
            </div>
          )}

          {/* Filter Tanggal */}
          <div className="relative flex items-center">
            <label htmlFor="filter-tanggal" className="sr-only">
              Filter Tanggal Transaksi
            </label>
            <input
              id="filter-tanggal"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="min-h-[42px] px-3 py-1.5 border-2 border-black rounded text-xs sm:text-sm font-mono font-semibold bg-white text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Dropdown Status */}
          <div className="relative flex-1 sm:flex-initial">
            <label htmlFor="filter-status" className="sr-only">
              Filter Status Transaksi
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 pr-8 border-2 border-black rounded text-xs sm:text-sm font-semibold bg-white text-black appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              {TRANSACTION_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
            <span
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-xs font-mono font-bold text-black"
              aria-hidden="true"
            >
              [v]
            </span>
          </div>

          {/* Counter Badge */}
          <span
            className="inline-flex items-center justify-center min-h-[42px] px-3 border border-black rounded text-xs font-mono font-bold bg-white text-black shrink-0"
            aria-live="polite"
          >
            {totalResults} struk
          </span>
        </div>
      </div>

      {/* Baris Info Filter Aktif */}
      {hasActiveFilter && (
        <div className="flex items-center justify-between pt-2 border-t border-black/20 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-neutral-700">
            <span className="font-bold">Filter Aktif:</span>
            {showKasirFilter && selectedKasirId !== "semua" && (
              <span className="px-2 py-0.5 border border-black rounded bg-white font-mono">
                Kasir: {cashiers.find((k) => k.id === selectedKasirId)?.nama || selectedKasirId}
              </span>
            )}
            {selectedDate && (
              <span className="px-2 py-0.5 border border-black rounded bg-white font-mono">
                Tanggal: {selectedDate}
              </span>
            )}
            {selectedStatus !== "semua" && (
              <span className="px-2 py-0.5 border border-black rounded bg-white font-mono uppercase">
                Status: {selectedStatus}
              </span>
            )}
            {searchQuery.trim() !== "" && (
              <span className="px-2 py-0.5 border border-black rounded bg-white font-mono">
                Kata Kunci: &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="font-mono font-bold underline hover:text-black shrink-0"
          >
            [Reset Semua Filter]
          </button>
        </div>
      )}
    </div>
  );
}
