"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, getHomePathForRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, token, loading } = useAuth();

  // Jika sudah login, langsung arahkan ke halaman sesuai role
  useEffect(() => {
    if (!loading && token && user) {
      router.replace(getHomePathForRole(user.role));
    }
  }, [loading, token, user, router]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Backend menyimpan username dalam huruf kecil
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanUsername || !cleanPassword) {
      setError("Username dan password harus diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(cleanUsername, cleanPassword);

      // Redirect based on role returned by backend ('pemilik' | 'kasir')
      router.replace(getHomePathForRole(user.role));
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Gagal login. Pastikan server backend aktif.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans">
      {/* Mock Browser Top Bar */}
      <header
        aria-label="Mock Window Bar"
        className="w-full border-b-2 border-black bg-white px-4 py-2 flex items-center justify-between text-xs font-mono select-none"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border border-black bg-neutral-300" />
            <span className="w-2.5 h-2.5 rounded-full border border-black bg-neutral-300" />
            <span className="w-2.5 h-2.5 rounded-full border border-black bg-neutral-300" />
          </div>
          <div className="border border-black px-3 py-1 rounded bg-neutral-50 text-neutral-700 min-w-[280px]">
            https://stockart.pages.dev/login
          </div>
        </div>
        <div className="border border-black px-2.5 py-1 font-bold tracking-wider bg-white">
          LOGIN
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-black flex items-center justify-center font-bold text-2xl tracking-tighter bg-neutral-100 mb-4">
              KS
            </div>
            <h1 className="text-2xl font-bold tracking-tight">StockArt</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Sistem Manajemen Toko Kelontong
            </p>
          </div>

          {/* Login Form Card */}
          <form
            onSubmit={handleLogin}
            className="border-2 border-black rounded p-6 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-lg font-bold mb-5 pb-3 border-b-2 border-black">
              Login ke Sistem
            </h2>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 border-2 border-black rounded bg-neutral-100 text-sm font-medium flex items-center gap-2 text-red-700"
              >
                <span className="font-mono font-bold text-red-600">[!</span>
                <span>{error}</span>
                <span className="font-mono font-bold text-red-600">]</span>
              </div>
            )}

            {/* Username Field */}
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-bold mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                autoComplete="username"
                disabled={isLoading}
                className="w-full px-3 py-2.5 min-h-[44px] border-2 border-black rounded text-sm bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-neutral-100"
              />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-bold mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 pr-12 min-h-[44px] border-2 border-black rounded text-sm bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-mono font-bold border border-black rounded bg-neutral-100 hover:bg-neutral-200"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] px-4 py-3 border-2 border-black rounded text-sm font-bold bg-black text-white hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
            >
              {isLoading ? "Menghubungkan ke server..." : "Login"}
            </button>

            {/* Role Info */}
            <div className="mt-5 pt-4 border-t border-black/20">
              <p className="text-xs text-neutral-500 text-center mb-2">
                Info Akun (Backend Connected):
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="border border-black/30 rounded p-2 bg-neutral-50">
                  <p className="font-bold">Role Pemilik</p>
                  <p className="text-neutral-600">pemilik / gantidulu123</p>
                </div>
                <div className="border border-black/30 rounded p-2 bg-neutral-50">
                  <p className="font-bold">Role Kasir</p>
                  <p className="text-neutral-600">Akun kasir terdaftar</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
