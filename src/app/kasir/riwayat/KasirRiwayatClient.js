"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  formatRupiah,
  formatTanggalSingkat,
  normalizeTransaction,
  toDateKey,
} from "@/lib/mockTransactions";
import { apiGetTransactions } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function KasirRiwayatClient() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [todayLabel, setTodayLabel] = useState("-");
  const [loading, setLoading] = useState(true);
  const [isFromBackend, setIsFromBackend] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch transaksi milik kasir yang sedang login dari backend
  const userId = user?._id;
  const loadTransactions = useCallback(() => {
    if (!userId) return Promise.resolve();
    return apiGetTransactions({ kasir: userId })
      .then((res) => {
        setErrorMsg("");
        setTodayLabel(formatTanggalSingkat(toDateKey(new Date())));
        // Backend sudah mengurutkan terbaru lebih dulu
        const normalized = (res?.data || []).map(normalizeTransaction);
        setTransactions(normalized);
        setIsFromBackend(true);
        setSelectedTransaction((prev) => {
          if (prev) {
            const same = normalized.find((t) => t.id === prev.id);
            if (same) return same;
          }
          return normalized[0] || null;
        });
      })
      .catch((err) => {
        setErrorMsg(err.message || "Gagal mengambil riwayat transaksi dari server.");
        setIsFromBackend(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const refreshTransactions = () => {
    setLoading(true);
    loadTransactions();
  };

  const sortedTransactions = transactions;

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Menu Riwayat Transaksi &amp; Cetak Invoice
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {isFromBackend
              ? `● Data dari server backend • ${transactions.length} transaksi`
              : loading
              ? "Memuat data dari server..."
              : "○ Tidak terhubung ke backend"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshTransactions}
            disabled={loading}
            className="px-3 py-1.5 border-2 border-black rounded text-xs font-bold bg-white hover:bg-neutral-100 disabled:opacity-50"
            title="Refresh riwayat transaksi"
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>
          <div className="border-2 border-black rounded px-3 py-1.5 text-xs font-bold bg-neutral-100 select-none">
            Tanggal: [{todayLabel}]
          </div>
        </div>
      </header>

      {errorMsg && (
        <div
          role="alert"
          className="p-3 border-2 border-black rounded bg-red-50 text-xs font-medium text-red-800 flex items-center justify-between"
        >
          <span>[!] {errorMsg}</span>
          <button
            type="button"
            onClick={refreshTransactions}
            className="text-xs font-bold underline"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Transaction Table */}
        <div className="flex-1">
          <div className="border-2 border-black rounded overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {/* Table Header */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black bg-neutral-50">
                  <th className="text-left px-4 py-3 font-bold">Invoice</th>
                  <th className="text-left px-4 py-3 font-bold">Waktu</th>
                  <th className="text-left px-4 py-3 font-bold">Total</th>
                  <th className="text-left px-4 py-3 font-bold">Struk</th>
                </tr>
              </thead>
              <tbody>
                {loading && sortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-neutral-500">
                      Memuat data transaksi...
                    </td>
                  </tr>
                ) : sortedTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-8 text-center text-neutral-500"
                    >
                      Belum ada riwayat transaksi
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((trx) => (
                    <tr
                      key={trx.id}
                      className={`border-b border-black/20 cursor-pointer transition-colors ${
                        selectedTransaction?.id === trx.id
                          ? "bg-neutral-200"
                          : "hover:bg-neutral-50"
                      }`}
                      onClick={() => setSelectedTransaction(trx)}
                    >
                      <td className="px-4 py-3 font-bold font-mono">
                        {trx.noInvoice}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div>{trx.waktu}</div>
                        <div className="text-[11px] text-neutral-500">
                          {formatTanggalSingkat(trx.tanggal)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className={trx.status === "batal" ? "line-through text-neutral-500" : ""}>
                          {formatRupiah(trx.totalHarga)}
                        </span>
                        {trx.status === "batal" && (
                          <span className="ml-1.5 text-[10px] font-bold border border-black rounded px-1 bg-neutral-200">
                            BATAL
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(trx);
                          }}
                          className="px-2 py-1 border border-black rounded text-xs font-bold bg-white hover:bg-neutral-200 transition-colors"
                        >
                          [Invoice]
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Invoice Preview */}
        <div className="w-full lg:w-96 xl:w-[420px] shrink-0">
          <div className="border-2 border-black rounded bg-white sticky top-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {selectedTransaction ? (
              <div className="p-6">
                {/* Invoice Header */}
                <div className="text-center pb-4 border-b border-dashed border-black">
                  <p className="font-bold text-lg">
                    INVOICE {selectedTransaction.noInvoice}
                  </p>
                  <p className="text-sm text-neutral-600">
                    Toko Kelontong Berkah
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Kasir: {selectedTransaction.namaKasir} |{" "}
                    {formatTanggalSingkat(selectedTransaction.tanggal)} —{" "}
                    {selectedTransaction.waktu}
                  </p>
                  {selectedTransaction.status === "batal" && (
                    <p className="mt-2 inline-block text-xs font-bold border-2 border-black rounded px-2 py-0.5 bg-neutral-200">
                      TRANSAKSI DIBATALKAN (VOID)
                    </p>
                  )}
                </div>

                {/* Separator Line */}
                <div className="border-b border-dashed border-neutral-400 my-3" />

                {/* Invoice Items */}
                <div className="space-y-2 py-2 max-h-56 overflow-y-auto">
                  {selectedTransaction.detailBarang.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.jumlah}x {item.namaProduk}
                      </span>
                      <span className="font-mono">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Separator Line */}
                <div className="border-b border-dashed border-neutral-400 my-3" />

                {/* Totals */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-base">
                    <span>TOTAL</span>
                    <span className="text-red-600">
                      {formatRupiah(selectedTransaction.totalHarga)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-neutral-600">
                    <span>
                      Bayar:{" "}
                      {selectedTransaction.uangBayar !== null
                        ? formatRupiah(selectedTransaction.uangBayar)
                        : "-"}
                    </span>
                    <span>
                      Kembali:{" "}
                      {selectedTransaction.kembalian !== null
                        ? formatRupiah(selectedTransaction.kembalian)
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* Print Button */}
                <div className="mt-6 pt-4 border-t border-black">
                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    className="w-full min-h-[48px] px-4 py-3 border-2 border-black rounded text-sm font-bold bg-white hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
                      />
                    </svg>
                    Print Invoice
                  </button>
                  <Link
                    href={`/kasir/transaksi/invoice/${selectedTransaction.id}`}
                    className="mt-2 w-full min-h-[40px] px-4 py-2 border border-black rounded text-xs font-mono font-bold bg-neutral-50 hover:bg-neutral-200 transition-colors flex items-center justify-center"
                  >
                    [Buka Halaman Invoice]
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-sm text-neutral-500">
                  Pilih transaksi dari tabel untuk melihat invoice
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
