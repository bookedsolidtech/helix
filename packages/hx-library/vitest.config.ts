import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

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
      instances: [{ browser: 'chromium' }],
    },
    include: ['src/components/**/*.test.ts'],
    exclude: ['.worktrees/**', 'node_modules/**'],
    reporters: ['verbose', 'json'],
    outputFile: { json: '.cache/test-results.json' },
    testTimeout: 30000,
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 2,
        maxThreads: 4,
      },
    },
    // Coverage disabled by default — run `npm run test:coverage` for reports.
    // Keeps CI fast (~5min instead of ~20min).
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
