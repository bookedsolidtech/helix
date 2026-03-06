# AUDIT: hx-search — Deep Audit v2

**Auditor:** Deep Audit v2 Agent
**Branch:** feature/deep-audit-v2-hx-search
**Date:** 2026-03-06
**Files reviewed:**

- `hx-search.ts` (390 lines)
- `hx-search.styles.ts` (199 lines)
- `hx-search.test.ts` (405 lines)
- `hx-search.stories.ts` (776 lines)

**Tools used:** wc-mcp (`score_component`, `get_component`, `analyze_accessibility`)

---

## Scores

| Metric              | Score  | Grade |
| ------------------- | ------ | ----- |
| CEM Health          | 92/100 | A     |
| Accessibility (CEM) | 50/100 | F     |

---

## Summary

| Severity      | Count | Fixed |
| ------------- | ----- | ----- |
| P0 (Critical) | 1     | 1     |
| P1 (High)     | 4     | 2     |
| P2 (Medium)   | 7     | 0     |

---

## P0 — Critical — FIXED

### P0-1: `aria-labelledby` self-reference overrides native label association

**File:** `hx-search.ts` — FIXED

**Was:** `aria-labelledby` pointed to `this._inputId` (the input's own ID), causing the accessible name to resolve to the input's value instead of the label text.

**Fix applied:** Added a separate `_labelId` for the `<label>` element. `aria-labelledby` now references the label's ID when a label is present.

---

## P1 — High — FIXED (2 of 4)

### P1-1: Missing `role="search"` landmark on wrapper — FIXED

**File:** `hx-search.ts` — FIXED

**Fix applied:** Added `role="search"` and `aria-label` to the outer `<div part="field">`. Screen reader users can now navigate to the search region using landmark navigation.

---

### P1-2: Escape key does not clear the input — FIXED

**File:** `hx-search.ts` — FIXED

**Fix applied:** Added `else if (e.key === 'Escape')` handler in `_handleKeydown`. When value is non-empty, pressing Escape clears the input and dispatches `hx-clear`. New tests added to verify behavior.

---

### P1-3: `formStateRestoreCallback` signature is too narrow — NOT FIXED

**File:** `hx-search.ts:170-172`

The W3C spec signature accepts `File | string | FormData | null`, but the component types it as `string` only. Browser form state restoration with `null` would set `this.value = null`.

**Recommendation:** Change signature to `(state: File | string | FormData | null)` and guard: `this.value = typeof state === 'string' ? state : '';`

---

### P1-4: No test coverage for Escape key behavior — FIXED (via P1-2)

Added 2 new tests: Escape clears value + Escape does nothing when empty.
Added 3 ARIA landmark tests: role="search" present, aria-labelledby references label ID, aria-label fallback when no label.

---

## P2 — Medium (Documented, Not Fixed)

### P2-1: Missing "with results count" Storybook story

No story demonstrates communicating result counts to users via `aria-live` region.

### P2-2: Hardcoded hex color fallbacks in CSS

Multiple CSS declarations use raw hex values as inner fallbacks (e.g., `#343a40`, `#ffffff`). These are defense-in-depth fallbacks but violate the "no hardcoded values" rule.

### P2-3: `color-mix()` used without `@supports` fallback

~93% browser support. On unsupported browsers, focus ring shadow is invisible.

### P2-4: `--hx-opacity-disabled` undocumented in JSDoc

Consumed in CSS but missing from `@cssprop` JSDoc block.

### P2-5: Non-null assertion on `@query` result

`_input!: HTMLInputElement` — technically incorrect before `firstUpdated()`, though guarded with optional chaining at usage sites.

### P2-6: No test for `formStateRestoreCallback`

`formResetCallback` is tested but `formStateRestoreCallback` has no test.

### P2-7: `aria-busy` on landmark div

Now on `role="search"` element which is more appropriate than a plain div, but `aria-busy` on a landmark is still not announced by all screen readers. Consider adding a visually hidden `<div role="status" aria-live="polite">` for loading announcements.

---

## Areas Passing Review

- **TypeScript:** No `any` types. Strict mode. Lit decorators correct.
- **Events:** All 3 events (`hx-input`, `hx-search`, `hx-clear`) typed correctly with `bubbles: true, composed: true`.
- **Clear button:** `aria-label="Clear search"`, `type="button"`, hidden when empty/disabled.
- **SVG icons:** All `aria-hidden="true"`.
- **Input type:** `type="search"` with native cancel button suppressed.
- **Reduced motion:** Spinner animation disabled with `prefers-reduced-motion: reduce`.
- **Form association:** `formAssociated = true`, `ElementInternals`, `setFormValue`, `formResetCallback`.
- **Debounce:** 300ms, timer cleared on Enter, Escape, disconnect.
- **CSS Parts:** All 7 parts documented and present.
- **Design tokens:** All `--hx-search-*` prefixed, semantic fallbacks.
- **Size variants:** `sm`, `md`, `lg` with distinct padding/font-size.
- **Storybook:** 22 stories with play functions for interaction testing.
- **Drupal:** `name` attribute passes through, `type="search"` participates in forms.
- **Tests:** 40 tests across 15 describe blocks, 4 axe-core accessibility tests.
- **Bundle size:** No heavy dependencies. Estimated < 5KB min+gz.
