---
'@helixui/library': patch
---

Close five Codex adversarial-review findings surfaced in pass 4 of the 3.1.0
staging→main review loop. Two of these are regressions introduced by pass 3.

- `scripts/codex-campaigns/lib/run-campaign.sh`: change the synthetic
  crashed-run finding's `category` from `"infra"` (not in the schema) to
  `"other"`. Pass 3 added the synthetic finding to surface crashed Codex
  runs in the scoreboard, but `validate-findings.ts` would have rejected the
  invalid category and aborted the entire batch via the
  `validate-after-5-targets` gate — silently hiding the failure the fix was
  designed to expose.
- `scripts/check-coverage.mjs`: add a shard-level short-circuit when scoped
  enforcement is active. The "few test files" branch in `ci.yml` legitimately
  skips vitest on shards 2-4 when the changed-file set produces fewer test
  files than shards. Pass 3 removed the `matrix.shard == '1/4'` gate so the
  coverage step now runs on every shard — without this short-circuit, shards
  that ran no tests would hit the missing-coverage hard fail and report a
  misleading "vitest watchdog killed the run" error.
- `scripts/check-coverage.mjs`: harden `loadShardComponents()` null
  handling. When `test-results.json` is missing entirely, fail loudly with a
  named-file error instead of silently bypassing the shard intersection
  (which would re-introduce the false-failure the shard-aware check exists
  to fix).
- `scripts/codex-campaigns/lib/run-campaign.sh`: append the target name to
  `targets-processed.txt` AFTER `run_target` returns, not before. If the
  process is killed mid-target (OOM, CI timeout, watchdog), the target stays
  absent from the processed list so the consolidator does not pre-seed it as
  `verdict: "pass"` and silently convert a killed run into a clean pass.
- `scripts/codex-campaigns/lib/run-campaign.sh`: on `--resume`, preserve the
  existing `targets-processed.txt` (append) instead of truncating. Pass 3
  always truncated on every invocation, which broke the resume workflow by
  rewriting the processed-target list with only the resumed subset and
  losing every previously-completed target from scoreboard pre-seeding.
