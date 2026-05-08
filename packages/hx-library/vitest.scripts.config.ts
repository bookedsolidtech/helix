import { defineConfig } from 'vitest/config';

/**
 * Pure Node-side test runner for packages/hx-library/scripts/* and
 * cem-plugins/*.
 *
 * The default hx-library vitest config uses the Playwright browser provider
 * because component tests run against real Shadow DOM. The figma-inventory
 * extractor and the helix-metadata CEM plugin are pure Node code — they
 * should not pay the Chromium bootstrap cost or load a DOM, so they share
 * this Node-only config.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['scripts/__tests__/**/*.test.ts', 'cem-plugins/__tests__/**/*.test.ts'],
  },
});
