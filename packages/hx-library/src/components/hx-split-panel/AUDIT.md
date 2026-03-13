# hx-split-panel — Antagonistic Quality Audit (T3-08)

**Reviewer:** Automated antagonistic review
**Date:** 2026-03-06
**Files audited:**

- `hx-split-panel.ts`
- `hx-split-panel.styles.ts`
- `hx-split-panel.test.ts`
- `hx-split-panel.stories.ts`
- `index.ts`

**Test run:** All 35 tests pass. Coverage: **68.29% statements / 57.5% branches / 61.53% functions / 66.17% lines**

---

## Severity Key

| Severity | Meaning                                                         |
| -------- | --------------------------------------------------------------- |
| P0       | Blocking — must fix before merge. Fails a gate.                 |
| P1       | High — significant deficiency in functionality or accessibility |
| P2       | Medium — quality issue, improvement recommended                 |

---

## P0 — Blocking

### P0-01: Test coverage below 80% threshold

**File:** `hx-split-panel.test.ts`
**Gate:** Gate 2 — "100% pass, 80%+ coverage"

Measured coverage:

- Statements: **68.29%** (required ≥80%)
- Branches: **57.5%** (required ≥80%)
- Functions: **61.53%** (required ≥80%)
- Lines: **66.17%** (required ≥80%)

Uncovered lines in `hx-split-panel.ts`: `119–129, 160–164`

- Lines 118–129: `_onPointerMove` and `_onPointerUp` — the entire pointer/drag interaction path has **zero test coverage**. This is the primary interaction model for the component.
- Lines 159–168: The `connectedCallback` `positionInPixels` conversion (`requestAnimationFrame` logic) has **zero test coverage**.

The project gate is explicit: 80%+ coverage, no exceptions. This component fails the gate.

---

## P1 — High Priority

### P1-01: No drag-to-resize tests

**File:** `hx-split-panel.test.ts`

The component's entire pointer event surface (`_onPointerDown`, `_onPointerMove`, `_onPointerUp`, `setPointerCapture`) is untested. The primary user interaction for a split panel — dragging the divider — is entirely unverified by the test suite.

There are no tests for:

- Drag produces correct percentage delta calculation
- `hx-reposition` fires during drag
- Pointer capture is acquired on pointerdown
- Drag is blocked when `disabled=true`
- `_dragging` flag state transitions

### P1-02: `min` and `max` properties not implemented

**File:** `hx-split-panel.ts`

The audit description requires "initial size/min/max typed as numbers or percentages." The component provides no public `min` or `max` properties. The internal values are hardcoded private readonly constants (`_minPercent = 0`, `_maxPercent = 100`).

Consumers cannot prevent a panel from collapsing to 0% or expanding to 100%. In healthcare workflows where minimum panel sizes are required (e.g., ensuring a sidebar never disappears entirely), this is a missing capability.

No tests for min/max constraints exist because the properties don't exist.

### P1-03: Panel collapse not implemented

**File:** `hx-split-panel.ts`

The audit description requires testing "panel collapse" as a distinct interaction. There is no `collapsible` property, no collapse API, and no collapse button affordance. The collapse/expand pattern common in split panels (click a toggle to fully hide one pane) is entirely absent.

Consequence: The Storybook story titled "Disabled" shows a locked panel, which is not the same as a collapsible one.

### P1-04: `positionInPixels` conversion is untested and has logic bugs

**File:** `hx-split-panel.ts`, lines 156–168

The `positionInPixels` property has zero test coverage. Beyond the coverage gap, the implementation has two silent defects:

1. **Snap is not applied** — The `connectedCallback` conversion sets `this.position = this._clamp(...)` directly, bypassing `_snapToPoint`. An initial pixel position near a snap threshold will not snap.

2. **`hx-reposition` is not fired** — The conversion sets `this.position` directly without calling `_setPosition`, so no `hx-reposition` event is dispatched. Consumers expecting the event for initial state synchronization will not receive it.

### P1-05: Focus indicator relies solely on color change — potential WCAG 2.4.7 violation

**File:** `hx-split-panel.styles.ts`, line 63

The divider has `outline: none` and `:focus-visible` only changes `background-color`. The 4px-wide divider changing from `--hx-color-neutral-200` to `--hx-color-primary-500` is the sole focus indicator.

Per WCAG 2.1 AA (Success Criterion 2.4.7 — Focus Visible), focus must be visible. A color change on a 4px bar may not be perceptible to users with low vision or in high-contrast modes. WCAG 2.2 (2.4.11 — Focus Appearance) requires the focus indicator to have a minimum area and contrast ratio.

There is no `outline`, `box-shadow`, or equivalent visible ring. This is particularly critical in a healthcare context.

### P1-06: `snap` property cannot be set via HTML attribute — Drupal incompatibility

**File:** `hx-split-panel.ts`, line 57

```typescript
@property({ type: Array })
snap: number[] = [];
```

The `snap` property has no `attribute` converter for serializing/deserializing an array from an HTML attribute string. In Drupal Twig templates (purely static HTML), snap points cannot be configured:

```twig
{# This does NOT work — snap is a JS property, not an HTML attribute #}
<hx-split-panel snap="[25, 50, 75]"></hx-split-panel>
```

The Drupal integration guide requires components to be "Twig-renderable without modification." The snap feature is inaccessible from Twig.

### P1-07: No Drupal Twig template documentation

**Files:** All component files

There is no Twig template example, no `@example` Twig block in the component JSDoc, and no documentation of which properties are attribute-settable vs. JS-only. The project non-negotiable states "Components work in Twig templates without modification." The `snap` issue (P1-06) is a direct violation; the documentation gap makes the full Drupal compatibility surface unclear.

---

## P2 — Medium Priority

### P2-01: Missing Storybook stories — collapsible and min/max

**File:** `hx-split-panel.stories.ts`

The audit description requires Storybook stories for "horizontal/vertical, with min/max, collapsible panels." The stories present are:

- Default (horizontal) — present
- Vertical — present
- WithSnapPoints — present
- Disabled — present
- PatientRecordLayout — present (bonus)

Missing:

- "With Min/Max" — not present (and not implementable until P1-02 is resolved)
- "Collapsible" — not present (and not implementable until P1-03 is resolved)

### P2-02: `snap` property absent from Storybook `argTypes`

**File:** `hx-split-panel.stories.ts`

The `snap` property is used in the `WithSnapPoints` story via `.snap=${[25, 50, 75]}` binding but is not declared in `argTypes`. It does not appear in the Storybook controls panel, has no description, no default value summary, and no type annotation in autodocs. The CEM-driven autodocs will not pick it up with a useful control.

`positionInPixels` is also absent from `argTypes` and has no story demonstrating its use.

### P2-03: `_positionAtDragStart` race condition on rapid pointer events

**File:** `hx-split-panel.ts`, line 113–114

In `_onPointerDown`, `_positionAtDragStart` is captured from `this.position` at the moment the pointer is pressed. If `position` has been programmatically updated between the pointerdown and the first pointermove (e.g., from an external `hx-reposition` listener that calls back into the component), the delta calculation will be incorrect. This is a low-probability edge case but worth noting for a production component.

### P2-04: `aria-disabled="false"` emitted redundantly when enabled

**File:** `hx-split-panel.ts`, line 191

```typescript
aria-disabled=${this.disabled ? 'true' : 'false'}
```

When the component is enabled, `aria-disabled="false"` is rendered. The `aria-disabled` attribute should only be present when `true`. `aria-disabled="false"` is not harmful but adds noise to the accessibility tree and can cause screen readers to announce "not disabled" unnecessarily. The idiomatic pattern is to omit the attribute when false:

```typescript
${this.disabled ? html`aria-disabled="true"` : nothing}
```

### P2-05: No `aria-label` or `aria-labelledby` on the divider

**File:** `hx-split-panel.ts`, lines 183–197

The focusable divider has no accessible name. Screen readers will announce "separator, vertical" (or "separator, horizontal") with no context about what is being divided. Per ARIA authoring practices, focusable separators used as splitters should have an accessible name (e.g., "Resize panels" or "Panel divider") via `aria-label`.

This is particularly important in healthcare UIs where assistive technology users need clear context.

### P2-06: No `Page Up` / `Page Down` keyboard support

**File:** `hx-split-panel.ts`, lines 132–154

The keyboard handler supports ArrowLeft/Right/Up/Down (+/-1%), Home (0%), and End (100%). Standard practice for slider-like controls (per ARIA APG) is to also support:

- `Page Up` — move divider by a larger increment (typically +10%)
- `Page Down` — move divider by a larger increment (-10%)

This allows keyboard-only users to reposition the divider more efficiently than 1% at a time.

### P2-07: Hardcoded hex fallback values bypass token layer

**File:** `hx-split-panel.styles.ts`, lines 7–10

```css
--_divider-color: var(--hx-split-panel-divider-color, var(--hx-color-neutral-200, #e2e8f0));
--_divider-hover-color: var(
  --hx-split-panel-divider-hover-color,
  var(--hx-color-primary-500, #3b82f6)
);
```

The hex values `#e2e8f0` and `#3b82f6` are hardcoded as last-resort fallbacks. The project non-negotiable states "Never hardcode colors, spacing, or typography values. Always use tokens." If the semantic tokens (`--hx-color-neutral-200`, `--hx-color-primary-500`) fail to resolve (e.g., token file not loaded), the component falls back to arbitrary hex values rather than a neutral/transparent default that would signal the misconfiguration. The hex fallbacks also couple the component to a specific color palette.

### P2-08: CSS part naming inconsistency with audit specification

**File:** `hx-split-panel.ts` JSDoc (lines 16–18), `hx-split-panel.styles.ts`

The audit description specifies CSS parts as `start-panel`, `end-panel`, `divider`. The actual implementation uses `start`, `end`, `divider`. While `start` and `end` are reasonable names, the discrepancy suggests the specification was not finalized before implementation. Either the spec should be updated to match the implementation, or the parts should be renamed to match the spec. Diverging part names affect consumer stylesheets.

---

## Passing Areas

The following areas pass review without significant issues:

- **TypeScript strict compliance** — No `any` types, correct use of `@property` decorators, proper union type for `orientation: 'horizontal' | 'vertical'`, clean `declare global` block.
- **Shadow DOM encapsulation** — Styles are correctly scoped; no leakage.
- **Token architecture** — Three-tier cascade pattern correctly implemented (`--hx-split-panel-*` → `--hx-color-*` → fallback).
- **`role="separator"`** — Correctly applied to divider element.
- **`aria-orientation`** — Correctly inverted from component orientation (horizontal split → vertical divider bar).
- **`aria-valuenow/min/max`** — Present and correct.
- **Keyboard navigation** — Arrow keys, Home, End all work correctly. Disabled state correctly blocks keyboard interaction.
- **Snap point logic** — 5% threshold snap is correct and tested.
- **`hx-reposition` event** — Correctly bubbles and composes, includes `position` in detail, correctly suppressed when position doesn't change.
- **CSS cursor changes** — `col-resize`/`row-resize` per orientation, `default` when disabled.
- **CSS parts** — `start`, `divider`, `end` are all exposed and functional.
- **axe-core** — All three axe tests pass (horizontal, vertical, disabled).
- **All 35 tests pass** — No regressions.

---

## Summary

| ID    | Severity | Area          | Issue                                                        |
| ----- | -------- | ------------- | ------------------------------------------------------------ |
| P0-01 | P0       | Testing       | Coverage at 68.29% — below 80% gate                          |
| P1-01 | P1       | Testing       | Zero tests for drag/pointer interaction                      |
| P1-02 | P1       | TypeScript    | No public `min`/`max` properties                             |
| P1-03 | P1       | Feature       | Panel collapse not implemented                               |
| P1-04 | P1       | Testing/Logic | `positionInPixels` untested; conversion skips snap and event |
| P1-05 | P1       | Accessibility | `outline: none` with color-only focus indicator              |
| P1-06 | P1       | Drupal        | `snap` not settable via HTML attribute                       |
| P1-07 | P1       | Drupal        | No Twig template documentation                               |
| P2-01 | P2       | Storybook     | Missing collapsible and min/max stories                      |
| P2-02 | P2       | Storybook     | `snap` and `positionInPixels` absent from argTypes           |
| P2-03 | P2       | Logic         | `_positionAtDragStart` race condition on rapid events        |
| P2-04 | P2       | Accessibility | `aria-disabled="false"` rendered redundantly                 |
| P2-05 | P2       | Accessibility | No `aria-label` on focusable divider                         |
| P2-06 | P2       | Accessibility | No Page Up/Down keyboard support                             |
| P2-07 | P2       | CSS           | Hardcoded hex fallbacks bypass token layer                   |
| P2-08 | P2       | CSS           | CSS part naming diverges from specification                  |

**Verdict: BLOCKED — 1 P0, 7 P1 issues must be resolved before merge.**

---

## Fixes Applied (A11y Audit — 2026-03-12)

| Issue | Status   | Fix                                                                                                                          |
| ----- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| P1-05 | RESOLVED | Added `outline: 2px solid` + `box-shadow` to `:focus-visible` state; focus indicator no longer relies solely on color change |
| P2-04 | RESOLVED | `aria-disabled` now uses Lit `nothing` directive when not disabled; attribute is absent (not `aria-disabled="false"`)        |
| P2-05 | RESOLVED | Divider has `aria-label="Resize panels"` for screen reader announcement                                                      |
| P2-06 | RESOLVED | PageUp (+10%) and PageDown (-10%) keyboard handlers added to divider                                                         |
