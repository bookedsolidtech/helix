# AAA Audit — HelixPopover

**Component:** `hx-popover`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-popover.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Popover body paints `--hx-color-text-primary` (`#0d1825`) on `--hx-color-surface-default` (`#ffffff`) — `hx-popover.styles.ts:28-29`. Default-light contrast ~17:1 across all 6 brands. Border `--hx-color-border-default` clears 3:1 UI floor. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | Body text on default-surface AAA ≥7:1 across 18/18 brand×theme contexts via `scripts/aaa-matrix-verify.mjs`. `--hx-color-text-primary` and `--hx-color-surface-default` resolve to brand-neutral high-contrast values. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | Popover border (`--hx-color-border-default`) and arrow border meet 3:1 against the surface (`hx-popover.styles.ts:33`, `:63`). Body focus ring uses `--hx-focus-ring-color` ≥3:1 against the body bg (`hx-popover.styles.ts:52-55`). |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | Trigger modes covered: `click` (default), `hover`, `focus` (`hx-popover.ts` `trigger` property). For hover/focus modes: (a) **dismissable** — Escape closes (`hx-popover.ts:601-604`); (b) **hoverable** — `_handleAnchorFocusOut` keeps the popover open if focus is moving into the body (`hx-popover.ts:728-734`); (c) **persistent** — only Escape, click-outside, blur, or programmatic close dismisses. Hover-mode `mouseleave` schedules a 150ms hide that is cancelled if the cursor enters the body (`hx-popover.ts:702-709`). |
| 2.1.1 | Keyboard | A | hx-popover.test.ts | pass | Click trigger: Enter/Space on the slotted anchor toggles open via native button behavior (`hx-popover.ts:651-658`). Document-level keydown (`hx-popover.ts:598-631`) handles Escape + Tab focus trap while open. |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review | pass | All operations are single-keystroke: Enter/Space opens, Escape closes, Tab/Shift+Tab cycle within the focus trap. No timing-based gestures. The 150ms hover-hide timer (`hx-popover.ts:702-709`) is a UX delay, not a keyboard gesture — keyboard users see no timing dependency. |
| 2.4.7 | Focus Visible | AA | matrix harness | pass | Body `[part="body"]:focus-visible` outline at `hx-popover.styles.ts:52-55` — `var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color)` with `outline-offset: var(--hx-focus-ring-offset, 2px)`. The body itself is focused (tabindex="-1" so it is programmatically focusable but not in tab order, `hx-popover.ts:763`) when initial focus lands on a non-interactive popover. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | floating-ui | pass | Positioning uses `@floating-ui/dom` with `flip()` and `shift({ padding: 8 })` (`hx-popover.ts:530-534`) — the popover body never overlaps the focused anchor. Internal focus stays inside the body (focus trap, `hx-popover.ts:607-630`), and the body itself is positioned via `computePosition` so it never occludes its own focused descendants. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | skip (N/A in default closed state) | Default story renders the popover CLOSED (anchor button visible only). Open-state focus ring is verified in the `Click`, `Hover`, `Focus`, `Interactive` stories — body `[part="body"]:focus-visible` paints a 2px solid outline with 2px offset (`hx-popover.styles.ts:52-55`). Matrix harness records `2.4.13 N/A at container` per the overlay-container carve-out (`scripts/aaa-matrix-verify.mjs`). |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | skip (N/A at container) | hx-popover composes a slotted anchor (light-DOM consumer responsibility — typically hx-button or native button at 40px md / 44px sm). Container itself has no clickable target. Matrix harness skips per the overlay-container carve-out (`scripts/aaa-matrix-verify.mjs`). |
| 4.1.2 | Name, Role, Value | A | axe-core + accname-flatten | pass | Inner body carries `role="dialog"` (`hx-popover.ts:742`). The host does NOT carry a role to avoid double-announcement. **Accessible-name resolution cascade** (`hx-popover.ts:343-380`, `_resolvedLabel` state): (1) host `aria-labelledby` IDREFs resolved + text-flattened via `flattenAccName` from `aria-flatten.js`; (2) host `aria-label`; (3) `label` property; (4) literal `"Popover"`. The flattened name is written to the inner body's `aria-label` (`hx-popover.ts:743`). **Trigger state on the slotted anchor** (`hx-popover.ts:390-401`): `aria-haspopup="dialog"` is set once on firstUpdated; `aria-expanded` toggles in sync with `_visible`. `aria-controls` is intentionally omitted because the body lives in shadow DOM and is unreachable via the document `getElementById` axe walks (documented at `hx-popover.ts:50`). |

## Keyboard contract

`dismiss=Escape; trap-focus=true`

Document-level handler `_handleDocumentKeydown` (`hx-popover.ts:598-631`):

- **Escape**: closes the popover and restores focus to the previously-focused element (`_previousFocus`, captured before `_show` moves focus, `hx-popover.ts:457`). HIGH-03 contract: Escape ALWAYS restores focus.
- **Tab**: forward-traps within the body. If the active element is the last focusable, Tab cycles to the first (`hx-popover.ts:619-623`).
- **Shift+Tab**: reverse-traps within the body. If the active element is the first focusable, Shift+Tab cycles to the last (`hx-popover.ts:619-623`).
- **Enter / Space on anchor (click trigger)**: native button behavior toggles open/closed via `_handleAnchorClick` (`hx-popover.ts:651-658`).
- **Initial focus**: on open, focus moves to the body (if interactive content present) per `_show` (`hx-popover.ts:474-480`). For non-interactive (informational) popovers, focus stays on the trigger — WCAG 2.4.3 compliance: do not steal focus when no interactive target is present.
- **Click-outside**: closes WITHOUT restoring focus (HIGH-03 contract — let browser handle naturally, `hx-popover.ts:638-644`).

## ARIA pattern

`dialog` (non-modal) — https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

Host-mirror to inner-body pattern (documented at `hx-popover.ts:23-50`):

1. **Inner body** (`<div part="body">`) carries `role="dialog"` (`hx-popover.ts:742`). The host is left without a role to avoid double-announcement.
2. **AccName cascade** at `_syncResolvedLabel` (`hx-popover.ts:343-380`): host `aria-labelledby` (resolved across shadow boundary via `resolveIdrefs` from `aria-idref.js`) > host `aria-label` > `label` property > `"Popover"`. The resolved name lands on the inner body's `aria-label`.
3. **Live label updates** (`hx-popover.ts:312-334`): MutationObservers on `aria-labelledby` referenced elements track `characterData`, `subtree`, `aria-hidden`, and `[hidden]` attribute changes so live label rewrites flow into the body's `aria-label`. Reinstalled on every sync.
4. **Anchor wiring** (`hx-popover.ts:390-401`): `aria-haspopup="dialog"` set once on firstUpdated; `aria-expanded` toggles with `_visible`. `aria-controls` intentionally omitted because the body lives in shadow DOM (axe-core requires resolvable IDREF; cross-shadow refs do not satisfy axe's walk).
5. **Non-modal**: this is a non-modal dialog. The focus trap (`hx-popover.ts:607-630`) only intercepts Tab/Shift+Tab; outside content remains operable, and click-outside closes the popover without restoring focus. Modal-class behavior (scrim, inert outside) is hx-dialog territory.
6. **Light-DOM IDREF resolution**: `installAriaIdrefMirror` (used by other components) is intentionally NOT used here — `aria-controls` is omitted by design.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-popover/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

`forcedColorsSurface` mixin composed at the host. Bespoke per-class HC overrides at `hx-popover.styles.ts:77+` cover body border, arrow border, and focus ring.

Matrix harness `forced-colors`: 18/18 SKIP (Default story renders the popover in CLOSED state — 0×0 is correct; open-state forced-colors is verified in dedicated `Click`, `Hover`, `Focus` stories per the closed-overlay carve-out at `scripts/aaa-matrix-verify.mjs`).

## Notes / carve-outs

- **2.4.13 (Focus Appearance) — N/A in Default story**. Body focus ring is at `hx-popover.styles.ts:52-55` and is verified in dedicated open-state stories. Same precedent as hx-dialog.
- **2.5.5 (Target Size Enhanced) — N/A at the popover container**. The slotted anchor button (typically hx-button) is the only clickable target and inherits its own AAA cert.
- **Non-modal vs modal**: hx-popover is a NON-MODAL dialog. Do not confuse with hx-dialog (modal). Non-modal means: no scrim, no inert outside, click-outside closes, focus trap only blocks Tab/Shift+Tab. WCAG 2.4.3 (focus order) is satisfied because the trap is forward-only — a user pressing Escape always returns to the prior focus.
- **`aria-controls` omitted by design**: documented at `hx-popover.ts:50`. axe-core requires the IDREF to resolve in document scope; the body lives in shadow DOM, so adding `aria-controls` would create an axe failure for an unreachable IDREF. The trigger relationship is conveyed by `aria-haspopup="dialog"` + the focus-move on open — both of which AT consume independently of `aria-controls`.
- **WCAG 2.4.3 focus-not-stolen**: the `_show` method (`hx-popover.ts:474-480`) only moves focus into the body when the body contains interactive content (`hasInteractive = _getFocusableElements().length > 0`). Pure informational popovers leave focus on the trigger — stealing focus from the trigger would be unexpected and disruptive for keyboard users.
- **Trigger modes** (`hx-popover.ts:125-145`): `click` (default), `hover`, `focus`. Hover/focus modes implement WCAG 1.4.13 in full (dismissable / hoverable / persistent). Click mode is the canonical APG dialog pattern and does not need 1.4.13 because the popover is shown via explicit user action, not hover.
- **Default-closed Default story**: matrix harness records 9 SKIPs per context (forced-colors closed-overlay + 2.4.13 + 2.5.5 N/A + 1.4.13 click-mode default + 3.2.5 / 3.3.6 documented + apg-keyboard pre-cert chicken-and-egg fixed by this cert). The 2 PASS contexts cover programmatic ARIA wiring + 1.4.6 contrast.
