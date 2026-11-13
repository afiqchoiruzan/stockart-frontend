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

export const INITIAL_PRODUCTS = [
  {
    id: "mock-prd-1",
    kodeProduk: "PRD-MOCK-001",
    nama: "Minyak Goreng Sania 2L",
    kategori: "Sembako",
    harga: 36000,
    hargaJual: 36000,
    hargaBeli: 31000,
    stok: 3,
    satuan: "pcs",
    stokMinimum: 5,
    isLowStock: true,
  },
  {
    id: "mock-prd-2",
    kodeProduk: "PRD-MOCK-002",
    nama: "Beras Rojolele 5kg",
    kategori: "Sembako",
    harga: 68000,
    hargaJual: 68000,
    hargaBeli: 60000,
    stok: 12,
    satuan: "sak",
    stokMinimum: 5,
    isLowStock: false,
  },
  {
    id: "mock-prd-3",
    kodeProduk: "PRD-MOCK-003",
    nama: "Telur Ayam Negeri 1kg",
    kategori: "Sembako",
    harga: 28000,
    hargaJual: 28000,
    hargaBeli: 25000,
    stok: 2,
    satuan: "kg",
    stokMinimum: 5,
    isLowStock: true,
  },
  {
    id: "mock-prd-4",
    kodeProduk: "PRD-MOCK-004",
    nama: "Kopi Kapal Api Special Mix 10s",
    kategori: "Minuman",
    harga: 15000,
    hargaJual: 15000,
    hargaBeli: 12500,
    stok: 25,
    satuan: "pack",
    stokMinimum: 5,
    isLowStock: false,
  },
  {
    id: "mock-prd-5",
    kodeProduk: "PRD-MOCK-005",
    nama: "Aqua Air Mineral 600ml",
    kategori: "Minuman",
    harga: 4000,
    hargaJual: 4000,
    hargaBeli: 3000,
    stok: 40,
    satuan: "botol",
    stokMinimum: 10,
    isLowStock: false,
  },
  {
    id: "mock-prd-6",
    kodeProduk: "PRD-MOCK-006",
    nama: "Indomie Goreng Spesial",
    kategori: "Cemilan",
    harga: 3500,
    hargaJual: 3500,
    hargaBeli: 2900,
    stok: 0,
    satuan: "bungkus",
    stokMinimum: 10,
    isLowStock: true,
  },
  {
    id: "mock-prd-7",
    kodeProduk: "PRD-MOCK-007",
    nama: "Sabun Mandi Lifebuoy 85g",
    kategori: "Perawatan Diri",
    harga: 4500,
    hargaJual: 4500,
    hargaBeli: 3800,
    stok: 8,
    satuan: "pcs",
    stokMinimum: 5,
    isLowStock: false,
  },
  {
    id: "mock-prd-8",
    kodeProduk: "PRD-MOCK-008",
    nama: "Deterjen Rinso Molto 770g",
    kategori: "Kebersihan",
    harga: 22500,
    hargaJual: 22500,
    hargaBeli: 19500,
    stok: 4,
    satuan: "pcs",
    stokMinimum: 5,
    isLowStock: true,
  },
];
