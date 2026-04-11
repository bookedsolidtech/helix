---
title: Generic Components
description: Build reusable HELiX components parameterized over item types, typed events, and generic mixins using TypeScript generics.
---

Generic Lit components let you write data-display and list primitives that are fully type-safe for any item shape, without duplicating logic. This page covers the patterns HELiX uses for generic component classes, typed custom events, and generic mixins.

## Generic LitElement Subclass

TypeScript allows class generics on `LitElement` subclasses. The type parameter flows through properties, methods, and dispatched events:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-list')
export class HelixList<T extends { id: string }> extends LitElement {

  // attribute: false — objects cannot be serialized to attributes
  @property({ attribute: false })
  items: T[] = [];

  @property({ attribute: false })
  renderItem: ((item: T, index: number) => TemplateResult) | null = null;

  override render(): TemplateResult {
    return html`
      <ul class="list">
        ${this.items.map((item, i) =>
          this.renderItem
            ? html`<li class="list__item">${this.renderItem(item, i)}</li>`
            : html`<li class="list__item">${String(item.id)}</li>`
        )}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-list': HelixList<{ id: string }>;
  }
}
```

Usage from JavaScript:

```typescript
const list = document.querySelector('hx-list') as HelixList<{ id: string; label: string }>;
list.items = [
  { id: '1', label: 'First' },
  { id: '2', label: 'Second' },
];
list.renderItem = (item) => html`<span>${item.label}</span>`;
```

## Typed Generic Properties

Combine `@property({ attribute: false })` with a generic type for JS-only object properties. Attributes are always strings, so complex shapes must bypass attribute reflection:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface SelectOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

@customElement('hx-select-list')
export class HelixSelectList<T> extends LitElement {

  @property({ attribute: false })
  options: SelectOption<T>[] = [];

  @property({ attribute: false })
  value: T | null = null;

  @state()
  private _highlighted: number = -1;

  private _select(option: SelectOption<T>): void {
    if (option.disabled) return;
    this.value = option.value;
    this.dispatchEvent(
      new CustomEvent<{ value: T; option: SelectOption<T> }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value: option.value, option },
      }),
    );
  }

  override render(): TemplateResult {
    return html`
      <ul role="listbox" class="select-list">
        ${this.options.map(
          (opt, i) => html`
            <li
              role="option"
              aria-selected=${this.value === opt.value}
              aria-disabled=${opt.disabled ?? false}
              class="select-list__option ${i === this._highlighted ? 'select-list__option--highlighted' : ''}"
              @click=${() => this._select(opt)}
            >
              ${opt.label}
            </li>
          `
        )}
      </ul>
    `;
  }
}
```

## Typed Generic Custom Events

Generic type parameters flow naturally into `CustomEvent` detail types:

```typescript
// Generic event detail that captures item type and index
interface HelixSelectionDetail<T> {
  item: T;
  index: number;
  previousItem: T | null;
}

// Typed dispatch helper — keeps event logic close to the component
function dispatchSelection<T>(
  host: LitElement,
  item: T,
  index: number,
  previousItem: T | null,
): void {
  host.dispatchEvent(
    new CustomEvent<HelixSelectionDetail<T>>('hx-selection-change', {
      bubbles: true,
      composed: true,
      detail: { item, index, previousItem },
    }),
  );
}
```

Consumers get full type safety on the detail:

```typescript
list.addEventListener('hx-selection-change', (e: CustomEvent<HelixSelectionDetail<MenuItem>>) => {
  const { item, index } = e.detail;
  console.log(item.label, index); // item is MenuItem, not unknown
});
```

## Generic Mixins

The canonical TypeScript mixin pattern uses a constructor type that must accept `any[]` arguments — this is a TypeScript requirement (TS2545), not a design choice:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = LitElement> = new (...args: any[]) => T;
```

A generic mixin parameterized over the base:

```typescript
import { LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = LitElement> = new (...args: any[]) => T;

export interface SelectableMixinInterface<T> {
  selected: T | null;
  selectItem(item: T): void;
}

export function SelectableMixin<TBase extends Constructor, TItem>(Base: TBase) {
  class SelectableMixinClass extends Base {
    @property({ attribute: false })
    selected: TItem | null = null;

    selectItem(item: TItem): void {
      const previous = this.selected;
      this.selected = item;
      this.dispatchEvent(
        new CustomEvent<{ item: TItem; previous: TItem | null }>('hx-select', {
          bubbles: true,
          composed: true,
          detail: { item, previous },
        }),
      );
    }

    override updated(changed: PropertyValues): void {
      super.updated(changed);
      if (changed.has('selected')) {
        this.setAttribute('aria-selected', this.selected !== null ? 'true' : 'false');
      }
    }
  }

  return SelectableMixinClass;
}
```

## Constraints with `extends`

Add type constraints to generic parameters to guarantee shape:

```typescript
// T must have an id and a label — safe to render without renderItem fallback
@customElement('hx-option-list')
export class HelixOptionList<T extends { id: string; label: string }> extends LitElement {

  @property({ attribute: false })
  items: T[] = [];

  override render(): TemplateResult {
    return html`
      <ul>
        ${this.items.map(
          (item) => html`<li data-id=${item.id}>${item.label}</li>`
        )}
      </ul>
    `;
  }
}
```

The constraint `T extends { id: string; label: string }` means TypeScript will error if you assign items without those fields, and you get autocomplete on `item.id` and `item.label` inside the class.

## Next Steps

- [Typed Custom Events](/components-guide/typescript/typed-events/) — event map interfaces and `addEventListener` overloads
- [Component Interfaces](/components-guide/typescript/interfaces/) — `implements` and public API contracts
- [Mixins](/components-guide/advanced/mixins/) — full mixin patterns used in HELiX
