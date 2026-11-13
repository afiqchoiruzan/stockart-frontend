// Helper data transaksi. Data transaksi sekarang diambil dari backend (/api/transactions);
// file ini berisi konstanta, normalisasi respons backend, dan util format.
import { formatRupiah } from "./mockProducts";

export { formatRupiah };

const TIMEZONE = "Asia/Jakarta"; // backend memfilter tanggal dengan offset +07:00

export const TRANSACTION_STATUSES = [
  { value: "semua", label: "Semua Status" },
  { value: "selesai", label: "Selesai (Lunas)" },
  { value: "batal", label: "Dibatalkan (Void)" },
];

// ---------- Info pembayaran (uang bayar & kembalian) ----------
// Backend belum menyimpan uang bayar/kembalian, jadi disimpan lokal di browser kasir.
const PAYMENT_KEY = "stockart_payments";

function readPayments() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PAYMENT_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export function savePaymentInfo(trxId, info) {
  if (typeof window === "undefined" || !trxId) return;
  try {
    const all = readPayments();
    all[trxId] = info;
    localStorage.setItem(PAYMENT_KEY, JSON.stringify(all));
  } catch {
    // abaikan jika storage tidak tersedia
  }
}

// ---------- Format tanggal ----------

/** Date -> "YYYY-MM-DD" (zona WIB) */
export function toDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Date -> "HH:mm" (zona WIB) */
export function toTimeLabel(date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(".", ":");
}

export function formatTanggalSingkat(tanggalStr) {
  if (!tanggalStr) return "-";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const parts = tanggalStr.split("-");
  if (parts.length !== 3) return tanggalStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${months[monthIdx] || parts[1]} ${year}`;
}

export function getTotalItemCount(detailBarang = []) {
  return detailBarang.reduce((acc, item) => acc + Number(item.jumlah || 0), 0);
}

export function makeInvoiceNo(id) {
  return `#TRX-${String(id || "").slice(-6).toUpperCase()}`;
}

function firstName(nama = "") {
  return nama.trim().split(/\s+/)[0] || "Kasir";
}

// ---------- Normalisasi ----------

/**
 * Ubah transaksi dari backend menjadi bentuk yang dipakai komponen UI.
 * Backend: { _id, kasir: {_id, nama, username}, detailBarang: [...], totalHarga, status,
 *            createdAt, dibatalkanPada, dibatalkanOleh }
 */
export function normalizeTransaction(t = {}) {
  const id = t._id || t.id;
  const createdAt = t.createdAt ? new Date(t.createdAt) : new Date();
  const kasirObj = t.kasir && typeof t.kasir === "object" ? t.kasir : null;
  const kasirId = kasirObj?._id || (typeof t.kasir === "string" ? t.kasir : "");
  const namaKasir = kasirObj?.nama || "Kasir";
  const payment = readPayments()[id] || {};

  const dibatalkanPada = t.dibatalkanPada
    ? `${formatTanggalSingkat(toDateKey(new Date(t.dibatalkanPada)))}, ${toTimeLabel(
        new Date(t.dibatalkanPada)
      )} WIB`
    : null;

  return {
    id,
    noInvoice: makeInvoiceNo(id),
    kasirId,
    namaKasir,
    panggilanKasir: firstName(namaKasir),
    usernameKasir: kasirObj?.username || "",
    tanggal: toDateKey(createdAt),
    waktu: toTimeLabel(createdAt),
    createdAt: createdAt.toISOString(),
    metodePembayaran: payment.metodePembayaran || "Tunai",
    status: t.status || "selesai",
    totalHarga: Number(t.totalHarga || 0),
    uangBayar: payment.uangBayar ?? null,
    kembalian: payment.kembalian ?? null,
    dibatalkanPada,
    dibatalkanOleh: t.status === "batal" ? "Pemilik (Owner)" : null,
    detailBarang: (t.detailBarang || []).map((d) => {
      const produkObj = d.produk && typeof d.produk === "object" ? d.produk : null;
      const jumlah = Number(d.jumlah || 0);
      const hargaSatuan = Number(d.hargaSatuan ?? produkObj?.hargaJual ?? 0);
      return {
        produkId: produkObj?._id || d.produk,
        namaProduk: d.namaProduk || produkObj?.nama || "Produk",
        kodeProduk: d.kodeProduk || produkObj?.kodeProduk || "-",
        jumlah,
        hargaSatuan,
        subtotal: Number(d.subtotal ?? jumlah * hargaSatuan),
      };
    }),
  };
}

/**
 * Bangun daftar kasir dari data transaksi (backend belum menyediakan endpoint daftar user).
 */
export function buildCashierList(transactions = []) {
  const map = new Map();
  transactions.forEach((t) => {
    if (t.kasirId && !map.has(t.kasirId)) {
      map.set(t.kasirId, {
        id: t.kasirId,
        nama: t.namaKasir,
        panggilan: t.panggilanKasir,
        username: t.usernameKasir,
      });
    }
  });
  return Array.from(map.values())
    .sort((a, b) => a.nama.localeCompare(b.nama))
    .map((k, idx) => ({ ...k, kode: `KSR-${String(idx + 1).padStart(2, "0")}` }));
}

// ---------- Data contoh (mock) untuk halaman Owner yang belum terhubung ke backend ----------

export const CASHIERS = [
  {
    id: "kasir-1",
    kode: "KSR-01",
    nama: "Budi Santoso",
    panggilan: "Budi",
    username: "kasir_budi",
    shift: "Shift Pagi (07:00 - 15:00)",
    statusAktif: true,
  },
  {
    id: "kasir-2",
    kode: "KSR-02",
    nama: "Siti Aminah",
    panggilan: "Siti",
    username: "kasir_siti",
    shift: "Shift Siang (14:00 - 22:00)",
    statusAktif: true,
  },
  {
    id: "kasir-3",
    kode: "KSR-03",
    nama: "Andi Pratama",
    panggilan: "Andi",
    username: "kasir_andi",
    shift: "Shift Reguler (09:00 - 17:00)",
    statusAktif: true,
  },
];

export const INITIAL_TRANSACTIONS = [
  {
    id: "trx-091",
    noInvoice: "#TRX-091",
    kasirId: "kasir-1",
    namaKasir: "Budi Santoso",
    panggilanKasir: "Budi",
    tanggal: "2026-11-12",
    waktu: "10:15",
    metodePembayaran: "Tunai",
    status: "selesai",
    totalHarga: 74200,
    uangBayar: 100000,
    kembalian: 25800,
    detailBarang: [
      {
        kodeProduk: "BRG-001",
        namaProduk: "Beras 5kg",
        jumlah: 1,
        hargaSatuan: 68000,
        subtotal: 68000,
      },
      {
        kodeProduk: "BRG-010",
        namaProduk: "Mi Instan Goreng",
        jumlah: 2,
        hargaSatuan: 3100,
        subtotal: 6200,
      },
    ],
  },
  {
    id: "trx-090",
    noInvoice: "#TRX-090",
    kasirId: "kasir-2",
    namaKasir: "Siti Aminah",
    panggilanKasir: "Siti",
    tanggal: "2026-11-12",
    waktu: "09:40",
    metodePembayaran: "Tunai",
    status: "selesai",
    totalHarga: 34000,
    uangBayar: 50000,
    kembalian: 16000,
    detailBarang: [
      {
        kodeProduk: "BRG-002",
        namaProduk: "Minyak Bimoli 2L",
        jumlah: 1,
        hargaSatuan: 34000,
        subtotal: 34000,
      },
    ],
  },
  {
    id: "trx-089",
    noInvoice: "#TRX-089",
    kasirId: "kasir-1",
    namaKasir: "Budi Santoso",
    panggilanKasir: "Budi",
    tanggal: "2026-11-12",
    waktu: "09:12",
    metodePembayaran: "QRIS",
    status: "selesai",
    totalHarga: 45500,
    uangBayar: 45500,
    kembalian: 0,
    detailBarang: [
      {
        kodeProduk: "BRG-003",
        namaProduk: "Gula Pasir 1kg",
        jumlah: 1,
        hargaSatuan: 17500,
        subtotal: 17500,
      },
      {
        kodeProduk: "BRG-004",
        namaProduk: "Telur Ayam 1kg",
        jumlah: 1,
        hargaSatuan: 28000,
        subtotal: 28000,
      },
    ],
  },
  {
    id: "trx-088",
    noInvoice: "#TRX-088",
    kasirId: "kasir-2",
    namaKasir: "Siti Aminah",
    panggilanKasir: "Siti",
    tanggal: "2026-11-12",
    waktu: "08:50",
    metodePembayaran: "Tunai",
    status: "selesai",
    totalHarga: 68000,
    uangBayar: 70000,
    kembalian: 2000,
    detailBarang: [
      {
        kodeProduk: "BRG-001",
        namaProduk: "Beras 5kg",
        jumlah: 1,
        hargaSatuan: 68000,
        subtotal: 68000,
      },
    ],
  },
  {
    id: "trx-087",
    noInvoice: "#TRX-087",
    kasirId: "kasir-3",
    namaKasir: "Andi Pratama",
    panggilanKasir: "Andi",
    tanggal: "2026-11-12",
    waktu: "08:25",
    metodePembayaran: "Tunai",
    status: "selesai",
    totalHarga: 49000,
    uangBayar: 50000,
    kembalian: 1000,
    detailBarang: [
      {
        kodeProduk: "BRG-005",
        namaProduk: "Kopi Kapal Api 165g",
        jumlah: 2,
        hargaSatuan: 14000,
        subtotal: 28000,
      },
      {
        kodeProduk: "BRG-009",
        namaProduk: "Deterjen Rinso 770g",
        jumlah: 1,
        hargaSatuan: 21000,
        subtotal: 21000,
      },
    ],
  },
  {
    id: "trx-086",
    noInvoice: "#TRX-086",
    kasirId: "kasir-1",
    namaKasir: "Budi Santoso",
    panggilanKasir: "Budi",
    tanggal: "2026-11-11",
    waktu: "16:30",
    metodePembayaran: "Tunai",
    status: "batal",
    dibatalkanPada: "11 Nov 2026, 16:45 WIB",
    dibatalkanOleh: "Owner (Pemilik)",
    alasanBatal: "Salah input jumlah barang oleh kasir (koreksi struk)",
    totalHarga: 68000,
    uangBayar: 100000,
    kembalian: 32000,
    detailBarang: [
      {
        kodeProduk: "BRG-002",
        namaProduk: "Minyak Bimoli 2L",
        jumlah: 2,
        hargaSatuan: 34000,
        subtotal: 68000,
      },
    ],
  },
  {
    id: "trx-085",
    noInvoice: "#TRX-085",
    kasirId: "kasir-2",
    namaKasir: "Siti Aminah",
    panggilanKasir: "Siti",
    tanggal: "2026-11-11",
    waktu: "15:10",
    metodePembayaran: "QRIS",
    status: "selesai",
    totalHarga: 39000,
    uangBayar: 39000,
    kembalian: 0,
    detailBarang: [
      {
        kodeProduk: "BRG-011",
        namaProduk: "Kecap Manis Bango 520ml",
        jumlah: 1,
        hargaSatuan: 24000,
        subtotal: 24000,
      },
      {
        kodeProduk: "BRG-007",
        namaProduk: "Susu Kental Manis 370g",
        jumlah: 1,
        hargaSatuan: 12000,
        subtotal: 12000,
      },
      {
        kodeProduk: "BRG-012",
        namaProduk: "Garam Beryodium 250g",
        jumlah: 1,
        hargaSatuan: 3000,
        subtotal: 3000,
      },
    ],
  },
  {
    id: "trx-084",
    noInvoice: "#TRX-084",
    kasirId: "kasir-3",
    namaKasir: "Andi Pratama",
    panggilanKasir: "Andi",
    tanggal: "2026-11-11",
    waktu: "13:05",
    metodePembayaran: "Tunai",
    status: "selesai",
    totalHarga: 31000,
    uangBayar: 50000,
    kembalian: 19000,
    detailBarang: [
      {
        kodeProduk: "BRG-010",
        namaProduk: "Mi Instan Goreng",
        jumlah: 10,
        hargaSatuan: 3100,
        subtotal: 31000,
      },
    ],
  },
  {
    id: "trx-083",
    noInvoice: "#TRX-083",
    kasirId: "kasir-3",
    namaKasir: "Andi Pratama",
    panggilanKasir: "Andi",
    tanggal: "2026-11-11",
    waktu: "11:20",
    metodePembayaran: "Tunai",
    status: "batal",
    dibatalkanPada: "11 Nov 2026, 11:25 WIB",
    dibatalkanOleh: "Owner (Pemilik)",
    alasanBatal: "Pelanggan membatalkan pembelian sebelum barang dibawa",
    totalHarga: 17000,
    uangBayar: 20000,
    kembalian: 3000,
    detailBarang: [
      {
        kodeProduk: "BRG-006",
        namaProduk: "Teh Celup Sariwangi 30s",
        jumlah: 2,
        hargaSatuan: 8500,
        subtotal: 17000,
      },
    ],
  },
];

export function getCashierById(kasirId) {
  return CASHIERS.find((k) => k.id === kasirId) || null;
}
