import { formatRupiah } from "./mockProducts";

export { formatRupiah };

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

export const TRANSACTION_STATUSES = [
  { value: "semua", label: "Semua Status" },
  { value: "selesai", label: "Selesai (Lunas)" },
  { value: "batal", label: "Dibatalkan (Void)" },
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

export function formatTanggalSingkat(tanggalStr) {
  if (!tanggalStr) return "-";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
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

