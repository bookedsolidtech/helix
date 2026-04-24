---
'@helixui/library': patch
---

Close Codex staging→main blocking findings before 3.1.0 release.

- Rebind `hx-status-indicator`, `hx-stat`, `hx-step`, `hx-toast`, `hx-rating`,
  `hx-code-snippet`, and `hx-table` off `--hx-color-neutral-*` primitives onto
  semantic tokens so Dark + HC mode flip correctly.
- Patch `hx-theme` HC override map to include `--hx-color-error-text` and
  `--hx-color-success-text` (both already defined in tokens.json HC block; the
  runtime map was missing them, so 32 consumers kept Light-palette red/green
  under `theme="high-contrast"`).
- Expand `dark-mode-resolution` regression guard from 5 to 9 tests:
  status-indicator, stat, step, and a direct HC override check for
  error-text/success-text.
- Tighten coverage gate (`scripts/check-coverage.mjs`) — no longer silently
  skips on missing scoped artifacts; a watchdog-killed vitest run now fails CI
  so the shard owner diagnoses rather than ships blind.
- Harden release-manifest publish step: auto-merge failure is now a hard job
  failure (not a warning), and the manifest branch name includes
  `GITHUB_RUN_ID` so reruns don't collide with a stale branch.
