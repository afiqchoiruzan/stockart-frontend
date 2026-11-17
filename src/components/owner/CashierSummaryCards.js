"use client";

import {
  CASHIERS,
  formatRupiah,
  formatTanggalSingkat,
  getTotalItemCount,
  isTransactionPaid,
} from "@/lib/mockTransactions";

export default function CashierSummaryCards({
  cashiers = CASHIERS,
  transactions = [],
  selectedKasirId = "semua",
  onSelectKasir,
  selectedDate = "",
  onManageCashiers,
}) {
  const dateLabel = selectedDate
    ? formatTanggalSingkat(selectedDate)
    : "Semua tanggal";

  return (
    <section
      aria-label="Ringkasan Transaksi Masing-Masing Kasir"
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center flex-wrap gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
            Ringkasan Performa Kasir ({cashiers.length})
          </h2>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              selectedDate
                ? "bg-[#E6F0ED] text-[#2F6F5E] border border-[#2F6F5E]/25"
                : "bg-white text-[#6B7773] border border-[#E1E4E0]"
            }`}
          >
            {selectedDate ? `Tanggal: ${dateLabel}` : "Periode: Semua tanggal"}
          </span>
        </div>

        {typeof onManageCashiers === "function" && (
          <button
            type="button"
            onClick={onManageCashiers}
            className="inline-flex items-center gap-1.5 min-h-10 sm:min-h-8 px-3 rounded-lg border border-[#2F6F5E] bg-white hover:bg-[#E6F0ED] text-xs font-semibold text-[#2F6F5E] transition-colors cursor-pointer shrink-0"
          >
            + Kelola Kasir
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-3.5">
        {cashiers.map((kasir) => {
          const kasirTrx = transactions.filter(
            (t) =>
              t.kasirId === kasir.id &&
              (!selectedDate || t.tanggal === selectedDate) &&
              isTransactionPaid(t)
          );
          const totalOmzet = kasirTrx.reduce(
            (sum, t) => sum + Number(t.totalHarga || 0),
            0
          );
          const totalPcs = kasirTrx.reduce(
            (sum, t) => sum + getTotalItemCount(t.detailBarang),
            0
          );
          const isSelected = selectedKasirId === kasir.id;

          return (
            <button
              key={kasir.id}
              type="button"
              onClick={() =>
                onSelectKasir && onSelectKasir(isSelected ? "semua" : kasir.id)
              }
              aria-pressed={isSelected}
              aria-label={`Filter transaksi kasir ${kasir.nama}`}
              className={`min-w-0 text-left border rounded-lg p-4 flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                isSelected
                  ? "border-[#2F6F5E] bg-[#E6F0ED] ring-1 ring-[#2F6F5E]/30"
                  : "border-[#E1E4E0] bg-white hover:border-[#2F6F5E]"
              }`}
            >
              {/* Header Kasir */}
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-[#1F2A27] leading-tight wrap-break-word">
                    {kasir.nama}
                  </h3>
                  <p className="text-xs text-[#6B7773] font-mono mt-0.5 truncate">
                    @{kasir.username}
                  </p>
                  <p className="text-[11px] text-[#6B7773] mt-0.5">
                    {dateLabel}
                  </p>
                </div>
                <span
                  className={`shrink-0 whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    isSelected
                      ? "bg-[#2F6F5E] text-white"
                      : "bg-[#F5F6F4] text-[#1F2A27]"
                  }`}
                >
                  {kasirTrx.length} Transaksi
                </span>
              </div>

              {/* Statistik Kasir */}
              <div
                className={`grid grid-cols-2 gap-3 pt-2.5 border-t w-full ${
                  isSelected ? "border-[#2F6F5E]/20" : "border-[#EEF0EC]"
                }`}
              >
                <div>
                  <span className="text-[11px] text-[#6B7773] block">
                    Barang Terjual
                  </span>
                  <span className="font-semibold text-sm text-[#1F2A27] font-mono">
                    {totalPcs} pcs
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#6B7773] block">
                    Omzet Kasir
                  </span>
                  <span className="font-bold text-sm text-[#2F6F5E] font-mono">
                    {formatRupiah(totalOmzet)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
