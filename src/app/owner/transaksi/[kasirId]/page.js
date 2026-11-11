import { Suspense } from "react";

async function KasirDetailContent({ params }) {
  const { kasirId } = await params;
  return <div className="p-4">Detail Transaksi Kasir #{kasirId}</div>;
}

export default function OwnerTransaksiKasirPage({ params }) {
  return (
    <Suspense fallback={<div className="p-4">Memuat...</div>}>
      <KasirDetailContent params={params} />
    </Suspense>
  );
}
