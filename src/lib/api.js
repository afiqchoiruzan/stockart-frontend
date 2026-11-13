import { API_BASE_URL, getAuthToken } from "./auth";
import { CASHIERS, formatTanggalSingkat } from "./mockTransactions";

function toWibDateAndTime(isoString) {
  if (!isoString) {
    return { tanggal: "2026-11-12", waktu: "00:00", fullWib: "-" };
  }
  const dateObj = new Date(isoString);
  if (Number.isNaN(dateObj.getTime())) {
    return { tanggal: String(isoString).slice(0, 10), waktu: "00:00", fullWib: String(isoString) };
  }

  // Konversi ke WIB (UTC+7)
  const wibTime = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
  const isoWib = wibTime.toISOString();
  const tanggal = isoWib.slice(0, 10);
  const waktu = isoWib.slice(11, 16);
  const fullWib = `${formatTanggalSingkat(tanggal)}, ${waktu} WIB`;

  return { tanggal, waktu, fullWib };
}

export function normalizeBackendTransaction(raw) {
  if (!raw) return null;
  // Jika sudah dalam format UI mock, kembalikan langsung
  if (raw.noInvoice && !raw._id) {
    return raw;
  }

  const rawId = String(raw._id || raw.id || "");
  const shortCode = rawId.slice(-6).toUpperCase();
  const noInvoice = raw.noInvoice || `#TRX-${shortCode}`;

  const kasirObj =
    raw.kasir && typeof raw.kasir === "object" ? raw.kasir : null;
  const kasirId = kasirObj
    ? String(kasirObj._id || kasirObj.id)
    : String(raw.kasir || "kasir-backend");
  const namaKasir =
    kasirObj?.nama || raw.namaKasir || kasirObj?.username || "Kasir POS";
  const panggilanKasir =
    raw.panggilanKasir || namaKasir.trim().split(/\s+/)[0] || "Kasir";
  const usernameKasir = kasirObj?.username || raw.usernameKasir || "kasir_pos";

  const { tanggal, waktu } = toWibDateAndTime(raw.createdAt);
  const voidTimeInfo = raw.dibatalkanPada
    ? toWibDateAndTime(raw.dibatalkanPada).fullWib
    : null;

  const totalHarga = Number(raw.totalHarga || 0);
  const uangBayar =
    raw.uangBayar !== undefined ? Number(raw.uangBayar) : totalHarga;
  const kembalian =
    raw.kembalian !== undefined
      ? Number(raw.kembalian)
      : Math.max(0, uangBayar - totalHarga);

  const detailBarang = Array.isArray(raw.detailBarang)
    ? raw.detailBarang.map((item, idx) => {
        const prodObj =
          item.produk && typeof item.produk === "object" ? item.produk : null;
        return {
          produkId: prodObj ? String(prodObj._id) : String(item.produk || ""),
          kodeProduk:
            item.kodeProduk ||
            prodObj?.kodeProduk ||
            `BRG-${String(idx + 1).padStart(3, "0")}`,
          namaProduk:
            item.namaProduk || prodObj?.nama || "Produk Toko Kelontong",
          jumlah: Number(item.jumlah || 1),
          hargaSatuan: Number(item.hargaSatuan || prodObj?.hargaJual || 0),
          subtotal: Number(
            item.subtotal ||
              Number(item.jumlah || 1) *
                Number(item.hargaSatuan || prodObj?.hargaJual || 0)
          ),
        };
      })
    : [];

  return {
    id: rawId,
    _id: rawId,
    noInvoice,
    kasirId,
    namaKasir,
    panggilanKasir,
    usernameKasir,
    tanggal: raw.tanggal || tanggal,
    waktu: raw.waktu || waktu,
    metodePembayaran: raw.metodePembayaran || "Tunai / POS",
    status: raw.status || "selesai",
    stokDipotong: Boolean(raw.stokDipotong),
    totalHarga,
    uangBayar,
    kembalian,
    dibatalkanPada: voidTimeInfo,
    dibatalkanOleh:
      raw.dibatalkanOleh?.nama || "Owner (Pemilik)",
    alasanBatal:
      raw.alasanBatal ||
      (raw.status === "batal"
        ? "Dibatalkan oleh Owner melalui Sistem POS (Stok dikembalikan)"
        : ""),
    detailBarang,
    isFromBackend: true,
  };
}

export function buildCashierRoster(transactions = [], isLiveBackend = false) {
  if (!isLiveBackend) {
    return CASHIERS;
  }

  const map = new Map();
  transactions.forEach((trx) => {
    if (!trx.kasirId) return;
    if (!map.has(trx.kasirId)) {
      const idx = map.size + 1;
      map.set(trx.kasirId, {
        id: trx.kasirId,
        kode: `KSR-${String(idx).padStart(2, "0")}`,
        nama: trx.namaKasir || `Kasir ${idx}`,
        panggilan: trx.panggilanKasir || `Kasir ${idx}`,
        username: trx.usernameKasir || `kasir_${idx}`,
        shift: "Shift Operasional POS",
        statusAktif: true,
      });
    }
  });

  return Array.from(map.values());
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const err = new Error(
      payload.message || `Permintaan API gagal (${response.status})`
    );
    err.status = response.status;
    throw err;
  }

  return payload;
}

export async function fetchTransactionsFromApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.kasir && filters.kasir !== "semua") {
    params.set("kasir", filters.kasir);
  }
  if (filters.tanggal) {
    params.set("tanggal", filters.tanggal);
  }
  if (filters.status && filters.status !== "semua") {
    params.set("status", filters.status);
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/transactions?${queryString}` : "/transactions";
  const result = await apiRequest(endpoint, { method: "GET" });

  const list = Array.isArray(result.data) ? result.data : [];
  return list.map(normalizeBackendTransaction);
}

export async function fetchTransactionDetailFromApi(id) {
  const result = await apiRequest(`/transactions/${id}`, { method: "GET" });
  return normalizeBackendTransaction(result.data);
}

export async function voidTransactionInApi(id) {
  const result = await apiRequest(`/transactions/${id}/void`, {
    method: "PATCH",
  });
  return normalizeBackendTransaction(result.data);
}

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
