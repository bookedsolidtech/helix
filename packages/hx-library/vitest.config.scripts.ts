import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for scripts/ unit tests.
 *
 * These tests run in a Node.js environment (not browser mode) because they
 * test pure TypeScript utilities — file I/O, string manipulation, CEM parsing —
 * that have no browser dependency.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/__tests__/**/*.test.ts'],
    exclude: ['node_modules/**'],
    reporters: ['verbose'],
    globals: true,
    testTimeout: 15000,
  },
});
