# AUDIT: hx-icon-button (T1-02)

Antagonistic quality review of all files in `packages/hx-library/src/components/hx-icon-button/`.

**Auditor:** Deep audit agent
**Date:** 2026-03-05
**Files reviewed:** `hx-icon-button.ts`, `hx-icon-button.styles.ts`, `hx-icon-button.test.ts`, `hx-icon-button.stories.ts`, `index.ts`

---

## Summary

| Severity | Count |
| -------- | ----- |
| P0       | 0     |
| P1       | 7     |
| P2       | 6     |

Overall the component is structurally sound — aria-label, token usage, CEM JSDoc, and form association are all present. However several meaningful gaps exist: keyboard tests are false positives, double opacity stacking on disabled, a missing shape variant, missing loading state, a doc lie about console.warn, and an unsafe disabled anchor.

---

## P1 — High Severity (must fix before merge)

### P1-01: Keyboard tests do not test keyboard events

**File:** `hx-icon-button.test.ts:296-314`

Both `'Enter activates native button'` and `'Space activates native button'` call `btn?.click()`, which is a programmatic mouse event — not a keyboard event. These tests give false confidence that keyboard activation works. They duplicate the click event tests above them.

A real keyboard test requires dispatching a `KeyboardEvent` or using `@vitest/browser` `userEvent.keyboard('{Enter}')` / `userEvent.keyboard(' ')`.

```ts
// Current (incorrect — tests mouse click, not keyboard):
btn?.click();

// Required (actual keyboard test):
btn?.focus();
await userEvent.keyboard('{Enter}');
```

### P1-02: Double opacity stacking when disabled

**File:** `hx-icon-button.styles.ts:8-10` and `hx-icon-button.styles.ts:132-135`

Opacity is applied at two layers simultaneously:

```css
/* Layer 1 — on the host element */
:host([disabled]) {
  pointer-events: none;
  opacity: var(--hx-opacity-disabled); /* e.g. 0.5 */
}

/* Layer 2 — on the inner button */
.button[disabled] {
  cursor: not-allowed;
  opacity: var(--hx-opacity-disabled); /* e.g. 0.5 again */
}
```

CSS opacity is multiplicative across layers. If `--hx-opacity-disabled = 0.5`, the rendered button will appear at `0.5 * 0.5 = 0.25` opacity — far dimmer than intended. One of these rules must be removed.

### P1-03: Disabled anchor missing `tabindex="-1"`

**File:** `hx-icon-button.ts:174-187`

When `href` is set and `disabled` is true, the component removes `href` (via `ifDefined`) and sets `aria-disabled="true"`. An `<a>` without `href` is non-focusable by default in most browsers, but this is browser-dependent behavior — the spec does not guarantee it. For defensive keyboard management, the disabled anchor must explicitly set `tabindex="-1"`.

```html
<!-- Current: -->
<a part="button" aria-disabled="true" ...>
  <!-- Required: -->
  <a part="button" aria-disabled="true" tabindex="-1" ...></a
></a>
```

### P1-04: JSDoc claims console.warn is emitted — it is not

**File:** `hx-icon-button.ts:39` and `hx-icon-button.ts:112-115`

The `@property` JSDoc says: "A console warning is emitted when absent." The `connectedCallback` comment says: "Label validation now happens in render() which enforces it by rendering nothing." No `console.warn` call exists anywhere in the file.

This is a documentation lie that will mislead consumers: they expect a developer-facing warning during authoring, but they get silent failure (component renders nothing). The missing warn also removes an essential DX signal for the healthcare teams building with this component.

### P1-05: Missing `shape` property (circular variant not implemented)

**File:** `hx-icon-button.ts`, `hx-icon-button.styles.ts`

The audit spec explicitly calls out "circular/square shape variants" as a required audit area. No `shape` property exists. The `border-radius` is configurable via `--hx-icon-button-border-radius` but there is no first-class `shape="circle"` variant that sets `border-radius: 50%`. Without this, consumers wanting circular icon buttons (common in healthcare UI toolbars) must reach into the token, coupling their styles to internal implementation.

### P1-06: Missing `loading` state

**File:** `hx-icon-button.ts`, `hx-icon-button.test.ts`, `hx-icon-button.stories.ts`

The audit spec calls out "all states (default/disabled/loading)" as a required test and story area. No `loading` property exists on the component. There is no loading state in tests or stories. The `hx-button` component in this library may have a loading state — if so, `hx-icon-button` is inconsistent with its sibling.

### P1-07: `aria-disabled` is redundant on natively disabled `<button>`

**File:** `hx-icon-button.ts:196-198`

```html
<button ?disabled=${this.disabled} aria-disabled=${this.disabled ? 'true' : nothing}>
```

When `disabled` is true, the native `<button disabled>` is already exposed to the accessibility tree as `aria-disabled="true"` implicitly. Explicitly setting `aria-disabled="true"` on a natively disabled button is redundant. The concern: a natively disabled button is removed from tab order, meaning keyboard users cannot focus it to receive the tooltip label. Combining both attributes signals ambiguity about the design intent. The decision (native disabled vs. aria-disabled-only pattern) should be documented and one approach committed to.

**Note:** This is particularly important in healthcare: if disabled icon buttons convey important state (e.g., "action locked due to patient status"), keyboard users who cannot receive focus on a natively disabled button will miss this information.

---

## P2 — Medium Severity (should fix before v1.0)

### P2-01: Stale screenshot artifact — test that no longer exists

**File:** `__screenshots__/hx-icon-button.test.ts/hx-icon-button-Property--label-warns-via-console-warn-when-label-is-empty-1.png`

A screenshot exists for a test named `Property: label > warns via console warn when label is empty` — but this test is not in `hx-icon-button.test.ts`. The screenshot is either stale (test was deleted) or the test was renamed. Stale screenshots pollute the snapshot directory and can cause confusion about what behavior is verified.

### P2-02: Hardcoded hex colors in story inline styles

**File:** `hx-icon-button.stories.ts:444, 447, 471, 473, 497-502, 510, 519` (and throughout kitchen sink stories)

Story layout markup uses hardcoded hex colors: `#6b7280`, `#374151`, `#111827`, `#f9fafb`, `#e5e7eb`, etc. These are Tailwind values, not design tokens. Stories are documentation — they should demonstrate token-based theming. Using hardcoded values here models the wrong pattern for consumers.

### P2-03: Unused variable `_canvas` in Default story play function

**File:** `hx-icon-button.stories.ts:236`

```ts
const _canvas = within(canvasElement);
```

`_canvas` is never used. The underscore prefix suppresses linting but this is dead code that should be removed.

### P2-04: No Drupal integration file or Twig template example ✅ FIXED

**Resolution:** Added `hx-icon-button.twig` template covering all public properties including the non-standard `hx-size` attribute (exposed as the `hx_size` Twig variable to avoid Twig parsing conflicts). Added `README.drupal.md` with attribute reference, healthcare label guidance, event handling example using Drupal behaviors with `once()`, form submit/reset usage, and asset loading configuration. The `hx-size` attribute is prominently documented for Twig authors.

### P2-05: `--hx-icon-button-bg` has no base fallback value

**File:** `hx-icon-button.styles.ts:19`

```css
background-color: var(--hx-icon-button-bg);
```

No fallback is provided. If a consumer overrides a variant class or the token cascade fails, `background-color` resolves to `initial` (transparent). This is implicitly correct for ghost but fragile. Explicit fallback: `var(--hx-icon-button-bg, transparent)`.

### P2-06: Hover behavior inconsistent across variants (filter vs. background override)

**File:** `hx-icon-button.styles.ts:39-45, 84-116`

The base `.button:hover` applies `filter: brightness(0.9)`. However, `secondary`, `tertiary`, `ghost`, and `danger` variants override `--hx-icon-button-bg` on hover instead, which means they change color AND get the brightness filter applied. `primary` gets only the filter. This creates visual inconsistency: `danger` hover shows `danger-600` color at 90% brightness (double-darkening), while `primary` hover shows `primary-500` at 90% brightness only. The hover strategy should be unified.

---

## Gaps vs. Feature Description Audit Checklist

| Audit Area                                | Status     | Notes                                                               |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------- |
| TypeScript — no `any`, proper typing      | PASS       | All types are correct                                               |
| Accessibility — aria-label                | PASS       | Correctly set from `label`                                          |
| Accessibility — keyboard activation       | FAIL       | Tests use click(), not keyboard events (P1-01)                      |
| Accessibility — focus visible             | PASS       | `focus-visible` ring present                                        |
| Accessibility — axe-core                  | PASS       | Screenshots show zero violations                                    |
| Tests — all sizes                         | PASS       | sm/md/lg covered                                                    |
| Tests — all states (default/disabled)     | PASS       | Covered                                                             |
| Tests — loading state                     | FAIL       | Loading state does not exist (P1-06)                                |
| Tests — accessible label present          | PASS       | aria-label and title tested                                         |
| Storybook — all variants with controls    | PASS       | All 5 variants                                                      |
| Storybook — accessible label demonstrated | PASS       | Healthcare scenarios present                                        |
| Storybook — loading state                 | FAIL       | Not present (P1-06)                                                 |
| CSS — `--hx-*` tokens only                | PASS       | Component styles are token-only                                     |
| CSS — circular/square shape variants      | FAIL       | No shape property (P1-05)                                           |
| CSS — CSS parts exposed                   | PASS       | `button` and `icon` parts                                           |
| Performance — bundle < 5KB                | UNVERIFIED | Requires build measurement                                          |
| Drupal — Twig-renderable                  | PASS       | `hx-icon-button.twig` and `README.drupal.md` added (P2-04 ✅ FIXED) |
