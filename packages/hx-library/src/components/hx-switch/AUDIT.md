# hx-switch — Antagonistic Quality Audit

**Auditor:** Autonomous agent (T1-12)
**Date:** 2026-03-05
**Scope:** All files in `packages/hx-library/src/components/hx-switch/`
**Method:** Deep antagonistic review — assume nothing is correct until proven

---

## Severity Key

| Level | Meaning                                                                              |
| ----- | ------------------------------------------------------------------------------------ |
| P0    | Correctness defect — broken behavior or spec violation                               |
| P1    | Quality gap — regression risk, accessibility violation, or missing required coverage |
| P2    | Improvement — inconsistency, tech debt, or missing polish                            |

---

## Findings

---

### A-01 — `role="alert"` + `aria-live="polite"` is contradictory [P0]

**File:** `hx-switch.ts:294-303`

```html
<div role="alert" aria-live="polite"></div>
```

`role="alert"` carries an **implicit** `aria-live="assertive"`. Setting `aria-live="polite"` on the same element overrides the implicit value and demotes announcements to polite priority. In practice, screen readers may treat this inconsistently — some honor `aria-live`, others honor the role. The net result is unpredictable and almost certainly wrong.

In a healthcare context where an error announces that a required field is missing, assertive announcement is the correct behavior. The `aria-live="polite"` attribute should be removed entirely, allowing `role="alert"` to behave as specified.

---

### A-02 — `NoLabel` story demonstrates broken accessibility [P1]

**File:** `hx-switch.stories.ts:522-524`

```ts
export const NoLabel: Story = {
  render: () => html` <hx-switch aria-label="Toggle dark mode"></hx-switch> `,
};
```

`aria-label` placed on the custom element host does **not** propagate into the shadow DOM. The `<button role="switch">` inside the shadow root has no accessible name from this attribute. The component does not implement `ElementInternals.ariaLabel` forwarding or any mechanism to read `aria-label` from the host and apply it internally.

A screen reader user will encounter a switch with no name. The story is actively demonstrating broken usage as if it were correct. The fix requires either:

1. Implementing host `aria-label`/`aria-labelledby` forwarding via `ElementInternals`
2. Documenting that `label` prop (or slotted content) must always be used, and removing the `NoLabel` story

---

### A-03 — Slotted label content yields an unlabeled button [P1]

**File:** `hx-switch.ts:263-265, 276-289`

```ts
const hasLabel = !!this.label;
// ...
aria-labelledby=${ifDefined(hasLabel ? this._labelId : undefined)}
```

`hasLabel` only checks the `label` _property_. When a consumer uses only slotted content:

```html
<hx-switch><strong>My Label</strong></hx-switch>
```

`this.label` is `''`, so `hasLabel` is `false`. `aria-labelledby` is not set on the button. The label `<span>` is rendered (line 289) with `id=${this._labelId}` and contains the slot, but the button does not reference it. The button has no accessible name.

The `@state` decorator tracks `_hasErrorSlot` via `slotchange` — the same pattern must be applied to the default slot to detect slotted label content and conditionally set `aria-labelledby`.

---

### A-04 — No `prefers-reduced-motion` support [P1]

**File:** `hx-switch.styles.ts:44, 67`

```css
transition: background-color var(--hx-transition-fast, 150ms ease);
transition: transform var(--hx-transition-fast, 150ms ease);
```

No `@media (prefers-reduced-motion: reduce)` block disables or reduces these transitions. Users who have set their OS-level preference to reduce motion will still see the thumb slide animation and the track background transition.

WCAG 2.1 SC 2.3.3 (AAA) addresses this, but more critically: the project's WCAG 2.1 AA mandate requires that animations do not negatively impact users with vestibular disorders. Motion triggered by interaction that cannot be disabled violates this intent. The standard fix:

```css
@media (prefers-reduced-motion: reduce) {
  .switch__track,
  .switch__thumb {
    transition: none;
  }
}
```

---

### A-05 — `formStateRestoreCallback` signature is incorrect [P1]

**File:** `hx-switch.ts:175-177`

```ts
formStateRestoreCallback(state: string): void {
  this.checked = state === this.value;
}
```

The Web Components spec defines this callback as:

```ts
formStateRestoreCallback(state: File | USVString | null, mode: string): void
```

The implementation:

1. Types `state` as `string` — ignores `File | null` cases
2. Omits the required `mode` parameter entirely

If the browser passes `null` (e.g., no saved state), `null === this.value` evaluates to `false` and the switch is silently unchecked — correct behavior by accident, but not by design. If the browser passes a `File` object for any reason, the strict comparison will fail silently. The `mode` parameter (`"restore"` vs `"autocomplete"`) is unused, which may be intentional, but omitting it from the signature is incorrect TypeScript.

---

### A-06 — `Enter` key toggles the switch: ARIA spec deviation [P2]

**File:** `hx-switch.ts:215`

```ts
if (e.key === ' ' || e.key === 'Enter') {
```

The [ARIA Authoring Practices Guide for switch role](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) specifies **Space** as the activation key. `Enter` is not listed. While `Enter` activating a switch is defensible within a form context (submit conventions), it is not required and may surprise users accustomed to switch semantics where Enter has no special meaning.

Additionally, a `<button>` element natively fires a `click` event on Enter key press (browser default), which will already call `_handleClick`. The explicit `Enter` handling in `_handleKeyDown` is therefore redundant: pressing Enter calls `_toggle` _twice_ — once from `_handleKeyDown` and once from the browser's native click-on-Enter behavior for buttons. This double-toggle means Enter effectively does nothing (cancels itself out).

This is a P0-adjacent behavioral bug: **Enter key on an unchecked switch leaves it unchecked because it toggles twice.**

---

### A-07 — `_trackEl` non-null assertion is a lie [P2]

**File:** `hx-switch.ts:180`

```ts
@query('.switch__track')
private _trackEl!: HTMLButtonElement;
```

The `!` asserts this is never null. However `_updateValidity()` is called from `updated()` (line 122-126), which runs after every update including the initial render. During the very first `updated()` call, `_trackEl` may be `null` if the element is not yet in the DOM. The code defensively handles this:

```ts
this._trackEl ?? undefined;
```

The `??` is needed precisely because `_trackEl` can be null, contradicting the `!` assertion. The type should be `HTMLButtonElement | null` and the defensive code is correct — but the assertion is misleading.

---

### A-08 — Missing `--hx-switch-help-text-color` CSS custom property [P2]

**File:** `hx-switch.styles.ts:150-153`, `hx-switch.ts:29-35`

```css
.switch__help-text {
  color: var(--hx-color-neutral-500, #6c757d);
}
```

The component exposes `--hx-switch-track-bg`, `--hx-switch-track-checked-bg`, `--hx-switch-thumb-bg`, `--hx-switch-thumb-shadow`, `--hx-switch-focus-ring-color`, `--hx-switch-label-color`, and `--hx-switch-error-color` as documented CSS custom properties. Help text color is not exposed.

This breaks theming API consistency. Consumers who override other component colors via `--hx-switch-*` tokens cannot control the help text color without a `::part(help-text)` override, which is a higher-friction approach. The documented `@cssprop` list in the JSDoc does not mention a help text color token.

---

### A-09 — `WcSwitch` type export uses wrong prefix [P2]

**File:** `hx-switch.ts:324`

```ts
export type WcSwitch = HelixSwitch;
```

The project convention is `hx-` prefix. This alias uses `Wc` (legacy/old project naming). It should be `HxSwitch` to match conventions. All other components in the library should be audited for the same residual naming.

---

### A-10 — Storybook `size` argType key mismatches component property name [P2]

**File:** `hx-switch.stories.ts:51-60`

```ts
argTypes: {
  size: { ... }  // key is "size"
}
args: {
  size: 'md',    // key is "size"
}
// render:
hx-size=${args.size}  // maps to attribute "hx-size", property "hxSize"
```

The argType key `size` does not match the component property `hxSize` or attribute `hx-size`. CEM-driven autodocs generates controls from the manifest using property names. The manual `size` argType will conflict with or override what autodocs generates for `hxSize`, potentially showing duplicate or mismatched controls.

---

### A-11 — `Math.random()` for ID generation is non-deterministic [P2]

**File:** `hx-switch.ts:230-233`

```ts
private _switchId = `hx-switch-${Math.random().toString(36).slice(2, 9)}`;
```

Random IDs cause:

1. Snapshots and visual regression tests to fail between runs
2. SSR hydration mismatches (server-generated ID ≠ client-generated ID)
3. No guaranteed uniqueness (birthday problem, though collision is unlikely at scale)

A monotonic counter (`static _instanceCounter = 0; private _id = ++HelixSwitch._instanceCounter`) is deterministic, SSR-stable, and guaranteed unique within a session.

---

### A-12 — Keyboard test for disabled switch may be vacuous [P2]

**File:** `hx-switch.test.ts:377-386`

```ts
it('disabled switch does not toggle on keyboard', async () => {
  const el = await fixture<WcSwitch>('<hx-switch disabled></hx-switch>');
  const track = shadowQuery<HTMLElement>(el, '.switch__track');
  track?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
```

A disabled `<button>` does not receive keyboard events in real browsers — they are swallowed before reaching event listeners. Dispatching a synthetic `KeyboardEvent` directly to the element bypasses this native behavior. The test proves that `_toggle()` checks `this.disabled`, but it does not prove that a real keyboard user cannot toggle a disabled switch in a browser.

The test passes for the wrong reason: it tests the fallback guard inside `_toggle()` rather than the browser's native disabled-button keyboard blocking. A complementary test at the user level (e.g., verifying the button has `tabindex="-1"` when disabled, or verifying focus is not possible) would close this gap.

---

### A-13 — Duplicate/redundant `@event` JSDoc inside method body [P2]

**File:** `hx-switch.ts:196-200`

```ts
/**
 * Dispatched when the switch is toggled.
 * @event hx-change
 */
this.dispatchEvent(...)
```

The event is already documented in the class-level JSDoc block (line 19):

```ts
* @fires {CustomEvent<{checked: boolean, value: string}>} hx-change
```

The inline `@event` inside the method body is non-standard JSDoc syntax that CEM parsers may interpret incorrectly. It provides no additional information and risks generating duplicate entries in the Custom Elements Manifest.

---

### A-14 — `dispatches wc-change` stale screenshot artifact [P2]

**File:** `__screenshots__/hx-switch.test.ts/hx-switch-Events-dispatches-wc-change-on-toggle-1.png`

The screenshot filename references `wc-change` but the current test and component use `hx-change`. This is a stale artifact from a prior naming convention. While functionally harmless, it indicates the event was renamed at some point and these screenshots were not regenerated. The `wc-` prefix residue is visible throughout screenshot filenames for this test suite.

---

## Summary Table

| ID   | Severity | Area                      | Short Description                                                              |
| ---- | -------- | ------------------------- | ------------------------------------------------------------------------------ |
| A-01 | P0       | Accessibility             | `role="alert"` + `aria-live="polite"` contradictory — errors under-announced   |
| A-02 | P1       | Accessibility / Storybook | `NoLabel` story: `aria-label` on host does not reach shadow button             |
| A-03 | P1       | Accessibility             | Slotted label content yields unlabeled button (`hasLabel` only checks prop)    |
| A-04 | P1       | CSS / Accessibility       | No `prefers-reduced-motion` support — transitions always active                |
| A-05 | P1       | TypeScript                | `formStateRestoreCallback` missing `mode` param, wrong `state` type            |
| A-06 | P2       | Behavior                  | `Enter` key double-toggles (native button click + keydown handler) — net no-op |
| A-07 | P2       | TypeScript                | `_trackEl!` non-null assertion contradicted by defensive `?? undefined` guard  |
| A-08 | P2       | CSS                       | `--hx-switch-help-text-color` not exposed; theming API incomplete              |
| A-09 | P2       | TypeScript                | `WcSwitch` type alias uses legacy `Wc` prefix, should be `HxSwitch`            |
| A-10 | P2       | Storybook                 | `size` argType key mismatches `hxSize` property — CEM autodocs conflict risk   |
| A-11 | P2       | TypeScript                | `Math.random()` IDs non-deterministic; breaks snapshots and SSR                |
| A-12 | P2       | Tests                     | Keyboard-disabled test vacuous — tests guard code, not native browser behavior |
| A-13 | P2       | TypeScript                | Duplicate `@event` JSDoc in method body — risks duplicate CEM entries          |
| A-14 | P2       | Tests                     | Stale `wc-change` screenshot artifacts from event rename                       |

---

## Blocking Issues (must fix before merge)

1. **A-01** — `role="alert"` + `aria-live="polite"` contradiction. Remove `aria-live="polite"`.
2. **A-06** — `Enter` double-toggle bug. Either remove Enter handling (Space-only per ARIA APG) or remove the `@click` handler from the button and rely solely on `@keydown` + programmatic click.
3. **A-03** — Unlabeled button when only slotted content is used. Add `slotchange` listener for default slot.

---

## High-Value Fixes (P1 — required for WCAG 2.1 AA)

4. **A-04** — Add `@media (prefers-reduced-motion: reduce)` to `hx-switch.styles.ts`.
5. **A-05** — Correct `formStateRestoreCallback` signature.
6. **A-02** — Fix or remove `NoLabel` story; document the `aria-label` limitation.

---

## CSS Audit Fixes Applied (2026-03-12)

| Finding                                                         | Status                                                                                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-04: No `prefers-reduced-motion` support                       | **FIXED** — `@media (prefers-reduced-motion: reduce)` block disabling `.switch__track` and `.switch__thumb` transitions added to `hx-switch.styles.ts`     |
| A-08: Missing `--hx-switch-help-text-color` CSS custom property | **FIXED** — `--hx-switch-help-text-color` token applied to `.switch__help-text` in `hx-switch.styles.ts`; `@cssprop` documentation added to `hx-switch.ts` |
