import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Compress all text responses (HTML, JS, CSS, JSON) ──
  compress: true,

  // ── Image optimization ──
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24h CDN cache
    deviceSizes: [375, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
  },

  // ── Package import optimization ──
  experimental: {
    optimizePackageImports: [
      'framer-motion',
    ],
  },

  // ── Headers ──
  async headers() {
    return [
      {
        // Security & prefetch headers for HTML
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
