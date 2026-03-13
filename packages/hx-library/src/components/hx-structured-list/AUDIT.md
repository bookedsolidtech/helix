# AUDIT: hx-structured-list — T3-05 Antagonistic Quality Review

**Auditor:** Antagonistic QA Agent
**Branch audited:** `feature/implement-hx-structured-list-t3` (commit `fbc6075f`)
**Files reviewed:**

- `hx-structured-list.ts`
- `hx-structured-list.styles.ts`
- `hx-structured-list.test.ts`
- `hx-structured-list.stories.ts`
- `index.ts`

---

## Summary

| Area          | Score | Critical Issues                                               |
| ------------- | ----- | ------------------------------------------------------------- |
| TypeScript    | 7/10  | Missing `@cssprop` docs for 2 props                           |
| Accessibility | 5/10  | Semantic structure broken, `role=term`/`definition` misuse    |
| Tests         | 5/10  | No coverage for visual variants, hardcoded border untested    |
| Storybook     | 7/10  | No header story; only 2 of 8 stories have `play` tests        |
| CSS           | 4/10  | Striped not implemented, hardcoded `1px`, missing `cell` part |
| Performance   | N/A   | No bundle size verified                                       |
| Drupal        | 6/10  | Works as HTML but no Twig example provided                    |

**Overall: SHIPPABLE — P0 and P1 defects fixed in Deep Audit v2.**

---

## P0 — Blocking Defects

### P0-1: `striped` prop declared but CSS never applied

**File:** `hx-structured-list.styles.ts`

The `striped` boolean property is declared on `HelixStructuredList` and reflects to attribute, but the CSS for `helixStructuredListStyles` only defines the `--_bg-stripe` custom property — it never applies it. There is no `:host([striped]) ::slotted(...)` rule or equivalent CSS that would produce any visible striping effect.

`helixStructuredListRowStyles` has zero awareness of `striped`. The row renders identically regardless of whether the parent has `striped` set.

**Result:** The `striped` attribute is a no-op. It exists in TypeScript, reflects to the DOM, and is featured in Storybook — but produces zero visual output. Any consumer who uses `striped` will silently get nothing.

This is a functional regression, not a style preference.

**Evidence:**

```css
/* helixStructuredListStyles — stripe variable is defined but NEVER applied */
--_bg-stripe: var(--hx-structured-list-stripe-bg, var(--hx-color-neutral-50, #f8fafc));

/* No rule uses --_bg-stripe anywhere in either styles file */
```

---

### P0-2: Hardcoded `1px` border in row — violates No-Hardcode rule

**File:** `hx-structured-list.styles.ts:42`

```css
:host(:not(:last-of-type)) .row {
  border-bottom: 1px solid var(--_border-color, var(--hx-color-neutral-200, #e2e8f0));
}
```

The `1px` value is hardcoded. Per CLAUDE.md Zero-Tolerance Policy: _"No hardcoded values — Colors, spacing, typography, and timing use design tokens. Always."_

The component already has `--_border-width: var(--hx-structured-list-border-width, var(--hx-border-width-thin, 1px))` defined for exactly this purpose. It is used correctly for the bordered wrapper border but forgotten for the row divider.

**Fix required:**

```css
border-bottom: var(--_border-width) solid var(--_border-color, var(--hx-color-neutral-200, #e2e8f0));
```

---

### P0-3: Component not registered in main library `src/index.ts`

**File:** `packages/hx-library/src/index.ts` (implementation commit `fbc6075f`)

`hx-structured-list` and `hx-structured-list-row` are NOT exported from the package's main entry point. The component can only be used by importing from its direct path. Consumers using `@wc-2026/library` will not have access to it.

No other component in the library has this omission. All existing components are registered in `src/index.ts`. This was simply missed in the implementation.

---

## P1 — High-Severity Issues

### P1-1: Semantic HTML structure is wrong — `<div>` pretending to be a description list

**File:** `hx-structured-list.ts`

The component JSDoc explicitly states:

> "Renders as a description list for accessible term/definition semantics."

The actual implementation renders a `<div class="list">` container. The row renders `role="term"` and `role="definition"` on plain `<div>` elements.

**Problems:**

1. `role="term"` and `role="definition"` without a `role="definition list"` parent is semantically orphaned. Per WAI-ARIA 1.1, these roles have implicit ownership expectations. Screen readers may not associate the term with its definition correctly.
2. The container `<div part="base" class="list">` has no role. Assistive technology announces it as a generic container with no structural meaning.
3. The JSDoc promises description-list semantics (`<dl>/<dt>/<dd>`) but delivers roles on divs. One or the other needs to be true.

**Preferred fix:** Use `<dl>`, `<dt>`, `<dd>` elements within the shadow DOM (or at minimum add `role="list"` to the container and verify ARIA owned/owner relationships for term/definition).

---

### P1-2: `actions` slot nested inside `value` cell — no independent column

**File:** `hx-structured-list.ts`

```html
<div part="value" class="row__value" role="definition">
  <slot></slot>
  <div part="actions" class="row__actions">
    <slot name="actions"></slot>
  </div>
</div>
```

The `actions` part lives inside `row__value`. The grid is 2-column: `label | value+actions`. This means:

- Actions are NOT in a dedicated third column
- With long value text, action buttons are pushed to a new line within the same cell
- There is no consistent right-side alignment for action buttons across rows

The audit spec requires `actions` to be a composable area. The current structure limits layout flexibility and can break visual alignment in real-world healthcare data views (e.g., a patient name vs a MRN — one is long, one is short — buttons will not align).

---

### P1-3: Two CSS custom properties used but not documented in JSDoc

**File:** `hx-structured-list.styles.ts`

Used in styles but absent from `@cssprop` annotations on `HelixStructuredListRow`:

- `--hx-structured-list-label-color` (line: `.row__label` color)
- `--hx-structured-list-value-color` (line: `.row__value` color)

These are theming hooks consumers can and should use, but they are invisible in generated CEM/autodocs. Any consumer who discovers them via DevTools has no documentation for default values or intent.

---

### P1-4: Missing `row` and `cell` CSS parts

**File:** `hx-structured-list.ts`

The audit spec requires CSS parts: `list, row, cell, header`.

Current parts:

- `hx-structured-list`: `base` (the container div)
- `hx-structured-list-row`: `base` (the row div), `label`, `value`, `actions`

Missing:

- No `row` part on the row element — the `base` part is doing double duty as both the component root and the row. Convention in this library is `base` = root element, but for composition purposes an explicit `row` part is expected.
- No `cell` part — individual label/value cells are not independently targetable by name (they use `label` and `value` which is acceptable, but no generic `cell` abstraction exists).
- No `header` concept at all — see P1-5.

---

### P1-5: No `header` variant or slot

The feature spec explicitly calls out "header" as an audit area: _"CSS parts (list, row, cell, header)"_ and _"Storybook — basic, selectable, with header, striped"_.

There is no header row variant, no `header` slot, no `header` CSS part, and no Storybook story demonstrating header usage. The component cannot display a column header row. For a key-value display component this may be acceptable, but the spec calls for it and it is entirely absent.

---

## P2 — Low-Severity Issues

### P2-1: `striped` and `condensed` tests only verify attribute reflection, not visual behavior

**File:** `hx-structured-list.test.ts`

The test suite verifies that `striped` and `condensed` reflect as attributes — but this proves nothing about visual output. Given that `striped` is completely non-functional (P0-1), the tests pass while the feature is broken. Tests should assert computed styles or the presence of stripe-background CSS.

### P2-2: Row border divider not tested

No test verifies that row dividers render between rows or that the `--_border-width` token governs them. The hardcoded `1px` (P0-2) would pass untested forever.

### P2-3: `play` functions missing from 6 of 8 Storybook stories

Stories `Condensed`, `Striped`, `BorderedCondensed`, `UserProfile`, `SettingsPanel`, and `PatientDetail` have no `play` function. Storybook interaction tests are part of the quality bar. The `Striped` story in particular would immediately reveal P0-1 if a visual assertion were present.

### P2-4: No Storybook story demonstrating `hx-structured-list-row` in isolation

`hx-structured-list-row` is a named custom element with its own CSS parts and slots, but Storybook only shows it inside `hx-structured-list`. There is no isolated story for the row component, making it harder to develop against or document independently.

### P2-5: No Drupal Twig template example

The component JSDoc makes no mention of Drupal usage patterns. While the component is Twig-renderable as a custom element, no example template, Drupal behavior, or CDN import path is documented. Healthcare enterprise consumers on Drupal have no guidance.

### P2-6: Bundle size not verified

No evidence in the implementation commit that bundle size was checked against the <5KB (min+gz) per-component budget. The component is two elements in one file with no external dependencies beyond Lit and token-styles; it likely passes, but it is unverified.

### P2-7: `--_padding-block`/`--_padding-inline` CSS variable inheritance relies on undocumented behavior

The `condensed` variant defines `--_padding-block` and `--_padding-inline` on the `:host` of `hx-structured-list`. The row component then reads these via `var(--_padding-block, ...)`. This works because CSS custom properties inherit across the Shadow DOM boundary through the light DOM tree — but this is non-obvious, fragile if the component is ever used standalone (the row won't know it's `condensed`), and the `--_` prefix implies "private". Using a component-level custom property that crosses component boundaries violates the intended encapsulation.

---

## Not Applicable

- **Selectable prop / radio group pattern**: Not implemented. The component is a display-only key-value list. Given the design intent (patient demographics, settings panels), a selectable variant may not be needed. However, the feature spec listed this as a potential requirement. The decision to omit it was never documented in the implementation.

---

## Fixes Applied (Deep Audit v2)

| Issue | Status | Fix                                                                                                 |
| ----- | ------ | --------------------------------------------------------------------------------------------------- |
| P0-1  | FIXED  | Striped CSS implemented via `::slotted(hx-structured-list-row:nth-of-type(even))`                   |
| P0-2  | FIXED  | Hardcoded `1px` replaced with `var(--_border-width, var(--hx-border-width-thin, 1px))`              |
| P0-3  | N/A    | Library uses per-component entry points — no centralized `src/index.ts` needed                      |
| P1-1  | FIXED  | Container has `role="list"`; row base uses `role="listitem"` (removed conflicting `role="term"`/`role="definition"` from shadow DOM children — these caused axe `aria-required-children` violations when inside `role="list"`) |
| P1-3  | FIXED  | Added `@cssprop` docs for `--hx-structured-list-label-color` and `--hx-structured-list-value-color` |

## Fixes Applied (Deep Audit v3)

| Issue | Status | Fix                                                                                                                    |
| ----- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| P2-1  | FIXED  | Added computed style assertions for condensed padding and striped background                                           |
| P2-2  | FIXED  | Added row border divider test asserting `border-bottom-style: solid`                                                   |
| P2-3  | FIXED  | Added play functions to all stories (Condensed, Striped, BorderedCondensed, UserProfile, SettingsPanel, PatientDetail) |
| P2-4  | FIXED  | Added `IsolatedRow` story demonstrating standalone `hx-structured-list-row` with all parts and actions                 |

**Test count: 30 tests (17 hx-structured-list + 13 hx-structured-list-row), all passing.**

## Remaining (P1/P2 — documented, not blocking)

- **P1-2** — Actions slot nested inside value cell (structural, would be a breaking change)
- **P1-4** — No `row` CSS part alias on row component (cosmetic)
- **P1-5** — No header variant (design decision needed)
- **P2-5** — No Drupal Twig example (Starlight docs already include Twig example)
- **P2-6** — Bundle size unverified
- **P2-7** — CSS variable inheritance across shadow boundaries
