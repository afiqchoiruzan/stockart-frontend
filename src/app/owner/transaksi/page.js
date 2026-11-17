"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  fetchTransactionsFromApi,
  fetchTransactionDetailFromApi,
  buildCashierRoster,
  apiGetCashiers,
} from "@/lib/api";
import CashierSummaryCards from "@/components/owner/CashierSummaryCards";
import CashierManageModal from "@/components/owner/CashierManageModal";
import TransactionToolbar from "@/components/owner/TransactionToolbar";
import TransactionTable from "@/components/owner/TransactionTable";
import TransactionDetailPanel from "@/components/owner/TransactionDetailPanel";
import { matchesTransactionStatusFilter } from "@/lib/mockTransactions";

export default function OwnerTransaksiPage() {
  const [transactions, setTransactions] = useState([]);
  const [cashiersFromApi, setCashiersFromApi] = useState(null);
  const [isManageCashiersOpen, setIsManageCashiersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKasirId, setSelectedKasirId] = useState("semua");
  const [selectedMethod, setSelectedMethod] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTrxId, setSelectedTrxId] = useState(null);

  const loadCashiersFromBackend = useCallback(async () => {
    try {
      const res = await apiGetCashiers();
      const list = Array.isArray(res?.data)
        ? res.data.map((u) => ({
            id: String(u._id),
            nama: u.nama || "Kasir",
            username: u.username || "",
            aktif: u.aktif !== false,
          }))
        : [];
      setCashiersFromApi(list);
    } catch {
      // Fallback ke buildCashierRoster jika endpoint belum tersedia
    }
  }, []);

  const loadFromBackend = useCallback(async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const [data] = await Promise.all([
        fetchTransactionsFromApi(),
        loadCashiersFromBackend(),
      ]);
      setTransactions(data);
      if (data.length > 0) {
        setSelectedTrxId((prev) => prev || data[0].id);
      }
    } catch (err) {
      setApiError(err.message || "Gagal memuat data transaksi dari server.");
    } finally {
      setIsLoading(false);
    }
  }, [loadCashiersFromBackend]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetchTransactionsFromApi(),
      apiGetCashiers().catch(() => null),
    ])
      .then(([data, cashiersRes]) => {
        if (ignore) return;
        setTransactions(data);
        if (Array.isArray(cashiersRes?.data)) {
          setCashiersFromApi(
            cashiersRes.data.map((u) => ({
              id: String(u._id),
              nama: u.nama || "Kasir",
              username: u.username || "",
              aktif: u.aktif !== false,
            }))
          );
        }
        if (data.length > 0) {
          setSelectedTrxId((prev) => prev || data[0].id);
        }
      })
      .catch((err) => {
        if (ignore) return;
        setApiError(err.message || "Gagal memuat data transaksi dari server.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const allCashiers = useMemo(() => {
    if (Array.isArray(cashiersFromApi)) return cashiersFromApi;
    return buildCashierRoster(transactions, true);
  }, [cashiersFromApi, transactions]);

  const activeCashiers = useMemo(() => {
    return allCashiers.filter((c) => c.aktif !== false);
  }, [allCashiers]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((trx) => {
      const matchKasir =
        selectedKasirId === "semua" || trx.kasirId === selectedKasirId;
      const metode =
        trx.metodePembayaran === "Tunai / POS"
          ? "Tunai"
          : trx.metodePembayaran || "Tunai";
      const matchMethod =
        selectedMethod === "semua" ||
        metode.toLowerCase() === selectedMethod.toLowerCase();
      const matchStatus = matchesTransactionStatusFilter(trx, selectedStatus);
      const matchDate = !selectedDate || trx.tanggal === selectedDate;
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
      return matchKasir && matchMethod && matchStatus && matchDate && matchQuery;
    });
  }, [transactions, searchQuery, selectedKasirId, selectedMethod, selectedStatus, selectedDate]);

  const activeTransaction = useMemo(() => {
    if (filteredTransactions.length === 0) return null;
    const found = filteredTransactions.find((t) => t.id === selectedTrxId);
    return found || filteredTransactions[0];
  }, [filteredTransactions, selectedTrxId]);

  const handleSelectTransaction = async (trx) => {
    setSelectedTrxId(trx.id);
    if (trx.isFromBackend) {
      try {
        const freshDetail = await fetchTransactionDetailFromApi(trx.id);
        if (freshDetail) {
          setTransactions((prev) =>
            prev.map((item) =>
              item.id === freshDetail.id ? freshDetail : item
            )
          );
        }
      } catch {
        // Gunakan data yang sudah ada di tabel jika gagal fetch detail
      }
    }
  };

  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedKasirId("semua");
    setSelectedMethod("semua");
    setSelectedStatus("semua");
    setSelectedDate("");
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      {apiError && (
        <div
          role="alert"
          className="px-3 sm:px-4 py-3 border border-[#EBC5C1] rounded-lg bg-[#F8E8E6] text-xs font-medium text-[#C4574F] flex items-center justify-between gap-3"
        >
          <span className="min-w-0">{apiError}</span>
          <button
            type="button"
            onClick={loadFromBackend}
            className="shrink-0 inline-flex items-center min-h-11 -my-3 lg:min-h-0 lg:my-0 text-xs font-semibold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Kartu Ringkasan Masing-Masing Kasir */}
      <CashierSummaryCards
        cashiers={activeCashiers}
        transactions={transactions}
        selectedKasirId={selectedKasirId}
        onSelectKasir={setSelectedKasirId}
        selectedDate={selectedDate}
        onManageCashiers={() => setIsManageCashiersOpen(true)}
      />

      <CashierManageModal
        open={isManageCashiersOpen}
        onClose={() => setIsManageCashiersOpen(false)}
        cashiers={allCashiers}
        onRefreshCashiers={loadCashiersFromBackend}
      />

      {/* Toolbar Pencarian & Filter */}
      <TransactionToolbar
        cashiers={activeCashiers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedKasirId={selectedKasirId}
        onKasirChange={setSelectedKasirId}
        showKasirFilter={true}
        selectedMethod={selectedMethod}
        onMethodChange={setSelectedMethod}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        totalResults={filteredTransactions.length}
      />

      {/* Split Layout: Tabel Riwayat di Kiri & Panel Detail Struk di Kanan */}
      {isLoading && transactions.length === 0 ? (
        <div className="p-10 bg-white border border-[#E1E4E0] rounded-lg text-center text-sm text-[#6B7773]">
          Memuat riwayat transaksi…
        </div>
      ) : (
        <section
          aria-label="Tabel dan Rincian Struk Transaksi"
          className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start"
        >
          <TransactionTable
            transactions={filteredTransactions}
            selectedTransactionId={activeTransaction?.id}
            onSelectTransaction={handleSelectTransaction}
            showKasirColumn={true}
            onResetFilter={handleResetFilters}
          />

          <div className="min-w-0 xl:sticky xl:top-6">
            <TransactionDetailPanel
              key={activeTransaction?.id || "empty"}
              transaction={activeTransaction}
              onPrintReceipt={handlePrintReceipt}
              showKasirLink={true}
            />
          </div>
        </section>
      )}
    </div>
  );
}
