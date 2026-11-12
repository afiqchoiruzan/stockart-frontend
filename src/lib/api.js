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

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Jika token kadaluarsa (401) di browser, coba login owner sekali lagi
  if (response.status === 401 && typeof window !== "undefined") {
    const freshToken = await ensureOwnerAuthSession();
    if (freshToken) {
      headers["Authorization"] = `Bearer ${freshToken}`;
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });
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

