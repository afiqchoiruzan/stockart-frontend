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

// Data contoh (mock) untuk halaman Owner yang belum terhubung ke backend.
export const CATEGORIES = [
  "Semua Kategori",
  "Sembako",
  "Minuman",
  "Kebutuhan Rumah",
  "Makanan Instan",
  "Bumbu Dapur",
];

export const INITIAL_PRODUCTS = [
  {
    id: "p1",
    nama: "Beras 5kg",
    kategori: "Sembako",
    harga: 68000,
    stok: 25,
  },
  {
    id: "p2",
    nama: "Minyak Bimoli 2L",
    kategori: "Sembako",
    harga: 34000,
    stok: 3,
  },
  {
    id: "p3",
    nama: "Gula Pasir 1kg",
    kategori: "Sembako",
    harga: 17500,
    stok: 18,
  },
  {
    id: "p4",
    nama: "Telur Ayam 1kg",
    kategori: "Sembako",
    harga: 28000,
    stok: 4,
  },
  {
    id: "p5",
    nama: "Kopi Kapal Api 165g",
    kategori: "Minuman",
    harga: 14000,
    stok: 30,
  },
  {
    id: "p6",
    nama: "Teh Celup Sariwangi 30s",
    kategori: "Minuman",
    harga: 8500,
    stok: 2,
  },
  {
    id: "p7",
    nama: "Susu Kental Manis 370g",
    kategori: "Minuman",
    harga: 12000,
    stok: 15,
  },
  {
    id: "p8",
    nama: "Sabun Mandi Lifebuoy 85g",
    kategori: "Kebutuhan Rumah",
    harga: 4500,
    stok: 42,
  },
  {
    id: "p9",
    nama: "Deterjen Rinso 770g",
    kategori: "Kebutuhan Rumah",
    harga: 21000,
    stok: 5,
  },
  {
    id: "p10",
    nama: "Mi Instan Goreng",
    kategori: "Makanan Instan",
    harga: 3100,
    stok: 120,
  },
  {
    id: "p11",
    nama: "Kecap Manis Bango 520ml",
    kategori: "Bumbu Dapur",
    harga: 24000,
    stok: 12,
  },
  {
    id: "p12",
    nama: "Garam Beryodium 250g",
    kategori: "Bumbu Dapur",
    harga: 3000,
    stok: 22,
  },
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
