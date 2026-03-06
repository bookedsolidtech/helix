# hx-menu Deep Audit v2

Audited: `packages/hx-library/src/components/hx-menu/`
Files reviewed: `hx-menu.ts`, `hx-menu-item.ts`, `hx-menu-divider.ts`, `hx-menu.styles.ts`, `hx-menu-item.styles.ts`, `hx-menu.test.ts`, `hx-menu.stories.ts`, `index.ts`

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

## Issues Fixed in This Audit

### CRITICAL — Fixed

| #   | Issue                                                                                    | Fix Applied                                                 |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| C1  | `hx-menu-item` events `hx-item-select` and `hx-item-submenu-open` missing `@fires` JSDoc | Added `@fires` with full type descriptions                  |
| C2  | No typeahead keyboard search (WAI-ARIA requirement)                                      | Added `_handleTypeahead()` with 500ms debounce buffer       |
| C3  | Missing `aria-haspopup` on items with submenus                                           | Added `aria-haspopup="true"` when submenu slot is populated |

### HIGH — Fixed

| #   | Issue                                                             | Fix Applied                                                        |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| H1  | `--hx-menu-shadow` CSS token undocumented in JSDoc                | Added `@cssprop` to hx-menu JSDoc                                  |
| H2  | `--hx-menu-item-color` and `--hx-menu-item-hover-bg` undocumented | Added `@cssprop` entries to hx-menu-item JSDoc                     |
| H3  | No `menuitemradio` / radio type support                           | Added `type="radio"` with `menuitemradio` role and one-way checked |
| H4  | Home/End keyboard navigation untested                             | Added 2 tests for Home and End key focus                           |
| H5  | Typeahead search untested                                         | Added 2 tests (single char + multi-char buffer)                    |
| H6  | Radio type untested                                               | Added 4 tests (role, aria-checked, click behavior, icon)           |
| H7  | Submenu `aria-haspopup` untested                                  | Added 1 test                                                       |
| H8  | No Radio Group Storybook story                                    | Added RadioGroupItems story with mutual exclusion                  |

---

## Issues Documented (Remaining)

### MEDIUM — Document for future work

| #   | Severity | Issue                                                              | Component       |
| --- | -------- | ------------------------------------------------------------------ | --------------- |
| M1  | MEDIUM   | No `open` property for declarative visibility control              | hx-menu         |
| M2  | MEDIUM   | Roving tabindex not implemented (all items have tabindex=0)        | hx-menu         |
| M3  | MEDIUM   | No visible focus ring (only bg change on focus-visible)            | hx-menu-item    |
| M4  | MEDIUM   | No dark mode specific tokens                                       | all             |
| M5  | MEDIUM   | Submenu positioning not implemented in CSS                         | hx-menu-item    |
| M6  | MEDIUM   | No `:active` pressed state styling                                 | hx-menu-item    |
| M7  | MEDIUM   | `hx-menu-divider` styles inline instead of separate `.styles.ts`   | hx-menu-divider |
| M8  | MEDIUM   | `SelectEvent` story contains dead `<script>` tag                   | stories         |
| M9  | MEDIUM   | No Storybook `argTypes` controls configured                        | stories         |
| M10 | MEDIUM   | Loading items excluded from keyboard nav without announcement      | hx-menu         |
| M11 | MEDIUM   | Inline SVGs inflate bundle (should use hx-icon)                    | hx-menu-item    |
| M12 | MEDIUM   | `_updateFocusedIndex` uses unreliable cross-shadow focus detection | hx-menu         |
| M13 | MEDIUM   | No accessible name support (aria-label prop) on hx-menu            | hx-menu         |

### LOW

| #   | Issue                                                           | Component |
| --- | --------------------------------------------------------------- | --------- |
| L1  | `_focusedIndex` private field visible in CEM                    | hx-menu   |
| L2  | `focusFirst()` / `focusLast()` public methods untested          | hx-menu   |
| L3  | No Drupal integration artifacts (Twig template, .libraries.yml) | all       |
| L4  | Keyboard navigation wrap tests assert existence, not focus      | tests     |

---

## Test Coverage

| Metric              | Before | After |
| ------------------- | ------ | ----- |
| Total tests         | 41     | 54    |
| New tests added     | —      | 13    |
| All tests passing   | Yes    | Yes   |
| axe-core a11y tests | 4      | 4     |

---

## Gate Status

| Gate                 | Status  | Notes                                                                               |
| -------------------- | ------- | ----------------------------------------------------------------------------------- |
| 1. TypeScript strict | PASS    | Zero errors                                                                         |
| 2. Tests             | PASS    | 54 tests passing, new coverage for typeahead/radio/Home/End/submenu                 |
| 3. Accessibility     | PARTIAL | aria-haspopup fixed; M2 (roving tabindex), M3 (focus ring), M13 (aria-label) remain |
| 4. Storybook         | PASS    | 12 stories including new RadioGroupItems                                            |
| 5. CEM accuracy      | PASS    | All events, CSS props, and slots documented                                         |
| 6. Bundle size       | UNKNOWN | Not measured in this audit                                                          |
| 7. Code review       | PENDING | Requires 3-tier review                                                              |
