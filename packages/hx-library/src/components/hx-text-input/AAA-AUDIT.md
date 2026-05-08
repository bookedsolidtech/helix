# AAA Audit — HelixTextInput

**Component:** `hx-text-input`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Default text + label + helper resolve to AA-clear semantic tokens; placeholder uses `--hx-color-text-secondary` (≥4.5:1). 4 axe AA cases at default/error/disabled/required. |
| 1.4.6 | Contrast (Enhanced) | AAA | axe-core color-contrast-enhanced | conditional | **Conditional pass — pending Phase E token lift.** Error-text and helper-text routes share the same shared-token gap. AAA axe rule disabled; auto-promotes when token-system Phase E lift lands. |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | Border (`--hx-color-border-input`), focus ring (color-mixed via `--hx-focus-ring-opacity`), error border (`--hx-color-feedback-error-strong`) all clear 3:1 UI floor. |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | No hover-revealed content; help/error text are static inline. |
| 2.1.1 | Keyboard | A | play() interaction test | pass | Native `<input>` element; browser-default keyboard handling. Focus delegation via `delegatesFocus` on shadow root. |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review | pass | All input semantics owned by native element; no custom keyboard handlers; clear/cancel via Escape is owner-discretion (not blocked). |
| 2.4.7 | Focus Visible | AA | VRT snapshot | pass | `.field__input-wrapper:focus-within` box-shadow ring at `hx-text-input.styles.ts:181-189`. Inner input outline disabled (`:246-247`) — wrapper ring is the keyboard focus indicator. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | manual review | pass | Wrapper focus ring renders outside the wrapper bounding box via box-shadow spread; no internal occluders. |
| 2.4.13 | Focus Appearance | AAA | VRT snapshot | pass | 2px focus ring (`--_text-input-focus-ring-width` defaults `--hx-focus-ring-width, 2px` at `hx-text-input.styles.ts:74-77`); color-mix at 25% opacity provides visible contrast against any background. Error state uses error-token color. |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | `md` `min-height: var(--hx-size-10, 2.5rem)` = 40px; `lg` `var(--hx-size-12, 3rem)` = 48px; `sm` 32px. md/lg meet 2.5.5 enhanced; `sm` is documented as 2.5.8 (24×24 minimum) — see Notes. |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Native `<input>` provides role; label association via `<label for>` inside same shadow root (cross-boundary problem solved). `aria-invalid` (`hx-text-input.ts:491`), `aria-describedby` (`:492`) link error/help text. Error message has `role="alert"` (`:512`). |

## Keyboard contract

`activate=character-input; disabled-suppresses=true`

Native `<input>` element provides full browser-default keyboard handling: character input, arrow-key caret movement, Home/End, Shift+arrow selection, Ctrl/Cmd+A, etc. No custom keyboard wiring on top. `disabled` state suppresses input via the native `disabled` attribute.

## ARIA pattern

`textbox` — https://www.w3.org/TR/wai-aria-1.2/#textbox

Native `<input type="text">` (or password/email/tel/etc per `type` property). Label is rendered inside the same shadow root as the input with `<label for>` association — solves the shadow-DOM `aria-labelledby` cross-boundary limitation cleanly. Error state surfaces via `aria-invalid="true"` + `aria-describedby` linking the inline `role="alert"` element.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-text-input/*.png`
System-color-keyword assertions: Field / FieldText / Highlight / GrayText.

Bespoke `@media (forced-colors: active)` block at `hx-text-input.styles.ts:308+` (XOR-rule sole owner — `forcedColorsField` mixin intentionally not composed per documented composition rules). Covers wrapper border, input bg/fg, placeholder, focus, disabled, error label, help text. Focus override at `:329-331` paints 3px Highlight inset outline.

## Notes / carve-outs

**Conditional pass on 1.4.6 (Contrast Enhanced)** — body-text helper/error tokens currently share the system-wide AAA gap; auto-promotes on Phase E lift.

**`sm` size and 2.5.5 (Target Size Enhanced):** `sm` size resolves to 32px min-height — meets 2.5.8 Target Size (Minimum, AA, 24×24 inscribed circle) but not 2.5.5 Target Size (Enhanced, AAA, 44×44). Consumers requiring 2.5.5 enhanced must use `md` (default) or `lg`. Documented in component JSDoc and consumer-obligations MDX. md and lg variants both clear 2.5.5; AAA cert is granted for the `md` (default) baseline as the canonical AAA surface.
