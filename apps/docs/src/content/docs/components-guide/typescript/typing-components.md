---
title: Typing Web Components
description: Use TypeScript's type system to write safer, more ergonomic HELiX components with typed properties, lifecycle hooks, and render methods.
---

TypeScript and Lit 3.x work together cleanly when you understand how decorators, generics, and Lit's own types interoperate. This page covers the patterns HELiX uses throughout the component library.

## Type-Safe `@property()` Declarations

Lit's `@property()` decorator and TypeScript type annotations serve different purposes and must both be present.

- The `type` option in `@property()` tells Lit how to convert the HTML **attribute** string into a JavaScript value.
- The TypeScript type annotation describes the **property** type in the JavaScript object model.

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-badge')
export class HelixBadge extends LitElement {

  // Both declarations are required:
  // - type: String  → Lit converts attribute → property (no-op for strings)
  // - : 'success' | 'warning' | 'error'  → TypeScript narrows the JS type
  @property({ type: String, reflect: true })
  variant: 'success' | 'warning' | 'error' = 'success';

  @property({ type: Number })
  count: number = 0;

  @property({ type: Boolean, reflect: true })
  pill: boolean = false;

  override render(): TemplateResult {
    return html`
      <span class="badge badge--${this.variant}">
        ${this.count}
      </span>
    `;
  }
}
```

Without the `type` option, Lit treats the attribute as a string even if your TypeScript type says `number`. Without the TypeScript annotation, you lose autocomplete and type-checking on property access.

## `PropertyValues` Generic

Lit's `updated()` and `willUpdate()` lifecycle hooks receive a `PropertyValues<this>` map. The generic parameter gives you typed key access — misspelled property names become compile errors.

```typescript
import { LitElement, html, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-progress')
export class HelixProgress extends LitElement {

  @property({ type: Number })
  value: number = 0;

  @property({ type: Number })
  max: number = 100;

  @state()
  private _percentage: number = 0;

  // PropertyValues<this> gives typed keys — 'value' and 'max' are checked
  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('max')) {
      this._percentage = this.max > 0 ? Math.round((this.value / this.max) * 100) : 0;
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('value')) {
      this.dispatchEvent(
        new CustomEvent<{ value: number; percentage: number }>('hx-change', {
          bubbles: true,
          composed: true,
          detail: { value: this.value, percentage: this._percentage },
        }),
      );
    }
  }

  override render(): TemplateResult {
    return html`
      <div
        role="progressbar"
        aria-valuenow=${this.value}
        aria-valuemin="0"
        aria-valuemax=${this.max}
      >
        <div class="bar" style="width: ${this._percentage}%"></div>
      </div>
    `;
  }
}
```

`PropertyValues<this>` is a `Map<PropertyKey, unknown>` narrowed by the class's own property keys, so `.has('nonExistentProp')` is a type error.

## Typed `render()` Return Type

Always annotate `render()` with `TemplateResult` or `TemplateResult | typeof nothing`:

```typescript
import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-tooltip')
export class HelixTooltip extends LitElement {

  @property({ type: String })
  content: string = '';

  // Explicit return type catches accidental `undefined` returns
  override render(): TemplateResult | typeof nothing {
    if (!this.content) return nothing;

    return html`
      <div class="tooltip" role="tooltip">
        ${this.content}
      </div>
    `;
  }
}
```

For components that always render content, use `TemplateResult` without the union. For components that conditionally render nothing, use `TemplateResult | typeof nothing`.

## `PropertyDeclaration` for Custom Property Configs

When building shared property option presets, type them as `PropertyDeclaration`:

```typescript
import { type PropertyDeclaration } from 'lit';

// Reusable property config for reflected boolean attributes
const reflectedBoolean: PropertyDeclaration = {
  type: Boolean,
  reflect: true,
};

// Reusable config for size enums
const sizeProperty: PropertyDeclaration = {
  type: String,
  reflect: true,
  attribute: 'hx-size',
};

@customElement('hx-button')
export class HelixButton extends LitElement {
  @property(reflectedBoolean)
  disabled: boolean = false;

  @property(sizeProperty)
  size: 'sm' | 'md' | 'lg' = 'md';
}
```

## Exporting Component Types for Consumers

Export the class type alongside the element definition so consumers can reference it without importing the full component module:

```typescript
// hx-chip.ts
@customElement('hx-chip')
export class HelixChip extends LitElement {
  @property({ type: String })
  label: string = '';

  @property({ type: Boolean, reflect: true })
  selected: boolean = false;

  @property({ type: Boolean, reflect: true })
  removable: boolean = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-chip': HelixChip;
  }
}

// index.ts — re-export the type
export type { HelixChip };
export { HelixChip } from './hx-chip.js';
```

Consumers can then use the exported type for typed DOM queries and event handler parameters:

```typescript
import type { HelixChip } from '@helixui/library/components/hx-chip';

function handleChipClick(e: Event): void {
  const chip = e.target as HelixChip;
  console.log(chip.label, chip.selected);
}

const chip = document.querySelector<HelixChip>('hx-chip');
chip?.focus();
```

## Next Steps

- [Strict Mode TypeScript](/components-guide/typescript/strict-mode/) — `strict: true` and its implications for component authoring
- [Typed Custom Events](/components-guide/typescript/typed-events/) — event detail interfaces and event maps
- [Component Interfaces](/components-guide/typescript/interfaces/) — `implements`, public interface extraction
