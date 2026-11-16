"use client";

import { useState, useRef, useEffect } from "react";

export default function LowStockDropdown({
  items = [],
  onSelectProduct,
  onOpenScheduleSettings,
}) {
  const [isOpen, setIsOpen] = useState(false);
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

  const count = items.length;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Peringatan stok menipis: ${count} produk`}
        className={`flex items-center gap-2 px-3.5 min-h-[44px] border rounded-md text-sm font-semibold transition-colors cursor-pointer ${
          count > 0
            ? "border-[#D9A441] bg-[#FBF1DC] hover:bg-[#f7e8c8] text-[#1F2A27]"
            : "border-[#E1E4E0] bg-white hover:bg-[#F5F6F4] text-[#6B7773]"
        }`}
      >
        <svg
          aria-hidden="true"
          className={`w-4 h-4 stroke-current ${
            count > 0 ? "text-[#D9A441]" : "text-[#6B7773]"
          }`}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        <span>Perlu Restock ({count})</span>
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

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="region"
          aria-label="Daftar Produk Stok Menipis"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-[#E1E4E0] rounded-lg shadow-lg z-40 overflow-hidden"
        >
          <div className="p-3.5 border-b border-[#E1E4E0] bg-[#F5F6F4] flex items-center justify-between">
            <span className="font-semibold text-xs text-[#1F2A27]">
              Peringatan Stok Menipis (&le; Min. Stok)
            </span>
            <span
              className={`inline-flex items-center gap-1.5 min-h-[22px] px-2 rounded-md text-xs font-semibold ${
                count > 0
                  ? "bg-[#F8E8E6] text-[#8c322b]"
                  : "bg-white text-[#6B7773]"
              }`}
            >
              {count} Item
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-[#E1E4E0]">
            {count === 0 ? (
              <div className="p-4 text-center text-sm text-[#6B7773]">
                Semua stok produk aman (tidak ada di bawah batas).
              </div>
            ) : (
              items.map((prod) => {
                const isZero = Number(prod.stok) <= 0;
                return (
                  <div
                    key={prod.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#F5F6F4] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-[#1F2A27]">
                        {prod.nama}
                      </p>
                      <p className="text-xs text-[#6B7773] mt-0.5">
                        {prod.kategori} &middot;{" "}
                        <span
                          className={`font-semibold ${
                            isZero ? "text-[#C4574F]" : "text-[#7a5612]"
                          }`}
                        >
                          Stok: {prod.stok} {prod.satuan || "pcs"}
                        </span>{" "}
                        <span>(Min: {prod.stokMinimum ?? 0})</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectProduct) onSelectProduct(prod);
                        setIsOpen(false);
                      }}
                      className="shrink-0 px-3 min-h-[34px] border border-[#E1E4E0] text-xs font-semibold rounded-md bg-white hover:bg-[#E6F0ED] hover:border-[#2F6F5E] hover:text-[#2F6F5E] transition-colors cursor-pointer"
                    >
                      Edit Stok
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {typeof onOpenScheduleSettings === "function" && (
            <div className="p-3.5 border-t border-[#E1E4E0] bg-[#F5F6F4] flex items-center justify-start">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenScheduleSettings();
                }}
                className="shrink-0 px-3 min-h-[34px] border border-[#E1E4E0] bg-white hover:bg-[#E6F0ED] hover:border-[#2F6F5E] hover:text-[#2F6F5E] rounded-md text-xs font-semibold text-[#1F2A27] transition-colors cursor-pointer"
              >
                Atur Jadwal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
