# AUDIT: hx-data-table (T2-02)

**Auditor:** Antagonistic Quality Review Agent
**Date:** 2026-03-06
**Files Reviewed:**
- `hx-data-table.ts`
- `hx-data-table.styles.ts`
- `hx-data-table.test.ts`
- `hx-data-table.stories.ts`
- `index.ts`

**Severity Scale:**
- **P0** — Correctness or accessibility defect; blocks merge
- **P1** — Missing required feature or significant flaw; must fix before release
- **P2** — Quality gap or improvement; fix before final ship

---

## 1. TypeScript

### P2 — Column interface uses `label`/`key` instead of `header`/`accessor`

The feature spec calls for a column definition typed as `{ header, accessor, sortable, width }`. The implementation uses `{ key, label, sortable, width }`. This is an intentional rename, but it creates a semantic gap: `key` implies a data accessor while `label` implies display text. The mismatch with the spec means any downstream code or docs referencing `header`/`accessor` will be wrong. Decision must be documented or interface must be updated.

**File:** `hx-data-table.ts:9-14`

---

### P2 — No generic type parameter on row data

`rows: Record<string, unknown>[]` provides no type safety for consumers. There is no way to type-check that cell values match a specific shape. A generic `<T extends Record<string, unknown>>` on the class or a `HxDataTableRow` export would allow typed consumption.

**File:** `hx-data-table.ts:68`

---

### P2 — No exported sort-state type

Sort state (`sortKey`, `sortDirection`) is used in events and public properties but there is no exported `HxDataTableSortState` interface. CEM autodocs and TypeScript consumers cannot type event detail without importing undocumented types.

---

### P2 — JSON coercion type assertion pattern

The `willUpdate` block uses `typeof (this.columns as unknown) === 'string'` with a double-cast to `string`. This is necessary because Lit does not JSON-parse array attributes automatically, but the pattern obscures intent. A comment explaining why the coercion exists would prevent future removal.

**File:** `hx-data-table.ts:121-134`

---

### P2 — `willUpdate` rows-length check fires on every update

The `>500 rows` performance warning is inside `willUpdate` with no guard. It fires on every property change, not only when `rows` changes.

**File:** `hx-data-table.ts:135-139`
**Fix:** Add `if (changed.has('rows') && this.rows.length > 500)`

---

## 2. Accessibility

### P0 — `aria-sort="none"` applied to non-sortable columns

`aria-sort` is unconditionally rendered on all `<th>` elements, including columns with `sortable: false`. Per WAI-ARIA 1.1 spec, `aria-sort` must only appear on sortable columns. Applying it to non-sortable columns misrepresents the column's interactive capability to assistive technology.

**File:** `hx-data-table.ts:292-297`
**Fix:** Render `aria-sort` only when `col.sortable === true`. Remove entirely from non-sortable headers.

---

### P0 — Arrow-key navigation breaks when focus is inside sort button

`_handleKeydown` queries `root.activeElement` to determine the focused element. When focus is inside the sort `<button>` within a `<th>`, `shadowRoot.activeElement` returns the `<button>`, not the `<th>`. `cells.indexOf(focused)` returns `-1` because `cells` contains only `[part~="th"]` and `[part~="td"]` elements. Arrow-key navigation is completely non-functional when the user tabs into a sortable column header.

**File:** `hx-data-table.ts:198-238`
**Fix:** When computing `focused`, walk up the DOM to find the nearest ancestor in `cells` if the direct `activeElement` is not found.

---

### P1 — Missing Home/End keyboard navigation

The feature description explicitly requires Home/End keyboard navigation within the table. `_handleKeydown` handles only `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, and `Space`. `Home` and `End` are not handled. This is a required capability omission.

**File:** `hx-data-table.ts:199`

---

### P1 — Skeleton loading rows are not hidden from assistive technology

The skeleton `<td>` elements and `<span class="skeleton-cell">` have no `aria-hidden="true"`. Screen readers will announce them as empty or meaningless content during loading. Combined with the `aria-busy="true"` on the table, AT users will receive confusing output.

**File:** `hx-data-table.ts:316-335`
**Fix:** Add `aria-hidden="true"` to each skeleton `<tr>` element.

---

### P1 — Checkbox `<th>` is not included in grid keyboard navigation

Data column `<th>` elements have `tabindex="0"` set inline (line 291), but the checkbox `<th>` (line 272) has no `tabindex`. The checkbox header is excluded from the programmatic cell navigation grid. Users navigating by arrow keys will skip the "Select all" checkbox column entirely.

**File:** `hx-data-table.ts:272-284`

---

### P2 — Sort button label does not communicate current state

`aria-label="Sort by {col.label}"` is static. It does not communicate that a column is currently sorted ascending or descending. While `aria-sort` on the parent `<th>` conveys this per spec, some screen readers do not announce `aria-sort` changes proactively. Adding `, currently sorted ascending` to the label when the column is active would improve announcements.

**File:** `hx-data-table.ts:303`

---

### P2 — Row checkbox labels do not reference row content

`aria-label="Select row 1"` uses a generic positional label. In healthcare, where tables show patient names, the label `"Select row 1"` is not useful for users navigating without visual context. A preferred pattern is `aria-label="Select Jane Doe"` using the first column value.

**File:** `hx-data-table.ts:363`

---

## 3. Tests

### P0 — No tests for filtering or pagination

The feature description lists filtering and pagination as explicit test audit areas. Neither feature is implemented or tested. There are no `filter`, `page`, `pageSize`, `hx-filter`, or `hx-page-change` tests or implementations. This is a significant omission that must be flagged before the component is considered complete.

---

### P1 — Missing keyboard navigation tests: ArrowDown, ArrowUp, ArrowLeft, Home, End

Only `ArrowRight` is tested. `ArrowDown`, `ArrowUp`, and `ArrowLeft` are not covered. `Home` and `End` do not exist in the implementation (P1 above) and therefore also have no tests.

**File:** `hx-data-table.test.ts:414-430`

---

### P1 — No test for Space-key selection toggle

The keyboard handler includes Space to toggle row selection. There is no test for this interaction.

**File:** `hx-data-table.test.ts` — absent

---

### P1 — No test for checkbox stopPropagation preventing hx-row-click

The row-level checkbox calls `e.stopPropagation()` to prevent `hx-row-click` from firing when only the checkbox is clicked. There is no test verifying this behavior. If the `stopPropagation` is removed, no test will catch the regression.

**File:** `hx-data-table.ts:365`
**File:** `hx-data-table.test.ts` — absent

---

### P1 — No test for JSON string attribute coercion

Drupal passes attributes as strings. No test verifies that `columns='[{"key":"name","label":"Name"}]'` (string attribute) is correctly parsed into column objects. This is the primary Drupal integration path and it has zero coverage.

**File:** `hx-data-table.test.ts` — absent

---

### P2 — No test for `hx-row-click` event correct index when rows are offset

The `hx-row-click` test only verifies `index: 0` for the first row. There is no test verifying that index values are correct for subsequent rows, particularly when rows are added or removed dynamically.

**File:** `hx-data-table.test.ts:255-269`

---

### P2 — No test for non-sortable column emitting no sort event

No test verifies that clicking on a non-sortable column header (where no `<button>` is rendered) does not dispatch `hx-sort`. While the absence of the button makes this implicit, a regression test would be cheap and protective.

---

## 4. Storybook

### P2 — `columns` and `rows` props have no Storybook controls

All public properties should have controls in Storybook. `columns` and `rows` use static fixtures and cannot be modified in the controls panel. At minimum, a JSON string control for each would allow demonstrating the Drupal/HTML attribute integration path.

**File:** `hx-data-table.stories.ts:32-64`

---

### P2 — No story for custom `loading` slot

The component documents a `loading` slot for custom loading content, but no story demonstrates it. Only the default skeleton loading state is shown.

**File:** `hx-data-table.stories.ts` — absent

---

### P2 — No story for Drupal / HTML attribute usage

No story shows how to use `columns` and `rows` as JSON string attributes (the Drupal path). Healthcare teams using Twig will encounter this immediately and have no reference.

---

## 5. CSS

### P0 — `--hx-data-table-empty-color` documented vs. implemented mismatch

The `@cssprop` JSDoc says:
```
@cssprop [--hx-data-table-empty-color=var(--hx-color-neutral-400)]
```
The actual CSS is:
```css
color: var(--hx-data-table-empty-color, var(--hx-color-neutral-600, #475569));
```
The fallback is `neutral-600` in the implementation but `neutral-400` in the docs. This is a direct documentation lie. CEM will generate incorrect token defaults, breaking consumer theming expectations.

**File:** `hx-data-table.ts:46` vs. `hx-data-table.styles.ts:183`

---

### P1 — CSS part naming does not match feature spec

The feature description specifies CSS parts named `table`, `row`, `cell`, `header`. The implementation uses `table`, `tr`, `td`, `th`. This means consumer CSS overrides written against the spec (`::part(row)`) will not work. The part names should match the spec (`row`, `cell`, `header-cell`) or the spec must be updated.

**File:** `hx-data-table.ts:32-38`

---

### P1 — `min-width: 600px` is hardcoded on `<table>`

The table element has `min-width: 600px` with no design token or CSS property override. This hardcodes a breakpoint assumption. Healthcare dashboards with narrow sidebars may require a different minimum. Should be `var(--hx-data-table-min-width, 600px)`.

**File:** `hx-data-table.styles.ts:25`

---

### P1 — Sticky header may not work when `:host` has `overflow-x: auto`

`:host` sets `overflow-x: auto`. `position: sticky` on `<th>` works relative to the nearest scrolling ancestor. While `overflow-x: auto` alone does not create a block formatting context that breaks vertical sticky, some browser implementations treat any `overflow` shorthand as creating a containing block. The sticky header behavior in browsers that interpret `overflow-x` as creating a stacking context has not been cross-browser validated.

**File:** `hx-data-table.styles.ts:3-9` and `:33-38`

---

### P2 — No focus-visible style on `<td>` cells

`<th>` elements (via the sort button) have focus-visible styles. Data `<td>` cells are `tabindex="-1"` and become programmatically focusable via arrow key nav, but have no visible focus indicator. This fails WCAG 2.4.7 (Focus Visible) when a keyboard user navigates via arrow keys into the data body.

**File:** `hx-data-table.styles.ts` — absent

---

## 6. Performance

### P1 — No pagination implemented

The component accepts unbounded `rows` arrays and renders all of them without pagination. The only safeguard is a `console.warn` at 500 rows. For enterprise healthcare tables with thousands of records, this is not acceptable. Virtual scrolling or server-side pagination with built-in `page`/`pageSize` properties is required.

**File:** `hx-data-table.ts:135-139`

---

### P1 — No virtual scrolling

The feature description notes "virtual scrolling if implemented." No virtual scrolling is implemented. With 500 rows of 4 cells each, 2000+ DOM nodes are created synchronously. This will cause noticeable render jank on low-end healthcare terminal hardware.

---

### P2 — Performance warning fires on every property change, not only when rows change

See TypeScript section P2 note. The guard is inside `willUpdate` without a `changed.has('rows')` check, meaning every state update re-evaluates `this.rows.length > 500` unnecessarily.

**File:** `hx-data-table.ts:135-139`

---

## 7. Drupal Integration

### P1 — No Drupal integration documentation

The feature description requires "Twig-renderable or client-side only with clear docs." No README, no inline documentation, and no Storybook story demonstrates how to use `hx-data-table` from a Drupal Twig template. Specifically:
- How to pass `columns` and `rows` as JSON strings
- Whether the component requires a JS bundle import in a Drupal behavior
- Whether `hx-sort`, `hx-select`, and `hx-row-click` events can be handled from Drupal behaviors

This documentation is essential for the primary consumer of this library.

---

### P1 — JSON coercion handles columns/rows but no Twig example exists

The `willUpdate` JSON coercion is the correct mechanism for Drupal attribute-based usage, but it is undocumented. Without guidance, Drupal developers will attempt to pass JavaScript arrays via Twig (impossible) or use `drupalSettings` without understanding the event interface.

**File:** `hx-data-table.ts:119-140`

---

### P2 — No test for invalid JSON attribute input recovery

The JSON coercion catches parse errors and falls back to `[]`, but no test verifies this. If a Drupal template generates malformed JSON, the component silently renders empty. A test asserting graceful degradation would protect the Drupal integration path.

**File:** `hx-data-table.ts:123-126`

---

## Summary

| Priority | Count | Areas |
|----------|-------|-------|
| **P0** | 4 | `aria-sort` on non-sortable headers; keyboard nav broken for sort buttons; CSS part doc mismatch; empty-color token mismatch |
| **P1** | 13 | Missing Home/End nav; skeleton ARIA; checkbox th nav gap; no filtering/pagination; missing key tests; CSS part naming; hardcoded min-width; sticky header risk; no pagination; no virtual scroll; no Drupal docs |
| **P2** | 13 | Sort label state; row checkbox label; `>500` check guard; generic row type; sort state interface; Storybook controls; loading slot story; Drupal story; td focus indicator; JS coercion comment; error state story; no invalid JSON test; perf warn guard |

**Total findings: 30**

**Blocking for merge (P0):** 4 findings — must be resolved before this component can ship.
