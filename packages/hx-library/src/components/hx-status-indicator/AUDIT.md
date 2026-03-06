# AUDIT: hx-status-indicator — T3-01 Antagonistic Quality Review

**Reviewer:** Antagonistic Quality Agent (T3)
**Date:** 2026-03-06
**Files Reviewed:**
- `hx-status-indicator.ts`
- `hx-status-indicator.styles.ts`
- `hx-status-indicator.test.ts`
- `hx-status-indicator.stories.ts`
- `index.ts`

---

## Severity Key

| Level | Meaning |
|-------|---------|
| P0 | Blocking — must fix before merge; correctness/security/accessibility failure |
| P1 | Significant — violates project policy or spec; should fix before merge |
| P2 | Minor — improvement opportunity; fix before next release cycle |

---

## Summary

No P0 issues. Two P1 issues: a spec mismatch on the status type set and hardcoded color fallbacks that violate project policy. Several P2 issues around test duplication, missing stories, and ARIA placement patterns.

---

## 1. TypeScript

### P1 — Status Type Set Does Not Match Feature Spec

**File:** `hx-status-indicator.ts:6`

The feature description specifies status values of `active | inactive | error | warning | unknown`. The implementation exports:

```ts
export type StatusIndicatorStatus = 'online' | 'offline' | 'away' | 'busy' | 'unknown';
```

`online/offline/away/busy` do not map 1:1 to `active/inactive/error/warning`. The implementation makes a design choice that was not documented or reconciled against the spec. If consumers build Drupal integrations or TypeScript integrations against either shape, a future correction becomes a breaking change. The divergence must be intentional and approved, or corrected.

**Action required:** Confirm with product which status vocabulary is canonical. Document the decision in the component JSDoc if the implementation vocabulary is correct.

### P2 — `_getLabel()` Missing Return Type Annotation

**File:** `hx-status-indicator.ts:62`

```ts
private _getLabel(): string {
```

Actually this is fine — return type IS present. No issue.

### P2 — No Guard on Invalid `status` Value at Runtime

**File:** `hx-status-indicator.ts:64`

```ts
const statusText = STATUS_LABELS[this.status] ?? 'Unknown';
```

The `??` fallback is correct and handles out-of-type runtime strings. No issue.

---

## 2. Accessibility

### P2 — `role="img"` on Shadow Child, Not Host

**File:** `hx-status-indicator.ts:70`

```html
<div class="indicator" role="img" aria-label=${this._getLabel()}>
```

The accessible role is placed on an inner shadow DOM div, not on the host element. The semantically correct approach for Lit components is to use `ElementInternals.role` (via `static formAssociated` or direct `this.internals_.role`) or place role on the host via `connectedCallback`. Modern browsers (Chrome 92+, Firefox 92+, Safari 16.4+) do expose shadow DOM children to the accessibility tree, so axe-core passes and AT works in current environments. However, placing the role on the host element is more robust and future-proof, particularly for AT that traverse the flat accessibility tree.

This is not a WCAG failure — it is an architectural concern.

### P2 — Pulse Animation: `display: none` vs `animation-play-state`

**File:** `hx-status-indicator.styles.ts:57-61`

```css
@media (prefers-reduced-motion: reduce) {
  .indicator__pulse-ring {
    display: none !important;
  }
}
```

Using `display: none !important` to suppress animation is functionally correct but architecturally crude. The WCAG 2.3.3 (AAA) and WCAG 2.2 guidance recommends `animation-play-state: paused` or removing the animation entirely. Removing from display is acceptable but the `!important` suggests defensive coding against a specificity problem that should be addressed at the selector level instead.

More critically: when `prefers-reduced-motion: reduce` is active and `pulse` is `true`, the pulse-ring DOM node still exists in the tree. If the ring ever receives focus or has interactive semantics added in the future, this could be a problem. Low risk now but fragile.

### P2 — Decorative Story Uses `aria-hidden` on Host, Not Communicated in Docs

**File:** `hx-status-indicator.stories.ts:208-216`

The `DecorativeUsage` story demonstrates `aria-hidden="true"` but the component documentation (JSDoc) only mentions it in passing. For healthcare contexts where the pattern of "decorative dot + adjacent text" is the recommended composition, this pattern should be documented more prominently.

---

## 3. Tests

### P1 — CSS Parts Describe Block is a Complete Duplicate

**File:** `hx-status-indicator.test.ts:162-174`

The `CSS Parts` describe block (lines 162–174) is an exact duplicate of the `Rendering` describe block (lines 18–28). Both test the same CSS parts (`[part~="base"]`, `[part~="pulse-ring"]`) with identical assertions. This adds zero coverage and inflates the test count misleadingly.

```ts
// Lines 18-28 — Rendering block
it('exposes "base" CSS part', ...);
it('exposes "pulse-ring" CSS part', ...);

// Lines 162-174 — CSS Parts block (DUPLICATE)
it('exposes "base" part', ...);    // identical assertion
it('exposes "pulse-ring" part', ...); // identical assertion
```

**Action required:** Delete the `CSS Parts` describe block. CSS part tests in `Rendering` are sufficient, or rename to test something distinct (e.g., verify parts are usable for `::part()` targeting).

### P2 — No Dynamic `status` Update Test

**File:** `hx-status-indicator.test.ts`

The ARIA tests verify the initial `aria-label` for one status (`online`) but never verify that `aria-label` updates when `status` is changed dynamically on a live element. This is critical for real-world usage where status indicators update without full re-render (e.g., WebSocket status updates in a healthcare dashboard).

Missing test pattern:
```ts
it('updates aria-label when status changes dynamically', async () => {
  const el = await fixture(...'<hx-status-indicator status="online">');
  el.status = 'offline';
  await el.updateComplete;
  const wrapper = shadowQuery(el, '[role="img"]');
  expect(wrapper?.getAttribute('aria-label')).toBe('Status: Offline');
});
```

### P2 — No Test for `status="unknown"` aria-label Explicitly

**File:** `hx-status-indicator.test.ts`

The default state test implicitly covers `unknown`, but there is no explicit test asserting `aria-label="Status: Unknown"` for `status="unknown"`. The axe-core test suite covers online, offline, away, busy, and the default state — but never `<hx-status-indicator status="unknown">` explicitly. A future refactor that changes the unknown fallback label would not fail these tests.

### P2 — No Test for `size` Attribute Affecting Visual Dimensions

**File:** `hx-status-indicator.test.ts`

Tests for `size` only verify that the property value is set and the attribute reflects. They do not verify that the CSS custom property `--_indicator-size` resolves correctly or that the element has different computed dimensions per size. This is acceptable for unit tests but leaves a functional gap.

### P2 — `label` Property Not Tested for Empty String vs Null

**File:** `hx-status-indicator.test.ts`

When `label` is an empty string (the default), the fallback label is used. This is tested. But there is no test verifying behavior when `label` is set, then cleared (set back to `''`). The component should fall back to the auto-generated label when cleared.

---

## 4. Storybook

### P2 — No Explicit Story for Custom `label` Prop

**File:** `hx-status-indicator.stories.ts`

The `label` prop has a Storybook control but there is no named story demonstrating a non-default label. Autodocs consumers relying on stories to understand usage patterns will not see an example of contextual labeling (e.g., `label="EHR System is online"`). This is important for the healthcare use case where status labels should be system-specific, not generic.

Missing story:
```ts
export const CustomLabel: Story = {
  name: 'Custom Accessible Label',
  args: { status: 'online', label: 'EHR System is online' },
};
```

### P2 — `SystemHealthDashboard` Story Uses Inline Styles Exclusively

**File:** `hx-status-indicator.stories.ts:184-206`

The composed healthcare dashboard story uses `style="..."` attributes throughout. While acceptable for demo purposes, it bypasses the design system token layer. Layout properties like `gap`, `padding`, and `border-radius` should ideally use `--hx-*` tokens or token-based utility classes to model correct usage to consumers.

### P2 — No Size Story Combining Sizes With Pulse

There is no story demonstrating size + pulse combinations. In healthcare dashboards, a small pulsing "online" indicator next to a system name is a common pattern. The stories address sizes and pulse separately but not together at different sizes.

---

## 5. CSS

### P1 — Hardcoded Hex Color Fallbacks Violate "No Hardcoded Values" Policy

**File:** `hx-status-indicator.styles.ts:80-97`

All five status color rules include hardcoded hex fallbacks:

```css
:host([status='online'])  { --_dot-color: var(--hx-color-success-500, #22c55e); }
:host([status='offline']) { --_dot-color: var(--hx-color-neutral-400, #94a3b8); }
:host([status='away'])    { --_dot-color: var(--hx-color-warning-500, #f59e0b); }
:host([status='busy'])    { --_dot-color: var(--hx-color-danger-500, #ef4444); }
:host([status='unknown']) { --_dot-color: var(--hx-color-neutral-300, #cbd5e1); }
```

CLAUDE.md "Zero-Tolerance Policy" states: **"No hardcoded values — Colors, spacing, typography, and timing use design tokens. Always."**

The same violation applies to size fallbacks:
```css
:host([size='sm']) { --_indicator-size: var(--hx-size-2, 0.5rem); }
:host([size='md']) { --_indicator-size: var(--hx-size-3, 0.75rem); }
:host([size='lg']) { --_indicator-size: var(--hx-size-4, 1rem); }
```

**Counterargument:** Fallback values in `var()` are a common and necessary pattern for resilience when tokens are not loaded. Many components in this library use this pattern. However, the existence of `tokenStyles` import (`@helix/tokens/lit`) in the component suggests tokens are expected to be available at render time. If tokens are guaranteed via `tokenStyles`, the hardcoded fallbacks are redundant. If they are not guaranteed, this reveals a token-loading architecture concern.

**Action required:** Clarify with the design system team whether hardcoded CSS `var()` fallbacks are explicitly permitted as a resilience pattern or violate the no-hardcoded-values policy. Document the decision as a project-wide exception if allowed.

### P2 — No Default `--_dot-color` When `status` Attribute Is Absent or Invalid

**File:** `hx-status-indicator.styles.ts`

If `status` is set to an invalid value (e.g., `status="active"` — the spec's original vocabulary), `--_dot-color` is never set and the dot renders with no background color (transparent). No `:host` default sets `--_dot-color` as a fallback. The component silently renders an invisible dot.

### P2 — Pulse Ring Not Independently Themeable

**File:** `hx-status-indicator.styles.ts:36`

```css
.indicator__pulse-ring {
  background-color: var(--_dot-color);
```

The pulse ring color is tied to the private `--_dot-color` custom property. Consumers with a CSS `::part(pulse-ring)` rule can style the pulse ring, but there is no public custom property (e.g., `--hx-status-indicator-pulse-color`) for fine-grained theming. This is a minor API completeness gap.

### P2 — `z-index` Values Are Hardcoded Magic Numbers

**File:** `hx-status-indicator.styles.ts:28, 39`

```css
.indicator__dot { z-index: 1; }
.indicator__pulse-ring { z-index: 0; }
```

These z-index values are not from tokens and create a stacking context within the shadow root. While the values are correct for the layering intent, they are arbitrary magic numbers. Since these are scoped to the shadow DOM, they cannot conflict with global stacking contexts, so this is a very low risk P2.

---

## 6. Performance

### No Issues Found

The component is minimal: one class, two properties with boolean/string types, no event listeners, no observers, no async operations. Bundle size should be well under 5KB min+gz. The animation is CSS-only (no JS `requestAnimationFrame` loop).

---

## 7. Drupal

### P2 — Boolean `pulse` Attribute Requires Twig Template Awareness

The `pulse` property is a Lit boolean attribute (`@property({ type: Boolean, reflect: true })`). In HTML, its presence (not its value) enables the feature. Twig templates must render it as a bare attribute:

```twig
{# Correct #}
<hx-status-indicator status="online" pulse></hx-status-indicator>

{# Wrong — Lit treats presence only; value is ignored #}
<hx-status-indicator status="online" pulse="true"></hx-status-indicator>
<hx-status-indicator status="online" pulse="false"></hx-status-indicator>
```

The `pulse="false"` pattern is a known footgun for Drupal template authors unfamiliar with Lit boolean attributes. The component has no JSDoc warning about this. The Storybook story for Drupal guidance is absent.

---

## Finding Summary

| ID | Severity | Area | Description |
|----|----------|------|-------------|
| T3-01-1 | P1 | TypeScript | Status type set (`online/offline/away/busy`) does not match feature spec (`active/inactive/error/warning`) |
| T3-01-2 | P1 | CSS | Hardcoded hex color fallbacks and rem size fallbacks violate "No hardcoded values" policy |
| T3-01-3 | P1 | Tests | CSS Parts describe block is a verbatim duplicate of Rendering describe block — zero additive coverage |
| T3-01-4 | P2 | Accessibility | `role="img"` on shadow child div; host has no ARIA role; less robust than `ElementInternals.role` |
| T3-01-5 | P2 | Accessibility | `prefers-reduced-motion` uses `display: none !important` — valid but architecturally fragile |
| T3-01-6 | P2 | Accessibility | `DecorativeUsage` pattern insufficiently documented in JSDoc |
| T3-01-7 | P2 | Tests | No dynamic status update test (status changes after initial render not verified) |
| T3-01-8 | P2 | Tests | No explicit test for `status="unknown"` aria-label; covered only by default state |
| T3-01-9 | P2 | Tests | `label` cleared to `''` after being set — fallback behavior not tested |
| T3-01-10 | P2 | Storybook | No named story demonstrating custom `label` prop usage |
| T3-01-11 | P2 | Storybook | `SystemHealthDashboard` uses inline styles; no token-based layout |
| T3-01-12 | P2 | CSS | No default `--_dot-color` — invalid/absent status renders an invisible dot silently |
| T3-01-13 | P2 | CSS | Pulse ring color not independently overridable via public custom property |
| T3-01-14 | P2 | CSS | `z-index: 1` and `z-index: 0` are magic numbers, not from tokens |
| T3-01-15 | P2 | Drupal | Boolean `pulse` attribute footgun not documented for Twig template authors |
