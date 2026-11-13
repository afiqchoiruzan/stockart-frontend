"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function KasirSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: "Menu Produk",
      href: "/kasir/produk",
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
      href: "/kasir/transaksi",
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
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>
      ),
    },
    {
      name: "Riwayat Transaksi",
      href: "/kasir/riwayat",
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
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside
      aria-label="Navigasi Kasir Panel"
      className="w-64 shrink-0 border-r-2 border-black bg-white flex flex-col justify-between p-4 min-h-screen"
    >
      <div className="flex flex-col gap-6">
        {/* Logo / Brand Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b-2 border-black">
          <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-bold text-sm tracking-tighter bg-neutral-100">
            KS
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base tracking-tight truncate">Kasir Panel</span>
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
              (item.href !== "/kasir" && pathname.startsWith(item.href));

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
