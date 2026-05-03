---
'@helixui/library': patch
'@helixui/tokens': patch
---

3.3.0 brand→data-brand auto-reflection — contract design and test matrix only. Implementation paused pending operator signoff per the planning note's "design up front, get explicit signoff" recommendation. No runtime change in this changeset; this is the architectural artifact that lets the implementation diff land in a single shot rather than iterating through codex.

**What lands.**

- `packages/hx-library/src/components/hx-theme/BRAND_REFLECTION_CONTRACT.md` — the 4-shape × 3-theme × registered/unregistered matrix (24 cases) with row-by-row expected behavior, the narrowed registered-only management model, ownership-tracking model (discriminated `LastApplied` union), state-transition table, mutation guard semantics, late-registration recovery via additive registry subscription API, SSR adoption story, Drupal Twig alignment plan, and the docs delta for `multi-brand-theming.md:39`.
- `packages/hx-library/src/components/hx-theme/hx-theme-data-brand-reflection.test.ts` — 35 `it.todo()` cases: 24 row cases by case number, 5 state-transition todos, 2 mutation-guard todos, 3 R1 edge-case todos (late registration, ownership relinquish under external override, advisory dedupe), and 1 disconnect todo. The test file is the gate: when the contract flips to implementation, every `it.todo` becomes a real assertion.

**What does NOT land.**

- No change to `hx-theme.ts`. The runtime continues to NOT reflect `brand` to `data-brand` (current 3.2.x contract).
- No change to `hx-theme.twig`. The Twig helper continues to drop `data-brand` per R31 cleanup.
- No change to `multi-brand-theming.md`. The "runtime does not reflect" line at :39 remains accurate until the runtime change ships.
- No change to `HelixBrandRegistry`. The additive `subscribe(brandName, callback)` API specified in the contract lands with the implementation diff, not this design changeset.

**Why the artifact-only approach.**

The 3.2.2 codex iteration loop (rounds 26-29) attempted unconditional reflection inside an unrelated palette PR. Each round closed the previous round's findings and surfaced new edge cases. Codex was finding the matrix; the matrix needed to be designed first. The R29-R30 verdict, captured in `00-Planning/helix/Brand → data-brand Auto-Reflection (deferred from 3.2.2).md`:

> "Plan up front. Write the contract for all four shapes × three themes × registered/unregistered before writing code. Get explicit signoff. Don't let codex find the matrix for you."

This changeset is that plan. The signoff gate is explicit in the contract document. Implementation lands as a separate diff once Jake confirms the matrix.

**R0 → R1 redesign.**

R0 of this contract used an "aggressive cleanup" model: any `brand !== ''` authorized the runtime to overwrite or strip `data-brand` regardless of registration state. Codex review on R0 returned a `blocking` verdict with 1 high + 5 medium structural findings:

1. **Late registration / ordering hazard (high).** No event channel from registry → component; a brand registered after mount left the component in the unregistered path indefinitely.
2. **Ownership tracking precision (medium).** A boolean-equivalent `_managedDataBrand` flag could not distinguish "runtime's prior write still live" from "author has overwritten."
3. **Shape D unregistered loss (medium).** R0 stripped author-supplied `data-brand` even when the registry was inactive — silently destroying the cascade-only override path.
4. **Shape B HC asymmetry (medium).** R0 did not loud-document the safety implication that Shape B authors own the HC guard.
5. **Mutation guard precision (medium).** "Universal authorization" wording overstated what the design enforced without a `MutationObserver`.
6. **Test stub coverage gaps (medium).** No coverage for late-registration recovery, ownership relinquish under external override, or advisory dedupe.

R1 closes all six in a single revision per the planning rule ("redesign once, do not iterate"):

- F1 → additive `HelixBrandRegistry.subscribe(brandName, callback)` API; `register()` / `_clear()` invoke `_notify()` synchronously; `hx-theme` subscribes/unsubscribes across the lifecycle. Bumps `@helixui/tokens` because the public registry API surface widens.
- F2 → discriminated union `LastApplied = { kind: 'unmanaged' } | { kind: 'set', value: string } | { kind: 'cleared' }` for precise relinquish semantics.
- F3 → contract narrowed: runtime only manages `data-brand` when `brand !== '' AND isRegistered`. Cases 14, 16, 18, 20, 22, 24 expected outcomes flipped from "removed" to "untouched."
- F4 → Shape B HC safety implication block added to the contract; cases 11, 12 explicitly note "author-responsible HC guard."
- F5 → "authoritative at reconcile boundaries" framing replaces the universal-authorization wording; `MutationObserver` rejected with rationale.
- F6 → 3 new `it.todo` cases on the test stub (late registration, ownership relinquish under external override, advisory dedupe). Total stub count rises from 32 → 35.

**Codex review on this diff.**

A single codex pass on R1 closes the audit loop. If codex surfaces concerns on R1, they fall into two buckets per the contract's approval-gate section: (a) a row of the matrix that should flip — Jake's call — or (b) implementation-diff concerns, which are out of scope for this design-only changeset. The pattern from rounds 26-29 — codex round → patch → new finding → patch — is explicitly the failure mode this work avoids.
