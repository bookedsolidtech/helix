# hx-menu Audit — T2-09

Audited: `packages/hx-library/src/components/hx-menu/`
Files reviewed: `hx-menu.ts`, `hx-menu-item.ts`, `hx-menu-divider.ts`, `hx-menu.styles.ts`, `hx-menu-item.styles.ts`, `hx-menu.test.ts`, `hx-menu.stories.ts`, `index.ts`

---

## Summary by Severity

| Severity | Count |
| -------- | ----- |
| P0       | 1     |
| P1       | 8     |
| P2       | 12    |

---

## P0 — Must Fix Before Merge

### P0-01: `hx-menu` has no accessible name — WCAG 4.1.2 violation

**File:** `hx-menu.ts:119-130`

The `role="menu"` element has no `aria-label` or `aria-labelledby`. WCAG 4.1.2 (Name, Role, Value) requires interactive elements to have accessible names. In a healthcare context, a screen reader announces "menu" with no context about what actions it contains — a patient safety issue when multiple menus appear on one view.

The WAI-ARIA spec states: _"If a menu is visually persistent, it is a menubar. Otherwise, it is best to open menus and submenus as pop-ups."_ The spec also requires all `menu` roles to have an accessible name via `aria-label` or `aria-labelledby`.

**Required fix:** Expose a `label` property on `hx-menu` that sets `aria-label` on the inner `role="menu"` div, or expose an `aria-labelledby` attr passthrough.

---

## P1 — High Priority Defects

### P1-01: Type-ahead search not implemented

**File:** `hx-menu.ts:75-101` (keyboard handler), `hx-menu.test.ts` (no tests for type-ahead)

The audit specification explicitly requires type-ahead: typing a character should jump focus to the first matching menu item. This is also required by the WAI-ARIA Menu Button pattern. The `_handleKeyDown` method handles only Arrow keys, Home, End, and Escape. No character key handling exists anywhere in the codebase.

**Required fix:** Add a character key handler in `_handleKeyDown` that collects a typed character (with debounce/reset) and calls `focusFirst`-style logic scoped to items whose text content starts with the character.

---

### P1-02: No `open` property — missing from typed API

**File:** `hx-menu.ts`

The audit specification requires "open prop typed." `hx-menu` has no `open` property. Menus typically have `open: boolean` to control visibility, reflect to attribute, and emit `hx-open` / `hx-close` events symmetrically. Without `open`, the component cannot be driven declaratively (e.g., from a Twig template or `hx-popup` anchor).

**Required fix:** Add `@property({ type: Boolean, reflect: true }) open = false` with corresponding `:host([open])` CSS and `hx-open` event dispatch.

---

### P1-03: Roving `tabindex` not implemented — Tab key escapes menu

**File:** `hx-menu-item.ts:187`

All `hx-menu-item` elements render with `tabindex="0"` unconditionally (except disabled). The WAI-ARIA Menu pattern requires a roving tabindex: only the currently focused item should have `tabindex="0"`, all others `tabindex="-1"`. This means Tab key cycles through all menu items instead of exiting the menu, violating WCAG 2.1.1 (Keyboard) and the ARIA menu authoring practice.

**Required fix:** `hx-menu` must manage roving tabindex — set all items to `tabindex="-1"` initially, then set only the focused item to `tabindex="0"`. On `hx-menu` focus events, update the tabindex accordingly.

---

### P1-04: No visible focus ring — fails WCAG 2.4.7 and 2.4.11

**File:** `hx-menu-item.styles.ts:33-36`

```css
.menu-item:hover,
.menu-item:focus-visible {
  background-color: var(--hx-menu-item-hover-bg, var(--hx-color-neutral-100, #f1f5f9));
}
```

The only visual difference on `:focus-visible` is a background color change. There is no `outline`, `box-shadow`, or border change. WCAG 2.4.7 requires visible keyboard focus indicators. WCAG 2.4.11 (AA, WCAG 2.2) requires a minimum area and contrast ratio. A background highlight alone does not meet either criterion, particularly in forced-colors/high-contrast mode where backgrounds are overridden.

**Required fix:** Add `outline: 2px solid var(--hx-color-focus-ring, var(--hx-color-primary-600))` with `outline-offset: -2px` (or similar) to `.menu-item:focus-visible`.

---

### P1-05: Internal event `hx-item-select` is undocumented in JSDoc/CEM

**File:** `hx-menu-item.ts:87-92`

`hx-menu-item` dispatches `hx-item-select` (bubbles, composed). This event is consumed by `hx-menu` but it crosses the shadow boundary (`composed: true`) and is therefore visible to external consumers. It has no `@fires` JSDoc tag, so it is absent from the Custom Elements Manifest and from Storybook autodocs. Consumers may bind to it unknowingly and rely on undocumented behavior, or miss it entirely.

**Required fix:** Add `@fires {CustomEvent<{item: HelixMenuItem, value: string}>} hx-item-select` to the `hx-menu-item` JSDoc, OR make the event non-composed so it stays internal.

---

### P1-06: Submenu keyboard navigation not tested

**File:** `hx-menu.test.ts`

`hx-menu-item` dispatches `hx-item-submenu-open` on `ArrowRight` when a submenu slot is populated (`hx-menu-item.ts:111-120`). There are zero tests for this behavior. The submenu open/close lifecycle is entirely untested. The `_hasSubmenu` state flag (derived from slot change) is also untested.

**Required fix:** Add tests for: (a) `ArrowRight` dispatches `hx-item-submenu-open`; (b) `hx-item-submenu-open` is not dispatched when no submenu is slotted; (c) submenu icon renders only when submenu is present.

---

### P1-07: No Drupal integration — component is not Twig-renderable

**File:** `packages/hx-library/src/components/hx-menu/` (missing files)

No Drupal integration artifacts exist: no Twig template, no `.libraries.yml` entry, no Drupal behavior file. The audit specification requires "Twig-renderable" as a pass criterion. Other components (per project conventions) need to work in Twig templates "without modification" per the project non-negotiables.

**Required fix:** Delegate to `drupal-integration-specialist` to create the Drupal behavior and Twig template for `hx-menu` + `hx-menu-item` + `hx-menu-divider`.

---

### P1-08: `focusFirst()` / `focusLast()` public API not tested

**File:** `hx-menu.test.ts`

`focusFirst()` (line 40) and `focusLast()` (line 49) are documented public methods on `HelixMenu` but have zero test coverage. These are the primary API for external callers (e.g., `hx-popup`, trigger buttons) to position initial focus when a menu opens.

**Required fix:** Add tests for both methods: (a) `focusFirst()` focuses first non-disabled item; (b) `focusLast()` focuses last non-disabled item; (c) both skip disabled/loading items.

---

## P2 — Medium Priority Issues

### P2-01: Keyboard navigation wrap tests assert element existence, not focus

**File:** `hx-menu.test.ts:124-153`

The `ArrowUp wraps to last item from first` and `ArrowDown wraps to first item from last` tests only assert that `lastInner` / `firstInner` are truthy DOM elements — they do not assert that focus actually moved to that element. A broken wrap implementation would still pass these tests.

---

### P2-02: `--hx-menu-shadow` CSS custom property undocumented

**File:** `hx-menu.styles.ts:16-20`, `hx-menu.ts` (JSDoc)

`--hx-menu-shadow` is used in the CSS but absent from the `@cssprop` JSDoc block. The Custom Elements Manifest will not include it, and consumers cannot discover it through tooling.

---

### P2-03: `--hx-menu-item-hover-bg` and `--hx-menu-item-color` undocumented on `hx-menu-item`

**File:** `hx-menu-item.styles.ts:20,35`, `hx-menu-item.ts` (missing JSDoc)

Both custom properties are used in styles but have no `@cssprop` documentation in `hx-menu-item.ts`. They will not appear in CEM output or Storybook autodocs.

---

### P2-04: `hx-menu-divider` styles not in a separate `.styles.ts` file

**File:** `hx-menu-divider.ts:6-16`

The divider's CSS is defined inline in the component file instead of a dedicated `hx-menu-divider.styles.ts`. This deviates from the project file convention (`hx-button.styles.ts`, `hx-menu-item.styles.ts`, etc.) and makes the file harder to maintain.

---

### P2-05: Storybook `WithSubmenu` story is non-functional

**File:** `hx-menu.stories.ts:219-234`

The submenu nested in `slot="submenu"` is hidden and has no show/hide toggle behavior in the story. A user reading the story cannot interact with the submenu at all. The story demonstrates the structure but not the behavior, creating false confidence in the pattern.

---

### P2-06: No Storybook `argTypes` controls configured

**File:** `hx-menu.stories.ts:12-24`

The `meta` object has no `argTypes`. As a result, there are no Storybook controls in the panel — consumers cannot interactively toggle `disabled`, `type`, `loading`, or `checked` on items from the UI. Stories should use `args` + `argTypes` where possible per the project quality gate (Gate 4: stories for all variants, controls for all public properties).

---

### P2-07: `SelectEvent` story contains a dead `<script>` tag

**File:** `hx-menu.stories.ts:252-257`

The `render` function returns an `html` template with an inline `<script>` tag. Script tags in Lit `html` tagged templates are not executed by the browser's Storybook canvas. The `play` function correctly implements the event listener test, but the inert script in the template is misleading dead code.

---

### P2-08: `_updateFocusedIndex` uses unreliable cross-shadow focus detection

**File:** `hx-menu.ts:67-73`

```ts
const active = this.shadowRoot?.activeElement ?? document.activeElement;
const idx = items.findIndex((item) => item.matches(':focus-within') || item === active);
```

`this.shadowRoot?.activeElement` is the shadow root of `hx-menu` itself, which contains only the `.menu` div and a `<slot>`. It will never contain an `hx-menu-item`. The actual focused element is inside the shadow root of `hx-menu-item`. `document.activeElement` inside a shadow tree returns the shadow host (the `hx-menu-item` element), so `item === active` should work, but the first condition (`this.shadowRoot?.activeElement`) always returns the slot or the div — never an item. The logic is correct by accident via the second condition; the first is misleading dead code.

---

### P2-09: Loading items are excluded from keyboard navigation without visual announcement

**File:** `hx-menu.ts:33-37`

`_getItems()` filters out both `disabled` and `loading` items. However, `loading` items render with `tabindex="0"` still (they're excluded from the items array but not from the DOM). A screen reader user tabbing into the menu can still land on a loading item via Tab (due to P1-03 roving tabindex issue). There are also no tests for loading item exclusion from keyboard navigation.

---

### P2-10: Inline SVGs inflate bundle — violates `hx-icon` convention

**File:** `hx-menu-item.ts:124-172`

Three SVG icons (checkmark, chevron-right, spinner) are hardcoded inline in the component. The project uses `hx-icon` for iconography. Inline SVGs bypass the icon system, make localization/theming harder, and inflate the min+gz bundle for this component. This is a convention violation; the spinner in particular duplicates the `hx-spinner` component.

---

### P2-11: `hx-menu-divider` `role="separator"` is only valid inside `role="menu"`

**File:** `hx-menu-divider.ts:34-39`

The WAI-ARIA spec requires `role="separator"` to be a child of `role="menu"`, `role="menubar"`, or `role="listbox"`. When `hx-menu-divider` is rendered in isolation (e.g., in a Storybook story or test), axe-core will flag a required-context-role violation. The component has no guard or documentation warning about this constraint.

---

### P2-12: No `label`, `icon`, or `shortcut` typed properties on `hx-menu-item`

**File:** `hx-menu-item.ts`

The audit specification requires menu items to be typed with `label`, `icon`, `disabled`, `shortcut`, and `submenu` properties. Currently `label` is a default slot, `icon` is a `prefix` slot, and `shortcut` is a `suffix` slot. While slot-based composition is valid Lit practice, typed properties would enable declarative usage in Drupal Twig (via attributes) and richer CEM tooling support. The current slot-only approach prevents usage patterns like `<hx-menu-item label="Edit" shortcut="Ctrl+E"></hx-menu-item>`.

---

## Audit Pass/Fail by Gate

| Gate                           | Status           | Blocker Finding(s)                                                                  |
| ------------------------------ | ---------------- | ----------------------------------------------------------------------------------- |
| 1. TypeScript strict           | PASS             | No `any` types found; strict mode satisfied                                         |
| 2. Tests (80%+ coverage)       | FAIL             | P1-06, P1-08: missing coverage for submenu KB nav, focusFirst/focusLast, type-ahead |
| 3. Accessibility (WCAG 2.1 AA) | FAIL             | P0-01 (no accessible name), P1-03 (roving tabindex), P1-04 (no visible focus ring)  |
| 4. Storybook                   | CONDITIONAL PASS | P2-05, P2-06: non-functional submenu story, no controls                             |
| 5. CEM accuracy                | FAIL             | P1-05, P2-02, P2-03: undocumented events and CSS props                              |
| 6. Bundle size                 | UNKNOWN          | P2-10: inline SVGs inflate bundle; no build metrics available to confirm <5KB       |
| 7. Drupal                      | FAIL             | P1-07: no Twig template or `.libraries.yml`                                         |

**Overall: BLOCKED — 4 of 7 gates fail.**
