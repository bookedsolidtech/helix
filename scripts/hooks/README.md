# TypeScript Git Hooks

Automated TypeScript quality enforcement hooks for wc-2026.

## Overview

This directory contains Git hooks that enforce TypeScript strict mode compliance, type safety, and best practices. Hooks run automatically on `git commit` via Husky.

## Available Hooks

### [Implemented]

- **example-no-any-types.ts** - Example implementation showing the pattern
- **type-check-strict.ts** (H01) - Comprehensive TypeScript strict mode enforcement
- **no-hardcoded-values.ts** (H02) - Prevent hardcoded design values, enforce design tokens
- **test-coverage-gate.ts** (H03) - Enforce 80%+ test coverage on component files
- **bundle-size-guard.ts** (H04) - Enforce per-component (<5KB) and total bundle (<50KB) size limits
- **cem-accuracy-check.ts** (H05) - Validate Custom Elements Manifest accuracy
- **a11y-regression-guard.ts** (H06) - Prevent accessibility regressions
- **event-type-safety.ts** (H07) - Enforce `CustomEvent<DetailType>` with exported interfaces
- **jsdoc-coverage.ts** (H08) - Enforce 100% JSDoc coverage on public APIs

### [Planned]

1. **cem-type-sync.ts** (H09) - Sync CEM types with source (may be redundant with H05)

## Hook Execution Order

```
git commit
     |
     v
[Husky pre-commit]
     |
     v
[lint-staged] - Format & lint
     |
     v
[TypeScript Hooks] - Sequential execution
  ├─ type-check-strict (H01)
  │    ├─ Explicit any detection
  │    ├─ @ts-ignore validation
  │    ├─ Non-null assertion checks
  │    ├─ Return type enforcement
  │    └─ Parameter type enforcement
  │
  └─ no-hardcoded-values (H02)
       ├─ Hex color detection
       ├─ Hardcoded spacing/sizing
       ├─ Font-family strings
       ├─ Z-index scale validation
       └─ Raw color keywords
  │
  └─ test-coverage-gate (H03)
       ├─ Line coverage (80%+ required)
       ├─ Branch coverage (80%+ required)
       ├─ Function coverage (80%+ required)
       └─ Statement coverage (80%+ required)
  │
  └─ bundle-size-guard (H04)
       ├─ Per-component size (<5KB min+gz)
       ├─ Full bundle size (<50KB min+gz)
       ├─ Build artifact validation
       └─ Performance budget enforcement
  │
  └─ cem-accuracy-check (H05)
       ├─ CEM vs source validation
       ├─ Properties, events, slots, CSS parts
       ├─ Multi-source event detection
       └─ Completeness verification
  │
  └─ a11y-regression-guard (H06)
       ├─ Invalid ARIA attributes
       ├─ Invalid role attributes
       ├─ Missing alt text
       ├─ Keyboard navigation
       ├─ Heading hierarchy
       └─ ARIA reference validation
  │
  └─ event-type-safety (H07)
       ├─ Event naming (hx- prefix)
       ├─ CustomEvent<DetailType> enforcement
       ├─ No inline types (use interfaces)
       ├─ Exported detail interfaces
       └─ JSDoc @fires tag validation
  │
  └─ jsdoc-coverage (H08)
       ├─ Class JSDoc (@summary, @tag)
       ├─ Property JSDoc (@attr if reflected)
       ├─ Method JSDoc (@param, @returns)
       ├─ Event documentation (@fires)
       └─ 100% coverage requirement
     |
     v
[Type Check] - npm run type-check
     |
     v
[Build Validation]
  └─ declaration-completeness
     |
     v
[CEM Sync] - Auto-fix if needed
  └─ cem-type-sync
     |
     v
[Tests] - npm run test:library
     |
     v
[PASS] Commit allowed
```

## Usage

### Run Individual Hook

```bash
# Run TypeScript strict check (H01)
tsx scripts/hooks/type-check-strict.ts
npm run hooks:type-check-strict

# Run no-hardcoded-values check (H02)
tsx scripts/hooks/no-hardcoded-values.ts
npm run hooks:no-hardcoded-values

# Run test-coverage-gate check (H03)
tsx scripts/hooks/test-coverage-gate.ts
npm run hooks:test-coverage-gate

# Run bundle-size-guard check (H04)
tsx scripts/hooks/bundle-size-guard.ts
npm run hooks:bundle-size-guard

# Run cem-accuracy-check (H05)
tsx scripts/hooks/cem-accuracy-check.ts
npm run hooks:cem-accuracy-check

# Run a11y-regression-guard (H06)
tsx scripts/hooks/a11y-regression-guard.ts
npm run hooks:a11y-regression-guard

# Example hook (reference implementation)
tsx scripts/hooks/example-no-any-types.ts
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

| Hook                        | Target   | Timeout | Status        |
| --------------------------- | -------- | ------- | ------------- |
| type-check-strict (H01)     | <3s      | 3s      | [Implemented] |
| no-hardcoded-values (H02)   | <2s      | 2s      | [Implemented] |
| test-coverage-gate (H03)    | <3s      | 3s      | [Implemented] |
| bundle-size-guard (H04)     | <3s      | 3s      | [Implemented] |
| cem-accuracy-check (H05)    | <5s      | 5s      | [Implemented] |
| a11y-regression-guard (H06) | <5s      | 5s      | [Implemented] |
| event-type-safety (H07)     | <2s      | 5s      | [Implemented] |
| jsdoc-coverage (H08)        | <3s      | 5s      | [Implemented] |
| **Total**                   | **<28s** | **41s** | -             |

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
cd /Volumes/Development/wc-2026
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
