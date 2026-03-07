# AUDIT: hx-stack — Antagonistic Quality Review (T3-10)

**Reviewer:** Antagonistic QA Agent
**Date:** 2026-03-06
**Files reviewed:**
- `hx-stack.ts`
- `hx-stack.styles.ts`
- `hx-stack.test.ts`
- `hx-stack.stories.ts`
- `index.ts`

---

## Summary

`hx-stack` is a well-structured layout utility component. No P0 blockers found. The implementation is functionally correct and TypeScript strict-clean. However, there are meaningful gaps in test coverage (CSS behavior not verified at all), missing Storybook stories for required variants, and a redundant CSS default that creates a subtle maintenance hazard.

---

## Findings

### P1 — Significant Issues (must fix before merge)

---

#### P1-01: Tests verify property reflection but never CSS behavior

**File:** `hx-stack.test.ts`
**Lines:** 31–99

Every test in the direction, gap, align, and justify sections only asserts on `el.direction`, `el.gap`, `el.getAttribute(...)` etc. Zero tests call `getComputedStyle()` or inspect the shadow DOM's actual rendered layout. This means the CSS could be entirely wrong (wrong selector, typo, token mismatch) and every test would still pass.

**Example gap:**
```ts
// Current test — does NOT verify flex-direction is actually "row"
expect(el.getAttribute('direction')).toBe('horizontal');

// What's missing:
const base = shadowQuery(el, '[part="base"]');
expect(getComputedStyle(base).flexDirection).toBe('row');
```

This is particularly critical for `direction`, `wrap`, `inline`, `gap`, `align`, and `justify` — the core behavioral properties. The test suite gives false confidence.

**Severity rationale:** Tests pass on a component where the CSS file is empty.

---

#### P1-02: No test for nested stacks

**File:** `hx-stack.test.ts`
**Context:** `hx-stack.stories.ts` lines 207–246 (PatientFormLayout) demonstrates nesting as a primary use case.

The component explicitly supports nesting — the PatientFormLayout story nests four levels deep. There is no test verifying that nested stacks render correctly, that spacing accumulates as expected, or that nested stacks don't introduce accessibility or layout regressions.

---

#### P1-03: No test for `role` preservation when consumer sets a custom role

**File:** `hx-stack.ts` lines 63–68, `hx-stack.test.ts`

`connectedCallback` conditionally sets `role="presentation"`:
```ts
if (!this.hasAttribute('role')) {
  this.setAttribute('role', 'presentation');
}
```

The guard is correct. But there is no test verifying it. A consumer who sets `<hx-stack role="group">` relies on this guard working. Without a test, a future refactor could silently break this contract.

---

#### P1-04: Missing Storybook stories for required variants

**File:** `hx-stack.stories.ts`

Quality gate 4 requires "stories for all variants." The following are absent:

| Missing Story | Reason it Matters |
|---|---|
| All Gap Sizes | Visual regression reference for the full token scale |
| Wrapping | `wrap` is a public property with no story demonstrating its effect |
| Inline | `inline` is a public property with no story demonstrating its effect |
| All Alignments | `align` has 5 values; only `center` and `stretch` appear in stories |

`PatientFormLayout` is a composition story, not a variant story. Five named stories (Default, Horizontal, Centered, SpaceBetween, PatientFormLayout) do not constitute "all variants" coverage for a component with 4 layout properties and 6 gap values.

---

### P2 — Minor Issues (should fix, not blocking)

---

#### P2-01: Redundant default gap in base style

**File:** `hx-stack.styles.ts` line 15

```css
[part='base'] {
  display: flex;
  flex-direction: column;
  gap: var(--hx-spacing-md, 1rem);  /* <-- redundant */
}
```

The `:host([gap='md'])` rule (line 96–98) sets the identical value. The base rule handles the pre-render window before Lit reflects the default `gap="md"` attribute — but this creates a subtle maintenance hazard: if the default `gap` property changes from `'md'` to something else, the base style's hardcoded fallback creates a flash of incorrect spacing.

**Recommended pattern:** Document why the base default is intentional (SSR/pre-hydration gap), or eliminate it and accept the flash.

---

#### P2-02: No runtime validation for invalid property values

**File:** `hx-stack.ts`

TypeScript union types (`'horizontal' | 'vertical'`, etc.) are compile-time only. If a consumer passes `direction="diagonal"` from HTML or Drupal Twig, the component silently fails — no CSS rules match, no warning is emitted. In a healthcare context where Drupal templates may render arbitrary attribute values, silent failure is a risk.

**Recommended:** Add a development-mode console warning in `updated()` for out-of-range values, similar to how other enterprise component libraries handle this.

---

#### P2-03: `flex-wrap: wrap` has no row/column gap differentiation

**File:** `hx-stack.styles.ts` lines 30–32

When `wrap` is enabled, `gap` applies equally to row-gap and column-gap. There is no mechanism for consumers to set different vertical and horizontal gaps in wrapping scenarios. This is a design limitation, not a bug, but it may constrain healthcare form layouts where row spacing and column spacing differ. Worth documenting as a known limitation in the component's JSDoc.

---

#### P2-04: `PatientFormLayout` story has no `play` function

**File:** `hx-stack.stories.ts` lines 207–246

All other stories include a `play` function for interaction verification. `PatientFormLayout` omits it entirely. This is the most complex story demonstrating the primary use case (nested stacks in a form layout), yet it has zero assertions.

---

#### P2-05: `role="presentation"` implications not documented

**File:** `hx-stack.ts` lines 63–68

The auto-set `role="presentation"` has a non-obvious consequence: it removes the element from the accessibility tree for assistive technologies. This means `aria-label`, `aria-labelledby`, and similar attributes set by consumers on `<hx-stack>` are ignored. A consumer who wraps a form section in `<hx-stack aria-label="Patient demographics">` will be surprised this does nothing.

This behavioral contract should be documented in the JSDoc and ideally in a Storybook docs note.

---

#### P2-06: `inline` CSS uses `inline-block` on host, not `inline-flex`

**File:** `hx-stack.styles.ts` lines 8–10

```css
:host([inline]) {
  display: inline-block;
}
```

The host is `inline-block` but the inner `[part='base']` remains `display: flex`. The net effect is correct (host shrink-wraps to inline-sized flex container), but the `display: inline-block` + nested `display: flex` pattern is unconventional. A simpler and more explicit approach would be to set `display: inline-flex` on the `[part='base']` element when inline, or document why inline-block is the chosen approach.

---

## Area-by-Area Summary

| Area | Status | Findings |
|---|---|---|
| TypeScript | PASS | Strict, no `any`, all properties correctly typed with union types |
| Accessibility | PASS with note | role="presentation" guard works; axe-core tests present; see P2-05 for documentation gap |
| Tests | FAIL | P1-01 (no CSS verification), P1-02 (no nesting test), P1-03 (no role guard test) |
| Storybook | FAIL | P1-04 (missing Wrap, Inline, AllGaps, AllAlignments stories) |
| CSS | PASS with note | Tokens used correctly; P2-01 (redundant base gap), P2-06 (inline-block pattern) |
| Performance | PASS | Minimal component; bundle well under 5KB threshold (no dynamic imports, no external deps beyond Lit) |
| Drupal | PASS | All properties are plain HTML attributes; Twig-renderable; no JS required for rendering |

---

## Verdict

**NOT READY TO MERGE.** Two P1 categories require remediation:
1. Test suite must add CSS behavior assertions (getComputedStyle) and nested stack coverage.
2. Storybook must add missing variant stories: AllGaps, Wrapping, Inline, and AllAlignments.

P2 items are recommended but not blocking.
