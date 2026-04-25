---
description: Run a Codex hardening campaign across a list of targets. Each target gets an adversarial review; findings stream to JSONL.
argument-hint: "<campaign-name> [--targets <file>] [--limit <n>]"
allowed-tools:
  - Agent
  - Bash(bash scripts/codex-campaigns/lib/init-campaign.sh:*)
  - Bash(pnpm exec tsx scripts/codex-campaigns/lib/consolidate-findings.ts:*)
  - Bash(pnpm exec tsx scripts/codex-campaigns/lib/validate-findings.ts:*)
  - Bash(git rev-parse:*)
  - Bash(git status:*)
  - Bash(cat:*)
  - Bash(wc:*)
  - Bash(date:*)
  - Bash(jq:*)
  - Read
  - Write
---

# /codex-campaign — Codex Hardening Campaign Runner

Loops a curated target list through `/codex` adversarial review with a campaign-specific prompt. Streams findings to JSONL. Generates a Markdown rollup and per-target scoreboard at the end.

**Use this in its own long-running Claude Code session, not from the active development conversation.** A campaign batch can take hours of Codex time; isolating it in its own session keeps your working context clean.

## Why this exists

The per-PR `/codex-review` gate runs on diffs. This command runs Codex against the codebase systematically, target by target, against a fixed dimension (CEM accuracy, ARIA delegation, keyboard nav, token cascade, form association, color contrast). It is the engine of the deep audit work.

Findings are JSONL because JSONL is the only format that lets every downstream consumer (consolidator, scoreboard, dashboard, `jq` query) read from the same source of truth. Markdown is generated, never authored.

## Arguments

- `$1` (required) — campaign name, e.g. `cem-accuracy`. Must match a directory under `scripts/codex-campaigns/campaign-<name>/`.
- `--targets <file>` (optional) — override the default target list. Default: `scripts/codex-campaigns/campaign-<name>/targets.txt`.
- `--limit <n>` (optional) — process only the first `n` targets. Useful for pilot runs against a handful of components before committing to the full surface.

## Preflight

1. Read `.rea/policy.yaml` — confirm autonomy is at least L2.
2. Check `.rea/HALT` — if present, stop and report FROZEN.
3. Verify `/codex` is available. If not, stop with a clear error.
4. Verify the campaign scaffold exists:
   - `scripts/codex-campaigns/campaign-<name>/targets.txt`
   - `scripts/codex-campaigns/campaign-<name>/prompt.md`
   If either is missing, stop and tell the user what to create.
5. Run `bash scripts/codex-campaigns/lib/init-campaign.sh <name>` to create `.reports/codex/campaigns/<name>/{findings.jsonl,transcripts/}`.

## Step 1 — Resolve targets

Read the target list (one path per line, comments with `#` ignored, blanks ignored). Apply `--limit` if set. Capture:

- Total target count
- Campaign prompt template (`prompt.md`)
- Repo head SHA (`git rev-parse HEAD`) — recorded into every finding's `codex_run` field for traceability.

If the target count is zero, stop.

## Step 2 — For each target, invoke codex-adversarial

For each target path:

1. Substitute `{TARGET}` in `prompt.md` with the target path. Substitute any other `{...}` placeholders the template defines (e.g., `{CEM_DECLARATION}`, `{SOURCE_PATH}`, `{TAG}`) by reading the relevant files. The campaign's `README.md` documents which placeholders that campaign uses.
2. Invoke the `codex-adversarial` agent with the substituted prompt. Include in the prompt a strict instruction that the agent must return findings as JSONL lines conforming to the schema in `scripts/codex-campaigns/lib/finding-schema.ts`. Every line must include `campaign`, `target`, `ts`, `codex_run`, `severity`, `category`, `file`, `line`, `issue`, `evidence`, `fix`, `verdict_for_target`.
3. Append every emitted finding line as-is to `.reports/codex/campaigns/<name>/findings.jsonl`. Do not pretty-print; one JSON object per line.
4. After every batch of 5 targets, run `pnpm exec tsx scripts/codex-campaigns/lib/validate-findings.ts <name>`. If validation fails, stop the batch and report — do not silently accumulate broken lines.

The Codex transcript for each target is written by the existing middleware to `.rea/transcripts/`. The campaign-specific copy lives at `.reports/codex/campaigns/<name>/transcripts/<target-slug>.log`.

## Step 3 — Consolidate

After the loop completes (or after `--limit` is reached):

```bash
pnpm exec tsx scripts/codex-campaigns/lib/validate-findings.ts <name>
pnpm exec tsx scripts/codex-campaigns/lib/consolidate-findings.ts <name>
```

This writes:

- `.reports/codex/campaigns/<name>/findings.md` — human rollup, severity-grouped then file-grouped.
- `.reports/codex/campaigns/<name>/scoreboard.json` — per-target verdict counts, severity histograms.

## Step 4 — Audit

Append a single audit entry to `.rea/audit.jsonl` summarizing the batch:

- `tool: "codex-campaign"`
- `campaign: <name>`
- `target_count: <N>`
- `finding_count: <N>`
- `head_sha: <SHA>`
- `verdict_summary: { pass: N, concerns: N, blocking: N }`

The middleware records each `codex-adversarial` invocation's own audit entry — this batch entry is the campaign-level summary.

## Step 5 — Report

Print:

```
/codex-campaign <name>
  Targets:        <processed>/<total>
  Findings:       <total> (<critical>/<high>/<medium>/<low>/<info>)
  Verdicts:       <pass>/<concerns>/<blocking>
  Findings file:  .reports/codex/campaigns/<name>/findings.jsonl
  Rollup:         .reports/codex/campaigns/<name>/findings.md
  Scoreboard:     .reports/codex/campaigns/<name>/scoreboard.json

Top blocking targets:
  - <target> (<count>)
  - ...
```

If any target's verdict is `blocking`, name them. Do not soften.

## Constraints

- Never modify source files. The campaign is read-only with respect to the audit surface.
- Never auto-create GitHub issues from findings. Triage is a human step.
- Never run two campaigns concurrently in the same session — they will interleave findings and corrupt the JSONL append order. Use separate Claude Code sessions for parallel campaigns.
- Always validate the JSONL after each batch of 5 targets. Catching a malformed line late means re-running expensive Codex hours.
