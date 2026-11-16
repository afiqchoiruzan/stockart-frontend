"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  apiGetReportSummary,
  apiGetReportRevenue,
  apiGetReportTopProducts,
  apiSendReportEmail,
  apiDownloadReportPdf,
} from "@/lib/api";
import { formatTanggalSingkat, toDateKey } from "@/lib/mockTransactions";
import ReportToolbar from "@/components/owner/ReportToolbar";
import ReportSummaryCards from "@/components/owner/ReportSummaryCards";
import RevenueChart from "@/components/owner/RevenueChart";
import TopProductsPanel from "@/components/owner/TopProductsPanel";
import SendReportDropdown from "@/components/owner/SendReportDropdown";
import ReportAutoSendPanel from "@/components/owner/ReportAutoSendPanel";

const WEEKDAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Rentang kustom > 31 hari ditampilkan per minggu agar grafik tetap terbaca
const MAX_DAILY_CHART_DAYS = 31;

const CHART_TITLES = {
  jam: "Omzet per Jam",
  hari: "Omzet per Hari",
  minggu: "Omzet per Minggu",
};

const COMPARE_LABELS = {
  harian: "kemarin",
  mingguan: "7 hari sebelumnya",
  bulanan: "bulan lalu",
  kustom: "periode sebelumnya",
};

const EMPTY_SUMMARY = {
  totalProduk: 0,
  totalTransaksi: 0,
  totalOmzet: 0,
  totalTerjual: 0,
  totalMasuk: 0,
  totalModal: 0,
  totalLaba: 0,
  labaEstimasi: false,
};

/** "YYYY-MM-DD" + n hari -> "YYYY-MM-DD" */
function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Jumlah hari dalam rentang, termasuk tanggal awal dan akhir. */
function countDays(range) {
  return (
    Math.round(
      (new Date(`${range.tanggalAkhir}T00:00:00Z`) -
        new Date(`${range.tanggalMulai}T00:00:00Z`)) /
        86400000
    ) + 1
  );
}

/** Rentang tanggal (WIB) untuk periode laporan yang dipilih. */
function getPeriodRange(period, todayKey, customRange) {
  if (period === "kustom" && customRange) {
    return customRange;
  }
  if (period === "mingguan") {
    return { tanggalMulai: shiftDateKey(todayKey, -6), tanggalAkhir: todayKey };
  }
  if (period === "bulanan") {
    return { tanggalMulai: `${todayKey.slice(0, 8)}01`, tanggalAkhir: todayKey };
  }
  return { tanggalMulai: todayKey, tanggalAkhir: todayKey };
}

/**
 * Rentang pembanding dengan panjang yang sama tepat sebelum periode aktif.
 * Bulanan: tanggal 1 s/d tanggal yang sama di bulan lalu (dibatasi akhir bulan).
 */
function getPreviousRange(period, range) {
  if (period === "bulanan") {
    const [year, month] = range.tanggalMulai.split("-").map(Number);
    const prevMonthStart = new Date(Date.UTC(year, month - 2, 1));
    const prevMonthLastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
    const endDay = Math.min(Number(range.tanggalAkhir.slice(8, 10)), prevMonthLastDay);
    const prefix = prevMonthStart.toISOString().slice(0, 8);
    return {
      tanggalMulai: `${prefix}01`,
      tanggalAkhir: `${prefix}${String(endDay).padStart(2, "0")}`,
    };
  }
  const days = countDays(range);
  return {
    tanggalMulai: shiftDateKey(range.tanggalMulai, -days),
    tanggalAkhir: shiftDateKey(range.tanggalMulai, -1),
  };
}

/** Cara grafik dikelompokkan: per jam (1 hari), per hari, atau per minggu. */
function getChartMode(period, range) {
  if (period === "harian") return "jam";
  if (period === "mingguan") return "hari";
  if (period === "bulanan") return "minggu";
  const days = countDays(range);
  if (days <= 1) return "jam";
  return days <= MAX_DAILY_CHART_DAYS ? "hari" : "minggu";
}

function getPeriodLabel(period, range) {
  if (period === "harian") {
    return `Hari ini, ${formatTanggalSingkat(range.tanggalAkhir)}`;
  }
  if (range.tanggalMulai === range.tanggalAkhir) {
    return formatTanggalSingkat(range.tanggalMulai);
  }
  return `${formatTanggalSingkat(range.tanggalMulai)} – ${formatTanggalSingkat(
    range.tanggalAkhir
  )}`;
}

function isWithinRange(dateKey, range) {
  return dateKey >= range.tanggalMulai && dateKey <= range.tanggalAkhir;
}

/** Omzet per jam WIB dari data /api/reports/revenue?interval=jam. */
function buildHourlyPoints(revenue) {
  const byHour = new Map();
  revenue.forEach((item) => {
    const hour = Number(item.jam);
    if (item.jam === undefined || Number.isNaN(hour)) return;
    byHour.set(hour, {
      omzet: Number(item.omzet || 0),
      jumlahTransaksi: Number(item.jumlahTransaksi || 0),
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

/**
 * Omzet per hari untuk setiap tanggal dalam rentang dari data /api/reports/revenue.
 * Rentang <= 7 hari memakai nama hari, lebih panjang memakai tanggal.
 */
function buildDailyPoints(revenue, range) {
  const byDate = new Map(revenue.map((item) => [item.tanggal, item]));
  const days = countDays(range);
  const points = [];
  for (let i = 0; i < days; i += 1) {
    const dateKey = shiftDateKey(range.tanggalMulai, i);
    const item = byDate.get(dateKey);
    const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
    points.push({
      label: days <= 7 ? WEEKDAY_LABELS[weekday] : String(Number(dateKey.slice(8, 10))),
      tanggal: dateKey,
      omzet: Number(item?.omzet || 0),
      jumlahTransaksi: Number(item?.jumlahTransaksi || 0),
    });
  }
  return points;
}

/** Omzet per 7 hari berturut-turut sejak tanggal mulai (untuk rentang kustom panjang). */
function buildRollingWeeklyPoints(revenue, range) {
  const days = countDays(range);
  const points = Array.from({ length: Math.ceil(days / 7) }, (_, idx) => {
    const start = shiftDateKey(range.tanggalMulai, idx * 7);
    return {
      label: `${Number(start.slice(8, 10))}/${Number(start.slice(5, 7))}`,
      omzet: 0,
      jumlahTransaksi: 0,
    };
  });

  revenue.forEach((item) => {
    if (!isWithinRange(item.tanggal, range)) return;
    const offset = countDays({ tanggalMulai: range.tanggalMulai, tanggalAkhir: item.tanggal }) - 1;
    const point = points[Math.floor(offset / 7)];
    if (!point) return;
    point.omzet += Number(item.omzet || 0);
    point.jumlahTransaksi += Number(item.jumlahTransaksi || 0);
  });

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

export default function OwnerLaporanPage() {
  const [todayKey] = useState(() => toDateKey(new Date()));
  const [period, setPeriod] = useState("harian");
  const [customRange, setCustomRange] = useState(() => ({
    tanggalMulai: shiftDateKey(toDateKey(new Date()), -6),
    tanggalAkhir: toDateKey(new Date()),
  }));
  const [reloadKey, setReloadKey] = useState(0);

  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [previousSummary, setPreviousSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [defaultRecipient, setDefaultRecipient] = useState("");

  const range = useMemo(
    () => getPeriodRange(period, todayKey, customRange),
    [period, todayKey, customRange]
  );
  const previousRange = useMemo(() => getPreviousRange(period, range), [period, range]);
  const chartMode = getChartMode(period, range);
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
      apiGetReportRevenue({
        ...range,
        interval: chartMode === "jam" ? "jam" : undefined,
      }),
      apiGetReportTopProducts(range),
      // Pembanding bersifat opsional: bila gagal, kartu tetap tampil tanpa persentase
      apiGetReportSummary(previousRange).catch(() => null),
    ])
      .then(([summaryRes, revenueRes, topRes, previousRes]) => {
        if (ignore) return;
        setSummary({ ...EMPTY_SUMMARY, ...(summaryRes?.data || {}) });
        setRevenue(Array.isArray(revenueRes?.data) ? revenueRes.data : []);
        setTopProducts(Array.isArray(topRes?.data) ? topRes.data : []);
        setPreviousSummary(
          previousRes?.data ? { ...EMPTY_SUMMARY, ...previousRes.data } : null
        );
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
  }, [range, previousRange, chartMode, reloadKey]);

  const chartPoints = useMemo(() => {
    if (chartMode === "jam") return buildHourlyPoints(revenue);
    if (chartMode === "hari") return buildDailyPoints(revenue, range);
    if (period === "bulanan") return buildWeeklyPoints(revenue, range);
    return buildRollingWeeklyPoints(revenue, range);
  }, [chartMode, period, revenue, range]);

  const handlePeriodChange = (nextPeriod) => {
    if (nextPeriod === period) return;
    setIsLoading(true);
    setApiError("");
    setPeriod(nextPeriod);
  };

  // Tanggal mulai tidak boleh melewati tanggal akhir (dan sebaliknya), maks. hari ini
  const handleCustomRangeChange = (field, value) => {
    if (!value) return;
    const clamped = value > todayKey ? todayKey : value;
    const next = { ...customRange, [field]: clamped };
    if (next.tanggalMulai > next.tanggalAkhir) {
      if (field === "tanggalMulai") next.tanggalAkhir = next.tanggalMulai;
      else next.tanggalMulai = next.tanggalAkhir;
    }
    if (
      next.tanggalMulai === customRange.tanggalMulai &&
      next.tanggalAkhir === customRange.tanggalAkhir
    ) {
      return;
    }
    setIsLoading(true);
    setApiError("");
    setCustomRange(next);
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
      return true;
    } catch (err) {
      showFlashMessage(`! Gagal mengirim laporan: ${err.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const blob = await apiDownloadReportPdf(range);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_Stockart_${range.tanggalMulai}_${range.tanggalAkhir}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      showFlashMessage("Laporan PDF berhasil diunduh.");
    } catch (err) {
      showFlashMessage(`! Gagal mengunduh PDF laporan: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
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
            onClick={handleRetry}
            className="shrink-0 inline-flex items-center min-h-11 -my-3 lg:min-h-0 lg:my-0 text-xs font-semibold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`px-3 sm:px-4 py-2.5 border rounded-md text-sm ${
            statusMessage.startsWith("!")
              ? "border-[#C4574F] bg-[#F8E8E6] text-[#8c322b]"
              : "border-[#3E8E6A] bg-[#E6F2EC] text-[#245942]"
          }`}
        >
          {statusMessage.replace(/^!\s*/, "")}
        </div>
      )}

      {/* Toolbar Periode, Kirim Laporan & Unduh PDF */}
      <ReportToolbar
        period={period}
        onPeriodChange={handlePeriodChange}
        periodLabel={periodLabel}
        customRange={customRange}
        onCustomRangeChange={handleCustomRangeChange}
        maxDate={todayKey}
        onDownloadPdf={handleDownloadPdf}
        isDownloadDisabled={isLoading || Boolean(apiError)}
        isDownloading={isDownloading}
        actions={
          <SendReportDropdown
            onSend={handleSendReport}
            isSending={isSending}
            disabled={isLoading || Boolean(apiError)}
            defaultRecipient={defaultRecipient}
          />
        }
      />

      {isLoading ? (
        <div className="p-10 bg-white border border-[#E1E4E0] rounded-lg text-center text-sm text-[#6B7773]">
          Memuat laporan…
        </div>
      ) : (
        <>
          <ReportSummaryCards
            summary={summary}
            previousSummary={previousSummary}
            compareLabel={COMPARE_LABELS[period]}
            periodLabel={periodLabel}
          />

          {/* Grafik Omzet + Kirim Otomatis di Kiri & Terlaris di Kanan */}
          <section
            aria-label="Grafik dan Produk Terlaris"
            className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start"
          >
            <div className="flex flex-col gap-4 min-w-0">
              <RevenueChart title={CHART_TITLES[chartMode]} points={chartPoints} />
              <ReportAutoSendPanel
                onSaved={showFlashMessage}
                onSettingsLoaded={(data) =>
                  setDefaultRecipient(data?.maskedRecipient || "")
                }
              />
            </div>

            <TopProductsPanel products={topProducts} />
          </section>
        </>
      )}
    </div>
  );
}
