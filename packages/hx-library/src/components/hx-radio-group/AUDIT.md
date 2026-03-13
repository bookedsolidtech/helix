# AUDIT: hx-radio-group (T1-11)

**Date:** 2026-03-05
**Auditor:** Antagonistic Quality Review Agent
**Scope:** `packages/hx-library/src/components/hx-radio-group/`
**Files reviewed:**

- `hx-radio-group.ts`
- `hx-radio.ts`
- `hx-radio-group.styles.ts`
- `hx-radio.styles.ts`
- `hx-radio-group.test.ts`
- `hx-radio.test.ts`
- `hx-radio-group.stories.ts`

---

## P0 — Critical (Blocking)

### P0-1: Focus ring CSS is dead — keyboard navigation has no visual indicator

**File:** `hx-radio.styles.ts:89–93`

```css
.radio__input:focus-visible ~ .radio__control {
  outline: ...;
}
```

The focus ring targets `.radio__input:focus-visible`. The native `<input>` has `tabindex="-1"` and `aria-hidden="true"` — it never receives focus. Focus is managed on the `hx-radio` host element (via `tabIndex` set by the group in `_syncRadios()`). When the host receives focus via keyboard navigation, neither the host nor the input gets `:focus-visible`, so the outline never renders.

**Impact:** WCAG 2.1 SC 2.4.7 (Focus Visible) violation. Keyboard users have no visual indication of which radio has focus. The axe-core tests pass only because axe does not catch this CSS-specificity issue.

**Fix needed:** Replace with `:host(:focus-visible) .radio__control { ... }` or delegate focus to the input and remove `tabindex="-1"` from it.

---

### P0-2: Space key does not select the focused radio

**File:** `hx-radio.ts:86–103`, `hx-radio-group.ts:231`

`hx-radio._handleClick()` only listens to `click` events. The group's `_handleKeydown` only handles `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`. Space key is not handled anywhere.

Custom elements with `tabIndex` do **not** receive synthetic click events from Space the way native `<button>` elements do. Pressing Space on a focused `hx-radio` does nothing.

**Impact:** WCAG 2.1 SC 2.1.1 (Keyboard) violation. APG radio group pattern requires Space to select the focused radio. The test suite has no Space key test.

**Fix needed:** Add `Space` to the group's `_handleKeydown` to dispatch `hx-radio-select` on the currently focused radio.

---

### P0-3: Required validation is not initialized on first render

**File:** `hx-radio-group.ts:136–146`

`_updateValidity()` is called inside `updated()` only when `changedProperties.has('value')`. On initial render, if `value` is `''` (the property default) and the attribute is not set, Lit does not include `value` in `changedProperties` for the first update cycle. This means `_internals.setValidity()` is never called on first render.

A `required` radio group with no initial selection passes `checkValidity()` as `true` until any interaction triggers an update.

**Reproduction:**

```html
<hx-radio-group required name="x">
  <hx-radio value="a" label="A"></hx-radio>
</hx-radio-group>
```

```js
el.checkValidity(); // true — incorrect, should be false
```

**Impact:** Forms can be submitted with a required empty radio group if JS calls `checkValidity()` before any user interaction. The test at line 499 passes only because the test framework triggers an update cycle after `fixture()` that happens to include the `required` flag change.

**Fix needed:** Also call `_updateValidity()` inside `firstUpdated()`.

---

## P1 — High (Must Fix Before Merge)

### P1-1: Group re-enable after disable permanently disables all child radios

**File:** `hx-radio-group.ts:176–178`

```ts
if (this.disabled) {
  radio.disabled = true;
}
```

When the group is disabled, all child radios have their `disabled` property forcibly set to `true`. When the group is re-enabled (setting `this.disabled = false`), `_syncRadios()` only skips the `if (this.disabled)` block — it never restores child radios to `disabled = false`. Any radio that was individually enabled before the group was disabled becomes permanently disabled.

**Test coverage:** The existing disabled tests (lines 578–619) only test one-way disable propagation. There is no test for toggle (disable → re-enable).

**Fix needed:** When `this.disabled` becomes `false`, reset each radio's `disabled` to its original/individual state, or store original `disabled` values before overriding.

---

### P1-2: `formStateRestoreCallback` has wrong signature

**File:** `hx-radio-group.ts:315–317`

```ts
formStateRestoreCallback(state: string): void {
  this.value = state;
}
```

The HTML spec for `ElementInternals` defines the signature as:

```ts
formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete'): void
```

The current implementation:

1. Is missing the `mode` parameter entirely.
2. Types `state` as `string` only — if the browser passes a `File` or `FormData`, `this.value = state` will assign a non-string to a string property.

This is a TypeScript strict mode violation (implicit `any`-like narrowing) and a spec non-conformance.

---

### P1-3: `_groupEl` non-null assertion violates engineering standards

**File:** `hx-radio-group.ts:104–105`

```ts
@query('.fieldset__group')
private _groupEl!: HTMLElement;
```

The `!` non-null assertion is explicitly prohibited by the engineering standards: "No `any` types" / "TypeScript strict mode is not a suggestion." The `!` assertion suppresses a legitimate null check. `_updateValidity()` at line 300 passes `this._groupEl ?? undefined` — acknowledging it can be null — but the type says it cannot be.

---

### P1-4: `_hasErrorSlot` state variable is dead code

**File:** `hx-radio-group.ts:107`, `hx-radio-group.ts:117–120`

```ts
@state() private _hasErrorSlot = false;

private _handleErrorSlotChange(e: Event): void {
  const slot = e.target as HTMLSlotElement;
  this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
}
```

`_hasErrorSlot` is set in the slot change handler but is **never read** in `render()` or anywhere else. The render template uses `!!this.error` to determine whether to show an error, completely ignoring whether the error slot has content. This state is maintained and causes unnecessary re-renders but has no effect.

Additionally: when a consumer provides slotted error content, the `aria-describedby` on the fieldset still points to `this._errorId` (the default slot's div), but that div is hidden because the named slot content replaces it. The `aria-describedby` ID reference becomes dangling.

---

### P1-5: `aria-required` is not communicated to assistive technology

**File:** `hx-radio-group.ts:333–338`

The `required` attribute is visually indicated via an asterisk marker (`fieldset__required-marker`). The `<fieldset role="radiogroup">` does not have `aria-required="true"` when `required` is set.

Screen readers announce the asterisk character but do not consistently announce it as a "required" indicator. The `role="radiogroup"` supports `aria-required`. Without it, blind users may not know the field is required before attempting form submission.

---

### P1-6: `aria-labelledby` not set on `role="radiogroup"` in Shadow DOM

**File:** `hx-radio-group.ts:334–349`

The `<fieldset role="radiogroup">` relies on its `<legend>` child for accessible naming. Native `<fieldset>` + `<legend>` provides accessible grouping, but `role="radiogroup"` overrides the native fieldset semantics. Browser support for accessible name computation from `<legend>` when `role="radiogroup"` is applied to a `<fieldset>` is inconsistent — some AT implementations use the legend, others do not.

The `_groupId` is generated but never applied to the legend element. There is no `aria-labelledby` on the fieldset pointing to the legend's ID.

**Safer approach:** Assign `id="${this._groupId}-legend"` to the `<legend>` and `aria-labelledby="${this._groupId}-legend"` to the fieldset.

---

### P1-7: No `Home` / `End` keyboard support

**File:** `hx-radio-group.ts:231–260`

The ARIA Authoring Practices Guide (APG) for radio groups specifies:

- `Home` → move focus to and select first radio
- `End` → move focus to and select last radio

Only Arrow keys are handled. This is expected behavior that AT users and power keyboard users will look for.

---

## P2 — Medium (Should Fix)

### P2-1: `setFormValue` called twice per selection

**File:** `hx-radio-group.ts:199–223`

In `_handleRadioSelect`:

```ts
this.value = newValue; // triggers updated() → setFormValue()
this._internals.setFormValue(this.value); // redundant second call
this._syncRadios(); // also called by updated()
this._updateValidity(); // also called by updated()
```

After `this.value = newValue`, the Lit reactive system queues an update. `updated()` runs and calls `setFormValue`, `_syncRadios`, and `_updateValidity`. Then `_handleRadioSelect` immediately calls all three again synchronously. Each selection triggers double work.

---

### ~~P2-2: `Math.random()` IDs break SSR / Drupal hydration~~ ✅ FIXED

**Fix applied:** `_groupId` now uses a monotonically incrementing module-level counter (`++_groupCounter`) instead of `Math.random()`. IDs are deterministic within a page session and do not cause `aria-describedby` reference mismatches between Drupal server-rendered markup and client hydration.

---

### P2-3: `role="radio"` set imperatively instead of declaratively

**File:** `hx-radio.ts:63–68`

```ts
override connectedCallback(): void {
  super.connectedCallback();
  this.setAttribute('role', 'radio');
  this.setAttribute('aria-checked', String(this.checked));
  this.setAttribute('aria-disabled', String(this.disabled));
}
```

Setting `role` in `connectedCallback` rather than as a static attribute means there is a brief window (before `connectedCallback`) where the element has no role — problematic for static analysis tools and Drupal's pre-render. `role` is also not in the CEM declaration, so it won't appear in Storybook autodocs or IDE tooling.

**Fix:** Use `static properties` internals or the element's default ARIA role via `ElementInternals.role` (which Lit's `@property` mechanism cannot set, but `attachInternals().role` can in `constructor()`).

---

### P2-4: `role="alert"` and `aria-live="polite"` conflict on error element

**File:** `hx-radio-group.ts:357–363`

```html
<div role="alert" aria-live="polite"></div>
```

`role="alert"` implicitly sets `aria-live="assertive"` and `aria-atomic="true"`. Explicitly adding `aria-live="polite"` contradicts the implicit value. Browser behavior when both are present varies by AT. Choose one: use `role="alert"` alone (assertive, immediate announcement) or use `role="status"` with `aria-live="polite"` for less urgent messages. For form validation errors, `role="alert"` (assertive) is typically correct.

---

### P2-5: Focus ring missing for individually disabled radios in enabled group

**File:** `hx-radio.styles.ts:8–11`

```css
:host([disabled]) {
  opacity: var(--hx-opacity-disabled, 0.5);
  pointer-events: none;
}
```

`pointer-events: none` prevents mouse interaction but does not prevent focus via Tab (if tabIndex were 0). The group correctly sets disabled radios to `tabIndex = -1`, preventing Tab focus. However, if a consumer manually sets `tabIndex` on a disabled radio, there is no visual differentiation between a disabled-but-focused element and an enabled-but-focused element (since the focus ring is already broken per P0-1).

---

### P2-6: No `selected-value` attribute alias documented or implemented

**File:** `hx-radio-group.ts:52–53`

The feature spec mentions "selected-value typing." Common radio group APIs (Shoelace `sl-radio-group`, Material Web `md-radio-group`) expose both `value` and sometimes `selectedValue` for clarity. This component only exposes `value`. This is a naming convention gap — not a bug, but worth documenting for API completeness.

---

### P2-7: Storybook missing individual-radio-disabled story

**File:** `hx-radio-group.stories.ts`

Stories cover:

- Group-level `disabled`
- Required state
- Error state
- Horizontal/vertical orientation

There is no dedicated story for a mixed state (one radio disabled within an enabled group), which is a valid and distinct state that Drupal consumers will use.

---

### P2-8: `hx-radio` axe test runs standalone without parent group ✅ FIXED

**Resolution:** Updated the axe test in `hx-radio.test.ts` to wrap `hx-radio` elements inside a parent `hx-radio-group` with a label, providing proper context for accessibility validation.

**File:** `hx-radio.test.ts:139–145`

```ts
it('has no axe violations in default state', async () => {
  const el = await fixture<WcRadio>('<hx-radio value="a" label="Option A"></hx-radio>');
  const { violations } = await checkA11y(el);
```

`hx-radio` sets `role="radio"` on the host. Per APG, a standalone `role="radio"` without a parent `role="radiogroup"` is an orphaned radio — axe may flag this or screen readers may behave unexpectedly. The axe test passes because `nested-interactive` is not disabled here, but the orphaned-role concern is not tested. This test gives a false confidence signal.

---

## Summary Table

| ID   | Severity | Area            | Description                                                    |
| ---- | -------- | --------------- | -------------------------------------------------------------- |
| P0-1 | P0       | Accessibility   | Focus ring CSS targets hidden input — never visible            |
| P0-2 | P0       | Accessibility   | Space key does not select radio (`role="radio"` breach)        |
| P0-3 | P0       | Form/Validation | Required validity not initialized on first render              |
| P1-1 | P1       | Behavior        | ~~Re-enabling disabled group leaves radios permanently off~~ ✅ FIXED — `_individualDisabledStates` map restores per-radio state |
| P1-2 | P1       | TypeScript      | `formStateRestoreCallback` wrong spec signature                |
| P1-3 | P1       | TypeScript      | `_groupEl!` non-null assertion violates standards              |
| P1-4 | P1       | Accessibility   | `_hasErrorSlot` dead code + dangling `aria-describedby`        |
| P1-5 | P1       | Accessibility   | No `aria-required` on radiogroup                               |
| P1-6 | P1       | Accessibility   | No `aria-labelledby` — legend naming unreliable in SDOM        |
| P1-7 | P1       | Accessibility   | Missing `Home`/`End` keyboard support (APG requirement)        |
| P2-1 | P2       | Performance     | Double `setFormValue`/`_syncRadios`/`_updateValidity`          |
| P2-2 | P2       | Drupal/SSR      | ~~`Math.random()` IDs break server/client hydration~~ ✅ FIXED — monotonic counter used |
| P2-3 | P2       | TypeScript/A11y | `role` set imperatively, not in CEM, no static default         |
| P2-4 | P2       | Accessibility   | `role="alert"` + `aria-live="polite"` conflict                 |
| P2-5 | P2       | Accessibility   | Disabled focus ring state gap (follow-on to P0-1)              |
| P2-6 | P2       | API             | No `selected-value` alias (naming gap vs other libraries)      |
| P2-7 | P2       | Storybook       | No mixed-disabled story (partial disable state)                |
| P2-8 | P2       | Testing         | `hx-radio` axe test runs orphaned — misleading signal ✅ FIXED |

**Total findings: 3 P0, 7 P1, 8 P2**

The component is **not shippable** in its current state. The three P0 items (invisible keyboard focus, Space key inoperability, uninitialized required validation) are WCAG 2.1 AA violations and form correctness failures. All must be resolved before merge.

---

## CSS Audit Fixes Applied (2026-03-12)

| Finding                                                    | Fix Applied                                                                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Missing `prefers-reduced-motion` on `hx-radio` transitions | Added `@media (prefers-reduced-motion: reduce)` block disabling `.radio__control` and `.radio__dot` transitions in `hx-radio.styles.ts`                                  |
| Missing component-level help text color token              | Added `--hx-radio-group-help-text-color` CSS custom property to `.fieldset__help-text` in `hx-radio-group.styles.ts` and `@cssprop` documentation in `hx-radio-group.ts` |
