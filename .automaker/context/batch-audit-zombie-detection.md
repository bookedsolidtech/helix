# Batch Audit Zombie Detection

## Overview

Zombie detection in batch context follows the same principles as standard zombie
detection but with batch-specific thresholds and recovery procedures.

## Detection Signals

### Per-Component Thresholds

| Signal | Threshold | Confidence |
|--------|-----------|------------|
| No new commits from agent | 20 min | Medium |
| Frozen costs for 10+ min | 10 min | High |
| Agent output has no `<summary>` block | 25 min | High (definitive) |
| Same files read repeatedly in output | 15 min | Medium |
| Cost increasing with no git activity | 10 min | High |

### Batch-Level Thresholds

| Signal | Threshold | Action |
|--------|-----------|--------|
| Batch stalled (no progress any component) | 30 min | Alert to #dev-alerts |
| Single component exceeds 35 min | 35 min | Stop agent, skip component |
| Total batch duration > 8 hours | 8 hours | Finalize with current state |

## Detection Procedure

### Step 1: Check Agent Output (20 min mark)

```bash
# Check if agent has produced a summary block
# This is the definitive signal — if <summary> exists, agent completed
node .automaker/agents/audit-batch-orchestrator.js --date YYYYMMDD --resume
```

### Step 2: Check Git Activity

```bash
# Check last commit timestamp on batch branch
git log -1 --format="%ci" audit/deep-quality-batch-YYYYMMDD

# Check if there are uncommitted changes (agent still working)
git status --porcelain
```

### Step 3: Confirm Zombie

A component is confirmed zombie when ALL of these are true:
- No new commits for 20+ minutes
- Agent costs frozen for 10+ minutes
- No `<summary>` block in agent output
- Git status shows no new changes

## Recovery Procedure

### For Single Component Zombie

1. **Stop the agent** via anti-respawn protocol:
   ```
   update_feature(assignee: "jake")  # Set assignee FIRST
   stop_agent(featureId)              # Stop the agent
   update_feature(status: "done", assignee: "jake")  # Move to done
   ```

2. **Update batch metadata:**
   ```bash
   node -e "
     const fs = require('fs');
     const m = JSON.parse(fs.readFileSync('.automaker/audits/batch-YYYYMMDD-metadata.json', 'utf-8'));
     const comp = m.components.in_progress;
     m.components.in_progress = null;
     m.components.failed.push(comp);
     fs.writeFileSync('.automaker/audits/batch-YYYYMMDD-metadata.json', JSON.stringify(m, null, 2) + '\\n');
   "
   ```

3. **Stash any uncommitted changes:**
   ```bash
   git stash || true  # May have nothing to stash
   ```

4. **Resume from next component:**
   ```bash
   scripts/audit-batch-executor.sh YYYYMMDD
   ```

### For Batch-Level Stall

1. Check if the batch branch itself is corrupted
2. Verify git status is clean
3. If stalled with queued components remaining:
   - Finalize with current completed set
   - Failed/skipped components can be added to a new batch

## Monitoring Commands

### Quick Status Check

```bash
node .automaker/services/audit-batch-monitor.js --date YYYYMMDD
```

### JSON Output for Automation

```bash
node .automaker/services/audit-batch-monitor.js --date YYYYMMDD --json
```

### Full Summary Report

```bash
node .automaker/services/audit-batch-monitor.js --date YYYYMMDD --summary
```

## Discord Alerts

Zombie detection automatically triggers alerts to `#dev-alerts`:

```
⚠️ Zombie Detected in Audit Batch

Batch: batch-20260326
Component: hx-dialog
Stuck for: 25min (threshold: 20min)

@Jake Action needed: stop zombie agent and resume batch
```

## Prevention

To minimize zombie risk in batch audits:

1. **Set clear agent prompts** with component scope and time expectations
2. **Use sonnet model** for standard audits (faster than opus)
3. **Keep component audit scope focused** — deep quality, not architectural redesign
4. **Monitor at 20 min mark** — don't wait for 30 min standard threshold
5. **Pre-validate component exists** — skip missing components immediately
