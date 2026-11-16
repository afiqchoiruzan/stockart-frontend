"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  apiGetReportSummary,
  apiGetReportRevenue,
  apiGetReportTopProducts,
  apiSendReportEmail,
  fetchTransactionsFromApi,
} from "@/lib/api";
import {
  formatTanggalSingkat,
  getTotalItemCount,
  toDateKey,
} from "@/lib/mockTransactions";
import ReportToolbar from "@/components/owner/ReportToolbar";
import ReportSummaryCards from "@/components/owner/ReportSummaryCards";
import RevenueChart from "@/components/owner/RevenueChart";
import TopProductsPanel from "@/components/owner/TopProductsPanel";
import SendReportPanel from "@/components/owner/SendReportPanel";

const WEEKDAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const CHART_TITLES = {
  harian: "Omzet per Jam",
  mingguan: "Omzet per Hari",
  bulanan: "Omzet per Minggu",
};

const EMPTY_SUMMARY = { totalProduk: 0, totalTransaksi: 0, totalOmzet: 0 };

/** "YYYY-MM-DD" + n hari -> "YYYY-MM-DD" */
function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Rentang tanggal (WIB) untuk periode laporan yang dipilih. */
function getPeriodRange(period, todayKey) {
  if (period === "mingguan") {
    return { tanggalMulai: shiftDateKey(todayKey, -6), tanggalAkhir: todayKey };
  }
  if (period === "bulanan") {
    return { tanggalMulai: `${todayKey.slice(0, 8)}01`, tanggalAkhir: todayKey };
  }
  return { tanggalMulai: todayKey, tanggalAkhir: todayKey };
}

function getPeriodLabel(period, range) {
  if (period === "harian") {
    return `Hari ini, ${formatTanggalSingkat(range.tanggalAkhir)}`;
  }
  return `${formatTanggalSingkat(range.tanggalMulai)} – ${formatTanggalSingkat(
    range.tanggalAkhir
  )}`;
}

function isWithinRange(dateKey, range) {
  return dateKey >= range.tanggalMulai && dateKey <= range.tanggalAkhir;
}

/** Omzet per jam dari daftar transaksi (backend belum punya agregasi per jam). */
function buildHourlyPoints(transactions) {
  const byHour = new Map();
  transactions.forEach((trx) => {
    const hour = Number(String(trx.waktu || "").slice(0, 2));
    if (Number.isNaN(hour)) return;
    const prev = byHour.get(hour) || { omzet: 0, jumlahTransaksi: 0 };
    byHour.set(hour, {
      omzet: prev.omzet + Number(trx.totalHarga || 0),
      jumlahTransaksi: prev.jumlahTransaksi + 1,
    });
  });

  if (byHour.size === 0) return [];

  const hours = Array.from(byHour.keys());
  const points = [];
  for (let hour = Math.min(...hours); hour <= Math.max(...hours); hour += 1) {
    const item = byHour.get(hour) || { omzet: 0, jumlahTransaksi: 0 };
    points.push({ label: String(hour).padStart(2, "0"), ...item });
  }
  return points;
}

/** Omzet per hari selama 7 hari dari data /api/reports/revenue. */
function buildDailyPoints(revenue, range) {
  const byDate = new Map(revenue.map((item) => [item.tanggal, item]));
  const points = [];
  for (let i = 0; i < 7; i += 1) {
    const dateKey = shiftDateKey(range.tanggalMulai, i);
    const item = byDate.get(dateKey);
    const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
    points.push({
      label: WEEKDAY_LABELS[weekday],
      tanggal: dateKey,
      omzet: Number(item?.omzet || 0),
      jumlahTransaksi: Number(item?.jumlahTransaksi || 0),
    });
  }
  return points;
}

/** Omzet per minggu dalam bulan berjalan (tanggal 1–7, 8–14, dst.). */
function buildWeeklyPoints(revenue, range) {
  const lastDay = Number(range.tanggalAkhir.slice(8, 10));
  const weekCount = Math.ceil(lastDay / 7);
  const points = Array.from({ length: weekCount }, (_, idx) => ({
    label: `Minggu ${idx + 1}`,
    omzet: 0,
    jumlahTransaksi: 0,
  }));

  revenue.forEach((item) => {
    if (!isWithinRange(item.tanggal, range)) return;
    const day = Number(item.tanggal.slice(8, 10));
    const point = points[Math.floor((day - 1) / 7)];
    if (!point) return;
    point.omzet += Number(item.omzet || 0);
    point.jumlahTransaksi += Number(item.jumlahTransaksi || 0);
  });

  return points;
}

// Excel dengan regional Indonesia memakai titik koma sebagai pemisah kolom
const CSV_SEPARATOR = ";";

function toCsvCell(value) {
  const text = String(value ?? "");
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function OwnerLaporanPage() {
  const [todayKey] = useState(() => toDateKey(new Date()));
  const [period, setPeriod] = useState("harian");
  const [reloadKey, setReloadKey] = useState(0);

  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const range = useMemo(
    () => getPeriodRange(period, todayKey),
    [period, todayKey]
  );
  const periodLabel = getPeriodLabel(period, range);

  const showFlashMessage = useCallback((msg) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage("");
    }, 4500);
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiGetReportSummary(range),
      apiGetReportRevenue(range),
      apiGetReportTopProducts(range),
      fetchTransactionsFromApi({
        status: "selesai",
        tanggal: period === "harian" ? range.tanggalAkhir : undefined,
      }),
    ])
      .then(([summaryRes, revenueRes, topRes, trxList]) => {
        if (ignore) return;
        setSummary({ ...EMPTY_SUMMARY, ...(summaryRes?.data || {}) });
        setRevenue(Array.isArray(revenueRes?.data) ? revenueRes.data : []);
        setTopProducts(Array.isArray(topRes?.data) ? topRes.data : []);
        setTransactions(trxList);
      })
      .catch((err) => {
        if (ignore) return;
        setApiError(err.message || "Gagal memuat data laporan dari server.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [period, range, reloadKey]);

  const periodTransactions = useMemo(
    () =>
      transactions.filter(
        (trx) => trx.status === "selesai" && isWithinRange(trx.tanggal, range)
      ),
    [transactions, range]
  );

  const totalTerjual = useMemo(
    () =>
      periodTransactions.reduce(
        (sum, trx) => sum + getTotalItemCount(trx.detailBarang),
        0
      ),
    [periodTransactions]
  );

  const chartPoints = useMemo(() => {
    if (period === "harian") return buildHourlyPoints(periodTransactions);
    if (period === "mingguan") return buildDailyPoints(revenue, range);
    return buildWeeklyPoints(revenue, range);
  }, [period, periodTransactions, revenue, range]);

  const handlePeriodChange = (nextPeriod) => {
    if (nextPeriod === period) return;
    setIsLoading(true);
    setApiError("");
    setPeriod(nextPeriod);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setApiError("");
    setReloadKey((prev) => prev + 1);
  };

  const handleSendReport = async (email) => {
    setIsSending(true);
    try {
      const result = await apiSendReportEmail({ ...range, email });
      showFlashMessage(result?.message || "Laporan berhasil dikirim.");
    } catch (err) {
      showFlashMessage(`! Gagal mengirim laporan: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ["Laporan Stockart", periodLabel],
      [],
      ["Ringkasan"],
      ["Omzet", summary.totalOmzet],
      ["Transaksi selesai", summary.totalTransaksi],
      ["Produk terjual (pcs)", totalTerjual],
      [],
      [CHART_TITLES[period]],
      ["Periode", "Omzet", "Jumlah Transaksi"],
      ...chartPoints.map((p) => [
        p.tanggal ? `${p.label} (${p.tanggal})` : p.label,
        p.omzet,
        p.jumlahTransaksi,
      ]),
      [],
      ["Produk Terlaris"],
      ["Peringkat", "Nama Produk", "Terjual (pcs)", "Pendapatan"],
      ...topProducts.map((p, idx) => [
        idx + 1,
        p.namaProduk,
        p.totalTerjual,
        p.totalPendapatan,
      ]),
    ];
    const csv = rows.map((row) => row.map(toCsvCell).join(CSV_SEPARATOR)).join("\n");
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-${period}-${range.tanggalMulai}_${range.tanggalAkhir}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showFlashMessage("Laporan CSV berhasil diunduh.");
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      {apiError && (
        <div
          role="alert"
          className="px-4 py-3 border border-[#EBC5C1] rounded-lg bg-[#F8E8E6] text-xs font-medium text-[#C4574F] flex items-center justify-between"
        >
          <span>{apiError}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`px-4 py-2.5 border rounded-md text-sm ${
            statusMessage.startsWith("!")
              ? "border-[#C4574F] bg-[#F8E8E6] text-[#8c322b]"
              : "border-[#3E8E6A] bg-[#E6F2EC] text-[#245942]"
          }`}
        >
          {statusMessage.replace(/^!\s*/, "")}
        </div>
      )}

      {/* Toolbar Periode & Unduh CSV */}
      <ReportToolbar
        period={period}
        onPeriodChange={handlePeriodChange}
        periodLabel={periodLabel}
        onExportCsv={handleExportCsv}
        isExportDisabled={isLoading || Boolean(apiError)}
      />

      {isLoading ? (
        <div className="p-10 bg-white border border-[#E1E4E0] rounded-lg text-center text-sm text-[#6B7773]">
          Memuat laporan…
        </div>
      ) : (
        <>
          <ReportSummaryCards
            totalOmzet={summary.totalOmzet}
            totalTransaksi={summary.totalTransaksi}
            totalTerjual={totalTerjual}
            periodLabel={periodLabel}
          />

          {/* Grafik Omzet di Kiri & Terlaris + Kirim Laporan di Kanan */}
          <section
            aria-label="Grafik dan Produk Terlaris"
            className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start"
          >
            <RevenueChart title={CHART_TITLES[period]} points={chartPoints} />

            <div className="flex flex-col gap-4">
              <TopProductsPanel products={topProducts} />
              <SendReportPanel
                onSend={handleSendReport}
                isSending={isSending}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
