"use client";

import { formatRupiah } from "@/lib/mockProducts";

function formatShortRupiah(amount) {
  const value = Number(amount || 0);
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1).replace(".", ",")} jt`;
  }
  if (value >= 1e3) {
    return `${Math.round(value / 1e3)} rb`;
  }
  return String(value);
}

/**
 * points: [{ label, omzet, jumlahTransaksi }]
 */
export default function RevenueChart({ title, points = [] }) {
  const maxOmzet = Math.max(0, ...points.map((p) => Number(p.omzet || 0)));
  const hasData = maxOmzet > 0;
  const ariaLabel = `${title}: ${points
    .map((p) => `${p.label} ${formatRupiah(p.omzet)}`)
    .join(", ")}`;

  return (
    <section
      aria-label={title}
      className="bg-white border border-[#E1E4E0] rounded-lg flex flex-col"
    >
      <div className="px-4 py-3 border-b border-[#E1E4E0]">
        <h2 className="text-sm font-semibold text-[#1F2A27]">{title}</h2>
      </div>

      {!hasData ? (
        <div className="p-10 text-center text-sm text-[#6B7773]">
          Belum ada omzet pada periode ini.
        </div>
      ) : (
        <div
          role="img"
          aria-label={ariaLabel}
          className="h-[220px] sm:h-[240px] p-3 sm:p-4 flex items-end gap-1.5 sm:gap-2 overflow-x-auto"
        >
          {points.map((point) => {
            const omzet = Number(point.omzet || 0);
            const heightPct = Math.round((omzet / maxOmzet) * 80);
            return (
              <div
                key={point.label}
                title={`${point.label}: ${formatRupiah(omzet)} (${
                  point.jumlahTransaksi || 0
                } transaksi)`}
                className="flex-1 min-w-[34px] sm:min-w-[28px] h-full flex flex-col items-center justify-end gap-1"
              >
                <span className="text-[11px] text-[#6B7773] font-mono whitespace-nowrap">
                  {omzet > 0 ? formatShortRupiah(omzet) : ""}
                </span>
                <div
                  className={`w-full max-w-[48px] rounded-t-md ${
                    omzet > 0 ? "bg-[#2F6F5E]" : "bg-[#E1E4E0]"
                  }`}
                  style={{ height: omzet > 0 ? `${heightPct}%` : "2px" }}
                />
                <span className="text-[11px] text-[#6B7773] whitespace-nowrap">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
