---
'@helixui/library': minor
---

Group 5a — tabs family ARIA hardening (host-canonical Path A)

3 components hardened per `.reports/aria-group-5-scope.md`. Lowest-risk PR of Group 5; validates `role="tab"` on host with inner activation pattern.

**hx-tab** — host-canonical:
- `internals.role = 'tab'` on host
- Inner element changed from `<button>` to `<div part="tab">` on modern path (ARIA 1.2 forbids `role="presentation"` on focusable elements; cleanest strip is to use a roleless element)
- Click + pointer activation still works on `<div>`; keyboard activation owned by parent `hx-tabs` keydown handler operating on host
- Inner `aria-disabled` retained as non-AT signal so axe-core's color-contrast rule excludes the disabled surface
- `internals.ariaSelected` / `internals.ariaDisabled` mirror reactive state
- `internals.ariaControlsElements` references corresponding `hx-tab-panel` host (cross-shadow IDL refs); legacy fallback writes string `aria-controls`

**hx-tabs** — host-canonical:
- `internals.role = 'tablist'` on host
- `internals.ariaOrientation` reactive to `orientation` property
- Cross-shadow naming belt-and-suspenders — host `aria-label` / `aria-labelledby` resolve via `installAriaIdrefMirror` + `resolveIdrefTokens`; `internals.ariaLabelledByElements` set on modern path; `flattenAccName`-flattened string on legacy path
- **Manual activation default** — flipped from `automatic` per scope §5.4 + healthcare patterns (safer for accidental keypress). Public API still supports both modes via `activation="automatic|manual"` attribute.

**hx-tab-panel** — host-canonical:
- `internals.role = 'tabpanel'` on host
- `internals.ariaLabelledByElements` projects controlling tab host as element reference (cross-shadow naming via IDL refs, no text serialization)
- Legacy fallback retains `setAttribute('role')` for back-compat

**Roving tabindex** — single-host. Active tab `tabindex=0`, inactive `tabindex=-1`. Focus moves to host (no longer dual button/host focus).

**CSS state hooks moved** from inner ARIA attributes (`[aria-selected]`/`[aria-disabled]`) to `:host([selected])` / `:host([disabled])` since aria-* is stripped from inner div on modern path. Functionally identical (same reactive state via `reflect: true`); more idiomatic for host-canonical.

**Cross-AT smoke test added** — asserts `document.activeElement === tab` (host), `internals.role === 'tab'`, and `internals.ariaSelected === 'true'` after `tab.focus()`. Validates the role-on-host with inner-activation pattern.

87 hx-tabs tests passing (was 83; +4 net new — ariaControlsElements, ariaLabelledByElements, host owns focus smoke, automatic activation attr; reframed several to host-canonical surface). 2 keyboard-navigation tabs section tests passing (re-pinned to `activation="automatic"` HTML for arrow-activation assertions).

`pnpm run verify` clean. helix-028 standing risk-accept.
