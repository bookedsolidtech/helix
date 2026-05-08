# AAA Audit — HelixTextarea

**Component:** `hx-textarea`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Label `--hx-color-text-strong` on `--hx-color-surface-default` ≥ 7:1 across 6 brands × 3 themes via matrix harness contrast probe (`.reports/aaa-matrix-evidence.hx-textarea.md`). Helper text uses `--hx-color-text-muted` ≥ 4.5:1 verified in matrix harness 1.4.6 sampler. |
| 1.4.6 | Contrast (Enhanced) | AAA | axe-core color-contrast-enhanced | pass | Matrix harness sampled all text-bearing nodes (label, textarea, helper, error, counter) across 18 contexts. All ≥ 7:1 (or ≥ 4.5:1 for ≥18pt). Border `--_textarea-border-color` resolves to `--hx-color-border-strong` which clears AAA-large for non-text contrast surrogate. |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | Wrapper border (`hx-textarea.styles.ts:92`) uses `--hx-color-border-strong` token (≥3:1 vs surface). Focus ring uses `--hx-focus-ring-color` (`--hx-color-primary-600` family) at 2px width with 25% opacity ring layered on solid border — geometric minimum ≥3:1 verified by matrix 1.4.11 probe. |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | No tooltip/popover content triggered on hover or focus from the textarea host. Helper text and error messages are persistent (rendered inline in DOM, not on hover) — `hx-textarea.ts:527-536`. |
| 2.1.1 | Keyboard | A | play() interaction test | pass | Native `<textarea>` element receives keyboard input directly (`hx-textarea.ts:494-515`). All form interaction (typing, selection, navigation) is native browser-handled. Tested in `hx-textarea.test.ts` — value mutation on input event, blur dispatches hx-change. |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review | pass | Every interaction supported via keyboard: typing (any printable key), Tab in/out, Shift+Tab reverse, arrow-key text navigation, Home/End line traversal, Ctrl+A select-all, Ctrl+Z undo. No mouse-only paths. Auto-grow (`resize='auto'`) re-flows on every input event regardless of input modality (`hx-textarea.ts:361-364`). |
| 2.4.7 | Focus Visible | AA | VRT snapshot | pass | `:focus-within` on `.field__textarea-wrapper` (`hx-textarea.styles.ts:101-109`) applies `box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)` ring AND swaps border-color to `--_textarea-border-color-focus`. Matrix harness 2.4.13 probe confirmed across 18 contexts. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | manual review | pass | Focused textarea-wrapper rect verified in viewport by matrix harness 2.4.12 probe across 18 contexts. No sticky overlay or fixed-position chrome obscures the field; `overflow: hidden` on wrapper does not clip the focus ring (ring is outside the wrapper via box-shadow). |
| 2.4.13 | Focus Appearance | AAA | VRT snapshot | pass | Focus indicator: 2px box-shadow ring on `[part="textarea-wrapper"]` plus border-color swap to `--_textarea-border-color-focus` (`hx-textarea.styles.ts:101-109`). Total perimeter coverage > 2 CSS px. Forced-colors mode swaps to 3px solid `Highlight` outline on the textarea (`hx-textarea.styles.ts:241-244`). Matrix-verified GREEN across 18 contexts post-harness fix to recognize `[part="textarea-wrapper"]`. |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | Native textarea height ≥ `--hx-textarea-min-height` = `--hx-size-20` = 5rem = 80px (`hx-textarea.styles.ts:138`). Width = 100% of container. Hit area exceeds 44×44px AAA threshold. Resize handle is browser-native and conforms to native UA target sizing. Matrix harness 2.5.5 probe: pass across 18 contexts. |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Native `<textarea>` provides intrinsic role=textbox, value (.value), name (form-association via ElementInternals). Accessible name from `<label for>` association (`hx-textarea.ts:482`), `aria-labelledby` for slotted label (`:509`), or `aria-label` via `accessible-label` attribute (`:507`). `aria-invalid` reflects error state (`:511`). `aria-describedby` links to error and help-text ids (`:512`). |

## Keyboard contract

`activate=character-input; disabled-suppresses=true`

- Typing: any printable character / punctuation / Enter for newline → mutates value, fires `hx-input`
- Tab: leaves field forward; Shift+Tab leaves backward
- Arrow keys: native cursor navigation within field
- Home/End: line navigation (native)
- Ctrl/Cmd+A, +Z, +Y, +C, +V, +X: native editing keystrokes
- Escape: not consumed (parent dialog/dropdown owns dismiss)
- Disabled: `[disabled]` attribute removes from tab order and suppresses input

## ARIA pattern

`textbox` — https://www.w3.org/TR/wai-aria-1.2/#textbox

The host renders a native `<textarea>` (multiline=true intrinsic to element). No host-level role override; ARIA wiring is forwarded to the inner textarea: `aria-invalid`, `aria-describedby`, `aria-label`, `aria-labelledby`. Label association uses standard `<label for>` when `label` property is set; slotted label gets a generated id and `aria-labelledby`.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-textarea/*.png`
System-color-keyword assertions: `Field`, `FieldText`, `ButtonText`, `Highlight`, `GrayText`, `LinkText`, `CanvasText` per `hx-textarea.styles.ts:220-274`.

- Wrapper background → `Field`, text → `FieldText`, border → 2px solid `ButtonText`
- Focus ring → border-color `Highlight`, plus 3px solid `Highlight` inner outline on textarea
- Disabled → border + text → `GrayText`, opacity reset to 1 (system handles state)
- Error border → `LinkText`
- Placeholder → `GrayText`

Matrix harness `forced-colors` probe: pass across all 6 brands × 3 themes (forced-colors mode is theme-orthogonal but we run it under each theme combo to confirm no token override leaks).

## Notes / carve-outs

- 1.4.9 (Images of Text — No Exception): N/A. Component renders no images of text; label and helper text are real text nodes.
- 3.2.5 (Change on Request): N/A at component layer. Component never auto-submits or auto-navigates; it dispatches `hx-input`/`hx-change` events for the consumer to handle. Consumer-fulfilled criterion.
- 3.3.6 (Error Prevention — All): N/A at component layer. The textarea surfaces `error` prop and `aria-invalid` for consumer-supplied validation errors; reversibility/confirmation/checking are application-layer concerns.
- The internal `<textarea>` has `outline: none` on `:focus-visible` (`hx-textarea.styles.ts:147-149`) — this is intentional because the wrapper carries the focus ring. The matrix harness was extended in this commit to recognize `[part="textarea-wrapper"]` as a valid ring source.
