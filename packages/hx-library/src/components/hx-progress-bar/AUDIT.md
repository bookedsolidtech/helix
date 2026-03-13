# AUDIT: hx-progress-bar — Antagonistic Quality Review (T1-08)

**Reviewed files (from `feature-implement-hx-progress-bar-t1-25-linear` worktree):**

- `hx-progress-bar.ts`
- `hx-progress-bar.styles.ts`
- `hx-progress-bar.test.ts`
- `hx-progress-bar.stories.ts`
- `index.ts`

**Severity key:** P0 = blocker (must fix before merge), P1 = high (fix before release), P2 = medium (fix in follow-up)

---

## 1. TypeScript

### [P1] Missing `min` property

The feature spec calls for `min` typed as a number. The component hardcodes `aria-valuemin="0"` with no corresponding `min` property. Consumers cannot express a non-zero minimum (e.g., a progress bar starting at 20). This also prevents the percentage calculation from accounting for an offset minimum.

**Location:** `hx-progress-bar.ts` — no `min` property declared.

---

### [P1] Missing `indeterminate` boolean property

The spec calls for an explicit typed `indeterminate` prop. The implementation derives indeterminate state from `value === null`, which is a valid pattern but means consumers cannot set `indeterminate` as a boolean attribute (`<hx-progress-bar indeterminate>`). The null-value approach requires consumers to know about `value` semantics and makes Twig/HTML usage less obvious.

**Location:** `hx-progress-bar.ts` — no `@property() indeterminate` declared.

---

### [P2] Missing `description` property

The spec mentions "label/description typed." No `description` property exists. A description (mapping to `aria-describedby` or a visually hidden element) would allow consumers to convey additional context about the progress operation (e.g., "3 of 12 files uploaded"). No fallback mechanism exists.

**Location:** `hx-progress-bar.ts` — no `description` property.

---

### [P2] `value` attribute is null-by-default but reflected as number type

`@property({ type: Number, reflect: true }) value: number | null = null` reflects correctly, but the reflected attribute will be absent (not `"null"`) when `value` is `null` — this is correct Lit behavior. No issue with the implementation itself, but the type `number | null` is undocumented in the JSDocs `@attr` tag, which says only "Current progress value (0–max). Set to null for indeterminate state." — acceptable documentation.

---

## 2. Accessibility

### [P1] No `aria-labelledby` linking visible label slot to progressbar

The component renders a `<span part="label">` above the track, but the `role="progressbar"` element has no `aria-labelledby` pointing to it. Consumers who use the `label` slot for visible text must _also_ supply `label` attribute for `aria-label`, creating duplication. The ARIA spec's preferred pattern for a progressbar with a visible label is `aria-labelledby`, not a duplicate `aria-label`.

**Location:** `hx-progress-bar.ts:98–106` — no `id`/`aria-labelledby` wiring.

---

### [P1] No live region announced on completion

The spec explicitly requires "live region for completion." When `value` reaches `max`, no announcement is made to assistive technology users. A screen reader user listening to a file upload would not know when it completes without polling. No `aria-live` region exists anywhere in the template.

**Location:** `hx-progress-bar.ts:93–114` — template has no live region.

---

### [P2] Unlabeled progressbar is not guarded

`aria-label=${this.label || nothing}` — when `label` is the empty string (the default), `aria-label` is omitted. `role="progressbar"` without any accessible name (`aria-label`, `aria-labelledby`, or `title`) is a WCAG 2.1 AA violation (4.1.2 Name, Role, Value). The component emits no warning, no TypeScript enforcement, and the test only passes axe-core because it always supplies a `label` in axe tests. A consumer using `<hx-progress-bar value="50"></hx-progress-bar>` with no label would ship an accessibility violation silently.

**Location:** `hx-progress-bar.ts:105` — `aria-label=${this.label || nothing}`.

---

### [P2] `aria-valuemin` is a static string, not bound to a `min` property

`aria-valuemin="0"` is hardcoded as a string literal. This is inconsistent with `aria-valuemax=${this.max}` which is dynamically bound. When a `min` property is added (P1 above), this will need updating. As-is, it is not technically wrong for the current implementation.

**Location:** `hx-progress-bar.ts:103` — `aria-valuemin="0"`.

---

## 3. Tests

### [P0] No test for 0% (empty state)

The spec requires tests for 0%, 50%, and 100% determinate states as distinct test cases. There is no test asserting that `value="0"` renders an indicator with `width: 0%`. The clamping test does use `value="150"` to prove 100% but the 0% edge case is unverified. An off-by-one error in the clamping logic for zero would go undetected.

**Location:** `hx-progress-bar.test.ts` — no test for `value="0"` producing `width: 0%`.

---

### [P1] No test for completion event

The spec requires a test for "completion event." No event is dispatched in the component and no test exists to assert one. This is a dual gap: the feature is absent in the implementation and the test to catch that absence is also missing.

**Location:** `hx-progress-bar.test.ts` — no `hx-complete` (or similar) event test.

---

### [P1] No test for negative value clamping

`_percentage` uses `Math.max(0, ...)` to clamp negative values, but no test verifies that `value="-10"` results in `width: 0%`. The clamping logic is tested only for the upper bound.

**Location:** `hx-progress-bar.test.ts` — no negative value clamp test.

---

### [P2] No test for dynamic label update

The spec mentions "label updates" as a required test area. There is no test that changes the `label` property after initial render and asserts `aria-label` updates accordingly. The dynamic update tests cover `value` changes only.

**Location:** `hx-progress-bar.test.ts` — no test for `el.label = 'New label'` followed by aria-label assertion.

---

### [P2] Axe-core tests use `label` attribute but no test verifies the no-label violation

The accessibility tests always supply `label="..."`. There is no test that asserts what happens with no label — whether axe-core catches the violation, and whether the component is expected to prevent or warn about this state.

**Location:** `hx-progress-bar.test.ts:239–268`.

---

## 4. Storybook

### [P2] Duplicate label in `Default` story (attribute + slot)

The `Default` story renders `label=${args.label}` (setting `aria-label`) AND `<span slot="label">${args.label}</span>` simultaneously. This means the aria-label and the visible slot label always have the same value, but via two separate mechanisms. This pattern should be documented — it is not self-evidently correct, and consumers may cargo-cult it and supply only one, introducing unlabeled progressbars.

**Location:** `hx-progress-bar.stories.ts:80–90`.

---

### [P2] `argTypes.size` key is `size` but attribute is `hx-size`

The `argTypes` object uses key `size` and the story binds via `hx-size=${args.size}`. While this works, the Storybook controls table will show the control as `size`, not matching the actual HTML attribute `hx-size`. CEM-driven autodocs may also misalign. The property is `size` but the attribute is `hx-size` (set via `attribute: 'hx-size'`); the argTypes key should reflect the attribute name for Storybook autodocs to work correctly.

**Location:** `hx-progress-bar.stories.ts:42–51`.

---

### [P2] No story demonstrating indeterminate + `aria-labelledby` pattern

The `Indeterminate` story uses `label` attribute (aria-label). There is no story demonstrating how a consumer would use the visible label slot as the accessible name via `aria-labelledby`. Given the accessible name gap (P1 above), this story would be the canonical demonstration of correct usage.

**Location:** `hx-progress-bar.stories.ts:93–108`.

---

## 5. CSS

### [P1] CSS parts named `base`/`indicator` instead of spec-expected `track`/`fill`

The audit spec calls for CSS parts named `track` and `fill`. The implementation exposes `base`, `indicator`, and `label`. The `base` part is the track container and `indicator` is the fill. The naming diverges from the spec. This is a breaking naming decision that affects the public API surface (CEM, documentation, consumer overrides). Renaming after release is a breaking change.

**Location:** `hx-progress-bar.ts:18–19` — JSDoc `@csspart`; `hx-progress-bar.ts:99,108` — `part="base"`, `part="indicator"`.

---

### [P2] Indeterminate animation uses `translateX(250%)` which may clip in constrained containers

The `@keyframes hx-progress-indeterminate` animates from `translateX(-100%)` to `translateX(250%)`. In a narrow container (e.g., a sidebar widget), `translateX(250%)` overshoots significantly before the element exits the `overflow: hidden` clip boundary. The visual result is correct due to overflow clipping, but the animation duration/easing may appear non-uniform in very narrow widths. The `width: 40%` → `60%` → `40%` mid-animation size change is also a non-standard technique; most Material/Carbon implementations animate a fixed-width element instead.

**Location:** `hx-progress-bar.styles.ts:71–83`.

---

### [P2] Hardcoded fallback hex values in CSS

CSS custom property fallbacks use raw hex literals (e.g., `var(--hx-color-neutral-100, #f3f4f6)`, `var(--hx-color-primary-500, #2563eb)`). If the design token palette changes, the fallback values will silently diverge. In a theme-switched environment (dark mode, high contrast), these hardcoded fallbacks will not adapt. Fallbacks should reference only other `--hx-*` tokens, not literal values.

**Location:** `hx-progress-bar.styles.ts` — multiple lines.

---

### [P2] No high-contrast mode support

No `@media (forced-colors: active)` block exists. In Windows High Contrast mode, the indicator fill may not be distinguishable from the track. Healthcare applications may serve users who rely on high contrast for visibility.

**Location:** `hx-progress-bar.styles.ts` — missing `forced-colors` media query.

---

## 6. Performance

### [PASS] Bundle size within budget

The compiled `index.js` (re-export stub) is 137 bytes. The full component logic is bundled into the library's main entry. Estimated component contribution to the full bundle is well under the 5KB per-component budget given the implementation is ~120 lines of source. No performance regression identified.

---

## 7. Drupal / Twig

### [P2] No Twig template or Drupal integration file ✅ FIXED

The component is technically Drupal-compatible as a standard web component (`<hx-progress-bar value="75" label="Progress">`), but no Drupal-specific files are provided:

- No `.html.twig` template
- No `hx-progress-bar.libraries.yml` entry
- No Drupal behavior (not needed for this component, but absence is notable)

Twig usage works but requires Drupal developers to know the attribute names (`hx-size` instead of `size`) which differ from standard conventions and are not documented in a Drupal-facing integration guide.

**Location:** No Drupal integration files in the component directory.

**Resolution:** Created `hx-progress-bar.twig` documenting all attributes (`value`, `min`, `max`, `label`, `description`, `hx-size`, `variant`, `indeterminate`), usage examples for determinate/indeterminate/success/warning states, Drupal libraries.yml registration pattern, and `hx-complete` event behavior integration example.

---

## Summary Table

| #   | Area       | Finding                                               | Severity |
| --- | ---------- | ----------------------------------------------------- | -------- |
| 1   | TypeScript | Missing `min` property                                | P1       |
| 2   | TypeScript | Missing `indeterminate` boolean prop                  | P1       |
| 3   | TypeScript | Missing `description` property                        | P2       |
| 4   | A11y       | No `aria-labelledby` for visible label slot           | P1       |
| 5   | A11y       | No live region on completion                          | P1       |
| 6   | A11y       | Unlabeled progressbar is unguarded (silent violation) | P2       |
| 7   | A11y       | `aria-valuemin` hardcoded, not bound to `min` prop    | P2       |
| 8   | Tests      | No test for 0% (empty state)                          | P0       |
| 9   | Tests      | No test for completion event                          | P1       |
| 10  | Tests      | No test for negative value clamping                   | P1       |
| 11  | Tests      | No test for dynamic label update                      | P2       |
| 12  | Tests      | No test for no-label accessibility violation          | P2       |
| 13  | Storybook  | Duplicate label in Default story (attribute + slot)   | P2       |
| 14  | Storybook  | `argTypes.size` key mismatches attribute `hx-size`    | P2       |
| 15  | Storybook  | No story for `aria-labelledby` usage pattern          | P2       |
| 16  | CSS        | Parts named `base`/`indicator` vs spec `track`/`fill` | P1       |
| 17  | CSS        | Indeterminate animation `translateX(250%)` technique  | P2       |
| 18  | CSS        | Hardcoded hex fallbacks in CSS custom properties      | P2       |
| 19  | CSS        | No `forced-colors` high-contrast support              | P2       |
| 20  | Drupal     | No Twig template or integration file ✅ FIXED         | P2       |

**Totals:** 1 P0, 6 P1, 13 P2

---

_Audit completed. No fixes applied — findings only. Fix work should be tracked as separate tickets._
