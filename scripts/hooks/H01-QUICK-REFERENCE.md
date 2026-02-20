# H01 Type-Check-Strict Hook - Quick Reference

## TL;DR

Pre-commit hook that blocks commits with TypeScript strict mode violations.

## Common Violations & Fixes

### 1. Explicit `any` ❌

**Blocked:**

```typescript
function process(data: any) {}
```

**Fix:**

```typescript
function process(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
}
```

### 2. `@ts-ignore` ❌

**Blocked:**

```typescript
// @ts-ignore
const value = api();
```

**Fix:**

```typescript
// @ts-expect-error - Missing type definitions (TICKET-123)
const value = api();
```

### 3. Non-null assertion `!` ❌

**Blocked:**

```typescript
const length = value!.length;
```

**Fix:**

```typescript
const length = value?.length ?? 0;
```

### 4. Missing return type ❌

**Blocked:**

```typescript
export function calculate(a: number, b: number) {
  return a + b;
}
```

**Fix:**

```typescript
export function calculate(a: number, b: number): number {
  return a + b;
}
```

### 5. Missing parameter type ❌

**Blocked:**

```typescript
export function handle(event) {}
```

**Fix:**

```typescript
export function handle(event: CustomEvent): void {}
```

## Approved Exceptions

For legitimate exceptions:

```typescript
// @typescript-specialist-approved: TICKET-123 Legacy API requires any
function legacy(data: any): void {}
```

**Must include**: Ticket number + reason

## Emergency Bypass

```bash
git commit --no-verify -m "hotfix: critical bug"
```

⚠️ **WARNING**: Must fix violations in follow-up commit!

## Running Manually

```bash
# Check staged files
npm run hooks:type-check-strict

# Check all files in a directory
tsx scripts/hooks/type-check-strict.ts
```

## Performance

- **Target**: <3 seconds
- **Timeout**: 3 seconds (hard limit)
- **Typical**: 1-2 seconds (1-5 files)

## Excluded Files

Hook skips:

- `**/*.test.ts` - Tests
- `**/*.spec.ts` - Specs
- `**/*.stories.ts` - Stories
- `**/*.d.ts` - Declarations
- `**/test-utils.ts` - Test utilities

## Error Format

```
🔴 file.ts:42:15
   Explicit "any" type detected
   💡 Use "unknown" and narrow with type guards
   param: any
```

## Exit Codes

- `0` - Pass (no violations)
- `1` - Fail (critical violations found)

## Help

- **Docs**: `scripts/hooks/H01-IMPLEMENTATION.md`
- **README**: `scripts/hooks/README.md`
- **Maintainer**: TypeScript Specialist

---

**Remember**: This hook helps maintain enterprise-grade type safety. All violations must be fixed or explicitly approved.
