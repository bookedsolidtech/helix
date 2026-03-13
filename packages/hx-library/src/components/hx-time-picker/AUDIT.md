# hx-time-picker — Antagonistic Quality Audit

**Auditor:** Autonomous agent (T2-33)
**Date:** 2026-03-05
**Scope:** All files in `packages/hx-library/src/components/hx-time-picker/` (audited from `remotes/origin/feature/t2-33-hx-time-picker-time-input-field` via PR #175)
**Method:** Deep antagonistic review — assume nothing is correct until proven

---

## Severity Key

| Level | Meaning |
|-------|---------|
| P0 | Correctness defect — broken behavior or spec violation |
| P1 | Quality gap — regression risk, accessibility violation, or missing required coverage |
| P2 | Improvement — inconsistency, tech debt, or missing polish |

---

## Findings

---

### A-01 — `role="combobox"` on wrapper div violates ARIA 1.2 specification [P0]

**File:** `hx-time-picker.ts:345-356`

```html
<div
  class="field__combobox"
  role="combobox"
  aria-expanded=${...}
  aria-haspopup="listbox"
  aria-owns=${...}
>
  <input ... aria-controls=${...} />
</div>
```

The ARIA 1.2 combobox pattern specifies that `role="combobox"` belongs on the **text input element** itself, not a wrapper `<div>`. The old ARIA 1.0/1.1 pattern used a wrapper div — that pattern is deprecated.

Per ARIA 1.2 spec: the element with `role="combobox"` must be a focusable element that receives keyboard input. A `<div>` is not focusable and does not receive keyboard events, making this a spec violation.

In practice, VoiceOver on macOS and NVDA on Windows may fail to announce the combobox role and state correctly because the role is on a non-interactive wrapper rather than the input. Screen readers look for `role="combobox"` on the element that receives focus, not its parent.

The fix requires moving `role="combobox"`, `aria-expanded`, `aria-haspopup`, and `aria-controls` directly onto the `<input>` element, removing `aria-owns` from the wrapper entirely.

---

### A-02 — `role="alert"` + `aria-live="polite"` is contradictory [P0]

**File:** `hx-time-picker.ts:397-405`

```html
<div
  part="error"
  class="field__error"
  id=${this._errorId}
  role="alert"
  aria-live="polite"
>
```

`role="alert"` carries an **implicit** `aria-live="assertive"`. Adding `aria-live="polite"` on the same element overrides the implicit assertive priority to polite. This creates contradictory semantics: the element declares it is an alert (assertive) but then demands polite delivery. Screen readers treat this inconsistently — some honor `aria-live`, others honor the role implicit value.

In a healthcare context handling medication schedules and appointments, error messages must interrupt the user immediately. Using `aria-live="polite"` on a `role="alert"` demotes this urgency and could result in critical validation errors going unannounced during time-sensitive clinical workflows.

`aria-live="polite"` should be removed entirely, allowing `role="alert"` to function as specified (assertive, atomic).

---

### A-03 — Slotted label content breaks the `<label for="...">` association [P1]

**File:** `hx-time-picker.ts:324-342`, `hx-time-picker.stories.ts:WithLabelSlot story`

When consumers use the `label` slot (primary Drupal integration pattern), they provide a `<label>` element in light DOM:

```html
<hx-time-picker>
  <label slot="label">Appointment Time</label>
</hx-time-picker>
```

The native `<input>` lives inside the shadow root with `id="${this._id}"`. The slotted label element lives in light DOM and has no `for` attribute pointing to the shadow-internal ID. Because shadow DOM boundaries prevent light-DOM labels from referencing shadow-DOM IDs, this slot pattern produces an **unlabeled input** for screen readers.

The `WithLabelSlot` Storybook story (`hx-time-picker.stories.ts`) demonstrates this broken pattern as if it were correct, complete with a required asterisk.

The prop-based label (`label="..."`) renders a `<label part="label" for=${this._id}>` inside shadow DOM, which does work. But the slot-based pattern — documented as the Drupal Form API integration — is inaccessible. This requires either: (1) forwarding `aria-labelledby` from the slotted label's ID to the input via `aria-labelledby`, or (2) deprecating the slot in favor of requiring the `label` prop.

---

### A-04 — Missing `Home` and `End` keyboard navigation [P1]

**File:** `hx-time-picker.ts:_handleInputKeyDown`

The ARIA Combobox pattern (APG reference: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) requires `Home` and `End` key handling to jump to the first and last options respectively when the listbox is open. The current implementation handles `ArrowDown`, `ArrowUp`, `Enter`, `Escape`, and `Tab` but omits `Home` and `End`.

In a medication scheduling context with step=1 (1440 options for a full 24h range), the absence of `Home`/`End` navigation forces keyboard users to traverse the entire list with arrow keys. This is a material usability regression for keyboard-dependent users.

There are no tests for this behavior and no Storybook story demonstrating it.

---

### A-05 — `aria-owns` is deprecated in ARIA 1.2 combobox; redundant with `aria-controls` [P1]

**File:** `hx-time-picker.ts:349-352`

```html
<div role="combobox"
  aria-owns=${ifDefined(this._open ? this._listboxId : undefined)}
>
  <input aria-controls=${ifDefined(this._open ? this._listboxId : undefined)} />
```

Both `aria-owns` (on the wrapper) and `aria-controls` (on the input) point to the same listbox ID. In ARIA 1.2, only `aria-controls` on the combobox input is required. `aria-owns` in the combobox pattern is an ARIA 1.1 artifact and is explicitly not recommended in ARIA 1.2. Having both on different elements may cause assistive technologies to announce the listbox twice or create unexpected virtual cursor behavior.

Combined with A-01 (wrong element has `role="combobox"`), the full ARIA relationship chain is malformed.

---

### A-06 — `_slots` getter regenerates all time slots on every invocation [P1]

**File:** `hx-time-picker.ts:231-233`

```ts
private get _slots(): TimeSlot[] {
  return generateSlots(this.min, this.max, this.step, this.format);
}
```

`_slots` is called in two separate places per open cycle: once inside `_openListbox()` (for `findIndex`) and once inside `render()`. Each call invokes `generateSlots`, which iterates `(max - min) / step` times. For `step=1` with full 24h range, this allocates 1,440 `TimeSlot` objects per call — 2,880 per open.

This is a performance defect for fine-grained step values and should be memoized (cached property invalidated only when `min`, `max`, `step`, or `format` changes).

---

### A-07 — `formStateRestoreCallback` signature is incomplete per WHATWG spec [P1]

**File:** `hx-time-picker.ts:302-304`

```ts
formStateRestoreCallback(state: string): void {
  this.value = state;
}
```

The WHATWG Form-Associated Custom Elements specification defines the full signature as:

```ts
formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete'): void
```

The `mode` parameter is omitted. While TypeScript may not flag this in all configurations, it is a spec violation. The `state` parameter type is also narrowed to `string` — if a browser passes `File` or `FormData` (valid per spec), the assignment `this.value = state` would coerce a `File` object to the string `"[object File]"` and display incorrectly.

---

### A-08 — No test for user-typed input parsing via `parseUserInput` [P1]

**File:** `hx-time-picker.test.ts` (absent), `hx-time-picker.ts:_handleInputChange`

The `_handleInputChange` handler processes user-typed strings through `parseUserInput`, which supports complex 12h/24h parsing patterns ("2:30 PM", "230 pm", "2 PM", bare "HH:MM"). None of these parsing paths are tested. The only value-related tests use property assignment or option clicks — not typed input.

Edge cases that are untested:
- "12:00 PM" → `12:00` (noon)
- "12:00 AM" → `00:00` (midnight)
- "13:00 PM" → null (invalid) — should revert display
- User clears the field (empty string → `value = ''`)
- Invalid input reverts to last known good display value

In a medication scheduling context, users will frequently type times rather than selecting from the dropdown. Typed input is the primary free-text path and is completely untested.

---

### A-09 — No test for `_handleInputInput` (live-typing dropdown open behavior) [P1]

**File:** `hx-time-picker.test.ts` (absent)

The `_handleInputInput` handler (the `input` event — fires on every keystroke) updates `_inputDisplayValue` and opens the listbox. This entire code path is untested. A test verifying that typing into the input opens the listbox and updates the displayed value is missing.

---

### A-10 — `axe-core` not tested with dropdown open [P1]

**File:** `hx-time-picker.test.ts:805-837`

The four axe-core tests run on the component in its **closed** state. The ARIA combobox structure when the dropdown is **open** — with `role="combobox"`, `aria-owns`, `aria-controls`, `role="listbox"`, and `role="option"` elements all present — is the higher-risk accessibility state and is not axe-tested. Given A-01 identifies a spec violation in the combobox role placement, it is likely the open state would generate axe violations that are currently not caught.

---

### A-11 — Toggle button missing `part` attribute prevents external styling [P1]

**File:** `hx-time-picker.ts:358-384`

```html
<button type="button" class="field__toggle" tabindex="-1" ...>
```

The toggle button (clock icon) has no `part` attribute. All other primary surfaces (label, input, listbox, option, error, help-text, field) expose CSS parts, but the toggle button cannot be styled by consumers via `::part(toggle)`. This is inconsistent and a blocker for theming integrations that need to match a custom design system's icon button appearance.

---

### A-12 — `--hx-time-picker-listbox-shadow` token undocumented in JSDoc [P1]

**File:** `hx-time-picker.ts:149-171` (JSDoc), `hx-time-picker.styles.ts:141-145`

The listbox CSS uses:
```css
box-shadow: var(--hx-time-picker-listbox-shadow, 0 4px 16px ...);
```

This is a consumer-overridable CSS custom property, but it is **not listed** in the `@cssprop` JSDoc annotations on the component class. The CEM generator reads these annotations to populate the Custom Elements Manifest. The undocumented token is invisible to CEM consumers, Storybook autodocs, and design system integrators.

---

### A-13 — Storybook CSS demos use hardcoded hex color values [P1]

**File:** `hx-time-picker.stories.ts:CSSCustomProperties story`, `CSSParts story`

```ts
style="--hx-time-picker-border-color: #2563EB;"
style="--hx-time-picker-bg: #1e293b; --hx-time-picker-color: #f1f5f9; ..."
```

The CSS Custom Properties and CSS Parts demonstration stories use hardcoded hex values (`#2563EB`, `#1e293b`, `#f1f5f9`, `#334155`, `#94a3b8`, `#dc3545`) throughout the style attributes and the `<style>` block (`#0d6efd`, `rgba(13, 110, 253, 0.15)`). This directly contradicts the design token architecture — stories demonstrating override patterns should use semantic token references (e.g., `--hx-color-primary-600`) as examples, not hardcoded hex values that are meaningless to design-system consumers.

---

### ~~A-14 — `Math.random()` for stable IDs is not SSR-safe~~ FIXED [P2]

**File:** `hx-time-picker.ts`

**Resolution:** `Math.random()` replaced with a static class-level monotonically incrementing counter:

```ts
private static _instanceCount = 0;
private readonly _id = `hx-time-picker-${++HelixTimePicker._instanceCount}`;
```

IDs are now deterministic per page render order. `<label for>` associations, `aria-labelledby` references, and `aria-controls` listbox linkage remain stable across server-render and client-side hydration in Drupal Declarative Shadow DOM contexts. The static counter is scoped to the class, ensuring uniqueness across all instances on the page.

---

### A-15 — Listbox may be clipped by `overflow: hidden` parent containers [P2]

**File:** `hx-time-picker.styles.ts:64-66`

```css
.field__combobox {
  position: relative;
  overflow: visible;
}
```

The listbox is `position: absolute` inside a `position: relative` combobox. If any ancestor element has `overflow: hidden` or creates a new stacking context with a lower `z-index`, the dropdown will be clipped or appear behind other content. The component cannot detect or escape ancestor overflow constraints without JavaScript-based portal rendering.

This is a known limitation in Shadow DOM component dropdowns and must be documented in the component's API docs and Drupal integration guide so consumers know to avoid `overflow: hidden` on containing elements.

---

### A-16 — No memoization for `_slots`; `format` change regenerates without `format` in label [P2]

**File:** `hx-time-picker.ts:231-233`

Related to A-06. Additionally: when `format` changes from `24h` to `12h`, `willUpdate` updates `_inputDisplayValue` correctly, but `_slots` is not a reactive property — it will regenerate on next render. The slot labels change between `24h` ("09:00") and `12h` ("09:00 AM") on format change correctly, but since `_slots` is a computed getter rather than a reactive state property, Lit cannot detect this change automatically. The format change forces a full re-render via `willUpdate`'s side effect, which is correct, but it would be clearer and more performant as a `@state()` computed property.

---

### A-17 — `color-mix()` function not supported in Safari < 16.2 [P2]

**File:** `hx-time-picker.styles.ts:71-80, 89-98`

```css
box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
  color-mix(
    in srgb,
    var(--hx-time-picker-focus-ring-color, var(--hx-focus-ring-color))
      calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
    transparent
  );
```

`color-mix()` has baseline support from Chrome 111, Firefox 113, Safari 16.2 (March 2023). Healthcare enterprise environments frequently run older browser versions or restrictive Safari policies. Absence of a fallback means the focus ring's opacity effect silently degrades to no-opacity in older environments, potentially failing WCAG 2.4.11 (Focus Appearance) requirements.

---

### A-18 — Inline SVG clock icon not using `hx-icon` component [P2]

**File:** `hx-time-picker.ts:364-380`

```html
<svg width="16" height="16" viewBox="0 0 16 16" ...>
  <circle .../>
  <path .../>
</svg>
```

The component renders an inline SVG clock icon directly rather than using the project's `hx-icon` component. Every instance of `hx-time-picker` carries the SVG payload inline. While the SVG is small (~200 bytes), the inconsistency with the icon system means: (1) icon updates require modifying the component directly, (2) the icon cannot be swapped by consumers, and (3) it violates the "use the component system" convention.

---

### A-19 — No RTL (right-to-left) layout support [P2]

**File:** `hx-time-picker.styles.ts`

All layout uses physical properties (`left: 0; right: 0` for the listbox dropdown, `border-left` for the toggle separator, `padding` shorthand). There are no `[dir="rtl"]` overrides or logical property equivalents (`inset-inline-start`, `border-inline-start`). In healthcare deployments serving Arabic, Hebrew, or other RTL-script users, the time picker's layout will be visually incorrect.

---

### A-20 — `step=0` or negative `step` values not tested [P2]

**File:** `hx-time-picker.ts:generateSlots`, `hx-time-picker.test.ts`

`generateSlots` guards against invalid steps with `Math.max(1, Math.round(stepMinutes))`, which clamps step to 1 for zero or negative values. However, there is no test verifying this guard. A consumer setting `step=0` would silently generate 1-minute intervals (1440 options), potentially causing severe render performance issues — especially concerning given A-06.

---

### A-21 — `formStateRestoreCallback` does not validate or clamp restored value [P2]

**File:** `hx-time-picker.ts:302-304`

```ts
formStateRestoreCallback(state: string): void {
  this.value = state;
}
```

The restored state is set directly to `this.value` without validation. If the browser restores a value that is outside the current `min`/`max` range (e.g., the range was tightened after initial form submission), the displayed value will be invalid and no error will surface. `parseHHMM` and `clampValue` should be applied to the restored state before assignment.

---

### A-22 — No test verifying `hx-change` is NOT dispatched on `formResetCallback` [P2]

**File:** `hx-time-picker.test.ts`

`formResetCallback` clears the value but does not dispatch `hx-change`. This is correct behavior (form reset is not a user-initiated change event), but there is no test explicitly verifying the absence of the event on reset. Without this test, a future refactor that accidentally adds `_dispatchChange('')` to `formResetCallback` would go undetected.

---

## Summary

| ID | Area | Severity | Title |
|----|------|----------|-------|
| A-01 | Accessibility | P0 | `role="combobox"` on wrapper div violates ARIA 1.2 |
| A-02 | Accessibility | P0 | `role="alert"` + `aria-live="polite"` contradiction |
| A-03 | Accessibility | P1 | Slotted label breaks `<label for>` association |
| A-04 | Accessibility | P1 | Missing `Home`/`End` keyboard navigation |
| A-05 | Accessibility | P1 | Deprecated `aria-owns` redundant with `aria-controls` |
| A-06 | Performance | P1 | `_slots` getter regenerates on every invocation |
| A-07 | TypeScript | P1 | `formStateRestoreCallback` signature incomplete per spec |
| A-08 | Tests | P1 | No tests for user-typed input via `parseUserInput` |
| A-09 | Tests | P1 | No tests for live-typing (`_handleInputInput`) |
| A-10 | Tests | P1 | `axe-core` not tested with dropdown open |
| A-11 | CSS Parts | P1 | Toggle button missing `part` attribute |
| A-12 | CEM/Docs | P1 | `--hx-time-picker-listbox-shadow` token undocumented |
| A-13 | Storybook | P1 | Hardcoded hex values in CSS demo stories |
| ~~A-14~~ | TypeScript | P2 | ~~`Math.random()` IDs not SSR-safe~~ FIXED: static class counter |
| A-15 | CSS | P2 | Listbox clipped by ancestor `overflow: hidden` |
| A-16 | Performance | P2 | `_slots` not memoized; format change regenerates |
| A-17 | CSS | P2 | `color-mix()` not supported in Safari < 16.2 |
| A-18 | Architecture | P2 | Inline SVG should use `hx-icon` component |
| A-19 | CSS | P2 | No RTL layout support |
| A-20 | Tests | P2 | `step=0`/negative step guard untested |
| A-21 | TypeScript | P2 | Restored state not validated or clamped |
| A-22 | Tests | P2 | No test confirming `hx-change` absent on form reset |

**P0 count: 2 — BLOCKS MERGE**
**P1 count: 11**
**P2 count: 9**

The two P0 findings (A-01, A-02) are correctness defects affecting screen reader behavior. A-01 misplaces `role="combobox"` in violation of the ARIA 1.2 specification; A-02 emits semantically contradictory accessibility attributes on error messages. Both must be resolved before this component is considered WCAG 2.1 AA compliant for healthcare deployment.
