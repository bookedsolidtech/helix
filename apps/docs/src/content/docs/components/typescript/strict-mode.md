---
title: TypeScript Strict Mode
description: Comprehensive guide to TypeScript strict mode compiler options, their benefits for web component development, and practical examples from hx-library.
sidebar:
  order: 1
---

# TypeScript Strict Mode

TypeScript's strict mode is a collection of compiler options that enforce stronger type safety and catch potential runtime errors at compile time. For enterprise healthcare applications where software failures can impact patient care, strict mode is not optional—it is a fundamental requirement.

The hx-library operates under a zero-tolerance policy: **no `any` types, no `@ts-ignore` directives, and no non-null assertions**. Every component, utility, and public API must pass TypeScript's strictest checks before deployment.

This guide explores each strict mode flag, explains why it matters for web component development, and demonstrates real-world patterns from the hx-library codebase.

## The `strict` Compiler Flag

The `strict` flag is a master switch that enables all strict type-checking options. When you enable `"strict": true` in your `tsconfig.json`, TypeScript activates the following checks:

- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noImplicitThis`
- `alwaysStrict`
- `useUnknownInCatchVariables` (TypeScript 4.4+)

**Important:** Future versions of TypeScript may introduce additional strict checks under this flag. Upgrades can surface new type errors, which is a feature—not a bug. These errors represent real issues that would have manifested as runtime failures.

### hx-library Configuration

The hx-library extends strict mode with additional safety checks in `/Volumes/Development/HELiX/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Every package in the monorepo inherits this configuration, ensuring consistent type safety across all web components, applications, and utilities.

## `noImplicitAny`

### What It Does

Raises an error when TypeScript cannot infer a type and would fall back to `any`. This prevents accidentally bypassing type safety.

### Why It Matters for Web Components

Web components interact with the DOM, handle user input, and dispatch custom events. Implicit `any` types can mask critical bugs where you're passing the wrong data type to a method or handling an event incorrectly.

### Before: Unsafe (Implicit `any`)

```typescript
// TypeScript infers 'e' as 'any' — no type safety
function handleClick(e) {
  console.log(e.detail.value); // No error if 'detail' doesn't exist
}
```

### After: Safe (Explicit Type)

```typescript
// Explicit type ensures compile-time safety
function handleClick(e: MouseEvent): void {
  // TypeScript error: Property 'detail' does not exist on MouseEvent
  // console.log(e.detail.value);
}

// For custom events, type the detail payload
interface HxInputDetail {
  value: string;
}

function handleInput(e: CustomEvent<HxInputDetail>): void {
  console.log(e.detail.value); // ✅ Type-safe access
}
```

### Real-World Example: hx-text-input

From `/Volumes/Development/HELiX/packages/hx-library/src/components/hx-text-input/hx-text-input.ts`:

```typescript
private _handleInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  this.value = target.value;
  this._internals.setFormValue(this.value);

  this.dispatchEvent(
    new CustomEvent('hx-input', {
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );
}
```

Notice the explicit `Event` type for the parameter. TypeScript ensures `e.target` exists and that we're handling the event correctly.

## `strictNullChecks`

### What It Does

Treats `null` and `undefined` as distinct types rather than valid values for all types. With strict null checks, you must explicitly handle cases where a value might be `null` or `undefined`.

### Why It Matters for Web Components

DOM queries, form associations, and optional properties frequently return `null` or `undefined`. Without strict null checks, accessing properties on these values causes runtime errors.

### Before: Unsafe (Null Not Checked)

```typescript
const button = document.querySelector('button');
button.click(); // Runtime error if button is null
```

### After: Safe (Null Checked)

```typescript
const button = document.querySelector('button');
if (button) {
  button.click(); // ✅ Only executes if button exists
}

// Or use optional chaining
button?.click();
```

### Real-World Example: hx-checkbox

From `/Volumes/Development/HELiX/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts`:

```typescript
private _updateValidity(): void {
  if (this.required && !this.checked) {
    this._internals.setValidity(
      { valueMissing: true },
      this.error || 'This field is required.',
      this._inputEl ?? undefined, // ✅ Explicit null handling
    );
  } else {
    this._internals.setValidity({});
  }
}
```

The `_inputEl` query result is typed as `HTMLInputElement | undefined` (via the `@query` decorator). Using `??` ensures we pass `undefined` when the element hasn't rendered yet, preventing the runtime error of passing `null` where TypeScript expects `undefined`.

### Form Integration Pattern

```typescript
/** Returns the associated form element, if any. */
get form(): HTMLFormElement | null {
  return this._internals.form;
}
```

By returning `HTMLFormElement | null`, the type signature forces consumers to check for `null`:

```typescript
if (component.form) {
  component.form.submit(); // ✅ Type-safe
}
```

## `strictPropertyInitialization`

### What It Does

Ensures that non-undefined class properties are either initialized in the constructor or have an explicit initializer. This prevents accessing uninitialized properties that would be `undefined` at runtime.

### Why It Matters for Web Components

Lit components use decorators to define reactive properties. Without strict property initialization, you might forget to provide a default value, leading to `undefined` behavior when rendering.

### Before: Unsafe (Uninitialized Property)

```typescript
class HxButton extends LitElement {
  @property({ type: String })
  variant: 'primary' | 'secondary' | 'ghost'; // ❌ Error: Property has no initializer
}
```

### After: Safe (Initialized Property)

```typescript
class HxButton extends LitElement {
  @property({ type: String })
  variant: 'primary' | 'secondary' | 'ghost' = 'primary'; // ✅ Explicit default
}
```

### Real-World Example: hx-button

From `/Volumes/Development/HELiX/packages/hx-library/src/components/hx-button/hx-button.ts`:

```typescript
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';

@property({ type: String, reflect: true, attribute: 'hx-size' })
size: 'sm' | 'md' | 'lg' = 'md';

@property({ type: Boolean, reflect: true })
disabled = false;

@property({ type: String })
type: 'button' | 'submit' | 'reset' = 'button';
```

Every property has an explicit default value, ensuring the component always has a valid state—even before attributes are parsed.

### Definite Assignment Assertion (Use Sparingly)

For properties that are guaranteed to be initialized elsewhere (like DOM queries via `@query`), you can use the definite assignment assertion operator `!`:

```typescript
@query('.field__input')
private _input!: HTMLInputElement;
```

**Important:** Use `!` only when you know the property will be initialized before use. For queried elements, ensure they're always rendered in your template. If the element is conditionally rendered, type it as `HTMLInputElement | undefined` and check for `null`.

## `noUncheckedIndexedAccess`

### What It Does

When accessing an array or object via index, TypeScript includes `undefined` in the type. This forces you to check whether the accessed value exists before using it.

### Why It Matters for Web Components

Event handlers, slotted content, and form data often involve array access. Without `noUncheckedIndexedAccess`, accessing an out-of-bounds index silently returns `undefined`, causing runtime errors.

### Before: Unsafe (No Index Check)

```typescript
const items = ['a', 'b', 'c'];
const item = items[5]; // Type: string (wrong — actually undefined)
console.log(item.toUpperCase()); // Runtime error: Cannot read property of undefined
```

### After: Safe (Index Checked)

```typescript
const items = ['a', 'b', 'c'];
const item = items[5]; // Type: string | undefined (correct)

if (item) {
  console.log(item.toUpperCase()); // ✅ Safe
}
```

### Real-World Example: Slot Handling

From `/Volumes/Development/HELiX/packages/hx-library/src/components/hx-text-input/hx-text-input.ts`:

```typescript
private _handleLabelSlotChange(e: Event): void {
  const slot = e.target as HTMLSlotElement;
  this._hasLabelSlot = slot.assignedElements().length > 0;
  if (this._hasLabelSlot) {
    const slottedLabel = slot.assignedElements()[0]; // Type: Element | undefined
    if (slottedLabel && !slottedLabel.id) {
      slottedLabel.id = `${this._inputId}-slotted-label`;
    }
  }
  this.requestUpdate();
}
```

Notice the check for `slottedLabel` before accessing `slottedLabel.id`. Without `noUncheckedIndexedAccess`, TypeScript would not have caught this potential error.

## `strictFunctionTypes`

### What It Does

Enforces correct variance checking for function parameters. This prevents unsound assignments where a function expecting a specific type gets passed a function expecting a more general type.

### Why It Matters for Web Components

Event handlers and callbacks are frequently passed as properties or arguments. Strict function types ensure you're not accidentally passing a handler that expects a different event type.

### Example: Event Handler Variance

```typescript
type ClickHandler = (e: MouseEvent) => void;
type EventHandler = (e: Event) => void;

declare function addEventListener(handler: ClickHandler): void;

// Without strictFunctionTypes, this would be allowed
const handler: EventHandler = (e: Event) => {
  console.log(e.clientX); // ❌ Error: clientX doesn't exist on Event
};

// addEventListener(handler); // ❌ Correctly disallowed
```

### Real-World Pattern: Typed Event Listeners

```typescript
// Define explicit event map for type-safe listeners
interface HxButtonEventMap {
  'hx-click': CustomEvent<{ originalEvent: MouseEvent }>;
}

// Type-safe event listener
element.addEventListener('hx-click', (e: CustomEvent<{ originalEvent: MouseEvent }>) => {
  console.log(e.detail.originalEvent.clientX); // ✅ Type-safe
});
```

## `strictBindCallApply`

### What It Does

Enables strict type checking for the `bind`, `call`, and `apply` methods on functions.

### Why It Matters for Web Components

When binding event handlers or using `call`/`apply` for context manipulation, strict checking ensures you're passing the correct number and type of arguments.

### Example

```typescript
function greet(name: string, age: number): void {
  console.log(`Hello, ${name}! You are ${age} years old.`);
}

// Without strictBindCallApply, this would be allowed
// greet.call(undefined, 'Alice'); // ❌ Missing 'age' argument

// With strictBindCallApply
greet.call(undefined, 'Alice', 30); // ✅ Correct
```

## `noImplicitThis`

### What It Does

Raises an error when `this` has an inferred type of `any`.

### Why It Matters for Web Components

Lit components rely heavily on `this` to access properties and methods. Without `noImplicitThis`, you might accidentally reference `this` in a context where it's `any`, losing type safety.

### Example: Arrow Functions vs. Regular Functions

```typescript
class HxButton extends LitElement {
  @property({ type: Boolean })
  disabled = false;

  // ❌ 'this' would be 'any' in a regular function passed to setTimeout
  scheduleUpdate() {
    setTimeout(function () {
      // this.disabled; // Error: 'this' implicitly has type 'any'
    }, 1000);
  }

  // ✅ Arrow function preserves 'this' context
  scheduleUpdateSafe() {
    setTimeout(() => {
      this.disabled = true; // ✅ 'this' is HxButton
    }, 1000);
  }
}
```

## `alwaysStrict`

### What It Does

Ensures all files are parsed in JavaScript strict mode and emits `"use strict"` in the output.

### Why It Matters for Web Components

Strict mode prevents common JavaScript pitfalls like accidental global variables, silent failures when assigning to read-only properties, and usage of reserved keywords.

### Example: Preventing Globals

```typescript
// Without strict mode, this creates a global variable
function setCount() {
  count = 10; // ❌ Implicit global
}

// With strict mode, this throws an error
// "use strict";
function setCountStrict() {
  // count = 10; // ❌ Error: count is not defined
  let count = 10; // ✅ Explicit declaration
}
```

## `exactOptionalPropertyTypes`

### What It Does

When enabled, optional properties cannot be set to `undefined` explicitly. They can only be omitted or set to their declared type.

### Why It Matters for Web Components

Component properties often have default values. `exactOptionalPropertyTypes` ensures you don't accidentally override a property with `undefined`, which can break default value logic.

### Example

```typescript
interface HxButtonProps {
  label?: string;
}

const props: HxButtonProps = {};
// props.label = undefined; // ❌ Error with exactOptionalPropertyTypes

// ✅ Correct usage
const validProps: HxButtonProps = { label: 'Click me' };
const alsoValid: HxButtonProps = {}; // label is omitted
```

## `noImplicitReturns`

### What It Does

Ensures that all code paths in a function with a return type explicitly return a value.

### Why It Matters for Web Components

Getter methods and lifecycle hooks often return values. Without `noImplicitReturns`, you might accidentally have a code path that doesn't return, leading to `undefined` at runtime.

### Example

```typescript
// ❌ Error: Not all code paths return a value
function getVariantClass(variant: string): string {
  if (variant === 'primary') {
    return 'btn-primary';
  }
  // Missing return for other variants
}

// ✅ All code paths return
function getVariantClassSafe(variant: string): string {
  if (variant === 'primary') {
    return 'btn-primary';
  }
  return 'btn-default';
}
```

## `noFallthroughCasesInSwitch`

### What It Does

Reports errors for fallthrough cases in switch statements (cases without `break`, `return`, or `throw`).

### Why It Matters for Web Components

Switch statements are common in event handlers and property observers. Unintentional fallthrough is a frequent source of bugs.

### Example

```typescript
function getSize(size: 'sm' | 'md' | 'lg'): number {
  switch (size) {
    case 'sm':
      return 12;
    case 'md':
      return 16;
    case 'lg':
      return 20;
    default:
      throw new Error(`Unknown size: ${size}`);
  }
}
```

## Benefits for Component Development

Strict mode provides concrete benefits for building enterprise-grade web components:

### 1. Catch Errors at Compile Time

Instead of discovering runtime errors in production, strict mode surfaces issues during development. This is critical in healthcare applications where failures can impact patient safety.

### 2. Self-Documenting Code

Explicit types serve as inline documentation. When reading a component's source code, you immediately understand what types it expects and returns.

```typescript
// Types document the contract
@property({ type: String })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';
```

### 3. Refactoring Confidence

When refactoring, TypeScript's strict checks ensure you update all call sites. Change a property name, and TypeScript highlights every location that needs updating.

### 4. IDE Autocomplete

Explicit types enable IntelliSense and autocomplete in editors. This accelerates development and reduces typos.

### 5. Prevents Runtime Null Errors

Strict null checks eliminate the most common category of runtime errors: "Cannot read property of undefined."

## Common Issues and Solutions

### Issue: Property Initialization in Constructors

When using `strictPropertyInitialization`, properties must be initialized. For properties that depend on constructor logic, ensure initialization happens before the constructor exits.

```typescript
class HxButton extends LitElement {
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals(); // ✅ Initialized in constructor
  }
}
```

### Issue: Optional Chaining with Functions

Optional chaining works with properties, but for functions, you need to use it on the call as well:

```typescript
// ❌ Wrong
this._input?.focus;

// ✅ Correct
this._input?.focus();
```

### Issue: Type Guards for DOM Elements

When querying the DOM, use type guards to narrow types:

```typescript
function isHxButton(el: Element): el is HxButton {
  return el.tagName.toLowerCase() === 'hx-button';
}

const elements = document.querySelectorAll('*');
const buttons = Array.from(elements).filter(isHxButton);
// Type: HxButton[]
```

### Issue: Unknown vs. Any

When you genuinely don't know a type, use `unknown` instead of `any`. `unknown` requires type checking before use:

```typescript
// ❌ Unsafe
function processValue(value: any): void {
  console.log(value.toUpperCase()); // No error, but fails at runtime if value isn't a string
}

// ✅ Safe
function processValueSafe(value: unknown): void {
  if (typeof value === 'string') {
    console.log(value.toUpperCase()); // ✅ Type-safe
  }
}
```

## hx-library tsconfig

The hx-library package extends the base configuration with component-specific settings in `/Volumes/Development/HELiX/packages/hx-library/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts"],
  "exclude": [
    "node_modules",
    "dist",
    "src/**/*.stories.ts",
    "src/**/*.test.ts",
    "src/test-utils.ts"
  ]
}
```

### Key Settings

- **`composite: true`**: Enables project references for faster incremental builds across the monorepo
- **`declaration: true`**: Generates `.d.ts` declaration files for TypeScript consumers
- **`declarationMap: true`**: Enables "Go to Definition" in IDEs to jump to source files
- **`experimentalDecorators: true`**: Required for Lit's `@property`, `@state`, and `@query` decorators
- **`useDefineForClassFields: false`**: Ensures decorator compatibility with Lit's property system

## Verification

To verify strict mode compliance across the monorepo:

```bash
npm run type-check
```

This command runs TypeScript's compiler in check mode without emitting files. It must pass with zero errors before any commit.

## Migration Strategies

Migrating an existing codebase to strict mode can be daunting, especially for large codebases with hundreds of components. The key is to adopt an incremental approach that allows you to ship fixes progressively rather than attempting a single massive refactor.

### Strategy 1: Gradual Opt-In (Recommended)

Enable strict mode flags one at a time, fixing errors before moving to the next flag. This approach minimizes the blast radius and allows you to learn each flag's implications.

#### Step 1: Enable `noImplicitAny`

Start with `noImplicitAny` because it surfaces the most obvious type safety gaps.

```json
// tsconfig.json
{
  "compilerOptions": {
    "noImplicitAny": true
  }
}
```

Run `npm run type-check` and fix errors. Common fixes:

```typescript
// Before: Implicit any
function handleEvent(e) {
  console.log(e.detail);
}

// After: Explicit type
function handleEvent(e: CustomEvent<{ value: string }>): void {
  console.log(e.detail.value);
}
```

#### Step 2: Enable `strictNullChecks`

Once `noImplicitAny` is clean, enable `strictNullChecks`.

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

Common fixes:

```typescript
// Before: Assumes element exists
const button = document.querySelector('button');
button.click();

// After: Null check
const button = document.querySelector('button');
button?.click();

// Or with explicit check
if (button) {
  button.click();
}
```

#### Step 3: Enable Remaining Strict Flags

Continue adding flags in this order:

1. `strictFunctionTypes`
2. `strictBindCallApply`
3. `strictPropertyInitialization`
4. `noImplicitThis`
5. `alwaysStrict`

#### Step 4: Enable the Master `strict` Flag

Once all individual flags are clean, replace them with `"strict": true`. This future-proofs your config as TypeScript adds new strict checks.

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

#### Step 5: Add Extra Strict Flags

Finally, add non-strict flags that provide additional safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Strategy 2: Per-Package Opt-In (Monorepo)

For monorepos, enable strict mode on new packages first, then migrate legacy packages incrementally.

```
HELiX/
├── tsconfig.base.json (strict: false)
├── packages/
│   ├── new-package/
│   │   └── tsconfig.json (strict: true, extends base)
│   └── legacy-package/
│       └── tsconfig.json (strict: false, extends base)
```

This approach allows new code to be strict while old code continues to function. Gradually refactor legacy packages to strict mode.

### Strategy 3: File-by-File Opt-Out (Escape Hatch)

For very large codebases, enable strict mode globally and use `// @ts-nocheck` to opt out specific files. Then gradually remove `@ts-nocheck` comments as you fix each file.

```typescript
// @ts-nocheck — TODO: Fix strict mode violations (JIRA-123)

// Legacy component with type issues
export class LegacyComponent extends LitElement {
  // ...
}
```

**Important:** This approach is a temporary measure. Do not use `@ts-nocheck` in new code. Track each `@ts-nocheck` comment as technical debt and prioritize removing them.

### Strategy 4: Automated Migration Tools

Use automated tools to accelerate migration:

#### TypeScript Strict Mode Migration Tool

```bash
npm install -g ts-strict-mode-migration
ts-strict-mode-migration --project ./tsconfig.json
```

This tool automatically adds type annotations for implicit `any` cases.

#### ESLint with TypeScript Rules

Configure ESLint to flag strict mode violations:

```json
// .eslintrc.json
{
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/strict-boolean-expressions": "warn"
  }
}
```

Run `npm run lint --fix` to automatically fix some violations.

### Common Migration Challenges

#### Challenge 1: Third-Party Library Types

Problem: Some libraries don't provide accurate type definitions.

**Solution 1: Ambient Type Declarations**

Create a `types/` directory with `.d.ts` files:

```typescript
// types/poorly-typed-library.d.ts
declare module 'poorly-typed-library' {
  export function someFunction(arg: string): Promise<number>;
}
```

**Solution 2: Type Assertions (Last Resort)**

Use type assertions sparingly when you know more than TypeScript:

```typescript
const result = (await fetch('/api/data').then((r) => r.json())) as MyDataType;
```

#### Challenge 2: Complex Generic Types

Problem: Strict mode reveals missing generic constraints.

**Solution: Add Explicit Constraints**

```typescript
// Before: Generic without constraint
function getProperty<T>(obj: T, key: string) {
  return obj[key]; // Error: Element implicitly has 'any' type
}

// After: Generic with constraint
function getProperty<T extends Record<string, unknown>>(obj: T, key: keyof T) {
  return obj[key]; // ✅ Type-safe
}
```

#### Challenge 3: Legacy Code Patterns

Problem: Code written before strict mode may use patterns that are no longer safe.

**Example: Optional Callback Parameters**

```typescript
// Before: Callback might be undefined
interface Config {
  onSuccess?: () => void;
}

function execute(config: Config): void {
  config.onSuccess(); // ❌ Error: Cannot invoke an object which is possibly undefined
}

// After: Explicit check
function executeSafe(config: Config): void {
  config.onSuccess?.(); // ✅ Safe optional call
}
```

### Migration Timeline

For a typical enterprise web component library:

| Phase   | Duration  | Focus                                                     |
| ------- | --------- | --------------------------------------------------------- |
| Phase 1 | 1-2 weeks | Enable `noImplicitAny`, fix all errors                    |
| Phase 2 | 1-2 weeks | Enable `strictNullChecks`, fix all errors                 |
| Phase 3 | 1 week    | Enable remaining strict flags                             |
| Phase 4 | 1 week    | Add extra strict flags (`noUncheckedIndexedAccess`, etc.) |
| Phase 5 | Ongoing   | Refactor `@ts-expect-error` and improve types             |

**Total estimated time: 4-6 weeks** for a medium-sized codebase (50-100 components).

### Best Practices During Migration

1. **Fix errors in small batches**: Open PRs with 5-10 files fixed at a time. This makes reviews manageable and reduces merge conflicts.

2. **Write tests first**: Before fixing type errors, ensure the component has test coverage. This prevents regressions during refactoring.

3. **Use `@ts-expect-error` with comments**: When you encounter a type error that you can't fix immediately, use `@ts-expect-error` with a comment explaining why:

   ```typescript
   // @ts-expect-error — TODO: Fix after upgrading to Lit 4.0 (JIRA-456)
   this.legacyProperty = value;
   ```

4. **Document breaking changes**: If fixing strict mode errors requires changing a public API, document it in a changelog and use semantic versioning.

5. **Run type-check in CI**: Add `npm run type-check` to your continuous integration pipeline to prevent regressions.

   ```yaml
   # .github/workflows/ci.yml
   - name: Type check
     run: npm run type-check
   ```

6. **Educate the team**: Share strict mode patterns in code reviews and internal documentation. Ensure all developers understand why strict mode matters.

### Post-Migration: Maintaining Strict Mode

Once strict mode is enabled, enforce it through:

1. **Pre-commit hooks**: Run `npm run type-check` before every commit.

   ```bash
   # .husky/pre-commit
   #!/bin/sh
   npm run type-check
   ```

2. **CI gates**: Fail builds if type-check fails.

3. **Code review guidelines**: Reject PRs that use `any`, `@ts-ignore`, or non-null assertions without justification.

4. **Automated enforcement**: Use ESLint rules to prevent banned patterns:

   ```json
   {
     "rules": {
       "@typescript-eslint/no-explicit-any": "error",
       "@typescript-eslint/no-non-null-assertion": "error",
       "no-restricted-syntax": [
         "error",
         {
           "selector": "TSAsExpression",
           "message": "Prefer type guards over type assertions"
         }
       ]
     }
   }
   ```

### Migration Checklist

Use this checklist to track migration progress:

- [ ] Enable `noImplicitAny`
- [ ] Fix all `noImplicitAny` errors
- [ ] Enable `strictNullChecks`
- [ ] Fix all `strictNullChecks` errors
- [ ] Enable `strictFunctionTypes`
- [ ] Enable `strictBindCallApply`
- [ ] Enable `strictPropertyInitialization`
- [ ] Enable `noImplicitThis`
- [ ] Enable `alwaysStrict`
- [ ] Replace individual flags with `"strict": true`
- [ ] Enable `noUncheckedIndexedAccess`
- [ ] Enable `exactOptionalPropertyTypes`
- [ ] Enable `noImplicitReturns`
- [ ] Enable `noFallthroughCasesInSwitch`
- [ ] Remove all `@ts-nocheck` comments
- [ ] Remove all `@ts-expect-error` comments (or document as technical debt)
- [ ] Add type-check to pre-commit hook
- [ ] Add type-check to CI pipeline
- [ ] Update contributing guidelines with strict mode requirements
- [ ] Train team on strict mode patterns

## Summary

TypeScript's strict mode is not a hindrance—it is an enabler. By catching errors at compile time, enforcing explicit types, and preventing common pitfalls, strict mode allows you to build web components with confidence.

In the hx-library, strict mode is paired with zero-tolerance enforcement: no `any`, no `@ts-ignore`, no shortcuts. This discipline ensures that every component is reliable, maintainable, and safe for enterprise healthcare applications.

Strict mode turns TypeScript from a type checker into a safety net—one that catches bugs before they reach production and saves lives.

## Sources

- [TypeScript: TSConfig Option: strict](https://www.typescriptlang.org/tsconfig/strict.html)
- [TypeScript: TSConfig Reference - Docs on every TSConfig option](https://www.typescriptlang.org/tsconfig/)
- [Understanding TypeScript's Strict Compiler Option | Better Stack Community](https://betterstack.com/community/guides/scaling-nodejs/typescript-strict-option/)
- [The --strict Compiler Option in TypeScript — Marius Schulz](https://mariusschulz.com/blog/the-strict-compiler-option-in-typescript)
