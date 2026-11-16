"use client";

import { formatRupiah } from "@/lib/mockProducts";

/**
 * products: [{ produkId, namaProduk, totalTerjual, totalPendapatan, totalLaba }]
 */
export default function TopProductsPanel({ products = [] }) {
  return (
    <section
      aria-label="Produk Terlaris"
      className="bg-white border border-[#E1E4E0] rounded-lg flex flex-col"
    >
      <div className="px-4 py-3 border-b border-[#E1E4E0] flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#1F2A27]">Terlaris</h2>
        <span className="text-[11px] text-[#6B7773]">Top 5</span>
      </div>

      {products.length === 0 ? (
        <div className="p-6 text-center text-sm text-[#6B7773]">
          Belum ada produk terjual pada periode ini.
        </div>
      ) : (
        <ol className="divide-y divide-[#EEF0EC]">
          {products.map((item, idx) => (
            <li
              key={item.produkId || item.namaProduk}
              className="px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 shrink-0 inline-flex items-center justify-center rounded-full bg-[#E6F0ED] text-[11px] font-semibold text-[#2F6F5E]">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1F2A27] truncate">
                    {item.namaProduk}
                  </p>
                  <p className="text-[11px] text-[#6B7773] font-mono">
                    {formatRupiah(item.totalPendapatan)}
                    {item.totalLaba !== undefined && (
                      <>
                        {" "}
                        &middot; laba {formatRupiah(item.totalLaba)}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-sm text-[#1F2A27] font-mono whitespace-nowrap">
                {Number(item.totalTerjual || 0).toLocaleString("id-ID")} pcs
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
