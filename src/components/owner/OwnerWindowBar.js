"use client";

import { usePathname } from "next/navigation";

export default function OwnerWindowBar() {
  const pathname = usePathname() || "/owner/produk";

  let urlPath = "https://stockart.pages.dev/owner/products";
  let screenTag = "2A. OWNER — PRODUK";

  if (pathname.startsWith("/owner/transaksi/")) {
    const kasirSlug = pathname.replace("/owner/transaksi/", "");
    urlPath = `https://stockart.pages.dev/owner/transactions/${kasirSlug}`;
    screenTag = "2B. OWNER — TRANSAKSI KASIR";
  } else if (pathname.startsWith("/owner/transaksi")) {
    urlPath = "https://stockart.pages.dev/owner/transactions";
    screenTag = "2B. OWNER — TRANSAKSI";
  } else if (pathname.startsWith("/owner/laporan")) {
    urlPath = "https://stockart.pages.dev/owner/reports";
    screenTag = "2C. OWNER — LAPORAN";
  }

  return (
    <header
      aria-label="Mock Window Bar"
      className="w-full border-b-2 border-black bg-white px-4 py-2 flex items-center justify-between text-xs font-mono select-none"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="w-3 h-3 rounded-full border border-black inline-block bg-white" />
          <span className="w-3 h-3 rounded-full border border-black inline-block bg-white" />
          <span className="w-3 h-3 rounded-full border border-black inline-block bg-white" />
        </div>
        <div className="border border-black px-3 py-1 rounded bg-neutral-50 text-neutral-700 min-w-[280px] truncate">
          {urlPath}
        </div>
      </div>
      <div className="border border-black px-2.5 py-1 font-bold tracking-wider bg-white">
        {screenTag}
      </div>
    </header>
  );
}

