import { Suspense } from "react";
import KasirSidebar from "@/components/kasir/KasirSidebar";
import KasirWindowBar from "@/components/kasir/KasirWindowBar";
import { RoleGuard } from "@/lib/auth";

// Halaman di bawah layout ini baru dirender setelah RoleGuard membaca sesi dari
// localStorage (client-only), jadi saat render server segmen page selalu "dropped".
// Keluarkan area ini dari validasi instant navigation Cache Components.
export const instant = false;

export default function KasirLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans">
      {/* Skip to Main Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-white focus:border-2 focus:border-black focus:font-bold"
      >
        Lewati ke konten utama
      </a>

      {/* Wireframe Mock Browser Window Top Bar */}
      <Suspense
        fallback={
          <header
            aria-label="Mock Window Bar"
            className="w-full border-b-2 border-black bg-white px-4 py-2 flex items-center justify-between text-xs font-mono select-none"
          >
            <div className="border border-black px-3 py-1 rounded bg-neutral-50 text-neutral-700 min-w-[280px]">
              https://stockart.pages.dev/kasir
            </div>
            <div className="border border-black px-2.5 py-1 font-bold tracking-wider bg-white">
              KASIR PANEL
            </div>
          </header>
        }
      >
        <KasirWindowBar />
      </Suspense>

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Suspense
          fallback={
            <aside
              aria-label="Memuat Navigasi"
              className="w-64 shrink-0 border-r-2 border-black bg-white p-4"
            >
              <div className="w-10 h-10 rounded-full border-2 border-black bg-neutral-100" />
            </aside>
          }
        >
          <KasirSidebar />
        </Suspense>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto bg-white p-6 focus:outline-none"
        >
          <RoleGuard role="kasir">{children}</RoleGuard>
        </main>
      </div>
    </div>
  );
}
