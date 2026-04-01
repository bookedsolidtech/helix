import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // HELiX web components require transpilation in Next.js App Router
  // because they use ES module syntax and Lit decorators
  transpilePackages: ['@helixui/library', '@helixui/react', '@lit/react', 'lit'],
};

export default nextConfig;
