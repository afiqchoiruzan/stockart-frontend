# StockArt Frontend

UI POS & inventaris **Toko Kelontong "Berkah"** — dibangun dengan **Next.js 16 (App Router)**, **React 19**, dan **Tailwind CSS 4**.  
Seluruh data terhubung langsung ke backend `stockart-backend` (Express + MongoDB Atlas).

- **Live Web Frontend (Vercel):** https://stockartweb.vercel.app — **akun demo untuk mencoba ada di bawah** 👇

  > **🔑 Akun Demo (login di https://stockartweb.vercel.app/login)**
  >
  > | Role | Username | Password | Halaman setelah login |
  > |:---:|:---:|:---:|:---|
  > | **Owner / Pemilik** | `pemilik` | `gantidulu123` | `/owner/*` (produk, transaksi, laporan) |
  > | **Kasir** | `kasir_amel` | `kasir12345` | `/kasir/*` (POS, katalog, riwayat) |
  >
  > Pilih peran yang sesuai di halaman login. Akun kasir hanya bisa aktif di **1 perangkat** sekaligus.

- **Live Server Backend API (Railway):** https://stockart-backend-production-5896718b.up.railway.app
- **Repositori GitHub Frontend:** https://github.com/afiqchoiruzan/stockart-frontend
- **Repositori GitHub Backend:** https://github.com/AfiqMir/stockart-backend
- **Documenter Postman:** https://documenter.getpostman.com/view/42234832/2sBYB4M79y
- **Laporan PDF (Google Drive):** https://drive.google.com/drive/folders/1q-CFouyNM72jy04lbFyb3o5WhMakrGxF?usp=sharing
- **Video Presentasi (Google Drive):** https://drive.google.com/drive/folders/1Ath5WSGdlr-lRYSO6i36MprdxjWcDUcn?usp=sharing

## Tim Pengembang & Pembagian Tugas Frontend

| No | Nama Anggota | NIM | Modul / Pembagian Tugas Frontend |
|:--:|:---|:---:|:---|
| 1 | **Muhammad Afiq Mirza Choiruzan** | 24/537942/TK/59646 | **Modul `owner/transaksi` & Integrasi Auth**<br>• Halaman monitoring transaksi Owner (`/owner/transaksi`)<br>• Kartu ringkasan performa per kasir (`CashierSummaryCards`), filter kasir, metode bayar, status, & tanggal (`TransactionToolbar`)<br>• Modal Kelola Akun Kasir (`CashierManageModal`: tambah, edit username/password, nonaktifkan/aktifkan, & hapus)<br>• Panel detail struk & cetak (`TransactionDetailPanel`) |
| 2 | **Bagas Adjie Pamungkas** | 24/544718/TK/60547 | **Modul `owner/produk`**<br>• Halaman manajemen produk & inventaris Owner (`/owner/produk`)<br>• Form tambah/ubah produk, quick restock, soft delete/restore, & input barcode (`ProductFormDrawer`)<br>• Daftar kartu & filter produk (`ProductCard`, `ProductToolbar`)<br>• Indikator stok menipis, modal jadwal alert, & input multi-penerima email (`LowStockDropdown`, `LowStockAlertSettingsModal`, `RecipientEmailRow`) |
| 3 | **Amelia Ocha Maharani** | 24/534372/TK/59229 | **Modul `kasir`**<br>• Halaman POS Kasir (`/kasir/transaksi`), keranjang belanja, pembayaran Tunai & QRIS (`QrisPaymentModal`), serta scan barcode (`BarcodeScanner`)<br>• Halaman katalog produk kasir (`/kasir/produk`) & cetak struk (`/kasir/transaksi/invoice/[id]`)<br>• Halaman riwayat transaksi kasir hari ini (`/kasir/riwayat`) dengan filter metode & status pembayaran |
| 4 | **Muhammad Izzuddin Prakoso** | 24/537712/TK/59618 | **Modul `owner/laporan`**<br>• Halaman laporan penjualan Owner (`/owner/laporan`)<br>• Filter periode tanggal & kartu ringkasan KPI (`ReportToolbar`, `ReportSummaryCards`)<br>• Grafik tren omzet & produk terlaris (`RevenueChart`, `TopProductsPanel`)<br>• Ekspor PDF & pengiriman laporan PDF ke email / jadwal otomatis (`SendReportDropdown`, `ReportAutoSendPanel`) |

## Ringkasan Fitur & Hak Akses

- **Login Terpadu (`/login`):** Memilih peran **Owner** atau **Kasir** dengan validasi kecocokan role dari backend, JWT berlaku **8 jam** dengan auto-logout timer, serta pembatasan **1 perangkat aktif** untuk akun kasir.
- **Panel Owner (`/owner/*`):** Manajemen produk & restock, **Kelola Akun Kasir** (tambah, edit username/reset password, *soft-deactivate* agar riwayat lama tetap terjaga, & hapus), monitoring transaksi seluruh kasir (filter kasir, metode `Tunai`/`QRIS`, status `Lunas`/`Menunggu`/`Kedaluwarsa`/`Gagal`/`Dibatalkan`, & tanggal), laporan penjualan + grafik + unduh/kirim PDF ke banyak penerima email, serta pengaturan jadwal notifikasi stok menipis.
- **Panel Kasir (`/kasir/*`):** Transaksi POS cepat (search/scan barcode, Tunai & QRIS), cetak struk, katalog produk aktif (tanpa `hargaBeli`), serta riwayat transaksi kasir yang terkunci hanya untuk **hari ini (WIB)**.

## Poin Nilai Tambah

- **Penyimpanan Berkas di Google Drive:** Laporan penjualan PDF dapat diarsipkan ke Google Drive melalui webhook backend (`GDRIVE_WEBHOOK_URL`). Lihat [Penyimpanan Laporan di Google Drive](#penyimpanan-laporan-di-google-drive).
- **Pengiriman Email Otomatis:** Notifikasi stok menipis (*digest* terjadwal WIB & *critical alert* stok = 0) dan pengiriman laporan penjualan PDF otomatis ke beberapa email penerima (`RecipientEmailRow`) melalui Brevo HTTP API. Lihat [Pengiriman Email Otomatis](#pengiriman-email-otomatis).
- **Payment Gateway:** Pembayaran **QRIS Dinamis** terintegrasi **Midtrans Core API (Sandbox)** (`QrisPaymentModal.js`) lengkap dengan QR Code SVG, hitung mundur 15 menit, polling status, dan verifikasi webhook. Lihat [Pembayaran QRIS](#pembayaran-qris-midtrans-sandbox).
- **Deployment Selain Vercel:** Frontend di-deploy di **Vercel** (`https://stockartweb.vercel.app`), sedangkan backend Express + *scheduler* di-deploy di **Railway Cloud** (`https://stockart-backend-production-5896718b.up.railway.app`) dengan **MongoDB Atlas (Replica Set)**. Lihat [Deployment](#deployment).

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

## Penyimpanan Laporan di Google Drive

Setiap kali laporan penjualan dikirim lewat email, backend bisa ikut menyimpan salinannya ke **Google Drive**.
Backend tidak memakai Google API langsung; ia mengirim laporan ke **Google Apps Script Web App** yang
alamatnya diatur di `GDRIVE_WEBHOOK_URL`. Bila variabel ini kosong, fitur Drive dilewati dan email tetap terkirim.

### Alur

1. Owner mengirim laporan (manual atau terjadwal, lihat [Pengiriman Email Otomatis](#pengiriman-email-otomatis)).
2. Backend mengirim isi laporan ke Web App dengan nama file `Laporan_Stockart_<YYYY-MM-DD>.pdf`.
3. Web App menyimpan file ke folder **`Stockart_Reports`** (dibuat otomatis bila belum ada) dan membagikan
   folder ke email owner.
4. Email laporan memuat tautan ke **file** dan ke **folder** `Stockart_Reports`. Pesan sukses di UI berubah menjadi
   `Laporan berhasil dikirim ke email owner (<email>) dan disimpan ke Google Drive`.

### Di UI Owner (`/owner/laporan`)

- **Kirim Laporan → Kirim Sekarang:** salinan selalu disimpan ke Drive bila `GDRIVE_WEBHOOK_URL` sudah diatur
  (dropdown menampilkan keterangan *"Salinan disimpan ke Google Drive jika sudah diaktifkan di server"*).
- **Panel Kirim Laporan Otomatis:** sakelar **Google Drive** menentukan apakah laporan terjadwal ikut diarsipkan.
  Sakelar nonaktif (abu-abu) dengan keterangan *"Belum tersedia: GDRIVE_WEBHOOK_URL belum diatur di backend"*
  bila backend belum dikonfigurasi.

### Konfigurasi (backend `.env`)

```env
GDRIVE_WEBHOOK_URL=https://script.google.com/macros/s/<id-deployment>/exec
OWNER_EMAIL=owner@example.com   # email yang diberi akses folder Drive
```

### Keterbatasan

- Upload Drive dijalankan **sebelum** email dikirim. Jika Web App mengembalikan error, pengiriman laporan
  dianggap gagal dan email tidak terkirim — cek URL Web App bila muncul pesan
  `Respons Google Drive Web App tidak valid` atau `Gagal menyimpan laporan ke Google Drive`.

### Struktur kode terkait

```
../stockart-backend/services/driveService.js     # uploadReportToDrive → POST ke GDRIVE_WEBHOOK_URL
../stockart-backend/services/reportService.js    # sendReport: upload Drive (opsional) lalu kirim email
src/components/owner/SendReportDropdown.js       # tombol Kirim Laporan (manual)
src/components/owner/ReportAutoSendPanel.js      # sakelar Google Drive pada jadwal otomatis
src/lib/api.js                                   # apiSendReportEmail, apiGet/UpdateReportAutoSendSettings
```

## Pengiriman Email Otomatis

Backend mengirim email melalui **Brevo HTTP API** (`https://api.brevo.com/v3/smtp/email`) bila `BREVO_API_KEY`
diatur; bila tidak, backend memakai cadangan SMTP Gmail (`SMTP_USER`/`SMTP_PASS`). Ada tiga jenis email:
**rekap stok menipis**, **alert kritis stok habis**, dan **laporan penjualan PDF**.

Semua jadwal memakai zona **WIB**. *Scheduler* berjalan di dalam proses backend dan mengecek jadwal
**setiap 60 detik**; saat backend baru menyala, jadwal yang terlewat langsung dikejar (*catch-up*).
Pengiriman yang gagal dicoba ulang hingga **3 kali** per slot jadwal.

### Email penerima (`RecipientEmailRow`)

- Baris **Email Tujuan** menampilkan alamat penerima yang disamarkan. Klik **Ubah**/**Atur**,
  isi satu atau beberapa email dipisah koma, lalu **Simpan Email**.
- **Reset Default** mengembalikan penerima ke `OWNER_EMAIL` di backend.
- Format diperiksa sebelum dikirim; pesan `Format email tidak valid. Pisahkan dengan koma jika lebih dari satu.`
  muncul bila ada alamat yang salah.

### Notifikasi stok menipis — Owner (`/owner/produk`)

Buka ikon **peringatan stok menipis** di halaman produk → **Atur Jadwal** untuk membuka modal **Jadwal Alert Stok**.

1. **Frekuensi Rekap Email Otomatis** (*digest*): **Mati** (hanya manual & kritis), **Harian**, **Mingguan**
   (pilih hari), atau **Bulanan** (pilih tanggal 1–28), ditambah **jam kirim (WIB)**.
   Rekap berisi semua produk dengan `stok <= stokMinimum`. Bila tidak ada produk menipis, status terakhir
   tercatat **Dilewati (Semua Stok Aman)** dan email tidak dikirim.
2. **Alert Instan Saat Stok Produk Habis (0)** (*critical alert*): email dikirim **sekali** segera setelah
   transaksi membuat stok produk menjadi 0 — baik transaksi tunai maupun QRIS yang lunas lewat webhook.
   Alert untuk produk yang sama baru bisa terkirim lagi setelah stoknya kembali > 0 (restock, edit produk,
   atau transaksi dibatalkan).
3. **Kirim Rekap Sekarang (N)** mengirim rekap saat itu juga tanpa menunggu jadwal.
4. Modal menampilkan jadwal berikutnya dan status terakhir: **Terkirim**, **Dilewati (Semua Stok Aman)**,
   **Gagal Mengirim**, atau **Email Belum Dikonfigurasi**.

### Laporan penjualan PDF — Owner (`/owner/laporan`)

- **Kirim Laporan → Kirim Sekarang:** mengirim laporan periode yang sedang difilter. Kolom email boleh
  dikosongkan (memakai penerima default) atau diisi beberapa email dipisah koma.
  Lampiran PDF sama dengan file hasil tombol unduh PDF.
- **Panel Kirim Laporan Otomatis:** nyalakan sakelar **Email**, lalu pilih:

  | Frekuensi | Periode laporan | Pengaturan tambahan |
  |---|---|---|
  | **Harian** | Laporan kemarin | Jam kirim |
  | **Mingguan** | 7 hari terakhir | Hari + jam kirim |
  | **Bulanan** | 1 bulan terakhir | Tanggal (1–28) + jam kirim |

  Klik **Simpan** → muncul `Jadwal laporan otomatis disimpan. Pengiriman berikutnya: <tanggal> WIB.`
  Panel juga menampilkan **Berikutnya: …** dan pesan **Pengiriman terakhir gagal** beserta alasannya bila ada.

Bila backend belum punya kredensial email, jadwal tetap tersimpan tetapi muncul peringatan
*"Email belum dikonfigurasi di server"*.

### Konfigurasi (backend `.env`)

```env
BREVO_API_KEY=xkeysib-xxxxxxxx      # utama (Brevo HTTP API)
EMAIL_FROM=pengirim@domain.com      # alamat pengirim yang sudah diverifikasi di Brevo
OWNER_EMAIL=owner@example.com       # penerima default (boleh beberapa, dipisah koma)
# Cadangan bila BREVO_API_KEY kosong:
# SMTP_USER=akun@gmail.com
# SMTP_PASS=app-password-gmail
```

### Struktur kode terkait

```
src/components/owner/LowStockDropdown.js            # daftar stok menipis + tombol Atur Jadwal
src/components/owner/LowStockAlertSettingsModal.js  # jadwal digest, alert kritis, Kirim Rekap Sekarang
src/components/owner/RecipientEmailRow.js           # ubah / reset email penerima
src/components/owner/SendReportDropdown.js          # kirim laporan manual
src/components/owner/ReportAutoSendPanel.js         # jadwal laporan otomatis
src/lib/emailValidation.js                          # validasi beberapa email dipisah koma
src/lib/api.js                                      # notifyLowStockInApi, apiGet/UpdateLowStockAlertSettings, apiSendReportEmail
../stockart-backend/services/emailService.js        # Brevo API / SMTP + template email
../stockart-backend/services/lowStockDigestService.js, reportScheduleService.js  # scheduler
../stockart-backend/services/lowStockAlertService.js                             # critical alert stok = 0
```

## Deployment

| Bagian | Platform | URL |
|---|---|---|
| Frontend (Next.js) | **Vercel** | https://stockartweb.vercel.app |
| Backend (Express + *scheduler*) | **Railway Cloud** | https://stockart-backend-production-5896718b.up.railway.app |
| Database | **MongoDB Atlas** (Replica Set) | — |

### Mengapa backend tidak di Vercel

- *Scheduler* email (rekap stok & laporan otomatis) berjalan sebagai proses yang terus hidup dan mengecek
  jadwal setiap 60 detik. Railway menjalankan backend sebagai server permanen (`npm start` → `node index.js`),
  sedangkan fungsi serverless Vercel hanya hidup saat ada request.
- Webhook Midtrans (`/api/payments/webhook`) butuh URL HTTPS publik yang stabil — disediakan oleh domain Railway.

### Mengapa MongoDB Atlas Replica Set

Checkout memakai **transaksi MongoDB** (`mongoose.connection.transaction`) agar pengecekan stok, pemotongan stok,
dan penyimpanan transaksi terjadi atomik. Transaksi MongoDB hanya berjalan di Replica Set; cluster Atlas
sudah berbentuk Replica Set secara bawaan.

### Variabel lingkungan

- **Vercel (frontend):** `NEXT_PUBLIC_API_URL=https://stockart-backend-production-5896718b.up.railway.app`.
  Variabel `NEXT_PUBLIC_*` ditanam saat build, jadi **redeploy** frontend setiap kali nilainya diubah.
- **Railway (backend):** `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN` (harus memuat `https://stockartweb.vercel.app`),
  `MIDTRANS_SERVER_KEY`, `MIDTRANS_BASE_URL`, `BREVO_API_KEY`, `EMAIL_FROM`, `OWNER_EMAIL`, dan `GDRIVE_WEBHOOK_URL`.
- **Midtrans dashboard (sandbox):** *Notification URL* =
  `https://stockart-backend-production-5896718b.up.railway.app/api/payments/webhook`.

## Referensi Next.js

- [Dokumentasi Next.js](https://nextjs.org/docs)
- Versi Next.js di proyek ini punya perubahan besar; baca juga `node_modules/next/dist/docs/` (lihat `AGENTS.md`).
