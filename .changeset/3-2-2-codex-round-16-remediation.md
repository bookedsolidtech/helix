---
'@helixui/library': patch
---

3.2.2 codex round-16 remediation — `hx-theme` HC injection sourced from tokens.json (no more hand-written drift)

Closes 2 codex round-15 findings (1 high, 1 medium) on the staging→main candidate. Rolls into the same 3.2.2 patch.

**Finding 1 [correctness high] — `hx-theme` `_hcOverrides` array drifted from `tokens.json` `high-contrast` block.**

`hx-theme.ts` had two divergent injection paths: `dark` consumed `darkTokenEntries` from `@helixui/tokens` (auto-derived from `tokens.json`), but `high-contrast` consumed a handwritten `_hcOverrides` array with the comment "kept in sync manually." 3.2.2 added new HC tokens to `tokens.json` (`color.primary.{500,600,700}`, `color.error.{500,600}`, `color.success.{500,600}`, `color.warning.{500,600}`, `color.info.{500,600}`, `color.text.on-{primary,error,success}-strong`, `color.surface.{success,warning,danger,info}-strong`, `color.surface.on-dark-overlay-{default,subtle}`, `color.border.on-dark-strong`, `color.action.danger.bg-active`, plus border-width and focus-ring tier overrides) but never added them to `_hcOverrides`. Result: `<hx-theme theme="high-contrast"><hx-button variant="primary" inverted>` continued to paint the light-theme teal because `--hx-color-action-primary-bg-inverted-rest` was never overridden under HC — the var chain fell through to the hex fallback.

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
