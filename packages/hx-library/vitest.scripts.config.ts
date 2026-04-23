import { defineConfig } from 'vitest/config';

/**
 * Pure Node-side test runner for packages/hx-library/scripts/*.
 *
 * The default hx-library vitest config uses the Playwright browser provider
 * because component tests run against real Shadow DOM. The figma-inventory
 * extractor is a pure Node script — it should not pay the Chromium bootstrap
 * cost or load a DOM, so it gets its own config.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['scripts/__tests__/**/*.test.ts'],
  },
});
