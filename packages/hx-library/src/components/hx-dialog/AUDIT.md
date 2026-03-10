# hx-dialog — Antagonistic Quality Audit (T1-27)

**Audit date:** 2026-03-05
**Auditor:** chief-code-reviewer (T1 antagonistic pass)
**Files reviewed:**
- `hx-dialog.ts`
- `hx-dialog.styles.ts`
- `hx-dialog.test.ts`
- `hx-dialog.stories.ts`

**Severity legend:** P0 = critical/blocking, P1 = high, P2 = medium, P3 = low/cosmetic

---

## Summary

The component is architecturally sound: it uses the native `<dialog>` element, implements aria labelling, has a focus trap, handles Escape, and covers most interaction patterns. However, two P0 defects and four P1 defects create real accessibility failures that block a WCAG 2.1 AA certification. The component must not ship without addressing at minimum the P0s and the focus-restoration P1.

---

## Area 1 — TypeScript

### P2 — `ariaLabel` property shadows `ARIAMixin.ariaLabel` from `HTMLElement`

**File:** `hx-dialog.ts:113-114`

```ts
@property({ type: String, attribute: 'aria-label' })
ariaLabel = '';
```

Modern browsers implement `ARIAMixin` on `HTMLElement`, which already provides a reflected `ariaLabel` property backed by the native `aria-label` attribute. Redeclaring `ariaLabel` as a Lit `@property` creates a shadow that disconnects the Lit binding from the native ARIA reflection layer. The default value `''` means that even when no `aria-label` attribute is present, the property getter returns `''` rather than `null`, which diverges from the native contract. This can cause subtle bugs when consuming code reads `element.ariaLabel` expecting `null` on an un-attributed element.

**Recommendation:** Use `aria-label` only as a pass-through attribute to the native `<dialog>` element rather than declaring a component-level property.

### P2 — `close()` does not accept a `returnValue` parameter

**File:** `hx-dialog.ts:154-156`

```ts
close(): void {
  this.open = false;
}
```

The native `HTMLDialogElement.close(returnValue?: string)` API accepts an optional return value string that is stored as `dialog.returnValue`. The `hx-dialog` `close()` method omits this parameter entirely, breaking drop-in API compatibility with native dialog usage patterns. Consumers who rely on `returnValue` for form-method dialogs or confirmation result inspection will be unable to use this API.

**Recommendation:** Accept and forward `returnValue` to the underlying `_dialogEl.close(returnValue)` call and expose `get returnValue()`.

### P3 — `classMap` used for a fully static class

**File:** `hx-dialog.ts:413-415`

```ts
const dialogClasses = {
  dialog: true,
};
```

`classMap` is imported and used for an object with a single, unconditionally `true` key. This is equivalent to a static class string `class="dialog"` but carries the overhead of the `classMap` directive. No dynamic class logic exists or appears planned.

**Recommendation:** Replace with `class="dialog"`.

### P3 — `Math.random()` heading ID is non-deterministic

**File:** `hx-dialog.ts:68`

```ts
private readonly _headingId = `hx-dialog-heading-${Math.random().toString(36).slice(2, 9)}`;
```

`Math.random()` produces non-deterministic IDs. This is acceptable at runtime but problematic for server-side rendering, snapshot tests, and visual regression baselines (ID changes on every render cycle in some testing environments). A deterministic counter would be more robust.

**Recommendation:** Use a module-level monotonically incrementing counter: `let _counter = 0; private readonly _headingId = \`hx-dialog-heading-\${++_counter}\`;`

---

## Area 2 — Accessibility

### P0 — No focus restoration to trigger element on dialog close (WCAG 2.4.3)

**File:** `hx-dialog.ts:189-209`

`_closeDialog()` calls `dialog.close()` and removes listeners, but never restores focus to the element that opened the dialog. When a modal dialog closes, WCAG 2.1 Success Criterion 2.4.3 (Focus Order) requires focus to return to a logical location — typically the trigger that opened the dialog. Without restoration, keyboard and screen reader users lose their position in the page entirely when the dialog closes.

This is the single most well-known dialog accessibility requirement and is absent from both the implementation and the test suite.

**Recommendation:**
1. Store `document.activeElement` (or `document.activeElement as HTMLElement`) before calling `_openDialog()`.
2. In `_closeDialog()`, call `.focus()` on the stored element after the native dialog closes.

### P0 — `WithCustomHeader` Storybook story renders with no accessible name

**File:** `hx-dialog.stories.ts:256-316`

```ts
export const WithCustomHeader: Story = {
  render: () => html`
    <hx-dialog open modal>
      <div slot="header" ...>...</div>
      ...
    </hx-dialog>
  `,
```

The `hx-dialog` element has no `heading` attribute and no `aria-label` attribute. The slot content ("Critical Alert") lives in light DOM and is not referenced by `aria-labelledby`. The native `<dialog>` therefore has no accessible name. This fails WCAG 1.3.1 and 4.1.2. This story actively demonstrates incorrect usage to consumers.

**Recommendation:** Add `aria-label="Critical Alert"` to the `<hx-dialog>` element in this story.

### P1 — Initial focus after `showModal()` does not reach slotted light DOM content

**File:** `hx-dialog.ts:160-187`

`_openDialog()` calls `dialog.showModal()` and then schedules `_cachedFocusableElements` population via `updateComplete`. No explicit `.focus()` call is made. The browser's built-in `showModal()` focus delegation searches the `<dialog>` element's descendants within its own DOM tree. Because `hx-dialog` uses Shadow DOM, the `<dialog>` element is inside the shadow root. Slotted content (e.g., `<button slot="footer">`) is in the light DOM of `hx-dialog`, not in the shadow DOM subtree of the `<dialog>`. The browser's auto-focus therefore cannot reach slotted buttons — focus lands on the `<dialog>` element itself (which has no visual indicator) or is lost.

Screen reader users pressing Tab after dialog opens will not be moved to the first interactive element.

**Recommendation:** After `updateComplete`, explicitly call `this._cachedFocusableElements[0]?.focus()` to place initial focus on the first focusable element inside the dialog.

### P1 — Body scroll is not locked when modal dialog is open

**File:** `hx-dialog.ts:160-187`

`showModal()` places the `<dialog>` in the browser's top layer, which prevents interaction with content below via pointer. However, it does NOT prevent body scrolling. The underlying page content is still scrollable via keyboard (`Space`, arrow keys) or mouse wheel while the modal is open. This is a focus management and cognitive accessibility issue: users can scroll the background context out of view while a modal is supposedly blocking it.

**Recommendation:** In `_openDialog()`, set `document.body.style.overflow = 'hidden'`. In `_closeDialog()`, restore `document.body.style.overflow = ''`. Alternatively, add a class to `document.body` that applies `overflow: hidden`.

### P1 — Non-modal backdrop z-index creates stacking conflict with dialog content

**File:** `hx-dialog.styles.ts:73-81`

```css
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background-color: var(--hx-dialog-backdrop-color, ...);
  opacity: var(--hx-dialog-backdrop-opacity, 0.5);
  z-index: var(--hx-z-index-modal);
}
```

The `.dialog-backdrop` element is a sibling of the `<dialog>` element inside the shadow root (see `_renderNonModalBackdrop()`). It has `position: fixed` with `z-index: var(--hx-z-index-modal)`. The `.dialog` container div inside `<dialog>` has `position: relative` with no explicit `z-index`. Since both elements exist in the same stacking context (the shadow root), and the backdrop has a concrete numeric z-index while the dialog content has `z-index: auto`, the backdrop will render ABOVE the dialog content if `--hx-z-index-modal` is any positive integer. The non-modal dialog content would be obscured by its own backdrop.

The DOM render order (backdrop first, then `<dialog>`) provides protection only when both elements have `z-index: auto`. The moment `--hx-z-index-modal` is set, the stacking breaks.

**Recommendation:** The `.dialog-backdrop` z-index should be lower than the z-index applied to the `.dialog` container, or the `.dialog` container should have `z-index: calc(var(--hx-z-index-modal) + 1)`.

### P2 — `aria-describedby` not implemented

**File:** `hx-dialog.ts:419-432`

The native `<dialog>` element has no `aria-describedby` link to the body content. ARIA Authoring Practices Guide recommends that dialog body text providing additional context be linked to the dialog via `aria-describedby` so that screen readers announce the description when the dialog receives focus. This is especially important in healthcare contexts where dialogs surface critical clinical information.

**Recommendation:** Add an optional `description` property. If provided, render a visually-hidden `<span id="${_descriptionId}">` and wire `aria-describedby` on the native `<dialog>`.

### P2 — No `role="alertdialog"` variant

**File:** `hx-dialog.ts`, `hx-dialog.stories.ts`

The component has no mechanism to render as `role="alertdialog"`. Alert dialogs require `role="alertdialog"` (not `dialog`) for screen readers to announce them as urgent, requiring immediate attention. Healthcare use cases like drug interaction warnings, critical lab alerts, and discharge confirmations all qualify as alert dialogs. The native `<dialog>` element exposes `role="dialog"` implicitly; the component must override this for the alert variant.

**Recommendation:** Add a `variant` property (`'dialog' | 'alertdialog'`) and set `role=${this.variant}` on the native `<dialog>` element. Add a corresponding Storybook story and tests.

---

## Area 3 — Tests

### P1 — No test for focus restoration on dialog close

**File:** `hx-dialog.test.ts`

No test verifies that focus returns to the triggering element after the dialog closes. Since focus restoration is absent from the implementation (see P0 finding), there is no test to catch a regression when it is added.

**Recommendation:** Add a test: create a trigger button, click it to open the dialog, close the dialog, and assert `document.activeElement === triggerBtn`.

### P1 — No test for initial focus after dialog open

**File:** `hx-dialog.test.ts`

No test verifies that focus is placed on the first focusable element inside the dialog when it opens. The existing focus-trap tests manually call `focus()` before dispatching Tab events; they do not verify where focus lands on open.

**Recommendation:** Add a test: open dialog with slotted buttons, await `updateComplete`, assert `document.activeElement` is the first slotted button.

### P2 — No test for `role="alertdialog"` variant

The alertdialog variant is not tested because it is not implemented, but this gap should be documented and addressed when the variant is added.

### P2 — No test for form submission inside dialog

**File:** `hx-dialog.test.ts`

The feature brief requires testing a form inside the dialog. No such test exists. A form inside a shadow-DOM dialog with a submit button should fire the `submit` event and should not close the dialog unless explicitly handled.

**Recommendation:** Add a test fixture with `<form>` inside the dialog body. Submit the form. Verify dialog remains open and `submit` event fired.

### P2 — Axe tests do not cover `WithCustomHeader` usage pattern

**File:** `hx-dialog.test.ts:409-427`

The two axe-core tests cover closed state and open-with-heading state. Neither test covers the custom header slot usage without an `aria-label` — the pattern demonstrated incorrectly in the `WithCustomHeader` story. A third axe test using a custom header slot without `aria-label` would have caught the P0 story bug.

---

## Area 4 — Storybook

### P0 — (Cross-reference) `WithCustomHeader` story produces unlabelled dialog

See Accessibility finding P0 above. The story is an accessibility failure that will be surfaced in automated a11y CI checks.

### P2 — No `alertdialog` story

No story demonstrates `role="alertdialog"` for urgent clinical alerts. This variant is required by the audit brief.

### P2 — No form-inside-dialog story

No story demonstrates a form inside the dialog (e.g., patient intake fields, date picker, MRN confirmation). The `DangerConfirmation` story has a single `<input>` inline but is not presented as a form-dialog pattern.

### P2 — No close button story / close button part absent

The audit brief lists `close-button` as a required CSS part. The component has no built-in close button and no `close-button` CSS part. Consumers cannot restyle a close button that does not exist. The `TriggerButton` story pattern requires consumers to wire the close action themselves with no structural guidance.

### P3 — Storybook story event handlers use fragile `closest()` traversal

**File:** `hx-dialog.stories.ts:408`, `hx-dialog.stories.ts:436`

```ts
const host = (e.target as HTMLElement).closest('div');
const dialog = host?.querySelector('hx-dialog');
```

This traversal breaks if the button is nested in an additional `<div>`. A direct reference to the `<hx-dialog>` element via `canvasElement.querySelector` is more robust.

### P3 — `TriggerButton` story does not demonstrate focus restoration

The trigger button story opens the dialog correctly but closing the dialog (via Cancel button) does not return focus to `#open-dialog-btn`. This reinforces the missing focus-restoration pattern to consumers.

---

## Area 5 — CSS

### P1 — (Cross-reference) Non-modal backdrop z-index stacking conflict

See Accessibility finding P1. CSS defect is in `hx-dialog.styles.ts:80`.

### P2 — `dialog::backdrop` in shadow DOM has limited cross-browser support

**File:** `hx-dialog.styles.ts:57-71`

The `dialog::backdrop` pseudo-element styled inside a Shadow DOM `<style>` block is well-supported in Chrome/Chromium but had limited or no support in Firefox (versions < 122) for shadow-scoped `::backdrop` targeting. If the target browser matrix includes Firefox < 122, backdrop animation will silently fail and no error will surface. The non-modal backdrop fallback is implemented correctly but modal mode relies entirely on `::backdrop`.

**Recommendation:** Document the supported browser matrix for `::backdrop` and add a note in component JSDoc.

### P2 — `::backdrop` opacity animation does not use composite `opacity` property path

**File:** `hx-dialog.styles.ts:57-65`

```css
dialog::backdrop {
  background-color: var(...);
  opacity: 0;
  transition: opacity var(--hx-duration-200, 200ms) var(--hx-ease-out, ease-out);
}

dialog[open]::backdrop {
  opacity: var(--hx-dialog-backdrop-opacity, 0.5);
}
```

Animating `opacity` on `::backdrop` is compositor-friendly, but the `background-color` is set as a static value. If a consumer overrides `--hx-dialog-backdrop-opacity` to `0`, the backdrop becomes invisible but still blocks pointer events (it is a full-viewport fixed overlay). This creates an invisible click-blocking layer.

**Recommendation:** Document that `--hx-dialog-backdrop-opacity: 0` creates an invisible interaction barrier. Consider using `pointer-events: none` when opacity is 0.

### P3 — Unused `@state _hasHeaderSlot` flag updated in `firstUpdated` but not in `slotchange`

**File:** `hx-dialog.ts:56-57, 120-121`

`_hasHeaderSlot` is initialized from a `querySelector` in `firstUpdated`. The `header` slot's `@slotchange` handler also updates it. However, `firstUpdated` runs before slots can fire `slotchange` in some test environments (particularly in Vitest browser mode). The two code paths are redundant and the `querySelector` approach in `firstUpdated` is the fallback. This is not a bug in production but creates inconsistency in initialization order.

---

## Area 6 — Performance

### P3 — No findings

Bundle size is expected to be within the <5KB budget. The component has minimal imports (Lit core, classMap directive, token styles). No issues identified.

---

## Area 7 — Drupal Integration

### P2 — No Twig template example or documented Drupal behavior pattern

The component accepts all configuration via attributes (`heading`, `open`, `modal`, `close-on-backdrop`) which are Twig-renderable. However, the trigger-button interaction pattern requires JavaScript (`showModal()` / `close()`). No Drupal behavior (`Drupal.behaviors.hxDialog`) is documented or provided. In a Drupal CMS context, consumers need a clear pattern for wiring trigger buttons via Drupal behaviors rather than inline event listeners.

**Recommendation:** Add a Drupal integration note to the JSDoc or docs site covering:
1. Rendering `<hx-dialog>` with Twig attributes
2. A minimal `Drupal.behaviors.hxDialog` snippet for trigger-button wiring
3. Focus restoration pattern using `document.activeElement` before calling `showModal()`

---

## Defect Register

| ID | Severity | Area | Title |
|----|----------|------|-------|
| D1 | P0 | A11y | No focus restoration to trigger on dialog close (WCAG 2.4.3) |
| D2 | P0 | Storybook | `WithCustomHeader` story renders unlabelled dialog |
| D3 | P1 | A11y | Initial focus after `showModal()` does not reach slotted light DOM content |
| D4 | P1 | A11y | Body scroll not locked when modal dialog is open |
| D5 | P1 | CSS | Non-modal backdrop z-index renders over dialog content |
| D6 | P1 | Tests | No test for focus restoration on dialog close |
| D7 | P1 | Tests | No test for initial focus after dialog open |
| D8 | P2 | A11y | `aria-describedby` not implemented |
| D9 | P2 | A11y | No `role="alertdialog"` variant |
| D10 | P2 | TypeScript | `ariaLabel` property shadows `ARIAMixin.ariaLabel` |
| D11 | P2 | TypeScript | `close()` does not accept `returnValue` parameter |
| D12 | P2 | Tests | No test for `role="alertdialog"` variant |
| D13 | P2 | Tests | No test for form submission inside dialog |
| D14 | P2 | Tests | Axe tests do not cover custom header without `aria-label` |
| D15 | P2 | Storybook | No `alertdialog` story |
| D16 | P2 | Storybook | No form-inside-dialog story |
| D17 | P2 | Storybook | No close button / `close-button` CSS part absent |
| D18 | P2 | CSS | `dialog::backdrop` shadow DOM support limited below Firefox 122 |
| D19 | P2 | CSS | `::backdrop` at `opacity: 0` creates invisible pointer-blocking layer |
| D20 | P2 | Drupal | No Twig example or Drupal behaviors pattern documented |
| D21 | P3 | TypeScript | `Math.random()` heading ID is non-deterministic |
| D22 | P3 | TypeScript | `classMap` used for static-only class |
| D23 | P3 | Storybook | Story event handlers use fragile `closest()` traversal |
| D24 | P3 | Storybook | `TriggerButton` story does not demonstrate focus restoration |

---

## Verdict

**DO NOT SHIP** in current state. Two P0 defects (focus restoration, inaccessible demo story) and five P1 defects must be resolved before this component can meet the WCAG 2.1 AA healthcare mandate.

Minimum viable ship requires resolving: D1, D2, D3, D4, D5, D6, D7.
