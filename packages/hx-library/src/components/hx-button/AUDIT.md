# AUDIT: hx-button (T1-01)

**Date:** 2026-03-05
**Reviewer:** Automated antagonistic audit
**Scope:** Full quality review of all files in `packages/hx-library/src/components/hx-button/`
**Files reviewed:**
- `hx-button.ts`
- `hx-button.styles.ts`
- `hx-button.test.ts`
- `hx-button.stories.ts`
- `index.ts`
- `custom-elements.json` (CEM output, hx-button section)

**Overall verdict:** Structurally sound, well-typed, good test breadth. Three serious defects found (one WCAG Level A violation, one security vulnerability, one visual bug). Fix these before promoting to production.

---

## Severity Scale

| Level | Meaning |
|-------|---------|
| **P0** | Blocks production. WCAG violation, data loss risk, or complete AT failure. |
| **P1** | Must fix before release. Functional bug, security issue, or misleading test. |
| **P2** | Should fix in current cycle. Missing coverage, spec deviation, quality gap. |
| **P3** | Low priority. Polish, non-idiomatic, cosmetic. |

---

## P0 — Critical

### P0-01: Icon-only buttons have no accessible name (WCAG 4.1.2 Level A)

**Files:** `hx-button.ts:206-242`, `hx-button.stories.ts:687-706`

`aria-label` placed on the `<hx-button>` host element does NOT propagate into Shadow DOM. When the browser builds the accessibility tree, the inner native `<button>` computes its accessible name from its shadow-DOM slot content — not from the host element's attributes.

The `IconOnly` story renders:
```html
<hx-button variant="ghost" aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>
</hx-button>
```

The inner `<button>` receives focus. Its accessible name is computed from its slot content (the SVG is `aria-hidden="true"`). Result: the button has **no accessible name**. Screen readers announce an unlabeled button. WCAG 2.1 SC 4.1.2 (Level A) — hard failure.

The component exposes no `ariaLabel` property to forward a label to the inner button. This is a gap in the component contract, not a consumer mistake.

**Fix required:** Add an `ariaLabel` property (string | undefined) that binds to `aria-label` on the inner `<button>` and `<a>` elements. Document as required for icon-only usage.

---

## P1 — High

### ~~P1-01: Double opacity on disabled state produces 25% opacity (visual bug)~~ VERIFIED ALREADY FIXED

**Files:** `hx-button.styles.ts:8-11`, `hx-button.styles.ts:133-136`

Two independent rules both set `opacity: 0.5` for the disabled state:

```css
/* rule 1 — on :host */
:host([disabled]) {
  opacity: var(--hx-opacity-disabled, 0.5);  /* line 10 */
}

/* rule 2 — on inner .button */
.button[disabled] {
  opacity: var(--hx-opacity-disabled, 0.5);  /* line 135 */
}
```

CSS opacity stacks multiplicatively across ancestor/descendant relationships. With host at 0.5 and inner button also at 0.5: **effective rendered opacity = 0.25**. Disabled buttons are nearly invisible, well below the WCAG 1.4.3 contrast floor for non-text content (informational states).

**Fix required:** Remove one of the two rules. The `:host([disabled])` rule is sufficient and more idiomatic for web components.

**Status:** Verified that `.button[disabled]` does NOT have an opacity rule in the current codebase — only `:host([disabled])` applies opacity. The double-opacity bug was already fixed prior to this audit cycle. Added a documentation comment to prevent regression.

---

### P1-02: `target="_blank"` anchor mode has no `rel="noopener noreferrer"` (security)

**Files:** `hx-button.ts:219-226`, `hx-button.stories.ts:299-305`

When `href` is set and `target="_blank"`, the rendered anchor has no `rel` attribute:

```ts
// hx-button.ts:219
target=${ifDefined(this.target)}
// No rel attribute rendered anywhere in the anchor branch
```

Opening links in a new tab without `rel="noopener noreferrer"` exposes the originating window to `window.opener` access from the new tab (reverse tabnapping). This is a well-documented attack vector, flagged by Lighthouse, axe-core, and OWASP.

The `LinkNewTab` story (`hx-button.stories.ts:299-305`) actively demonstrates this vulnerability without any warning.

**Fix required:** In the anchor render branch, automatically apply `rel="noopener noreferrer"` when `target` contains `_blank`. Expose a `rel` property for consumer override of other values.

---

### P1-03: `WcButton` deprecated type not exported from `index.ts`

**Files:** `index.ts:1`, `hx-button.ts:252-253`

`WcButton` is defined in `hx-button.ts` as a deprecated type alias:

```ts
// hx-button.ts:252
/** @deprecated Use HelixButton */
export type WcButton = HelixButton;
```

But `index.ts` only re-exports `HelixButton`:

```ts
// index.ts:1
export { HelixButton } from './hx-button.js';
```

Any package consumer importing `WcButton` from the package entry point (`@helix/library` or the component barrel) gets nothing. The test file works around this by importing directly from `./hx-button.js` (`hx-button.test.ts:4`), which masks the issue.

**Fix required:** Either add `WcButton` to the `index.ts` re-export, or remove it from `hx-button.ts` and update any references.

---

### P1-04: Keyboard activation tests do not verify keyboard behavior

**Files:** `hx-button.test.ts:280-298`

Both keyboard tests follow this pattern:

```ts
btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
btn.click();  // ← this is what actually fires hx-click
const event = await eventPromise;
expect(event).toBeTruthy();
```

The `btn.click()` call, not the `keydown` event, is what triggers `hx-click`. These tests would pass even if keyboard activation were completely broken. They are not testing what their names claim.

For a native `<button>`, Enter and Space activation is handled by the browser — no custom listener is needed. The real risk is if a refactor ever wraps the inner element in a non-button. These tests would not catch that regression.

**Fix required:** Rewrite keyboard tests to: (1) focus the inner button via `btn.focus()`, (2) dispatch the keyboard event only (no `.click()`), (3) assert `hx-click` fires. Alternatively use `userEvent.keyboard('{Enter}')` from `@testing-library/user-event` which actually simulates the full browser keyboard activation sequence.

---

## P2 — Medium

### P2-01: `name`/`value` form value submission is untested

**Files:** `hx-button.ts:148-151`, `hx-button.test.ts`

The form submission handler has a `name`/`value` branch:

```ts
// hx-button.ts:149-151
if (this.name !== undefined && this.value !== undefined) {
  this._internals.setFormValue(this.value);
}
```

No test exercises this code path. Additionally, the condition checks `this.name !== undefined` but `setFormValue` does not use `this.name` — the form data key is determined by the element's `name` attribute via `ElementInternals`, not by this guard. The guard on `name` is misleading and possibly incorrect.

**Fix required:** Add tests for: (1) button with `name` + `value` submits form data correctly, (2) button without `name`/`value` still submits form without calling `setFormValue`.

---

### P2-02: `aria-disabled` is redundant alongside native `disabled` on `<button>`

**Files:** `hx-button.ts:236-237`

```ts
?disabled=${this.disabled}
aria-disabled=${this.disabled ? 'true' : nothing}
```

The ARIA spec is explicit: `aria-disabled` is redundant when the native HTML `disabled` content attribute is present on an interactive element. Native `<button disabled>` is already mapped to `aria-disabled: true` in the accessibility tree by every browser.

This creates two potential issues: (1) AT tools may double-announce the disabled state, (2) test coverage includes `aria-disabled` assertions (`hx-button.test.ts:113-117`) that are testing behavior that the browser provides automatically, creating false confidence.

Note: `aria-disabled` without native `disabled` is a valid pattern for keeping buttons focusable-but-disabled. The component uses both — which forfeits the focusable benefit. If focus retention for disabled buttons is a design goal, remove native `disabled` and rely solely on `aria-disabled` plus JavaScript-level blocking.

**Fix required:** Either remove `aria-disabled` from the native button branch (keep only native `disabled`), or adopt the `aria-disabled`-only pattern and remove the native `disabled` attribute. Document the design choice.

---

### ~~P2-03: Hardcoded hex fallback values in CSS bypass the token cascade~~ FIXED

**Files:** `hx-button.styles.ts:22-25`, `:76-79`, `:83-85`, `:92-94`, `:97-99`, `:102-105`, `:107-109`, `:112-114`, `:117-119`, `:122-125`, `:127-129`

Approximately 18 hardcoded hex values appear as fallbacks throughout the stylesheet. Representative examples:

```css
background-color: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));  /* line 22 */
color: var(--hx-button-color, var(--hx-color-neutral-0, #ffffff));             /* line 23 */
--hx-button-bg: var(--hx-color-error-500, #dc2626);                           /* line 102 */
```

Hardcoded hex fallbacks are not tied to the design system. If a semantic token definition changes (e.g., `--hx-color-primary-500` moves from `#2563eb` to a different shade), the fallback remains at the old value. Token consumers who have not defined the CSS custom properties will render with stale colors.

**Fix required:** The outermost fallback in each chain should reference a higher-level semantic token, not a hex literal. If no semantic token is available, the fallback should fail visibly (remove it entirely) rather than silently fall back to a stale value.

**Fix:** Removed hex literals from all variant-level CSS custom property setters in `hx-button.styles.ts`. Variant rules now reference primitive tokens only (e.g., `var(--hx-color-primary-500)` with no hex fallback). The base `.button` rule retains its last-resort hex fallback for the unthemed case. The `:focus-visible` ring fallback chain was updated to use `var(--hx-color-primary-500)` instead of a hardcoded hex.

---

### P2-04: No test verifying absence of `aria-busy` in default state

**Files:** `hx-button.test.ts`

Tests verify `aria-busy="true"` when `loading` is true (`hx-button.test.ts:185-189`), but there is no test verifying that `aria-busy` is absent in the default (non-loading) state. Consistent with the pattern used for `aria-disabled` (`hx-button.test.ts:119-123`).

**Fix required:** Add a test: `expect(btn.hasAttribute('aria-busy')).toBe(false)` for a non-loading button.

---

### P2-05: Loading state does not remove `href` in anchor mode — navigation still occurs

**Files:** `hx-button.ts:219`, `hx-button.ts:129-133`

In button mode, loading prevents all interaction:
```ts
// hx-button.ts:129-133
if (this.disabled || this.loading) {
  e.preventDefault();
  e.stopPropagation();
  return;
}
```

In anchor mode, `href` is only removed when `disabled`:
```ts
// hx-button.ts:219
href=${this.disabled ? nothing : ifDefined(this.href)}
```

A loading link-button still has `href` set, so middle-click, ctrl-click, and right-click "Open in new tab" all bypass the `_handleClick` JavaScript guard and trigger navigation. The anchor element itself is navigable when `loading` is true.

**Fix required:** Either remove `href` when loading (same as disabled), or document this as intentional behavior with a test that asserts it.

---

### P2-06: CEM exposes private implementation methods

**Files:** `custom-elements.json:1529-1554`

Three private methods appear in the CEM `members` array:

```json
{ "kind": "method", "name": "_handleClick", "privacy": "private" },
{ "kind": "method", "name": "_renderSpinner", "privacy": "private" },
{ "kind": "method", "name": "_renderInner", "privacy": "private" }
```

Private members should not be in the public CEM. They create noise in Storybook autodocs and mislead consumers into thinking these are stable public API surface.

**Fix required:** Add `@private` JSDoc tags to the methods in `hx-button.ts` so the CEM generator excludes them. Alternatively configure `cem-plugin-custom-jsdoc-tags` to filter `privacy: private` members from the manifest.

---

### P2-07: Disabled opacity test does not verify opacity — name is misleading

**Files:** `hx-button.test.ts:125-128`

```ts
it('applies host opacity 0.5 via disabled attribute', async () => {
  const el = await fixture<WcButton>('<hx-button disabled>Click</hx-button>');
  expect(el.hasAttribute('disabled')).toBe(true);  // ← tests attribute presence, not opacity
});
```

The test name asserts a CSS effect but the assertion only checks that the `disabled` attribute is reflected on the host. Combined with P1-01 (actual rendered opacity is 0.25 due to double-application), this test provides misleading coverage signal.

**Fix required:** Either rename the test to "reflects disabled attribute on host" (scope it to what it actually tests) or add a real opacity verification using `getComputedStyle`.

---

### P2-08: No test for simultaneous `loading` + `disabled` state

**Files:** `hx-button.test.ts`

Both properties are tested independently but never together. Edge cases to verify: combined class application, combined ARIA attributes, combined event blocking. Current code handles the combination through the `disabled || loading` guard (`hx-button.ts:129`), but the combined visual state (both `:host([disabled])` and `.button--loading`) is not tested.

---

## P3 — Low

### P3-01: `hx-size` attribute name is non-idiomatic HTML

**Files:** `hx-button.ts:66`

```ts
@property({ type: String, reflect: true, attribute: 'hx-size' })
size: 'sm' | 'md' | 'lg' = 'md';
```

HTML attribute naming convention does not prefix attribute names with component namespace — that prefix belongs on CSS custom properties, not attributes. All other attributes on this component use plain names (`variant`, `disabled`, `loading`, `type`, `href`, `target`).

In Drupal Twig templates: `<hx-button hx-size="sm">` vs `<hx-button size="sm">`. The prefixed form is verbose and non-standard. It also means `size` as a JS property and `hx-size` as the HTML attribute — breaking normal attribute/property correspondence.

This would be a breaking change to fix. Flag for next major version.

---

### P3-02: Inconsistent icon pattern across Storybook stories

**Files:** `hx-button.stories.ts:664-685` (`WithIcon`), `hx-button.stories.ts:321-387` (`WithPrefixSlot`)

The `WithIcon` story places an SVG directly in the default slot (no `slot="prefix"`). The `WithPrefixSlot` story places icons in the named `prefix` slot. Both approaches work but they produce different DOM structure and different CSS part targeting. There is no documentation indicating which is recommended.

Drupal template authors and consumers face an undocumented choice with no guidance.

---

### P3-03: Unused `_canvas` variable in Default story

**Files:** `hx-button.stories.ts:142`

```ts
const _canvas = within(canvasElement);
```

`_canvas` is declared but never used. Only exists to suppress an unused import lint warning for `within`. Remove the declaration and remove `within` from the import if it's not needed elsewhere in the file.

---

### P3-04: Deprecated `WcButton` alias has no migration timeline or changeset

**Files:** `hx-button.ts:252-253`

```ts
/** @deprecated Use HelixButton */
export type WcButton = HelixButton;
```

No `@since`, no removal version, no changeset associated. Deprecation notices without a removal plan accumulate indefinitely. Add a removal target version or create a changeset.

---

## Summary Table

| ID | Area | Severity | Description |
|----|------|----------|-------------|
| P0-01 | Accessibility | **P0** | Icon-only buttons have no accessible name (WCAG 4.1.2) |
| P1-01 | CSS | **FIXED** | Double opacity: verified already resolved; added regression-guard comment |
| P1-02 | Security | **P1** | `target="_blank"` missing `rel="noopener noreferrer"` |
| P1-03 | TypeScript | **P1** | `WcButton` not exported from `index.ts` |
| P1-04 | Tests | **P1** | Keyboard tests don't actually test keyboard activation |
| P2-01 | Tests | P2 | `name`/`value` form value submission untested |
| P2-02 | Accessibility | P2 | Redundant `aria-disabled` on native disabled `<button>` |
| P2-03 | CSS | **FIXED** | Hex fallbacks removed from variant setters; semantic tokens only |
| P2-04 | Tests | P2 | No test for absence of `aria-busy` in default state |
| P2-05 | Behavior | P2 | Loading anchor mode does not prevent navigation |
| P2-06 | CEM | P2 | Private methods exposed in CEM members array |
| P2-07 | Tests | P2 | Disabled opacity test doesn't test opacity |
| P2-08 | Tests | P2 | No test for `loading` + `disabled` combined state |
| P3-01 | API | P3 | `hx-size` attribute naming is non-idiomatic |
| P3-02 | Storybook | P3 | Inconsistent icon slot pattern across stories |
| P3-03 | Storybook | P3 | Unused `_canvas` variable in Default story |
| P3-04 | TypeScript | P3 | Deprecated `WcButton` has no removal timeline |

---

## What Is Good

This component is well above average. Calling out what should be preserved:

- **TypeScript:** Zero `any` types, all union types correctly defined, strict compliance throughout.
- **Test breadth:** 54+ tests across rendering, variants, sizes, states, events, keyboard, slots, CSS parts, form association, and axe-core — coverage is comprehensive.
- **CEM accuracy:** All public properties, events, slots, CSS parts, and CSS custom properties are correctly documented in `custom-elements.json`.
- **FormAssociated:** Correct use of `ElementInternals`, `formAssociated = true`, `requestSubmit`/`reset` forwarding.
- **Storybook:** 30+ stories across all variants, sizes, states, interactive tests, and healthcare scenarios.
- **Token usage:** CSS custom properties follow `--hx-*` convention consistently. No hardcoded magic numbers for layout/spacing.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` support for the spinner — healthcare compliance.
- **Anchor mode:** Correct handling of `disabled` in anchor mode (removes `href`, sets `aria-disabled`).
- **axe-core:** All axe tests pass across all variants and states.
