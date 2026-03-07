# AUDIT: hx-action-bar — T3-07 Antagonistic Quality Review

**Reviewer:** Automated antagonistic audit agent
**Date:** 2026-03-06
**Scope:** All files in `packages/hx-library/src/components/hx-action-bar/`
**Mandate:** Document defects only. Do NOT fix.

---

## Summary

| Severity     | Count  |
| ------------ | ------ |
| P0 (Blocker) | 2      |
| P1 (High)    | 8      |
| P2 (Medium)  | 8      |
| **Total**    | **18** |

---

## P0 — Blockers

### P0-01: `overflow` slot is permanently hidden — documented API that is non-functional

**File:** `hx-action-bar.ts:202`

```html
<div class="section section--overflow" hidden>
  <slot name="overflow" @slotchange="${this._handleSlotChange}"></slot>
</div>
```

The `overflow` slot is declared in the JSDoc (`@slot overflow — Actions hidden in an overflow menu when space is limited`) and will appear in the CEM, but the wrapper `<div>` has `hidden` unconditionally set with no code to ever remove it. There is no `ResizeObserver`, no overflow detection, and no logic to reveal this slot. Any consumer placing content in `slot="overflow"` will see nothing rendered. The public API promise is broken.

**Impact:** Any downstream consumer (Drupal Twig template, application code) that uses `slot="overflow"` will silently drop content.

---

### P0-02: `Home` key handler fires a spurious `.focus()` call on an incorrect element

**File:** `hx-action-bar.ts:160-167`

```typescript
} else if (e.key === 'Home') {
  e.preventDefault();
  this._moveFocus('prev'); // go to first via wrap  <-- WRONG
  const items = this._getFocusableItems();
  if (items.length) {
    items.forEach((el, i) => el.setAttribute('tabindex', i === 0 ? '0' : '-1'));
    items[0]?.focus();
  }
}
```

`_moveFocus('prev')` is called first. When the current focused item is `items[0]`, this call wraps backward and calls `.focus()` on `items[items.length - 1]` — the last item. Immediately afterward, `items[0]?.focus()` is called, correcting to the first item. This results in two programmatic `.focus()` calls: one on the last element, one on the first. Both trigger `focusin`/`focus` events. The `focusin` event on the last element is spurious and incorrect per the ARIA toolbar specification, which states `Home` moves focus directly to the first item without visiting others.

**Impact:** Screen readers announce the last item before the first on `Home` keypress. Assistive technology users receive incorrect navigation feedback. This is a WCAG 2.1 AA failure (SC 2.1.1 Keyboard, 4.1.3 Status Messages via AT announcements).

---

## P1 — High Priority

### P1-01: `position` property absent — spec requires `top | bottom | sticky`, implementation uses boolean `sticky`

**File:** `hx-action-bar.ts:63-65`

The audit spec requires: _"position typed (top/bottom/sticky)"_. The implementation provides:

```typescript
@property({ type: Boolean, reflect: true })
sticky = false;
```

There is no `position: 'top' | 'bottom' | 'sticky'` property. There is no support for `position="bottom"` — sticking to the bottom of a scroll container, which is the dominant pattern for mobile action bars. The boolean `sticky` only supports `top: 0`. An action bar at the bottom of a patient form (common healthcare UX) cannot be achieved.

---

### P1-02: No mobile safe area insets — iOS home indicator will obscure sticky bottom bars

**File:** `hx-action-bar.styles.ts:24-28`

```css
.base--sticky {
  position: sticky;
  top: 0;
  z-index: var(--hx-action-bar-z-index, 10);
}
```

There is no `env(safe-area-inset-top)` or `env(safe-area-inset-bottom)` anywhere in the styles. The audit spec explicitly requires _"safe area insets for mobile."_ On iOS Safari with a home indicator, a sticky bar positioned at the bottom would be partially obscured. In healthcare apps displayed on tablets/iPads at the bedside, this is a patient safety issue.

---

### P1-03: `aria-label` is not reactive — host attribute changes after first render are silently ignored

**File:** `hx-action-bar.ts:190`

```typescript
aria-label=${this.getAttribute('aria-label') ?? 'Actions'}
```

`this.getAttribute('aria-label')` is a DOM read inside `render()`. Lit does not track imperative DOM reads as reactive dependencies. If the consumer sets `aria-label` after the component has rendered (e.g., via JavaScript, or late binding in Drupal), the toolbar's inner `role="toolbar"` element will not update. The correct Lit pattern is:

```typescript
@property({ attribute: 'aria-label' })
ariaLabel: string = 'Actions';
```

Additionally, the host element itself now carries an `aria-label` attribute (from the consumer) without any `role`, which is technically valid but may confuse linters and automated accessibility checkers expecting `aria-label` to be on an element with a matching role.

---

### P1-04: Custom element focusable items not discoverable — `hx-button` and similar components invisible to roving tabindex

**File:** `hx-action-bar.ts:82-101`

`_getFocusableItems()` discovers focusable items using a CSS selector:

```typescript
'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
```

This selector targets native HTML elements only. A `<hx-button>` custom element does not match `button` (its tag is `hx-button`), does not have `[href]`, and its `tabindex` may only be set via `ElementInternals` (not a DOM attribute). These elements are completely invisible to the roving tabindex system. Any action bar populated with design system components (`hx-button`, `hx-icon-button`) will have no keyboard navigation.

Additionally, `_isFocusable()` checks `el.hasAttribute('disabled')`, which does not detect disabled state managed through `ElementInternals.ariaDisabled` or through a `disabled` property that doesn't reflect to attribute.

---

### P1-05: No Drupal Twig template provided

**File:** (missing)

The audit spec requires: _"Drupal — Twig-renderable."_ No Twig template exists. The component directory contains no `.twig` file, no `drupal-behaviors.js`, and no Drupal-specific documentation. The primary consumer of this design system is Drupal CMS. Without a Twig template, Drupal integrators must hand-craft the markup, risking incorrect slot usage, missing `aria-label`, and incorrect attribute binding.

---

### P1-06: Test suite missing coverage for `Home`, `End`, ArrowLeft wrap, tabindex state, and disabled exclusion

**File:** `hx-action-bar.test.ts`

Critical code paths with zero test coverage:

| Missing Test                                     | Code Path                        |
| ------------------------------------------------ | -------------------------------- |
| `Home` key moves focus to first item             | `_handleKeydown` Home branch     |
| `End` key moves focus to last item               | `_handleKeydown` End branch      |
| `ArrowLeft` wraps last-to-first                  | `_moveFocus('prev')` wrap        |
| `_initRovingTabindex` sets first item tabindex=0 | `_initRovingTabindex()`          |
| Disabled item excluded from navigation           | `_isFocusable()` disabled branch |
| `disconnectedCallback` removes keydown listener  | Memory leak guard                |
| Custom element in slot gets proper tabindex      | Focusable item discovery         |
| Sticky axe-core accessibility                    | Sticky state a11y                |

The Home key P0 bug (P0-02) is untested, meaning a broken behavior has shipped without detection.

---

### P1-07: Storybook stories use hardcoded raw colors instead of design tokens or hx-button

**File:** `hx-action-bar.stories.ts` (throughout)

Every story renders action buttons with hardcoded inline styles:

```html
<button
  style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
></button>
```

And `PatientRecordToolbar` uses raw hex values:

- `#2563eb` (hardcoded brand blue)
- `#fca5a5`, `#fef2f2`, `#dc2626` (hardcoded danger red)

This violates the project's zero-tolerance policy on hardcoded values and defeats the purpose of demonstrating design system integration. The stories teach consumers incorrect usage patterns — a consumer reading these stories learns to use raw HTML buttons with hardcoded styles alongside `hx-action-bar`, rather than using `hx-button`.

---

### P1-08: `_getFocusableItems()` includes direct focusable slots AND their focusable descendants — double-counts compound components

**File:** `hx-action-bar.ts:82-101`

```typescript
for (const el of assigned) {
  if (el instanceof HTMLElement && this._isFocusable(el)) {
    items.push(el);  // push the element itself
  }
  // Also gather focusable descendants
  const descendants = (el as HTMLElement).querySelectorAll<HTMLElement>(...)
  for (const d of Array.from(descendants)) {
    items.push(d);  // push its descendants too
  }
}
```

If an assigned slotted element is itself focusable (e.g., `<a href>` wrapping a button), it is pushed to `items`. Then its descendants are ALSO queried, potentially adding the same logical interactive target multiple times under different DOM nodes. More importantly: if a slotted `<div>` wraps a `<button>` and the `<button>` is focusable, the button gets added twice — once from the descendant query and once if the wrapping `<div>` had tabindex. The roving tabindex logic would then assign `-1` to the second copy while navigating by index, corrupting state.

---

## P2 — Medium Priority

### P2-01: `_getFocusableItems()` called on every keydown with no caching

**File:** `hx-action-bar.ts:130-148`

`_moveFocus()` calls `_getFocusableItems()` on every `ArrowLeft`/`ArrowRight`/`Home`/`End` keypress. `_getFocusableItems()` queries all `<slot>` elements, calls `assignedElements({ flatten: true })`, and runs `querySelectorAll` on each. For large toolbars with many items, rapid keyboard navigation will cause repeated DOM thrashing. The item list should be cached after slot changes and invalidated on `slotchange`.

---

### P2-02: `transition: none` in `prefers-reduced-motion` is dead code

**File:** `hx-action-bar.styles.ts:96-101`

```css
@media (prefers-reduced-motion: reduce) {
  .base {
    transition: none;
  }
}
```

No `transition` property is defined on `.base` or any other element in the stylesheet. This `prefers-reduced-motion` block applies `transition: none` to a component that has no transitions. It is inert dead code that adds confusion and a false signal that transitions were intended but reduced.

---

### P2-03: Three-section layout with competing auto margins does not guarantee true center alignment

**File:** `hx-action-bar.styles.ts:74-87`

```css
.section--start {
  flex: 0 0 auto;
  margin-inline-end: auto;
}
.section--center {
  flex: 1 1 auto;
  justify-content: center;
}
.section--end {
  flex: 0 0 auto;
  margin-inline-start: auto;
}
```

With all three sections populated, the `margin-inline-end: auto` on `.section--start` pushes content rightward. The `margin-inline-start: auto` on `.section--end` pushes content leftward. The center section (`flex: 1 1 auto`) takes the remaining space. However, `justify-content: center` on the center section centers content _within_ the center section's available space, not within the total bar width. If the start section is wider than the end section, the center content will visually appear off-center. For a healthcare record identifier displayed in center (as in `PatientRecordToolbar`), this is a visual accuracy defect.

---

### P2-04: `_handleKeydown` bound in `connectedCallback` is an unusual and fragile pattern

**File:** `hx-action-bar.ts:69-73`

```typescript
override connectedCallback(): void {
  super.connectedCallback();
  this._handleKeydown = this._handleKeydown.bind(this);
  this.addEventListener('keydown', this._handleKeydown);
}
```

The standard pattern for bound event handlers in Lit is to declare them as arrow function class fields:

```typescript
private _handleKeydown = (e: KeyboardEvent) => { ... };
```

The current approach reassigns the prototype method to an instance property on every `connectedCallback`. This means the instance shadows the prototype method. It works, but if `connectedCallback` is called multiple times (element moved in DOM), a new bound function is created and assigned — the previous bound reference used for `removeEventListener` in `disconnectedCallback` is the same instance property, so it works correctly. However, this is an unusual pattern that is not idiomatic Lit and could break if the code is refactored (e.g., if someone adds a super call that reads `_handleKeydown` before it is rebound).

---

### P2-05: Dead code in Default story play function

**File:** `hx-action-bar.stories.ts:82`

```typescript
play: async ({ canvasElement }) => {
  const _canvas = within(canvasElement);  // never used
  ...
}
```

`_canvas` is declared but never used. The underscore prefix is a convention for intentionally unused variables, but this is a linting violation (`no-unused-vars`) in strict mode and indicates the play function was copied from a template and not properly implemented. The Default story play function should verify more than just the presence of `role="toolbar"`.

---

### P2-06: `KeyboardNavigation` story play function does not test keyboard navigation

**File:** `hx-action-bar.stories.ts:267-273`

```typescript
play: async ({ canvasElement }) => {
  const el = canvasElement.querySelector('hx-action-bar');
  await expect(el).toBeTruthy();
  const base = el?.shadowRoot?.querySelector('[part="base"]');
  await expect(base?.getAttribute('role')).toBe('toolbar');
},
```

A story named `KeyboardNavigation` should use `userEvent.keyboard` to actually navigate the toolbar, verify focus moves correctly between buttons, and assert the roving tabindex state. Instead it only verifies the role attribute — identical to what the `Default` story already checks. This story provides false confidence that keyboard navigation has been validated in Storybook.

---

### P2-07: No `scroll-padding-top` compensation documented or provided for sticky bar

**File:** `hx-action-bar.styles.ts`

When `sticky` is `true`, the bar sits at `top: 0` and overlaps content scrolled behind it. There is no documentation, no CSS custom property, and no example showing consumers how to add `scroll-padding-top` or `padding-top` to the scroll container to prevent anchor links from scrolling behind the sticky bar. In healthcare forms where section anchors are common, this creates a usability defect where navigation jumps to content hidden behind the bar.

---

### P2-08: Default `aria-label` fallback of `'Actions'` is non-descriptive and should be documented as required

**File:** `hx-action-bar.ts:190`

```typescript
aria-label=${this.getAttribute('aria-label') ?? 'Actions'}
```

The fallback value `'Actions'` is generic. If multiple action bars exist on a page (patient header bar + patient footer bar), all without explicit `aria-label`, they all announce as "Actions toolbar" to screen readers, providing no distinguishing context. The ARIA spec for `role="toolbar"` recommends a label when multiple toolbars are present. This should be a documented required attribute, not a silently defaulted optional.

---

## Findings Not Investigated (Out of Scope / Cannot Verify Without Running)

- Actual bundle size (need `npm run build` + analysis)
- CEM accuracy against generated `custom-elements.json` (need `npm run cem`)
- Visual regression of center section alignment across real browsers
- `env(safe-area-inset-*)` rendering on real iOS devices
