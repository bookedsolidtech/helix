---
title: Reactive Controllers
description: Encapsulate reusable lifecycle-aware behavior in Lit ReactiveController classes and compose them into HELiX components.
---

Reactive Controllers are a Lit primitive for extracting component behavior into shareable, lifecycle-aware objects. Unlike mixins — which operate at the class level — controllers are instances that attach themselves to a component host. Multiple controllers can run independently on the same component.

## The `ReactiveController` Interface

```typescript
import { type ReactiveController, type ReactiveControllerHost } from 'lit';
```

The interface requires two methods:

```typescript
interface ReactiveController {
  hostConnected?(): void;
  hostDisconnected?(): void;
  hostUpdate?(): void;
  hostUpdated?(): void;
}
```

All four methods are optional. Implement only the lifecycle hooks your controller needs.

## Attaching a Controller

A controller registers itself in its constructor by calling `host.addController(this)`. The host is a `ReactiveControllerHost` — any Lit element:

```typescript
import { type ReactiveController, type ReactiveControllerHost } from 'lit';

export class MouseTrackController implements ReactiveController {
  private _host: ReactiveControllerHost & EventTarget;

  x: number = 0;
  y: number = 0;

  constructor(host: ReactiveControllerHost & EventTarget) {
    this._host = host;
    // Self-registration — the host will call lifecycle hooks automatically
    host.addController(this);
  }

  hostConnected(): void {
    this._host.addEventListener('pointermove', this._handleMove);
  }

  hostDisconnected(): void {
    this._host.removeEventListener('pointermove', this._handleMove);
  }

  private _handleMove = (e: Event): void => {
    const pointer = e as PointerEvent;
    this.x = pointer.clientX;
    this.y = pointer.clientY;
    // Request a re-render when the tracked value changes
    this._host.requestUpdate();
  };
}
```

Usage in a component:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { MouseTrackController } from './mouse-track-controller.js';

@customElement('hx-cursor-display')
export class HelixCursorDisplay extends LitElement {
  static override styles = [tokenStyles];

  private _mouse = new MouseTrackController(this);

  override render(): TemplateResult {
    return html`
      <div class="coords">
        x: ${this._mouse.x}, y: ${this._mouse.y}
      </div>
    `;
  }
}
```

## Lifecycle Hooks

### `hostConnected()`

Called when the host element connects to the DOM (`connectedCallback`). Use it to:
- Start observers (IntersectionObserver, ResizeObserver, MutationObserver)
- Add event listeners
- Initialize subscriptions

### `hostDisconnected()`

Called when the host element disconnects from the DOM (`disconnectedCallback`). Use it to:
- Disconnect observers
- Remove event listeners
- Clean up subscriptions

### `hostUpdate()`

Called before each host update cycle, in `willUpdate()`. Use it to compute derived state before rendering.

### `hostUpdated()`

Called after each host update cycle, in `updated()`. Use it to react to DOM changes post-render.

## ResizeController Example

```typescript
import { type ReactiveController, type ReactiveControllerHost } from 'lit';

export interface ResizeControllerOptions {
  /** ResizeObserver box model to observe. Defaults to 'content-box'. */
  box?: ResizeObserverBoxOptions;
}

export class ResizeController implements ReactiveController {
  private _host: ReactiveControllerHost & Element;
  private _observer: ResizeObserver | null = null;
  private _box: ResizeObserverBoxOptions;

  /** The most recent observed size, or undefined before first observation. */
  contentRect: DOMRectReadOnly | undefined;

  constructor(
    host: ReactiveControllerHost & Element,
    options: ResizeControllerOptions = {},
  ) {
    this._host = host;
    this._box = options.box ?? 'content-box';
    host.addController(this);
  }

  hostConnected(): void {
    this._observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        this.contentRect = entry.contentRect;
        this._host.requestUpdate();
      }
    });
    this._observer.observe(this._host, { box: this._box });
  }

  hostDisconnected(): void {
    this._observer?.disconnect();
    this._observer = null;
    this.contentRect = undefined;
  }
}
```

Usage:

```typescript
import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { ResizeController } from './resize-controller.js';

@customElement('hx-responsive-container')
export class HelixResponsiveContainer extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host { display: block; }
      .compact { font-size: var(--hx-font-size-sm); }
      .spacious { font-size: var(--hx-font-size-base); }
    `,
  ];

  private _resize = new ResizeController(this);

  private get _isCompact(): boolean {
    return (this._resize.contentRect?.width ?? Infinity) < 400;
  }

  override render(): TemplateResult {
    return html`
      <div class=${this._isCompact ? 'compact' : 'spacious'}>
        <slot></slot>
      </div>
    `;
  }
}
```

## `host.requestUpdate()` — Triggering Re-Renders

Controllers trigger component re-renders by calling `this._host.requestUpdate()`. This queues the same microtask update as a property change — multiple calls in the same synchronous block are batched:

```typescript
hostUpdated(): void {
  // Called after each render — safe to read updated DOM here
  const height = (this._host as Element).getBoundingClientRect().height;
  if (height !== this._previousHeight) {
    this._previousHeight = height;
    // Schedule another render to reflect the new measured value
    this._host.requestUpdate();
  }
}
```

Be careful with `requestUpdate()` in `hostUpdated()` — if the condition never stabilizes you will create an infinite render loop.

## Multiple Controllers on One Component

Controllers compose without conflict. Each registers independently and runs its lifecycle hooks in registration order:

```typescript
@customElement('hx-data-chart')
export class HelixDataChart extends LitElement {
  static override styles = [tokenStyles];

  // Two independent controllers — no coupling between them
  private _resize = new ResizeController(this);
  private _intersection = new IntersectionController(this, 0.25);

  override render() {
    if (!this._intersection.intersecting) {
      return html`<div class="placeholder"></div>`;
    }

    const width = this._resize.contentRect?.width ?? 300;
    return html`<canvas width=${width}></canvas>`;
  }
}
```

## Next Steps

- [Mixins](/components-guide/advanced/mixins/) — class-level behavior composition via the mixin pattern
- [Async Tasks](/components-guide/advanced/tasks/) — the `@lit/task` controller for async data fetching
- [Composition Patterns](/components-guide/advanced/composition-patterns/) — when to use controllers vs mixins vs slots
