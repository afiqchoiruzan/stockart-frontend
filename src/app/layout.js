import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Stockart — Kasir & Manajemen Stok",
  description: "Aplikasi manajemen stok dan kasir Toko Kelontong Berkah",
};

// <meta name="viewport" content="width=device-width, initial-scale=1">
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F6F4] text-[#1F2A27] font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
