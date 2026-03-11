---
title: Declaration Files for Components
description: Comprehensive guide to TypeScript declaration file generation, module augmentation, HTMLElementTagNameMap, declaration maps, and ambient declarations for HELIX web components
sidebar:
  order: 6
---

TypeScript declaration files (`.d.ts`) are the interface contract between hx-library and its consumers. They enable type checking, IDE autocomplete, and "Go to Definition" navigation without exposing implementation details. This guide covers automatic generation, module augmentation patterns, declaration maps, and best practices for maintaining type accuracy across the component library.

---

## What Are Declaration Files?

Declaration files contain only type information—no runtime code. They describe the shape of JavaScript modules to TypeScript's type checker and language services. When you import an hx-library component, TypeScript uses its `.d.ts` file to validate property assignments, method calls, and event handlers at compile time.

### Declaration Files vs. Source Files

```typescript
// src/components/hx-button/hx-button.ts (source)
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-button')
export class HelixButton extends LitElement {
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'ghost' = 'primary';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  render() {
    return html`<button part="button"><slot></slot></button>`;
  }
}
```

```typescript
// dist/components/hx-button/hx-button.d.ts (generated declaration)
import { LitElement } from 'lit';

export declare class HelixButton extends LitElement {
  variant: 'primary' | 'secondary' | 'ghost';
  disabled: boolean;
  render(): import('lit-html').TemplateResult<1>;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
}
```

**Key differences:**

- **No implementation details**: Function bodies, private methods, and internal state are omitted
- **Explicit `declare` keyword**: Signals to TypeScript this is ambient type information (no runtime code)
- **Preserved type annotations**: Public API types remain intact (`variant: 'primary' | 'secondary' | 'ghost'`)
- **Inferred complex types**: Return types like `TemplateResult<1>` are inferred from Lit's type definitions

---

## Automatic Declaration Generation

hx-library uses TypeScript's compiler (`tsc`) via the `vite-plugin-dts` Vite plugin to generate `.d.ts` files automatically during the build process. This ensures declarations stay synchronized with source code without manual maintenance.

### TypeScript Compiler Configuration

The `tsconfig.json` enables declaration generation:

```json
// packages/hx-library/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true, // Generate .d.ts files
    "declarationMap": true, // Generate .d.ts.map source maps
    "sourceMap": true, // Generate .js.map source maps
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts"],
  "exclude": [
    "node_modules",
    "dist",
    "src/**/*.stories.ts", // Storybook stories are not library API
    "src/**/*.test.ts", // Tests are not library API
    "src/test-utils.ts"
  ]
}
```

**Critical settings:**

| Setting                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `declaration: true`    | Generate `.d.ts` files alongside `.js` output                |
| `declarationMap: true` | Generate `.d.ts.map` files for IDE source navigation         |
| `sourceMap: true`      | Generate `.js.map` files for browser debugging               |
| `composite: true`      | Enable TypeScript project references (monorepo optimization) |

### Vite Plugin Integration

The `vite-plugin-dts` plugin orchestrates declaration generation during Vite's build:

```typescript
// packages/hx-library/vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.stories.ts'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/hx-button/index': resolve(__dirname, 'src/components/hx-button/index.ts'),
        'components/hx-card/index': resolve(__dirname, 'src/components/hx-card/index.ts'),
        // ... other entry points
      },
      formats: ['es'],
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
  },
});
```

**How it works:**

1. **Vite builds JavaScript**: Source TypeScript compiles to ESM in `dist/`
2. **Plugin runs `tsc --emitDeclarationOnly`**: TypeScript generates `.d.ts` files without re-compiling JavaScript
3. **Output mirrors source structure**: `src/components/hx-button/hx-button.ts` → `dist/components/hx-button/hx-button.d.ts`

### Build Output Structure

After running `npm run build`:

```
packages/hx-library/
├── src/
│   ├── index.ts
│   └── components/
│       ├── hx-button/
│       │   ├── index.ts
│       │   ├── hx-button.ts
│       │   └── hx-button.styles.ts
│       └── hx-card/
│           ├── index.ts
│           ├── hx-card.ts
│           └── hx-card.styles.ts
└── dist/                           # Generated output
    ├── index.js                    # ESM JavaScript
    ├── index.d.ts                  # Type declarations
    ├── index.d.ts.map              # Declaration source map
    └── components/
        ├── hx-button/
        │   ├── index.js
        │   ├── index.d.ts          # Component types
        │   ├── index.d.ts.map
        │   ├── hx-button.d.ts      # Class implementation types
        │   └── hx-button.styles.d.ts
        └── hx-card/
            ├── index.js
            ├── index.d.ts
            └── ...
```

---

## Declaration File Anatomy

A component's declaration file contains four key elements: class signature, property types, method signatures, and global augmentation.

### Component Class Declaration

The exported class signature describes the public API:

```typescript
// dist/components/hx-button/hx-button.d.ts
import { LitElement } from 'lit';

export declare class HelixButton extends LitElement {
  static styles: import('lit').CSSResult[];

  // Properties (typed, no default values)
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
  type: 'button' | 'submit' | 'reset';

  // Form integration
  static formAssociated: boolean;
  private _internals;
  constructor();
  get form(): HTMLFormElement | null;

  // Methods (no bodies, only signatures)
  render(): import('lit-html').TemplateResult<1>;

  // Private members (excluded from autocomplete but preserved for internal use)
  private _handleClick;
}
```

**Why `declare`?**

The `declare` keyword tells TypeScript this is ambient type information. The class exists at runtime (defined in the `.js` file), but this file only describes its shape for type checking.

### Property Type Preservation

TypeScript preserves property types exactly as written in source code:

```typescript
// Source: Union type for variant
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';

// Declaration: Union type preserved (default value omitted)
variant: 'primary' | 'secondary' | 'ghost';
```

**Consumer benefit:**

```typescript
import { HelixButton } from '@helixui/library/components/hx-button';

const button = document.createElement('hx-button');
button.variant = 'primary'; // ✅ Valid
button.variant = 'danger'; // ❌ Type error: not in union
```

### Method Signatures

Method signatures include parameter types and return types, but no implementation:

```typescript
// Source
render() {
  return html`<button part="button"><slot></slot></button>`;
}

// Declaration
render(): import('lit-html').TemplateResult<1>;
```

TypeScript infers the return type (`TemplateResult<1>`) from Lit's `html` tagged template. The `<1>` generic parameter indicates this is a standard template (not an SVG template, which would be `TemplateResult<2>`).

### JSDoc Comment Preservation

JSDoc comments from source files are preserved in declarations, powering IDE tooltips and documentation generators:

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
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when the button is clicked.
 *
 * @csspart button - The native button element.
 *
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color.
 */
export declare class HelixButton extends LitElement {
  /**
   * Visual style variant of the button.
   * @attr variant
   */
  variant: 'primary' | 'secondary' | 'ghost';
}
```

When a developer hovers over `HelixButton` in VS Code, they see this documentation inline.

---

## Module Augmentation (HTMLElementTagNameMap)

TypeScript's DOM library includes the `HTMLElementTagNameMap` interface, which maps tag names to element classes. By default, custom elements resolve to `HTMLElement`. Module augmentation overrides this to provide component-specific types.

### The Problem Without Augmentation

Without `HTMLElementTagNameMap` augmentation:

```typescript
// TypeScript infers: HTMLElement | null
const button = document.querySelector('hx-button');

// Error: Property 'variant' does not exist on type 'HTMLElement'
button.variant = 'primary';
```

TypeScript doesn't know `<hx-button>` is a `HelixButton` instance. You'd need manual type assertions everywhere:

```typescript
const button = document.querySelector('hx-button') as HelixButton;
button.variant = 'primary'; // Now it works, but verbose
```

### The Solution: Global Augmentation

Every component declaration file includes a global augmentation:

```typescript
// dist/components/hx-button/hx-button.d.ts
declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
}
```

**What this does:**

- **Extends the global `HTMLElementTagNameMap` interface** with the mapping `'hx-button' → HelixButton`
- **Enables type-safe DOM queries**: TypeScript now infers `querySelector('hx-button')` returns `HelixButton | null`
- **Autocomplete in IDEs**: VS Code suggests `variant`, `size`, `disabled` when typing `button.`

### Consumer Benefit

After importing the component (which loads its `.d.ts` file):

```typescript
import '@helixui/library/components/hx-button';

// TypeScript knows this is HelixButton | null
const button = document.querySelector('hx-button');

if (button) {
  button.variant = 'secondary'; // ✅ Type-checked
  button.disabled = true; // ✅ Type-checked
  button.size = 'xl'; // ❌ Error: 'xl' not in union type
}

// Works with createElement too
const newButton = document.createElement('hx-button');
newButton.variant = 'ghost'; // ✅ HelixButton type inferred
```

### Augmentation for Multiple Components

When importing the full library, all components augment `HTMLElementTagNameMap`:

```typescript
// dist/index.d.ts (barrel export)
export { HelixButton } from './components/hx-button/hx-button.js';
export { HelixCard } from './components/hx-card/hx-card.js';
export { HelixTextInput } from './components/hx-text-input/hx-text-input.js';
// ... all components

declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
    'hx-card': HelixCard;
    'hx-text-input': HelixTextInput;
    'hx-checkbox': HelixCheckbox;
    'hx-select': HelixSelect;
    // ... all tags
  }
}
```

### Pattern: Scoped Tag Names

For type safety, use template literal types to enforce tag name prefixes:

```typescript
type HelixTagName = `hx-${string}`;

function getHelixComponent(tag: HelixTagName): HTMLElement | null {
  return document.querySelector(tag);
}

getHelixComponent('hx-button'); // ✅ Valid
getHelixComponent('button'); // ❌ Error: doesn't match pattern
```

---

## Declaration Maps (Source Navigation)

Declaration maps (`.d.ts.map` files) enable "Go to Definition" navigation from declaration files back to original source files. Without them, IDEs jump to the `.d.ts` file (type information only). With them, IDEs jump to the `.ts` source (full implementation).

### Enabling Declaration Maps

Set `declarationMap: true` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

**Output:**

```
dist/components/hx-button/
├── hx-button.d.ts
├── hx-button.d.ts.map       # Source map linking to src/
└── hx-button.js
```

### Declaration Map Format

A `.d.ts.map` file is a JSON source map:

```json
{
  "version": 3,
  "file": "hx-button.d.ts",
  "sourceRoot": "",
  "sources": ["../../../src/components/hx-button/hx-button.ts"],
  "names": [],
  "mappings": "AAAA;AACA;AACA..."
}
```

The `sources` array points to the original `.ts` file. The `mappings` string encodes line/column positions using Base64 VLQ encoding (same as JavaScript source maps).

### IDE Integration

When a consumer clicks "Go to Definition" on `HelixButton`:

1. **Without declaration map**: IDE opens `dist/components/hx-button/hx-button.d.ts` (declaration file)
2. **With declaration map**: IDE opens `src/components/hx-button/hx-button.ts` (source file)

**Developer experience benefit:**

- See full implementation (not just type signature)
- Jump to method bodies, property decorators, and render logic
- Debug library code during development

### Debugging in Monorepos

In monorepo setups (like hx-library), declaration maps enable cross-package navigation:

```typescript
// apps/admin/src/app/page.tsx
import { HelixButton } from '@helixui/library/components/hx-button';

const button = new HelixButton();
// Cmd+Click on HelixButton → jumps to packages/hx-library/src/components/hx-button/hx-button.ts
```

This works because:

1. `@helixui/library` is a workspace dependency (not downloaded from npm)
2. Source files are accessible in the monorepo
3. Declaration map `sources` paths resolve correctly via `tsconfig.json` path mapping

---

## Ambient Declarations

Ambient declarations describe types for modules that exist at runtime but lack TypeScript definitions. While hx-library generates its own declarations, it may need ambient declarations for third-party dependencies or global augmentations.

### Global Type Augmentation

Extend browser globals with custom properties (e.g., analytics):

```typescript
// src/types/global.d.ts
declare global {
  interface Window {
    HelixAnalytics?: {
      trackEvent(name: string, props: Record<string, unknown>): void;
    };
  }
}

export {};
```

**Usage in components:**

```typescript
// src/components/hx-button/hx-button.ts
private _handleClick(e: MouseEvent): void {
  // TypeScript now knows Window has HelixAnalytics
  window.HelixAnalytics?.trackEvent('hx-button:click', {
    variant: this.variant,
  });
}
```

**Why `export {}`?**

The empty export makes this a module file (not a script), ensuring TypeScript treats `declare global` as a module augmentation (not redeclaration).

### Custom Element Registry Augmentation

Type-safe custom element registration:

```typescript
// src/types/custom-elements.d.ts
declare global {
  interface CustomElementRegistry {
    whenDefined(name: 'hx-button'): Promise<CustomElementConstructor>;
    whenDefined(name: 'hx-card'): Promise<CustomElementConstructor>;
    whenDefined(name: string): Promise<CustomElementConstructor>;
  }
}

export {};
```

**Consumer benefit:**

```typescript
// TypeScript autocompletes 'hx-button', 'hx-card'
await customElements.whenDefined('hx-button');
```

### Module Declaration (Third-Party Packages)

For packages without TypeScript definitions, create ambient module declarations:

```typescript
// src/types/vendor.d.ts

// Example: Declare types for a CSS-in-JS library without types
declare module 'some-untyped-library' {
  export function css(template: TemplateStringsArray, ...values: unknown[]): string;
}
```

---

## Package.json Type Exports

The `package.json` `exports` field maps import paths to declaration files, ensuring TypeScript and bundlers resolve types correctly.

### Exports Field Configuration

```json
{
  "name": "@helixui/library",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./components/*": {
      "types": "./dist/components/*/index.d.ts",
      "import": "./dist/components/*/index.js"
    },
    "./custom-elements.json": "./custom-elements.json"
  }
}
```

**How TypeScript uses this:**

1. **Import `@helixui/library`**: TypeScript resolves to `dist/index.d.ts` (via `exports["."].types`)
2. **Import `@helixui/library/components/hx-button`**: TypeScript resolves to `dist/components/hx-button/index.d.ts` (via wildcard pattern)
3. **Import `@helixui/library/custom-elements.json`**: No types (JSON file)

### Conditional Exports

The `types` condition takes precedence for TypeScript, while `import` handles runtime resolution:

```json
{
  "exports": {
    "./components/hx-button": {
      "types": "./dist/components/hx-button/index.d.ts",
      "import": "./dist/components/hx-button/index.js",
      "require": "./dist/components/hx-button/index.cjs"
    }
  }
}
```

**Fallback order:**

1. **TypeScript**: Uses `types` path
2. **ESM bundlers (Vite, Rollup)**: Use `import` path
3. **CommonJS (Node.js)**: Use `require` path (if provided)

### Wildcard Pattern Gotchas

The wildcard `"./components/*"` expands to match any path:

```typescript
// All resolve to dist/components/{name}/index.d.ts
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-card';
import '@helixui/library/components/hx-nonexistent'; // Resolves, but fails at runtime
```

**Limitation:** TypeScript doesn't validate that the component exists. If you typo a component name, you get a runtime error (module not found), not a compile-time error.

---

## Type Checking Declaration Files

After generating declarations, verify they match your public API and don't contain errors.

### Type Check Command

```bash
npm run type-check
```

This runs `tsc --noEmit`, which:

1. Checks all source files for type errors
2. Validates generated `.d.ts` files are well-formed
3. Ensures declaration file exports match source exports

### Common Declaration Errors

#### Missing Type Annotations

```typescript
// Source: Implicit return type (inferred as 'any')
function getVariant() {
  return this.variant;
}

// Declaration: 'any' type leaks into public API
getVariant(): any;
```

**Fix:** Always annotate public method return types:

```typescript
function getVariant(): 'primary' | 'secondary' | 'ghost' {
  return this.variant;
}
```

#### Private Members Exposed

```typescript
// Source: Missing 'private' modifier
_internalState = false;

// Declaration: Exposed as public
_internalState: boolean;
```

**Fix:** Mark internal members as `private` or `protected`:

```typescript
private _internalState = false;
```

#### External Dependencies Not Declared

```typescript
// Source: Import from untyped package
import { someUtil } from 'untyped-package';

// Declaration: Error - cannot find module 'untyped-package'
```

**Fix:** Add ambient module declaration (see [Ambient Declarations](#ambient-declarations)).

---

## Best Practices for Declaration Files

### 1. Never Manually Edit Generated Declarations

Declaration files are build artifacts. Editing them directly causes:

- Changes overwritten on next build
- Drift between source and declarations
- Merge conflicts in version control

**Do this instead:** Update source files and regenerate declarations.

### 2. Annotate All Public API Types

Explicit types prevent `any` leaks and improve IntelliSense:

```typescript
// Good: Explicit types
@property({ type: String })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';

focus(options?: FocusOptions): void {
  this._input?.focus(options);
}

// Bad: Inferred types (may become 'any')
@property({ type: String })
variant = 'primary'; // Type: string (too broad)

focus(options?) {
  this._input?.focus(options); // Return type: void (correct, but implicit)
}
```

### 3. Use JSDoc for Documentation

JSDoc comments in source files are preserved in declarations and power IDE tooltips:

```typescript
/**
 * Checks whether the input satisfies its constraints.
 * @returns `true` if valid, `false` otherwise.
 */
checkValidity(): boolean {
  return this._internals.checkValidity();
}
```

### 4. Export Only Public API

Avoid exporting internal utilities from the main entry point:

```typescript
// Bad: Exports internal helper
export { helixButtonStyles } from './components/hx-button/hx-button.styles.js';

// Good: Only export component class
export { HelixButton } from './components/hx-button/hx-button.js';
```

Internal exports pollute autocomplete and suggest non-public APIs to consumers.

### 5. Test Declarations Locally

Before publishing, test that declarations work in a consumer project:

```bash
# In hx-library
npm run build
npm pack

# In test project
npm install /path/to/helix-library-0.0.1.tgz
```

Verify:

- Import paths resolve (`import '@helixui/library/components/hx-button'`)
- Autocomplete works (`button.variant` suggests union values)
- "Go to Definition" navigates to source (if declaration maps enabled)

### 6. Version Declarations with Source Code

Declaration files must stay synchronized with JavaScript output. Never publish a version where:

- `.js` files are version 1.2.0
- `.d.ts` files are version 1.1.0

Use automated publishing workflows (changesets, semantic-release) to ensure versions stay aligned.

---

## Troubleshooting Declaration Generation

### Problem: No `.d.ts` Files Generated

**Symptom:** `npm run build` completes, but `dist/` contains no `.d.ts` files.

**Cause:** `declaration` not enabled in `tsconfig.json`.

**Fix:**

```json
{
  "compilerOptions": {
    "declaration": true
  }
}
```

### Problem: Declaration Files Missing Exports

**Symptom:** Consumer imports fail with "Module has no exported member 'HelixButton'".

**Cause:** Source file doesn't export the class, or `exclude` pattern hides the file.

**Fix:** Verify `src/components/hx-button/index.ts` exports the class:

```typescript
export { HelixButton } from './hx-button.js';
```

Check `tsconfig.json` doesn't exclude the file:

```json
{
  "exclude": ["src/**/*.test.ts", "src/**/*.stories.ts"]
}
```

### Problem: Declaration Map "Go to Definition" Doesn't Work

**Symptom:** Clicking "Go to Definition" opens `.d.ts` file, not `.ts` source.

**Cause:** `declarationMap: true` not set, or source files not accessible.

**Fix:**

1. Enable declaration maps:

```json
{
  "compilerOptions": {
    "declarationMap": true
  }
}
```

2. Ensure source files are published (for npm packages) or accessible (for monorepos):

```json
// package.json
{
  "files": [
    "dist",
    "src" // Include source files for monorepo navigation
  ]
}
```

### Problem: HTMLElementTagNameMap Not Working

**Symptom:** `document.querySelector('hx-button')` still returns `HTMLElement | null`.

**Cause:** Declaration file doesn't include `declare global` augmentation.

**Fix:** Verify the component's `.d.ts` file includes:

```typescript
declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
}
```

If missing, check source file includes it after the class definition.

---

## Advanced: Multi-Entry Point Declaration Strategy

hx-library uses per-component entry points for tree-shaking. This requires careful declaration file organization to match JavaScript entry points.

### Entry Point Structure

Each component has an `index.ts` re-export file:

```typescript
// src/components/hx-button/index.ts
export { HelixButton } from './hx-button.js';
```

**Generated declarations:**

```typescript
// dist/components/hx-button/index.d.ts
export { HelixButton } from './hx-button.js';
//# sourceMappingURL=index.d.ts.map
```

```typescript
// dist/components/hx-button/hx-button.d.ts
import { LitElement } from 'lit';

export declare class HelixButton extends LitElement {
  variant: 'primary' | 'secondary' | 'ghost';
  // ...
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
}
//# sourceMappingURL=hx-button.d.ts.map
```

### Why Two Declaration Files?

1. **`index.d.ts`**: Entry point type (re-exports from `hx-button.d.ts`)
2. **`hx-button.d.ts`**: Implementation type (class definition)

This mirrors JavaScript output and allows:

- **Direct class imports**: `import { HelixButton } from '@helixui/library/components/hx-button'` resolves to `index.d.ts`
- **Deep imports (advanced)**: `import { HelixButton } from '@helixui/library/components/hx-button/hx-button'` resolves to `hx-button.d.ts`

### Package.json Mapping

The `exports` field maps both entry points:

```json
{
  "exports": {
    "./components/*": {
      "types": "./dist/components/*/index.d.ts",
      "import": "./dist/components/*/index.js"
    }
  }
}
```

TypeScript resolves `@helixui/library/components/hx-button` → `dist/components/hx-button/index.d.ts` → re-export from `hx-button.d.ts`.

---

## References

Official TypeScript documentation on declaration files and related features:

- [TypeScript: Documentation - Type Declarations](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html)
- [TypeScript: Documentation - Declaration Files Introduction](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [TypeScript: Documentation - Modules .d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html)
- [TypeScript: TSConfig Option: declaration](https://www.typescriptlang.org/tsconfig/declaration.html)
- [TypeScript: TSConfig Option: declarationMap](https://www.typescriptlang.org/tsconfig/declarationMap.html)
- [TypeScript: Documentation - Creating .d.ts Files from .js files](https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html)

Additional resources on module augmentation and web component typing:

- [Defining a component – Lit](https://lit.dev/docs/components/defining/)
- [Module Augmentation in TypeScript - GeeksforGeeks](https://www.geeksforgeeks.org/typescript/module-augmentation-in-typescript/)
- [TypeScript module augmentation for nested JavaScript files · Logto blog](https://blog.logto.io/typescript-module-augmentation)

---

## Next Steps

- Read [Typing Lit Components](/components/typescript/typing-components) for component-level type patterns
- Explore [Packaging for Distribution](/components/distribution/packaging) for npm publishing workflow
- Review [Strict Mode](/components/typescript/strict-mode) for TypeScript compiler settings
