"use client";

import { useState, useEffect } from "react";
import {
  apiCreateCashier,
  apiUpdateCashier,
  apiDeleteCashier,
} from "@/lib/api";

export default function CashierManageModal({
  open,
  onClose,
  cashiers = [],
  onRefreshCashiers,
}) {
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setErrorMsg("");
    setSuccessMsg("");
    setConfirmDeleteId(null);
    setEditingId(null);

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanNama = nama.trim();
    const cleanUsername = username.trim();

    if (!cleanNama || !cleanUsername || !password) {
      setErrorMsg("Nama, username, dan password wajib diisi.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      setErrorMsg(
        "Username harus 3–30 karakter dan hanya boleh huruf, angka, atau underscore (_)."
      );
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password minimal 8 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      await apiCreateCashier({
        nama: cleanNama,
        username: cleanUsername,
        password,
      });
      setNama("");
      setUsername("");
      setPassword("");
      setSuccessMsg(`Akun kasir "${cleanUsername}" berhasil ditambahkan.`);
      if (onRefreshCashiers) await onRefreshCashiers();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menambahkan akun kasir.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (kasir) => {
    setErrorMsg("");
    setSuccessMsg("");
    setConfirmDeleteId(null);
    setEditingId(kasir.id);
    setEditNama(kasir.nama || "");
    setEditUsername(kasir.username || "");
    setEditPassword("");
  };

  const handleSaveEdit = async (e, kasir) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanNama = editNama.trim();
    const cleanUsername = editUsername.trim();

    if (!cleanNama || !cleanUsername) {
      setErrorMsg("Nama dan username kasir wajib diisi.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      setErrorMsg(
        "Username harus 3–30 karakter dan hanya boleh huruf, angka, atau underscore (_)."
      );
      return;
    }
    if (editPassword && editPassword.length < 8) {
      setErrorMsg("Password baru minimal 8 karakter.");
      return;
    }

    setSavingEdit(true);
    try {
      const payload = { nama: cleanNama, username: cleanUsername };
      if (editPassword) payload.password = editPassword;
      await apiUpdateCashier(kasir.id, payload);
      setEditingId(null);
      setEditPassword("");
      setSuccessMsg(`Data akun "${cleanUsername}" berhasil diperbarui.`);
      if (onRefreshCashiers) await onRefreshCashiers();
    } catch (err) {
      setErrorMsg(err.message || "Gagal memperbarui data kasir.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (kasir) => {
    setErrorMsg("");
    setSuccessMsg("");
    setConfirmDeleteId(null);
    setTogglingId(kasir.id);
    const nextActive = kasir.aktif === false;
    try {
      await apiUpdateCashier(kasir.id, { aktif: nextActive });
      setSuccessMsg(
        nextActive
          ? `Akun "${kasir.username}" diaktifkan kembali.`
          : `Akun "${kasir.username}" dinonaktifkan. Riwayat transaksi lamanya tetap tersimpan.`
      );
      if (onRefreshCashiers) await onRefreshCashiers();
    } catch (err) {
      setErrorMsg(err.message || "Gagal mengubah status akun kasir.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (kasir) => {
    setErrorMsg("");
    setSuccessMsg("");
    setDeletingId(kasir.id);
    try {
      await apiDeleteCashier(kasir.id);
      setConfirmDeleteId(null);
      setSuccessMsg(`Akun kasir "${kasir.username}" berhasil dihapus permanen.`);
      if (onRefreshCashiers) await onRefreshCashiers();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menghapus akun kasir.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kelola-kasir-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white border border-[#E1E4E0] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E1E4E0] flex items-center justify-between gap-3">
          <div>
            <h2
              id="kelola-kasir-title"
              className="text-base font-bold text-[#1F2A27]"
            >
              Kelola Akun Kasir
            </h2>
            <p className="text-xs text-[#6B7773] mt-0.5">
              Tambah, ubah username/password, atau nonaktifkan kasir (riwayat tetap tersimpan).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal kelola kasir"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7773] hover:text-[#1F2A27] hover:bg-[#F5F6F4] transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5">
          {errorMsg && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-lg border border-[#EBC5C1] bg-[#F8E8E6] text-xs font-medium text-[#C4574F]"
            >
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div
              role="status"
              className="px-3.5 py-2.5 rounded-lg border border-[#B7D6CB] bg-[#E6F0ED] text-xs font-medium text-[#2F6F5E]"
            >
              {successMsg}
            </div>
          )}

          {/* Form Tambah Kasir */}
          <form
            onSubmit={handleCreate}
            className="p-4 rounded-lg border border-[#E1E4E0] bg-[#FAFBF9] flex flex-col gap-3"
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.04em] text-[#1F2A27]">
              Tambah Kasir Baru
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="kasir-nama"
                  className="text-xs font-medium text-[#1F2A27]"
                >
                  Nama Lengkap
                </label>
                <input
                  id="kasir-nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="mis. Budi Santoso"
                  className="h-10 sm:h-9 px-3 rounded-lg border border-[#E1E4E0] bg-white text-[13px] text-[#1F2A27] placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/15"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="kasir-username"
                  className="text-xs font-medium text-[#1F2A27]"
                >
                  Username
                </label>
                <input
                  id="kasir-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mis. kasir_budi"
                  autoComplete="off"
                  className="h-10 sm:h-9 px-3 rounded-lg border border-[#E1E4E0] bg-white text-[13px] font-mono text-[#1F2A27] placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/15"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="kasir-password"
                className="text-xs font-medium text-[#1F2A27]"
              >
                Password (min. 8 karakter)
              </label>
              <div className="relative">
                <input
                  id="kasir-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  className="w-full h-10 sm:h-9 pl-3 pr-14 rounded-lg border border-[#E1E4E0] bg-white text-[13px] text-[#1F2A27] placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#6B7773] hover:text-[#1F2A27] cursor-pointer"
                >
                  {showPassword ? "Tutup" : "Lihat"}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto h-10 sm:h-9 px-4 rounded-lg bg-[#2F6F5E] hover:bg-[#25594B] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {submitting ? "Menyimpan..." : "+ Tambah Kasir"}
              </button>
            </div>
          </form>

          {/* Daftar Akun Kasir */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.04em] text-[#6B7773]">
              Daftar Akun Kasir ({cashiers.length})
            </h3>

            {cashiers.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-[#E1E4E0] text-center text-xs text-[#6B7773]">
                Belum ada akun kasir terdaftar.
              </div>
            ) : (
              <ul className="divide-y divide-[#EEF0EC] border border-[#E1E4E0] rounded-lg overflow-hidden">
                {cashiers.map((k) => {
                  const isInactive = k.aktif === false;
                  const isEditing = editingId === k.id;
                  const isConfirming = confirmDeleteId === k.id;
                  const isDeleting = deletingId === k.id;
                  const isToggling = togglingId === k.id;

                  return (
                    <li
                      key={k.id}
                      className={`px-3.5 py-3 flex flex-col gap-2.5 ${
                        isInactive ? "bg-[#FAFBF9]" : "bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-[13px] font-semibold truncate ${
                                isInactive ? "text-[#6B7773]" : "text-[#1F2A27]"
                              }`}
                            >
                              {k.nama}
                            </span>
                            <span
                              className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isInactive
                                  ? "bg-[#EEF0EC] text-[#6B7773]"
                                  : "bg-[#E6F2EC] text-[#3E8E6A]"
                              }`}
                            >
                              {isInactive ? "Nonaktif" : "Aktif"}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[#6B7773] truncate mt-0.5">
                            @{k.username}
                          </div>
                        </div>

                        {isConfirming ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDelete(k)}
                              className="min-h-9 sm:min-h-7 px-2.5 rounded bg-[#C4574F] hover:bg-[#A9443D] disabled:opacity-60 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-9 sm:min-h-7 px-2.5 rounded border border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] text-[11px] font-medium text-[#6B7773] cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                isEditing ? setEditingId(null) : startEdit(k)
                              }
                              className="min-h-9 sm:min-h-7 px-2.5 rounded border border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] text-[11px] font-semibold text-[#1F2A27] transition-colors cursor-pointer"
                            >
                              {isEditing ? "Tutup" : "Edit"}
                            </button>
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleActive(k)}
                              className={`min-h-9 sm:min-h-7 px-2.5 rounded border text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
                                isInactive
                                  ? "border-[#B7D6CB] bg-[#E6F0ED] hover:bg-[#D5E8E2] text-[#2F6F5E]"
                                  : "border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309]"
                              }`}
                            >
                              {isToggling
                                ? "Memproses..."
                                : isInactive
                                ? "Aktifkan"
                                : "Nonaktifkan"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setConfirmDeleteId(k.id);
                              }}
                              className="min-h-9 sm:min-h-7 px-2.5 rounded border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[11px] font-semibold text-[#B91C1C] transition-colors cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Form Edit Inline */}
                      {isEditing && (
                        <form
                          onSubmit={(e) => handleSaveEdit(e, k)}
                          className="p-3 rounded-lg border border-[#E1E4E0] bg-[#FAFBF9] flex flex-col gap-2.5"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-medium text-[#1F2A27]">
                                Nama Lengkap
                              </label>
                              <input
                                type="text"
                                value={editNama}
                                onChange={(e) => setEditNama(e.target.value)}
                                className="h-9 sm:h-8 px-2.5 rounded border border-[#E1E4E0] bg-white text-xs text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E]"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-medium text-[#1F2A27]">
                                Username
                              </label>
                              <input
                                type="text"
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                                className="h-9 sm:h-8 px-2.5 rounded border border-[#E1E4E0] bg-white text-xs font-mono text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E]"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-[#1F2A27]">
                              Password Baru (opsional, kosongkan jika tidak diubah)
                            </label>
                            <input
                              type="password"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="Minimal 8 karakter jika diisi"
                              autoComplete="new-password"
                              className="h-9 sm:h-8 px-2.5 rounded border border-[#E1E4E0] bg-white text-xs text-[#1F2A27] focus:outline-none focus:border-[#2F6F5E]"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="min-h-8 px-3 rounded border border-[#E1E4E0] bg-white text-[11px] font-medium text-[#6B7773] cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={savingEdit}
                              className="min-h-8 px-3 rounded bg-[#2F6F5E] hover:bg-[#25594B] disabled:opacity-60 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                          </div>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
