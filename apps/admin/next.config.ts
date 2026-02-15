import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ['@helix/library'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config, { isServer: _isServer }) => {
    // Ensure workspace packages can be resolved
    config.resolve.alias = {
      ...config.resolve.alias,
      '@helix/tokens': path.resolve(__dirname, '../../packages/hx-tokens'),
    };
    return config;
  },
};

export default nextConfig;
