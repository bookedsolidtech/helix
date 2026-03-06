# AUDIT: hx-accordion — Antagonistic Quality Review (T1-17)

**Date:** 2026-03-05
**Reviewer:** Antagonistic audit — assume every line is wrong until proven correct
**Files reviewed:**
- `hx-accordion.ts`
- `hx-accordion-item.ts`
- `hx-accordion.styles.ts`
- `hx-accordion-item.styles.ts`
- `hx-accordion.test.ts`
- `hx-accordion.stories.ts`
- `index.ts`

---

## Summary

| Severity | Count |
|----------|-------|
| P0 (Blocking/Broken) | 2 |
| P1 (High Priority) | 5 |
| P2 (Medium/Low) | 7 |

---

## P0 — Blocking / Broken

### P0-1: `_handleToggle` calls `e.preventDefault()` on a non-cancellable event

**File:** `hx-accordion-item.ts:104-107`

```ts
private _handleToggle(e: Event): void {
  // Prevent native <details> toggle from controlling state — Lit manages it
  e.preventDefault();
}
```

**Problem:** The `toggle` event on `<details>` is not cancellable (`cancelable: false`). Calling `e.preventDefault()` has zero effect — the browser's internal state machine has already flipped the `<details open>` attribute before the event fires. The comment claims this "prevents native `<details>` toggle from controlling state" which is factually wrong.

**Impact:** Between the user interaction and the next Lit render cycle there is a brief window where the shadow DOM `<details open>` attribute is out of sync with `this.expanded`. Screen readers polling state during this window will announce incorrect open/closed state. Additionally, this creates silent technical debt — future developers will rely on the comment and be confused when the toggle behavior cannot be suppressed.

**Evidence:** MDN: "The toggle event is not cancelable."

---

### P0-2: Single-mode sibling collapse does not dispatch `hx-collapse` events

**File:** `hx-accordion.ts:61-64`

```ts
items.forEach((item) => {
  if (item !== expandedItem && item.expanded) {
    item.expanded = false;  // direct property mutation, no event
  }
});
```

**Problem:** When an item is closed by the single-expand coordinator, `item.expanded` is set to `false` directly. The `_toggle()` method — which is the only code path that dispatches `hx-collapse` — is never called. Consumers listening for `hx-collapse` on accordion items will never receive this event for programmatic collapses.

**Impact:** Broken event contract. Any consumer wiring up a `hx-collapse` listener (e.g., a Drupal behavior that saves collapse state to session storage, or a parent component managing sidebar layout) will silently miss every single-mode sibling collapse. The event system is advertised in the CEM and JSDoc but does not fire for a significant portion of actual collapse operations.

---

## P1 — High Priority

### P1-1: Arrow key navigation between items not implemented

**File:** `hx-accordion.ts` (entirely absent), `hx-accordion-item.ts:97-102`

**Problem:** The ARIA APG Accordion pattern (https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) requires:
- `Down Arrow` — moves focus to the next accordion header
- `Up Arrow` — moves focus to the previous accordion header
- `Home` — moves focus to the first accordion header
- `End` — moves focus to the last accordion header

The current implementation handles only `Enter` and `Space` on individual items. `hx-accordion.ts` has no keyboard event handling at all.

**Impact:** WCAG 2.1 SC 2.1.1 (Keyboard) violation. Healthcare enterprise apps frequently require keyboard-only operation (motor disability accommodations, clinical workstation workflow). Keyboard-only users must Tab through all interactive elements on the page to move between accordion headers rather than using arrow keys.

---

### P1-2: Double opacity on disabled items — computed opacity 0.25

**File:** `hx-accordion-item.styles.ts:45-48` and `hx-accordion-item.styles.ts:104-107`

```css
/* Rule 1: opacity 0.5 on the item class inside host */
.item--disabled .trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Rule 2: opacity 0.5 on the host element itself */
:host([disabled]) {
  pointer-events: none;
  opacity: 0.5;
}
```

**Problem:** Both rules apply simultaneously to a disabled item. CSS opacity is multiplicative: `0.5 × 0.5 = 0.25`. The trigger text renders at 25% opacity — far below the WCAG 1.4.3 minimum contrast ratio. This is likely unintentional; the developer probably added the host rule later and forgot the existing `.item--disabled .trigger` rule.

**Impact:** WCAG 2.1 SC 1.4.3 (Contrast Minimum) failure. Disabled items in a healthcare UI may display critical information (e.g., "Restricted: Requires elevated access") that clinicians need to read even if they cannot interact with it.

---

### P1-3: Disabled items remain keyboard-focusable

**File:** `hx-accordion-item.styles.ts:104-107`, `hx-accordion-item.ts:54-56`

```css
:host([disabled]) {
  pointer-events: none;  /* blocks mouse only */
  opacity: 0.5;
}
```

```ts
private _toggle(): void {
  if (this.disabled) return;  /* prevents toggle, but focus still arrives */
```

**Problem:** `pointer-events: none` only blocks pointer (mouse/touch) events — it does not remove the `<summary>` element from the tab order. A keyboard user can still Tab to a disabled accordion header and press Enter/Space. The `_toggle()` guard correctly prevents the state change, but the user receives no feedback: focus arrives, Enter does nothing, no error message, no indication the item is disabled. There is no `tabindex="-1"` on the summary or similar mechanism.

**Impact:** Confusing keyboard UX. WCAG 2.1 SC 4.1.3 (Status Messages) — no status message or ARIA live region indicates why the item is non-interactive.

---

### P1-4: Initial multiple-expanded items in single mode not resolved on connect

**File:** `hx-accordion.ts:43-46`

```ts
override connectedCallback(): void {
  super.connectedCallback();
  this.addEventListener('hx-expand', this._handleChildExpand as EventListener);
}
```

**Problem:** The single-expand coordinator only fires when an `hx-expand` event is received from a user interaction. If the author declares two items with `expanded` attribute in single mode:

```html
<hx-accordion mode="single">
  <hx-accordion-item expanded>Item 1</hx-accordion-item>
  <hx-accordion-item expanded>Item 2</hx-accordion-item>
</hx-accordion>
```

Both items remain expanded indefinitely — single mode is never enforced. No `hx-expand` events fire during initial render (correct — they're initialization, not user events), so `_handleChildExpand` never runs, and no resolution occurs.

**Impact:** The mode contract is silently violated. Declarative usage (including Drupal Twig templates where attributes are set at render time) will produce broken single-mode behavior that is invisible until a user clicks.

---

### P1-5: `aria-expanded` is redundant on `<summary>` and creates sync risk

**File:** `hx-accordion-item.ts:146`

```ts
<summary
  aria-expanded=${this.expanded ? 'true' : 'false'}
  ...
>
```

**Problem:** The `<summary>` element already has an implicit ARIA role of `button` and the browser automatically exposes `aria-expanded` based on the parent `<details open>` attribute. Setting `aria-expanded` explicitly:

1. Creates a second source of truth that must stay synchronized with `<details open>`
2. During the window where `_handleToggle`'s non-functional `preventDefault()` runs (see P0-1), the explicit `aria-expanded` from the previous render may disagree with the browser-computed `aria-expanded` from the native `<details>` state — producing conflicting signals to AT

Per ARIA spec, authors should not use `aria-expanded` on elements that natively communicate expansion state. The explicit attribute is valid as a belt-and-suspenders cross-browser measure, but it must be acknowledged as a risk.

---

## P2 — Medium / Low Priority

### P2-1: Inline SVG chevron recreated in every `render()` call

**File:** `hx-accordion-item.ts:118-133`

```ts
override render() {
  const chevronIcon = svg`<svg ...>...</svg>`;  // new TemplateResult each call
```

**Problem:** The chevron SVG is declared inside `render()`. While Lit's template caching means the DOM is not re-cloned, a new `SVGTemplateResult` object is allocated on every render cycle. For a component that may render dozens of times per session (every expand/collapse triggers an update), this is unnecessary object churn.

**Fix direction:** Declare `chevronIcon` as a static class property or module-level constant.

---

### P2-2: CSS `:not(.item--disabled .trigger)` relies on CSS Selectors Level 4

**File:** `hx-accordion-item.styles.ts:50-52`

```css
.trigger:hover:not(.item--disabled .trigger) {
  background-color: var(--hx-accordion-trigger-hover-bg, ...);
}
```

**Problem:** Complex selector arguments to `:not()` (containing descendant combinators) are a CSS Selectors Level 4 feature. Support: Chrome 105+, Firefox 121+, Safari 15.4+. In older browsers, this selector is silently dropped — the hover style then applies to ALL triggers including disabled ones, giving false interactive affordance to disabled items.

**Alternative:** Use `:host(:not([disabled])) .trigger:hover` which works in all browsers that support shadow DOM.

---

### P2-3: No automated accessibility (axe-core) tests

**File:** `hx-accordion.test.ts`

**Problem:** The test file has 23 tests covering rendering, events, keyboard, and ARIA attributes. However, there are no automated axe-core runs that would catch violations holistically. The existing tests check specific attribute values in isolation — they would not catch, for example, a color contrast failure introduced by the double-opacity bug (P1-2) or a missing landmark label.

**Impact:** A11y regressions can ship without any test failing. Healthcare mandate requires zero WCAG violations.

---

### P2-4: `itemId` defaults to empty string — weak event identity

**File:** `hx-accordion-item.ts:60`

```ts
const detail = { expanded: willExpand, itemId: this.id || '' };
```

**Problem:** When no `id` is set on `<hx-accordion-item>`, `itemId` in the event detail is `''`. Consumers cannot distinguish between multiple un-identified items. The event type (`hx-expand` vs. `hx-collapse`) tells you what happened, but not to which item.

**Impact:** Consumers cannot implement features like "remember which items were open" without requiring `id` attributes on every item — an undocumented and unenforced requirement.

---

### P2-5: CSS part naming diverges from feature spec and common patterns

**File:** `hx-accordion-item.ts`, feature spec

**Specified (feature description):** `header`, `panel`, `icon`
**Actual parts:** `item` (on `<details>`), `trigger` (on `<summary>`), `content` (on content div), `icon` (on icon span)

**Problem:** `trigger` vs. `header` and `content` vs. `panel` — the external theming API uses names that differ from the feature spec and from the common accordion pattern naming used by Shoelace, Spectrum, and FAST. Consumers migrating from other component libraries will find the CSS parts unfamiliar.

**Note:** The `item` part on the `<details>` element is also surprising — it styles the details wrapper, which is an implementation detail. Exposing it risks consumers writing styles that break if the internal structure changes.

---

### P2-6: No story demonstrating icon-in-header usage

**File:** `hx-accordion.stories.ts`

**Problem:** The feature spec calls for "icons in headers" as a story requirement. All existing stories use plain `<span slot="trigger">` text. No story demonstrates mixing an icon SVG (or `<hx-icon>`) with trigger text, which is a common real-world pattern in healthcare UIs (e.g., a warning icon next to "Medication Alerts").

---

### P2-7: Test suite lacks coverage for animation and single-mode initial state

**File:** `hx-accordion.test.ts`

**Missing tests:**
1. **CSS grid animation** — no test verifies that `content-wrapper` transitions between `grid-template-rows: 0fr` and `1fr`. The animation is pure CSS and cannot be broken by TypeScript, but a regression that removes `.item--expanded` class would silently break it.
2. **Single mode with two pre-expanded items** — no test exercises the declarative case described in P1-4. This test would fail today, confirming the bug.
3. **`hx-collapse` is NOT fired for siblings collapsed in single mode** — no test asserts this. Given that it's the correct behavior per P0-2, a test should either enforce the current (broken) behavior and be marked as a known issue, or be written to enforce correct behavior (event should fire).

---

## Drupal Compatibility Notes

The component is Drupal-renderable. Both slots (`trigger` and default) accept arbitrary HTML and are compatible with Twig output. The `hx-expand`/`hx-collapse` events bubble and compose through the shadow boundary and are capturable by Drupal behaviors. No Twig template or behavior file is required at the component level.

**Risk:** The initial multi-expanded bug (P1-4) is especially impactful for Drupal because Twig templates typically set attributes declaratively at render time, with no opportunity for JavaScript to intervene before paint.

---

## Conclusion

The component has a solid architectural foundation — the CSS grid animation technique, Shadow DOM encapsulation, and Lit property/attribute reflection are all implemented correctly. The `hx-accordion`/`hx-accordion-item` composition pattern is clean. However, two P0 bugs (`_handleToggle` semantics and silent single-mode collapses) undermine the event contract, and the missing arrow-key navigation (P1-1) is a WCAG compliance issue that blocks enterprise healthcare use. These must be resolved before ship.
