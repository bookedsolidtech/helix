# AUDIT: hx-side-nav — T2-37 Antagonistic Quality Review

**Date:** 2026-03-07
**Reviewer:** Antagonistic Quality Review Agent
**Component:** `hx-side-nav` + `hx-nav-item`
**Files reviewed:**

- `hx-side-nav.ts`
- `hx-nav-item.ts`
- `hx-side-nav.styles.ts`
- `hx-nav-item.styles.ts`
- `hx-side-nav.stories.ts`
- `hx-side-nav.test.ts`
- `index.ts`

---

## Summary

The component is structurally sound and implements the core collapsed navigation pattern correctly. However, several consequential accessibility violations, a critical reactivity bug in the tooltip mechanism, and a state/ARIA mismatch in the responsive CSS path block this component from shipping to production. Six P1 issues and twelve P2 issues follow.

---

## P1 — Must Fix Before Merge

### P1-01: `_isCollapsed` getter is not reactive — tooltip never renders in collapsed mode

**File:** `hx-nav-item.ts:72-74`, `hx-nav-item.ts:117-119`

```ts
private get _isCollapsed(): boolean {
  return this.hasAttribute('data-collapsed');
}
```

`data-collapsed` is set externally by `hx-side-nav` via `setAttribute`/`removeAttribute`. Because `_isCollapsed` is a plain getter — not a `@property` or `@state` — Lit's reactive system does not schedule a re-render when `data-collapsed` changes. The tooltip (`html\`<span class="nav-item\_\_tooltip"...>\``) is guarded by this getter in the render method:

```ts
${this._isCollapsed
  ? html`<span class="nav-item__tooltip" role="tooltip">${label}</span>`
  : nothing}
```

The initial render fires before `hx-side-nav._propagateCollapsedToChildren()` runs, so the guard evaluates to `nothing`. Subsequent attribute mutations do not trigger re-render. CSS selectors on `:host([data-collapsed])` do work (they observe attribute changes natively), so label hiding and centering works, but the tooltip DOM node is never inserted.

**Impact:** Icon-only collapsed mode has no tooltip — keyboard and mouse users cannot identify nav items when labels are hidden. WCAG 1.3.1, 2.4.6 violations.

---

### P1-02: `aria-controls` crosses Shadow DOM boundary — screen readers cannot resolve the reference

**File:** `hx-side-nav.ts:206-208`

```html
<button aria-controls="side-nav-body" ...></button>
```

The element with `id="side-nav-body"` lives inside `hx-side-nav`'s own Shadow DOM:

```html
<div part="body" class="side-nav__body" id="side-nav-body" ...></div>
```

The `aria-controls` attribute uses an IDREF to look up an element in the document's flat tree. Shadow DOM is a separate tree; cross-shadow IDREF resolution is not supported by any current AT/browser combination. The attribute effectively points to nothing. Screen readers that honour `aria-controls` will report an invalid reference or silently ignore it.

**Impact:** Assistive technology cannot communicate the relationship between the toggle button and the region it controls. WCAG 1.3.1 violation.

---

### P1-03: Collapsed tooltip lacks `aria-describedby` — not announced by screen readers

**File:** `hx-nav-item.ts:117-119`, `hx-nav-item.styles.ts:153-174`

The tooltip element carries `role="tooltip"` but the trigger (the link/button with `part="link"`) has no `aria-describedby` pointing to it. Per the ARIA spec, `role="tooltip"` requires the triggering element to reference the tooltip via `aria-describedby`. Without it, screen readers will not read the tooltip content when focus lands on the collapsed icon.

Additionally, the tooltip element has no `id` attribute, so even if `aria-describedby` were added, it could not be referenced.

**Impact:** Collapsed icon-only mode is inaccessible to screen reader users — they cannot identify navigation items. WCAG 1.3.1, 2.4.6.

---

### P1-04: `label` computed from `this.textContent` includes descendant text — tooltip shows garbled content

**File:** `hx-nav-item.ts:104`

```ts
const label = this.textContent?.trim() ?? '';
```

`textContent` on a custom element returns the concatenated text of ALL descendant nodes, including slotted `children` items. For a parent nav item with nested children:

```html
<hx-nav-item>
  Patients
  <hx-nav-item slot="children" href="/patients/list">All Patients</hx-nav-item>
  <hx-nav-item slot="children" href="/patients/new">New Patient</hx-nav-item>
</hx-nav-item>
```

`this.textContent` will be `"\n  Patients\n  All Patients\n  New Patient\n"`. The collapsed tooltip will display all of that text instead of just "Patients".

The correct approach is to read the text from the default slot's assigned nodes only (excluding named slots).

**Impact:** Tooltip label is semantically wrong for any nav item with sub-navigation. Corrupts the accessible name in collapsed mode.

---

### P1-05: Responsive auto-collapse creates ARIA/state mismatch

**File:** `hx-side-nav.styles.ts:122-132`

```css
@media (max-width: 768px) {
  :host {
    --hx-side-nav-width: 3.5rem;
  }
  :host(:not([collapsed])) .side-nav {
    width: var(--hx-side-nav-width, 3.5rem);
  }
}
```

At `max-width: 768px`, the nav visually narrows to `3.5rem` (icon-only width) even when `collapsed` is `false`. The following state mismatch results:

- Toggle button `aria-label` says "Collapse navigation" (because `collapsed` is still `false`)
- Toggle button `aria-expanded` says `"true"` (because `collapsed` is still `false`)
- Child items do NOT have `data-collapsed` set (so labels are not hidden, but overflow is clipped)
- The visual state contradicts every ARIA signal

A screen reader user on mobile will be told the nav is expanded when it visually is not, and activating the toggle will cause it to actually collapse (setting `collapsed=true`), which would then paradoxically trigger the "expand" flow.

**Impact:** Full ARIA/visual state inversion on all viewports ≤768px. WCAG 4.1.2 violation.

---

### P1-06: Keyboard navigation tests verify element existence, not focus movement

**File:** `hx-side-nav.test.ts:256-344`

All ArrowUp/ArrowDown keyboard navigation tests follow this pattern:

```ts
body?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
await el.updateComplete;

const secondLink = items[1].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
expect(secondLink).toBeTruthy(); // only verifies DOM existence
```

The assertion proves the element exists in the DOM, not that focus was moved to it. `focusTarget?.focus()` in `_handleKeydown` focuses an element inside a Shadow DOM; `document.activeElement` would point to the shadow host, not the inner element. The tests never assert `document.activeElement` equals the expected host or that the shadow-root active element is the expected link. A regression that completely breaks keyboard navigation would not be caught by these tests.

**Impact:** False-positive test coverage for a critical keyboard navigation feature.

---

## P2 — Should Fix

### P2-01: `_bodyEl` is declared but never used — dead code

**File:** `hx-side-nav.ts:56-57`

```ts
@query('.side-nav__body')
private _bodyEl!: HTMLDivElement;
```

This `@query` decorator is declared but not referenced anywhere in the class. It adds a getter with a DOM query that runs on every access for no benefit.

---

### P2-02: Exported type alias uses `Wc` prefix instead of project `Hx` prefix

**File:** `hx-side-nav.ts:231`, `hx-nav-item.ts:164`

```ts
export type { HelixSideNav as WcSideNav };
export type { HelixNavItem as WcNavItem };
```

All other components use the `Hx` prefix for exported aliases (e.g., `HxButton`). These use `WcSideNav`/`WcNavItem`, which is inconsistent and leaks the old `wc-2026` naming into the public API surface.

---

### P2-03: Toggle button has no CSS `part` — FIXED

**File:** `hx-side-nav.ts`, `hx-side-nav.styles.ts`

**Resolution:** Added `part="toggle"` to the toggle button element and `@csspart toggle` to the JSDoc documentation.

---

### P2-04: `--hx-side-nav-toggle-color` and `--hx-nav-item-host-bg` are undocumented tokens — FIXED

**File:** `hx-side-nav.ts`, `hx-nav-item.ts`

**Resolution:** Both tokens are now documented in their respective component's `@cssprop` JSDoc block. CEM generation will include them.

---

### P2-05: Tooltip `z-index` and `box-shadow` are hardcoded, not tokenized — FIXED

**File:** `hx-nav-item.styles.ts`

**Resolution:** Replaced with tokenized values: `var(--hx-z-index-tooltip, 100)` for z-index and `var(--hx-shadow-md, 0 2px 8px rgb(0 0 0 / 0.2))` for box-shadow.

---

### P2-06: Sub-navigation children have no open/close transition

**File:** `hx-nav-item.styles.ts:140-149`

```css
.nav-item__children {
  display: none;
  flex-direction: column;
  padding-left: var(--hx-space-6, 1.5rem);
}

:host([expanded]) .nav-item__children {
  display: flex;
}
```

The expand arrow rotates with a smooth `300ms` transition, but the children panel snaps open/closed instantly (`display: none` ↔ `display: flex` cannot be transitioned). This is visually jarring and inconsistent with the rest of the component's motion design.

---

### P2-07: `color-mix()` used without fallback — unsupported in older WebKit

**File:** `hx-side-nav.styles.ts:101`, `hx-nav-item.styles.ts:55-58`

```css
background-color: color-mix(in srgb, currentColor 15%, transparent);
```

`color-mix()` requires Chrome 111+, Firefox 113+, Safari 16.5+. Healthcare organizations running enterprise systems on older iOS Safari (common on point-of-care tablets) will see no hover background on the toggle button and nav items. A `@supports` guard or a solid color fallback should precede these declarations.

---

### P2-08: `aria-current` on button elements with children is unconventional

**File:** `hx-nav-item.ts:138-140`

```ts
aria-current=${this.active ? 'page' : nothing}
```

When a nav item has children it renders as a `<button>` (expand/collapse trigger). Setting `aria-current="page"` on a button is technically valid per ARIA 1.2 but semantically odd — `aria-current="page"` is designed for links that represent the current page. A parent folder node that is "active" because a child is the current page is a different semantic concept. The WAI-ARIA Authoring Practices distinguish between `aria-current="page"` (current page link) and `aria-expanded` (expanded group). Using both on a single button without differentiation may confuse screen readers.

---

### P2-09: Storybook missing `hx-nav-item` component meta and standalone stories

**File:** `hx-side-nav.stories.ts`

Only `hx-side-nav` has a Storybook meta entry. `hx-nav-item` has its own public API (`active`, `disabled`, `expanded`, `href`, slots) and is registered as a custom element, but has zero standalone stories. CEM autodocs cannot generate a controls panel for `hx-nav-item` without a `Meta` entry.

---

### P2-10: Storybook missing grouped/sectioned navigation story

**File:** `hx-side-nav.stories.ts`

The audit brief lists "grouped items" as a required story. There is no story demonstrating section labels or visual grouping of nav items (e.g., a "Clinical" group and an "Admin" group separated by a divider or label). `WithNestedNavigation` covers sub-items but not peer-group sectioning.

---

### P2-11: No test for badge hidden in collapsed mode

**File:** `hx-side-nav.test.ts`

The CSS hides the badge container when `data-collapsed` is set:

```css
:host([data-collapsed]) .nav-item__badge {
  display: none;
}
```

There is no test asserting that badges are hidden in collapsed mode or that they reappear on expand. Given that badges are a key user-facing feature (notification counts), this regression surface is unprotected.

---

### P2-12: No test for sub-navigation expand/collapse interaction

**File:** `hx-side-nav.test.ts`

The test suite covers `expanded` property reflection but not the interactive expand/collapse behaviour: clicking a nav item with children should toggle `expanded`, show/hide children, and update `aria-expanded`. No test validates this end-to-end flow.

---

## Observations (No Severity — Informational)

**OBS-01: No CDN or Drupal integration documentation.** The component requires no Drupal-specific patterns beyond standard attribute rendering, but there is no Twig example snippet in the component directory.

**OBS-02: `preferred-reduced-motion` is correctly handled** in both style files. Credit noted.

**OBS-03: `aria-label` defaults correctly to `"Main Navigation"`** and is documented. The label is applied to the `<nav>` element, which is correct landmark practice.

**OBS-04: `aria-disabled` on anchor elements.** Using `aria-disabled="true"` on `<a>` elements with `tabindex="-1"` is an accepted pattern (native `disabled` is not valid on anchors). The implementation is correct.

**OBS-05: Bundle size.** Without a build run, bundle size cannot be verified. The component has no external dependencies beyond `lit` and `@helixui/tokens`, suggesting it should be well within the 5KB threshold. Formal measurement required as part of gate verification.
