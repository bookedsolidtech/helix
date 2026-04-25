---
'@helixui/library': patch
---

Close two Codex adversarial-review concerns in the codex-campaigns tooling
before 3.1.0 ships.

- `scripts/codex-campaigns/lib/run-campaign.sh`: truncate
  `$REPORT_DIR/transcripts/$slug.last.txt` before each `codex exec`
  invocation so a retry against a target that has a stale last-message file
  from a prior crashed run does not re-ingest the previous run's JSONL and
  misreport the retry as a pass. Additionally, on non-zero Codex exit no
  longer fall back to scraping the raw transcript — a failed invocation's
  partial output is not a valid findings source.
- `scripts/codex-campaigns/lib/consolidate-findings.ts`: seed the scoreboard
  target map from `campaign-<name>/targets.txt` so targets that produced zero
  findings (clean passes) still appear with `verdict: "pass"`, making
  `by_verdict.pass` accurate and letting operators distinguish "passed
  cleanly" from "never ran."
