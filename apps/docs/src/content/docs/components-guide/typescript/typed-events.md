---
title: Typed Custom Events
description: Define event detail interfaces, event map types, and typed addEventListener overloads for HELiX custom elements.
---

Custom events in HELiX carry strongly typed `detail` payloads. This page covers the full chain: defining detail interfaces, dispatching typed events, declaring event maps, and overloading `addEventListener` so consumers get type safety on their handlers.

## Event Detail Interfaces

Define a dedicated interface for each event's detail payload. Export it from the component module so consumers can import and use it:

```typescript
// Event detail for hx-button's click event
export interface HelixClickDetail {
  /** The original DOM MouseEvent that triggered the hx-click. */
  originalEvent: MouseEvent;
}

// Event detail for hx-text-input's change event
export interface HelixInputChangeDetail {
  /** The current value of the input. */
  value: string;
  /** Whether the value passes validation. */
  valid: boolean;
}

// Event detail for hx-select's selection event
export interface HelixSelectDetail {
  /** The newly selected value string. */
  value: string;
  /** The display label of the selected option. */
  label: string;
}
```

## `CustomEvent<Detail>` Typing

Pass the detail interface as the generic argument to `CustomEvent`:

```typescript
import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mixinDelegatesAria } from '../../mixins/index.js';

export interface HelixClickDetail {
  originalEvent: MouseEvent;
}

@customElement('hx-button')
export class HelixButton extends mixinDelegatesAria(LitElement) {

  @property({ type: Boolean, reflect: true })
  disabled: boolean = false;

  @property({ type: Boolean, reflect: true })
  loading: boolean = false;

  private _handleClick(e: MouseEvent): void {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // The generic argument ensures detail is typed as HelixClickDetail
    this.dispatchEvent(
      new CustomEvent<HelixClickDetail>('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );
  }

  override render(): TemplateResult {
    return html`
      <button
        ?disabled=${this.disabled}
        aria-busy=${this.loading ? 'true' : nothing}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

## Event Map Interface

An event map interface extends `HTMLElementEventMap` and declares the custom event names alongside their `CustomEvent` types. This unlocks typed `addEventListener` calls on the element instance:

```typescript
import type { HelixClickDetail } from './hx-button.js';

export interface HelixButtonEventMap extends HTMLElementEventMap {
  'hx-click': CustomEvent<HelixClickDetail>;
}
```

Attach the event map to the class via interface merging and an `addEventListener` overload:

```typescript
export interface HelixButton {
  addEventListener<K extends keyof HelixButtonEventMap>(
    type: K,
    listener: (this: HelixButton, ev: HelixButtonEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof HelixButtonEventMap>(
    type: K,
    listener: (this: HelixButton, ev: HelixButtonEventMap[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
}
```

With this in place, consumers get type-safe handlers:

```typescript
import type { HelixButton, HelixClickDetail } from '@helixui/library/components/hx-button';

const button = document.querySelector<HelixButton>('hx-button')!;

// TypeScript infers `e` as `CustomEvent<HelixClickDetail>` automatically
button.addEventListener('hx-click', (e) => {
  const { originalEvent } = e.detail; // originalEvent: MouseEvent — typed
  console.log(originalEvent.clientX);
});
```

## `dispatchEvent` Type Narrowing

When you dispatch multiple event types from a single component, use a helper that enforces the correct payload for each event name:

```typescript
export interface HelixTabsEventMap extends HTMLElementEventMap {
  'hx-tab-change': CustomEvent<HelixTabChangeDetail>;
  'hx-tab-close': CustomEvent<HelixTabCloseDetail>;
}

export interface HelixTabChangeDetail {
  activeTab: string;
  previousTab: string | null;
}

export interface HelixTabCloseDetail {
  closedTab: string;
}

@customElement('hx-tabs')
export class HelixTabs extends LitElement {
  private _activateTab(id: string, previousId: string | null): void {
    this.dispatchEvent(
      new CustomEvent<HelixTabChangeDetail>('hx-tab-change', {
        bubbles: true,
        composed: true,
        detail: { activeTab: id, previousTab: previousId },
      }),
    );
  }

  private _closeTab(id: string): void {
    this.dispatchEvent(
      new CustomEvent<HelixTabCloseDetail>('hx-tab-close', {
        bubbles: true,
        composed: true,
        detail: { closedTab: id },
      }),
    );
  }
}
```

## Exporting Event Types for Consumers

A well-organized component module exports everything a consumer needs in one place:

```typescript
// hx-button/index.ts

// The class itself
export { HelixButton } from './hx-button.js';

// Event detail types — consumers import these for handler annotations
export type { HelixClickDetail } from './hx-button.js';

// The event map — consumers import this for typed addEventListener
export type { HelixButtonEventMap } from './hx-button.js';
```

Consumer usage with full type inference:

```typescript
import type {
  HelixButton,
  HelixClickDetail,
  HelixButtonEventMap,
} from '@helixui/library/components/hx-button';

// Handler with explicit type annotation
function onButtonClick(e: CustomEvent<HelixClickDetail>): void {
  console.log(e.detail.originalEvent.type); // 'click'
}

const btn = document.querySelector<HelixButton>('hx-button')!;
btn.addEventListener('hx-click', onButtonClick);
```

## Next Steps

- [Component Interfaces](/components-guide/typescript/interfaces/) — `implements` keyword and interface-driven API design
- [Generic Components](/components-guide/typescript/generics/) — typing events with generic detail shapes
- [Typing Web Components](/components-guide/typescript/typing-components/) — `@property()` types and `PropertyValues<this>`
