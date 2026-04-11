---
title: Component Interfaces
description: Extract public API contracts from HELiX components using TypeScript interfaces, the implements keyword, and HTMLElementTagNameMap augmentation.
---

Interfaces separate the contract from the implementation. Consumers code against the interface; internal implementation details can change without breaking external code. HELiX uses interfaces consistently across components, mixins, and the `HTMLElementTagNameMap` augmentation.

## Public Interface Extraction

Extract a component's public API into a standalone interface. This documents the contract explicitly and enables typed references without importing the full component class:

```typescript
// The public API contract for hx-button
export interface HelixButtonInterface {
  /** Visual style variant. Reflects to the `variant` attribute. */
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline';

  /** Button size. Reflects to the `hx-size` attribute. */
  size: 'sm' | 'md' | 'lg';

  /** When true, the button is inert and visually muted. */
  disabled: boolean;

  /** When true, shows a spinner and prevents interaction. Does not set `disabled`. */
  loading: boolean;

  /** When set, renders an anchor element rather than a button. */
  href: string | undefined;

  /** Stretches the button to fill its container width. */
  full: boolean;

  /** Flips button colors for dark or gradient backgrounds. */
  inverted: boolean;
}
```

## `implements` Keyword

Use `implements` to bind the interface to the component class. TypeScript will error if the class is missing any declared member or has an incompatible type:

```typescript
import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mixinDelegatesAria } from '../../mixins/index.js';
import type { HelixButtonInterface } from './hx-button.types.js';

@customElement('hx-button')
export class HelixButton
  extends mixinDelegatesAria(LitElement)
  implements HelixButtonInterface
{

  @property({ type: String, reflect: true })
  variant: HelixButtonInterface['variant'] = 'primary';

  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: HelixButtonInterface['size'] = 'md';

  @property({ type: Boolean, reflect: true })
  disabled: boolean = false;

  @property({ type: Boolean, reflect: true })
  loading: boolean = false;

  @property({ type: String })
  href: string | undefined = undefined;

  @property({ type: Boolean, reflect: true })
  full: boolean = false;

  @property({ type: Boolean, reflect: true })
  inverted: boolean = false;

  override render(): TemplateResult {
    return html`
      <button
        ?disabled=${this.disabled}
        aria-busy=${this.loading ? 'true' : nothing}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

Using `HelixButtonInterface['variant']` for the property type means the property's type is always derived from the interface — a single source of truth.

## Interface for Mixin Return Types

Every HELiX mixin declares an interface describing the members it adds. This interface is used as the return type annotation and exported for consumers who need to type mixin instances:

```typescript
// FocusMixinInterface — the contract FocusMixin adds to a class
export interface FocusMixinInterface {
  /** True when the component host has focus (including descendant focus). */
  readonly focused: boolean;
  /** True when focus arrived via keyboard (not pointer). */
  readonly focusedVisible: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

import { LitElement } from 'lit';

export const FocusMixin = <T extends Constructor<LitElement>>(superClass: T) => {
  class FocusMixinClass extends superClass implements FocusMixinInterface {
    focused: boolean = false;
    focusedVisible: boolean = false;
    // ... implementation
  }
  return FocusMixinClass as unknown as T & Constructor<FocusMixinInterface>;
};
```

A class that uses `FocusMixin` can be typed with both the base and the mixin interface:

```typescript
import { FocusMixin, type FocusMixinInterface } from '../../mixins/FocusMixin.js';

function handleFocusChange(el: LitElement & FocusMixinInterface): void {
  if (el.focusedVisible) {
    // show keyboard-only focus indicator
  }
}
```

## Interface-Driven Development

Define the public interface before writing the implementation. This separates API design from implementation details and makes it easy to review the API in isolation:

```typescript
// 1. Define the contract first
export interface HelixAccordionItemInterface {
  /** Unique identifier used to connect trigger to panel via aria-controls. */
  itemId: string;
  /** Whether the accordion item is currently expanded. */
  expanded: boolean;
  /** Whether the item can be expanded at all. */
  disabled: boolean;
  /** Programmatically expand the item. */
  open(): void;
  /** Programmatically collapse the item. */
  close(): void;
  /** Toggle between expanded and collapsed. */
  toggle(): void;
}

// 2. Implement against the interface
@customElement('hx-accordion-item')
export class HelixAccordionItem extends LitElement implements HelixAccordionItemInterface {
  @property({ type: String, reflect: true, attribute: 'item-id' })
  itemId: string = '';

  @property({ type: Boolean, reflect: true })
  expanded: boolean = false;

  @property({ type: Boolean, reflect: true })
  disabled: boolean = false;

  open(): void {
    if (!this.disabled) this.expanded = true;
  }

  close(): void {
    this.expanded = false;
  }

  toggle(): void {
    if (this.disabled) return;
    this.expanded = !this.expanded;
  }

  override render() {
    return html`
      <div class="accordion-item" ?expanded=${this.expanded}>
        <slot name="trigger"></slot>
        <slot name="content"></slot>
      </div>
    `;
  }
}
```

## `HTMLElementTagNameMap` Augmentation

The global `HTMLElementTagNameMap` augmentation binds a tag name string to its class type. This makes `querySelector`, `querySelectorAll`, and `createElement` return the correct type automatically:

```typescript
declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
    'hx-accordion-item': HelixAccordionItem;
  }
}
```

With this in place:

```typescript
// TypeScript infers HelixButton | null — no cast needed
const button = document.querySelector('hx-button');
button?.disabled = true; // typed as boolean

// Works with querySelectorAll too
const buttons = document.querySelectorAll('hx-button');
// buttons: NodeListOf<HelixButton>

// And with createElement
const newBtn = document.createElement('hx-button');
// newBtn: HelixButton
```

Every HELiX component includes this augmentation at the bottom of its source file. It must be in a module (any file with an `import` or `export`) to count as module augmentation rather than a global declaration.

## Next Steps

- [TypeScript Declaration Files](/components-guide/typescript/declaration-files/) — generating and publishing `.d.ts` files
- [Typed Custom Events](/components-guide/typescript/typed-events/) — event map interfaces and overloads
- [Mixins](/components-guide/advanced/mixins/) — the `FocusMixin` and `mixinDelegatesAria` patterns in full
