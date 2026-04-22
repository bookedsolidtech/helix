---
'@helixui/library': patch
---

Fix canary publish pipeline checking out the wrong commit. `actions/checkout` under `workflow_run` defaults to the default-branch commit, not the upstream run's head. The canary job now pins `ref: ${{ github.event.workflow_run.head_sha }}` and gates on `head_branch == 'staging'` as defense-in-depth. Without this fix, canary would have published `main` source to `@helixui/library@next` instead of the staging commit that triggered the pipeline.
