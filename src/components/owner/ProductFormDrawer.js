"use client";

import { useState, useEffect, useRef } from "react";
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

function DrawerFormInner({
  mode,
  initialData,
  availableCategories,
  isSubmitting,
  onSubmit,
  onDeactivate,
  onRestore,
  onPermanentDelete,
}) {
  const isEdit = mode === "edit" && Boolean(initialData);
  const currentStok = isEdit ? Math.max(0, Math.round(Number(initialData.stok ?? 0))) : 0;
  const currentSatuan = isEdit ? initialData.satuan || "pcs" : "pcs";

  const initialHargaJual =
    isEdit && (initialData.hargaJual ?? initialData.harga) !== undefined
      ? String(initialData.hargaJual ?? initialData.harga)
      : "";
  const initialHargaBeli =
    isEdit && initialData.hargaBeli !== undefined
      ? String(initialData.hargaBeli)
      : initialHargaJual !== ""
      ? String(Math.round(Number(initialHargaJual) * 0.85))
      : "";

  const [formData, setFormData] = useState({
    nama: isEdit ? initialData.nama || "" : "",
    kodeProduk: isEdit ? initialData.kodeProduk || "" : "",
    kategori: isEdit
      ? initialData.kategori || availableCategories[0] || "Sembako"
      : availableCategories[0] || "Sembako",
    satuan: currentSatuan,
    hargaBeli: initialHargaBeli,
    hargaJual: initialHargaJual,
    stok: isEdit && initialData.stok !== undefined ? String(initialData.stok) : "",
    stokMinimum:
      isEdit && initialData.stokMinimum !== undefined
        ? String(initialData.stokMinimum)
        : "5",
    deskripsi: isEdit ? initialData.deskripsi || "" : "",
  });

  // Unified stock editing state in Edit Mode:
  // "restock" = tambah stok (disimpan lewat PATCH /restock saat klik Simpan Perubahan)
  // "manual"  = ubah angka total stok langsung (disimpan lewat PUT saat klik Simpan Perubahan)
  const [stockMode, setStockMode] = useState("restock");
  const [restockQty, setRestockQty] = useState("0");

  const [errors, setErrors] = useState({});
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState(false);

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!formData.nama.trim()) {
      newErrors.nama = "Nama produk wajib diisi";
    }
    if (!formData.kategori.trim()) {
      newErrors.kategori = "Kategori wajib dipilih";
    }
    if (!formData.satuan.trim()) {
      newErrors.satuan = "Satuan wajib diisi";
    }
    const hargaBeliNum = Number(formData.hargaBeli);
    if (
      formData.hargaBeli === "" ||
      Number.isNaN(hargaBeliNum) ||
      hargaBeliNum < 0
    ) {
      newErrors.hargaBeli = "Harga beli harus angka >= 0";
    }
    const hargaJualNum = Number(formData.hargaJual);
    if (
      formData.hargaJual === "" ||
      Number.isNaN(hargaJualNum) ||
      hargaJualNum < 0
    ) {
      newErrors.hargaJual = "Harga jual harus angka >= 0";
    }

    if (!isEdit || stockMode === "manual") {
      const stokNum = Number(formData.stok);
      if (formData.stok === "" || Number.isNaN(stokNum) || stokNum < 0) {
        newErrors.stok = "Stok harus angka >= 0";
      }
    } else {
      const restockNum = Number(restockQty === "" ? 0 : restockQty);
      if (Number.isNaN(restockNum) || restockNum < 0) {
        newErrors.restockQty = "Jumlah tambah stok harus angka >= 0";
      }
    }

    const stokMinNum = Number(formData.stokMinimum);
    if (
      formData.stokMinimum === "" ||
      Number.isNaN(stokMinNum) ||
      stokMinNum < 0
    ) {
      newErrors.stokMinimum = "Stok minimum harus angka >= 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    const hargaJualRounded = Math.round(Number(formData.hargaJual));
    const parsedRestock = Math.max(0, Math.round(Number(restockQty || 0)));
    const parsedStok = Math.max(0, Math.round(Number(formData.stok || 0)));

    const submittedProduct = {
      ...(initialData || {}),
      nama: formData.nama.trim(),
      kodeProduk: formData.kodeProduk.trim().toUpperCase(),
      kategori: formData.kategori.trim(),
      satuan: formData.satuan.trim() || "pcs",
      hargaBeli: Math.round(Number(formData.hargaBeli)),
      hargaJual: hargaJualRounded,
      harga: hargaJualRounded,
      stok: isEdit && stockMode === "restock" ? currentStok : parsedStok,
      stokMinimum: Math.round(Number(formData.stokMinimum)),
      deskripsi: formData.deskripsi.trim(),
      aktif: isEdit ? initialData.aktif !== false : true,
      stockAction: isEdit
        ? {
            mode: stockMode,
            restockJumlah: stockMode === "restock" ? parsedRestock : 0,
            stokBaru: parsedStok,
          }
        : null,
    };

    onSubmit(submittedProduct, mode, initialData);
  };

  const handleAddRestockPreset = (delta) => {
    const current = Math.max(0, Math.round(Number(restockQty || 0)));
    setRestockQty(String(current + delta));
    if (errors.restockQty) {
      setErrors((prev) => ({ ...prev, restockQty: undefined }));
    }
  };

  const stagedRestockNum = Math.max(0, Math.round(Number(restockQty || 0)));
  const previewStokAfterRestock = currentStok + stagedRestockNum;
  const isAktif = !isEdit || initialData.aktif !== false;
  const isCurrentLowStock =
    isEdit &&
    isAktif &&
    currentStok <= Number(initialData.stokMinimum ?? 5);

  const submitText = isSubmitting
    ? "Menyimpan..."
    : mode === "edit"
    ? "Simpan Perubahan"
    : "Tambah Produk";

  return (
    <>
      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        {isEdit && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/20">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-[11px] font-mono font-bold border rounded ${
                  isAktif
                    ? "border-black bg-neutral-100 text-black"
                    : "border-red-600 bg-red-50 text-red-700"
                }`}
              >
                {isAktif ? "AKTIF" : "NONAKTIF"}
              </span>
              {isCurrentLowStock && (
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold border border-red-600 bg-red-50 text-red-700 rounded">
                  STOK MENIPIS
                </span>
              )}
            </div>
            {initialData.kodeProduk && (
              <span className="text-[11px] font-mono text-neutral-600">
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
          {/* Field: Nama */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-nama" className="text-sm font-bold text-black">
              Nama Produk
            </label>
            <input
              ref={firstInputRef}
              id="field-nama"
              type="text"
              value={formData.nama}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nama: e.target.value }))
              }
              placeholder="Contoh: Minyak Bimoli 2L"
              className="w-full min-h-[44px] px-3 py-2 border-2 border-black rounded text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            />
            {errors.nama && (
              <p className="text-xs text-red-700 font-semibold mt-0.5">
                ! {errors.nama}
              </p>
            )}
          </div>

          {/* Field: Kode Produk / SKU */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="field-kodeProduk"
              className="text-sm font-bold text-black"
            >
              Kode Produk / SKU{" "}
              {!isEdit && (
                <span className="font-normal text-xs text-neutral-600">
                  (opsional)
                </span>
              )}
            </label>
            <input
              id="field-kodeProduk"
              type="text"
              value={formData.kodeProduk}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  kodeProduk: e.target.value.toUpperCase(),
                }))
              }
              placeholder="Otomatis (PRD-...) jika kosong"
              className="w-full min-h-[44px] px-3 py-2 border-2 border-black rounded text-sm font-mono bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            />
          </div>

          {/* Field: Kategori & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="field-kategori"
                className="text-sm font-bold text-black"
              >
                Kategori
              </label>
              <div className="relative">
                <select
                  id="field-kategori"
                  value={formData.kategori}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, kategori: e.target.value }))
                  }
                  className="w-full min-h-[44px] px-3 py-2 pr-9 border-2 border-black rounded text-sm font-medium bg-white text-black appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black cursor-pointer"
                >
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-black font-mono text-xs"
                  aria-hidden="true"
                >
                  [v]
                </div>
              </div>
              {errors.kategori && (
                <p className="text-xs text-red-700 font-semibold mt-0.5">
                  ! {errors.kategori}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="field-satuan"
                className="text-sm font-bold text-black"
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
                className="w-full min-h-[44px] px-3 py-2 border-2 border-black rounded text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              />
              <datalist id="satuan-presets">
                {SATUAN_PRESETS.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
              {errors.satuan && (
                <p className="text-xs text-red-700 font-semibold mt-0.5">
                  ! {errors.satuan}
                </p>
              )}
            </div>
          </div>

          {/* Field: Harga Beli & Harga Jual */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="field-hargaBeli"
                className="text-sm font-bold text-black"
              >
                Harga Beli (Rp)
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
                placeholder="25000"
                className="w-full min-h-[44px] px-3 py-2 border-2 border-black rounded text-sm font-mono tabular-nums bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              />
              {errors.hargaBeli && (
                <p className="text-xs text-red-700 font-semibold mt-0.5">
                  ! {errors.hargaBeli}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="field-hargaJual"
                className="text-sm font-bold text-black"
              >
                Harga Jual (Rp)
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
                placeholder="34000"
                className="w-full min-h-[44px] px-3 py-2 border-2 border-black rounded text-sm font-mono tabular-nums bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              />
              {errors.hargaJual && (
                <p className="text-xs text-red-700 font-semibold mt-0.5">
                  ! {errors.hargaJual}
                </p>
              )}
            </div>
          </div>

          {/* Unified Stok Block */}
          {!isEdit ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="field-stok"
                  className="text-sm font-bold text-black"
                >
                  Stok Awal
                </label>
                <input
                  id="field-stok"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stok}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, stok: e.target.value }))
                  }
                  placeholder="10"
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-black rounded text-sm font-mono tabular-nums bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                />
                {errors.stok && (
                  <p className="text-xs text-red-700 font-semibold mt-0.5">
                    ! {errors.stok}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="field-stokMinimum"
                  className="text-sm font-bold text-black"
                >
                  Stok Minimum
                </label>
                <input
                  id="field-stokMinimum"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stokMinimum}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      stokMinimum: e.target.value,
                    }))
                  }
                  placeholder="5"
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-black rounded text-sm font-mono tabular-nums bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                />
                {errors.stokMinimum && (
                  <p className="text-xs text-red-700 font-semibold mt-0.5">
                    ! {errors.stokMinimum}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 border-2 border-black rounded bg-neutral-50 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-bold text-black">Stok</span>
                  <span className="ml-2 text-xs font-mono text-neutral-700">
                    Saat ini: <strong>{currentStok}</strong>{" "}
                    {formData.satuan || currentSatuan}
                  </span>
                </div>
                <div
                  role="tablist"
                  aria-label="Pilih cara ubah stok"
                  className="inline-flex border border-black rounded overflow-hidden bg-white"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={stockMode === "restock"}
                    onClick={() => setStockMode("restock")}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                      stockMode === "restock"
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-neutral-100"
                    }`}
                  >
                    + Tambah Stok
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={stockMode === "manual"}
                    onClick={() => setStockMode("manual")}
                    className={`px-2.5 py-1 text-[11px] font-bold border-l border-black transition-colors cursor-pointer ${
                      stockMode === "manual"
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-neutral-100"
                    }`}
                  >
                    Ubah Total
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-start">
                {stockMode === "restock" ? (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="field-restock-qty"
                      className="text-xs font-bold text-black"
                    >
                      Jumlah Masuk (+)
                    </label>
                    <input
                      id="field-restock-qty"
                      type="number"
                      min="0"
                      step="1"
                      value={restockQty}
                      onChange={(e) => {
                        setRestockQty(e.target.value);
                        if (errors.restockQty) {
                          setErrors((prev) => ({
                            ...prev,
                            restockQty: undefined,
                          }));
                        }
                      }}
                      placeholder="0"
                      className="w-full min-h-[42px] px-3 py-1.5 border-2 border-black rounded text-sm font-mono tabular-nums bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[5, 10, 20].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddRestockPreset(preset)}
                          className="px-2 py-0.5 text-[11px] font-mono font-bold border border-black rounded bg-white hover:bg-neutral-200 transition-colors cursor-pointer"
                        >
                          +{preset}
                        </button>
                      ))}
                      {stagedRestockNum > 0 && (
                        <button
                          type="button"
                          onClick={() => setRestockQty("0")}
                          className="px-1.5 py-0.5 text-[11px] text-neutral-600 underline hover:text-black cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    {errors.restockQty && (
                      <p className="text-xs text-red-700 font-semibold">
                        ! {errors.restockQty}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="field-stok"
                      className="text-xs font-bold text-black"
                    >
                      Total Stok Baru
                    </label>
                    <input
                      id="field-stok"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stok}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          stok: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="w-full min-h-[42px] px-3 py-1.5 border-2 border-black rounded text-sm font-mono tabular-nums bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    />
                    {errors.stok && (
                      <p className="text-xs text-red-700 font-semibold">
                        ! {errors.stok}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="field-stokMinimum"
                    className="text-xs font-bold text-black"
                  >
                    Stok Minimum
                  </label>
                  <input
                    id="field-stokMinimum"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stokMinimum}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stokMinimum: e.target.value,
                      }))
                    }
                    placeholder="5"
                    className="w-full min-h-[42px] px-3 py-1.5 border-2 border-black rounded text-sm font-mono tabular-nums bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  />
                  {errors.stokMinimum && (
                    <p className="text-xs text-red-700 font-semibold">
                      ! {errors.stokMinimum}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-neutral-700 leading-snug">
                {stockMode === "restock" ? (
                  stagedRestockNum > 0 ? (
                    <>
                      Hasil setelah klik <strong>Simpan Perubahan</strong>:{" "}
                      <strong className="font-mono text-black">
                        {currentStok} + {stagedRestockNum} ={" "}
                        {previewStokAfterRestock}{" "}
                        {formData.satuan || currentSatuan}
                      </strong>
                    </>
                  ) : (
                    "Isi jumlah masuk untuk menambah stok saat klik Simpan Perubahan."
                  )
                ) : (
                  "Mengganti total stok langsung saat klik Simpan Perubahan."
                )}
              </p>
            </div>
          )}

          {/* Field: Deskripsi */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="field-deskripsi"
              className="text-sm font-bold text-black"
            >
              Deskripsi{" "}
              <span className="font-normal text-xs text-neutral-600">
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
              className="w-full px-3 py-2 border-2 border-black rounded text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black resize-y"
            />
          </div>
        </form>

        {/* Simple Nonaktifkan / Aktifkan & Hapus Produk in Edit Mode */}
        {isEdit && (
          <div className="pt-3 border-t border-black/20 flex flex-col gap-2.5">
            {!confirmPermanentDelete ? (
              <div className="grid grid-cols-2 gap-2.5">
                {isAktif ? (
                  <button
                    type="button"
                    onClick={() => onDeactivate?.(initialData.id)}
                    disabled={isSubmitting}
                    className="min-h-[40px] px-3 py-2 border-2 border-black rounded bg-neutral-100 text-black font-bold text-xs hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    Nonaktifkan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRestore?.(initialData.id)}
                    disabled={isSubmitting}
                    className="min-h-[40px] px-3 py-2 border-2 border-black rounded bg-black text-white font-bold text-xs hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    Aktifkan
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setConfirmPermanentDelete(true)}
                  disabled={isSubmitting}
                  className="min-h-[40px] px-3 py-2 border-2 border-red-600 rounded bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  Hapus Produk
                </button>
              </div>
            ) : (
              <div className="p-3 border-2 border-red-600 rounded bg-red-50 flex flex-col gap-2">
                <p className="text-xs font-semibold text-red-800 leading-snug">
                  Hapus permanen &ldquo;{initialData.nama}&rdquo;? Data tidak
                  bisa dikembalikan.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmPermanentDelete(false)}
                    disabled={isSubmitting}
                    className="min-h-[36px] px-3 py-1.5 border border-black rounded bg-white text-black font-bold text-xs hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => onPermanentDelete?.(initialData.id)}
                    disabled={isSubmitting}
                    className="min-h-[36px] px-3 py-1.5 border border-red-700 rounded bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer with Submit Button */}
      <div className="p-4 border-t-2 border-black bg-white shrink-0">
        <button
          type="submit"
          form="product-drawer-form"
          disabled={isSubmitting}
          className="w-full min-h-[48px] px-4 py-2.5 bg-black text-white rounded font-bold text-sm tracking-wide hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          {submitText}
        </button>
      </div>
    </>
  );
}

export default function ProductFormDrawer({
  isOpen,
  mode = "add", // 'add' | 'edit'
  initialData = null,
  categories = [],
  isSubmitting = false,
  onClose,
  onSubmit,
  onDeactivate,
  onRestore,
  onPermanentDelete,
}) {
  // Handle Escape key
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

  const title = mode === "edit" ? "Edit Produk" : "Tambah Produk";

  // Key to force fresh initialization when editing different items or after fresh detail sync
  const formKey =
    mode === "edit" && initialData?.id
      ? `edit_${initialData.id}_${initialData.stok ?? ""}_${initialData.aktif ?? ""}_${initialData.updatedAt || ""}`
      : "add_new";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white border-l-2 border-black h-full flex flex-col justify-between shadow-[-6px_0px_0px_0px_rgba(0,0,0,1)] z-10">
        {/* Drawer Header */}
        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-neutral-100 shrink-0">
          <h2
            id="drawer-title"
            className="font-bold text-base tracking-tight text-black"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup formulir"
            className="min-h-[36px] min-w-[36px] border border-black rounded flex items-center justify-center font-bold text-sm bg-white hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            [X]
          </button>
        </div>

        {/* Dynamic Keyed Inner Form */}
        <DrawerFormInner
          key={formKey}
          mode={mode}
          initialData={initialData}
          availableCategories={availableCategories}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onDeactivate={onDeactivate}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </div>
    </div>
  );
}
