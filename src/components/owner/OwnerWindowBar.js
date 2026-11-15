"use client";

import { usePathname } from "next/navigation";

export default function OwnerWindowBar() {
  const pathname = usePathname() || "/owner/produk";

  let title = "Produk";
  let subtitle = "Kelola nama, kategori, harga, dan stok barang.";

  if (pathname.startsWith("/owner/transaksi/")) {
    title = "Detail Transaksi Kasir";
    subtitle = "Riwayat penjualan dan rincian struk masing-masing kasir.";
  } else if (pathname.startsWith("/owner/transaksi")) {
    title = "Transaksi";
    subtitle = "Riwayat penjualan semua kasir.";
  } else if (pathname.startsWith("/owner/laporan")) {
    title = "Laporan";
    subtitle = "Omzet, produk terjual, dan produk masuk.";
  }

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header
      aria-label="Header Halaman Owner"
      className="w-full border-b border-[#E1E4E0] bg-white px-6 py-4 flex items-center justify-between gap-4"
    >
      <div>
        <h1 className="text-sm font-bold text-[#1F2A27] leading-tight">
          {title}
        </h1>
        <p className="text-xs text-[#6B7773] mt-0.5">{subtitle}</p>
      </div>
      <span className="hidden sm:inline-block text-xs text-[#6B7773]">
        {todayStr}
      </span>
    </header>
  );
}
