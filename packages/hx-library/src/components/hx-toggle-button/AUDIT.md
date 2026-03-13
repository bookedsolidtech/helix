# AUDIT: hx-toggle-button — T2-29 Antagonistic Quality Review

**Auditor:** Automated antagonistic review agent
**Date:** 2026-03-05
**Branch under audit:** `feature/t2-29-hx-toggle-button-pressedunpressed`
**Files reviewed:**
- `hx-toggle-button.ts` (209 lines)
- `hx-toggle-button.styles.ts` (206 lines)
- `hx-toggle-button.test.ts` (490 lines)
- `hx-toggle-button.stories.ts` (1118 lines)
- `index.ts`

---

## Executive Summary

The component is structurally sound: correct `aria-pressed` semantics, full ElementInternals form association, `prefers-reduced-motion` support, and solid CSS token coverage. However, two defects rise to blocking severity before merge: a **double-opacity compounding bug** that renders disabled buttons nearly invisible, and **keyboard tests that silently pass without testing keyboard activation**. Four P1 findings require remediation; remaining P2 items are quality improvements.

---

## Findings

### P0 — Blocking

#### P0-1: Double opacity on disabled state — visual compounding bug

**File:** `hx-toggle-button.styles.ts`, lines 7-10 and 197-200

```css
/* Host level */
:host([disabled]) {
  pointer-events: none;
  opacity: var(--hx-opacity-disabled, 0.5);   /* <-- 0.5 */
}

/* Inner button level */
.button[disabled] {
  cursor: not-allowed;
  opacity: var(--hx-opacity-disabled, 0.5);   /* <-- 0.5 again */
}
```

The inner `.button[disabled]` is a child of `:host([disabled])`. CSS opacity multiplies: `0.5 × 0.5 = 0.25`. A disabled toggle button renders at 25% opacity — significantly darker than the intended 50%. This also fails WCAG 1.4.3 (text contrast) because the text becomes too dim even against a light background.

**Fix:** Remove `opacity` from `.button[disabled]`. Keep only `:host([disabled])` opacity, or keep only the inner one. Do not apply both.

---

### P1 — High Priority

#### P1-1: Keyboard tests do not test keyboard activation

**File:** `hx-toggle-button.test.ts`, lines approximately 292-320

```ts
it('toggles on Space key press', async () => {
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent(el, 'hx-toggle');
  btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  btn.click();   // <-- this is what actually fires the event
  const event = await eventPromise;
  expect(event.detail.pressed).toBe(true);
});
```

Both Space and Enter keyboard tests dispatch a `keydown` event and then **immediately call `btn.click()`**. The `keydown` dispatch does nothing observable in these tests — the `click()` is the only thing producing the `hx-toggle` event. If the keydown handler were completely deleted, or if `key: ' '` were replaced with `key: 'F12'`, both tests would still pass.

Native `<button>` elements activate on Space keyup and Enter keydown, but the test never verifies that the button responds correctly to keyboard events without an explicit `.click()` call. The correct approach is to use `userEvent.keyboard` (Storybook play), `btn.focus()` + keyboard dispatch + awaiting the result without a `click()` call, or to test the behavior end-to-end in the browser context.

**Impact:** The keyboard coverage is theater. A regression that breaks keyboard activation would not be caught by CI.

#### P1-2: No accessible name support for icon-only usage

**File:** `hx-toggle-button.ts` — no `label` or `aria-label` forwarding

The component does not expose a `label` property, and has no mechanism to forward an accessible name to the inner `<button>` element. An icon-only toggle button (prefix slot only, no default slot text) will have no accessible name for screen readers.

Storybook workaround (`ViewModeToggle` story) applies `aria-label` directly on `<hx-toggle-button>`, which only labels the custom element host — it does **not** propagate to the inner `<button>` element inside Shadow DOM. Screen readers operating in forms mode will announce the `<button>` inside the shadow, which has no label.

The correct fix is to either:
1. Add a `label` string property that sets `aria-label` on the inner `<button>`, or
2. Use `aria-labelledby` with an explicitly connected label ID.

No test covers icon-only accessibility. The axe-core tests all include text content (`Mute audio`).

#### P1-3: `formStateRestoreCallback` is untested

**File:** `hx-toggle-button.test.ts` — no test for `formStateRestoreCallback`

The component implements `formStateRestoreCallback(state: string)` for bfcache/session restore. This is an important form behavior but has zero test coverage. The implementation is:

```ts
formStateRestoreCallback(state: string): void {
  this.pressed = state === 'pressed';
}
```

The form value is set via `this._internals.setFormValue(this.value)` (the string value), not the string `'pressed'`. This means if the browser restores state from the stored form value (e.g., `"on"`), `formStateRestoreCallback` would receive `"on"`, which is not equal to `'pressed'`, so `this.pressed` would be set to `false` — incorrect behavior. The restore callback should likely check `state !== null` or match against the stored value string.

#### ~~P1-4: No Drupal Twig template or integration documentation~~ FIXED

**Resolution:** `hx-toggle-button.twig` template added covering: server-rendered pressed state,
icon-only usage with `aria_label`, exclusive toggle group pattern with `data-toggle-group` and
a full Drupal behavior, form-associated usage with `name`/`value`, and the `hx-size` attribute
mapping (not `size`). A `DrupalIntegration` story added to `hx-toggle-button.stories.ts`
demonstrating server-rendered pressed state, exclusive view-mode toggle group, form-associated
toggle, and disabled state from server-side permission checks.

---

### P2 — Medium Priority

#### P2-1: Tertiary and outline pressed states may not meet WCAG 3:1 non-text contrast

**File:** `hx-toggle-button.styles.ts`

The tertiary variant's pressed state changes background from `--hx-color-neutral-100` to `--hx-color-neutral-200`. Using typical system token values (`#f1f5f9` → `#e2e8f0`), the contrast between these two states is approximately 1.1:1 — far below the WCAG 3:1 threshold required for non-text visual state indicators (WCAG 1.4.11).

The outline variant pressed state changes background from `transparent` to `--hx-color-neutral-100` and border from `neutral-300` to `neutral-500`. This is marginally better but still subtle.

The pressed state must be distinguishable from unpressed by means other than color alone (WCAG 1.4.1). Consider adding a visual indicator such as an inset box-shadow, a checkmark icon, or a more pronounced background shift.

#### P2-2: Deprecated type alias uses wrong naming prefix

**File:** `hx-toggle-button.ts`, last line

```ts
/** @deprecated Use HelixToggleButton */
export type WcToggleButton = HelixToggleButton;
```

The project prefix is `hx-` / `Helix*`, not `Wc*`. The deprecated alias should be `HxToggleButton` to be consistent with project convention. `WcToggleButton` suggests an old naming scheme that no longer applies.

#### P2-3: `updated()` uses raw `Map` type instead of Lit's `PropertyValues`

**File:** `hx-toggle-button.ts`, line ~96

```ts
override updated(changedProperties: Map<string | number | symbol, unknown>): void {
```

Lit exports `PropertyValues` as a type alias for `ReadonlyMap<PropertyKey, unknown>`. Using it directly provides better semantics and aligns with Lit conventions. Minor but violates the project's TypeScript-strict quality standard.

#### P2-4: No icon-only story in Storybook

**File:** `hx-toggle-button.stories.ts`

There is no dedicated `IconOnly` story demonstrating a toggle button with only a prefix slot icon and no label text (the most challenging accessibility case). The feature audit spec explicitly calls for an "icon-only" story. The `ViewModeToggle` healthcare scenario uses icon+text buttons, not icon-only.

#### P2-5: Toggle group context — no coordination mechanism or ARIA guidance documented

The stories use `role="group"` and `role="toolbar"` as wrapper containers for multi-button scenarios, but the component itself has no group coordination: independent `hx-toggle-button` elements do not communicate with siblings to enforce single-selection semantics. There is no `hx-toggle-button-group` component or documented pattern for enforcing radio-like exclusive selection.

This is a missing capability rather than a bug, but it leaves consumers guessing how to implement exclusive toggle groups (e.g., "Grid View" vs "List View" where only one should be active). The current stories show both buttons independently togglable, which is semantically incorrect for a view-mode switcher where exactly one must always be active.

#### P2-6: `size` property uses `hx-size` attribute — non-standard, undocumented inconsistency

**File:** `hx-toggle-button.ts`, line ~72

```ts
@property({ type: String, reflect: true, attribute: 'hx-size' })
size: 'sm' | 'md' | 'lg' = 'md';
```

The `hx-size` attribute name is inconsistent with how other components in the library expose their `size` property (which use `size` attribute directly). While this avoids collision with HTML's `size` attribute, the divergence is not documented in the component's JSDoc or CEM, making it a surprise for consumers who expect `size="md"` to work like it does on other components.

---

## Summary Table

| ID | Severity | Area | Description |
|----|----------|------|-------------|
| P0-1 | **P0** | CSS | Double opacity on disabled: 0.5 × 0.5 = 0.25 effective opacity |
| P1-1 | P1 | Tests | Keyboard tests call `btn.click()` — keydown dispatch is not tested |
| P1-2 | P1 | Accessibility | Icon-only usage has no accessible name forwarding to inner `<button>` |
| P1-3 | P1 | Tests | `formStateRestoreCallback` untested; implementation may use wrong state key |
| P1-4 | P1 | Drupal | No Twig template or Drupal integration guidance — **FIXED** |
| P2-1 | P2 | CSS / A11y | Tertiary/outline pressed states may not meet WCAG 3:1 non-text contrast |
| P2-2 | P2 | TypeScript | Deprecated alias `WcToggleButton` should be `HxToggleButton` |
| P2-3 | P2 | TypeScript | `updated()` should use Lit's `PropertyValues` type |
| P2-4 | P2 | Storybook | Missing icon-only story |
| P2-5 | P2 | Architecture | No toggle group coordination mechanism or exclusive-select pattern |
| P2-6 | P2 | API | `hx-size` attribute diverges from library convention; undocumented |

---

## CSS Audit Fixes Applied (2026-03-12)

| Finding | Status |
|---------|--------|
| P0-1: Double opacity on disabled state (0.5 × 0.5 = 0.25) | **FIXED** — `opacity` removed from `.button[disabled]`; only `:host([disabled])` applies `opacity: var(--hx-opacity-disabled, 0.5)` |

---

## What Passes

- `aria-pressed` correctly uses `"true"` / `"false"` strings (not `aria-checked`)
- `aria-pressed` updates reactively on programmatic `pressed` property change
- ElementInternals form association: `formAssociated`, `formResetCallback`, `setFormValue`
- FormData correctly includes/excludes value based on pressed state
- Native `<button>` with `type="button"` — correct for non-submit toggle
- All `--hx-*` custom properties; no hardcoded values
- `@media (prefers-reduced-motion: reduce)` disables transitions
- Five visual variants with distinct pressed states for each
- CSS parts: `button`, `label`, `prefix`, `suffix`
- `hx-toggle` event: `bubbles: true`, `composed: true`, correct detail shape
- Event not dispatched when disabled
- axe-core passes for default, pressed, disabled, all variants, all sizes
- `formResetCallback` sets `pressed = false` (tested)
- Storybook: controls for all public properties, healthcare scenario stories
