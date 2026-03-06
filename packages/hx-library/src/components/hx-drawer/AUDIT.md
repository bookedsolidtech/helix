# hx-drawer Audit Report — T2-06

**Auditor:** Antagonistic Quality Review Agent
**Branch reviewed:** `feature/implement-hx-drawer-t2-slide-in`
**Files reviewed:**
- `hx-drawer.ts`
- `hx-drawer.styles.ts`
- `hx-drawer.test.ts`
- `hx-drawer.stories.ts`
- `index.ts`

---

## Severity Legend

| Severity | Meaning |
|----------|---------|
| **P0** | Showstopper — blocks merge. Missing feature or broken behavior. |
| **P1** | Major — significant accessibility, correctness, or correctness gap. Must fix before ship. |
| **P2** | Minor — quality, spec deviation, or subtle risk. Fix before release. |
| **P3** | Low — polish or informational. Fix when convenient. |

---

## P0 — Showstopper

### P0-01: Body scroll lock is not implemented

**Area:** Accessibility / Behavior
**File:** `hx-drawer.ts`

When the drawer opens, the document body continues to scroll freely. The feature specification explicitly requires scroll lock on body. The `_openDrawer()` method never sets `document.body.style.overflow = 'hidden'` (or equivalent), and `_closeDrawer()` never restores it. The test suite has no test for this behavior either.

**Impact:** Users can scroll background content while a modal dialog is open. This is a WCAG 2.1 AA failure (content obscured by non-hidden background), a poor UX, and violates the feature contract.

**Required fix:** In `_openDrawer()`, set `document.body.style.overflow = 'hidden'`. In `_closeDrawer()`, restore the previous `overflow` value (capture before mutating). Handle the `contained` mode — scroll lock should not apply when `contained=true` since the overlay is scoped to a parent element.

---

## P1 — Major

### P1-01: Duplicate `keydown` listener causes double handler invocation

**Area:** Behavior / Event handling
**File:** `hx-drawer.ts`, `_addListeners()` / `_removeListeners()`

`_addListeners()` registers `_handleKeyDown` on **both** `this._overlayEl` and `document`:

```ts
this._overlayEl?.addEventListener('keydown', this._handleKeyDown);
document.addEventListener('keydown', this._handleKeyDown);
```

Because the overlay is inside the document, `keydown` events bubble from within the overlay up to `document`. When a key is pressed anywhere inside the open drawer, `_handleKeyDown` fires **twice** — once from `_overlayEl` and once from `document`. The Escape path is protected by the `_isOpen` guard (which is set to `false` synchronously in `_closeDrawer()`), so double-Escape is not the primary risk. The Tab path, however, calls `_trapFocus` twice per keypress, potentially skipping focus elements or causing jitter.

**Required fix:** Remove the `_overlayEl` listener. Use only the `document` listener (or vice versa — but `document` is required to catch keypresses even when focus is outside the Shadow DOM).

---

### P1-02: Focus trap broken for slotted (light DOM) elements

**Area:** Accessibility / Focus management
**File:** `hx-drawer.ts`, `_trapFocus()`

`_trapFocus` determines the currently focused element as:

```ts
const shadowActive = this.shadowRoot?.activeElement;
const active = (shadowActive ?? document.activeElement) as HTMLElement | null;
```

When focus is on a slotted element (light DOM content like `<button slot="footer">`), `this.shadowRoot?.activeElement` returns the `<slot>` element (or `null` depending on browser), **not** the actual focused element. `document.activeElement` correctly returns the focused slotted element. The fallback `?? document.activeElement` only activates when `shadowRoot?.activeElement` is `null` or `undefined` — not when it returns a `<slot>` element.

This means when the user Tabs to a footer button, `active` is set to the `<slot>` element, which does not match `first` or `last` in the focusable array. The wrap-around logic never triggers and focus escapes the drawer.

**Required fix:** Always compare against `document.activeElement` for boundary detection. `shadowRoot.activeElement` is unreliable for slotted content. The check should be:

```ts
const active = document.activeElement as HTMLElement | null;
```

---

### P1-03: Background content not `aria-hidden` when drawer is open

**Area:** Accessibility
**File:** `hx-drawer.ts`

The overlay has `aria-modal="true"`, which is intended to confine screen reader users to the dialog. However, `aria-modal` has inconsistent support across screen readers (NVDA, JAWS, VoiceOver all behave differently). The robust solution, and the one required by WCAG 2.1 and ARIA Authoring Practices Guide (APG), is to set `aria-hidden="true"` on all sibling elements of the drawer when it is open, then restore them on close.

Without this, screen readers with poor `aria-modal` support will allow users to navigate to background content while the modal is open, breaking the dialog contract.

**Required fix:** On open, iterate `document.body.children` and set `aria-hidden="true"` on all siblings that are not the `hx-drawer` element itself. Restore on close.

---

### P1-04: No Drupal behaviors file

**Area:** Drupal Integration
**File:** (missing)

The feature description requires: _"Twig-renderable, JS behaviors for open/close."_ There is no `hx-drawer.behaviors.js` (or `.es6.js`) file and no Twig example template. The Drupal consumer cannot wire up open/close triggers using Drupal behaviors without this file.

**Required fix:** Create `hx-drawer.behaviors.js` implementing a Drupal behavior that:
- Finds `[data-hx-drawer-trigger]` elements
- Calls `drawerEl.show()` / `drawerEl.hide()` on click
- Handles attach/detach cleanup

---

### P1-05: Animation timeout race condition on rapid open/close

**Area:** Behavior
**File:** `hx-drawer.ts`, `_openDrawer()` / `_closeDrawer()`

Both `_openDrawer()` and `_closeDrawer()` assign to `this._animationTimeout` without clearing the previous pending timeout first:

```ts
// _openDrawer:
this._animationTimeout = setTimeout(() => {
  this.dispatchEvent(new CustomEvent('hx-after-show', ...));
}, duration);

// _closeDrawer:
this._animationTimeout = setTimeout(() => {
  this.dispatchEvent(new CustomEvent('hx-after-hide', ...));
  this._triggerElement?.focus(); // focus restored here
}, duration);
```

If `open` is flipped quickly (e.g., `show()` then `hide()` within 300ms), both timeouts are queued. The open timeout fires and dispatches `hx-after-show` **after** `hx-after-hide` has already fired. Worse, `_triggerElement` is set to `null` in the close timeout — but the open timeout's internal reference to `_triggerElement` is captured at assignment time, so focus restoration is correct. However, `hx-after-show` firing after close is misleading and may break consumers listening to event order.

**Required fix:** Call `clearTimeout(this._animationTimeout)` at the start of both `_openDrawer()` and `_closeDrawer()` before scheduling a new timeout.

---

### P1-06: Dialog has no accessible name when label slot is unpopulated

**Area:** Accessibility / ARIA
**File:** `hx-drawer.ts`, `render()`

```ts
aria-labelledby=${this._hasLabelSlot ? this._titleId : nothing}
```

When the `label` slot is empty (no `[slot="label"]` child provided), `aria-labelledby` is removed from the overlay element. The dialog then has no accessible name. Per WCAG 2.1 SC 4.1.2, interactive UI components must have an accessible name. An unlabeled dialog fails this criterion.

**Required fix:** Either (a) always render `aria-labelledby` and provide a default title like "Drawer" in the title slot fallback, or (b) add `aria-label` as a public property so callers can provide a label string when not using a visible title. The current silent omission of the attribute creates invisible accessibility failures.

---

## P2 — Minor

### P2-01: `DrawerSize | string` type collapses to `string`

**Area:** TypeScript
**File:** `hx-drawer.ts`

```ts
size: DrawerSize | string = 'md';
```

`DrawerSize` is a string union `'sm' | 'md' | 'lg' | 'full'`. The union with `string` renders the `DrawerSize` members irrelevant because `string` encompasses all of them. TypeScript cannot narrow `size` to `DrawerSize` without a type guard. IDE completions will not suggest the valid enum values.

**Required fix:** Keep `size` typed as `DrawerSize` for the property. If arbitrary CSS lengths need to be supported, document that in JSDoc and accept a separate `--hx-drawer-size` CSS custom property override, or create a distinct CSS property path. The public API should guide users toward valid values.

---

### P2-02: CSS part name `close-button` deviates from feature specification

**Area:** CSS / API
**File:** `hx-drawer.ts`, `hx-drawer.styles.ts`

The feature description specifies the CSS part as `close-btn`. The implementation exposes it as `close-button`. While `close-button` is more readable, this is a spec deviation that breaks consumers who build their styles against the documented API.

**Required fix:** Align with the specification. If the team prefers `close-button`, update the spec and all documentation before shipping.

---

### P2-03: Footer visibility relies on `hidden` attribute without CSS override

**Area:** CSS
**File:** `hx-drawer.ts`, `hx-drawer.styles.ts`

The footer's visibility is controlled by:

```ts
<div part="footer" class="drawer-footer" ?hidden=${!this._hasFooterSlot}>
```

The `hidden` attribute relies on the browser's default `[hidden] { display: none }` UA stylesheet rule. Many CSS resets (e.g., modern-normalize, Tailwind preflight) override this rule or remove it. Inside Shadow DOM the UA stylesheet still applies, so this is currently safe — but it is fragile. If any shadow-piercing reset is applied by the host page, the footer will remain visible even with `[hidden]` set.

**Required fix:** Add an explicit rule in the component styles:

```css
[hidden] { display: none !important; }
```

---

### P2-04: `_triggerElement` cast from `document.activeElement` may not be `HTMLElement`

**Area:** TypeScript
**File:** `hx-drawer.ts`, `_openDrawer()`

```ts
this._triggerElement = document.activeElement as HTMLElement | null;
```

`document.activeElement` returns `Element | null`. Casting it `as HTMLElement | null` bypasses the type system. If the active element is an `SVGElement` or `MathMLElement`, calling `.focus()` on it later (in `_closeDrawer`) may fail at runtime because SVGElement has a different `focus()` signature and behavior.

**Required fix:** Guard with `instanceof HTMLElement`:

```ts
const active = document.activeElement;
this._triggerElement = active instanceof HTMLElement ? active : null;
```

---

### P2-05: Storybook missing "nested interactive content" story

**Area:** Storybook
**File:** `hx-drawer.stories.ts`

The feature description requires a story demonstrating "nested content." The existing stories use simple `<p>` text and basic `<button>` elements. There is no story showing a form, `hx-text-input`, or other components nested inside the drawer — which is the primary real-world use case and is essential for validating focus trap behavior visually.

**Required fix:** Add a `WithForm` or `WithNestedContent` story containing at least one form with focusable inputs to demonstrate the focus trap working end-to-end in Storybook.

---

## P3 — Low

### P3-01: `firstUpdated()` slot detection is redundant

**Area:** Code quality
**File:** `hx-drawer.ts`

`firstUpdated()` sets `_hasHeaderActionsSlot`, `_hasFooterSlot`, and `_hasLabelSlot` via direct DOM queries. The `slotchange` event handlers on each slot will fire shortly after first render and override these values. The `firstUpdated` detection is effectively a redundant initialization that runs before slots have assigned nodes — it may always return `null` nodes at that point because slotting assignment happens asynchronously.

**Recommendation:** Remove the `firstUpdated()` slot detection and rely solely on `slotchange` events. Initialize the booleans to `false` (current default).

---

### P3-02: Unhandled Promise rejections in `_openDrawer()`

**Area:** Code quality
**File:** `hx-drawer.ts`

```ts
void this.updateComplete.then(() => {
  this._isOpen = true;
  ...
  void this.updateComplete.then(() => {
    ...
  });
});
```

Using `void` to discard promises suppresses any rejection silently. If `updateComplete` rejects (rare but possible during disconnection), the error is swallowed with no console output or observable failure.

**Recommendation:** Use `.catch(console.error)` or a dedicated error boundary rather than bare `void`.

---

### P3-03: Overlay `addEventListener` is effectively unreachable

**Area:** Code quality
**File:** `hx-drawer.ts`, `_addListeners()`

`this._overlayEl?.addEventListener('keydown', ...)` is called but the same handler is also on `document`. Given P1-01 above, the overlay listener should be removed entirely. Even if kept, the `?.` optional chaining means if `_overlayEl` is null (before first render), the listener is silently skipped with no error — a subtle initialization timing dependency.

---

## Test Coverage Gaps

| Behavior | Tested | Notes |
|----------|--------|-------|
| Drawer opens | Yes | |
| Drawer closes | Yes | |
| All placements | Yes | |
| Focus trap (Tab key) | **No** | P1-02 exposes correctness issue here |
| Escape closes | Yes | |
| Backdrop click closes | Yes | |
| Scroll lock on body | **No** | P0-01; feature not implemented |
| Focus returns to trigger on close | **No** | Untested |
| Background aria-hidden on open | **No** | P1-03; feature not implemented |
| Rapid open/close race | **No** | P1-05 |
| `aria-labelledby` when no label | **No** | P1-06 |
| `noHeader` + accessible name | **No** | P1-06 |

---

## Summary Table

| ID | Severity | Area | Title |
|----|----------|------|-------|
| P0-01 | P0 | Accessibility/Behavior | Body scroll lock not implemented |
| P1-01 | P1 | Behavior | Duplicate keydown listener — double handler invocation |
| P1-02 | P1 | Accessibility | Focus trap broken for slotted elements |
| P1-03 | P1 | Accessibility | Background content not `aria-hidden` when open |
| P1-04 | P1 | Drupal | No Drupal behaviors file |
| P1-05 | P1 | Behavior | Animation timeout race condition on rapid open/close |
| P1-06 | P1 | Accessibility | Dialog has no accessible name when label slot empty |
| P2-01 | P2 | TypeScript | `DrawerSize \| string` collapses to `string` |
| P2-02 | P2 | CSS/API | CSS part name `close-button` deviates from spec (`close-btn`) |
| P2-03 | P2 | CSS | Footer `hidden` attribute has no CSS override for reset safety |
| P2-04 | P2 | TypeScript | `_triggerElement` cast bypasses `HTMLElement` type guard |
| P2-05 | P2 | Storybook | No story for nested interactive content |
| P3-01 | P3 | Code quality | `firstUpdated()` slot detection is redundant |
| P3-02 | P3 | Code quality | `void` promise discards suppress rejections silently |
| P3-03 | P3 | Code quality | Overlay `addEventListener` is effectively unreachable |

**Total: 1 P0, 6 P1, 5 P2, 3 P3 — Merge BLOCKED pending P0 and P1 resolution.**
