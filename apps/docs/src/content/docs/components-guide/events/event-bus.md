---
title: Event Bus Pattern
description: Coordinate cross-component communication in HELiX using a shared EventTarget as a typed event bus.
---

Most component communication happens through direct parent-child relationships: a parent listens for events from a child, or passes properties down. Sometimes, though, two components are distant siblings — a sidebar filter and a data table, for example — and neither is an ancestor of the other. An event bus provides a shared communication channel without requiring tight coupling.

## EventTarget as an Event Bus

The browser's `EventTarget` class is a lightweight, built-in event emitter. You can instantiate it directly and use it as a shared bus:

```typescript
// src/bus/helix-bus.ts
export const helixBus = new EventTarget();
```

Because `EventTarget` is a class, you can extend it to add type safety:

```typescript
// src/bus/helix-bus.ts

interface BusEventMap {
  'hx-filter-change': CustomEvent<{ filters: Record<string, string> }>;
  'hx-selection-change': CustomEvent<{ ids: string[] }>;
  'hx-data-refresh': CustomEvent<void>;
}

class HelixBus extends EventTarget {
  emit<K extends keyof BusEventMap>(
    type: K,
    detail: BusEventMap[K] extends CustomEvent<infer D> ? D : never
  ) {
    this.dispatchEvent(new CustomEvent(type as string, { detail }));
  }

  on<K extends keyof BusEventMap>(
    type: K,
    handler: (e: BusEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) {
    this.addEventListener(type as string, handler as EventListener, options);
    return () => this.removeEventListener(type as string, handler as EventListener);
  }
}

export const helixBus = new HelixBus();
```

## Using the Bus in Components

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { helixBus } from '../bus/helix-bus.js';

// Publisher component — emits filter changes
@customElement('hx-filter-bar')
export class HelixFilterBar extends LitElement {
  static override styles = css`:host { display: block; }`;

  private _applyFilters(filters: Record<string, string>) {
    helixBus.emit('hx-filter-change', { filters });
  }

  override render() {
    return html`
      <button @click=${() => this._applyFilters({ status: 'active' })}>
        Active only
      </button>
      <button @click=${() => this._applyFilters({})}>
        Clear filters
      </button>
    `;
  }
}
```

```typescript
// Subscriber component — reacts to filter changes
@customElement('hx-data-table')
export class HelixDataTable extends LitElement {
  static override styles = css`:host { display: block; }`;

  @state() private _filters: Record<string, string> = {};

  // Store the unsubscribe function so we can clean up
  private _unsubscribe?: () => void;

  override connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = helixBus.on('hx-filter-change', (e) => {
      this._filters = e.detail.filters;
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = undefined;
  }

  override render() {
    return html`
      <p>Active filters: ${JSON.stringify(this._filters)}</p>
      <slot></slot>
    `;
  }
}
```

## Cleanup in `disconnectedCallback`

**Always unsubscribe** when the component disconnects from the DOM. Forgetting this is a memory leak — the component instance stays alive in the bus's listener list even after the element is removed.

```typescript
// Pattern 1: Store unsubscribe function (shown above)
this._unsubscribe = helixBus.on('hx-filter-change', this._handleFilter);
// In disconnectedCallback:
this._unsubscribe?.();

// Pattern 2: Store handler reference and call removeEventListener
private _handleFilter = (e: CustomEvent<...>) => { ... };

override connectedCallback() {
  super.connectedCallback();
  helixBus.addEventListener('hx-filter-change', this._handleFilter as EventListener);
}

override disconnectedCallback() {
  super.disconnectedCallback();
  helixBus.removeEventListener('hx-filter-change', this._handleFilter as EventListener);
}
```

Arrow function class properties (`private _handleFilter = (e) => { ... }`) preserve `this` binding without `.bind(this)`, which would produce a new function reference on every call and break `removeEventListener`.

## Using `document` as a Simple Bus

For simpler cases, `document` works as a lightweight bus without any setup. Components emit events with `bubbles: true, composed: true` and other components listen on `document`:

```typescript
// Any component can emit on document
this.dispatchEvent(
  new CustomEvent('hx-global-notification', {
    detail: { message: 'Saved successfully', type: 'success' },
    bubbles: true,
    composed: true,
  })
);

// Any component can listen on document
document.addEventListener('hx-global-notification', (e: Event) => {
  const detail = (e as CustomEvent).detail;
  // Show notification
});
```

This approach is simpler but less structured. It works well for infrequent system-wide events (notifications, theme changes, session expiration). Use a typed `EventTarget` bus for high-frequency or domain-specific events.

## Typed Event Map Pattern

Define all bus event types in one place to maintain a single source of truth:

```typescript
// src/bus/event-types.ts
export interface HxBusEvents {
  'hx-filter-change':    { filters: Record<string, string> };
  'hx-selection-change': { ids: string[] };
  'hx-data-refresh':     undefined;
  'hx-auth-expired':     undefined;
  'hx-theme-change':     { theme: 'light' | 'dark' | 'system' };
}
```

Import this interface in any component that publishes or subscribes to keep payload shapes consistent across the application.

## When Not to Use an Event Bus

The bus pattern introduces implicit coupling — components share state through a hidden channel that is difficult to trace in the DOM tree. Avoid it when:

- A direct parent-child property/event relationship is possible.
- Two components share a common ancestor that could coordinate them.
- The relationship between components changes based on user configuration.

Prefer the event bus for genuinely global or cross-cutting concerns: user authentication state, application-wide notifications, theme switching, and analytics.

## Next Steps

- [Custom Events](/components-guide/events/custom-events/) — standard component-to-parent communication
- [Event Patterns and Best Practices](/components-guide/events/event-patterns/) — listener options and cleanup
- [Event Delegation](/components-guide/events/delegation/) — shadow DOM event routing
