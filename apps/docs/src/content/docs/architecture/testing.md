---
title: Testing Strategy
description: Enterprise testing approach with Vitest 3.x, Playwright, and axe-core for HELIX
---

HELIX follows a comprehensive testing strategy designed for enterprise compliance.

## Testing Pyramid

```
          ╱╲
         ╱  ╲         E2E Tests (Playwright)
        ╱────╲        Visual Regression (Playwright VRT)
       ╱      ╲
      ╱────────╲      Integration Tests
     ╱          ╲     Accessibility Audits (axe-core)
    ╱────────────╲
   ╱              ╲   Unit Tests (Vitest 3.x Browser Mode)
  ╱────────────────╲
```

## Vitest Workspace

Tests run across multiple packages using `vitest.workspace.ts` at the repo root:

```ts
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/hx-library/vitest.config.ts',
  'apps/storybook/vitest.config.ts',
  'packages/drupal-starter/vitest.config.ts',
]);
```

Each package has its own `vitest.config.ts` tuned to its environment:

| Package | Environment | Purpose |
| --- | --- | --- |
| `packages/hx-library` | Browser (Playwright/Chromium) | Web component unit tests |
| `apps/storybook` | Browser (Playwright/Chromium) | Storybook interaction tests |
| `packages/drupal-starter` | Node | SDC schema and Twig validation |
| `packages/hx-tokens` | Node | Token structure validation |
| `packages/hx-react` | Browser (Playwright/Chromium) | React wrapper rendering tests |
| `packages/drupal-behaviors` | Node | Drupal behavior unit tests |
| `packages/helixui-mcp` | Node | MCP server handler tests |

## Test Types

### Unit Tests — Vitest 3.x Browser Mode

The component library (`packages/hx-library`) runs tests in **real Chromium** via the Playwright provider:

```ts
// packages/hx-library/vitest.config.ts (key settings)
test: {
  browser: {
    enabled: true,
    provider: 'playwright',
    headless: true,
    instances: [{ browser: 'chromium' }],
  },
  include: [
    'src/components/**/*.test.ts',
    'src/base/**/*.test.ts',
    'src/utilities/**/*.test.ts',
    'src/mixins/**/*.test.ts',
  ],
}
```

This means Shadow DOM queries, `ElementInternals` form participation, and custom event assertions all behave identically to production. JSDOM approximations are not acceptable for healthcare components.

### Running Tests

```bash
# Smart tests — only changed components (recommended for local dev)
pnpm run test:smart

# Full test suite for a single component
pnpm run test:component hx-button

# Run all library tests
pnpm turbo test --filter=@helixui/library

# Run with coverage
pnpm run test:coverage
```

> **Never** run `pnpm run test` (no filter) locally — it runs 3,200+ tests across all packages
> and is reserved for CI.

### Visual Regression Testing

HELIX uses Playwright for visual regression testing to catch unintended UI changes across browsers.

#### Running VRT Locally

```bash
# Start Storybook (required)
pnpm run dev:storybook

# Run VRT tests
pnpm run test:vrt

# Generate new baselines after intentional UI changes
pnpm run test:vrt:update
```

#### Browser Coverage

VRT runs against three browsers:

- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

#### Updating Baselines

When you intentionally change component appearance:

1. Verify the change is correct in Storybook
2. Update baselines: `pnpm run test:vrt:update`
3. Review the updated screenshots in `packages/hx-library/__screenshots__/`
4. Commit the updated screenshots with your PR

#### CI Integration

VRT runs automatically on every PR. If tests fail:

1. Check the CI artifacts for diff images showing what changed
2. If the change is intentional, update baselines locally and push
3. If the change is a bug, fix the component code

#### Screenshot Storage

- Location: `packages/hx-library/__screenshots__/vrt.spec.ts/`
- Format: PNG images named `{component}--{variant}.png`
- One baseline per component variant (shared across browsers)
- Baselines are committed to git for version control

#### Adding New VRT Tests

To add VRT coverage for a new component or variant:

1. Create the Storybook story first
2. Add the variant to `COMPONENT_VARIANTS` in `packages/hx-library/e2e/vrt.spec.ts`
3. Run `pnpm run test:vrt:update` to generate baselines
4. Commit the new screenshots

### Accessibility — axe-core

Automated WCAG 2.1 AA compliance checks run as part of the CI pipeline:

- Color contrast verification (4.5:1 text, 3:1 UI components)
- ARIA attribute validation
- Keyboard navigation testing
- Shadow DOM ARIA boundary checks

The `a11y-audit` CI job runs axe-core against a static Storybook build using Playwright. Critical and serious violations block merge. Minor and moderate violations are reported as informational (warning-only).

### Cross-Browser Testing

A weekly CI workflow (`.github/workflows/cross-browser.yml`) runs the full component test suite across Chromium, Firefox, and WebKit. This is not run on every PR to keep CI fast.

### Coverage Enforcement

Coverage thresholds are enforced per-component via `scripts/check-coverage.mjs`, which reads per-component targets from `packages/hx-library/coverage-config.json`. Global Vitest thresholds are intentionally not set — they would fail on smart test runs that only execute a subset of the suite.

## Coverage Targets

| Category          | Target                 |
| ----------------- | ---------------------- |
| Unit tests        | ≥80% per component (enforced by `coverage-config.json`) |
| Accessibility     | 100% axe-core pass (critical/serious violations) |
| Visual regression | All component variants |
| Integration       | Critical user flows    |
