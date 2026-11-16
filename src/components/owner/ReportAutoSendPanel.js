"use client";

import { useState, useEffect } from "react";
import {
  apiGetReportAutoSendSettings,
  apiUpdateReportAutoSendSettings,
} from "@/lib/api";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Harian", desc: "Laporan kemarin" },
  { value: "weekly", label: "Mingguan", desc: "7 hari terakhir" },
  { value: "monthly", label: "Bulanan", desc: "1 bulan terakhir" },
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
  failed: {
    label: "Gagal Mengirim",
    badgeClass: "bg-[#F8E8E6] text-[#8c322b]",
  },
  email_not_configured: {
    label: "Email Belum Dikonfigurasi",
    badgeClass: "bg-[#FBF1DC] text-[#7a5612]",
  },
};

const INPUT_CLASS =
  "w-full min-h-[40px] px-3 bg-white border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15";

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

function ToggleRow({ id, label, description, checked, onChange, disabled = false }) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start justify-between gap-3 ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div>
        <div className="text-[13px] font-semibold text-[#1F2A27]">{label}</div>
        {description && (
          <p className="text-[11px] text-[#6B7773] mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <span className="relative inline-flex shrink-0 mt-0.5">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="w-9 h-5 rounded-full bg-[#E1E4E0] peer-checked:bg-[#2F6F5E] peer-focus-visible:ring-3 peer-focus-visible:ring-[#2F6F5E]/25 transition-colors"
        />
        <span
          aria-hidden="true"
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4"
        />
      </span>
    </label>
  );
}

export default function ReportAutoSendPanel({ onSaved }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [serverData, setServerData] = useState(null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState("weekly");
  const [digestTime, setDigestTime] = useState("07:00");
  const [digestWeekday, setDigestWeekday] = useState(1);
  const [digestDayOfMonth, setDigestDayOfMonth] = useState(1);
  const [saveToDrive, setSaveToDrive] = useState(true);

  const applyServerData = (data) => {
    setServerData(data);
    setIsEnabled(data.digestFrequency !== "off");
    setDigestFrequency(
      data.digestFrequency && data.digestFrequency !== "off"
        ? data.digestFrequency
        : "weekly"
    );
    setDigestTime(data.digestTime || "07:00");
    setDigestWeekday(Number(data.digestWeekday ?? 1));
    setDigestDayOfMonth(Number(data.digestDayOfMonth ?? 1));
    setSaveToDrive(data.saveToDrive !== false);
  };

  useEffect(() => {
    let cancelled = false;
    apiGetReportAutoSendSettings()
      .then((data) => {
        if (cancelled || !data) return;
        applyServerData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 404) {
          setLoadError(
            "Endpoint jadwal laporan belum tersedia di server backend yang terhubung (404). Pastikan deployment backend terbaru sudah aktif, atau arahkan NEXT_PUBLIC_API_URL ke backend lokal terbaru."
          );
          return;
        }
        setLoadError(err.message || "Gagal memuat pengaturan kirim laporan otomatis.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveFrequency = isEnabled ? digestFrequency : "off";
  const hasChanges = Boolean(
    serverData &&
      (effectiveFrequency !== serverData.digestFrequency ||
        digestTime !== serverData.digestTime ||
        Number(digestWeekday) !== Number(serverData.digestWeekday) ||
        Number(digestDayOfMonth) !== Number(serverData.digestDayOfMonth) ||
        Boolean(saveToDrive) !== Boolean(serverData.saveToDrive))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");
    setIsSaving(true);
    try {
      const updated = await apiUpdateReportAutoSendSettings({
        digestFrequency: effectiveFrequency,
        digestTime,
        digestWeekday: Number(digestWeekday),
        digestDayOfMonth: Number(digestDayOfMonth),
        saveToDrive: Boolean(saveToDrive),
      });
      applyServerData(updated);
      if (onSaved) {
        onSaved(
          updated.digestFrequency === "off"
            ? "Kirim laporan otomatis dimatikan."
            : `Jadwal laporan otomatis disimpan. Pengiriman berikutnya: ${formatWibDateTime(
                updated.nextRunAt
              )}.`
        );
      }
    } catch (err) {
      setSaveError(err.message || "Gagal menyimpan jadwal laporan otomatis.");
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
    <section
      aria-label="Kirim Laporan Otomatis"
      className="bg-white border border-[#E1E4E0] rounded-lg flex flex-col"
    >
      <div className="px-4 py-3 border-b border-[#E1E4E0]">
        <h2 className="text-sm font-semibold text-[#1F2A27]">
          Kirim Laporan Otomatis
        </h2>
        <p className="text-[11px] text-[#6B7773] mt-0.5">
          Laporan dikirim ke email owner sesuai jadwal (WIB).
        </p>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-sm text-[#6B7773]">
          Memuat pengaturan jadwal…
        </div>
      ) : loadError ? (
        <div className="p-4">
          <div className="p-3 border border-[#C4574F] bg-[#F8E8E6] text-[#8c322b] rounded-md text-xs leading-relaxed">
            {loadError}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5">
          {serverData?.emailConfigured === false && (
            <div
              role="alert"
              className="p-3 border border-[#D9A441] bg-[#FBF1DC] text-[#7a5612] rounded-md text-[11px] leading-relaxed"
            >
              <strong>Konfigurasi email belum aktif di server.</strong> Jadwal tetap
              disimpan, namun pengiriman membutuhkan <code>BREVO_API_KEY</code> atau{" "}
              <code>SMTP_USER</code>/<code>SMTP_PASS</code> di backend.
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

          <ToggleRow
            id="report-auto-email"
            label="Kirim ke email owner"
            description="Aktifkan untuk mengirim laporan berkala tanpa menekan tombol."
            checked={isEnabled}
            onChange={setIsEnabled}
          />

          {isEnabled && (
            <>
              <div
                role="group"
                aria-label="Frekuensi laporan otomatis"
                className="grid grid-cols-3 gap-2"
              >
                {FREQUENCY_OPTIONS.map((opt) => {
                  const active = digestFrequency === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDigestFrequency(opt.value)}
                      aria-pressed={active}
                      className={`px-2.5 py-2 rounded-md border text-left transition-colors cursor-pointer ${
                        active
                          ? "border-[#2F6F5E] bg-[#E6F0ED] text-[#1F2A27]"
                          : "border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] text-[#1F2A27]"
                      }`}
                    >
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-[#6B7773] mt-0.5">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {digestFrequency === "weekly" && (
                  <div>
                    <label
                      htmlFor="report-weekday"
                      className="block text-[11px] font-semibold text-[#6B7773] mb-1"
                    >
                      Hari
                    </label>
                    <select
                      id="report-weekday"
                      value={digestWeekday}
                      onChange={(e) => setDigestWeekday(Number(e.target.value))}
                      className={INPUT_CLASS}
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
                      htmlFor="report-dom"
                      className="block text-[11px] font-semibold text-[#6B7773] mb-1"
                    >
                      Tanggal
                    </label>
                    <select
                      id="report-dom"
                      value={digestDayOfMonth}
                      onChange={(e) => setDigestDayOfMonth(Number(e.target.value))}
                      className={INPUT_CLASS}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          Tanggal {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={digestFrequency === "daily" ? "col-span-2" : ""}>
                  <label
                    htmlFor="report-time"
                    className="block text-[11px] font-semibold text-[#6B7773] mb-1"
                  >
                    Jam Kirim (WIB)
                  </label>
                  <input
                    id="report-time"
                    type="time"
                    required
                    value={digestTime}
                    onChange={(e) => setDigestTime(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </>
          )}

          <ToggleRow
            id="report-auto-drive"
            label="Simpan ke Google Drive"
            description={
              serverData?.driveConfigured
                ? "Salinan PDF laporan otomatis ikut disimpan ke folder Drive owner."
                : "Belum tersedia: GDRIVE_WEBHOOK_URL belum diatur di backend."
            }
            checked={Boolean(saveToDrive) && Boolean(serverData?.driveConfigured)}
            onChange={setSaveToDrive}
            disabled={!serverData?.driveConfigured}
          />

          {serverData && (
            <div className="pt-3 border-t border-[#EEF0EC] flex flex-col gap-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6B7773]">Jadwal berikutnya</span>
                <span className="font-semibold text-[#1F2A27] text-right">
                  {serverData.digestFrequency === "off"
                    ? "Nonaktif"
                    : formatWibDateTime(serverData.nextRunAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6B7773]">Pengiriman terakhir</span>
                {lastStatusMeta ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${lastStatusMeta.badgeClass}`}
                  >
                    {lastStatusMeta.label}
                  </span>
                ) : (
                  <span className="text-[#6B7773]">Belum pernah berjalan</span>
                )}
              </div>
              {serverData.lastDigestSentAt && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B7773]">Waktu kirim terakhir</span>
                  <span className="text-[#1F2A27] text-right">
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

          <button
            type="submit"
            disabled={isSaving || !hasChanges}
            className="inline-flex items-center justify-center min-h-[40px] px-3.5 rounded-lg bg-[#2F6F5E] hover:bg-[#255a4c] text-[13px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Menyimpan…" : "Simpan Jadwal"}
          </button>
        </form>
      )}
    </section>
  );
}
