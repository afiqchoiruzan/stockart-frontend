"use client";

import { useState, useEffect } from "react";
import {
  apiGetLowStockAlertSettings,
  apiUpdateLowStockAlertSettings,
} from "@/lib/api";

const FREQUENCY_OPTIONS = [
  { value: "off", label: "Mati", desc: "Hanya manual & kritis" },
  { value: "daily", label: "Harian", desc: "Setiap hari" },
  { value: "weekly", label: "Mingguan", desc: "Seminggu sekali" },
  { value: "monthly", label: "Bulanan", desc: "Sebulan sekali" },
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 0, label: "Minggu" },
];

const STATUS_META = {
  sent: {
    label: "Terkirim",
    badgeClass: "bg-[#E6F2EC] text-[#245942]",
  },
  skipped_empty: {
    label: "Dilewati (Semua Stok Aman)",
    badgeClass: "bg-[#F5F6F4] text-[#6B7773]",
  },
  failed: {
    label: "Gagal Mengirim",
    badgeClass: "bg-[#F8E8E6] text-[#8c322b]",
  },
  email_not_configured: {
    label: "Email Belum Dikonfigurasi",
    badgeClass: "bg-[#FBF1DC] text-[#7a5612]",
  },
};

function formatWibDateTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date) + " WIB"
  );
}

function ModalContent({
  onClose,
  onNotifyNow,
  isNotifying,
  lowStockCount,
  onSaved,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [serverData, setServerData] = useState(null);

  const [digestFrequency, setDigestFrequency] = useState("weekly");
  const [digestTime, setDigestTime] = useState("07:00");
  const [digestWeekday, setDigestWeekday] = useState(1);
  const [digestDayOfMonth, setDigestDayOfMonth] = useState(1);
  const [criticalAlertEnabled, setCriticalAlertEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetLowStockAlertSettings()
      .then((data) => {
        if (cancelled || !data) return;
        setServerData(data);
        setDigestFrequency(data.digestFrequency || "weekly");
        setDigestTime(data.digestTime || "07:00");
        setDigestWeekday(Number(data.digestWeekday ?? 1));
        setDigestDayOfMonth(Number(data.digestDayOfMonth ?? 1));
        setCriticalAlertEnabled(Boolean(data.criticalAlertEnabled ?? true));
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 404) {
          setLoadError(
            "Endpoint pengaturan jadwal belum tersedia di server backend yang terhubung (404). Jika menggunakan Railway, pastikan deployment terbaru branch main sudah aktif di Railway; atau arahkan NEXT_PUBLIC_API_URL ke backend lokal terbaru."
          );
          return;
        }
        setLoadError(err.message || "Gagal memuat pengaturan jadwal alert.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !isSaving) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  const hasChanges = Boolean(
    serverData &&
      (digestFrequency !== serverData.digestFrequency ||
        digestTime !== serverData.digestTime ||
        Number(digestWeekday) !== Number(serverData.digestWeekday) ||
        Number(digestDayOfMonth) !== Number(serverData.digestDayOfMonth) ||
        Boolean(criticalAlertEnabled) !== Boolean(serverData.criticalAlertEnabled))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");
    setIsSaving(true);
    try {
      const updated = await apiUpdateLowStockAlertSettings({
        digestFrequency,
        digestTime,
        digestWeekday: Number(digestWeekday),
        digestDayOfMonth: Number(digestDayOfMonth),
        criticalAlertEnabled: Boolean(criticalAlertEnabled),
      });
      setServerData(updated);
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err) {
      setSaveError(err.message || "Gagal menyimpan jadwal alert.");
    } finally {
      setIsSaving(false);
    }
  };

  const effectiveLastStatus =
    serverData?.emailConfigured &&
    serverData?.lastDigestStatus === "email_not_configured"
      ? null
      : serverData?.lastDigestStatus;

  const lastStatusMeta = effectiveLastStatus
    ? STATUS_META[effectiveLastStatus] || {
        label: effectiveLastStatus,
        badgeClass: "bg-[#F5F6F4] text-[#6B7773]",
      }
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="low-stock-schedule-title"
      className="fixed inset-0 z-50 grid place-items-center p-4"
    >
      <div
        className="fixed inset-0 bg-[#1F2A27]/45 transition-opacity"
        onClick={() => {
          if (!isSaving) onClose();
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[540px] max-h-[calc(100vh-32px)] bg-white border border-[#E1E4E0] rounded-lg flex flex-col shadow-xl z-10 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E1E4E0] flex items-center justify-between bg-white shrink-0">
          <div>
            <h2
              id="low-stock-schedule-title"
              className="font-semibold text-base text-[#1F2A27]"
            >
              Jadwal Alert Stok
            </h2>
            <p className="text-xs text-[#6B7773] mt-0.5">
              Atur pengiriman rekap stok menipis ke email owner secara berkala.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Tutup pengaturan jadwal"
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#6B7773] hover:bg-[#F5F6F4] hover:text-[#1F2A27] transition-colors cursor-pointer"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4 stroke-current"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="p-5 flex flex-col gap-4">
            {isLoading ? (
              <div className="py-10 text-center text-sm text-[#6B7773]">
                Memuat pengaturan jadwal dari server…
              </div>
            ) : loadError ? (
              <div className="p-3.5 border border-[#C4574F] bg-[#F8E8E6] text-[#8c322b] rounded-md text-sm">
                {loadError}
              </div>
            ) : (
              <>
                {serverData && serverData.emailConfigured === false && (
                  <div
                    role="alert"
                    className="p-3 border border-[#D9A441] bg-[#FBF1DC] text-[#7a5612] rounded-md text-xs leading-relaxed"
                  >
                    <strong>Konfigurasi email belum aktif di server.</strong> Jadwal akan
                    disimpan, namun pengiriman email otomatis membutuhkan{" "}
                    <code>BREVO_API_KEY</code> atau <code>SMTP_USER</code>/
                    <code>SMTP_PASS</code> di backend.
                  </div>
                )}

                {saveError && (
                  <div
                    role="alert"
                    className="p-3 border border-[#C4574F] bg-[#F8E8E6] text-[#8c322b] rounded-md text-xs"
                  >
                    {saveError}
                  </div>
                )}

                {/* Frekuensi Rekap */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F2A27] mb-2">
                    Frekuensi Rekap Email Otomatis
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FREQUENCY_OPTIONS.map((opt) => {
                      const active = digestFrequency === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDigestFrequency(opt.value)}
                          className={`px-3 py-2.5 rounded-md border text-left transition-colors cursor-pointer ${
                            active
                              ? "border-[#2F6F5E] bg-[#E6F0ED] text-[#1F2A27]"
                              : "border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] text-[#1F2A27]"
                          }`}
                        >
                          <div className="text-xs font-semibold flex items-center justify-between">
                            <span>{opt.label}</span>
                            {active && (
                              <span
                                aria-hidden="true"
                                className="w-2 h-2 rounded-full bg-[#2F6F5E]"
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-[#6B7773] mt-0.5">
                            {opt.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Parameter Jadwal */}
                {digestFrequency !== "off" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {digestFrequency === "weekly" && (
                      <div>
                        <label
                          htmlFor="digest-weekday"
                          className="block text-xs font-semibold text-[#1F2A27] mb-1.5"
                        >
                          Hari Pengiriman
                        </label>
                        <select
                          id="digest-weekday"
                          value={digestWeekday}
                          onChange={(e) => setDigestWeekday(Number(e.target.value))}
                          className="w-full min-h-[40px] px-3 bg-white border border-[#E1E4E0] rounded-md text-sm text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15"
                        >
                          {WEEKDAY_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {digestFrequency === "monthly" && (
                      <div>
                        <label
                          htmlFor="digest-dom"
                          className="block text-xs font-semibold text-[#1F2A27] mb-1.5"
                        >
                          Tanggal (1–28)
                        </label>
                        <select
                          id="digest-dom"
                          value={digestDayOfMonth}
                          onChange={(e) => setDigestDayOfMonth(Number(e.target.value))}
                          className="w-full min-h-[40px] px-3 bg-white border border-[#E1E4E0] rounded-md text-sm text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15"
                        >
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                            <option key={day} value={day}>
                              Tanggal {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="digest-time"
                        className="block text-xs font-semibold text-[#1F2A27] mb-1.5"
                      >
                        Jam Kirim (WIB)
                      </label>
                      <input
                        id="digest-time"
                        type="time"
                        required
                        value={digestTime}
                        onChange={(e) => setDigestTime(e.target.value)}
                        className="w-full min-h-[40px] px-3 bg-white border border-[#E1E4E0] rounded-md text-sm text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15"
                      />
                    </div>
                  </div>
                )}

                {/* Toggle Alert Kritis Stok = 0 */}
                <label
                  htmlFor="critical-alert-toggle"
                  className="flex items-start justify-between gap-3 p-3.5 border border-[#E1E4E0] rounded-md bg-[#F5F6F4]/60 cursor-pointer hover:bg-[#F5F6F4] transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#1F2A27]">
                      Alert Instan Saat Stok Produk Habis (0)
                    </div>
                    <p className="text-[11px] text-[#6B7773] mt-0.5 leading-relaxed">
                      Kirim peringatan kritis 1x segera ketika transaksi kasir membuat stok
                      produk menyentuh 0 (tidak menunggu jadwal mingguan/bulanan).
                    </p>
                  </div>
                  <input
                    id="critical-alert-toggle"
                    type="checkbox"
                    checked={criticalAlertEnabled}
                    onChange={(e) => setCriticalAlertEnabled(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#2F6F5E] rounded cursor-pointer shrink-0"
                  />
                </label>

                {/* Info Jadwal & Status Terakhir */}
                {serverData && (
                  <div className="p-3.5 border border-[#E1E4E0] rounded-md bg-white flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#6B7773]">Jadwal Berikutnya:</span>
                      <span className="font-semibold text-[#1F2A27] text-right">
                        {serverData.digestFrequency === "off"
                          ? "Nonaktif"
                          : formatWibDateTime(serverData.nextRunAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#6B7773]">Pengiriman Terakhir:</span>
                      {lastStatusMeta ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${lastStatusMeta.badgeClass}`}
                        >
                          {lastStatusMeta.label}
                          {serverData.lastDigestStatus === "sent" &&
                            ` (${serverData.lastDigestCount} produk)`}
                        </span>
                      ) : (
                        <span className="text-[#6B7773]">Belum pernah berjalan</span>
                      )}
                    </div>
                    {serverData.lastDigestSentAt && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#6B7773]">Waktu Kirim Terakhir:</span>
                        <span className="text-[#1F2A27]">
                          {formatWibDateTime(serverData.lastDigestSentAt)}
                        </span>
                      </div>
                    )}
                    {serverData.lastDigestStatus === "failed" &&
                      serverData.lastDigestError && (
                        <div className="text-[11px] text-[#8c322b] bg-[#F8E8E6] px-2.5 py-1.5 rounded">
                          Error terakhir: {serverData.lastDigestError}
                        </div>
                      )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-[#E1E4E0] bg-[#F5F6F4] flex flex-wrap items-center justify-between gap-2 shrink-0">
            {typeof onNotifyNow === "function" ? (
              <button
                type="button"
                disabled={isNotifying || isSaving || isLoading}
                onClick={async () => {
                  await onNotifyNow();
                }}
                className="min-h-[38px] px-3 border border-[#E1E4E0] bg-white hover:bg-[#E6F0ED] hover:border-[#2F6F5E] hover:text-[#2F6F5E] rounded-md text-xs font-semibold text-[#1F2A27] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isNotifying
                  ? "Mengirim…"
                  : `Kirim Rekap Sekarang${lowStockCount > 0 ? ` (${lowStockCount})` : ""}`}
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="min-h-[38px] px-3.5 border border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] rounded-md text-xs font-semibold text-[#1F2A27] disabled:opacity-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || isSaving || Boolean(loadError) || !hasChanges}
                className="min-h-[38px] px-4 rounded-md bg-[#2F6F5E] hover:bg-[#255a4c] text-white text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSaving ? "Menyimpan…" : "Simpan Jadwal"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LowStockAlertSettingsModal({
  isOpen,
  onClose,
  onNotifyNow,
  isNotifying = false,
  lowStockCount = 0,
  onSaved,
}) {
  if (!isOpen) return null;
  return (
    <ModalContent
      onClose={onClose}
      onNotifyNow={onNotifyNow}
      isNotifying={isNotifying}
      lowStockCount={lowStockCount}
      onSaved={onSaved}
    />
  );
}
