# AUDIT: hx-alert — Deep Opus-Level Quality Review

**Reviewer:** Deep audit agent (Opus 4.6)
**Date:** 2026-03-11
**Scope:** `packages/hx-library/src/components/hx-alert/`
**Files reviewed:** `hx-alert.ts`, `hx-alert.styles.ts`, `hx-alert.test.ts`, `hx-alert.stories.ts`, `index.ts`, `hx-alert.twig`

---

## Summary

| Severity | Count |
| -------- | ----- |
| P0       | 1     |
| P1       | 1     |
| P2       | 7     |
| P3       | 3     |

**Previous audit (2026-03-05) status:** 14 of 19 findings have been remediated. The component is substantially improved — ARIA role placement, focus management, title slot, accent variant, touch target sizing, and type naming are all fixed. The remaining findings are concentrated in Storybook story accuracy and feature completeness gaps.

---

## P0 — Blocking Defects

### P0-01: Storybook play functions assert ARIA attributes that no longer exist

**File:** `hx-alert.stories.ts` — Default (line ~103-104), Info (line ~135-136), Warning (line ~170-171), Error (line ~188-189)

Multiple Storybook play functions query the shadow DOM internal `[part="alert"]` div for `role` and `aria-live` attributes:

```ts
await expect(container?.getAttribute('role')).toBe('status');
await expect(container?.getAttribute('aria-live')).toBe('polite');
```

**Problem:** After the P1-01 remediation from the previous audit, `role` is now set on the **host element** (not the shadow internal div), and `aria-live` is **intentionally never set** (to avoid JAWS double-announcements). These assertions will always fail:

- `container?.getAttribute('role')` → `null` (role is on host, not internal div)
- `container?.getAttribute('aria-live')` → `null` (intentionally omitted)

**Impact:** All Storybook interaction tests for Default, Info, Warning, and Error stories are broken. This blocks Storybook CI validation and makes the component appear broken in the Storybook playground.

**Affected stories:** `Default`, `Info`, `Success` (partial), `Warning`, `Error`, `RapidToggle`

**Fix direction:** Update play functions to query `alert.getAttribute('role')` on the host element and remove `aria-live` assertions entirely.

---

## P1 — High Severity

### P1-01: Stories use `?icon` binding but property attribute is `show-icon`

**File:** `hx-alert.stories.ts` — meta render function (line ~73), argTypes (line ~43)

The meta render template binds `?icon=${args.icon}`, which sets/removes an HTML attribute named `icon`. But the component property is `showIcon` with `attribute: 'show-icon'`. The `?icon` binding has no effect — it creates a meaningless `icon` attribute that the component ignores.

```ts
// Current (broken):
?icon=${args.icon}

// Correct:
?show-icon=${args.icon}
```

**Impact:** The "Show Icon" toggle in Storybook controls does nothing. Users cannot interactively test icon visibility through the Storybook UI. This undermines the component's documentation value.

**Fix direction:** Change `?icon` to `?show-icon` in the render function. Consider renaming the argType from `icon` to `showIcon` for consistency with the property name.

---

## P2 — Medium Severity

### P2-01: CEM exposes private members in public manifest

**File:** `custom-elements.json` (generated)

The Custom Elements Manifest includes all private members: `_hasActions`, `_hasTitle`, `_actionsSlotChangeHandler`, `_titleSlotChangeHandler`, `_isAssertive`, `_role`, `_renderInfoIcon`, `_renderSuccessIcon`, `_renderWarningIcon`, `_renderErrorIcon`, `_renderDefaultIcon`, `_renderCloseIcon`, `_handleDismiss`.

13 private implementation details appear in the public API manifest. CEM consumers (Storybook autodocs, IDE plugins, documentation generators) will surface these as part of the component's public API, creating noise and confusion.

**Fix direction:** Add `@internal` JSDoc tags to private members, or configure CEM analyzer to exclude `private` privacy members. Alternatively, use a CEM post-processing plugin to strip private members.

### P2-02: No auto-dismiss timer capability

**Audit scope explicitly requested:** "auto-dismiss timer"

No `duration`, `auto-dismiss`, or timeout property exists. Success and info alerts commonly auto-dismiss after a configurable timeout (e.g., 5 seconds). Peer libraries:

- Shoelace `sl-alert`: `duration` property in ms
- Carbon `cds-notification`: `timeout` property
- Adobe Spectrum: `timeout` attribute

For healthcare, auto-dismiss is appropriate only for non-critical informational alerts. Error/warning alerts should never auto-dismiss (patient safety). If implemented, should default to disabled and be restricted to `info`/`success` variants.

**Fix direction:** Add optional `duration` property (number, ms). When set and variant is info/success, start a timer on render that calls `_handleDismiss()` with `detail.reason = 'timeout'`. Clear timer on disconnect or manual dismiss.

### P2-03: No toast-style stacking or positioning support

**Audit scope explicitly requested:** "toast-style stacking"

The component has no positioning mechanism for toast/notification patterns (fixed/absolute positioning, stacking order, entrance/exit animations). This is typically handled by a companion container component (e.g., `hx-alert-group` or `hx-toast-container`), not the alert itself.

**Current workaround:** Consumers must build their own stacking container (as shown in the `StackedAlerts` story, which uses a simple flex column).

**Fix direction:** Consider creating a companion `hx-alert-group` component that handles positioning, stacking, and animation. The alert component itself should not be responsible for positioning.

### P2-04: Missing Storybook stories for key features

Three significant component features lack dedicated Storybook stories:

1. **`accent` variant** — Left border stripe mode has no story. Only tested in Vitest.
2. **`title` slot** — The title slot has no dedicated story showing structured alert content with headline + body.
3. **`returnFocusTo` property** — Focus management has no interactive story demonstrating the pattern.

These gaps reduce documentation coverage and make the Storybook playground incomplete for evaluating the component's full API surface.

**Fix direction:** Add dedicated stories: `AccentVariant`, `WithTitle`, `FocusReturn`.

### P2-05: CSS Parts demo story references 5 parts but component exposes 6

**File:** `hx-alert.stories.ts` — CSSParts story JSDoc (line ~784)

```ts
/** Demonstrates all 5 CSS `::part()` targets exposed by `hx-alert`. */
```

The component exposes 6 parts: `alert`, `title`, `icon`, `message`, `close-button`, `actions`. The `title` part was added after this story was written.

**Fix direction:** Update JSDoc to say "6 CSS `::part()` targets" and add `::part(title)` styling to the demo.

### P2-06: `AlertVariant` type not exported

**File:** `hx-alert.ts:8`, `index.ts:1`

The `AlertVariant` type (`'info' | 'success' | 'warning' | 'error'`) is defined locally but not exported from the component or the barrel file. Consumers who want to type-check variant values in their TypeScript code cannot import this type.

**Fix direction:** Export `AlertVariant` from `hx-alert.ts` and re-export from `index.ts`:

```ts
export type { AlertVariant } from './hx-alert.js';
```

### P2-07: Live region re-announcement reliability on `open` toggle

**File:** `hx-alert.ts:179-188`, `hx-alert.styles.ts:8-10`

When an alert transitions from `open=false` to `open=true`, the host toggles from `display:none` to `display:block` and `aria-hidden` is removed. Whether screen readers re-announce the live region content depends on AT implementation:

- NVDA + Firefox: Generally re-announces on `aria-hidden` removal
- JAWS + Chrome: Inconsistent — may not re-announce existing content
- VoiceOver + Safari: Generally re-announces

No test verifies actual announcement behavior. The component handles this as well as possible without `aria-live` (which would cause JAWS double-announcements), but the inherent AT inconsistency should be documented for consumers.

**Fix direction:** Add JSDoc documentation on the `open` property noting the AT behavior variance. Consider adding a recipe/pattern in docs showing how to force re-announcement by clearing and re-inserting content.

---

## P3 — Low Severity / Informational

### P3-01: `color-mix()` browser support caveat

**File:** `hx-alert.styles.ts:124`

```css
background-color: color-mix(in srgb, currentColor 10%, transparent);
```

`color-mix()` requires Chrome 111+, Firefox 113+, Safari 16.2+. Falls back gracefully to no hover background (transparent) in older browsers. A comment documents the browser support range (line 122-123). This is acceptable for modern healthcare applications but should be noted in the component's browser support documentation.

### P3-02: Twig template `show-icon` logic is inverted/verbose

**File:** `hx-alert.twig:41`

```twig
{% if not show_icon %}{% else %}show-icon{% endif %}
```

This works correctly but is an unnecessarily complex way to express "output `show-icon` when `show_icon` is true." Simpler:

```twig
{% if show_icon %}show-icon{% endif %}
```

### P3-03: No `fill="currentColor"` on variant icon SVGs

**File:** `hx-alert.ts:194-222`

The default variant icon SVGs rely on the parent `.alert__icon svg { fill: currentColor }` CSS rule to inherit their fill color. The SVG elements themselves don't set `fill="currentColor"`. This works correctly in Shadow DOM where the CSS is co-located, but if the SVGs were ever extracted or used outside the shadow root context, they would render black (default SVG fill). Minor robustness concern.

---

## Previous Audit Remediation Status

| Previous Finding                        | Status         | Notes                                                                              |
| --------------------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| P0-01: Double event dispatch            | **FIXED**      | `_handleCloseKeydown` removed; native button + `@click` only                       |
| P1-01: ARIA role on shadow DOM internal | **FIXED**      | Role applied to host in `connectedCallback` + `updated`                            |
| P1-02: Live region reliability          | **Mitigated**  | Host-level role + `aria-hidden` toggle; inherent AT variance remains (P2-07 above) |
| P1-03: Missing title slot               | **FIXED**      | `slot="title"` with slotchange detection + visibility toggle                       |
| P1-04: Left border accent variant       | **FIXED**      | `accent` property + `.alert--accent` styles                                        |
| P1-05: Touch target relative units      | **FIXED**      | Uses `var(--hx-touch-target-size, 44px)` with absolute default                     |
| P1-06: Focus management                 | **FIXED**      | `returnFocusTo` property with CSS selector targeting                               |
| P1-07: Stale screenshots                | **FIXED**      | No stale screenshot files found                                                    |
| P2-01: icon/showIcon naming collision   | **FIXED**      | Property renamed to `showIcon`, attribute `show-icon`                              |
| P2-02: WcAlert type alias               | **FIXED**      | Now exports `HxAlert`                                                              |
| P2-03: color-mix() caveat               | **Documented** | Browser support comment added (P3-01 above)                                        |
| P2-04: Actions container spacing        | **FIXED**      | JS slotchange detection + `display:none` default                                   |
| P2-05: Missing initial icon=false test  | **FIXED**      | Boolean attribute semantics test added                                             |
| P2-06: Redundant import                 | **FIXED**      | No unused imports in test file                                                     |
| P2-07: No aria-live tests               | **Deferred**   | Inherent AT limitation; documented (P2-07 above)                                   |
| P2-08: No Twig template                 | **FIXED**      | `hx-alert.twig` added with full variable support                                   |
| P2-09: Bundle size verification         | **VERIFIED**   | 3.65 KB gzipped — well under 5 KB budget                                           |
| P3-01: WCAG citation                    | **FIXED**      | Comment corrected to reference WCAG 2.5.8                                          |
| P3-02: Close icon SVG                   | **Unchanged**  | Minor maintainability concern; no action needed                                    |

---

## Verification Results

| Gate | Check             | Result                                                         |
| ---- | ----------------- | -------------------------------------------------------------- |
| 1    | TypeScript strict | **PASS** — Zero errors                                         |
| 2    | Test suite        | **PASS** — 57/57 tests pass                                    |
| 3    | Accessibility     | **PASS** — axe-core: 4 test scenarios, zero violations         |
| 4    | Storybook stories | **FAIL** — Play function assertions are broken (P0-01)         |
| 5    | CEM accuracy      | **PARTIAL** — Public API correct; private members leak (P2-01) |
| 6    | Bundle size       | **PASS** — 3.65 KB gzipped (budget: <5 KB)                     |
| 7    | Code review       | This document                                                  |

---

## Verdict

The component has improved significantly since the previous audit. The core implementation is solid:

- Correct ARIA role placement on host element
- Proper Shadow DOM encapsulation with 6 CSS parts and 11 CSS custom properties
- Complete design token usage (zero hardcoded values)
- Comprehensive test suite (57 tests, all passing)
- axe-core validation across all variants and states
- Well under bundle size budget at 3.65 KB gzipped

**Remaining blockers:**

1. **P0-01** — Storybook play functions are broken and will fail in CI. Must be fixed before the stories can be trusted.
2. **P1-01** — Storybook `icon` control does nothing, undermining documentation.

**Feature gaps (not blockers):**

- Auto-dismiss timer (P2-02) and toast stacking (P2-03) are feature requests, not bugs
- Missing stories for accent/title/returnFocusTo reduce documentation coverage but don't block shipping
