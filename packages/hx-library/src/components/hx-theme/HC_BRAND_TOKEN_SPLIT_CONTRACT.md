# HC Brand-Token Suppression Scope (3.3.0)

**Status:** design — implementation pending Jake's signoff per the planning rule.
**Target:** `@helixui/library@3.3.0` + `@helixui/tokens@3.3.0` (additive registry validation surface).
**Captured from:** Codex r33 finding 1 (high) on `7408c6694`, planning note `00-Planning/helix/HC brand-token suppression scope + replaceSync failure mode (deferred from 3.2.2).md`.

## Why this exists

Today, `_applyEffectiveTheme()` skips `mergeBrandTokens()` entirely when `effectiveTheme === 'high-contrast'`. The HC suppression is total — every token in the brand's `Record<string, string>` is dropped, regardless of whether it carries color contrast risk.

The current rationale (preserved verbatim in `hx-theme.ts:453-461`):

> "Brand merge is skipped on high-contrast mode. Brands declare 22 color stops (primary + secondary 50..950) but the HC `tokens.json` block overlays only the AAA-tuned subset (primary 500/600/700, secondary 500/600). Merging brand tokens then re-overlaying HC would still leak the 17+ brand-supplied stops HC does not redefine — components that consume those stops directly (hx-checkbox, hx-tag, hx-list-item, etc.) would silently break the BRAND_THEMING.md 'WCAG 7:1+' contract."

That rationale is sound for color-bearing tokens. It is wrong for non-color tokens. WCAG 1.4.6 governs **color contrast**. Typography, radius, spacing, layout flags, and density tokens have no contrast bearing — suppressing them under HC harms low-vision users (who lose the brand's typography, radius, and layout) without delivering any contrast benefit.

A brand can legitimately carry tokens beyond the 22 required color stops:

- **Typography**: `--hx-font-family-sans`, `--hx-font-family-serif`, `--hx-font-family-mono`, weight scales.
- **Radius**: `--hx-border-radius-sm/md/lg`, brand-flat-vs-rounded preference.
- **Spacing / density**: `--hx-spacing-*` overrides per brand density preference.
- **Layout flags**: `--brand-sidebar-enabled`, `--brand-logo-width`.

`HelixBrandRegistry.register()` currently accepts any `Record<string, string>` — it validates only that the 22 `REQUIRED_SEMANTIC_TOKENS` are present. The rest of the token surface is unconstrained. Today's "total suppression" is a blunt instrument because the registry does not know which tokens are color and which are not.

## The contract

The runtime splits brand tokens into two HC-safety categories at registration:

1. **Color-bearing** — tokens whose values carry color contrast risk under HC. Suppressed under HC.
2. **Non-color** — tokens whose values carry no contrast risk. Always merged, including under HC.

Categorization is performed at `HelixBrandRegistry.register()` time and cached on the `BrandTokenSet` record. `mergeBrandTokens()` accepts an HC flag and filters category 1 when set.

### Category boundaries

The registry uses a **token-name allowlist** for non-color tokens. The allowlist is the categorization gate — adding a new non-color token requires a registry update, which is the right friction for an architectural decision.

**Color-bearing tokens (suppressed under HC).** Any token whose CSS custom property name matches:

- `--hx-color-*` — full color ramp surface (primary, secondary, tertiary, surface, text, border).
- `--hx-shadow-*` — shadows are typically color-bearing (`rgba(0,0,0,…)` / `oklch(… / α)` values).
- `--hx-overlay-*` — scrim/overlay tokens.
- `--hx-gradient-*` — gradient stops.

**Non-color tokens (always merged).** The allowlist is bounded to the categories below. Brands may register tokens outside this list, but they are treated as **unknown** — see "Unknown tokens" below.

| Prefix | Examples | HC behavior |
| --- | --- | --- |
| `--hx-font-*` | `--hx-font-family-sans`, `--hx-font-family-serif`, `--hx-font-weight-*`, `--hx-font-size-*` | Always merged |
| `--hx-line-height-*` | `--hx-line-height-tight/normal/relaxed` | Always merged |
| `--hx-letter-spacing-*` | `--hx-letter-spacing-tight/normal/wide` | Always merged |
| `--hx-border-radius-*` | `--hx-border-radius-sm/md/lg/xl/full` | Always merged |
| `--hx-border-width-*` | `--hx-border-width-thin/medium/thick` | Always merged (color of the border is decided elsewhere) |
| `--hx-spacing-*` | `--hx-spacing-1/2/3/...` | Always merged |
| `--hx-density-*` | `--hx-density-comfortable/compact/spacious-*` | Always merged |
| `--hx-z-index-*` | `--hx-z-index-dropdown/modal/...` | Always merged |
| `--hx-transition-*` | `--hx-transition-fast/normal/slow`, easing tokens | Always merged |
| `--hx-easing-*` | timing functions | Always merged |
| `--hx-blur-*` | `--hx-blur-sm/md/lg` | Always merged (blur radius, no color) |
| `--brand-*` | brand-namespace layout flags (`--brand-sidebar-enabled`, `--brand-logo-width`) | Always merged |

### Unknown tokens

A brand token whose name matches **neither** the color allowlist nor the non-color allowlist is "unknown." Three policy options were considered:

| Option | Behavior | Trade-off |
| --- | --- | --- |
| **Reject** | `register()` throws on unknown token | Strict; forces every consumer to update when the allowlist evolves |
| **Warn + treat as color** | `console.warn` on unknown; suppress under HC (safe default) | Lenient at registration; defaults to safety |
| **Warn + treat as non-color** | `console.warn` on unknown; merge under HC | Defaults to leakage risk |

**Decision: warn + treat as color (option 2).** The HC contract is a contrast guarantee — a token whose category is unknown gets the safe-default behavior (suppressed under HC). The console.warn surfaces the categorization gap so the brand author can either rename the token to fall under an allowlisted prefix or contribute the prefix back to the allowlist. This matches the existing "unregistered brand → warn + apply base theme only" pattern.

Rejection (option 1) is too strict for a token surface that legitimately evolves. Treating-as-non-color (option 3) inverts the contract's safety bias.

The advisory message uses the same `_lastBrandAdvisoryKey` deduplication channel introduced in 3.2.2:

> `[hx-theme] Brand "acme" registered token "--unknown-token" does not match any HC-safety category. Defaulting to color-bearing (suppressed under HC). See HC_BRAND_TOKEN_SPLIT_CONTRACT.md for allowlist.`

### Categorization data model

`HelixBrandRegistry` stores categorized tokens internally. The public `getBrandTokens()` API returns the merged map (unchanged surface — backward-compatible). A new internal API surfaces the split for `mergeBrandTokens()`:

```ts
interface CategorizedBrandTokens {
  colorBearing: Readonly<BrandTokenMap>;
  nonColor: Readonly<BrandTokenMap>;
  unknown: Readonly<BrandTokenMap>;  // empty unless option 2 fires
}

// Internal — used by hx-theme.ts only.
HelixBrandRegistry._getCategorizedTokens(brandName: string): CategorizedBrandTokens | undefined;
```

The categorization runs once at `register()` time. Re-registration re-categorizes. The category caches are keyed by token-name match against the allowlists above.

`mergeBrandTokens(css, brandName, isHighContrast)` (signature change — accepts brand name + HC flag instead of pre-fetched token map):

```
function mergeBrandTokens(css, brandName, isHighContrast) {
  categorized = registry._getCategorizedTokens(brandName);
  if (!categorized) return css;  // unregistered — caller already warned

  let merged = { ...categorized.nonColor };
  if (!isHighContrast) {
    merged = { ...merged, ...categorized.colorBearing };
  }
  // Unknown tokens go to color-bearing per the safe-default policy.
  if (!isHighContrast) {
    merged = { ...merged, ...categorized.unknown };
  }
  // HC: unknown tokens are dropped alongside color-bearing.

  return appendBrandLayer(css, merged);
}
```

## Updated `_applyEffectiveTheme()` shape

The HC branch shrinks because brand merge becomes universal — only the *content* of the merge varies by theme:

```
function _applyEffectiveTheme() {
  let css = _buildThemeCss(effectiveTheme);

  if (brand !== '') {
    if (registry.isRegistered(brand)) {
      css = mergeBrandTokens(css, brand, effectiveTheme === 'high-contrast');
      // Advisory channel: applied vs partially-applied (HC).
      lastBrandAdvisoryKey = effectiveTheme === 'high-contrast'
        ? `${brand}|high-contrast|color-suppressed`
        : `${brand}|${effectiveTheme}|applied`;
      // HC info log: emit when transitioning into HC with a registered brand.
      if (effectiveTheme === 'high-contrast' && lastBrandAdvisoryKey changed) {
        console.info('[hx-theme] Brand "X" color-bearing tokens suppressed on theme="high-contrast"; non-color tokens (typography, radius, layout) continue to apply.');
      }
    } else {
      // Unregistered — base theme only, warn dedupe per existing pattern.
      lastBrandAdvisoryKey = `${brand}|${effectiveTheme}|unregistered`;
      console.warn('[hx-theme] Brand "X" is not registered. ...');
    }
  } else {
    lastBrandAdvisoryKey = null;
  }

  if (effectiveMotion === 'reduced') {
    css += `\n:host {\n${_buildProps(_reducedMotionOverrides)}\n}`;
  }

  themeSheet.replaceSync(css);
}
```

The current logic's two branches (`brand !== '' && !HC` / `brand !== '' && HC`) collapse into a single branch with the HC flag passed to `mergeBrandTokens`.

## Test matrix

3 themes × 3 brand shapes = 9 row cases.

| # | Theme | Brand shape | Expected merged tokens |
| --- | --- | --- | --- |
| 1 | `light` | color-only (22 required color tokens, nothing else) | All 22 color tokens applied |
| 2 | `dark` | color-only | All 22 color tokens applied |
| 3 | `high-contrast` | color-only | None applied (color suppressed under HC); base HC overlay applies |
| 4 | `light` | mixed (22 colors + typography + radius + 1 unknown) | All applied (color + non-color + unknown) |
| 5 | `dark` | mixed | All applied |
| 6 | `high-contrast` | mixed | Typography + radius applied; color + unknown suppressed |
| 7 | `light` | non-color-only (typography + radius, 22 color tokens missing) | Registration throws (REQUIRED_SEMANTIC_TOKENS still required) |
| 8 | `dark` | non-color-only | Registration throws |
| 9 | `high-contrast` | non-color-only | Registration throws |

Cases 7-9 verify the existing 22-required-tokens contract is preserved — non-color-only is not a legitimate brand. The required-tokens validation runs **before** categorization. A brand that registers must still satisfy the color-ramp baseline.

Plus state transitions:

- **`light` → `high-contrast`** with mixed brand: color-bearing tokens drop, non-color persist; advisory transitions to `color-suppressed`.
- **`high-contrast` → `light`** with mixed brand: color-bearing tokens re-apply; advisory transitions to `applied`.
- **`brand="acme"` (mixed) → `brand="other"` (color-only)** under HC: non-color tokens from `acme` drop, base HC overlay applies, no merge from `other` (color suppressed).

Plus categorization edge cases (codex test gap closure):

- **Unknown token warn dedupe**: brand registers with one unknown token; `register()` warns once per unknown token name (not per `register()` call). Two re-registrations with the same unknown token: one warn total.
- **Allowlist prefix match is exact**: `--hx-color-something` is color-bearing (matches `--hx-color-*`); `--hx-color-mode-aware-thing` is also color-bearing; `--brand-color-foo` is non-color (matches `--brand-*`, not `--hx-color-*`). The prefix match runs left-to-right; the first matching prefix wins.
- **Empty token map after categorization**: brand registers exactly the 22 required colors. Non-color category is empty; `mergeBrandTokens()` under HC produces zero brand tokens, base HC applies; no error.

Total: 9 + 3 + 3 = 15 `it.todo()` cases on the test stub.

## Migration

This is a **backward-compatible** change for brands that register only the 22 required color tokens (Helix's documented baseline). Such brands hit the same suppression behavior under HC as today.

Brands that register additional tokens behave differently under HC:

- 3.2.x: all tokens dropped.
- 3.3.0: color-bearing tokens dropped; non-color tokens kept.

This is a behavior change at the runtime layer, but the registration API surface is unchanged for brands that follow the documented baseline. The minor bump on `@helixui/tokens` is for the new `_getCategorizedTokens()` internal API and the categorization metadata; no public API breaks.

The `BRAND_THEMING.md` doc adds:

- A "Token categories under HC" section listing color-bearing vs non-color allowlists.
- A migration note for brands that register layout/typography tokens — what the HC behavior change means for their UI.

The `multi-brand-theming.md` HC callout updates from:

> "the brand-specific token merge is suppressed"

to:

> "the brand-specific COLOR token merge is suppressed; non-color brand tokens (typography, radius, layout) continue to apply, including under high-contrast."

## Out-of-scope (intentionally)

- **Sheet-update error recovery** — sibling 3.3.0 work, see `REPLACESYNC_HARDENING_CONTRACT.md` in this directory. The HC split contract assumes `replaceSync()` succeeds; the failure-mode contract handles the malformed-CSS path.
- **CSS value validation at `register()` time** — overlaps with replaceSync hardening. The current contract validates token *names* (presence in REQUIRED_SEMANTIC_TOKENS, allowlist match for category) but not token *values* (no CSS syntax check). Value validation lives in the replaceSync contract.
- **Per-token HC override** — a brand could conceivably want to declare "this typography token IS HC-relevant, suppress it." The contract does not support per-token category overrides; the allowlist is the single source of truth. If this becomes a real requirement, extend with a `categoryOverrides: Record<string, 'color' | 'non-color'>` parameter on `register()`. Out of scope for 3.3.0.

## Approval gate

Same shape as the brand-reflection contract: this document is the gate. Implementation begins after Jake confirms:

- The color-bearing prefix list (`--hx-color-*`, `--hx-shadow-*`, `--hx-overlay-*`, `--hx-gradient-*`) covers the right surfaces.
- The non-color allowlist captures the legitimate brand token categories without gaps.
- The "warn + treat as color" unknown-token policy is the right safety bias (vs reject or treat-as-non-color).
- The 9-case matrix expected outcomes are correct.
- The advisory dedupe channel reuses `_lastBrandAdvisoryKey` cleanly.
