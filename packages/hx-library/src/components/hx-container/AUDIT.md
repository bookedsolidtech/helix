# AUDIT: hx-container — Antagonistic Quality Review (T3-59)

**Reviewer:** Automated antagonistic audit
**Date:** 2026-03-05
**Component:** `hx-container` — Layout width-constraining primitive
**Files audited:**
- `hx-container.ts`
- `hx-container.styles.ts`
- `hx-container.test.ts`
- `hx-container.stories.ts`
- `index.ts`

---

## Severity Key

| Level | Meaning |
|-------|---------|
| **P0** | Blocks release. Broken functionality, security issue, or WCAG violation. |
| **P1** | Must fix before merge. Violates project conventions or creates consumer-facing gaps. |
| **P2** | Should fix. Quality issue — test is misleading, code is inconsistent, or gap in coverage. |
| **P3** | Nice to fix. Minor convention drift or documentation gap. |

---

## Findings

---

### [P1-01] Missing `alignment` prop — Centering is not overridable

**File:** `hx-container.ts`, `hx-container.styles.ts`
**Area:** TypeScript, CSS

The audit specification explicitly calls out an `alignment` prop. No such prop exists. The component unconditionally applies `margin-left: auto; margin-right: auto` on the inner wrapper with no mechanism for consumers to override to left- or right-aligned content. In page layouts where a container should flush-left (e.g., a sidebar column or an inline notification block), there is no API to express this.

**Evidence:**
```ts
// hx-container.ts — only width and padding props exist
@property({ type: String, reflect: true })
width: 'full' | 'content' | 'narrow' | 'sm' | 'md' | 'lg' | 'xl' = 'content';

@property({ type: String, reflect: true })
padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'none';
// No alignment prop.
```

**Impact:** Healthcare portals frequently embed `hx-container` within sidebar layouts or asymmetric grid columns where centered margins break the design.

---

### [P1-02] Hardcoded px/rem fallback values in CSS custom properties — Token violation

**File:** `hx-container.styles.ts`, lines 61–82
**Area:** CSS

The project mandates: **"No hardcoded values — Colors, spacing, typography, and timing use design tokens. Always."** The max-width fallback values for all width presets are hardcoded pixel/rem literals instead of referencing `--hx-*` breakpoint tokens.

**Evidence:**
```css
.container__inner--sm   { max-width: var(--hx-container-max-width, var(--hx-container-sm, 640px)); }
.container__inner--md   { max-width: var(--hx-container-max-width, var(--hx-container-md, 768px)); }
.container__inner--lg   { max-width: var(--hx-container-max-width, var(--hx-container-lg, 1024px)); }
.container__inner--xl   { max-width: var(--hx-container-max-width, var(--hx-container-xl, 1280px)); }
.container__inner--content { max-width: var(--hx-container-max-width, var(--hx-container-content, 72rem)); }
.container__inner--narrow  { max-width: var(--hx-container-max-width, var(--hx-container-narrow, 48rem)); }
```

These fallbacks should reference `--hx-breakpoint-sm`, `--hx-breakpoint-md`, etc. if such tokens exist in the design system. The current approach means breakpoint values are defined in two places (CSS fallbacks and the token system), creating a drift risk.

**Impact:** If the design token tier updates breakpoint values, the hardcoded fallbacks silently diverge.

---

### [P1-03] No responsive padding — Fixed vertical padding at all breakpoints

**File:** `hx-container.styles.ts`, lines 11–41
**Area:** CSS

The `padding` prop applies identical vertical spacing regardless of viewport size. There are no `@media` queries to reduce padding on mobile viewports. For a layout primitive used across all page widths in a healthcare portal, this means:
- `padding="lg"` (4rem top/bottom = 128px of vertical space on mobile) crushes useful content area on small screens.
- `padding="2xl"` (8rem = 256px total vertical padding) is unusable on mobile and tablet.

**Evidence:** No `@media` rules exist in `hx-container.styles.ts`.

**Impact:** Pages using `hx-container` with any padding variant will have poor mobile layout. This is a layout primitive — the failure multiplies across every page that uses it.

---

### [P2-01] Centering test verifies computed `0px`, not `auto` margin — Test proves nothing

**File:** `hx-container.test.ts`, lines 194–200
**Area:** Tests

The test named `".container__inner has auto horizontal margins for centering"` asserts:

```ts
expect(styles.marginLeft).toBe('0px');
expect(styles.marginRight).toBe('0px');
```

This is a false positive. When the inner `div` has `width: 100%` and the fixture container is narrower than the element's `max-width` preset, there is no remaining horizontal space — so `auto` margins resolve to `0px`. The assertion passes even if the CSS were changed to `margin-left: 0; margin-right: 0` (which would break centering for wide viewports). The test does not prove that centering works — it proves that in narrow fixtures, margins are 0.

**To actually verify centering:** The test should either (a) check `margin-left: auto` via the CSS source (which `getComputedStyle` cannot expose), or (b) use a fixture container wider than the preset max-width and assert that `marginLeft === marginRight` and both are non-zero.

---

### [P2-02] No test verifies actual computed max-width values — Class presence is not correctness

**File:** `hx-container.test.ts`, lines 32–73
**Area:** Tests

All seven width-variant tests only check that the correct CSS class is present on `.container__inner`. None verify the actual computed `max-width` CSS value. A CSS refactor that broke the `max-width` rule entirely would not be caught.

**Evidence:**
```ts
it('width="sm" applies sm class', async () => {
  const inner = shadowQuery(el, '.container__inner')!;
  expect(inner.classList.contains('container__inner--sm')).toBe(true);
  // Missing: getComputedStyle(inner).maxWidth === '640px'
});
```

**Missing tests:**
- `width="sm"` → `max-width: 640px`
- `width="md"` → `max-width: 768px`
- `width="lg"` → `max-width: 1024px`
- `width="xl"` → `max-width: 1280px`
- `width="content"` → `max-width: 72rem` (resolved to px)
- `width="narrow"` → `max-width: 48rem` (resolved to px)

---

### [P2-03] Mixed units in max-width presets — `rem` vs `px` inconsistency

**File:** `hx-container.styles.ts`
**Area:** CSS

The `content` and `narrow` presets use `rem` units while the T-shirt size presets use `px`:

| Preset | Unit |
|--------|------|
| `content` (72rem) | rem |
| `narrow` (48rem) | rem |
| `sm` (640px) | px |
| `md` (768px) | px |
| `lg` (1024px) | px |
| `xl` (1280px) | px |

`rem`-based max-widths scale with the user's base font size — a user with 20px root font size gets a `content` max-width of 1440px instead of 1152px. The `sm`/`md`/`lg`/`xl` presets do not scale. This inconsistency creates unpredictable behavior for accessibility users who set large base font sizes.

---

### [P2-04] No Drupal Twig usage example or documentation

**File:** None exist
**Area:** Drupal

The audit specification calls for verifying Drupal compatibility. The component is a custom element and is technically Twig-renderable, but there is no Twig example, no documented attribute mapping, and no guidance for Drupal theme developers on when to use `hx-container` vs a native `<div>`. For the primary consumer of this library, this is a documentation gap that increases integration risk.

---

### [P3-01] `WcContainer` type alias exported from component file but not from `index.ts`

**File:** `hx-container.ts` (line 82), `index.ts`
**Area:** TypeScript

`hx-container.ts` exports:
```ts
export type WcContainer = HelixContainer;
```

`index.ts` exports only:
```ts
export { HelixContainer } from './hx-container.js';
```

The `WcContainer` type alias is used in tests (`import type { WcContainer } from './hx-container.js'`) but is not re-exported from the package entry point. Consumers who type their references using `WcContainer` must import it directly from the implementation file, bypassing the stable public API surface. The tests themselves do this, which is acceptable for internal use but establishes a pattern that external consumers could accidentally replicate.

---

### [P3-02] No bundle size measurement — < 2KB target unverified

**Area:** Performance

The performance gate requires `< 2KB` per component (min+gz). No bundle size measurement exists for `hx-container`. Given the component's simplicity (single template, no external dependencies beyond Lit and `@helix/tokens`), it is likely under budget — but this has not been measured and cannot be claimed as passing.

---

### [P3-03] Hardcoded hex colors in Storybook meta render — Violates token convention

**File:** `hx-container.stories.ts`, lines 50, 100, 118, 136, 154, 172, 191
**Area:** Storybook

Story renders use inline `style` with hardcoded hex values to demonstrate `--hx-container-bg`:

```ts
style="--hx-container-bg: #f0f4f8;"
style="--hx-container-bg: #e3f2fd;"
// etc.
```

While these are demonstration-only values, they model incorrect usage to Drupal developers reading stories for integration guidance. The `--hx-container-bg` prop should be shown using a `--hx-color-*` semantic token to demonstrate the correct consumption pattern.

---

### [P3-04] No responsive gutter — Single gutter width at all breakpoints

**File:** `hx-container.styles.ts`, lines 48–49
**Area:** CSS

The horizontal gutter defaults to `var(--hx-container-gutter, var(--hx-space-6, 1.5rem))` (24px) at all viewport widths. On mobile, 24px gutters may be appropriate, but on large viewports the gutter is also fixed at 24px regardless. More importantly, there is no built-in mechanism to apply smaller gutters on very narrow viewports (e.g., 320px screens where 24px gutters on both sides consume ~15% of viewport width). A responsive gutter (e.g., reducing to `--hx-space-4` below a breakpoint) would make this a more robust layout primitive.

---

## Summary Matrix

| ID | Severity | Area | Title |
|----|----------|------|-------|
| P1-01 | **P1** | TypeScript/CSS | Missing `alignment` prop |
| P1-02 | **P1** | CSS | Hardcoded px/rem fallbacks violate token convention |
| P1-03 | **P1** | CSS | No responsive padding at any breakpoint |
| P2-01 | **P2** | Tests | Centering test asserts `0px`, not `auto` — proves nothing |
| P2-02 | **P2** | Tests | Width tests check class only, not computed max-width values |
| P2-03 | **P2** | CSS | Mixed `rem`/`px` units across presets — breaks with large base fonts |
| P2-04 | **P2** | Drupal | No Twig usage example or integration documentation |
| P3-01 | **P3** | TypeScript | `WcContainer` not exported from `index.ts` |
| P3-02 | **P3** | Performance | Bundle size not measured — < 2KB target unverified |
| P3-03 | **P3** | Storybook | Hardcoded hex in story renders models wrong token usage |
| P3-04 | **P3** | CSS | No responsive gutter at narrow viewports |

**Total findings:** 11 (3 P1, 4 P2, 4 P3, 0 P0)

---

## What Passes

- TypeScript strict mode: no `any` types, no `@ts-ignore`, no non-null assertions ✓
- `width` and `padding` props are strongly typed with string union types ✓
- `reflect: true` is correctly set on both props ✓
- Shadow DOM encapsulation is used ✓
- CSS parts: `inner` is exposed and tested ✓
- Accessibility: no ARIA roles added (correct for layout primitive), axe-core tests pass ✓
- Default slot accepts content, multiple children tested ✓
- CSS custom properties (`--hx-container-bg`, `--hx-container-gutter`, `--hx-container-max-width`) are tested with computed style assertions ✓
- All 7 width variants have Storybook stories with play functions ✓
- Storybook autodocs enabled with correct argTypes for both props ✓
- `@customElement` decorator, `HTMLElementTagNameMap` declaration, and re-export in `index.ts` are all present and correct ✓
