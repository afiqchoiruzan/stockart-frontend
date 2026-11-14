"use client";

import { use, useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  CASHIERS,
  INITIAL_TRANSACTIONS,
  getCashierById,
  formatRupiah,
  getTotalItemCount,
} from "@/lib/mockTransactions";
import {
  fetchTransactionsFromApi,
  fetchTransactionDetailFromApi,
  buildCashierRoster,
} from "@/lib/api";
import ApiSourceBar from "@/components/owner/ApiSourceBar";
import TransactionToolbar from "@/components/owner/TransactionToolbar";
import TransactionTable from "@/components/owner/TransactionTable";
import TransactionDetailPanel from "@/components/owner/TransactionDetailPanel";

function KasirDetailView({ kasirId }) {
  const isMockKasirId = kasirId.startsWith("kasir-");
  const [dataSource, setDataSource] = useState(isMockKasirId ? "mock" : "api");
  const [apiTransactions, setApiTransactions] = useState([]);
  const [isLoadingApi, setIsLoadingApi] = useState(!isMockKasirId);
  const [apiError, setApiError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTrxId, setSelectedTrxId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const showTempMessage = useCallback((msg) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage("");
    }, 5000);
  }, []);

  const loadFromBackend = useCallback(async () => {
    setIsLoadingApi(true);
    setApiError("");
    try {
      const data = await fetchTransactionsFromApi();
      setApiTransactions(data);
      if (!isMockKasirId) {
        setDataSource("api");
      }
      showTempMessage(
        `Berhasil menyinkronkan ${data.length} transaksi dari server backend.`
      );
    } catch (err) {
      const errMsg = err.message || "Server backend belum berjalan";
      setApiError(errMsg);
      setDataSource("mock");
      showTempMessage(`! Gagal sinkron API: ${errMsg}`);
    } finally {
      setIsLoadingApi(false);
    }
  }, [isMockKasirId, showTempMessage]);

  useEffect(() => {
    let ignore = false;
    fetchTransactionsFromApi()
      .then((data) => {
        if (ignore) return;
        setApiTransactions(data);
        if (!isMockKasirId) {
          setDataSource("api");
        }
      })
      .catch((err) => {
        if (ignore) return;
        setApiError(err.message || "Server backend belum berjalan");
        setDataSource("mock");
      })
      .finally(() => {
        if (!ignore) setIsLoadingApi(false);
      });
    return () => {
      ignore = true;
    };
  }, [isMockKasirId]);

  const transactions =
    dataSource === "api" ? apiTransactions : INITIAL_TRANSACTIONS;

  const activeCashiers = useMemo(() => {
    if (dataSource === "api") {
      return buildCashierRoster(apiTransactions, true);
    }
    return CASHIERS;
  }, [dataSource, apiTransactions]);

  const kasir = useMemo(() => {
    return (
      activeCashiers.find((k) => k.id === kasirId) ||
      getCashierById(kasirId) ||
      null
    );
  }, [activeCashiers, kasirId]);

  // Semua transaksi milik kasir ini
  const kasirTransactions = useMemo(() => {
    return transactions.filter((t) => t.kasirId === kasirId);
  }, [transactions, kasirId]);

  // Statistik performa kasir
  const kasirStats = useMemo(() => {
    const totalOmzet = kasirTransactions.reduce(
      (sum, t) => sum + Number(t.totalHarga || 0),
      0
    );
    const totalItemTerjual = kasirTransactions.reduce(
      (sum, t) => sum + getTotalItemCount(t.detailBarang),
      0
    );
    const rataRataStruk =
      kasirTransactions.length > 0
        ? Math.round(totalOmzet / kasirTransactions.length)
        : 0;

    return {
      totalStruk: kasirTransactions.length,
      totalOmzet,
      totalItemTerjual,
      rataRataStruk,
    };
  }, [kasirTransactions]);

  // Filter berdasarkan kata kunci dan tanggal
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kasirTransactions.filter((trx) => {
      const matchDate = !selectedDate || trx.tanggal === selectedDate;
      const matchQuery =
        q === "" ||
        trx.noInvoice.toLowerCase().includes(q) ||
        trx.detailBarang?.some(
          (item) =>
            item.namaProduk.toLowerCase().includes(q) ||
            item.kodeProduk.toLowerCase().includes(q)
        );
      return matchDate && matchQuery;
    });
  }, [kasirTransactions, searchQuery, selectedDate]);

  // Transaksi yang ditampilkan di panel detail
  const activeTransaction = useMemo(() => {
    if (filteredTransactions.length === 0) return null;
    const found = filteredTransactions.find((t) => t.id === selectedTrxId);
    return found || filteredTransactions[0];
  }, [filteredTransactions, selectedTrxId]);

  const handleSelectTransaction = async (trx) => {
    setSelectedTrxId(trx.id);
    if (dataSource === "api" && trx.isFromBackend) {
      try {
        const freshDetail = await fetchTransactionDetailFromApi(trx.id);
        if (freshDetail) {
          setApiTransactions((prev) =>
            prev.map((item) =>
              item.id === freshDetail.id ? freshDetail : item
            )
          );
        }
      } catch {
        // Fallback ke data yang ada
      }
    }
  };

  const handlePrintReceipt = (trx) => {
    showTempMessage(
      `Membuka dialog cetak / simpan PDF struk ${trx.noInvoice} (${trx.namaKasir}).`
    );
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDate("");
  };

  if (isLoadingApi) {
    return (
      <div className="p-6 border-2 border-black rounded bg-neutral-50 font-mono text-sm">
        Memuat data riwayat transaksi kasir dari API Backend...
      </div>
    );
  }

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
          tidak ditemukan pada sumber data aktif ({dataSource.toUpperCase()}).
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
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Pindah Kasir"
        >
          <span className="text-xs font-bold text-neutral-600 mr-1">
            Pilih Kasir:
          </span>
          {activeCashiers.map((k) => {
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

      {/* Bar Status Integrasi API Backend */}
      <ApiSourceBar
        dataSource={dataSource}
        isLoading={isLoadingApi}
        apiError={apiError}
        onRefreshApi={loadFromBackend}
        onSwitchSource={(next) => setDataSource(next)}
      />

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
              Total Transaksi
            </span>
            <span className="font-bold text-sm text-black">
              {kasirStats.totalStruk} Struk
            </span>
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
            <span className="font-mono font-bold">[INFO]</span>
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
        cashiers={activeCashiers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showKasirFilter={false}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
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
            onSelectTransaction={handleSelectTransaction}
            showKasirColumn={false}
            onResetFilter={handleResetFilters}
          />
        </div>

        <div className="xl:col-span-5 xl:sticky xl:top-6">
          <TransactionDetailPanel
            key={activeTransaction?.id || "empty"}
            transaction={activeTransaction}
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
