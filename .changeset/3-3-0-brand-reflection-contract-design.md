---
'@helixui/library': patch
---

3.3.0 brand→data-brand auto-reflection — contract design and test matrix only. Implementation paused pending operator signoff per the planning note's "design up front, get explicit signoff" recommendation. No runtime change in this changeset; this is the architectural artifact that lets the implementation diff land in a single shot rather than iterating through codex.

**What lands.**

- `packages/hx-library/src/components/hx-theme/BRAND_REFLECTION_CONTRACT.md` — the 4-shape × 3-theme × registered/unregistered matrix (24 cases) with row-by-row expected behavior, the aggressive-cleanup decision rationale, ownership-tracking model (`_managedDataBrand` flag), state-transition table, mutation guard, SSR adoption story, Drupal Twig alignment plan, and the docs delta for `multi-brand-theming.md:39`.
- `packages/hx-library/src/components/hx-theme/hx-theme-data-brand-reflection.test.ts` — 24 `it.todo()` cases naming each scenario by case number, plus 5 state-transition todos and 2 mutation-guard todos. The test file is the gate: when the contract flips to implementation, every `it.todo` becomes a real assertion.

**What does NOT land.**

- No change to `hx-theme.ts`. The runtime continues to NOT reflect `brand` to `data-brand` (current 3.2.x contract).
- No change to `hx-theme.twig`. The Twig helper continues to drop `data-brand` per R31 cleanup.
- No change to `multi-brand-theming.md`. The "runtime does not reflect" line at :39 remains accurate until the runtime change ships.

**Why the artifact-only approach.**

The 3.2.2 codex iteration loop (rounds 26-29) attempted unconditional reflection inside an unrelated palette PR. Each round closed the previous round's findings and surfaced new edge cases. Codex was finding the matrix; the matrix needed to be designed first. The R29-R30 verdict, captured in `00-Planning/helix/Brand → data-brand Auto-Reflection (deferred from 3.2.2).md`:

> "Plan up front. Write the contract for all four shapes × three themes × registered/unregistered before writing code. Get explicit signoff. Don't let codex find the matrix for you."

This changeset is that plan. The signoff gate is explicit in the contract document. Implementation lands as a separate diff once Jake confirms the matrix.

**Codex review on this diff.**

A single codex pass on this contract document is welcome; iteration on the document surface is not. If codex surfaces architectural concerns with a row of the matrix, the row gets revised in a single commit and the diff is re-reviewed once. The pattern from rounds 26-29 — codex round → patch → new finding → patch — is explicitly the failure mode this work avoids.
