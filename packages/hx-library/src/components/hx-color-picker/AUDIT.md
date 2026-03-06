# hx-color-picker — Deep Audit v2

**Auditor:** Deep audit v2 agent
**Date:** 2026-03-06
**Component:** `packages/hx-library/src/components/hx-color-picker/`

---

## Baseline Scores (pre-fix)

| Metric               | Score | Grade |
| -------------------- | ----- | ----- |
| wc-mcp health        | 82    | B     |
| wc-mcp accessibility | 25    | F     |

---

## Issues Fixed in This Audit

### CRITICAL-1: Event listener memory leak (FIXED)

**Location:** `hx-color-picker.ts` connectedCallback/disconnectedCallback
**Problem:** `pointermove` and `pointerup` listeners used inline `.bind(this)` — creating new references on each call. `removeEventListener` received different references than `addEventListener`, making removal a no-op. Every mount/unmount cycle leaked two permanent document-level handlers.
**Fix:** Stored bound references as class fields (`_boundDocumentClick`, `_boundPointerMove`, `_boundPointerUp`). Both add and remove now use the same reference.

### CRITICAL-2: Invalid CSS box-shadow syntax (FIXED)

**Location:** `hx-color-picker.styles.ts:244`
**Problem:** `box-shadow: 0 0 0 2px var(--hx-focus-ring-color, #2563eb) / 0.2;` — the `/ 0.2` alpha syntax is not valid in `box-shadow`. Rule was silently ignored; color input had no visible focus ring.
**Fix:** Replaced with `box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);`

### HIGH-1: Phantom `eventName` event in CEM (FIXED)

**Location:** `hx-color-picker.ts` `_commit()` method
**Problem:** CEM analyzer picked up the local variable `const eventName = ...` as an event declaration, generating a phantom `eventName` event in custom-elements.json.
**Fix:** Inlined the ternary into the `CustomEvent` constructor, eliminating the variable.

### HIGH-2: Gradient grid has no keyboard navigation (FIXED)

**Location:** `hx-color-picker.ts` `_renderGrid()`
**Problem:** Grid had `role="presentation"`, no `tabindex`, no `keydown` handler. Keyboard users could not adjust saturation/value. WCAG 2.1.1 failure.
**Fix:** Added `role="group"`, `aria-label="Color saturation and brightness"`, `tabindex="0"`, and `_handleGridKeydown` supporting ArrowLeft/Right (saturation) and ArrowUp/Down (value), plus Home/End for saturation extremes. Added `:focus-visible` outline style.

### HIGH-3: Documented `slider` CSS part never applied (FIXED)

**Location:** `hx-color-picker.ts` JSDoc
**Problem:** `@csspart slider - Shared slider container.` was documented but no template element had `part="slider"`. Consumers targeting `::part(slider)` would match nothing.
**Fix:** Removed phantom `slider` part from JSDoc. `hue-slider` and `opacity-slider` are the actual parts.

### MEDIUM-1: No label property for external labelling (FIXED)

**Location:** `hx-color-picker.ts`
**Problem:** Trigger and panel used hardcoded `aria-label="Choose color"` / `aria-label="Color picker"`. No way for consumers to customize the accessible name. A11Y analysis flagged "No label slot or label property."
**Fix:** Added `label` property (default: `'Choose color'`, reflected). Trigger and panel both use `aria-label=${this.label}`.

---

## Remaining Issues (not fixed — documented for follow-up)

### HIGH — P1-2: `swatches` array property not usable from HTML attributes

`@property({ type: Array })` uses `JSON.parse` for attribute conversion. Drupal Twig templates cannot pass JSON arrays as attributes. Requires either a custom converter or documentation that Drupal behaviors must set the JS property.

### HIGH — P1-3: Trigger `aria-label` overrides visible text

The trigger button has `aria-label` which overrides child text content (the color value). Screen reader users hear the label but not the current color. Consider using `aria-label` that includes the current value, or removing it to let button text content serve as the accessible name.

### HIGH — P1-4: Sliders missing `aria-valuetext`

Hue slider announces raw number (0-360), opacity announces percentage integer — both lack textual context. Add `aria-valuetext="${Math.round(this._hsv.h)} degrees"` and `aria-valuetext="${Math.round(this._hsv.a * 100)} percent"`.

### HIGH — P1-6: Hardcoded color values (10+ instances)

Multiple CSS rules use hardcoded colors (`rgba(0,0,0,0.1)`, `#fff`, `rgba(0,0,0,0.3)`) instead of `--hx-*` tokens. These should use semantic tokens for dark mode compatibility.

### HIGH — P1-7: `@change` on input instead of `@input`

Text input uses `@change` (fires on blur/Enter only), not `@input` (fires on each keystroke). No real-time preview while typing. Consider adding `@input` handler for live feedback.

### MEDIUM — P2-1: HSV round-trip bug

`parseColor` cannot parse `hsv(...)` strings. Component emits HSV format but cannot consume its own output. If a consumer stores and feeds back an HSV value, it silently resets to black.

### MEDIUM — P2-2 through P2-10: Test coverage gaps

- Value parsing tests don't verify parsed color output
- `hx-input` event has zero test coverage
- Format cycling untested
- Text input -> color update flow untested
- Slider keyboard navigation untested
- HSV format output untested end-to-end
- `hx-change` event assertion too loose (truthy, not exact value)
- Hardcoded panel dimensions not tokenized
- No Drupal/Twig integration documentation

---

## Files Modified

| File                        | Changes                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hx-color-picker.ts`        | Fixed memory leak (bound refs), removed phantom event variable, added grid keyboard nav, added label property, removed phantom slider part from JSDoc |
| `hx-color-picker.styles.ts` | Fixed invalid box-shadow syntax, added grid focus-visible style                                                                                       |
| `hx-color-picker.test.ts`   | Added tests for label property and grid keyboard focusability                                                                                         |

## Verification

- **Build:** `npm run build:library` — exit 0
- **Tests:** 3102 passed, 0 failed (79 test files)
- **Verify:** `npm run verify` — 0 errors
- **Type-check:** clean
