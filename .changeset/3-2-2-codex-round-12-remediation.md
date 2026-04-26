---
'@helixui/library': patch
'@helixui/tokens': patch
---

3.2.2 codex round-12 remediation — consume-site backwards-compat + variant-shadow JSDoc/Storybook honesty

Closes 2 codex round-12 BLOCKING findings on the staging→main candidate. Rolls into the same 3.2.2 patch.

**Finding 1 [api-design high] — Round-11 alias direction broke the canonical override path.**

Round-11 added `border.on-dark-{default,subtle}` aliases at `:root` that resolved through the new `surface.on-dark-overlay-*` names. Round-12 proved that approach broken in two directions: not only did consumer overrides on the deprecated border name fail to reach paint (the round-12 finding), but a runtime test introduced this round caught a deeper issue — a `:root`-level alias `:root { --A: var(--B) }` freezes `--A` to `:root`'s `--B` at computed-value time per W3C css-variables-1 §3, so host-scoped overrides on the canonical name (`--B`) get shadowed by the `:root`-resolved value of `--A`. Round-11's alias broke the canonical override path.

**Resolution:** moved backwards-compatibility from the token tier to the consume sites.

- Reverted the `:root` alias declarations: `border.on-dark-{default,subtle}` are no longer emitted in `tokens.css` (base, dark, HC tiers). The published CSS variable names remain *settable* by consumers — they're simply not declared at `:root` anymore, which avoids the computed-value-time freeze.
- Every component rule that paints with `surface.on-dark-overlay-*` now reads both names via a deprecated-first fallback chain:

  ```
  var(--hx-color-border-on-dark-default,
    var(--hx-color-surface-on-dark-overlay-default, rgba(255, 255, 255, 0.3)))
  ```

  Touched: `hx-button.styles.ts` (4 inverted-variant fills — secondary hover, tertiary rest [-subtle], tertiary hover, ghost hover, outline hover) and `hx-side-nav.styles.ts` (`.side-nav__toggle:hover` background).

- Override semantics now (until 4.0.0 removal):
  - Consumer override on the deprecated `--hx-color-border-on-dark-{default,subtle}` (anywhere in the cascade) → wins.
  - Consumer override on the canonical `--hx-color-surface-on-dark-overlay-{default,subtle}` → wins (deprecated name is undefined at `:root`, falls through).
  - No override → canonical `:root` value applies via the fallback chain.

- Round-11's structural-shape lock in `contrast.test.ts` was the wrong shape — it pinned the deprecated aliases at `:root`. Updated to assert `border.on-dark-*` contains exactly `['on-dark-strong']` across all 3 tiers; surface lock unchanged.

- Two paint-level regression tests added to `dark-mode-resolution.test.ts`:
  - consumer override on the deprecated `--hx-color-border-on-dark-subtle` reaches `hx-button[variant="tertiary"][inverted]` background in light + dark
  - consumer override on the canonical `--hx-color-surface-on-dark-overlay-subtle` still reaches paint when the deprecated name is unset (proves the both-name chain falls through correctly for new consumers)

  `hx-side-nav` uses identical syntax verbatim — covered by the syntactic shape lock plus file-level grep, not duplicated as a runtime test because `:hover` synthesis isn't this file's testing pattern.

**Finding 2 [api-design medium] — `--hx-button-bg` JSDoc and Storybook contradicted runtime.**

Every `.button--{variant}` rule rebinds `--hx-button-bg` at descendant scope, which shadows any host-level override. The JSDoc at `hx-button.ts:38` and the CSS-properties Storybook story (`hx-button.stories.ts`) advertised `style="--hx-button-bg: #059669"` as the override path for primary buttons — every consumer following that guidance got a no-op.

Fixed:
- `hx-button.ts:38` `@cssprop` description rewritten to flag variant-shadowing explicitly and direct consumers to the upstream semantic (`--hx-color-action-{variant}-bg{,-inverted-rest}`) for variant fills. Notes that `--hx-button-bg` still works for unstyled base buttons and participates in the internal hover/active rebinding chain.
- `hx-button.stories.ts` CSS-properties demo: replaced the broken `--hx-button-bg` example with `--hx-color-action-primary-bg` (the actually-working override path); updated the trailing `<pre>` Usage block to scope to `[variant='primary']` and use the semantic token.

Out of scope for `hx-library`: `apps/docs/src/content/docs/guides/theming.mdx:33` and `apps/docs/src/content/docs/extending/theming-quick-start.md:111-133` carry the same misleading example. Tracked as a follow-up; per-CLAUDE.md scope rules, `apps/` changes don't ride this PR.
