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

| Severity | Found | Resolved |
| -------- | ----- | -------- |
| P0       | 1     | 1        |
| P1       | 3     | 3        |
| P2       | 10    | 10       |

**All issues resolved.** Component passes all 7 quality gates.

### Verification Results

- **TypeScript strict:** Zero errors (`npm run verify` passes)
- **Tests:** 46/46 pass (Vitest browser mode, Chromium)
- **Accessibility:** 3 axe-core scenarios pass (closed, open, disabled); zero violations
- **Storybook:** 13 stories covering all variants, states, and healthcare context
- **CEM:** Accurate — matches public API (5 properties, 3 events, 4 CSS parts, 7 CSS custom properties, 1 slot)
- **Bundle:** `@floating-ui/dom` externalized as peerDependency; component code well within 5KB budget
- **Docs:** Starlight page complete with live demos, API tables, Drupal/Twig integration, standalone HTML example

---

## P0 — Critical (Blocking)

### P0-01: Missing arrow-key navigation within the menu panel — RESOLVED

**File:** `hx-overflow-menu.ts:206–223`

**Finding:** The `_handleKeydown` handler only responded to `Escape` and `Tab`, missing ArrowDown/ArrowUp/Home/End per WAI-ARIA Menu Button Pattern.

**Resolution:** Full arrow-key navigation implemented with wrapping behavior. Disabled items are automatically skipped via `_getMenuItems()` filter. Tests added: ArrowDown, ArrowDown wrap, ArrowUp, ArrowUp wrap, Home, End, skip-disabled (7 tests).

---

## P1 — High Priority

### P1-01: `aria-haspopup="true"` should be `aria-haspopup="menu"` — RESOLVED

**File:** `hx-overflow-menu.ts:294`

**Resolution:** Changed to `aria-haspopup="menu"` per ARIA 1.2. Test updated to assert `'menu'`.

---

### P1-02: Trigger accessible label is hardcoded — no customization property — RESOLVED

**File:** `hx-overflow-menu.ts:88–92`

**Resolution:** Added `label` property (string, reflected, default `'More actions'`) that binds to `aria-label` on the trigger button. Tests added: default value, attribute reflection, property change reflection (3 tests).

---

### P1-03: `@floating-ui/dom` is bundled, not externalized — bundle budget exceeded — RESOLVED

**Files:** `vite.config.ts:49`, `package.json:51`

**Resolution:** `@floating-ui/dom` moved to `peerDependencies` and added to `rollupOptions.external` regex (`/^@floating-ui/`). No longer bundled into the component chunk.

---

## P2 — Medium Priority

### P2-01: No tests for disabled menu items — RESOLVED

**File:** `hx-overflow-menu.test.ts:285–301`

**Resolution:** Test added: "does not dispatch hx-select when disabled menu item is clicked". Also verified `_handleSlotClick` checks `disabled` attribute and `.disabled` property before dispatching.

---

### P2-02: No test for clicking outside to close the panel — RESOLVED

**File:** `hx-overflow-menu.test.ts:452–470`

**Resolution:** Test added: "clicking outside closes the panel" — dispatches click on `document.body`, asserts panel is removed and `hx-hide` fires.

---

### P2-03: No test that Escape returns focus to the trigger button — RESOLVED

**File:** `hx-overflow-menu.test.ts:323–336`

**Resolution:** Test added: "Escape returns focus to the trigger button" — asserts `el.shadowRoot.activeElement` is the trigger button after Escape.

---

### P2-04: `hx-hide` event missing bubbles/composed test — RESOLVED

**File:** `hx-overflow-menu.test.ts:255–268`

**Resolution:** Test added: "hx-hide bubbles and is composed" — mirrors the existing hx-show test.

---

### P2-05: `bind(this)` called in `connectedCallback` — fragile lifecycle pattern — RESOLVED

**File:** `hx-overflow-menu.ts:179–242`

**Resolution:** All event handlers converted to arrow-function class fields (`private readonly _handleX = (e: T): void => { ... }`). No `.bind()` calls in lifecycle methods. Stable references for add/removeEventListener.

---

### P2-06: Redundant `cursor: not-allowed` on `.trigger[disabled]` — RESOLVED

**File:** `hx-overflow-menu.styles.ts`

**Resolution:** Dead CSS rule removed. `:host([disabled])` already applies `pointer-events: none`.

---

### P2-07: `outline-offset: -2px` on slotted focus-visible items — RESOLVED

**File:** `hx-overflow-menu.styles.ts:114`

**Resolution:** Changed to `outline-offset: 0` (flush). Focus ring is now fully visible on all menu items.

---

### P2-08: CSS part names diverge from feature specification — RESOLVED

**File:** `hx-overflow-menu.ts:290, 304`

**Resolution:** Both naming conventions supported via multi-value part attributes: `part="button trigger"` and `part="panel menu"`. Consumers can use either `::part(button)` or `::part(trigger)`, and either `::part(panel)` or `::part(menu)`. Tests verify both aliases.

---

### P2-09: Missing Storybook story — menu items with icon content — RESOLVED

**File:** `hx-overflow-menu.stories.ts:330–408`

**Resolution:** `WithIconItems` story added showing menu items with leading SVG icons (edit, duplicate, archive, delete).

---

### P2-10: No Drupal integration documentation or Twig example — RESOLVED

**File:** `apps/docs/src/content/docs/component-library/hx-overflow-menu.mdx:265–310`

**Resolution:** Full Drupal integration section in Starlight docs: Twig template with dynamic attributes, `.libraries.yml` registration, and `Drupal.behaviors` event handler using `once()`.

---

## Passing Areas

| Area                                            | Status | Notes                                                          |
| ----------------------------------------------- | ------ | -------------------------------------------------------------- |
| TypeScript strict — no `any`                    | PASS   | No `any` types found                                           |
| Placement property typed                        | PASS   | Full 12-value union type                                       |
| Icon property typed                             | PASS   | `'vertical' \| 'horizontal'`                                   |
| Size property typed                             | PASS   | `'sm' \| 'md' \| 'lg'`                                         |
| Trigger `aria-label` present                    | PASS   | Dynamic via `label` property                                   |
| Panel `role="menu"`                             | PASS   |                                                                |
| `aria-haspopup="menu"`                          | PASS   | ARIA 1.2 compliant                                             |
| `aria-expanded` reflects state                  | PASS   |                                                                |
| Arrow-key navigation (Down/Up/Home/End)         | PASS   | With wrapping and disabled-item skip                           |
| Escape closes panel and restores focus          | PASS   | Tested                                                         |
| Tab closes panel                                | PASS   | Tested                                                         |
| Outside click closes panel                      | PASS   | Tested                                                         |
| Focus moves to first item on open               | PASS   | `_focusFirstItem()`                                            |
| `hx-show` / `hx-hide` / `hx-select` events      | PASS   | All three dispatched correctly, bubbles/composed verified      |
| Disabled items skipped in focus and events      | PASS   | Both keyboard traversal and click handler check disabled state |
| `@csspart button/trigger` and `panel/menu`      | PASS   | Dual aliases via multi-value part attribute                    |
| All `--hx-*` token usage                        | PASS   | No hardcoded colors/spacing outside fallback values            |
| Reduced motion media query                      | PASS   | Transition disabled                                            |
| Arrow-function event handlers                   | PASS   | No `.bind()` in lifecycle, stable references                   |
| axe-core tests (closed, open, disabled)         | PASS   | Three scenarios covered                                        |
| Storybook autodocs                              | PASS   | `tags: ['autodocs']` present                                   |
| Storybook controls for all public props         | PASS   | placement, size, disabled, icon, label all have controls       |
| WithIconItems story                             | PASS   | Menu items with SVG icons                                      |
| Table row context story                         | PASS   | `PatientRowActions`                                            |
| Shadow DOM encapsulation                        | PASS   |                                                                |
| `index.ts` re-export                            | PASS   |                                                                |
| `declare global` block                          | PASS   | `HTMLElementTagNameMap` extended                               |
| Event listeners cleaned up on disconnect        | PASS   | `disconnectedCallback` removes both listeners                  |
| `@floating-ui/dom` externalized                 | PASS   | peerDependency + rollup external                               |
| Starlight documentation                         | PASS   | Complete with live demos, API, accessibility, Drupal, examples |
| `label` property                                | PASS   | Configurable accessible name                                   |
| `outline-offset: 0` on focus-visible menu items | PASS   | WCAG 2.1 SC 1.4.11 compliant                                   |
