# hx-dropdown — Antagonistic Quality Audit (T2-10)

**Auditor:** Antagonistic review agent
**Date:** 2026-03-06
**Component:** `packages/hx-library/src/components/hx-dropdown/`
**Test results at time of audit:** 29/29 pass, 93.25% line coverage, 64.58% branch coverage
**Bundle size:** 2.29 kB gzip (shared chunk including `@floating-ui/dom`)

---

## Severity Scale

- **P0** — Broken/incorrect behavior. Blocks functionality. Fix immediately.
- **P1** — Significant defect or ARIA violation. Fails quality gate. Must fix before merge.
- **P2** — Non-critical but notable gap. Should fix before `main`.

---

## P0 — Critical Defects

### P0-01: Focus management code is broken — Shadow DOM boundary violation

**File:** `hx-dropdown.ts:127-131`

```typescript
const firstFocusable = panel.querySelector<HTMLElement>(
  '[role="menuitem"], button, [tabindex]:not([tabindex="-1"]), a[href], input, select, textarea',
);
firstFocusable?.focus();
```

`this._panel` is a shadow DOM element. `querySelector` on a shadow DOM host element does **not** traverse slotted (light DOM) content. The menu items in the default slot (`<ul role="menu">…</ul>`) are assigned via `<slot>`, not children of the panel in the shadow tree. This query will always return `null`. Focus **never moves to the first menu item** when the dropdown opens.

To correctly find slotted elements, the code must use:
```typescript
const slot = panel.querySelector<HTMLSlotElement>('slot');
const assignedNodes = slot?.assignedElements({ flatten: true }) ?? [];
// then walk assignedNodes searching for focusable descendants
```

This means the APG Menu Button keyboard interaction pattern (Arrow Down from trigger focuses first item) is silently broken. All manual and automated tests missed this because they call `.focus()` on items directly rather than testing actual focus management.

---

## P1 — Significant Defects

### P1-01: `aria-haspopup="true"` is semantically incorrect

**File:** `hx-dropdown.ts:261`

```typescript
trigger.setAttribute('aria-haspopup', 'true');
```

ARIA 1.1+ specifies `aria-haspopup="menu"` when the popup is a menu. The value `"true"` is a legacy alias from ARIA 1.0. Screen readers that differentiate popup types (NVDA, JAWS) will announce this differently. Per the ARIA Authoring Practices Guide for Menu Button, `aria-haspopup="menu"` is required.

---

### P1-02: No `aria-controls` on trigger element

**File:** `hx-dropdown.ts:256-264`

The `_setupTriggerAria` method sets `aria-haspopup` and `aria-expanded` but never sets `aria-controls`. The trigger must reference the panel's `id` via `aria-controls` for screen readers to programmatically navigate from trigger to panel. The panel element currently has no `id` attribute.

---

### P1-03: Storybook Default story play function queries shadow DOM for light DOM content

**File:** `hx-dropdown.stories.ts:102`

```typescript
await expect(dropdown?.shadowRoot?.querySelector('[role="menu"]')).toBeTruthy();
```

`role="menu"` is on the slotted `<ul>` in the light DOM, not in the shadow DOM. `shadowRoot.querySelector('[role="menu"]')` always returns `null`. This assertion fails whenever the story's play function is run (e.g., in Storybook test mode / `storybook-test`). The correct check would be `dropdown?.querySelector('[role="menu"]')` (light DOM).

---

### P1-04: Branch coverage is 64.58% — below the 80% threshold

**File:** `hx-dropdown.ts:182-184`

```
hx-dropdown.ts | 93.25 | 64.58 | 93.75 | 96.05 | 182-184
```

Lines 182-184 (`_handleTriggerKeydown`) are uncovered. No test exercises keyboard open via Enter, Space, or ArrowDown on the trigger. This path is the primary keyboard interaction for the component and is entirely untested.

---

## P2 — Notable Gaps

### P2-01: No keyboard navigation within the panel (Arrow key roving)

**Files:** `hx-dropdown.ts`, `hx-dropdown.test.ts`

The ARIA Menu Button pattern (APG) requires Arrow Down / Arrow Up navigation between `role="menuitem"` elements after the panel opens. The component provides no such navigation. After opening, keyboard users must Tab through all items rather than using Arrow keys. This is a regression from expected ARIA menu button behavior.

Missing keyboard interactions:
- `ArrowDown` — move focus to next item (wrap to first)
- `ArrowUp` — move focus to previous item (wrap to last)
- `Home` — focus first item
- `End` — focus last item

---

### P2-02: Tab key behavior is non-standard

**File:** `hx-dropdown.ts:192-194`

```typescript
} else if (e.key === 'Tab' && this.open) {
  this._hide();
}
```

Calling `_hide()` on Tab returns focus to the trigger (via `trigger.focus()` in `_hide()`). This traps the user on the trigger element on Tab rather than letting focus advance naturally to the next page element. The APG spec says Tab should close the menu and move focus to the next focusable element in the page — not return to the trigger. The `trigger.focus()` call in `_hide()` must be conditional (only on Escape, not Tab).

---

### P2-03: `DropdownPlacement` type is not exported

**File:** `hx-dropdown.ts:13-21`

```typescript
type DropdownPlacement = 'top' | 'top-start' | ...;
```

This type is private to the module. The CEM manifest shows `placement` as type `"DropdownPlacement"` — opaque to consumers. TypeScript consumers cannot import this type for prop typing. Should be `export type DropdownPlacement = ...`.

---

### P2-04: `start` / `end` placement values are non-standard Floating UI placements

**File:** `hx-dropdown.ts:154-156`

```typescript
const floatingPlacement = this.placement
  .replace(/^start$/, 'left')
  .replace(/^end$/, 'right') as FloatingPlacement;
```

Floating UI supports `'left'` and `'right'` as placements, not `'start'` / `'end'`. The component wraps them with a string replacement. However, `'left'` and `'right'` are not logical properties and will be incorrect in RTL layouts. Consumers passing `placement="start"` may expect logical (RTL-aware) behavior. Either document the RTL limitation explicitly or use Floating UI's `inline` middleware with `flip()` for RTL support.

---

### P2-05: Missing tests for key interaction paths

**File:** `hx-dropdown.test.ts`

The following scenarios have no test coverage:

| Scenario | Impact |
|---|---|
| Keyboard open via Enter on trigger | Branch 182-184 — P1-04 above |
| Keyboard open via Space on trigger | Branch 182-184 |
| Keyboard open via ArrowDown on trigger | Branch 182-184 |
| Click-outside closes the panel | Outside click listener — logic untested |
| All `placement` values render without error | Regression guard |
| `hx-select` event `value` is `null` when no `data-value` set | Edge case |
| Focus returns to trigger on Escape | Only implicit via ARIA test |

---

### P2-06: `hx-select` panel click delegation is overly broad

**File:** `hx-dropdown.ts:206`

```typescript
const item = target.closest<HTMLElement>('[role="menuitem"], [data-value], li, button');
```

The bare `li` and `button` selectors will match any `<li>` or `<button>` in the panel including structural/decorative elements (e.g., `<li>` used as a group header, or `<button>` inside a form). This will fire spurious `hx-select` events and close the panel unintentionally. The selector should require `[role="menuitem"]` or `[data-value]` to be intentional.

---

### P2-07: Panel transition delay on `visibility` creates a brief invisible-but-interactive state

**File:** `hx-dropdown.styles.ts:29-32`

```css
transition:
  opacity 0.15s ease,
  visibility 0.15s ease;
```

Both `opacity` and `visibility` transition at 150ms. During close, `pointer-events` is restored to `none` only when `panel--visible` is removed (before transition starts) — that part is fine. But during open, `pointer-events: auto` and `visibility: visible` are set immediately (class addition), while opacity animates in. This is correct. No user-facing bug, but worth noting the dependency on class toggling being synchronous.

---

## Audit Summary

| Area | Findings | P0 | P1 | P2 |
|---|---|---|---|---|
| TypeScript | Type not exported, no `any` | 0 | 0 | 1 |
| Accessibility | `aria-haspopup`, `aria-controls`, keyboard nav | 0 | 2 | 2 |
| Tests | Missing keyboard paths, click-outside | 0 | 1 | 1 |
| Storybook | Play function shadow DOM query | 0 | 1 | 0 |
| CSS | All tokens used, no hardcoded values | 0 | 0 | 0 |
| Performance | 2.29 kB gzip — within budget | 0 | 0 | 0 |
| Implementation | Focus management bug (shadow DOM) | 1 | 0 | 2 |
| **Total** | | **1** | **4** | **6** |

**Verdict: DOES NOT PASS quality gate.** P0-01 (broken focus management) and P1-01 through P1-04 must be resolved before merge to `main`.
