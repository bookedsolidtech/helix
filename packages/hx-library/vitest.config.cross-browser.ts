import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Cross-browser test configuration for Vitest browser mode.
 *
 * Runs the full test suite across Chromium, Firefox, and WebKit to validate
 * cross-browser compatibility of all components. This config is used by:
 *   - `pnpm run test:cross-browser` (local)
 *   - The `cross-browser` CI job in .github/workflows/cross-browser.yml
 *
 * The primary CI test gate uses vitest.config.ts (Chromium-only) for speed.
 * This config provides periodic cross-browser validation against Firefox and WebKit.
 */
export default defineConfig({
  server: {
    fs: {
      // Allow access to parent directories where node_modules may live.
      // Required when running from a git worktree (node_modules in main repo root).
      allow: [resolve(__dirname, '../..'), resolve(__dirname, '../../../..')],
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      viewport: { width: 1280, height: 720 },
      // Run all three browser engines for cross-browser validation.
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
    include: [
      'src/components/**/*.test.ts',
      'src/base/**/*.test.ts',
      'src/utilities/**/*.test.ts',
      'src/utils/**/*.test.ts',
      'src/mixins/**/*.test.ts',
      'src/__tests__/**/*.test.ts',
    ],
    exclude: ['.worktrees/**', 'node_modules/**'],
    reporters: ['verbose', 'json'],
    outputFile: { json: '.cache/test-results-cross-browser.json' },
    // Extended timeout: Firefox/WebKit may be slower for certain DOM operations.
    testTimeout: 45000,
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        // Reduce thread count — 3 browsers × N threads can exhaust CI runner resources.
        minThreads: 1,
        maxThreads: 2,
      },
    },
    // Coverage disabled — collect coverage separately via pnpm run test:coverage.
    // Cross-browser runs focus on compatibility, not coverage measurement.
    coverage: {
      provider: 'v8',
      enabled: false,
      include: ['src/components/**/*.ts'],
      exclude: [
        'src/components/**/*.test.ts',
        'src/components/**/*.stories.ts',
        'src/components/**/*.styles.ts',
        'src/components/**/index.ts',
      ],
      reporter: ['text', 'json', 'json-summary'],
      reportsDirectory: '.cache/coverage',
      // Thresholds intentionally omitted — enforcement via scripts/check-coverage.mjs.
    },
  },
});
