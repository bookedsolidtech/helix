# AUDIT: hx-icon — Deep Component Audit v2

**Reviewer:** Deep audit v2 (automated)
**Date:** 2026-03-06
**Branch:** `feature/deep-audit-v2-hx-icon`
**Previous Audit:** T3-63 Antagonistic Quality Review (2026-03-05)
**wc-mcp Score:** 100/100 (A) — CEM fully documented
**wc-mcp A11y Score:** 10/100 (F) — CEM lacks ARIA attribute documentation (icon is non-interactive, score is misleading)

---

## Fixes Applied in This Audit

### CRITICAL — Security: SVG sanitizer now strips `style` attributes

**File:** `hx-icon.ts:_sanitizeSvg`

- `style` attributes are now removed from all elements in fetched SVGs
- Prevents CSS injection vectors (`url(javascript:...)`, `expression()`, external URL references)
- Tests added: 2 new sanitizer tests for style stripping

### CRITICAL — Accessibility: ARIA attributes stripped from fetched SVGs

**File:** `hx-icon.ts:_sanitizeSvg`

- `role`, `aria-label`, `aria-labelledby`, `aria-hidden`, `aria-describedby` are stripped from inner SVGs
- Prevents double-announcement where wrapper and inner SVG both carry ARIA semantics
- Test added: 1 new test verifying ARIA stripping

### CRITICAL — Accessibility: Inner SVG gets `focusable="false"`

**File:** `hx-icon.ts:_sanitizeSvg`

- Sanitizer now sets `focusable="false"` on the root `<svg>` element of fetched content
- Prevents keyboard focus landing on non-interactive SVG elements
- Test added: 1 new test verifying focusable attribute

### HIGH — Performance: Module-level fetch cache

**File:** `hx-icon.ts`

- Added `svgCache: Map<string, Promise<string>>` at module level
- Multiple `hx-icon` instances with same `src` URL share a single fetch
- Cache entry removed on HTTP error or network failure

### HIGH — Tests: Inline mode accessibility coverage

**File:** `hx-icon.test.ts`

- Added `Inline Mode Accessibility` describe block (4 tests)
- Added `Fetch Error Handling` describe block (2 tests)
- Total new tests: 8

### MEDIUM — Storybook: Icon catalog and color variant stories

**File:** `hx-icon.stories.ts`

- Added `ColorVariants` story demonstrating `--hx-icon-color` and `currentColor` inheritance
- Added `IconCatalog` story with 24 representative icon names in grid layout

---

## Remaining Findings (Not Fixed — Documented)

### P2 — CSS part name `svg` used on `<span>` in inline mode

The CSS part `svg` is applied to a `<span>` wrapper in inline mode. Consumers using `::part(svg)` will target different element types depending on the mode. This is a known design trade-off to maintain a single part name for both modes. A breaking change to split into `::part(sprite-svg)` and `::part(inline-wrapper)` would require a major version bump.

### P2 — No `color` JavaScript property

Color is controlled exclusively via `--hx-icon-color` CSS custom property and `currentColor` inheritance. This is intentional for CSS-only theming. A JS property would duplicate CSS functionality.

### P2 — `size` property / `hx-size` attribute naming mismatch

The JS property `size` maps to HTML attribute `hx-size` to avoid native attribute collision. CEM documents both. This is a deliberate convention.

### P2 — No `vertical-align: middle` on `:host`

Inline-flex icons baseline-align by default. Consumers placing icons inline with text should apply `vertical-align: middle` on the host. Adding it as a default would break existing layouts that depend on baseline alignment.

### P2 — Size token fallbacks are hardcoded

Fallback values (`1rem`, `1.25rem`, etc.) mirror token values at time of writing. If tokens change, fallbacks become stale. This is standard practice for CSS custom property fallbacks.

### P2 — Inline fetch not SSR-compatible (Drupal)

Sprite mode should be used in server-rendered contexts (Twig templates). Inline fetch requires client-side JavaScript. This is documented in the component description.

### P2 — No bundle size assertion in CI

A per-component size budget check should be added at the CI level (applies to all components, not just hx-icon).

### P2 — Sanitizer runs synchronously on main thread

`_sanitizeSvg` uses `DOMParser` synchronously. For typical icon SVGs (<1KB) this is negligible. Complex clinical diagrams should not use `hx-icon` — they should use dedicated visualization components.

---

## Test Coverage Summary

| Category                  | Tests  |
| ------------------------- | ------ |
| Rendering                 | 3      |
| Sprite Mode               | 5      |
| Property: size            | 6      |
| Accessibility (sprite)    | 6      |
| Inline Mode Accessibility | 4      |
| Fetch Error Handling      | 2      |
| CSS Parts                 | 2      |
| Property: src             | 3      |
| Sanitizer                 | 7      |
| **Total**                 | **38** |

---

## Verdict

**PASS with conditions.** All CRITICAL and HIGH issues have been fixed. Remaining P2 items are documented design decisions or cross-cutting concerns that apply beyond this single component.
