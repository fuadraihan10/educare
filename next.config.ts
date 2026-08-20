import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ['@vercel/blob'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-table'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24,
  },
};

export default nextConfig;
