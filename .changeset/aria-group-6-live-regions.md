---
'@helixui/library': minor
---

Group 6 — live regions / status feedback ARIA hardening (single PR)

4 components hardened per `.reports/aria-group-6-scope.md`. Closes Group 6.

**hx-banner** (smallest delta — establishes harmonization):
- Variant→role harmonized (Option A): `error` → `alert` (assertive); `warning`/`success`/`info` → `status` (polite). Matches hx-alert/hx-toast contract.
- Dual-write `internals.role` + `setAttribute('role')` in connectedCallback + updated()
- ARIA-naming-disambiguation block: hx-banner is a UX descriptor, NOT the LANDMARK `role="banner"`. LANDMARK regression guards (host attr + shadow descendants).

**hx-alert** (highest-risk delta):
- Dual-write `internals.role` + `setAttribute('role')`
- §5.1 double-announce mitigation: severity-label, icon, title, default-slot wrapper each individually `aria-hidden="true"` so sr-only announcer is the SOLE announcement surface. Container/actions/close button NOT aria-hidden (focusable descendants — `aria-hidden-focus` axe rule).
- §5.4 announcer race-guard counter `_announcerCycle`: rapid open/close cycles collapse to one announcement on the final settled state
- New `.alert__default-slot { display: contents; }` preserves layout while allowing aria-hidden wrapping

**hx-toast** (largest behavioral delta):
- Host-canonical migration: `internals.role = this._role`, `internals.ariaAtomic = 'true'` set in connectedCallback. Inner `[part="base"]` div drops role/aria-live/aria-atomic (presentation-only).
- §5.1 double-announce mitigation: NO explicit `aria-live` anywhere — role implies live per ARIA spec
- §5.3 WCAG 2.2.3 devWarn: `MIN_DISPLAY_MS_BY_VARIANT` (default/info/success=3s, warning=4s, danger=6s); `_auditWcag223()` fires devWarn when consumer sets duration shorter than role-implied minimum
- Variant change syncs role in updated()

**hx-toast-stack** (audit + factory min-display-time):
- §3.2/§5.9 no-container-role decision documented (would create nested live regions and double-announce)
- `toast-factory.ts`: §5.5 `MIN_DISPLAY_MS=1500` guard. `_shownAt` WeakMap tracks `show()` timestamps; stack-limit-driven hide of oldest toast is deferred via setTimeout if below minimum window. Prevents AT clipping on rapid-fire bursts.

**Patterns NOT applied (intentional):**
- No `aria-relevant` anywhere (per scope §5.9)
- No role on hx-toast-stack (per scope §3.2)
- Forced-colors styles untouched (hx-toast bespoke `@media`; hx-alert/banner already compose `forcedColorsSurface`)

231/231 tests passing across the 4 components (+27 new cases): hx-toast 72 (+12), hx-alert 87 (+9), hx-banner 72 (+6), hx-toast-stack 3 (+3). 4 pre-existing tests updated (warning→status assertion swap; stack-limit waits; host-canonical aria-atomic).

`pnpm run verify` clean (14/14 turborepo tasks).
