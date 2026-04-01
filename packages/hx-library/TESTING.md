# Testing Guide — @helixui/library

## Overview

The HELiX component library uses **Vitest browser mode** with the Playwright provider for all component tests. Tests run in a real browser (Chromium by default) — not jsdom — ensuring accurate DOM behavior, Shadow DOM support, and real CSS cascade.

**Coverage target: 95%** across all components (lines, branches, functions, statements).

---

## Running Tests

### Fast local development (Chromium only)

```bash
# From packages/hx-library
pnpm run test:watch        # Interactive watch mode
pnpm run test:component hx-button  # Run one component
```

### Full suite (CI equivalent)

```bash
# From monorepo root — DO NOT run this locally (100+ tests, expensive)
pnpm run test:library
```

### Smart tests (changed components only)

```bash
# From monorepo root — use this for pre-push verification
pnpm run test:smart
```

### Coverage report

```bash
# From packages/hx-library
pnpm run test:coverage         # Run + collect coverage
pnpm run test:coverage:ci      # Run + enforce per-component thresholds
```

Coverage reports are written to `.cache/coverage/` and include:
- `index.html` — Interactive HTML report
- `coverage-summary.json` — Machine-readable summary
- Terminal text output

### Cross-browser validation

```bash
# From packages/hx-library
pnpm run test:cross-browser    # Chromium + Firefox + WebKit
```

---

## Test File Structure

Every component has a test file at `src/components/hx-{name}/hx-{name}.test.ts`:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixComponentName } from './hx-component.js';
import './index.js';

afterEach(cleanup);

describe('hx-component', () => {
  // ─── Rendering ───
  describe('Rendering', () => { ... });

  // ─── Property: propName ───
  describe('Property: propName', () => { ... });

  // ─── Events ───
  describe('Events', () => { ... });

  // ─── Keyboard ───
  describe('Keyboard', () => { ... });

  // ─── Slots ───
  describe('Slots', () => { ... });

  // ─── CSS Parts ───
  describe('CSS Parts', () => { ... });

  // ─── Form ───   (form-associated components only)
  describe('Form', () => { ... });

  // ─── Accessibility (axe-core) ───
  describe('Accessibility (axe-core)', () => { ... });
});
```

---

## Test Utilities

Located at `src/test-utils.ts`:

| Helper | Purpose |
|--------|---------|
| `fixture(html)` | Mount a component, wait for `updateComplete` |
| `shadowQuery(host, selector)` | `shadowRoot.querySelector` |
| `shadowQueryAll(host, selector)` | `shadowRoot.querySelectorAll` |
| `oneEvent(el, eventName)` | Resolve when event fires (once) |
| `cleanup()` | Clear the fixture container (call in `afterEach`) |
| `checkA11y(el, options?)` | Run axe-core WCAG 2.1 AA audit |

---

## Coverage Configuration

Coverage is enforced **per-component** via `scripts/check-coverage.mjs`. The global target is **95%** (lines, branches, functions, statements).

Components with known limitations are listed in `coverage-config.json` with:
- A reason explaining why coverage is below threshold
- A `remediationDate` by which the exemption must be resolved

**To check coverage for a single component:**

```bash
pnpm exec vitest run --coverage.enabled src/components/hx-button/
```

**To enforce all thresholds:**

```bash
node ../../scripts/check-coverage.mjs
```

---

## What to Test

Every component test suite must cover:

### 1. Rendering
- Shadow DOM exists (`el.shadowRoot`)
- Key CSS parts are present (`shadowQuery(el, '[part~="name"]')`)
- Default state class names applied

### 2. Properties
- Default values match documentation
- Setting a property updates the DOM
- Attribute reflection (when applicable)
- Edge cases: empty string, null/undefined handling, invalid values

### 3. Events
- Custom events fire on the correct interaction
- `bubbles: true` and `composed: true` for cross-shadow events
- Event `detail` contains correct payload
- Events do NOT fire when disabled/loading

### 4. Keyboard Navigation (interactive components)
- Tab order is correct (focus moves to focusable element)
- Enter/Space activate buttons and toggles
- Arrow keys navigate within composite widgets (menus, tabs, selects)
- Escape closes overlays (dialogs, dropdowns, drawers)
- Focus management (focus trap in dialogs, focus return on close)

### 5. Slots
- Default slot renders light DOM content
- Named slots render slotted content
- Fallback content shows when slot is empty
- Slot presence affects component state (`_hasActions`, `_hasTitle`)

### 6. CSS Parts
- All exposed `part` attributes are accessible via `[part~="name"]`
- Parts exist in the expected states

### 7. Form Participation (form-associated components)
- `formAssociated = true` static property
- `checkValidity()` returns correct state
- `setValidity()` propagates error messages
- `formResetCallback()` restores default state
- `formDisabledCallback()` responds to fieldset disabled

### 8. Accessibility
- `checkA11y(el)` passes with zero violations for all states
- ARIA attributes are correct (role, aria-label, aria-describedby, aria-expanded)
- Focus is visible (`:focus-visible` outline)

---

## Cross-Browser Compatibility

See `BROWSER_COMPATIBILITY.md` for the full cross-browser test matrix and known browser-specific behaviors.

Cross-browser tests run:
- **Automated:** Weekly (Monday 06:00 UTC) via GitHub Actions
- **Manual:** `pnpm run test:cross-browser`
- **On-demand:** Via the `cross-browser` workflow dispatch in GitHub Actions UI

---

## CI Integration

The primary CI pipeline (`ci.yml`) runs tests on Chromium only for speed. Cross-browser tests are managed separately in `cross-browser.yml`.

| Job | When | Browsers |
|-----|------|---------|
| `test` (ci.yml) | Every PR, path-filtered | Chromium |
| `cross-browser` (cross-browser.yml) | Weekly + pushes to main/staging | Chromium, Firefox, WebKit |

Coverage reports are uploaded as GitHub Actions artifacts on every CI run:
- `coverage-report` — HTML + JSON coverage for changed components
- `cross-browser-results-{browser}` — Per-browser JSON test results

---

## Batch Testing

For large PRs or CI optimization, tests can be split into batches:

```bash
pnpm run test:batch:1   # hx-accordion through hx-combobox
pnpm run test:batch:2   # hx-container through hx-help-text
pnpm run test:batch:3   # hx-icon through hx-popover
pnpm run test:batch:4   # hx-progress through hx-slider
pnpm run test:batch:5   # hx-spinner through hx-video-player
```
