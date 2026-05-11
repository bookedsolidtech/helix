import { defineConfig } from 'vitest/config';

/**
 * Node-side test runner for @helixui/icons.
 *
 * The registry is pure module-level state with no DOM dependencies, so
 * tests run under the default Node environment. Coverage is scoped to
 * `src/registry.ts` — the module under test for Phase 2.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/registry.ts'],
      reporter: ['text', 'json-summary'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
