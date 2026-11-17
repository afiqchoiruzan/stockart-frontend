"use client";

import {
  CASHIERS,
  TRANSACTION_STATUS_OPTIONS,
} from "@/lib/mockTransactions";

const PAYMENT_METHODS = [
  { value: "semua", label: "Semua metode" },
  { value: "Tunai", label: "Tunai" },
  { value: "QRIS", label: "QRIS" },
];

export default function TransactionToolbar({
  cashiers = CASHIERS,
  searchQuery,
  onSearchChange,
  selectedKasirId = "semua",
  onKasirChange,
  showKasirFilter = true,
  selectedMethod = "semua",
  onMethodChange,
  selectedStatus = "semua",
  onStatusChange,
  selectedDate = "",
  onDateChange,
}) {
  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    (showKasirFilter && selectedKasirId !== "semua") ||
    selectedMethod !== "semua" ||
    selectedStatus !== "semua" ||
    selectedDate !== "";

  const handleResetAll = () => {
    onSearchChange("");
    if (showKasirFilter && onKasirChange) onKasirChange("semua");
    if (onMethodChange) onMethodChange("semua");
    if (onStatusChange) onStatusChange("semua");
    onDateChange("");
  };

  return (
    <div className="w-full flex flex-wrap lg:flex-nowrap items-center gap-2">
      {/* Search Input Bar */}
      <div className="relative basis-full sm:basis-auto sm:flex-1 min-w-[160px]">
        <label htmlFor="transaction-search" className="sr-only">
          Cari no. invoice, nama barang, atau kasir
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
          id="transaction-search"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari no. invoice, nama barang, atau kasir…"
          className="w-full min-h-11 lg:min-h-[40px] pl-9 pr-4 bg-white border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 transition-all"
        />
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilter && (
        <button
          type="button"
          onClick={handleResetAll}
          className="min-h-11 lg:min-h-[40px] px-3.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-xs font-semibold text-[#B91C1C] transition-colors cursor-pointer shrink-0"
        >
          Reset filter
        </button>
      )}

      {/* Dropdown Pilih Kasir */}
      {showKasirFilter && (
        <div className="flex-1 basis-[40%] min-w-0 sm:basis-auto sm:flex-none lg:shrink-0">
          <label htmlFor="filter-kasir" className="sr-only">
            Filter kasir
          </label>
          <select
            id="filter-kasir"
            value={selectedKasirId}
            onChange={(e) => onKasirChange && onKasirChange(e.target.value)}
            className="w-full sm:w-auto max-w-full min-h-11 lg:min-h-[40px] px-2.5 bg-white border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer"
          >
            <option value="semua">Semua kasir</option>
            {cashiers.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dropdown Metode Pembayaran */}
      {typeof onMethodChange === "function" && (
        <div className="flex-1 basis-[40%] min-w-0 sm:basis-auto sm:flex-none lg:shrink-0">
          <label htmlFor="filter-metode" className="sr-only">
            Filter metode pembayaran
          </label>
          <select
            id="filter-metode"
            value={selectedMethod}
            onChange={(e) => onMethodChange(e.target.value)}
            className="w-full sm:w-auto max-w-full min-h-11 lg:min-h-[40px] px-2.5 bg-white border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dropdown Status Transaksi */}
      {typeof onStatusChange === "function" && (
        <div className="flex-1 basis-[40%] min-w-0 sm:basis-auto sm:flex-none lg:shrink-0">
          <label htmlFor="filter-status" className="sr-only">
            Filter status transaksi
          </label>
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full sm:w-auto max-w-full min-h-11 lg:min-h-[40px] px-2.5 bg-white border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer"
          >
            {TRANSACTION_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter Tanggal */}
      <div className="basis-full sm:basis-auto lg:shrink-0">
        <label htmlFor="filter-tanggal" className="sr-only">
          Filter tanggal transaksi
        </label>
        <input
          id="filter-tanggal"
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full sm:w-auto min-h-11 lg:min-h-[40px] px-2.5 bg-white border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15"
        />
      </div>
    </div>
  );
}
