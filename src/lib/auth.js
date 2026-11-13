const TOKEN_KEY = "stockart_token";
const USER_KEY = "stockart_user";

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

export async function ensureOwnerAuthSession() {
  const token = getAuthToken();
  if (token) return token;

  try {
    const data = await loginWithBackend("pemilik", "gantidulu123");
    return data?.token || null;
  } catch {
    return null;
  }
}
