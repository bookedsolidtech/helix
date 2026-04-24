#!/usr/bin/env bash
# Deterministic campaign runner — delegates directly to `codex exec`, no
# Claude subagent middle layer. Reads a target list, substitutes prompt
# placeholders per target, captures JSONL findings, validates in batches
# of 5, consolidates at the end, and appends a single audit entry.
#
# Usage:
#   bash scripts/codex-campaigns/lib/run-campaign.sh <campaign> [options]
#
# Options:
#   --targets <file>    Override default target list
#   --limit <n>         Process only the first n targets
#   --resume            Skip targets whose tag already appears in findings.jsonl
#   --model <name>      Override codex model (default: codex config default)

set -euo pipefail

CAMPAIGN="${1:-}"
shift || true
if [[ -z "$CAMPAIGN" ]]; then
  echo "usage: run-campaign.sh <campaign> [--targets <file>] [--limit <n>] [--resume] [--model <name>]" >&2
  exit 2
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCAFFOLD_DIR="$REPO_ROOT/scripts/codex-campaigns/campaign-$CAMPAIGN"
REPORT_DIR="$REPO_ROOT/.reports/codex/campaigns/$CAMPAIGN"
FINDINGS="$REPORT_DIR/findings.jsonl"
RUN_LOG="$REPORT_DIR/run.log"
PROMPT_TEMPLATE="$SCAFFOLD_DIR/prompt.md"

TARGETS_FILE="$SCAFFOLD_DIR/targets.txt"
LIMIT=0
RESUME=0
MODEL=""

while (( $# > 0 )); do
  case "$1" in
    --targets) TARGETS_FILE="$2"; shift 2 ;;
    --limit)   LIMIT="$2";        shift 2 ;;
    --resume)  RESUME=1;          shift   ;;
    --model)   MODEL="$2";        shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

# ─── Preflight ────────────────────────────────────────────────────────────

[[ -f "$REPO_ROOT/.rea/HALT" ]] && { echo "FROZEN: .rea/HALT present" >&2; exit 1; }
command -v codex >/dev/null || { echo "codex CLI not on PATH" >&2; exit 1; }
command -v jq    >/dev/null || { echo "jq not on PATH" >&2; exit 1; }
[[ -f "$PROMPT_TEMPLATE" ]] || { echo "missing prompt template: $PROMPT_TEMPLATE" >&2; exit 1; }
[[ -f "$TARGETS_FILE" ]]    || { echo "missing targets file: $TARGETS_FILE" >&2; exit 1; }

bash "$REPO_ROOT/scripts/codex-campaigns/lib/init-campaign.sh" "$CAMPAIGN" >/dev/null

HEAD_SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"

# ─── Resolve targets ──────────────────────────────────────────────────────
# Compatible with bash 3.2 (stock macOS) — no mapfile, no associative arrays.

TARGET_LIST="$(mktemp)"
trap 'rm -f "$TARGET_LIST"' EXIT

grep -vE '^\s*(#|$)' "$TARGETS_FILE" > "$TARGET_LIST" || true

if (( RESUME == 1 )) && [[ -s "$FINDINGS" ]]; then
  SEEN_TAGS="$(jq -r '.tag // empty' "$FINDINGS" | sort -u)"
  FILTERED="$(mktemp)"
  while IFS= read -r t; do
    tag="$(basename "$t")"
    echo "$SEEN_TAGS" | grep -qxF "$tag" || echo "$t" >> "$FILTERED"
  done < "$TARGET_LIST"
  mv "$FILTERED" "$TARGET_LIST"
fi

if (( LIMIT > 0 )); then
  LIMITED="$(mktemp)"
  head -n "$LIMIT" "$TARGET_LIST" > "$LIMITED"
  mv "$LIMITED" "$TARGET_LIST"
fi

TOTAL="$(wc -l < "$TARGET_LIST" | tr -d ' ')"
(( TOTAL > 0 )) || { echo "no targets to process" >&2; exit 0; }

[[ -f "$FINDINGS" ]] || : > "$FINDINGS"
START_COUNT="$(wc -l < "$FINDINGS" | tr -d ' ')"

# Track the targets actually processed in this run. Without this, a partial
# run (--limit / --targets override) would consolidate against the full
# campaign manifest and pre-seed every un-run target as `verdict: "pass"`,
# inflating scoreboard pass counts and hiding gaps. The consolidator prefers
# this file when present.
TARGETS_PROCESSED="$REPORT_DIR/targets-processed.txt"
: > "$TARGETS_PROCESSED"

echo "campaign=$CAMPAIGN targets=$TOTAL head=$HEAD_SHA" | tee -a "$RUN_LOG"

# ─── Per-target execution ─────────────────────────────────────────────────

CODEX_ARGS=(exec --sandbox read-only --skip-git-repo-check --color never -C "$REPO_ROOT")
[[ -n "$MODEL" ]] && CODEX_ARGS+=(-m "$MODEL")

run_target() {
  local target="$1" idx="$2"
  local tag; tag="$(basename "$target")"
  local slug; slug="${tag//[^a-zA-Z0-9_-]/_}"
  local transcript="$REPORT_DIR/transcripts/$slug.log"
  local last_msg="$REPORT_DIR/transcripts/$slug.last.txt"
  local target_started; target_started="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  local rendered
  rendered="$(sed \
    -e "s|{TARGET}|$target|g" \
    -e "s|{TAG}|$tag|g" \
    -e "s|{HEAD_SHA}|$HEAD_SHA|g" \
    "$PROMPT_TEMPLATE")"

  echo "[$idx/$TOTAL] $tag started=$target_started" | tee -a "$RUN_LOG"

  # Truncate the last-message file before invocation. Without this, a retry
  # against a target that already has a stale `$slug.last.txt` on disk (from a
  # prior crashed or non-zero-exit run) would re-ingest the previous run's
  # findings and misreport the retry as a pass.
  : > "$last_msg"

  # Redirect codex stdin to /dev/null: the outer `while read < "$TARGET_LIST"`
  # loop shares its stdin with every child process by default, and `codex exec`
  # reads stdin to append as an `<stdin>` block — which silently drains the
  # target list file and causes the outer loop to exit after target 1.
  local codex_rc=0
  if ! codex "${CODEX_ARGS[@]}" -o "$last_msg" "$rendered" </dev/null >"$transcript" 2>&1; then
    codex_rc=1
    echo "[$idx/$TOTAL] $tag CODEX_EXIT_NONZERO (see $transcript)" | tee -a "$RUN_LOG"
  fi

  # The final agent message is the authoritative JSONL block. On non-zero exit
  # we do NOT fall back to scraping the raw transcript — a failed invocation's
  # partial transcript is not a valid findings source, and treating it as one
  # would turn a crashed Codex run into a silent "clean" verdict.
  local source_file="$last_msg"
  if [[ $codex_rc -eq 0 ]]; then
    [[ -s "$source_file" ]] || source_file="$transcript"
  fi

  local parsed=0 rejected=0
  local tmpf; tmpf="$(mktemp)"
  # Extract lines that look like JSON objects and revalidate each via jq -c.
  # `jq -e .` exits nonzero on parse errors — we use that as the filter.
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^\{.*\}$ ]] || continue
    if echo "$line" | jq -ec . >/dev/null 2>&1; then
      echo "$line" | jq -c --arg sha "$HEAD_SHA" '. + {codex_run: (.codex_run // $sha)}' >> "$tmpf"
      parsed=$((parsed + 1))
    else
      rejected=$((rejected + 1))
    fi
  done < "$source_file"

  # Crashed Codex runs must register as `error` verdicts, not silent passes.
  # Without this, a non-zero exit produces an empty $last_msg → zero parsed
  # findings → the consolidator's pre-seeded `pass` verdict for the target
  # stands. Emit a synthetic finding so scoreboard.json + audit logs surface
  # the failure.
  if (( codex_rc != 0 )) && (( parsed == 0 )); then
    local now; now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    jq -nc \
      --arg campaign "$CAMPAIGN" \
      --arg target "$target" \
      --arg tag "$tag" \
      --arg ts "$now" \
      --arg sha "$HEAD_SHA" \
      --arg transcript "$transcript" \
      '{
        campaign: $campaign,
        target: $target,
        tag: $tag,
        ts: $ts,
        codex_run: $sha,
        severity: "high",
        category: "infra",
        file: $transcript,
        line: 1,
        issue: "codex exec exited non-zero — no findings parsed",
        evidence: "see transcript",
        fix: "rerun the target or inspect the transcript for the underlying failure",
        verdict_for_target: "error"
      }' >> "$tmpf"
    parsed=1
  fi

  # Sequential loop — no concurrent appenders, so no locking needed.
  # If we ever add `xargs -P`, reintroduce flock here.
  if (( parsed > 0 )); then
    cat "$tmpf" >> "$FINDINGS"
  fi
  rm -f "$tmpf"

  echo "[$idx/$TOTAL] $tag parsed=$parsed rejected=$rejected codex_rc=$codex_rc" | tee -a "$RUN_LOG"
}

IDX=0
while IFS= read -r target; do
  IDX=$((IDX + 1))
  echo "$target" >> "$TARGETS_PROCESSED"
  run_target "$target" "$IDX"

  if (( IDX % 5 == 0 )); then
    echo "validating after batch of 5…" | tee -a "$RUN_LOG"
    if ! pnpm --silent exec tsx "$REPO_ROOT/scripts/codex-campaigns/lib/validate-findings.ts" "$CAMPAIGN" | tee -a "$RUN_LOG"; then
      echo "VALIDATION FAILED after target $IDX — stopping batch" | tee -a "$RUN_LOG"
      exit 1
    fi
  fi
done < "$TARGET_LIST"

# ─── Final validate + consolidate ─────────────────────────────────────────

echo "final validation…" | tee -a "$RUN_LOG"
pnpm --silent exec tsx "$REPO_ROOT/scripts/codex-campaigns/lib/validate-findings.ts" "$CAMPAIGN" | tee -a "$RUN_LOG"

echo "consolidating…" | tee -a "$RUN_LOG"
pnpm --silent exec tsx "$REPO_ROOT/scripts/codex-campaigns/lib/consolidate-findings.ts" "$CAMPAIGN" | tee -a "$RUN_LOG"

# ─── Audit entry ──────────────────────────────────────────────────────────

END_COUNT="$(wc -l < "$FINDINGS" | tr -d ' ')"
APPENDED=$((END_COUNT - START_COUNT))
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

jq -c --arg ts "$TS" \
      --arg campaign "$CAMPAIGN" \
      --arg head "$HEAD_SHA" \
      --argjson target_count "$TOTAL" \
      --argjson finding_count "$APPENDED" \
      --slurpfile sb "$REPORT_DIR/scoreboard.json" \
      -n '{
        ts: $ts,
        tool: "codex-campaign",
        runner: "run-campaign.sh",
        campaign: $campaign,
        target_count: $target_count,
        finding_count: $finding_count,
        head_sha: $head,
        verdict_summary: $sb[0].by_verdict,
        severity_summary: $sb[0].by_severity
      }' >> "$REPO_ROOT/.rea/audit.jsonl"

echo "" | tee -a "$RUN_LOG"
echo "/codex-campaign $CAMPAIGN" | tee -a "$RUN_LOG"
echo "  Targets processed: $TOTAL" | tee -a "$RUN_LOG"
echo "  Findings appended: $APPENDED (total in file: $END_COUNT)" | tee -a "$RUN_LOG"
echo "  Findings file:     $FINDINGS" | tee -a "$RUN_LOG"
echo "  Rollup:            $REPORT_DIR/findings.md" | tee -a "$RUN_LOG"
echo "  Scoreboard:        $REPORT_DIR/scoreboard.json" | tee -a "$RUN_LOG"
