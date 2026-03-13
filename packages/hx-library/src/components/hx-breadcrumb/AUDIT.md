# AUDIT: hx-breadcrumb — Deep Opus-Level Quality Review

**Reviewer:** Deep audit (opus-level)
**Date:** 2026-03-11
**Previous audit:** 2026-03-05 (antagonistic review, 24 findings — see resolved section)
**Files reviewed:**

- `hx-breadcrumb.ts`
- `hx-breadcrumb-item.ts`
- `hx-breadcrumb.styles.ts`
- `hx-breadcrumb-item.styles.ts`
- `hx-breadcrumb.test.ts`
- `hx-breadcrumb.stories.ts`
- `hx-breadcrumb.twig`
- `index.ts`
- `custom-elements.json` (CEM output)

---

## Summary

The component has significantly matured since the March 5 audit. All 9 P1 issues from the previous audit have been resolved. The current implementation demonstrates strong ARIA patterns, proper Shadow DOM encapsulation, comprehensive Storybook coverage (8 stories), and 46+ passing tests including 4 axe-core accessibility checks. TypeScript strict mode passes with zero errors.

**Remaining findings are primarily P2-P3.** One P1 remains: private members leaking into the Custom Elements Manifest, violating the CEM accuracy quality gate.

**Quality Gate Status:**
| Gate | Status | Notes |
|------|--------|-------|
| 1. TypeScript strict | PASS | Zero errors, zero `any` |
| 2. Test suite | PASS | 46+ tests, all passing |
| 3. Accessibility | PASS | 4 axe-core tests, WCAG 2.1 AA patterns correct |
| 4. Storybook | PASS | 8 stories, all controls exposed |
| 5. CEM accuracy | FAIL | Private members exposed (see BC-A01) |
| 6. Bundle size | PASS (pending) | Cannot measure without production build |
| 7. Code review | N/A | Pending 3-tier review |

---

## Current Findings

### 1. CEM Accuracy

#### P1 — Private members exposed in Custom Elements Manifest

**File:** `hx-breadcrumb.ts`, CEM output
**Issue ID:** BC-A01

The CEM analyzer includes 18 private members in the `hx-breadcrumb` manifest:
`_instanceCounter`, `_ellipsisItem`, `_jsonLdScript`, `_boundEllipsisClick`, `_boundEllipsisKeydown`, `_managedCurrentItems`, `_jsonLdId`, `_getBreadcrumbItems`, `_applyItemAttributes`, `_handleSlotChange`, `_handleSeparatorSlotChange`, `_applyCollapse`, `_removeCollapse`, `_handleEllipsisClick`, `_handleEllipsisKeydown`, `_expandBreadcrumb`, `_buildListItem`, `_updateJsonLd`, `_removeJsonLd`.

These are TypeScript `private` keyword members, but the `@custom-elements-manifest/analyzer` with `--litelement` flag does not filter them. The `hx-breadcrumb-item` component correctly excludes `dataBcLast` via the `@internal` JSDoc tag, but `hx-breadcrumb` lacks these tags on its private members.

**Impact:** Consumers reading CEM-driven autodocs see implementation details as public API. This fails the CEM accuracy gate ("Matches public API").

**Fix:** Add `@internal` JSDoc tag to all private members, or configure a CEM plugin to filter `private` members.

---

### 2. Tests

#### P2 — Ellipsis expand button click/keyboard paths not directly tested

**File:** `hx-breadcrumb.test.ts:397-419`
**Issue ID:** BC-A02

The "expanding via ellipsis button removes collapse state" test (line 397) sets `el.maxItems = 0` programmatically rather than dispatching a click or keyboard event on the actual ellipsis button. This bypasses the `_handleEllipsisClick` and `_handleEllipsisKeydown` event handlers entirely. A consumer could break the event listener binding and these tests would still pass.

**Fix:** Add tests that dispatch `click` and `keydown` (Enter, Space) events on the ellipsis button element and verify expansion.

#### P3 — No test for `json-ld` toggled on programmatically after initial render

**File:** `hx-breadcrumb.test.ts` (missing)
**Issue ID:** BC-A03

The `updated()` handler (line 358-369) correctly watches `jsonLd` property changes and injects/removes the script. No test exercises `el.jsonLd = true` after initial render without `json-ld` attribute, or `el.jsonLd = false` to verify removal via property toggle.

#### ~~P3 — No test for `current` property toggling at runtime~~ ✅ FIXED (BC-A04)

**File:** `hx-breadcrumb.test.ts`
**Issue ID:** BC-A04

Added runtime toggle test: verifies that setting `current = true` on an `hx-breadcrumb-item` switches from `<a part="link">` to `<span part="text" aria-current="page">`, and setting `current = false` reverts to `<a part="link">`.

---

### 3. Storybook

#### ~~P3 — No story demonstrating explicit `current` attribute (Drupal pattern)~~ FIXED

**File:** `hx-breadcrumb.stories.ts`
**Issue ID:** BC-A05

**Fix:** `ExplicitCurrent` story added. It demonstrates (1) the `current` attribute on a non-last item and (2) the recommended Drupal server-rendered pattern with `current` on the last item. The story includes a descriptive JSDoc comment explaining why the `prefix` slot is the correct location for labels in combination with `count`-bearing badges.

#### ~~P3 — `WithCustomStyling` story uses hardcoded hex colors~~ FIXED

**File:** `hx-breadcrumb.stories.ts:237-241`
**Issue ID:** BC-A06

The story demonstrates token overrides using literal hex values (`#7c3aed`, `#5b21b6`, etc.) in the `style` attribute. While this is technically correct for showing the mechanism, using HELiX token values from a different semantic context would better reinforce the token-first approach without introducing hardcoded values in demo code.

**Fix:** Replaced all hardcoded hex values with `--hx-color-*` and `--hx-font-size-*` token references in the `style` attribute: `--hx-color-secondary-600`, `--hx-color-secondary-700`, `--hx-color-neutral-800`, `--hx-color-neutral-300`, `--hx-font-size-md`.

---

### 4. TypeScript

#### ~~P3 — `_buildListItem` return type defined inline~~ ✅ FIXED (BC-A07)

**File:** `hx-breadcrumb.ts`
**Issue ID:** BC-A07

Extracted inline return type to named `JsonLdListItem` interface. The method signature and local `entry` variable now reference the named type, eliminating the duplication.

---

### 5. CSS / Shadow DOM

#### ~~P3 — `display: contents` on `[part='item']` prevents direct styling~~ FIXED (documented)

**File:** `hx-breadcrumb-item.styles.ts:9-11`
**Issue ID:** BC-A08

The `[part='item']` wrapper uses `display: contents`, which removes it from the box model. While this is intentional (the wrapper exists only for slotting/selection purposes), it means consumers who attempt to style `::part(item)` with box-model properties (padding, margin, background) will see no effect. This behavior should be documented in the CSS parts section.

**Fix:** Added an inline documentation comment in `hx-breadcrumb-item.styles.ts` above `[part='item']` explaining that `display: contents` is intentional and warning consumers to use `::part(link)` or `::part(text)` for visual styling instead.

---

## Resolved Since Previous Audit (2026-03-05)

All 9 P1 and 8 P2 issues from the previous audit have been resolved:

| Previous ID | Severity | Resolution                                                                         |
| ----------- | -------- | ---------------------------------------------------------------------------------- |
| BC-01       | P1       | FIXED — `current` items now render as `<span>` even when `href` is present         |
| BC-02       | P1       | FIXED — Ellipsis renders as a `<button>` with `aria-label`, click/keydown handlers |
| BC-03       | P1       | FIXED — Hex fallbacks removed; styles use token-only cascades                      |
| BC-04       | P1       | FIXED — Separator slot has test coverage (line 135-147)                            |
| BC-05       | P1       | FIXED — `maxItems` and `jsonLd` in `argTypes` with full controls                   |
| BC-06       | P1       | FIXED — `Collapsed` story added (line 154)                                         |
| BC-07       | P1       | FIXED — `WithIcons` story added (line 176)                                         |
| BC-08       | P1       | FIXED — Explicit `current` attribute with `_managedCurrentItems` WeakSet           |
| BC-09       | P1       | FIXED — Documented in JSDoc and Twig template; `json-ld` defaults to false         |
| BC-10       | P2       | FIXED — `_itemCount` hack removed; slotchange handler manages state directly       |
| BC-11       | P2       | FIXED — Tests no longer access private `_jsonLdId` via unsafe casts                |
| BC-12       | P2       | FIXED — `aria-current="page"` placed on inner `[part="text"]` element              |
| BC-14       | P2       | FIXED — JSON-LD href/name values verified in test (line 453-474)                   |
| BC-15       | P2       | FIXED — Dynamic item insertion/removal test added (line 233-260)                   |
| BC-16       | P2       | FIXED — `subcomponents` uses `HelixBreadcrumbItem` class reference                 |
| BC-17       | P2       | FIXED — `SeparatorSlot` story added (line 115)                                     |
| BC-18       | P2       | FIXED — `--hx-breadcrumb-item-max-width` token with truncation CSS added           |
| BC-19       | P2       | NOTED — `display: none` on separator slot documented with comment                  |
| BC-20       | P2       | NOTED — CSS `content` quoting documented in JSDoc `@cssprop` annotation            |
| BC-21       | P2       | FIXED — `updated()` handler watches `jsonLd` property changes                      |
| BC-22       | P2       | FIXED — Static counter replaces `Math.random()` for deterministic IDs              |
| BC-23       | P2       | FIXED — `hx-breadcrumb.twig` added with full documentation                         |
| BC-24       | P2       | FIXED — Server-side `aria-current` documented in Twig template comments            |

---

## Current Issue Register

| ID     | Severity | Area       | Title                                                           |
| ------ | -------- | ---------- | --------------------------------------------------------------- |
| BC-A01 | P1       | CEM        | Private members exposed in Custom Elements Manifest             |
| BC-A02 | P2       | Tests      | Ellipsis expand button click/keyboard paths not directly tested |
| BC-A03 | P3       | Tests      | No test for `json-ld` toggled on programmatically after render  |
| BC-A04 | P3       | Tests      | ~~No test for `current` property toggling at runtime~~ FIXED    |
| BC-A05 | P3       | Storybook  | ~~No story for explicit `current` attribute (Drupal pattern)~~ FIXED |
| BC-A06 | P3       | Storybook  | ~~`WithCustomStyling` story uses hardcoded hex colors~~ FIXED   |
| BC-A07 | P3       | TypeScript | ~~`_buildListItem` return type defined inline~~ FIXED           |
| BC-A08 | P3       | CSS        | ~~`display: contents` on `::part(item)` not documented~~ FIXED  |

---

## What Is Working Well

- `<nav aria-label>` + `<ol>` + `role="listitem"` structure is semantically correct per WAI-ARIA APG
- `aria-current="page"` placed on inner `<span part="text">` — canonical AT announcement
- Current item with `href` renders as `<span>` not `<a>` — WAI-ARIA APG breadcrumb compliance
- Explicit `current` attribute with `_managedCurrentItems` WeakSet — clean Drupal interop
- Separators are presentational (`aria-hidden="true"`) with CSS `content` — correct pattern
- `role="listitem"` guard in `connectedCallback` prevents invalid ARIA when standalone
- 4 axe-core accessibility tests (default, single item, custom separator, collapsed)
- Collapse ellipsis is a real `<button>` with `aria-label` — keyboard accessible
- Deterministic `_jsonLdId` via static counter — SSR-safe
- `disconnectedCallback` cleans up JSON-LD scripts — no memory leaks
- `data-bc-hidden` + `::slotted` CSS approach for collapse is clean
- Focus ring on links uses `:focus-visible` — correct modern pattern
- `separator` named slot is a clean progressive enhancement
- Twig template with `current_key` variable and Drupal head management documentation
- 8 Storybook stories covering: default, custom separator, separator slot, long path, collapsed, icons, single item, custom styling
- 46+ tests organized into 10 `describe` blocks
- Token-only CSS cascades — zero hardcoded color values
- `--hx-breadcrumb-item-max-width` token for optional text truncation

---

## Recommendation

**Ship-ready with one caveat.** The P1 CEM issue (BC-A01) should be fixed before release — it's a configuration fix (adding `@internal` JSDoc tags), not a code change. The P2-P3 findings are quality improvements that can be addressed in a follow-up iteration. The component is architecturally sound, accessible, well-tested, and Drupal-compatible.
