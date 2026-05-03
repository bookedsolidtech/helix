# `brand` → `data-brand` Auto-Reflection Contract (3.3.0)

**Status:** design — implementation pending Jake's signoff per the planning note's "design up front, get explicit signoff" recommendation.
**Target:** `@helixui/library@3.3.0` + `@helixui/tokens@3.3.0` (additive registry API).
**Captured from:** PR #1597 codex rounds 26-29 (reverted), planning note `00-Planning/helix/Brand → data-brand Auto-Reflection (deferred from 3.2.2).md`.
**Revision history:** R0 initial (codex flagged 1 high + 5 medium structural findings); **R1 (this document)** — single comprehensive redesign addressing late-registration, ownership-tracking precision, Shape D unregistered loss, HC asymmetry safety, mutation-guard precision, test stub coverage. Per the planning rule: redesign once, do not iterate.

## Why this exists

`<hx-theme>` exposes two parallel brand-override mechanisms:

1. **JS registry path** — `HelixBrandRegistry.register()` + `brand="X"` activates runtime token injection.
2. **CSS-pattern path** — author-supplied stylesheets matching `hx-theme[data-brand='X']:not([theme='high-contrast'])`.

Today only the Drupal Twig helper emits `data-brand` (when explicitly opted into via the `attributes` spread). Plain HTML / React / Angular / Vue consumers who set `brand="X"` get **zero** styling from CSS-pattern selectors. The runtime contract today (post-revert of R26-R29):

> "The runtime does not reflect `brand` to `data-brand`."
> — `apps/docs/src/content/docs/extending/multi-brand-theming.md:39`

Adequate as documentation; inadequate as architecture. Every non-Twig consumer must maintain `data-brand` by hand and stay synchronized with `brand` across runtime swaps. R26-R29 attempted unconditional reflection and tripped on edge cases that codex surfaced one round at a time. The lesson, captured in the planning note: **design the full matrix before any code lands.** This document is that matrix.

## The four authoring shapes

| Shape | Author writes | Common origin |
| --- | --- | --- |
| A | `<hx-theme brand="X">` (no `data-brand`) | Plain HTML / React / Angular / Vue, no SSR mirroring |
| B | `<hx-theme data-brand="X">` (no `brand`) | CSS-pattern-only consumers using cascade overrides without registering tokens |
| C | `<hx-theme brand="X" data-brand="X">` (matching) | Drupal Twig with `attributes: {'data-brand': brand}`, or any SSR that mirrors |
| D | `<hx-theme brand="X" data-brand="Y">` (mismatched) | SSR drift, stale page cache, hand-edited author markup |

## The contract

The runtime reconciles `data-brand` against `brand` whenever **both** of the following hold:

1. `brand` is non-empty.
2. `brand` is registered in `HelixBrandRegistry`.

When either condition is false, the runtime does not touch `data-brand`. This is a deliberate narrowing from the R0 "aggressive cleanup" design, which stripped author-supplied `data-brand` even when the registry path was inactive. Stripping `data-brand` while the registry rejects the merge silently destroys the author's only working override mechanism (the cascade-only path) — an outcome the cascade-only path exists to prevent.

Reconcile pseudocode:

```
function reconcile(brand, effectiveTheme, isRegistered, currentDataBrand, lastApplied) {
  if (brand === '') {
    // Shape B authoring path, OR a relinquish from a previously-set brand.
    if (lastApplied.kind === 'set' && currentDataBrand === lastApplied.value) {
      // The runtime owned this exact value; safe to clean up.
      REMOVE data-brand;
      lastApplied = { kind: 'unmanaged' };
    } else if (lastApplied.kind === 'cleared' && currentDataBrand === '') {
      // We previously cleared and the author hasn't re-added.
      lastApplied = { kind: 'unmanaged' };
    } else {
      // Author has either taken over or never authored; do not touch.
      lastApplied = { kind: 'unmanaged' };
    }
    return;
  }

  // brand !== ''

  if (!isRegistered) {
    // Registry path inactive. Leave whatever the author authored, including
    // mismatched values (Shape D unregistered) and matching values (Shape C
    // unregistered). The cascade-only path is the only working override
    // mechanism for an unregistered brand name, and stripping it here would
    // remove the author's last-resort styling. The unregistered-brand warn
    // already fires from the existing _applyEffectiveTheme path.
    return;
  }

  // brand !== '', registered

  if (effectiveTheme === 'high-contrast') {
    // Suppress data-brand under HC for brands the runtime authoritatively
    // manages. Why: external CSS-pattern stylesheets without
    // :not([theme='high-contrast']) guards leak brand primitives into the
    // HC overlay and break the WCAG 7:1+ contract. The runtime asserts
    // ownership for registered brands; for unregistered brands and Shape B
    // (cascade-only), HC-guarding is the author's responsibility.
    if (currentDataBrand !== '') {
      REMOVE data-brand;
    }
    lastApplied = { kind: 'cleared' };
    return;
  }

  // brand !== '', registered, light or dark
  if (currentDataBrand !== brand) {
    SET data-brand = brand;
  }
  lastApplied = { kind: 'set', value: brand };
}
```

## The 24-case matrix

Three themes × four shapes × two registration states (registered / unregistered) = 24 cases.

| # | Shape | `brand` | `data-brand` (initial) | Theme | Registered? | Expected `data-brand` | Expected console |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A | `acme` | `(none)` | `light` | yes | `acme` | (none) |
| 2 | A | `acme` | `(none)` | `light` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 3 | A | `acme` | `(none)` | `dark` | yes | `acme` | (none) |
| 4 | A | `acme` | `(none)` | `dark` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 5 | A | `acme` | `(none)` | `high-contrast` | yes | `(none)` | `info: Brand "acme" is suppressed on theme="high-contrast"` |
| 6 | A | `acme` | `(none)` | `high-contrast` | no | `(none)` | `warn: Brand "acme" is not registered` |
| 7 | B | `''` | `acme` | `light` | n/a | `acme` (untouched) | (none) |
| 8 | B | `''` | `acme` | `light` | n/a | `acme` (untouched) | (none) |
| 9 | B | `''` | `acme` | `dark` | n/a | `acme` (untouched) | (none) |
| 10 | B | `''` | `acme` | `dark` | n/a | `acme` (untouched) | (none) |
| 11 | B | `''` | `acme` | `high-contrast` | n/a | `acme` (untouched) | (none) — author-responsible HC guard |
| 12 | B | `''` | `acme` | `high-contrast` | n/a | `acme` (untouched) | (none) |
| 13 | C | `acme` | `acme` | `light` | yes | `acme` (no `setAttribute` call when `current === target`) | (none) |
| 14 | C | `acme` | `acme` | `light` | no | `acme` (untouched — registry inactive) | `warn: Brand "acme" is not registered` |
| 15 | C | `acme` | `acme` | `dark` | yes | `acme` (no `setAttribute` call) | (none) |
| 16 | C | `acme` | `acme` | `dark` | no | `acme` (untouched) | `warn: Brand "acme" is not registered` |
| 17 | C | `acme` | `acme` | `high-contrast` | yes | `(none)` (HC-suppressed) | `info: ... suppressed on theme="high-contrast"` |
| 18 | C | `acme` | `acme` | `high-contrast` | no | `acme` (untouched — registry inactive, author HC guard) | `warn: Brand "acme" is not registered` |
| 19 | D | `acme` | `other` | `light` | yes | `acme` (overwrites `other`) | (none) |
| 20 | D | `acme` | `other` | `light` | no (`acme` not registered) | `other` (untouched — registry inactive) | `warn: Brand "acme" is not registered` |
| 21 | D | `acme` | `other` | `dark` | yes | `acme` (overwrites `other`) | (none) |
| 22 | D | `acme` | `other` | `dark` | no | `other` (untouched) | `warn: Brand "acme" is not registered` |
| 23 | D | `acme` | `other` | `high-contrast` | yes | `(none)` (HC-suppressed) | `info: ... suppressed on theme="high-contrast"` |
| 24 | D | `acme` | `other` | `high-contrast` | no | `other` (untouched — registry inactive) | `warn: Brand "acme" is not registered` |

### Note — Shape D under HC, registered (case 23): why both values are stripped

When `brand="acme"` is registered and `theme="high-contrast"`, the runtime authoritatively asserts the registered-brand HC suppression. `data-brand="other"` is wiped because the runtime cannot distinguish "stale SSR drift" from "deliberate cascade-only fallback for HC" — and even the latter would breach the 7:1+ contract if author CSS lacked `:not([theme='high-contrast'])` guards. Authors who want their author-supplied `other` value preserved across HC must adopt Shape B (drop the `brand` attribute). The transition from case 23 → case 19 (HC exit) restores `acme`, not `other`; the author's `other` value is permanently lost across the HC enter/exit cycle. This is intentional and documented as part of the contract — Shape D registered + HC is lossy by design.

### Note — Shape D unregistered (cases 20, 22, 24): why the author value is preserved

When `brand="acme"` is **not** registered, the JS registry path is inactive. `getBrandTokens('acme')` returns `undefined`, the merge is rejected, and the existing unregistered-brand `console.warn` fires. In this state, the runtime has no positive token contribution to make. The cascade-only path (`hx-theme[data-brand='other'] { ... }` selectors authored by the consumer) is the only working override, and stripping `other` would silently eliminate it. The R0 "aggressive cleanup" model stripped `other` here on the rationale that `brand !== ''` is universal authorization; codex flagged this as silent destruction of author intent. R1 narrows authorization to **registered** brands only.

### Note — Shape B under HC (cases 11, 12): explicit safety implication

The runtime does **not** strip `data-brand` under HC when `brand=''`. Shape B authors deliberately opt out of the JS registry path and adopt cascade-only authoring. The runtime touching `data-brand` it never authored would violate the Shape B contract.

**This is an unsafe escape hatch unless the author guards their CSS-pattern selectors with `:not([theme='high-contrast'])`.** Without that guard, the cascade overrides applied via `[data-brand='X']` selectors leak into the HC token cascade, and components that consume those primitives directly (`hx-checkbox`, `hx-tag`, `hx-list-item`, `hx-date-picker`, etc.) silently break the WCAG 7:1+ contract.

The runtime cannot enforce the guard — the cascade rules live in author stylesheets the runtime never sees. This safety implication is loud-documented in `multi-brand-theming.md` (existing) and in the contract's Shape B note (this document). Authors who want runtime-enforced HC safety must use Shape A or Shape C with a registered brand.

The 3.3.0 docs delta clarifies this asymmetry rather than papering over it. Shape B remains supported because cascade-only authoring is a legitimate use case for design teams who do not own the JS bootstrap path; HC safety in that mode is a documented ownership transfer.

### Note — HC suppression info dedupe

The HC-suppression `info` log (cases 5, 17, 23) is deduped via the same `_lastBrandAdvisoryKey` channel as the unregistered-brand `warn`. Two consecutive reconciles in the same `(brand, theme="high-contrast")` tuple — for example a `theme` prop change followed by an `auto` media-query event firing in the same tick — emit the info log exactly once. The advisory key resets when `(brand, theme)` changes; re-entering HC after an exit re-emits.

### Note — case 18 vs. case 17: registered vs. unregistered + HC

Both cases mount with matching `brand="acme" data-brand="acme"`. The runtime branches on registration:

- Registered (case 17) → runtime asserts ownership, strips `data-brand`, info-logs HC suppression.
- Unregistered (case 18) → registry path inactive, runtime leaves `data-brand="acme"` untouched, warns about unregistered brand. Same authoring shape, different outcome — the registry is the gate.

Case 18 carries the same "author HC guard responsibility" note as Shape B. The unregistered-brand warn fires; whether the cascade is HC-guarded is the author's job.

## State transitions

The initial-mount matrix is necessary but not sufficient. Runtime swaps must remain coherent.

| Transition | Expected behavior |
| --- | --- |
| `brand="acme"` → `brand="other"` (both registered, light or dark) | `data-brand` updates `acme` → `other`. `lastApplied.value` updates `acme` → `other`. |
| `brand="acme"` (registered, light/dark) → `brand=""` | `lastApplied.kind === 'set'` and current matches → REMOVE `data-brand`, reset `lastApplied` to `unmanaged`. |
| `brand="acme"` (registered, light/dark) → external `setAttribute('data-brand','x')` → `brand=""` | `lastApplied.kind === 'set'` but current `'x' !== 'acme'` → NOOP, reset to `unmanaged`. Author's `'x'` survives the relinquish. |
| `brand="acme"` (registered) → `theme="light"` → `theme="high-contrast"` | `data-brand="acme"` removed. `lastApplied.kind === 'cleared'`. |
| `brand="acme"` (registered) → `theme="high-contrast"` → `theme="light"` | `data-brand="acme"` re-set. `lastApplied = { kind: 'set', value: 'acme' }`. |
| `brand="acme"` (unregistered at mount) → `HelixBrandRegistry.register('acme', …)` later | Registry-subscribed reconcile fires automatically — see "Late registration" below. `data-brand="acme"` set after registration. |
| `brand="acme"` registered, then `HelixBrandRegistry._clear()` (test path) | Registry-subscribed reconcile fires. `acme` no longer registered → leave `data-brand` untouched per case 14/16/18 path. |
| `theme="auto"` resolves `light` → `dark` via OS query while `brand="acme"` registered | `data-brand="acme"` unchanged (light and dark both set the same value); `lastApplied` value unchanged. |
| `brand="acme" data-brand="other"` (registered) → `theme="high-contrast"` → `theme="light"` | Round-trip is lossy by design: HC enter strips `data-brand` (case 23 path); HC exit re-applies the runtime's owned value `acme`, not the author's pre-HC `other`. The `LastApplied` union does not retain a pre-HC `prior` slot — adding one would be a contract-surface change. |

`theme="auto"` cannot resolve to `high-contrast` (the OS query is `prefers-color-scheme`, which has no HC value); the `auto` → HC transition does not exist as a runtime path. The test stub pins this negative guarantee with an explicit `it.todo` so a future hypothetical `prefers-contrast: more` mapping into `auto` cannot silently introduce HC-via-auto without breaking a test.

## Late registration — the registry subscription API

**Problem (codex finding 1, high).** A component that mounts with `brand="acme"` before `HelixBrandRegistry.register('acme', …)` runs lands in the unregistered path (case 2 / 4 / 6) and stays there indefinitely. There is no event channel from the registry to the component. The R0 contract had no way to recover from late registration without a manual property toggle from the application.

**Decision.** Add an additive `subscribe(brandName, callback)` API to `HelixBrandRegistry`. The signature is small and isolated to `packages/hx-tokens/src/brand-registry.ts`:

```ts
subscribe(brandName: string, callback: () => void): () => void {
  // Adds callback to the listener set for brandName. Returns an unsubscribe
  // function. The callback fires synchronously after register(brandName, ...)
  // succeeds and after _clear() removes the brand.
}
```

`register()` and `_clear()` invoke `_notify(brandName)` after mutating `_brands`. Notification semantics:

- `_notify(brandName)` fires synchronously after every successful `register(brandName, ...)` and every `_clear(brandName)`. Re-registration with a different token body fires `_notify` again (the token diff is a state transition the subscriber should observe).
- A `register()` call that fails `validateTokens()` does **not** fire `_notify` — the registry was not mutated, so there is no state change to notify.
- Subscriber callbacks that throw do not propagate to other subscribers; `_notify()` catches and surfaces via `console.error` so a single faulty subscriber cannot break the notification fan-out.

`hx-theme` lifecycle:

- `connectedCallback`: if `this.brand !== ''`, subscribe to that brand and store the unsubscribe handle.
- `updated()` when `brand` changes from `'a'` to `'b'`: invoke the stored unsubscribe, subscribe to `'b'`, store the new unsubscribe.
- `disconnectedCallback`: invoke the stored unsubscribe.

The subscription callback delegates to `_applyEffectiveTheme()` (the existing reconcile entry point). After registry change, the component re-runs reconcile against the new registry state — case 2 transitions to case 1, case 14 transitions to case 13, etc.

This makes the contract independent of bootstrap order. Registration before mount, registration after mount, and registration removal all converge on the matrix.

**Why not narrow the contract to "register-before-mount only" instead.** A precondition-only design forces every consumer to coordinate brand registration with element bootstrap. In Drupal multisite, that coordination is fragile — themes lazy-load brand bundles after the document has hydrated. Asking every consumer to poll `HelixBrandRegistry.isRegistered()` and toggle the `brand` property to force a reconcile is an API smell. The subscription API is ~30 LOC in `brand-registry.ts` and removes the ordering hazard entirely. Worth it.

**Token version note.** The subscribe API is additive — no breaking change to `register()`, `getBrandTokens()`, `isRegistered()`, `validateTokens()`, `_clear()`. Bumps `@helixui/tokens` to 3.3.0 minor (new public API surface) alongside `@helixui/library` 3.3.0 minor (consumer of new API). The library `peerDependency` constraint on tokens widens to `^3.3.0`.

## Ownership tracking

**Problem (codex finding 2, medium).** A boolean-equivalent ownership flag (`_managedDataBrand: string | null`) cannot distinguish between "the runtime once managed the attribute and the current value is still the runtime's" and "the runtime once managed the attribute but the author has since overwritten." On `brand=""` relinquish with the latter state, a naive flag would delete the author's value.

**Decision.** Use a discriminated union:

```ts
type LastApplied =
  | { kind: 'unmanaged' }                 // initial; runtime never touched
  | { kind: 'set'; value: string }        // last setAttribute('data-brand', value)
  | { kind: 'cleared' };                  // last removeAttribute('data-brand')
```

Relinquish (`brand=""`) reads the current attribute and compares to `lastApplied`:

- `kind === 'set'` AND `current === value` → REMOVE; the runtime's prior write is still live, safe to clean up.
- `kind === 'set'` AND `current !== value` → NOOP; author has overwritten, the runtime no longer owns the value.
- `kind === 'cleared'` → NOOP; runtime previously cleared, regardless of current state.
- `kind === 'unmanaged'` → NOOP; nothing to relinquish.

After relinquish the slot resets to `unmanaged`.

This handles the external-mutation-during-managed scenario without false-positive cleanup.

## Mutation guard precision

**Problem (codex finding 5, medium).** R0 wording — "`brand !== ''` is universal authorization" — overstates what the design enforces. Without a `MutationObserver` on `data-brand`, external writes between reconcile triggers persist for arbitrarily long periods. The runtime is not continuously authoritative; it is authoritative *at reconcile boundaries*.

**Decision.** Reword and scope precisely.

> The runtime is authoritative for `data-brand` at reconcile boundaries — that is, on `brand`, `theme`, `motion`, or `density` property changes, on `auto` theme media-query events, and on registry subscription notifications. Between reconcile boundaries, external mutations to `data-brand` persist. The next reconcile event reasserts the runtime's intended state per the matrix above.

`MutationObserver` is intentionally not used. The cost (synchronous per-mutation reconcile, microtask churn under any framework that touches DOM attributes) outweighs the benefit (eventual consistency that already exists at every reconcile boundary). Authors who want continuous ownership semantics must avoid external mutation of `data-brand` while `brand !== ''` is set.

## Drupal Twig alignment

`packages/hx-library/src/components/hx-theme/hx-theme.twig` already drops `data-brand` emission as of R31 cleanup; the helper emits only `brand="..."` and the runtime now performs the reflection. This removes the dual-source-of-truth between Twig and runtime that R26-R29 chased.

The `attributes` spread retains the ability to set arbitrary HTML attributes including `data-brand` (Shape B authoring from a Twig template). Templates that explicitly want CSS-pattern-only authoring continue to work; templates that pass `data-brand` AND `brand` get the runtime's reconcile behavior on hydration per the registered/unregistered matrix above.

## Documentation alignment

`apps/docs/src/content/docs/extending/multi-brand-theming.md:39` updates from:

> "The runtime does not reflect `brand` to `data-brand`."

to a longer block covering:

- Reflection contract (registered + light/dark → set; registered + HC → strip; unregistered → no-op).
- Late-registration safety (subscription-based reconcile; mount order does not matter).
- Shape B safety implication (author owns HC guard for cascade-only path).
- Pointer to `BRAND_REFLECTION_CONTRACT.md` for the full matrix.

The `BRAND_THEMING.md` registry-path doc gains a "Reflection to `data-brand`" subsection pointing to this contract.

## Test matrix file

`packages/hx-library/src/components/hx-theme/hx-theme-data-brand-reflection.test.ts` enumerates the 24 cases plus state transitions and the structural edges codex flagged as test gaps:

- 24 row cases (one `it.todo` per row of the matrix).
- 7 state-transition cases (5 R0 + 2 R1-clarification: `auto` → HC non-existence, Shape D registered HC round-trip lossy-by-design).
- 2 reconcile-boundary mutation guard cases (preserved from R0): external `setAttribute('data-brand', 'x')` and external `removeAttribute('data-brand')` while `brand` is active — both survive until the next reconcile, then revert to the runtime's intended state.
- 4 edge cases added in R1 per codex finding 6 + R1-clarification:
  - **Late registration**: `brand="acme"` mounts before register; `data-brand` stays unset (case 2 path); subsequent `register('acme', …)` triggers subscription-driven reconcile; `data-brand="acme"` set without a manual property toggle.
  - **Ownership relinquish under external override**: `brand="acme"` set + runtime sets `data-brand="acme"` → author externally `setAttribute('data-brand','x')` → `brand=""` set; `data-brand="x"` survives the relinquish.
  - **Advisory dedupe (warn channel)**: `brand="acme"` unregistered, theme reconcile fires twice; `console.warn` emits once. Pins `_lastBrandAdvisoryKey` deduplication on the warn channel.
  - **Advisory dedupe (info channel)**: `brand="acme"` registered, `theme="high-contrast"`, reconcile fires twice; `console.info` HC-suppression emits once. Pins the same deduplication channel for info.
- 1 disconnect case (`disconnectedCallback` does not strip — moved-not-removed nodes do not flash; registry subscription unsubscribes).

Total: 38 `it.todo()` cases on the test stub. When the contract flips to implementation, every `it.todo` becomes a real assertion. Codex review on the implementation diff is the standard merge-gate codex pass; iteration on the contract surface is explicitly out of scope per the planning rule.

## Out-of-scope (intentionally)

- **HC brand-token category split** — sibling 3.3.0 work tracked at `00-Planning/helix/HC brand-token suppression scope + replaceSync failure mode (deferred from 3.2.2).md`. Until that lands, HC continues to suppress the entire brand merge (color and non-color tokens both).
- **`replaceSync()` failure-mode hardening** — sibling 3.3.0 work, same planning note. Until that lands, malformed tokens still throw at apply-time rather than register-time.
- **`brand` property typing** — currently `string`. A future TS-strict enhancement could narrow to `RegisteredBrandName | ''` via the registry. Out of scope for 3.3.0; would be a separate types-only change.
- **Continuous DOM observation of `data-brand`** — not used. Reconcile is event-bounded; documented above.

## Approval gate

Per the planning rule and codex's R0 verdict, this contract is the gate. Implementation does not begin until Jake confirms each row of the matrix is the desired behavior (or notes the rows that need to flip). The single codex pass already happened on R0; R1 is the redesign that closes the findings. A second codex pass on R1 is welcome but the contract surface itself is closed: any further codex finding either (a) maps to a row that needs to flip — Jake decides — or (b) belongs to the implementation diff, not this document.
