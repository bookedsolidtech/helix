# H08: JSDoc Coverage Hook

## Overview

The `jsdoc-coverage` hook enforces 100% JSDoc documentation coverage on all public APIs in web components. This ensures that every component, property, method, event, slot, CSS part, and CSS custom property is properly documented for CEM (Custom Elements Manifest) generation and Storybook autodocs.

## Hook Details

- **Hook ID**: H08
- **Name**: `jsdoc-coverage`
- **Priority**: P1 (High)
- **Trigger**: Pre-commit (Git hook)
- **Execution Budget**: <3 seconds
- **Timeout**: 5 seconds
- **Coverage Requirement**: 100% of public APIs

## What It Checks

### 1. Class-Level Documentation

Every component class must have:

- JSDoc comment
- `@summary` tag - Concise one-line description
- `@tag` tag - Custom element tag name (e.g., `hx-button`)
- Description text - Detailed explanation

Optional but recommended:

- `@fires` tag - For each dispatched event
- `@slot` tag - For each slot
- `@csspart` tag - For each CSS part
- `@cssprop` tag - For each CSS custom property

**Example:**

```typescript
/**
 * A button component for user interaction.
 *
 * @summary Primary interactive element for triggering actions.
 *
 * @tag hx-button
 *
 * @slot default - Button label text or content.
 *
 * @fires hx-click - Dispatched when the button is clicked.
 *
 * @csspart button - The native button element.
 *
 * @cssprop --hx-button-bg - Button background color.
 */
@customElement('hx-button')
export class HelixButton extends LitElement {}
```

### 2. Property Documentation

Every `@property()` decorated property must have:

- JSDoc comment
- Description text
- `@attr` tag (if `reflect: true` is set)

**Example:**

```typescript
/**
 * Visual style variant of the button.
 * @attr variant
 */
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' = 'primary';
```

### 3. Method Documentation

Every public method must have:

- JSDoc comment
- Description text
- `@param` tag for each parameter
- `@returns` tag (if method has non-void return type)

**Example:**

```typescript
/**
 * Sets the focus on the button element
 * @param options - Focus options
 * @returns True if focus was successful
 */
public focus(options?: FocusOptions): boolean {
  // implementation
}
```

### 4. Event Documentation

Every `dispatchEvent()` call must have a corresponding `@fires` tag in the class JSDoc.

**Example:**

```typescript
/**
 * @fires hx-click - Dispatched when the button is clicked
 * @fires hx-focus - Dispatched when the button receives focus
 */
export class HelixButton extends LitElement {
  private _handleClick(e: MouseEvent): void {
    this.dispatchEvent(
      new CustomEvent('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );
  }
}
```

## What It Skips

The hook automatically skips:

- **Private members**: Properties/methods with `private` modifier or starting with `_`
- **Internal state**: Properties with `@state()` decorator
- **Non-decorated properties**: Properties without `@property()` decorator
- **Lit lifecycle methods**: `render`, `connectedCallback`, `disconnectedCallback`, `firstUpdated`, `updated`, `willUpdate`, etc.
- **Static methods**: Usually not part of public API
- **Test files**: `*.test.ts`, `*.spec.ts`
- **Story files**: `*.stories.ts`
- **Style files**: `*.styles.ts`
- **Type declaration files**: `*.d.ts`

## Usage

### Command Line

```bash
# Run the hook
npm run hooks:jsdoc-coverage

# JSON output mode (for CI)
npm run hooks:jsdoc-coverage -- --json
```

### Git Hook Integration

The hook is automatically integrated into `.husky/pre-commit` via `scripts/pre-commit-check.sh` as **Gate 1.8**.

It runs automatically when you commit component files:

```bash
git add packages/hx-library/src/components/hx-button/hx-button.ts
git commit -m "feat: add button component"

# Hook runs automatically:
# 📝 Gate 1.8: JSDoc coverage check...
# ✅ JSDoc coverage check passed
```

### Pre-Commit Check Script

Located in `scripts/pre-commit-check.sh`:

```bash
# ==============================================================================
# Gate 1.8: JSDoc Coverage (H08)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "📝 Gate 1.8: JSDoc coverage check..."
  if npm run hooks:jsdoc-coverage --silent; then
    echo "✅ JSDoc coverage check passed"
  else
    echo "❌ JSDoc coverage check failed"
    FAILED=1
  fi
  echo ""
fi
```

## Output Examples

### Success (100% Coverage)

```
Documentation Hook: jsdoc-coverage (H08)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking 1 file(s) for JSDoc coverage...

Completed in 245ms

[PASS] 100% JSDoc coverage - All public APIs documented

   Total public APIs: 5
   Documented APIs: 5
   Coverage: 100%
```

### Failure (Incomplete Coverage)

```
Documentation Hook: jsdoc-coverage (H08)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking 1 file(s) for JSDoc coverage...

Completed in 312ms

[FAIL] Found 3 critical violation(s):

[CRITICAL] packages/hx-library/src/components/hx-button/hx-button.ts:29:1
   Property "variant" missing JSDoc comment
   Add JSDoc with description and @attr tag if reflected

[CRITICAL] packages/hx-library/src/components/hx-button/hx-button.ts:45:1
   Public method "focus" missing JSDoc comment
   Add JSDoc with description, @param for each parameter, and @returns if non-void

[CRITICAL] packages/hx-library/src/components/hx-button/hx-button.ts:8:1
   Class "HelixButton" dispatches event "hx-click" but missing @fires tag
   Add @fires hx-click - Description to class JSDoc

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary:
   Files checked: 1
   Total public APIs: 5
   Documented APIs: 2
   Coverage: 40%
   Violations: 3

[BLOCKED] Commit blocked - JSDoc coverage below 100%

Required JSDoc Tags:
   Classes: @summary, @tag, @fires, @slot, @csspart, @cssprop
   Properties: description, @attr (if reflected)
   Methods: description, @param (for each parameter), @returns (if non-void)

Example:
   /**
    * A button component for user interaction.
    * @summary Primary interactive element
    * @tag hx-button
    * @fires hx-click - Dispatched when clicked
    * @slot default - Button content
    * @csspart button - The button element
    * @cssprop --hx-button-bg - Background color
    */

Emergency bypass (NOT recommended):
   git commit --no-verify

Approved exceptions:
   Add comment: // @typescript-specialist-approved: TICKET-123 Reason
```

### JSON Output Mode

```bash
npm run hooks:jsdoc-coverage -- --json
```

```json
{
  "passed": false,
  "hook_id": "H08",
  "hook_name": "jsdoc-coverage",
  "timestamp": "2026-02-20T10:30:00.000Z",
  "executionTime": 312,
  "violations": [
    {
      "file": "packages/hx-library/src/components/hx-button/hx-button.ts",
      "line": 29,
      "column": 1,
      "message": "Property \"variant\" missing JSDoc comment",
      "suggestion": "Add JSDoc with description and @attr tag if reflected",
      "code": "@property({ type: String, reflect: true })",
      "severity": "critical"
    }
  ],
  "stats": {
    "totalPublicAPIs": 5,
    "documentedAPIs": 2,
    "coveragePercent": 40,
    "filesChecked": 1
  }
}
```

## Approval Mechanism

For exceptional cases where JSDoc cannot be added (legacy code, third-party integrations), use the approval comment:

```typescript
// @typescript-specialist-approved: TICKET-123 Legacy component, will refactor in Q2
export class LegacyButton extends LitElement {
  // No JSDoc required due to approval
}
```

## Performance

- **Execution Budget**: <3 seconds for typical commits
- **Timeout**: 5 seconds (prevents hanging on large commits)
- **Incremental**: Only checks staged files, not entire codebase
- **Memory Efficient**: Uses `ts-morph` with file-by-file processing and memory cleanup

## Integration with Other Tools

### Custom Elements Manifest (CEM)

JSDoc comments are the primary source for CEM generation. This hook ensures:

- CEM has accurate component descriptions
- All properties, methods, events, slots, and CSS parts are documented
- Storybook autodocs have complete information

### Storybook

Well-documented components generate better Storybook stories:

- Controls tab shows property descriptions
- Docs tab shows comprehensive API documentation
- Events are listed in the Actions panel

### IDE Support

Proper JSDoc enables:

- IntelliSense autocomplete with descriptions
- Hover tooltips with parameter information
- Signature help for methods

## Testing

The hook includes a comprehensive test suite:

```bash
npm test -- scripts/hooks/jsdoc-coverage.test.ts
```

**Test coverage:**

- 50+ test cases
- Utility functions (getJSDocTags, hasJSDocTag, getJSDocDescription)
- Class validation
- Property validation
- Method validation
- Event documentation validation
- Integration tests with real components
- Edge cases and error handling

## Files

- **Hook**: `scripts/hooks/jsdoc-coverage.ts`
- **Tests**: `scripts/hooks/jsdoc-coverage.test.ts`
- **Integration**: `scripts/pre-commit-check.sh` (Gate 1.8)
- **NPM Script**: `npm run hooks:jsdoc-coverage`

## Related Hooks

- **H01**: `type-check-strict` - TypeScript strict mode compliance
- **H05**: `cem-accuracy-check` - Validates CEM matches implementation
- **H07**: `event-type-safety` - Type-safe event dispatching

## Troubleshooting

### "Class missing @summary tag"

Add a `@summary` tag to the class JSDoc:

```typescript
/**
 * A button component
 * @summary Primary interactive element  // ← Add this
 * @tag hx-button
 */
```

### "Property missing @attr tag"

If the property has `reflect: true`, add `@attr`:

```typescript
/**
 * Button variant
 * @attr variant  // ← Add this for reflected properties
 */
@property({ type: String, reflect: true })
variant = 'primary';
```

### "Method missing @param tags"

Add `@param` for each parameter:

```typescript
/**
 * Sets the focus
 * @param options - Focus options  // ← Add this
 */
public focus(options?: FocusOptions): void {}
```

### "Missing @fires tag for event"

Add `@fires` to class JSDoc:

```typescript
/**
 * @summary Button component
 * @tag hx-button
 * @fires hx-click - Dispatched when clicked  // ← Add this
 */
export class HelixButton extends LitElement {
  private _handleClick() {
    this.dispatchEvent(new CustomEvent('hx-click'));
  }
}
```

## Contributing

When adding new components:

1. Write JSDoc comments as you write the code (not after)
2. Use the existing components as templates (hx-button, hx-card)
3. Ensure 100% coverage before committing
4. Run the hook manually to verify: `npm run hooks:jsdoc-coverage`

## References

- [Custom Elements Manifest Spec](https://github.com/webcomponents/custom-elements-manifest)
- [JSDoc Reference](https://jsdoc.app/)
- [TypeScript JSDoc Support](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [wc-2026 Component Authoring Guide](../../docs/src/content/docs/guides/component-authoring.mdx)
