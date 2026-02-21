# H07: Event Type Safety Hook

**Status:** ✅ Implemented | 🧪 Tested (39/39 passing) | ⚡ <2s execution

## Purpose

Enforces event type safety in web components to ensure:

- Events use explicit detail type interfaces
- Event names follow `hx-` naming convention
- Detail types are exported interfaces (not inline types)
- JSDoc `@fires` tags match implementation

## Usage

```bash
# Run manually
npm run hooks:event-type-safety

# JSON output (for Admin Dashboard integration)
npm run hooks:event-type-safety -- --json

# Integrated in pre-commit hook
git commit  # Automatically runs on component files
```

## What It Checks

### 1. Event Naming (Critical)

Events must start with `hx-` prefix:

```typescript
// ❌ BAD
this.dispatchEvent(new CustomEvent('click', { ... }));

// ✅ GOOD
this.dispatchEvent(new CustomEvent('hx-click', { ... }));
```

### 2. Explicit Detail Types (Critical)

Events must have explicit detail type interfaces:

```typescript
// ❌ BAD: No detail type
this.dispatchEvent(new CustomEvent('hx-click', { detail: {} }));

// ✅ GOOD: Explicit detail type
export interface HelixClickDetail {
  originalEvent: MouseEvent;
}

this.dispatchEvent(
  new CustomEvent<HelixClickDetail>('hx-click', {
    detail: { originalEvent: e },
  }),
);
```

### 3. Named Interfaces (Critical)

Detail types must be named interfaces, not inline types:

```typescript
// ❌ BAD: Inline type
this.dispatchEvent(new CustomEvent<{value: string}>('hx-click', { ... }));

// ✅ GOOD: Named interface
export interface HelixClickDetail {
  value: string;
}

this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', { ... }));
```

### 4. Exported Interfaces (Warning)

Detail type interfaces should be exported for consumers:

```typescript
// ⚠️ WARNING: Not exported
interface ClickDetail {
  value: string;
}

// ✅ GOOD: Exported
export interface HelixClickDetail {
  value: string;
}
```

### 5. JSDoc @fires Tags (Warning)

Events should be documented with `@fires` tags:

```typescript
/**
 * A button component.
 *
 * @fires {CustomEvent<HelixClickDetail>} hx-click - Dispatched when clicked.
 */
@customElement('hx-button')
export class HelixButton extends LitElement {
  // ...
}
```

## Configuration

Location: `scripts/hooks/event-type-safety.ts`

```typescript
const CONFIG = {
  // Only check component files
  includePatterns: ['**/components/**/*.ts'],

  // Exclude test, story, and style files
  excludePatterns: ['**/*.test.ts', '**/*.stories.ts', '**/*.styles.ts'],

  // Event naming convention
  eventPrefix: 'hx-',

  // Approval comment
  approvalComment: '@typescript-specialist-approved',

  // Performance
  timeoutMs: 5000,
};
```

## Output Examples

### Success

```
[HOOK] event-type-safety (H07)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INFO] Checking 3 file(s) for event type safety...

[INFO] Completed in 1247ms

[PASS] No event type safety violations found
```

### Failures

```
[HOOK] event-type-safety (H07)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INFO] Checking 1 file(s) for event type safety...

[INFO] Completed in 423ms

[CRITICAL] Found 3 critical violation(s):

packages/hx-library/src/components/hx-sample/hx-sample.ts:12:5
   Event name "click" must start with "hx-"
   Suggestion: Rename to "hx-click"
   Code: this.dispatchEvent(new CustomEvent('click', {

packages/hx-library/src/components/hx-sample/hx-sample.ts:18:5
   Event "hx-change" missing explicit detail type
   Suggestion: Use CustomEvent<DetailInterface> with explicit interface (e.g., HelixClickDetail)
   Code: this.dispatchEvent(new CustomEvent('hx-change', {

packages/hx-library/src/components/hx-sample/hx-sample.ts:24:5
   Event "hx-input" uses inline type instead of interface
   Suggestion: Extract to named interface (e.g., HelixClickDetail, HelixChangeDetail)
   Code: this.dispatchEvent(new CustomEvent<{value: string}>('hx-input', {

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SUMMARY]
   Files checked: 1
   Total violations: 3
   Critical: 3
   Warnings: 0

[FAIL] Commit blocked due to critical violations

[FIX] To resolve:
   1. Add explicit detail types: CustomEvent<DetailInterface>
   2. Extract inline types to named interfaces
   3. Ensure event names start with "hx-"
   4. Export detail type interfaces
   5. Add @fires JSDoc tags to class documentation
```

### JSON Output

```bash
npm run hooks:event-type-safety -- --json
```

```json
{
  "passed": false,
  "violations": [
    {
      "file": "packages/hx-library/src/components/hx-sample/hx-sample.ts",
      "line": 12,
      "column": 5,
      "message": "Event name \"click\" must start with \"hx-\"",
      "suggestion": "Rename to \"hx-click\"",
      "code": "this.dispatchEvent(new CustomEvent('click', {",
      "severity": "critical"
    }
  ],
  "stats": {
    "filesChecked": 1,
    "totalViolations": 3,
    "criticalViolations": 3,
    "warningViolations": 0
  }
}
```

## Approval Mechanism

For exceptional cases, add approval comment:

```typescript
export class HelixButton extends LitElement {
  private handleClick() {
    // @typescript-specialist-approved: HELIX-123 Legacy compatibility required
    this.dispatchEvent(new CustomEvent('click', { detail: {} }));
  }
}
```

## Performance

- **Target:** <2 seconds
- **Timeout:** 5 seconds
- **Optimization:** Incremental checking of staged files only

## Test Coverage

**Status:** ✅ 39/39 tests passing

Test file: `scripts/hooks/event-type-safety.test.ts`

Run tests:

```bash
cd scripts/hooks && npx vitest run event-type-safety.test.ts
```

## Integration Points

1. **Pre-commit hook** (`.husky/pre-commit`)
2. **Admin Dashboard** (Health History - JSON output mode)
3. **CI/CD Pipeline** (Quality gate enforcement)

## Related Hooks

- **H01:** `type-check-strict` - TypeScript strict mode
- **H05:** `cem-accuracy-check` - Custom Elements Manifest
- **H06:** `a11y-regression-guard` - Accessibility

## Examples

### Compliant Event Implementation

```typescript
// Define and export detail interface
export interface HelixClickDetail {
  originalEvent: MouseEvent;
}

/**
 * A button component.
 *
 * @fires {CustomEvent<HelixClickDetail>} hx-click - Dispatched when clicked.
 */
@customElement('hx-button')
export class HelixButton extends LitElement {
  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      return;
    }

    this.dispatchEvent(
      new CustomEvent<HelixClickDetail>('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );
  }
}
```

### Form Component Example

```typescript
export interface HelixInputDetail {
  value: string;
}

export interface HelixChangeDetail {
  value: string;
}

/**
 * A text input component.
 *
 * @fires {CustomEvent<HelixInputDetail>} hx-input - Dispatched on input.
 * @fires {CustomEvent<HelixChangeDetail>} hx-change - Dispatched on change.
 */
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  private _handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent<HelixInputDetail>('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: target.value },
      }),
    );
  }

  private _handleChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent<HelixChangeDetail>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: target.value },
      }),
    );
  }
}
```

## Benefits

1. **Type Safety:** Consumers get full TypeScript type inference
2. **Consistency:** All events follow the same pattern
3. **Documentation:** Auto-generated docs from types and JSDoc
4. **Refactoring:** Safe renaming and type changes
5. **IDE Support:** IntelliSense for event listeners

## Migration Guide

### Before (Inline Types)

```typescript
this.dispatchEvent(
  new CustomEvent('hx-click', {
    detail: { originalEvent: e },
  }),
);
```

### After (Named Interface)

```typescript
// 1. Define interface
export interface HelixClickDetail {
  originalEvent: MouseEvent;
}

// 2. Add JSDoc @fires tag
/**
 * @fires {CustomEvent<HelixClickDetail>} hx-click - Description
 */

// 3. Use typed event
this.dispatchEvent(
  new CustomEvent<HelixClickDetail>('hx-click', {
    detail: { originalEvent: e },
  }),
);
```

## Troubleshooting

### "Event name must start with hx-"

**Cause:** Event doesn't follow naming convention

**Fix:** Rename event to start with `hx-` prefix

### "Missing explicit detail type"

**Cause:** `CustomEvent` used without type parameter

**Fix:** Add `CustomEvent<DetailInterface>`

### "Uses inline type instead of interface"

**Cause:** Type defined inline in `CustomEvent<{...}>`

**Fix:** Extract to named interface

### "Detail type is not exported"

**Cause:** Interface not exported

**Fix:** Add `export` keyword

## Future Enhancements

- [ ] Auto-fix capability for simple violations
- [ ] Generate detail interfaces from usage
- [ ] Suggest interface names based on event names
- [ ] Validate event detail property types match interface
- [ ] Check for duplicate event names
