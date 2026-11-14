import { API_BASE_URL, getAuthToken, ensureOwnerAuthSession } from "./auth";
import { CASHIERS, formatTanggalSingkat } from "./mockTransactions";

/**
 * Task 5: Normalisasi dokumen Produk dari MongoDB Backend ke format prop yang kompatibel dengan UI.
 */
export function normalizeBackendProduct(raw) {
  if (!raw) return null;
  const rawId = String(raw._id || raw.id || "");
  const hargaJual = Number(raw.hargaJual !== undefined ? raw.hargaJual : raw.harga || 0);
  const hargaBeli = Number(raw.hargaBeli !== undefined ? raw.hargaBeli : raw.harga || 0);
  const stok = Number(raw.stok || 0);
  const stokMinimum = Number(raw.stokMinimum !== undefined ? raw.stokMinimum : 5);

  return {
    id: rawId,
    _id: rawId,
    nama: raw.nama || "",
    kodeProduk: raw.kodeProduk || "",
    kategori: raw.kategori || "Umum",
    harga: hargaJual, // Format harga untuk UI
    hargaJual,
    hargaBeli,
    stok,
    satuan: raw.satuan || "pcs",
    stokMinimum,
    deskripsi: raw.deskripsi || "",
    aktif: raw.aktif !== undefined ? Boolean(raw.aktif) : true,
    isLowStock: stok <= stokMinimum,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    isFromBackend: true,
  };
}

/**
 * Task 5: Mengonversi data form UI ke payload backend Mongoose yang memenuhi middleware/validate.js.
 */
export function toBackendProductPayload(formData, initialData = null) {
  const hargaJual = Math.round(Number(formData.harga || 0));
  const fallbackHargaBeli =
    initialData?.hargaBeli !== undefined
      ? Number(initialData.hargaBeli)
      : Math.round(hargaJual * 0.85);

  const payload = {
    nama: String(formData.nama || "").trim(),
    kategori: formData.kategori || "Sembako",
    hargaJual,
    hargaBeli: Math.max(0, fallbackHargaBeli),
    stok: Math.round(Number(formData.stok || 0)),
    satuan: initialData?.satuan || "pcs",
    stokMinimum:
      initialData?.stokMinimum !== undefined ? Number(initialData.stokMinimum) : 5,
    aktif: initialData?.aktif !== undefined ? Boolean(initialData.aktif) : true,
  };

  if (initialData?.kodeProduk) {
    payload.kodeProduk = initialData.kodeProduk;
  }
  if (initialData?.deskripsi) {
    payload.deskripsi = initialData.deskripsi;
  }

  return payload;
}

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
  let token = getAuthToken();
  if (!token && typeof window !== "undefined") {
    token = await ensureOwnerAuthSession();
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (fetchErr) {
    const isConnErr =
      fetchErr.name === "TypeError" ||
      fetchErr.message?.toLowerCase().includes("failed to fetch") ||
      fetchErr.message?.toLowerCase().includes("network");

    if (isConnErr) {
      const friendlyErr = new Error(
        `Server backend di ${API_BASE_URL} belum aktif atau tidak dapat dijangkau. Pastikan server Express sudah berjalan (jalankan "npm run dev" di terminal stockart-backend).`
      );
      friendlyErr.isOffline = true;
      throw friendlyErr;
    }
    throw fetchErr;
  }

  // Jika token kadaluarsa (401) di browser, coba login owner sekali lagi
  if (response.status === 401 && typeof window !== "undefined") {
    try {
      const freshToken = await ensureOwnerAuthSession();
      if (freshToken) {
        headers["Authorization"] = `Bearer ${freshToken}`;
        response = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers,
        });
      }
    } catch {
      // Abaikan jika refresh token gagal
    }
  }

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

/**
 * Task 5: Mengambil seluruh daftar produk dari backend (GET /api/products).
 */
export async function fetchProductsFromApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.kategori && filters.kategori !== "Semua Kategori") {
    params.set("kategori", filters.kategori);
  }
  if (filters.barcode) {
    params.set("barcode", filters.barcode);
  }
  if (filters.aktif !== undefined) {
    params.set("aktif", String(filters.aktif));
  }

  const queryStr = params.toString();
  const endpoint = queryStr ? `/products?${queryStr}` : "/products";
  const result = await apiRequest(endpoint, { method: "GET" });
  const list = Array.isArray(result.data) ? result.data : [];
  return list.map(normalizeBackendProduct);
}

/**
 * Task 5: Mengambil daftar produk stok menipis (GET /api/products/low-stock).
 */
export async function fetchLowStockProductsFromApi() {
  const result = await apiRequest("/products/low-stock", { method: "GET" });
  const list = Array.isArray(result.data) ? result.data : [];
  return list.map(normalizeBackendProduct);
}

/**
 * Task 5: Mengambil detail satu produk berdasarkan ID (GET /api/products/:id).
 */
export async function fetchProductByIdFromApi(id) {
  const result = await apiRequest(`/products/${id}`, { method: "GET" });
  return normalizeBackendProduct(result.data);
}

/**
 * Task 5: Menambahkan produk baru (POST /api/products).
 */
export async function createProductInApi(formData) {
  const payload = toBackendProductPayload(formData);
  const result = await apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeBackendProduct(result.data);
}

/**
 * Task 5: Memperbarui produk yang ada (PUT /api/products/:id).
 */
export async function updateProductInApi(id, formData, initialData = null) {
  const payload = toBackendProductPayload(formData, initialData);
  const result = await apiRequest(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizeBackendProduct(result.data);
}

/**
 * Task 5: Menambah stok barang masuk (PATCH /api/products/:id/restock).
 */
export async function restockProductInApi(id, jumlah) {
  const result = await apiRequest(`/products/${id}/restock`, {
    method: "PATCH",
    body: JSON.stringify({ jumlah: Math.max(1, Number(jumlah || 1)) }),
  });
  return normalizeBackendProduct(result.data);
}

/**
 * Task 5: Menonaktifkan atau menghapus produk (DELETE /api/products/:id).
 */
export async function deleteProductInApi(id, permanent = false) {
  const endpoint = permanent ? `/products/${id}?permanent=true` : `/products/${id}`;
  return apiRequest(endpoint, { method: "DELETE" });
}

/**
 * Task 5: Mengaktifkan kembali produk yang dinonaktifkan (PATCH /api/products/:id/restore).
 */
export async function restoreProductInApi(id) {
  const result = await apiRequest(`/products/${id}/restore`, {
    method: "PATCH",
  });
  return normalizeBackendProduct(result.data);
}

/**
 * Task 5: Meminta pengiriman notifikasi email stok menipis (POST /api/products/low-stock/notify).
 */
export async function notifyLowStockInApi(email) {
  return apiRequest("/products/low-stock/notify", {
    method: "POST",
    body: email ? JSON.stringify({ email }) : undefined,
  });
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
  process.env.NEXT_PUBLIC_API_URL ||
  "https://stockart-backend-production-5896718b.up.railway.app"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

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
