// Untuk sementara komunikasi memakai backend lokal (lihat .env.local).
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export const TOKEN_KEY = "stockart_token";
export const USER_KEY = "stockart_user";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Helper untuk fetch ke backend API.
 * - Otomatis menambahkan Authorization header jika token tersedia.
 * - Jika token kedaluwarsa/tidak valid (401), sesi dihapus dan user diarahkan ke /login.
 */
export async function apiFetch(endpoint, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    const error = new Error(
      `Tidak dapat terhubung ke server backend (${API_BASE}). Pastikan backend sudah berjalan.`
    );
    error.status = 0;
    throw error;
  }

  // Beberapa respons (mis. rate limit / error proxy) bisa bukan JSON
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401 && token && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        // Di luar komponen React (tanpa router), jadi pakai navigasi browser biasa
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }

    const detail = Array.isArray(data?.errors) ? data.errors.join(", ") : "";
    const message = data?.error || data?.message || "Terjadi kesalahan pada server";
    const error = new Error(detail ? `${message}: ${detail}` : message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ========== AUTH API ==========

export async function apiLogin(username, password) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function apiGetMe() {
  return apiFetch("/api/auth/me");
}

// ========== PRODUCTS API ==========

/**
 * params: { search, kategori, barcode, aktif } — aktif: 'true' | 'false' | 'all'
 */
export async function apiGetProducts(params = {}) {
  return apiFetch(
    `/api/products${buildQuery({
      search: params.search,
      kategori: params.kategori,
      barcode: params.barcode,
      aktif: params.aktif,
    })}`
  );
}

export async function apiGetLowStockProducts() {
  return apiFetch("/api/products/low-stock");
}

export async function apiGetProductById(id) {
  return apiFetch(`/api/products/${id}`);
}

export async function apiCreateProduct(product) {
  return apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function apiUpdateProduct(id, product) {
  return apiFetch(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function apiRestockProduct(id, jumlah) {
  return apiFetch(`/api/products/${id}/restock`, {
    method: "PATCH",
    body: JSON.stringify({ jumlah: Number(jumlah) }),
  });
}

/** Default: soft delete (nonaktifkan). permanent=true untuk hapus permanen. */
export async function apiDeleteProduct(id, permanent = false) {
  return apiFetch(`/api/products/${id}${permanent ? "?permanent=true" : ""}`, {
    method: "DELETE",
  });
}

export async function apiRestoreProduct(id) {
  return apiFetch(`/api/products/${id}/restore`, {
    method: "PATCH",
  });
}

// ========== TRANSACTIONS API ==========

/**
 * params: { kasir, tanggal (YYYY-MM-DD), status ('selesai' | 'batal') }
 */
export async function apiGetTransactions(params = {}) {
  return apiFetch(
    `/api/transactions${buildQuery({
      kasir: params.kasir,
      tanggal: params.tanggal,
      status: params.status,
    })}`
  );
}

export async function apiGetTransactionById(id) {
  return apiFetch(`/api/transactions/${id}`);
}

export async function apiDraftTransaction(detailBarang) {
  return apiFetch("/api/transactions/draft", {
    method: "POST",
    body: JSON.stringify({ detailBarang }),
  });
}

export async function apiCheckout(detailBarang) {
  return apiFetch("/api/transactions/checkout", {
    method: "POST",
    body: JSON.stringify({ detailBarang }),
  });
}

export async function apiVoidTransaction(id) {
  return apiFetch(`/api/transactions/${id}/void`, {
    method: "PATCH",
  });
}

// ========== REPORTS API (khusus pemilik) ==========

/**
 * params: { tanggalMulai, tanggalAkhir } — format YYYY-MM-DD
 */
export async function apiGetReportSummary(params = {}) {
  return apiFetch(`/api/reports/summary${buildQuery(params)}`);
}

export async function apiGetReportRevenue(params = {}) {
  return apiFetch(`/api/reports/revenue${buildQuery(params)}`);
}

export async function apiGetReportTopProducts(params = {}) {
  return apiFetch(`/api/reports/top-products${buildQuery(params)}`);
}
