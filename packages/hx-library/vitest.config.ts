import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Reporter selection:
//   - Default (human): verbose + json so developers see per-test progress.
//   - Terse (CI / agent): dot + json to keep logs compact. Vitest's `verbose`
//     reporter dumps thousands of `✓` lines which blows through agent context
//     windows and makes CI log scrolling painful. The json reporter is kept
//     in both modes so the Admin Dashboard health scorer always has data.
// Opt-in via VITEST_REPORTER=<name>, CI=1, or AGENT_RUN=1.
const terse =
  process.env.VITEST_REPORTER === 'dot' ||
  process.env.VITEST_REPORTER === 'basic' ||
  (!process.env.VITEST_REPORTER &&
    (process.env.CI === '1' || process.env.CI === 'true' || process.env.AGENT_RUN === '1'));
const reporters: Array<string> = terse ? ['dot', 'json'] : ['verbose', 'json'];

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
      provider: playwright(),
      headless: true,
      viewport: { width: 1280, height: 720 },
      instances: [{ browser: 'chromium' }],
    },
    include: [
      'src/components/**/*.test.ts',
      'src/base/**/*.test.ts',
      'src/utilities/**/*.test.ts',
      'src/utils/**/*.test.ts',
      'src/mixins/**/*.test.ts',
      'src/__tests__/**/*.test.ts',
    ],
    exclude: ['.worktrees/**', 'node_modules/**', '**/__screenshots__/**'],
    reporters,
    outputFile: { json: '.cache/test-results.json' },
    testTimeout: 30000,
    teardownTimeout: 5000,
    globals: true,
    // Coverage disabled by default — run `pnpm run test:coverage` for reports.
    // Keeps CI fast (~5min instead of ~20min).
    // Use v8 provider for accurate, fast coverage without instrumentation overhead.
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
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: '.cache/coverage',
      // Thresholds intentionally omitted — enforcement is handled per-component
      // by scripts/check-coverage.mjs. Global Vitest thresholds fail on partial
      // (path-filtered) runs where only changed components execute.
    },
  },
});
