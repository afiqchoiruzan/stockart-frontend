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
 * Backend: { _id, nama, kodeProduk, kategori, hargaBeli, hargaJual, stok, satuan, stokMinimum, aktif }
 */
export function normalizeProduct(p = {}) {
  return {
    ...p,
    id: p._id || p.id,
    nama: p.nama || "",
    kategori: p.kategori || "Tanpa Kategori",
    kodeProduk: p.kodeProduk || "",
    harga: Number(p.hargaJual ?? p.harga ?? 0),
    hargaJual: Number(p.hargaJual ?? p.harga ?? 0),
    hargaBeli: Number(p.hargaBeli ?? 0),
    stok: Number(p.stok ?? 0),
    stokMinimum: Number(p.stokMinimum ?? 0),
    satuan: p.satuan || "pcs",
    aktif: p.aktif !== false,
  };
}

/** Sama dengan definisi backend /low-stock: stok <= stokMinimum. */
export function isLowStock(product) {
  const stok = Number(product?.stok ?? 0);
  const minimum = Number(product?.stokMinimum ?? 0);
  return stok <= (minimum > 0 ? minimum : LOW_STOCK_THRESHOLD);
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
