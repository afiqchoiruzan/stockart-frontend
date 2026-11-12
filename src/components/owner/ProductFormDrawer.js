"use client";

import { useState, useEffect, useRef } from "react";
import { CATEGORIES } from "@/lib/mockProducts";

function DrawerFormInner({
  mode,
  initialData,
  availableCategories,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    nama: mode === "edit" && initialData ? initialData.nama || "" : "",
    kategori: mode === "edit" && initialData ? initialData.kategori || "Sembako" : "Sembako",
    harga:
      mode === "edit" && initialData && initialData.harga !== undefined
        ? String(initialData.harga)
        : "",
    stok:
      mode === "edit" && initialData && initialData.stok !== undefined
        ? String(initialData.stok)
        : "",
  });

  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    // Focus first input on mount
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!formData.nama.trim()) {
      newErrors.nama = "Nama produk wajib diisi";
    }
    if (!formData.kategori) {
      newErrors.kategori = "Kategori wajib dipilih";
    }
    const hargaNum = Number(formData.harga);
    if (!formData.harga || isNaN(hargaNum) || hargaNum < 0) {
      newErrors.harga = "Harga harus berupa angka valid (>= 0)";
    }
    const stokNum = Number(formData.stok);
    if (formData.stok === "" || isNaN(stokNum) || stokNum < 0) {
      newErrors.stok = "Stok harus berupa angka valid (>= 0)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submittedProduct = {
      ...(initialData || {}),
      nama: formData.nama.trim(),
      kategori: formData.kategori,
      harga: Math.round(Number(formData.harga)),
      stok: Math.round(Number(formData.stok)),
    };

    onSubmit(submittedProduct, mode, initialData);
  };

  const submitText = mode === "edit" ? "Simpan Perubahan" : "Tambah Produk";

  return (
    <>
      <form
        id="product-drawer-form"
        onSubmit={handleSubmit}
        className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto"
      >
        {/* Field: Nama */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="field-nama" className="text-sm font-bold text-black">
            Nama:
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
            <p className="text-xs text-black font-semibold mt-0.5">
              ! {errors.nama}
            </p>
          )}
        </div>

        {/* Field: Kategori */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="field-kategori" className="text-sm font-bold text-black">
            Kategori:
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
            <p className="text-xs text-black font-semibold mt-0.5">
              ! {errors.kategori}
            </p>
          )}
        </div>

        {/* Field: Harga & Stok (Grid) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Field: Harga */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-harga" className="text-sm font-bold text-black">
              Harga (Rp):
            </label>
            <input
              id="field-harga"
              type="number"
              min="0"
              step="500"
              value={formData.harga}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, harga: e.target.value }))
              }
              placeholder="34000"
              className="w-full min-h-[44px] px-3 py-2 border-2 border-black rounded text-sm font-mono bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            />
            {errors.harga && (
              <p className="text-xs text-black font-semibold mt-0.5">
                ! {errors.harga}
              </p>
            )}
          </div>

          {/* Field: Stok */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-stok" className="text-sm font-bold text-black">
              Stok:
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
              placeholder="3"
              className="w-full min-h-[44px] px-3 py-2 border-2 border-black rounded text-sm font-mono bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            />
            {errors.stok && (
              <p className="text-xs text-black font-semibold mt-0.5">
                ! {errors.stok}
              </p>
            )}
          </div>
        </div>

        {/* Quick Helper Note for Low Stock */}
        <div className="mt-2 p-3 border border-black/30 rounded bg-neutral-50 text-xs text-neutral-700">
          <span className="font-bold">Info Lo-Fi:</span> Produk dengan stok &le; 5 otomatis ditandai peringatan tanda seru <code className="font-bold font-mono">!</code> dan masuk daftar Low Stock.
        </div>
      </form>

      {/* Drawer Footer with Submit Button */}
      <div className="p-4 border-t-2 border-black bg-white shrink-0">
        <button
          type="submit"
          form="product-drawer-form"
          className="w-full min-h-[48px] px-4 py-2.5 bg-black text-white rounded font-bold text-sm tracking-wide hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
  onClose,
  onSubmit,
}) {
  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Exclude 'Semua Kategori' from selection in form
  const availableCategories = CATEGORIES.filter((c) => c !== "Semua Kategori");
  const title = mode === "edit" ? "Form Edit Produk" : "Form Tambah Produk";

  // Key to force fresh initialization when editing different items or switching modes
  const formKey = mode === "edit" && initialData?.id ? `edit_${initialData.id}` : "add_new";

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
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white border-l-2 border-black h-full flex flex-col justify-between shadow-[-6px_0px_0px_0px_rgba(0,0,0,1)] z-10">
        {/* Drawer Header */}
        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-neutral-100 shrink-0">
          <h2 id="drawer-title" className="font-bold text-base tracking-tight text-black">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir"
            className="min-h-[36px] min-w-[36px] border border-black rounded flex items-center justify-center font-bold text-sm bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
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
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
