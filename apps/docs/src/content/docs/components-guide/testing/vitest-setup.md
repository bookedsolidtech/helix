---
title: Testing Setup with Vitest
description: Configure Vitest browser mode with Playwright for real-browser web component testing in HELiX.
---

HELiX tests run in a real Chromium browser via `@vitest/browser` with the Playwright provider. This eliminates the mismatch between jsdom and actual browser APIs — shadow DOM, custom elements, `ElementInternals`, and CSS work exactly as they do in production.

## Prerequisites

Install the required dev dependencies in your component package:

```bash
pnpm add -D vitest @vitest/browser @vitest/coverage-v8 playwright axe-core
```

## `vitest.config.ts`

The canonical HELiX configuration enables browser mode with Playwright and points coverage at component source files:

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  server: {
    fs: {
      // Required for monorepo worktrees — allows node_modules resolution
      // from parent directories when running from a git worktree.
      allow: [resolve(__dirname, '../..'), resolve(__dirname, '../../../..')],
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      viewport: { width: 1280, height: 720 },
      instances: [{ browser: 'chromium' }],
    },
    include: [
      'src/components/**/*.test.ts',
      'src/base/**/*.test.ts',
      'src/utilities/**/*.test.ts',
      'src/mixins/**/*.test.ts',
    ],
    exclude: ['.worktrees/**', 'node_modules/**'],
    reporters: ['verbose', 'json'],
    outputFile: { json: '.cache/test-results.json' },
    testTimeout: 30000,
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: { minThreads: 2, maxThreads: 4 },
    },
    coverage: {
      provider: 'v8',
      enabled: false, // use pnpm run test:coverage to enable
      include: ['src/components/**/*.ts'],
      exclude: [
        'src/components/**/*.test.ts',
        'src/components/**/*.stories.ts',
        'src/components/**/*.styles.ts',
        'src/components/**/index.ts',
      ],
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: '.cache/coverage',
    },
  },
});
```

## Test File Imports

Every HELiX test file starts with the same four import lines:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixButton } from './hx-button.js';
import './index.js'; // registers the custom element
```

- `describe`, `it`, `expect`, `afterEach` — Vitest test primitives
- `page` — Playwright page object for screenshots and browser-level assertions
- `userEvent` — browser-native user interaction simulation
- `fixture`, `shadowQuery`, `oneEvent`, `cleanup`, `checkA11y` — HELiX test utilities

## The `afterEach(cleanup)` Pattern

Always register `cleanup` in `afterEach` at the top level of every test file. This empties the shared fixture container between tests and prevents state leakage:

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '../../test-utils.js';

afterEach(cleanup);

describe('hx-button', () => {
  // Each test starts with a clean DOM
});
```

Without `cleanup`, elements from earlier tests remain in the document and can interfere with event listeners, focus state, and accessibility checks.

## Running Tests

```bash
# Run all tests once
pnpm run test

# Watch mode (re-runs on file change)
pnpm run test:watch

# Run with coverage report
pnpm run test:coverage

# Run a single component
pnpm run test:component -- hx-button

# Run the full sequential batch (single Chromium, local-friendly)
pnpm run test:batch

# Run a single shard for CI parallelism
VITEST_SHARD=1/4 pnpm run test:shard
```

## Coverage Configuration

Coverage is disabled by default to keep CI fast (roughly 5 minutes instead of 20). Enable it only when you need a coverage report:

```bash
pnpm run test:coverage
```

Coverage output lands in `.cache/coverage/`. Open `.cache/coverage/index.html` in a browser for the full report.

Per-component thresholds are enforced by `scripts/check-coverage.mjs` rather than global Vitest thresholds. This allows path-filtered runs (only changed components) without breaking the gate on components that did not execute.

## Test Structure Convention

HELiX test files group related assertions into named `describe` blocks:

```typescript
describe('hx-button', () => {
  describe('Rendering', () => { /* 5 tests */ });
  describe('Property: variant', () => { /* 6 tests */ });
  describe('Property: disabled', () => { /* 4 tests */ });
  describe('Events', () => { /* 4 tests */ });
  describe('Keyboard', () => { /* 2 tests */ });
  describe('Accessibility (axe-core)', () => { /* 8 tests */ });
});
```

This structure maps directly to the component's public API, making failures immediately identifiable.

## Next Steps

- [Testing Shadow DOM](/components-guide/testing/shadow-dom/) — `fixture` and `shadowQuery` in detail
- [Async Testing](/components-guide/testing/async/) — `updateComplete` and user interaction timing
- [Testing Events](/components-guide/testing/event-testing/) — `oneEvent` and event assertions
- [Accessibility Testing](/components-guide/testing/accessibility-testing/) — `checkA11y` and ARIA assertions
