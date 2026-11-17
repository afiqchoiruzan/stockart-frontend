"use client";

import {
  formatRupiah,
  formatTanggalSingkat,
  getPaymentStatusBadge,
} from "@/lib/mockTransactions";

export default function TransactionDetailPanel({
  transaction,
  onPrintReceipt,
}) {
  if (!transaction) {
    return (
      <aside
        aria-label="Panel Detail Transaksi"
        className="bg-white border border-[#E1E4E0] rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[240px] text-[#6B7773]"
      >
        <strong className="text-sm font-semibold text-[#1F2A27]">
          Belum ada transaksi dipilih
        </strong>
        <p className="text-xs mt-1 max-w-xs">
          Pilih salah satu baris pada tabel untuk melihat rincian struk
          transaksi.
        </p>
      </aside>
    );
  }

  const displayInvoice = transaction.noInvoice.replace(/^#/, "");
  const metode = transaction.metodePembayaran || "Tunai";
  const statusBadge = getPaymentStatusBadge(transaction);
  const dibayar =
    transaction.uangBayar !== null && transaction.uangBayar !== undefined
      ? transaction.uangBayar
      : transaction.totalHarga;
  const kembali =
    transaction.kembalian !== null && transaction.kembalian !== undefined
      ? transaction.kembalian
      : 0;

  return (
    <aside
      id="printable-receipt"
      aria-label={`Detail Transaksi ${displayInvoice}`}
      className="bg-white border border-[#E1E4E0] rounded-lg overflow-hidden"
    >
      {/* Header Panel (Disembunyikan saat cetak) */}
      <div className="px-4 py-3 border-b border-[#E1E4E0] flex items-center justify-between gap-2 print:hidden">
        <h2 className="text-sm font-semibold text-[#1F2A27]">Struk</h2>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge.className}`}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* Isi Struk (Sesuai format Receipt Hi-Fi) */}
      <div className="p-4 text-xs">
        <div className="text-center">
          <h3 className="text-sm font-bold text-[#1F2A27]">
            Toko Kelontong Berkah
          </h3>
          <p className="text-[11px] text-[#6B7773]">
            Jl. Kaliurang Km 5, Yogyakarta
          </p>
        </div>

        <div className="border-t border-dashed border-[#E1E4E0] my-2.5" />

        {/* Metadata Transaksi */}
        <div className="space-y-1 text-[#1F2A27]">
          <div className="flex justify-between gap-2">
            <span className="text-[#6B7773]">Invoice</span>
            <span className="font-mono font-medium">{displayInvoice}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#6B7773]">Waktu</span>
            <span className="font-mono text-right">
              {formatTanggalSingkat(transaction.tanggal)}, {transaction.waktu}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#6B7773]">Kasir</span>
            <span className="text-right min-w-0 truncate">{transaction.namaKasir}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#6B7773]">Metode</span>
            <span>{metode}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-[#E1E4E0] my-2.5" />

        {/* Daftar Barang */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto print:max-h-none print:overflow-visible">
          {transaction.detailBarang?.map((item, idx) => (
            <div key={`${item.kodeProduk || idx}-${idx}`}>
              <div className="font-medium text-[#1F2A27]">
                {item.namaProduk}
              </div>
              <div className="flex justify-between gap-2 text-[#6B7773] font-mono">
                <span>
                  {item.jumlah} &times; {formatRupiah(item.hargaSatuan)}
                </span>
                <span className="text-[#1F2A27]">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-[#E1E4E0] my-2.5" />

        {/* Ringkasan Pembayaran */}
        <div className="space-y-1 font-mono">
          <div className="flex justify-between font-bold text-[13px] text-[#1F2A27] pt-0.5">
            <span>Total</span>
            <span>{formatRupiah(transaction.totalHarga)}</span>
          </div>
          <div className="flex justify-between text-[#6B7773]">
            <span>Dibayar</span>
            <span>{formatRupiah(dibayar)}</span>
          </div>
          <div className="flex justify-between text-[#6B7773]">
            <span>Kembali</span>
            <span>{formatRupiah(kembali)}</span>
          </div>
        </div>
      </div>

      {/* Tombol Cetak Struk (Disembunyikan saat cetak) */}
      <div className="px-4 py-3 border-t border-[#E1E4E0] print:hidden">
        <button
          type="button"
          onClick={() => onPrintReceipt && onPrintReceipt(transaction)}
          className="w-full min-h-11 lg:min-h-0 py-2 px-3 border border-[#E1E4E0] rounded-lg bg-white hover:bg-[#FAFBF9] text-[13px] font-semibold text-[#1F2A27] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 stroke-current"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>Cetak struk</span>
        </button>
      </div>
    </aside>
  );
}
