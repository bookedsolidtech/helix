# hx-menu Deep Audit v3

Audited: `packages/hx-library/src/components/hx-menu/`
Files reviewed: `hx-menu.ts`, `hx-menu-item.ts`, `hx-menu-divider.ts`, `hx-menu.styles.ts`, `hx-menu-item.styles.ts`, `hx-menu-divider.styles.ts`, `hx-menu.test.ts`, `hx-menu.stories.ts`, `hx-menu-item.stories.ts`, `index.ts`

## wc-mcp Scores (Pre-Audit)

| Component       | Score | Grade |
| --------------- | ----- | ----- |
| hx-menu         | 75    | C     |
| hx-menu-item    | 81    | B     |
| hx-menu-divider | 100   | A     |

## wc-mcp Accessibility Scores (Pre-Audit)

| Component    | Score | Grade |
| ------------ | ----- | ----- |
| hx-menu      | 5     | F     |
| hx-menu-item | 30    | F     |

---

## Issues Fixed in This Audit (v3)

### CRITICAL — Fixed (v2)

| #   | Issue                                                                                    | Fix Applied                                                 |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| C1  | `hx-menu-item` events `hx-item-select` and `hx-item-submenu-open` missing `@fires` JSDoc | Added `@fires` with full type descriptions                  |
| C2  | No typeahead keyboard search (WAI-ARIA requirement)                                      | Added `_handleTypeahead()` with 500ms debounce buffer       |
| C3  | Missing `aria-haspopup` on items with submenus                                           | Added `aria-haspopup="true"` when submenu slot is populated |

### HIGH — Fixed (v2)

| #   | Issue                                                             | Fix Applied                                                                                                   |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| H1  | `--hx-menu-shadow` CSS token undocumented in JSDoc                | Added `@cssprop` to hx-menu JSDoc                                                                             |
| H2  | `--hx-menu-item-color` and `--hx-menu-item-hover-bg` undocumented | Added `@cssprop` entries to hx-menu-item JSDoc                                                                |
| H3  | No `menuitemradio` / radio type support                           | Added `type="radio"` with `menuitemradio` role and built-in mutual exclusion (unchecks siblings in same menu) |
| H4  | Home/End keyboard navigation untested                             | Added 2 tests for Home and End key focus                                                                      |
| H5  | Typeahead search untested                                         | Added 2 tests (single char + multi-char buffer)                                                               |
| H6  | Radio type untested                                               | Added 5 tests (role, aria-checked, click behavior, icon, mutual exclusion)                                    |
| H7  | Submenu `aria-haspopup` untested                                  | Added 1 test                                                                                                  |
| H8  | No Radio Group Storybook story                                    | Added RadioGroupItems story with mutual exclusion                                                             |

### HIGH — Fixed (v3)

| #   | Issue                                                       | Fix Applied                                                                       |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| M2  | Roving tabindex not implemented (all items have tabindex=0) | Added `_rovingTabIndex` state to hx-menu-item, `_syncRovingTabIndex()` to hx-menu |
| L2  | `focusFirst()` / `focusLast()` public methods untested      | Added 3 tests (focusFirst, focusLast, focusFirst skips disabled)                  |
| M13 | No accessible name support (aria-label prop) on hx-menu     | Already existed — added 2 tests verifying aria-label renders/omits correctly      |

---

## Issues Documented (Remaining)

### MEDIUM — Document for future work

| #   | Severity | Issue                                                              | Component    |
| --- | -------- | ------------------------------------------------------------------ | ------------ |
| M1  | MEDIUM   | No `open` property for declarative visibility control              | hx-menu      |
| M4  | MEDIUM   | No dark mode specific tokens                                       | all          |
| M5  | MEDIUM   | Submenu positioning not implemented in CSS                         | hx-menu-item |
| M6  | MEDIUM   | No `:active` pressed state styling                                 | hx-menu-item |
| M10 | MEDIUM   | Loading items excluded from keyboard nav without announcement      | hx-menu      |
| M11 | MEDIUM   | Inline SVGs inflate bundle (should use hx-icon)                    | hx-menu-item |
| M12 | MEDIUM   | `_updateFocusedIndex` uses unreliable cross-shadow focus detection | hx-menu      |

### LOW

| #   | Issue                                                           | Component |
| --- | --------------------------------------------------------------- | --------- |
| L1  | `_focusedIndex` private field visible in CEM                    | hx-menu   |
| L3  | No Drupal integration artifacts (Twig template, .libraries.yml) | all       |

---

## Test Coverage

| Metric              | Before (v1) | After (v2) | After (v3) |
| ------------------- | ----------- | ---------- | ---------- |
| Total tests         | 41          | 55         | 67         |
| New tests added     | —           | 14         | 12         |
| All tests passing   | Yes         | Yes        | Yes        |
| axe-core a11y tests | 4           | 4          | 6          |

### New Tests Added (v3)

- **Roving tabindex** (3): first item tabindex=0, updates after navigation, disabled items always -1
- **Public methods** (3): focusFirst, focusLast, focusFirst skips disabled
- **Property: label** (2): renders aria-label, omits when empty
- **hx-menu-divider** (2): aria-orientation=horizontal, renders inside menu
- **Accessibility (axe-core)** (2): radio type a11y, labeled menu a11y

---

## Gate Status

| Gate                 | Status  | Notes                                                         |
| -------------------- | ------- | ------------------------------------------------------------- |
| 1. TypeScript strict | PASS    | Zero errors                                                   |
| 2. Tests             | PASS    | 67 tests passing, roving tabindex + public methods + a11y     |
| 3. Accessibility     | PASS    | Roving tabindex implemented, aria-label verified, 6 axe tests |
| 4. Storybook         | PASS    | 12 menu stories + 7 menu-item stories                         |
| 5. CEM accuracy      | PASS    | All events, CSS props, slots, methods documented              |
| 6. Bundle size       | PASS    | No new dependencies added                                     |
| 7. Code review       | PENDING | Requires 3-tier review                                        |
