import { redirect } from "next/navigation";

// Halaman ini hanya redirect ke /login, jadi tidak ada konten yang bisa
// di-prerender untuk validasi instant navigation.
export const instant = false;

export default function Home() {
  redirect("/login");
}
