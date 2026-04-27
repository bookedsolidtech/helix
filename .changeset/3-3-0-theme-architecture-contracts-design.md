---
'@helixui/library': patch
'@helixui/tokens': patch
---

3.3.0 theme architecture contracts — design-only changeset for two deferred items: (1) HC brand-token suppression scope, (2) `replaceSync()` failure-mode hardening. R1 redesign — closes 8 codex blocking findings from R0 in a single revision per the planning rule "redesign once, do not iterate." Implementation paused pending Jake's signoff per the planning rule "design up front, get explicit signoff." No runtime change in this changeset; the artifacts let the implementation diff land in a single shot rather than iterating through codex.

**What lands.**

- `packages/hx-library/src/components/hx-theme/HC_BRAND_TOKEN_SPLIT_CONTRACT.md` — color-vs-non-color allowlist categorization, namespace-stratified unknown-token policy (R1: strict rejection for unknown `--hx-*` and color-bearing `--brand-*`; warn-and-treat-as-color for unaudited `--brand-<other>-*`; audited `--brand-*` subprefixes accepted), updated `_applyEffectiveTheme()` shape with deferred-advisory-commit pseudocode (R1: advisory state commits only after `replaceSync()` succeeds), re-registration atomicity section, 9-case row matrix + 3 state transitions + 8 categorization edges = 20 test cases, migration story, and docs deltas for `BRAND_THEMING.md` + `multi-brand-theming.md:39`.
- `packages/hx-library/src/components/hx-theme/REPLACESYNC_HARDENING_CONTRACT.md` — Path A vs Path B analysis, decision (Path A primary for **brand-registry inputs only**; Path B primary for non-brand inputs like density/theme CSS; both surfaces share defense-in-depth try/catch), CSS value validator design (15 categories, regex-based, permissive identifier fallback), 45 validator test cases + 12 integration test cases. R1: HC-split-as-prerequisite sequencing (no longer "independently mergeable" — replaceSync hardening composes onto the categorization model from the HC contract).
- `packages/hx-library/src/components/hx-theme/hx-theme-hc-brand-split.test.ts` — 20 `it.todo()` cases (9 row + 3 transitions + 8 categorization edges) pinning the R1 HC split contract.
- `packages/hx-library/src/components/hx-theme/hx-theme-replacesync-hardening.test.ts` — 12 `it.todo()` cases (5 registration + 3 happy path + 2 defense-in-depth + 2 state invariants) pinning the runtime-integration surface of the replaceSync hardening contract.
- `packages/hx-tokens/src/__tests__/css-value-validator.test.ts` — ~45 `it.todo()` cases covering all 15 validator value categories (color-hex, color-oklch, color-rgb, color-hsl, color-named, length, unitless-number, duration, easing, font-family, font-weight, var-reference, shadow, gradient, identifier) and structural rejections (null bytes, unbalanced parens/quotes, empty string, rule-break attempts).

**What does NOT land.**

- No change to `hx-theme.ts`. HC suppression continues to drop ALL brand tokens (color and non-color); `replaceSync()` calls continue to be unwrapped and unvalidated.
- No change to `HelixBrandRegistry.register()`. Validation continues to check token presence only (the 22 `REQUIRED_SEMANTIC_TOKENS`), not value syntax, name namespace, or category.
- No `mergeBrandTokens()` signature change.
- No new CSS value validator module — the contract specifies it; the implementation lands separately.
- No changes to `BRAND_THEMING.md`, `multi-brand-theming.md`, or `hx-theme.mdx`. Doc deltas are queued in the contract documents.

**R0 → R1 redesign — codex blocking findings closed.**

Codex r-arch on R0 returned BLOCKING with 8 findings. R1 closes all 8 in a single revision:

| # | R0 finding | R1 closure |
| --- | --- | --- |
| F1 | `--brand-*` allowlist is over-broad — admits `--brand-color-*`/`--brand-shadow-*` as non-color, leaking color under HC | HC contract narrows `--brand-*` to four audited subprefixes: `--brand-layout-*`, `--brand-logo-*`, `--brand-spacing-*`, `--brand-typography-*` |
| F2 | "Independently mergeable" claim contradicts shared `register()` body | Both contracts add a "Sequencing" block; HC split is now an explicit prerequisite of replaceSync hardening; the two share the categorized storage model |
| F3 | Path A claim covers all `replaceSync()` inputs but density/theme strings don't pass through brand registry | replaceSync contract narrows Path A scope to brand-registry inputs only; density and theme CSS strings rely on the try/catch as primary mechanism |
| F4 | Advisory state committed before sheet update — log/state can run ahead of failed `replaceSync()` | HC contract's `_applyEffectiveTheme()` pseudocode defers advisory commit until after `replaceSync()` succeeds; new test case "Advisory state ordering" pins this |
| F5 | Token-value category count inconsistent (13 vs 15 across enum / intro / approval gate) | Normalized to 15 across all locations: contract intro, enum, validator test stub, approval gate |
| F6 | Validator test stub missing categories present in the enum | 7 missing categories added: color-hsl, unitless-number, easing, font-family, font-weight, shadow, gradient |
| F7 | Unknown-token "warn + treat as color" policy too permissive — masks `--hx-*` typos and hides a11y-critical token gaps | Namespace-stratified policy: unknown `--hx-*` rejects (with rationale), color-bearing `--brand-*` rejects, unaudited `--brand-<other>-*` warns + treats as color, audited `--brand-*` subprefixes accept, anything else rejects |
| F8 | Re-registration atomicity unspecified — partial validation throw could corrupt previously-stored brand | HC contract adds atomicity section: validate into a working set, single `_brands.set()` only after every check passes, subscribers not notified on failed registration; new test case pins this |

**Coupling between the two contracts.**

The HC split contract and the replaceSync hardening contract share the same surface (`HelixBrandRegistry.register()` validation pass, `_applyEffectiveTheme()` reconcile body) and are **not** independently mergeable at the storage layer. R1 narrows the prior independence claim: implementation order is fixed (HC split first, replaceSync hardening second). Both contracts can ship in the same PR pair, but the implementation diff for the validator must layer onto a `register()` body that already does categorization. Attempting to land the validator first wastes editing capacity — the surface it modifies is materially reshaped by the HC split.

**Sequencing relative to the brand-reflection PR.**

The brand-reflection contract (PR #1600) is independent of both contracts in this PR. All three contracts can ship in any order. If Jake signs all three off in one sitting, the implementation diffs can be staged sequentially without rebasing pain.

**Codex review on this diff.**

Single codex pass on R1 is acceptable per the planning rule. R1 is the redesign that closes the loop on R0's BLOCKING verdict. If R1 codex surfaces concerns, they convert to either (a) row-flip decisions for Jake or (b) implementation-diff acceptance criteria — not another redesign. Iteration on the contract surface is explicitly off the table per the planning note.
