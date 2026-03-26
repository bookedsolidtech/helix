# Batch Audit Troubleshooting

## Common Issues and Solutions

### Issue: Agent commits on wrong branch

**Symptom:** Audit commit appears on `dev` or a feature branch instead of the batch branch.

**Fix:**
1. Cherry-pick the commit to the batch branch:
   ```bash
   git checkout audit/deep-quality-batch-YYYYMMDD
   git cherry-pick <sha>
   ```
2. Revert on the wrong branch if needed
3. Resume batch execution

**Prevention:** Always verify branch before agent execution:
```bash
git branch --show-current
```

---

### Issue: Metadata file shows component stuck in `in_progress`

**Symptom:** The batch appears stalled with a component that never completed.

**Fix:**
1. Check if the agent is still running (check costs, output)
2. If zombie: stop agent via anti-respawn protocol
3. Update metadata manually:
   ```bash
   node -e "
     const fs = require('fs');
     const m = JSON.parse(fs.readFileSync('.automaker/audits/batch-YYYYMMDD-metadata.json', 'utf-8'));
     m.components.in_progress = null;
     m.components.failed.push('hx-stuck-component');
     m.components.queued = m.components.queued.filter(c => c !== 'hx-stuck-component');
     fs.writeFileSync('.automaker/audits/batch-YYYYMMDD-metadata.json', JSON.stringify(m, null, 2) + '\\n');
   "
   ```
4. Resume with next component

---

### Issue: coverage-config.json has invalid JSON after agent commit

**Symptom:** CI fails with JSON parse error on coverage-config.json.

**Fix:**
1. Validate the file:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('packages/hx-library/coverage-config.json','utf-8'))"
   ```
2. If invalid, fix the syntax error
3. Run the consolidation script:
   ```bash
   node .automaker/scripts/consolidate-shared-files.js --consolidate coverage-config.json
   ```
4. Commit the fix: `audit-batch: fix coverage-config.json syntax`

---

### Issue: Batch branch falls behind dev

**Symptom:** Merge conflicts when creating PR to dev, or CI failures from stale code.

**Fix:**
1. Rebase onto latest dev:
   ```bash
   git fetch origin dev
   git rebase origin/dev
   ```
2. Resolve any conflicts (take batch branch changes for audit-specific files)
3. Force push the rebased branch:
   ```bash
   HUSKY=0 git push origin audit/deep-quality-batch-YYYYMMDD --force-with-lease
   ```
4. Resume batch execution

**Note:** If the batch is >20 commits behind dev, this is expected per deviation rules.

---

### Issue: Multiple changeset files created instead of consolidated

**Symptom:** `.changeset/` directory has N files instead of 1.

**Fix:**
1. Run consolidation:
   ```bash
   node .automaker/scripts/consolidate-audit-changeset.js --date YYYYMMDD --cleanup
   ```
2. Verify single changeset remains:
   ```bash
   ls .changeset/*.md | grep -v README.md
   ```
3. Commit: `audit-batch: consolidate changesets`

---

### Issue: CI runs multiple times during batch execution

**Symptom:** Each push to the batch branch triggers a full CI run.

**Explanation:** This is expected behavior for pushes. The batch optimization
reduces CI from N PRs to 1 PR. Pushes during batch execution use the lightweight
`audit-batch-checks.yml` workflow (validation only), not the full CI.

The full CI only runs when the PR is created at the end.

---

### Issue: PR creation fails with "no commits between dev and branch"

**Symptom:** `gh pr create` reports no difference.

**Fix:**
1. Verify commits exist:
   ```bash
   git log origin/dev..HEAD --oneline
   ```
2. If empty, the batch branch may have been rebased incorrectly
3. Check if all changes were already merged to dev

---

### Issue: Auto-merge not enabling

**Symptom:** `gh pr merge --auto` fails with error about required checks.

**Fix:**
1. Ensure all required status checks are configured to match:
   - The `audit-batch-ci.yml` quality gates job name
   - OR the main `ci.yml` quality gates job name
2. Check branch protection rules:
   ```bash
   gh api repos/bookedsolidtech/helix/branches/dev/protection
   ```

---

### Issue: Agent modifies files outside its component scope

**Symptom:** Git diff shows changes in components not assigned to the current agent.

**Fix:**
1. Review the diff to identify out-of-scope changes
2. Revert out-of-scope files:
   ```bash
   git checkout origin/dev -- packages/hx-library/src/components/hx-other-component/
   ```
3. Re-commit with only in-scope changes
4. Add component scope constraint to agent prompt

---

## Escalation

If none of the above solutions work:

1. Document the exact error and steps taken
2. Check if this matches a known bug in the project memory
3. Escalate to Jake with full context
4. Do NOT continue making speculative changes after 3 failed attempts
