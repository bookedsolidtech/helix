# AUDIT: hx-split-button — T2-28 Antagonistic Quality Review

**Component:** `hx-split-button` + `hx-menu-item` (sub-component)
**Source branch:** `rescue/abandoned-components` (PR #175)
**Audit date:** 2026-03-05
**Auditor:** antagonistic-quality-review agent (T2-28)
**Status:** DO NOT FIX — findings only

---

## Summary

| Severity | Count |
| -------- | ----- |
| P0       | 1     |
| P1       | 6     |
| P2       | 8     |

The component architecture is well-structured with correct ARIA intent, comprehensive CSS token coverage, and good Storybook coverage. However, there is a **critical keyboard navigation defect (P0)** that makes the menu completely non-navigable with arrow keys, plus several P1 issues around shadow DOM ARIA ownership that threaten screen reader compatibility.

---

## Findings

### P0 — Critical

---

#### P0-01: Arrow key navigation in menu is broken — stuck on first item

**File:** `hx-split-button.ts:187–208` (`_handleMenuKeydown`)
**Area:** Accessibility / Keyboard / JavaScript

`_getMenuItems()` returns the inner `<button>` elements from inside each `hx-menu-item`'s shadow root. But `_handleMenuKeydown` tracks the current focused item by comparing those buttons to `document.activeElement`.

```ts
// _getMenuItems() returns shadow-root buttons:
.map((item) => item.shadowRoot?.querySelector<HTMLElement>('button') ?? null)

// _handleMenuKeydown reads document.activeElement:
const lightActive = document.activeElement as HTMLElement | null;
// lightActive = <hx-menu-item> host element (NOT the inner button)

const currentIndex = items.findIndex((item) => item === lightActive);
// currentIndex is ALWAYS -1 — inner buttons never equal the host element
```

Because `document.activeElement` returns the shadow host (`hx-menu-item`), not the inner `<button>` inside its shadow root, `currentIndex` is always `-1`.

Consequence:

- `ArrowDown`: `currentIndex (-1) < items.length - 1` → always true → always focuses `items[0]`
- `ArrowUp`: `currentIndex (-1) > 0` → false → always focuses `items[items.length - 1]`

You **cannot advance past the first item** with ArrowDown. Every ArrowDown press refocuses item 0. The menu is non-navigable. This violates WCAG 2.1 SC 2.1.1 (Keyboard).

**Fix direction:** Use `Element.shadowRoot.activeElement` chained through each item, or track focus with a separate state variable, or compare against the `hx-menu-item` _hosts_ and resolve to their inner buttons accordingly.

---

### P1 — High

---

#### P1-01: Cross-shadow-boundary `role="menu"` / `role="menuitem"` relationship may break AT

**File:** `hx-split-button.ts:282–290`, `hx-menu-item.ts:87`
**Area:** Accessibility / ARIA

The `<div role="menu">` lives in `hx-split-button`'s shadow DOM. Slotted `<hx-menu-item>` elements each have their own shadow DOM containing `<button role="menuitem">`. This means the `role="menuitem"` is two shadow boundaries deep from the `role="menu"` container.

The ARIA spec requires that `menuitem` elements be owned by a `menu`. The ARIA in HTML spec and Accessibility Object Model define that slotted content is flattened into the host shadow tree for accessibility purposes — however, the button element with `role="menuitem"` is inside a _nested_ shadow root (hx-menu-item's own shadow root), not a direct slot assignment. Some AT/browser combinations may not expose the button as a child of the menu in the accessibility tree.

This pattern passes axe-core (which is DOM-based) but may fail in real AT testing (NVDA + Firefox in particular). Requires manual AT verification with:

- NVDA + Firefox
- VoiceOver + Safari
- JAWS + Chrome

**Risk:** High in healthcare context. WCAG 2.1 SC 1.3.1 (Info and Relationships) and SC 4.1.2 (Name, Role, Value).

---

#### P1-02: Negative `outline-offset` on menu item focus ring can clip

**File:** `hx-menu-item.styles.ts:40`
**Area:** CSS / Accessibility

```css
.menu-item:focus-visible {
  outline-offset: var(--hx-focus-ring-offset, -2px);
```

A negative offset draws the focus ring _inside_ the element boundary. On elements with `border-radius`, this clips the focus ring at the corners, making it partially invisible. WCAG 2.1 SC 1.4.11 (Non-text Contrast) requires that focus indicators be clearly distinguishable.

The `hx-menu-item` has `border-radius: var(--hx-menu-item-border-radius, ...)`. With negative offset and rounded corners, the focus ring will be clipped.

Compare to `hx-split-button.styles.ts:52` where the primary button uses `outline-offset: var(--hx-focus-ring-offset, 2px)` (positive) — inconsistency confirms this is a defect.

---

#### P1-03: Dead code — `_primaryButton` @query is never used

**File:** `hx-split-button.ts:67`
**Area:** TypeScript / Code Quality

```ts
@query('.split-button__primary')
private _primaryButton!: HTMLButtonElement;
```

This property is declared and queried but never accessed in any method body. All primary button interaction occurs through event handlers attached in the template. This is dead code that adds noise and may mislead maintainers into thinking the reference is used somewhere.

TypeScript strict mode should catch this with `noUnusedLocals`, but `@query` decorated properties avoid this because they are technically "used" at the class level.

---

#### P1-04: Dead variable `focused` suppressed with `void` instead of removed

**File:** `hx-split-button.ts:182–207`
**Area:** TypeScript / Code Quality

```ts
const focused = this.shadowRoot?.activeElement as HTMLElement | null;
// ...
default:
  void focused;  // "Suppress the unused-variable warning"
  break;
```

The `focused` variable is computed but never used in any branch of the switch statement. The `void focused` suppression is a code smell — it indicates the author was aware the variable is unused but chose to suppress rather than remove. The comment confirms intent. Combined with P0-01, this reveals the original design was to use `shadowRoot.activeElement` for focus tracking, which was then abandoned for `document.activeElement` (which also doesn't work correctly).

Both `focused` and the shadow-root approach should be removed once the P0 fix is implemented.

---

#### P1-05: Test coverage gap — ArrowDown cycling through multiple items never tested

**File:** `hx-split-button.test.ts`
**Area:** Tests

The keyboard test suite verifies that `ArrowDown` opens the menu (line ~263) but never verifies that `ArrowDown` moves focus from item 1 to item 2 in a multi-item menu. This is exactly the scenario where P0-01 manifests. The P0 keyboard navigation bug would pass all current tests.

Missing test cases:

- ArrowDown moves focus from first item to second item
- ArrowDown wraps from last item to first item
- ArrowUp moves focus from second item to first item
- ArrowUp wraps from first item to last item
- `Home` key moves to first item
- `End` key moves to last item
- Outside click closes the menu
- Tab key closes the menu (document keydown handler at line ~100)

---

#### P1-06: Storybook `Danger` story leaves primary button without accessible text

**File:** `hx-split-button.stories.ts:121–135`
**Area:** Storybook

The `Danger` story provides a custom `render` function that does not bind `args.label` and contains no default slot content for the primary button label:

```ts
export const Danger: Story = {
  args: { variant: 'danger', label: 'Delete Record' },
  render: (args) => html`
    <hx-split-button variant=${args.variant} hx-size=${args.size} ?disabled=${args.disabled}>
      <!-- No label prop binding, no slot text -->
      <hx-menu-item slot="menu" value="archive">Archive Record</hx-menu-item>
```

The primary button receives no accessible text — `args.label = 'Delete Record'` is defined but never applied. This is a Storybook documentation defect that also means the rendered story fails accessibility for unlabeled buttons. If axe-core runs against Storybook stories, this story will produce a violation.

---

### P2 — Medium

---

#### P2-01: Hardcoded English strings for `aria-label` — not localizable

**File:** `hx-split-button.ts:251, 271`
**Area:** Accessibility / i18n

```html
aria-label="More actions"
<!-- trigger button -->
aria-label="Secondary actions"
<!-- menu panel -->
```

These are hardcoded English strings with no mechanism for localization. Healthcare enterprise consumers serving non-English markets cannot override these without patching the component. Should be exposed as properties (e.g., `triggerLabel`, `menuLabel`) with English defaults.

---

#### P2-02: Menu panel has no `max-height` or scroll — can overflow viewport

**File:** `hx-split-button.styles.ts:190–210`
**Area:** CSS / UX

The `.split-button__menu` has no `max-height`, `overflow-y: auto`, or `overflow-y: scroll`. In healthcare scenarios with many items (e.g., patient status codes, export formats) the menu could extend beyond the viewport with no scroll affordance. Overflow would be clipped by any `overflow: hidden` ancestor.

---

#### P2-03: Menu open/close has no CSS transition — instant appearance

**File:** `hx-split-button.styles.ts:193`
**Area:** CSS / UX

The menu panel toggles between `display: none` and `display: block` with no animation. The chevron icon does animate (`transition: transform`), creating a mismatch where the icon animates but the menu appears instantly. The reduced-motion media query correctly disables the chevron animation, but there is nothing to disable for the menu because it has no transition. A fade-in or slide-down transition would be expected for production quality.

---

#### P2-04: `aria-disabled` is redundant alongside native `disabled` on `<button>`

**File:** `hx-split-button.ts:244, 258`, `hx-menu-item.ts:87`
**Area:** Accessibility / HTML semantics

Both components set native `disabled` attribute AND `aria-disabled="true"` on `<button>` elements. For native interactive elements, `disabled` already communicates the disabled state to AT. `aria-disabled` is intended for custom elements that cannot use the native disabled state. Using both is redundant and could cause AT to announce "dimmed" or "unavailable" twice on some platforms.

---

#### P2-05: No standalone Storybook story for `hx-menu-item`

**File:** `hx-split-button.stories.ts`
**Area:** Storybook / Documentation

`hx-menu-item` is a documented public component (`@tag hx-menu-item`, `@customElement('hx-menu-item')`, exported in `index.ts`) with its own CSS parts (`part="item"`), CSS custom properties, events, and properties. However, it has no standalone Storybook story file. Consumers cannot browse its API in isolation. Its CEM documentation will exist but Storybook autodocs won't be generated for it.

---

#### P2-06: `_handleMenuKeydown` is attached to the menu `<div>` but menu items are in light DOM

**File:** `hx-split-button.ts:283`
**Area:** Accessibility / JavaScript

```html
<div role="menu" @keydown="${this._handleMenuKeydown}">
  <slot name="menu"></slot>
</div>
```

Keyboard events fired from elements inside `hx-menu-item`'s shadow root (specifically the inner `<button>`) will bubble through the `hx-menu-item` host (light DOM) and then into the split-button's shadow DOM, where they will be captured by `@keydown` on the menu div. This works because the events are `composed: true` by default for keyboard events on shadow DOM elements.

However, this means `Escape`/`ArrowDown`/`ArrowUp`/`Home`/`End` keys pressed while focus is on a menu item will bubble through multiple shadow boundaries before being handled. This is functional but architecturally fragile — if `hx-menu-item` ever stops being a composed custom element, keyboard events would be trapped. Low risk but worth documenting.

---

#### P2-07: Bundle size cannot be verified — blocked by PR #175 not merged

**File:** N/A
**Area:** Performance

This audit is based on source code from `rescue/abandoned-components` (PR #175), which has not been merged into any buildable branch. Bundle size cannot be measured against the <5KB per-component threshold. The source code volume (~300 lines TS + ~250 lines styles across both components) suggests it will likely satisfy the budget, but formal verification is blocked.

**Gate:** Performance Gate (bundle < 5KB per component) is **unverified** until PR #175 is merged and a build can be run.

---

#### P2-08: No Drupal behavior file provided

**File:** N/A
**Area:** Drupal / Integration

The component has no accompanying Drupal behavior file (`.js` or `.es6.js` in a Drupal-compatible format). For the primary consumer (Drupal CMS), consumers are expected to use the web component directly from a CDN or asset library. The component is Twig-renderable as-is (both `label` attribute and slot content work from Twig), but interactive keyboard patterns and analytics hooks typically require a Drupal behavior. This is a gap for full enterprise Drupal integration.

Note: The `label` property does not use `reflect: true`, so the `label` attribute set from Twig/HTML will work (Lit observes attributes) but reading the `label` property back from JS will return the default (`undefined`) until the Lit property is set via JavaScript. This is a subtle but non-blocking Drupal integration concern.

---

## Area-by-Area Summary

### TypeScript

- Strict mode compliance: **Pass** — no `any`, no `@ts-ignore`
- Dead code: **Fail** — `_primaryButton` query (P1-03), `focused` variable (P1-04)
- Type accuracy: **Pass** — event detail types are correctly typed

### Accessibility

- ARIA pattern intent: **Correct** — properly targets ARIA menu button pattern
- Implementation: **Fail** — P0 keyboard navigation bug, P1 cross-shadow ARIA relationship
- axe-core: **Pass** (DOM-based static analysis insufficient for shadow DOM role relationships)
- Manual AT: **Untested** — required for P1-01

### Tests

- Coverage: **Partial** — 40+ tests but critical keyboard navigation path untested (P1-05)
- Quality: **Fail** — P0 bug undetected by test suite

### Storybook

- Variant coverage: **Pass** — all 6 variants present
- Interaction tests: **Pass** — 7 play functions with event spies
- Documentation gap: **Fail** — no standalone hx-menu-item story (P2-05)
- Accessibility in stories: **Fail** — Danger story has unlabeled button (P1-06)

### CSS

- Token usage: **Pass** — comprehensive `--hx-*` token coverage with fallbacks
- Parts: **Pass** — `button`, `trigger`, `menu` CSS parts correctly exposed
- Focus visibility: **Fail** — negative outline-offset on hx-menu-item (P1-02)
- Responsive/overflow: **Fail** — no max-height on menu (P2-02)
- Reduced motion: **Pass** — media query present

### Performance

- Bundle size: **Unverified** — blocked by PR #175 (P2-07)

### Drupal

- Twig-renderable: **Pass** — standard HTML attribute API works
- label attribute: **Pass** (with caveat — P2-08)
- Behavior file: **Missing** (P2-08)
