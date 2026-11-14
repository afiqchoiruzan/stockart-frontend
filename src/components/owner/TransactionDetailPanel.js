"use client";

import Link from "next/link";
import {
  formatRupiah,
  formatTanggalSingkat,
  getTotalItemCount,
} from "@/lib/mockTransactions";

export default function TransactionDetailPanel({
  transaction,
  onPrintReceipt,
  showKasirLink = true,
}) {
  if (!transaction) {
    return (
      <aside
        aria-label="Panel Detail Transaksi"
        className="border-2 border-black rounded bg-neutral-50 p-6 flex flex-col items-center justify-center text-center min-h-[320px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="w-12 h-12 border-2 border-black rounded bg-white flex items-center justify-center font-mono font-bold text-xs mb-3">
          [STRUK]
        </div>
        <h3 className="font-bold text-sm text-black">
          Belum Ada Transaksi Dipilih
        </h3>
        <p className="text-xs text-neutral-600 mt-1 max-w-xs">
          Klik tombol <code className="font-mono font-bold">[Detail]</code> atau pilih salah satu baris pada tabel untuk melihat rincian struk transaksi.
        </p>
      </aside>
    );
  }

  const totalPcs = getTotalItemCount(transaction.detailBarang);

  return (
    <aside
      aria-label={`Detail Transaksi ${transaction.noInvoice}`}
      className="border-2 border-black rounded bg-neutral-50 p-4 flex flex-col gap-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
    >
      {/* Header Panel Detail */}
      <div className="pb-3 border-b-2 border-black flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-mono uppercase text-neutral-600 block">
            Toko Kelontong Berkah
          </span>
          <h3 className="font-bold text-base text-black font-mono">
            Struk {transaction.noInvoice}
          </h3>
        </div>
        <span className="px-2.5 py-1 border-2 border-black rounded text-xs font-mono font-bold bg-white text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          [&bull; LUNAS]
        </span>
      </div>

      {/* Info Kasir & Waktu */}
      <div className="p-3 border border-black rounded bg-white flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">Kasir Bertugas:</span>
          <div className="flex items-center gap-2">
            <strong className="text-black font-bold">
              {transaction.namaKasir} ({transaction.panggilanKasir})
            </strong>
            {showKasirLink && (
              <Link
                href={`/owner/transaksi/${transaction.kasirId}`}
                className="font-mono text-[11px] font-bold underline hover:text-neutral-700"
              >
                [Riwayat]
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">Waktu Transaksi:</span>
          <span className="font-mono font-semibold text-black">
            {formatTanggalSingkat(transaction.tanggal)} &bull; {transaction.waktu} WIB
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">Metode Pembayaran:</span>
          <span className="font-mono font-bold px-1.5 py-0.5 border border-black rounded bg-neutral-100 text-black">
            {transaction.metodePembayaran}
          </span>
        </div>
      </div>

      {/* Kotak Silang [X] PREVIEW STRUK sesuai Lo-Fi Wireframe */}
      <div
        className="relative w-full h-20 border-2 border-black rounded bg-white flex flex-col items-center justify-center overflow-hidden select-none"
        aria-hidden="true"
      >
        <svg
          className="absolute inset-0 w-full h-full stroke-black/35"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <line x1="0" y1="0" x2="100" y2="100" strokeWidth="1" />
          <line x1="0" y1="100" x2="100" y2="0" strokeWidth="1" />
        </svg>
        <span className="relative z-10 px-3 py-1 border border-black rounded bg-white text-xs font-mono font-bold tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          [PREVIEW STRUK {transaction.noInvoice}]
        </span>
      </div>

      {/* Daftar Item Barang pada Struk */}
      <div className="border-t-2 border-dashed border-black pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
          <span>Daftar Barang ({transaction.detailBarang?.length || 0} jenis)</span>
          <span className="font-mono">{totalPcs} pcs</span>
        </div>

        <div className="border border-black rounded bg-white divide-y divide-black/20">
          {transaction.detailBarang?.map((item, idx) => (
            <div
              key={`${item.kodeProduk}-${idx}`}
              className="p-2.5 flex items-start justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-bold text-black">
                  {item.jumlah} &times; {item.namaProduk}
                </div>
                <div className="text-[11px] font-mono text-neutral-600">
                  {item.kodeProduk} &bull; @ {formatRupiah(item.hargaSatuan)}
                </div>
              </div>
              <div className="font-mono font-bold text-black whitespace-nowrap">
                {formatRupiah(item.subtotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ringkasan Pembayaran (Total, Tunai/Bayar, Kembalian) */}
      <div className="border-t-2 border-black pt-3 flex flex-col gap-1.5 text-xs bg-white p-3 border rounded">
        <div className="flex items-center justify-between font-bold text-sm text-black pb-1.5 border-b border-black/20">
          <span>Total:</span>
          <span className="font-mono">
            {formatRupiah(transaction.totalHarga)}
          </span>
        </div>
        <div className="flex items-center justify-between text-neutral-700">
          <span>{transaction.metodePembayaran}:</span>
          <span className="font-mono font-semibold text-black">
            {formatRupiah(transaction.uangBayar)}
          </span>
        </div>
        <div className="flex items-center justify-between text-neutral-700">
          <span>Kembalian:</span>
          <span className="font-mono font-bold text-black">
            {formatRupiah(transaction.kembalian)}
          </span>
        </div>
      </div>

      {/* Aksi Owner: Cetak Struk */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => onPrintReceipt && onPrintReceipt(transaction)}
          className="w-full min-h-[42px] px-3 py-2 border-2 border-black rounded text-xs font-mono font-bold bg-white hover:bg-neutral-200 text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          [Cetak Struk]
        </button>
      </div>
    </aside>
  );
}
