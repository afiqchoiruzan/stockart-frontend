"use client";

import Link from "next/link";
import {
  formatRupiah,
  formatTanggalSingkat,
  getTotalItemCount,
} from "@/lib/mockTransactions";

export default function TransactionTable({
  transactions = [],
  selectedTransactionId,
  onSelectTransaction,
  showKasirColumn = true,
  onResetFilter,
}) {
  if (transactions.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-black/50 rounded text-center flex flex-col items-center justify-center gap-3 bg-neutral-50">
        <p className="font-bold text-base text-black">
          Tidak ada riwayat transaksi yang cocok
        </p>
        <p className="text-xs text-neutral-600 max-w-sm">
          Coba ubah filter tanggal, status transaksi, kasir, atau kata kunci pencarian.
        </p>
        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="mt-1 px-4 py-2 min-h-[38px] border border-black rounded text-xs font-bold font-mono bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            [Reset Filter Transaksi]
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="border-2 border-black rounded overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-neutral-100 border-b-2 border-black font-bold text-black">
              <th className="py-3 px-3.5 border-r border-black/40 font-mono">
                ID Struk
              </th>
              <th className="py-3 px-3.5 border-r border-black/40">Waktu</th>
              {showKasirColumn && (
                <th className="py-3 px-3.5 border-r border-black/40">Kasir</th>
              )}
              <th className="py-3 px-3.5 border-r border-black/40">
                Ringkasan Barang
              </th>
              <th className="py-3 px-3.5 border-r border-black/40">Total</th>
              <th className="py-3 px-3.5 border-r border-black/40 text-center">
                Status
              </th>
              <th className="py-3 px-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/30">
            {transactions.map((trx) => {
              const isSelected = trx.id === selectedTransactionId;
              const isVoid = trx.status === "batal";
              const totalPcs = getTotalItemCount(trx.detailBarang);
              const firstItem = trx.detailBarang?.[0]?.namaProduk || "-";
              const extraCount = (trx.detailBarang?.length || 0) - 1;

              return (
                <tr
                  key={trx.id}
                  onClick={() => onSelectTransaction(trx)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-neutral-200 font-semibold"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  {/* ID Struk */}
                  <td className="py-3 px-3.5 border-r border-black/30 font-mono font-bold whitespace-nowrap">
                    <span className={isVoid ? "line-through text-neutral-500" : ""}>
                      {trx.noInvoice}
                    </span>
                    {isSelected && (
                      <span
                        className="ml-1.5 inline-block text-[10px] px-1 border border-black bg-white rounded"
                        aria-label="Sedang ditampilkan di panel detail"
                      >
                        &bull;
                      </span>
                    )}
                  </td>

                  {/* Waktu */}
                  <td className="py-3 px-3.5 border-r border-black/30 whitespace-nowrap">
                    <div className="font-mono font-bold text-black">
                      {trx.waktu} WIB
                    </div>
                    <div className="text-[11px] text-neutral-600">
                      {formatTanggalSingkat(trx.tanggal)}
                    </div>
                  </td>

                  {/* Kasir */}
                  {showKasirColumn && (
                    <td
                      className="py-3 px-3.5 border-r border-black/30 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/owner/transaksi/${trx.kasirId}`}
                        title={`Lihat semua transaksi ${trx.namaKasir}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-black hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded"
                      >
                        <span className="w-5 h-5 rounded-full border border-black bg-neutral-100 inline-flex items-center justify-center text-[10px] font-mono font-bold">
                          {trx.panggilanKasir.slice(0, 1)}
                        </span>
                        <span>{trx.panggilanKasir}</span>
                      </Link>
                    </td>
                  )}

                  {/* Ringkasan Barang */}
                  <td className="py-3 px-3.5 border-r border-black/30">
                    <div className="text-black font-medium truncate max-w-[180px] sm:max-w-[220px]">
                      {firstItem}
                      {extraCount > 0 && (
                        <span className="text-xs text-neutral-600 font-mono">
                          {" "}
                          (+{extraCount} lainnya)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-600 font-mono">
                      {trx.detailBarang?.length || 0} jenis &bull; {totalPcs} pcs &bull;{" "}
                      {trx.metodePembayaran}
                    </div>
                  </td>

                  {/* Total Harga */}
                  <td className="py-3 px-3.5 border-r border-black/30 font-mono font-bold whitespace-nowrap">
                    <span className={isVoid ? "line-through text-neutral-500" : "text-black"}>
                      {formatRupiah(trx.totalHarga)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3.5 border-r border-black/30 text-center whitespace-nowrap">
                    {isVoid ? (
                      <span className="inline-block px-2 py-0.5 border border-black rounded text-[11px] font-mono font-bold bg-neutral-200 text-neutral-700">
                        [BATAL]
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 border border-black rounded text-[11px] font-mono font-bold bg-white text-black">
                        [LUNAS]
                      </span>
                    )}
                  </td>

                  {/* Tombol Aksi */}
                  <td
                    className="py-3 px-3.5 text-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectTransaction(trx)}
                      className={`min-h-[32px] px-2.5 py-1 border border-black rounded text-xs font-mono font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                        isSelected
                          ? "bg-black text-white"
                          : "bg-white hover:bg-neutral-200 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      }`}
                    >
                      [Detail]
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

