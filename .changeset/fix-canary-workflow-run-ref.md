---
'@helixui/library': patch
---

Harden the Canary publish pipeline's trigger gate. Two defects addressed:

1. **Wrong commit checked out.** `actions/checkout` under `workflow_run` defaults to the default-branch commit, not the upstream run's head. The canary job now pins `ref: ${{ github.event.workflow_run.head_sha }}` so the stamped publish reflects the staging commit that triggered the pipeline, not whatever `main` happens to point at.
2. **Fork-PR privilege escalation surface.** `workflow_run` fires for any CI run that completes, including runs from forked pull requests whose branch happens to be named `staging`. The `branches: [staging]` trigger filter narrows the pool but does not prove the run came from this repository. The job's `if` now additionally requires `github.event.workflow_run.event == 'push'` and `github.event.workflow_run.head_repository.full_name == github.repository` so a fork cannot surface a run that publishes with this repo's `NPM_TOKEN`.

Defense-in-depth on the trigger gate is critical: the canary job holds the npm automation token and publishes to a public dist-tag. A misrouted run would either ship the wrong source to `@next` or give a fork write access to the package.
