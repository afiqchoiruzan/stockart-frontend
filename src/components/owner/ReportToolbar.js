"use client";

export const REPORT_PERIODS = [
  { value: "harian", label: "Harian" },
  { value: "mingguan", label: "Mingguan" },
  { value: "bulanan", label: "Bulanan" },
];

export default function ReportToolbar({
  period,
  onPeriodChange,
  periodLabel,
  onDownloadPdf,
  isDownloadDisabled = false,
  isDownloading = false,
  actions = null,
}) {
  return (
    <div className="w-full flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Pilihan Periode Laporan */}
        <div
          role="group"
          aria-label="Periode laporan"
          className="flex w-full sm:inline-flex sm:w-auto p-1 bg-white border border-[#E1E4E0] rounded-lg"
        >
          {REPORT_PERIODS.map((item) => {
            const isActive = period === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onPeriodChange(item.value)}
                aria-pressed={isActive}
                className={`flex-1 sm:flex-none min-h-10 lg:min-h-[32px] px-3.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#2F6F5E] text-white"
                    : "text-[#6B7773] hover:bg-[#F5F6F4] hover:text-[#1F2A27]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F0ED] text-[#2F6F5E] border border-[#2F6F5E]/25">
          Periode: {periodLabel}
        </span>
      </div>

      {/* Aksi: Kirim Laporan & Unduh PDF */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
        {actions}

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isDownloadDisabled || isDownloading}
          className="w-full sm:w-auto justify-center inline-flex items-center gap-2 min-h-11 lg:min-h-[40px] px-3.5 bg-white border border-[#E1E4E0] rounded-lg text-[13px] font-semibold text-[#1F2A27] hover:border-[#2F6F5E] hover:text-[#2F6F5E] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          {isDownloading ? "Menyiapkan PDF…" : "Unduh PDF"}
        </button>
      </div>
    </div>
  );
}
