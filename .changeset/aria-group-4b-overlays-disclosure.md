---
'@helixui/library': minor
---

ARIA group-4b overlays + disclosure: host-attribute label mirror + tooltip slot-text observer + accordion audit (group-4 round-1)

Four components in this round, all anchored-overlay or disclosure family. Pattern is **host-attribute mirror to inner panel** — distinct from the host-canonical role transplant used by group-2 selection controls and group-4a modal dialogs (`hx-dialog`, `hx-drawer`). The inner panel/body is the announced surface, not the host, so `ElementInternals.ariaLabelledByElements` on the host cannot project across the shadow boundary. We instead resolve consumer IDREFs at sync time, text-flatten via `flattenAccName` (AccName 1.2 §4.3.10 hidden-aware), and write the result to the inner panel's `aria-label`.

**`hx-popover`**: inner `[part="body"]` `role="dialog"` now consumes consumer host `aria-label` / `aria-labelledby` per AccName 1.2 §4.3.1 precedence (host `aria-labelledby` > host `aria-label` > `label` property > literal `"Popover"`). Shared root mirror via `installAriaIdrefMirror`. `_externalRefsObserver` watches in-place text/visibility mutations on resolved IDREF targets so a consumer mutating `<h2 id="x">Patient</h2>` → `Member` re-flows into the body's `aria-label`. `aria-controls` on the trigger remains intentionally omitted (cross-shadow IDREF; documented exception). Slotted-label support deferred to a follow-up.

**`hx-dropdown`**: same shape — panel `[part="panel"]` `role="menu"` adopts the host-attribute mirror (precedence: host `aria-labelledby` > host `aria-label` > `label` property > literal `"Menu"`). **Group 5 boundary** documented in code: this round is additive only; the `role="menu"` panel and menuitem-roving keyboard pattern are NOT touched here. Group 5 will own the broader menu/menubar/menuitem refactor.

**`hx-tooltip`**: added `_contentSlotTextObserver` (round-23 P2 pattern) that watches `characterData` / `subtree` / `childList` on the elements assigned to `<slot name="content">`. Without this, framework-driven in-place `textContent` rewrites of the slotted content element would leave the document-scope `aria-describedby` shim stale. Cleanup added to `disconnectedCallback`. New tests cover in-place mutation, subtree mutation, shim removal on disconnect, multiple-tooltip id uniqueness, cross-shadow hosting (tooltip nested inside another component's shadow root still creates the document-scope shim), and slot replacement (observer is reinstalled on `slotchange`). Tooltip is NEVER promoted to `role="dialog"` — APG forbids tooltips from holding focus. No host-canonical `_internals` work is owed: the trigger is the announced surface and already correctly references the tooltip via `aria-describedby`.

**`hx-accordion` + `hx-accordion-item`**: audit-only commit. The existing implementation already follows APG: `<details><summary role="heading" aria-level=N>` with `aria-controls` to a same-shadow-root `<div role="region" aria-labelledby=${trigger-id}>`. Added an explicit architectural deviation note in `hx-accordion-item.ts` documenting why the host-canonical / `internals.ariaLabelledByElements` pattern is intentionally NOT applied here (the trigger label comes from `<slot name="trigger">` projected directly into the `<summary>`, AT reads slot-projected text natively, and `<summary>` MUST be a direct child of `<details>` so wrapping it in an `<h3>` would forfeit native disclosure). Tests added: `role="heading"` + `aria-level` (with clamp), same-shadow-root `aria-controls` / `aria-labelledby` round-trip, `aria-disabled` + `tabindex="-1"` for disabled items, `aria-expanded` synced to `expanded`, and a regression guard that the host element does NOT carry host-canonical role / aria-label (the deviation).

All four components: `aria-controls` cross-shadow remains intentionally omitted on triggers (popover, dropdown) or scoped same-shadow-root (accordion). Forced-colors mixins (`forcedColorsSurface`, `forcedColorsInteractive`) already in place — host-focus-visible parity is N/A because the host is never focused; the inner panel/summary owns focus.

Implementation notes:

- Reuses `aria-idref.ts` (`installAriaIdrefMirror`, `resolveIdrefTokens`) and `aria-flatten.ts` (`flattenAccName`) — same shared utilities used by `hx-drawer` (group-4a) and every group-2 selection control.
- Shared root observer (`installAriaIdrefMirror` round-7 #11 perf optimization) collapses N per-instance subtree observers into one per `Document`/`ShadowRoot`, so a page with many host-attribute-mirror components pays a single attach cost.
- `label` property changes flow through `updated()` so a consumer mutating `el.label` repaints the inner panel's accessible name without a full re-fixture.

This PR is additive to the public API; no breaking changes.
