# AUDIT: hx-text-input — T1-05 Antagonistic Quality Review

**Reviewer:** Automated antagonistic audit agent
**Date:** 2026-03-05
**Component:** `hx-text-input` (`packages/hx-library/src/components/hx-text-input/`)
**Severity scale:** P0 = production blocker · P1 = high · P2 = medium

---

## P0 — Production Blockers

### P0-01: `help-text` slot is unusable without the `helpText` property

**File:** `hx-text-input.ts:425`

```ts
${this.helpText && !hasError
  ? html`
      <div part="help-text" class="field__help-text" id=${this._helpTextId}>
        <slot name="help-text">${this.helpText}</slot>
      </div>
    `
  : nothing}
```

The `help-text` slot is gated behind `this.helpText` being truthy. If a consumer (e.g., Drupal) slots rich HTML into `slot="help-text"` without also setting the `help-text` attribute, the slot wrapper is never rendered and the slotted content is silently discarded. This makes the `help-text` slot non-functional in its primary use case (Drupal Form API integration).

The Storybook story `WithHelpTextSlot` only works because `help-text` is not set — but the slot wrapper is unconditionally hidden when the attribute is absent. The test (`hx-text-input.test.ts:292`) hides this defect by setting `help-text="default"` to force the wrapper to render before testing the slot.

---

### P0-02: Slotted error (`slot="error"`) silently breaks `aria-describedby`

**File:** `hx-text-input.ts:341-352, 409-423`

```ts
const hasError = !!this.error || this._hasErrorSlot;  // line 341

const describedBy =
  [hasError ? this._errorId : null, ...]  // line 352 — always references _errorId
```

When only the `error` slot is used (no `error` attribute), `hasError` is true and `_errorId` is added to `aria-describedby`. However, `_errorId` is only rendered as an element when `this.error` is truthy (line 409 `${this.error ? html`...id=${this._errorId}...` : nothing}`). With only a slotted error, the `aria-describedby` references a non-existent DOM ID. Screen readers will silently receive a broken reference — no error text will be announced.

This completely breaks the ARIA association for the Drupal slotted error pattern.

---

## P1 — High Severity

### P1-01: `role="alert"` + `aria-live="polite"` are contradictory

**File:** `hx-text-input.ts:414-418`

```ts
<div
  part="error"
  class="field__error"
  id=${this._errorId}
  role="alert"
  aria-live="polite"
>
```

`role="alert"` has an implicit `aria-live="assertive"`. Setting `aria-live="polite"` overrides this, causing errors to be announced only at the next polite opportunity rather than immediately. For a healthcare form where a validation error means a clinician may have entered the wrong patient data, delayed error announcement is a patient safety concern. Either remove `aria-live="polite"` (let `role="alert"` be assertive) or change to `role="status"` + `aria-live="polite"` for non-critical feedback.

---

### P1-02: Empty prefix/suffix slots add unwanted padding

**File:** `hx-text-input.styles.ts:90-97`

```css
.field__prefix,
.field__suffix {
  display: flex;
  align-items: center;
  padding: 0 var(--hx-space-3, 0.75rem);
  ...
}
```

The `<span class="field__prefix">` and `<span class="field__suffix">` wrappers are always rendered regardless of whether the slots have content. When no prefix or suffix is provided, each empty span still consumes `0.75rem` horizontal padding, adding 1.5rem of total phantom space inside the input wrapper. This visually narrows the text input and shifts the placeholder text rightward. Slots should be conditionally rendered or the padding should only apply via a CSS `:not(:empty)` selector.

---

### P1-03: Slotted help-text has no `aria-describedby` association

**File:** `hx-text-input.ts:352`

```ts
const describedBy =
  [hasError ? this._errorId : null, this.helpText ? this._helpTextId : null]
    .filter(Boolean).join(' ') || undefined;
```

`_helpTextId` is only included in `aria-describedby` when `this.helpText` (the property) is truthy. If a consumer uses only the `help-text` slot (without the `help-text` attribute), the help text is not referenced by `aria-describedby`. Screen readers will not announce slotted help text as input description. There is no slot-change tracking for the `help-text` slot analogous to the label and error slot tracking.

---

### P1-04: Missing test coverage for critical paths

**File:** `hx-text-input.test.ts`

The following behaviors are implemented but have zero test coverage:

| Missing Test | Reference |
|---|---|
| `readonly` property (attribute passthrough and behavior) | `hx-text-input.ts:135-136` |
| `tel`, `url`, `search` input types | `hx-text-input.ts:86` |
| `minlength` validation (`tooShort` validity state) | `hx-text-input.ts:251-260` |
| `maxlength` validation (`tooLong` validity state) | `hx-text-input.ts:261-266` |
| `hx-size` attribute (`sm`, `md`, `lg` variants) | `hx-text-input.ts:169-170` |
| `pattern` attribute passthrough | `hx-text-input.ts:156` |
| `autocomplete` attribute passthrough | `hx-text-input.ts:163` |
| Full form submission (`FormData` contains correct value) | — |
| Slotted error activates error state without `error` attr | — |

No test exists that submits a real form and asserts the component's value appears in `FormData`. This is the core form-association contract and it is untested.

---

### P1-05: `date` type in TypeScript union is invisible in Storybook and untested

**File:** `hx-text-input.ts:86`, `hx-text-input.stories.ts:44`

```ts
// ts: type union includes 'date'
type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'date'

// stories: 'date' missing from options
options: ['text', 'email', 'password', 'tel', 'url', 'search', 'number'],
```

The `date` type exists in the TypeScript type union but is absent from Storybook `argTypes.type.options` and has no dedicated story or test. Either `date` is intentionally excluded (in which case it should be removed from the type union) or it is a gap in story/test coverage.

---

## P2 — Medium Severity

### P2-01: Slot tests validate light DOM, not shadow DOM projection

**File:** `hx-text-input.test.ts:274-300`

```ts
it('prefix slot renders', async () => {
  const el = await fixture<WcTextInput>('<hx-text-input><span slot="prefix">@</span></hx-text-input>');
  const prefix = el.querySelector('[slot="prefix"]');  // light DOM query
  expect(prefix).toBeTruthy();
```

These tests verify the slotted element exists in the host's light DOM — which is always true since the test placed it there. They do not verify the slot is rendered in the shadow DOM or that Lit correctly projected the content. A broken slot definition would not be caught by these tests.

---

### P2-02: `WcTextInput` type alias uses wrong naming convention

**File:** `hx-text-input.ts:443`

```ts
export type WcTextInput = HelixTextInput;
```

All components in the project use `hx-` prefix conventions. The alias `WcTextInput` uses the old `wc-` prefix. Should be `HxTextInput` to match the naming convention. This alias is used in test imports and may be a confusing API surface.

---

### P2-03: `Math.random()` IDs cause SSR/hydration mismatch

**File:** `hx-text-input.ts:336-338`

```ts
private _inputId = `hx-text-input-${Math.random().toString(36).slice(2, 9)}`;
private _helpTextId = `${this._inputId}-help`;
private _errorId = `${this._inputId}-error`;
```

IDs generated with `Math.random()` will differ between server-rendered HTML and client hydration, breaking `for`/`id` label association and `aria-describedby` in SSR environments. For Drupal, which may pre-render component markup, this could cause ARIA breakage on page load.

---

### P2-04: No `prefers-reduced-motion` support

**File:** `hx-text-input.styles.ts:54-57`

```css
transition:
  border-color var(--hx-transition-fast, 150ms ease),
  box-shadow var(--hx-transition-fast, 150ms ease);
```

The input wrapper transition does not respect `@media (prefers-reduced-motion: reduce)`. In healthcare settings, patients may have vestibular disorders that are aggravated by motion. WCAG 2.1 SC 2.3.3 (Level AAA) covers this, but it is a best practice even at AA.

---

### P2-05: `color-mix()` browser support not documented

**File:** `hx-text-input.styles.ts:63-68`

```css
box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
  color-mix(in srgb, var(--hx-input-focus-ring-color, ...) calc(...), transparent);
```

`color-mix()` requires Chrome 111+, Firefox 113+, Safari 16.2+. This may silently fail in enterprise environments pinned to older browser versions (e.g., legacy Edge on locked-down hospital workstations). The focus ring fallback when `color-mix()` fails is that no focus ring opacity/transparency is applied — the focus ring color becomes fully opaque rather than 25% opacity. This is acceptable as a degradation but is undocumented.

---

### P2-06: `aria-required` is redundant

**File:** `hx-text-input.ts:399`

```ts
aria-required=${this.required ? 'true' : nothing}
```

The native `required` attribute is already set on the input (line 385: `?required=${this.required}`). The HTML `required` attribute implicitly maps to `aria-required="true"` — explicitly setting both is redundant and adds noise. Not harmful, but violates the "prefer native semantics" principle.

---

### P2-07: `hx-size`, `readonly`, `minlength`, `maxlength`, `pattern` missing from Storybook `argTypes`

**File:** `hx-text-input.stories.ts:14-131`

The following properties are implemented, have dedicated stories, but are absent from the `argTypes` block (and thus invisible in the Controls panel on the Default story):

- `hxSize` (`hx-size` attribute) — has `SizeSmall/Medium/Large` stories but no control
- `readonly` — has `Readonly` story but no control
- `minlength` — implemented, no story or control
- `maxlength` — implemented, no story or control
- `pattern` — implemented, no story or control
- `autocomplete` — implemented, no story or control

---

### P2-08: `AllSizes` story uses inline `style` instead of `hx-size` attribute

**File:** `hx-text-input.stories.ts:446-462`

```ts
export const AllSizes: Story = {
  render: () => html`
    <hx-text-input label="Small" style="font-size: 0.875rem;"></hx-text-input>
    <hx-text-input label="Medium (Default)"></hx-text-input>
    <hx-text-input label="Large" style="font-size: 1.125rem;"></hx-text-input>
  `,
};
```

This story uses raw `style` overrides to simulate size variants instead of using the actual `hx-size` attribute. It does not test the real size prop. This is misleading documentation.

---

### P2-09: Drupal slotted label `for` attribute creates an orphaned association

**File:** `hx-text-input.ts:359-371`, `hx-text-input.stories.ts:369-381`

When Drupal renders a `<label slot="label" for="some-id">`, the `for` attribute targets an ID in the light DOM, but the native `<input id="${_inputId}">` lives in the shadow DOM. The `for` attribute cannot cross shadow DOM boundaries. The component partially works around this via `aria-labelledby` (line 394-396) but relies on assigning a generated ID to the slotted label (line 188). The Drupal Form API label's original `for` attribute becomes orphaned (references a non-existent light DOM element), which may cause validation errors in Drupal's accessibility checkers. This interaction is undocumented.

---

## Summary

| ID | Severity | Area | Description |
|---|---|---|---|
| P0-01 | P0 | Slots | `help-text` slot unusable without `helpText` property |
| P0-02 | P0 | A11y | Slotted error breaks `aria-describedby` — references non-existent element ID |
| P1-01 | P1 | A11y | `role="alert"` + `aria-live="polite"` contradictory — delays error announcements |
| P1-02 | P1 | CSS | Empty prefix/suffix slots add phantom 0.75rem padding each |
| P1-03 | P1 | A11y | Slotted help-text excluded from `aria-describedby` |
| P1-04 | P1 | Tests | Missing tests: `readonly`, 3 input types, `minlength`/`maxlength`, `hx-size`, form submission |
| P1-05 | P1 | TypeScript/Stories | `date` type in union but missing from Storybook options and tests |
| P2-01 | P2 | Tests | Slot tests validate light DOM only, not shadow DOM projection |
| P2-02 | P2 | TypeScript | `WcTextInput` alias uses wrong `wc-` prefix convention |
| P2-03 | P2 | TypeScript | `Math.random()` IDs break SSR/hydration — ARIA associations may fail |
| P2-04 | P2 | CSS | No `prefers-reduced-motion` support |
| P2-05 | P2 | CSS | `color-mix()` browser support undocumented |
| P2-06 | P2 | A11y | `aria-required` redundant when native `required` is present |
| P2-07 | P2 | Storybook | 6 properties missing from `argTypes` Controls panel |
| P2-08 | P2 | Storybook | `AllSizes` story uses inline style hack, not `hx-size` attribute |
| P2-09 | P2 | Drupal | Slotted label `for` attribute orphaned across shadow DOM — undocumented |

**P0 count: 2 · P1 count: 5 · P2 count: 9**

Both P0 defects affect the Drupal slot integration patterns — the component's highest-priority use case. P0-01 makes the help-text slot silently non-functional; P0-02 makes slotted errors invisible to screen readers.
