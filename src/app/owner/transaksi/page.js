"use client";

import { useState, useMemo } from "react";
import {
  INITIAL_TRANSACTIONS,
  formatRupiah,
} from "@/lib/mockTransactions";
import CashierSummaryCards from "@/components/owner/CashierSummaryCards";
import TransactionToolbar from "@/components/owner/TransactionToolbar";
import TransactionTable from "@/components/owner/TransactionTable";
import TransactionDetailPanel from "@/components/owner/TransactionDetailPanel";

export default function OwnerTransaksiPage() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKasirId, setSelectedKasirId] = useState("semua");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [selectedTrxId, setSelectedTrxId] = useState(
    INITIAL_TRANSACTIONS[0]?.id || null
  );
  const [statusMessage, setStatusMessage] = useState("");

  // Ringkasan KPI seluruh transaksi
  const summaryStats = useMemo(() => {
    const selesaiList = transactions.filter((t) => t.status === "selesai");
    const batalList = transactions.filter((t) => t.status === "batal");
    const totalOmzet = selesaiList.reduce(
      (sum, t) => sum + Number(t.totalHarga || 0),
      0
    );
    return {
      totalStruk: transactions.length,
      totalSelesai: selesaiList.length,
      totalBatal: batalList.length,
      totalOmzet,
    };
  }, [transactions]);

  // Filter daftar transaksi berdasarkan pencarian, kasir, tanggal, dan status
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((trx) => {
      const matchKasir =
        selectedKasirId === "semua" || trx.kasirId === selectedKasirId;
      const matchDate = !selectedDate || trx.tanggal === selectedDate;
      const matchStatus =
        selectedStatus === "semua" || trx.status === selectedStatus;
      const matchQuery =
        q === "" ||
        trx.noInvoice.toLowerCase().includes(q) ||
        trx.namaKasir.toLowerCase().includes(q) ||
        trx.panggilanKasir.toLowerCase().includes(q) ||
        trx.detailBarang?.some(
          (item) =>
            item.namaProduk.toLowerCase().includes(q) ||
            item.kodeProduk.toLowerCase().includes(q)
        );
      return matchKasir && matchDate && matchStatus && matchQuery;
    });
  }, [
    transactions,
    searchQuery,
    selectedKasirId,
    selectedDate,
    selectedStatus,
  ]);

  // Transaksi aktif yang ditampilkan di panel kanan
  const activeTransaction = useMemo(() => {
    if (filteredTransactions.length === 0) return null;
    const found = filteredTransactions.find((t) => t.id === selectedTrxId);
    return found || filteredTransactions[0];
  }, [filteredTransactions, selectedTrxId]);

  const showTempMessage = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage("");
    }, 4500);
  };

  const handleVoidTransaction = (trxId, reason) => {
    const target = transactions.find((t) => t.id === trxId);
    setTransactions((prev) =>
      prev.map((item) =>
        item.id === trxId
          ? {
              ...item,
              status: "batal",
              dibatalkanPada: "12 Nov 2026, Baru Saja",
              dibatalkanOleh: "Owner (Pemilik)",
              alasanBatal: reason,
            }
          : item
      )
    );
    if (target) {
      showTempMessage(
        `Transaksi ${target.noInvoice} (${target.namaKasir}) berhasil dibatalkan (Void). Stok barang otomatis dikembalikan.`
      );
    }
  };

  const handlePrintReceipt = (trx) => {
    showTempMessage(
      `Simulasi Lo-Fi: Menyiapkan cetak / unduh PDF struk ${trx.noInvoice} (${trx.namaKasir}).`
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedKasirId("semua");
    setSelectedDate("");
    setSelectedStatus("semua");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header Section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Menu Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Riwayat &amp; Rincian Struk Transaksi Masing-Masing Kasir — Toko Kelontong &quot;Berkah&quot;
          </p>
        </div>

        {/* Ringkasan KPI Cepat */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="px-3 py-2 border-2 border-black rounded bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-neutral-600 block text-[10px] uppercase">
              Total Omzet Bersih
            </span>
            <span className="font-bold text-sm text-black">
              {formatRupiah(summaryStats.totalOmzet)}
            </span>
          </div>
          <div className="px-3 py-2 border-2 border-black rounded bg-neutral-100">
            <span className="text-neutral-600 block text-[10px] uppercase">
              Struk Selesai
            </span>
            <span className="font-bold text-sm text-black">
              {summaryStats.totalSelesai} Struk
            </span>
          </div>
          <div className="px-3 py-2 border-2 border-black rounded bg-white">
            <span className="text-neutral-600 block text-[10px] uppercase">
              Struk Batal (Void)
            </span>
            <span className="font-bold text-sm text-black">
              {summaryStats.totalBatal} Struk
            </span>
          </div>
        </div>
      </header>

      {/* Banner Status Notifikasi */}
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 border-2 border-black rounded bg-neutral-100 flex items-center justify-between gap-3 text-sm font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">[OK]</span>
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage("")}
            className="text-xs font-mono font-bold hover:underline shrink-0"
            aria-label="Tutup pesan status"
          >
            [Tutup]
          </button>
        </div>
      )}

      {/* Kartu Ringkasan Masing-Masing Kasir (Klik ke /owner/transaksi/[kasirId] atau Filter Tabel) */}
      <CashierSummaryCards
        transactions={transactions}
        selectedKasirId={selectedKasirId}
        onSelectKasir={setSelectedKasirId}
      />

      {/* Toolbar Pencarian & Filter */}
      <section aria-label="Filter dan Pencarian Transaksi" className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
          Daftar Riwayat &amp; Detail Struk Transaksi
        </h2>
        <TransactionToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedKasirId={selectedKasirId}
          onKasirChange={setSelectedKasirId}
          showKasirFilter={true}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          totalResults={filteredTransactions.length}
        />
      </section>

      {/* Split Layout: Tabel Riwayat di Kiri & Panel Detail Struk di Kanan (Sesuai Lo-Fi Wireframe 2B) */}
      <section
        aria-label="Tabel dan Rincian Struk Transaksi"
        className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
      >
        <div className="xl:col-span-7">
          <TransactionTable
            transactions={filteredTransactions}
            selectedTransactionId={activeTransaction?.id}
            onSelectTransaction={(trx) => setSelectedTrxId(trx.id)}
            showKasirColumn={true}
            onResetFilter={handleResetFilters}
          />
        </div>

        <div className="xl:col-span-5 xl:sticky xl:top-6">
          <TransactionDetailPanel
            key={activeTransaction?.id || "empty"}
            transaction={activeTransaction}
            onVoidTransaction={handleVoidTransaction}
            onPrintReceipt={handlePrintReceipt}
            showKasirLink={true}
          />
        </div>
      </section>
    </div>
  );
}
