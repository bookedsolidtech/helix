# AUDIT: hx-badge — Antagonistic Quality Review (T1-19)

Reviewer: Antagonistic Agent
Date: 2026-03-05
Files reviewed: `hx-badge.ts`, `hx-badge.styles.ts`, `hx-badge.test.ts`, `hx-badge.stories.ts`, `index.ts`

---

## Summary

hx-badge is a structurally sound Lit component with good baseline test coverage and proper design token usage. However, it ships with a **phantom `danger` variant** that creates a silent CSS failure, is **missing `count`/`max` props** required by the feature specification, and has a **critical accessibility gap** for its dot indicator mode (pure color-only, no accessible name).

---

## Findings

### P0 — Blockers (must fix before merge)

---

#### P0-1: Phantom `danger` variant — stories test behavior that doesn't exist

**Location:** `hx-badge.stories.ts:17, 205–215, 378, 416–417`

The TypeScript type on `hx-badge.ts:46` is:
```ts
variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'
```

`'danger'` is not in this union. Yet multiple stories use `variant="danger"`:
- `argTypes.variant.options` includes `'danger'` (line 17)
- The `Danger` story sets `variant: 'danger'` and tests for `badge--danger` class (line 204–215)
- `AllVariants` renders `<hx-badge variant="danger">` (line 378)
- `AllCombinations` loops through 8 variants including `'danger'` and expects 24 badges (line 416)
- The `argTypes` type summary documents `'danger'` as a valid value (line 24)

**Impact:**
1. The `Danger` story's play test (`expect(span?.classList.contains('badge--danger')).toBe(true)`) will fail — there is no `badge--danger` CSS class, so the span will fall back to `.badge` default styles (primary colors). The class will never be set.
2. TypeScript strict mode should flag `variant="danger"` as a type error in stories. If CI does not catch this, it represents a gap in type checking for story files.
3. The `AllCombinations` story claims 8 variants but only 7 have defined styles. The `danger` badge renders visually broken (same as primary, no `danger`-specific color).

**Severity**: P0 — silent style failure ships to consumers; story play tests will fail.

---

#### P0-2: `count` and `max` props are completely absent

**Location:** `hx-badge.ts` (entire file)

The feature specification explicitly calls for `count/max props` with truncation behavior (e.g., `99+`). The component has **zero implementation** of these:
- No `count` property
- No `max` property
- No truncation logic (no `count > max ? \`${max}+\` : count`)
- No tests for count display, max value truncation, or the `99+` display pattern

This is a core feature of a badge component: 5 of 6 reference libraries ship count/max. Its absence means consumers must slot their own truncation logic, removing a key design system guarantee.

**Severity**: P0 — required feature explicitly specified, completely unimplemented.

---

#### P0-3: Dot indicator has no accessible name — WCAG 4.1.2 violation

**Location:** `hx-badge.ts:112`, `hx-badge.ts:123`

When `pulse=true` and the slot is empty, the component renders as a dot indicator:
```ts
const isDot = !this._hasSlotContent && this.pulse;
```

The rendered output is a bare `<span>` with no text, no `aria-label`, no `role`, no `aria-describedby`. For a healthcare context (a pulsing red dot on "Lab Results" meaning "new critical results"), this conveys status **exclusively through color and animation** with zero programmatic exposure to assistive technology.

The `DotIndicator` story positions these dots over labels ("Messages", "Lab Results") but the dot itself has no relationship to that label in the DOM. A screen reader user cannot know the dot represents a notification.

**Violations:**
- WCAG 2.1 AA 1.4.1 Use of Color: information conveyed by color alone (red=error, yellow=warning) with no text alternative
- WCAG 2.1 AA 4.1.2 Name, Role, Value: the indicator has no accessible name

The component provides no mechanism (no `aria-label` property, no screen-reader-only text slot) for consumers to give the dot indicator a name.

**Severity**: P0 — WCAG AA violation in a healthcare mandate context. Zero accessibility for a key use case.

---

### P1 — High Priority

---

#### P1-1: Documented CSS custom properties don't work

**Location:** `hx-badge.ts:32–36` (JSDoc), `hx-badge.styles.ts:52–86`

The JSDoc documents these consumer-facing custom properties:
```
@cssprop [--hx-badge-secondary-bg=...]   - Background for the secondary variant.
@cssprop [--hx-badge-secondary-color=...] - Text color for the secondary variant.
@cssprop [--hx-badge-info-bg=...]         - Background for the info variant.
@cssprop [--hx-badge-info-color=...]      - Text color for the info variant.
```

These properties are **never read** anywhere in the CSS. The actual CSS uses `--hx-badge-bg` and `--hx-badge-color`, which are set internally by the variant classes. A consumer setting `--hx-badge-secondary-bg: red` on a secondary badge will have zero effect. The CEM will expose these as valid API, and consumers who follow the docs will get silent failures.

In contrast, `--hx-badge-bg` and `--hx-badge-color` ARE read (lines 14–15) and ARE the correct override points. The JSDoc is lying about the API surface.

**Severity**: P1 — false public API documentation exposes the component to consumer frustration and implementation debt.

---

#### P1-2: `aria-label="Remove"` on dismiss button is non-contextual

**Location:** `hx-badge.ts:132`

```html
<button part="remove-button" aria-label="Remove" ...>
```

When multiple removable badges are present (e.g., a tag list), all dismiss buttons announce as "Remove" with no indication of *which* badge will be removed. WCAG 2.4.6 (Headings and Labels) and 2.4.9 (Link Purpose Link Only) require interactive controls to have descriptive names. Screenreader users in a list of tags will hear "Remove, Remove, Remove" with no context.

The label should incorporate badge content: `aria-label="Remove ${badgeText}"` or a consumer-configurable `removeLabel` property.

**Severity**: P1 — accessibility pattern defect in a healthcare context.

---

#### P1-3: No `aria-live` region for dynamic count updates

**Location:** `hx-badge.ts` (entire component)

When a badge count changes dynamically (e.g., "3 new alerts" → "4 new alerts"), screen reader users receive no announcement. The component has no `role="status"`, `role="log"`, or `aria-live` attribute. In healthcare, a badge count change can represent a critical patient alert. Silent count updates break the real-time notification contract for AT users.

**Severity**: P1 — high-impact omission for healthcare use cases.

---

#### P1-4: `hx-size` non-standard attribute naming

**Location:** `hx-badge.ts:53`

```ts
@property({ type: String, reflect: true, attribute: 'hx-size' })
size: 'sm' | 'md' | 'lg' = 'md';
```

The `hx-` prefix convention is for events and (by convention) CSS custom properties — not for HTML attributes. No other component in this library uses a `hx-*` attribute for a standard property like size. This will confuse:
- Drupal template authors writing `{{ attributes.setAttribute('hx-size', 'lg') }}` instead of `size`
- CEM consumers expecting attribute `size`
- Storybook autodocs which will show `hx-size` as the attribute name instead of `size`

All references in stories, tests, and docs correctly use `hx-size`, but the attribute name itself is an API surface inconsistency.

**Severity**: P1 — DX defect and Drupal integration friction.

---

### P2 — Medium Priority

---

#### P2-1: Secondary and neutral variant contrast ratios need verification

**Location:** `hx-badge.styles.ts:52–55, 76–80`

`badge--secondary`: `neutral-100` (#f3f4f6) background, `neutral-700` (#374151) text.
`badge--neutral`: `neutral-200` (#e5e7eb) background, `neutral-700` (#374151) text.

These light-on-light combinations may fail WCAG 1.4.3 (Contrast Minimum, 4.5:1 for small text) depending on the actual token values in context. Specific concern: the fallback hex values show very low contrast for small text at `font-size-2xs` (0.625rem — the `sm` size). Neither variant was verified with automated contrast tools in the test suite; axe-core may not catch this if the contrast is borderline.

**Severity**: P2 — potential WCAG 1.4.3 failure, needs manual verification with deployed token values.

---

#### P2-2: No test for `prefers-reduced-motion` behavior

**Location:** `hx-badge.test.ts` (missing test), `hx-badge.styles.ts:120–124`

The CSS correctly respects `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .badge--pulse { animation: none; }
}
```

However, no test verifies this. Given that pulse animations are used for critical clinical alerts (STAT orders, lab results), verifying that users who have opted out of motion do not receive animations is an important behavioral guarantee that should be enforced in the test suite.

**Severity**: P2 — reduced motion behavior is implemented but unverified; silent regressions are possible.

---

#### P2-3: Missing Storybook story for removable + count pattern

**Location:** `hx-badge.stories.ts`

There is no story demonstrating `removable` with numeric content (the primary real-world use case for removable badges — tag filtering). The composition examples only show badges on buttons. A story showing a list of removable filter tags is a standard design system showcase that would both document the pattern and exercise the `hx-remove` event in a realistic context.

**Severity**: P2 — incomplete Storybook coverage; documentation gap.

---

#### P2-4: `allCombinations` variant `as const` assertion includes invalid `'danger'` value

**Location:** `hx-badge.stories.ts:408–417`

```ts
const variants = [
  'primary', 'secondary', 'success', 'warning',
  'danger', 'error', 'neutral', 'info',
] as const;
```

The `as const` assertion creates a literal tuple type. When `variant` is typed as `'primary' | ... | 'info'`, TypeScript strict mode should flag `variant=${variant}` (where variant can be `'danger'`) as a type error. If this passes type-check, it means either the template literal bypasses type checking or story files are excluded from `tsconfig`. If they are excluded, that is a secondary finding — but the `as const` assertion on an invalid variant value is a P2 code smell regardless.

**Severity**: P2 — type hygiene issue; may mask a type-check configuration gap.

---

#### P2-5: Dot indicator dot-mode logic is fragile — empty whitespace edge case

**Location:** `hx-badge.ts:87–95`

```ts
this._hasSlotContent = nodes.some((node) => {
  if (node.nodeType === Node.ELEMENT_NODE) return true;
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').trim().length > 0;
  }
  return false;
});
```

The slot content detection correctly trims whitespace. However, zero tests verify the edge case where HTML-formatted content with only whitespace is slotted (e.g., `<hx-badge pulse>  </hx-badge>`). This is covered by the production logic but not by the test suite, leaving a regression surface unguarded.

**Severity**: P2 — minor test coverage gap for an edge case.

---

#### P2-6: No Drupal/Twig usage documentation

**Location:** Missing

The feature specification states: "Drupal — Twig-renderable, status conveyed in text not just color." There is no documentation, example Twig template, or Drupal behavior for `hx-badge`. Consumers building healthcare dashboards in Drupal have no reference implementation. This is particularly important for the dot indicator pattern which is not Twig-friendly (it relies on empty slot + pulse, not a simple attribute).

**Severity**: P2 — documentation gap for primary consumer (Drupal CMS).

---

## Coverage Matrix

| Area | Status | Notes |
|------|--------|-------|
| TypeScript types — variant union | FAIL | `danger` in stories, not in type |
| TypeScript types — size | PASS | |
| TypeScript types — count/max | FAIL | Props do not exist |
| Accessibility — dot indicator | FAIL | No accessible name, color only |
| Accessibility — remove button label | PARTIAL | aria-label present but generic |
| Accessibility — prefers-reduced-motion CSS | PASS | CSS correct |
| Accessibility — prefers-reduced-motion test | FAIL | Not tested |
| Accessibility — live region for count | FAIL | Missing |
| Accessibility — axe-core pass | PASS | Tests present and passing |
| Tests — all variants | PASS | All 7 real variants |
| Tests — count/max truncation | FAIL | Props absent |
| Tests — dot mode | PASS | 3 tests |
| Tests — pulse | PASS | |
| Tests — removable/hx-remove event | PASS | |
| Tests — keyboard on remove button | PASS | |
| Storybook — all variants | PARTIAL | Includes phantom `danger` variant |
| Storybook — count demos | FAIL | No count/max props exist |
| Storybook — dot mode | PASS | |
| Storybook — pulse mode | PASS | |
| Storybook — removable + count | FAIL | Missing story |
| CSS — design tokens only | PASS | No hardcoded colors |
| CSS — `danger` variant styles | FAIL | Phantom variant in stories, no CSS |
| CSS — `@csspart` API accuracy | FAIL | Documented props don't work |
| Performance — bundle size | PASS | Well within 5KB |
| Drupal — Twig-renderable | PARTIAL | Works but no documentation |
| Drupal — status in text not color | FAIL | Dot indicator is color-only |

---

## Severity Count

| Severity | Count |
|----------|-------|
| P0 | 3 |
| P1 | 4 |
| P2 | 6 |

**Recommendation**: Block merge. P0-1 (phantom danger variant) and P0-2 (missing count/max) are additive gaps that require implementation changes. P0-3 (dot indicator accessibility) requires architectural addition of an accessible name mechanism. None of the P0s can be resolved by documentation alone.
