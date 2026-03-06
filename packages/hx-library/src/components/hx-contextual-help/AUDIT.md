# AUDIT: hx-contextual-help (T3-06) — Antagonistic Quality Review

**Reviewed:** `packages/hx-library/src/components/hx-contextual-help/`
**Files audited:**

- `hx-contextual-help.ts`
- `hx-contextual-help.styles.ts`
- `hx-contextual-help.test.ts`
- `hx-contextual-help.stories.ts`
- `index.ts`

---

## Summary

| Severity | Count |
| -------- | ----- |
| P0       | 1     |
| P1       | 5     |
| P2       | 7     |

---

## P0 — Critical (blocks merge)

### P0-01: `role="dialog"` without accessible name when `heading` is empty

**File:** `hx-contextual-help.ts`, lines 221–239

When `heading` is empty (the default), the rendered popover is:

```html
<div role="dialog" aria-modal="false" tabindex="-1">
  <div class="popover__body"><slot></slot></div>
</div>
```

There is no `aria-label` and no `aria-labelledby`. WCAG 2.1 SC 4.1.2 and ARIA spec both require dialogs to have an accessible name. Screen readers will announce "dialog" with no label — users get zero context about what the dialog contains.

The axe-core test suite (`Accessibility (axe-core)`) only tests the open state **with a heading** (`has no axe violations in open state with heading`). There is no axe test for the open state **without a heading**. The P0 violation is undetected by the existing test suite.

**Required fix:** Add a `label` or `aria-label` fallback when `heading` is empty. At minimum:

```ts
aria-label=${!hasHeading ? this.label : nothing}
aria-labelledby=${hasHeading ? this._headingId : nothing}
```

This reuses the existing `label` property (default `"Help"`) as the dialog's accessible name when no heading is provided.

---

## P1 — High (significant quality gap)

### P1-01: `aria-modal="false"` is incorrect and harmful

**File:** `hx-contextual-help.ts`, line 229

```html
aria-modal="false"
```

`aria-modal="false"` explicitly tells assistive technologies that this dialog does **not** restrict the virtual cursor to its content. For a `role="dialog"` element this is the wrong semantic — ARIA authoring practices for dialogs state that `aria-modal="true"` should be set when the dialog is intended to focus the user's attention (even non-blocking popovers benefit from it to guide screen reader navigation). Setting `aria-modal="false"` causes screen readers to continue reading surrounding page content as if the dialog weren't open, defeating the purpose of the `role="dialog"` pattern.

If non-modal informational behavior is intended, the correct role is `role="tooltip"` or `role="status"`, not `role="dialog"` with `aria-modal="false"`.

---

### P1-02: Focus trap absent for `role="dialog"`

**File:** `hx-contextual-help.ts`, lines 120–133

The `_show()` method moves focus to the popover container (`this._popoverEl?.focus()`), but there is no focus trap. Once the user presses Tab from inside the popover, focus escapes to the next focusable element in the page, leaving the "dialog" open and the user disoriented.

ARIA Authoring Practices Guide (APG) dialog pattern requires that Tab and Shift+Tab cycle focus within the dialog until it is dismissed. This is especially important in healthcare UIs where the form field needing help is adjacent to the trigger — a Tab keypress from inside the popover will land on that field, not return to the trigger.

**Required fix:** Add Tab/Shift+Tab trap: collect all focusable descendants of `.popover__body`, intercept Tab on last element to return to first, and Shift+Tab on first to return to last (or close and return to trigger).

---

### P1-03: No close button inside the popover

**File:** `hx-contextual-help.ts`, `hx-contextual-help.stories.ts`

The popover has no visible close button. The only way to dismiss it is: second click on the trigger, Escape key, or clicking outside. For keyboard-only users who have Tab focus inside the popover and cannot reach the trigger or fire Escape naturally, there is no in-popover dismiss affordance.

APG dialog pattern requires a visible close mechanism inside the dialog. This is also needed for mobile/touch users who may have opened the popover and have no keyboard available.

**Required fix:** Add an `×` close button to the popover header (or footer). Expose it as a `csspart` (e.g., `part="close-button"`).

---

### P1-04: Missing test — axe-core for open state without heading

**File:** `hx-contextual-help.test.ts`, lines 313–332

The axe-core suite has two tests:

1. Closed state (passes — no dialog rendered)
2. Open state **with heading** (passes — dialog has `aria-labelledby`)

There is no test for open state **without heading**. This gap masks the P0-01 violation described above. A component can claim axe-core compliance while failing on its most common use case (no heading).

---

### P1-05: Missing test — focus returns to trigger after `hide()`

**File:** `hx-contextual-help.test.ts`

The `_hide()` method calls `this._triggerEl?.focus()` to return focus to the trigger (line 141). There is no test verifying this behavior. Focus management is a critical accessibility requirement and regressions here would be silent.

There is also no test for focus moving **into** the popover on `show()`, which is required by the ARIA dialog pattern (and partially implemented via `this._popoverEl?.focus()`).

---

## P2 — Medium (code quality / completeness)

### P2-01: `.trigger:hover` and `.trigger:active` use raw semantic tokens without component-level overrides

**File:** `hx-contextual-help.styles.ts`, lines 37–42

```css
.trigger:hover {
  background-color: var(--hx-color-neutral-100);
}
.trigger:active {
  background-color: var(--hx-color-neutral-200);
}
```

These states hardcode semantic tokens without exposing component-level custom property overrides (e.g., `--hx-contextual-help-trigger-hover-bg`). Consumers cannot theme hover/active states independently from the neutral palette. All other interactive states on the trigger expose a component token; these two do not. Inconsistent token exposure.

---

### P2-02: `min-width: 160px` is a hardcoded magic number

**File:** `hx-contextual-help.styles.ts`, line 80

```css
min-width: 160px;
```

This violates the project's no-hardcoded-values rule (CLAUDE.md). It should be a design token or a component-level custom property (e.g., `--hx-contextual-help-min-width`).

---

### P2-03: `placement` and `size` have no runtime validation

**File:** `hx-contextual-help.ts`, lines 68–84

The `placement` and `size` properties are typed as union literals in TypeScript but there is no runtime guard. If a consumer sets `placement="diagonal"` via an HTML attribute (e.g., from a CMS or Twig template), it will be passed directly to `computePosition()` from `@floating-ui/dom`, which silently falls back to an undefined behavior. In a healthcare UI rendered from Drupal, attribute values come from CMS editors — runtime validation with a console warning is warranted.

---

### P2-04: Storybook missing explicit "with links" story

**File:** `hx-contextual-help.stories.ts`

The audit specification explicitly requires: "Storybook — with text content, with links, all placements." The `RichContent` story (lines 164–178) has a list but no hyperlinks. There is no story demonstrating a popover with `<a>` elements inside the slot — which is important for verifying focus management with interactive content and for validating that links are visually styled correctly inside the shadow DOM context.

---

### P2-05: `FormFieldDemo` story uses inline styles instead of design tokens

**File:** `hx-contextual-help.stories.ts`, lines 185–264

The `FormFieldDemo` story has extensive inline `style="..."` attributes with hardcoded hex colors (`#111827`, `#374151`, `#d1d5db`), pixel values, and raw CSS. This demonstrates the component in a context that actively contradicts the design system's token architecture. If this story is used as reference by implementors (which is its purpose), it teaches the wrong pattern.

---

### P2-06: `_headingId` and `_popoverId` use `Math.random()` — not SSR-safe

**File:** `hx-contextual-help.ts`, lines 58–59

```ts
private readonly _headingId = `hx-contextual-help-heading-${Math.random().toString(36).slice(2, 9)}`;
private readonly _popoverId = `hx-contextual-help-popover-${Math.random().toString(36).slice(2, 9)}`;
```

`Math.random()` is not cryptographically random and produces different values on each instantiation — meaning server-rendered HTML and client-side hydration will generate mismatched IDs. Prefer `crypto.randomUUID()` (or the existing pattern used in sibling components if one exists) for deterministic ID generation in SSR contexts.

---

### P2-07: `aria-controls` on trigger only set when open — violates ARIA spec

**File:** `hx-contextual-help.ts`, line 258

```ts
aria-controls=${this._open ? this._popoverId : nothing}
```

The `aria-controls` attribute is removed entirely when the popover is closed. ARIA spec says `aria-controls` should reference the controlled element's ID regardless of its open/closed state — the button controls that region whether it is visible or not. When the popover is rendered conditionally (`_renderPopover()` returns `nothing` when closed), the referenced element does not exist in the DOM, making this technically acceptable as a workaround. However, the pattern diverges from sibling components (`hx-popover`) and creates an inconsistency reviewers must re-explain. A better approach is to always render the popover element (with `hidden` or `inert` when closed) and always maintain `aria-controls`.

---

## Non-Issues (confirmed acceptable)

- **TypeScript types**: `placement: 'top' | 'bottom' | 'left' | 'right'`, `size: 'sm' | 'md'`, `label: string`, `heading: string` — all typed correctly with no `any`.
- **SVG `aria-hidden="true"`**: Correct. The icon is decorative; the button's `aria-label` carries the accessible name.
- **`@floating-ui/dom` dependency**: Already a project dependency (used by `hx-popover`). Not a new bundle addition.
- **`aria-expanded` on trigger**: Correctly toggles between `"true"` and `"false"` and is tested.
- **Outside-click-to-close**: Implemented correctly via `document.addEventListener('click', ...)` added on show and removed on hide.
- **Escape key closes popover**: Implemented and tested (3 keyboard tests).
- **CSS token usage (general)**: `--hx-*` tokens used consistently throughout, with `--hx-contextual-help-*` component tokens exposed for all major visual properties.
- **Reduced-motion support**: `@media (prefers-reduced-motion: reduce)` block present.
- **`type="button"` on trigger**: Correct. Prevents accidental form submission.
- **`disconnectedCallback` cleanup**: Document-level click listener removed on disconnect.
