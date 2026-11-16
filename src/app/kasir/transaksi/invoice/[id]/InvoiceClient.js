"use client";

import { use, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { apiGetTransactionById } from "@/lib/api";
import {
  formatRupiah,
  formatTanggalSingkat,
  normalizeTransaction,
} from "@/lib/mockTransactions";

function InvoiceContent({ id }) {
  const [trx, setTrx] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiGetTransactionById(id)
      .then((res) => {
        if (active) setTrx(normalizeTransaction(res.data));
      })
      .catch((err) => {
        if (active)
          setError(err.message || "Gagal mengambil invoice dari server.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white border border-[#E1E4E0] rounded-lg text-center text-[13px] text-[#6B7773]">
        Memuat struk transaksi…
      </div>
    );
  }

  if (error || !trx) {
    return (
      <div className="max-w-md mx-auto p-6 border border-[#EBC5C1] rounded-lg bg-[#F8E8E6] text-xs text-[#C4574F] flex flex-col gap-3">
        <p className="font-medium">{error || "Invoice tidak ditemukan."}</p>
        <Link
          href="/kasir/riwayat"
          className="self-start px-3 py-1.5 border border-[#E1E4E0] rounded-md text-xs font-semibold bg-white text-[#1F2A27] hover:bg-[#FAFBF9]"
        >
          ← Kembali ke Riwayat
        </Link>
      </div>
    );
  }

  const hasPayment = trx.uangBayar !== null;

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link
          href="/kasir/riwayat"
          className="min-h-11 lg:min-h-0 px-3 py-1.5 border border-[#E1E4E0] rounded-lg text-xs font-semibold text-[#1F2A27] bg-white hover:bg-[#FAFBF9] transition-colors inline-flex items-center gap-1"
        >
          ← Kembali ke Riwayat
        </Link>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F2EC] text-[#3E8E6A]">
          Lunas
        </span>
      </div>

      <div
        id="printable-receipt"
        className="bg-white border border-[#E1E4E0] rounded-xl overflow-hidden shadow-sm"
      >
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#E1E4E0] flex flex-wrap items-center justify-between gap-x-3 gap-y-1 print:hidden">
          <h1 className="text-sm font-semibold text-[#1F2A27]">
            Struk Transaksi
          </h1>
          <span className="font-mono text-xs text-[#6B7773]">
            {trx.noInvoice}
          </span>
        </div>

        <div className="p-4 sm:p-5 text-xs">
          <div className="text-center">
            <h2 className="text-sm font-bold text-[#1F2A27]">
              Toko Kelontong Berkah
            </h2>
            <p className="text-[11px] text-[#6B7773]">
              Jl. Kaliurang Km 5, Yogyakarta
            </p>
          </div>

          <div className="border-t border-dashed border-[#E1E4E0] my-3" />

          <div className="space-y-1 text-[#1F2A27]">
            <div className="flex justify-between">
              <span className="text-[#6B7773]">Invoice</span>
              <span className="font-mono font-medium">{trx.noInvoice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7773]">Waktu</span>
              <span className="font-mono">
                {formatTanggalSingkat(trx.tanggal)}, {trx.waktu}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7773]">Kasir</span>
              <span>{trx.namaKasir}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7773]">Metode</span>
              <span>{trx.metodePembayaran || "Tunai"}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-[#E1E4E0] my-3" />

          <div className="space-y-2">
            {trx.detailBarang.map((item, idx) => (
              <div key={idx}>
                <div className="font-medium text-[#1F2A27]">
                  {item.namaProduk}
                </div>
                <div className="flex justify-between gap-2 text-[#6B7773] font-mono">
                  <span>
                    {item.jumlah} × {formatRupiah(item.hargaSatuan)}
                  </span>
                  <span className="text-[#1F2A27]">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-[#E1E4E0] my-3" />

          <div className="space-y-1 font-mono">
            <div className="flex justify-between font-bold text-[13px] text-[#1F2A27] pt-0.5">
              <span>Total</span>
              <span>{formatRupiah(trx.totalHarga)}</span>
            </div>
            <div className="flex justify-between text-[#6B7773]">
              <span>Dibayar</span>
              <span>
                {hasPayment
                  ? formatRupiah(trx.uangBayar)
                  : formatRupiah(trx.totalHarga)}
              </span>
            </div>
            <div className="flex justify-between text-[#6B7773]">
              <span>Kembali</span>
              <span>
                {hasPayment ? formatRupiah(trx.kembalian) : formatRupiah(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-3.5 border-t border-[#E1E4E0] bg-[#FAFBF9] print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full min-h-11 py-2.5 px-4 rounded-lg bg-[#2F6F5E] hover:bg-[#255a4c] text-white font-semibold text-[13px] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Cetak struk
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceUnwrapper({ params }) {
  const { id } = use(params);
  return <InvoiceContent id={id} />;
}

export default function InvoiceClient({ params }) {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-xs text-[#6B7773]">Memuat struk…</div>
      }
    >
      <InvoiceUnwrapper params={params} />
    </Suspense>
  );
}
