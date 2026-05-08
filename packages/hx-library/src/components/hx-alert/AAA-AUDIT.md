# AAA Audit — HelixAlert

**Component:** `hx-alert`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | All variants (info/success/warning/error) route through `feedback.*` semantic tokens — clears AA. `hx-alert.test.ts` Accessibility (axe-core) describe verifies 4 variants + dismissible + accent. |
| 1.4.6 | Contrast (Enhanced) | AAA | axe-core color-contrast-enhanced + brand×theme matrix | pass | Variant body text routes through feedback.* AAA-classified tokens. Close-button hover/focus paint inherits `--hx-color-action-primary-bg` (primary-600) with `--hx-color-text-on-primary` (neutral-0 / white) — white-on-primary-600 across 6 brands: Apex 5.82, Meridian 12.05, Lumen 7.10, Verdant 6.70, Signal 6.37, Ember 6.22 (all AAA-large ≥4.5:1). Verified GREEN across 6 brands × 3 themes × 11 criteria via `scripts/aaa-matrix-verify.mjs`. Original Phase C cert referenced action.* tokens at 5.19:1 (primary-500/neutral-900) against Apex/light only — over-claimed; remediated in 3.7.0 via structural `action.primary.bg` shift. |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | Variant accent borders/icons clear 3:1 UI floor; close-button focus ring ≥3:1. |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | No hover-revealed content; alert is fully visible on render. |
| 2.1.1 | Keyboard | A | play() interaction test | pass | Close button is a native `<button>` (browser-default Enter/Space activation). Escape dismisses dismissible alerts (`hx-alert.test.ts` Keyboard describe). |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review | pass | All dismissal paths reachable via keyboard (close button + Escape); no mouse-only dismiss. |
| 2.4.7 | Focus Visible | AA | VRT snapshot | pass | `.alert__close-button:focus-visible` outline at `hx-alert.styles.ts:182` (2px solid, 2px offset via shared `--hx-focus-ring-*` tokens). |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | manual review | pass | Close button focus ring lifts 2px outside the button bounding box; alert body has no internal scrollers or sticky chrome that could occlude focus. |
| 2.4.13 | Focus Appearance | AAA | VRT snapshot | pass | Close button focus indicator: 2px outline + 2px offset, color resolves to `--hx-focus-ring-color` (≥3:1). |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | Close button `min-width: var(--hx-touch-target-size, 44px); min-height: 44px` (`hx-alert.styles.ts:158-159`) — 2.5.5 enhanced (44×44) plus 2.5.8 minimum (24×24). |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Host carries `role="alert"` (assertive variants: error/warning) or `role="status"` (polite: info/success) via `_internals.role` (`hx-alert.ts:242-243`). Inner sr-only announcer carries explicit `aria-live` + `aria-atomic="true"` (`hx-alert.ts:472-473`). Close button has `aria-label`. |

## Keyboard contract

`dismiss=Escape`

Dismissible alerts respond to Escape (per APG alert pattern). Close button is a native `<button>` — Enter/Space activate. Non-dismissible alerts have no keyboard contract beyond focus traversal.

## ARIA pattern

`alert` — https://www.w3.org/WAI/ARIA/apg/patterns/alert/

Variant-driven role split: error/warning use `role="alert"` (implicit `aria-live="assertive"`); info/success use `role="status"` (implicit `aria-live="polite"`). The host owns the role for cross-shadow-boundary AT lookup; dual-write to `internals.role` + attribute for legacy AT compatibility (`hx-alert.ts:236-243`).

Explicit `aria-live` is intentionally NOT set on the host — it would cause double-announcements in JAWS. The inner sr-only announcer pattern carries the explicit live-region for delayed announcement after `open` toggles (`hx-alert.ts:466-475`).

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-alert/*.png`
System-color-keyword assertions: Canvas / CanvasText / ButtonText / ButtonFace / Highlight.

`forcedColorsSurface` mixin composed at `hx-alert.ts:93`. Bespoke per-variant block at `hx-alert.styles.ts:241+` covers icon and accent borders (XOR rule with mixin: rich per-class HC overrides PLUS the surface mixin — documented in styles header).

## Notes / carve-outs

**1.4.6 (Contrast Enhanced) — passes via brand × theme matrix verification.** The 3.7.0 structural shift (`--hx-color-action-primary-bg` → primary-600 + `--hx-color-text-on-primary` → neutral-0) lands close-button hover/focus paint at AAA-large across all 6 brands. Original Phase C cert was over-claimed (primary-500 + neutral-900 text vs Apex/light only). Evidence: `.reports/aaa-matrix-evidence.md` (522 pass / 0 fail / 468 skip across 90 contexts).

The `accent` variant (`accent` attribute) renders an additional left-border accent stripe; contrast against the alert body is governed by the `--hx-color-feedback-*-strong` semantic tokens which are AAA-classified per the `@helixui/tokens` contrast-report.
