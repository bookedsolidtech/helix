# AUDIT: hx-overflow-menu (T2-11)

Antagonistic quality review of all files in `packages/hx-library/src/components/hx-overflow-menu/`.

Files reviewed:

- `hx-overflow-menu.ts`
- `hx-overflow-menu.styles.ts`
- `hx-overflow-menu.test.ts`
- `hx-overflow-menu.stories.ts`
- `index.ts`

---

## Summary

| Severity | Count |
| -------- | ----- |
| P0       | 1     |
| P1       | 3     |
| P2       | 10    |

---

## P0 — Critical (Blocking)

### P0-01: Missing arrow-key navigation within the menu panel

**File:** `hx-overflow-menu.ts:179–189`

The `_handleKeydown` handler only responds to `Escape` and `Tab`. It does not implement Up/Down arrow key navigation between `[role="menuitem"]` elements.

The WAI-ARIA Authoring Practices for the [Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) mandates:

- `ArrowDown` — move focus to the next menu item; wrap from last to first.
- `ArrowUp` — move focus to the previous menu item; wrap from first to last.
- `Home` — move focus to the first menu item.
- `End` — move focus to the last menu item.

Without these, keyboard-only users and screen reader users cannot navigate the open menu in the expected manner. Screen readers announce the container as `role="menu"`, leading users to expect standard menu keyboard behavior that is not present.

**Impact:** WCAG 2.1 SC 2.1.1 (Keyboard) failure. Healthcare mandate violation.

---

## P1 — High Priority

### P1-01: `aria-haspopup="true"` should be `aria-haspopup="menu"`

**File:** `hx-overflow-menu.ts:259`

```ts
aria-haspopup="true"
```

ARIA 1.2 specifies that `aria-haspopup` should use the role token of the popup — `"menu"`, `"listbox"`, `"tree"`, `"grid"`, or `"dialog"`. Using `"true"` is the legacy ARIA 1.0 form, which browsers treat as equivalent to `"menu"`, but:

1. Automated accessibility auditors (axe, WAVE, ARC) flag `"true"` as imprecise in strict-mode configurations.
2. The value is semantically misleading to developers reading the markup.
3. The companion test at `hx-overflow-menu.test.ts:162` asserts `'true'`, which will pass the wrong value.

**Fix:** Change to `aria-haspopup="menu"`.

---

### P1-02: Trigger accessible label is hardcoded — no customization property

**File:** `hx-overflow-menu.ts:257`

```ts
aria-label="More actions"
```

The feature spec states: _"trigger button has accessible label ('More options' or custom)"_. There is no `label` property on the component, making the accessible name non-overridable from the consuming template. In a healthcare application, the same overflow menu may appear in multiple contexts (patient row, appointment row, document row), each requiring a unique accessible label so screen reader users can distinguish repeated controls on the page.

WCAG 2.4.6 (Headings and Labels) and 2.4.9 (Link Purpose) are at risk when identical labels are used for different controls.

**Fix:** Add a `label` property (defaulting to `"More actions"`) that is reflected to `aria-label`.

---

### P1-03: `@floating-ui/dom` is bundled, not externalized — bundle budget exceeded

**File:** `vite.config.ts` (library root), `packages/hx-library/package.json`

The `rollupOptions.external` array externalizes `lit`, `@lit/*`, and `@helix/tokens` but does **not** externalize `@floating-ui/dom`. The library lists it as a `dependency`, not a `peerDependency`. This means the entire `@floating-ui/dom` package (~5.4 KB min+gz as of v1.7.x) is bundled into the `hx-overflow-menu` component chunk.

The project budget is **< 5 KB per component min+gz**. `@floating-ui/dom` alone reaches that limit before any component code is included. This is an automatic budget violation.

Additionally, if any other future component also uses `@floating-ui/dom`, it will be duplicated in each component chunk rather than shared.

**Fix:** Move `@floating-ui/dom` to `peerDependencies` and add it to `rollupOptions.external`.

---

## P2 — Medium Priority

### P2-01: No tests for disabled menu items

**File:** `hx-overflow-menu.test.ts`

The feature spec explicitly lists "disabled items" as a required test case. No test exists that:

- Renders a menu item with the `disabled` attribute.
- Verifies the item is not focusable or clickable.
- Verifies `hx-select` is NOT dispatched when a disabled item is interacted with.

The current `_handleSlotClick` handler does not check for disabled state on the clicked item — it will emit `hx-select` even for a `disabled` button.

---

### P2-02: No test for clicking outside to close the panel

**File:** `hx-overflow-menu.test.ts`

The document-level capture click listener (`_handleDocumentClick`) is a key behavior with no test coverage. No test verifies that clicking outside the component closes the panel.

---

### P2-03: No test that Escape returns focus to the trigger button

**File:** `hx-overflow-menu.test.ts:258–278`

The Escape test verifies `panel` becomes `null` after the event but does not assert that focus is returned to the trigger button (`[part="button"]`). The implementation does attempt to restore focus (`line 184`), but this is untested.

---

### P2-04: `hx-hide` event missing bubbles/composed test

**File:** `hx-overflow-menu.test.ts`

`hx-show` has a test asserting `bubbles: true` and `composed: true` (lines 212–223). `hx-hide` has no equivalent test. Both events dispatch with identical flags; the asymmetry is a gap.

---

### P2-05: `bind(this)` called in `connectedCallback` — fragile lifecycle pattern

**File:** `hx-overflow-menu.ts:89–95`

```ts
override connectedCallback(): void {
  super.connectedCallback();
  this._handleDocumentClick = this._handleDocumentClick.bind(this);
  this._handleKeydown = this._handleKeydown.bind(this);
  document.addEventListener('click', this._handleDocumentClick, true);
  this.addEventListener('keydown', this._handleKeydown);
}
```

Calling `.bind(this)` inside `connectedCallback` replaces the instance method reference on every connection. This creates a new function object on each connect/disconnect cycle. Consequences:

1. In frameworks that move elements in the DOM (e.g., Lit server rendering, portals), `connectedCallback` fires multiple times, creating multiple distinct bound references. The `removeEventListener` in `disconnectedCallback` removes only the most recent binding — previous bindings are leaked on `document`.
2. The pattern is fragile; the conventional approach is arrow-function class fields or binding in the constructor.

---

### P2-06: Redundant `cursor: not-allowed` on `.trigger[disabled]`

**File:** `hx-overflow-menu.styles.ts:46–48`

```css
.trigger[disabled] {
  cursor: not-allowed;
}
```

`:host([disabled])` already applies `pointer-events: none`, which prevents any pointer events from reaching the trigger element. The `cursor: not-allowed` rule on the inner button is therefore unreachable — the browser will show the default cursor (or whatever the host cursor is) because pointer events never reach the button. The rule is dead code.

---

### P2-07: `outline-offset: -2px` on slotted focus-visible items

**File:** `hx-overflow-menu.styles.ts:111–116`

```css
::slotted([role='menuitem']:focus-visible) {
  outline-offset: -2px;
}
```

A negative `outline-offset` draws the focus ring inside the element's border box. On menu items with opaque backgrounds this is usually invisible on the top/bottom where items share the same background, making the focus indicator less perceivable. WCAG 2.1 SC 1.4.11 (Non-text Contrast) requires focus indicators to have a 3:1 contrast ratio against adjacent colors. An inset outline that is obscured by adjacent items may not meet this threshold. The standard pattern for menu items is `outline-offset: 0` (flush) or positive offset.

---

### P2-08: CSS part names diverge from feature specification

**Files:** `hx-overflow-menu.ts:22–23`, feature spec

The feature spec lists the expected CSS parts as `trigger` and `menu`. The implementation exposes `button` and `panel`:

```ts
@csspart button - The trigger icon button element.
@csspart panel - The floating menu panel container.
```

This is a public API surface (CSS parts are part of the component contract) and a naming mismatch against the spec. Consumer stylesheets written to `::part(trigger)` or `::part(menu)` will silently have no effect.

---

### P2-09: Missing Storybook story — menu items with icon content

**File:** `hx-overflow-menu.stories.ts`

The feature spec requires: _"Storybook — standard overflow menu, with icons, in table row context"_. The `PatientRowActions` story covers the table row context. However, there is no story showing menu items with leading icon content (e.g., SVG icons or `hx-icon` elements inside `[role="menuitem"]`). All existing stories use text-only menu items. This is a spec gap.

---

### P2-10: No Drupal integration documentation or Twig example

**File:** (absent)

The feature spec requires Drupal compatibility: _"Twig-renderable"_. No Twig template, Drupal behavior, or Drupal-specific usage documentation exists anywhere in the component directory. While the web component itself is usable from Twig as a custom element, the non-standard attribute `hx-size` (using the `hx-` prefix for a property attribute rather than a boolean/value attribute) could confuse Drupal integrators unfamiliar with the convention. A Twig usage example in the component README or Starlight docs would satisfy this requirement.

---

## Passing Areas (for completeness)

| Area                                              | Status | Notes                                               |
| ------------------------------------------------- | ------ | --------------------------------------------------- |
| TypeScript strict — no `any`                      | PASS   | No `any` types found                                |
| Placement property typed                          | PASS   | Full 12-value union type                            |
| Icon property typed                               | PASS   | `'vertical' \| 'horizontal'`                        |
| Size property typed                               | PASS   | `'sm' \| 'md' \| 'lg'`                              |
| Trigger `aria-label` present                      | PASS   | Hardcoded but present (see P1-02)                   |
| Panel `role="menu"`                               | PASS   |                                                     |
| `aria-expanded` reflects state                    | PASS   |                                                     |
| Escape closes panel                               | PASS   | Tested                                              |
| Tab closes panel                                  | PASS   | Tested                                              |
| Focus moves to first item on open                 | PASS   | `_focusFirstItem()`                                 |
| `hx-show` / `hx-hide` / `hx-select` events        | PASS   | All three dispatched correctly                      |
| `@csspart button` and `@csspart panel` documented | PASS   | JSDoc present                                       |
| All `--hx-*` token usage                          | PASS   | No hardcoded colors/spacing outside fallback values |
| Reduced motion media query                        | PASS   | Transition disabled                                 |
| axe-core tests (closed, open, disabled)           | PASS   | Three scenarios covered                             |
| Storybook autodocs                                | PASS   | `tags: ['autodocs']` present                        |
| Storybook controls for all public props           | PASS   | placement, size, disabled, icon all have controls   |
| Table row context story                           | PASS   | `PatientRowActions`                                 |
| Shadow DOM encapsulation                          | PASS   |                                                     |
| `index.ts` re-export                              | PASS   |                                                     |
| `declare global` block                            | PASS   | `HTMLElementTagNameMap` extended                    |
| Event listeners cleaned up on disconnect          | PASS   | `disconnectedCallback` removes both listeners       |
