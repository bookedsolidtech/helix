---
'@helixui/library': patch
---

3.2.2 codex round-16..round-25 remediation — `hx-theme` HC injection sourced from tokens.json (no more hand-written drift), brand merge suppressed on high-contrast to preserve the WCAG 7:1+ contract, and the suppression advisory deduped to fire once per applied state.

Closes codex round-15..round-25 findings (correctness, test-gap, api-design, doc-drift) on the staging→main candidate. Rolls into the same 3.2.2 patch.

**Finding 1 [correctness high] — `hx-theme` `_hcOverrides` array drifted from `tokens.json` `high-contrast` block.**

`hx-theme.ts` had two divergent injection paths: `dark` consumed `darkTokenEntries` from `@helixui/tokens` (auto-derived from `tokens.json`), but `high-contrast` consumed a handwritten `_hcOverrides` array with the comment "kept in sync manually." 3.2.2 added new HC tokens to `tokens.json` (`color.primary.{500,600,700}`, `color.error.{500,600}`, `color.success.{500,600}`, `color.warning.{500,600}`, `color.info.{500,600}`, `color.text.on-{primary,error,success}-strong`, `color.surface.{success,warning,danger,info}-strong`, `color.surface.on-dark-overlay-{default,subtle}`, `color.border.on-dark-strong`, `color.action.danger.bg-active`, plus border-width and focus-ring tier overrides) but never added them to `_hcOverrides`. Result: `<hx-theme theme="high-contrast"><hx-button variant="primary" inverted>` continued to paint the light-theme teal. The chain `--hx-color-action-primary-bg-inverted-rest` → `var(--hx-color-primary-500)` (defined in `tokens.json`) resolved against the light primitive `--hx-color-primary-500` (`#429797`) because no HC override existed for that primitive — the HC layer never reached the inverted-rest token at all.

**Fix:** Replaced `_hcOverrides` consumption with `highContrastTokenEntries` import from `@helixui/tokens` (mirrors the dark-mode pattern). Source-of-truth and runtime are now the same array, derived from `tokens.json`. Drift is structurally impossible.

```ts
} else if (theme === 'high-contrast') {
  // Apply HC overrides on top of light primitives — distinct WCAG 7:1+ token set
  // sourced from tokens.json `high-contrast` block via highContrastTokenEntries.
  // Mirrors the dark-mode injection path so source/runtime drift is structurally impossible.
  const merged = new Map(lightMap);
  for (const t of highContrastTokenEntries) {
    merged.set(t.name, t.value);
  }
  css = `:host {\n${_buildProps(merged)}\n  color-scheme: dark;\n}`;
}
```

The 49-entry `_hcOverrides` array has been deleted.

**Finding 2 [test-gap medium] — `contrast.test.ts` HC assertions never exercised the runtime injector.**

The new HC contrast assertions in `packages/hx-tokens/src/__tests__/contrast.test.ts` validated `tokens.json` directly via `buildModeMap('high-contrast')`, but never mounted `<hx-theme theme="high-contrast">` to verify the runtime injection path. Library-side regression coverage in `dark-mode-resolution.test.ts` only mounted light + dark, never HC. CI was structurally incapable of catching Finding 1.

**Fix:** Added `injects HC palette overrides (primary/error/success ramps) sourced from tokens.json` test in `hx-theme.test.ts`. Mounts `<hx-theme theme="high-contrast">` and asserts computed style values for new 3.2.2 HC tokens (`--hx-color-primary-500` → `#3B82F6`, `--hx-color-error-500` → `#F87171`, `--hx-color-success-500` → `#4ADE80`, `--hx-color-border-on-dark-strong` → `#FFFFFF`). Any future divergence between `tokens.json` and the runtime HC injection path will fail this test.

**Finding 3 [api-design high, codex round-20..round-21] — brand merge silently shadowed HC accessibility tokens.**

`_applyEffectiveTheme()` ran `mergeBrandTokens(css, brandTokens)` unconditionally, appending a later `:host` block that won via cascade. On `<hx-theme theme="high-contrast" brand="...">`, any name a brand redeclared (the full 22-stop primary/secondary ramps required by `HelixBrandRegistry.REQUIRED_SEMANTIC_TOKENS`) shadowed the HC overlay. A consumer registering a low-contrast brand silently broke the WCAG 1.4.6 Enhanced Contrast (7:1+) guarantee `apps/docs/src/content/docs/component-library/hx-theme.mdx` advertises for HC mode (the documented "WCAG 7:1+ contrast token overrides for low-vision users" behavior).

Round-20 attempted a re-overlay fix: re-emit the HC overlay as a third `:host` block AFTER the brand merge. Round-21 codex review caught that this only re-asserted the names present in `highContrastTokenEntries` (~5 of the 22 brand-required stops) — the other 17 stops (primary 50/100/200/300/400/800/900/950, secondary 50/100/200/300/400/700/800/900/950) still leaked through. Components consuming those stops directly (`hx-checkbox`, `hx-tag`, `hx-list-item`, `hx-date-picker`) would silently break the contract, defeating the round-20 fix.

**Fix:** Skip the brand merge entirely when `effectiveTheme === 'high-contrast'`. HC mode renders the base HC overlay with no brand layer above it — every brand-supplied stop is structurally suppressed, not partially re-overlaid:

```ts
if (this.brand !== '' && this.effectiveTheme !== 'high-contrast') {
  const brandTokens = HelixBrandRegistry.getBrandTokens(this.brand);
  if (brandTokens !== undefined) {
    css = mergeBrandTokens(css, brandTokens);
  } else {
    console.warn(`[hx-theme] Brand "${this.brand}" is not registered. ...`);
  }
} else if (this.brand !== '' && this.effectiveTheme === 'high-contrast') {
  // Validate registration even though brand is suppressed; emit info so the
  // suppression is observable in development.
  const brandTokens = HelixBrandRegistry.getBrandTokens(this.brand);
  if (brandTokens === undefined) {
    console.warn(`[hx-theme] Brand "${this.brand}" is not registered. ...`);
  } else {
    console.info(`[hx-theme] Brand "${this.brand}" is suppressed on theme="high-contrast" ...`);
  }
}
```

Brands continue to apply on light/dark themes unchanged. The R20 re-overlay block has been removed (skip-on-HC supersedes it).

Regression tests:
- `HC overlay wins over brand overrides on high-contrast theme` — registers a brand whose `--hx-color-primary-500` is sub-AA on `#000` and asserts the HC value (`#3B82F6`) wins, plus four HC a11y sentinels survive (focus-ring-width=3px, border-width-thin=2px, text.on-error-strong=#000000, action.danger.bg-active=#F87171).
- `HC suppresses brand merge across ALL 22 REQUIRED_SEMANTIC_TOKENS stops (data-driven)` — R24 replacement of the prior 4-stop sample. Registers a brand with `#FFFFFF` on every required stop and asserts every stop resolves to either the HC overlay value or the light primitive (never the brand white). R25 hardened the loop to fail loudly on `REQUIRED_SEMANTIC_TOKENS` drift instead of silently asserting `actual === ''`.
- `HC + brand + reduced motion triple stack — HC a11y survives, motion override applies` — exercises the full overlay stack and asserts the reduced-motion overlay actually applied (`--hx-duration-fast=0ms`, `--hx-transition-fast=0ms linear`, `--hx-easing-default=linear`).
- `brand on light theme overrides primary color (brand-merge-skip is gated on HC only)` — confirms brands still apply on light/dark, no regression.
- `emits console.info when a registered brand is suppressed under HC, warn for unregistered` — R24 lock-down with `expect(infoSpy).toHaveBeenCalledTimes(1)` / `expect(warnSpy).toHaveBeenCalledTimes(1)` to surface multi-emission regressions.

**R25 fix [correctness medium] — brand suppression advisory was firing 4× per HC+brand application.**

The `console.info` (and parallel "is not registered" `console.warn`) were emitted directly from `_applyEffectiveTheme()`. That method runs once per relevant property change (`theme`, `motion`, `brand`) plus on init, so a single `<hx-theme theme="high-contrast" brand="...">` mount fired the advisory four times. Surfaced by the new `toHaveBeenCalledTimes(1)` lock-down.

**Fix:** Added `_lastBrandAdvisoryKey: string | null` field. Each branch (light/dark unregistered warn, HC unregistered warn, HC suppressed info) computes a `${brand}|${effectiveTheme}|${kind}` key and emits only when the key changes. The no-brand `else` clears the key so a brand→unset→brand transition re-emits as expected. Emissions now fire exactly once per applied state transition.

**Documentation alignment:**
- `packages/hx-tokens/docs/BRAND_THEMING.md` — replaced "theme and brand are independent" claim with explicit HC-suppression rule.
- `packages/hx-library/src/components/hx-theme/hx-theme.ts` — `brand` JSDoc documents HC suppression and links to `BRAND_THEMING.md`.
- `packages/hx-library/src/components/hx-theme/hx-theme.twig` — `brand` parameter documented in the docblock with HC-suppression note plus the missing `{% if brand %}brand="..."{% endif %}` template binding (R24 finding 6).
- `packages/hx-library/src/components/hx-theme/hx-theme.stories.ts` — `brand` argType description rewritten to describe registry requirement, unregistered warn, and HC suppression info (R24 finding 3).
- `apps/docs/src/content/docs/component-library/hx-theme.mdx` — properties row + `:::caution` callout describe the registry path and HC suppression.
- `apps/docs/src/content/docs/extending/multi-brand-theming.md` — R24/R25: callout distinguishes the JS registry path (HC-safe via suppression) from the CSS-pattern (composes via cascade, must be HC-guarded). Tier-2 example, tier-3 diagram, and all three brand definitions (Harbor Health, St. Mary's, Northwell) updated to canonical `hx-theme[data-brand='...']:not([theme='high-contrast'])` selectors. Drupal `<body>` placement called out as requiring either JS registry or theme mirroring.
- Runtime emits `console.info` (deduped) when a registered brand is suppressed under HC; `console.warn` (deduped) when an unregistered brand name is supplied. Both are observable in development without spamming on every property tick.

**Additional R21 hardening:**
- `effectiveTheme` return type narrowed from `'light' | 'dark' | 'high-contrast' | 'auto'` to `'light' | 'dark' | 'high-contrast'`. The runtime body never returns `'auto'` (it resolves auto via `matchMedia`), so the prior type signature was a documentation lie. React wrapper `packages/hx-react/src/components/HxTheme/types.ts` regenerated to match.
- `CSSStyleSheet.replace()` (async) replaced with `replaceSync()` for both `_themeSheet` and `_densitySheet`. The async variant returned an unawaited promise resolved immediately by browsers, but exposed a race window where computed styles could read stale CSS during reflow. The sync variant has no such window and matches the synchronous-update contract `_applyEffectiveTheme()` already implies.
