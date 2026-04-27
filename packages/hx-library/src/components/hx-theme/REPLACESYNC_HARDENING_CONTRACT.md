# `replaceSync()` Failure-Mode Hardening (3.3.0)

**Status:** design — implementation pending Jake's signoff per the planning rule.
**Target:** `@helixui/library@3.3.0` + `@helixui/tokens@3.3.0` (additive validation surface).
**Captured from:** Codex r33 finding 2 (medium) on `7408c6694`, planning note `00-Planning/helix/HC brand-token suppression scope + replaceSync failure mode (deferred from 3.2.2).md`.

## Why this exists

`hx-theme.ts:509` and `:524` call `CSSStyleSheet.prototype.replaceSync()` to apply theme and density CSS strings to adopted stylesheets:

```ts
this._themeSheet.replaceSync(css);
this._densitySheet.replaceSync(css);
```

`replaceSync()` throws synchronously when the input contains malformed CSS (`oklch(invalid)`, unbalanced parens, control characters, mismatched quotes, etc.). The current code does not handle that throw. Three failure paths are reachable today:

1. **Brand registry accepts bad input.** `HelixBrandRegistry.register()` validates token *presence* (the 22 `REQUIRED_SEMANTIC_TOKENS` exist, are non-empty strings) but not token *value syntax*. A brand like:
   ```ts
   { '--hx-color-primary-500': 'oklch(invalid)' }
   ```
   passes registration. It throws at `replaceSync()` when `_applyEffectiveTheme()` tries to apply it.

2. **Future runtime-config injection.** Any pathway that adds tokens after registration (configuration overrides, theme-aware computed values) is unvalidated.

3. **Bootstrap-time data corruption.** A brand defined in JSON loaded from an external CMS, with a value that survives `JSON.parse` but not CSS parsing.

The synchronous throw aborts `_applyEffectiveTheme()` mid-call. The new theme sheet is left empty (or left in an inconsistent state, depending on browser engine behavior under partial-replace). The component renders without an active stylesheet for the new theme until the next reconcile event re-runs the path with a different (potentially still malformed) input.

There is no "degrade gracefully" path. There is no "fail at registration" path. The current code is **neither** fail-fast nor fault-tolerant — it is fault-vulnerable.

## Two paths considered

The planning note frames the choice clearly:

> "Choose one path explicitly. Don't ship both — pick fail-fast-at-registration OR degrade-at-application."

### Path A — fail fast at registration

`HelixBrandRegistry.register()` validates CSS value syntax for each token. Malformed values throw at registration, not application.

**Pro.** Failure surfaces at the brand author's bootstrap code, with a clear `Error("Brand 'acme' token --hx-color-primary-500 has invalid CSS value: 'oklch(invalid)'")`. The runtime never sees malformed input. `replaceSync()` cannot throw because every input has been validated.

**Pro.** Matches the existing registry validation pattern (presence + non-empty already throws at registration).

**Con.** Requires a CSS value validator. Design tokens are constrained values (hex colors, oklch, rgb, var(), unitless numbers, lengths with units). A regex-based validator covers the common surface; a full CSS parser is over-engineered.

**Con.** A regex-based validator can have false positives (rejects a value the browser would accept) or false negatives (accepts a value the browser rejects). False negatives defeat the purpose; false positives are a registration ergonomics issue.

### Path B — degrade gracefully at application

`replaceSync()` calls are wrapped in try/catch. On parse failure, retain the previous sheet contents and emit `console.error('[hx-theme] Theme sheet rejected: <err>; falling back to last-good sheet')`.

**Pro.** No new validator. Uses the browser's CSS parser as the source of truth (zero false positives or false negatives).

**Pro.** Component renders with last-good sheet, not empty. User-visible degradation is graceful.

**Con.** Registration is silent on bad input. The malformed token sits in the registry forever, throwing at every reconcile. Nobody learns about it until production, and even then only via console.error.

**Con.** "Last-good sheet" semantics under brand swap are ambiguous. If `brand="acme"` is good but `brand="bad"` is malformed, swapping to bad falls back to the acme sheet — the user sees acme branding when they expect bad branding (or no branding). The fallback is technically correct (last-good) but visually surprising.

### Decision: Path A (fail fast at registration)

Path A is the right choice for this contract because:

1. **The registry is the contract enforcer in 3.3.0.** The HC brand-token split contract (`HC_BRAND_TOKEN_SPLIT_CONTRACT.md`) introduces categorization at registration. Adding value validation in the same pass is architectural coherence — the registry validates names *and* values, not one or the other.

2. **The runtime stays simple.** `replaceSync()` cannot throw if every input has been validated. The sheet update path stays single-purpose; error recovery does not bloat the reconcile.

3. **Failure surfaces where authors can fix it.** A brand author registering at bootstrap gets an immediate exception with a clear message. They fix the token and move on. Path B's console.error in production is harder to track to its source.

4. **Path B's "last-good sheet" UX is unfixable.** Brand swaps that fall back are visually misleading. The user-facing failure mode of Path A (an exception at bootstrap that prevents the app from booting) is unambiguous; the user-facing failure mode of Path B (the wrong brand visually applies) is silently wrong.

Path B is *also* implemented as a defense-in-depth try/catch around `replaceSync()`, but it is the **fallback to fail-fast**, not the primary mechanism. If validation has a false negative (accepts a value the browser rejects), the try/catch catches it, logs, and surfaces via `console.error`. The contract is: the validator should never fail to catch real malformed values; the try/catch exists only to prevent runtime crashes when the validator is wrong.

## The validator

A small regex-based validator at `packages/hx-tokens/src/css-value-validator.ts`. Token values fall into a constrained set that does not require a full CSS parser:

```ts
type TokenValueCategory =
  | 'color-hex'        // #rgb, #rrggbb, #rrggbbaa
  | 'color-oklch'      // oklch(0.5 0.2 240) or oklch(0.5 0.2 240 / 0.5)
  | 'color-rgb'        // rgb(255 0 0) or rgb(255, 0, 0) or rgba(...)
  | 'color-hsl'        // hsl(...) or hsla(...)
  | 'color-named'      // 'red', 'transparent', 'currentColor'
  | 'length'           // 12px, 1.5rem, 100%, 0
  | 'unitless-number'  // 1.5, 0.25
  | 'duration'         // 200ms, 0.2s
  | 'easing'           // ease, linear, cubic-bezier(...)
  | 'font-family'      // 'Inter', sans-serif
  | 'font-weight'      // 400, normal, bold
  | 'var-reference'    // var(--other-token), var(--token, fallback)
  | 'shadow'           // 0 1px 3px rgba(0,0,0,0.1)
  | 'gradient'         // linear-gradient(...), radial-gradient(...)
  | 'identifier';      // unitless tokens like layout flags ('flat', 'rounded')

function validateTokenValue(
  tokenName: string,
  tokenValue: string,
): { valid: boolean; category: TokenValueCategory | 'unknown'; error?: string };
```

The validator is **permissive** — it only rejects values that are syntactically certain to be malformed (unbalanced parens, control characters, empty strings, embedded null bytes). Values that don't match a known category fall through to `'identifier'` (a permissive bucket for design-token-friendly free-form strings). The goal is **catch the obvious mistakes that throw at `replaceSync()`**, not enforce a strict grammar.

False-negative protection: the try/catch around `replaceSync()` is the safety net. If the validator misses a value the browser rejects, the try/catch logs and the sheet stays at last-good. This is acceptable as a fallback; not as the primary mechanism.

## Updated `register()` shape

```
function register(brandName, tokens) {
  if (brandName is empty) throw;
  if (presence validation fails) throw with REQUIRED_SEMANTIC_TOKENS message;

  // NEW: value validation pass.
  for each [name, value] in tokens:
    result = validateTokenValue(name, value);
    if (!result.valid) {
      throw new Error(
        `[HelixBrandRegistry] Brand "${brandName}" token "${name}" has invalid ` +
        `CSS value: "${truncate(value)}". ${result.error}. ` +
        `See REPLACESYNC_HARDENING_CONTRACT.md for accepted value formats.`
      );
    }

  // NEW: categorization pass (HC split contract).
  categorized = categorizeTokens(tokens);
  brands.set(brandName, categorized);
  notify(brandName);
}
```

## Updated `_applyEffectiveTheme()` / `_applyDensity()` shape

```
function _applyEffectiveTheme() {
  // ... build css per HC split contract ...

  try {
    themeSheet.replaceSync(css);
  } catch (err) {
    console.error(
      `[hx-theme] Theme sheet replaceSync threw: ${err.message}. ` +
      `This indicates a validator false-negative — please report. ` +
      `Sheet retained at last-good state.`
    );
    // Sheet is unchanged; the previous theme remains visually applied.
  }
}

// Same wrapper for _applyDensity().
```

The try/catch is **defense-in-depth, not the primary mechanism**. The validator catches the issue at registration. The try/catch only fires if the validator has a bug. The error message wording deliberately calls out "validator false-negative — please report" so the failure mode is observable and fixable in the validator, not normalized as "expected behavior."

## Test matrix

### Validator tests (`css-value-validator.test.ts` — new file)

Each token value category has positive and negative cases:

| Category | Positive | Negative |
| --- | --- | --- |
| color-hex | `#fff`, `#0F7078`, `#0f7078ff` | `#`, `#zz`, `#1234567` |
| color-oklch | `oklch(0.5 0.2 240)`, `oklch(0.5 0.2 240 / 0.5)` | `oklch(invalid)`, `oklch(0.5 0.2)` (missing hue), `oklch(` (unbalanced) |
| color-rgb | `rgb(255 0 0)`, `rgba(255, 0, 0, 0.5)` | `rgb(`, `rgb(255, 0)`, `rgb(zzz)` |
| color-named | `red`, `transparent`, `currentColor` | `flarble` (unknown name — falls to identifier, permissive) |
| length | `12px`, `1.5rem`, `100%`, `0` | `12pxx`, `1.5..rem`, control chars |
| duration | `200ms`, `0.2s` | `200`, `200secs` |
| var-reference | `var(--other)`, `var(--other, 1px)` | `var(`, `var(--other,)`  |
| identifier | `'flat'`, `'rounded'` | (no negative — identifier is the permissive bucket) |

Plus structural rejections (always invalid regardless of category):

- Empty string.
- Embedded null byte (`'foo\u0000bar'`).
- Unbalanced parentheses anywhere.
- Unbalanced quotes anywhere.
- Standalone `}` (CSS rule break attempt).

Total: ~30 `it.todo()` cases on the validator test stub.

### Integration tests (`hx-theme-replacesync-hardening.test.ts` — new file)

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Register brand with all 22 required colors valid | Registration succeeds |
| 2 | Register brand with one malformed color (`oklch(invalid)`) | Registration throws with token name + value snippet |
| 3 | Register brand with one malformed non-color token (`--hx-border-radius-md: 12pxx`) | Registration throws |
| 4 | Register brand with embedded null byte | Registration throws |
| 5 | Register brand with unbalanced parens in shadow token | Registration throws |
| 6 | Apply registered (validated) brand under light theme | `replaceSync()` does not throw; sheet applies |
| 7 | Apply registered brand under HC | `replaceSync()` does not throw; HC-suppressed sheet applies |
| 8 | Apply density change with valid tokens | `replaceSync()` does not throw |
| 9 | (Defense-in-depth) Force a malformed CSS string into `replaceSync()` via test hook | `console.error` fires, sheet unchanged from last-good |
| 10 | Re-registration with valid token map after a previously-rejected attempt | Succeeds; brand applies |

Plus state transitions:

- **Validation throw does not pollute registry.** Failed `register()` does not partially-store the brand; `isRegistered()` returns `false` after a throw.
- **Defense-in-depth try/catch does not loop.** A `replaceSync()` failure does not retrigger reconcile; the next reconcile event proceeds normally.

Total: 10 + 2 = 12 `it.todo()` cases on the integration test stub.

## Migration

This is a **breaking change for brands that registered malformed tokens** — but those brands were already broken at runtime; they just failed silently at `replaceSync()` instead of loudly at registration. The migration path is "fix your malformed values" — no API surface change for brands with valid tokens.

For brands with valid tokens, this is a **non-breaking change**. The only observable difference is that registration validates more, and the runtime never throws from `replaceSync()` (in the happy path).

`BRAND_THEMING.md` adds:

- A "Token value formats" section documenting the validator's accepted categories.
- A note that registration now validates values, not just presence.

## Out-of-scope (intentionally)

- **Full CSS grammar validation** — the regex validator is permissive by design. Edge values that the browser would reject (e.g. `oklch()` with out-of-range chroma) may still pass validation. The defense-in-depth try/catch is the safety net for browser-reject-but-validator-accept cases.
- **Async error reporting** — `replaceSync()` is synchronous; the try/catch is synchronous; errors surface via `console.error` immediately. No async error channel (event-bus, notification API) is added.
- **Validator extension API** — brands cannot register custom value categories. The validator's categories are fixed in 3.3.0. If brand authors hit a real-world value the validator rejects but the browser accepts, file a bug; do not extend.
- **Density token validation under `_applyDensity()`** — density tokens come from `tokens.json`, not the brand registry. They are presumed valid because they ship with `@helixui/tokens`. The defense-in-depth try/catch around `_applyDensity()`'s `replaceSync()` is the only protection; the validator does not run on density tokens.

## Approval gate

Same shape as the sibling contracts: this document is the gate. Implementation begins after Jake confirms:

- Path A (fail fast at registration) is the right primary mechanism vs Path B alone.
- The defense-in-depth try/catch around `replaceSync()` is acceptable as a fallback.
- The token value categories cover the surface (hex, oklch, rgb, hsl, named, length, duration, var-reference, font-family, font-weight, shadow, gradient, identifier).
- The validator's permissive bias (false negatives caught by try/catch; false positives must be rare) is the right trade-off.
- The 30 + 12 = 42 test stub cases pin the contract surface tightly enough.
