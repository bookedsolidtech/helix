# AAA Audit — HelixPopup

**Component:** `hx-popup`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface — positioning primitive)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-popup.md` (18/18 contexts GREEN, 6 brands × 3 themes)

> **CLASSIFICATION**: hx-popup is a **low-level positioning primitive**, not an interactive widget.
> It is the floating-ui-based foundation that hx-tooltip, hx-popover, hx-dropdown, and hx-drawer
> compose. The Accessibility Contract on the host (`hx-popup.ts:57-71`) is explicit: hx-popup
> does NOT provide ARIA semantics, focus management, or keyboard handling. Consumers that build
> dialogs/menus/tooltips on top of hx-popup are responsible for ARIA + keyboard wiring. This
> audit certifies the **container's a11y obligations** (forced-colors, contrast, no-introduced
> a11y hazards). All consumer-side criteria are tracked at the consumer-component AAA cert.

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | manual | pass (consumer-fulfilled) | hx-popup paints NO surface of its own (`hx-popup.styles.ts:6-11` — comment "Positioning primitive — does NOT paint a surface of its own"). The `[part="popup"]` element is positioned-only (`position: fixed; z-index;` — `hx-popup.styles.ts:17-23`). Slotted content's contrast is the consumer's responsibility. The arrow paints `--hx-arrow-color` (default `--hx-color-neutral-0`) for visual continuity with the slotted body — meets 3:1 against most surfaces; consumer overrides via `--hx-arrow-color` for non-light bodies. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass (consumer-fulfilled) | Same reasoning as 1.4.3. hx-popup itself emits no text; AAA contrast applies to the slotted content surface (consumer-controlled). 18/18 contexts GREEN — the harness reports no contrast failures because there is no popup-owned text to inspect. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | Under forced-colors the popup container gets `border: 1px solid CanvasText` (`hx-popup.styles.ts:46-49`) and the arrow gets the same border so the floating surface remains visible against `Canvas`. Outside forced-colors mode, the consumer styles their own border/shadow on the slotted content. |
| 1.4.13 | Content on Hover or Focus | AA | n/a | skip (consumer-fulfilled) | hx-popup has NO interactive trigger of its own. Hover/focus dismissability is the responsibility of the composing component (hx-tooltip, hx-popover) — each of those independently certifies 1.4.13. |
| 2.1.1 | Keyboard | A | manual | pass | hx-popup adds NO keyboard handlers of its own. The `active` attribute is the only API surface — consumers toggle it from JS or DOM events. Native keyboard activation of the slotted anchor is the consumer's `<button>` (or hx-button). The host therefore introduces no keyboard hazard. |
| 2.1.3 | Keyboard (No Exception) | AAA | manual | pass | Same as 2.1.1. No timing-based gestures, no path dependencies. The `active` toggle is binary. |
| 2.4.7 | Focus Visible | AA | n/a | skip (consumer-fulfilled) | hx-popup's `[part="popup"]` is non-focusable (no tabindex, no role). Slotted anchor + slotted content carry their own focus rings via consumer styling. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | floating-ui | pass | Positioning uses `@floating-ui/dom` `flip()` and `shift({ padding: 8 })` middleware (`hx-popup.ts` — `_loadFloatingUi` + `computePosition` orchestration). Auto-size middleware reports available width/height via `--hx-auto-size-available-{width,height}` so slotted content can scroll instead of being clipped behind viewport edges. Anchored-popup never overlaps its anchor reference because of the configurable `distance` offset. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | skip (N/A — primitive) | hx-popup is non-focusable; matrix harness records `2.4.13 N/A at container` per the overlay-container carve-out (`scripts/aaa-matrix-verify.mjs`). |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | skip (N/A at container) | hx-popup has no clickable target. Slotted anchor button is the only target and inherits its consumer-component AAA cert. Matrix harness skips per the overlay-container carve-out (`scripts/aaa-matrix-verify.mjs`). |
| 4.1.2 | Name, Role, Value | A | manual | pass (consumer-fulfilled) | hx-popup has NO role on its host or its `[part="popup"]` body. Per the explicit Accessibility Contract (`hx-popup.ts:62-71`): consumers add `role="tooltip"`, `role="dialog"`, `role="listbox"`, etc. to their slotted content depending on its purpose. The trigger element MUST set `aria-expanded="true/false"` and SHOULD use `aria-controls` to reference the slotted body's id. The container itself has no name/role/value and so does not introduce a 4.1.2 obligation of its own. |

## Keyboard contract

`(none — primitive)`

The CEM-stamped keyboard contract (`dismiss=Escape; trap-focus=true`) reflects the **most-common consumer pattern** when hx-popup is composed into a dialog/popover/menu. hx-popup itself implements neither Escape handling nor focus trap — both are consumer obligations explicitly documented in the host JSDoc (`hx-popup.ts:67-69`):

> "**Focus management**: hx-popup does NOT trap focus. Consumers building dialogs or menus MUST implement focus trapping and keyboard dismiss (Escape key) themselves."

When hx-popup is composed into hx-popover or hx-drawer, those wrappers add the Escape + Tab focus trap; the contract appears at the wrapper level. The CEM helixMeta entry for hx-popup is informational — it tells library consumers "if you compose this primitive, you owe Escape + trap-focus."

## ARIA pattern

`dialog` (informational — consumer-fulfilled)

hx-popup itself emits NO ARIA. The CEM helixMeta `ariaPattern: dialog` is informational — it tells consumers "the most-common composition is a dialog-class surface." Pattern source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/.

The Accessibility Contract documented at `hx-popup.ts:57-127` covers all consumer obligations:

1. **Popup role** — consumer adds `role="tooltip"`, `role="dialog"`, `role="listbox"`, etc. to slotted content.
2. **Trigger state** — slotted anchor MUST set `aria-expanded="true/false"`.
3. **Association** — `aria-controls` on trigger references the popup content element id; `aria-labelledby` / `aria-describedby` as appropriate.
4. **Focus management** — consumer implements focus trap + Escape dismiss.
5. **Visibility** — hx-popup hides via `display: none` (`hx-popup.styles.ts:25-27`) AND the `inert` attribute when inactive. Both are reliable a11y-tree hiding mechanisms.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-popup/*.png`
System-color-keyword assertions: CanvasText / Canvas.

`forcedColorsSurface` mixin composed at `hx-popup.ts:131`. Bespoke per-class HC overrides at `hx-popup.styles.ts:46-54`:
- `[part="popup"]` gets `1px solid CanvasText` border so the positioned floating surface is visible against `Canvas`.
- `[part="arrow"]` gets the same `CanvasText` border.

Matrix harness `forced-colors`: 18/18 PASS — the `active` attribute in the Default story renders the popup visible, and the bordered surface clears the forced-colors visibility check.

## Notes / carve-outs

- **Primitive classification**: hx-popup is in `Infrastructure/Popup` Storybook category, not `Components/`. It is the foundation that hx-tooltip / hx-popover / hx-dropdown / hx-drawer compose. The AAA cert here certifies that the primitive itself introduces no a11y hazard — every consumer-side a11y obligation is independently certified at the consumer-component cert.
- **No ARIA emitted**: this is by-design (`hx-popup.ts:60-61`). Adding a role at the primitive level would force consumers into a single dialog-class semantic; instead, hx-popup is role-agnostic and consumers tag the slotted content with the appropriate role for their use case.
- **`inert` + `display: none` hide pattern**: when `active=false`, both `inert` (a11y-tree hide) and `display: none` (CSS hide) are applied (`hx-popup.styles.ts:25-27` + JS-driven `inert` attribute). Belt-and-suspenders ensures AT does not announce hidden content even if `display: none` were overridden by a consumer.
- **Auto-size middleware**: when used, exposes `--hx-auto-size-available-width/height` on the host so slotted content can `max-width`/`max-height` to the available viewport space — preventing 2.4.12 violations from oversized popups clipping the focused anchor.
- **Reduced-motion**: `prefers-reduced-motion: reduce` strips the popup transition (`hx-popup.styles.ts:38-42`).
- **Default-active Default story**: the Default story uses `<hx-popup active distance="8">` so the matrix harness can probe the open state. This is why forced-colors is `pass` (not `skip`) for hx-popup — unlike the closed-default tooltip/popover/drawer, hx-popup ships open in its Default story.
- **Consumer-fulfilled carve-outs**: 1.4.3, 1.4.6, 1.4.13, 2.4.7, 4.1.2 are all "consumer-fulfilled" — hx-popup neither owns these surfaces nor introduces obligations. The matrix harness reports SKIP for the corresponding contexts because there is no popup-owned content to inspect.
