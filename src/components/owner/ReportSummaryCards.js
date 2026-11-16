"use client";

import { formatRupiah } from "@/lib/mockProducts";

export default function ReportSummaryCards({
  totalOmzet = 0,
  totalTransaksi = 0,
  totalTerjual = 0,
  totalMasuk = 0,
  periodLabel = "",
}) {
  const formatPcs = (value) =>
    `${Number(value || 0).toLocaleString("id-ID")} pcs`;

  return (
    <section aria-label="Ringkasan Laporan" className="flex flex-col gap-2.5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
        Ringkasan Penjualan
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
        <div className="sm:col-span-2 lg:col-span-1 min-w-0 bg-white border border-[#E1E4E0] rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[11px] text-[#6B7773]">Omzet</span>
          <span className="font-bold text-[clamp(1.125rem,1rem+0.6vw,1.25rem)] wrap-break-word text-[#2F6F5E] font-mono">
            {formatRupiah(totalOmzet)}
          </span>
          <span className="text-[11px] text-[#6B7773]">
            {Number(totalTransaksi || 0).toLocaleString("id-ID")} transaksi
            selesai &middot; {periodLabel}
          </span>
        </div>

        <div className="min-w-0 bg-white border border-[#E1E4E0] rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[11px] text-[#6B7773]">Produk Terjual</span>
          <span className="font-bold text-[clamp(1.125rem,1rem+0.6vw,1.25rem)] wrap-break-word text-[#1F2A27] font-mono">
            {formatPcs(totalTerjual)}
          </span>
          <span className="text-[11px] text-[#6B7773]">
            Dihitung dari transaksi selesai
          </span>
        </div>

        <div className="min-w-0 bg-white border border-[#E1E4E0] rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[11px] text-[#6B7773]">Produk Masuk</span>
          <span className="font-bold text-[clamp(1.125rem,1rem+0.6vw,1.25rem)] wrap-break-word text-[#1F2A27] font-mono">
            +{formatPcs(totalMasuk)}
          </span>
          <span className="text-[11px] text-[#6B7773]">
            Dari produk baru &amp; restock
          </span>
        </div>
      </div>
    </section>
  );
}
