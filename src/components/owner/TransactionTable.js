"use client";

import {
  formatRupiah,
  formatTanggalSingkat,
  getPaymentStatusBadge,
  getTotalItemCount,
  isTransactionPaid,
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
      <div className="bg-white border border-[#E1E4E0] rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-2 text-[#6B7773]">
        <svg
          aria-hidden="true"
          className="w-6 h-6 stroke-current"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 17.5v-11" />
        </svg>
        <strong className="text-[#1F2A27] font-semibold text-sm">
          Belum ada transaksi
        </strong>
        <p className="text-xs max-w-sm">
          Tidak ada riwayat transaksi yang cocok dengan filter saat ini.
        </p>
        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="mt-2 min-h-11 lg:min-h-[36px] px-3.5 border border-[#E1E4E0] rounded-md bg-white hover:bg-[#F5F6F4] text-xs font-semibold text-[#1F2A27] transition-colors cursor-pointer"
          >
            Reset filter
          </button>
        )}
      </div>
    );
  }

  const totalSum = transactions.reduce(
    (sum, t) => sum + (isTransactionPaid(t) ? Number(t.totalHarga || 0) : 0),
    0
  );

  return (
    <div className="min-w-0 bg-white border border-[#E1E4E0] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-[#FAFBF9] border-b border-[#E1E4E0] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
              <th className="py-2.5 px-3 sm:px-3.5 whitespace-nowrap">Invoice</th>
              <th className="py-2.5 px-3 sm:px-3.5 whitespace-nowrap hidden sm:table-cell">Waktu</th>
              {showKasirColumn && (
                <th className="py-2.5 px-3 sm:px-3.5 whitespace-nowrap hidden sm:table-cell">Kasir</th>
              )}
              <th className="py-2.5 px-3.5 hidden 2xl:table-cell">
                Ringkasan Barang
              </th>
              <th className="py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap">
                Metode
              </th>
              <th className="py-2.5 px-3 sm:px-3.5 text-right whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF0EC]">
            {transactions.map((trx) => {
              const isSelected = trx.id === selectedTransactionId;
              const totalPcs = getTotalItemCount(trx.detailBarang);
              const firstItem = trx.detailBarang?.[0]?.namaProduk || "-";
              const extraCount = (trx.detailBarang?.length || 0) - 1;
              const metode = trx.metodePembayaran || "Tunai";
              const isPaid = isTransactionPaid(trx);
              const statusBadge = getPaymentStatusBadge(trx);

              return (
                <tr
                  key={trx.id}
                  onClick={() => onSelectTransaction(trx)}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-[#E6F0ED]" : "hover:bg-[#FAFBF9]"
                    }`}
                >
                  {/* Invoice */}
                  <td
                    className={`py-2.5 px-3 sm:px-3.5 font-mono font-semibold whitespace-nowrap text-[#1F2A27] ${isSelected ? "border-l-[3px] border-l-[#2F6F5E]" : ""
                      }`}
                  >
                    {trx.noInvoice.replace(/^#/, "")}
                    {/* Waktu ditampilkan di bawah invoice pada layar kecil */}
                    <div className="sm:hidden text-[11px] font-normal text-[#6B7773]">
                      {formatTanggalSingkat(trx.tanggal)}, {trx.waktu}
                    </div>
                    {showKasirColumn && (
                      <div className="sm:hidden max-w-[180px] truncate font-sans text-xs font-medium text-[#1F2A27]">
                        {trx.namaKasir}
                      </div>
                    )}
                  </td>

                  {/* Waktu */}
                  <td className="py-2.5 px-3 sm:px-3.5 whitespace-nowrap font-mono hidden sm:table-cell">
                    <div className="text-[#1F2A27]">{trx.waktu}</div>
                    <div className="text-[11px] text-[#6B7773]">
                      {formatTanggalSingkat(trx.tanggal)}
                    </div>
                  </td>

                  {/* Kasir */}
                  {showKasirColumn && (
                    <td className="hidden sm:table-cell py-2.5 px-3 sm:px-3.5 text-[#1F2A27] font-medium max-w-[160px] truncate">
                      {trx.namaKasir}
                    </td>
                  )}

                  {/* Ringkasan Barang */}
                  <td className="py-2.5 px-3.5 hidden 2xl:table-cell">
                    <div className="text-[#1F2A27] truncate max-w-[200px]">
                      {firstItem}
                      {extraCount > 0 && (
                        <span className="text-xs text-[#6B7773]">
                          {" "}
                          (+{extraCount} lainnya)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#6B7773]">
                      {totalPcs} item terjual
                    </div>
                  </td>

                  {/* Metode */}
                  <td className="py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${metode === "QRIS"
                          ? "bg-[#E8F0F6] text-[#4A7FA7]"
                          : "bg-[#E6F2EC] text-[#3E8E6A]"
                        }`}
                    >
                      {metode}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="py-2.5 px-3 sm:px-3.5 text-right font-mono font-semibold whitespace-nowrap text-[#1F2A27]">
                    <span className={!isPaid ? "line-through text-[#6B7773]" : ""}>
                      {formatRupiah(trx.totalHarga)}
                    </span>
                    {!isPaid && (
                      <div className="font-sans text-[10px] font-semibold text-[#C4574F]">
                        {statusBadge.label}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Tabel */}
      <div className="px-3 sm:px-3.5 py-2.5 border-t border-[#E1E4E0] bg-[#FAFBF9] flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-[#6B7773]">
        <span>{transactions.length} transaksi</span>
        <span className="font-mono">
          Total:{" "}
          <strong className="text-[#1F2A27]">{formatRupiah(totalSum)}</strong>
        </span>
      </div>
    </div>
  );
}
