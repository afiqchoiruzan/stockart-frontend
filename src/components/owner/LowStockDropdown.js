"use client";

import { useState, useRef, useEffect } from "react";

export default function LowStockDropdown({ items = [], onSelectProduct }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside or pressing Escape
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
        className={`flex items-center gap-2 px-3 py-2 min-h-[44px] border-2 border-black rounded text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
          count > 0
            ? "bg-neutral-100 hover:bg-neutral-200 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            : "bg-white hover:bg-neutral-50 text-neutral-600"
        }`}
      >
        <span
          className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-xs font-black bg-white"
          aria-hidden="true"
        >
          !
        </span>
        <span>Low Stock ({count})</span>
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
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40 overflow-hidden"
        >
          <div className="p-3 border-b-2 border-black bg-neutral-100 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider">
              Alert Low Stock (Stok &le; 5)
            </span>
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 border border-black rounded bg-white">
              {count} Item
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-black/20">
            {count === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-500 italic">
                Semua stok produk aman (tidak ada di bawah batas).
              </div>
            ) : (
              items.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate text-black">
                      {prod.nama}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {prod.kategori} &bull;{" "}
                      <span className="font-mono font-bold text-black">
                        Stok: {prod.stok} !
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(prod);
                      setIsOpen(false);
                    }}
                    className="shrink-0 px-2.5 py-1.5 min-h-[36px] border border-black text-xs font-bold rounded bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    [Edit Stok]
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
