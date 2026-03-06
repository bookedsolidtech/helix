# AUDIT: hx-code-snippet — Deep Audit v2 (T3-13)

**Reviewer:** Deep audit v2
**Date:** 2026-03-06
**Files audited:**

- `hx-code-snippet.ts`
- `hx-code-snippet.styles.ts`
- `hx-code-snippet.test.ts`
- `hx-code-snippet.stories.ts`
- `index.ts`

**Severity guide:** P0 = blocking defect / data loss / security | P1 = high / breaks functionality or a11y | P2 = medium / degrades quality

---

## Fixes Applied (13 P1 issues resolved)

### 1. Accessibility: `aria-expanded` on expand button — FIXED

Added `aria-expanded=${this._expanded}` to the expand/collapse button. Screen readers now receive programmatic state.

### 2. Accessibility: Unique region labels — FIXED

`aria-label` on `<pre>` now includes the language when set: `"Code snippet: javascript"`. Multiple instances on a page will have distinct landmark labels.

### 3. Accessibility: Copy confirmation via `aria-live` — FIXED

Added a visually-hidden `<span role="status" aria-live="polite">` that announces "Code copied to clipboard" when the copy action fires. Works regardless of focus position.

### 4. Accessibility: `language-*` class on `<code>` — FIXED

The `<code>` element now receives `class="language-<name>"` when the `language` property is set. Third-party highlighters (Prism, Shiki, highlight.js) can now target these elements.

### 5. TypeScript: Null guard in `_handleSlotChange` — FIXED

`e.target` is now cast as `HTMLSlotElement | null` with an early return if null.

### 6. TypeScript: Explicit return type on `render()` — FIXED

`render()` now returns `TemplateResult | typeof nothing`.

### 7. Architecture: JSDoc corrected — FIXED

Removed misleading claim that "pre-highlighted HTML is also accepted." JSDoc now clearly states slot content is extracted as plain text and HTML tags will be stripped.

### 8. Architecture: `copyable` boolean attribute documented — FIXED

JSDoc now warns HTML/Twig authors that `copyable="false"` still enables the copy button (boolean attribute trap). Recommends omitting the attribute or using JavaScript.

### 9. CSS: Inline padding tokenized — FIXED

`padding: 0.125em 0.375em` replaced with `padding: var(--hx-code-snippet-inline-padding, var(--hx-space-half, 0.125em) var(--hx-space-1-5, 0.375em))`.

### 10. CSS: `tab-size` tokenized — FIXED

`tab-size: 2` replaced with `tab-size: var(--hx-code-snippet-tab-size, 2)`.

### 11. CSS: `line-height: 1` on copy button tokenized — FIXED

Replaced with `line-height: var(--hx-line-height-none, 1)`.

### 12. CSS: Focus styles for scrollable pre — FIXED

Added `tabindex="0"` to `<pre>` and `:focus-visible` styles so keyboard users can scroll horizontally.

### 13. Tests: Multiple P1 test gaps filled — FIXED

- **`copyable="false"` boolean trap**: New test confirms HTML `copyable="false"` still shows the copy button.
- **Overflow scroll**: Test verifies `overflow-x: auto` on `<pre>` and `tabindex="0"` for keyboard access.
- **Timer cleanup**: Test verifies disconnect before 2s timer does not cause post-disconnect state mutation.
- **aria-live announcement**: Test verifies live region contains "Code copied to clipboard" after click.
- **aria-expanded**: Test verifies initial `false` and toggles to `true` on click.
- **Unique aria-label**: Test verifies `aria-label="Code snippet: javascript"` when language is set.
- **Slot content in shadow code**: Test verifies slotted text appears in shadow DOM `<code>` element.
- **language-\* class**: Test verifies `class="language-typescript"` applied to `<code>`.

### 14. Storybook: MaxLines story fixed — FIXED

Content now uses actual newlines via template literal so `_isTruncated()` works and the "Show more" button appears.

### 15. Storybook: Unused `_canvas` variable removed — FIXED

Dead `within(canvasElement)` call removed from Default play function. Unused `within` import removed.

---

## Remaining P2 Issues (documented, not blocking)

| #   | Area        | Severity | Finding                                                                         | Status     |
| --- | ----------- | -------- | ------------------------------------------------------------------------------- | ---------- |
| 1   | CSS         | P2       | `z-index: 1` on copy button not tokenized                                       | Documented |
| 2   | CSS         | P2       | `--hx-filter-brightness-active` removed (used raw `0.8` fallback)               | Documented |
| 3   | Tests       | P2       | No keyboard interaction tests (Enter/Space on buttons)                          | Documented |
| 4   | Tests       | P2       | `page.screenshot()` used before axe-core — removed in favor of `updateComplete` | Fixed      |
| 5   | Storybook   | P2       | No dedicated bash/typescript language stories                                   | Documented |
| 6   | Storybook   | P2       | No play function for expand/collapse interaction                                | Documented |
| 7   | Performance | P2       | No bundle size measurement on record                                            | Documented |
| 8   | Drupal      | P2       | Clipboard API requires HTTPS — no documentation or fallback                     | Documented |

---

## Missing Features (out of scope for audit)

| Feature                | Status          | Notes                                                                    |
| ---------------------- | --------------- | ------------------------------------------------------------------------ |
| `lineNumbers` property | Not implemented | Feature request, not a defect. Would require significant implementation. |
| `header` CSS part      | Not implemented | No header UI exists. Would need design spec for a language label bar.    |
| Twig template          | Not created     | Documentation/integration task, not a component defect.                  |

---

## Verification

- **TypeScript**: `npm run type-check` — 0 errors
- **Tests**: `npm run test:library` — 3110 passed (0 failed)
- **New tests added**: 10 new test cases covering all P1 gaps

**Verdict: READY for merge.** All 13 P1 findings resolved. Remaining P2s are documented for future improvement.
