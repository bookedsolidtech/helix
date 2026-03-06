# Deep Audit v2: hx-contextual-help

**Audited:** `packages/hx-library/src/components/hx-contextual-help/`
**Date:** 2026-03-06
**wc-mcp Health Score:** 84/100 (B)
**wc-mcp Accessibility Score:** 10/100 (F) — CEM metadata gap, not runtime

---

## Scores

| Dimension               | Score                         | Notes                                                                                                   |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| Component Health        | 84/100 (B)                    | Private members leak into CEM                                                                           |
| Accessibility (CEM)     | 10/100 (F)                    | ARIA patterns not documented in CEM metadata                                                            |
| Accessibility (Runtime) | PASS                          | dialog role, aria-labelledby, aria-expanded, keyboard nav, focus mgmt                                   |
| TypeScript              | PASS                          | Strict, zero `any`, zero errors                                                                         |
| Tests                   | 33 tests, all pass            | 4 rendering, 5 properties, 6 open/close, 4 events, 3 keyboard, 2 slots, 3 CSS parts, 5 ARIA, 2 axe-core |
| Storybook               | 10 stories                    | Default, 4 placements, 2 sizes, no heading, rich content, form demo, keyboard nav, events               |
| Design Tokens           | 12 CSS custom properties      | All major visual props tokenized                                                                        |
| CSS Parts               | 3 (trigger, popover, heading) | All documented in CEM                                                                                   |
| Events                  | 2 (hx-open, hx-close)         | Both tested, bubbles + composed                                                                         |

---

## Issues Fixed in This Audit

### FIXED: P0-01 — `role="dialog"` without accessible name when heading is empty

**Severity:** CRITICAL (was P0)
**File:** `hx-contextual-help.ts`

When `heading` is empty (the default), the popover dialog had no accessible name. WCAG 2.1 SC 4.1.2 requires dialogs to have an accessible name.

**Fix applied:** Added `aria-label=${hasHeading ? nothing : this.label}` fallback on the popover. When no heading is set, the `label` property (default "Help") serves as the dialog's accessible name.

**Test added:** New test "popover has aria-label fallback when heading is empty" verifies the behavior.

### FIXED: CEM accessibility documentation gap

**Severity:** HIGH
**File:** `hx-contextual-help.ts`

The wc-mcp accessibility score was F (10/100) because the component description didn't mention ARIA patterns.

**Fix applied:** Added accessibility documentation block to JSDoc describing aria-label, aria-expanded, role="dialog", aria-labelledby, Escape key, and keyboard activation patterns.

---

## Remaining Issues (Documented)

### P1-01: `aria-modal="false"` semantic debate

**Severity:** MEDIUM (downgraded from P1)
**File:** `hx-contextual-help.ts:228`

The popover uses `aria-modal="false"` with `role="dialog"`. This is technically valid — contextual help IS non-modal (user should still interact with the form while help is shown). A tooltip role could be considered but `role="dialog"` is more appropriate for rich content with interactive elements. **No change needed** — current implementation matches the non-modal contextual help pattern.

### P1-02: No focus trap for dialog

**Severity:** LOW (downgraded from P1)
**File:** `hx-contextual-help.ts`

No focus trap exists. However, this is a **non-modal** dialog — APG focus trap is only required for modal dialogs. The `aria-modal="false"` explicitly declares this as non-modal. Users should be able to Tab away to the form field they need help with. **No change needed.**

### P1-03: No visible close button in popover

**Severity:** MEDIUM
**File:** `hx-contextual-help.ts`

No close button inside the popover. Dismiss is via trigger re-click, Escape, or outside click. For touch-only users this may be sufficient (tap outside), but a visible close button would improve discoverability.

**Recommendation:** Consider adding an optional close button in a future enhancement. Not blocking.

### P2-01: Hover/active states use semantic tokens without component-level overrides

**Severity:** LOW
**File:** `hx-contextual-help.styles.ts:37-42`

`.trigger:hover` uses `var(--hx-color-neutral-100)` and `.trigger:active` uses `var(--hx-color-neutral-200)` without component-level token overrides. Consumers cannot independently theme hover/active states.

### P2-02: `min-width: 160px` hardcoded

**Severity:** LOW
**File:** `hx-contextual-help.styles.ts:80`

Should be a component-level token `--hx-contextual-help-min-width`.

### P2-03: `Math.random()` for IDs — not SSR-safe

**Severity:** LOW
**File:** `hx-contextual-help.ts:58-59`

Server-rendered HTML and client-side hydration will generate mismatched IDs. Consider `crypto.randomUUID()` or a counter-based approach.

### P2-04: `aria-controls` removed when closed

**Severity:** LOW
**File:** `hx-contextual-help.ts:258`

`aria-controls` is removed when popover is closed. Technically acceptable since the target element doesn't exist in DOM, but diverges from some sibling component patterns.

---

## Audit Dimensions Detail

### 1. Design Tokens

**Status:** PASS (12 tokens)

| Token                                        | Fallback                 | Purpose               |
| -------------------------------------------- | ------------------------ | --------------------- |
| `--hx-contextual-help-trigger-color`         | `--hx-color-primary-500` | Trigger icon color    |
| `--hx-contextual-help-trigger-border-radius` | `--hx-border-radius-md`  | Trigger border radius |
| `--hx-contextual-help-focus-ring-color`      | `--hx-focus-ring-color`  | Focus ring color      |
| `--hx-contextual-help-bg`                    | `--hx-color-neutral-0`   | Popover background    |
| `--hx-contextual-help-color`                 | `--hx-color-neutral-900` | Popover text color    |
| `--hx-contextual-help-border-color`          | `--hx-color-neutral-200` | Popover border        |
| `--hx-contextual-help-border-radius`         | `--hx-border-radius-md`  | Popover border radius |
| `--hx-contextual-help-shadow`                | `--hx-shadow-lg`         | Popover box shadow    |
| `--hx-contextual-help-padding`               | `--hx-spacing-4`         | Popover padding       |
| `--hx-contextual-help-max-width`             | `280px`                  | Max width             |
| `--hx-contextual-help-heading-color`         | `--hx-color-neutral-900` | Heading color         |
| `--hx-contextual-help-z-index`               | `9999`                   | Z-index               |

Dark mode: Supported via semantic token cascade. All fallbacks reference `--hx-*` semantic tokens that resolve differently in dark mode.

### 2. Accessibility

**Status:** PASS (runtime), needs CEM improvement

- Trigger: `<button>` with `aria-label`, `aria-expanded`, `type="button"`
- Popover: `role="dialog"`, `aria-labelledby` (with heading) or `aria-label` (without heading)
- Keyboard: Enter/Space toggles (native button), Escape closes, focus returns to trigger
- Focus: Popover receives focus on open, trigger receives focus on close
- SVG: `aria-hidden="true"` (decorative)
- Reduced motion: `@media (prefers-reduced-motion: reduce)` removes transitions
- axe-core: 2 tests (closed state, open with heading) — both pass

### 3. Functionality

**Status:** PASS

- Open/close via click toggle, `show()`/`hide()` methods, Escape key, outside click
- Popover positioning via `@floating-ui/dom` with flip, shift, offset middleware
- 4 placement options: top, bottom, left, right
- 2 size options: sm, md
- Heading renders as `<h3>` with part="heading"
- Default slot for rich content (text, links, HTML)

### 4. TypeScript

**Status:** PASS — zero errors, strict mode, no `any`

### 5. CSS/Styling

**Status:** PASS

- Shadow DOM encapsulation
- 3 CSS parts: trigger, popover, heading
- `position: fixed` strategy for popover (works in overflow containers)
- Focus-visible outline with token-driven color/width/offset
- Reduced motion support

### 6. CEM Accuracy

**Status:** PASS — All public API documented

- 4 properties (placement, heading, size, label)
- 2 methods (show, hide)
- 2 events (hx-open, hx-close)
- 1 slot (default)
- 3 CSS parts
- 12 CSS custom properties

### 7. Tests

**Status:** PASS — 33 tests, all passing

Coverage areas: rendering (4), properties (5), open/close (6), events (4), keyboard (3), slots (2), CSS parts (3), ARIA (5), axe-core (2)

### 8. Storybook

**Status:** PASS — 10 stories with interaction tests

Default, PlacementRight/Left/Top/Bottom, SizeSmall/Medium, NoHeading, RichContent, FormFieldDemo, KeyboardNavigation, EventsFiring

### 9. Drupal Compatibility

**Status:** PASS

- Standard custom element, attribute-driven API
- No framework dependencies in runtime
- Works in Twig templates: `<hx-contextual-help heading="Help" placement="right">Content</hx-contextual-help>`

### 10. Portability

**Status:** PASS

- Self-registering via `@customElement('hx-contextual-help')`
- CDN-ready (imports from index.ts)
- No framework-specific APIs
