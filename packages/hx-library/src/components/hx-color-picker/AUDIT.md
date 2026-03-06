# hx-color-picker — Antagonistic Quality Audit (T3-14)

**Auditor:** Antagonistic review agent
**Date:** 2026-03-06
**Component:** `packages/hx-library/src/components/hx-color-picker/`
**Severity scale:** P0 = blocker / P1 = high / P2 = medium

---

## P0 — Blockers (must fix before merge)

### P0-1: Gradient grid has zero keyboard operability (`hx-color-picker.ts:614-628`)

The gradient grid — the primary 2D saturation/value selection surface — is `role="presentation"` with no `tabindex`, no `keydown` handler, and no `aria-*` attributes.

A keyboard-only user cannot navigate the saturation/value space at all. Only mouse/pointer dragging works. The hue and opacity sliders have full keyboard support (`ArrowLeft`/`ArrowRight`/`PageUp`/`PageDown`/`Home`/`End`), but the most visually important control is completely inaccessible.

**WCAG 2.1 failure:** SC 2.1.1 Keyboard (Level A) — all functionality must be operable via keyboard.

Required remediation:

- Add `role="slider"` or a 2D custom role with `tabindex="0"`.
- Add `aria-label`, `aria-valuemin/max/now` for both axes (saturation and value).
- Add `keydown` handler supporting arrow keys for both S and V axes.
- Announce selected S/V values via `aria-valuetext`.

---

## P1 — High severity

### P1-1: Event listener memory leak — `disconnectedCallback` (`hx-color-picker.ts:351-356`)

In `connectedCallback` (line 347-348), `pointermove` and `pointerup` listeners are registered with inline `.bind(this)` calls:

```ts
document.addEventListener('pointermove', this._handlePointerMove.bind(this));
document.addEventListener('pointerup', this._handlePointerUp.bind(this));
```

In `disconnectedCallback` (lines 353-355), the same `.bind(this)` pattern is used to try to remove them. **This does not work.** Each `.bind(this)` call creates a new function reference. The references passed to `removeEventListener` are different objects than those added — the handlers are never removed.

Only `_handleDocumentClick` is handled correctly (stored reference pattern at line 345-346, 352).

**Impact:** Every time a `hx-color-picker` is mounted and unmounted, two permanent document-level `pointermove` and `pointerup` handlers leak. In SPAs this accumulates unboundedly.

---

### P1-2: `@property({ type: Array })` for `swatches` is not serializable from HTML (`hx-color-picker.ts:304`)

```ts
@property({ type: Array })
swatches: string[] = [];
```

`type: Array` uses the default Lit attribute converter, which simply does `JSON.parse(attributeValue)`. No consumer can reasonably pass a JSON-encoded array as an HTML attribute in practice. In Twig templates (the primary Drupal consumer), this pattern is unusable without Drupal behaviors setting the JS property explicitly.

This is not documented anywhere in the JSDoc or AUDIT. Drupal integration is effectively broken for the swatches feature without behavioral JS.

Additionally, `type: Array` does not have a TypeScript-narrowed type — `swatches` is `string[]` but the attribute converter accepts any JSON, which could produce a runtime type mismatch with no TypeScript error.

**Remediation:** Either add a custom converter, document that swatches require Drupal behaviors, or remove `type: Array` in favor of a JS-only property.

---

### P1-3: `aria-label="Choose color"` does not announce the current value (`hx-color-picker.ts:769`)

The trigger button has `aria-label="Choose color"` which is static. A screen reader user activating this button gets no indication of the current color value. They must rely on the visible `trigger-label` span which is inside the button and readable — however, the `aria-label` overrides all child text for accessible name computation. The color value text is effectively hidden from AT.

**Remediation:** Use `aria-label=${`Choose color: ${this.\_inputValue}`}` or remove `aria-label` and rely on button text content.

---

### P1-4: Hue and opacity sliders missing `aria-valuetext` (`hx-color-picker.ts:630-684`)

The hue slider exposes `aria-valuenow=${Math.round(this._hsv.h)}` (a number 0–360) with no `aria-valuetext`. Screen readers announce "0" through "360" which is meaningless to most users. The opacity slider similarly announces a percentage integer with no textual context.

**Remediation:**

- Hue: `aria-valuetext="${Math.round(this._hsv.h)}°"`
- Opacity: `aria-valuetext="${Math.round(this._hsv.a * 100)}%"`

---

### P1-5: Invalid CSS — `box-shadow` with `/` opacity modifier (`hx-color-picker.styles.ts:244`)

```css
.color-input:focus {
  box-shadow: 0 0 0 2px var(--hx-focus-ring-color, #2563eb) / 0.2;
}
```

The `/ 0.2` opacity shorthand is valid inside `color()` or `oklch()` functions but **not** in `box-shadow`. This rule is silently ignored by all browsers. The focus ring shadow for the color input does not render.

---

### P1-6: Multiple hardcoded color values violate design token rule

The project mandate is "Never hardcode colors." The following rules use hardcoded values instead of `--hx-*` tokens:

| Location                   | Value                         | Lines      |
| -------------------------- | ----------------------------- | ---------- |
| `.trigger-swatch` border   | `rgba(0, 0, 0, 0.1)`          | styles:43  |
| `.gradient-thumb` border   | `#fff`                        | styles:110 |
| `.gradient-thumb` shadow   | `rgba(0, 0, 0, 0.3)`          | styles:111 |
| `.panel` box-shadow        | `rgba(0, 0, 0, 0.15)`         | styles:67  |
| `.panel` border            | `1px solid` (hardcoded width) | styles:64  |
| `.slider-thumb` border     | `#fff`                        | styles:165 |
| `.slider-thumb` shadow     | `rgba(0, 0, 0, 0.3)`          | styles:166 |
| `.swatch-btn` border       | `rgba(0, 0, 0, 0.1)`          | styles:185 |
| `.swatch-btn:hover` border | `rgba(0, 0, 0, 0.3)`          | styles:194 |
| `.input-preview` border    | `rgba(0, 0, 0, 0.1)`          | styles:253 |

---

### P1-7: `@change` on color input instead of `@input` (`hx-color-picker.ts:728`)

```html
<input ... @change="${this._handleInputChange}" @blur="${this._handleInputBlur}" />
```

`change` fires only on blur or Enter. As a user types a color value, there is no real-time update to the picker. Live preview is a standard expectation for color pickers. The `hx-input` event (for live drag feedback) exists but the text input path bypasses it entirely.

---

### P1-8: `slider` CSS part documented but never applied (`hx-color-picker.ts:253`)

The JSDoc documents:

```
@csspart slider - Shared slider container.
```

But no element in the template has `part="slider"`. The `hue-slider` and `opacity-slider` parts exist but the shared `slider` part is phantom. CEM will expose this part but consumers who use it will find nothing to style.

---

### P1-9: Storybook missing required "swatches-only" and "compact mode" stories

The feature spec requires:

- `SwatchesOnly` story (picker panel showing swatches without gradient picker)
- `Compact` story (compact mode)

Neither story exists. The component does not have a "swatches only" mode — there is no prop to hide the gradient/slider UI and show only swatches. The spec requirement implies this should exist as a variant.

The `WithSwatches` story shows swatches alongside the full picker, which is not the same as a swatches-only mode.

---

## P2 — Medium severity

### P2-1: `parseColor` cannot parse HSV format input strings (`hx-color-picker.ts:143-205`)

`format: ColorFormat` supports `'hsv'` output, meaning `hx-change` can emit strings like `"hsv(217, 91%, 72%)"`. However `parseColor` has no branch for `hsv(...)` strings. If a consumer stores the emitted HSV value and feeds it back as `value`, `parseColor` returns `null` and the picker silently resets to black.

This is a round-trip bug: the component cannot consume its own output in HSV format.

---

### P2-2: Value parsing tests do not verify round-trip correctness (`hx-color-picker.test.ts:268-296`)

The "Value parsing" tests (lines 276-296) only verify that the `format` property is the expected value after fixture creation — they do not verify that the parsed color is correct. For example:

```ts
it('parses rgb color', async () => {
  const el = await fixture<HelixColorPicker>(
    '<hx-color-picker value="rgb(255, 0, 0)" format="rgb"></hx-color-picker>',
  );
  expect(el.format).toBe('rgb'); // ← only checks format, not parsed color
});
```

The actual HSV internal state, the output value, and the round-trip are untested.

---

### P2-3: No test for `hx-input` event (`hx-color-picker.test.ts`)

The component dispatches `hx-input` during slider drag. This event is documented in the JSDoc and is part of the public API. It has zero test coverage. The only event tested is `hx-change`.

---

### P2-4: No test for format cycling (`hx-color-picker.test.ts`)

The "Switch color format" button cycles through hex → rgb → hsl → hsv → hex. This is interactive behavior with no test. A regression in `_handleFormatCycle` would go undetected.

---

### P2-5: No test for text input → color update flow (`hx-color-picker.test.ts`)

`_handleInputChange` and `_handleInputBlur` are untested. No test verifies that typing a valid color string into the input updates the picker state and emits `hx-change`.

---

### P2-6: No test for keyboard navigation on sliders (`hx-color-picker.test.ts`)

`_handleHueKeydown` and `_handleOpacityKeydown` are not tested. Arrow, PageUp/PageDown, Home, End keys — all untested.

---

### P2-7: No test for HSV output format (`hx-color-picker.test.ts`)

Tests cover `hex`, `rgb`, `hsl` format properties but `hsv` format output is never tested. Combined with P2-1 (can't parse HSV input), HSV is untested end-to-end.

---

### P2-8: Hardcoded layout dimensions (`hx-color-picker.styles.ts:88, 68`)

```css
.gradient-grid {
  height: 160px;
}
.panel {
  width: 260px;
}
```

Both are hardcoded pixel values with no `--hx-*` token fallback. Consumers cannot resize the picker panel via CSS custom properties.

---

### P2-9: No Drupal integration documentation

The component is entirely client-side with no SSR path. The JSDoc example shows only HTML usage with no mention of:

- Drupal behaviors required to set `swatches` JS property
- Recommended CDN import path
- Progressive enhancement strategy (what renders without JS)

---

### P2-10: `hx-change` event test asserts truthy but not correct value (`hx-color-picker.test.ts:238-250`)

```ts
expect(event.detail.value).toBeTruthy();
// ...
expect(typeof event.detail.value).toBe('string');
expect(event.detail.value.length).toBeGreaterThan(0);
```

These assertions pass for any non-empty string. A test clicking the `#ff0000` swatch with `format="hex"` should assert `event.detail.value === '#ff0000'` (or equivalent after round-trip). The loose assertions would pass even if the color calculation were wrong.

---

## Summary table

| ID    | Area               | Severity | Description                                                    |
| ----- | ------------------ | -------- | -------------------------------------------------------------- |
| P0-1  | Accessibility      | **P0**   | Gradient grid has no keyboard support — WCAG 2.1.1 failure     |
| P1-1  | TypeScript/Runtime | **P1**   | Event listener memory leak in `disconnectedCallback`           |
| P1-2  | TypeScript/Drupal  | **P1**   | `swatches` array property not usable from HTML attributes      |
| P1-3  | Accessibility      | **P1**   | Trigger `aria-label` overrides current color value for AT      |
| P1-4  | Accessibility      | **P1**   | Sliders missing `aria-valuetext`                               |
| P1-5  | CSS                | **P1**   | Invalid `box-shadow` syntax — focus ring on input not rendered |
| P1-6  | CSS                | **P1**   | 10+ hardcoded color values, violates token mandate             |
| P1-7  | Accessibility/UX   | **P1**   | `@change` instead of `@input` — no real-time input feedback    |
| P1-8  | CEM/CSS            | **P1**   | `slider` CSS part documented but never applied                 |
| P1-9  | Storybook          | **P1**   | Missing swatches-only and compact mode stories                 |
| P2-1  | TypeScript         | **P2**   | `parseColor` cannot parse HSV format strings (round-trip bug)  |
| P2-2  | Tests              | **P2**   | Value parsing tests don't verify parsed color output           |
| P2-3  | Tests              | **P2**   | `hx-input` event has zero test coverage                        |
| P2-4  | Tests              | **P2**   | Format cycling has zero test coverage                          |
| P2-5  | Tests              | **P2**   | Text input → color update flow untested                        |
| P2-6  | Tests              | **P2**   | Slider keyboard navigation untested                            |
| P2-7  | Tests              | **P2**   | HSV format output untested end-to-end                          |
| P2-8  | CSS                | **P2**   | Hardcoded `width: 260px` and `height: 160px` not tokenized     |
| P2-9  | Drupal             | **P2**   | No Drupal/Twig integration documentation                       |
| P2-10 | Tests              | **P2**   | `hx-change` event assertion too loose                          |

**Total:** 1 P0, 9 P1, 10 P2 — **component is not merge-ready.**
