"use client";

import { formatRupiah } from "@/lib/mockProducts";

/**
 * Persentase perubahan dibanding periode sebelumnya.
 * null bila data pembanding belum ada; "baru" bila periode sebelumnya nol.
 */
function getChange(current, previous) {
  if (previous === null || previous === undefined) return null;
  const cur = Number(current || 0);
  const prev = Number(previous || 0);
  if (prev === 0) return cur === 0 ? { pct: 0 } : { isNew: true };
  return { pct: ((cur - prev) / Math.abs(prev)) * 100 };
}

function ChangeBadge({ current, previous, compareLabel }) {
  const change = getChange(current, previous);
  if (!change) return null;

  let text;
  let tone;
  if (change.isNew) {
    text = "Baru";
    tone = "up";
  } else {
    const rounded = Math.round(change.pct);
    if (rounded === 0) {
      text = "0%";
      tone = "flat";
    } else {
      text = `${rounded > 0 ? "▲" : "▼"} ${Math.abs(rounded).toLocaleString("id-ID")}%`;
      tone = rounded > 0 ? "up" : "down";
    }
  }

  const toneClass =
    tone === "up"
      ? "bg-[#E6F2EC] text-[#245942]"
      : tone === "down"
      ? "bg-[#F8E8E6] text-[#8c322b]"
      : "bg-[#F5F6F4] text-[#6B7773]";

  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-[11px] text-[#6B7773]">
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold font-mono ${toneClass}`}
      >
        {text}
      </span>
      vs {compareLabel}
    </span>
  );
}

const VALUE_CLASS =
  "font-bold text-[clamp(1.125rem,1rem+0.6vw,1.25rem)] wrap-break-word font-mono";
const CARD_CLASS =
  "min-w-0 bg-white border border-[#E1E4E0] rounded-lg p-4 flex flex-col gap-1";

export default function ReportSummaryCards({
  summary = {},
  previousSummary = null,
  compareLabel = "periode sebelumnya",
  periodLabel = "",
}) {
  const prev = previousSummary || {};
  const hasPrev = Boolean(previousSummary);
  const formatPcs = (value) =>
    `${Number(value || 0).toLocaleString("id-ID")} pcs`;

  return (
    <section aria-label="Ringkasan Laporan" className="flex flex-col gap-2.5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
        Ringkasan Penjualan
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5">
        <div className={CARD_CLASS}>
          <span className="text-[11px] text-[#6B7773]">Omzet</span>
          <span className={`${VALUE_CLASS} text-[#2F6F5E]`}>
            {formatRupiah(summary.totalOmzet)}
          </span>
          <span className="text-[11px] text-[#6B7773]">
            {Number(summary.totalTransaksi || 0).toLocaleString("id-ID")} transaksi
            selesai &middot; {periodLabel}
          </span>
          <ChangeBadge
            current={summary.totalOmzet}
            previous={hasPrev ? prev.totalOmzet : null}
            compareLabel={compareLabel}
          />
        </div>

        <div className={CARD_CLASS}>
          <span className="flex items-center gap-1.5 text-[11px] text-[#6B7773]">
            Laba Kotor
            {summary.labaEstimasi && (
              <span
                title="Sebagian transaksi lama belum menyimpan harga beli, jadi labanya dihitung dengan harga beli saat ini."
                className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FBF1DC] text-[10px] font-semibold text-[#7a5612] cursor-help"
              >
                Estimasi
              </span>
            )}
          </span>
          <span
            className={`${VALUE_CLASS} ${
              Number(summary.totalLaba || 0) < 0 ? "text-[#C4574F]" : "text-[#1F2A27]"
            }`}
          >
            {formatRupiah(summary.totalLaba)}
          </span>
          <ChangeBadge
            current={summary.totalLaba}
            previous={hasPrev ? prev.totalLaba : null}
            compareLabel={compareLabel}
          />
        </div>

        <div className={CARD_CLASS}>
          <span className="text-[11px] text-[#6B7773]">Produk Terjual</span>
          <span className={`${VALUE_CLASS} text-[#1F2A27]`}>
            {formatPcs(summary.totalTerjual)}
          </span>
          <ChangeBadge
            current={summary.totalTerjual}
            previous={hasPrev ? prev.totalTerjual : null}
            compareLabel={compareLabel}
          />
        </div>

        <div className={CARD_CLASS}>
          <span className="text-[11px] text-[#6B7773]">Produk Masuk</span>
          <span className={`${VALUE_CLASS} text-[#1F2A27]`}>
            +{formatPcs(summary.totalMasuk)}
          </span>
          {/* Tanpa pembanding: barang masuk mengikuti kebutuhan restock, bukan ukuran kinerja */}
        </div>
      </div>
    </section>
  );
}
