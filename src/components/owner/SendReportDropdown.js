"use client";

import { useState, useRef, useEffect } from "react";

export default function SendReportDropdown({
  onSend,
  isSending = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sent = await onSend(email.trim());
    if (sent !== false) {
      setIsOpen(false);
      setEmail("");
    }
  };

  return (
    <div className="relative block w-full sm:inline-block sm:w-auto text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
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
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        Kirim Laporan
        <svg
          aria-hidden="true"
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="Kirim laporan sekarang"
          className="absolute left-0 right-0 sm:left-auto top-full mt-2 sm:w-72 max-w-[calc(100vw-2rem)] bg-white border border-[#E1E4E0] rounded-lg shadow-lg z-40 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-3.5 flex flex-col gap-2.5">
            <div>
              <p className="text-[13px] font-semibold text-[#1F2A27]">
                Kirim laporan periode ini
              </p>
              <p className="text-[11px] text-[#6B7773] mt-0.5">
                Salinan disimpan ke Google Drive jika sudah diaktifkan di server.
              </p>
            </div>
            <label htmlFor="report-email" className="sr-only">
              Email tujuan (opsional)
            </label>
            <input
              id="report-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email owner default"
              className="w-full min-h-11 lg:min-h-[40px] px-3 bg-white border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 transition-all"
            />
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center justify-center min-h-11 lg:min-h-[38px] px-3.5 rounded-lg bg-[#2F6F5E] hover:bg-[#255a4c] text-[13px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSending ? "Mengirim laporan…" : "Kirim Sekarang"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
