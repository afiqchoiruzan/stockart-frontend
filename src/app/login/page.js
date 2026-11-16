"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, getHomePathForRole } from "@/lib/auth";

const ROLE_OPTIONS = {
  owner: {
    key: "owner",
    label: "Owner",
    desc: "Kelola produk, pantau transaksi, dan lihat laporan.",
    hintUser: "pemilik",
  },
  kasir: {
    key: "kasir",
    label: "Kasir",
    desc: "Catat penjualan, cek stok, dan lihat riwayat transaksi.",
    hintUser: "kasir1",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, user, token, loading } = useAuth();

  // Jika sudah login, langsung arahkan ke halaman sesuai role
  useEffect(() => {
    if (!loading && token && user) {
      router.replace(getHomePathForRole(user.role));
    }
  }, [loading, token, user, router]);

  const [selectedRole, setSelectedRole] = useState(null); // null | 'owner' | 'kasir'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePickRole = (roleKey) => {
    setSelectedRole(roleKey);
    setError("");
  };

  const handleBackToRole = () => {
    setSelectedRole(null);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanUsername || !cleanPassword) {
      setError("Isi nama pengguna dan kata sandi.");
      return;
    }

    setIsLoading(true);

    try {
      const loggedInUser = await login(cleanUsername, cleanPassword);
      const expectedBackendRole =
        selectedRole === "owner" ? "pemilik" : "kasir";

      if (selectedRole && loggedInUser.role !== expectedBackendRole) {
        logout();
        setError(
          selectedRole === "owner"
            ? "Akun ini bukan akun Owner. Silakan klik 'Ganti peran' lalu masuk sebagai Kasir."
            : "Akun ini bukan akun Kasir. Silakan klik 'Ganti peran' lalu masuk sebagai Owner."
        );
        return;
      }

      router.replace(getHomePathForRole(loggedInUser.role));
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message ||
          "Nama pengguna atau kata sandi salah. Periksa lagi lalu coba masuk."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeRoleMeta = selectedRole ? ROLE_OPTIONS[selectedRole] : null;

  return (
    <main className="min-h-dvh grid place-items-center p-4 sm:p-6 bg-[#F5F6F4] text-[#1F2A27]">
      {!selectedRole ? (
        /* Step 1: Pilih Peran (Sesuai Hi-Fi stockart-pos.html) */
        <section className="w-full max-w-[400px] bg-white border border-[#E1E4E0] rounded-lg p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
          {/* Brand */}
          <div className="flex items-center gap-2 font-bold text-[#2F6F5E]">
            <svg
              aria-hidden="true"
              className="w-4 h-4 stroke-current"
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

          <div>
            <h1 className="text-[clamp(1.25rem,1.05rem+1vw,1.5rem)] font-bold leading-tight text-[#1F2A27] wrap-break-word">
              Pilih peran
            </h1>
            <p className="text-sm text-[#6B7773] mt-0.5">
              Toko Kelontong Berkah
            </p>
          </div>

          {/* Pilihan Owner */}
          <button
            type="button"
            onClick={() => handlePickRole("owner")}
            className="flex items-center gap-3 sm:gap-4 w-full min-h-[64px] p-3.5 sm:p-4 border border-[#E1E4E0] hover:border-[#2F6F5E] rounded-lg bg-white text-left transition-colors cursor-pointer group"
          >
            <span className="w-10 h-10 rounded-md bg-[#E6F0ED] text-[#2F6F5E] grid place-items-center shrink-0">
              <svg
                aria-hidden="true"
                className="w-4 h-4 stroke-current"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              </svg>
            </span>
            <span className="flex-1 flex flex-col">
              <strong className="font-semibold text-sm text-[#1F2A27]">
                Owner
              </strong>
              <span className="text-xs text-[#6B7773]">
                Kelola produk, pantau transaksi, dan lihat laporan.
              </span>
            </span>
            <svg
              aria-hidden="true"
              className="w-4 h-4 stroke-[#6B7773] group-hover:stroke-[#2F6F5E] shrink-0"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          {/* Pilihan Kasir */}
          <button
            type="button"
            onClick={() => handlePickRole("kasir")}
            className="flex items-center gap-3 sm:gap-4 w-full min-h-[64px] p-3.5 sm:p-4 border border-[#E1E4E0] hover:border-[#2F6F5E] rounded-lg bg-white text-left transition-colors cursor-pointer group"
          >
            <span className="w-10 h-10 rounded-md bg-[#E6F0ED] text-[#2F6F5E] grid place-items-center shrink-0">
              <svg
                aria-hidden="true"
                className="w-4 h-4 stroke-current"
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
            </span>
            <span className="flex-1 flex flex-col">
              <strong className="font-semibold text-sm text-[#1F2A27]">
                Kasir
              </strong>
              <span className="text-xs text-[#6B7773]">
                Catat penjualan, cek stok, dan lihat riwayat transaksi.
              </span>
            </span>
            <svg
              aria-hidden="true"
              className="w-4 h-4 stroke-[#6B7773] group-hover:stroke-[#2F6F5E] shrink-0"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </section>
      ) : (
        /* Step 2: Form Login (Sesuai Hi-Fi stockart-pos.html) */
        <form
          onSubmit={handleLogin}
          noValidate
          className="w-full max-w-[400px] bg-white border border-[#E1E4E0] rounded-lg p-5 sm:p-6 flex flex-col gap-4 shadow-xs"
        >
          {/* Brand */}
          <div className="flex items-center gap-2 font-bold text-[#2F6F5E]">
            <svg
              aria-hidden="true"
              className="w-4 h-4 stroke-current"
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

          <div>
            <h1 className="text-[clamp(1.25rem,1.05rem+1vw,1.5rem)] font-bold leading-tight text-[#1F2A27] wrap-break-word">
              Masuk sebagai {activeRoleMeta.label}
            </h1>
            <p className="text-sm text-[#6B7773] mt-0.5">
              {activeRoleMeta.desc}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 px-3 py-2.5 border border-[#C4574F] rounded-md bg-[#F8E8E6] text-[#1F2A27] text-sm"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4 stroke-[#C4574F] shrink-0 mt-0.5"
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
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="font-medium text-sm">
              Nama pengguna
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`Contoh: ${activeRoleMeta.hintUser}`}
              autoComplete="username"
              autoFocus
              disabled={isLoading}
              className="w-full min-h-[44px] px-4 bg-white border border-[#E1E4E0] rounded-md text-sm focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E] disabled:opacity-60"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="font-medium text-sm">
              Kata sandi
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full min-h-[44px] pl-4 pr-20 bg-white border border-[#E1E4E0] rounded-md text-sm focus:outline-2 focus:outline-[#2F6F5E] focus:border-[#2F6F5E] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-h-10 px-2.5 py-1 text-xs font-medium text-[#6B7773] hover:text-[#1F2A27] rounded cursor-pointer"
                aria-label={
                  showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"
                }
              >
                {showPassword ? "Sembunyi" : "Lihat"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[52px] px-4 rounded-md bg-[#2F6F5E] hover:bg-[#255a4c] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading && (
              <svg
                aria-hidden="true"
                className="w-4 h-4 stroke-current animate-spin"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            <span>{isLoading ? "Memproses..." : "Masuk"}</span>
          </button>

          <button
            type="button"
            onClick={handleBackToRole}
            className="w-full min-h-[44px] px-4 rounded-md text-sm font-semibold text-[#1F2A27] hover:bg-[#F5F6F4] flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span>Ganti peran</span>
          </button>
        </form>
      )}
    </main>
  );
}
