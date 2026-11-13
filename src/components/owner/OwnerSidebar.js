"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function OwnerSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: "Menu Produk",
      href: "/owner/produk",
      icon: (
        <svg
          aria-hidden="true"
          className="w-5 h-5 stroke-current"
          fill="none"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
          />
        </svg>
      ),
    },
    {
      name: "Menu Transaksi",
      href: "/owner/transaksi",
      icon: (
        <svg
          aria-hidden="true"
          className="w-5 h-5 stroke-current"
          fill="none"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
          />
        </svg>
      ),
    },
    {
      name: "Menu Laporan",
      href: "/owner/laporan",
      icon: (
        <svg
          aria-hidden="true"
          className="w-5 h-5 stroke-current"
          fill="none"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside
      aria-label="Navigasi Owner Panel"
      className="w-64 shrink-0 border-r-2 border-black bg-white flex flex-col justify-between p-4 min-h-screen"
    >
      <div className="flex flex-col gap-6">
        {/* Logo / Brand Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b-2 border-black">
          <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-bold text-sm tracking-tighter bg-neutral-100">
            OW
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-lg tracking-tight truncate">Owner Panel</span>
            {user?.nama && (
              <span className="text-xs text-neutral-600 truncate">{user.nama}</span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2.5" aria-label="Menu Utama">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/owner" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                  isActive
                    ? "bg-neutral-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "border-black/40 hover:border-black hover:bg-neutral-100 text-neutral-800"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Logout Button */}
      <div className="pt-4 border-t-2 border-black">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center min-h-[44px] px-4 py-2 border-2 border-black rounded text-sm font-bold bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
