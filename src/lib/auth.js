"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiLogin, apiGetMe, TOKEN_KEY, USER_KEY } from "@/lib/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://stockart-backend-production-5896718b.up.railway.app/api";

export function getAuthToken() {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_DEV_OWNER_TOKEN || null;
}

export function getAuthUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token, user) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function loginWithBackend(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Gagal login ke server backend");
  }

  const { token, ...userData } = payload.data;
  setAuthSession(token, userData);
  return payload.data;
}

const AuthContext = createContext(null);

/** Halaman awal untuk tiap role dari backend ('pemilik' | 'kasir'). */
export function getHomePathForRole(role) {
  return role === "pemilik" ? "/owner/produk" : "/kasir/produk";
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null); // { _id, nama, username, role }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage, then verify it with backend
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    let savedUser = null;
    try {
      savedUser = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      savedUser = null;
    }

    const hasSession = !!savedToken && !!savedUser;
    if (!hasSession) clearSession();

    // localStorage hanya tersedia di browser, jadi sesi dipulihkan sekali setelah mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(hasSession ? savedToken : null);
    setUser(hasSession ? savedUser : null);
    setLoading(false);

    if (!hasSession) return;

    // Sinkronkan profil terbaru dari backend (token kedaluwarsa -> 401 -> apiFetch logout otomatis)
    apiGetMe()
      .then((res) => {
        if (res?.data) {
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
          setUser(res.data);
        }
      })
      .catch((err) => {
        if (err.status === 401) {
          setToken(null);
          setUser(null);
        }
      });
  }, []);

  const login = useCallback(async (username, password) => {
    const result = await apiLogin(username, password);
    const { token: newToken, ...userData } = result.data;

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);

    return userData;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/**
 * Proteksi halaman berdasarkan role.
 * - Belum login  -> diarahkan ke /login
 * - Role berbeda -> diarahkan ke halaman utama role-nya
 */
export function RoleGuard({ role, children }) {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const allowed = !loading && !!token && !!user && user.role === role;

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace("/login");
    } else if (user.role !== role) {
      router.replace(getHomePathForRole(user.role));
    }
  }, [loading, token, user, role, router]);

  if (!allowed) {
    return (
      <div className="p-6 border-2 border-black rounded bg-neutral-50 font-mono text-sm">
        Memeriksa sesi login...
      </div>
    );
  }

  return children;
}
