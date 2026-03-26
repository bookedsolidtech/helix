import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/breadcrumb-utils.ts',
        'src/lib/issues-loader.ts',
        'src/lib/env.ts',
        'src/lib/health-scorer.ts',
        'src/lib/severity-colors.ts',
        'src/lib/test-categories.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
