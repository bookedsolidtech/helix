---
'@helixui/library': patch
'@helixui/tokens': patch
---

3.3.0 theme architecture contracts — design-only changeset for two deferred items: (1) HC brand-token suppression scope, (2) `replaceSync()` failure-mode hardening. Implementation paused pending Jake's signoff per the planning rule "design up front, get explicit signoff." No runtime change in this changeset; the artifacts let the implementation diff land in a single shot rather than iterating through codex.

**What lands.**

- `packages/hx-library/src/components/hx-theme/HC_BRAND_TOKEN_SPLIT_CONTRACT.md` — the color-vs-non-color allowlist categorization, "warn + treat as color" unknown-token policy, updated `_applyEffectiveTheme()` shape, 9-case test matrix (3 themes × 3 brand shapes) + 3 state transitions + 3 categorization edges, migration story, and docs deltas for `BRAND_THEMING.md` + `multi-brand-theming.md:39`.
- `packages/hx-library/src/components/hx-theme/REPLACESYNC_HARDENING_CONTRACT.md` — Path A vs Path B analysis, decision (Path A primary + Path B defense-in-depth), CSS value validator design (regex-based, permissive identifier fallback), 13 token-value categories, 10 integration test cases + 2 state invariants.
- `packages/hx-library/src/components/hx-theme/hx-theme-hc-brand-split.test.ts` — 15 `it.todo()` cases (9 row + 3 transitions + 3 categorization edges) pinning the HC split contract.
- `packages/hx-library/src/components/hx-theme/hx-theme-replacesync-hardening.test.ts` — 12 `it.todo()` cases (5 registration + 3 happy path + 2 defense-in-depth + 2 state invariants) pinning the runtime-integration surface of the replaceSync hardening contract.
- `packages/hx-tokens/src/__tests__/css-value-validator.test.ts` — 30 `it.todo()` cases covering the validator's value categories (hex, oklch, rgb, named, length, duration, var-reference, identifier) and structural rejections (null bytes, unbalanced parens/quotes, empty string, rule-break attempts).

**What does NOT land.**

- No change to `hx-theme.ts`. HC suppression continues to drop ALL brand tokens (color and non-color); `replaceSync()` calls continue to be unwrapped and unvalidated.
- No change to `HelixBrandRegistry.register()`. Validation continues to check token presence only (the 22 `REQUIRED_SEMANTIC_TOKENS`), not value syntax or category.
- No `mergeBrandTokens()` signature change.
- No new CSS value validator module — the contract specifies it; the implementation lands separately.
- No changes to `BRAND_THEMING.md`, `multi-brand-theming.md`, or `hx-theme.mdx`. Doc deltas are queued in the contract documents.

**Why the artifact-only approach.**

Same dynamic as the brand→data-brand reflection contract (sibling 3.3.0 work, separate PR). Codex r33 surfaced these AFTER r16-r32 reviewed the same diff without flagging them. Both findings predate R26-R29; neither was introduced by recent commits. Fixing them in PR #1597 would have expanded scope into multi-commit architectural work. The decision (2026-04-26, Jake): defer to 3.3.0, design up front, signoff before implementation.

**Coupling between the two contracts.**

The HC split contract and the replaceSync hardening contract share the same surface (`HelixBrandRegistry.register()` validation pass, `_applyEffectiveTheme()` reconcile body) but are independently signoff-able. The implementation order is: replaceSync validator first (it's the foundation for "registration validates more"), HC split second (it adds categorization to the same `register()` pass). The contracts are written so each is independently mergeable; the order is a convenience, not a dependency.

**Sequencing relative to the brand-reflection PR.**

The brand-reflection contract (PR #1600) is a prerequisite for none of this work and a dependent of none of it. All three contracts can ship in any order. If Jake signs all three off in one sitting, the implementation diffs can be staged sequentially without rebasing pain.

**Codex review on this diff.**

Single codex pass on these contracts. Iteration on the contract surface is not the failure mode this PR avoids — that's the brand-reflection PR. This PR avoids the failure mode of "shipping the implementation before the design is settled." If codex surfaces architectural concerns with the HC categorization or the Path A/B decision, they get a single revision (R0 → R1) and stop. Iteration through codex is explicitly off the table per the planning note.
