# TypeScript Git Hooks

Automated quality enforcement hooks for wc-2026 enterprise healthcare web component library.

## Quick Status

**Implementation Progress:** 12/24 hooks (50% complete)

| Metric                   | Value                      |
| ------------------------ | -------------------------- |
| **Phase 1**              | 7/7 hooks (100%) ✅        |
| **Phase 2**              | 5/6 hooks (83%) 🟢         |
| **Phase 3**              | 0/8 hooks (0%) ⏳          |
| **Phase 4**              | 0/4 hooks (0%) ⏳          |
| **Total Implementation** | 9,486 lines of code        |
| **Test Coverage**        | 536 tests across all hooks |
| **Execution Budget**     | <30.5s (implemented hooks) |
| **Pre-commit Gates**     | 11 active gates            |
| **Commit-msg Gates**     | 1 active gate              |

---

## Overview

This directory contains Git hooks that enforce:

- TypeScript strict mode compliance
- Design token usage (no hardcoded values)
- Test coverage (80%+ required)
- Component documentation (Storybook + JSDoc)
- Accessibility (WCAG 2.1 AA)
- Bundle size budgets
- Custom Elements Manifest accuracy
- Event type safety
- Code quality standards

Hooks run automatically on `git commit` and `git commit -m` via Husky.

## Implementation Status

**Overall Progress:** 12/24 hooks complete (50%)

- **Phase 1:** 7/7 hooks (100%) ✅
- **Phase 2:** 5/6 hooks (83%) 🟢
- **Phase 3:** 0/8 hooks (0%) ⏳
- **Phase 4:** 0/4 hooks (0%) ⏳

---

## Phase 1: Foundation (100% Complete) ✅

**Focus:** Core quality gates (TypeScript, Lint, CEM, Bundle Size, Testing)

| Hook | Name                    | Priority | Owner                   | Budget | Status         |
| ---- | ----------------------- | -------- | ----------------------- | ------ | -------------- |
| H01  | type-check-strict       | P0       | TypeScript Specialist   | <5s    | ✅ Implemented |
| H02  | no-hardcoded-values     | P0       | Design System Developer | <2s    | ✅ Implemented |
| H03  | test-coverage-gate      | P0       | QA Engineer             | <3s    | ✅ Implemented |
| H04  | bundle-size-guard       | P1       | Performance Engineer    | <3s    | ✅ Implemented |
| H05  | cem-accuracy-check      | P0       | Lit Specialist          | <5s    | ✅ Implemented |
| H06  | a11y-regression-guard   | P1       | Accessibility Engineer  | <5s    | ✅ Implemented |
| H10  | component-test-required | P0       | QA Engineer             | <1s    | ✅ Implemented |

**Phase 1 Deliverables:**

- ✅ All hooks implemented and tested
- ✅ Integrated into pre-commit flow
- ✅ 419 tests covering all hooks
- ✅ Execution time: <23s total

---

## Phase 2: Core Gates (83% Complete) 🟢

**Focus:** Testing, Coverage, Storybook, Design Tokens, Commit Standards

| Hook | Name                     | Priority | Owner                   | Budget | Status                       |
| ---- | ------------------------ | -------- | ----------------------- | ------ | ---------------------------- |
| H07  | event-type-safety        | P0       | TypeScript Specialist   | <2s    | ✅ Implemented               |
| H08  | jsdoc-coverage           | P0       | Storybook Specialist    | <3s    | ✅ Implemented               |
| H09  | storybook-validation     | P0       | Storybook Specialist    | <1s    | ✅ Implemented               |
| H11  | commit-msg-convention    | P1       | VP Engineering          | <0.5s  | ✅ Implemented               |
| H12  | no-console-logs          | P1       | Code Reviewer           | <1s    | ✅ Implemented               |
| H13  | design-token-enforcement | P0       | Design System Developer | <2s    | ⏳ Deferred (covered by H02) |

**Phase 2 Deliverables:**

- ✅ 5/6 hooks implemented
- ✅ Commit-msg hook integrated
- ✅ 217 new tests added
- ✅ H13 deferred (redundant with H02)

---

## Phase 3: Advanced Checks (0% Complete) ⏳

**Focus:** VRT, Drupal, Shadow DOM, API Diff, Performance

| Hook | Name                          | Priority | Owner                         | Budget | Status         |
| ---- | ----------------------------- | -------- | ----------------------------- | ------ | -------------- |
| H14  | vrt-critical-paths            | P1       | QA Engineer                   | <60s   | ⏳ Not Started |
| H15  | drupal-compat-check           | P1       | Drupal Integration Specialist | <10s   | ⏳ Not Started |
| H16  | shadow-dom-leak-detection     | P1       | Lit Specialist                | <5s    | ⏳ Not Started |
| H17  | typescript-any-ban            | P1       | TypeScript Specialist         | <1s    | ⏳ Not Started |
| H18  | api-breaking-change-detection | P1       | Principal Engineer            | <5s    | ⏳ Not Started |
| H19  | lighthouse-performance        | P1       | Performance Engineer          | <45s   | ⏳ Not Started |
| H20  | animation-budget-check        | P2       | CSS3 Animation Purist         | <2s    | ⏳ Not Started |
| H21  | dependency-audit              | P2       | Staff Software Engineer       | <8s    | ⏳ Not Started |

**Phase 3 Planned:**

- 8 hooks targeting advanced quality checks
- Visual regression testing integration
- Drupal compatibility validation
- Performance and security audits
- Estimated effort: 96 hours

---

## Phase 4: Polish & Optimization (0% Complete) ⏳

**Focus:** Documentation, Versioning, Dead Code, Health Scoring

| Hook | Name                       | Priority | Owner                   | Budget | Status         |
| ---- | -------------------------- | -------- | ----------------------- | ------ | -------------- |
| H22  | documentation-completeness | P2       | Technical Writer        | <3s    | ⏳ Not Started |
| H23  | semantic-versioning        | P2       | DevOps Engineer         | <2s    | ⏳ Not Started |
| H24  | dead-code-elimination      | P2       | Senior Code Reviewer    | <10s   | ⏳ Not Started |
| H25  | css-part-documentation     | P2       | Design System Developer | <3s    | ⏳ Not Started |

**Phase 4 Planned:**

- 4 hooks for polish and optimization
- Automated changeset generation
- Dead code detection
- Documentation completeness
- Estimated effort: 64 hours

---

## Deferred / Skipped

| Hook    | Name                     | Reason             | Alternative                                 |
| ------- | ------------------------ | ------------------ | ------------------------------------------- |
| ~~H09~~ | cem-type-sync            | Redundant with H05 | Manual `npm run cem` when H05 detects drift |
| ~~H13~~ | design-token-enforcement | Duplicate of H02   | H02 already enforces design tokens          |

## Hook Execution Order

### Pre-commit Flow (11 Gates)

```
git commit
     |
     v
[Husky pre-commit]
     |
     v
[lint-staged] - Format & lint with ESLint + Prettier
     |
     v
[Quality Gates] - Sequential execution
  │
  ├─ Gate 1: TypeScript Strict Mode (H01)
  │    ├─ Explicit any detection
  │    ├─ @ts-ignore validation
  │    ├─ Non-null assertion checks
  │    ├─ Return type enforcement
  │    └─ Parameter type enforcement
  │
  ├─ Gate 1.5: No Hardcoded Values (H02)
  │    ├─ Hex color detection
  │    ├─ Hardcoded spacing/sizing
  │    ├─ Font-family strings
  │    ├─ Z-index scale validation
  │    └─ Raw color keywords
  │
  ├─ Gate 1.7: Event Type Safety (H07)
  │    ├─ Event naming (hx- prefix)
  │    ├─ CustomEvent<DetailType> enforcement
  │    ├─ No inline types (use interfaces)
  │    ├─ Exported detail interfaces
  │    └─ JSDoc @fires tag validation
  │
  ├─ Gate 1.8: JSDoc Coverage (H08)
  │    ├─ Class JSDoc (@summary, @tag)
  │    ├─ Property JSDoc (@attr if reflected)
  │    ├─ Method JSDoc (@param, @returns)
  │    ├─ Event documentation (@fires)
  │    └─ 100% coverage requirement
  │
  ├─ Gate 1.9: Component Test Required (H10)
  │    ├─ Validates every hx-*.ts has hx-*.test.ts
  │    └─ Prevents untested components
  │
  ├─ Gate 1.10: Storybook Validation (H09)
  │    ├─ Validates every hx-*.ts has hx-*.stories.ts
  │    └─ Prevents undocumented components
  │
  ├─ Gate 1.11: No Console Logs (H12)
  │    ├─ Detects console.log/debug/warn/error
  │    ├─ Excludes test/story/config files
  │    └─ Approval mechanism (@console-approved)
  │
  ├─ Gate 2: Test Coverage Gate (H03)
  │    ├─ Line coverage (80%+ required)
  │    ├─ Branch coverage (80%+ required)
  │    ├─ Function coverage (80%+ required)
  │    └─ Statement coverage (80%+ required)
  │
  ├─ Gate 2.2: Accessibility Regression Guard (H06)
  │    ├─ Invalid ARIA attributes
  │    ├─ Invalid role attributes
  │    ├─ Missing alt text
  │    ├─ Keyboard navigation
  │    ├─ Heading hierarchy
  │    └─ ARIA reference validation
  │
  ├─ Gate 2.5: Test Modified Components
  │    └─ Run tests for changed components
  │
  ├─ Gate 3: Bundle Size Guard (H04)
  │    ├─ Per-component size (<5KB min+gz)
  │    ├─ Full bundle size (<50KB min+gz)
  │    ├─ Build artifact validation
  │    └─ Performance budget enforcement
  │
  └─ Gate 4: CEM Accuracy (H05)
       ├─ CEM vs source validation
       ├─ Properties, events, slots, CSS parts
       ├─ Multi-source event detection
       └─ Completeness verification
     |
     v
[PASS] Commit allowed
```

### Commit-msg Flow (1 Gate)

```
git commit -m "message"
     |
     v
[Husky commit-msg]
     |
     v
[H11: Commit Message Convention]
  ├─ Validates conventional commit format
  ├─ Checks type (feat/fix/docs/etc)
  ├─ Validates subject length (<100 chars)
  ├─ Checks for imperative mood
  ├─ Warns on capitalization
  └─ Warns on past tense
     |
     v
[PASS] Commit message accepted
```

## Usage

### Run Individual Hooks

**Phase 1 Hooks:**

```bash
# H01: TypeScript strict mode
npm run hooks:type-check-strict

# H02: No hardcoded values
npm run hooks:no-hardcoded-values

# H03: Test coverage gate
npm run hooks:test-coverage-gate

# H04: Bundle size guard
npm run hooks:bundle-size-guard

# H05: CEM accuracy check
npm run hooks:cem-accuracy-check

# H06: Accessibility regression guard
npm run hooks:a11y-regression-guard

# H10: Component test required
npm run hooks:component-test-required
```

**Phase 2 Hooks:**

```bash
# H07: Event type safety
npm run hooks:event-type-safety

# H08: JSDoc coverage
npm run hooks:jsdoc-coverage

# H09: Storybook validation
npm run hooks:storybook-validation

# H11: Commit message convention (requires commit message file)
npm run hooks:commit-msg-convention .git/COMMIT_EDITMSG

# H12: No console logs
npm run hooks:no-console-logs
```

### Run All Hooks

```bash
# Triggered automatically on commit
git commit -m "feat: add component"

# Or manually run pre-commit hook
bash .husky/pre-commit
```

### Skip Hooks (Emergency Only)

```bash
# Skip all hooks (NOT RECOMMENDED)
git commit --no-verify -m "hotfix: critical bug"

# You MUST fix violations in a follow-up commit
```

## Hook Configuration

Each hook can be configured via `scripts/hooks/config.ts`:

```typescript
export const HOOK_CONFIG = {
  enabled: {
    'no-any-types': true,
    'event-type-safety': true,
    'jsdoc-coverage': true,
    'cem-type-sync': true,
    'declaration-completeness': true,
    'generic-patterns': true,
  },
  blocking: {
    'no-any-types': true, // Block commit
    'event-type-safety': true,
    'jsdoc-coverage': false, // Warning only
    'cem-type-sync': false, // Auto-fix
    'declaration-completeness': true,
    'generic-patterns': true,
  },
  thresholds: {
    jsdocCoverage: 100, // Require 100% coverage
    executionTimeout: 60000, // 60s max
  },
};
```

## Approval Mechanism

For exceptional cases where a violation is justified, add an approval comment:

```typescript
// @typescript-specialist-approved: TICKET-123 Reason for exception
function legacyAPI(data: any): void {
  // Legacy integration requires any type
}
```

**Requirements:**

- Must include ticket number
- Must include reason
- Requires TypeScript Specialist review in PR

## Hook Development

### Creating a New Hook

1. Copy `example-no-any-types.ts` as template
2. Implement validation logic
3. Add tests
4. Update `config.ts`
5. Add npm script to root `package.json`
6. Update `.husky/pre-commit`

### Hook Template Structure

```typescript
#!/usr/bin/env tsx
import { Project } from 'ts-morph';

interface Violation {
  file: string;
  line: number;
  column: number;
  message: string;
  suggestion: string;
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: Record<string, number>;
}

async function validateHookName(): Promise<ValidationResult> {
  // 1. Get staged files
  const stagedFiles = getStagedFiles();

  // 2. Initialize ts-morph project
  const project = new Project({ tsConfigFilePath: './tsconfig.base.json' });

  // 3. Analyze each file
  const violations: Violation[] = [];
  for (const file of stagedFiles) {
    const sourceFile = project.addSourceFileAtPath(file);
    // Run checks...
  }

  // 4. Return result
  return {
    passed: violations.length === 0,
    violations,
    stats: { filesChecked: stagedFiles.length },
  };
}

async function main() {
  const result = await validateHookName();
  process.exit(result.passed ? 0 : 1);
}

main();
```

### Testing Hooks

```bash
# Test on staged files
git add packages/hx-library/src/components/hx-button/hx-button.ts
tsx scripts/hooks/example-no-any-types.ts

# Test on specific files
tsx scripts/hooks/example-no-any-types.ts --files "src/**/*.ts"
```

## Performance Optimization

### Target Execution Times

**Implemented Hooks:**

| Hook                          | Target     | Timeout | Status         | Phase |
| ----------------------------- | ---------- | ------- | -------------- | ----- |
| type-check-strict (H01)       | <3s        | 3s      | ✅ Implemented | 1     |
| no-hardcoded-values (H02)     | <2s        | 2s      | ✅ Implemented | 1     |
| test-coverage-gate (H03)      | <3s        | 3s      | ✅ Implemented | 1     |
| bundle-size-guard (H04)       | <3s        | 3s      | ✅ Implemented | 1     |
| cem-accuracy-check (H05)      | <5s        | 5s      | ✅ Implemented | 1     |
| a11y-regression-guard (H06)   | <5s        | 5s      | ✅ Implemented | 1     |
| event-type-safety (H07)       | <2s        | 5s      | ✅ Implemented | 2     |
| jsdoc-coverage (H08)          | <3s        | 5s      | ✅ Implemented | 2     |
| storybook-validation (H09)    | <1s        | 5s      | ✅ Implemented | 2     |
| component-test-required (H10) | <1s        | 5s      | ✅ Implemented | 1     |
| commit-msg-convention (H11)   | <0.5s      | 5s      | ✅ Implemented | 2     |
| no-console-logs (H12)         | <1s        | 5s      | ✅ Implemented | 2     |
| **Subtotal (Implemented)**    | **<30.5s** | **55s** | -              | -     |

**Planned Hooks (Phase 3-4):**

| Hook                                | Target    | Timeout  | Status     | Phase |
| ----------------------------------- | --------- | -------- | ---------- | ----- |
| vrt-critical-paths (H14)            | <60s      | 120s     | ⏳ Planned | 3     |
| drupal-compat-check (H15)           | <10s      | 15s      | ⏳ Planned | 3     |
| shadow-dom-leak-detection (H16)     | <5s       | 10s      | ⏳ Planned | 3     |
| typescript-any-ban (H17)            | <1s       | 5s       | ⏳ Planned | 3     |
| api-breaking-change-detection (H18) | <5s       | 10s      | ⏳ Planned | 3     |
| lighthouse-performance (H19)        | <45s      | 90s      | ⏳ Planned | 3     |
| animation-budget-check (H20)        | <2s       | 5s       | ⏳ Planned | 3     |
| dependency-audit (H21)              | <8s       | 15s      | ⏳ Planned | 3     |
| documentation-completeness (H22)    | <3s       | 5s       | ⏳ Planned | 4     |
| semantic-versioning (H23)           | <2s       | 5s       | ⏳ Planned | 4     |
| dead-code-elimination (H24)         | <10s      | 20s      | ⏳ Planned | 4     |
| css-part-documentation (H25)        | <3s       | 5s       | ⏳ Planned | 4     |
| **Subtotal (Planned)**              | **<154s** | **305s** | -          | -     |

**Total (All 24 Hooks):**

- **Target:** <184.5s (~3 minutes)
- **Timeout:** <360s (6 minutes)
- **Current Average (12 hooks):** <2s per commit

### Optimization Strategies

1. **Parallel Execution**: Independent hooks run in parallel
2. **Incremental Analysis**: Only check staged files
3. **AST Caching**: Share parsed AST between hooks
4. **Bail Fast**: Stop at first critical violation
5. **Skip in CI**: Some hooks only run locally

### Caching

Hooks use file-based caching to skip unchanged files:

```typescript
import { getCachedResult, setCachedResult } from './cache';

const cached = getCachedResult('no-any-types', stagedFiles);
if (cached) {
  return cached;
}

const result = await validateNoAnyTypes();
setCachedResult('no-any-types', stagedFiles, result);
```

## Troubleshooting

### Hook Fails with "tsconfig.base.json not found"

Run from repo root:

```bash
cd <project-root>
tsx scripts/hooks/example-no-any-types.ts
```

### Hook Times Out

Increase timeout in `config.ts` or disable slow hooks:

```typescript
blocking: {
  'slow-hook': false, // Run as warning only
}
```

### False Positives

Add approval comment:

```typescript
// @typescript-specialist-approved: TICKET-123 Reason
```

### Hook Always Fails

Check Git status:

```bash
# Verify files are staged
git status

# Verify hook script is executable
ls -la .husky/pre-commit
chmod +x .husky/pre-commit
```

## Metrics & Monitoring

### Hook Execution Metrics

Metrics are logged to `.cache/hooks/metrics.json`:

```json
{
  "timestamp": "2026-02-20T10:30:00Z",
  "hooks": {
    "no-any-types": {
      "duration": 1245,
      "filesChecked": 5,
      "violations": 0,
      "passed": true
    }
  },
  "total": {
    "duration": 23450,
    "passed": true
  }
}
```

### View Metrics

```bash
# Show recent hook executions
cat .cache/hooks/metrics.json | jq '.hooks'

# Show average execution time
cat .cache/hooks/metrics.json | jq '.total.duration' | awk '{sum+=$1; n++} END {print sum/n "ms"}'
```

## Integration with CI/CD

Hooks run in CI via GitHub Actions:

```yaml
# .github/workflows/quality.yml
- name: Run TypeScript Hooks
  run: |
    npm run hooks:no-any-types
    npm run hooks:event-type-safety
    npm run hooks:jsdoc-coverage
```

Hooks are **more strict in CI** (no bypass option).

## Support

- **Documentation**: `/docs/typescript-automation-proposal.md`
- **Slack**: `#typescript-help`
- **Owner**: TypeScript Specialist
- **Office Hours**: Tuesdays 2-4pm

## Contributing

1. Fork repo
2. Create hook in `scripts/hooks/`
3. Add tests
4. Update documentation
5. Submit PR with `[hooks]` prefix
6. Request review from TypeScript Specialist

---

**Last Updated**: 2026-02-20
**Maintainer**: TypeScript Specialist
