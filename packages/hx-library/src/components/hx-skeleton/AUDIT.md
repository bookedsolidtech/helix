# hx-skeleton — Antagonistic Quality Audit (T2-04)

**Auditor:** Automated antagonistic review agent
**Date:** 2026-03-06
**Branch:** `feature/audit-hx-skeleton-t2-04-antagonistic`
**Files reviewed:**

- `hx-skeleton.ts`
- `hx-skeleton.styles.ts`
- `hx-skeleton.test.ts`
- `hx-skeleton.stories.ts`
- `index.ts`
- `dist/shared/hx-skeleton-Ba-BOP8V.js` (bundle)
- `testing/drupal/templates/helix-all-components.html.twig`

---

## Summary

| Severity      | Count |
| ------------- | ----- |
| P0 (Blocking) | 1     |
| P1 (High)     | 5     |
| P2 (Medium)   | 5     |

All tests pass (21/21, 100% coverage). TypeScript is clean (0 errors). Bundle is 3.2 KB unminified. These findings do NOT reflect runtime failures but rather gaps against the specification and quality bar.

---

## P0 — Blocking

### P0-01: Missing `loaded` state and live region announcement

**File:** `hx-skeleton.ts`
**Area:** Accessibility / Implementation

The feature specification explicitly requires:

- A live region announcing when content has loaded
- A content-loaded state transition

The component has no `loaded` property, no event emission (`hx-loaded` or similar), and no `aria-live` region. When a skeleton is replaced by real content, assistive technology users receive zero notification that the loading state has ended. This is a WCAG 2.1 AA Level failure in a healthcare product where state changes must be communicated to all users.

**Expected (from spec):**

```html
<!-- Component should support something like: -->
<hx-skeleton loaded></hx-skeleton>
<!-- or dispatch an hx-loaded event for consumer to manage live region -->
```

**Current state:** No mechanism exists. Consumer cannot use this component in an accessible loading pattern without building their own wrapper.

---

## P1 — High Priority

### P1-01: `aria-hidden` not set on the host element — only on inner shadow span

**File:** `hx-skeleton.ts:80`
**Area:** Accessibility

```ts
// Current — aria-hidden only on shadow child:
return html`<span part="base" aria-hidden="true" role="presentation"></span>`;
```

The `aria-hidden="true"` attribute is set on the inner shadow `<span>`, not on the custom element host (`<hx-skeleton>`). The host element is visible in the accessibility tree as a generic element. Some screen reader + browser combinations (notably NVDA+Chrome) traverse shadow hosts even when their children are aria-hidden. The correct approach for a fully decorative element is to programmatically set `aria-hidden="true"` on the host in `connectedCallback` or via a `role="none"` on the host reflected attribute.

**Risk:** AT users may encounter orphaned, unlabelled focusable traversal points when tabbing through skeleton loaders in a loading page.

---

### P1-02: `paragraph` variant absent — implementation uses `button` instead

**File:** `hx-skeleton.ts:34`
**Area:** TypeScript / Feature Spec

The audit specification requires:

> variant (text/circle/rect/paragraph) typed

The implementation ships:

```ts
variant: 'text' | 'circle' | 'rect' | 'button' = 'rect';
```

The `paragraph` variant is entirely absent. The `button` variant exists in its place. These serve different use cases:

- `paragraph` = multi-line text block (typically multiple stacked text lines rendered as a single semantic unit)
- `button` = interactive action placeholder

Whether this is a spec change or implementation error is unresolved, but the mismatch means either the audit criteria is wrong or the implementation diverged from requirements. The absence of `paragraph` forces consumers to manually compose multiple `text` variants for a paragraph skeleton, which is undocumented.

---

### P1-03: `prefers-reduced-motion` leaves static shimmer gradient visible

**File:** `hx-skeleton.styles.ts:68–72`
**Area:** Accessibility / CSS

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton--animated::after {
    animation: none;
  }
}
```

`animation: none` stops the shimmer movement but **the `::after` pseudo-element remains rendered** with its `linear-gradient` background. This creates a permanent, static light-band overlay on the skeleton placeholder that appears frozen. For users with vestibular disorders who opt into `prefers-reduced-motion`, this static visual artifact may still cause discomfort and is inconsistent with WCAG SC 2.3.3 (Animation from Interactions).

The correct fix is:

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton--animated::after {
    display: none; /* or opacity: 0 */
  }
}
```

---

### P1-04: Boolean attribute `animated="false"` test is misleading

**File:** `hx-skeleton.test.ts:86–91`
**Area:** Tests

```ts
it('does not apply animated class when animated is false', async () => {
  const el = await fixture<HelixSkeleton>('<hx-skeleton animated="false"></hx-skeleton>');
  el.animated = false;    // <-- JS property set AFTER construction
  await el.updateComplete;
  ...
});
```

Lit Boolean properties treat **attribute presence** as `true` — `animated="false"` in HTML sets `el.animated = true` because the attribute exists. The test then immediately overwrites with `el.animated = false` (JS property path), masking the incorrect attribute parsing. The HTML attribute `animated="false"` is never tested to actually behave as `false`. A consumer writing `<hx-skeleton animated="false">` in Twig/HTML will get an animated skeleton (attribute present = true), which contradicts the string value passed.

This is a test that passes but tests the wrong code path. The correct test of the attribute behavior would be:

```ts
const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
// remove the attribute to test false state
el.removeAttribute('animated');
```

---

### P1-05: No Drupal Twig template for `hx-skeleton`

**File:** `testing/drupal/templates/helix-all-components.html.twig`
**Area:** Drupal Integration

The integration test template (`helix-all-components.html.twig`) covers 19 other components but `hx-skeleton` is completely absent. There is no `helix-skeleton.html.twig` template in the Drupal testing directory. A Drupal developer has no reference for how to use `hx-skeleton` in a Twig template with:

- Proper `aria-busy` wrapper
- Conditional rendering of skeleton vs. real content
- CDN script include pattern

The component is not verified Drupal-renderable per the CLAUDE.md requirement.

---

## P2 — Medium Priority

### P2-01: No `--hx-skeleton-circle-radius` CSS custom property

**File:** `hx-skeleton.styles.ts:26–31`
**Area:** CSS / Design Tokens

Three of the four variants expose a border-radius token:

- `--hx-skeleton-text-radius`
- `--hx-skeleton-rect-radius`
- `--hx-skeleton-button-radius`

But `.skeleton--circle` hardcodes `border-radius: 50%` with no override token. This is inconsistent — consumers cannot theme the circle radius (e.g., for a rounded-rectangle avatar skeleton) without CSS part overrides. Should be:

```css
.skeleton--circle {
  border-radius: var(--hx-skeleton-circle-radius, 50%);
}
```

---

### P2-02: No `loading → loaded` Storybook story

**File:** `hx-skeleton.stories.ts`
**Area:** Storybook

The audit criteria explicitly requires:

> Storybook — all variants, loading→loaded transition demo

No story demonstrates the transition from a skeleton state to real content. All 8 stories show static skeleton states. Given the P0 finding that the `loaded` state doesn't exist yet, this is a documentation gap that will remain unresolvable until P0-01 is fixed.

---

### P2-03: Shimmer `background-size` has no CSS variable override point

**File:** `hx-skeleton.styles.ts:55`
**Area:** CSS / Design Tokens

```css
background-size: 200% 100%;
```

The shimmer sweep width (`200%`) is hardcoded. There is no `--hx-skeleton-shimmer-width` or similar token to adjust shimmer intensity. This is inconsistent with the other exposed CSS custom properties and limits consumer theming flexibility.

---

### P2-04: No test for invalid/unknown variant values

**File:** `hx-skeleton.test.ts`
**Area:** Tests

The variant property is typed as `'text' | 'circle' | 'rect' | 'button'` but TypeScript types are erased at runtime. If a consumer passes an unknown variant via HTML attribute (e.g., `variant="image"`), the CSS class `skeleton--image` is applied but has no styles, resulting in a zero-height invisible element. There is no test verifying graceful degradation, and no fallback in the CSS. This is particularly risky in Drupal where variant values come from CMS data.

---

### P2-05: Test suite missing rect variant class test

**File:** `hx-skeleton.test.ts`
**Area:** Tests

The `Property: variant` describe block tests `text`, `circle`, and `button` variant class application but is **missing a test for the `rect` variant class** (`skeleton--rect`). Since `rect` is the default variant and critical to the component's primary use case, this gap in the class-application tests is a notable omission. The only `rect` test is that it's the default value — not that it applies the correct CSS class.

---

## What Passes

The following checks passed without issue:

| Check                            | Result                                      |
| -------------------------------- | ------------------------------------------- |
| `npm run type-check`             | 0 errors                                    |
| All 21 tests                     | Pass                                        |
| Code coverage (hx-skeleton.ts)   | 100% statements, branches, functions, lines |
| axe-core (default state)         | 0 violations                                |
| axe-core (all 4 variants)        | 0 violations                                |
| axe-core (not animated)          | 0 violations                                |
| Bundle size (unminified)         | 3,240 bytes — well under 5KB budget         |
| Animation is CSS-only            | Confirmed — no JS timers or rAF             |
| `--hx-*` token prefix            | Compliant on all CSS custom properties      |
| `part="base"` exposed            | Confirmed                                   |
| `prefers-reduced-motion` handled | Partial (see P1-03)                         |
| Shadow DOM encapsulation         | Confirmed                                   |
| No `any` types                   | Confirmed                                   |
| TypeScript strict mode           | Confirmed                                   |

---

## Recommended Fix Order

1. **P0-01** — Add `loaded` property + `hx-loaded` event + consumer documentation for live region pattern
2. **P1-01** — Set `aria-hidden="true"` on host element via `connectedCallback` or reflected property
3. **P1-03** — Change `prefers-reduced-motion` rule to `display: none` on `::after`
4. **P1-04** — Fix the `animated="false"` test to test attribute removal, not JS property override
5. **P1-02** — Clarify `paragraph` vs `button` variant with design/spec — implement whichever is correct
6. **P1-05** — Add `helix-skeleton.html.twig` Drupal integration template
7. **P2-01** — Add `--hx-skeleton-circle-radius` token
8. **P2-02** — Add loading→loaded Storybook story (after P0-01 resolved)
9. **P2-03** — Add `--hx-skeleton-shimmer-width` token
10. **P2-04** — Add invalid variant graceful degradation test
11. **P2-05** — Add `rect` variant class application test
