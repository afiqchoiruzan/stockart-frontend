"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  {
    name: "Produk",
    href: "/owner/produk",
    icon: (
      <svg
        aria-hidden="true"
        className="w-4 h-4 stroke-current shrink-0"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    name: "Transaksi",
    href: "/owner/transaksi",
    icon: (
      <svg
        aria-hidden="true"
        className="w-4 h-4 stroke-current shrink-0"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 17.5v-11" />
      </svg>
    ),
  },
  {
    name: "Laporan",
    href: "/owner/laporan",
    icon: (
      <svg
        aria-hidden="true"
        className="w-4 h-4 stroke-current shrink-0"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
  },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2 font-bold text-[#2F6F5E] px-1 pt-0.5">
      <svg
        aria-hidden="true"
        className="w-4 h-4 stroke-current shrink-0"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
      </svg>
      <span>Stockart</span>
    </div>
  );
}

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Menu utama">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/owner" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex items-center gap-2.5 px-4 min-h-[44px] rounded-md text-sm transition-colors ${
              isActive
                ? "bg-[#E6F0ED] text-[#2F6F5E] font-semibold"
                : "text-[#1F2A27] font-medium hover:bg-[#F5F6F4]"
            }`}
          >
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-xs bg-[#E0A458]"
              />
            )}
            {item.icon}
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ user, logout }) {
  return (
    <div className="flex flex-col gap-2.5 pt-4 border-t border-[#E1E4E0]">
      <div className="px-1 min-w-0">
        <div className="font-semibold text-sm text-[#1F2A27] truncate">
          {user?.nama || "Owner"}
        </div>
        <div className="text-xs text-[#6B7773] leading-snug">
          Owner &middot; Toko Kelontong Berkah
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="w-full min-h-[44px] px-4 border border-[#E1E4E0] rounded-md bg-white hover:bg-[#F5F6F4] text-sm font-semibold text-[#1F2A27] flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
        <span>Keluar</span>
      </button>
    </div>
  );
}

export default function OwnerSidebar() {
  const pathname = usePathname() || "";
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  // Saat menu mobile terbuka: kunci scroll halaman, tutup dengan Escape,
  // dan tutup otomatis jika layar melebar ke ukuran desktop (>= 1024px).
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    function handleKeyDown(e) {
      if (e.key === "Escape") setIsMenuOpen(false);
    }
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    function handleDesktop(e) {
      if (e.matches) setIsMenuOpen(false);
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleDesktop);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleDesktop);
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Top bar mobile & tablet (< 1024px) dengan tombol hamburger */}
      <div className="lg:hidden sticky top-0 z-30 h-14 shrink-0 flex items-center gap-2 px-2 sm:px-3 border-b border-[#E1E4E0] bg-white">
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Buka menu navigasi"
          aria-expanded={isMenuOpen}
          aria-controls="owner-mobile-nav"
          className="w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-md text-[#1F2A27] hover:bg-[#F5F6F4] transition-colors cursor-pointer"
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5 stroke-current"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
        <BrandMark />
        <span className="ml-auto pr-2 text-xs text-[#6B7773] truncate max-w-[45%]">
          {user?.nama || "Owner"}
        </span>
      </div>

      {/* Drawer navigasi mobile & tablet */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
        >
          <div
            className="absolute inset-0 bg-[#1F2A27]/45"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <aside
            id="owner-mobile-nav"
            aria-label="Navigasi Owner Panel"
            className="relative h-full w-[min(18rem,85vw)] bg-white border-r border-[#E1E4E0] shadow-xl flex flex-col justify-between gap-6 p-4 overflow-y-auto"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-2">
                <BrandMark />
                <button
                  type="button"
                  onClick={closeMenu}
                  autoFocus
                  aria-label="Tutup menu navigasi"
                  className="w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-md text-[#6B7773] hover:bg-[#F5F6F4] hover:text-[#1F2A27] transition-colors cursor-pointer"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 stroke-current"
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
              <NavLinks pathname={pathname} onNavigate={closeMenu} />
            </div>
            <UserFooter user={user} logout={logout} />
          </aside>
        </div>
      )}

      {/* Sidebar desktop (>= 1024px) */}
      <aside
        aria-label="Navigasi Owner Panel"
        className="hidden lg:flex w-[210px] shrink-0 border-r border-[#E1E4E0] bg-white flex-col justify-between p-4 sticky top-0 h-screen"
      >
        <div className="flex flex-col gap-6">
          <BrandMark />
          <NavLinks pathname={pathname} />
        </div>
        <UserFooter user={user} logout={logout} />
      </aside>
    </>
  );
}
