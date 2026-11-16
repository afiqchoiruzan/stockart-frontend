// Helper data produk. Data produk sekarang diambil dari backend (/api/products);
// file ini hanya berisi konstanta, normalisasi, dan util format.

export const ALL_CATEGORIES = "Semua Kategori";

// Kategori dasar (dipakai sebagai saran saat input); kategori lain diambil dari data backend.
export const DEFAULT_CATEGORIES = [
  "Sembako",
  "Minuman",
  "Cemilan",
  "Kebersihan",
  "Perawatan Diri",
  "Alat Tulis",
];

// Daftar kategori produk yang selaras dengan database backend
export const CATEGORIES = [
  "Semua Kategori",
  "Sembako",
  "Minuman",
  "Cemilan",
  "Kebersihan",
  "Perawatan Diri",
  "Alat Tulis",
  "Umum",
];

// Batas stok menipis jika produk tidak memiliki stokMinimum
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Samakan bentuk produk dari backend agar mudah dipakai komponen UI.
 * Backend: { _id, nama, kodeProduk, barcode?, kategori, hargaBeli, hargaJual, stok, satuan, stokMinimum, aktif }
 */
export function normalizeProduct(p = {}) {
  const rawMin = p.stokMinimum;
  const parsedMin =
    rawMin === undefined || rawMin === null || rawMin === ""
      ? LOW_STOCK_THRESHOLD
      : Number(rawMin);
  const safeMin = Number.isNaN(parsedMin) ? LOW_STOCK_THRESHOLD : Math.max(0, parsedMin);

  return {
    ...p,
    id: p._id || p.id,
    nama: p.nama || "",
    kategori: p.kategori || "Tanpa Kategori",
    kodeProduk: p.kodeProduk || "",
    // Barcode opsional (bisa kosong untuk produk lama)
    barcode: p.barcode || "",
    harga: Number(p.hargaJual ?? p.harga ?? 0),
    hargaJual: Number(p.hargaJual ?? p.harga ?? 0),
    hargaBeli: Number(p.hargaBeli ?? 0),
    stok: Math.max(0, Number(p.stok ?? 0)),
    stokMinimum: safeMin,
    satuan: p.satuan || "pcs",
    aktif: p.aktif !== false,
  };
}

/** Sama dengan definisi backend /low-stock & owner: stok <= stokMinimum (fallback 5 hanya jika null/undefined). */
export function isLowStock(product) {
  const stok = Number(product?.stok ?? 0);
  const rawMinimum = product?.stokMinimum;
  const parsedMinimum =
    rawMinimum === undefined || rawMinimum === null || rawMinimum === ""
      ? LOW_STOCK_THRESHOLD
      : Number(rawMinimum);
  const minimum = Number.isNaN(parsedMinimum)
    ? LOW_STOCK_THRESHOLD
    : Math.max(0, parsedMinimum);
  return stok <= minimum;
}

/** Daftar kategori untuk dropdown filter (selalu diawali "Semua Kategori"). */
export function buildCategoryList(products = []) {
  const cats = new Set();
  products.forEach((p) => {
    if (p.kategori) cats.add(p.kategori);
  });
  return [ALL_CATEGORIES, ...Array.from(cats).sort((a, b) => a.localeCompare(b))];
}

export function formatRupiah(amount) {
  return "Rp" + Number(amount || 0).toLocaleString("id-ID");
}
