---
'@helixui/library': minor
---

Audit 3.x remediation — security, accessibility, and API-ergonomics hardening (all non-breaking)

Security & distribution (workstream C):

- `hx-prose` gains an opt-in `sanitize` boolean and an injectable `sanitizer`
  hook (default off — the trust-upstream contract is preserved). When enabled it
  strips `script`/`style`/`iframe`/`object`/`embed`/`foreignObject`, `on*`
  handlers, and `javascript:`/`data:` URLs, re-running on light-DOM mutation.
- `hx-phi-field` gains an opt-in `strict` boolean: PHI set via the `data` HTML
  attribute is stripped, an `hx-phi-access` audit event (`attribute-exposure-refused`,
  no raw PHI) is dispatched, and a `console.error` surfaces the SSR misconfiguration
  in dev/test. It never throws from the lifecycle (which would destabilize a live
  field). The clipboard auto-clear timer now resets on every copy so the full
  window applies to the freshest PHI.

Accessibility & foundation (workstream D):

- `FocusMixin` adopted by `hx-button`, `hx-icon-button`, `hx-link`,
  `hx-copy-button`, `hx-textarea`, `hx-number-input`, `hx-slider`, and
  `hx-file-upload`: `focus()`/`blur()` delegate to the inner control and the
  components reflect `focused` / `focused-visible` styling hooks. The mixin's
  internal state/handlers are now `#private` so they cannot collide with a
  subclass's own members.
- `hx-form` and `hx-prose` self-heal the `--hx-*` token cascade in light-DOM /
  token-less contexts.

API ergonomics (workstream E):

- Legacy `size` attribute accepted as a deprecated alias for `hx-size` on 13
  non-form components (DEV-only deprecation warning; `hx-size` wins). Removal is
  parked for 4.0.
- `hx-icon-button` gains an `outline` variant; `hx-toggle-button` gains a
  `danger` variant.
- `mixinDelegatesAria` (with `AriaDelegationMixinInterface`, `AriaAttribute`) is
  now a public export for downstream component extension.
