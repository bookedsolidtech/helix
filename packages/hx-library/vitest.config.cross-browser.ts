import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Cross-browser config for release validation.
// Run via: npm run test:cross-browser
// Includes Chromium, Firefox, and WebKit (Safari) instances.
// Default `npm run test` uses Chromium-only for speed.
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
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
    include: ['src/components/**/*.test.ts'],
    exclude: ['.worktrees/**', 'node_modules/**'],
    reporters: ['verbose', 'json'],
    outputFile: { json: '.cache/test-results-cross-browser.json' },
    testTimeout: 30000,
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 2,
        maxThreads: 4,
      },
    },
    coverage: {
      provider: 'istanbul',
      enabled: false,
      include: ['src/components/**/*.ts'],
      exclude: [
        'src/components/**/*.test.ts',
        'src/components/**/*.stories.ts',
        'src/components/**/*.styles.ts',
        'src/components/**/index.ts',
      ],
      reporter: ['text', 'json-summary'],
      reportsDirectory: '.cache/coverage',
      thresholds: {
        statements: 75,
        branches: 70,
        functions: 75,
        lines: 75,
      },
    },
  },
});
