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
        if (active) setError(err.message || "Gagal mengambil invoice dari server.");
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
      <div className="p-6 border-2 border-black rounded bg-neutral-50 font-mono text-sm">
        Memuat invoice...
      </div>
    );
  }

  if (error || !trx) {
    return (
      <div className="max-w-xl mx-auto p-6 border-2 border-black rounded bg-red-50 text-sm text-red-800 flex flex-col gap-3">
        <p>
          <span className="font-mono font-bold">[!]</span> {error || "Invoice tidak ditemukan."}
        </p>
        <Link
          href="/kasir/riwayat"
          className="self-start px-3 py-1.5 border-2 border-black rounded text-xs font-mono font-bold bg-white text-black"
        >
          [&larr; Kembali ke Riwayat]
        </Link>
      </div>
    );
  }

  const hasPayment = trx.uangBayar !== null;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice Transaksi</h1>
          <p className="text-xs text-neutral-500">Data dari server backend</p>
        </div>
        <Link
          href="/kasir/riwayat"
          className="px-4 py-2 min-h-[44px] border-2 border-black rounded text-sm font-bold bg-white hover:bg-neutral-200 transition-colors flex items-center"
        >
          ← Kembali ke Riwayat
        </Link>
      </header>

      <div className="border-2 border-black rounded p-6 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center pb-4 border-b border-dashed border-black">
          <p className="font-bold text-lg">INVOICE {trx.noInvoice}</p>
          <p className="text-sm text-neutral-600">Toko Kelontong Berkah</p>
          <p className="text-xs text-neutral-500 mt-1">
            Kasir: {trx.namaKasir} | {formatTanggalSingkat(trx.tanggal)} — {trx.waktu}
          </p>
          {trx.status === "batal" && (
            <p className="mt-2 inline-block text-xs font-bold border-2 border-black rounded px-2 py-0.5 bg-neutral-200">
              TRANSAKSI DIBATALKAN (VOID)
            </p>
          )}
        </div>

        <div className="py-4 space-y-2">
          {trx.detailBarang.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>
                {item.jumlah}x {item.namaProduk}
                <span className="text-xs text-neutral-500">
                  {" "}
                  @ {formatRupiah(item.hargaSatuan)}
                </span>
              </span>
              <span className="font-mono">{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-dashed border-black space-y-1">
          <div className="flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span className="text-red-600">{formatRupiah(trx.totalHarga)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Bayar:</span>
            <span>{hasPayment ? formatRupiah(trx.uangBayar) : "-"}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Kembali:</span>
            <span>{hasPayment ? formatRupiah(trx.kembalian) : "-"}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-black">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full min-h-[48px] px-4 py-3 border-2 border-black rounded text-sm font-bold bg-white hover:bg-neutral-100 transition-colors"
          >
            Print Invoice
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
    <Suspense fallback={<div className="p-4">Memuat...</div>}>
      <InvoiceUnwrapper params={params} />
    </Suspense>
  );
}
