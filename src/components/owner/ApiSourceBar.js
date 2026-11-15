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

  const isOffline = Boolean(apiError && dataSource === "api");

  return (
    <div className="border border-[#E1E4E0] rounded-lg bg-white p-3.5 flex flex-col gap-2.5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 min-h-[24px] px-2.5 rounded-md font-semibold ${
              isLoading
                ? "bg-[#E8F0F6] text-[#2c5473]"
                : isOffline
                ? "bg-[#F8E8E6] text-[#8c322b]"
                : dataSource === "api"
                ? "bg-[#E6F2EC] text-[#245942]"
                : "bg-[#FBF1DC] text-[#7a5612]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLoading
                  ? "bg-[#4A7FA7] animate-pulse"
                  : isOffline
                  ? "bg-[#C4574F]"
                  : dataSource === "api"
                  ? "bg-[#3E8E6A]"
                  : "bg-[#D9A441]"
              }`}
            />
            {isLoading
              ? "Sinkronisasi API..."
              : dataSource === "api"
              ? isOffline
                ? "API Backend Offline"
                : "Live API Terhubung"
              : "Mode Data Simulasi"}
          </span>

          <span className="text-[#6B7773]">
            {dataSource === "api" ? (
              isOffline ? (
                <>
                  <strong className="text-[#C4574F] font-semibold">
                    Kendala API:
                  </strong>{" "}
                  <span className="text-[#1F2A27]">{apiError}</span> —{" "}
                  <code className="font-mono text-[11px] bg-[#F5F6F4] px-1.5 py-0.5 rounded">
                    {API_BASE_URL}
                    {endpointPath}
                  </code>
                </>
              ) : (
                <>
                  Endpoint{" "}
                  <code className="font-mono text-[11px] text-[#1F2A27] bg-[#F5F6F4] px-1.5 py-0.5 rounded">
                    {API_BASE_URL}
                    {endpointPath}
                  </code>{" "}
                  (MongoDB Atlas)
                </>
              )
            ) : (
              <>
                Menampilkan data simulasi lokal (
                <code className="font-mono text-[11px]">{mockName}</code>)
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
            className="min-h-[34px] px-3 py-1 border border-[#E1E4E0] rounded-md font-semibold bg-white hover:bg-[#F5F6F4] text-[#1F2A27] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isLoading ? "Memuat..." : "Sinkron API"}
          </button>

          {typeof onSwitchSource === "function" && (
            <button
              type="button"
              onClick={() =>
                onSwitchSource(dataSource === "api" ? "mock" : "api")
              }
              className="min-h-[34px] px-3 py-1 border border-[#E1E4E0] rounded-md font-semibold bg-white hover:bg-[#F5F6F4] text-[#1F2A27] transition-colors cursor-pointer"
            >
              {dataSource === "api" ? "Mode Simulasi" : "Hubungkan Live API"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowLoginBox((prev) => !prev)}
            className="min-h-[34px] px-3 py-1 border border-[#2F6F5E] rounded-md font-semibold bg-[#2F6F5E] text-white hover:bg-[#255a4c] transition-colors cursor-pointer"
          >
             Sesi Owner
          </button>
        </div>
      </div>

      {loginMsg && (
        <div className="font-medium text-[#2F6F5E] pt-1.5 border-t border-[#E1E4E0]">
          {loginMsg}
        </div>
      )}

      {showLoginBox && (
        <form
          onSubmit={handleLogin}
          className="pt-2.5 border-t border-[#E1E4E0] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <span className="font-semibold text-[#1F2A27] shrink-0">
            Login API Owner:
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (misal: pemilik)"
            className="min-h-[36px] px-3 py-1 border border-[#E1E4E0] rounded-md bg-white text-xs focus:outline-2 focus:outline-[#2F6F5E]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kata sandi"
            className="min-h-[36px] px-3 py-1 border border-[#E1E4E0] rounded-md bg-white text-xs focus:outline-2 focus:outline-[#2F6F5E]"
          />
          <button
            type="submit"
            disabled={loginLoading}
            className="min-h-[36px] px-3.5 py-1 rounded-md font-semibold bg-[#2F6F5E] text-white hover:bg-[#255a4c] cursor-pointer"
          >
            {loginLoading ? "Memproses..." : "Login JWT"}
          </button>
        </form>
      )}
    </div>
  );
}
