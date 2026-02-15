import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@helix/library', '@helix/tokens'],
};

export default nextConfig;
