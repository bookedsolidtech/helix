# AUDIT: hx-combobox — T1-04 Antagonistic Quality Review

**Reviewer:** Automated antagonistic audit
**Branch audited:** `remotes/origin/feature/implement-hx-combobox-t1-14`
**Files reviewed:**
- `hx-combobox.ts`
- `hx-combobox.styles.ts`
- `hx-combobox.test.ts`
- `hx-combobox.stories.ts`
- `index.ts`

---

## P0 — Critical (Release Blocker)

### P0-1: Multiple selection is entirely unimplemented
**File:** `hx-combobox.ts:153` (`multiple` property), `hx-combobox.ts:386–392` (`_selectOption`)

The `multiple` property is declared, reflected, and documented with full JSDoc and a Storybook story, but selecting a second option simply overwrites `this.value` (a single string). No multi-value accumulation, no tag/chip rendering, no comma-separated value storage, no `Set<string>` tracking — nothing. The `Multiple` story (`hx-combobox.stories.ts:75–88`) presents the feature as working, which is false advertising to consumers.

ARIA: `aria-multiselectable` is set on the input (`hx-combobox.ts:444`), which is not a valid ARIA attribute for `role="combobox"` (see below). It is also set on the listbox, which is correct, but the behavior never follows through.

**Impact:** Drupal teams who wire `multiple` will ship silently broken forms. Healthcare patient selection (e.g., multi-diagnosis, multi-medication tagging) is a primary use case.

---

## P1 — High Priority

### P1-1: Home/End keyboard navigation not implemented
**File:** `hx-combobox.ts:260–313` (`_handleKeydown`)

The feature spec explicitly requires Home and End keys for option navigation. Neither key is handled in the switch statement. The `default: break` silently swallows both keys.

### P1-2: `aria-multiselectable` invalid on `role="combobox"`
**File:** `hx-combobox.ts:444`

```ts
aria-multiselectable=${this.multiple ? 'true' : nothing}
```

Per the [ARIA 1.2 spec](https://www.w3.org/TR/wai-aria-1.2/#combobox), `aria-multiselectable` is not listed as a supported attribute for `role="combobox"`. It is valid on the `role="listbox"` (which is already set at `hx-combobox.ts:462`). The attribute on the input is noise at best and an axe violation trigger at worst.

### P1-3: Clear button is not keyboard accessible — WCAG 2.1 SC 2.1.1 violation
**File:** `hx-combobox.ts:424`

```ts
tabindex="-1"
```

`tabindex="-1"` removes the clear button from the tab order entirely. WCAG 2.1 Success Criterion 2.1.1 (Keyboard) requires all functionality to be operable via keyboard. A user who cannot use a mouse cannot clear the combobox. The pattern should use `tabindex="0"` with a `keydown` handler, or a different UX approach (e.g., Escape clears on second press).

### P1-4: `aria-controls` / `aria-activedescendant` cross-shadow-DOM references
**File:** `hx-combobox.ts:436–438`

```ts
aria-controls=${this._listboxId}
aria-activedescendant=${ifDefined(activedescendant)}
```

The listbox and option elements live inside Shadow DOM. Their `id` attributes are shadow-scoped. The ARIA relationship attributes `aria-controls` and `aria-activedescendant` are resolved in the accessibility tree using the **light DOM** ID namespace. Shadow DOM IDs are not visible across the shadow boundary.

This means:
- NVDA, JAWS, VoiceOver, and Narrator cannot resolve the `aria-controls` reference to the listbox
- `aria-activedescendant` focusing is broken — screen readers will not announce the focused option

This is a fundamental architectural defect. The cross-shadow-boundary ARIA pattern requires either:
1. Moving the listbox to light DOM (not viable with Shadow DOM encapsulation)
2. Using `aria-owns` as supplemental (also shadow-scoped)
3. Applying the APG "Disclosure" pattern instead
4. Using the [AOM `ariaActiveDescendantElement`](https://wicg.github.io/aom/aria-in-shadow-dom.html) once widely supported

Without a fix, this component will fail WCAG 2.1 SC 4.1.2 for all major screen readers.

### P1-5: `role="alert"` + `aria-live="polite"` conflict
**File:** `hx-combobox.ts:477`

```ts
<div ... role="alert" aria-live="polite">
```

`role="alert"` implicitly sets `aria-live="assertive"` and `aria-atomic="true"`. Explicitly setting `aria-live="polite"` on the same element overrides the implicit value per spec (explicit wins), but creates a contradiction in intent: an alert should be assertive. Screen readers may behave inconsistently. The test at `hx-combobox.test.ts:185` asserts `aria-live="polite"` on a `role="alert"` element, which validates the wrong pattern.

**Fix options:** Remove `aria-live="polite"` and let `role="alert"` control live region behavior, or change `role` to `role="status"` with `aria-live="polite"` if non-interrupting announcements are desired.

### P1-6: `formStateRestoreCallback` signature is wrong
**File:** `hx-combobox.ts:233`

```ts
formStateRestoreCallback(state: string): void {
```

Per the [WHATWG HTML spec](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-callbacks) and TypeScript's `ElementInternals` types, the correct signature is:

```ts
formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete'): void
```

The missing `mode` parameter means TypeScript strict mode should flag this as an incomplete override. More importantly, the component cannot distinguish between browser-initiated restore (e.g., bfcache) and autocomplete fills, which may behave differently.

### P1-7: `ComboboxOption` interface not exported
**File:** `hx-combobox.ts:11–15`, `index.ts`

```ts
interface ComboboxOption {
  value: string;
  label: string;
  disabled: boolean;
}
```

The feature spec requires "all filtering/selection types exported, options typed." `ComboboxOption` is private to the module. TypeScript consumers who need to build option arrays programmatically cannot reference the type. Should be exported from both `hx-combobox.ts` and `index.ts`.

### P1-8: No `aria-busy` for loading state
**File:** `hx-combobox.ts:408–415`

When `loading=true`, a visual spinner is rendered with `aria-hidden="true"`. No `aria-busy` attribute is set on the combobox or its container. Screen readers receive no indication that options are loading. This violates WCAG 2.1 SC 4.1.3 (Status Messages).

---

## P2 — Medium Priority

### P2-1: Storybook `argTypes` keys use camelCase but attributes are kebab-case
**File:** `hx-combobox.stories.ts:77–93`

`helpText` and `filterDebounce` are defined in `argTypes` and `args` using camelCase. Storybook Autodocs and controls bind to attribute names for web components. The actual attributes are `help-text` and `filter-debounce`. The `Default` story render function manually maps these (e.g., `help-text=${args.helpText}`), so it works, but the Storybook controls panel will show the wrong property names in the generated usage example.

### P2-2: `Multiple` story is misleading — multi-select doesn't work
**File:** `hx-combobox.stories.ts:75–88`

The `Multiple` story renders with `multiple` attribute. Since multi-select is not implemented (P0-1), this story demonstrates broken behavior. It should be removed or replaced with a placeholder until implementation is complete.

### P2-3: No story for `prefix`/`suffix` slots
**File:** `hx-combobox.ts:400–402` (slot definitions)

`prefix` and `suffix` slots are documented in JSDoc and styled in CSS but have no Storybook story demonstrating their use.

### P2-4: No story for `empty-label` slot
**File:** `hx-combobox.ts:367–370` (`_renderOptions`)

The `empty-label` slot is documented but no story shows a combobox with a custom empty state. The only way to see the default empty state is to type a non-matching string in the Default story.

### P2-5: `Async` story is misleading
**File:** `hx-combobox.stories.ts:115–132`

The `Async` story shows `loading=true` but also provides static `<option>` elements. A consumer reading the story would think the spinner and options can coexist, but the loading state provides no mechanism to clear options on type or replace them on response. The story needs a `@input` handler that toggles loading state to be meaningful.

### P2-6: `Math.random()` used for unique ID generation
**File:** `hx-combobox.ts:67`

```ts
private _id = `hx-combobox-${Math.random().toString(36).slice(2, 9)}`;
```

`Math.random()` is not guaranteed to be unique. On pages with many comboboxes (e.g., a healthcare data table), ID collisions are statistically possible. Use `crypto.randomUUID()` (available in all modern browsers) or a module-level counter.

### P2-7: `color-mix()` may lack enterprise browser support
**File:** `hx-combobox.styles.ts:46–51`, `hx-combobox.styles.ts:57–62`

```css
color-mix(in srgb, var(--hx-focus-ring-color) calc(var(--hx-focus-ring-opacity) * 100%), transparent)
```

`color-mix()` requires Chrome 111+, Safari 16.2+, Firefox 113+. Enterprise healthcare environments (e.g., hospital workstations) frequently run outdated browsers, often pinned to older Chrome releases. Fallback focus ring colors should be provided. The current code provides none — if `color-mix()` fails, the box-shadow has no color.

### P2-8: Hard-coded hex fallbacks in CSS
**File:** `hx-combobox.styles.ts` (multiple locations)

Fallbacks like `#ffffff`, `#dc3545`, `#343a40`, `#ced4da`, `#adb5bd`, etc. are hardcoded. The design token architecture requires all values to use `--hx-*` tokens. Hard-coded hex values bypass the theming cascade and could conflict with a consumer's dark mode or brand overrides.

Example at `hx-combobox.styles.ts:30`:
```css
color: var(--hx-combobox-label-color, var(--hx-color-neutral-700, #343a40));
```

The hex `#343a40` should not be present. The token `--hx-color-neutral-700` should be defined in the token layer and guaranteed to resolve.

### P2-9: No test for `hx-hide` event
**File:** `hx-combobox.test.ts` (Events section)

Tests cover `hx-input`, `hx-change`, `hx-show`, and `hx-clear`. The `hx-hide` event dispatched in `_closeDropdown()` has no test. Trivially testable via Escape key or outside click.

### P2-10: No test for `filterDebounce`
**File:** `hx-combobox.test.ts` (missing)

`filterDebounce` has a Storybook story and JSDoc but zero test coverage. The debounce timer setup and teardown (including `disconnectedCallback` cleanup) is untested.

### P2-11: No test for keyboard ArrowUp navigation
**File:** `hx-combobox.test.ts` (Keyboard Navigation section)

ArrowDown is tested. ArrowUp is not. Wrap-around behavior for both directions is untested.

### P2-12: No test for disabled option keyboard skipping
**File:** `hx-combobox.ts:270–283` (`_handleKeydown`, `enabledIndices` logic)

The implementation correctly filters disabled options from keyboard navigation using `enabledIndices`. This logic is not tested.

### P2-13: `size` union type not exported
**File:** `hx-combobox.ts`, `index.ts`

The `size` property type `'sm' | 'md' | 'lg'` is only used inline. TypeScript consumers who want to type a variable holding a size value cannot import the type. Should be exported as `HxComboboxSize` or equivalent.

### P2-14: Listbox `position: absolute` may clip in overflow containers
**File:** `hx-combobox.styles.ts:178–190`

```css
.field__listbox {
  position: absolute;
  top: calc(100% + var(--hx-space-1, 0.25rem));
  ...
}
```

The listbox positions relative to `.field` (which has `position: relative`). Any parent element with `overflow: hidden` or `overflow: clip` will clip the dropdown. In a Drupal layout with grid/flexbox scroll containers, this will cause the dropdown to be visually cut off. A portal/teleport approach or `position: fixed` with JS positioning would be more robust.

### P2-15: Bundle size not verified against 5KB budget
**File:** `hx-combobox.ts` + `hx-combobox.styles.ts`

The component imports `tokenStyles` from `@helix/tokens/lit`, which may include the full token set. The component source itself (class + styles) is substantial. No bundle analysis was run to confirm compliance with the `<5KB min+gz` per-component budget enforced in CI.

### P2-16: No Drupal progressive enhancement / Twig example
**File:** (missing)

The component has no documented progressive enhancement story for Drupal. If the custom element fails to register (CDN block, slow load), users see a text input with no mechanism to submit a valid option value. A `<select>` fallback strategy or documented Twig pattern is absent.

---

## Summary by Severity

| Severity | Count | Items |
|----------|-------|-------|
| P0 | 1 | Multiple select unimplemented |
| P1 | 8 | Home/End keys, invalid ARIA attr, keyboard inaccessible clear, shadow DOM ARIA, role+live conflict, formStateRestore signature, missing type export, no aria-busy |
| P2 | 16 | Stories, CSS, test coverage, type exports, browser compat, bundle size |

**Total defects: 25**

The most critical defect is the cross-shadow-DOM ARIA `aria-controls`/`aria-activedescendant` pattern (P1-4), which renders the combobox screen-reader inaccessible in its current form. This is an architectural issue that requires evaluation before other fixes proceed.

Do NOT merge this implementation until P0 and P1 items are resolved.
