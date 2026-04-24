# Codex Hardening Campaigns

Systematic, parallelizable adversarial reviews of the HELiX codebase against a fixed dimension (CEM accuracy, ARIA delegation, keyboard navigation, token cascade, form association, color contrast). Driven by Codex Pro hours, orchestrated through Claude Code.

## Why

The per-PR `/codex-review` gate catches issues in deltas. **It does not audit the codebase at depth.** With 152 components, 28 token tiers, 102 CEM classes, and a documented 1,040–2,370h audit surface, deep dimensional review needs systematic batching against the Codex Pro 5h daily cap. This system is the engine.

Findings ship as **JSONL** because JSONL is the only format that lets every consumer (consolidator, scoreboard, dashboard ingestion, `jq`) read from one source of truth. Markdown is a generated view, never authored.

## Architecture

```
scripts/codex-campaigns/
├── README.md                          ← this file
├── lib/
│   ├── finding-schema.ts              ← canonical finding shape + validator
│   ├── validate-findings.ts           ← per-line schema check
│   ├── consolidate-findings.ts        ← writes findings.md + scoreboard.json
│   └── init-campaign.sh               ← idempotent report dir creation
└── campaign-<name>/
    ├── README.md                      ← campaign scope, run instructions
    ├── targets.txt                    ← pilot target list
    ├── targets-full.txt               ← full target list
    └── prompt.md                      ← campaign-specific Codex prompt template

.reports/codex/campaigns/<name>/       ← outputs (gitignored, local-only)
├── findings.jsonl                     ← canonical
├── findings.md                        ← generated
├── scoreboard.json                    ← generated
└── transcripts/                       ← per-target Codex transcripts
```

## Run a campaign

From a **fresh, isolated Claude Code session** — never from your active dev session, since campaigns can take hours of Codex time and would clutter your working context.

```
/codex-campaign <campaign-name>
```

Optional flags:
- `--targets <file>` — override default `targets.txt`
- `--limit <n>` — process only first `n` targets

The slash command:

1. Validates campaign scaffold + Codex availability + REA policy
2. Initializes `.reports/codex/campaigns/<name>/` via `init-campaign.sh`
3. Loops the target list, invoking the `codex-adversarial` agent with the substituted `prompt.md` per target
4. Streams findings to `findings.jsonl` (one JSON object per line)
5. Validates after every batch of 5 targets
6. Generates `findings.md` + `scoreboard.json` via `consolidate-findings.ts`
7. Writes a campaign-level audit entry to `.rea/audit.jsonl`

## Active campaigns

| Name              | Scope                                                   | Status  | Hours |
| ----------------- | ------------------------------------------------------- | ------- | ----- |
| `cem-accuracy`    | CEM declaration vs source for every public surface      | pilot   | 100–180 |
| `aria-delegation` | Shadow DOM ARIA forwarding + ElementInternals reflection| planned | 200–400 |
| `keyboard-nav`    | WAI-ARIA keyboard interaction spec compliance           | planned | 150–300 |
| `token-cascade`   | Three-tier token cascade integrity                      | planned | 80–150  |
| `form-association`| ElementInternals form-association compliance            | planned | 100–200 |
| `color-contrast`  | WCAG AA/AAA contrast across themes & states             | planned | 120–250 |

`cem-accuracy` is the pilot. Once its prompt produces hand-verified clean findings on the 5-component pilot list, scale to `targets-full.txt`, then commission the next campaign.

## Validate output yourself

```bash
# Schema check (fails on any malformed line):
pnpm exec tsx scripts/codex-campaigns/lib/validate-findings.ts <campaign-name>

# Regenerate the rollup + scoreboard from findings.jsonl:
pnpm exec tsx scripts/codex-campaigns/lib/consolidate-findings.ts <campaign-name>

# Useful queries:
jq -r 'select(.severity=="high") | .file' .reports/codex/campaigns/<campaign-name>/findings.jsonl | sort -u
jq -s 'group_by(.target) | map({target:.[0].target, count:length, verdict:.[0].verdict_for_target})' \
  .reports/codex/campaigns/<campaign-name>/findings.jsonl
```

## Authoring a new campaign

1. Create `scripts/codex-campaigns/campaign-<name>/`.
2. Drop `targets.txt` (pilot, ~5 entries) and `targets-full.txt`.
3. Author `prompt.md` — the only campaign-specific code. Must instruct the agent to emit JSONL conforming to `lib/finding-schema.ts`. Use the placeholder pattern (`{TARGET}`, `{TAG}`, `{HEAD_SHA}`, plus any campaign-specific placeholders documented in your `README.md`).
4. Author `README.md` — scope, placeholders, run instructions, jq queries.
5. Pilot. Iterate on the prompt. Then scale.

## Constraints

- `.reports/codex/` is gitignored. Findings are internal planning data — never commit.
- Triage is human. Auto-issue creation produces noise.
- Two campaigns running concurrently in the same session will interleave findings and corrupt JSONL append order. Use separate sessions for parallel campaigns.
- Every campaign re-runs idempotently. `findings.jsonl` is append-only across re-runs; the consolidator always reads the full history.
