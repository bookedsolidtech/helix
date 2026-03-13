# AUDIT: hx-button-group (T1-03)

**Auditor:** Deep Antagonistic Quality Review
**Date:** 2026-03-05
**Files Reviewed:**

- `hx-button-group.ts`
- `hx-button-group.styles.ts`
- `hx-button-group.test.ts`
- `hx-button-group.stories.ts`
- `index.ts`

---

## Severity Key

| Level  | Meaning                                                               |
| ------ | --------------------------------------------------------------------- |
| **P0** | Blocking — broken, causes failure in production or CI                 |
| **P1** | High — must fix before ship; significant functional, a11y, or API gap |
| **P2** | Medium — should fix; quality, best-practice, or DX gap                |

---

## 1. TypeScript

### P2 — `_handleSlotChange` comment is architecturally misleading (`hx-button-group.ts:67-71`)

```ts
private _handleSlotChange(): void {
  // Notify the component that the slot content has changed so Lit can
  // re-evaluate slot-dependent CSS selectors (::slotted pseudo-elements).
  this.requestUpdate();
}
```

`::slotted()` CSS selectors are browser-native. They update in response to DOM mutations without any Lit re-render cycle. Calling `requestUpdate()` here does not cause `::slotted()` to re-evaluate — the browser handles that automatically. The comment is technically false and the `requestUpdate()` call adds an unnecessary render cycle on every slot mutation.

**Impact:** Extra render on every `slotchange` event; misleading comment will confuse future maintainers.

### P2 — No TypeScript-level enforcement of valid `orientation` values at the call site (`hx-button-group.ts:31-32`)

The `orientation` property is correctly typed as `'horizontal' | 'vertical'`. However, since it is reflected from an HTML attribute (`@property({ type: String, reflect: true })`), any string can be passed at runtime (e.g., `orientation="diagonal"`). There is no runtime guard, no warn-on-invalid, and no normalization. If an invalid value is set, `group--diagonal` is silently added to the class list — a class that has no CSS rule, producing a layout with no defined orientation.

**Impact:** Silent failure for invalid attribute values.

### P2 — `private internals` should use TypeScript definite assignment assertion or `declare` pattern

The field `private internals: ElementInternals` is declared uninitialized at the class body level and assigned in the constructor. TypeScript strict mode (`strictPropertyInitialization`) accepts this because constructor assignment is detected. This is correct, but the conventional Lit pattern for `ElementInternals` is to use `declare` with a class field or `!:` to make the intent explicit and align with patterns seen in the codebase. Minor — no functional impact.

---

## 2. Accessibility

### P1 — No keyboard navigation within the group; `role="group"` chosen over `role="toolbar"` without documented rationale (`hx-button-group.ts:47`)

The component sets `internals.role = 'group'`. For a row of interactive buttons, the WAI-ARIA Authoring Practices Guide specifies **`role="toolbar"`** as the correct role. Toolbar pattern requires:

- Arrow key navigation between buttons (Left/Right for horizontal, Up/Down for vertical)
- Roving `tabindex` (only one button in the tab sequence at a time; others `tabindex="-1"`)
- `Home`/`End` keys to jump to first/last button

`role="group"` with sequential Tab stops is **technically** valid but deviates from the expected screen reader interaction model for button toolbars. Screen readers announce `group` and `toolbar` differently: toolbars are announced as "toolbar" and users expect arrow-key navigation.

**Current behavior:** Sequential Tab through all buttons. No arrow key navigation. Screen reader announces "group" not "toolbar."

**Impact:** Degraded screen reader experience; keyboard-only users cannot use the expected arrow-key pattern; fails expected ARIA authoring practice for this pattern.

### P1 — No accessible label required or warned; undocumented requirement (`hx-button-group.ts:47`, `hx-button-group.ts:6-20`)

`role="group"` (and especially `role="toolbar"`) requires an accessible name (via `aria-label` or `aria-labelledby`) to be meaningful to screen readers. Without it, the group is announced as "group" with no context.

- The JSDoc/CEM comments do NOT mention that `aria-label` is required or strongly recommended.
- The default axe-core test (no `aria-label`) passes because axe only flags unlabeled groups in certain contexts.
- The `PatientRecord` story uses `aria-label` correctly, but this is not surfaced as a documented requirement in the component API.

**Impact:** Components shipped without `aria-label` will produce unnamed groups; violates WCAG 1.3.1 (Info and Relationships) in context.

### P1 — Focus visibility z-index uses `:focus-within` on slotted element — not verified to work when `hx-button` is the direct focusable (`hx-button-group.styles.ts:73-76`)

```css
.group ::slotted(:focus-within) {
  z-index: 1;
  position: relative;
}
```

`hx-button` is a custom element with Shadow DOM. The actual `<button>` receiving focus lives inside `hx-button`'s shadow root. `:focus-within` on the slotted `hx-button` DOES pierce shadow DOM in modern browsers (Chrome 105+, Firefox 108+, Safari 15.4+). However:

1. This relies on browser-specific shadow-piercing behavior of `:focus-within` that is not universally guaranteed in older browsers in the target matrix.
2. If focus is placed on `hx-button` itself (e.g., via `tabIndex` on the host), `:focus-within` would NOT match — only `:focus` would. The behavior is correct only if focus always ends up on an internal element.
3. There is NO test that verifies the z-index is actually applied on focus.

**Impact:** Focus rings on buttons with collapsed borders may be clipped in edge cases; no test coverage for this critical visual behavior.

### P2 — No `aria-disabled` cascade or handling for disabled children

If a child `hx-button` has `disabled` or `aria-disabled`, the group component does nothing to communicate this aggregate state. In some patterns, a group with all buttons disabled should itself be visually and programmatically distinct. No guidance, no behavior, no documentation.

---

## 3. Tests

### P1 — No test for keyboard navigation (`hx-button-group.test.ts`)

The feature description explicitly lists "keyboard nav between buttons" as a required test area. No test exercises:

- Tab between buttons
- Arrow key navigation (if toolbar pattern is adopted)
- Focus trap / focus management

### P1 — No test for disabled children

No test verifies behavior when one or more children have `disabled` attribute:

- Do disabled buttons correctly skip in the tab sequence?
- Does the group correctly handle all-disabled state?
- Are z-index/border adjustments still correct with disabled siblings?

### P1 — No test for mixed button types

No test exercises a group containing buttons with different `variant` values (e.g., `primary` + `secondary` + `ghost`). The `MixedVariants` story exists but there is no corresponding test.

### P1 — No test for orientation attribute reflection

Tests verify `classList` contains the correct orientation class (`group--horizontal`, `group--vertical`), but there is no test that verifies the `orientation` attribute is reflected to the host element DOM. Since `@property({ reflect: true })` is used, this should be testable.

### P1 — No test for single-button edge case

The `SingleButton` story exists but there is no test exercising the border-radius behavior with a single child. This is particularly important given the CSS specificity bug identified in Section 5.

### P2 — `requestUpdate` spy test is fragile implementation testing (`hx-button-group.test.ts:127-145`)

```ts
const requestUpdateSpy = vi.spyOn(el, 'requestUpdate');
// ...
expect(requestUpdateSpy).toHaveBeenCalled();
```

This test verifies an internal implementation detail (`requestUpdate()` is called), not observable behavior. If the slot change handler is refactored to remove the `requestUpdate()` call (which it should be — see TypeScript P2 above), this test breaks for the wrong reason. The correct test is: after appending a new button, verify the group renders correctly with two buttons.

### P2 — No test verifying `--hx-button-group-size` is consumed by child `hx-button`

Tests verify that `--hx-button-group-size` is set on the host element as a CSS custom property, but there is no test that `hx-button` actually reads and applies it. This means the size cascade mechanism is tested as "the property is set" but not as "the cascade actually works."

---

## 4. Storybook

### P1 — Size stories manually set `hx-size` on each child button, hiding whether CSS cascade actually works (`hx-button-group.stories.ts:113-148`)

```ts
// SmallSize story:
render: () => html`
  <hx-button-group hx-size="sm">
    <hx-button variant="secondary" hx-size="sm">Edit</hx-button>  <!-- explicit size -->
```

Every size story explicitly passes `hx-size` to each individual `hx-button` child in addition to setting `hx-size` on the group. This means the stories do not demonstrate or validate that the `--hx-button-group-size` CSS custom property cascade (the documented mechanism) actually works. If `hx-button` never reads `--hx-button-group-size`, these stories would still look correct.

**Impact:** The primary value proposition of `hx-size` on the group (cascading to children automatically) is not demonstrated and cannot be visually validated.

### P2 — No story for disabled children

Explicitly called out in the feature description as a required scenario. No story exercises a group with one or more disabled buttons.

### P2 — No dedicated `aria-label` story / accessibility documentation story

The `PatientRecord` story uses `aria-label` correctly, but there is no simple dedicated story that documents "always use `aria-label`" as the required accessibility pattern. The `aria-label` requirement is buried inside a complex composite story.

### P2 — `MixedVariants` story has no play function / assertions

The `MixedVariants` story renders different button variants but has no automated assertions. This is a documentation story only, not a behavior-verified story.

---

## 5. CSS

### P1 — Single-child border-radius is broken due to CSS specificity collision (`hx-button-group.styles.ts:36-51`)

When a group has exactly one child button, that element is simultaneously `:first-child` AND `:last-child`. The following two rules apply with **equal specificity** (0,2,0):

```css
/* Rule A — lines 37-39 */
.group--horizontal ::slotted(:first-child) {
  --hx-button-border-radius: var(--hx-border-radius-md) 0 0 var(--hx-border-radius-md);
}

/* Rule B — lines 43-45 — same specificity, defined LATER → wins */
.group--horizontal ::slotted(:last-child) {
  --hx-button-border-radius: 0 var(--hx-border-radius-md) var(--hx-border-radius-md) 0;
}
```

The last rule wins. A single-button group renders with `border-radius: 0 md md 0` — only the right corners are rounded. The intended result is full border-radius on all corners. The same defect applies to the vertical orientation.

The fix requires a `:first-child:last-child` (only-child) selector with higher specificity, or explicit `:only-child` handling.

**Impact:** `SingleButton` story renders with incorrect border-radius; this is a visual regression for any usage of the component with a single button.

### P1 — `--hx-button-group-size` cascade mechanism is unverified and likely non-functional

The component sets `--hx-button-group-size` on the host element via JavaScript:

```ts
this.style.setProperty('--hx-button-group-size', this.size);
```

For this to cascade to child `hx-button` elements, `hx-button` must have a CSS rule that reads `--hx-button-group-size`. Since CSS custom properties inherit through the DOM (including into Shadow DOM), a child element inside `hx-button`'s shadow root could read `--hx-button-group-size` if `hx-button` passes it through. However:

1. The stories always set `hx-size` explicitly on each button, suggesting the cascade is not relied upon.
2. There is no test that verifies end-to-end cascade.
3. If `hx-button` does not consume `--hx-button-group-size`, the property is set on the host but never used — the feature is effectively broken silently.

**Impact:** The size cascade feature may be entirely non-functional; discovery is deferred until integration testing.

### P2 — No `position: relative` on `:host` — z-index context dependency

The focus z-index trick relies on slotted elements having `position: relative; z-index: 1` within an `inline-flex` container. The `inline-flex` layout on `.group` creates a stacking context, so z-index values work correctly within it. However, there is no explicit documentation of this dependency. If the flex container changes (e.g., to `block`), the z-index trick silently breaks.

### P2 — No CSS custom properties for consumer theming of the group container itself

The component exposes `--hx-button-group-size` (for cascading to children) but provides no CSS custom properties for:

- Group border-radius
- Group border color
- Group background

These would be needed for consumers to theme the connected-border appearance without relying on `::part(group)`.

### P2 — `@media (prefers-reduced-motion)` rule targets `::slotted(*)` but `hx-button` manages its own transitions inside Shadow DOM

```css
@media (prefers-reduced-motion: reduce) {
  .group ::slotted(*) {
    transition: none;
  }
}
```

This sets `transition: none` on the slotted `hx-button` host element. But `hx-button`'s transitions are defined in its own Shadow DOM styles, not on the host. This rule does NOT suppress `hx-button`'s internal transitions. The reduced-motion rule is effectively a no-op for this component's children.

**Impact:** Users with `prefers-reduced-motion` still see button transitions inside the group.

---

## 6. Performance

### ~~P2 — Unnecessary `requestUpdate()` on every `slotchange` event~~ FIXED

Every time a button is added or removed from the slot, `_handleSlotChange()` triggers a full Lit render cycle. For a container with no dynamic state that changes on slot mutation, this is unnecessary work. The `::slotted()` CSS updates automatically via the browser without a Lit render.

**Fix:** `_handleSlotChange` method and the `@slotchange` listener removed entirely from `hx-button-group.ts`. CSS `::slotted()` selectors update via the browser without any Lit render cycle.

### ~~P2 — No `contain` declaration on `:host`~~ FIXED

Shadow DOM components benefit from `contain: layout style` (or `contain: content`) on `:host` to enable browser rendering optimizations.

**Fix:** `contain: layout style` added to `:host` in `hx-button-group.styles.ts`.

### P2 — Bundle size not verifiable from source review alone

The component is minimal (~82 lines + styles). Based on source analysis the component itself is likely well within the 5KB (min+gz) budget. However, no automated bundle size CI gate output is present in the component directory confirming compliance.

**Status:** Acknowledged — CI-level measurement is a separate infrastructure concern.

---

## 7. Drupal

### P2 — No documented CDN/Drupal registration pattern in component files

The `DrupalUsage` Storybook story shows a Twig template pattern but does not show how the custom element is registered. In Drupal, the registration typically happens via:

```twig
<script type="module" src="{{ cdn_url }}/hx-button-group.js"></script>
```

or a Drupal behaviors attachment. This is a documentation gap — the component works correctly as a web component but the integration pattern for Drupal consumers is not documented at the component level.

### P2 — `hx-size` attribute name not documented as Drupal-safe

The `hx-size` attribute uses a hyphen prefix, which is valid HTML but unusual. Twig attribute rendering with hyphens (e.g., `{{ attributes.setAttribute('hx-size', 'md') }}`) works correctly in Drupal but this is not documented. Drupal developers unfamiliar with the pattern may default to `size` (a standard HTML attribute) and produce incorrect behavior.

---

## Summary Table

| #   | Area          | Severity | Finding                                                                          |
| --- | ------------- | -------- | -------------------------------------------------------------------------------- |
| 1   | TypeScript    | P2       | `requestUpdate()` in slot handler is unnecessary and comment is false            |
| 2   | TypeScript    | P2       | No runtime guard for invalid `orientation` values                                |
| 3   | TypeScript    | P2       | `private internals` convention inconsistency (minor)                             |
| 4   | Accessibility | P1       | `role="group"` used instead of `role="toolbar"`; no arrow-key navigation         |
| 5   | Accessibility | P1       | No accessible label requirement documented or enforced                           |
| 6   | Accessibility | P1       | Focus visibility z-index via `:focus-within` on Shadow DOM not tested            |
| 7   | Accessibility | P2       | No `aria-disabled` cascade for disabled children                                 |
| 8   | Tests         | P1       | No keyboard navigation tests                                                     |
| 9   | Tests         | P1       | No disabled-children tests                                                       |
| 10  | Tests         | P1       | No mixed-variant tests                                                           |
| 11  | Tests         | P1       | No orientation attribute reflection test                                         |
| 12  | Tests         | P1       | No single-button border-radius test                                              |
| 13  | Tests         | P2       | `requestUpdate` spy test is fragile implementation testing                       |
| 14  | Tests         | P2       | `--hx-button-group-size` cascade not end-to-end tested                           |
| 15  | Storybook     | P1       | Size stories override individual button sizes — cascade mechanism undemonstrated |
| 16  | Storybook     | P2       | No disabled-children story                                                       |
| 17  | Storybook     | P2       | No dedicated `aria-label` accessibility documentation story                      |
| 18  | Storybook     | P2       | `MixedVariants` has no play assertions                                           |
| 19  | CSS           | P1       | Single-child border-radius bug (`:first-child:last-child` specificity collision) |
| 20  | CSS           | P1       | `--hx-button-group-size` cascade likely non-functional; unverified end-to-end    |
| 21  | CSS           | P2       | `position: relative` z-index context is undocumented dependency                  |
| 22  | CSS           | P2       | No consumer-facing CSS custom properties for group container theming             |
| 23  | CSS           | P2       | `prefers-reduced-motion` rule is no-op for Shadow DOM button transitions         |
| 24  | Performance   | **FIXED**| `requestUpdate()` removed from slot handler; `_handleSlotChange` deleted         |
| 25  | Performance   | **FIXED**| `contain: layout style` added to `:host` in styles                               |
| 26  | Performance   | **ACK**  | No bundle size CI gate output confirming <5KB compliance (infra concern)         |
| 27  | Drupal        | P2       | No CDN/Drupal registration pattern documented at component level                 |
| 28  | Drupal        | P2       | `hx-size` hyphen attribute not documented as Drupal-safe                         |

---

## P0 Findings

**None.** No outright build failures or broken exports were identified. The component renders, tests currently pass, and the basic orientation/size API works.

---

## Priority Fix Order

1. **CSS: Single-child border-radius bug** (P1, CSS #19) — Observable defect in the `SingleButton` story.
2. **A11y: role="group" vs role="toolbar"** (P1, A11y #4) — Wrong ARIA role for interactive button toolbar; requires roving tabindex implementation.
3. **CSS: Verify/fix `--hx-button-group-size` cascade** (P1, CSS #20) — Determine if `hx-button` consumes `--hx-button-group-size`; either fix or document that explicit sizing is required.
4. **Tests: keyboard nav, disabled children, mixed variants, single-button** (P1, Tests #8-12) — Complete test coverage to match feature description requirements.
5. **A11y: Document and enforce `aria-label`** (P1, A11y #5) — Add JSDoc, CEM annotation, and a dedicated Storybook story.
6. **CSS: Fix `prefers-reduced-motion` no-op** (P2, CSS #23) — Coordinate with `hx-button` to expose a motion token.
7. **TS: Remove `requestUpdate()` from slot handler** (P2, TS #1) — Clean up unnecessary render cycle and false comment.

---

## Drupal Fixes Applied

| Finding | Status |
|---------|--------|
| P2-16: No CDN/Drupal registration pattern documented | **FIXED** — `README.drupal.md` created with CDN strategy, npm+theme build pipeline strategy, asset loading YAML, and Drupal behaviors integration example. |
| P2-17: `hx-size` attribute name not documented as Drupal-safe | **FIXED** — `README.drupal.md` explicitly documents `hx-size` as valid HTML, shows `attributes.setAttribute('hx-size', 'sm')` in PHP, and explains the CSS custom property cascade mechanism. |
| Missing Twig template | **FIXED** — `hx-button-group.twig` template created with orientation, size, aria-label, and button iteration pattern. |
