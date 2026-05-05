---
'@helixui/library': patch
---

CI tooling: scripts/check-coverage.mjs falls through to threshold check when test-results.json missing but coverage data exists (no public API change; unblocks Coverage gate on PRs where vitest --reporter=json CLI flag doesn't honor config outputFile)
