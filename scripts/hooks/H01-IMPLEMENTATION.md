# H01: Type-Check-Strict Pre-Commit Hook

**Status**: ✅ Implemented
**Date**: 2026-02-20
**Author**: TypeScript Specialist
**Execution Budget**: <3 seconds

## Overview

The `type-check-strict` hook enforces TypeScript strict mode compliance on staged files before commit. It catches common type safety violations and provides actionable suggestions for fixes.

## Features

### 1. Explicit `any` Type Detection

**What it catches:**

```typescript
// ❌ Blocked
function process(data: any) {
  return data;
}

const handler = (param: any) => param;
```

**Suggested fix:**

```typescript
// ✅ Correct
function process(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  return data;
}

const handler = (param: string | number) => param;
```

**Approved exception:**

```typescript
// @typescript-specialist-approved: TICKET-123 Legacy API requires any
function legacyIntegration(data: any): void {
  // Third-party library expects any type
}
```

### 2. `@ts-ignore` Comment Validation

**What it catches:**

```typescript
// ❌ Blocked
// @ts-ignore
const value = someUntypedAPI();
```

**Suggested fix:**

```typescript
// ✅ Correct - Use @ts-expect-error with explanation
// @ts-expect-error - Third-party type definitions missing, tracked in TICKET-456
const value = someUntypedAPI();

// ✅ Correct - Or with approval
// @typescript-specialist-approved: TICKET-123 Temporary until library updates
// @ts-ignore
const value = someUntypedAPI();
```

### 3. Non-Null Assertion (`!`) Detection

**What it catches:**

```typescript
// ❌ Blocked
function getLength(value: string | undefined) {
  return value!.length;
}

const element = document.querySelector('.selector')!;
```

**Suggested fix:**

```typescript
// ✅ Correct - Use optional chaining and nullish coalescing
function getLength(value: string | undefined): number {
  return value?.length ?? 0;
}

const element = document.querySelector('.selector') ?? undefined;

// ✅ Correct - Or proper null checks
function getLength(value: string | undefined): number {
  if (value === undefined) {
    throw new Error('Value is required');
  }
  return value.length;
}
```

### 4. Missing Return Type Annotations

**What it catches:**

```typescript
// ❌ Blocked - Public methods need explicit return types
export class MyComponent extends LitElement {
  public getValue() {
    return this.value;
  }
}

// ❌ Blocked - Exported functions need explicit return types
export function calculate(a: number, b: number) {
  return a + b;
}

export const transform = (data: string) => {
  return data.toUpperCase();
};
```

**Suggested fix:**

```typescript
// ✅ Correct
export class MyComponent extends LitElement {
  public getValue(): string {
    return this.value;
  }
}

export function calculate(a: number, b: number): number {
  return a + b;
}

export const transform = (data: string): string => {
  return data.toUpperCase();
};
```

**Exemptions:**

- Private methods (marked with `private` modifier)
- Methods starting with `_` (private by convention)
- Lit lifecycle methods (`render`, `connectedCallback`, etc.)
- Functions with `void` return type

### 5. Missing Parameter Type Annotations

**What it catches:**

```typescript
// ❌ Blocked
export function process(value) {
  return value.toString();
}

export class MyComponent {
  public handle(event) {
    console.log(event);
  }
}
```

**Suggested fix:**

```typescript
// ✅ Correct
export function process(value: string | number): string {
  return value.toString();
}

export class MyComponent {
  public handle(event: CustomEvent): void {
    console.log(event);
  }
}
```

**Exemptions:**

- Parameters with default values (type inferred)

```typescript
// ✅ Allowed - Type inferred from default
function greet(name = 'World') {
  console.log(`Hello, ${name}`);
}
```

## Integration

### Pre-Commit Hook

The hook is integrated into the pre-commit workflow via `scripts/pre-commit-check.sh`:

```bash
# Gate 1: TypeScript Strict Mode
if [ -n "$STAGED_TS_FILES" ]; then
  if npm run hooks:type-check-strict --silent; then
    echo "✅ TypeScript strict check passed"
  else
    echo "❌ TypeScript strict check failed"
    FAILED=1
  fi
fi
```

### NPM Script

Run manually:

```bash
npm run hooks:type-check-strict
```

### Direct Execution

```bash
tsx scripts/hooks/type-check-strict.ts
```

## Performance

**Target**: <3 seconds
**Timeout**: 3 seconds (hard limit)
**Average**: ~1-2 seconds on typical commits (1-5 files)

### Optimization Strategies

1. **Staged Files Only**: Only checks files staged for commit
2. **Incremental Checking**: Skips unchanged files
3. **Early Termination**: Stops at timeout (3s)
4. **Memory Management**: Releases parsed AST after each file
5. **Pattern Filtering**: Excludes test files, stories, declaration files

### Excluded Patterns

- `**/*.test.ts` - Test files
- `**/*.spec.ts` - Spec files
- `**/*.stories.ts` - Storybook stories
- `**/*.d.ts` - Declaration files
- `**/test-utils.ts` - Test utilities
- `**/dist/**` - Build output
- `**/node_modules/**` - Dependencies

## Error Output Format

The hook provides clear, actionable error messages:

```
🔴 /path/to/file.ts:42:15
   Explicit "any" type detected
   💡 Use "unknown" and narrow with type guards, or define a proper type
   param: any

🔴 /path/to/file.ts:58:3
   @ts-ignore without approval
   💡 Use @ts-expect-error with explanation, or add approval: // @typescript-specialist-approved: TICKET-123 Reason
   // @ts-ignore

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary:
   Files checked: 3
   Total violations: 2
   Critical: 2
   Warnings: 0

❌ Commit blocked due to critical violations
```

## Approval Mechanism

For exceptional cases, add an approval comment:

```typescript
// @typescript-specialist-approved: TICKET-123 Brief reason why this is needed
const problematicCode: any = legacyAPI();
```

**Requirements:**

- Must include ticket/issue number
- Must include brief reason
- Requires TypeScript Specialist review in PR
- Will be flagged in code review

**Valid approval formats:**

```typescript
// @typescript-specialist-approved: TICKET-123 Reason
// @typescript-specialist-approved: ISSUE-456 Explanation
/* @typescript-specialist-approved: HELIX-789 Multi-line
   explanation of why this is needed */
```

## Bypass (Emergency Only)

If you must bypass the hook (NOT recommended):

```bash
git commit --no-verify -m "hotfix: critical production bug"
```

**After bypassing:**

1. Create a follow-up ticket
2. Fix violations in next commit
3. Document why bypass was necessary

## Testing

### Test File

A test file is available at `/Volumes/Development/wc-2026/test-hook-violations.ts` that demonstrates all violation types.

### Manual Testing

```bash
# Stage the test file
git add test-hook-violations.ts

# Run the hook
npm run hooks:type-check-strict

# Should show 11 violations (5 types + duplicates)
```

### Expected Output

```
📁 Checking 1 file(s) for TypeScript strict violations...
⏱️  Completed in XXXms

🔴 Found 11 critical violation(s):

🔴 test-hook-violations.ts:5:36
   Explicit "any" type detected

🔴 test-hook-violations.ts:9:17
   @ts-ignore without approval

🔴 test-hook-violations.ts:17:10
   Non-null assertion (!) without justification

🔴 test-hook-violations.ts:21:1
   Exported function "missingReturnType" missing explicit return type

🔴 test-hook-violations.ts:26:34
   Parameter "value" in function "missingParamType" missing type annotation

❌ Commit blocked due to critical violations
```

## Implementation Details

### Technology Stack

- **ts-morph**: TypeScript AST manipulation
- **Node.js**: Execution environment
- **tsx**: TypeScript execution (no build step)

### Architecture

```
type-check-strict.ts
├── Types
│   ├── Violation
│   └── ValidationResult
├── Configuration
│   ├── Include patterns
│   ├── Exclude patterns
│   └── Approval comment format
├── Utilities
│   ├── getStagedFiles()
│   ├── hasApprovalComment()
│   └── formatViolation()
├── Validators
│   ├── checkExplicitAny()
│   ├── checkTsIgnore()
│   ├── checkNonNullAssertions()
│   ├── checkMissingReturnTypes()
│   └── checkMissingParameterTypes()
├── Main Validation
│   └── validateTypeCheckStrict()
└── CLI Entry Point
    └── main()
```

### Type Safety

The hook itself follows all TypeScript strict mode rules:

- No `any` types
- Explicit return types
- Explicit parameter types
- No `@ts-ignore`
- No non-null assertions

## Statistics

**Files analyzed**: All staged `.ts` and `.tsx` files (excluding test/story files)
**Checks performed per file**: 5 (any, ts-ignore, non-null, return types, param types)
**Exit codes**:

- `0` - No violations or warnings only
- `1` - Critical violations found

## Future Enhancements

1. **Caching**: Cache results for unchanged files
2. **Parallel Execution**: Process multiple files in parallel
3. **Auto-Fix**: Suggest auto-fixes for common violations
4. **Metrics**: Track violation trends over time
5. **IDE Integration**: Real-time checking in editor

## Maintenance

**Owner**: TypeScript Specialist
**Last Updated**: 2026-02-20
**Version**: 1.0.0

### Updating the Hook

1. Make changes to `scripts/hooks/type-check-strict.ts`
2. Test with `npm run hooks:type-check-strict`
3. Update this documentation
4. Commit changes (hook will validate itself!)

## Support

**Issues**: Create GitHub issue with `[H01]` prefix
**Questions**: Slack `#typescript-help` channel
**Documentation**: `/scripts/hooks/README.md`

---

**Zero-Tolerance Policy**: This hook enforces the project's zero-tolerance policy for TypeScript strict mode violations. Every violation must be fixed or explicitly approved.
