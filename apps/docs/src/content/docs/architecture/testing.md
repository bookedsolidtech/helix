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

The root Vitest workspace currently runs three configs in one invocation:

```ts
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/hx-library/vitest.config.ts',
  'apps/storybook/vitest.config.ts',
  'packages/drupal-starter/vitest.config.ts',
]);
```

Other packages have their own `vitest.config.ts` and run via Turbo / package-level scripts (`pnpm --filter=<pkg> run test`):

| Package | Environment | Runs via |
| --- | --- | --- |
| `packages/hx-library` | Browser (Playwright/Chromium) | Root workspace + `pnpm test:library` |
| `apps/storybook` | Browser (Playwright/Chromium) | Root workspace + `pnpm test:storybook` |
| `packages/drupal-starter` | Node | Root workspace + `pnpm test:drupal-starter` |
| `packages/hx-tokens` | Node | `pnpm test:tokens` |
| `packages/hx-react` | Browser (Playwright/Chromium) | `pnpm test:react` |
| `packages/drupal-behaviors` | Node | `pnpm test:drupal-behaviors` |
| `packages/helixui-mcp` | Node | `pnpm test:mcp` |

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

# Run with coverage (library-scoped)
pnpm --filter=@helixui/library run test:coverage
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

VRT runs against **Chromium only** — the Playwright VRT config (`playwright.config.ts`) targets a single Chromium project. Cross-browser coverage for component logic is handled separately by `pnpm run test:cross-browser` and the weekly `.github/workflows/cross-browser.yml` job.

#### Updating Baselines

When you intentionally change component appearance:

1. Verify the change is correct in Storybook
2. Update baselines locally: `pnpm run test:vrt:update`
3. Review the updated screenshots under `packages/hx-library/__screenshots__/`
4. Push the branch — CI regenerates baselines from the cached snapshot

#### CI Integration

VRT runs on PRs that change component source — the workflow's `paths` filter limits it to source-relevant changes; doc-only PRs skip. If tests fail:

1. Check the CI artifacts for diff images showing what changed
2. If the change is intentional, update baselines locally and push
3. If the change is a bug, fix the component code

#### Screenshot Storage

- Location: `packages/hx-library/__screenshots__/vrt.spec.ts/`
- Format: PNG images named `{component}--{variant}.png`
- Baselines are **gitignored** — managed via CI cache + regeneration on intentional updates, not committed to git

#### Adding New VRT Tests

To add VRT coverage for a new component or variant:

1. Create the Storybook story first
2. Add the variant to `ALL_VARIANTS` in `packages/hx-library/e2e/vrt.spec.ts` (`COMPONENT_VARIANTS` is derived from `ALL_VARIANTS`; the editable list is `ALL_VARIANTS`)
3. Run `pnpm run test:vrt:update` to generate baselines locally for review
4. Push; CI regenerates the cached baselines

### Accessibility — axe-core CI regression guard

The `a11y-audit` CI job runs **axe-core against a static Storybook build** as an AA regression guard. Critical and serious violations block merge; minor/moderate are informational. Axe coverage:

- Color contrast verification (axe rules: `color-contrast`, `color-contrast-enhanced`)
- ARIA attribute validation
- Shadow DOM ARIA boundary checks

Keyboard contract verification is **not** part of axe; it runs in the AAA formal audit harness (`scripts/aaa-formal-audit.mjs`) via Playwright-driven source + key-name inspection. The canonical cert posture is **WCAG 2.2 AAA on the P0 surface**, not WCAG 2.1 AA — see [Self-certification scope](/accessibility/self-cert-scope/).

### Cross-Browser Testing

A weekly CI workflow (`.github/workflows/cross-browser.yml`) runs the full component test suite across Chromium, Firefox, and WebKit. This is not run on every PR to keep CI fast.

### Coverage Enforcement

Coverage thresholds are enforced per-component via `scripts/check-coverage.mjs`, which reads per-component targets from `packages/hx-library/coverage-config.json`. Global Vitest thresholds are intentionally not set — they would fail on smart test runs that only execute a subset of the suite.

## Coverage Targets

| Category          | Current threshold | Aspirational |
| ----------------- | ----------------- | ------------ |
| Unit tests (blocking) | ≥50% per component (`coverage-config.json`) | 95% |
| Accessibility     | 100% axe-core pass on critical/serious — CI gate | — |
| Visual regression | Curated VRT variant set in `ALL_VARIANTS`; not full surface | All variants once VRT throughput scales |
| Integration       | Critical user flows    | — |

CI coverage reporting is currently informational; the 50% threshold is the blocking floor enforced by `scripts/check-coverage.mjs`. Raising the floor is tracked separately.
