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

