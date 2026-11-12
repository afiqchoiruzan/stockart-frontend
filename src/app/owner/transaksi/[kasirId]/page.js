"use client";

import { use, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  CASHIERS,
  INITIAL_TRANSACTIONS,
  getCashierById,
  formatRupiah,
  getTotalItemCount,
} from "@/lib/mockTransactions";
import TransactionToolbar from "@/components/owner/TransactionToolbar";
import TransactionTable from "@/components/owner/TransactionTable";
import TransactionDetailPanel from "@/components/owner/TransactionDetailPanel";

function KasirDetailView({ kasirId }) {
  const kasir = getCashierById(kasirId);

  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [selectedTrxId, setSelectedTrxId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Semua transaksi milik kasir ini
  const kasirTransactions = useMemo(() => {
    return transactions.filter((t) => t.kasirId === kasirId);
  }, [transactions, kasirId]);

  // Statistik performa kasir
  const kasirStats = useMemo(() => {
    const selesai = kasirTransactions.filter((t) => t.status === "selesai");
    const batal = kasirTransactions.filter((t) => t.status === "batal");
    const totalOmzet = selesai.reduce(
      (sum, t) => sum + Number(t.totalHarga || 0),
      0
    );
    const totalItemTerjual = selesai.reduce(
      (sum, t) => sum + getTotalItemCount(t.detailBarang),
      0
    );
    const rataRataStruk =
      selesai.length > 0 ? Math.round(totalOmzet / selesai.length) : 0;

    return {
      totalStruk: kasirTransactions.length,
      totalSelesai: selesai.length,
      totalBatal: batal.length,
      totalOmzet,
      totalItemTerjual,
      rataRataStruk,
    };
  }, [kasirTransactions]);

  // Filter berdasarkan kata kunci, tanggal, dan status
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kasirTransactions.filter((trx) => {
      const matchDate = !selectedDate || trx.tanggal === selectedDate;
      const matchStatus =
        selectedStatus === "semua" || trx.status === selectedStatus;
      const matchQuery =
        q === "" ||
        trx.noInvoice.toLowerCase().includes(q) ||
        trx.detailBarang?.some(
          (item) =>
            item.namaProduk.toLowerCase().includes(q) ||
            item.kodeProduk.toLowerCase().includes(q)
        );
      return matchDate && matchStatus && matchQuery;
    });
  }, [kasirTransactions, searchQuery, selectedDate, selectedStatus]);

  // Transaksi yang ditampilkan di panel detail
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
        `Struk ${target.noInvoice} milik ${target.namaKasir} berhasil dibatalkan (Void).`
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
    setSelectedDate("");
    setSelectedStatus("semua");
  };

  // Jika ID Kasir tidak ditemukan
  if (!kasir) {
    return (
      <div className="max-w-3xl mx-auto p-8 border-2 border-black rounded bg-neutral-50 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-black bg-white flex items-center justify-center font-mono font-bold">
          !
        </div>
        <h1 className="text-xl font-bold text-black">
          Data Kasir Tidak Ditemukan
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600">
          Kasir dengan ID <code className="font-mono font-bold">{kasirId}</code>{" "}
          tidak terdaftar pada sistem StockArt POS.
        </p>
        <Link
          href="/owner/transaksi"
          className="px-4 py-2 border-2 border-black rounded text-xs font-mono font-bold bg-white hover:bg-neutral-200 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          [&larr; Kembali ke Menu Transaksi]
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Navigasi Atas: Tombol Kembali & Tab Pindah Kasir */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b-2 border-black">
        <Link
          href="/owner/transaksi"
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] border-2 border-black rounded text-xs font-mono font-bold bg-white hover:bg-neutral-200 text-black w-fit shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <span>&larr;</span>
          <span>Kembali ke Semua Transaksi</span>
        </Link>

        {/* Tab Pindah Cepat Antar Kasir */}
        <div className="flex flex-wrap items-center gap-2" aria-label="Pindah Kasir">
          <span className="text-xs font-bold text-neutral-600 mr-1">
            Pilih Kasir:
          </span>
          {CASHIERS.map((k) => {
            const isActive = k.id === kasir.id;
            return (
              <Link
                key={k.id}
                href={`/owner/transaksi/${k.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`px-3 py-1.5 min-h-[36px] border rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "border-2 border-black bg-black text-white"
                    : "border-black/50 bg-white hover:bg-neutral-100 text-black"
                }`}
              >
                <span>{k.kode}</span>
                <span>&bull;</span>
                <span>{k.panggilan}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Kartu Profil & Statistik Performa Kasir */}
      <section
        aria-label={`Profil dan Performa Kasir ${kasir.nama}`}
        className="border-2 border-black rounded bg-white p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full border-2 border-black bg-neutral-100 flex items-center justify-center font-mono font-bold text-base shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            aria-hidden="true"
          >
            KS
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-black">
                Riwayat Transaksi: {kasir.nama}
              </h1>
              <span className="px-2 py-0.5 border border-black rounded text-xs font-mono font-bold bg-neutral-100">
                {kasir.kode}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 font-mono mt-1">
              Username: <strong>{kasir.username}</strong> &bull; {kasir.shift}
            </p>
          </div>
        </div>

        {/* Empat Kotak Statistik Kasir */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 border-2 border-black rounded bg-neutral-50">
            <span className="text-neutral-600 block text-[10px] uppercase">
              Omzet Kasir
            </span>
            <span className="font-bold text-sm text-black">
              {formatRupiah(kasirStats.totalOmzet)}
            </span>
          </div>
          <div className="p-3 border-2 border-black rounded bg-neutral-50">
            <span className="text-neutral-600 block text-[10px] uppercase">
              Struk Selesai
            </span>
            <span className="font-bold text-sm text-black">
              {kasirStats.totalSelesai} Struk
            </span>
            {kasirStats.totalBatal > 0 && (
              <span className="block text-[10px] text-neutral-600">
                ({kasirStats.totalBatal} Batal)
              </span>
            )}
          </div>
          <div className="p-3 border-2 border-black rounded bg-neutral-50">
            <span className="text-neutral-600 block text-[10px] uppercase">
              Barang Terjual
            </span>
            <span className="font-bold text-sm text-black">
              {kasirStats.totalItemTerjual} Pcs
            </span>
          </div>
          <div className="p-3 border-2 border-black rounded bg-neutral-50">
            <span className="text-neutral-600 block text-[10px] uppercase">
              Rata-Rata / Struk
            </span>
            <span className="font-bold text-sm text-black">
              {formatRupiah(kasirStats.rataRataStruk)}
            </span>
          </div>
        </div>
      </section>

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
          >
            [Tutup]
          </button>
        </div>
      )}

      {/* Toolbar Filter & Pencarian Khusus Kasir Ini */}
      <TransactionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showKasirFilter={false}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        totalResults={filteredTransactions.length}
      />

      {/* Split View: Tabel Transaksi Kasir & Panel Detail Struk */}
      <section
        aria-label={`Daftar Struk Kasir ${kasir.nama}`}
        className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
      >
        <div className="xl:col-span-7">
          <TransactionTable
            transactions={filteredTransactions}
            selectedTransactionId={activeTransaction?.id}
            onSelectTransaction={(trx) => setSelectedTrxId(trx.id)}
            showKasirColumn={false}
            onResetFilter={handleResetFilters}
          />
        </div>

        <div className="xl:col-span-5 xl:sticky xl:top-6">
          <TransactionDetailPanel
            key={activeTransaction?.id || "empty"}
            transaction={activeTransaction}
            onVoidTransaction={handleVoidTransaction}
            onPrintReceipt={handlePrintReceipt}
            showKasirLink={false}
          />
        </div>
      </section>
    </div>
  );
}

function KasirDetailUnwrapper({ params }) {
  const { kasirId } = use(params);
  return <KasirDetailView kasirId={kasirId} />;
}

export default function OwnerTransaksiKasirPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="p-6 border-2 border-black rounded bg-neutral-50 font-mono text-sm">
          Memuat riwayat transaksi kasir...
        </div>
      }
    >
      <KasirDetailUnwrapper params={params} />
    </Suspense>
  );
}
