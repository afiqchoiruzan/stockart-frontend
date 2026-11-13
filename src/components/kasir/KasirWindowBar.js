"use client";

import { usePathname } from "next/navigation";

const PAGE_LABELS = {
  "/kasir/produk": "3A. KASIR — PRODUK",
  "/kasir/transaksi": "3B. KASIR — TRANSAKSI POS",
  "/kasir/riwayat": "3C. KASIR — RIWAYAT & INVOICE",
};

export default function KasirWindowBar() {
  const pathname = usePathname();

  const label = PAGE_LABELS[pathname] || "KASIR PANEL";
  const displayUrl = `https://stockart.pages.dev${pathname || "/kasir"}`;

  return (
    <header
      aria-label="Mock Window Bar"
      className="w-full border-b-2 border-black bg-white px-4 py-2 flex items-center justify-between text-xs font-mono select-none"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full border border-black bg-neutral-300" />
          <span className="w-2.5 h-2.5 rounded-full border border-black bg-neutral-300" />
          <span className="w-2.5 h-2.5 rounded-full border border-black bg-neutral-300" />
        </div>
        <div className="border border-black px-3 py-1 rounded bg-neutral-50 text-neutral-700 min-w-[280px]">
          {displayUrl}
        </div>
      </div>
      <div className="border border-black px-2.5 py-1 font-bold tracking-wider bg-white">
        {label}
      </div>
    </header>
  );
}
