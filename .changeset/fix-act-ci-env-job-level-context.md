---
'@helixui/library': patch
---

Fix `.github/workflows/act-ci.yml` failing GitHub's workflow validator on every push. The `test-full` job used `env.*` in its job-level `if:`, which is not in the allowed context set (`github`, `inputs`, `needs`, `vars`) per the Actions schema. GitHub rejected the file at preflight validation — creating a "workflow file issue" failure run on every push to every branch since 2026-04-12, visible in Actions UI but not blocking any required check.

Moved the gate to step-level (where `env.*` IS allowed). A new first step (`Check full-test gate`) reads `ACT_MATRIX_TESTS` / `ACT_FULL_TESTS` and writes a `run` output; every subsequent step gates on `steps.gate.outputs.run == 'true'`. Matrix containers still start when the workflow is dispatched but exit cheaply when neither env var is set — identical semantic behavior to the previous job-level gate, just routed through a context GitHub accepts.

`actionlint` now clean on this file. No consumer impact.
