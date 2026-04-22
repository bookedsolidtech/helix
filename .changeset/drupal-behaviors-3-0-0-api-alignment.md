---
'@helixui/drupal-behaviors': major
---

BREAKING: Drupal behaviors realigned with the `@helixui/library@3.0.0` canonical component API. Consumers attaching to these behaviors must verify their integrations against the updated surface.

Changes:

- Behaviors wired to the consolidated `FormMixin` event surface — the 15 form-associated library components now share a single event contract; behaviors listening for per-component events must migrate to the mixin-level events documented in `docs/UPGRADING-TO-3.md` §7
- Component tag references corrected to match shipped element names (see commit `aef35b4c7`)
- Behaviors now consume `accessible-label` attribute writes where they previously wrote `aria-label` (library renamed the public attribute)
- Build pipeline added and types exported (FS-012) — package now ships type declarations under `dist/` for downstream TypeScript consumers

Peer-dependency range `"@helixui/library": "^2.1.2 || ^3.0.0"` remains backward-compatible with 2.x, so the major bump is documentation-forcing rather than semver-forcing.
