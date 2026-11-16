"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

// Kode yang sama diabaikan selama jeda ini. Jeda dihitung dari terakhir kali
// kode itu terlihat kamera, jadi barang yang ditahan di depan kamera hanya
// terbaca sekali; untuk menambah barang yang sama, jauhkan dulu sesaat.
const DUPLICATE_WINDOW_MS = 1500;

/** Error buatan sendiri untuk kondisi yang terjadi sebelum getUserMedia. */
function cameraError(name) {
  const err = new Error(name);
  err.name = name;
  return err;
}

/** Terjemahkan error kamera browser ke pesan Bahasa Indonesia. */
function getCameraErrorMessage(err) {
  switch (err?.name) {
    case "InsecureContext":
      return "Kamera hanya bisa dipakai lewat HTTPS atau localhost. Masukkan kode secara manual di bawah.";
    case "Unsupported":
      return "Browser ini tidak mendukung akses kamera. Masukkan kode secara manual di bawah.";
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, atau masukkan kode secara manual di bawah.";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "Kamera tidak ditemukan di perangkat ini. Masukkan kode secara manual di bawah.";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "Kamera sedang dipakai aplikasi lain atau tidak dapat dibuka. Tutup aplikasi lain lalu coba lagi, atau masukkan kode secara manual.";
    default:
      return "Gagal membuka kamera. Masukkan kode secara manual di bawah.";
  }
}

/** Hentikan semua track agar lampu kamera mati. */
function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function openCameraStream(deviceId) {
  if (typeof window === "undefined" || !window.isSecureContext) {
    throw cameraError("InsecureContext");
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw cameraError("Unsupported");
  }
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { ideal: "environment" } }, // utamakan kamera belakang
  });
}

/**
 * Modal pemindai barcode berbasis kamera (@zxing/browser).
 * Props:
 *  - open: tampilkan modal & nyalakan kamera
 *  - onDetected(code): dipanggil setiap kode berhasil terbaca / diinput manual
 *  - onClose(): dipanggil saat pengguna menutup modal
 *  - feedback (opsional): { type: "success" | "error" | "info", message }
 *    pesan singkat hasil pemrosesan kode, ditampilkan di dalam modal
 * Kamera dimatikan saat modal ditutup atau komponen di-unmount.
 */
export default function BarcodeScanner({ open, onDetected, onClose, feedback }) {
  if (!open) return null;
  return (
    <ScannerModal
      onDetected={onDetected}
      onClose={onClose}
      feedback={feedback}
    />
  );
}

const FEEDBACK_STYLES = {
  success: "border-[#3E8E6A]/30 bg-[#E6F2EC] text-[#3E8E6A]",
  error: "border-[#C4574F]/30 bg-[#F8E8E6] text-[#C4574F]",
  info: "border-[#E1E4E0] bg-[#F5F6F4] text-[#6B7773]",
};

function ScannerModal({ onDetected, onClose, feedback }) {
  const videoRef = useRef(null);
  const manualInputRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastSeenRef = useRef({ code: "", at: 0 });

  // null = kamera default (belakang); selain itu deviceId pilihan pengguna
  const [deviceId, setDeviceId] = useState(null);
  const [activeDeviceId, setActiveDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState("starting"); // starting | scanning | error
  const [errorMessage, setErrorMessage] = useState("");
  const [lastCode, setLastCode] = useState("");
  const [manualCode, setManualCode] = useState("");

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 1800;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Bunyi hanya pelengkap; abaikan jika browser menolak.
    }
  };

  const emitCode = (code) => {
    setLastCode(code);
    playBeep();
    try {
      // Browser menolak (dan mencatat peringatan) vibrate sebelum ada interaksi pengguna.
      if (navigator.userActivation?.hasBeenActive !== false) {
        navigator.vibrate?.(80);
      }
    } catch {
      // Getar tidak didukung (mis. Safari iOS).
    }
    onDetected?.(code);
  };

  // Dipanggil dari loop zxing; useEffectEvent agar selalu memakai props terbaru
  // tanpa memulai ulang kamera.
  const handleScanResult = useEffectEvent((rawText) => {
    // Selalu string (jangan Number): barcode bisa berawalan 0 dan lebih
    // panjang dari batas presisi angka JavaScript.
    const code = String(rawText ?? "").trim();
    if (!code) return;
    const now = Date.now();
    const last = lastSeenRef.current;
    const isDuplicate =
      last.code === code && now - last.at < DUPLICATE_WINDOW_MS;
    lastSeenRef.current = { code, at: now };
    if (!isDuplicate) emitCode(code);
  });

  const handleCameraError = useEffectEvent((err) => {
    setStatus("error");
    setErrorMessage(getCameraErrorMessage(err));
    manualInputRef.current?.focus();
  });

  // Nyalakan kamera & mulai pemindaian; dijalankan ulang saat ganti kamera.
  useEffect(() => {
    let cancelled = false;
    let stream = null;
    let controls = null;
    const video = videoRef.current;

    openCameraStream(deviceId)
      .then(async (mediaStream) => {
        stream = mediaStream;
        if (cancelled) return stopStream(stream);

        const track = stream.getVideoTracks()[0];
        setActiveDeviceId(track?.getSettings?.().deviceId || null);

        // Label & daftar kamera baru lengkap setelah izin diberikan.
        const allDevices = await navigator.mediaDevices
          .enumerateDevices()
          .catch(() => []);
        if (cancelled) return stopStream(stream);
        setDevices(allDevices.filter((d) => d.kind === "videoinput"));

        // Library dimuat saat dibutuhkan saja (hanya di browser).
        const [{ BrowserMultiFormatOneDReader }, { BarcodeFormat, DecodeHintType }] =
          await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
        if (cancelled) return stopStream(stream);

        // Hanya EAN-13 (kemasan; UPC-A ikut terbaca sebagai EAN-13 berawalan 0)
        // dan Code 128 (label kodeProduk). Sengaja tidak memakai
        // BrowserMultiFormatReader: di @zxing/library 0.23 ia mencetak
        // console.warn di setiap frame yang tidak berisi barcode.
        const hints = new Map([
          [
            DecodeHintType.POSSIBLE_FORMATS,
            [BarcodeFormat.EAN_13, BarcodeFormat.CODE_128],
          ],
        ]);
        const reader = new BrowserMultiFormatOneDReader(hints, {
          delayBetweenScanAttempts: 150,
          delayBetweenScanSuccess: 300,
        });
        controls = await reader.decodeFromStream(
          stream,
          video,
          (result) => {
            if (result) handleScanResult(result.getText());
          }
        );
        if (cancelled) {
          controls.stop();
          return stopStream(stream);
        }
        setStatus("scanning");
      })
      .catch((err) => {
        stopStream(stream);
        if (!cancelled) handleCameraError(err);
      });

    return () => {
      cancelled = true;
      controls?.stop();
      stopStream(stream);
      if (video) video.srcObject = null;
    };
  }, [deviceId]);

  // Tutup AudioContext saat modal hilang.
  useEffect(
    () => () => {
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    },
    []
  );

  // Esc menutup modal.
  const handleEscape = useEffectEvent((e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose?.();
    }
  });
  useEffect(() => {
    const listener = (e) => handleEscape(e);
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, []);

  const handleSwitchCamera = () => {
    if (devices.length < 2) return;
    const currentIdx = devices.findIndex((d) => d.deviceId === activeDeviceId);
    const next = devices[(currentIdx + 1) % devices.length];
    setStatus("starting");
    setErrorMessage("");
    setDeviceId(next.deviceId);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    // Input manual disengaja: tidak terkena aturan jeda duplikat, dan tidak
    // mengubah catatan kode kamera terakhir (agar barang yang masih di depan
    // kamera tidak terbaca ulang).
    emitCode(code);
    setManualCode("");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1F2A27]/40 flex items-center justify-center p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Scan barcode"
    >
      <div
        className="bg-white border border-[#E1E4E0] rounded-xl w-full max-w-110 max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[#E1E4E0] flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[#1F2A27]">
              Scan barcode
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              Arahkan barcode produk ke kamera.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemindai"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#6B7773] hover:bg-[#F5F6F4] hover:text-[#1F2A27] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Area kamera */}
          {status === "error" ? (
            <div
              role="alert"
              className="rounded-lg border border-[#C4574F]/30 bg-[#F8E8E6] px-3 py-3 text-xs text-[#C4574F]"
            >
              {errorMessage}
            </div>
          ) : (
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-[#1F2A27]">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                playsInline
                autoPlay
              />
              {/* Bingkai bidik */}
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-md border-2 border-white/80 shadow-[0_0_0_9999px_rgba(31,42,39,0.35)]" />
              {status === "starting" && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/90">
                  Membuka kamera...
                </div>
              )}
            </div>
          )}

          {/* Hasil terakhir & ganti kamera */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0 text-[#6B7773]">
              Terbaca:{" "}
              <span
                data-testid="scanner-last-code"
                className="font-mono font-medium text-[#1F2A27] break-all"
              >
                {lastCode || "-"}
              </span>
            </div>
            {devices.length > 1 && status !== "error" && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                disabled={status === "starting"}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-[#E1E4E0] bg-white font-medium text-[#1F2A27] hover:bg-[#F5F6F4] disabled:opacity-50 transition-colors"
              >
                Ganti kamera
              </button>
            )}
          </div>

          {/* Hasil pemrosesan kode dari halaman (mis. "<nama> ditambahkan") */}
          {feedback?.message && (
            <div
              data-testid="scanner-feedback"
              aria-live="polite"
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                FEEDBACK_STYLES[feedback.type] || FEEDBACK_STYLES.info
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Input manual sebagai cadangan */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              ref={manualInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ketik kode barcode / kode produk"
              aria-label="Kode barcode manual"
              className="flex-1 min-w-0 rounded-lg border border-[#E1E4E0] bg-white px-3 py-2 text-xs text-[#1F2A27] placeholder:text-[#6B7773] focus:outline-none focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#E6F0ED]"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="shrink-0 px-3 py-2 rounded-lg bg-[#2F6F5E] text-xs font-semibold text-white hover:bg-[#255a4c] disabled:opacity-50 transition-colors"
            >
              Tambah
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
