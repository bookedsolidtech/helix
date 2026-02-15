import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@wc-2026/library', '@wc-2026/tokens'],
};

export default nextConfig;
