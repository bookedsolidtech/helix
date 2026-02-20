# TypeScript Automation: Developer Quick Reference

**One-page cheat sheet for TypeScript hooks and MCP usage**

---

## Quick Commands

```bash
# Run all hooks manually
npm run hooks:all

# Run specific hook
npm run hooks:no-any-types
npm run hooks:event-type-safety
npm run hooks:jsdoc-coverage
npm run hooks:cem-type-sync
npm run hooks:declaration-completeness
npm run hooks:generic-patterns

# Check type coverage
npm run type-check

# Emergency: Skip hooks (NOT recommended)
git commit --no-verify -m "hotfix"

# View hook metrics
cat .cache/hooks/metrics.json | jq

# Clear hook cache
rm -rf .cache/hooks
```

---

## Common Errors & Fixes

### Error: Explicit `any` type detected

```typescript
// ❌ Bad
function processData(data: any) {}

// ✅ Good
function processData(data: unknown) {
  if (typeof data === 'string') {
    // Type narrowed to string
  }
}
```

### Error: Event missing detail type

```typescript
// ❌ Bad
this.dispatchEvent(new CustomEvent('hx-click'));

// ❌ Bad: Inline type
this.dispatchEvent(new CustomEvent<{ value: string }>('hx-change'));

// ✅ Good
interface HelixClickDetail {
  originalEvent: MouseEvent;
}
this.dispatchEvent(
  new CustomEvent<HelixClickDetail>('hx-click', {
    bubbles: true,
    composed: true,
    detail: { originalEvent: e },
  }),
);
```

### Error: Event name must start with 'hx-'

```typescript
// ❌ Bad
this.dispatchEvent(new CustomEvent('click'));

// ✅ Good
this.dispatchEvent(new CustomEvent('hx-click'));
```

### Error: Missing JSDoc

```typescript
// ❌ Bad
@property({ type: String })
variant = 'primary';

// ✅ Good
/**
 * Visual style variant of the component.
 * @attr variant
 */
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';
```

### Error: Use PropertyValues<this> instead of Map

```typescript
// ❌ Bad
updated(changedProperties: Map<string, unknown>) { }

// ✅ Good
updated(changedProperties: PropertyValues<this>) { }
```

### Error: Non-null assertion not allowed

```typescript
// ❌ Bad
const button = this.shadowRoot!.querySelector('button');

// ✅ Good
const button = this.shadowRoot?.querySelector('button');
if (button) {
  // Safe to use button
}

// ✅ Good: With nullish coalescing
const button = this.shadowRoot?.querySelector('button') ?? document.createElement('button');
```

### Error: Function type is equivalent to any

```typescript
// ❌ Bad
callback: Function;

// ✅ Good
callback: (value: string) => void;
```

---

## Approval Mechanism (Exceptional Cases)

```typescript
/**
 * Legacy API integration requiring any type.
 * @typescript-specialist-approved: TICKET-123
 */
function legacyAPI(data: any): void {
  // Approved exception
}
```

**Requirements:**

- Must include ticket number
- Must include reason in JSDoc
- Requires TypeScript Specialist review in PR

---

## Type Patterns (Best Practices)

### Component Properties

```typescript
// ✅ Use union types (not enums)
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';

// ✅ Use boolean for flags
@property({ type: Boolean, reflect: true })
disabled = false;

// ✅ Use optional for optional properties
@property({ type: String })
label?: string;
```

### Event Detail Interfaces

```typescript
// ✅ Named interface
interface HelixInputDetail {
  value: string;
  originalEvent?: InputEvent;
}

// ✅ Export for consumers
export type { HelixInputDetail };

// ✅ Use in CustomEvent
this.dispatchEvent(
  new CustomEvent<HelixInputDetail>('hx-input', {
    detail: { value: this.value },
  }),
);
```

### Type Guards

```typescript
// ✅ Use type guards for unknown
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Usage
function process(data: unknown) {
  if (isString(data)) {
    // data is string here
    console.log(data.toUpperCase());
  }
}
```

### Generic Component Patterns

```typescript
// ✅ PropertyValues<this> in lifecycle methods
override updated(changedProperties: PropertyValues<this>): void {
  super.updated(changedProperties);

  if (changedProperties.has('variant')) {
    // React to variant change
  }
}

// ✅ Branded types
type ComponentTagName = `hx-${string}`;
type CSSCustomProperty = `--hx-${string}`;

// ✅ Utility types
type ComponentProps<T extends LitElement> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
```

---

## JSDoc Templates

### Component Class

```typescript
/**
 * A button component for user interaction.
 *
 * @summary Primary interactive element for triggering actions.
 *
 * @tag hx-button
 *
 * @slot - Default slot for button label text or content.
 *
 * @fires {CustomEvent<HelixClickDetail>} hx-click - Dispatched when clicked.
 *
 * @csspart button - The native button element.
 *
 * @cssprop [--hx-button-bg=var(--hx-color-primary)] - Background color.
 * @cssprop [--hx-button-color=var(--hx-color-neutral-0)] - Text color.
 */
@customElement('hx-button')
export class HelixButton extends LitElement {}
```

### Property

```typescript
/**
 * Visual style variant of the button.
 * @attr variant
 */
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';
```

### Method

```typescript
/**
 * Handles button click events.
 * @param e - The native click event
 * @private
 */
private _handleClick(e: MouseEvent): void { }
```

---

## MCP Usage (For Claude Code)

### Query Component Structure

```typescript
// Get component AST analysis
const analysis = await mcp.callTool('ts-morph', 'analyze_component', {
  filePath: '/path/to/component.ts'
});

// Returns:
{
  name: "HelixButton",
  properties: [{ name: "variant", type: "'primary' | 'secondary'" }],
  methods: [{ name: "_handleClick", returnType: "void" }],
  events: [{ name: "hx-click", detailType: "HelixClickDetail" }]
}
```

### Get Type Information

```typescript
// Query TypeScript LSP for type info
const typeInfo = await mcp.callTool('typescript-lsp', 'hover', {
  file: '/path/to/component.ts',
  line: 42,
  column: 10
});

// Returns:
{
  contents: {
    kind: "markdown",
    value: "(property) variant: 'primary' | 'secondary'"
  }
}
```

### Query CEM

```typescript
// Get component from CEM
const component = await mcp.callTool('cem-query', 'get_component', {
  tagName: 'hx-button',
});

// List all components
const components = await mcp.callTool('cem-query', 'list_components', {});
```

---

## Hook Behavior

| Hook                     | Blocks Commit | Auto-Fix | Warnings |
| ------------------------ | ------------- | -------- | -------- |
| no-any-types             | ✅ Yes        | ❌ No    | ❌ No    |
| event-type-safety        | ✅ Yes        | ❌ No    | ❌ No    |
| jsdoc-coverage           | ⚠️ Warn Only  | ❌ No    | ✅ Yes   |
| cem-type-sync            | ❌ No         | ✅ Yes   | ❌ No    |
| declaration-completeness | ✅ Yes        | ❌ No    | ❌ No    |
| generic-patterns         | ✅ Yes        | ❌ No    | ❌ No    |

---

## Performance Tips

### Cache Hits

- Hooks use file-based caching
- Cache key = SHA256 of file contents
- Cache hit = 0.1s vs 2s full analysis
- Clear cache: `rm -rf .cache/hooks`

### Parallel Execution

- Independent hooks run in parallel
- Total time ≈ slowest hook (not sum)
- Target: <25s total

### Skip Expensive Checks

```bash
# Skip hooks for WIP commits (local branch only)
git commit --no-verify -m "WIP: testing"

# MUST fix before pushing
npm run hooks:all
```

---

## Troubleshooting

### Hook Always Fails on Valid Code

1. Check for false positive
2. Add approval comment
3. Report issue to TypeScript Specialist

### Hook Times Out

1. Check file size (<10,000 lines)
2. Clear cache: `rm -rf .cache/hooks`
3. Report performance issue

### CEM Out of Sync

```bash
# Manually regenerate CEM
npm run cem

# Stage and commit
git add packages/hx-library/custom-elements.json
git commit -m "chore: update CEM"
```

### Type Errors After Commit

1. Run `npm run type-check` locally
2. Fix errors
3. Amend commit: `git commit --amend --no-edit`

---

## Support

- **Documentation**: `/docs/typescript-automation-proposal.md`
- **Slack**: `#typescript-help`
- **Owner**: TypeScript Specialist
- **Office Hours**: Tuesdays 2-4pm

---

## Antipatterns to Avoid

| ❌ Antipattern         | ✅ Fix                 |
| ---------------------- | ---------------------- |
| `any`                  | `unknown` + type guard |
| `Function`             | `(args) => ReturnType` |
| `Record<string, any>`  | Proper interface       |
| `Map<string, unknown>` | `PropertyValues<this>` |
| `prop!`                | `prop?.`               |
| `\| null \| undefined` | `prop?:`               |
| Inline event types     | Named interfaces       |
| Missing JSDoc          | Complete documentation |

---

**Last Updated:** 2026-02-20
**Version:** 1.0
