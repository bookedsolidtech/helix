---
'@helixui/library': patch
---

3.2.2 codex round-14 remediation — side-nav `@supports color-mix` chain fold + deprecated `@cssprop` restoration

Closes 3 codex round-14 findings (1 high, 2 medium) on the staging→main candidate. Rolls into the same 3.2.2 patch.

**Finding 1 [correctness high] — `hx-side-nav` `@supports color-mix()` block shadowed the round-12 deprecated-first chain.**

Round-12 added a deprecated-first fallback chain on `.side-nav__toggle:hover` so consumer overrides on either `--hx-color-border-on-dark-subtle` (3.2.0/3.2.1 published name) or `--hx-color-surface-on-dark-overlay-subtle` (canonical 3.2.2 name) reach paint. But the immediately-following `@supports (color: color-mix(...))` block unconditionally overwrote `background-color` with `color-mix(in srgb, currentColor 15%, transparent)` — making the round-12 fix dead code in any browser supporting `color-mix()` (~96% of the modern web).

**Fix:** Folded `color-mix()` into the variable chain as the final fallback arm so consumer overrides win on the modern path too:

```css
@supports (color: color-mix(in srgb, red 50%, blue)) {
  .side-nav__toggle:hover {
    background-color: var(
      --hx-color-border-on-dark-subtle,
      var(
        --hx-color-surface-on-dark-overlay-subtle,
        color-mix(in srgb, currentColor 15%, transparent)
      )
    );
  }
}
```

**Finding 2 [api-design medium] — Deprecated `@cssprop` entries dropped from CEM in a patch release.**

Round-8 renamed `--hx-color-border-on-dark-{default,subtle}` to `--hx-color-surface-on-dark-overlay-*`. Round-12 preserved consumer-override compatibility at the consume sites (deprecated-first fallback chain), but the `@cssprop` JSDoc on `hx-button.ts` and `hx-side-nav.ts` was *replaced* (not augmented) — public CEM/Storybook autodocs/IDE intellisense no longer documented the deprecated names. For a 3.x patch release that explicitly preserves the deprecated names through the runtime fallback chain until 4.0.0 removal, dropping them from the published API metadata is a consumer-facing surface reduction.

**Fix:** Re-added `@cssprop` entries with `DEPRECATED 3.2.2` markers and explicit removal guidance:

- `hx-button.ts` — added `--hx-color-border-on-dark-{subtle,default}` deprecated entries
- `hx-side-nav.ts` — added `--hx-color-border-on-dark-subtle` deprecated entry
- CEM regenerated; the Custom Elements Manifest now documents the deprecated names alongside the canonical replacements until 4.0.0.

**Finding 3 [test-gap medium] — Hover-skip justification invalidated by Finding 1.**

The `default` chain coverage comment in `dark-mode-resolution.test.ts` claimed the side-nav consume site was covered by "the same safety [grep + structural lock]" as the button rest-state tests. Pre-round-15, that premise was broken because the `@supports color-mix()` override bypassed the token chain entirely on the dominant runtime path — grep over the rest-state declaration could not detect that paint diverged under `:hover`.

**Fix:** Comment updated to reflect that post-round-15 fold, the `@supports`-gated override path also reads both deprecated and canonical names, restoring the documented safety. (Per Codex resolution path option (a) — once Finding 1 is fixed, the existing structural-shape lock + file-level grep coverage becomes valid.)
