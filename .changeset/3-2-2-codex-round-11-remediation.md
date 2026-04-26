---
'@helixui/tokens': patch
'@helixui/library': patch
---

3.2.2 codex round-11 remediation — backwards-compat aliases + variant override-path documentation

Closes 2 medium codex round-11 findings on the staging→main candidate. Rolls into the same 3.2.2 patch.

**Finding 2 [api-design] — Backwards-compat aliases for renamed border-on-dark tokens.**

`--hx-color-border-on-dark-default` and `--hx-color-border-on-dark-subtle` shipped in `@helixui/tokens@3.2.0` and `@3.2.1`. Round-8 renamed them to `--hx-color-surface-on-dark-overlay-{default,subtle}` because the original names lied about their behavior — translucent fills, never borders, sub-3:1 alpha. A patch-level rename without aliases would silently break any consumer theme that set the old names as overrides.

Restored the old names in `tokens.json` as deprecated aliases that resolve through the new surface tokens across all three tiers (base / dark / high-contrast). `dist/tokens.css` now emits both name pairs, so existing consumer overrides continue to apply unchanged. Marked deprecated in description fields; removal scheduled for 4.0.0.

The round-8 structural-shape lock in `contrast.test.ts` was extended to:
- assert the new `border.on-dark-*` shape `['on-dark-default', 'on-dark-strong', 'on-dark-subtle']` across all 3 tiers
- assert each alias resolves through the surface namespace (catches any future regression that re-introduces a non-aliased border under that name with raw sub-3:1 alpha).

**Finding 1 [api-design] — Inverted-primary override path documentation.**

Codex flagged that the new `:host([inverted]) .button--primary` rest-state rule binds `--hx-button-bg` at descendant scope, shadowing host-level consumer overrides of that property. Investigation found:

- This shadow behavior is the **established variant convention** across the entire `hx-button` cascade. Every `.button--{variant}` rule (light primary at line 89, danger at line 120, secondary, tertiary, ghost) binds `--hx-button-bg` directly with the same descendant-scope shadowing. The new inverted-primary rest rule matches this convention symmetrically.
- The documented consumer override path for any `--hx-color-action-{variant}-bg*` paint is the upstream semantic, not `--hx-button-bg`. For inverted-primary at rest, that's `--hx-color-action-primary-bg-inverted-rest` (parallel to light primary's `--hx-color-action-primary-bg`).
- An attempted "cascade-preserving self-fallback" form `var(--hx-button-bg, var(--semantic, hex))` was implemented and reverted: per W3C css-variables-1 §3, a custom property referencing itself in its own value forms a cycle and becomes invalid at computed-value time. The attempted fix would have invalidated `--hx-button-bg` entirely, breaking the documented semantic override path that `dark-mode-resolution.test.ts` pins.

Resolution: kept the direct-binding form, expanded the inline comment to cite the variant convention and the override-path test that pins it. The original 3.2.2 changeset's "consumers must override the upstream semantic" wording remains accurate but is reframed here as documenting an existing pattern rather than introducing a new restriction. No source change to the rule itself; the override path was, and remains, `--hx-color-action-primary-bg-inverted-rest`.
