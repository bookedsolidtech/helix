---
title: TypeScript Declaration Files
description: Generate, review, and publish .d.ts declaration files for HELiX components so consumers get full type safety without importing source TypeScript.
---

Declaration files (`.d.ts`) describe the public API of a compiled JavaScript module in TypeScript terms. When HELiX packages are published to npm, consumers install JavaScript plus a matching set of `.d.ts` files. This page covers how those files are generated, what to check in them, and how the Custom Elements Manifest (CEM) relates to types.

## `HTMLElementTagNameMap` Augmentation

The most important typing in any component file is the global `HTMLElementTagNameMap` declaration. TypeScript includes this in the generated `.d.ts`, making the mapping available to consumers automatically on import:

```typescript
// In hx-button.ts — included in source
declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
}
```

The compiled `hx-button.d.ts` will include the same block. Any project that imports `@helixui/library/components/hx-button` automatically gets:

```typescript
// In the consumer's project:
import '@helixui/library/components/hx-button';

const btn = document.querySelector('hx-button'); // HelixButton | null
const allBtns = document.querySelectorAll('hx-button'); // NodeListOf<HelixButton>
```

## Generating `.d.ts` with the TypeScript Compiler

HELiX uses the TypeScript compiler (`tsc`) with `declaration: true` and `declarationMap: true`:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  }
}
```

- `declaration: true` — emit `.d.ts` alongside each `.js` file.
- `declarationMap: true` — emit `.d.ts.map` files linking the declarations back to the original `.ts` source. This lets consumers "Go to Definition" and land in the source TypeScript, not the compiled declarations.

The output structure mirrors the source:

```
dist/
  components/
    hx-button/
      hx-button.js
      hx-button.js.map
      hx-button.d.ts
      hx-button.d.ts.map
      index.js
      index.d.ts
```

## What to Verify in Generated Declarations

Open `dist/components/hx-button/hx-button.d.ts` after a build and confirm:

1. All `@property()` fields appear with their correct types (not `any`).
2. Mixin-inherited members appear on the class (the mixin return type cast handles this).
3. The `HTMLElementTagNameMap` augmentation is present.
4. Exported event detail interfaces appear in the `.d.ts`.
5. Private fields (`#internals`, `_handleClick`) are emitted as `#internals` and absent from the public surface (class private fields are erased in `.d.ts`).

```typescript
// Expected shape in hx-button.d.ts
import { LitElement, type TemplateResult } from 'lit';
import { type AriaDelegationMixinInterface } from '../../mixins/aria-delegation.js';

export interface HelixClickDetail {
  originalEvent: MouseEvent;
}

export declare class HelixButton extends LitElement implements AriaDelegationMixinInterface {
  static formAssociated: boolean;
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
  loading: boolean;
  href: string | undefined;
  target: string | undefined;
  name: string | undefined;
  value: string | undefined;
  full: boolean;
  inverted: boolean;
  get form(): HTMLFormElement | null;
  formDisabledCallback(disabled: boolean): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
}
```

## CEM vs Hand-Written Types

HELiX generates a [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/) (CEM) alongside TypeScript declarations. The CEM is a JSON file that describes components for tooling (Storybook, VS Code extensions, IDEs):

```bash
# Generate CEM from source using the analyzer
npx @custom-elements-manifest/analyzer analyze --globs "src/**/*.ts" --outdir dist
```

The resulting `dist/custom-elements.json` includes:

```json
{
  "schemaVersion": "2.0.0",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/components/hx-button/hx-button.js",
      "declarations": [
        {
          "kind": "class",
          "name": "HelixButton",
          "tagName": "hx-button",
          "members": [
            {
              "kind": "field",
              "name": "variant",
              "type": { "text": "'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'" },
              "default": "'primary'"
            }
          ]
        }
      ]
    }
  ]
}
```

The CEM is separate from TypeScript `.d.ts` files. The CEM describes the element for tools; `.d.ts` files describe it for the TypeScript compiler. Both are needed for a complete publishing story.

## Publishing Types in npm Packages

In `package.json`, declare `types` (or `exports` with `types`) to point consumers to the declarations:

```json
{
  "name": "@helixui/library",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./components/hx-button": {
      "types": "./dist/components/hx-button/index.d.ts",
      "import": "./dist/components/hx-button/index.js"
    }
  },
  "customElements": "dist/custom-elements.json",
  "sideEffects": false
}
```

The `customElements` field in `package.json` is recognized by VS Code's [Custom Elements Language Server](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) and Storybook's auto-docs.

## `isolatedModules` Compatibility

HELiX sets `isolatedModules: true`, which means each file must be transpilable independently. This has one implication for declarations: re-exports of types must use `export type`:

```typescript
// index.ts — correct for isolatedModules
export type { HelixButton } from './hx-button.js';
export type { HelixClickDetail, HelixButtonEventMap } from './hx-button.js';

// Also export the class itself (value export, not type-only)
export { HelixButton } from './hx-button.js';
```

Using `export type` for type-only re-exports ensures the TypeScript compiler and bundler agree on what is a value vs a type, and prevents errors when `verbatimModuleSyntax` is enabled.

## Next Steps

- [Component Interfaces](/components-guide/typescript/interfaces/) — `implements` and `HTMLElementTagNameMap`
- [Typing Web Components](/components-guide/typescript/typing-components/) — `@property()` types and `PropertyValues<this>`
- [Bundle Size Optimization](/components-guide/performance/bundle-size/) — `sideEffects: false` and tree-shaking declarations
