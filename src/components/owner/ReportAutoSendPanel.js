"use client";

import { useState, useEffect, useEffectEvent } from "react";
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

const INPUT_CLASS =
  "min-h-11 lg:min-h-[34px] max-w-full px-2.5 bg-white border border-[#E1E4E0] rounded-lg text-xs text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15";

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

function InlineSwitch({ id, label, checked, onChange, disabled = false, title }) {
  return (
    <label
      htmlFor={id}
      title={title}
      className={`inline-flex items-center gap-2 min-h-11 lg:min-h-0 text-[13px] font-semibold text-[#1F2A27] ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <span className="relative inline-flex shrink-0">
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
      {label}
    </label>
  );
}

export default function ReportAutoSendPanel({ onSaved, onSettingsLoaded }) {
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

  const notifySettingsLoaded = useEffectEvent((data) => {
    onSettingsLoaded?.(data);
  });

  useEffect(() => {
    let cancelled = false;
    apiGetReportAutoSendSettings()
      .then((data) => {
        if (cancelled || !data) return;
        applyServerData(data);
        notifySettingsLoaded(data);
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

  const lastFailed =
    serverData?.lastDigestStatus === "failed" ? serverData.lastDigestError : "";

  return (
    <section
      aria-label="Kirim Laporan Otomatis"
      className="bg-white border border-[#E1E4E0] rounded-lg px-4 py-3 flex flex-col gap-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
          <h2 className="text-sm font-semibold text-[#1F2A27]">
            Kirim Laporan Otomatis
          </h2>
          {serverData && (
            <span className="text-[11px] text-[#6B7773] break-all">
              Tujuan:{" "}
              <strong className="font-medium text-[#1F2A27]">
                {serverData.defaultRecipient || "Belum diatur (OWNER_EMAIL)"}
              </strong>
            </span>
          )}
        </div>
        {serverData && (
          <span className="text-[11px] text-[#6B7773]">
            {serverData.digestFrequency === "off" ? (
              "Nonaktif"
            ) : (
              <>
                Berikutnya:{" "}
                <span className="font-semibold text-[#1F2A27]">
                  {formatWibDateTime(serverData.nextRunAt)}
                </span>
              </>
            )}
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-[#6B7773]">Memuat pengaturan jadwal…</p>
      ) : loadError ? (
        <p role="alert" className="text-xs text-[#8c322b] leading-relaxed">
          {loadError}
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-x-3 gap-y-2.5"
        >
          <InlineSwitch
            id="report-auto-email"
            label="Email"
            checked={isEnabled}
            onChange={setIsEnabled}
          />

          {isEnabled && (
            <>
              <span aria-hidden="true" className="hidden sm:block h-5 w-px bg-[#E1E4E0]" />

              <div
                role="group"
                aria-label="Frekuensi laporan otomatis"
                className="flex w-full sm:inline-flex sm:w-auto p-0.5 bg-white border border-[#E1E4E0] rounded-lg"
              >
                {FREQUENCY_OPTIONS.map((opt) => {
                  const active = digestFrequency === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDigestFrequency(opt.value)}
                      aria-pressed={active}
                      title={opt.desc}
                      className={`flex-1 sm:flex-none min-h-10 lg:min-h-[30px] px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? "bg-[#E6F0ED] text-[#2F6F5E]"
                          : "text-[#6B7773] hover:bg-[#F5F6F4] hover:text-[#1F2A27]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {digestFrequency === "weekly" && (
                <>
                  <label htmlFor="report-weekday" className="sr-only">
                    Hari kirim
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
                </>
              )}

              {digestFrequency === "monthly" && (
                <>
                  <label htmlFor="report-dom" className="sr-only">
                    Tanggal kirim
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
                </>
              )}

              <label htmlFor="report-time" className="sr-only">
                Jam kirim (WIB)
              </label>
              <input
                id="report-time"
                type="time"
                required
                value={digestTime}
                onChange={(e) => setDigestTime(e.target.value)}
                className={INPUT_CLASS}
              />

              <InlineSwitch
                id="report-auto-drive"
                label="Google Drive"
                title={
                  serverData?.driveConfigured
                    ? "Salinan PDF laporan otomatis ikut disimpan ke folder Drive owner"
                    : "Belum tersedia: GDRIVE_WEBHOOK_URL belum diatur di backend"
                }
                checked={Boolean(saveToDrive) && Boolean(serverData?.driveConfigured)}
                onChange={setSaveToDrive}
                disabled={!serverData?.driveConfigured}
              />
            </>
          )}

          <button
            type="submit"
            disabled={isSaving || !hasChanges}
            className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center min-h-11 lg:min-h-[34px] px-3.5 rounded-lg bg-[#2F6F5E] hover:bg-[#255a4c] text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Menyimpan…" : "Simpan"}
          </button>
        </form>
      )}

      {serverData?.emailConfigured === false && (
        <p role="alert" className="text-[11px] text-[#7a5612]">
          Email belum dikonfigurasi di server, jadwal tersimpan tapi belum bisa mengirim.
        </p>
      )}

      {saveError && (
        <p role="alert" className="text-[11px] text-[#8c322b]">
          {saveError}
        </p>
      )}

      {lastFailed && (
        <p role="alert" className="text-[11px] text-[#8c322b]">
          Pengiriman terakhir gagal
          {serverData.lastDigestSentAt
            ? ` (terakhir berhasil ${formatWibDateTime(serverData.lastDigestSentAt)})`
            : ""}
          : {lastFailed}
        </p>
      )}
    </section>
  );
}
