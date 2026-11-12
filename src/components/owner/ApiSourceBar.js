"use client";

import { useState } from "react";
import { loginWithBackend, API_BASE_URL } from "@/lib/auth";

export default function ApiSourceBar({
  dataSource = "api", // 'api' | 'mock'
  isLoading = false,
  apiError = "",
  onRefreshApi,
  onSwitchSource,
  endpointPath = "/transactions",
  mockName = "mockTransactions.js",
}) {
  const [showLoginBox, setShowLoginBox] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMsg, setLoginMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoginLoading(true);
    setLoginMsg("");
    try {
      const user = await loginWithBackend(username.trim(), password);
      setLoginMsg(`Login berhasil sebagai ${user.nama} (${user.role})`);
      setShowLoginBox(false);
      setPassword("");
      if (onRefreshApi) onRefreshApi();
    } catch (err) {
      setLoginMsg(`! ${err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="border-2 border-black rounded bg-neutral-100 p-3 flex flex-col gap-2.5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2 py-0.5 border border-black rounded font-mono font-bold ${
              apiError && dataSource === "api"
                ? "bg-neutral-300 text-black"
                : "bg-white text-black"
            }`}
          >
            {isLoading
              ? "[SYNC...]"
              : dataSource === "api"
              ? apiError
                ? "[API BACKEND: OFFLINE]"
                : "[LIVE API BACKEND]"
              : "[MODE DATA MOCK]"}
          </span>
          <span className="font-medium text-neutral-800">
            {dataSource === "api" ? (
              apiError ? (
                <>
                  <span className="text-black font-semibold">Offline:</span> Belum terhubung ke{" "}
                  <code className="font-mono font-bold">{API_BASE_URL}{endpointPath}</code>{" "}
                  (Jalankan <code className="font-mono bg-neutral-200 px-1 rounded">npm run dev</code> di terminal stockart-backend)
                </>
              ) : (
                <>
                  Terhubung ke <code className="font-mono font-bold">{API_BASE_URL}{endpointPath}</code>{" "}
                  (MongoDB Atlas / Lokal)
                </>
              )
            ) : (
              <>
                Menampilkan data simulasi lokal (<code className="font-mono">{mockName}</code>)
                {apiError ? ` — ${apiError}` : ""}
              </>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefreshApi}
            disabled={isLoading}
            className="min-h-[32px] px-2.5 py-1 border border-black rounded font-mono font-bold bg-white hover:bg-neutral-200 text-black disabled:opacity-50 transition-colors"
          >
            {isLoading ? "[Memuat...]" : "[ Sinkron API ]"}
          </button>

          <button
            type="button"
            onClick={() =>
              onSwitchSource(dataSource === "api" ? "mock" : "api")
            }
            className="min-h-[32px] px-2.5 py-1 border border-black rounded font-mono font-bold bg-white hover:bg-neutral-200 text-black transition-colors"
          >
            {dataSource === "api"
              ? "[Ke Mode Mock]"
              : "[Hubungkan Live API]"}
          </button>

          <button
            type="button"
            onClick={() => setShowLoginBox((prev) => !prev)}
            className="min-h-[32px] px-2.5 py-1 border border-black rounded font-mono font-bold bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            [Auth Owner]
          </button>
        </div>
      </div>

      {loginMsg && (
        <div className="font-mono font-semibold text-black pt-1 border-t border-black/20">
          {loginMsg}
        </div>
      )}

      {showLoginBox && (
        <form
          onSubmit={handleLogin}
          className="pt-2.5 border-t border-black/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <span className="font-bold text-black shrink-0">
            Login API Owner:
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (misal: owner / pemilik)"
            className="min-h-[34px] px-2.5 py-1 border border-black rounded bg-white text-xs font-mono"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="min-h-[34px] px-2.5 py-1 border border-black rounded bg-white text-xs font-mono"
          />
          <button
            type="submit"
            disabled={loginLoading}
            className="min-h-[34px] px-3 py-1 border border-black rounded font-mono font-bold bg-black text-white hover:bg-neutral-800"
          >
            {loginLoading ? "Memproses..." : "[Login JWT]"}
          </button>
        </form>
      )}
    </div>
  );
}

