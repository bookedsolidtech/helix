---
'@helixui/library': patch
---

3.2.2 codex round-16 remediation — `hx-theme` HC injection sourced from tokens.json (no more hand-written drift)

Closes 3 codex round-15..round-21 findings (1 high correctness, 1 medium test-gap, 1 high api-design) on the staging→main candidate. Rolls into the same 3.2.2 patch.

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

`_applyEffectiveTheme()` ran `mergeBrandTokens(css, brandTokens)` unconditionally, appending a later `:host` block that won via cascade. On `<hx-theme theme="high-contrast" brand="...">`, any name a brand redeclared (the full 22-stop primary/secondary ramps required by `HelixBrandRegistry.REQUIRED_SEMANTIC_TOKENS`) shadowed the HC overlay. A consumer registering a low-contrast brand silently broke the WCAG 7:1+ guarantee `BRAND_THEMING.md` advertises for HC mode.

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
  // Validate registration even though brand is suppressed — preserves the
  // unregistered-brand warning so consumers still see misconfigurations.
  const brandTokens = HelixBrandRegistry.getBrandTokens(this.brand);
  if (brandTokens === undefined) {
    console.warn(`[hx-theme] Brand "${this.brand}" is not registered. ...`);
  }
}
```

Brands continue to apply on light/dark themes unchanged. The R20 re-overlay block has been removed (skip-on-HC supersedes it).

Regression tests:
- `HC overlay wins over brand overrides on high-contrast theme` — registers a brand whose `--hx-color-primary-500` is sub-AA on `#000` and asserts the HC value (`#3B82F6`) wins, plus four HC a11y sentinels survive (focus-ring-width=3px, border-width-thin=2px, text.on-error-strong=#000000, action.danger.bg-active=#F87171).
- `HC suppresses brand merge across non-HC-overlaid stops too (primary-50/100/800)` — registers a brand with `#FFFFFF` on every required stop and asserts (a) HC stops still win, (b) non-HC-overlaid stops (primary-50/100/800, secondary-700) do NOT match the brand value. Codifies that ALL 22 stops are suppressed, not just the HC-overlaid subset.
- `HC + brand + reduced motion triple stack — HC a11y survives, motion override applies` — exercises the full overlay stack and confirms motion overrides compose cleanly with HC suppression.
- `brand on light theme overrides primary color (brand-merge-skip is gated on HC only)` — confirms brands still apply on light/dark, no regression.

**Additional R21 hardening:**
- `effectiveTheme` return type narrowed from `'light' | 'dark' | 'high-contrast' | 'auto'` to `'light' | 'dark' | 'high-contrast'`. The runtime body never returns `'auto'` (it resolves auto via `matchMedia`), so the prior type signature was a documentation lie.
- `CSSStyleSheet.replace()` (async) replaced with `replaceSync()` for both `_themeSheet` and `_densitySheet`. The async variant returned an unawaited promise resolved immediately by browsers, but exposed a race window where computed styles could read stale CSS during reflow. The sync variant has no such window and matches the synchronous-update contract `_applyEffectiveTheme()` already implies.
