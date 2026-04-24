# Campaign — CEM Accuracy

Verify that every HELiX component's Custom Elements Manifest declaration is a faithful, complete, accurate description of its public API.

## Why this is the pilot campaign

- **Smaller per-target scope** than ARIA / keyboard / token campaigns — faster Codex turns, faster feedback on whether the campaign infrastructure works.
- **Deterministic ground truth** — the CEM file is generated from JSDoc, the source is canonical, the diff is concrete. Findings are easy to spot-check.
- **Direct dashboard impact** — output feeds the health-scorer's "CEM Completeness" dimension directly.
- **Low cost ceiling** — pilot is ~2–4 Codex hours total. Well under the 5h daily cap.

## Scope

- **Pilot:** `targets.txt` — 5 components (`hx-button`, `hx-text-input`, `hx-card`, `hx-dialog`, `hx-form`). Mix of primitive, form-associated, composite, overlay, and coordinator.
- **Full:** `targets-full.txt` — every component under `packages/hx-library/src/components/` (~80).

## Prompt placeholders

The campaign runner substitutes the following before invoking the `codex-adversarial` agent:

| Placeholder    | Substitution                                                |
| -------------- | ----------------------------------------------------------- |
| `{TARGET}`     | Component directory path, e.g. `packages/hx-library/src/components/hx-button` |
| `{TAG}`        | Custom-element tag, derived from the directory name basename, e.g. `hx-button` |
| `{HEAD_SHA}`   | `git rev-parse HEAD` at campaign launch                    |

## Run

### Pilot (5 components)

```bash
# From a fresh, isolated Claude Code session — not your active dev session.
/codex-campaign cem-accuracy
```

The slash command defaults to `targets.txt`. With the `--limit` flag you can shrink further while iterating on the prompt:

```bash
/codex-campaign cem-accuracy --limit 1
```

### Full run (~80 components)

```bash
/codex-campaign cem-accuracy --targets scripts/codex-campaigns/campaign-cem-accuracy/targets-full.txt
```

Plan for multiple sessions if total target count exceeds the daily 5h Codex Pro cap.

## Outputs

All under `.reports/codex/campaigns/cem-accuracy/`:

| File                  | Format       | Source of truth?                    |
| --------------------- | ------------ | ----------------------------------- |
| `findings.jsonl`      | JSONL        | **Yes — canonical, machine-queryable** |
| `findings.md`         | Markdown     | Generated rollup, human-readable    |
| `scoreboard.json`     | JSON         | Per-target verdict counts           |
| `transcripts/*.log`   | Plain text   | Per-target Codex transcript         |

## Validate findings yourself

Every line in `findings.jsonl` must conform to the schema in `scripts/codex-campaigns/lib/finding-schema.ts`. Validate after each batch:

```bash
pnpm exec tsx scripts/codex-campaigns/lib/validate-findings.ts cem-accuracy
```

## Useful jq queries against findings.jsonl

```bash
# All blocking findings, file paths only:
jq -r 'select(.severity=="high") | .file' .reports/codex/campaigns/cem-accuracy/findings.jsonl | sort -u

# Findings grouped by target:
jq -s 'group_by(.target) | map({target:.[0].target,count:length,verdict:.[0].verdict_for_target})' \
  .reports/codex/campaigns/cem-accuracy/findings.jsonl

# Most affected files:
jq -r '.file' .reports/codex/campaigns/cem-accuracy/findings.jsonl | sort | uniq -c | sort -rn | head -20

# Stale CEM entries (CEM claims things source doesn't have):
jq 'select(.category=="cem-accuracy" and (.file | endswith("custom-elements.json")))' \
  .reports/codex/campaigns/cem-accuracy/findings.jsonl
```

## Pilot success criteria

Before swapping `targets.txt` for `targets-full.txt`:

1. `findings.jsonl` exists and every line passes `validate-findings.ts`
2. `findings.md` and `scoreboard.json` generated cleanly
3. Hand-spot-check 3 findings — `file:line` resolves to real code, `evidence` quote appears in the source, `fix` is actionable
4. No hallucinated public surfaces (every `public_surface` value identifies a real declaration in the file at the cited line)

If any of these fail, iterate on `prompt.md` and re-run the pilot. That is exactly what the pilot is for — do not scale a noisy prompt to 80 components.

## Triage

Pilot findings are reviewed by Jake. Triage outputs:

- Fix-now items get committed in a follow-up PR; the relevant JSDoc is added or corrected, and `pnpm run cem` regenerates the CEM.
- Accepted-debt items become tracked notes (not GitHub issues — auto-issue creation produces noise).
- Hallucinated findings drive prompt revisions before the full run.
