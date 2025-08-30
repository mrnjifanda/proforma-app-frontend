import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,

  images: {
    unoptimized: true,
    loader: 'custom',
    loaderFile: './image-loader.js',
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  experimental: {
    esmExternals: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  swcMinify: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  env: {
    COMPANY_NAME: 'Screentech',
    PRIMARY_COLOR: '#3B82F6',
    SECONDARY_COLOR: '#1E40AF',
    ACCENT_COLOR: '#F59E0B',
    LOGO_URL: '/logo.png'
  }
};

export default nextConfig;
