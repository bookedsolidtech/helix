# AUDIT: hx-select — T1-08 Antagonistic Quality Review

**Reviewer:** Automated Audit Agent
**Date:** 2026-03-05
**Component:** `hx-select` (packages/hx-library/src/components/hx-select/)
**Audit Type:** Deep antagonistic — T1-08 (6/6 libraries, critical healthcare form control)

---

## Executive Summary

`hx-select` is architecturally ambitious: a fully custom combobox listbox layered over a hidden native `<select>` for form participation. The implementation is substantially complete — form association, ElementInternals, keyboard navigation, and aria-activedescendant are all present. However, the audit surfaces **2 P0 defects** that break core functionality (optgroup form submission; contradictory ARIA live attributes), **7 P1 defects** that impair accessibility or correctness for screen reader users, and **11 P2 items** covering gaps in test coverage, missing features, and minor code quality issues. No component at this tier should ship with any P0 or P1 open.

---

## P0 — Critical / Blocking

### P0-01: `_syncClonedOptions()` silently drops `<optgroup>` children from the native select ✅ FIXED

**File:** `hx-select.ts:300-320`

```ts
const slottedOptions = slot
  .assignedElements({ flatten: true })
  .filter((el): el is HTMLOptionElement => el instanceof HTMLOptionElement);
```

This filter only captures top-level `<option>` elements. `<optgroup>` children are entirely skipped. By contrast, `_readOptions()` (line 281-289) correctly walks `HTMLOptGroupElement` children when building `this._options`, so the custom listbox renders optgroup options correctly — but the hidden native `<select>` never receives them.

**Impact:** When a user submits a form with grouped options (e.g., `<optgroup label="Region"><option value="us">US</option></optgroup>`), the native `<select>` has no matching option. Form submission sends nothing (or the placeholder default). This is a silent data loss defect in a healthcare form control.

**Drupal impact:** Drupal Twig templates using `<optgroup>` are a standard HTML pattern. They will silently fail to participate in form submission.

**Reproduction:**

```html
<hx-select name="country">
  <optgroup label="North America">
    <option value="us">United States</option>
    <option value="ca">Canada</option>
  </optgroup>
</hx-select>
```

Form submits with `country=` (empty) regardless of selection.

**Resolution:** The separate `_syncClonedOptions()` and `_readOptions()` methods have been unified into a single `_handleSlotChange()` that processes `slot.assignedElements({ flatten: true })` in one pass, correctly cloning both top-level `<option>` elements and `<optgroup>` children into the native `<select>`. Drupal Twig templates using `<optgroup>` now participate in form submission correctly.

---

### P0-02: Error div uses `role="alert"` (assertive) AND `aria-live="polite"` simultaneously ✅ FIXED

**File:** `hx-select.ts:615-621`

```html
<div part="error" class="field__error" id="${this._errorId}" role="alert" aria-live="polite"></div>
```

`role="alert"` implies `aria-live="assertive"` per the ARIA spec. Explicitly overriding it with `aria-live="polite"` creates contradictory instructions. AT behavior is undefined — some screen readers honor the explicit attribute (polite), others honor the implicit role semantics (assertive), and some may double-announce.

For a healthcare error message this is unacceptable: the user must always receive a clear, predictable announcement. Either use `role="alert"` alone (assertive — correct for errors) or use `aria-live="polite"` alone (no role="alert"). Do not mix them.

**Resolution:** The error div now uses only `role="alert"` without the redundant `aria-live="polite"` override. The element renders as `<div part="error" class="field__error" id="${this._errorId}" role="alert">`, providing unambiguous assertive announcement semantics for healthcare error messages.

---

## P1 — High Severity

### P1-01: `role="combobox"` applied to a native `<button>` element

**File:** `hx-select.ts:552-574`

```html
<button ... role="combobox" aria-haspopup="listbox" aria-controls="${this._listboxId}" ...></button>
```

The ARIA 1.2 combobox pattern (select-only variant) is designed for a `div` or similar non-interactive container, not a native `<button>`. Assigning `role="combobox"` to a `<button>` overrides its implicit native role. Consequences:

- NVDA/JAWS may still announce it as a "button" based on the element type, leading to inconsistent AT output across browsers.
- The APG select-only combobox example uses a `<div tabindex="0">`, precisely to avoid native role conflicts.
- iOS VoiceOver behavior with `role="combobox"` on `<button>` is known to be inconsistent.

This is a healthcare-grade accessibility concern. The interactive element should be a `div[tabindex="0"]` with `role="combobox"`, not a `<button>`.

---

### P1-02: No typeahead keyboard support

**File:** `hx-select.ts:346-421` (keyboard handler)

The keyboard handler covers ArrowDown, ArrowUp, Home, End, Enter, Space, and Escape. It does not implement typeahead — the standard behavior where pressing a letter key jumps focus to the first matching option.

The ARIA Authoring Practices Guide (APG) combobox select-only pattern and native `<select>` behavior both provide typeahead. Users who rely on keyboard navigation (including screen reader users) will find this component significantly slower to operate than a native select when option lists are long. In a healthcare context (e.g., selecting a diagnosis code, a provider name, or a state) with 50+ options, this is a material accessibility regression from native behavior.

---

### P1-03: `outline: none` on trigger with no guaranteed fallback

**File:** `hx-select.styles.ts:73`

```css
.field__trigger {
  ...
  outline: none;
}
```

The focus ring is restored via `:focus-visible` (line 76). However, `outline: none` is applied unconditionally. If `:focus-visible` fails to match for any reason (e.g., AT-forced keyboard focus modes that don't set the `focus-visible` state, certain browser versions, or Windows High Contrast mode fallback), there is zero visible focus indicator on the trigger.

WCAG 2.1 SC 2.4.7 (Level AA) requires a visible keyboard focus indicator. A component that removes the default outline without a universally-matching replacement is non-compliant.

Recommended: use `:focus-visible` as enhancement only — do not suppress `:focus` outline entirely, or at minimum add a `:focus` style that is overridden by `:focus-visible`.

---

### P1-04: Tab key not handled — dropdown remains open on Tab

**File:** `hx-select.ts:346-421` (keyboard handler)

The `_handleKeydown` switch does not include a `Tab` case. When the dropdown is open, pressing Tab moves focus to the next element in the document while leaving the dropdown in its `open=true` state. The listbox remains visually rendered and `aria-expanded="true"` remains set on the trigger.

Expected behavior (per APG and native `<select>`): Tab while the dropdown is open should close the dropdown AND move focus to the next focusable element.

This is particularly problematic in forms with multiple fields — a keyboard user tabs through and leaves a visually open, stale dropdown behind.

---

### P1-05: Escape key does not explicitly return focus to the trigger

**File:** `hx-select.ts:413-418`

```ts
case 'Escape': {
  e.preventDefault();
  this.open = false;
  this._focusedOptionIndex = -1;
  break;
}
```

When the user presses Escape to close the dropdown, focus should explicitly return to the trigger. While focus technically never left the trigger in this implementation (the listbox items use `aria-activedescendant` rather than real focus), the explicit `this._trigger?.focus()` call is missing. Some AT environments simulate focus movement based on `aria-activedescendant` and may not restore AT announcements to the trigger automatically. Per the APG pattern, Escape must move DOM focus to the combobox.

---

### P1-06: Tests validate `aria-label` only on the hidden native select, not on the trigger

**File:** `hx-select.test.ts:217-223`

```ts
it('sets aria-label on native select', async () => {
  const el = await fixture<WcSelect>('<hx-select aria-label="Select country"></hx-select>');
  const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
  expect(select.getAttribute('aria-label')).toBe('Select country');
});
```

The native `<select>` has `aria-hidden="true"`. Its `aria-label` is invisible to AT. The trigger button (the actual interactive element) should receive the `aria-label`, and this is what matters for accessibility. The test asserts the wrong element. There is no test verifying `aria-label` is present on the `role="combobox"` trigger.

---

### P1-07: No `--hx-select-placeholder-color` component token

**File:** `hx-select.styles.ts:122-123`

```css
.field__trigger--placeholder .field__trigger-value {
  color: var(--hx-color-neutral-400, #adb5bd);
}
```

Every other color in this component file uses a `--hx-select-*` component-level token with a semantic fallback. The placeholder text color skips the component token tier, directly using the semantic token. This breaks the three-tier cascade contract (component → semantic → primitive) documented in CLAUDE.md and prevents consumers from customizing placeholder color without overriding the semantic token (which would affect other components).

Missing token: `--hx-select-placeholder-color`

---

## P2 — Medium Severity

### P2-01: `formStateRestoreCallback` has incomplete signature — FIXED

**File:** `hx-select.ts:251-253`

```ts
formStateRestoreCallback(state: string): void {
  this.value = state;
}
```

The `FormStateRestoreCallback` interface specifies `(state: string | File | FormData, mode: 'restore' | 'autocomplete'): void`. The method accepts only `string` and ignores the `mode` parameter. If the browser restores state as `FormData` or `File` (valid per spec), this will silently assign a non-string to `this.value` without a type error in TypeScript (due to the narrowed parameter type). A proper guard and `mode` handling are missing.

**Resolution:** Signature updated to `formStateRestoreCallback(state: string | File | FormData, _mode: 'restore' | 'autocomplete'): void` with a `typeof state === 'string'` guard before assigning to `this.value`.

---

### P2-02: No multi-select support — limitation not documented in JSDoc or Storybook

**File:** `hx-select.ts:1-648`

The component does not implement a `multiple` attribute or multi-value selection. This is a legitimate design scope decision, but the absence is not documented anywhere in the JSDoc, CEM attributes, or Storybook stories. Consumers building healthcare forms that require multi-select (e.g., selecting multiple conditions, multiple providers) have no guidance about whether to expect this feature or use an alternative component.

Recommendation: Add a `@remarks` JSDoc note explicitly stating that multi-select is not supported and will not be added (if intentional), or create a tracked issue.

---

### P2-03: Event tests exercise native select directly, not the combobox interaction

**File:** `hx-select.test.ts:227-282`

All three event tests (`hx-change` dispatch, detail.value, bubbles/composed) trigger the native `<select>` change event directly:

```ts
select.value = 'b';
select.dispatchEvent(new Event('change', { bubbles: true }));
```

The native `<select>` has `aria-hidden="true"` and `tabindex="-1"` — it is invisible to users. The actual user-facing interaction path is: trigger click → listbox option click → `_selectOption()` → `_dispatchChange()`. This path is not tested in the Events suite. The tests exercise an implementation detail rather than observable behavior.

---

### P2-04: `_instanceId` is a dead alias of `_selectId`

**File:** `hx-select.ts:74-75`

```ts
private _selectId = `hx-select-${Math.random().toString(36).slice(2, 9)}`;
private _instanceId = this._selectId;
```

`_instanceId` is assigned the same value as `_selectId` immediately and is only used in `_optionId()`. `_selectId` is used everywhere else (trigger id, label for, listbox id derivation). This is dead code that adds cognitive overhead and a minor maintenance risk (if `_selectId` changes logic, `_instanceId` may drift). One identifier should be used throughout.

---

### P2-05: No Storybook story for the open/interactive listbox state

**File:** `hx-select.stories.ts`

The stories include default, sizes, error, disabled, required, grouped, and form composition variants. There is no story that opens the dropdown and visually demonstrates the listbox — the interactive combobox state. Storybook's primary value for this component is demonstrating the dropdown UX, option hover/focus states, and keyboard behavior. A missing interactive story means visual regression testing for the open state is not automated.

---

### P2-06: `color-mix()` used without a non-`color-mix` fallback

**File:** `hx-select.styles.ts:79-84`, `167-173`

```css
box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
  color-mix(in srgb, var(--hx-select-focus-ring-color, ...) calc(...), transparent);
```

`color-mix()` has baseline support from 2023 (Chrome 111, Firefox 113, Safari 16.2). Healthcare organizations often have enterprise browser policy that constrains browser versions. There is no `@supports` guard or non-`color-mix` fallback. The focus ring box-shadow will silently fail (disappear) in unsupported environments, which is a P1 accessibility issue in those environments.

---

### P2-07: Listbox panel not rendered at top layer — will be clipped by overflow ancestors

**File:** `hx-select.ts:577-586`, `hx-select.styles.ts:178-196`

The listbox is `position: absolute` relative to `.field__select-wrapper`. It will be clipped by any ancestor with `overflow: hidden` or `overflow: auto`. This is a well-known issue in form controls used inside cards, modals, or scrollable containers. The modern solution is the CSS `popover` API or `@top-layer`. Without this, healthcare applications embedding the select inside tables, cards, or dialog boxes will encounter invisible/clipped dropdowns.

---

### P2-08: Redundant double-traversal of slot on `slotchange`

**File:** `hx-select.ts:266-269`

```ts
private _handleSlotChange(): void {
  this._readOptions();     // traverses slot.assignedElements()
  this._syncClonedOptions(); // traverses slot.assignedElements() again
}
```

Both methods independently query the same slot. They could share one traversal pass. At scale (large option lists, frequent slot mutations in dynamic forms), this doubles DOM traversal cost unnecessarily.

---

### P2-09: No tests for `trigger` and `listbox` CSS parts

**File:** `hx-select.test.ts:315-339`

The CSS Parts test suite validates `label`, `select-wrapper`, `error`, and `help-text`. It does not test:

- `part="trigger"` (the combobox button — the primary interactive element)
- `part="listbox"` (the dropdown panel)
- `part="option"` (individual options)

These are all documented in JSDoc (lines 35-41 of `hx-select.ts`) but unverified. If the `part` attribute is removed from the trigger or listbox in a refactor, no test will catch the regression.

---

### P2-10: No axe-core test with the dropdown open

**File:** `hx-select.test.ts:712-738`

The axe-core tests check default, error, and disabled states — all with `open=false`. The most complex accessibility state is the open dropdown: `role="listbox"` containing `role="option"` elements with `aria-selected` attributes, `aria-activedescendant` on the combobox, etc. A violation in the open state (e.g., orphaned `aria-activedescendant` ID, invalid listbox structure) will never be caught by the current test suite.

---

### P2-11: `size` property accepts invalid values with no runtime warning — FIXED

**File:** `hx-select.ts:143`

```ts
size: 'sm' | 'md' | 'lg' = 'md';
```

If a consumer sets `hx-size="xl"` or `hx-size="foobar"`, the CSS class `field__trigger--xl` is applied (via the classMap template), which has no definition. The component renders silently at its default appearance with no developer warning. Other components in the library follow a similar pattern, but this is worth flagging as it complicates debugging.

**Resolution:** Runtime guard added in `updated()`: checks `['sm', 'md', 'lg'].includes(this.size)` and emits a `console.warn` with the invalid value and expected options.

---

## Audit Coverage Matrix

| Area          | Status     | P0  | P1  | P2  |
| ------------- | ---------- | --- | --- | --- |
| TypeScript    | ⚠️ Issues  | —   | —   | 2   |
| Accessibility | 🔴 Blocked | 1   | 5   | 1   |
| Tests         | ⚠️ Issues  | —   | 1   | 3   |
| Storybook     | ⚠️ Issues  | —   | —   | 1   |
| CSS           | ⚠️ Issues  | —   | 2   | 2   |
| Performance   | ✅ OK      | —   | —   | 1   |
| Drupal        | ✅ Fixed   | —   | —   | —   |

**Total: 2 P0, 7 P1, 11 P2**

---

## Verdict

**BLOCKED — Do not merge.** The two P0 defects (optgroup form submission data loss; contradictory ARIA live semantics on error) and five P1 accessibility defects (combobox role on button; missing typeahead; outline suppression without guarantee; Tab not handled; wrong aria-label test target) must all be resolved before this component can be considered production-quality for a healthcare design system.
