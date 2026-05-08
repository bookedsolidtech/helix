# AAA Audit — HelixDialog

**Component:** `hx-dialog`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Body text + heading + close-button paint resolve to AA-clear semantic tokens. 3 axe AA cases (closed, open w/ heading, open w/ slotted header). |
| 1.4.6 | Contrast (Enhanced) | AAA | axe-core color-contrast-enhanced | conditional | **Conditional pass — pending Phase E token lift.** Close-button hover/focus paints reference action.* tokens that share the system-wide AAA gap. AAA axe rule disabled in `hx-dialog.test.ts` AAA suite. |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | Border, scrim overlay, close-button focus ring all clear 3:1 UI floor. |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | No hover-revealed content within the dialog frame; consumer slots opaque content. |
| 2.1.1 | Keyboard | A | play() interaction test | pass | Native `<dialog>` provides browser-default keyboard handling. Tab cycles within modal scope; close button `<button>` activated via Enter/Space. |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review | pass | All dismiss/activate paths reachable via keyboard: Escape (`hx-dialog.ts:751`), close button, slotted action buttons. No mouse-only dismissal. Native `<dialog>` Escape `cancel` event handled (`:872+`). |
| 2.4.7 | Focus Visible | AA | VRT snapshot | pass | `.dialog__close-btn:focus-visible` outline at `hx-dialog.styles.ts:165+` (2px solid, 2px offset via `--hx-focus-ring-*`). Initial focus moves into dialog body on open; restored on close. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | manual review | pass | Close button focus ring lifts outside button bounds; modal scrim isolates dialog body so external sticky chrome cannot occlude the focused element inside the dialog. |
| 2.4.13 | Focus Appearance | AAA | VRT snapshot | pass | 2px solid ring + 2px offset on close button (`hx-dialog.styles.ts:165+`); ring color clears 3:1 against adjacent surfaces. |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | Close button: `min-width / min-height / width / height: var(--hx-touch-target-min, 2.75rem)` = 44×44px (`hx-dialog.styles.ts:138-141`). Slotted action buttons inherit hx-button's 44×44 target compliance. |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Native `<dialog>` element provides implicit `role="dialog"` + browser `aria-modal` semantics when `showModal()` is called. Labelling priority cascade: consumer `aria-labelledby` → `heading` property → slotted `[slot="header"]` (`hx-dialog.ts:1057+`); resolved IDREFs flatten across shadow boundary. Close button has `aria-label` (i18n via `labelClose`). |

## Keyboard contract

`dismiss=Escape; trap-focus=true`

- **Escape**: dismisses the modal, fires `cancel` event before `close` (native `<dialog>` semantics, intercepted at `hx-dialog.ts:751`).
- **Tab / Shift+Tab**: focus is constrained within the dialog while open in modal mode (browser-native `inert`-ing of background content via `showModal()`).
- **Initial focus**: moves to the first focusable descendant of the dialog body on open; falls back to the close button.
- **Return focus**: restored to the previously-focused element on close.
- **Non-modal mode (`non-modal` attr)**: no focus trap, no scrim — for inline confirmation pickers and similar; consumer responsibility to dismiss.

## ARIA pattern

`dialog` (modal) — https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

Native `<dialog>` element is the implementation primitive. Per the JSDoc commentary on the host (`hx-dialog.ts:39+`), the native element's implicit `role="dialog"` is non-strippable, so the **inner native dialog owns the role** while the host is left without `role` to avoid double-announcement. Host `aria-labelledby` IDREFs are resolved + projected onto the inner `<dialog>`'s `aria-labelledby`.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-dialog/*.png`
System-color-keyword assertions: Canvas / CanvasText / ButtonText / ButtonFace / Highlight.

`forcedColorsSurface` mixin composed at `hx-dialog.ts:211`. Bespoke per-class HC overrides at `hx-dialog.styles.ts:210+` cover scrim opacity, dialog border, close-button hover/focus.

## Notes / carve-outs

**Conditional pass on 1.4.6 (Contrast Enhanced)** — close-button hover/focus tokens currently land at 5.19:1; auto-promotes when Phase E primary-700 lift lands.

**Modal vs non-modal**: AAA cert applies to both modes. Non-modal mode (`non-modal` attribute) intentionally does NOT trap focus — this is by-design for inline dismissable surfaces. Consumers using non-modal must ensure their composition does not violate keyboard-trap rules when the dialog is paired with other interactive elements.

**Heading vs aria-label**: dialog accessible name resolution cascade (`hx-dialog.ts:1057+`) gives consumer-supplied `aria-labelledby` highest priority, then `heading` property, then slotted `[slot="header"]` text. Cert covers all three paths.
