# AUDIT: hx-steps — T2-01 Antagonistic Quality Review

**Date:** 2026-03-06
**Auditor:** Antagonistic Review Agent
**Files reviewed:**

- `hx-steps.ts`
- `hx-step.ts`
- `hx-steps.styles.ts`
- `hx-step.styles.ts`
- `hx-steps.test.ts`
- `hx-steps.stories.ts`
- `index.ts`

---

## Severity Key

| Level  | Meaning                                                                |
| ------ | ---------------------------------------------------------------------- |
| **P0** | Blocks ship — functional or accessibility regression                   |
| **P1** | Must fix before merge — WCAG violation, missing feature, policy breach |
| **P2** | Should fix — quality gap, incomplete coverage, UX concern              |

---

## 1. TypeScript

### P1 — Status vocabulary mismatch with audit spec

**File:** `hx-step.ts:51`

The feature specification requires `status: complete | current | upcoming`. The implementation uses `status: 'pending' | 'active' | 'complete' | 'error'`. The spec's `current` becomes `active`, and `upcoming` becomes `pending`. The `error` status is an addition not in the spec.

This is a contract mismatch. If upstream consumers (Drupal Twig, design tooling) are built against the spec, attribute values will silently fail. No runtime validation or deprecation notice exists.

```ts
// hx-step.ts:51 — actual
status: 'pending' | 'active' | 'complete' | 'error' = 'pending';
// spec requires: 'complete' | 'current' | 'upcoming'
```

### P1 — Internal properties exposed as public reflected attributes on `hx-step`

**File:** `hx-step.ts:66-74`

`orientation` and `size` are decorated with `@property({ reflect: true })` and are part of the public CEM API. These are described as "Set by the parent container" in JSDoc, but they are fully settable and reflected by external consumers. This creates an implicit external API that bypasses `hx-steps` management. A Drupal author setting `<hx-step orientation="vertical">` outside of `<hx-steps>` will get a component that renders in the wrong layout with no warning.

`index` is `@property` without `reflect: true` — correct. But `orientation` and `size` should not be reflected public properties on `hx-step`. They should use a protected/internal mechanism.

### P2 — No `@internal` JSDoc tag on CEM-exposed internal properties

**File:** `hx-step.ts:65, 73`

The JSDoc says `@internal` in prose but the decorators do not use a CEM-recognized `@internal` tag. The Custom Elements Manifest will expose `orientation`, `size`, and `index` as first-class public attributes of `hx-step`, misleading consumers and autodoc tooling.

---

## 2. Accessibility

### P0 — `aria-current="step"` placed on inner indicator div, not on the listitem host

**File:** `hx-step.ts:158`

```html
<div part="indicator" class="step__indicator" aria-current=${isActive ? 'step' : nothing}>
```

`aria-current="step"` is set on the inner shadow DOM `div[part="indicator"]`, not on the `role="listitem"` host element. Per WAI-ARIA 1.1, `aria-current` identifies the current item within a set. Screen readers use `aria-current` in the context of the current element's role — placing it on a non-semantic inner `div` inside shadow DOM means AT (assistive technology) will announce it without the list context and may not properly associate it with the step sequence.

The correct placement is on the host element itself:

```ts
// Should be in connectedCallback or via host binding:
this.setAttribute('aria-current', 'step'); // when active
this.removeAttribute('aria-current'); // otherwise
```

This is a **P0** because it causes incorrect screen reader output for the primary ARIA pattern of this component.

### P1 — Complete and error statuses are invisible to screen readers

**File:** `hx-step.ts:109-138`

The checkmark SVG (`_renderCheckmark`) and X-mark SVG (`_renderXMark`) both carry `aria-hidden="true"`. There is no accessible text, `aria-label` change, or visually hidden announcement of the completion or error state. A screen reader user navigating the step list hears only the label text — the status is communicated exclusively through visual icon and color.

WCAG 1.3.1 (Info and Relationships) and 1.4.1 (Use of Color) require non-color, non-visual means of conveying status. Neither `aria-label` on the indicator nor visually hidden text (e.g., `<span class="sr-only">Complete</span>`) is provided.

### P1 — Interactive steps have no keyboard support

**File:** `hx-step.ts:156`, `hx-step.styles.ts:18`

Every `hx-step` renders with `cursor: pointer` in CSS and a `@click` handler on the `.step` div:

```html
<div part="base" class="step" @click="${this._handleClick}"></div>
```

However, there is:

- No `tabindex="0"` on the clickable element
- No `keydown` handler for `Enter` or `Space`
- No `role="button"` on the clickable div
- No `role` attribute in the shadow DOM click target

This violates WCAG 2.1.1 (Keyboard), 4.1.2 (Name, Role, Value), and WCAG 2.4.3 (Focus Order). Every interactive element must be operable via keyboard. A component that dispatches click events but is not keyboard-accessible is inaccessible by definition.

If steps are intended to be universally interactive (always clickable), they must be implemented as `<button>` elements or have `tabindex="0"` + keyboard handler. If only some steps are interactive, a `clickable` boolean property must be introduced with conditional rendering.

### P1 — No mechanism to mark steps as non-interactive / disabled

**File:** `hx-step.ts` (entire file)

The audit spec explicitly requires testing "clickable/non-clickable steps." There is no `clickable` or `disabled` property. Every step is always clickable (cursor, click handler). There is no way for a consumer to render steps 3 and 4 as non-clickable in a wizard where the user hasn't reached them.

This is both a feature gap and an accessibility gap — non-interactive elements should not present as interactive.

### P1 — `hx-steps` `role="list"` has no accessible name enforcement

**File:** `hx-steps.ts:52-54`

The component sets `role="list"` in `connectedCallback`. Without an `aria-label` or `aria-labelledby`, screen readers announce an unlabelled list. The tests provide `aria-label="Checkout progress"` on the fixture but the component does not warn, enforce, or document this requirement. In production Drupal usage, Twig templates are unlikely to include `aria-label` unless explicitly documented.

### P2 — No focus styles defined anywhere

**File:** `hx-step.styles.ts` (entire file)

No `:focus`, `:focus-visible`, or `:focus-within` rules are defined. If `tabindex` were added, focused steps would have no visible focus ring, violating WCAG 2.4.7 (Focus Visible). Even in the current state, this is a P2 because the component is in a library that will receive keyboard focus fixes — those fixes will need focus styles simultaneously.

### P2 — `active` and `complete` indicators are visually identical in color

**File:** `hx-step.styles.ts:100-121`

Both `status="active"` and `status="complete"` use `--hx-color-primary-500` as background. They are visually differentiated only by the checkmark icon (which is `aria-hidden`). For users with color blindness, both states appear identical. A distinct background (e.g., filled solid vs. outline) would improve disambiguation.

---

## 3. Tests

### P1 — No keyboard interaction tests

**File:** `hx-steps.test.ts` (entire file)

Zero tests for keyboard navigation. No test for `Enter` or `Space` triggering `hx-step-click`. No test that a step is focusable. Given that keyboard support is currently broken (no `tabindex`, no `keydown`), tests would fail — but the absence of tests also means this gap was never caught.

### P1 — No test for non-clickable/disabled step behavior

**File:** `hx-steps.test.ts` (entire file)

The audit spec requires tests for "clickable/non-clickable steps." No such property exists and no such test exists. The test suite cannot cover what the component doesn't implement.

### P1 — `aria-current` placement not verified against host element

**File:** `hx-steps.test.ts:214-218`

```ts
it('sets aria-current="step" on indicator when active', async () => {
  const el = await fixture<HelixStep>('<hx-step label="Test" status="active"></hx-step>');
  const indicator = shadowQuery(el, '[part~="indicator"]');
  expect(indicator?.getAttribute('aria-current')).toBe('step');
});
```

This test verifies the current (incorrect) placement on the indicator div. It should verify that `aria-current` is on the host element (`el.getAttribute('aria-current') === 'step'`), not the inner indicator. The test currently validates a known-broken pattern.

### P2 — No test for dynamic child re-sync (slot change)

**File:** `hx-steps.test.ts` (entire file)

`_syncChildren` is called on `slotchange`. There is no test that dynamically appending an `hx-step` to an existing `hx-steps` container triggers index/orientation re-sync. This is a common runtime use case (e.g., conditionally rendered steps in frameworks).

### P2 — Axe test for standalone `hx-step` uses artificial `<ul>` wrapper

**File:** `hx-steps.test.ts:344-351`

```ts
const el = await fixture<HelixStep>(
  '<ul><hx-step label="A step" status="pending" description="With description"></hx-step></ul>',
);
```

The fixture wraps `hx-step` in a native `<ul>` to satisfy axe's listitem-must-be-in-list rule. This is an artificial context. In real usage, `hx-step` lives inside `hx-steps[role="list"]`. The test should use the real parent context, or the standalone test should verify that `hx-step` outside of `hx-steps` raises an accessible warning.

### P2 — No test confirming 80%+ coverage threshold

The test suite has reasonable breadth but no explicit coverage report is gated or referenced. The `npm run test:library` command does not enforce the 80% threshold visibly in CI for this component specifically.

---

## 4. Storybook

### P2 — No interactive story demonstrating `hx-step-click` event

**File:** `hx-steps.stories.ts` (entire file)

No story attaches a listener to `hx-step-click` and shows a result (e.g., selected step index). Autodocs will show the event type but there is no live demonstration of the event in the story canvas. This makes it impossible for consumers to understand the interaction model without reading source code.

### P2 — `Default` and `Horizontal` stories are functionally duplicative

**File:** `hx-steps.stories.ts:58-79`

The `Default (Horizontal)` story and the `Horizontal` story render nearly identical content. The Default story adds args wiring (orientation/size controls), but both show horizontal 3-step layouts. One should be removed or differentiated (e.g., Default with controls, remove the static Horizontal story).

### P2 — No size + vertical combination stories

**File:** `hx-steps.stories.ts` (entire file)

Size stories (`SizeSm`, `SizeMd`, `SizeLg`) are horizontal-only. No story shows `size="sm"` or `size="lg"` in vertical orientation. The visual difference in vertical connector height with different sizes is untested in Storybook.

### P2 — `WithCustomIcon` story uses inline `width`/`height` attributes on SVG

**File:** `hx-steps.stories.ts:165-172`

The custom icon SVGs use `width="16" height="16"` HTML attributes. Icon sizing should be controlled by `--hx-steps-indicator-icon-size` CSS custom property. The inline size overrides token-based sizing and breaks responsive size variants.

---

## 5. CSS

### P1 — Connector line thickness hardcoded

**File:** `hx-step.styles.ts:63`, `hx-step.styles.ts:161`

```css
height: 2px; /* horizontal connector */
width: 2px; /* vertical connector */
```

Both connector dimensions use hardcoded `2px`. This should use a token such as `--hx-border-width` or a component-level `--hx-steps-connector-thickness` token. Per CLAUDE.md: "Never hardcode colors, spacing, or typography values. Always use tokens."

### P1 — `cursor: pointer` applied unconditionally to all steps

**File:** `hx-step.styles.ts:18`

```css
.step {
  cursor: pointer;
}
```

All steps render with `cursor: pointer` regardless of whether they are interactive. A non-interactive (pending, upcoming) step in a wizard should show `cursor: default`. Since there is no `clickable` prop, this cannot be conditionally applied, but the unconditional pointer cursor misleads users into expecting interaction on non-navigable steps.

### P2 — Hardcoded hex color fallbacks present throughout

**File:** `hx-step.styles.ts` (throughout)

While the primary values use `--hx-*` tokens correctly, many properties include hardcoded hex fallbacks:

```css
border: 2px solid var(--hx-color-neutral-300, #cbd5e1);
background-color: var(--hx-color-neutral-0, #ffffff);
color: var(--hx-color-neutral-500, #64748b);
```

Per CLAUDE.md, values must use tokens and never hardcode colors. The hardcoded fallbacks may appear intentional for resilience, but they create a drift risk: if the token value changes, the fallback silently diverges. These should reference primitive token fallbacks or be removed entirely.

### P2 — Missing `--hx-steps-connector-complete-color` component token

**File:** `hx-step.styles.ts:119-121`

The complete step connector uses the raw semantic token directly:

```css
:host([status='complete']) .step__connector {
  background-color: var(--hx-color-primary-500, #2563eb);
}
```

This should use a component-level token `--hx-steps-connector-complete-color` that falls back to the semantic token, consistent with the three-tier cascade pattern defined in CLAUDE.md. Currently, consumers cannot override the complete connector color without overriding the global primary color.

### P2 — No `::part()` focus styles or focus-visible rules

**File:** `hx-step.styles.ts` (entire file)

The CSS parts (`base`, `indicator`, `connector`, `label`, `description`) have no focus or focus-visible state styles. Consumers using `::part(indicator):focus-visible` would need to define all focus styling themselves. The component should provide default focus ring styles on the indicator.

---

## 6. Performance

### P2 — Bundle size unverified for this component

No automated bundle size gate is visible for `hx-steps` specifically. The inline SVG paths (checkmark + X-mark) add bytes that should be accounted for. The two-component structure (hx-steps + hx-step) means two separate bundles are possible depending on entry point splitting. The `<5KB per component min+gz` gate must be explicitly verified and documented.

Estimated concern areas:

- Two Lit components with shadow DOM + styles
- Inline SVG strings in template literals (not tree-shakeable)
- `tokenStyles` import from `@helix/tokens/lit` (shared, but still bundled per component)

---

## 7. Drupal / Twig

### P1 — No Drupal Twig template provided

**File:** (missing)

No `.twig` template file exists in the component directory. Per project requirements, components must be Twig-renderable. A Drupal author has no reference for how to render `<hx-steps>` with `<hx-step>` children from a Twig template. This is especially important given the parent-managed child sync pattern — a Drupal template must know to not set `orientation`, `size`, or `index` directly on `hx-step`.

### P1 — No documentation on Drupal attribute mapping

**File:** (missing)

The `label`, `description`, `status` attributes map to Drupal field values. Without a Twig example or README, there is no guidance on:

- How to map a multi-step form's steps to `hx-step` children
- How to handle dynamic step count
- Which properties are managed by the parent and should not be set in Twig

### P2 — Internal props `orientation` and `size` on `hx-step` are reflected attributes

**File:** `hx-step.ts:66, 73`

`reflect: true` on `orientation` and `size` means Drupal Twig templates can (and inadvertently will) set these attributes on individual `hx-step` elements. `_syncChildren()` in `hx-steps` will override them after upgrade, but during SSR or initial hydration the attributes may cause a flash of incorrect layout. This is a DX and correctness risk for Drupal integration.

---

## Summary Table

| #   | Area          | Severity | Finding                                                                                          |
| --- | ------------- | -------- | ------------------------------------------------------------------------------------------------ |
| 1   | TypeScript    | P1       | Status vocabulary mismatch with spec (`pending/active` vs `upcoming/current`)                    |
| 2   | TypeScript    | P1       | Internal `orientation`/`size` props on `hx-step` are public reflected attributes                 |
| 3   | TypeScript    | P2       | No CEM `@internal` tag on internal properties; they appear in public API docs                    |
| 4   | Accessibility | **P0**   | `aria-current="step"` on inner indicator div, not on `role="listitem"` host                      |
| 5   | Accessibility | P1       | Complete/error status not announced to screen readers (SVGs are `aria-hidden`, no fallback text) |
| 6   | Accessibility | P1       | Interactive steps have no keyboard support (`tabindex`, `keydown`, `role="button"`)              |
| 7   | Accessibility | P1       | No `clickable`/disabled mechanism — all steps are always interactive                             |
| 8   | Accessibility | P1       | `role="list"` has no accessible name enforcement or guidance                                     |
| 9   | Accessibility | P2       | No focus styles defined                                                                          |
| 10  | Accessibility | P2       | `active` and `complete` indicators are visually identical (color-only differentiation)           |
| 11  | Tests         | P1       | No keyboard interaction tests                                                                    |
| 12  | Tests         | P1       | No test for non-clickable/disabled step behavior                                                 |
| 13  | Tests         | P1       | `aria-current` test validates incorrect placement (inner div, not host)                          |
| 14  | Tests         | P2       | No dynamic child re-sync (slot change) test                                                      |
| 15  | Tests         | P2       | Standalone axe test uses artificial `<ul>` wrapper                                               |
| 16  | Tests         | P2       | No explicit 80% coverage gate verification                                                       |
| 17  | Storybook     | P2       | No story demonstrating `hx-step-click` event interactivity                                       |
| 18  | Storybook     | P2       | `Default` and `Horizontal` stories are functionally duplicative                                  |
| 19  | Storybook     | P2       | No size + vertical combination stories                                                           |
| 20  | Storybook     | P2       | `WithCustomIcon` story uses inline `width`/`height` overriding token sizing                      |
| 21  | CSS           | P1       | Connector `2px` thickness hardcoded — not tokenized                                              |
| 22  | CSS           | P1       | `cursor: pointer` unconditionally applied — no non-interactive state                             |
| 23  | CSS           | P2       | Hardcoded hex fallbacks violate token-only policy                                                |
| 24  | CSS           | P2       | Missing `--hx-steps-connector-complete-color` component token                                    |
| 25  | CSS           | P2       | No `::part()` focus-visible styles provided                                                      |
| 26  | Performance   | P2       | Bundle size unverified; inline SVGs add non-tree-shakeable bytes                                 |
| 27  | Drupal        | P1       | No Drupal Twig template provided                                                                 |
| 28  | Drupal        | P1       | No documentation on Drupal attribute mapping                                                     |
| 29  | Drupal        | P2       | `orientation`/`size` reflected on `hx-step` creates Drupal hydration risk                        |

---

## P0 Count: 1 | P1 Count: 11 | P2 Count: 17

**Ship status: BLOCKED** — 1 P0 and 11 P1 findings must be resolved before merge.
