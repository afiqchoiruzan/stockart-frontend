"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { CATEGORIES } from "@/lib/mockProducts";

const SATUAN_PRESETS = [
  "pcs",
  "botol",
  "pack",
  "renteng",
  "kg",
  "liter",
  "sak",
  "pouch",
  "roll",
  "dus",
];

function buildInitialFormState(isEdit, initialData, availableCategories) {
  if (!isEdit || !initialData) {
    return {
      nama: "",
      kodeProduk: "",
      kategori: availableCategories[0] || "Sembako",
      satuan: "pcs",
      hargaBeli: "",
      hargaJual: "",
      stok: "",
      stokMinimum: "5",
      deskripsi: "",
    };
  }

  const hargaJualRaw = initialData.hargaJual ?? initialData.harga;
  const hargaJualStr = hargaJualRaw !== undefined ? String(hargaJualRaw) : "";
  const hargaBeliStr =
    initialData.hargaBeli !== undefined
      ? String(initialData.hargaBeli)
      : hargaJualStr !== ""
      ? String(Math.round(Number(hargaJualStr) * 0.85))
      : "";

  return {
    nama: initialData.nama || "",
    kodeProduk: initialData.kodeProduk || "",
    kategori: initialData.kategori || availableCategories[0] || "Sembako",
    satuan: initialData.satuan || "pcs",
    hargaBeli: hargaBeliStr,
    hargaJual: hargaJualStr,
    stok: initialData.stok !== undefined ? String(initialData.stok) : "0",
    stokMinimum:
      initialData.stokMinimum !== undefined
        ? String(initialData.stokMinimum)
        : "5",
    deskripsi: initialData.deskripsi || "",
  };
}

function normalizeNumField(value) {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : Math.round(num);
}

function hasFormChanged(current, baseline) {
  return (
    current.nama.trim() !== baseline.nama.trim() ||
    current.kodeProduk.trim().toUpperCase() !== baseline.kodeProduk.trim().toUpperCase() ||
    current.kategori.trim() !== baseline.kategori.trim() ||
    current.satuan.trim() !== baseline.satuan.trim() ||
    normalizeNumField(current.hargaBeli) !== normalizeNumField(baseline.hargaBeli) ||
    normalizeNumField(current.hargaJual) !== normalizeNumField(baseline.hargaJual) ||
    normalizeNumField(current.stok) !== normalizeNumField(baseline.stok) ||
    normalizeNumField(current.stokMinimum) !== normalizeNumField(baseline.stokMinimum) ||
    current.deskripsi.trim() !== baseline.deskripsi.trim()
  );
}

function DrawerFormInner({
  mode,
  initialData,
  availableCategories,
  isSubmitting,
  onClose,
  onSubmit,
  onDeactivate,
  onRestore,
  onPermanentDelete,
}) {
  const isEdit = mode === "edit" && Boolean(initialData);
  const initialFormSnapshot = useMemo(
    () => buildInitialFormState(isEdit, initialData, availableCategories),
    [isEdit, initialData, availableCategories]
  );

  const [formData, setFormData] = useState(initialFormSnapshot);
  const [errors, setErrors] = useState({});
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState(false);

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const hasChanges = isEdit ? hasFormChanged(formData, initialFormSnapshot) : true;
  const isSaveDisabled = isSubmitting || (isEdit && !hasChanges);

  const currentStok = isEdit
    ? Math.max(0, Math.round(Number(initialData.stok ?? 0)))
    : 0;
  const parsedFormStok =
    formData.stok === "" || Number.isNaN(Number(formData.stok))
      ? null
      : Math.max(0, Math.round(Number(formData.stok)));
  const stokDelta =
    isEdit && parsedFormStok !== null ? parsedFormStok - currentStok : 0;

  const validate = () => {
    const newErrors = {};
    if (!formData.nama.trim()) {
      newErrors.nama = "Nama produk wajib diisi.";
    }
    if (!isEdit && !formData.kodeProduk.trim()) {
      newErrors.kodeProduk = "Kode produk wajib diisi.";
    }
    if (!formData.kategori.trim()) {
      newErrors.kategori = "Kategori wajib dipilih.";
    }
    if (!formData.satuan.trim()) {
      newErrors.satuan = "Satuan wajib diisi.";
    }
    const hargaBeliNum = Number(formData.hargaBeli);
    if (
      formData.hargaBeli === "" ||
      Number.isNaN(hargaBeliNum) ||
      hargaBeliNum < 0
    ) {
      newErrors.hargaBeli = "Harga beli harus angka >= 0.";
    }
    const hargaJualNum = Number(formData.hargaJual);
    if (
      formData.hargaJual === "" ||
      Number.isNaN(hargaJualNum) ||
      hargaJualNum <= 0
    ) {
      newErrors.hargaJual = "Harga jual harus lebih dari 0.";
    }
    const stokNum = Number(formData.stok);
    if (formData.stok === "" || Number.isNaN(stokNum) || stokNum < 0) {
      newErrors.stok = "Isi jumlah stok, boleh 0.";
    }
    const stokMinNum = Number(formData.stokMinimum);
    if (
      formData.stokMinimum === "" ||
      Number.isNaN(stokMinNum) ||
      stokMinNum < 0
    ) {
      newErrors.stokMinimum = "Isi batas stok menipis.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaveDisabled || !validate()) return;

    const hargaJualRounded = Math.round(Number(formData.hargaJual));
    const submittedProduct = {
      ...(initialData || {}),
      nama: formData.nama.trim(),
      kodeProduk: (isEdit ? initialData.kodeProduk || "" : formData.kodeProduk)
        .trim()
        .toUpperCase(),
      kategori: formData.kategori.trim(),
      satuan: formData.satuan.trim() || "pcs",
      hargaBeli: Math.round(Number(formData.hargaBeli)),
      hargaJual: hargaJualRounded,
      harga: hargaJualRounded,
      stok: Math.max(0, Math.round(Number(formData.stok))),
      stokMinimum: Math.max(0, Math.round(Number(formData.stokMinimum))),
      deskripsi: formData.deskripsi.trim(),
      aktif: isEdit ? initialData.aktif !== false : true,
    };

    onSubmit(submittedProduct, mode, initialData);
  };

  const handleAddStockChip = (delta) => {
    setFormData((prev) => {
      const base =
        prev.stok === "" || Number.isNaN(Number(prev.stok))
          ? 0
          : Math.max(0, Math.round(Number(prev.stok)));
      return { ...prev, stok: String(base + delta) };
    });
    if (errors.stok) {
      setErrors((prev) => ({ ...prev, stok: undefined }));
    }
  };

  const isAktif = !isEdit || initialData.aktif !== false;
  const isCurrentLowStock =
    isEdit &&
    isAktif &&
    currentStok <= Number(initialData.stokMinimum ?? 5);

  const submitText = isSubmitting
    ? "Menyimpan..."
    : mode === "edit"
    ? "Simpan"
    : "Simpan";

  return (
    <>
      <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
        {isEdit && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E1E4E0]">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isAktif
                    ? "bg-[#E6F2EC] text-[#3E8E6A]"
                    : "bg-[#F8E8E6] text-[#C4574F]"
                }`}
              >
                {isAktif ? "Aktif" : "Nonaktif"}
              </span>
              {isCurrentLowStock && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBF1DC] text-[#D9A441]">
                  Stok menipis
                </span>
              )}
            </div>
            {initialData.kodeProduk && (
              <span className="text-xs font-mono text-[#6B7773]">
                SKU: {initialData.kodeProduk}
              </span>
            )}
          </div>
        )}

        <form
          id="product-drawer-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {/* Nama Produk */}
          <div className="flex flex-col gap-1">
            <label htmlFor="field-nama" className="text-sm font-medium text-[#1F2A27]">
              Nama produk
            </label>
            <input
              ref={firstInputRef}
              id="field-nama"
              type="text"
              value={formData.nama}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nama: e.target.value }))
              }
              placeholder="Contoh: Minyak Goreng 1 L"
              className="w-full min-h-[44px] px-4 border border-[#E1E4E0] rounded-md text-sm bg-white focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E]"
            />
            {errors.nama && (
              <span className="text-xs text-[#C4574F]">{errors.nama}</span>
            )}
          </div>

          {/* Kode Produk / SKU */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="field-kodeProduk"
              className="text-sm font-medium text-[#1F2A27]"
            >
              Kode produk
              {isEdit && (
                <span className="font-normal text-xs text-[#6B7773]">
                  {" "}(tidak dapat diubah)
                </span>
              )}
            </label>
            <input
              id="field-kodeProduk"
              type="text"
              value={formData.kodeProduk}
              readOnly={isEdit}
              disabled={isEdit}
              onChange={(e) => {
                if (isEdit) return;
                setFormData((prev) => ({
                  ...prev,
                  kodeProduk: e.target.value.toUpperCase(),
                }));
                if (errors.kodeProduk) {
                  setErrors((prev) => ({ ...prev, kodeProduk: undefined }));
                }
              }}
              placeholder="Contoh: SM001"
              className={`w-full min-h-[44px] px-4 border border-[#E1E4E0] rounded-md text-sm font-mono ${
                isEdit
                  ? "bg-[#F5F6F4] text-[#6B7773] cursor-not-allowed"
                  : "bg-white focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E]"
              }`}
            />
            {errors.kodeProduk && (
              <span className="text-xs text-[#C4574F]">{errors.kodeProduk}</span>
            )}
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="field-kategori"
                className="text-sm font-medium text-[#1F2A27]"
              >
                Kategori
              </label>
              <select
                id="field-kategori"
                value={formData.kategori}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, kategori: e.target.value }))
                }
                className="w-full min-h-[44px] px-4 border border-[#E1E4E0] rounded-md text-sm bg-white text-[#1F2A27] focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E] cursor-pointer"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.kategori && (
                <span className="text-xs text-[#C4574F]">{errors.kategori}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="field-satuan"
                className="text-sm font-medium text-[#1F2A27]"
              >
                Satuan
              </label>
              <input
                id="field-satuan"
                type="text"
                list="satuan-presets"
                value={formData.satuan}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, satuan: e.target.value }))
                }
                placeholder="pcs"
                className="w-full min-h-[44px] px-4 border border-[#E1E4E0] rounded-md text-sm bg-white focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E]"
              />
              <datalist id="satuan-presets">
                {SATUAN_PRESETS.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
              {errors.satuan && (
                <span className="text-xs text-[#C4574F]">{errors.satuan}</span>
              )}
            </div>
          </div>

          {/* Harga Beli & Harga Jual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="field-hargaBeli"
                className="text-sm font-medium text-[#1F2A27]"
              >
                Harga beli (Rp)
              </label>
              <input
                id="field-hargaBeli"
                type="number"
                min="0"
                step="100"
                value={formData.hargaBeli}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hargaBeli: e.target.value }))
                }
                placeholder="15000"
                className="w-full min-h-[44px] px-4 border border-[#E1E4E0] rounded-md text-sm text-right font-semibold tabular-nums bg-white focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E]"
              />
              {errors.hargaBeli && (
                <span className="text-xs text-[#C4574F]">{errors.hargaBeli}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="field-hargaJual"
                className="text-sm font-medium text-[#1F2A27]"
              >
                Harga jual (Rp)
              </label>
              <input
                id="field-hargaJual"
                type="number"
                min="0"
                step="100"
                value={formData.hargaJual}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hargaJual: e.target.value }))
                }
                placeholder="18000"
                className="w-full min-h-[44px] px-4 border border-[#E1E4E0] rounded-md text-sm text-right font-semibold tabular-nums bg-white focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E]"
              />
              {errors.hargaJual && (
                <span className="text-xs text-[#C4574F]">{errors.hargaJual}</span>
              )}
            </div>
          </div>

          {/* Stok + Chips & Batas Stok Menipis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="flex flex-col gap-1">
              <label htmlFor="field-stok" className="text-sm font-medium text-[#1F2A27]">
                Stok
              </label>
              <input
                id="field-stok"
                type="number"
                min="0"
                step="1"
                value={formData.stok}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E") {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== "" && Number(val) < 0) return;
                  setFormData((prev) => ({ ...prev, stok: val }));
                }}
                placeholder="10"
                className="w-full min-h-[44px] px-4 border border-[#E1E4E0] rounded-md text-sm text-right font-semibold tabular-nums bg-white focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E]"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[5, 10, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddStockChip(preset)}
                    className="px-2.5 py-1 text-xs font-semibold border border-[#E1E4E0] rounded-md bg-[#F5F6F4] text-[#2F6F5E] hover:bg-[#E6F0ED] hover:border-[#2F6F5E] transition-colors cursor-pointer"
                  >
                    +{preset}
                  </button>
                ))}
                {isEdit && stokDelta !== 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        stok: String(currentStok),
                      }))
                    }
                    className="px-1.5 py-0.5 text-xs text-[#6B7773] underline hover:text-[#1F2A27] cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              {isEdit && stokDelta !== 0 && parsedFormStok !== null && (
                <p className="text-xs text-[#2F6F5E] font-medium">
                  {currentStok} {stokDelta > 0 ? `+ ${stokDelta}` : `- ${Math.abs(stokDelta)}`}{" "}
                  &rarr; <strong>{parsedFormStok}</strong>{" "}
                  {formData.satuan || "pcs"}
                </p>
              )}
              {errors.stok && (
                <span className="text-xs text-[#C4574F]">{errors.stok}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="field-stokMinimum"
                className="text-sm font-medium text-[#1F2A27]"
              >
                Batas stok menipis
              </label>
              <input
                id="field-stokMinimum"
                type="number"
                min="0"
                step="1"
                value={formData.stokMinimum}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E") {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== "" && Number(val) < 0) return;
                  setFormData((prev) => ({
                    ...prev,
                    stokMinimum: val,
                  }));
                }}
                placeholder="5"
                className="w-full min-h-[44px] px-4 border border-[#E1E4E0] rounded-md text-sm text-right font-semibold tabular-nums bg-white focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E]"
              />
              <span className="text-xs text-[#6B7773]">
                Pengingat dikirim ke email saat stok sama atau di bawah angka ini.
              </span>
              {errors.stokMinimum && (
                <span className="text-xs text-[#C4574F]">{errors.stokMinimum}</span>
              )}
            </div>
          </div>

          {/* Deskripsi */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="field-deskripsi"
              className="text-sm font-medium text-[#1F2A27]"
            >
              Deskripsi{" "}
              <span className="font-normal text-xs text-[#6B7773]">
                (opsional)
              </span>
            </label>
            <textarea
              id="field-deskripsi"
              rows={2}
              value={formData.deskripsi}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deskripsi: e.target.value }))
              }
              placeholder="Catatan kemasan, varian, atau rak..."
              className="w-full px-4 py-2 border border-[#E1E4E0] rounded-md text-sm bg-white focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E] resize-y"
            />
          </div>
        </form>

        {/* Nonaktifkan / Aktifkan & Hapus Produk in Edit Mode */}
        {isEdit && (
          <div className="pt-3 border-t border-[#E1E4E0] flex flex-col gap-2.5">
            {!confirmPermanentDelete ? (
              <div className="grid grid-cols-2 gap-2.5">
                {isAktif ? (
                  <button
                    type="button"
                    onClick={() => onDeactivate?.(initialData.id)}
                    disabled={isSubmitting}
                    className="min-h-[40px] px-3 py-2 border border-[#E1E4E0] rounded-md bg-white text-[#1F2A27] font-semibold text-xs hover:bg-[#F5F6F4] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Nonaktifkan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRestore?.(initialData.id)}
                    disabled={isSubmitting}
                    className="min-h-[40px] px-3 py-2 border border-[#2F6F5E] rounded-md bg-[#E6F0ED] text-[#2F6F5E] font-semibold text-xs hover:bg-[#d5e6e1] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Aktifkan kembali
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setConfirmPermanentDelete(true)}
                  disabled={isSubmitting}
                  className="min-h-[40px] px-3 py-2 border border-[#C4574F] rounded-md bg-white text-[#C4574F] font-semibold text-xs hover:bg-[#F8E8E6] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hapus produk
                </button>
              </div>
            ) : (
              <div className="p-3.5 border border-[#C4574F] rounded-md bg-[#F8E8E6] flex flex-col gap-2.5">
                <p className="text-xs font-medium text-[#1F2A27] leading-snug">
                  Hapus permanen <strong>&ldquo;{initialData.nama}&rdquo;</strong>? Data tidak
                  bisa dikembalikan.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmPermanentDelete(false)}
                    disabled={isSubmitting}
                    className="min-h-[36px] px-3 py-1.5 border border-[#E1E4E0] rounded-md bg-white text-[#1F2A27] font-semibold text-xs hover:bg-[#F5F6F4] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => onPermanentDelete?.(initialData.id)}
                    disabled={isSubmitting}
                    className="min-h-[36px] px-3 py-1.5 border border-[#C4574F] rounded-md bg-[#C4574F] text-white font-semibold text-xs hover:bg-[#a9453e] transition-colors cursor-pointer"
                  >
                    Ya, hapus produk
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Modal/Drawer */}
      <div className="p-4 border-t border-[#E1E4E0] bg-white flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="min-h-[44px] px-4 border border-[#E1E4E0] rounded-md bg-white hover:bg-[#F5F6F4] text-sm font-semibold text-[#1F2A27] transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          form="product-drawer-form"
          disabled={isSaveDisabled}
          className="min-h-[44px] px-5 rounded-md bg-[#2F6F5E] hover:bg-[#255a4c] text-white text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>{submitText}</span>
        </button>
      </div>
    </>
  );
}

export default function ProductFormDrawer({
  isOpen,
  mode = "add",
  initialData = null,
  categories = [],
  isSubmitting = false,
  onClose,
  onSubmit,
  onDeactivate,
  onRestore,
  onPermanentDelete,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const baseCategories =
    categories.length > 0
      ? categories
      : CATEGORIES.filter((c) => c !== "Semua Kategori");
  const categorySet = new Set(baseCategories);
  if (initialData?.kategori) {
    categorySet.add(initialData.kategori);
  }
  const availableCategories = Array.from(categorySet);

  const title = mode === "edit" ? "Edit produk" : "Tambah produk";

  const formKey =
    mode === "edit" && initialData?.id
      ? `edit_${initialData.id}_${initialData.stok ?? ""}_${initialData.aktif ?? ""}_${initialData.updatedAt || ""}`
      : "add_new";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 grid place-items-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F2A27]/45 transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal / Drawer Panel (Sesuai Hi-Fi stockart-pos.html) */}
      <div className="relative w-full max-w-[480px] max-h-[calc(100vh-32px)] bg-white border border-[#E1E4E0] rounded-lg flex flex-col justify-between shadow-xl z-10 overflow-hidden">
        <div className="p-4 border-b border-[#E1E4E0] flex items-center justify-between bg-white shrink-0">
          <h2 id="drawer-title" className="font-semibold text-sm text-[#1F2A27]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup formulir"
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

        <DrawerFormInner
          key={formKey}
          mode={mode}
          initialData={initialData}
          availableCategories={availableCategories}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={onSubmit}
          onDeactivate={onDeactivate}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </div>
    </div>
  );
}
