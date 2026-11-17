"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import TransactionTable from "@/components/owner/TransactionTable";
import {
  formatRupiah,
  formatTanggalSingkat,
  getPaymentStatusBadge,
  matchesTransactionStatusFilter,
  normalizeTransaction,
  TRANSACTION_STATUS_OPTIONS,
} from "@/lib/mockTransactions";
import { apiGetTransactions } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function getTodayWibDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export default function KasirRiwayatClient() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const todayWib = useMemo(() => getTodayWibDate(), []);

  // Fetch transaksi hari ini milik kasir yang sedang login dari backend
  const userId = user?._id;
  const loadTransactions = useCallback(() => {
    if (!userId) return Promise.resolve();
    return apiGetTransactions({ kasir: userId, tanggal: todayWib })
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
  }, [userId, todayWib]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const refreshTransactions = () => {
    setLoading(true);
    loadTransactions();
  };

  // Filter transaksi (hanya transaksi hari ini)
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchDate = t.tanggal === todayWib;
      const metode = t.metodePembayaran || "Tunai";
      const matchMethod =
        selectedMethod === "ALL" ||
        metode.toLowerCase() === selectedMethod.toLowerCase();
      const matchStatus = matchesTransactionStatusFilter(t, selectedStatus);
      const matchQ =
        q === "" ||
        t.noInvoice.toLowerCase().includes(q) ||
        t.detailBarang.some((it) =>
          it.namaProduk.toLowerCase().includes(q)
        );
      return matchDate && matchMethod && matchStatus && matchQ;
    });
  }, [transactions, searchQuery, selectedMethod, selectedStatus, todayWib]);

  const activeSelection =
    filteredTransactions.find((t) => t.id === selectedTransaction?.id) ||
    filteredTransactions[0] ||
    null;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedMethod("ALL");
    setSelectedStatus("semua");
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      {errorMsg && (
        <div
          role="alert"
          className="px-3 sm:px-4 py-3 border border-[#EBC5C1] rounded-lg bg-[#F8E8E6] text-xs font-medium text-[#C4574F] flex items-center justify-between gap-3"
        >
          <span className="min-w-0">{errorMsg}</span>
          <button
            type="button"
            onClick={refreshTransactions}
            className="shrink-0 inline-flex items-center min-h-11 -my-3 lg:min-h-0 lg:my-0 text-xs font-semibold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
        <div className="relative basis-full sm:basis-auto sm:flex-1 min-w-[180px]">
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
            className="w-full h-11 lg:h-9 pl-9 pr-3 border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] bg-white placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 transition-all"
          />
        </div>

        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="flex-1 sm:flex-none min-w-0 max-w-full h-11 lg:h-9 px-2.5 border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] bg-white focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer lg:shrink-0"
        >
          <option value="ALL">Semua metode</option>
          <option value="Tunai">Tunai</option>
          <option value="QRIS">QRIS</option>
        </select>

        <select
          aria-label="Filter status transaksi"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="flex-1 sm:flex-none min-w-0 max-w-full h-11 lg:h-9 px-2.5 border border-[#E1E4E0] rounded-lg text-[13px] font-medium text-[#1F2A27] bg-white focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 cursor-pointer lg:shrink-0"
        >
          {TRANSACTION_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <span className="inline-flex items-center h-11 lg:h-9 px-3 rounded-lg border border-[#E1E4E0] bg-[#FAFBF9] text-[13px] font-medium text-[#6B7773] shrink-0">
          Hari ini: {formatTanggalSingkat(todayWib)}
        </span>
      </div>

      {/* Split Layout: Table + Receipt Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        {/* Left: Transaction Table (disamakan dengan Owner, tanpa kolom Kasir) */}
        {loading && transactions.length === 0 ? (
          <div className="min-w-0 bg-white border border-[#E1E4E0] rounded-lg px-4 py-10 text-center text-[13px] text-[#6B7773]">
            Memuat data transaksi…
          </div>
        ) : (
          <TransactionTable
            transactions={filteredTransactions}
            selectedTransactionId={activeSelection?.id}
            onSelectTransaction={setSelectedTransaction}
            showKasirColumn={false}
            onResetFilter={handleResetFilters}
          />
        )}

        {/* Right: Receipt Detail Panel */}
        <div
          id="printable-receipt"
          className="min-w-0 bg-white border border-[#E1E4E0] rounded-lg lg:sticky lg:top-4 overflow-hidden"
        >
          {activeSelection ? (
            <>
              <div className="px-4 py-3 border-b border-[#E1E4E0] flex items-center justify-between print:hidden">
                <h3 className="text-sm font-semibold text-[#1F2A27]">Struk</h3>
                {(() => {
                  const badge = getPaymentStatusBadge(activeSelection);
                  return (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  );
                })()}
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
                      <div className="flex justify-between gap-2 text-[#6B7773] font-mono">
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
                  className="w-full min-h-11 lg:min-h-0 py-2 px-3 border border-[#E1E4E0] rounded-lg text-[13px] font-semibold text-[#1F2A27] bg-white hover:bg-[#FAFBF9] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
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
                  className="w-full min-h-11 lg:min-h-0 inline-flex items-center justify-center py-1.5 px-3 text-center text-xs font-medium text-[#2F6F5E] hover:underline"
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
