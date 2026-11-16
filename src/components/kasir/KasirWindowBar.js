"use client";

import { usePathname } from "next/navigation";

export default function KasirWindowBar() {
  const pathname = usePathname() || "/kasir/transaksi";

  let title = "Transaksi";
  let subtitle = "Pilih barang, terima pembayaran, cetak struk.";
  const isPos = pathname === "/kasir/transaksi";

  if (pathname.startsWith("/kasir/produk")) {
    title = "Produk";
    subtitle = "Cek harga dan sisa stok.";
  } else if (
    pathname.startsWith("/kasir/riwayat") ||
    pathname.startsWith("/kasir/transaksi/invoice")
  ) {
    title = "Riwayat Transaksi";
    subtitle = "Penjualan yang kamu catat.";
  }

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header
      aria-label="Header Halaman Kasir"
      className="w-full border-b border-[#E1E4E0] bg-white px-4 sm:px-5 lg:px-6 py-3 sm:py-4 flex items-center justify-between gap-4"
    >
      <div className="min-w-0">
        <h1 className="text-base lg:text-sm font-bold text-[#1F2A27] leading-tight">
          {title}
        </h1>
        <p className="text-xs text-[#6B7773] mt-0.5">{subtitle}</p>
      </div>

      {isPos ? (
        <div className="hidden lg:flex shrink-0 items-center gap-4 text-xs text-[#6B7773]">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[11px] font-medium bg-white border border-[#E1E4E0] border-b-2 rounded">
              F2
            </kbd>
            Cari barang
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[11px] font-medium bg-white border border-[#E1E4E0] border-b-2 rounded">
              F4
            </kbd>
            Uang pas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[11px] font-medium bg-white border border-[#E1E4E0] border-b-2 rounded">
              F9
            </kbd>
            Bayar
          </span>
        </div>
      ) : (
        <span className="hidden sm:inline-block shrink-0 text-xs text-[#6B7773] text-right">
          {todayStr}
        </span>
      )}
    </header>
  );
}
