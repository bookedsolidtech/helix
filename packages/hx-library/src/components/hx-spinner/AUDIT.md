# AUDIT: hx-spinner (T1-09) — Antagonistic Quality Review

**Reviewed files** (from `feature/implement-hx-spinner-t1-26-loading` worktree):
- `hx-spinner.ts`
- `hx-spinner.styles.ts`
- `hx-spinner.test.ts`
- `hx-spinner.stories.ts`
- `index.ts`

**Bundle:** 4,351 bytes raw / 1,603 bytes gzip (within budget)

---

## P0 — Critical (blocks merge)

### P0-1: Dual announcement — `aria-label` + visually-hidden inner text create double read

**File:** `hx-spinner.ts:55-81`

The `role="status"` container has both an `aria-label` attribute AND visible inner text (`.spinner__sr-text`) inside it. These are two different announcement paths:

- **Accessible name** (`aria-label`): read by AT when the user navigates to the element. Returns `"Loading"`.
- **Live region content** (`.spinner__sr-text`): announced by AT when the spinner is dynamically inserted into the DOM. Returns `"Loading..."` (with hardcoded ellipsis appended).

On dynamic mount, screen readers will announce the inner text `"Loading..."` via the live region. If a user then focuses the element, AT announces `"Loading"` again from `aria-label`. In practice (NVDA+Chrome, JAWS, VoiceOver) this produces redundant announcements. In a healthcare context this is an accessibility defect.

**Root cause:** Both mechanisms serve the same purpose. Only one should be used:
- Keep `role="status"` + `aria-label` for accessible name (navigation context).
- Remove `.spinner__sr-text` entirely, OR remove `aria-label` and rely on inner text for live region.
  The `aria-label` approach is preferred (it doesn't inject text into the live region on mount).

---

### P0-2: No decorative mode — spinner cannot be silenced when adjacent text exists

**File:** `hx-spinner.ts` (entire component)

A spinner used alongside visible loading text (e.g., `<hx-spinner> Saving...`) will announce its label to AT even when the adjacent text makes it redundant. There is no supported mechanism to suppress the spinner's ARIA announcements — no `decorative` boolean property, no documented `aria-hidden` pattern.

Consumers must manually apply `aria-hidden="true"` to `<hx-spinner>` themselves, but Shadow DOM means the `role="status"` inside the shadow root is not suppressed by `aria-hidden` on the host in all browsers. This is an unresolved accessibility gap for the most common inline-loading pattern.

**Expected:** A `decorative` boolean property that, when set, replaces `role="status"` with `role="presentation"` and removes the `aria-label` and sr-text.

---

## P1 — High (significant quality gap)

### P1-1: `--hx-duration-spinner` is an undocumented public CSS custom property

**File:** `hx-spinner.styles.ts:22`

```css
animation: hx-spinner-rotate var(--hx-duration-spinner, 750ms) linear infinite;
```

The component exposes `--hx-duration-spinner` as a consumer-overridable token, but:
1. It is not listed in the `@cssprop` JSDoc block in `hx-spinner.ts`.
2. It will not appear in the generated CEM.
3. There is no corresponding token defined in the design token system.

This is an undocumented public API surface violation.

---

### P1-2: `prefers-reduced-motion` fallback is visually ambiguous

**File:** `hx-spinner.styles.ts:55-65`

```css
@media (prefers-reduced-motion: reduce) {
  .spinner__svg { animation: none; }
  .spinner__arc {
    animation: none;
    stroke-dashoffset: 14;
    opacity: var(--hx-opacity-muted, 0.6);
  }
}
```

Under reduced motion, the spinner renders as a static partial arc at 60% opacity. This does not clearly communicate "loading in progress" — it looks like an incomplete, faded ring. Users who need reduced motion still need to know the system is working.

A static full ring (100% opacity track, colored arc segment at 100% opacity) or a slow fade pulse (which is acceptable under WCAG APCA reduced motion) would communicate the loading state far more clearly.

---

### P1-3: `color-mix(in srgb, ...)` used without fallback in inverted variant

**File:** `hx-spinner.styles.ts:97-98`

```css
--_spinner-track-color: var(
  --hx-spinner-track-color,
  color-mix(in srgb, var(--hx-color-neutral-0, #ffffff) 30%, transparent)
);
```

`color-mix()` has no support in: Chrome < 111, Firefox < 113, Safari < 16.2. Enterprise healthcare environments often include older or locked-down browser deployments. Without a `@supports` guard or a raw hex fallback, the inverted variant's track color will be empty/invalid in unsupported browsers — the track will be invisible, making the spinner look broken.

---

### P1-4: Tests do not cover `prefers-reduced-motion` behavior

**File:** `hx-spinner.test.ts`

The CSS `@media (prefers-reduced-motion: reduce)` block is the critical accessibility adaptation for this component. No test verifies:
- That `animation` is set to `none` on `.spinner__svg` under reduced motion.
- That `.spinner__arc` loses its animation and retains a static `stroke-dashoffset`.
- That the spinner is visually recognizable in the reduced-motion state.

Playwright/Vitest browser mode can emulate `prefers-reduced-motion: reduce` via `page.emulateMedia({ reducedMotion: 'reduce' })`. This test gap means the reduced motion path is untested on every CI run.

---

### P1-5: Tests do not verify sr-text content or the label-to-aria-label binding on update

**File:** `hx-spinner.test.ts:30-34`

The test only asserts the `.spinner__sr-text` element exists — it does not verify:
- The text content is `${label}...` (with hardcoded ellipsis).
- That `aria-label` on the base element updates reactively when `label` property changes at runtime.
- That setting `label=""` (empty string) does not produce `aria-label=""` (which is a WCAG failure — an empty accessible name is worse than no aria-label).

---

## P2 — Medium (tech debt / DX gap)

### P2-1: `size` TypeScript union collapses to `string` — no runtime narrowing

**File:** `hx-spinner.ts:31`

```typescript
size: 'sm' | 'md' | 'lg' | string = 'md';
```

`'sm' | 'md' | 'lg' | string` resolves to `string` at the TypeScript level — the string literal members add no type safety. TypeScript will not flag `size="xxl"` as an error. Consider:
- `type SpinnerSize = 'sm' | 'md' | 'lg'` for the token sizes, combined with a separate `customSize?: string` property.
- Or keep the union but document that it intentionally degrades to `string` for custom CSS values (add a comment explaining the design choice).

---

### P2-2: `aria-label` label property not reflected as attribute — breaks Twig/Drupal patterns

**File:** `hx-spinner.ts:44`

```typescript
@property({ type: String })
label = 'Loading';
```

`label` is not reflected (`reflect: true` is absent). Drupal Twig templates set attributes, not properties. If a Drupal template uses `<hx-spinner label="Fetching records"></hx-spinner>`, the attribute IS passed as an HTML attribute and Lit will read it on first render. However, if JavaScript sets `el.label = 'Updated'`, it will not sync back to the attribute. While this works for static Twig usage, it creates an inconsistency between the reflected `size`/`variant` (which are reflected) and `label` (which is not). Document this intentional asymmetry or reflect it.

---

### P2-3: Hardcoded `...` appended to sr-text produces inconsistent punctuation

**File:** `hx-spinner.ts:79`

```html
<span class="spinner__sr-text">${this.label}...</span>
```

The component appends `...` to every label unconditionally. If a consumer provides `label="Loading patient record..."`, the rendered text is `"Loading patient record......"`. If they provide `label="Saving"`, it becomes `"Saving..."`. This is inconsistent and non-overridable.

The ellipsis should either be removed (let the consumer control punctuation) or made opt-in.

---

### P2-4: Storybook `size` argType control is `select`-only — custom sizes untestable from controls

**File:** `hx-spinner.stories.ts:15-22`

```typescript
size: {
  control: { type: 'select' },
  options: ['sm', 'md', 'lg'],
```

The `select` control only exposes token values. A user exploring Storybook has no way to test custom CSS sizes (e.g., `"3rem"`, `"48px"`) from the controls panel. A `text` control with a note about accepted values would better document the prop's capabilities. The `CustomSize` story exists but is static — it cannot demonstrate the input freedom.

---

### P2-5: Magic numbers in CSS with no inline documentation

**File:** `hx-spinner.styles.ts:31-34`

```css
stroke-dasharray: 56;
stroke-dashoffset: 14;
```

The SVG arc uses `r=10` on a 24x24 viewBox (circumference = 2π × 10 ≈ 62.83). The values `56` (dash array) and `14` (offset) are intentional aesthetic choices that create a ~75% arc, but this math is not documented anywhere. Future maintainers modifying the SVG dimensions will not understand why these numbers exist or how to recalculate them. A comment explaining the relationship between `r`, circumference, and dash values is required.

---

### P2-6: No Drupal Twig template or integration notes

**File:** directory (`hx-spinner/`)

The CLAUDE.md states Drupal compatibility is a non-negotiable. The `hx-spinner` directory has no:
- `hx-spinner.twig` template demonstrating Drupal usage.
- Documentation on how to register the component in a Drupal theme.
- Notes on the `label` attribute behavior in a Twig context.

Every other T1 component audited so far (hx-tag, hx-switch, hx-textarea) also lacks Twig templates, but given the healthcare Drupal mandate, this is a systemic gap that starts here.

---

## Summary Matrix

| ID    | Area          | Severity | Description                                              |
|-------|---------------|----------|----------------------------------------------------------|
| P0-1  | Accessibility | P0       | Dual announcement: `aria-label` + live region sr-text    |
| P0-2  | Accessibility | P0       | No decorative mode to suppress announcements             |
| P1-1  | CEM/API       | P1       | `--hx-duration-spinner` undocumented custom property     |
| P1-2  | Accessibility | P1       | Reduced-motion fallback is visually ambiguous            |
| P1-3  | CSS           | P1       | `color-mix()` without fallback — broken in older browsers|
| P1-4  | Tests         | P1       | No reduced-motion behavior test                          |
| P1-5  | Tests         | P1       | sr-text content and reactive label update untested       |
| P2-1  | TypeScript    | P2       | `size` union collapses to `string`                       |
| P2-2  | Drupal/DX     | P2       | `label` not reflected — asymmetric vs `size`/`variant`  |
| P2-3  | DX            | P2       | Hardcoded `...` appended to all sr-text labels           |
| P2-4  | Storybook     | P2       | `size` argType `select`-only, custom sizes not explorable|
| P2-5  | CSS           | P2       | Magic numbers in SVG dash math — no inline documentation |
| P2-6  | Drupal        | P2       | No Twig template or Drupal integration notes             |

**P0 count: 2 — merge blocked until resolved.**
