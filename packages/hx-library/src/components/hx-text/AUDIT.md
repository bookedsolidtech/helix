# AUDIT: hx-text — T3-12 Antagonistic Quality Review

**Reviewer:** Automated antagonistic audit agent
**Date:** 2026-03-06
**Scope:** All files in `packages/hx-library/src/components/hx-text/`
**Mandate:** Document defects only. Do NOT fix.

---

## Summary

| Severity     | Count  |
| ------------ | ------ |
| P0 (Blocker) | 1      |
| P1 (High)    | 5      |
| P2 (Medium)  | 6      |
| **Total**    | **12** |

---

## P0 — Blockers

### P0-01: Truncated text provides no accessible full-text exposure

**File:** `hx-text.ts:67-86`, `hx-text.test.ts:211-217`

When `truncate=true` or `lines > 0`, visible text is clipped with CSS `text-overflow: ellipsis` or `-webkit-line-clamp`. No `title` attribute and no `aria-label` is added to the host or inner span to expose the full text to screen readers. Assistive technology users receive only the truncated string with no indication that content has been hidden.

The audit specification explicitly requires: "truncation provides full text via title or aria-label."

The test at line 211 checks only that no axe-core violations exist in the truncated state. Axe-core does not detect this failure pattern (it only fires for explicit ARIA violations, not for missing title/aria-label on clipped content). The test gives false confidence.

**Impact:** Healthcare applications commonly truncate patient names, medication notes, and clinical summaries in dense UIs. A screen reader user on a patient record row would hear "Patient: John Al..." with no way to discover the full name. This is a WCAG 2.1 SC 1.4.4 (Resize Text) and SC 1.3.1 (Info and Relationships) concern; for clinical data it is patient-safety-adjacent.

---

## P1 — High

### P1-01: No semantic element selection mechanism — always renders `<span>`

**File:** `hx-text.ts:83`

```typescript
return html`
  <span part="base" class=${classMap(classes)} style=${styleMap(inlineStyles)}>
    <slot></slot>
  </span>
`;
```

The shadow DOM always renders a `<span>`. There is no `as` property or equivalent escape hatch to produce a `<p>`, `<strong>`, `<em>`, or other semantically appropriate element. The audit specification requires "semantic element selection (p, span, strong, em) based on context."

A consumer who uses `<hx-text variant="body">` to render a paragraph-length block of text gets a non-semantic inline wrapper. While light-DOM slotting preserves any semantic elements the consumer provides, the absence of a first-class mechanism contradicts the spec and forces consumers to add wrapper elements outside the component, defeating the purpose of the abstraction.

**Impact:** Design system consumers building Drupal Twig templates cannot express `<p>`, `<strong>`, or `<em>` semantics through this component. They are forced to either ignore the component for those use cases or add workaround markup.

---

### P1-02: `:host([lines])` CSS selector fires for `lines="0"` — spurious `display: block`

**File:** `hx-text.styles.ts:149-151`

```css
:host([lines]) {
  display: block;
}
```

This attribute selector matches any element with a `lines` attribute, including `lines="0"`. Since the `lines` property has `reflect: true`, a consumer writing `<hx-text lines="0">` will have the `lines` attribute reflected onto the host with value `"0"`. The selector matches, forcing the host to `display: block`, even though `lines=0` explicitly means "no clamping."

The equivalent bug exists for `:host([lines])` matching `lines="0"` while the render logic correctly guards `this.lines > 0` before applying the clamp class. The CSS selector and the TypeScript logic are inconsistent.

**Impact:** Any inline usage of `<hx-text lines="0">` within a flex/grid row or an inline context (e.g., inside a `<td>` alongside other inline content) will unexpectedly break to `display: block`, causing layout regressions in downstream consumers.

---

### P1-03: Variant set deviates from audit specification without documentation

**File:** `hx-text.ts:34-35`

The audit specification defines variants as: `body / lead / small / caption / overline`.

The implementation defines variants as: `body / body-sm / body-lg / label / label-sm / caption / code / overline`.

Missing from spec: `lead`, `small`.
Present in implementation but unspecified: `body-sm`, `body-lg`, `label`, `label-sm`, `code`.

There is no changelog entry, no design decision record, and no comment in the code explaining the deviation. This may be an intentional product evolution, or it may mean `lead` and `small` were silently dropped. Either way, the public API contract is undocumented relative to the specification that governs this audit, and consumers or Drupal template authors relying on spec-documented variant names will find them absent.

**Impact:** Any documentation, design token mapping, or Drupal Twig template authored against the spec variant names `lead` and `small` will produce silent fallback to `variant="body"` (the default), misrepresenting the intended typographic style.

---

### P1-04: Tests do not verify `-webkit-line-clamp` inline style is applied

**File:** `hx-text.test.ts:154-175`

The `lines` test suite verifies that the CSS class `text--clamp` is applied when `lines > 0`, but no test verifies that the `-webkit-line-clamp` inline style is actually set on the base element. The inline style is applied via `styleMap` in the render function:

```typescript
const inlineStyles =
  this.lines > 0
    ? { '-webkit-line-clamp': String(this.lines), 'line-clamp': String(this.lines) }
    : {};
```

A future refactor could drop the `styleMap` call (or incorrectly short-circuit the condition) without breaking any existing test. Multi-line clamping would silently stop working.

---

### P1-05: `inverse` and `disabled` colors excluded from axe test loop without sufficient justification

**File:** `hx-text.test.ts:199-209`

The a11y test loop covers only `['default', 'subtle', 'danger', 'success', 'warning']`. The colors `inverse` and `disabled` are silently excluded. The inline comment justifies only `disabled` (WCAG 1.4.3 exempts inactive UI components). No comment or justification covers `inverse`.

`color="inverse"` (`--hx-color-neutral-0: #ffffff`) renders white text. Without a dark background context in the test fixture, this will fail contrast checks against any default test background. Rather than fixing the test fixture to apply a dark background, the color was quietly dropped from the loop. The resulting axe test therefore does not prove that `inverse` is safe; it proves nothing about `inverse`.

---

## P2 — Medium

### P2-01: Storybook meta render function sets `weight=""` when weight is undefined

**File:** `hx-text.stories.ts:89`

```typescript
weight=${args.weight ?? ''}
```

When `args.weight` is `undefined` (the "no weight override" state), this renders `weight=""` as an attribute on the element. Lit's property converter for a `String`-typed property does not coerce `""` to `undefined` — it stores the empty string. The `classMap` logic then evaluates:

```typescript
[`text--weight-${this.weight}`]: this.weight !== undefined,
```

`"" !== undefined` is `true`, so the class `text--weight-` (with no suffix) is applied to the base element. This class does not exist in the stylesheet, so there is no visual regression, but the DOM is polluted with a spurious class and an empty attribute, making Storybook controls unreliable for the "unset" weight state.

The correct approach is `weight=${ifDefined(args.weight)}` using Lit's `ifDefined` directive.

---

### P2-02: `code` variant excluded from accessibility test loop without explanation

**File:** `hx-text.test.ts:189`

The variant a11y loop at line 189 lists `['body', 'body-sm', 'body-lg', 'label', 'label-sm', 'caption', 'overline']` — `code` is missing. No comment explains why. If this is intentional (e.g., monospace fonts are known to trigger false positives from certain axe rules), that rationale must be documented. If it is an oversight, `code` variant has never been axe-tested.

---

### P2-03: Non-prefixed `line-clamp` in `styleMap` is a no-op in all current browsers

**File:** `hx-text.ts:79`

```typescript
{ '-webkit-line-clamp': String(this.lines), 'line-clamp': String(this.lines) }
```

The unprefixed `line-clamp` CSS shorthand is not supported in any shipping browser as of the audit date (it is a draft CSS Overflow Module Level 4 spec). Setting it via `styleMap` has no effect and adds dead code. The `-webkit-line-clamp` value is the only operative declaration. The non-prefixed entry creates noise and false reassurance that a standards-compliant fallback is in place.

---

### P2-04: No runtime guard for negative `lines` values

**File:** `hx-text.ts:64-65`

```typescript
@property({ type: Number, reflect: true })
lines = 0;
```

The TypeScript type is `number`, which allows negative values. A consumer passing `lines="-1"` via HTML attribute will have `-webkit-line-clamp: -1` set as an inline style. This is an invalid CSS value — browsers ignore it silently — but the `text--clamp` class is still applied (`this.lines > 0` is `false` for `-1`, so the clamp class is NOT applied, but the inline style IS set when `this.lines > 0` is false it returns `{}` so actually for negative values lines > 0 is false so no inline style). Wait — `lines=-1 > 0` is false so `inlineStyles = {}`. But `text--clamp` class requires `this.lines > 0`, so class is also not applied. The component silently falls back to default state for negative values, which is correct behavior but undocumented. A `@min(0)` annotation or a guard log would make this explicit.

---

### P2-05: No Drupal Twig template or integration documentation

**Files:** All files in component directory

None of the five component files include a Twig template example, Drupal behavior stub, or CDN usage note. The audit specification lists "Drupal — Twig-renderable" as a required audit area. While `hx-text` is technically renderable in Twig as a custom element, the absence of any integration guidance means:

- Drupal developers must guess the correct attribute names (especially for `variant`, `weight`, and boolean `truncate`)
- Boolean attribute handling (`?truncate` in Lit templates has no direct equivalent in Twig)
- No example for the `lines` attribute with numeric string coercion

Other components in the library provide at minimum a usage example. `hx-text` provides none.

---

### P2-06: Type alias `WcText` uses stale naming convention

**File:** `hx-text.ts:90`

```typescript
export type WcText = HelixText;
```

The type alias uses the `WcText` prefix (from the original `wc-2026` namespace), while the class is named `HelixText` and the project has standardized on the `Helix` prefix throughout. Every other component exports a type alias under `Helix*` naming or no alias at all. The `WcText` alias creates a naming inconsistency in the public TypeScript API and will appear in generated `.d.ts` files and the CEM, confusing consumers who encounter both `HelixText` and `WcText` referring to the same class.
