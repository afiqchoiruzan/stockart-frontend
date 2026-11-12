"use client";

import Link from "next/link";
import { CASHIERS, formatRupiah } from "@/lib/mockTransactions";

export default function CashierSummaryCards({
  cashiers = CASHIERS,
  transactions = [],
  selectedKasirId = "semua",
  onSelectKasir,
}) {
  return (
    <section aria-label="Ringkasan Transaksi Masing-Masing Kasir" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
          Ringkasan Performa Masing-Masing Kasir ({cashiers.length} Kasir)
        </h2>
        {selectedKasirId !== "semua" && (
          <button
            type="button"
            onClick={() => onSelectKasir("semua")}
            className="text-xs font-mono font-bold underline hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black px-1"
          >
            [Reset Filter Kasir: Tampilkan Semua]
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cashiers.map((kasir) => {
          const kasirTrx = transactions.filter((t) => t.kasirId === kasir.id);
          const selesaiTrx = kasirTrx.filter((t) => t.status === "selesai");
          const batalTrx = kasirTrx.filter((t) => t.status === "batal");
          const totalOmzet = selesaiTrx.reduce(
            (sum, t) => sum + Number(t.totalHarga || 0),
            0
          );
          const isSelected = selectedKasirId === kasir.id;

          return (
            <article
              key={kasir.id}
              aria-label={`Ringkasan kasir ${kasir.nama}`}
              className={`border-2 border-black rounded p-4 flex flex-col justify-between gap-3 transition-all ${
                isSelected
                  ? "bg-neutral-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              {/* Header Kasir */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-black/30">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full border-2 border-black bg-neutral-100 flex items-center justify-center font-mono font-bold text-xs shrink-0"
                    aria-hidden="true"
                  >
                    KS
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-black leading-tight">
                      {kasir.nama}
                    </h3>
                    <p className="text-xs text-neutral-600 font-mono">
                      {kasir.kode} &bull; {kasir.username}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 border border-black rounded text-[11px] font-mono font-bold bg-white">
                  {kasir.panggilan}
                </span>
              </div>

              {/* Statistik Kasir */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 border border-black/40 rounded bg-neutral-50">
                  <span className="text-neutral-600 block">Transaksi</span>
                  <span className="font-mono font-bold text-sm text-black">
                    {selesaiTrx.length} Selesai
                  </span>
                  {batalTrx.length > 0 && (
                    <span className="block text-[11px] font-mono text-neutral-600">
                      ({batalTrx.length} Batal)
                    </span>
                  )}
                </div>
                <div className="p-2 border border-black/40 rounded bg-neutral-50">
                  <span className="text-neutral-600 block">Omzet Kasir</span>
                  <span className="font-mono font-bold text-sm text-black">
                    {formatRupiah(totalOmzet)}
                  </span>
                  <span className="block text-[11px] text-neutral-600 truncate">
                    {(kasir.shift || "Shift POS").replace("Shift ", "")}
                  </span>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSelectKasir(isSelected ? "semua" : kasir.id)
                  }
                  className={`flex-1 min-h-[36px] px-2.5 py-1.5 border border-black rounded text-xs font-mono font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                    isSelected
                      ? "bg-black text-white"
                      : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  {isSelected ? "[Difilter]" : "[Filter Tabel]"}
                </button>

                <Link
                  href={`/owner/transaksi/${kasir.id}`}
                  className="flex-1 min-h-[36px] px-2.5 py-1.5 border border-black rounded text-xs font-mono font-bold text-center flex items-center justify-center bg-white hover:bg-neutral-200 text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  [Detail Kasir &rarr;]
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
