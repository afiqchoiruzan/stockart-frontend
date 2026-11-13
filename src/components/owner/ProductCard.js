"use client";

import { LOW_STOCK_THRESHOLD, formatRupiah } from "@/lib/mockProducts";

export default function ProductCard({ product, onEdit }) {
  const isLowStock =
    product.isLowStock !== undefined
      ? Boolean(product.isLowStock)
      : Number(product.stok) <= Number(product.stokMinimum ?? LOW_STOCK_THRESHOLD);

  return (
    <article
      aria-label={`Kartu produk ${product.nama}`}
      className="border-2 border-black rounded bg-white p-3.5 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
    >
      <div>
        {/* Lo-Fi Image Wireframe with Diagonal Cross */}
        <div
          className="relative w-full h-36 border-2 border-black rounded bg-neutral-50 flex items-center justify-center overflow-hidden select-none"
          aria-hidden="true"
        >
          {/* SVG Diagonal Cross Lines */}
          <svg
            className="absolute inset-0 w-full h-full stroke-black/40"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <line x1="0" y1="0" x2="100" y2="100" strokeWidth="1" />
            <line x1="0" y1="100" x2="100" y2="0" strokeWidth="1" />
          </svg>

          {/* Center [IMG] Badge */}
          <span className="relative z-10 px-3 py-1 border border-black rounded bg-white text-xs font-mono font-bold tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            [IMG]
          </span>
        </div>

        {/* Product Details */}
        <div className="mt-3 flex flex-col gap-1">
          <h2 className="text-base font-bold text-black truncate" title={product.nama}>
            {product.nama}
          </h2>
          <p className="text-xs text-neutral-600 font-medium">
            <span>{product.kategori}</span>
            <span className="mx-1.5 font-bold">&bull;</span>
            <span className="font-mono text-black font-semibold">
              {formatRupiah(product.harga)}
            </span>
          </p>
        </div>
      </div>

      {/* Footer: Stock & [Edit] Button */}
      <div className="mt-4 pt-3 border-t border-black/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-neutral-600 font-medium">Stok:</span>
          {isLowStock ? (
            <span
              className="inline-flex items-center gap-1 font-mono font-bold text-black px-1.5 py-0.5 border border-black rounded bg-neutral-200"
              title="Peringatan stok menipis!"
            >
              <span>{product.stok}</span>
              <span className="font-black text-black">!</span>
            </span>
          ) : (
            <span className="font-mono font-bold text-black">{product.stok}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEdit(product)}
          className="min-h-[36px] px-3 py-1 border border-black rounded text-xs font-bold font-mono bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          [Edit]
        </button>
      </div>
    </article>
  );
}
