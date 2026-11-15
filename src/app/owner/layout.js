import { Suspense } from "react";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import OwnerWindowBar from "@/components/owner/OwnerWindowBar";
import { RoleGuard } from "@/lib/auth";

export const instant = false;

export default function OwnerLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-[#F5F6F4] text-[#1F2A27] font-sans">
      {/* Skip to Main Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-white focus:border focus:border-[#2F6F5E] focus:rounded-md focus:font-semibold"
      >
        Lewati ke konten utama
      </a>

      {/* Left Sidebar (Hi-Fi Shell) */}
      <Suspense
        fallback={
          <aside
            aria-label="Memuat Navigasi"
            className="w-[210px] shrink-0 border-r border-[#E1E4E0] bg-white p-4"
          >
            <div className="h-6 w-28 rounded bg-[#E6F0ED]" />
          </aside>
        }
      >
        <OwnerSidebar />
      </Suspense>

      {/* Right Main Column: Topbar + Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Suspense
          fallback={
            <header className="w-full border-b border-[#E1E4E0] bg-white px-6 py-4 flex items-center justify-between">
              <div className="h-5 w-32 rounded bg-[#F5F6F4]" />
            </header>
          }
        >
          <OwnerWindowBar />
        </Suspense>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto bg-[#F5F6F4] p-6 focus:outline-none"
        >
          <RoleGuard role="pemilik">{children}</RoleGuard>
        </main>
      </div>
    </div>
  );
}
