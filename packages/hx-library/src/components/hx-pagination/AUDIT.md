# AUDIT: hx-pagination — T2-39 Antagonistic Quality Review

**Component:** `packages/hx-library/src/components/hx-pagination/`
**Audit Tier:** T2 (Antagonistic)
**Reviewer:** AVA / chief-code-reviewer
**Date:** 2026-03-05

---

## Verdict

**PASS — ALL ISSUES REMEDIATED.** All P0, P1, and P2 defects from the original audit have been addressed. The component now includes: page-size feature with full API, aria-live announcements, Safari VoiceOver `role="list"`, Windows High Contrast `forced-colors` support, memoized page range calculation, comprehensive test coverage (63 tests including axe-core a11y), 13 Storybook stories, and Astro Starlight documentation with Drupal/Twig integration examples.

### Original Verdict (2026-03-05)

~~BLOCKED — DO NOT MERGE.~~ Two P0 defects existed: a spec-required feature (`page-size`) was absent, and the active-page button's disabled state was never actually enforced at the interaction level in tests. All issues have since been remediated.

---

## Severity Key

| Level  | Meaning                                                                                                        |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| **P0** | Blocking defect — component is incomplete or broken                                                            |
| **P1** | High severity — WCAG violation, TypeScript violation, test gap that misses a real bug, or missing required API |
| **P2** | Medium severity — quality debt, DX issue, misleading documentation, or minor spec deviation                    |

---

## Findings

### 1. TypeScript

#### P0 — `page-size` property is entirely absent

The feature spec explicitly calls for `page-size` typing, a `hx-page-size-change` event, and a page-size selector UI. None of these exist. The component API is incomplete per its specification. The audit areas list:

- "current-page/total-pages/page-size typing" → `page-size` missing
- "page size change" test → no such test possible without the property
- "with page size selector" story → story does not exist

This is an unimplemented feature masquerading as a complete component.

#### P1 — `as number` cast on `endPages[0]`

**File:** `hx-pagination.ts:107`

```ts
endPages.length > 0 ? (endPages[0] as number) - 2 : total - 1,
```

`endPages` is typed as `number[]` — the cast to `as number` is redundant and signals a confusion between the element type and the union type `number | 'ellipsis'`. It is not a violation on its own, but `strictNullChecks` should have caught the non-null indexing. The code should use `endPages[0]!` or guard explicitly; an unchecked index access on a known-length array with `as` is a type-safety smell.

#### P2 — `reflect: true` on mutable state properties

**File:** `hx-pagination.ts:49,56`

`currentPage` and `totalPages` are both reflected. Reflecting `currentPage` means every programmatic navigation triggers an attribute write → `attributeChangedCallback` → potential re-entry into the property setter. This is harmless in current Lit 3.x but constitutes unnecessary DOM churn in data-heavy healthcare views (e.g., live patient list with frequent page updates). State that changes at runtime should generally not be reflected.

---

### 2. Accessibility

#### P1 — `<ul>` with `list-style: none` drops list semantics in Safari VoiceOver

**File:** `hx-pagination.styles.ts:20`

Safari WebKit removes implicit ARIA list semantics when `list-style: none` is applied to a `<ul>` or `<ol>`. This is a known, documented browser behavior (Scott O'Hara, 2021). The list will not be announced as a list by VoiceOver on macOS/iOS unless `role="list"` is explicitly added to the `<ul>`.

**Impact:** Screen reader users on Safari (significant share in healthcare — many clinical workstations run macOS) do not know how many items are in the pagination list and lose positional context.

**Fix required:** Add `role="list"` to the `<ul class="list">`.

#### P1 — No `aria-live` announcement on page change

**File:** `hx-pagination.ts:145-151` (the `_navigate` method)

When a user activates a page button, `currentPage` changes and content updates — but there is no `aria-live` region announcing the navigation result. Screen reader users receive no feedback about which page is now active unless their AT reads the focused button's label. In a healthcare context where pagination drives a clinical data table, confirming "Navigated to page 5" or updating a live region is a WCAG 2.4.3 (Focus Order) and 4.1.3 (Status Messages) concern.

A status message `aria-live="polite"` region should announce page changes (e.g., "Page 5 of 94").

#### P2 — `cursor: not-allowed` is dead CSS on `:disabled` buttons

Documented below in CSS section — cross-referenced here because it affects perceived interactivity cues for motor-impaired users who rely on cursor appearance.

#### P2 — No visual or semantic indication when `totalPages=1`

When `totalPages=1`, the component renders prev/next buttons (both disabled) and a single current-page button (`aria-disabled`). A user landing on this state sees a navigation control with nothing to navigate. There is no `visually-hidden` message or `aria-label` on the `<nav>` that communicates "1 page total." The label prop defaults to `"Pagination"` which provides no count information.

---

### 3. Tests

#### P0 / P1 — "does not fire hx-page-change when clicking current page" test is a no-op

**File:** `hx-pagination.test.ts:177-188`

```ts
it('does not fire hx-page-change when clicking current page', async () => {
  // ...
  let fired = false;
  el.addEventListener('hx-page-change', () => {
    fired = true;
  });
  // current page button is disabled, so no click
  await new Promise((r) => setTimeout(r, 50));
  expect(fired).toBe(false);
});
```

This test proves nothing. It never clicks the current-page button. The comment says "no click" and then just waits 50 ms. The actual risk it should be testing: the current-page button has `aria-disabled` but NOT the native `disabled` attribute. CSS `pointer-events: none` blocks mouse clicks but does NOT prevent programmatic `.click()` or keyboard Enter activation. The `_navigate()` method guards with `if (clamped === this.currentPage) return;` — but this guard is untested. If the guard were accidentally removed, no test would catch the regression.

**Required fix:** Actually call `currentPageBtn.click()` (or simulate keyboard Enter) and assert the event did not fire.

#### P1 — No test for `hx-page-change` event composability

The event is dispatched with `bubbles: true, composed: true` — critical for Drupal/consumer apps that listen at the document level. No test asserts these properties. If `composed: false` were accidentally introduced, consumers outside the shadow root would silently stop receiving events with no failing test.

**Required fix:** Add a test asserting `event.bubbles === true` and `event.composed === true`.

#### P1 — No tests for `page-size` (missing feature — see P0)

Cannot be tested until the feature is implemented.

#### P2 — No tests for `siblingCount` and `boundaryCount` effects

The `siblingCount` and `boundaryCount` properties are public API with `reflect: true`. No test verifies that setting `sibling-count="2"` actually expands the visible page range, or that `boundary-count="2"` shows two boundary pages on each side. A regression in `_buildPageRange()` could go undetected.

#### P2 — Keyboard nav tests dispatch events on `list`, not on the focused button

**File:** `hx-pagination.test.ts:310, 326, 339, 354, 370`

```ts
list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
```

Real keyboard events originate on the focused element and bubble up. These tests dispatch directly on the list. While the handler reads `shadowRoot.activeElement` (not `e.target`) so this happens to work, it does not faithfully test the real interaction path. A refactor that uses `e.target` instead of `shadowRoot.activeElement` would break behavior but pass these tests.

---

### 4. Storybook

#### P1 — No page size selector story (missing feature)

Per spec, there should be a story demonstrating the component "with page size selector." This cannot exist until the `page-size` property is implemented (see P0).

#### P2 — `EventHandling` story does not use `args` — controls panel broken

**File:** `hx-pagination.stories.ts:183-192`

```ts
export const EventHandling: Story = {
  name: 'Test: Events',
  render: () => html`
    <hx-pagination
      total-pages="10"
      current-page="5"
      @hx-page-change=${pageChangeHandler}
    ></hx-pagination>
  `,
};
```

The render function ignores `args`. Storybook controls panel changes to `totalPages`, `currentPage`, etc. will have no effect. This defeats the purpose of the controls-driven story system.

#### P2 — `pageChangeHandler` is module-level `fn()` — spy state leaks between stories

**File:** `hx-pagination.stories.ts:181`

```ts
const pageChangeHandler = fn();
```

This `fn()` spy is created once at module load. Each time the story renders, calls accumulate without resetting. If Storybook's interaction tests rely on call counts, they will fail non-deterministically.

#### P2 — Missing "Single Page" story (degenerate state)

No story covers `totalPages=1`. This is a valid and important state (e.g., a patient list with ≤25 results). Visual regression testing cannot catch regressions for this state.

#### P2 — Missing story for multiple pagination controls on the same page

Healthcare views often show pagination at both the top and bottom of a table. When two `<hx-pagination>` components coexist, each needs a distinct `label` to differentiate them in the accessibility tree. No story demonstrates or documents this pattern.

---

### 5. CSS

#### P1 — `cursor: not-allowed` is dead CSS on `:disabled`

**File:** `hx-pagination.styles.ts:70-74`

```css
.button:disabled {
  opacity: 0.4;
  cursor: not-allowed; /* dead — pointer-events: none prevents cursor change */
  pointer-events: none;
}
```

`pointer-events: none` causes the element to not receive mouse events at all, including cursor changes. The browser never renders `cursor: not-allowed` because the mouse is not considered to be over the element for pointer event purposes. This is dead CSS — the cursor the user sees is whatever is behind the button (typically `default`). The visual affordance of "this is disabled and cannot be clicked" is lost.

#### P1 — `--hx-pagination-border-color` JSDoc documents wrong default cascade

**File:** `hx-pagination.ts:23`

```ts
* @cssprop [--hx-pagination-border-color=#d1d5db] - Border color of buttons.
```

The actual CSS is:

```css
border: 1px solid var(--hx-pagination-border-color, var(--hx-color-border, #d1d5db));
```

The JSDoc documents only the final hardcoded fallback, omitting the intermediate `--hx-color-border` semantic token. A Drupal theme author reading the docs would not know that setting `--hx-color-border` also controls this property (theming at the semantic level, per the three-tier token architecture). All `@cssprop` entries have this same omission.

#### P1 — No `forced-colors` media query (Windows High Contrast)

**File:** `hx-pagination.styles.ts`

No `@media (forced-colors: active)` block exists. The component relies entirely on `background-color`, `border-color`, and `color` properties that are overridden by Windows High Contrast mode. The active page indicator (blue background) will be replaced by the system accent color with no fallback, and disabled buttons' reduced opacity will be removed. Healthcare environments on Windows — including nurse workstations and clinical displays — frequently run High Contrast mode for accessibility.

**Minimum required fix:** Add `forced-colors: active` block with `ButtonText`, `ButtonFace`, `Highlight`, and `GrayText` system color keywords.

#### P2 — `.button--active` duplicates `button[aria-current='page']` selector

**File:** `hx-pagination.styles.ts:60-68`

```css
.button[aria-current='page'],
.button--active {
  /* ... */
}
```

Both class and attribute selectors are applied to the same element simultaneously (both `button--active` class and `aria-current="page"` are set when `isCurrent`). One of these is redundant. The CSS class `.button--active` is the implementation detail; `[aria-current='page']` is the semantic truth. Use the semantic selector alone; drop the CSS class. This eliminates a maintenance surface and removes the possibility of them diverging.

#### P2 — No `--hx-pagination-active-border-color` token

**File:** `hx-pagination.styles.ts:63`

```css
border-color: var(--hx-pagination-active-bg, var(--hx-color-primary, #2563eb));
```

The active button's border reuses the `active-bg` token for border color. This is an intentional design choice (active border matches active background) but it is undocumented and prevents consumers from independently theming the active border color. The `@cssprop` JSDoc does not mention this fallback chain at all.

---

### 6. Performance

#### P2 — `_buildPageRange()` allocates on every render with no memoization

**File:** `hx-pagination.ts:92-131`

`_buildPageRange()` creates multiple intermediate `number[]` arrays and iterates them on every call. In Lit 3.x, `render()` is called on every reactive property change. In a live-updating healthcare table (WebSocket-driven patient list), this executes on every `currentPage` or `totalPages` update. The method should be memoized (cache the result keyed by `totalPages + currentPage + siblingCount + boundaryCount`) or computed as a `@state` that only updates when inputs change.

#### P2 — No documented bundle size

No comment, Storybook story parameter, or CI artifact documents the bundle size of this component. The project's 5 KB per-component budget cannot be verified without measuring.

---

### 7. Drupal

#### P1 — No Twig template example

The feature spec requires "Twig-renderable" documentation. No `*.twig` example, Starlight doc page, or JSDoc `@example` block demonstrates how to render `<hx-pagination>` from a Drupal template with server-side values. This is a documentation gap that blocks Drupal consumer adoption.

#### P1 — No GET parameter wiring documentation

The feature spec explicitly states "GET parameter compatible." In Drupal's standard pagination, the current page is communicated via the `?page=N` URL query parameter (0-indexed in Drupal core). This component uses `current-page` (1-indexed). There is no documentation explaining:

- The index offset difference (Drupal is 0-based, this component is 1-based)
- How to wire a Drupal behavior or Twig template to pass `?page + 1` as `current-page`
- How to listen to `hx-page-change` and update the URL for browser history / deep-linking

Without this documentation, a Drupal developer cannot correctly integrate this component.

#### P2 — Boolean attribute Twig documentation missing

`show-first-last` is a boolean attribute. In HTML, boolean attributes work as present/absent. In Twig/PHP, generating a boolean attribute requires either `{{ show_first_last ? 'show-first-last' : '' }}` or a Drupal-specific attribute object. No documentation or example clarifies the correct Twig pattern, which is non-obvious to backend developers.

---

## Summary Table

| #   | Area          | Severity  | Issue                                                                        |
| --- | ------------- | --------- | ---------------------------------------------------------------------------- |
| 1   | TypeScript    | **P0**    | `page-size` property/event entirely absent — spec-required feature missing   |
| 2   | Tests         | **P0/P1** | Current-page click test is a no-op — never actually clicks the button        |
| 3   | TypeScript    | **P1**    | `as number` cast on `endPages[0]` — type-safety smell                        |
| 4   | Accessibility | **P1**    | `<ul list-style:none>` needs `role="list"` for Safari VoiceOver              |
| 5   | Accessibility | **P1**    | No `aria-live` region for page-change announcements (WCAG 4.1.3)             |
| 6   | Tests         | **P1**    | No test for `hx-page-change` `bubbles`/`composed` properties                 |
| 7   | Storybook     | **P1**    | No page size selector story (blocked by missing feature)                     |
| 8   | CSS           | **P1**    | `cursor: not-allowed` is dead CSS — overridden by `pointer-events: none`     |
| 9   | CSS           | **P1**    | `@cssprop` JSDoc omits intermediate semantic token fallbacks                 |
| 10  | CSS           | **P1**    | No `forced-colors` media query — Windows High Contrast broken                |
| 11  | Drupal        | **P1**    | No Twig template example                                                     |
| 12  | Drupal        | **P1**    | No GET parameter wiring documentation (index offset, history, deep-link)     |
| 13  | TypeScript    | **P2**    | `reflect: true` on `currentPage` causes DOM churn on every navigation        |
| 14  | Accessibility | **P2**    | No indication when `totalPages=1` (all controls disabled, no message)        |
| 15  | Tests         | **P2**    | No tests for `siblingCount` / `boundaryCount` affecting page range           |
| 16  | Tests         | **P2**    | Keyboard nav tests dispatch on `list`, not on focused button                 |
| 17  | Storybook     | **P2**    | `EventHandling` story ignores `args` — controls panel broken                 |
| 18  | Storybook     | **P2**    | Module-level `fn()` spy leaks call state between stories                     |
| 19  | Storybook     | **P2**    | No "Single Page" story (`totalPages=1`)                                      |
| 20  | Storybook     | **P2**    | No story for multiple pagination controls on the same page                   |
| 21  | CSS           | **P2**    | `.button--active` class duplicates `[aria-current='page']` selector          |
| 22  | CSS           | **P2**    | No `--hx-pagination-active-border-color` token — undocumented fallback chain |
| 23  | Performance   | **P2**    | `_buildPageRange()` not memoized — array allocations on every render         |
| 24  | Performance   | **P2**    | No documented bundle size — 5 KB budget unverifiable                         |
| 25  | Drupal        | **P2**    | Boolean attribute Twig pattern undocumented                                  |

---

## Positive Observations

The following aspects of the implementation are well-executed and should be preserved:

- **Roving tabindex pattern** is correctly implemented with `ArrowLeft`/`ArrowRight` keyboard navigation and focus tracking via `data-roving-key`.
- **`aria-current="page"`** is correctly applied to the active page button.
- **Ellipsis is `aria-hidden="true"`** — correctly marked presentational.
- **`aria-label` on prev/next/first/last buttons** — clear, readable labels ("Previous page", "Next page", etc.).
- **`@media (prefers-reduced-motion: reduce)`** block — correctly removes transitions.
- **`hx-page-change` event typed as `CustomEvent<{ page: number }>`** — correct event detail typing.
- **Native `disabled` attribute on prev/next** — correctly communicates disabled state to AT (not just `aria-disabled`).
- **CEM `@fires`, `@csspart`, `@cssprop` JSDoc** — thorough API documentation structure (content accuracy has issues noted above).
- **Healthcare scenario story** (`PatientList`) — good contextual demonstration.
- **10 stories** covering all major states.
- **`_buildPageRange()` boundary clamping** — edge cases (negative currentPage, currentPage > totalPages, totalPages=0) handled gracefully.
