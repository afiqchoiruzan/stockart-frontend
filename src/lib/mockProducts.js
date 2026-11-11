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

export const LOW_STOCK_THRESHOLD = 5;

export function formatRupiah(amount) {
  return "Rp" + Number(amount || 0).toLocaleString("id-ID");
}
