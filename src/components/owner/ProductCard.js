"use client";

import { LOW_STOCK_THRESHOLD, formatRupiah } from "@/lib/mockProducts";

export default function ProductCard({ product, onEdit }) {
  const isInactive = product.aktif === false;
  const stokNum = Number(product.stok || 0);
  const isOutOfStock = !isInactive && stokNum <= 0;
  const isLowStock =
    !isInactive &&
    !isOutOfStock &&
    (product.isLowStock !== undefined
      ? Boolean(product.isLowStock)
      : stokNum <= Number(product.stokMinimum ?? LOW_STOCK_THRESHOLD));

  return (
    <article
      aria-label={`Kartu produk ${product.nama}`}
      className={`border rounded-lg p-4 flex flex-col justify-between gap-3 transition-colors ${
        isInactive
          ? "border-dashed border-[#E1E4E0] bg-[#F5F6F4] opacity-75"
          : "border-[#E1E4E0] bg-white hover:border-[#2F6F5E]"
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs font-mono text-[#6B7773] truncate"
            title={product.kodeProduk}
          >
            {product.kodeProduk || "-"}
          </span>
          {isInactive ? (
            <span className="inline-flex items-center gap-1 min-h-[22px] px-2 rounded-md text-xs font-semibold bg-[#F5F6F4] text-[#6B7773]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B7773]" />
              Nonaktif
            </span>
          ) : isOutOfStock ? (
            <span className="inline-flex items-center gap-1 min-h-[22px] px-2 rounded-md text-xs font-semibold bg-[#F8E8E6] text-[#8c322b]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4574F]" />
              Habis
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 min-h-[22px] px-2 rounded-md text-xs font-semibold bg-[#FBF1DC] text-[#7a5612]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441]" />
              Menipis
            </span>
          ) : (
            <span className="text-xs text-[#6B7773]">{product.kategori}</span>
          )}
        </div>

        <h2
          className="text-sm font-semibold text-[#1F2A27] line-clamp-2"
          title={product.nama}
        >
          {product.nama}
        </h2>

        <div className="flex items-baseline justify-between gap-2 pt-0.5">
          <span className="font-semibold text-sm text-[#1F2A27] tabular-nums">
            {formatRupiah(product.harga)}
          </span>
          <span className="text-xs text-[#6B7773]">{product.kategori}</span>
        </div>
      </div>

      {/* Footer: Stock & Edit Button */}
      <div className="pt-3 border-t border-[#E1E4E0] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs tabular-nums">
          <span className="text-[#6B7773]">Stok:</span>
          <strong
            className={`font-semibold ${
              isOutOfStock
                ? "text-[#C4574F]"
                : isLowStock
                ? "text-[#7a5612]"
                : "text-[#1F2A27]"
            }`}
          >
            {stokNum} {product.satuan || "pcs"}
          </strong>
        </div>

        <button
          type="button"
          onClick={() => onEdit(product)}
          className="min-h-[34px] px-3 py-1 border border-[#E1E4E0] rounded-md text-xs font-semibold bg-white hover:bg-[#F5F6F4] text-[#1F2A27] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5 stroke-current"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            <path d="m15 5 4 4" />
          </svg>
          <span>Edit</span>
        </button>
      </div>
    </article>
  );
}
