# AUDIT: hx-image — T3-11 Antagonistic Quality Review

**Reviewer:** Antagonistic audit agent
**Date:** 2026-03-06
**Branch:** feature/audit-hx-image-t3-11-antagonistic
**Files reviewed:**
- `hx-image.ts`
- `hx-image.styles.ts`
- `hx-image.stories.ts`
- `hx-image.test.ts`
- `index.ts`

---

## Severity Legend

| Code | Meaning |
|------|---------|
| P0 | Blocks merge. Regression or spec violation that ships broken behavior. |
| P1 | Must fix before ship. Significant gap in functionality, coverage, or correctness. |
| P2 | Should fix. Design debt, discoverability hazard, or missing expected feature. |

---

## P0 — Blocks Merge

### P0-01: `alt` defaults to `''` — every image is silently decorative by default

**File:** `hx-image.ts:43`
**Code:**
```ts
alt = '';
```

Every `<hx-image src="patient-photo.jpg">` with no `alt` attribute renders with `alt=""` and `role="presentation"`, completely hiding the image from screen readers with no warning, error, or fallback. This is the exact opposite of what WCAG requires. Informative images must have meaningful alt text; missing alt should be a developer error, not a silent accessibility bypass.

**WCAG reference:** 1.1.1 Non-text Content (Level A) — "all non-text content that is presented to the user has a text alternative."

**Expected behavior:** Either (a) require `alt` with no default forcing developer intent, or (b) add a `decorative` boolean prop so decorative intent is explicit and `alt=""` is reserved for intentional use.

---

### P0-02: No `srcset` or `sizes` attribute support

**File:** `hx-image.ts` (entire component)

The component has no support for `srcset` or `sizes` attributes on the inner `<img>`. Drupal — the primary consumer — uses responsive image styles (Drupal Image Styles, `<picture>`, `srcset`) as a core pattern. Without these attributes the component cannot serve responsive images, making it unfit for production Drupal use. The audit spec explicitly requires "Drupal — responsive images."

**Impact:** Every Drupal implementation using this component will either serve unoptimized images or bypass the component entirely.

---

## P1 — Must Fix Before Ship

### P1-01: Caption feature is entirely absent

**Files:** `hx-image.ts`, `hx-image.styles.ts`, `hx-image.stories.ts`

The audit spec requires:
- A "with caption" story
- A `caption` CSS part
- Caption token support

None of these exist. There is no `<figcaption>`, no caption slot, no `--hx-image-caption-*` design token, and no `caption` CSS part. The component renders a plain `<div>` wrapper with an `<img>` — no semantic figure/caption structure at all.

A caption-capable image component should wrap in `<figure>`/`<figcaption>`, expose a `caption` slot, and document the `caption` part.

---

### P1-02: No ARIA live region for error/fallback state

**File:** `hx-image.ts:151-157`
**Code:**
```ts
if (this._error) {
  return html`
    <div class="image__container image__container--error" style=${styleMap(containerStyles)}>
      <slot name="fallback"></slot>
    </div>
  `;
}
```

When image loading fails and the fallback slot is shown, screen reader users receive no announcement. The error container is not an `aria-live` region, has no `role="alert"`, and no visible or audible indication of failure. In a healthcare context where images may be clinical photographs, a silent failure is a patient safety concern.

**Fix needed:** Add `role="alert"` or `aria-live="polite"` to the error container, and include a default visually-hidden status message.

---

### P1-03: `_computeBorderRadius` and `rounded` prop are not tested

**File:** `hx-image.test.ts`

The `rounded` property has three distinct code paths in `_computeBorderRadius`:
1. `rounded === true` or `rounded === ''` → theme radius token
2. `rounded` is a non-empty string other than `'false'` → used directly as CSS
3. All other cases → `undefined`

None of these paths are tested. The `rounded === 'false'` guard (which causes the string `"false"` to be treated as no border-radius) is particularly unexpected behavior that warrants explicit test coverage.

---

### P1-04: Storybook `Default` story `play` function asserts on unreflected attribute

**File:** `hx-image.stories.ts:132`
**Code:**
```ts
await expect(img?.getAttribute('alt')).toBe('A sample image');
```

`alt` is declared as `@property({ type: String })` without `reflect: true`. The Lit property is set but the HTML attribute is NOT reflected back to the DOM. `img.getAttribute('alt')` returns `null`, not `'A sample image'`. This play-function test silently passes or fails unpredictably depending on how Storybook hydrates the element from args.

---

### P1-05: Duplicate test — CSS Parts block repeats Rendering block

**File:** `hx-image.test.ts:183-190`

The `CSS Parts` describe block (lines 183–190) is functionally identical to the test at lines 24–29 in the `Rendering` describe block. Both query `[part="base"]` and assert the tag is `img`. This inflates apparent test count without adding coverage.

---

## P2 — Should Fix

### P2-01: No `decorative` prop — relying on `alt=""` is an implicit contract

**File:** `hx-image.ts`

The spec requires: "alt text required (no empty alt unless decorative with explicit `decorative` prop)." The implementation uses `alt=""` as the sole signal for decorative intent, which follows HTML conventions but makes decorative intent implicit. A `decorative` boolean prop (e.g. `<hx-image decorative>`) would make intent explicit in markup and CEM, enable Storybook documentation of the pattern, and make linting rules possible.

---

### P2-02: `rounded` property has untyped `@property()` decorator — Lit/TS type mismatch

**File:** `hx-image.ts:88-89`
**Code:**
```ts
@property()
rounded: boolean | string | undefined = undefined;
```

`@property()` without a `type` defaults to `String` conversion for attribute reflection. When `rounded` is set as a boolean HTML attribute (`<hx-image rounded>`), Lit reads it as the string `''`, not `true`. The implementation compensates with `rounded === '' || rounded === true` but this undocumented dual-mode behavior is a footgun. The TypeScript type `boolean | string | undefined` does not align with Lit's actual coercion behavior.

---

### P2-03: Missing tests for `ratio`, `fit`, `width`, and `height` properties

**File:** `hx-image.test.ts`

The following properties have zero test coverage:
- `ratio` — no test that `--_ratio` is set in the container's style
- `fit` — no test that `--_fit` is set or that `object-fit` is applied
- `width` — no test for number value (`200` → `"200px"`) or string value
- `height` — same as width

These are public API surface that consumers depend on. Missing tests means regressions won't be caught.

---

### P2-04: No lazy loading demo story

**File:** `hx-image.stories.ts`

The audit spec explicitly requires a "lazy loading demo" story. There is no story demonstrating or exercising the `loading="eager"` vs `loading="lazy"` behavior, no visual indicator of when lazy loading triggers, and no `play` function verifying the `loading` attribute value. The `Default` story uses `loading: 'lazy'` silently.

---

### P2-05: No responsive story

**File:** `hx-image.stories.ts`

No story demonstrates responsive behavior (fluid width, container queries, or `srcset`). Given that Drupal is the primary consumer and responsive images are a core requirement, a responsive story should be mandatory.

---

### P2-06: `:host { display: inline-block }` is wrong default for block-level usage ✅ FIXED

**File:** `hx-image.styles.ts:5-7`
**Area:** CSS

**Resolution:** Changed `:host` display from `inline-block` to `block`. This is the correct default for image components used in block contexts, preventing baseline alignment gaps with adjacent text nodes.

---

### P2-07: Key properties not reflected to DOM attributes

**File:** `hx-image.ts`

`loading`, `fit`, `ratio`, `rounded`, `src`, and `alt` are not reflected with `reflect: true`. This means:
- CSS attribute selectors (`hx-image[loading="lazy"]`) don't work after programmatic changes
- DevTools shows stale attribute values
- Drupal server-side rendered attributes may conflict with hydrated property values

For a Drupal-first component, attribute reflection is important for progressive enhancement.

---

### P2-08: Fallback error container missing `min-height` — collapses to zero without `ratio` or `height` ✅ FIXED

**File:** `hx-image.styles.ts:16-22`
**Area:** CSS

**Resolution:** Added `min-height: var(--hx-image-fallback-min-height, 3rem)` to `.image__container--error`. Error state now has a visible minimum height even when neither `ratio` nor `height` is set. The token allows consumer customization.

---

### P2-09: `hx-error` event not dispatched after fallback-src also fails — untested

**File:** `hx-image.ts:108-116`, `hx-image.test.ts:160-178`

The test "shows fallback slot after fallback-src also fails" (line 160) only verifies the `.image__container--error` appears. It does not assert that `hx-error` was dispatched after the second failure. Reading the code, `_handleError` does dispatch `hx-error` on the second call — but consumers who listen for `hx-error` to know the image definitively failed have no test confirming this contract. The test must be strengthened.

---

### P2-10: `src` rendered as `nothing` when empty, but `alt` is still set as `alt=""`

**File:** `hx-image.ts:164-165`
**Code:**
```ts
src=${this._currentSrc() || nothing}
alt=${this.alt}
```

When `src` is `''`, the `src` attribute is omitted (`nothing`), which is correct. However, `alt=""` remains on the img, and browsers will still show a broken image indicator in some environments while screen readers skip it silently. The component should either show the fallback/error state or omit the img entirely when `src` is empty. Currently `_handleError` is never called if `src` is omitted — the img renders without src and without triggering any error path.

---

## Summary Table

| ID | Area | Severity | Finding |
|----|------|----------|---------|
| P0-01 | Accessibility | P0 | `alt` defaults to `''` — all images silently decorative |
| P0-02 | Drupal / Performance | P0 | No `srcset`/`sizes` — responsive images unsupported |
| P1-01 | Feature completeness | P1 | Caption feature entirely absent (no slot, no part, no story) |
| P1-02 | Accessibility | P1 | No ARIA live region for error/fallback state |
| P1-03 | Tests | P1 | `rounded` / `_computeBorderRadius` not tested |
| P1-04 | Tests / Storybook | P1 | Default story `play` asserts on unreflected attribute |
| P1-05 | Tests | P1 | Duplicate CSS Parts test adds no coverage |
| P2-01 | Accessibility / API | P2 | No explicit `decorative` prop |
| P2-02 | TypeScript | P2 | `rounded` `@property()` type mismatch with Lit coercion |
| P2-03 | Tests | P2 | `ratio`, `fit`, `width`, `height` have zero test coverage |
| P2-04 | Storybook | P2 | No lazy loading demo story |
| P2-05 | Storybook | P2 | No responsive story |
| P2-06 | CSS | P2 | `:host { display: inline-block }` wrong default for block images ✅ FIXED |
| P2-07 | API / Drupal | P2 | Properties not reflected to attributes |
| P2-08 | CSS | P2 | Error container collapses to zero height without `ratio`/`height` ✅ FIXED |
| P2-09 | Tests | P2 | `hx-error` dispatch after fallback-src failure not asserted |
| P2-10 | Logic | P2 | Empty `src` skips error path — broken image renders silently |

---

## Verdict

**NOT READY FOR SHIP.**

2 P0 blockers, 5 P1 defects. The component has a solid structural foundation but the accessibility default (P0-01) is a critical regression that would silently hide informative images from screen readers in production. The missing `srcset`/`sizes` support (P0-02) makes it unfit for its primary consumer (Drupal). The caption feature (P1-01) is listed in the spec but entirely absent from the implementation.

**CSS fixes applied (P2-06, P2-08):** `:host` display corrected to `block` and error container `min-height` added. Remaining P0/P1 items require further implementation work.
