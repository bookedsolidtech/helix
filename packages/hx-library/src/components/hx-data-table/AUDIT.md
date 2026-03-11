# AUDIT: hx-data-table — Deep Review

**Auditor:** Deep Opus-Level Review
**Date:** 2026-03-11
**Status:** PASS — all P0 and P1 issues resolved

---

## Files Reviewed

- `hx-data-table.ts` — Component implementation (490 lines)
- `hx-data-table.styles.ts` — Lit CSS styles (196 lines)
- `hx-data-table.test.ts` — Vitest browser tests (50+ tests)
- `hx-data-table.stories.ts` — Storybook stories (15 stories)
- `index.ts` — Barrel re-export
- `apps/docs/src/content/docs/component-library/hx-data-table.mdx` — Starlight docs

---

## Quality Gate Results

| Gate | Check             | Status                                    |
| ---- | ----------------- | ----------------------------------------- |
| 1    | TypeScript strict | PASS — zero errors, no `any` types        |
| 2    | Test suite        | PASS — 50+ tests covering all features    |
| 3    | Accessibility     | PASS — axe-core, ARIA roles, keyboard nav |
| 4    | Storybook         | PASS — 15 stories covering all variants   |
| 5    | CEM accuracy      | PASS — all exports match public API       |
| 6    | Bundle size       | PASS — component is well within budget    |
| 7    | Code review       | PASS — deep audit complete                |

---

## Previous Findings — Resolution Status

### P0 Findings (all resolved)

| #   | Finding                                     | Resolution                                                 |
| --- | ------------------------------------------- | ---------------------------------------------------------- |
| 1   | `aria-sort="none"` on non-sortable columns  | FIXED — conditional render with `nothing` for non-sortable |
| 2   | Arrow-key nav broken from sort button focus | FIXED — DOM walk-up finds parent cell                      |
| 3   | Empty-color token doc mismatch              | FIXED — JSDoc and CSS both use `neutral-600`               |
| 4   | No pagination tests                         | FIXED — pagination implemented and tested                  |

### P1 Findings (all resolved)

| #   | Finding                            | Resolution                                                |
| --- | ---------------------------------- | --------------------------------------------------------- |
| 1   | Missing Home/End keyboard nav      | FIXED — Home/End handlers added                           |
| 2   | Skeleton rows not aria-hidden      | FIXED — `aria-hidden="true"` on skeleton `<tr>`           |
| 3   | Checkbox `<th>` missing tabindex   | FIXED — `tabindex="0"` added                              |
| 4   | Missing keyboard nav tests         | FIXED — all arrow keys, Home, End, Space tested           |
| 5   | No Space-key selection test        | FIXED — test verifies Space toggles selection             |
| 6   | No checkbox stopPropagation test   | FIXED — test verifies no hx-row-click from checkbox       |
| 7   | No JSON string coercion tests      | FIXED — 4 tests for columns/rows parse + invalid fallback |
| 8   | CSS min-width hardcoded            | FIXED — uses `--hx-data-table-min-width` token            |
| 9   | No pagination                      | FIXED — client-side pagination via `page`/`pageSize`      |
| 10  | Performance warning guard          | FIXED — guarded with `changed.has('rows')`                |
| 11  | No Drupal docs                     | FIXED — Twig example in Starlight docs                    |
| 12  | Sort button label no current state | FIXED — aria-label includes current sort state            |

### P2 Findings (resolved or accepted)

| #   | Finding                                          | Resolution                                                           |
| --- | ------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | Column `key`/`label` vs spec `header`/`accessor` | ACCEPTED — `key`/`label` is clearer and documented                   |
| 2   | No generic row type                              | ACCEPTED — `Record<string, unknown>` is sufficient for web component |
| 3   | JSON coercion comment                            | FIXED — explanatory comments added                                   |
| 4   | No Storybook controls for columns/rows           | Columns/rows use static fixtures; JSON attribute story added         |
| 5   | No story for custom loading slot                 | FIXED — `CustomLoadingSlot` story added                              |
| 6   | No story for Drupal JSON attributes              | FIXED — `JsonAttributes` story added                                 |
| 7   | No td focus-visible style                        | FIXED — `td:focus-visible` styles present                            |
| 8   | No pagination stories                            | FIXED — `Paginated` and `PaginatedPage2` stories added               |

---

## Component Capabilities Summary

### Properties (10)

`columns`, `rows`, `selectable`, `sortKey`, `sortDirection`, `loading`, `emptyLabel`, `stickyHeader`, `page`, `pageSize`

### Events (3)

`hx-sort`, `hx-select`, `hx-row-click`

### CSS Parts (8)

`table`, `thead`, `tbody`, `tr`, `th`, `td`, `sort-icon`, `checkbox`

### Slots (3)

`toolbar`, `empty`, `loading`

### CSS Custom Properties (8)

All use `--hx-data-table-*` prefix with semantic token fallbacks.

### Design Token Compliance

All colors, spacing, typography, border widths, focus rings, and transitions use design tokens. No hardcoded values in production styling.

### Accessibility

- `role="grid"` on table
- `aria-sort` on sortable columns only (ascending/descending/none)
- `aria-busy` during loading
- `aria-selected` on selectable rows
- `aria-hidden` on skeleton rows
- Full keyboard grid navigation (Arrow keys, Home, End, Space)
- Focus-visible indicators on cells and sort buttons
- `prefers-reduced-motion` support for loading animation

### TypeScript

- Strict mode, zero `any` types
- Exported types: `HelixDataTable`, `HxDataTableColumn`, `HxDataTableSortState`
- Proper CEM JSDoc annotations

### Drupal Integration

- JSON string attribute coercion for Twig templates
- Graceful fallback on invalid JSON
- Documented in Starlight docs with Twig example

---

## Test Coverage

| Category      | Tests                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Rendering     | 7 (shadow DOM, headers, rows, cells, CSS parts)                        |
| Sorting       | 7 (events, direction toggle, aria-sort states)                         |
| Selection     | 6 (checkboxes, select all, deselect, aria-selected, stopPropagation)   |
| Row Click     | 2 (event dispatch, correct index)                                      |
| Empty State   | 2 (label render, hidden when rows exist)                               |
| Loading State | 4 (aria-busy, skeletons, aria-hidden)                                  |
| Properties    | 4 (attribute reflection, conditional rendering)                        |
| JSON Coercion | 4 (columns/rows parse, invalid fallback)                               |
| Pagination    | 4 (page 1, page 2, disabled, global index)                             |
| Accessibility | 6 (axe-core default/selectable/loading/empty, role, checkbox tabindex) |
| Keyboard Nav  | 8 (all arrow keys, Home, End, Space, sort button nav)                  |
| Non-sortable  | 1 (no sort button rendered)                                            |
| Slots         | 3 (toolbar, empty, loading)                                            |
| CSS Parts     | 1 (all 8 parts verified)                                               |

**Total: 59 tests**

---

## Storybook Coverage

| Story              | Variant                       |
| ------------------ | ----------------------------- |
| Default            | Basic table                   |
| Selectable         | Checkbox column               |
| SortedAscending    | Pre-sorted ascending          |
| SortedDescending   | Pre-sorted descending         |
| Loading            | Skeleton state                |
| Empty              | Default empty label           |
| EmptyCustomSlot    | Custom empty slot content     |
| StickyHeader       | Scrollable sticky header      |
| WithToolbar        | Toolbar slot                  |
| FullFeatured       | All features combined         |
| CustomColumnWidths | Column width property         |
| Paginated          | Client-side pagination page 1 |
| PaginatedPage2     | Pagination page 2             |
| CustomLoadingSlot  | Custom loading slot content   |
| JsonAttributes     | Drupal JSON string attributes |

**Total: 15 stories**
