"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatRupiah } from "@/lib/mockProducts";

/** Sisa detik → "MM:SS". */
function formatCountdown(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const FINAL_MESSAGES = {
  expired: "QR kedaluwarsa. Pelanggan belum membayar.",
  failed: "Pembayaran QRIS gagal atau dibatalkan oleh penyedia pembayaran.",
};

/**
 * Modal pembayaran QRIS (presentasional).
 * Props:
 *  - open: tampilkan modal
 *  - loading: QR sedang dibuat di backend
 *  - error: pesan error pembuatan QR / pengecekan status (string)
 *  - payment: { qrString, totalHarga, expiresAt, noInvoice, qrImageUrl } atau null
 *  - status: status pembayaran dari backend: "pending" | "expired" | "failed" | "paid"
 *    ("paid" hanya sampai ke modal jika ada paymentNote; paid normal ditangani halaman)
 *  - note: paymentNote dari backend (uang masuk tapi transaksi bermasalah)
 *  - pollWarning: pesan sementara saat pengecekan status gagal (polling tetap jalan)
 *  - onCancel(): tombol Batal / Tutup
 *  - onRetry(): tombol Coba lagi / Buat QR ulang (membuat transaksi + QR baru)
 * Status lunas TIDAK ditentukan di sini; hanya webhook backend yang bisa
 * menandai transaksi paid.
 */
export default function QrisPaymentModal({ open, ...props }) {
  if (!open) return null;
  // key per transaksi: timer hitung mundur mulai bersih untuk setiap QR baru.
  return <QrisModal key={props.payment?.transactionId || "baru"} {...props} />;
}

function QrisModal({
  loading,
  error,
  payment,
  status = "pending",
  note,
  pollWarning,
  onCancel,
  onRetry,
}) {
  // Detak 1 detik untuk hitung mundur. Dihitung dari jam perangkat kasir.
  const [now, setNow] = useState(() => Date.now());
  const expiresAtMs = payment?.expiresAt
    ? new Date(payment.expiresAt).getTime()
    : NaN;
  const hasExpiry = Number.isFinite(expiresAtMs);
  const remainingSeconds = hasExpiry
    ? Math.ceil((expiresAtMs - now) / 1000)
    : null;

  const paidWithNote = status === "paid";
  // Kedaluwarsa menurut timer lokal: tampilkan opsi buat ulang tanpa menunggu
  // server. Polling tetap jalan sampai server menyatakan status final.
  const localExpired =
    status === "pending" && remainingSeconds !== null && remainingSeconds <= 0;
  const finalStatus =
    status === "expired" || status === "failed"
      ? status
      : localExpired
        ? "expired"
        : null;
  const showQr = !loading && !error && payment && !finalStatus && !paidWithNote;

  useEffect(() => {
    if (!showQr || !hasExpiry) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [showQr, hasExpiry]);

  const canRecreate = !loading && (Boolean(error) || Boolean(finalStatus));

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1F2A27]/40 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Pembayaran QRIS"
    >
      <div className="bg-white border border-[#E1E4E0] rounded-xl w-full max-w-100 max-h-[calc(100dvh-24px)] sm:max-h-[90dvh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[#E1E4E0]">
          <h3 className="text-[15px] font-semibold text-[#1F2A27]">
            Pembayaran QRIS
          </h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            Minta pelanggan memindai QR dengan aplikasi pembayaran.
          </p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-12 text-center text-[13px] text-[#6B7773]">
              Membuat kode QR…
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-lg border border-[#C4574F]/30 bg-[#F8E8E6] px-3 py-3 text-xs text-[#C4574F]"
            >
              {error}
            </div>
          ) : paidWithNote ? (
            <div
              role="alert"
              data-testid="qris-paid-note"
              className="rounded-lg border border-[#D9A441]/40 bg-[#FBF1DC] px-3 py-3 text-xs text-[#1F2A27] space-y-1"
            >
              <div className="font-semibold">
                Pembayaran diterima, tetapi transaksi tidak dapat diselesaikan.
              </div>
              <div>{note}</div>
              {payment && (
                <div className="font-mono text-[11px] text-[#6B7773]">
                  {payment.noInvoice} · {formatRupiah(payment.totalHarga)}
                </div>
              )}
            </div>
          ) : finalStatus ? (
            <div
              role="alert"
              data-testid="qris-final-status"
              className="rounded-lg border border-[#C4574F]/30 bg-[#F8E8E6] px-3 py-3 text-xs text-[#C4574F]"
            >
              {FINAL_MESSAGES[finalStatus]} Buat QR ulang untuk mencoba lagi.
            </div>
          ) : payment ? (
            <QrisBody payment={payment} remainingSeconds={remainingSeconds} />
          ) : null}

          {showQr && (
            <div
              aria-live="polite"
              className="mt-3 text-center text-[11px] text-[#6B7773]"
            >
              {pollWarning || "Menunggu pembayaran… status diperbarui otomatis."}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#E1E4E0] flex justify-end gap-2">
          {canRecreate && (
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 sm:flex-none min-h-11 lg:min-h-0 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#2F6F5E] hover:bg-[#255a4c] transition-colors cursor-pointer"
            >
              {finalStatus ? "Buat QR ulang" : "Coba lagi"}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 sm:flex-none min-h-11 lg:min-h-0 px-3.5 py-2 border border-[#E1E4E0] rounded-lg text-[13px] font-semibold text-[#1F2A27] bg-white hover:bg-[#FAFBF9] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {paidWithNote ? "Tutup" : "Batal"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** QR + nominal + hitung mundur. */
function QrisBody({ payment, remainingSeconds }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-center">
        <div className="text-xs text-[#6B7773]">Total bayar</div>
        <div
          data-testid="qris-amount"
          className="font-mono text-xl font-bold text-[#1F2A27]"
        >
          {formatRupiah(payment.totalHarga)}
        </div>
        {payment.noInvoice && (
          <div className="font-mono text-[11px] text-[#6B7773] mt-0.5">
            {payment.noInvoice}
          </div>
        )}
      </div>

      <div className="w-full max-w-[258px] p-3 bg-white border border-[#E1E4E0] rounded-lg [&>svg]:block [&>svg]:w-full [&>svg]:h-auto">
        <QRCodeSVG
          value={payment.qrString}
          size={232}
          level="M"
          marginSize={2}
          title="QRIS"
        />
      </div>

      {remainingSeconds !== null ? (
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            remainingSeconds <= 60
              ? "bg-[#FBF1DC] text-[#D9A441]"
              : "bg-[#E6F0ED] text-[#2F6F5E]"
          }`}
        >
          Berlaku{" "}
          <span data-testid="qris-countdown" className="font-mono">
            {formatCountdown(remainingSeconds)}
          </span>
        </div>
      ) : (
        <div className="text-xs text-[#6B7773]">
          Waktu kedaluwarsa tidak tersedia.
        </div>
      )}

      {/* Hanya untuk uji sandbox: URL gambar QR ditempel di simulator Midtrans */}
      {payment.qrImageUrl && (
        <a
          href={payment.qrImageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[#6B7773] underline break-all text-center"
        >
          URL gambar QR (untuk simulator sandbox)
        </a>
      )}
    </div>
  );
}
