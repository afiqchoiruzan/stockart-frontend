"use client";

import { useState } from "react";
import { validateOptionalEmailInput } from "@/lib/emailValidation";

/**
 * Menampilkan email tujuan yang disensor bintang dan mengizinkan perubahan
 * permanen langsung dari UI (dengan tombol Simpan / Batal / Reset Default).
 */
export default function RecipientEmailRow({
  label = "Email Tujuan",
  maskedRecipient,
  isCustomRecipient = false,
  onSave,
  disabled = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  const hasFieldFromServer = maskedRecipient !== undefined;
  const displayText = !hasFieldFromServer
    ? "Default server (.env)"
    : maskedRecipient || "Belum diatur (OWNER_EMAIL di server)";
  const isMissing = hasFieldFromServer && !maskedRecipient;

  const commitSave = async (nextValue) => {
    setError("");
    setIsSaving(true);
    try {
      await onSave(nextValue);
      setIsEditing(false);
      setDraftEmail("");
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setError(err?.message || "Gagal menyimpan email tujuan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = async () => {
    const check = validateOptionalEmailInput(draftEmail);
    if (!check.valid) {
      setError(check.error);
      return;
    }
    await commitSave(check.value);
  };

  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-[#6B7773]">{label}:</span>
        <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
          <span
            className={`font-mono font-medium break-all ${
              isMissing ? "text-[#8c322b]" : "text-[#1F2A27]"
            }`}
          >
            {displayText}
          </span>
          {hasFieldFromServer && maskedRecipient && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                isCustomRecipient
                  ? "bg-[#E6F0ED] text-[#2F6F5E]"
                  : "bg-[#F5F6F4] text-[#6B7773]"
              }`}
            >
              {isCustomRecipient ? "Kustom" : "Default"}
            </span>
          )}
          {savedNotice && (
            <span className="text-[11px] font-medium text-[#2F6F5E]">
              Tersimpan
            </span>
          )}
          {!isEditing && typeof onSave === "function" && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setError("");
                setSavedNotice(false);
                setDraftEmail("");
                setIsEditing(true);
              }}
              className="min-h-8 lg:min-h-0 px-2 py-0.5 rounded border border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] hover:border-[#2F6F5E] text-[11px] font-semibold text-[#2F6F5E] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isMissing ? "Atur" : "Ubah"}
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="p-2.5 border border-[#E1E4E0] rounded-md bg-[#FAFBF9] flex flex-col gap-2">
          <input
            type="email"
            multiple
            autoComplete="email"
            value={draftEmail}
            onChange={(e) => {
              setDraftEmail(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveClick();
              }
            }}
            placeholder="Masukkan email tujuan baru (pisahkan koma jika >1)"
            aria-label={`Edit ${label.toLowerCase()}`}
            aria-invalid={Boolean(error)}
            className={`w-full min-h-10 lg:min-h-[34px] px-2.5 bg-white border rounded text-xs text-[#1F2A27] placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/15 ${
              error ? "border-[#C4574F]" : "border-[#E1E4E0]"
            }`}
          />
          <p className="text-[11px] text-[#6B7773] leading-snug">
            Disimpan permanen untuk pengiriman otomatis maupun manual. Kosongkan
            untuk kembali ke default server.
          </p>
          {error && (
            <p role="alert" className="text-[11px] text-[#8c322b]">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {isCustomRecipient && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => commitSave("")}
                className="mr-auto min-h-9 lg:min-h-[30px] px-2.5 rounded border border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] text-[11px] font-semibold text-[#6B7773] hover:text-[#1F2A27] transition-colors cursor-pointer disabled:opacity-50"
              >
                Reset Default
              </button>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsEditing(false);
                setError("");
                setDraftEmail("");
              }}
              className="min-h-9 lg:min-h-[30px] px-2.5 rounded border border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] text-[11px] font-semibold text-[#1F2A27] transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveClick}
              className="min-h-9 lg:min-h-[30px] px-3 rounded bg-[#2F6F5E] hover:bg-[#255a4c] text-[11px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Menyimpan…" : "Simpan Email"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
