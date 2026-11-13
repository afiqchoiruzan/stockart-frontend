import KasirRiwayatClient from "./KasirRiwayatClient";

// Halaman ini berada di balik RoleGuard (cek sesi di client), sehingga
// tidak bisa di-prerender untuk validasi instant navigation.
export const instant = false;

export default function KasirRiwayatPage() {
  return <KasirRiwayatClient />;
}
