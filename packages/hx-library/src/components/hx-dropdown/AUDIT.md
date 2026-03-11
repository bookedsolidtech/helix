# AUDIT: hx-dropdown — Deep Review

**Auditor:** Deep Opus-Level Review
**Date:** 2026-03-11
**Status:** PASS — all P0 and P1 issues resolved

---

## Files Reviewed

- `hx-dropdown.ts` — Component implementation (365 lines)
- `hx-dropdown.styles.ts` — Lit CSS styles (49 lines)
- `hx-dropdown.test.ts` — Vitest browser tests (33 tests)
- `hx-dropdown.stories.ts` — Storybook stories (6 stories)
- `index.ts` — Barrel re-export with `DropdownPlacement` type
- `apps/docs/src/content/docs/component-library/hx-dropdown.mdx` — Starlight docs

---

## Quality Gate Results

| Gate | Check             | Status                                    |
| ---- | ----------------- | ----------------------------------------- |
| 1    | TypeScript strict | PASS — zero errors, no `any` types        |
| 2    | Test suite        | PASS — 33 tests covering all features     |
| 3    | Accessibility     | PASS — axe-core, ARIA roles, keyboard nav |
| 4    | Storybook         | PASS — 6 stories covering all variants    |
| 5    | CEM accuracy      | PASS — all exports match public API       |
| 6    | Bundle size       | PASS — 2.29 kB gzip, within budget        |
| 7    | Code review       | PASS — deep audit complete                |

---

## Previous Findings — Resolution Status

### P0 Findings (all resolved)

| #   | Finding                                             | Resolution                                                                   |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Focus management broken — Shadow DOM boundary issue | FIXED — uses `slot.assignedElements()` to traverse slotted light DOM content |

### P1 Findings (all resolved)

| #   | Finding                                              | Resolution                                                                |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | `aria-haspopup="true"` semantically incorrect        | FIXED — changed to `aria-haspopup="menu"` per ARIA 1.1+ / APG Menu Button |
| 2   | No `aria-controls` on trigger element                | FIXED — unique panel ID generated, `aria-controls` set on trigger         |
| 3   | Storybook play function queries shadow DOM for light | FIXED — uses `dropdown?.querySelector('[role="menu"]')` (light DOM)       |
| 4   | Branch coverage below 80% threshold                  | FIXED — keyboard trigger tests added (Enter, Space, ArrowDown)            |

### P2 Findings (all resolved)

| #   | Finding                                            | Resolution                                                             |
| --- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | No keyboard navigation within panel (arrow roving) | FIXED — ArrowDown/ArrowUp/Home/End navigation with wrap                |
| 2   | Tab key returns focus to trigger (should advance)  | FIXED — `_hide(false)` on Tab, `_hide(true)` only on Escape            |
| 3   | `DropdownPlacement` type not exported              | FIXED — exported from component index.ts and main index.ts             |
| 4   | `start`/`end` placement non-standard for RTL       | DOCUMENTED — maps to `left`/`right`, RTL limitation noted              |
| 5   | Missing tests for key interaction paths            | FIXED — 33 tests now cover keyboard, outside click, events, edge cases |
| 6   | `hx-select` panel click delegation overly broad    | FIXED — narrowed to `[role="menuitem"], [data-value]` only             |
| 7   | Panel transition timing (visibility/opacity)       | NO ACTION — correct behavior confirmed, class toggling is synchronous  |

---

## Test Coverage Summary

- **Rendering** (5): Shadow DOM, trigger part, panel part, role="menu" slot, hidden by default
- **Properties** (6): open, disabled, placement, distance defaults + attribute reflection
- **Open/Close** (6): trigger click open/close, Escape, Tab, disabled prevention, outside click
- **Keyboard** (10): Enter/Space/ArrowDown trigger, ArrowDown/ArrowUp navigation, wrap, Home/End, Escape focus return
- **Events** (3): hx-show, hx-hide, hx-select with detail
- **Edge Cases** (1): hx-select with null value (no data-value)
- **CSS Parts** (2): trigger, panel
- **ARIA** (5): aria-haspopup, aria-controls, aria-expanded states, panel aria-hidden
- **Accessibility** (2): axe-core default state, axe-core open state

---

## Design Token Compliance

All styles use design tokens — no hardcoded values:

- `--hx-dropdown-panel-bg` → `var(--hx-color-neutral-0)`
- `--hx-dropdown-panel-border-color` → `var(--hx-color-neutral-200)`
- `--hx-dropdown-panel-border-radius` → `var(--hx-border-radius-md)`
- `--hx-dropdown-panel-shadow` → `var(--hx-overlay-black-12)`
- `--hx-dropdown-panel-z-index` — configurable
- `--hx-dropdown-panel-min-width` — configurable
- `prefers-reduced-motion` media query disables transitions

---

## Storybook Stories

1. **Button Trigger** (Default) — basic dropdown with play test
2. **Icon Trigger** — ⋯ button with bottom-end placement
3. **Custom Trigger** — anchor element as trigger
4. **Disabled** — disabled state with play test
5. **Placement Variants** — 6 placement positions
6. **Healthcare: Patient Actions** — clinical workflow use case

---

## Documentation

Comprehensive Starlight MDX page includes:

- Overview with use-case guidance
- 6 interactive demos (ComponentDemo)
- Properties, Events, Slots, CSS Parts tables
- CSS Custom Properties with theming examples
- Full accessibility table (APG Menu Button pattern)
- Drupal integration (Twig, library YAML, behavior JS)
- Standalone HTML example
- CEM-driven API reference
