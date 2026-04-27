# HC Brand-Token Suppression Scope (3.3.0)

**Status:** design — implementation pending Jake's signoff per the planning rule.
**Target:** `@helixui/library@3.3.0` + `@helixui/tokens@3.3.0` (additive registry validation surface).
**Captured from:** Codex r33 finding 1 (high) on `7408c6694`, planning note `00-Planning/helix/HC brand-token suppression scope + replaceSync failure mode (deferred from 3.2.2).md`.
**Revision history:** R0 initial (codex flagged 3 high + 5 medium across both contracts in this branch); **R1 (this document)** — single comprehensive redesign closing the HC-relevant findings. Per the planning rule: redesign once, do not iterate.

## Sequencing relative to replaceSync hardening

This contract is **a prerequisite** for `REPLACESYNC_HARDENING_CONTRACT.md`. The replaceSync hardening contract assumes a categorized storage model in `HelixBrandRegistry` (its `register()` body calls `categorizeTokens(tokens)` before storing). Implementation order: HC split first (introduces categorization storage), replaceSync hardening second (adds value validation to the same `register()` pass). The two contracts are not independently mergeable at the storage layer — the replaceSync contract is shaped to compose onto the categorization model defined here.

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
| `--brand-layout-*` | `--brand-layout-sidebar-enabled`, `--brand-layout-rail-width` | Always merged (audited subprefix) |
| `--brand-logo-*` | `--brand-logo-width`, `--brand-logo-height`, `--brand-logo-padding` | Always merged (audited subprefix) |
| `--brand-spacing-*` | `--brand-spacing-content-pad`, `--brand-spacing-rail-gap` | Always merged (audited subprefix) |
| `--brand-typography-*` | `--brand-typography-display-family`, `--brand-typography-body-family` | Always merged (audited subprefix) |

**Why narrow `--brand-*` to audited subprefixes (R1).** R0 used a blanket `--brand-*` allowlist as the consumer-namespace escape hatch. Codex flagged this as an HC color-leak vector: a brand registering `--brand-color-foo` or `--brand-shadow-elevated` would be categorized as non-color (matches `--brand-*`, not `--hx-color-*`) and bypass HC suppression — silently breaching the WCAG 7:1+ contract. R1 narrows the consumer namespace to audited subprefixes that are semantically guaranteed not to carry color: `layout`, `logo`, `spacing`, `typography`. Color-bearing concepts under `--brand-*` (e.g. `--brand-color-*`, `--brand-shadow-*`, `--brand-gradient-*`, `--brand-overlay-*`) are explicitly **rejected** at registration with a clear error pointing to this contract — they have no legitimate HC-safe category and authoring them indicates the consumer should be using the framework `--hx-color-*` surface instead.

### Unknown tokens

A brand token whose name matches neither the color allowlist nor the non-color allowlist is "unknown." Policy depends on namespace:

The lookup is **mutually exclusive and ordered**: the first matching row wins. Reading the table top-to-bottom, the first row whose pattern matches the token name decides the policy.

| # | Pattern | Policy | Rationale |
| --- | --- | --- | --- |
| 1 | `--hx-*` (framework namespace) | **Reject at `register()`** with a clear error | Framework-namespace tokens are owned by HELiX. An unrecognized `--hx-*` token is either a typo (typo-and-suppress is silently wrong, especially for a11y-critical or layout-critical tokens) or a token introduced by a newer `@helixui/tokens` than the registry knows about. Both cases warrant explicit failure, not a safe-default. |
| 2 | `--brand-color-*`, `--brand-shadow-*`, `--brand-gradient-*`, `--brand-overlay-*` (color-bearing concepts under brand) | **Reject at `register()`** | Color-bearing concepts have no HC-safe categorization under `--brand-*`. The error directs the author to the framework `--hx-color-*` surface. **This row precedes row 3** so a token like `--brand-color-foo` matches here (reject) and never falls through to row 4 (warn). |
| 3 | `--brand-layout-*`, `--brand-logo-*`, `--brand-spacing-*`, `--brand-typography-*` (audited subprefixes) | **Allowed** per the table in the previous section | Audited subprefixes are the consumer-namespace escape hatch. |
| 4 | `--brand-*` (any other subprefix not matched by rows 2–3) | **Warn + treat as color** | Defaults to the safe HC behavior (suppression). The `console.warn` surfaces the gap so the brand author can rename to an audited subprefix or request the subprefix be added to the allowlist. |
| 5 | Anything else (no recognized prefix — neither `--hx-*` nor `--brand-*`) | **Reject at `register()`** | Tokens outside both `--hx-*` and `--brand-*` namespaces are not part of the HELiX token surface. The registry is not a generic CSS variable store. |

The "warn + treat as color" branch is now scoped narrowly to the `--brand-<other>-*` consumer-namespace gap. The `--hx-*` framework namespace gets strict rejection — there is no a11y-critical token that should silently get HC-suppressed because the registry didn't recognize its prefix.

The advisory message for the warn+treat-as-color branch uses the same `_lastBrandAdvisoryKey` deduplication channel introduced in 3.2.2:

> `[hx-theme] Brand "acme" registered token "--brand-cardstyle-radius" does not match an audited HC-safety subprefix. Defaulting to color-bearing (suppressed under HC). See HC_BRAND_TOKEN_SPLIT_CONTRACT.md for the audited allowlist.`

The rejection messages are loud and specific:

> `[HelixBrandRegistry] Brand "acme" token "--hx-foo-bar" is not a recognized framework token. Framework-namespace tokens are owned by HELiX; an unrecognized name is either a typo or an unsupported token. See HC_BRAND_TOKEN_SPLIT_CONTRACT.md.`

> `[HelixBrandRegistry] Brand "acme" token "--brand-color-accent" uses a color-bearing concept under the --brand-* namespace. Color-bearing tokens belong to the framework --hx-color-* surface. See HC_BRAND_TOKEN_SPLIT_CONTRACT.md.`

### Re-registration atomicity (R1 close of codex F8)

`register()` is atomic with respect to validation failures. The sequence:

1. Validate token presence (REQUIRED_SEMANTIC_TOKENS).
2. Validate token names (categorization + namespace rejection per the unknown-token policy).
3. Validate token values (replaceSync hardening contract — Path A).
4. Categorize and store.

If **any** of steps 1–3 throws, the registry's existing snapshot for `brandName` (if any) remains untouched. A failed re-registration does not corrupt the previously-stored brand. Subscribers (per the brand-reflection contract) are not notified on a failed registration — the registry was not mutated.

This is implemented by validating into a local working set first, then performing a single `_brands.set(brandName, categorized)` only after every check passes. There is no in-place partial mutation.

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

The HC branch shrinks because brand merge becomes universal — only the *content* of the merge varies by theme. Advisory state is committed **after** `replaceSync()` succeeds so a sheet-update failure does not leave logs/state ahead of the visually applied sheet (R1 close of codex F4 — see also `REPLACESYNC_HARDENING_CONTRACT.md` for the try/catch wrapper):

```
function _applyEffectiveTheme() {
  let css = _buildThemeCss(effectiveTheme);

  // Compute, but do not commit, the next advisory state.
  let nextAdvisoryKey = null;
  let pendingInfoLog = null;
  let pendingWarnLog = null;

  if (brand !== '') {
    if (registry.isRegistered(brand)) {
      css = mergeBrandTokens(css, brand, effectiveTheme === 'high-contrast');
      nextAdvisoryKey = effectiveTheme === 'high-contrast'
        ? `${brand}|high-contrast|color-suppressed`
        : `${brand}|${effectiveTheme}|applied`;
      if (effectiveTheme === 'high-contrast' && nextAdvisoryKey !== _lastBrandAdvisoryKey) {
        pendingInfoLog = '[hx-theme] Brand "X" color-bearing tokens suppressed on theme="high-contrast"; non-color tokens (typography, radius, layout) continue to apply.';
      }
    } else {
      nextAdvisoryKey = `${brand}|${effectiveTheme}|unregistered`;
      if (nextAdvisoryKey !== _lastBrandAdvisoryKey) {
        pendingWarnLog = '[hx-theme] Brand "X" is not registered. ...';
      }
    }
  }

  if (effectiveMotion === 'reduced') {
    css += `\n:host {\n${_buildProps(_reducedMotionOverrides)}\n}`;
  }

  // Try the sheet update. Per replaceSync hardening contract, this is wrapped
  // in try/catch as defense-in-depth. On failure, advisory state is NOT
  // committed; the previous sheet remains visually applied and the previous
  // advisory key remains accurate to that sheet.
  try {
    themeSheet.replaceSync(css);
  } catch (err) {
    console.error('[hx-theme] Theme sheet replaceSync threw: ...; sheet retained at last-good state. Advisory state NOT updated.');
    return;
  }

  // Sheet committed successfully — now commit advisory state and emit logs.
  _lastBrandAdvisoryKey = nextAdvisoryKey;
  if (pendingInfoLog) console.info(pendingInfoLog);
  if (pendingWarnLog) console.warn(pendingWarnLog);
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

Plus categorization edge cases (codex test gap closure + R1 closures):

- **Unknown `--hx-*` rejected**: brand registers with `--hx-foo-bar: 12px` (unrecognized framework token); `register()` throws with the framework-namespace rejection message. Brand is not stored.
- **`--brand-color-*` rejected**: brand registers with `--brand-color-accent: #ff0000`; `register()` throws with the color-bearing-under-brand rejection message. Brand is not stored.
- **Audited `--brand-*` subprefix accepted**: brand registers with `--brand-layout-rail-width: 64px`; categorized as non-color; merges under all themes including HC.
- **Unaudited `--brand-*` warn dedupe**: brand registers with `--brand-cardstyle-radius: 8px`; `register()` warns once per unknown token name (not per `register()` call). Two re-registrations with the same unaudited subprefix: one warn total.
- **Allowlist prefix match is left-to-right**: `--hx-color-mode-aware-thing` categorizes as color-bearing (matches `--hx-color-*`); `--brand-layout-foo` categorizes as non-color (matches `--brand-layout-*`). The prefix match runs left-to-right; the first matching prefix wins.
- **Empty non-color category**: brand registers exactly the 22 required colors. Non-color category is empty; `mergeBrandTokens()` under HC produces zero brand tokens, base HC applies; no error.
- **Re-registration atomicity**: brand "acme" is registered with valid mixed tokens. Re-registration of "acme" with one invalid token (e.g. unknown `--hx-foo-bar`) throws; `getBrandTokens('acme')` continues to return the original mixed token map; the applied sheet is unchanged.
- **Advisory state ordering**: when `replaceSync()` throws (forced via test hook), `_lastBrandAdvisoryKey` is NOT updated; subsequent reconcile that succeeds correctly emits the advisory transition relative to the previous (still-correct) state.

Total: 9 + 3 + 8 = 20 `it.todo()` cases on the test stub.

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
