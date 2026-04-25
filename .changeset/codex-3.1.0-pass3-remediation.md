---
'@helixui/library': patch
---

Close four Codex adversarial-review concerns surfaced in pass 3 of the 3.1.0
staging→main review loop.

- `.github/workflows/ci.yml`: remove the `matrix.shard == '1/4'` gate on the
  coverage enforcement step. The shard-aware `check-coverage.mjs` intersects
  `HX_COVERAGE_COMPONENTS` with the components whose tests actually executed
  on the current shard (read from `.cache/test-results.json`), so each shard
  enforces its own slice. Restricting to shard 1/4 let any component whose
  test landed on shards 2-4 regress unchecked.
- `scripts/codex-campaigns/lib/run-campaign.sh`: emit a synthetic
  `verdict: "error"` finding when `codex exec` exits non-zero and produces
  zero parseable findings. Without this, a crashed Codex run left the
  consolidator's pre-seeded `pass` verdict in place — so a target whose
  Codex invocation actually crashed would be silently reported as clean.
- `scripts/codex-campaigns/lib/run-campaign.sh` +
  `scripts/codex-campaigns/lib/consolidate-findings.ts`: write
  `${REPORT_DIR}/targets-processed.txt` per run listing only the targets the
  current invocation processed (honors `--limit` / `--targets` overrides).
  The consolidator now prefers this file over the full campaign manifest, so
  partial runs no longer pre-seed un-run targets as `verdict: "pass"` and
  inflate scoreboard pass counts.
- `.github/workflows/publish.yml`: include `GITHUB_RUN_ATTEMPT` alongside
  `GITHUB_RUN_ID` in the release-manifest branch name. `GITHUB_RUN_ID` is
  stable across reruns of a single workflow run; only `GITHUB_RUN_ATTEMPT`
  increments. Without it, a rerun of a failed publish would collide with the
  pre-existing release-manifest branch and cause a non-fast-forward push that
  orphans the manifest PR.
