# AUDIT: hx-icon — Deep Opus-Level Review

**Reviewer:** Deep audit (Opus-level)
**Date:** 2026-03-11
**Branch:** `feature/deep-audit-hx-icon`
**Files reviewed:**
- `hx-icon.ts`
- `hx-icon.styles.ts`
- `hx-icon.test.ts`
- `hx-icon.stories.ts`
- `index.ts`

---

## Previous Audit (T3-63 Antagonistic Review — 2026-03-05)

The prior antagonistic audit identified 9 P1 and 12 P2 findings. All P1 findings have been
remediated. P2 findings are either resolved or documented as accepted design decisions.

---

## P1 Findings — All Remediated

### 1. Security: `style` attribute stripped in sanitizer — FIXED

**File:** `hx-icon.ts:213–217`

The `_sanitizeSvg` method now strips `style` attributes from all SVG elements, preventing CSS
injection vectors (`url(javascript:...)`, `expression()`, external `filter`/`clip-path` references).

### 2. Accessibility: Inline SVG `focusable="false"` injected — FIXED

**File:** `hx-icon.ts:233`

The sanitizer now injects `focusable="false"` on the root SVG element of fetched inline SVGs,
preventing IE11/old-Edge from making the SVG keyboard-focusable.

### 3. Accessibility: Inner SVG ARIA attributes stripped — FIXED

**File:** `hx-icon.ts:228–230`

The sanitizer strips `role`, `aria-label`, `aria-labelledby`, and `aria-hidden` from the inner
SVG root element. ARIA semantics are owned exclusively by the wrapper `<span part="svg">`.

### 4. Accessibility: `<title>` in sprite-mode SVG — FIXED

**File:** `hx-icon.ts:267`

Sprite-mode SVG now renders a `<title>` element when `label` is non-empty, improving screen
reader compatibility across browser/AT combinations.

### 5. Tests: axe-core tests for inline SVG mode — FIXED

**File:** `hx-icon.test.ts:264–302`

Four inline-mode accessibility tests added: axe-core with label, axe-core without label
(decorative), ARIA attributes with label, ARIA attributes without label.

### 6. Tests: Inline SVG ARIA attribute verification — FIXED

**File:** `hx-icon.test.ts:221–262`

Parallel tests for `<span part="svg">` wrapper verify `role="img"` + `aria-label` when label
is set, and `aria-hidden="true"` when label is empty, for inline fetch mode.

### 7. Tests: Fetch failure fallback — FIXED

**File:** `hx-icon.test.ts:355–390`

Two tests cover fetch failure paths: HTTP non-ok response (404) and network error (rejected
promise). Both verify shadow root is empty and no stale SVG remains.

### 8. Performance: Module-level fetch cache — FIXED

**File:** `hx-icon.ts:320`

A module-level `Map<string, Promise<string>>` cache (`_svgCache`) is shared across all
`hx-icon` instances. Multiple icons with the same `src` URL issue only one network request.

### 9. Tests: Fetch cache deduplication verified — FIXED

**File:** `hx-icon.test.ts:558–583`

Test verifies that two `hx-icon` instances sharing the same `src` URL result in exactly one
`fetch()` call.

---

## P2 Findings — Status

### Resolved

| # | Finding | Status |
|---|---------|--------|
| 1 | Unknown icon name test | FIXED — test at line 105 documents silent empty render behavior |
| 2 | `waitForInlineSvg` fragility | FIXED — uses `shadowQuery` helper, increased iterations to 20 |
| 3 | `overflow: hidden` on `:host` | FIXED — added to styles (line 14) |
| 4 | `vertical-align: middle` on `:host` | FIXED — added to styles (line 10) |
| 5 | Token fallback documentation | FIXED — CSS comment documents that fallbacks mirror token values |
| 6 | Sprite title element | FIXED — promoted to P1 and resolved (see P1 #4) |

### Accepted Design Decisions

| # | Finding | Decision |
|---|---------|----------|
| 1 | `name` is `string` not typed union | By design — hx-icon is icon-set agnostic. Consumers bring their own sprites. A typed union would couple the component to a specific icon set. |
| 2 | No `color` JS property | By design — color is a CSS concern. `--hx-icon-color` and `currentColor` inheritance follow the design token architecture. Adding a JS `color` property would duplicate CSS functionality. |
| 3 | `hx-size` vs `size` attribute naming | Documented in JSDoc. The `hx-` prefix avoids collision with the native `size` attribute. CEM documents both the JS property (`size`) and HTML attribute (`hx-size`). |
| 4 | CSS part `svg` on `<span>` in inline mode | Documented in JSDoc. Both modes expose `part="svg"` for consistent external styling via `::part(svg)`. Inline mode uses `.icon__inline` + `.icon__inline svg` CSS rules for correct sizing. |
| 5 | Inline mode not SSR-compatible | Documented in JSDoc (`@summary` and `src` property docs). Sprite mode is recommended for Drupal/SSR. |
| 6 | Synchronous sanitizer | Acceptable for icon SVGs (<1KB typical). Complex diagrams should not use `hx-icon`. |

---

## Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Rendering | 3 | Pass |
| Sprite Mode | 8 | Pass |
| Property: size | 7 | Pass |
| Accessibility | 10 | Pass |
| CSS Parts | 2 | Pass |
| Property: src | 5 | Pass |
| Sanitizer | 8 | Pass |
| Fetch Cache | 1 | Pass |
| **Total** | **44** | **All pass** |

## Storybook Coverage

| Story | Variants Covered |
|-------|-----------------|
| Default | Sprite mode, decorative |
| WithSpriteUrl | External sprite sheet |
| WithLabel | Informative icon (role="img") |
| Decorative | aria-hidden decorative pattern |
| Sizes | xs, sm, md, lg, xl |
| InlineSvgMode | Inline fetch with data URI |

## Quality Gate Status

| Gate | Status |
|------|--------|
| TypeScript strict | Zero errors |
| Test suite | 44 tests, all pass |
| Accessibility | WCAG 2.1 AA — axe-core clean (sprite + inline) |
| Storybook | All variants covered |
| CEM accuracy | Matches public API |
| Design tokens | No hardcoded values |
| Export | Verified in `src/index.ts` |

---

**Verdict:** Component is production-ready. All P1 findings remediated. P2 items either
resolved or documented as intentional design decisions.
