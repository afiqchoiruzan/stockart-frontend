import { redirect } from "next/navigation";

// Proses payment sudah terintegrasi di halaman POS (/kasir/transaksi)
export default function PaymentPage() {
  redirect("/kasir/transaksi");
}
