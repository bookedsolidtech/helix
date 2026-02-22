# Hook Performance Audit

**Date:** 2026-02-21
**Auditor:** DevOps Engineer
**Status:** NEEDS OPTIMIZATION

## Current Performance Issues

### Issue #1: Sequential Hook Execution

**Impact:** HIGH

- Pre-commit runs 20+ hooks sequentially
- Each hook has 0.5-3s startup overhead (tsx, TypeScript, ts-morph)
- Total pre-commit time: 30-60s for typical component change

**Current:**

```bash
npm run hooks:type-check-strict       # 3s
npm run hooks:no-hardcoded-values     # 2s
npm run hooks:event-type-safety       # 2.5s
npm run hooks:jsdoc-coverage          # 2.5s
# ... 16 more hooks
```

**Optimal:**

```bash
npm run hooks:validate-all --parallel  # 10s
```

### Issue #2: Redundant ts-morph Project Creation

**Impact:** MEDIUM

- Each hook creates a new ts-morph Project
- Project creation = 1-2s overhead per hook
- 10 hooks use ts-morph = 10-20s wasted

**Fix:** Shared project context across hooks

### Issue #3: No Caching of Staged Files

**Impact:** LOW

- Each hook calls `git diff --cached`
- 20+ git subprocess calls
- Total overhead: ~1-2s

**Fix:** Pass staged files as argument to hooks

### Issue #4: Test Suite Runs on Every Component Change

**Impact:** CRITICAL

- Gate 2.5 runs `npm run test:library`
- Test suite takes 20-30s
- Runs EVEN if only stories/tests changed

**Fix:** ✅ FIXED - now only runs if implementation files changed

## Recommended Architecture

### Phase 1: Batch Hooks by Tool (Immediate - 50% improvement)

Create composite hooks:

```bash
# All ts-morph checks in one pass
hooks:validate-typescript.ts
  - type-check-strict
  - typescript-any-ban
  - event-type-safety
  - jsdoc-coverage
  - api-breaking-change-detection

# All regex-based checks in one pass
hooks:validate-patterns.ts
  - no-hardcoded-values
  - no-console-logs
  - design-token-enforcement
  - shadow-dom-leak-detection

# All file-existence checks in one pass
hooks:validate-structure.ts
  - component-test-required
  - storybook-validation
  - css-part-documentation
```

**Expected savings:** 30-60s → 15-20s

### Phase 2: Parallel Execution (Medium term - 70% improvement)

Run independent checks in parallel:

```bash
hooks:validate-all.ts --parallel
  ├─ validate-typescript (3s)
  ├─ validate-patterns (2s)
  ├─ validate-structure (1s)
  └─ test:library (20s)
# Total: 20s (parallelized)
```

**Expected savings:** 15-20s → 8-10s

### Phase 3: Incremental Checking (Long term - 90% improvement)

Only check changed files + dependents:

```bash
hooks:validate-incremental.ts
  - Cache previous results
  - Only re-check changed files
  - Skip unchanged components
```

**Expected savings:** 8-10s → 2-3s

## Action Items

- [ ] **P0:** Batch ts-morph checks (Issue #2)
- [ ] **P0:** Skip tests if only stories changed (Issue #4) ✅ DONE
- [ ] **P1:** Parallelize independent hooks (Phase 2)
- [ ] **P1:** Pass staged files as args (Issue #3)
- [ ] **P2:** Implement incremental checking (Phase 3)
- [ ] **P2:** Add hook execution timing metrics

## Performance Budget

| Operation                      | Current | Target | Status   |
| ------------------------------ | ------- | ------ | -------- |
| Pre-commit (component change)  | 40-60s  | <10s   | ❌ OVER  |
| Pre-commit (test/story change) | 30-40s  | <5s    | ✅ FIXED |
| Pre-commit (doc change)        | 5-10s   | <3s    | ✅ OK    |
| Individual hook overhead       | 0.5-3s  | <0.2s  | ❌ OVER  |

## Notes

- Hooks are inherently slow due to TypeScript/ts-morph overhead
- Best ROI: batching + parallelization
- Consider Rust-based linting tools for critical path (e.g., oxc instead of ts-morph)
