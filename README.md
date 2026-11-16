# StockArt Frontend

UI POS & inventaris Toko Kelontong "Berkah" — Next.js 16 (App Router), React 19, Tailwind CSS 4.
Semua data berasal dari backend `stockart-backend` (Express + MongoDB).

## Menjalankan

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # verifikasi kompilasi semua route
npm run lint
```

Alamat backend diatur lewat `NEXT_PUBLIC_API_URL` di `.env.local` (pengembangan: `http://localhost:5000`).

## Fitur Scan Barcode

Produk bisa dipindai dengan **kamera** (HP/laptop) atau **scanner USB**.
Kode hasil scan dicocokkan ke field `barcode` **atau** `kodeProduk` (tanpa beda huruf besar/kecil),
sehingga produk lama yang belum punya barcode tetap bisa ditemukan lewat kode produknya.

### Kasir — halaman Transaksi (`/kasir/transaksi`)

1. Klik **Scan** di samping kolom pencarian. Kamera belakang terbuka.
2. Arahkan barcode ke bingkai. Saat terbaca: bunyi bip, HP bergetar (bila didukung), dan muncul
   konfirmasi `"<nama> ditambahkan"`. **Kamera tetap terbuka**, jadi barang berikutnya bisa langsung dipindai.
3. Scan barang yang sama lagi untuk menambah qty. Kode yang sama diabaikan selama 1,5 detik sejak
   terakhir terlihat kamera — jauhkan barang sebentar lalu arahkan lagi.
4. Pesan yang mungkin muncul di modal:
   - `Stok "<nama>" habis` / `Stok "<nama>" hanya tersisa N` — barang tidak ditambahkan.
   - `Barcode tidak terdaftar: <kode>` — kode tidak ada di database, atau produknya nonaktif.
5. Tombol **Ganti kamera** muncul bila perangkat punya lebih dari satu kamera.
6. Kolom **input manual** di modal bisa dipakai bila kamera tidak tersedia atau barcode sulit terbaca.
7. Tutup modal (tombol ✕, `Esc`, atau klik di luar modal) — kamera langsung dimatikan.
   Pintasan F2/F4/F9 tidak aktif selama modal terbuka.

**Scanner USB** tetap bekerja tanpa membuka modal: fokus ke kolom pencarian (`F2`), scan, dan scanner
akan mengetik kode + Enter.

### Pemilik — form produk (`/owner/produk`)

- Field **Barcode** (opsional) dengan tombol **Scan**. Scanner di form menutup sendiri setelah satu kode terbaca.
- Validasi: 4–48 karakter tanpa spasi. Kosongkan field lalu simpan untuk **menghapus** barcode.
- Bila produk sudah punya barcode dan kode baru dipindai, muncul konfirmasi
  `Ganti barcode lama (<lama>) dengan <baru>?` sebelum menimpa.
- Barcode yang sudah dipakai produk lain ditolak dengan pesan
  `Barcode sudah digunakan oleh produk lain` di bawah field; form tetap terbuka.
- Barcode tampil di daftar produk dan ikut dicari lewat kolom pencarian.

### Format yang didukung

| Format | Contoh | Keterangan |
|---|---|---|
| **EAN-13** | `8991002100015` | Barcode kemasan pabrik dan barcode dummy `200…` dari seeder. UPC-A (12 digit) ikut terbaca sebagai EAN-13 berawalan `0`. |
| **CODE128** | `PRD-…` | Untuk label cetak berisi `kodeProduk`. |

Format lain (EAN-8, UPC-E, QR code, dll.) **tidak** dibaca kamera; gunakan input manual atau scanner USB.

### Syarat kamera: HTTPS

Browser hanya mengizinkan kamera di **HTTPS** atau `http://localhost`. Jika halaman dibuka lewat
`http://<IP-LAN>:3000`, modal menampilkan pesan bahwa kamera butuh HTTPS dan kasir diarahkan ke input manual.

Untuk uji di HP:

- Halaman **dan** backend harus sama-sama HTTPS: halaman HTTPS tidak boleh memanggil API `http://`
  (diblokir sebagai *mixed content*), dan `localhost` di HP berarti HP itu sendiri.
- Cara termudah: jalankan tunnel HTTPS (mis. Cloudflare Tunnel/ngrok) untuk frontend dan backend,
  isi `NEXT_PUBLIC_API_URL` dengan URL HTTPS backend, tambahkan URL frontend ke `CORS_ORIGIN` backend,
  lalu build ulang frontend. Alternatif: uji di lingkungan yang sudah ter-deploy dengan HTTPS.
- `next dev --experimental-https` membuat sertifikat self-signed untuk `localhost` saja;
  HP akan menampilkan peringatan sertifikat bila diakses lewat IP.

### Menguji dengan lembar barcode

Di repo backend (pakai database uji, **bukan** produksi):

```bash
npm run seed:barcodes   # isi barcode EAN-13 dummy "200…" untuk produk yang belum punya barcode
npm run barcode:sheet   # tulis scripts/output/barcode-sheet.html
```

Buka `scripts/output/barcode-sheet.html` di layar lain (HP/monitor kedua) atau cetak di kertas putih
(`Ctrl+P`, A4), lalu pindai kartunya dari halaman kasir. Produk nonaktif diberi label "Nonaktif" di
lembar tersebut; saat dipindai kasir akan mendapat `Barcode tidak terdaftar`.

### Tips pemindaian

Hasil QA (kamera simulasi, EAN-13): terbaca pada cahaya normal, cahaya redup, gambar agak buram, dan
kemiringan hingga ±20°. **Tidak** terbaca pada cahaya sangat redup dan kemiringan 30° atau lebih.
Jadi: tambah cahaya, pegang barcode sejajar garis bidik, dan jangan terlalu dekat (garis harus tajam).

### Struktur kode terkait

```
src/components/BarcodeScanner.js            # modal kamera (@zxing/browser), props: open, onDetected, onClose, feedback, continuous
src/app/kasir/transaksi/KasirTransaksiClient.js  # tombol Scan + handleScanDetected (lokal → getProductByBarcode)
src/components/owner/ProductFormDrawer.js   # field Barcode + Scan + konfirmasi ganti
src/lib/api.js                              # getProductByBarcode, barcode di normalisasi & payload
```

## Pembayaran QRIS (Midtrans Sandbox)

Kasir bisa menerima pembayaran **QRIS dinamis** di halaman Transaksi (`/kasir/transaksi`).
Saat ini **hanya sandbox**: tidak ada uang asli, pembayaran dilakukan lewat simulator Midtrans.
Detail backend (endpoint, webhook, idempotensi) ada di `../stockart-backend/QRIS_PAYMENT.md`.

### Alur di kasir

1. Isi keranjang, pilih **QRIS**, klik **Bayar** (atau `F9`).
2. Backend menyimpan transaksi **pending** (stok belum dipotong) dan membuat QR di Midtrans.
   Modal menampilkan QR, total, nomor invoice, dan hitung mundur masa berlaku (15 menit).
3. Pelanggan memindai QR. Frontend mengecek `GET /api/transactions/:id/status` setiap **2,5 detik**.
4. Midtrans mengirim webhook ke backend → backend memverifikasi signature, menandai **paid**, dan memotong stok.
   Status *paid* **tidak pernah** di-set dari frontend.
5. Begitu polling melihat *paid*: modal tertutup, keranjang dikosongkan, struk (metode QRIS) tampil.

| Kondisi | Tampilan di modal |
|---|---|
| Membuat QR gagal (mis. key Midtrans belum diatur) | Pesan error + **Coba lagi** |
| Waktu habis (`expired`) atau ditolak (`failed`) | Pesan + **Buat QR ulang** (membuat transaksi & QR baru) |
| Backend sementara tidak terjangkau | "Gagal memeriksa status, mencoba lagi…" — QR tetap tampil, polling lanjut |
| Uang masuk tapi transaksi bermasalah (`paymentNote`) | Peringatan bahwa uang pelanggan perlu dikembalikan — **bukan** struk sukses |

Polling hanya berjalan selama modal terbuka dan status masih *pending*; berhenti saat modal
ditutup, status final, QR dibuat ulang, atau pindah halaman. Alur **Tunai** tidak berubah.

### Menjalankan untuk uji

1. **Backend** — isi `stockart-backend/.env` (server key dari https://dashboard.sandbox.midtrans.com →
   *Settings → Access Keys*, diawali `SB-Mid-server-`). Jangan commit file ini.
   ```env
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx
   MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com
   ```
   Jalankan `npm run dev`, lalu cek key dengan `npm run qris:try`.
2. **Tunnel** — Midtrans butuh URL publik HTTPS untuk webhook:
   ```bash
   ngrok config add-authtoken <token>   # sekali saja
   ngrok http 5000                      # salin URL Forwarding https://....ngrok-free.app
   ```
3. **Notification URL** — dashboard sandbox → *Settings → Payment → Notification URL*:
   `https://<url-ngrok>/api/payments/webhook`. URL ngrok gratis berubah setiap ngrok dijalankan ulang.
4. **Frontend** — `npm run dev`, login sebagai kasir, buat pembayaran QRIS.
5. **Bayar** — di modal klik *URL gambar QR (untuk simulator sandbox)*, salin URL-nya, tempel di
   https://simulator.sandbox.midtrans.com/v2/qris/index, lalu bayar. Struk tampil otomatis dalam ±3 detik.

### Struktur kode terkait

- `src/components/kasir/QrisPaymentModal.js` — modal QR (presentasional): QR (`qrcode.react`), total, hitung mundur, status akhir.
- `src/app/kasir/transaksi/KasirTransaksiClient.js` — membuat QR, polling status, menyelesaikan transaksi.
- `src/lib/api.js` — `apiCreateQrisPayment`, `apiGetTransactionStatus`.

### Keterbatasan

- **Batal** hanya menutup modal; QR di Midtrans tetap bisa dibayar sampai kedaluwarsa. Jika dibayar,
  backend tetap mencatatnya lunas dan memotong stok, tetapi POS tidak lagi menampilkannya.
- Hitung mundur memakai jam perangkat kasir; status kedaluwarsa resmi tetap ditentukan backend.
- Uang bayar/kembalian disimpan di `localStorage` (sama seperti tunai), jadi di perangkat lain tampil "-".

## Referensi Next.js

- [Dokumentasi Next.js](https://nextjs.org/docs)
- Versi Next.js di proyek ini punya perubahan besar; baca juga `node_modules/next/dist/docs/` (lihat `AGENTS.md`).
