# Campaign — ARIA Delegation

Verify that every HELiX component correctly delegates ARIA semantics across the Shadow DOM boundary, reflects accessibility state through `ElementInternals` (not naive host attributes), and conforms to the WAI-ARIA Authoring Practices (APG) pattern that matches its role.

## Why this campaign

- **Healthcare WCAG 2.1 AA is non-negotiable.** Shadow DOM hides ARIA mistakes from cursory review — `aria-labelledby` IDREFs do not resolve across the shadow boundary, and host-element ARIA attributes bypass the internal semantic node. These bugs are invisible to axe-core's default ruleset and only surface in screen-reader testing.
- **`ElementInternals` reflection is the only correct path** for setting role/state on a custom element host, but the API is young, browser-uneven, and easy to misuse. Components that set `this.setAttribute('aria-expanded', ...)` on the host instead of `this.internals.ariaExpanded = ...` are silently broken under Shadow DOM mode `closed` and inconsistently surfaced under `open`.
- **APG conformance is per-pattern.** Dialog, listbox, combobox, tabs, menu, tree, toolbar — each has required, recommended, and prohibited attributes. A generic axe-core scan does not know which pattern applies. Codex, with the source in front of it and the APG reference cited, can.
- **Direct dashboard impact.** Output feeds the health-scorer's "Accessibility" dimension and surfaces the screen-reader-invisible defects that automated tooling cannot.

## Scope

- **Pilot:** `targets.txt` — 5 components chosen for breadth across ARIA pattern families:

  | Component         | WAI-ARIA APG pattern         | Why this target                                                                                       |
  | ----------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
  | `hx-dialog`       | Modal Dialog                 | Disclosure pattern, focus-trap, `aria-modal`, backdrop semantics, `inert` outside-content discipline. |
  | `hx-tabs`         | Tabs (manual / automatic)    | Composite widget, `aria-orientation`, roving `tabindex` vs `aria-activedescendant`, `aria-controls` ownership across shadow boundary. |
  | `hx-text-input`   | Form control + label/desc    | `ElementInternals` form-association surface, `aria-invalid` / `aria-required` / `aria-describedby` chain across help + error nodes. |
  | `hx-side-nav`     | Navigation landmark + tree   | Landmark role, expandable disclosure subtree, current-page semantics (`aria-current`), keyboardable nav structure. |
  | `hx-toast`        | Live region (status / alert) | `role="status"` vs `role="alert"`, `aria-live` politeness, `aria-atomic`, scoped vs page-level region. |

  This pilot deliberately covers: one disclosure with focus-trap (`hx-dialog`), one composite widget with ownership relationships (`hx-tabs`), one form control with `ElementInternals` reflection (`hx-text-input`), one navigation landmark (`hx-side-nav`), and one live-region status surface (`hx-toast`). If the prompt produces clean findings on these five, the patterns generalize.

- **Full:** `targets-full.txt` — every component with an ARIA surface (~73 components after pruning pure layout primitives and presentation-only elements). See the header comment in that file for what was excluded and why.

## Prompt placeholders

The campaign runner substitutes the following before invoking the `codex-adversarial` agent:

| Placeholder    | Substitution                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `{TARGET}`     | Component directory path, e.g. `packages/hx-library/src/components/hx-dialog`                              |
| `{TAG}`        | Custom-element tag, derived from the directory name basename, e.g. `hx-dialog`                             |
| `{HEAD_SHA}`   | `git rev-parse HEAD` at campaign launch                                                                    |

## Run

### Pilot (5 components)

```bash
# From a fresh, isolated session — not your active dev session.
/codex-campaign aria-delegation
```

The slash command defaults to `targets.txt`. Use `--limit` while iterating on the prompt:

```bash
/codex-campaign aria-delegation --limit 1
```

### Full run (~73 components)

```bash
/codex-campaign aria-delegation --targets scripts/codex-campaigns/campaign-aria-delegation/targets-full.txt
```

ARIA review is denser than CEM review — per-target Codex turns are 8–15 minutes typical because the agent must cross-reference the WAI-ARIA APG pattern, the source render method, the styles for `inert`/`aria-hidden` discipline, and any `attachInternals()` reflection. Plan for multiple sessions:

- **Pilot estimate:** 2–4 Codex hours (5 targets × ~30 min/target including transcript overhead).
- **Full estimate:** 200–400 Codex hours across 40–80 sessions at the 5h daily Codex Pro cap. ARIA dimensional review is the second-largest campaign in the audit surface after `keyboard-nav`.

## Outputs

All under `.reports/codex/campaigns/aria-delegation/`:

| File                  | Format       | Source of truth?                    |
| --------------------- | ------------ | ----------------------------------- |
| `findings.jsonl`      | JSONL        | **Yes — canonical, machine-queryable** |
| `findings.md`         | Markdown     | Generated rollup, human-readable    |
| `scoreboard.json`     | JSON         | Per-target verdict counts           |
| `transcripts/*.log`   | Plain text   | Per-target Codex transcript         |

## Validate findings yourself

Every line in `findings.jsonl` must conform to the schema in `scripts/codex-campaigns/lib/finding-schema.ts`. Validate after each batch:

```bash
pnpm exec tsx scripts/codex-campaigns/lib/validate-findings.ts aria-delegation
```

## Useful jq queries against findings.jsonl

```bash
# All blocking findings, file paths only:
jq -r 'select(.severity=="high") | .file' .reports/codex/campaigns/aria-delegation/findings.jsonl | sort -u

# Findings grouped by target:
jq -s 'group_by(.target) | map({target:.[0].target,count:length,verdict:.[0].verdict_for_target})' \
  .reports/codex/campaigns/aria-delegation/findings.jsonl

# All ElementInternals reflection bugs (host attribute instead of internals.ariaX):
jq 'select(.public_surface | test("internals:"))' \
  .reports/codex/campaigns/aria-delegation/findings.jsonl

# Cross-shadow IDREF breakage (aria-labelledby / aria-describedby pointing across boundary):
jq 'select(.issue | test("IDREF|cross.shadow|labelledby|describedby"; "i"))' \
  .reports/codex/campaigns/aria-delegation/findings.jsonl

# Findings by APG pattern (encoded in public_surface as "pattern:NAME"):
jq -r '.public_surface' .reports/codex/campaigns/aria-delegation/findings.jsonl \
  | grep '^pattern:' | sort | uniq -c | sort -rn
```

## Pilot success criteria

Before swapping `targets.txt` for `targets-full.txt`:

1. `findings.jsonl` exists and every line passes `validate-findings.ts`
2. `findings.md` and `scoreboard.json` generated cleanly
3. Hand-spot-check 3 findings — `file:line` resolves to real code, the cited APG pattern is correct, the `evidence` quote appears in the source, and the `fix` is actionable (names a specific `internals.ariaX` setter, an IDREF restructure, or a missing role/state)
4. No hallucinated WAI-ARIA attributes (every cited attribute is from the ARIA 1.2 spec)
5. No findings that re-flag CEM gaps already covered by the `cem-accuracy` campaign or color-contrast issues already covered by 3.2.2 work

If any of these fail, iterate on `prompt.md` and re-run the pilot. Do not scale a noisy ARIA prompt to 73 components — false-positive ARIA findings burn the most expensive triage hours of any campaign.

## Triage

Pilot findings are reviewed by Jake. Triage outputs:

- `high` items (WCAG SC failures, APG-required attribute missing, broken accessible name) are committed in a follow-up PR; the relevant component code is fixed and a regression test is added.
- `medium` items (APG-recommended attribute missing, suboptimal IDREF chain) are batched into per-component remediation PRs.
- `low` and `info` items (redundant ARIA on native elements, description-quality improvements) are batched into a documentation/cleanup sweep.
- Hallucinated findings drive prompt revisions before the full run.
