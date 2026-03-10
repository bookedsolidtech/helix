# hx-checkbox — Antagonistic Quality Audit (T1-09)

**Auditor:** Agent (feature-audit-hx-checkbox-t1-09-antagonistic)
**Date:** 2026-03-05
**Files reviewed:**
- `hx-checkbox.ts`
- `hx-checkbox.styles.ts`
- `hx-checkbox.test.ts`
- `hx-checkbox.stories.ts`
- `index.ts`

**Summary:** 2 P0, 10 P1, 15 P2 findings. The component is generally well-structured but has critical accessibility contract violations when using the `error` slot and the `NoLabel` pattern. Several token-architecture violations, a mistyped form callback signature, and missing test coverage in indeterminate and slot scenarios.

---

## P0 — Critical (blocks production use)

---

### P0-01 · `aria-describedby` breaks when using the `error` named slot

**File:** `hx-checkbox.ts:262-268, 317-328`

**What the code does:**
When `_hasErrorSlot` is true (error slot has content), `hasError` is true, so `_errorId` is added to `aria-describedby`. The `_errorId` is the `id` of the *fallback* div inside the `<slot name="error">`:

```html
<slot name="error" @slotchange=${this._handleErrorSlotChange}>
  ${hasError
    ? html`<div part="error" class="checkbox__error" id=${this._errorId} ...>
        ${this.error}
      </div>`
    : nothing}
</slot>
```

When a slot has assigned content, the browser suppresses the fallback content — the fallback div is not rendered into the flat tree. `aria-describedby` on the hidden input then references `_errorId`, which does not exist in the composed/flat tree.

Additionally, Shadow DOM `aria-describedby` cannot reference elements in the light DOM without cross-root ARIA (an emerging spec not yet broadly supported). The slotted error element itself has no `id`, so there is no correct ID to reference anyway.

**Impact:** When a consumer passes custom error content via the `error` slot, screen readers receive no error announcement from the `aria-describedby` attribute. The checkbox appears valid to assistive technology regardless of the error state.

**Evidence:** The only test for `aria-describedby` tests the `error` *property* (`hx-checkbox.test.ts:377-390`), not the `error` *slot*. The slot path is untested.

---

### P0-02 · `NoLabel` pattern (`aria-label` on host) does not produce an accessible name

**File:** `hx-checkbox.stories.ts:628-632`, `hx-checkbox.ts:285`

**What the stories show:**
```html
<hx-checkbox aria-label="Accept terms and conditions" name="accept" value="true"></hx-checkbox>
```

**What actually happens:**
The inner `<input>` has:
```html
aria-labelledby=${this._labelId}
```
This points to an internal `<span class="checkbox__label">` with `id="${_labelId}"`. When no `label` property is set and the default slot is empty, that span contains only whitespace, producing an empty accessible name.

`aria-label` placed on the `hx-checkbox` host element is not forwarded to the inner input. Shadow DOM does not propagate ARIA attributes from the host to slotted or shadow internals automatically. The component must explicitly read and apply `aria-label` / `aria-labelledby` from the host to the native input (via `this.getAttribute('aria-label')` and `ariaLabel` reflected on ElementInternals, or by passing it through the render template).

**Impact:** The `NoLabel` story is demonstrated as a supported pattern in Storybook. In practice it produces a checkbox with no accessible name — WCAG 4.1.2 failure. Any consumer who follows this pattern ships inaccessible UI.

---

## P1 — High (impacts core functionality, a11y, or public API)

---

### P1-01 · `formStateRestoreCallback` has wrong TypeScript signature

**File:** `hx-checkbox.ts:197-199`

```typescript
formStateRestoreCallback(state: string): void {
  this.checked = state === this.value;
}
```

**Correct specification signature:**
```typescript
formStateRestoreCallback(state: string | File | FormData | null, reason: string): void
```

The `state` parameter can be `null` when the browser has no state to restore, or a `File`/`FormData` if the control previously called `setFormValue()` with a non-string. In TypeScript strict mode this typing is incorrect. More critically, if the browser passes `null` (e.g., when back-navigating to a form where the checkbox was unchecked), `null === this.value` evaluates to `false`, which is coincidentally correct — but only by luck. The missing `reason` parameter means the component cannot distinguish between a "restore" and an "autocomplete" call.

---

### P1-02 · `role="alert"` + `aria-live="polite"` is semantically contradictory

**File:** `hx-checkbox.ts:320-327`

```html
<div
  part="error"
  class="checkbox__error"
  id=${this._errorId}
  role="alert"
  aria-live="polite"
>
```

`role="alert"` carries an implicit `aria-live="assertive"` + `aria-atomic="true"`. Explicitly setting `aria-live="polite"` on a `role="alert"` element creates an ARIA conflict. Screen reader behavior is undefined — some ignore the explicit `aria-live` and treat it as assertive, others respect the explicit value. The intended behavior (polite announcement) should use `role="status"` instead of `role="alert"`, or the `aria-live="polite"` should be removed to let the alert role take effect as assertive.

This is an ARIA spec violation and a WCAG 4.1.2 failure for AT users who receive inconsistent behavior across screen readers.

---

### P1-03 · Hover border-color ignores `--hx-checkbox-border-color` token

**File:** `hx-checkbox.styles.ts:107-109`

```css
.checkbox__control:hover .checkbox__box {
  border-color: var(--hx-color-primary-500, #2563eb);
}
```

The unchecked border is correctly tokenized:
```css
border: ... var(--hx-checkbox-border-color, var(--hx-color-neutral-300, #ced4da));
```

But hover overrides it with the raw semantic token `--hx-color-primary-500`, bypassing `--hx-checkbox-border-color`. If a consumer sets `--hx-checkbox-border-color: purple`, the normal state shows purple but hover snaps to blue. This violates the three-tier cascade and breaks consumer customization for the hover state.

The hover state for the error condition (line 115-117) has the same issue — it duplicates `--hx-checkbox-error-color` directly rather than going through the component token.

---

### P1-04 · `hx-size` property entirely absent from Storybook `argTypes`

**File:** `hx-checkbox.stories.ts:14-122`

The component exposes `hxSize: 'sm' | 'md' | 'lg'` as a public property with three distinct size variants (`checkbox--sm`, `checkbox--md`, `checkbox--lg`). None of the Storybook stories include:
- An `hx-size` `argType` control
- A `render` function that passes the size
- A dedicated story for each size variant

The `AllStates` kitchen-sink story (line 242-278) does not demonstrate size variants. Size variants are completely undiscoverable from Storybook.

---

### P1-05 · No axe-core test for indeterminate state

**File:** `hx-checkbox.test.ts:433-464`

The `Accessibility (axe-core)` describe block runs axe for default, checked, error, and disabled states. The indeterminate state is absent. Indeterminate checkboxes have non-trivial ARIA semantics (`aria-checked="mixed"`) and are commonly misconfigured. This is an explicit gap in the accessibility test matrix.

---

### P1-06 · No test verifying `aria-checked="mixed"` in indeterminate state

**File:** `hx-checkbox.test.ts:57-78`

The indeterminate tests verify the CSS class and that toggling clears the property, but never assert that `input.indeterminate === true` on the native element, and never verify the accessible state. The implementation relies on `.indeterminate=${live(this.indeterminate)}` binding the property on the native input, which should expose `aria-checked="mixed"` — but this is untested. A test should assert:

```typescript
const input = shadowQuery<HTMLInputElement>(el, 'input')!;
expect(input.indeterminate).toBe(true);
// AT reads: aria-checked="mixed" via platform accessibility tree
```

---

### P1-07 · Error `slot` has no test coverage

**File:** `hx-checkbox.test.ts:258-278`

The `Slots` describe block tests the default slot and the `help-text` slot but does **not** test the `error` named slot. Given the P0-01 finding (aria-describedby breaks with slotted error), this gap means the broken behavior has zero test coverage and would go undetected in CI.

---

### P1-08 · `render` function passes empty-string attributes unconditionally

**File:** `hx-checkbox.stories.ts:109-121`

```typescript
render: (args) => html`
  <hx-checkbox
    ...
    error=${args.error}
    help-text=${args.helpText}
    ...
  ></hx-checkbox>
`,
```

When `args.error` is `''` (the default), this renders `error=""` on the element. `!!this.error` evaluates to `false` for an empty string, so no error state is triggered — this happens to work. However, `help-text=""` behaves the same way. These should use `ifDefined` or a conditional to avoid setting the attribute at all when empty. The current approach is fragile: changing the truthiness check in the component breaks all stories silently.

---

### P1-09 · `indeterminate` property does not reflect to attribute

**File:** `hx-checkbox.ts:66-67`

```typescript
@property({ type: Boolean })
indeterminate = false;
```

`checked` and `disabled` both have `reflect: true`, enabling CSS selectors like `:host([checked])`. `indeterminate` has no `reflect: true`. This inconsistency means:
- Consumers cannot use CSS selectors targeting `[indeterminate]` on the host element for external styling
- `_hasErrorSlot`-like detection from outside the shadow DOM is impossible for indeterminate
- Drupal CSS that wants to style `:host([indeterminate])` will not work

---

### P1-10 · No test for `label` click activating checkbox (only `.checkbox__control` click is tested)

**File:** `hx-checkbox.test.ts` (all click-based tests)

Every test that simulates a click accesses `shadowQuery(el, '.checkbox__control')!` directly. No test clicks the label text or a slotted element to verify that the click event bubbles correctly through the label to `_handleChange`. This matters because the label's `@click` handler is the primary toggle mechanism, not a button or the native input.

---

## P2 — Medium (code quality, token architecture, maintainability)

---

### P2-01 · Deprecated `WcCheckbox` type alias used throughout tests

**File:** `hx-checkbox.test.ts:3`

```typescript
import type { WcCheckbox } from './hx-checkbox.js';
```

The component marks this as `@deprecated Use HelixCheckbox instead.` but the test file imports and uses `WcCheckbox` in every fixture call. The tests themselves enforce the deprecated API surface.

---

### P2-02 · Missing `--hx-checkbox-bg` component-level token (unchecked background)

**File:** `hx-checkbox.styles.ts:63`

```css
background-color: var(--hx-color-neutral-0, #ffffff);
```

The unchecked background skips the component token tier, going directly from component CSS to a primitive/semantic token. Per the three-tier cascade, this should be:
```css
background-color: var(--hx-checkbox-bg, var(--hx-color-neutral-0, #ffffff));
```
The `@cssprop` JSDoc in the component file also does not document this token.

---

### P2-03 · Help text color not using a component-level token

**File:** `hx-checkbox.styles.ts:160`

```css
color: var(--hx-color-neutral-500, #6c757d);
```

Same tier-skip as P2-02. Should be:
```css
color: var(--hx-checkbox-help-text-color, var(--hx-color-neutral-500, #6c757d));
```

---

### P2-04 · `tabindex="0"` on native `<input>` is redundant

**File:** `hx-checkbox.ts:287`

```html
tabindex="0"
```

Native `<input type="checkbox">` elements are naturally focusable with `tabindex` in the tab order by default. Setting `tabindex="0"` explicitly is redundant and adds noise to the template. It could also interfere with `tabindex="-1"` if programmatic focus management is added later.

---

### P2-05 · `Math.random()` for ID generation — no collision protection

**File:** `hx-checkbox.ts:242`

```typescript
private _id = `hx-checkbox-${Math.random().toString(36).slice(2, 9)}`;
```

`Math.random()` with 7 base-36 characters gives ~78 billion possible values. In a page with many checkboxes (e.g., a large data table), the probability of collision is non-zero. The standard pattern is a monotonic module-level counter:

```typescript
let _counter = 0;
// in class:
private _id = `hx-checkbox-${++_counter}`;
```

This is deterministic, collision-free, SSR-safe, and simpler.

---

### P2-06 · `describedBy` computation has redundant condition

**File:** `hx-checkbox.ts:262-268`

```typescript
const describedBy =
  [
    hasError || this._hasErrorSlot ? this._errorId : null,
    this.helpText && !hasError ? this._helpTextId : null,
  ]
```

`hasError` is already `!!this.error || this._hasErrorSlot` (line 248). The first array entry condition `hasError || this._hasErrorSlot` is equivalent to `hasError || (hasError)` which is just `hasError`. The `this._hasErrorSlot` is already folded into `hasError`. The redundant condition obscures intent.

---

### P2-07 · No test for `hx-size` attribute/property

**File:** `hx-checkbox.test.ts`

There are no tests verifying:
- That `hx-size="sm"` applies `checkbox--sm` class
- That `hx-size="lg"` applies `checkbox--lg` class
- That size changes are reflected to host attribute

The size system is completely untested.

---

### P2-08 · No test for `formStateRestoreCallback` with null state

**File:** `hx-checkbox.test.ts:331-336`

The existing test only passes a matching string value. Per the spec (and the P1-01 finding), `state` can be `null`. There is no test for:
```typescript
el.formStateRestoreCallback(null); // should set checked = false
```

---

### P2-09 · `clip: rect(0, 0, 0, 0)` is outdated visually-hidden technique

**File:** `hx-checkbox.styles.ts:44`

```css
clip: rect(0, 0, 0, 0);
```

The `clip` property is deprecated. The modern equivalent is `clip-path: inset(50%)`. Additionally, the current visually-hidden implementation is missing `overflow: hidden` on the `width: 1px; height: 1px` element, which is required to prevent the 1px remnant from scrolling content. (The existing code does have `overflow: hidden` at line 43, so this is only the `clip` deprecation.)

---

### P2-10 · `hx-size` attribute prefix may conflict with htmx in Drupal

**File:** `hx-checkbox.ts:122`

```typescript
@property({ type: String, attribute: 'hx-size', reflect: true })
hxSize: 'sm' | 'md' | 'lg' = 'md';
```

In Drupal projects that use htmx (a common pairing), all `hx-*` attributes are processed by htmx's mutation observer. The `hx-size` attribute would be interpreted as an htmx directive, potentially causing unexpected htmx behavior. The `hx-*` attribute namespace is effectively reserved by htmx. The attribute should be documented with this caveats or renamed.

---

### P2-11 · `NoLabel` story has no play function to verify accessible name

**File:** `hx-checkbox.stories.ts:628-632`

The `NoLabel` story (which has a P0 bug) has no play function. A play function that runs axe would catch the missing accessible name immediately. All accessibility-sensitive stories should include an axe assertion in their play function.

---

### P2-12 · `CSSCustomProperties` story demonstrates `--hx-checkbox-bg` that doesn't exist

**File:** `hx-checkbox.stories.ts` (implicit via AllStates)

Relatedly, the `CSSCustomProperties` story doesn't demonstrate `--hx-checkbox-bg` because the token doesn't exist (P2-02). The Storybook documentation omits unchecked background as a customizable token, creating a gap between what the design token architecture promises and what the component actually exposes.

---

### P2-13 · `_handleErrorSlotChange` does not force re-render if `hasError` state changes

**File:** `hx-checkbox.ts:132-135`

```typescript
private _handleErrorSlotChange(e: Event): void {
  const slot = e.target as HTMLSlotElement;
  this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
}
```

`_hasErrorSlot` is decorated with `@state()` so Lit will re-render on change. This works. However, the `_errorId` referenced in `aria-describedby` is computed at construction time. If the slot error content is added dynamically after initial render, `aria-describedby` will only be set correctly after the re-render triggered by `_hasErrorSlot` change — and then it still points to the wrong element (per P0-01). This is a secondary consequence of P0-01, not a separate bug, but worth noting here for fix context.

---

### P2-14 · Missing `checkmark` CSS part

**File:** `hx-checkbox.ts` (no such part), `hx-checkbox.styles.ts`

The audit spec and design documentation reference `CSS parts (checkbox, label, checkmark)`. The component exposes `checkbox`, `label`, `control`, `help-text`, and `error` parts. There is no `checkmark` part exposing the SVG icon element. Consumers cannot style the checkmark stroke/fill independently of the checkbox background via `::part(checkmark)`.

The SVG is inside `<span part="checkbox">`, so it's grouped with the border/background. Separating it would require adding `part="checkmark"` to the SVG or its wrapper.

---

### P2-15 · `SelectAllPattern` and `PatientConsentChecklist` stories use inline event handlers with DOM traversal anti-pattern

**File:** `hx-checkbox.stories.ts:404-490, 1058-1177`

The "Select All" pattern stories use `target.closest('div')` and `querySelectorAll` to find sibling/parent checkboxes. This approach:
- Relies on DOM structure being stable (fragile)
- Uses type casts to bypass TypeScript (`as HTMLElement & { checked: boolean; indeterminate: boolean }`) instead of the proper `HelixCheckbox` type
- Sets `child.checked = parent.checked` directly on the element as a property mutation, which does NOT fire `hx-change` events (only programmatic state change)

For a healthcare consent pattern, the last point means downstream listeners on child `hx-change` events would not fire when the "Select All" parent is clicked — silently breaking integrations that rely on events for form state management.

---

## Summary Table

| ID | Area | Severity | Description |
|----|------|----------|-------------|
| P0-01 | Accessibility | P0 | `aria-describedby` broken for `error` slot |
| P0-02 | Accessibility | P0 | `NoLabel` pattern fails — `aria-label` on host not forwarded |
| P1-01 | TypeScript | P1 | `formStateRestoreCallback` wrong signature |
| P1-02 | Accessibility | P1 | `role="alert"` + `aria-live="polite"` contradiction |
| P1-03 | CSS | P1 | Hover border-color ignores `--hx-checkbox-border-color` token |
| P1-04 | Storybook | P1 | `hx-size` missing from `argTypes` and all stories |
| P1-05 | Tests | P1 | No axe-core test for indeterminate state |
| P1-06 | Tests | P1 | No test for `aria-checked="mixed"` in indeterminate |
| P1-07 | Tests | P1 | Error slot has no test coverage |
| P1-08 | Storybook | P1 | Render function passes empty-string attributes unconditionally |
| P1-09 | TypeScript | P1 | `indeterminate` missing `reflect: true` |
| P1-10 | Tests | P1 | No test clicking label text (only `.checkbox__control`) |
| P2-01 | Tests | P2 | Tests use deprecated `WcCheckbox` type |
| P2-02 | CSS/Tokens | P2 | Missing `--hx-checkbox-bg` component token |
| P2-03 | CSS/Tokens | P2 | Help text color missing component token |
| P2-04 | HTML | P2 | `tabindex="0"` redundant on native input |
| P2-05 | TypeScript | P2 | `Math.random()` for ID — use monotonic counter |
| P2-06 | TypeScript | P2 | Redundant condition in `describedBy` computation |
| P2-07 | Tests | P2 | No tests for `hx-size` variants |
| P2-08 | Tests | P2 | No test for `formStateRestoreCallback(null)` |
| P2-09 | CSS | P2 | `clip: rect(0,0,0,0)` is deprecated |
| P2-10 | Drupal | P2 | `hx-size` attribute name may conflict with htmx |
| P2-11 | Storybook | P2 | `NoLabel` story has no play/axe function |
| P2-12 | Storybook | P2 | `--hx-checkbox-bg` token absent, undocumented |
| P2-13 | TypeScript | P2 | `_hasErrorSlot` re-render doesn't fix P0-01 |
| P2-14 | API | P2 | Missing `checkmark` CSS part |
| P2-15 | Storybook | P2 | Select-All stories don't propagate `hx-change` on child checkboxes |
