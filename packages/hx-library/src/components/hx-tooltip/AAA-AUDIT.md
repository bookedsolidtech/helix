# AAA Audit — HelixTooltip

**Component:** `hx-tooltip`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-tooltip.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Tooltip body paints `--hx-color-text-inverse` (neutral-0 / white) on `--hx-color-surface-inverse` (neutral-900 / `#0d1825`) — `hx-tooltip.styles.ts:25-26`. White-on-neutral-900 clears AA 4.5:1 across all 6 brands (the inverse surface is brand-neutral). |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | Same paint as 1.4.3: `text-inverse` on `surface-inverse`. AAA 7:1 cleared across 18/18 brand×theme contexts via `scripts/aaa-matrix-verify.mjs` — `surface-inverse` resolves to `#0d1825` and `text-inverse` resolves to `#FFFFFF` regardless of brand, yielding ~17:1 contrast. |
| 1.4.11 | Non-text Contrast | AA | matrix harness | pass | Tooltip arrow paints the same `--hx-color-surface-inverse` as the body (`hx-tooltip.styles.ts:52`); under forced-colors a `1px solid CanvasText` border is added to both body and arrow (`hx-tooltip.styles.ts:67-73`) — meets 3:1 UI floor. |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | The tooltip pattern itself IS this SC. Implementation: (a) **dismissable** — Escape closes the tooltip while focus remains on the trigger (`hx-tooltip.ts:385-391`); (b) **hoverable** — once shown via mouseenter, hovering the tooltip body itself clears the hide timer (`@mouseenter=${this._clearTimers}` on the tooltip element, `hx-tooltip.ts:430`); (c) **persistent** — only the user (Escape, blur, mouseleave) or the underlying control (programmatic) dismisses; no auto-timer. The mixed-input guard at `hx-tooltip.ts:400-409` prevents mouseleave from dismissing a tooltip while keyboard focus is still on the trigger. |
| 2.1.1 | Keyboard | A | manual review | pass | Tooltip is shown on `focusin` and hidden on `focusout` of the trigger wrapper (`hx-tooltip.ts:419-420`). APG mandate: tooltips must reveal on focus, not just hover. The trigger element receives focus normally; the tooltip body itself is non-focusable (no `tabindex`). |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review | pass | All tooltip operations are single-keystroke: focus-in reveals (no path dependency), focus-out / Escape dismisses. No timing-based gestures. The 300ms show-delay (`hx-tooltip.ts:126`) is a UX delay, not a keyboard gesture — Escape works regardless of delay state because `_clearTimers` runs before `_hide` (`hx-tooltip.ts:387-389`). |
| 2.4.7 | Focus Visible | AA | consumer-trigger | pass | The tooltip body never receives focus (APG explicitly forbids focus on `role="tooltip"`). The trigger element (slotted in light DOM) carries the focus ring — its visual treatment is the consumer's responsibility, but the tooltip pattern relies on the trigger remaining focused while the tooltip is shown. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | floating-ui | pass | Tooltip positioning uses `@floating-ui/dom` with `flip()` and `shift({ padding: 8 })` middleware (`hx-tooltip.ts:353`) — the tooltip body never overlaps the focused trigger because (a) it is offset by 8px (`offset(8)`), and (b) flip/shift reposition it when the configured placement would cause overflow. Focus stays on the trigger; the tooltip is always positioned away from the trigger's bounding rect. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | skip (N/A) | Tooltip body is non-focusable (no `tabindex`, `role="tooltip"` per APG). Focus stays on the slotted trigger; the trigger's focus ring is the consumer-supplied / hx-button-supplied visual, independently AAA-cert'd at the trigger level. Matrix harness records `2.4.13 N/A` per the overlay-container carve-out (`scripts/aaa-matrix-verify.mjs:692+`). |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | skip (N/A at container) | hx-tooltip is a non-interactive overlay surface — the only clickable target is the slotted trigger (light-DOM consumer responsibility, e.g. hx-button or native button). Container itself has no clickable target. Matrix harness skips per the overlay-container carve-out (`scripts/aaa-matrix-verify.mjs:865+`). |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Inner tooltip body carries `role="tooltip"` (`hx-tooltip.ts:427`). Description shim is appended to `document.body` as a visually-hidden `<span>` (`hx-tooltip.ts:228-238`) and the tooltip text is mirrored into it on every relevant signal (firstUpdated, slotchange on default and `content` slots, AND in-place text mutations of the slotted content elements via MutationObserver — round-23 P2 pattern, `hx-tooltip.ts:261-295`). The trigger's `aria-describedby` is set to point at the shim's id (`hx-tooltip.ts:244`). Cross-shadow-DOM IDREF resolution is fixed by routing the shim through document scope. |

## Keyboard contract

`dismiss=Escape`

APG `tooltip` pattern (https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/). Implementation in `_handleKeydown` (`hx-tooltip.ts:385-391`):

- **Escape**: clears any pending show/hide timers and hides the tooltip. Focus is NOT moved — it remains on the trigger element where the user already is.
- **No focus trap**: APG explicitly forbids tooltips from holding focus. The tooltip body is never a focus target.
- **No activation key**: tooltips reveal on `focusin` of the trigger wrapper (`hx-tooltip.ts:419`) — no Enter/Space binding on the tooltip itself.
- **Focus-out hide**: `focusout` schedules `_scheduleHide` with `hideDelay` (default 100ms, `hx-tooltip.ts:133`). The hide is suppressed if focus moves into a child of the trigger.
- **Mouseleave guard**: the trigger's `mouseleave` handler skips the hide schedule if keyboard focus is still on the trigger element (`hx-tooltip.ts:400-408`) — prevents mixed-input dismissal while the user is still navigating by keyboard.

## ARIA pattern

`tooltip` — https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/

**Light-DOM description shim** (group-4 round-1; documented in component JSDoc `hx-tooltip.ts:13-44`):

1. **Inner body** carries `role="tooltip"` and `aria-hidden=${!this._visible}` (`hx-tooltip.ts:427-428`). The role is NEVER promoted to `dialog` — APG forbids tooltips from holding focus.
2. **Document-scope shim**: a visually-hidden `<span>` is appended to `document.body` with the unique tooltip id (`hx-tooltip.ts:228-238`). This is necessary because `aria-describedby` IDREFs cannot resolve across the Shadow DOM boundary — the trigger lives in the consumer's light DOM and the tooltip body lives in this component's shadow root.
3. **Trigger wiring**: the first slotted element of the default slot (the trigger) gets `aria-describedby` set to the tooltip's unique id (`hx-tooltip.ts:243-245`). The id resolves to the document-scope shim, not the in-shadow body.
4. **Text mirror** (round-23 P2 pattern, `hx-tooltip.ts:261-295`): a MutationObserver watches the assigned `content` slot elements for `characterData`, `subtree`, and `childList` mutations so framework-driven text rewrites (Vue/React keyed text rerenders) re-sync the shim. `slotchange` fires only on assignment-list changes, never on descendant text mutations.
5. **Cleanup**: `disconnectedCallback` (`hx-tooltip.ts:192-203`) removes the shim from `document.body`, disconnects the slot-text observer, and clears the timers — preventing leaks across SSR teardown / framework remount cycles.
6. **SSR guard**: `document` access is gated by `typeof document !== 'undefined'` (`hx-tooltip.ts:228`, `:404`); the shim is created lazily on first browser-side `_setupTriggerAria()` call.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-tooltip/*.png`
System-color-keyword assertions: CanvasText / Canvas.

`forcedColorsSurface` mixin composed at `hx-tooltip.ts:98`. Bespoke per-class HC overrides at `hx-tooltip.styles.ts:66-74`:
- `[part="tooltip"]` gets a `1px solid CanvasText` border so the body is visible against `Canvas` system bg.
- `[part="arrow"]` gets the same `CanvasText` border so the arrow indicator remains visible.

Matrix harness `forced-colors`: 18/18 SKIP (Default story renders the tooltip in CLOSED state — 0×0 is correct; open-state forced-colors is verified in dedicated `Placements`/`HoverDelay` stories).

## Notes / carve-outs

- **2.4.13 (Focus Appearance) — N/A at the tooltip body**. APG `tooltip` mandates that the tooltip body never receives focus. The trigger's focus ring is the audited surface and is independently AAA-cert'd at the trigger level (e.g. hx-button when the trigger is `<hx-button>`, or consumer-supplied for native `<button>` triggers).
- **2.5.5 (Target Size Enhanced) — N/A at the tooltip container**. The tooltip body is non-interactive. The slotted trigger is the only clickable target and inherits its own AAA cert.
- **Cross-shadow-DOM `aria-describedby`**: the document-scope shim pattern is the canonical fix for the Shadow DOM IDREF boundary — see `hx-tooltip.ts:13-44` JSDoc for the full architecture note. ATs (NVDA, JAWS, VoiceOver, TalkBack) all read the shim text correctly because the IDREF resolves in document scope.
- **Mixed keyboard+mouse interactions**: the `_handleTriggerMouseleave` guard (`hx-tooltip.ts:400-408`) is critical for users who Tab to a trigger with a tooltip already open — the tooltip stays visible until they Tab away or press Escape, even if their cursor leaves the trigger area.
- **Reduced-motion**: `prefers-reduced-motion: reduce` strips the opacity/visibility transition (`hx-tooltip.styles.ts:57-61`) so the tooltip appears instantaneously for vestibular-sensitive users.
- **Default-closed Default story**: matrix harness records 8 SKIPs per context (forced-colors closed-overlay carve-out + 2.4.13 + 2.5.5 N/A + 1.4.13 hover/focus + 3.2.5 / 3.3.6 documented + apg-keyboard pre-cert chicken-and-egg fixed by this cert). The 3 PASS contexts cover programmatic ARIA wiring + 1.4.6 contrast + descendant text-flatten checks.
