# AUDIT: hx-tooltip — T1-22 Antagonistic Quality Review

**Reviewer:** Antagonistic audit pass
**Date:** 2026-03-05
**Scope:** All files in `packages/hx-library/src/components/hx-tooltip/`
**Verdict:** NOT SHIPPABLE — two P0 accessibility defects block release

---

## Summary

`hx-tooltip` has solid bones: Floating UI integration, correct `role="tooltip"`, keyboard dismiss, focus/hover show-hide, `prefers-reduced-motion` support, and reasonable CSS token coverage. However, it contains two P0 defects that completely break assistive technology support and violate WCAG 1.4.13. These are not edge cases — they are the two most fundamental requirements of a production tooltip.

| Severity | Count | Areas |
|----------|-------|-------|
| P0 | 2 | Accessibility |
| P1 | 5 | Accessibility, TypeScript, CSS, Tests |
| P2 | 6 | TypeScript, Tests, CSS, Performance, Drupal |

---

## P0 — Blocking

### P0-1: `aria-describedby` ID reference crosses Shadow DOM boundary — screen readers cannot find tooltip

**File:** `hx-tooltip.ts:97`
**Standard:** WCAG 1.3.1 (Info and Relationships) — Level A

The `_setupTriggerAria` method sets `aria-describedby` on the slotted trigger element (light DOM) pointing to `this._tooltipId`. The element with that `id` lives inside the shadow root. ARIA ID reference resolution is scoped to the element's root node (the document). Shadow DOM creates a separate ID scope. The ID `hx-tooltip-1` inside the shadow root is invisible to the document-level ARIA resolver.

**Result:** Screen readers announce the trigger with no accessible description. The tooltip content is never communicated to AT users regardless of visibility state. The `aria-describedby` attribute exists but is semantically dead.

**Evidence:** The axe-core test passes because axe does not currently cross shadow DOM boundaries for `aria-describedby` validation — this is a known axe limitation, not proof of correctness.

**Reproduction:** Use NVDA + Chrome or VoiceOver + Safari. Focus the trigger button. The announced description is empty.

**Fix direction (do not implement in this audit):** Options include: (1) duplicate tooltip text into a visually-hidden element in light DOM; (2) use the Accessibility Object Model `el.ariaDescribedByElements = [tooltipEl]` (limited browser support); (3) use `aria-label` on the trigger instead; (4) move the tooltip element out of shadow DOM into a light DOM portal.

---

### P0-2: `pointer-events: none` on tooltip violates WCAG 1.4.13 (Content on Hover or Focus)

**File:** `hx-tooltip.styles.ts:24`
**Standard:** WCAG 1.4.13 (Content on Hover or Focus) — Level AA

WCAG 1.4.13 requires that content appearing on hover must be **hoverable** — the user must be able to move the pointer over the revealed content without it disappearing. The tooltip sets `pointer-events: none`, which means:

1. The tooltip cannot receive mouse events
2. When the user moves the mouse from the trigger to the tooltip, `mouseleave` fires on `.trigger-wrapper`, scheduling `_scheduleHide`
3. The tooltip disappears as the user attempts to read it

This prevents users from:
- Hovering over the tooltip to read long content at their own pace
- Selecting and copying tooltip text
- Accessing any interactive content inside the tooltip (links, etc.)

**Reproduction:** Set `show-delay="0"`. Hover the trigger to show the tooltip. Move the mouse onto the tooltip content. The tooltip dismisses.

**Fix direction (do not implement):** Remove `pointer-events: none`. Add `@mouseenter`/`@mouseleave` listeners on the tooltip element itself to cancel the hide timer when hovered. This is the standard "safe triangle" or "hover bridge" pattern.

---

## P1 — High Priority

### P1-1: Mixed keyboard+mouse interaction hides tooltip while trigger is focused

**File:** `hx-tooltip.ts:189-194` (render)

If a keyboard user focuses the trigger (tooltip shows via `focusin`), and then the mouse accidentally enters and exits the trigger area, `mouseleave` fires on `.trigger-wrapper` and `_scheduleHide` runs — hiding the tooltip even though keyboard focus remains on the trigger.

The hide logic does not check whether the trigger still has focus. A `mouseleave` should not hide the tooltip if `document.activeElement` is the trigger or an element inside `.trigger-wrapper`.

---

### P1-2: `focusout` hide test missing — confirmed gap in behavior coverage

**File:** `hx-tooltip.test.ts`

The test suite has `focusin` shows tooltip (line 206) but no corresponding test that `focusout` hides tooltip. The implementation does have `@focusout=${this._scheduleHide}` (render line 192), but without a test this could regress silently. A focusout hide test is required to match the hover hide test.

---

### P1-3: `_handleKeydown` typed as `(e: Event)` instead of `(e: KeyboardEvent)`

**File:** `hx-tooltip.ts:176`

```ts
private _handleKeydown = (e: Event): void => {
  if ((e as KeyboardEvent).key === 'Escape' && this._visible) {
```

The listener is registered via `addEventListener('keydown', ...)`. TypeScript knows `keydown` produces `KeyboardEvent`. The parameter type should be `KeyboardEvent`, not `Event` with an internal cast. The cast `(e as KeyboardEvent)` suppresses the type system without adding safety. In strict mode this is not an error, but it is inconsistent with the project's zero-`as`-cast standard.

---

### P1-4: `_tooltipCounter` declared between import statements

**File:** `hx-tooltip.ts:3`

```ts
import { LitElement, html } from 'lit';

let _tooltipCounter = 0;     // ← line 3, between imports
import { customElement, property, state } from 'lit/decorators.js';
```

A `let` declaration appears between two `import` statements. While JavaScript permits this (imports are hoisted), it violates the ESLint `import/first` rule and the project's code style conventions. All imports should appear before any executable statements.

---

### P1-5: Arrow size offset hardcoded at `-4px` instead of deriving from `--hx-tooltip-arrow-size`

**File:** `hx-tooltip.ts:171`

```ts
[staticSide]: '-4px',
```

The component exposes `--hx-tooltip-arrow-size` (default `8px`). Half of the arrow size (`4px`) positions the arrow flush at the tooltip edge. If a consumer customizes `--hx-tooltip-arrow-size`, the arrow will be visually misaligned because the JavaScript offset is hardcoded. The offset should be computed from the arrow element's actual dimensions (`arrowEl.offsetWidth / 2`).

---

## P2 — Medium Priority

### P2-1: `placement` type is missing `'auto'` and alignment variants

**File:** `hx-tooltip.ts:50`

```ts
placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
```

Floating UI's `computePosition` accepts `Placement` which includes `'auto'`, `'top-start'`, `'top-end'`, `'bottom-start'`, `'bottom-end'`, `'left-start'`, `'left-end'`, `'right-start'`, `'right-end'`. The `flip()` middleware already handles collision — the component could allow full `Placement` typing to give consumers more control. Restricting to 4 values means aligned placements are impossible without a workaround.

---

### P2-2: No test verifying that `showDelay` actually delays the show

**File:** `hx-tooltip.test.ts`

All show-behavior tests use `show-delay="0"`. The default delay of 300ms is never verified. There is no test that:
1. Sets `show-delay="500"`
2. Dispatches `mouseenter`
3. Advances fake timers by 499ms — asserts tooltip NOT visible
4. Advances by 1 more ms — asserts tooltip IS visible

Without this test, delay regression is undetectable.

---

### P2-3: axe-core test only runs in hidden state — most critical a11y state is untested

**File:** `hx-tooltip.test.ts:237-244`

The axe-core test fixture is tested in the default (tooltip hidden) state. The ARIA relationships are only active when the tooltip is visible (`aria-hidden="false"`). The axe pass in hidden state does not validate the accessible name computation, live region behavior, or `aria-describedby` resolution at interaction time. An axe test with the tooltip visible (after `mouseenter` + timer advance) is required.

---

### P2-4: `word-wrap: break-word` is deprecated

**File:** `hx-tooltip.styles.ts:30`

`word-wrap` is a non-standard alias. The standard property is `overflow-wrap: break-word`. Both work in current browsers, but `word-wrap` may be removed in future browser versions. This should be replaced with the standard property.

---

### P2-5: `_tooltipCounter` will produce duplicate IDs after SSR hydration

**File:** `hx-tooltip.ts:3,71`

```ts
let _tooltipCounter = 0;
// ...
private readonly _tooltipId = `hx-tooltip-${++_tooltipCounter}`;
```

The module-level counter resets to `0` on each server render. If the server renders an `hx-tooltip` component and emits `id="hx-tooltip-1"`, then the client-side module also starts at `0` and produces `hx-tooltip-1` — creating an ID collision on hydration. The project targets Drupal, which may do server-side rendering. A `crypto.randomUUID()` or timestamp-based ID would be safer.

---

### P2-6: No Twig usage example in JSDoc or Storybook

**File:** `hx-tooltip.ts` JSDoc, `hx-tooltip.stories.ts`

The project's primary consumer is Drupal. There is no Twig template example showing how to render the trigger element and content slot from a Drupal context. The `HealthcareUseCases` story is valuable but no story or doc comment shows the Twig/CDN usage pattern. This is a documentation gap that affects Drupal developer adoption.

---

## Test Coverage Gaps (consolidated)

| Missing Test | Severity | Notes |
|---|---|---|
| `focusout` hides tooltip | P1 | Implementation exists, no coverage |
| Delay actually delays (500ms test) | P2 | All tests use delay=0 |
| axe-core in visible state | P2 | Hidden state only |
| `aria-describedby` cross-shadow boundary | P0 | Would expose P0-1 |
| Mouse over tooltip keeps it visible | P0 | Would expose P0-2 |
| Focused + mouseleave = tooltip stays | P1 | Would expose P1-1 |
| Placement collision (flip behavior) | P2 | No collision test |

---

## Storybook Coverage Gaps

| Missing Story | Severity |
|---|---|
| Hover-over-tooltip behavior demo | P0 — would expose WCAG 1.4.13 bug visually |
| Keyboard-only nav demo (no mouse) | P1 |
| Alignment variants (top-start, etc.) | P2 |
| `auto` placement demo | P2 |
| Visible tooltip + axe play function | P2 |

---

## What is Done Well

- Floating UI integration is correct — `flip()`, `shift()`, `offset()`, and `arrow()` middleware are all present
- `prefers-reduced-motion: reduce` disables transition correctly
- `role="tooltip"` is present and `aria-hidden` toggles correctly with visibility
- Escape key handler is implemented and tested
- CSS token coverage is thorough — all visual properties are tokenized
- Both `focusin` and `mouseenter` trigger show (keyboard and mouse users both considered in implementation intent)
- `pointer-events: none` on arrow is correct (arrow should not intercept events)
- Floating UI is imported from `@floating-ui/dom` (correct tree-shakable package, not the heavier core)
- `strategy: 'fixed'` correctly escapes `overflow: hidden` ancestors
- `@slotchange` listener re-runs ARIA setup when slot content changes — good defensive coding
- Timer cleanup in `disconnectedCallback` prevents memory leaks
- `_clearTimers()` is called before scheduling both show and hide — prevents race conditions between rapid hover in/out

---

## Files Reviewed

| File | Lines | Status |
|---|---|---|
| `hx-tooltip.ts` | 214 | P0+P1 defects |
| `hx-tooltip.styles.ts` | 52 | P0 defect |
| `hx-tooltip.test.ts` | 246 | Coverage gaps |
| `hx-tooltip.stories.ts` | 342 | Coverage gaps |
| `index.ts` | — | Not reviewed (re-export only) |
