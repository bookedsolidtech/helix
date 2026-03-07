# hx-spinner — Deep Audit v2

**Auditor:** Claude Opus 4.6 (deep audit v2)
**Date:** 2026-03-06
**Branch:** feature/deep-audit-v2-hx-spinner
**wc-mcp health score:** 100 (A)
**wc-mcp a11y score:** 35/100 (F) — CEM documentation gap; form/keyboard/focus/disabled dimensions don't apply to a status indicator

---

## Executive Summary

`hx-spinner` is a well-structured loading indicator with solid SVG animation, design token usage, and shadow DOM encapsulation. The original audit (T1-09) identified 2 P0 and 5 P1 issues. This Deep Audit v2 fixes all P0 and P1 issues. The wc-mcp a11y score of 35/100 is a false negative — spinners don't need form association, keyboard events, focus methods, or disabled states.

### Changes Made in This Audit

| Change                                                              | File                                  | Severity Fixed |
| ------------------------------------------------------------------- | ------------------------------------- | -------------- |
| Removed dual announcement (sr-text span + aria-label)               | `hx-spinner.ts`, `hx-spinner.styles.ts` | CRITICAL (P0-1) |
| Added `decorative` boolean property for a11y-silent mode            | `hx-spinner.ts`                       | CRITICAL (P0-2) |
| Documented `--hx-duration-spinner` CSS custom property              | `hx-spinner.ts`                       | HIGH (P1-1)    |
| Replaced ambiguous reduced-motion static with opacity pulse         | `hx-spinner.styles.ts`                | HIGH (P1-2)    |
| Added `rgba()` fallback + `@supports` guard for `color-mix()`      | `hx-spinner.styles.ts`                | HIGH (P1-3)    |
| Added tests for decorative mode, reactive label, label reflection   | `hx-spinner.test.ts`                  | HIGH (P1-4/P1-5) |
| Added `@internal` to `_isTokenSize` private method                  | `hx-spinner.ts`                       | HIGH           |
| Fixed `@csspart base` description (div wrapper, not SVG)            | `hx-spinner.ts`                       | MEDIUM         |
| Added `reflect: true` to `label` property for Drupal compat         | `hx-spinner.ts`                       | MEDIUM (P2-2)  |
| Added `Decorative` story with role="status" text companion          | `hx-spinner.stories.ts`               | MEDIUM         |
| Added `decorative` argType/control to Storybook meta                | `hx-spinner.stories.ts`               | MEDIUM         |

---

## Audit Results by Dimension

### 1. Design Tokens

| Token                       | Semantic Fallback                                    | Status |
| --------------------------- | ---------------------------------------------------- | ------ |
| `--hx-spinner-color`        | Per-variant: neutral-600 / primary-500 / neutral-0   | PASS   |
| `--hx-spinner-track-color`  | Per-variant: neutral-200 / primary-100 / rgba fallback | PASS (FIXED) |
| `--hx-duration-spinner`     | `750ms`                                              | PASS (DOCUMENTED) |
| Size tokens (sm/md/lg)      | `--hx-size-4`, `--hx-size-6`, `--hx-size-8`         | PASS   |
| Reduced-motion opacity      | `--hx-opacity-muted` removed; pulse animation used   | PASS (FIXED) |

**Dark mode:** Handled at semantic token level — no hardcoded colors. PASS.

### 2. Accessibility

| Check                        | Status | Notes                                      |
| ---------------------------- | ------ | ------------------------------------------ |
| `role="status"`              | PASS   | On wrapper div, announces loading state    |
| `aria-label`                 | PASS   | Customizable via `label` prop              |
| `aria-hidden="true"` on SVG  | PASS   | Prevents SVG from being announced          |
| `focusable="false"` on SVG   | PASS   | Prevents IE/Edge focus on SVG              |
| Dual announcement removed    | PASS   | sr-text span removed (was P0-1)            |
| Decorative mode              | PASS   | `role="presentation"` + no aria-label      |
| Reduced motion               | PASS   | Opacity pulse (2s), no spatial animation   |
| `color-mix()` fallback       | PASS   | `rgba(255,255,255,0.3)` + `@supports`     |

### 3. Functionality

| Feature                | Status | Notes                              |
| ---------------------- | ------ | ---------------------------------- |
| Size: sm/md/lg         | PASS   | Token-driven via host attributes   |
| Custom CSS size        | PASS   | Arbitrary strings (e.g. "3rem")    |
| Variant: default       | PASS   | Neutral colors                     |
| Variant: primary       | PASS   | Primary brand colors               |
| Variant: inverted      | PASS   | White on dark backgrounds          |
| Decorative mode        | PASS   | New — silences ARIA announcements  |

### 4. TypeScript

| Check                  | Status | Notes                              |
| ---------------------- | ------ | ---------------------------------- |
| Strict mode            | PASS   | Zero errors                        |
| No `any`               | PASS   | No `any` types used                |
| `@internal` on private | PASS   | `_isTokenSize` marked internal     |

### 5. CSS/Styling

| Check                  | Status | Notes                              |
| ---------------------- | ------ | ---------------------------------- |
| Shadow DOM              | PASS   | Fully encapsulated                 |
| CSS Parts               | PASS   | `base` part exposed                |
| SVG animation           | PASS   | Rotation + dash animation          |
| Reduced motion          | PASS   | Opacity pulse replaces rotation    |
| GPU promotion           | N/A    | CSS transform already promotes     |
| `@supports` guard       | PASS   | `color-mix()` guarded              |

### 6. CEM Accuracy

| Check                  | Status | Notes                              |
| ---------------------- | ------ | ---------------------------------- |
| Properties documented  | PASS   | size, variant, label, decorative   |
| CSS properties listed  | PASS   | 3 custom properties documented     |
| CSS parts listed       | PASS   | `base` part documented correctly   |
| Private methods hidden | PASS   | `@internal` on `_isTokenSize`      |

### 7. Tests

| Check                  | Status | Notes                              |
| ---------------------- | ------ | ---------------------------------- |
| Test count             | 30     | Up from 22 (8 new tests)          |
| Rendering tests        | PASS   | Shadow DOM, SVG, parts, no sr-text |
| Property tests         | PASS   | size, variant, label, decorative   |
| ARIA tests             | PASS   | role, aria-label, aria-hidden      |
| Decorative mode tests  | PASS   | 7 new tests for decorative prop   |
| Label reflection test  | PASS   | Attribute reflection verified      |
| Reactive label test    | PASS   | Dynamic update verified            |
| axe-core tests         | PASS   | 7 variants tested (including decorative) |

### 8. Storybook

| Story                  | Status | Notes                              |
| ---------------------- | ------ | ---------------------------------- |
| Default                | PASS   | With interaction test              |
| Size variants          | PASS   | sm, md, lg, custom                 |
| Color variants         | PASS   | default, primary, inverted         |
| All sizes/variants     | PASS   | Grid display                       |
| Custom label           | PASS   | Healthcare context                 |
| Healthcare scenarios   | PASS   | Inline, overlay, button companion  |
| CSS custom properties  | PASS   | Color override demos               |
| Decorative mode        | PASS   | New — with role="status" text      |
| Controls               | PASS   | decorative boolean added           |

### 9. Drupal Compatibility

| Check                  | Status | Notes                              |
| ---------------------- | ------ | ---------------------------------- |
| Attribute-driven       | PASS   | All props set via attributes       |
| `label` reflected      | PASS   | Now reflects for Twig consistency  |
| No JS required         | PASS   | Works as pure HTML element         |
| AJAX throbber usage    | PASS   | Can replace Drupal AJAX throbber   |

### 10. Portability

| Check                  | Status | Notes                              |
| ---------------------- | ------ | ---------------------------------- |
| CDN-ready              | PASS   | Self-contained, no external deps   |
| No slots               | PASS   | Purely visual component            |
| Framework-agnostic     | PASS   | Standard custom element            |

---

## Remaining P2 Items (documented, not fixed)

| ID    | Area       | Description                                           |
| ----- | ---------- | ----------------------------------------------------- |
| P2-1  | TypeScript | `size` union collapses to `string` — intentional for custom CSS values |
| P2-3  | DX         | Hardcoded `...` removed with sr-text (resolved by P0-1 fix) |
| P2-4  | Storybook  | `size` argType is `select`-only — CustomSize story covers custom values |
| P2-5  | CSS        | Magic numbers in SVG dash math — aesthetic choice, r=10 circumference math |
| P2-6  | Drupal     | No Twig template — systemic gap across all components |

---

## Verification

- `npm run verify`: 0 errors (lint + format:check + type-check)
- `npm run test:library`: 3120 tests pass (79 files), including 30 hx-spinner tests
- `git diff --stat`: 4 source files + 7 screenshot PNGs modified
