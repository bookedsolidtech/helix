---
title: Vitest Browser Mode Setup
description: Comprehensive guide to configuring Vitest browser mode with Playwright for testing web components. Covers vitest.config.ts structure, provider configuration, headless vs headed testing, test environment setup, coverage reporting, and the complete HELiX test infrastructure configuration.
sidebar:
  order: 1
---

# Vitest Browser Mode Setup

Testing web components requires a real browser environment. Shadow DOM behavior, focus management, form participation, and accessibility features cannot be accurately tested in synthetic DOM environments like jsdom or happy-dom. **HELiX uses Vitest browser mode with Playwright** to run tests in actual Chromium, ensuring behavior matches production.

This guide covers the complete Vitest browser mode setup: configuration structure, provider selection, headless vs headed testing, test environment configuration, and the production-ready setup used in `hx-library`.

## Why Browser Mode?

**Vitest browser mode runs tests in a real browser**, not a Node.js environment with a simulated DOM. This provides critical advantages for web component testing:

### Real Browser Testing vs Synthetic DOM

| Feature                | Browser Mode                      | jsdom/happy-dom       |
| ---------------------- | --------------------------------- | --------------------- |
| **Shadow DOM**         | Native browser implementation     | Simulated, incomplete |
| **Focus management**   | Real focus behavior               | Approximated          |
| **Form participation** | ElementInternals, formdata events | Not supported         |
| **ARIA**               | Real screen reader behavior       | Simulated             |
| **CSS encapsulation**  | Full Shadow DOM isolation         | Partial               |
| **Custom events**      | Native bubbling/composed          | Simulated             |
| **Keyboard events**    | Real browser dispatch             | Synthetic             |

### Healthcare Mandate

In enterprise healthcare environments, **untested behavior is unacceptable**. Testing in a synthetic DOM environment creates false confidence. Browser mode testing catches:

- Shadow DOM slot projection edge cases
- Focus trap behavior in modals
- Form validation and submission flows
- Keyboard navigation across shadow boundaries
- ARIA attribute implementation accuracy

**If it doesn't work in a real browser, it doesn't work.** Browser mode ensures production parity.

## Installation

Vitest browser mode requires three packages:

```bash
npm install -D vitest @vitest/browser playwright
```

**Package breakdown:**

- **`vitest`** — Core test runner with browser mode support
- **`@vitest/browser`** — Browser mode plugin and context API
- **`playwright`** — Browser automation provider (Chromium, Firefox, WebKit)

### Provider Options

Vitest supports three browser providers:

1. **`playwright`** (recommended) — Full browser automation, Chrome DevTools Protocol, headless support
2. **`webdriverio`** — Cross-browser testing, W3C WebDriver standard
3. **`preview`** (default) — Vite dev server preview, no headless support, simulated events only

**HELiX uses Playwright** for its robust Chrome DevTools Protocol integration, headless mode support, and accurate event dispatch.

## Configuration Structure

### Basic vitest.config.ts

A minimal browser mode configuration:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

**Required fields:**

- **`browser.enabled`** — Activates browser mode (defaults to `false`)
- **`browser.provider`** — Which browser automation provider to use
- **`browser.instances`** — Array of browser configurations (must have at least one)

### Browser Instances

The `instances` array defines which browsers to test against. Each instance is a separate browser context:

```typescript
instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }];
```

**Supported browsers (Playwright):**

- `'chromium'` — Chrome/Edge engine (recommended for web components)
- `'firefox'` — Firefox engine
- `'webkit'` — Safari engine

**Best practice:** Use Chromium for local development, add Firefox/WebKit for cross-browser validation in CI.

### Headless vs Headed Mode

**Headless mode** runs the browser in the background without a visible UI. **Headed mode** opens a visible browser window.

```typescript
browser: {
  headless: true, // Headless mode (CI default)
}
```

**When to use each mode:**

| Mode         | Use Case                          | Command              |
| ------------ | --------------------------------- | -------------------- |
| **Headless** | CI pipelines, automated runs      | `npm run test`       |
| **Headed**   | Debugging, watching tests locally | `npm run test:watch` |

**Important:** The `preview` provider does not support headless mode. Always use `playwright` or `webdriverio` for CI.

### Headless Mode in CI

Vitest automatically enables headless mode in CI environments (detected via `process.env.CI`). You can also force it:

```typescript
browser: {
  headless: process.env.CI === 'true', // Auto-enable in CI
}
```

### Viewing UI in Headless Mode

If you want to use Vitest's UI while running tests headlessly:

```bash
npm install -D @vitest/ui
npx vitest --ui --browser.headless
```

The browser runs headlessly, but Vitest UI displays test results in a web interface.

## Provider Configuration

### Playwright Provider

The Playwright provider offers advanced configuration options:

```typescript
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser/providers/playwright';

export default defineConfig({
  test: {
    browser: {
      provider: playwright({
        // Launch options passed to playwright.chromium.launch()
        launchOptions: {
          slowMo: 50, // Slow down operations by 50ms (useful for debugging)
          channel: 'chrome-beta', // Use Chrome Beta instead of Chromium
          devtools: true, // Open DevTools automatically
        },
        // Timeout for browser actions (clicks, fills, etc.)
        actionTimeout: 5000, // 5 seconds (default: 10000)
      }),
      enabled: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

**Common launch options:**

- **`slowMo`** — Delay all operations by N milliseconds (debugging)
- **`channel`** — Use a different Chromium build (`chrome`, `chrome-beta`, `msedge`)
- **`devtools`** — Auto-open Chrome DevTools (headed mode only)
- **`headless`** — Override instance-level headless setting

**Common action options:**

- **`actionTimeout`** — Max time to wait for actions like `page.click()` (default: 10s)
- **`navigationTimeout`** — Max time to wait for page loads (default: 30s)

### Per-Instance Configuration

You can override provider settings per browser instance:

```typescript
instances: [
  {
    browser: 'chromium',
    headless: false, // Open visible Chromium
  },
  {
    browser: 'firefox',
    headless: true, // Run Firefox headlessly
  },
];
```

## Test Environment Configuration

### File Matching

Use `include` to specify which files contain tests:

```typescript
test: {
  include: ['src/components/**/*.test.ts'],
}
```

**Pattern matching:**

- `**/*.test.ts` — All files ending in `.test.ts`
- `src/components/**/*.spec.ts` — Only `.spec.ts` files in `src/components/`
- `tests/**/*.{test,spec}.{js,ts}` — Multiple patterns and extensions

### Globals API

Vitest can inject globals like `describe`, `it`, `expect` without explicit imports:

```typescript
test: {
  globals: true, // Auto-inject describe, it, expect, vi
}
```

**With globals enabled:**

```typescript
// No imports needed
describe('hx-button', () => {
  it('renders', async () => {
    expect(true).toBe(true);
  });
});
```

**Without globals (explicit imports):**

```typescript
import { describe, it, expect } from 'vitest';

describe('hx-button', () => {
  it('renders', async () => {
    expect(true).toBe(true);
  });
});
```

**HELiX uses explicit imports** to avoid TypeScript configuration complexity and improve IDE autocomplete.

### Test Isolation

**Vitest runs all browser tests in a single page** with test isolation via iframes:

- One browser instance per `instances` entry
- One page opened per browser
- Each test file runs in its own iframe within that page
- Tests are isolated from each other automatically

**Cleanup best practice:** Use `afterEach(cleanup)` to remove fixtures between tests:

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '../../test-utils.js';

afterEach(cleanup);
```

### Viewport Configuration

Configure the default viewport size:

```typescript
browser: {
  viewport: {
    width: 1280,
    height: 720,
  },
}
```

**Override per test:**

```typescript
import { page } from '@vitest/browser/context';

it('renders on mobile', async () => {
  await page.viewport(375, 667); // iPhone SE
  const el = await fixture('<hx-button>Click</hx-button>');
  // Test mobile layout
});
```

## Reporting and Coverage

### Test Reporters

Vitest supports multiple test reporters:

```typescript
test: {
  reporters: ['verbose', 'json'],
}
```

**Common reporters:**

- **`'default'`** — Basic console output
- **`'verbose'`** — Detailed test names and timing
- **`'json'`** — JSON output for CI/CD integration
- **`'html'`** — HTML test results report
- **`'junit'`** — JUnit XML format (Jenkins, CircleCI)
- **`'dot'`** — Minimal dot output

### JSON Output

Use `outputFile` to write reporter output to disk:

```typescript
test: {
  reporters: ['verbose', 'json'],
  outputFile: {
    json: '.cache/test-results.json',
  },
}
```

**HELiX uses this for the Admin Dashboard Test Theater**, which reads `.cache/test-results.json` to display live test results.

### Coverage Configuration

Vitest integrates with `@vitest/coverage-v8` for code coverage:

```bash
npm install -D @vitest/coverage-v8
```

**Coverage configuration:**

```typescript
test: {
  coverage: {
    provider: 'v8', // Use V8 coverage (faster than Istanbul)
    enabled: true, // Auto-enable coverage
    include: ['src/components/**/*.ts'], // Only track component code
    exclude: [
      'src/components/**/*.test.ts', // Exclude test files
      'src/components/**/*.stories.ts', // Exclude Storybook stories
      'src/components/**/*.styles.ts', // Exclude style templates
      'src/components/**/index.ts', // Exclude re-exports
    ],
    reporter: ['text', 'json-summary'], // Console + JSON output
    reportsDirectory: '.cache/coverage', // Coverage output dir
  },
}
```

**Coverage providers:**

- **`v8`** — V8 JavaScript engine coverage (faster, more accurate)
- **`istanbul`** — Istanbul coverage (more configurable, slower)

### Coverage Thresholds

Enforce minimum coverage percentages:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

If coverage falls below these thresholds, the test run fails. **HELiX enforces 80% minimum coverage** for all components.

## HELiX Production Configuration

### Complete vitest.config.ts

The production configuration used in `packages/hx-library`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ─── Browser Mode ───
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true, // Headless in CI, headed with --headed flag
      instances: [{ browser: 'chromium' }],
    },

    // ─── Test File Matching ───
    include: ['src/components/**/*.test.ts'],

    // ─── Reporting ───
    reporters: ['verbose', 'json'],
    outputFile: { json: '.cache/test-results.json' },

    // ─── Globals ───
    globals: true, // Auto-inject describe, it, expect

    // ─── Coverage ───
    coverage: {
      provider: 'v8',
      enabled: true,
      include: ['src/components/**/*.ts'],
      exclude: [
        'src/components/**/*.test.ts',
        'src/components/**/*.stories.ts',
        'src/components/**/*.styles.ts',
        'src/components/**/index.ts',
      ],
      reporter: ['text', 'json-summary'],
      reportsDirectory: '.cache/coverage',
    },
  },
});
```

### Package.json Scripts

Test scripts in `packages/hx-library/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Script breakdown:**

- **`npm run test`** — Run all tests once (CI mode)
- **`npm run test:watch`** — Watch mode, re-run on file changes
- **`npm run test:ui`** — Open Vitest UI in browser
- **`npm run test:coverage`** — Run tests + generate coverage report

### Dependencies

Required devDependencies:

```json
{
  "devDependencies": {
    "vitest": "^3.0.0",
    "@vitest/browser": "^3.0.0",
    "@vitest/coverage-v8": "^3.2.4",
    "playwright": "^1.50.0"
  }
}
```

## Test Execution Flow

### Local Development

**Headed mode with watch:**

```bash
npm run test:watch
```

- Opens visible Chromium window
- Watches for file changes
- Re-runs tests on save
- Displays Vitest UI at http://localhost:63315

**Headless mode (CI simulation):**

```bash
npm run test
```

- Runs Chromium headlessly
- Runs all tests once
- Outputs results to console and `.cache/test-results.json`
- Exits with code 0 (pass) or 1 (fail)

### CI Pipeline

In GitHub Actions or other CI environments:

```yaml
- name: Run tests
  run: npm run test
  env:
    CI: true
```

**Vitest automatically:**

- Enables headless mode (detects `CI=true`)
- Runs all tests once
- Generates JSON output to `.cache/test-results.json`
- Generates coverage report to `.cache/coverage/`
- Fails if coverage < 80%

### Browser Context API

Vitest exposes the Playwright `page` object for advanced interactions:

```typescript
import { page } from '@vitest/browser/context';

it('handles keyboard navigation', async () => {
  const el = await fixture('<hx-button>Click</hx-button>');
  const btn = shadowQuery(el, 'button')!;

  await page.keyboard.press('Tab'); // Tab to button
  await page.keyboard.press('Enter'); // Activate button

  // Assert event fired
});
```

**Available APIs:**

- **`page.click(selector)`** — Click an element
- **`page.fill(selector, value)`** — Fill an input
- **`page.keyboard.press(key)`** — Simulate keyboard input
- **`page.viewport(width, height)`** — Change viewport size
- **`page.screenshot()`** — Take a screenshot (debugging)

## Common Patterns

### Debugging Tests

**Run single test file in headed mode:**

```bash
npx vitest run src/components/hx-button/hx-button.test.ts --headed
```

**Enable slow motion (delay operations):**

```typescript
browser: {
  provider: playwright({
    launchOptions: { slowMo: 100 }, // 100ms delay per action
  }),
}
```

**Take screenshots on failure:**

```typescript
import { page } from '@vitest/browser/context';

it('renders correctly', async () => {
  const el = await fixture('<hx-button>Click</hx-button>');
  await page.screenshot({ path: 'debug.png' });
  expect(el.shadowRoot).toBeTruthy();
});
```

### Running Specific Tests

**Run only tests matching pattern:**

```bash
npx vitest run --grep "hx-button"
```

**Run only tests in specific file:**

```bash
npx vitest run src/components/hx-button/hx-button.test.ts
```

**Run only tests with `.only()`:**

```typescript
it.only('runs this test', async () => {
  // Only this test runs
});
```

### Cross-Browser Testing

Test against multiple browsers in CI:

```typescript
browser: {
  instances: [
    { browser: 'chromium' },
    { browser: 'firefox' },
    { browser: 'webkit' }, // Safari
  ],
}
```

**CI matrix testing:**

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]

steps:
  - run: npx vitest --browser.instances[0].browser=${{ matrix.browser }}
```

## Troubleshooting

### Tests Run in Node.js Instead of Browser

**Symptom:** `document is not defined` or `window is not defined` errors.

**Cause:** `browser.enabled: false` or missing `browser` config.

**Fix:**

```typescript
test: {
  browser: {
    enabled: true, // Must be true
    provider: 'playwright',
    instances: [{ browser: 'chromium' }],
  },
}
```

### Playwright Fails to Launch Browser

**Symptom:** `browserType.launch: Executable doesn't exist` error.

**Cause:** Playwright browsers not installed.

**Fix:**

```bash
npx playwright install chromium
```

Or install all browsers:

```bash
npx playwright install
```

### Headless Mode Not Working

**Symptom:** Browser window opens even with `headless: true`.

**Cause:** Using `preview` provider (does not support headless).

**Fix:** Switch to `playwright` or `webdriverio`:

```typescript
browser: {
  provider: 'playwright', // Not 'preview'
  headless: true,
}
```

### Coverage Not Generating

**Symptom:** No coverage report in `.cache/coverage/`.

**Cause:** `coverage.enabled: false` or missing `@vitest/coverage-v8`.

**Fix:**

```bash
npm install -D @vitest/coverage-v8
```

```typescript
coverage: {
  enabled: true,
  provider: 'v8',
}
```

### Tests Fail in CI But Pass Locally

**Symptom:** Tests pass in headed mode but fail in headless CI.

**Cause:** Timing issues or viewport size differences.

**Fix:** Use `await updateComplete` and `oneEvent()` for async operations. Avoid hardcoded timeouts:

```typescript
// BAD: Timing-dependent
await new Promise((resolve) => setTimeout(resolve, 100));
expect(el.getAttribute('aria-expanded')).toBe('true');

// GOOD: Wait for actual condition
await el.updateComplete;
expect(el.getAttribute('aria-expanded')).toBe('true');
```

## Performance Considerations

### Test Execution Speed

Browser mode is slower than jsdom because it launches a real browser. Optimize with:

1. **Shared browser instance** — Vitest reuses one browser per `instances` entry
2. **Parallel test files** — Vitest runs multiple test files in parallel (default)
3. **Headless mode** — Slightly faster than headed mode
4. **Minimal fixtures** — Only create necessary DOM elements per test

### CI Optimization

**GitHub Actions example:**

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run tests
  run: npm run test
  env:
    CI: true
```

**Only install Chromium** (not all browsers) to save CI time.

## Next Steps

Now that you understand Vitest browser mode configuration, learn how to write tests:

- **[Writing Component Tests](/components/testing/vitest)** — Test patterns, utilities, and best practices
- **[Shadow DOM Testing](/components/testing/shadow-dom)** — Querying shadow roots and handling encapsulation
- **[Async Testing](/components/testing/async)** — Handling promises, events, and Lit's updateComplete

## Sources

This documentation references official Vitest browser mode documentation:

- [Browser Mode | Guide | Vitest](https://vitest.dev/guide/browser/)
- [Browser Config Reference | Config | Vitest](https://vitest.dev/config/browser)
- [Configuring Playwright | Vitest](https://vitest.dev/config/browser/playwright)
- [browser.headless | Config | Vitest](https://vitest.dev/config/browser/headless)
- [Reliable Component Testing with Vitest's Browser Mode and Playwright](https://mayashavin.com/articles/component-testing-browser-vitest)
