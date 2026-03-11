---
title: Custom Elements Manifest Fundamentals
description: Comprehensive guide to Custom Elements Manifest format, generation, and consumption in hx-library.
sidebar:
  order: 63
---

The Custom Elements Manifest (CEM) is a machine-readable JSON file that describes the public API of web components in a standardized format. It serves as the single source of truth for component metadata, enabling IDE autocomplete, documentation generation, framework integrations, and build-time tooling.

In hx-library, CEM is critical infrastructure that bridges component implementation and developer experience. Every component's properties, events, slots, CSS custom properties, and CSS parts are automatically extracted from source code and made available to Storybook, documentation tools, and consuming applications.

---

## What is Custom Elements Manifest?

Custom Elements Manifest is an open standard maintained by the Open Web Components community. It provides a JSON schema for describing web components in a framework-agnostic way, similar to how TypeScript declaration files describe JavaScript APIs.

### Purpose and Benefits

**Single Source of Truth**: Component metadata lives in source code (JSDoc comments, TypeScript types, decorators). CEM extracts this metadata into a portable format.

**Tool Integration**: CEM enables rich IDE autocomplete, Storybook autodocs, documentation site generation, and framework adapters without manual duplication.

**Framework Agnostic**: Works with Lit, Stencil, vanilla web components, or any custom element implementation. The output format is standardized.

**Build-Time Validation**: CEM generation acts as a smoke test for public API consistency. Missing JSDoc or incorrect types surface during build.

### Schema Version

hx-library uses CEM schema version 1.0.0, defined at [custom-elements-manifest.open-wc.org/schema](https://custom-elements-manifest.open-wc.org/schema). This version is stable and widely supported by tooling.

---

## CEM JSON Schema Structure

A Custom Elements Manifest file is a JSON document with a well-defined structure. The root object contains metadata and an array of module declarations.

### Root Object

```json
{
  "schemaVersion": "1.0.0",
  "readme": "",
  "modules": [
    // Array of module declarations
  ]
}
```

**schemaVersion**: String indicating CEM format version (always `"1.0.0"` for hx-library).

**readme**: Optional markdown content for package-level documentation (currently unused in hx-library).

**modules**: Array of JavaScript module declarations. Each module corresponds to a source file that exports components or utilities.

---

## Module Declarations

Each module represents a JavaScript/TypeScript file. Modules contain declarations (classes, functions, variables) and exports.

### Module Structure

```json
{
  "kind": "javascript-module",
  "path": "src/components/hx-button/hx-button.ts",
  "declarations": [
    // Array of class/function/variable declarations
  ],
  "exports": [
    // Array of named/default exports
  ]
}
```

**kind**: Always `"javascript-module"` for ES modules.

**path**: Relative path from package root to source file (e.g., `"src/components/hx-button/hx-button.ts"`).

**declarations**: Array of classes, functions, or variables declared in this module.

**exports**: Array of exports from this module (named exports, default exports, custom element definitions).

### Re-Export Modules

Index files (`index.ts`) that re-export from other modules have empty `declarations` arrays:

```json
{
  "kind": "javascript-module",
  "path": "src/components/hx-button/index.ts",
  "declarations": [],
  "exports": [
    {
      "kind": "js",
      "name": "HelixButton",
      "declaration": {
        "name": "HelixButton",
        "module": "./hx-button.js"
      }
    }
  ]
}
```

---

## Class Declarations

Class declarations describe component classes. For custom elements, the class declaration includes component-specific metadata.

### hx-button Example

```json
{
  "kind": "class",
  "description": "A button component for user interaction.",
  "name": "HelixButton",
  "cssProperties": [
    /* ... */
  ],
  "cssParts": [
    /* ... */
  ],
  "slots": [
    /* ... */
  ],
  "members": [
    /* ... */
  ],
  "events": [
    /* ... */
  ],
  "attributes": [
    /* ... */
  ],
  "superclass": {
    "name": "LitElement",
    "package": "lit"
  },
  "tagName": "hx-button",
  "customElement": true,
  "summary": "Primary interactive element for triggering actions."
}
```

**kind**: Always `"class"` for component classes.

**name**: JavaScript class name (e.g., `"HelixButton"`).

**description**: Long-form description extracted from JSDoc comment block.

**summary**: Short description extracted from `@summary` JSDoc tag.

**tagName**: HTML tag name for custom element (e.g., `"hx-button"`).

**customElement**: Boolean indicating this class is a custom element.

**superclass**: Base class metadata (name and package).

---

## Custom Element Metadata

Custom elements have additional metadata arrays that describe their public API surface.

### CSS Custom Properties

CSS custom properties (CSS variables) that the component accepts for theming:

```json
"cssProperties": [
  {
    "description": "Button background color.",
    "name": "--hx-button-bg",
    "default": "var(--hx-color-primary-500)"
  },
  {
    "description": "Button text color.",
    "name": "--hx-button-color",
    "default": "var(--hx-color-neutral-0)"
  }
]
```

**name**: CSS custom property name (always starts with `--hx-` in hx-library).

**description**: Human-readable explanation of purpose.

**default**: Default value or fallback chain.

Extracted from `@cssprop` JSDoc tags:

```typescript
/**
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color.
 */
```

### CSS Parts

Shadow DOM parts exposed via `part` attribute for external styling:

```json
"cssParts": [
  {
    "description": "The native button element.",
    "name": "button"
  }
]
```

**name**: Part name (lowercase, hyphenated).

**description**: Explanation of what the part targets.

Extracted from `@csspart` JSDoc tags:

```typescript
/**
 * @csspart button - The native button element.
 */
```

### Slots

Content projection slots defined in component template:

```json
"slots": [
  {
    "description": "Default slot for button label text or content.",
    "name": ""
  }
]
```

**name**: Slot name (empty string for default slot, named string for named slots).

**description**: Explanation of expected content.

Extracted from `@slot` JSDoc tags:

```typescript
/**
 * @slot - Default slot for button label text or content.
 * @slot icon - Custom icon to display before label.
 */
```

---

## Properties, Methods, Events

### Properties (Members)

Properties are reactive attributes on the component class:

```json
"members": [
  {
    "kind": "field",
    "name": "variant",
    "type": {
      "text": "'primary' | 'secondary' | 'ghost'"
    },
    "default": "'primary'",
    "description": "Visual style variant of the button.",
    "attribute": "variant",
    "reflects": true
  }
]
```

**kind**: `"field"` for properties, `"method"` for methods.

**name**: Property name in JavaScript (camelCase).

**type**: TypeScript type annotation as text.

**default**: Default value as string.

**attribute**: HTML attribute name (if reflected). May differ from property name (e.g., `size` property with `hx-size` attribute).

**reflects**: Boolean indicating if property changes update the attribute.

**privacy**: `"private"`, `"protected"`, or omitted (public).

Extracted from Lit decorators and JSDoc:

```typescript
/**
 * Visual style variant of the button.
 * @attr variant
 */
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';
```

### Methods

Public methods available on component instances:

```json
"members": [
  {
    "kind": "method",
    "name": "checkValidity",
    "return": {
      "type": {
        "text": "boolean"
      }
    },
    "description": "Checks the validity of the form element without showing validation UI."
  }
]
```

**return**: Return type metadata.

**parameters**: Array of parameter metadata (name, type, description).

Private methods (prefixed with `_`) are included but marked with `"privacy": "private"`.

### Events

Custom events dispatched by the component:

```json
"events": [
  {
    "name": "hx-click",
    "type": {
      "text": "CustomEvent<{originalEvent: MouseEvent}>"
    },
    "description": "Dispatched when the button is clicked (not disabled)."
  }
]
```

**name**: Event name (always prefixed with `hx-` in hx-library).

**type**: TypeScript type for event object.

**description**: Explanation of when event fires and what detail contains.

Extracted from `@fires` JSDoc tags or inline `@event` comments:

```typescript
/**
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when the button is clicked.
 */
this.dispatchEvent(
  new CustomEvent('hx-click', {
    bubbles: true,
    composed: true,
    detail: { originalEvent: e },
  }),
);
```

### Attributes

Attributes mirror properties but use HTML attribute syntax:

```json
"attributes": [
  {
    "name": "variant",
    "type": {
      "text": "'primary' | 'secondary' | 'ghost'"
    },
    "default": "'primary'",
    "description": "Visual style variant of the button.",
    "fieldName": "variant",
    "attribute": "variant"
  }
]
```

**fieldName**: Corresponding JavaScript property name.

**attribute**: HTML attribute name.

Generated automatically from `@property` decorators with `reflect: true` or `attribute` option.

---

## Exports

Exports describe what is publicly available from a module.

### JavaScript Export

```json
{
  "kind": "js",
  "name": "HelixButton",
  "declaration": {
    "name": "HelixButton",
    "module": "src/components/hx-button/hx-button.ts"
  }
}
```

**kind**: `"js"` for standard JavaScript exports.

**name**: Export name.

**declaration**: Reference to the declaration (name and module path).

### Custom Element Definition

```json
{
  "kind": "custom-element-definition",
  "name": "hx-button",
  "declaration": {
    "name": "HelixButton",
    "module": "src/components/hx-button/hx-button.ts"
  }
}
```

**kind**: `"custom-element-definition"` for custom element registry entries.

**name**: Tag name used in HTML (`hx-button`).

**declaration**: Reference to the class that implements the element.

This export type is generated when `@customElement('hx-button')` decorator is detected.

---

## CEM Analyzer Configuration

hx-library uses `@custom-elements-manifest/analyzer` to generate CEM from source code.

### Package.json Script

```json
"scripts": {
  "cem": "custom-elements-manifest analyze --litelement --globs \"src/components/**/*.ts\" --exclude \"**/*.stories.ts\" --exclude \"**/*.styles.ts\""
}
```

**--litelement**: Enable Lit-specific metadata extraction (detects `@property`, `@customElement`, etc.).

**--globs**: File patterns to analyze (all `.ts` files in `src/components/`).

**--exclude**: Patterns to skip (stories and style files contain no component definitions).

### Output Location

Generated CEM is written to `packages/hx-library/custom-elements.json`.

This file is committed to version control and published with the package.

### Package.json Metadata

```json
{
  "customElements": "custom-elements.json",
  "exports": {
    "./custom-elements.json": "./custom-elements.json"
  }
}
```

**customElements**: Standard package.json field indicating CEM location.

**exports**: Named export allowing imports like `import cem from '@helixui/library/custom-elements.json'`.

---

## Generating CEM for hx-library

### Manual Generation

```bash
npm run cem
```

Runs analyzer and writes `custom-elements.json` to package root.

### Build Integration

CEM generation is **not** part of the standard build pipeline. It must be run manually after component changes.

**Rationale**: CEM generation is deterministic and only changes when component source changes. Separating it from build reduces build time and allows developers to review CEM diffs before commit.

### When to Regenerate

Run `npm run cem` after:

- Adding or removing components
- Changing component public API (properties, events, methods)
- Updating JSDoc comments (`@cssprop`, `@csspart`, `@slot`, `@fires`)
- Modifying TypeScript types for public members

**Rule**: If a change affects what developers see in IDE autocomplete or Storybook controls, regenerate CEM.

### Validation

After generation, validate CEM:

1. **File exists**: `packages/hx-library/custom-elements.json` should be present.
2. **Valid JSON**: File should parse without errors.
3. **Tag name present**: Each component declaration should have `"tagName"` and `"customElement": true`.
4. **Public API complete**: All `@property` decorators should appear in `members` and `attributes` arrays.

---

## Consuming CEM

CEM is consumed by multiple tools in the hx-library ecosystem.

### Storybook Integration

Storybook reads CEM to generate controls and documentation tabs automatically.

#### Configuration

```typescript
// apps/storybook/.storybook/main.ts
export default {
  addons: [
    '@storybook/addon-essentials',
    // CEM integration happens automatically when custom-elements.json is present
  ],
};
```

Storybook detects `custom-elements.json` via the `customElements` field in `package.json`.

#### Control Generation

Storybook generates controls (dropdowns, text inputs, checkboxes) based on CEM property metadata:

- **String union types** (`'primary' | 'secondary'`) become dropdown controls
- **Boolean properties** become toggle controls
- **String properties** become text input controls
- **Number properties** become numeric input controls

Default values and descriptions are pulled from CEM.

#### Docs Tab

The "Docs" tab in Storybook displays:

- Component description and summary
- Properties table (name, type, default, description)
- Events table (name, type, description)
- Slots table (name, description)
- CSS custom properties table
- CSS parts table

All data is sourced from CEM.

### IDE Autocomplete

Modern IDEs (VS Code with Custom Data extension, IntelliJ IDEA) can read CEM to provide autocomplete for custom elements.

#### VS Code Configuration

Install "Custom Elements Manifest" extension and add to `.vscode/settings.json`:

```json
{
  "html.customData": ["./node_modules/@helixui/library/custom-elements.json"]
}
```

This enables:

- Tag name completion (`<hx-bu...` suggests `<hx-button>`)
- Attribute completion (`<hx-button var...` suggests `variant=""`)
- Event completion (when using framework bindings)

### Documentation Site

Astro Starlight documentation can parse CEM to generate component reference pages.

**hx-library approach**: Component reference is manually written in Starlight markdown. CEM provides ground truth for validation but is not directly consumed by docs build.

**Alternative approach**: Some projects use CEM to generate markdown tables or interactive API explorers. This is not currently implemented in hx-library.

### Framework Adapters

Framework wrappers (React, Vue, Angular) can use CEM to generate typed component wrappers automatically.

**Example**: `@lit-labs/react` can read CEM to generate React components with correct TypeScript props.

hx-library does not currently ship framework adapters, but CEM makes this possible in the future.

---

## Best Practices

### JSDoc Comments are Required

Every public property, method, event, slot, CSS custom property, and CSS part must have a JSDoc comment. This is not optional.

**Bad**:

```typescript
@property({ type: String })
variant: 'primary' | 'secondary' = 'primary';
```

**Good**:

```typescript
/**
 * Visual style variant of the button.
 * @attr variant
 */
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' = 'primary';
```

Missing JSDoc results in empty descriptions in CEM, which propagates to Storybook and IDE autocomplete as blank tooltips.

### Use Explicit TypeScript Types

Avoid `any` or implicit types. CEM extracts types from TypeScript annotations.

**Bad**:

```typescript
@property()
size = 'md';
```

**Good**:

```typescript
@property({ type: String })
size: 'sm' | 'md' | 'lg' = 'md';
```

String union types enable dropdown controls in Storybook.

### Document Event Detail

Event JSDoc should specify the shape of `event.detail`:

```typescript
/**
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when value changes.
 */
```

This appears in CEM `events` array and helps consumers understand event payloads.

### Use @attr for Custom Attributes

If a property uses a custom attribute name (different from property name), document it:

```typescript
/**
 * Size of the button.
 * @attr hx-size
 */
@property({ type: String, attribute: 'hx-size' })
size: 'sm' | 'md' | 'lg' = 'md';
```

This ensures CEM `attributes` array has the correct HTML attribute name.

### Prefix CSS Custom Properties

All CSS custom properties should start with `--hx-` for namespacing:

```typescript
/**
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color.
 */
```

This prevents collisions with global CSS variables and maintains design system consistency.

### Validate After Regeneration

After running `npm run cem`, open Storybook and verify:

1. Controls appear for all properties
2. Docs tab shows all properties, events, slots
3. Default values match component implementation
4. Descriptions are present and accurate

If anything is missing, check JSDoc comments and decorator configuration.

### Commit CEM with Code Changes

When adding or modifying components, regenerate CEM and commit it in the same PR:

```bash
# After component changes
npm run cem

# Commit both source and manifest
git add packages/hx-library/src/components/hx-button/
git add packages/hx-library/custom-elements.json
git commit -m "feat(button): add outline variant"
```

This keeps CEM synchronized with source code and prevents drift.

---

## Common Issues

### Missing Properties in Storybook Controls

**Symptom**: Property exists on component but doesn't appear in Storybook controls.

**Cause**: Missing `@property` decorator or missing JSDoc comment.

**Fix**: Add decorator and JSDoc:

```typescript
/**
 * Variant style.
 */
@property({ type: String })
variant: 'primary' | 'secondary' = 'primary';
```

Regenerate CEM.

### Incorrect Default Values in CEM

**Symptom**: CEM shows wrong default value for property.

**Cause**: Default value is not a literal (e.g., computed from function call).

**Fix**: Use literal values for defaults:

```typescript
// Bad
@property({ type: Number })
size = getSizeFromConfig();

// Good
@property({ type: Number })
size = 16;
```

### Events Not Appearing in Docs Tab

**Symptom**: Component dispatches event but it's not in Storybook docs.

**Cause**: Missing `@fires` JSDoc tag.

**Fix**: Add JSDoc tag above component class or inline near `dispatchEvent`:

```typescript
/**
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched on value change.
 */
```

Regenerate CEM.

### CSS Custom Properties Not Extracted

**Symptom**: CSS variables used in styles but not in CEM.

**Cause**: Missing `@cssprop` JSDoc tag in component class comment block.

**Fix**: Add JSDoc tag at class level (not in styles file):

```typescript
/**
 * A button component.
 *
 * @cssprop [--hx-button-bg=var(--hx-color-primary)] - Background color.
 */
@customElement('hx-button')
export class HelixButton extends LitElement {}
```

Regenerate CEM.

---

## Summary

Custom Elements Manifest is the bridge between component source code and developer tooling. It extracts metadata from TypeScript types, Lit decorators, and JSDoc comments into a standardized JSON format that powers Storybook autodocs, IDE autocomplete, and documentation generation.

In hx-library, CEM is infrastructure-grade. Every component must have complete JSDoc coverage. CEM generation is manual and deliberate, ensuring developers review API changes before commit. The generated manifest is committed to version control and published with the package, making component metadata available to all consumers.

**Key takeaways**:

- CEM is generated from source via `npm run cem` using `@custom-elements-manifest/analyzer`
- All public API surface (properties, events, slots, CSS custom properties, CSS parts) must have JSDoc comments
- Storybook reads CEM to generate controls and documentation automatically
- CEM is committed alongside component source to keep metadata synchronized
- Missing JSDoc or incorrect types result in degraded developer experience (blank tooltips, missing controls)

For component authors: complete JSDoc coverage is not optional. For tool maintainers: CEM is the single source of truth for component metadata. For consumers: CEM enables rich IDE experiences and documentation without manual API descriptions.

Custom Elements Manifest turns web components from opaque custom tags into first-class citizens with IDE-grade developer experience.
