# Audit Batch Triggering Guide

## When to Use Batch Audits

Use the batch audit workflow when:

- **3+ components** need the same type of audit
- Audit will touch **shared config files** (coverage-config.json, ci.yml)
- **Cross-cutting pattern fixes** apply to multiple components
- Previous audit wave identified **systemic issues** across components

Do NOT use batch audits when:

- Single component needs a quick fix
- Emergency hotfix for production issue
- Feature work (not audit/quality work)

---

## How to Trigger a Batch Audit

### Option 1: Shell Script (Recommended)

```bash
# From the project root
scripts/create-audit-batch-branch.sh hx-button hx-card hx-dialog hx-drawer hx-tooltip

# Then execute sequentially
scripts/audit-batch-executor.sh

# When done, finalize
scripts/finalize-audit-batch.sh
```

### Option 2: Ava Orchestration

Ava can orchestrate batch audits using the Agent tool:

1. Ava reads the component list from an audit report
2. Creates the batch branch via shell script
3. Delegates to specialist agents sequentially
4. Each agent commits on the batch branch
5. Ava finalizes and creates the PR

Example Ava delegation:

```
Agent({
  subagent_type: "accessibility-engineer",
  prompt: "Audit hx-button on branch audit/deep-quality-batch-20260326.
           Working directory: /path/to/repo.
           Commit findings with: audit(hx-button): [description]
           Run pnpm run verify before committing.",
  description: "a11y audit hx-button"
})
```

### Option 3: protoMaker Feature (Future)

When protoMaker adds read-only execution mode support:

```
create_feature({
  title: "audit: deep quality batch",
  category: "audit",
  executionMode: "batch",
  components: ["hx-button", "hx-card", ...]
})
```

---

## Component Selection

### From Audit Reports

Use findings from Phase 1 (AUDIT) reports:

```bash
# List components with critical findings
node -e "
  const report = JSON.parse(require('fs').readFileSync('.automaker/audits/a11y-audit-2026-03-19.json', 'utf-8'));
  const critical = report.findings.filter(f => f.severity === 'critical');
  const components = [...new Set(critical.map(f => f.component))];
  console.log(components.join(' '));
"
```

### From Coverage Config

```bash
# List components below coverage threshold
node -e "
  const config = JSON.parse(require('fs').readFileSync('packages/hx-library/coverage-config.json', 'utf-8'));
  const below = Object.entries(config.components || {})
    .filter(([_, v]) => v.threshold < 80)
    .map(([k]) => k);
  console.log(below.join(' '));
"
```

### All Components

```bash
# List all component directories
ls -d packages/hx-library/src/components/hx-*/ | xargs -I{} basename {}
```

---

## Monitoring During Execution

### Check Progress

```bash
node .automaker/agents/audit-batch-orchestrator.js --status
```

### Check for Zombies

```bash
node .automaker/agents/audit-batch-orchestrator.js --resume
```

### Discord Notifications

```bash
node .automaker/services/audit-batch-monitor.js --date 20260326 --notify
```

---

## Resuming After Interruption

If the batch is interrupted (agent zombie, machine restart, etc.):

1. Check current state:
   ```bash
   node .automaker/agents/audit-batch-orchestrator.js --date YYYYMMDD --status
   ```

2. If a component is stuck in `in_progress`:
   - Stop the zombie agent
   - Mark as failed or skipped in metadata
   - Resume from next queued component

3. Continue execution:
   ```bash
   git checkout audit/deep-quality-batch-YYYYMMDD
   scripts/audit-batch-executor.sh YYYYMMDD
   ```

---

## Adding Components to In-Progress Batch

New components can be appended to an active batch:

```bash
scripts/create-audit-batch-branch.sh hx-new-component-1 hx-new-component-2
```

The script detects the existing batch and appends new components to the queue
without affecting completed or in-progress work.
