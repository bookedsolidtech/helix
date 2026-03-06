# hx-meter — Antagonistic Quality Audit (T3-03)

**Audited files:**

- `hx-meter.ts`
- `hx-meter.styles.ts`
- `hx-meter.test.ts`
- `hx-meter.stories.ts`

---

## 1. TypeScript

### PASS — No `any`, strict types throughout

All numeric properties (`value`, `min`, `max`, `low`, `high`, `optimum`) are typed as `number` or `number | undefined`. `@property({ type: Number })` is correct. `MeterState` union is well-defined. Global `HTMLElementTagNameMap` registration is present.

### P2 — `_resolveState()` unreachable fallback

The final `return 'default'` at `hx-meter.ts:132` is logically unreachable given the preceding `if/else if/else if` branches that cover all possible `optimumInLow/Middle/High` states. TypeScript does not flag it because it can't infer that exhaustively. This is a code-quality smell; the unreachable path should be removed or replaced with a compile-time exhaustiveness assertion.

### P2 — No `size` property

The audit requirements reference "all sizes" in the test criteria, yet no `size` property exists on the component. If sizes are a planned part of the API, the TypeScript interface is incomplete.

---

## 2. Accessibility

### P1 — No `aria-valuetext` for semantic state communication

The audit requirement explicitly states: "value description (good/bad/meh) communicated to screen readers." The current implementation communicates only the numeric value via `aria-valuenow`. The qualitative state (`optimum` / `warning` / `danger`) is never surfaced to assistive technology.

**Required:** Add `aria-valuetext` to the `role="meter"` div that includes the state, e.g. `"75 of 100 — warning"` or `"50 of 100 — optimum"`. Without this, screen reader users receive no semantic context for the color-coded state, which is the core feature of the component.

### P1 — Slot-only label bypasses accessible name

When a consumer uses `<span slot="label">Custom label</span>` without setting the `label` attribute (as demonstrated in the `LabelSlot` Storybook story), `this.label` is `undefined`. The `aria-label` on the role="meter" div falls back to `"${value} of ${max}"` (e.g. `"45 of 200"`), completely ignoring the visible slot content.

This means the accessible name diverges from the visible label — an explicit WCAG 2.5.3 (Label in Name) violation at level A.

**Required:** Either (a) require the `label` attribute when using the slot, and document this, or (b) use `aria-labelledby` pointing to the rendered label part so the accessible name always matches the visible text.

### P2 — `role="meter"` div is not focusable

The `role="meter"` element has no `tabindex`. ARIA `meter` is a range widget; per WCAG 4.1.2, range widgets should be reachable via keyboard for screen reader users in forms mode and for keyboard-only users who use Tab navigation to orient themselves. Without `tabindex="0"`, the element is invisible to Tab-key navigation.

Note: browse-mode screen readers (NVDA, JAWS document mode) can still encounter it via cursor navigation, so this is P2 not P1.

### P2 — `data-state` attribute duplication

`_resolveState()` is called twice per render cycle: once inside `render()` to set `data-state` on the inner `div[part="base"]` (line 155), and once in `updated()` to set `this.dataset['state']` on the host element (line 137). The inner `data-state` is unnecessary (CSS selectors use `:host([data-state])`) and creates attribute noise that could confuse consumers inspecting the DOM.

---

## 3. Tests

### P1 — No test for `aria-valuetext` (because it does not exist)

There are no tests asserting that the qualitative state is communicated to screen readers. Once `aria-valuetext` is implemented (see Accessibility P1), tests must cover all four state transitions: `default`, `optimum`, `warning`, `danger`.

### P1 — Slot-only label accessible name not tested

No test verifies the `aria-label` value when only slot content is provided (no `label` attribute). The current fallback silently produces an incorrect accessible name. This failure mode is untested.

### P2 — Misleading test description at line 260

The test is named:

```
it('has data-state="default" with only optimum set (no low/high)', ...)
```

But the assertion is `expect(el.dataset['state']).toBe('optimum')`. The description says `"default"` but expects `'optimum'`. This is a confusing mismatch. The test passes for the right reason (when only `optimum` is set, the entire range becomes "optimum"), but the description will mislead future maintainers.

### P2 — Boundary values at `low` and `high` thresholds not tested

The threshold logic uses strict inequality: `v < this.low` and `v > this.high`. This means a value exactly equal to `low` or `high` is considered "in the middle zone" (not warning). No test covers `value === low` or `value === high` as explicit boundary cases. Future refactors could accidentally change the boundary behavior.

### P2 — `min === max` zero-division edge case not tested

The guard at `hx-meter.ts:93` handles `range === 0` by returning `0`. This is correct but untested. A test with `<hx-meter value="5" min="5" max="5">` should assert the indicator renders at 0% and does not throw.

### P2 — Duplicate CSS-part assertions

The Rendering suite (lines 18-34) and the CSS Parts suite (lines 300-317) both test `[part~="base"]` and `[part~="indicator"]`. Minor redundancy but increases maintenance burden without adding coverage.

---

## 4. Storybook

### P1 — Default story render function ignores `low`, `high`, `optimum` controls

The default `render` function at `hx-meter.stories.ts:81-88` does not bind `low`, `high`, or `optimum` args to the element:

```ts
render: (args) => html`
  <hx-meter
    value=${args.value}
    min=${args.min}
    max=${args.max}
    label=${args.label ?? ''}
  ></hx-meter>
`,
```

The `argTypes` for `low`, `high`, and `optimum` are defined with controls, but adjusting them in the Default story canvas has no effect. This makes the primary story's controls misleading — three of the seven documented controls are silently non-functional.

### P2 — `LabelSlot` story has incorrect accessible name (related to A11y P1)

The `LabelSlot` story renders:

```ts
<hx-meter value="45" min="0" max="200">
  <span slot="label">Disk usage: 45 GB of 200 GB</span>
</hx-meter>
```

No `label` attribute is set, so `aria-label` falls back to `"45 of 200"` — not the visible text. This story actively demonstrates an accessibility failure without documenting it as a known limitation.

### P2 — No story for `aria-label`-only usage (no visible label)

There is no story demonstrating a meter with only an `aria-label` and no visible label element (e.g., an inline meter embedded in a sentence). This is a valid use case for the healthcare context.

### P2 — No size variant stories

If a `size` property is added (see TypeScript P2), corresponding stories are absent.

---

## 5. CSS

### P1 — Missing `track` CSS part

The audit requirements explicitly list expected CSS parts as `(track, fill, label)`. The `.meter__track` div has no `part` attribute:

```html
<div class="meter__track"></div>
```

Consumers cannot style the track via `::part(track)`. This violates the component's documented customization contract. The audit requirement calls out `track` as a required CSS part.

Additionally, the filled bar is exposed as `part="indicator"` but the audit requirement calls it `fill`. While the naming divergence is not a blocker, it should be documented as a deliberate naming decision.

### P2 — No `size` CSS custom property or variant

No `--hx-meter-size-*` or `size` attribute for sizing variants. Component height is customizable only via `--hx-meter-track-height`, which is a good token-driven approach. However, if size variants (sm/md/lg) are expected as a standardized API, they are absent.

### PASS — No hardcoded color values in semantic positions

All semantic colors reference `--hx-*` tokens with hex fallbacks only as a last resort. The cascade is correct:

```css
:host([data-state='optimum']) {
  --_indicator-color: var(--hx-meter-color-optimum, var(--hx-color-success-500, #22c55e));
}
```

This is the expected pattern. Pass.

### PASS — Logical CSS properties used correctly

`inset-block: 0` and `inset-inline-start: 0` are used on the indicator. RTL-safe. Pass.

---

## 6. Performance

### PASS (estimated) — Bundle size likely within budget

Source is ~190 lines for the component and ~77 lines for styles. No external runtime dependencies beyond Lit and `@helix/tokens`. Estimated minified+gzipped size is well under 5KB. Exact measurement requires running `npm run build` and checking Vite output.

### P2 — Bundle size not verified in CI for this component

No evidence of a per-component bundle size gate specific to `hx-meter`. The general CI gate should catch regressions, but this audit cannot confirm the current build output.

---

## 7. Drupal

### PASS — Component is Twig-renderable

All configuration is via HTML attributes. No JavaScript dependencies are required from the consumer. Shadow DOM is correctly encapsulated. A Drupal Twig template can render:

```twig
<hx-meter
  value="{{ value }}"
  min="{{ min }}"
  max="{{ max }}"
  low="{{ low }}"
  high="{{ high }}"
  optimum="{{ optimum }}"
  label="{{ label }}"
></hx-meter>
```

### P2 — No Twig template or Drupal usage example documented

There is no `hx-meter.twig` file or Drupal-specific documentation in the component directory. Other components in this library include integration examples. Consistency requires a Drupal usage example.

---

## Summary Table

| #   | Area          | Severity | Finding                                                                                          |
| --- | ------------- | -------- | ------------------------------------------------------------------------------------------------ |
| 1   | Accessibility | P1       | No `aria-valuetext` — semantic state (optimum/warning/danger) not communicated to screen readers |
| 2   | Accessibility | P1       | Slot-only label produces wrong accessible name (WCAG 2.5.3 violation)                            |
| 3   | CSS           | P1       | Missing `track` CSS part — required by audit contract                                            |
| 4   | Storybook     | P1       | Default story controls for `low`, `high`, `optimum` are non-functional (not bound in render)     |
| 5   | Tests         | P1       | No test for `aria-valuetext` (feature also missing)                                              |
| 6   | Tests         | P1       | Slot-only label accessible name bug is untested                                                  |
| 7   | TypeScript    | P2       | Final `return 'default'` in `_resolveState()` is unreachable — dead code                         |
| 8   | TypeScript    | P2       | No `size` property if size variants are expected                                                 |
| 9   | Accessibility | P2       | `role="meter"` element not focusable (no `tabindex="0"`)                                         |
| 10  | Accessibility | P2       | `data-state` attribute set redundantly on both host and inner div                                |
| 11  | Tests         | P2       | Test description at line 260 says "default" but asserts "optimum" — misleading                   |
| 12  | Tests         | P2       | Boundary values `value === low` and `value === high` not tested                                  |
| 13  | Tests         | P2       | `min === max` zero-division guard not tested                                                     |
| 14  | Tests         | P2       | Duplicate CSS-part assertions in Rendering and CSS Parts suites                                  |
| 15  | Storybook     | P2       | `LabelSlot` story demonstrates an accessibility failure silently                                 |
| 16  | Storybook     | P2       | No story for aria-label-only (no visible label) usage                                            |
| 17  | CSS           | P2       | No `size` CSS variants or custom property                                                        |
| 18  | Performance   | P2       | Bundle size not verified against 5KB gate for this component specifically                        |
| 19  | Drupal        | P2       | No Twig template or Drupal usage example                                                         |

**P0 findings: 0**
**P1 findings: 6**
**P2 findings: 13**
