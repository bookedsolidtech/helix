---
'@helixui/library': patch
'@helixui/tokens': patch
---

3.2.2 codex round-8 remediation — taxonomy honesty + fallback-chain canonicalization

Closes 4 codex round-8 findings on the staging→main candidate. Rolls into the same 3.2.2 patch — additive token rename only (no API change, no removed semantic).

- **#1 [high] Focus-ring fallback chain**: 20 `.styles.ts` files used `var(--hx-focus-ring-color, var(--hx-color-primary-600, #0f7078))`. Collapsed to `var(--hx-focus-ring-color, #0f7078)` — the inner semantic step was unreachable because consumers override `--hx-focus-ring-color` directly, never `--hx-color-primary-600`.
- **#2 [high] Taxonomy lie**: `--hx-color-border-on-dark-{default,subtle}` resolved to `overlay-white-30/10` (≈2.07:1 / 1.30:1) — translucent fills, not 3:1-capable borders. Renamed to `--hx-color-surface-on-dark-overlay-{default,subtle}` across base, dark, and HC tiers. `border-on-dark-strong` (overlay-white-70 / overlay-black-50, both ≥3:1) is the only border survivor. Repointed `hx-button` (4 fills) and `hx-side-nav` (toggle hover) to the new surface tokens.
- **#3 [medium] hx-button JSDoc drift**: `--hx-button-inverted-ghost-hover-bg` `@cssprop` claimed "≈ 5:1 vs neutral-900" — false. Now reads "translucent fill, not a border; contrast not applicable".
- **#4 [medium] Test gap**: Added a 3-tier structural-shape lock to `contrast.test.ts` that asserts `border.on-dark-*` contains exactly `['on-dark-strong']` and `surface.on-dark-overlay-*` contains exactly `['on-dark-overlay-default', 'on-dark-overlay-subtle']` across base + dark + high-contrast. Catches future taxonomy regressions in any tier.

Round-9 follow-up: extended the lock from base-only to all three tiers (caught by codex), and dropped numeric ratios from `hx-button.styles.ts` focus-visible comment (pointed at `tokens.json` as canonical). Codex round-10 verdict: pass, 0 findings.
