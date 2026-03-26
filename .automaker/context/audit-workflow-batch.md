# Batch Audit Workflow — HELiX Component Library

## Problem Statement

Individual audit features each create branches and PRs. With 5-6 audits running, this causes:
- 75+ CI jobs (15 per PR x 5 PRs)
- Cascading merge conflicts on shared files (coverage-config.json, ci.yml)
- Each conflict resolution retriggers CI (150+ total CI runs)
- Massive waste of CI minutes and developer time

## Solution: Single Branch Batch Audits

All audit features in a batch share a single branch with sequential agent execution.

### Branch Naming Convention

```
audit/deep-quality-batch-YYYYMMDD
```

Example: `audit/deep-quality-batch-20260326`

### Sequential Execution Model

Agents execute one at a time on the shared batch branch. This eliminates parallel
conflicts on shared files like `coverage-config.json` and `ci.yml`.

```
Agent 1: audit hx-button     → commit → done
Agent 2: audit hx-card       → commit → done
Agent 3: audit hx-dialog     → commit → done
...
Agent N: audit hx-tooltip    → commit → done
                              → single PR → single CI run → merge
```

### Changeset Consolidation

Instead of N changeset files (one per component audit), a single consolidated
changeset covers all audited components:

```markdown
---
'@helixui/library': patch
---

audit: deep quality batch covering [N] components

Components audited:
- hx-button: [summary]
- hx-card: [summary]
- hx-dialog: [summary]
```

### Decision Tree: Batch vs Individual Audits

| Condition | Strategy |
|-----------|----------|
| 3+ components in same audit wave | Batch audit (single branch) |
| Single component, isolated fix | Individual feature branch |
| Audit touches shared config files | Always batch (prevents conflicts) |
| Cross-cutting pattern fix (e.g., all focus traps) | Batch audit |
| Emergency hotfix for one component | Individual feature branch |

---

## Batch Lifecycle

### Phase 1: Initialize Batch

```bash
# Create batch branch from latest dev
scripts/create-audit-batch-branch.sh [component1] [component2] ...
```

This creates:
- Branch `audit/deep-quality-batch-YYYYMMDD` from `dev`
- Metadata file `.automaker/audits/batch-YYYYMMDD-metadata.json`
- Orchestration state tracking

### Phase 2: Sequential Execution

Each component audit runs as a sequential step:

1. Agent checks out the batch branch
2. Agent audits one component
3. Agent commits findings with message: `audit(hx-{name}): [description]`
4. Agent updates orchestration state
5. Next agent picks up from latest commit

**Atomic commits per component** — each commit is self-contained and can be
reviewed independently within the single PR.

### Phase 3: Consolidation

After all components are audited:

1. Consolidated changeset generated (covers all components)
2. Shared file changes verified (no conflicts)
3. Batch metadata updated with completion status

```bash
# Finalize the batch
scripts/finalize-audit-batch.sh
```

### Phase 4: Single PR

One PR created from batch branch to dev:
- Title: `audit: deep quality batch YYYY-MM-DD (N components)`
- Labels: `audit-batch`, `deep-quality`, `infra`
- Auto-merge enabled on CI success
- PR description lists all audited components and findings summary

### Phase 5: Single CI Run

CI runs once for the entire batch:
- Lint, format, type-check across all changes
- Tests only for audited components
- Bundle size check
- CEM validation
- One CodeRabbit review cycle

**CI reduction: 75+ jobs → ~15 jobs (80-90% reduction)**

---

## Shared File Management

### Files That Cause Conflicts

These files are modified by multiple audit agents and cause merge conflicts
when on separate branches:

| File | Why It Changes |
|------|---------------|
| `coverage-config.json` | Coverage thresholds updated per component |
| `.github/workflows/ci.yml` | Test scope or path filters updated |
| `packages/hx-library/src/index.ts` | Component re-exports |
| `packages/hx-react/src/index.ts` | React wrapper re-exports |

### Consolidation Strategy

With sequential execution on a single branch, each agent sees the previous
agent's changes. No merge conflicts possible because:

1. Agent N reads the file as modified by Agent N-1
2. Agent N makes its changes on top
3. Commit is atomic — no parallel modification window

---

## Zombie Detection (Batch Context)

Standard zombie detection applies but with batch-specific thresholds:

| Signal | Threshold | Action |
|--------|-----------|--------|
| No new commits | 20 min per component | Check agent output for `<summary>` |
| Frozen costs | 10 min with no progress | Confirm zombie, stop agent |
| Batch stalled | 30 min total no progress | Stop current agent, skip to next component |

When a zombie is detected in a batch:
1. Stop the zombie agent via anti-respawn protocol
2. Log the component as "skipped" in batch metadata
3. Resume queue from the next component
4. Do NOT recreate the branch — continue on existing batch branch

---

## Orchestration State

The orchestration state file tracks batch progress:

```json
{
  "batchId": "batch-20260326",
  "branch": "audit/deep-quality-batch-20260326",
  "status": "in_progress",
  "startedAt": "2026-03-26T10:00:00Z",
  "components": {
    "queued": ["hx-tooltip", "hx-drawer"],
    "in_progress": "hx-dialog",
    "completed": ["hx-button", "hx-card"],
    "skipped": [],
    "failed": []
  },
  "commits": [
    { "component": "hx-button", "sha": "abc123", "timestamp": "..." },
    { "component": "hx-card", "sha": "def456", "timestamp": "..." }
  ]
}
```

---

## Anti-Patterns (DO NOT)

- One branch per component in a batch (defeats the purpose)
- Parallel agent execution on the batch branch (causes conflicts)
- Multiple PRs from a batch branch (CI multiplication)
- Skipping changeset consolidation (creates N changeset files)
- Running full test suite per component (use smart tests)
- Amending previous agent's commits (breaks audit trail)

---

## Integration with Existing Audit Workflow

This batch workflow extends Phase 3 (FIX) of the existing 4-phase audit cycle
defined in `audit-workflow.md`. The phases remain:

1. **AUDIT** — Intelligence gathering (unchanged)
2. **SYNTHESIZE** — Triage findings into batches (unchanged)
3. **FIX** — **Now uses batch branch strategy** instead of epic branch
4. **CLOSE** — GitHub Issues auto-close on PR merge (unchanged)

The key difference is in Phase 3: instead of an epic branch with child feature
branches, all fixes go directly on a single batch branch with sequential commits.
