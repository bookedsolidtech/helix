# `brand` → `data-brand` Auto-Reflection Contract (3.3.0)

**Status:** design — implementation pending Jake's signoff per planning note recommendation.
**Target:** `@helixui/library@3.3.0`
**Captured from:** PR #1597 codex rounds 26–29 (reverted), planning note `00-Planning/helix/Brand → data-brand Auto-Reflection (deferred from 3.2.2).md`.

## Why this exists

`<hx-theme>` exposes two parallel brand-override mechanisms:

1. **JS registry path** — `HelixBrandRegistry.register()` + `brand="X"` activates runtime token injection.
2. **CSS-pattern path** — author-supplied stylesheets matching `hx-theme[data-brand='X']:not([theme='high-contrast'])`.

Today only the Drupal Twig helper emits `data-brand` (when explicitly opted into via the `attributes` spread). Plain HTML / React / Angular / Vue consumers who set `brand="X"` get **zero** styling from CSS-pattern selectors. The runtime contract today (post-revert of R26–R29):

> "The runtime does not reflect `brand` to `data-brand`."
> — `apps/docs/src/content/docs/extending/multi-brand-theming.md:39`

This is correct as documented but inadequate as architecture: it forces every non-Twig consumer to maintain `data-brand` by hand and stay synchronized with `brand` across runtime swaps. R26–R29 attempted unconditional reflection and tripped on edge cases that codex surfaced one round at a time. The lesson from that loop, captured in the planning note: **design the full matrix before any code lands.** This document is that matrix.

## The four authoring shapes

| Shape | Author writes | Common origin |
|---|---|---|
| A | `<hx-theme brand="X">` (no `data-brand`) | Plain HTML / React / Angular / Vue, no SSR mirroring |
| B | `<hx-theme data-brand="X">` (no `brand`) | CSS-pattern-only consumers using cascade overrides without registering tokens |
| C | `<hx-theme brand="X" data-brand="X">` (matching) | Drupal Twig with `attributes: {'data-brand': brand}`, or any SSR that mirrors |
| D | `<hx-theme brand="X" data-brand="Y">` (mismatched) | SSR drift, stale page cache, hand-edited author markup |

## The contract

The runtime reconciles `data-brand` against `brand` whenever `brand` is non-empty. When `brand` is empty, the runtime does not touch `data-brand` at all — Shape B authoring is preserved.

Aggressive cleanup model (per planning note recommendation):

```
function reconcile(brand, effectiveTheme, isRegistered) {
  if (brand === '') {
    // Shape B authoring path.
    // The runtime never owned data-brand. Author/SSR/cascade authoritative.
    return NOOP;
  }

  // brand !== '' — runtime is the manager.

  if (effectiveTheme === 'high-contrast') {
    // Suppress data-brand under HC at every shape.
    // Why: external CSS-pattern stylesheets without :not([theme='high-contrast'])
    // would otherwise leak brand primitives into the HC overlay and break the
    // WCAG 7:1+ contract.
    REMOVE data-brand;
    return;
  }

  if (!isRegistered) {
    // brand is non-empty but not in the registry.
    // The JS registry path rejects the merge. If we LEAVE data-brand set, the
    // CSS-pattern path applies a half-merged brand (cascade overrides only,
    // no token-registry merge). That is the worst possible state — silently
    // broken color contrast with no console signal.
    REMOVE data-brand;
    return;
  }

  // brand !== '', light or dark theme, registered.
  // Shape A → set; Shape C → no-op (already matches); Shape D → overwrite.
  SET data-brand = brand;
}
```

## The 24-case matrix

Three themes × four shapes × two registration states (registered / unregistered) = 24 cases. Shape B does not depend on the registration state of the value already in `data-brand` (the runtime never reaches the registry on that path), so the four B rows are functional duplicates that nonetheless gate a regression: any future change must keep Shape B noop in all four conditions.

| # | Shape | `brand` initial | `data-brand` initial | Theme | Registered? | Expected `data-brand` after reconcile | Expected console |
|---|---|---|---|---|---|---|---|
| 1 | A | `acme` | `(none)` | `light` | yes | `acme` | (none) |
| 2 | A | `acme` | `(none)` | `light` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 3 | A | `acme` | `(none)` | `dark` | yes | `acme` | (none) |
| 4 | A | `acme` | `(none)` | `dark` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 5 | A | `acme` | `(none)` | `high-contrast` | yes | `(none)` | `info: Brand "acme" is suppressed on theme="high-contrast"` |
| 6 | A | `acme` | `(none)` | `high-contrast` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 7 | B | `''` | `acme` | `light` | yes (`acme` registered) | `acme` (untouched) | (none) |
| 8 | B | `''` | `acme` | `light` | no (`acme` not registered) | `acme` (untouched) | (none) |
| 9 | B | `''` | `acme` | `dark` | yes | `acme` (untouched) | (none) |
| 10 | B | `''` | `acme` | `dark` | no | `acme` (untouched) | (none) |
| 11 | B | `''` | `acme` | `high-contrast` | yes | `acme` (untouched) | (none) |
| 12 | B | `''` | `acme` | `high-contrast` | no | `acme` (untouched) | (none) |
| 13 | C | `acme` | `acme` | `light` | yes | `acme` (no change observed) | (none) |
| 14 | C | `acme` | `acme` | `light` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 15 | C | `acme` | `acme` | `dark` | yes | `acme` (no change observed) | (none) |
| 16 | C | `acme` | `acme` | `dark` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 17 | C | `acme` | `acme` | `high-contrast` | yes | `(none)` | `info: ... suppressed on theme="high-contrast"` |
| 18 | C | `acme` | `acme` | `high-contrast` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 19 | D | `acme` | `other` | `light` | yes (`acme` registered) | `acme` (overwrites `other`) | (none) |
| 20 | D | `acme` | `other` | `light` | no (`acme` not registered) | `(none)` | `warn: Brand "acme" is not registered` |
| 21 | D | `acme` | `other` | `dark` | yes | `acme` (overwrites `other`) | (none) |
| 22 | D | `acme` | `other` | `dark` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 23 | D | `acme` | `other` | `high-contrast` | yes | `(none)` | `info: ... suppressed on theme="high-contrast"` |
| 24 | D | `acme` | `other` | `high-contrast` | no | `(none)` | `warn: Brand "acme" is not registered` |

### Shape D under HC, registered (case 23) — note on stripping

The runtime strips both `acme` and `other` under HC. There is no daylight between "the registered brand was suppressed because of HC" and "a stale `other` value lingered from SSR" — both produce CSS-pattern leaks if left in place. Shape D consumers who want their author-supplied `other` value preserved across HC must adopt Shape B authoring (drop the `brand` attribute when `data-brand` is the only override desired).

### Shape B under HC (cases 11, 12) — note on guard responsibility

The runtime does not strip `data-brand` under HC when `brand=""`. The author opted into the cascade-only path; the HC guard is the author's responsibility (the canonical `:not([theme='high-contrast'])` selector form documented in `multi-brand-theming.md`). This preserves the existing Shape B contract — the runtime touching `data-brand` it never set would be the more surprising failure mode.

## State transitions

Beyond the initial-mount matrix, runtime swaps must remain coherent:

| Transition | Expected behavior |
|---|---|
| `brand="acme"` → `brand="other"` (both registered) | `data-brand` updates from `acme` → `other` (assuming light/dark theme) |
| `brand="acme"` → `brand=""` while runtime owns `data-brand` | Remove `data-brand` (runtime relinquishes management) |
| `brand="acme"` → `brand=""` when author-set `data-brand` was never overwritten (Shape B + brand briefly set?) | Edge case: NOT supported. Authoring shapes do not mix mid-flight. |
| `theme="light"` → `theme="high-contrast"` while `brand="acme"` registered | `data-brand="acme"` removed (HC suppression) |
| `theme="high-contrast"` → `theme="light"` while `brand="acme"` registered | `data-brand="acme"` re-set (HC exit) |
| `theme="auto"` resolving from `light` → `dark` via OS query | `data-brand` unchanged (both light and dark set it; the value is identical) |
| `theme="auto"` resolving from `light` → `dark` via OS where dark→hc would not happen — theme=auto cannot resolve to HC | n/a |

## Ownership tracking

The runtime maintains a private `_managedDataBrand: string | null` flag:

- Initial value: `null` (runtime is not the manager).
- On reconcile when `brand !== ''`: runtime enters managed state. Even if the eventual decision is REMOVE (HC, unregistered), the slot tracks "we last touched it."
- On reconcile when `brand === ''`: if `_managedDataBrand` was non-null, runtime emits a final REMOVE to clean up its own past writes, then resets to `null`. If `_managedDataBrand` was already `null`, NOOP.
- On `disconnectedCallback`: do **not** strip `data-brand`. The element is leaving the tree; cleanup is the framework's responsibility, and stripping during teardown causes a flash for moved-not-removed nodes.

This handles the `brand="acme"` → `brand=""` transition cleanly without breaking Shape B (where `_managedDataBrand` never transitions away from `null`).

## SSR adoption (Shape C)

When the page renders with `<hx-theme brand="acme" data-brand="acme">` and the component connects:

1. `firstUpdated` fires. `brand` is `"acme"`. Reconcile runs.
2. Decision: SET `data-brand="acme"`. Already `acme`. The DOM mutation observer (if any external one is watching) sees no change — `setAttribute` to the same value is a no-op in spec but DOES fire `MutationObserver.attributes` mutations. To avoid spurious mutations, the runtime checks `current === target` before calling `setAttribute`.
3. `_managedDataBrand` transitions to `"acme"`. The runtime now owns the attribute.

Mismatched SSR (Shape D) follows the same path with one extra step: step 2 detects `current !== target`, calls `setAttribute('data-brand', 'acme')`. The mismatched `other` is overwritten.

## Mutation guard

The runtime does **not** observe the `data-brand` attribute for external mutations after adoption. If author-side code (e.g. a Drupal behavior, a third-party theme switcher) sets `data-brand="x"` while `brand="y"` is still set, the next reconcile (triggered by any property change to `brand`/`theme`/`motion`/`density` or by an `auto` theme media-query event) overwrites the external write. This is the cost of the aggressive cleanup model, and is consistent with the contract: `brand !== ''` is universal authorization.

Authors who want to control `data-brand` independently must use Shape B (no `brand` attribute) or unset `brand` before mutating `data-brand`.

## Drupal Twig alignment

`packages/hx-library/src/components/hx-theme/hx-theme.twig` drops the `data-brand` emission entirely. Today (post-R31 cleanup) the helper emits only `brand="..."`; the runtime now performs the reflection. This removes the dual-source-of-truth between Twig and runtime that R26–R29 chased.

The `attributes` spread retains the ability to set arbitrary HTML attributes including `data-brand` (Shape B). Templates that explicitly want CSS-pattern-only authoring continue to work; templates that pass `data-brand` AND `brand` get the runtime's aggressive cleanup behavior on hydration.

## Documentation alignment

`apps/docs/src/content/docs/extending/multi-brand-theming.md:39` updates from:

> "The runtime does not reflect `brand` to `data-brand`."

to:

> "The runtime reflects `brand` to `data-brand` on `theme="light"` and `theme="dark"` when the brand is registered. The reflection is suppressed on `theme="high-contrast"` and on unregistered brand names. Set `data-brand` independently of `brand` (the cascade-only path) by omitting the `brand` attribute. See [`BRAND_REFLECTION_CONTRACT.md`](./brand-reflection-contract.md)."

The `BRAND_THEMING.md` registry-path doc gains a "data-brand reflection" subsection pointing to this contract.

## Test matrix file

`packages/hx-library/src/components/hx-theme/hx-theme-data-brand-reflection.test.ts` enumerates all 24 cases plus the state-transition table as `it.todo()` placeholders during the design phase. Each test signature names its case number from this contract so the matrix and the test file stay traceable.

When implementation begins, the `it.todo` calls flip to real assertions. Codex reviews the final diff once. Iteration through codex on this contract surface is explicitly out of scope — the matrix is decided here.

## Out-of-scope (intentionally)

- **HC brand-token category split** — sibling 3.3.0 work tracked at `00-Planning/helix/HC brand-token suppression scope + replaceSync failure mode (deferred from 3.2.2).md`. Until that lands, HC continues to suppress the entire brand merge (color and non-color tokens both).
- **`replaceSync()` failure-mode hardening** — sibling 3.3.0 work, same planning note. Until that lands, malformed tokens still throw at apply-time rather than register-time.
- **`brand` property typing** — currently `string`. A future TS-strict enhancement could narrow to `RegisteredBrandName | ''` via the registry. Out of scope for 3.3.0; would be a separate types-only change.
- **Programmatic `data-brand` mutation reaction** — the runtime does not observe the attribute. External mutations are stomped on the next reconcile. Documented above.

## Approval gate

Per the planning note: this contract is the gate. Implementation does not begin until Jake confirms each row of the matrix is the desired behavior (or notes the rows that need to flip). Codex review runs once on the final diff — not iteratively on the contract.
