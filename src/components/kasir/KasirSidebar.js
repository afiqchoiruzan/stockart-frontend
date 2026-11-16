"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function KasirSidebar() {
  const pathname = usePathname() || "";
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: "Transaksi",
      href: "/kasir/transaksi",
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
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      ),
    },
    {
      name: "Produk",
      href: "/kasir/produk",
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
      name: "Riwayat",
      href: "/kasir/riwayat",
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
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      aria-label="Navigasi Kasir Panel"
      className="w-[210px] shrink-0 border-r border-[#E1E4E0] bg-white flex flex-col justify-between p-4 sticky top-0 h-screen"
    >
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
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

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1" aria-label="Menu utama">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/kasir" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
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
      </div>

      {/* Bottom User Info & Logout */}
      <div className="flex flex-col gap-2.5 pt-4 border-t border-[#E1E4E0]">
        <div className="px-1">
          <div className="font-semibold text-sm text-[#1F2A27] truncate">
            {user?.nama || "Kasir"}
          </div>
          <div className="text-xs text-[#6B7773] leading-snug">
            Kasir &middot; Toko Kelontong Berkah
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
    </aside>
  );
}
