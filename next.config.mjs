/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    instantInsights: {
      // Halaman owner/kasir adalah Client Component yang baru dirender setelah
      // RoleGuard membaca sesi dari localStorage, jadi validasi implisit selalu
      // melaporkan segmen page "dropped from rendering". Hanya validasi segmen
      // yang secara eksplisit mengekspor `instant`.
      validationLevel: "manual-warning",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
