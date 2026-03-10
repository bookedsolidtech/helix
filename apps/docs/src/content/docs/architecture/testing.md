---
title: Testing Strategy
description: Enterprise testing approach with Vitest 3.x browser mode, Playwright VRT, and axe-core for HELIX
---

HELIX follows a comprehensive testing strategy designed for enterprise compliance. The core principle: test in a real browser, not a simulated DOM. Web Component behavior — Shadow DOM queries, `ElementInternals` form participation, custom event bubbling — differs between JSDOM and a real browser in ways that matter at the healthcare quality bar.

## Testing Pyramid

```
          ╱╲
         ╱  ╲         Visual Regression Tests (Playwright)
        ╱────╲
       ╱      ╲
      ╱────────╲      Integration Tests + Accessibility Audits (axe-core)
     ╱          ╲
    ╱────────────╲
   ╱              ╲   Unit Tests (Vitest 3.x Browser Mode)
  ╱────────────────╲
```

## Running Tests

```bash
# Run the full test suite (Vitest browser mode)
npm run test

# Run tests for the component library only
npm run test:library

# Watch mode for active development
npm run test:library -- --watch

# Cross-browser matrix (Chromium + Firefox + WebKit)
npm run test:cross-browser

# Visual regression tests (requires Storybook running)
npm run dev:storybook   # in one terminal
npm run test:vrt        # in another terminal
```

## Unit Tests — Vitest 3.x Browser Mode

We chose Vitest browser mode over Jest + JSDOM because Shadow DOM requires a real browser to test correctly. This is not a minor implementation detail — the difference matters for:

- Shadow DOM slot distribution and `slotchange` events
- `ElementInternals` form participation (label binding, validity API, `setFormValue`)
- Custom event retargeting across shadow boundaries
- CSS custom property inheritance through the shadow tree

```typescript
// packages/hx-library/src/components/hx-button/hx-button.test.ts
import { describe, it, expect } from 'vitest';
import { fixture, html, oneEvent } from '../../test-utils.js';

describe('hx-button', () => {
  it('dispatches hx-click when clicked', async () => {
    const el = await fixture(html`<hx-button>Click me</hx-button>`);
    const eventPromise = oneEvent(el, 'hx-click');
    el.shadowRoot!.querySelector('button')!.click();
    const event = await eventPromise;
    expect(event).toBeTruthy();
  });

  it('is disabled when disabled attribute is set', async () => {
    const el = await fixture(html`<hx-button disabled>Disabled</hx-button>`);
    const btn = el.shadowRoot!.querySelector('button');
    expect(btn!.disabled).toBe(true);
  });
});
```

Tests live in `packages/hx-library/src/components/{component-name}/{component-name}.test.ts` alongside the component source.

## Shared Test Utilities

`packages/hx-library/src/test-utils.ts` provides test helpers used across all component tests:

| Helper          | Purpose                                           |
| --------------- | ------------------------------------------------- |
| `fixture()`     | Renders a Lit template and returns the element    |
| `shadowQuery()` | Queries inside a Shadow DOM                       |
| `oneEvent()`    | Returns a promise that resolves on the next event |
| `cleanup()`     | Removes test fixtures from the document           |

## Visual Regression Tests — Playwright

HELIX uses Playwright for visual regression testing (VRT) to catch unintended UI changes. VRT tests run against Storybook stories and produce pixel-level diffs.

### Running VRT Locally

```bash
# Start Storybook first
npm run dev:storybook

# Run VRT tests
npm run test:vrt

# Update baselines after intentional UI changes
npm run test:vrt:update
```

### When to Update Baselines

1. Verify the visual change is intentional in Storybook
2. Run `npm run test:vrt:update` to regenerate screenshots
3. Review the new screenshots in `packages/hx-library/__screenshots__/`
4. Commit the updated baselines with your PR

### Adding New VRT Tests

1. Create the Storybook story first (the VRT test targets story URLs)
2. Add the variant to `COMPONENT_VARIANTS` in `packages/hx-library/e2e/vrt.spec.ts`
3. Run `npm run test:vrt:update` to generate baselines
4. Commit the new screenshots

### Screenshot Storage

- Location: `packages/hx-library/__screenshots__/vrt.spec.ts/`
- Format: PNG images — `{component}--{variant}.png`
- Committed to git for version-controlled baselines

## Accessibility Testing — axe-core

Accessibility is tested at multiple layers, not just "run axe and ship":

| Layer                 | Tool            | When                     |
| --------------------- | --------------- | ------------------------ |
| Author-time           | ESLint a11y     | Pre-commit               |
| Storybook development | axe-core addon  | Live in the browser      |
| Vitest unit tests     | axe-core direct | Every `npm run test` run |
| Manual verification   | Screen readers  | Before component ships   |

```typescript
// Accessibility test pattern in Vitest
import { axe } from 'axe-core';
import { fixture } from '../../test-utils.js';

it('has no accessibility violations', async () => {
  const el = await fixture(html`<hx-button>Submit</hx-button>`);
  const results = await axe(el);
  expect(results.violations).toHaveLength(0);
});
```

## Coverage Targets

| Category          | Target                 |
| ----------------- | ---------------------- |
| Unit tests        | 80%+ line coverage     |
| Accessibility     | 100% axe-core pass     |
| Visual regression | All component variants |
| Integration       | Critical user flows    |

## Cross-Browser Testing

The standard test suite runs in Chromium. For cross-browser validation:

```bash
npm run test:cross-browser   # Chromium + Firefox + WebKit
```

This uses the Vitest cross-browser config at `packages/hx-library/vitest.config.cross-browser.ts`. Run before shipping changes that touch Shadow DOM CSS, focus management, or any browser-specific behavior.

## What We Don't Test

- **JSDOM** — We dropped it when we added browser mode. JSDOM misses too much Web Component behavior to be trustworthy for this project.
- **Chromatic** — We evaluated it for VRT but chose Playwright + self-hosted baselines to avoid the external service dependency in a healthcare context.

See the [Pre-Planning Component Architecture](/pre-planning/components/) for detailed testing patterns by component category.
