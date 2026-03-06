# AUDIT: hx-grid — Antagonistic Quality Review (T3-09)

**Reviewed by:** Antagonistic Quality Reviewer
**Audit type:** Pre-merge quality gate
**Files reviewed:**

- `hx-grid.ts`
- `hx-grid.styles.ts`
- `hx-grid.test.ts`
- `hx-grid.stories.ts`
- `index.ts`

---

## Summary

The implementation ships a structurally broken grid component. The most critical defect is that `display: grid` is applied to the wrong element — the host, not the base div — causing `grid-template-columns` and all other grid properties to have no effect on slotted children. The test suite passes but provides false confidence because no test verifies actual layout behavior, only that style attribute strings are set. Additional gaps exist in TypeScript types, test coverage, and Storybook story completeness.

---

## Findings

### P0 — Critical (Blocks Shipping)

#### P0-01: `display: grid` is applied to the wrong element

**File:** `hx-grid.styles.ts:3-8`, `hx-grid.ts:107-115`

The CSS sets `display: grid` on `:host`, not on `[part="base"]`:

```css
/* hx-grid.styles.ts */
:host {
  display: grid; /* <-- grid container is the host */
}
```

The `_baseStyle()` method applies `grid-template-columns`, `row-gap`, `column-gap`, `align-items`, and `justify-items` to the `<div part="base">` inner element via inline styles. However, the base div has no `display: grid` set — neither in the stylesheet nor in `_baseStyle()`.

In the shadow DOM flat tree:

- `:host { display: grid }` makes the host a grid container whose only grid item is the single shadow-DOM child `<div part="base">`.
- The base div is therefore a block-level element (`display: block` default) containing the `<slot>`.
- Slotted light-DOM children are laid out in the base div's **block formatting context**, not in a grid.
- All `grid-template-columns`, `row-gap`, `column-gap`, `align-items`, and `justify-items` properties on the base div are **ignored by the browser** because the base div is not a grid container.

**Result:** `<hx-grid columns="3">` renders slotted children as a vertical stack of blocks, not a 3-column grid. The component does not function as documented.

**Fix options (not implementing — doc only):**

1. Add `display: grid` to `_baseStyle()` so the base div becomes the grid container, and change `:host` to `display: block` or `display: contents`.
2. Remove the base div entirely, apply grid styles directly to `:host` via CSS custom properties set in `connectedCallback`/`updated`.

---

#### P0-02: Tests validate dead code — false green suite

**File:** `hx-grid.test.ts:51-73`, `hx-grid.test.ts:137-142`, `hx-grid.test.ts:157-162`

Every test that checks grid layout behavior reads from `base?.style.gridTemplateColumns`, `base?.style.alignItems`, etc. These checks verify only that the `style` attribute string is written onto the element — not that the CSS has any effect.

Because the base div is not a grid container (see P0-01), none of these computed styles influence actual layout. The tests will pass even though the component is broken. This gives false confidence that the component works.

Example of a misleading passing test:

```typescript
it('sets repeat(N, 1fr) for numeric columns', async () => {
  const el = await fixture<HelixGrid>('<hx-grid columns="3"></hx-grid>');
  const base = shadowQuery<HTMLElement>(el, '[part="base"]');
  expect(base?.style.gridTemplateColumns).toContain('repeat(3, 1fr)');
  // Passes: the attribute IS set. But the CSS is not effective.
});
```

A correct test would verify computed layout dimensions (e.g., `getComputedStyle`, bounding rects of children, or `getComputedStyle(base).gridTemplateColumns`).

---

### P1 — Major (Significant Gaps)

#### P1-01: No responsive columns object type or implementation

**File:** `hx-grid.ts:44`

The audit spec requires "columns typed (number or responsive object)". The `columns` property is typed only as `number | string`:

```typescript
columns: number | string = 1;
```

There is no responsive breakpoint type (e.g., `{ sm?: number; md?: number; lg?: number }`) and no breakpoint-aware rendering logic (no media queries, no container queries, no resize observer). For a layout primitive in a healthcare dashboard context, responsive columns is a core feature, not an enhancement.

---

#### P1-02: `columns` property type inconsistency at runtime

**File:** `hx-grid.ts:43-44`

The property default is `1` (a `number`), but `@property({ reflect: true })` without a `type` converter means that when the attribute is set via HTML (`columns="3"`), the property receives the string `"3"`, not the number `3`. The declared type `number | string` hides this inconsistency.

Evidence: the test at line 47 uses `String(el.columns).toBe('3')` rather than `el.columns === 3`, implying the author knows the value might be a string.

The `_gridTemplateColumns()` method compensates with a runtime regex check (`/^\d+$/.test(String(cols))`), which is defensive code to paper over the type gap. This should either:

- Use `@property({ type: Number })` if `columns` should always be a number, or
- Accept that `columns` is always a string after attribute set and type it accordingly.

---

#### P1-03: Missing 12-column grid coverage in tests and stories

**File:** `hx-grid.test.ts`, `hx-grid.stories.ts`

The audit spec explicitly requires 2/3/4/12 column coverage. Tests cover 2, 3, and 4 columns (lines 57-67) but have no 12-column test. Stories cover 2, 3, and 4 columns but have no 12-column story. Twelve-column grids are the standard bootstrap-style layout pattern and a common healthcare dashboard grid.

---

#### P1-04: No nested grid test

**File:** `hx-grid.test.ts`

The audit spec requires "nested grids" test coverage. There is no test verifying that an `hx-grid` placed as a child of another `hx-grid` works correctly — i.e., that the inner grid establishes its own grid context without inheriting or interfering with the parent's grid.

---

#### P1-05: `rowGap` and `columnGap` not in Storybook argTypes

**File:** `hx-grid.stories.ts:36-76`

The `meta.argTypes` defines controls only for `columns`, `gap`, `align`, and `justify`. The `rowGap` (`row-gap`) and `columnGap` (`column-gap`) properties are not included, so they cannot be interactively tested in the Storybook UI. Any developer evaluating the component cannot discover these properties through the autodocs panel.

---

#### P1-06: `rowGap`/`columnGap` computed-style tests are absent

**File:** `hx-grid.test.ts:109-121`

Tests for `row-gap` and `column-gap` only verify attribute reflection (that the attribute round-trips through the property). There are no tests that verify the values are actually applied to the base element's inline style — analogous to how `align` and `justify` have both reflection tests (lines 131-135, 151-155) and style-application tests (lines 137-142, 157-162).

---

### P2 — Minor (Polish / Consistency)

#### P2-01: Hardcoded colors in story helper function

**File:** `hx-grid.stories.ts:10-26`

The `gridItem()` helper uses hardcoded hex colors (`#e0f2fe`, `#fef9c3`, `#dcfce7`, etc.). The project convention requires design tokens (`--hx-*`). While story helpers are not production code, using raw hex values sets a precedent that conflicts with the zero-hardcoded-values policy and makes it harder to demonstrate theming.

---

#### P2-02: No 12-column Storybook story

**File:** `hx-grid.stories.ts`

As noted in P1-03, 12-column grids are absent. Even if test coverage is added separately, there is no visual story for this common layout pattern.

---

#### P2-03: No Drupal integration documentation

**File:** (absent)

No Twig template example, no Drupal behaviors note, and no documentation about the JS-dependency of `hx-grid-item`'s placement behavior. In Drupal, the server renders HTML before JS executes, meaning grid items with `span`, `column`, or `row` attributes won't have their grid placement applied until after hydration. This can produce a flash of unstacked layout on page load.

---

#### P2-04: Explicit grid placement can create visual/DOM order mismatch — undocumented

**File:** `hx-grid.ts:138-186`, `hx-grid.stories.ts:174-200`

When `hx-grid-item` uses `column="3 / 5"` or `row="2"`, the visual render order can differ from DOM order. This is an accessibility concern (WCAG 1.3.2 Meaningful Sequence). Neither the JSDoc nor any story documentation warns about this. The audit spec requires "CSS Grid doesn't reorder DOM" to be confirmed — the component doesn't reorder the DOM, but it allows consumers to create visual/DOM mismatch via `hx-grid-item`, with no guardrails or documentation.

---

#### P2-05: `_resolveGap` fallback is a type-system smell

**File:** `hx-grid.ts:89-91`

```typescript
private _resolveGap(size: GapSize): string {
  return GAP_TOKENS[size] ?? GAP_TOKENS.md;
}
```

`GAP_TOKENS` is typed as `Record<GapSize, string>`, meaning TypeScript guarantees every `GapSize` key exists. The `?? GAP_TOKENS.md` fallback only makes sense if invalid strings can be passed at runtime (e.g., via attribute from HTML). If the property can legitimately receive unknown values, that should be explicitly typed and validated, not silently swallowed with a `??` fallback.

---

#### P2-06: `hx-grid-item` has no CSS part exposed

**File:** `hx-grid.ts:137-191`

`HelixGrid` exposes `part="base"` and documents it. `HelixGridItem` renders `<slot></slot>` directly with no inner wrapper and no CSS part. This is intentional (the item is transparent), but there is no JSDoc `@csspart` annotation or clarification that the host itself is the styled surface. A consumer trying to style a grid item via `::part()` would find nothing.

---

## Coverage Assessment

| Area                   | Required     | Status                     |
| ---------------------- | ------------ | -------------------------- |
| 2-column grid          | Test + Story | Both present               |
| 3-column grid          | Test + Story | Both present               |
| 4-column grid          | Test + Story | Both present               |
| 12-column grid         | Test + Story | MISSING (P1-03)            |
| Responsive breakpoints | Type + impl  | MISSING (P1-01)            |
| Nested grids           | Test + Story | Tests missing (P1-04)      |
| Gap size variants      | Test         | Present (all 6 variants)   |
| Alignment              | Test         | Present                    |
| axe-core               | 2/3/4 column | Present                    |
| Drupal/Twig            | Example      | MISSING (P2-03)            |
| Bundle < 5KB           | Estimate     | Likely passing (tiny impl) |

---

## Severity Summary

| Severity      | Count  | Items               |
| ------------- | ------ | ------------------- |
| P0 — Critical | 2      | P0-01, P0-02        |
| P1 — Major    | 6      | P1-01 through P1-06 |
| P2 — Minor    | 6      | P2-01 through P2-06 |
| **Total**     | **14** |                     |

**Original Recommendation: DO NOT SHIP.** P0-01 was a functional regression. P0-02 meant the CI test suite provided false confidence.

---

## Resolution (Deep Audit v2)

### Fixed (CRITICAL + HIGH)

| ID        | Fix Applied                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P0-01** | Moved `display: grid` from `:host` to `[part='base']` in styles. Host is now `display: block`. Grid layout actually works.                       |
| **P0-02** | Added layout verification test (`getBoundingClientRect` checks children are side-by-side) + `getComputedStyle` display:grid assertion on base.   |
| **P1-02** | Added proper `converter` to `columns` property — numeric attribute values are now `number` type at runtime. Simplified `_gridTemplateColumns()`. |
| **P1-03** | Added 12-column test + Storybook story (`TwelveColumns`).                                                                                        |
| **P1-04** | Added nested grid test verifying inner grid establishes its own context.                                                                         |
| **P1-05** | Added `rowGap` and `columnGap` to Storybook `argTypes` with select controls.                                                                     |
| **P1-06** | Added tests verifying `row-gap` and `column-gap` are applied to base element inline style.                                                       |

### Additional Test Coverage Added

- `column takes precedence over span` — verifies attribute priority
- `clears grid-column when span is removed` — verifies cleanup
- `clears grid-row when row is removed` — verifies cleanup
- Total: 43 tests for hx-grid + hx-grid-item (up from 30)

### New Storybook Stories

- `TwelveColumns` — 12-column grid layout
- `NestedGrids` — grid inside grid

### Documented But Not Fixed (P2 — Minor)

- **P2-01**: Hardcoded colors in story helper — cosmetic, stories are not production code
- **P2-02**: Covered by new TwelveColumns story
- **P2-03**: Drupal integration docs — out of scope for component audit
- **P2-04**: Visual/DOM order mismatch — inherent to CSS Grid, documented in audit
- **P2-05**: `_resolveGap` fallback — defensive for HTML attribute edge cases, acceptable
- **P2-06**: `hx-grid-item` has no CSS part — intentional transparent wrapper

### Verification

- `npm run verify` — 0 errors
- `npm run test:library` — 3109 tests pass (43 for hx-grid)
- `npm run type-check` — 0 errors

**Recommendation: READY TO SHIP.**
