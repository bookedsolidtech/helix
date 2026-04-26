---
'@helixui/library': patch
---

3.2.2 codex round-16 remediation — `hx-theme` HC injection sourced from tokens.json (no more hand-written drift)

Closes 2 codex round-15 findings (1 high, 1 medium) on the staging→main candidate. Rolls into the same 3.2.2 patch.

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

**Finding 3 [api-design high, codex round-20] — brand merge silently shadowed HC accessibility tokens.**

`_applyEffectiveTheme()` ran `mergeBrandTokens(css, brandTokens)` unconditionally, appending a later `:host` block that won via cascade. On `<hx-theme theme="high-contrast" brand="...">`, any name a brand redeclared (entire primary/secondary ramps, sometimes more) shadowed the HC overlay. A consumer registering a low-contrast brand (e.g. `--hx-color-primary-500: #003DA5`, 2.21:1 on `#000`) silently broke the WCAG 7:1+ guarantee `BRAND_THEMING.md` advertises for HC mode.

**Fix:** When `effectiveTheme === 'high-contrast'`, re-emit the HC overlay as a third `:host` block AFTER the brand merge:

```ts
if (this.effectiveTheme === 'high-contrast') {
  const hcMap = new Map<string, string>();
  for (const t of highContrastTokenEntries) hcMap.set(t.name, t.value);
  css += `\n:host {\n${_buildProps(hcMap)}\n}`;
}
```

HC tokens always win on HC mode. Brands continue to override neutrals/primitives that are not HC-defined (the HC overlay only redeclares names from `tokens.json`'s `high-contrast` block; light primitives stay brandable). Light/dark brand behavior is unchanged.

Regression test (`HC overlay wins over brand overrides on high-contrast theme`) registers a brand whose `--hx-color-primary-500` is sub-AA on `#000` and asserts the HC value (`#3B82F6`) wins, plus four HC a11y sentinels survive (focus-ring-width=3px, border-width-thin=2px, text.on-error-strong=#000000, action.danger.bg-active=#F87171). Sister test (`brand on light theme overrides primary color`) confirms the re-overlay is correctly gated on HC and does not regress brand support on light/dark.
