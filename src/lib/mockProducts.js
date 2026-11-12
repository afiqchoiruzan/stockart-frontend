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

export const LOW_STOCK_THRESHOLD = 5;

export function formatRupiah(amount) {
  return "Rp" + Number(amount || 0).toLocaleString("id-ID");
}

export const INITIAL_PRODUCTS = [];
