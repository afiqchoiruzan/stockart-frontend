"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  formatRupiah,
  formatTanggalSingkat,
  normalizeTransaction,
} from "@/lib/mockTransactions";
import { apiGetTransactions } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function KasirRiwayatClient() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch transaksi milik kasir yang sedang login dari backend
  const userId = user?._id;
  const loadTransactions = useCallback(() => {
    if (!userId) return Promise.resolve();
    return apiGetTransactions({ kasir: userId })
      .then((res) => {
        setErrorMsg("");
        const normalized = (res?.data || []).map(normalizeTransaction);
        setTransactions(normalized);
        setSelectedTransaction((prev) => {
          if (prev) {
            const same = normalized.find((t) => t.id === prev.id);
            if (same) return same;
          }
          return normalized[0] || null;
        });
      })
      .catch((err) => {
        setErrorMsg(
          err.message || "Gagal mengambil riwayat transaksi dari server."
        );
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

  // Daftar tanggal unik
  const availableDates = useMemo(() => {
    const dates = Array.from(
      new Set(transactions.map((t) => t.tanggal).filter(Boolean))
    );
    return dates.sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Filter transaksi
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchDate = selectedDate === "ALL" || t.tanggal === selectedDate;
      const metode = t.metodePembayaran || "Tunai";
      const matchMethod =
        selectedMethod === "ALL" ||
        metode.toLowerCase() === selectedMethod.toLowerCase();
      const matchQ =
        q === "" ||
        t.noInvoice.toLowerCase().includes(q) ||
        t.detailBarang.some((it) =>
          it.namaProduk.toLowerCase().includes(q)
        );
      return matchDate && matchMethod && matchQ;
    });
  }, [transactions, searchQuery, selectedMethod, selectedDate]);

  const totalNilai = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, t) => sum + (t.status === "batal" ? 0 : Number(t.totalHarga || 0)),
      0
    );
  }, [filteredTransactions]);

  const activeSelection =
    filteredTransactions.find((t) => t.id === selectedTransaction?.id) ||
    filteredTransactions[0] ||
    null;

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      {errorMsg && (
        <div
          role="alert"
          className="px-4 py-3 border border-[#EBC5C1] rounded-lg bg-[#F8E8E6] text-xs font-medium text-[#C4574F] flex items-center justify-between"
        >
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={refreshTransactions}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Search & Date Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-[240px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7773] pointer-events-none">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Cari nomor invoice atau nama barang…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] bg-white placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 transition-all"
          />
        </div>

        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="h-9 px-3 border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] bg-white focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer"
        >
          <option value="ALL">Semua metode</option>
          <option value="Tunai">Tunai</option>
          <option value="QRIS">QRIS</option>
        </select>

        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="h-9 px-3 border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] bg-white focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer"
        >
          <option value="ALL">Semua tanggal</option>
          {availableDates.map((d) => (
            <option key={d} value={d}>
              {formatTanggalSingkat(d)}
            </option>
          ))}
        </select>
      </div>

      {/* Split Layout: Table + Receipt Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
        {/* Left: Transaction Table */}
        <div className="bg-white border border-[#E1E4E0] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#FAFBF9] border-b border-[#E1E4E0]">
                  <th className="text-left px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
                    Invoice
                  </th>
                  <th className="text-left px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
                    Waktu
                  </th>
                  <th className="text-left px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
                    Metode
                  </th>
                  <th className="text-right px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0EC]">
                {loading && filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-[#6B7773]"
                    >
                      Memuat data transaksi…
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-[#6B7773]"
                    >
                      Belum ada transaksi.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((trx) => {
                    const isSelected = activeSelection?.id === trx.id;
                    const itemCount = trx.detailBarang.reduce(
                      (s, i) => s + Number(i.jumlah || 0),
                      0
                    );
                    const metode = trx.metodePembayaran || "Tunai";

                    return (
                      <tr
                        key={trx.id}
                        onClick={() => setSelectedTransaction(trx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#E6F0ED]"
                            : "hover:bg-[#FAFBF9]"
                        }`}
                      >
                        <td
                          className={`px-3.5 py-2.5 ${
                            isSelected
                              ? "border-l-[3px] border-l-[#2F6F5E]"
                              : ""
                          }`}
                        >
                          <div className="font-mono font-semibold text-[#1F2A27]">
                            {trx.noInvoice}
                          </div>
                          <div className="text-[11px] text-[#6B7773]">
                            {itemCount} item
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#6B7773]">
                          {formatTanggalSingkat(trx.tanggal)}, {trx.waktu}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              metode === "QRIS"
                                ? "bg-[#E8F0F6] text-[#4A7FA7]"
                                : "bg-[#E6F2EC] text-[#3E8E6A]"
                            }`}
                          >
                            {metode}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-[#1F2A27]">
                          <span
                            className={
                              trx.status === "batal"
                                ? "line-through text-[#6B7773]"
                                : ""
                            }
                          >
                            {formatRupiah(trx.totalHarga)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="px-3.5 py-2.5 border-t border-[#E1E4E0] bg-[#FAFBF9] flex items-center justify-between text-xs text-[#6B7773]">
            <span>{filteredTransactions.length} transaksi</span>
            <span className="font-mono">
              Total:{" "}
              <strong className="text-[#1F2A27]">
                {formatRupiah(totalNilai)}
              </strong>
            </span>
          </div>
        </div>

        {/* Right: Receipt Detail Panel */}
        <div
          id="printable-receipt"
          className="bg-white border border-[#E1E4E0] rounded-lg lg:sticky lg:top-4 overflow-hidden"
        >
          {activeSelection ? (
            <>
              <div className="px-4 py-3 border-b border-[#E1E4E0] flex items-center justify-between print:hidden">
                <h3 className="text-sm font-semibold text-[#1F2A27]">Struk</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F2EC] text-[#3E8E6A]">
                  Lunas
                </span>
              </div>

              <div className="p-4 text-xs">
                <div className="text-center">
                  <h4 className="text-sm font-bold text-[#1F2A27]">
                    Toko Kelontong Berkah
                  </h4>
                  <p className="text-[11px] text-[#6B7773]">
                    Jl. Kaliurang Km 5, Yogyakarta
                  </p>
                </div>

                <div className="border-t border-dashed border-[#E1E4E0] my-2.5" />

                <div className="space-y-1 text-[#1F2A27]">
                  <div className="flex justify-between">
                    <span className="text-[#6B7773]">Invoice</span>
                    <span className="font-mono font-medium">
                      {activeSelection.noInvoice}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7773]">Waktu</span>
                    <span className="font-mono">
                      {formatTanggalSingkat(activeSelection.tanggal)},{" "}
                      {activeSelection.waktu}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7773]">Kasir</span>
                    <span>{activeSelection.namaKasir}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7773]">Metode</span>
                    <span>{activeSelection.metodePembayaran || "Tunai"}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-[#E1E4E0] my-2.5" />

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {activeSelection.detailBarang.map((item, idx) => (
                    <div key={idx}>
                      <div className="font-medium text-[#1F2A27]">
                        {item.namaProduk}
                      </div>
                      <div className="flex justify-between text-[#6B7773] font-mono">
                        <span>
                          {item.jumlah} × {formatRupiah(item.hargaSatuan)}
                        </span>
                        <span className="text-[#1F2A27]">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-[#E1E4E0] my-2.5" />

                <div className="space-y-1 font-mono">
                  <div className="flex justify-between font-bold text-[13px] text-[#1F2A27] pt-0.5">
                    <span>Total</span>
                    <span>{formatRupiah(activeSelection.totalHarga)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7773]">
                    <span>Dibayar</span>
                    <span>
                      {activeSelection.uangBayar !== null
                        ? formatRupiah(activeSelection.uangBayar)
                        : formatRupiah(activeSelection.totalHarga)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6B7773]">
                    <span>Kembali</span>
                    <span>
                      {activeSelection.kembalian !== null
                        ? formatRupiah(activeSelection.kembalian)
                        : formatRupiah(0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-[#E1E4E0] flex flex-col gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2 px-3 border border-[#E1E4E0] rounded-lg text-[13px] font-semibold text-[#1F2A27] bg-white hover:bg-[#FAFBF9] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Cetak ulang struk
                </button>
                <Link
                  href={`/kasir/transaksi/invoice/${activeSelection.id}`}
                  className="w-full py-1.5 px-3 text-center text-xs font-medium text-[#2F6F5E] hover:underline"
                >
                  Buka halaman struk penuh →
                </Link>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#6B7773]">
              Pilih transaksi untuk melihat struk.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
