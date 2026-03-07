# AUDIT: hx-focus-ring — T4-03 Antagonistic Quality Review

**Reviewer:** Antagonistic Quality Review Agent
**Date:** 2026-03-06
**Branch:** feature/audit-hx-focus-ring-t4-03-antagonistic
**Files Reviewed:**
- `hx-focus-ring.ts`
- `hx-focus-ring.styles.ts`
- `hx-focus-ring.test.ts`
- `hx-focus-ring.stories.ts`
- `index.ts`

---

## Severity Key

| Level | Meaning |
|-------|---------|
| **P0** | Blocker — violates a zero-tolerance rule or WCAG mandate. Blocks merge. |
| **P1** | Critical — materially broken, missing contract, or usability-defeating defect. |
| **P2** | Moderate — quality gap, gaps in coverage, or non-trivial omission. |

---

## Summary

The `hx-focus-ring` component is structurally coherent but fails several project non-negotiables. The two hardcoded color hex values constitute P0 violations under CLAUDE.md's "No hardcoded values" rule. The total absence of `:focus-visible` behavior — the component's advertised purpose — is a P1 architectural flaw. Dark mode contrast has no CSS handling. Test coverage is missing the `:focus-visible`/keyboard-only behavior tests that the feature description explicitly requires. Three story types are missing.

**Finding count:** 3 P0 · 4 P1 · 6 P2

---

## P0 Findings — Blockers

### P0-01 — Hardcoded hex color in CSS

**File:** `hx-focus-ring.styles.ts`, line 8

```css
--_ring-color: var(--hx-focus-ring-color, #2563eb);
```

CLAUDE.md engineering standard (Zero-Tolerance Policy): _"No hardcoded values — Colors, spacing, typography, and timing use design tokens. Always."_

The fallback `#2563eb` is a raw hex value. This must reference a semantic design token (e.g., `var(--hx-color-focus, #2563eb)` is still not compliant — both the private var and the public CSS prop must resolve through the token cascade). The correct pattern for this project is:

```css
/* Primitive → Semantic → Component cascade */
--_ring-color: var(--hx-focus-ring-color, var(--hx-color-interactive-focus));
```

where `--hx-color-interactive-focus` is defined in the token layer. Using a bare hex in the component stylesheet bypasses the entire three-tier token architecture described in CLAUDE.md.

**Required action:** Replace `#2563eb` fallback with a semantic token reference. Define `--hx-color-interactive-focus` (or equivalent) in the token package if it does not already exist.

---

### P0-02 — Hardcoded pixel fallbacks for width and offset

**File:** `hx-focus-ring.styles.ts`, lines 9–10

```css
--_ring-width: var(--hx-focus-ring-width, 2px);
--_ring-offset: var(--hx-focus-ring-offset, 2px);
```

Same zero-tolerance violation. `2px` are hardcoded dimensional values. While `2px` satisfies WCAG 2.4.11 minimum width, the values must resolve through design tokens so that theme overrides propagate correctly. Expected pattern:

```css
--_ring-width: var(--hx-focus-ring-width, var(--hx-border-width-focus, 2px));
--_ring-offset: var(--hx-focus-ring-offset, var(--hx-spacing-focus-offset, 2px));
```

If `--hx-border-width-focus` and `--hx-spacing-focus-offset` do not exist in the token package, they must be added.

**Required action:** Add the missing primitive/semantic tokens and replace raw pixel fallbacks.

---

### P0-03 — No dark mode contrast handling (WCAG 2.4.11 risk)

**File:** `hx-focus-ring.styles.ts`

WCAG 2.4.11 (Focus Appearance, AA in WCAG 2.2) requires the focus ring to have at least a 3:1 contrast ratio between the ring color and the adjacent colors. The default `#2563eb` blue achieves ~4.6:1 against white (#ffffff) — passing in light mode. However, there is **zero dark-mode CSS handling**. Against common dark backgrounds (e.g., `#111827` ≈ 3.8:1 — marginal; `#1f2937` ≈ 3.5:1; charcoal grays can fall to <3:1), the blue ring may not meet 3:1.

No `@media (prefers-color-scheme: dark)` block exists. No `:host-context([data-theme="dark"])` or equivalent theming support is present. The component will be used in healthcare UIs that must support dark mode. A ring color that passes in light mode can fail the WCAG 2.4.11 contrast threshold in dark mode.

**Required action:** Add `@media (prefers-color-scheme: dark)` block (and/or token-based dark override) that switches the ring to a high-contrast color for dark surfaces. Verify contrast ratio programmatically or via documented token values.

---

## P1 Findings — Critical

### P1-01 — No `:focus-visible` / keyboard-only detection behavior

**File:** `hx-focus-ring.ts`, `hx-focus-ring.styles.ts`

The component is named `hx-focus-ring` and described as a "consistent visible focus indicator." Its entire purpose is to track focus state. Yet the component implements **no autonomous focus detection whatsoever**. The `visible` property is 100% externally controlled. There is no:

- CSS `:focus-within` rule that would auto-show the ring when a slotted element is focused
- Slot `focus`/`blur` event listeners
- `:focus-visible` polyfill or native CSS `:focus-visible` detection

This means every consumer must write their own focus-tracking JavaScript. This defeats the utility value of the component. Worse, it makes keyboard-only visibility (`:focus-visible`, not `:focus`) impossible to implement correctly without significant consumer-side logic.

The feature description explicitly requires: _"keyboard-only visibility (`:focus-visible`)"_. The component has no mechanism to distinguish mouse focus from keyboard focus.

**Required action:** Add CSS `:focus-within` and/or `::slotted(:focus-visible)` rules so the ring appears automatically. Alternatively, add JavaScript slot listeners that set `visible` only for `:focus-visible` events. Document the chosen approach.

---

### P1-02 — `color`, `width`, `offset` props accept raw values, not token references

**File:** `hx-focus-ring.ts`, lines 40–55

```typescript
@property({ type: String })
color: string | undefined = undefined;

@property({ type: String })
width: string | undefined = undefined;

@property({ type: String })
offset: string | undefined = undefined;
```

The feature description states: _"offset/width/color typed as design token references."_ These properties are plain `string | undefined`. There is no branded type, no validation, no JSDoc guidance, and no enforcement that the value must be a CSS custom property reference (e.g., `var(--my-token)`). A consumer can pass `color="#ff0000"` (raw hex) and the component silently accepts and applies it, bypassing the token system.

This is a type-system gap. At minimum, a branded type alias (e.g., `type CSSTokenRef = \`var(--${string})\``) or JSDoc documentation should guide consumers. The CEM will reflect `string` with no context.

**Required action:** Add a branded type or strong JSDoc making clear that these props expect CSS custom property references, not raw values. Consider adding a runtime warning in dev mode for non-`var(--` values.

---

### P1-03 — Missing test: keyboard-only visibility (`:focus-visible`)

**File:** `hx-focus-ring.test.ts`

The feature acceptance criteria explicitly require: _"keyboard-only visibility (`:focus-visible`)"_ tests. No such test exists. There are zero tests that:

- Verify the ring becomes visible on keyboard focus (Tab key) but not on mouse click
- Verify `:focus-visible` CSS behavior on slotted elements
- Simulate focus events on slotted content

The test suite only verifies that the `visible` property/attribute reflects correctly — it does not test any actual focus-triggered behavior.

**Required action:** Add tests that focus slotted elements via keyboard simulation and verify ring visibility changes. This requires the P1-01 implementation to exist first (there must be something to test).

---

### P1-04 — Missing stories: inputs, links, offset variations, dark mode

**File:** `hx-focus-ring.stories.ts`

The feature description requires Storybook stories demonstrating: _"around buttons, inputs, links; offset variations; dark/light mode contrast."_

What is present: button variants (box/circle/pill), custom color, hx-button.

What is **missing**:
1. Story wrapping `<input type="text">` — inputs have different geometry and the ring behavior around them is a primary use case.
2. Story wrapping `<a href="#">` link — hyperlink focus ring is a core accessibility scenario.
3. `OffsetVariations` story showing small (2px), medium (4px), and large (8px) offsets side by side.
4. Dark mode story or dark-mode decorator showing contrast in dark theme.

These are not optional — the feature description itemizes them as acceptance criteria.

**Required action:** Add the four missing story categories.

---

## P2 Findings — Moderate

### P2-01 — `styleMap` with empty string produces empty `style` attribute

**File:** `hx-focus-ring.ts`, line 73

```typescript
style=${hasOverrides ? styleMap(tokenOverrides) : ''}
```

When no overrides are set, `style=""` is serialized as an empty attribute on the DOM element. This is harmless but non-idiomatic. The Lit idiomatic pattern is to use `nothing` from `lit`:

```typescript
import { html, nothing } from 'lit';
// ...
style=${hasOverrides ? styleMap(tokenOverrides) : nothing}
```

`nothing` removes the attribute entirely rather than writing `style=""`, which is cleaner for DOM inspection, DevTools debugging, and snapshot tests.

**Required action:** Import and use `nothing` from `lit` in place of `''` in the falsy branch.

---

### P2-02 — `shape` property has no runtime validation for invalid values

**File:** `hx-focus-ring.ts`, line 62

```typescript
@property({ type: String, reflect: true })
shape: 'box' | 'circle' | 'pill' = 'box';
```

The TypeScript union type is correct, but at runtime (e.g., from Drupal Twig templates passing arbitrary strings), the component silently applies `ring--<invalid>` as a class name with no matching CSS, rendering no visible shape styling. There is no guard or console warning.

**Required action:** Add a runtime guard (e.g., `if (!['box', 'circle', 'pill'].includes(this.shape)) { console.warn(...) }`) and fall back to `'box'` for unknown values, or at minimum document this behavior.

---

### P2-03 — No test for `<input>` or `<a>` as slotted content

**File:** `hx-focus-ring.test.ts`

All test fixtures use `<button>` as the slotted element. The feature description specifies the ring should work around inputs and links. There are no tests verifying:

- Correct slot assignment with `<input>` or `<a>`
- No axe violations when wrapping an `<input>`
- No axe violations when wrapping an `<a href="#">`

Input and anchor elements have different default styling behaviors that may interact unexpectedly with the absolutely-positioned ring overlay (especially for inline vs. block layout).

**Required action:** Add at least two additional `fixture` tests wrapping `<input>` and `<a>` elements, including axe checks.

---

### P2-04 — CEM `@cssprop` doc comments use hardcoded defaults, not token names

**File:** `hx-focus-ring.ts`, lines 21–23

```typescript
 * @cssprop [--hx-focus-ring-color=#2563eb] - Default ring color.
 * @cssprop [--hx-focus-ring-width=2px] - Default ring width.
 * @cssprop [--hx-focus-ring-offset=2px] - Default ring offset from content.
```

The CEM doc comments advertise hardcoded hex/pixel values as defaults. Once P0-01 and P0-02 are fixed (replaced with token fallbacks), these comments will be misleading. They should reference the semantic token names instead:

```
@cssprop [--hx-focus-ring-color=var(--hx-color-interactive-focus)] - ...
```

**Required action:** Update CEM doc comments to reflect token-based defaults after P0 fixes are applied.

---

### P2-05 — Storybook render leaks empty string attributes for unset props

**File:** `hx-focus-ring.stories.ts`, lines 80–82

```typescript
color=${args['color'] ?? ''}
width=${args['width'] ?? ''}
offset=${args['offset'] ?? ''}
```

When these controls have no value, the component receives `color=""`, `width=""`, `offset=""` — empty strings, not `undefined`. The component checks `if (this.color)` which correctly treats empty string as falsy, so no override is applied. However, the attributes are still present in the DOM (`color=""`, `width=""`), which is misleading in DevTools and could confuse snapshot tests.

**Required action:** Use conditional attribute binding:

```typescript
?color=${args['color'] ? args['color'] : undefined}
```

or use Lit's `ifDefined` directive:

```typescript
color=${ifDefined(args['color'] || undefined)}
```

---

### P2-06 — `WrappingHelixButton` story swallows import errors silently

**File:** `hx-focus-ring.stories.ts`, lines 146–147

```typescript
import('../hx-button/index.js').catch(() => undefined);
```

The `.catch(() => undefined)` discards all errors silently. If `hx-button` fails to load (path change, build issue), the story renders an empty focus ring with no content and no error. This makes the story fragile and hard to debug.

**Required action:** At minimum log the error: `.catch((e) => console.error('[hx-focus-ring story] Failed to load hx-button:', e))`. Consider using a static import at the top of the file instead.

---

## Bundle Size Assessment

**Status:** Not directly measured. Given the component is ~80 source lines of TypeScript with no third-party dependencies beyond Lit and the internal token package, the component itself is well within the 5KB budget. The `styleMap` directive adds negligible overhead. **No P0/P1/P2 issues identified here.** Recommend confirming with `npm run build` output once P0 fixes are applied.

---

## Drupal Applicability

The component is a visual utility wrapper. As-is, it is applicable as a Drupal utility via CDN include. No server-side rendering dependency. However, the lack of autonomous focus detection (P1-01) means Drupal Twig templates cannot simply wrap a focusable element and get correct behavior — custom JavaScript Drupal behavior would need to wire up the `visible` attribute. This significantly reduces Drupal ergonomics. After P1-01 is resolved, applicability improves substantially.

---

## Findings Checklist

| ID | Severity | Area | Description |
|----|----------|------|-------------|
| P0-01 | **P0** | CSS / Tokens | Hardcoded `#2563eb` hex fallback — violates zero-tolerance design token rule |
| P0-02 | **P0** | CSS / Tokens | Hardcoded `2px` pixel fallbacks — violates zero-tolerance design token rule |
| P0-03 | **P0** | Accessibility | No dark mode CSS handling — WCAG 2.4.11 contrast may fail in dark themes |
| P1-01 | P1 | Architecture | No autonomous `:focus-visible` detection — component name/purpose misleading |
| P1-02 | P1 | TypeScript | `color`/`width`/`offset` are `string`, not typed as token references |
| P1-03 | P1 | Tests | Zero tests for keyboard-only visibility (`:focus-visible`) — explicit AC gap |
| P1-04 | P1 | Storybook | Missing stories: inputs, links, offset variations, dark mode contrast |
| P2-01 | P2 | CSS / Lit | `style=""` empty attribute — use `nothing` from lit |
| P2-02 | P2 | Runtime | `shape` accepts invalid values with no warning or fallback |
| P2-03 | P2 | Tests | No tests with `<input>` or `<a>` as slotted content |
| P2-04 | P2 | CEM | `@cssprop` doc comments advertise hardcoded defaults, not token names |
| P2-05 | P2 | Storybook | Empty string attributes leak into DOM for unset Storybook controls |
| P2-06 | P2 | Storybook | `WrappingHelixButton` swallows import errors silently |

---

## DO NOT FIX

Per audit mandate: **This document is findings only. No code was modified.** All findings above are documented for the implementing engineer. Fixes should be applied by the assigned specialist (lit-specialist for component/CSS, storybook-specialist for stories, qa-engineer-automation for tests) following the standard review workflow.
