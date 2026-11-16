"use client";

import { useState } from "react";

export default function SendReportPanel({ onSend, isSending = false }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSend(email.trim());
  };

  return (
    <section
      aria-label="Kirim Laporan"
      className="bg-white border border-[#E1E4E0] rounded-lg flex flex-col"
    >
      <div className="px-4 py-3 border-b border-[#E1E4E0]">
        <h2 className="text-sm font-semibold text-[#1F2A27]">Kirim Laporan</h2>
        <p className="text-[11px] text-[#6B7773] mt-0.5">
          Laporan periode ini dikirim ke email owner. Salinan disimpan ke
          Google Drive jika sudah diaktifkan di server.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-2.5">
        <label
          htmlFor="report-email"
          className="text-[11px] font-semibold text-[#6B7773]"
        >
          Email tujuan (opsional)
        </label>
        <input
          id="report-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Kosongkan untuk email owner default"
          className="w-full min-h-[40px] px-3.5 bg-white border border-[#E1E4E0] rounded-lg text-[13px] text-[#1F2A27] placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-3 focus:ring-[#2F6F5E]/15 transition-all"
        />
        <button
          type="submit"
          disabled={isSending}
          className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3.5 rounded-lg bg-[#2F6F5E] hover:bg-[#255a4c] text-[13px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
          {isSending ? "Mengirim laporan…" : "Kirim Laporan Sekarang"}
        </button>
      </form>
    </section>
  );
}
