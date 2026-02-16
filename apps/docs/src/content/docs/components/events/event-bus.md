---
title: Event Bus and PubSub Patterns
description: Comprehensive guide to implementing EventTarget-based event buses, global communication patterns, typed pub/sub systems, unsubscribe patterns, and memory leak prevention in enterprise web components.
sidebar:
  order: 3
prev:
  link: /components/events/custom-events/
  label: Custom Events Best Practices
---

An event bus is a centralized communication channel that enables loosely-coupled coordination between components, features, or application layers without direct references. While [custom events](/components/events/custom-events) handle component-level communication through the DOM tree, event buses provide application-wide communication for cross-cutting concerns like notifications, analytics, feature flags, or real-time updates.

This guide covers everything you need to build production-ready event buses in enterprise healthcare applications: from native `EventTarget` APIs to TypeScript type safety, subscription management, memory leak prevention, and real-world patterns from hx-library.

## Why Event Buses?

### The Global Communication Challenge

Web components exist in isolation by design. Shadow DOM encapsulation prevents tight coupling, but it also creates communication challenges. A component deep in the tree shouldn't need a reference chain through five parent components to notify a distant sibling about state changes.

```
Application Structure:
  <hx-app>
    <hx-header>
      <hx-user-menu>
        <hx-button>Logout</hx-button>  ← User clicks here
      </hx-user-menu>
    </hx-header>
    <hx-main>
      <hx-sidebar>
        <hx-user-profile />  ← Needs to know about logout
      </hx-sidebar>
      <hx-notifications />  ← Needs to show "Logged out" message
    </hx-main>
  </hx-app>
```

**Without an event bus**: Prop drilling through 5+ components, tight coupling, brittle architecture.

**With an event bus**: Direct communication through a shared channel, zero coupling between components, fully testable.

### Benefits of Event Bus Pattern

1. **Decoupled communication** — Components don't need references to each other
2. **Framework agnostic** — Works across React, Vue, vanilla JS, any framework or no framework
3. **Testable** — Easy to mock, spy on, and assert event dispatch and handling
4. **Scalable** — Add new listeners without modifying publishers
5. **Type-safe** — TypeScript enforces event types across the bus at compile time
6. **Standard API** — Uses native DOM `EventTarget` interface developers already know
7. **Zero dependencies** — No external libraries, polyfills, or build tools required

### When to Use an Event Bus

Event buses solve specific problems. Use them wisely to avoid architecture sprawl.

**Good use cases:**

- **Global notifications** — Toast messages, alerts, system status updates
- **Analytics tracking** — User interaction events across features
- **Feature flags** — Runtime enable/disable of features
- **Real-time updates** — WebSocket messages, server-sent events, live data
- **Cross-feature coordination** — Authentication state, user preferences, theme changes
- **Plugin architecture** — Third-party extensions subscribe to application events

**Bad use cases (use component events instead):**

- Parent-child communication (use properties and custom events)
- Sibling communication within same parent (use parent as coordinator)
- Form field validation (use form-associated custom elements)
- Internal component state (use `@state()` decorator)
- Data that flows down the tree (use properties, not events)

### Event Bus vs Custom Events

| Aspect          | Custom Events                | Event Bus                          |
| --------------- | ---------------------------- | ---------------------------------- |
| **Scope**       | Component boundary           | Application-wide                   |
| **Coupling**    | Direct (listener on element) | Indirect (shared channel)          |
| **Discovery**   | Via DOM tree traversal       | Via central registry               |
| **Propagation** | Bubbles through DOM          | Direct dispatch to subscribers     |
| **Use case**    | Component public API         | Cross-cutting concerns             |
| **Examples**    | `hx-change`, `hx-click`      | `user:logout`, `notification:show` |

**Rule of thumb**: If the event crosses shadow boundaries and bubbles naturally through the DOM, use custom events. If it's global state or a cross-cutting concern that needs to reach arbitrary parts of the application, use an event bus.

## EventTarget: The Native Event Bus

JavaScript's native `EventTarget` class is a built-in publish-subscribe system. It's the same API that powers DOM events (`addEventListener`, `dispatchEvent`), but you can create standalone instances for non-DOM event coordination.

### Basic EventTarget Usage

```typescript
// Create a new event bus (standalone EventTarget)
const eventBus = new EventTarget();

// Subscribe to events
eventBus.addEventListener('user:login', (event) => {
  console.log('User logged in:', event);
});

// Publish events
eventBus.dispatchEvent(
  new CustomEvent('user:login', {
    detail: { userId: '123', username: 'john.doe' },
  }),
);
```

### Why EventTarget is Perfect for Event Buses

1. **Built-in** — No external dependencies, works in all modern browsers since 2020
2. **Standard API** — Developers already know `addEventListener` and `dispatchEvent`
3. **Memory-safe** — Supports `{ once: true }` for automatic cleanup after first invocation
4. **AbortController integration** — Use `signal` option for bulk listener cleanup
5. **Event options** — `passive`, `capture` for advanced control
6. **Debuggable** — Standard DevTools support, appears in browser profilers

### EventTarget API Reference

```typescript
class EventTarget {
  // Subscribe to events
  addEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void;

  // Unsubscribe from events
  removeEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions,
  ): void;

  // Publish events
  dispatchEvent(event: Event): boolean;
}

interface AddEventListenerOptions {
  capture?: boolean; // Listen during capture phase (rarely needed)
  once?: boolean; // Auto-remove listener after first invocation
  passive?: boolean; // Hint that listener won't call preventDefault()
  signal?: AbortSignal; // Remove listener when AbortController aborts
}
```

**Key insight**: `EventTarget` is not just for DOM elements. It's a general-purpose pub/sub system that happens to power the DOM event system.

## Building a Type-Safe Event Bus

TypeScript adds compile-time safety to event buses, ensuring publishers and subscribers use consistent event names and payload types.

### Basic Type-Safe Event Bus

```typescript
// 1. Define event map with all application events
interface AppEvents {
  'user:login': { userId: string; username: string };
  'user:logout': { reason: 'manual' | 'timeout' | 'error' };
  'notification:show': { message: string; variant: 'info' | 'error' | 'success' };
  'feature:toggle': { feature: string; enabled: boolean };
}

// 2. Create typed event bus wrapper class
class TypedEventBus<TEventMap extends Record<string, any>> {
  private _target = new EventTarget();

  // Subscribe with type safety
  on<K extends keyof TEventMap>(
    eventName: K,
    handler: (event: CustomEvent<TEventMap[K]>) => void,
    options?: AddEventListenerOptions,
  ): void {
    this._target.addEventListener(eventName as string, handler as EventListener, options);
  }

  // Unsubscribe with type safety
  off<K extends keyof TEventMap>(
    eventName: K,
    handler: (event: CustomEvent<TEventMap[K]>) => void,
    options?: EventListenerOptions,
  ): void {
    this._target.removeEventListener(eventName as string, handler as EventListener, options);
  }

  // Publish with type safety
  emit<K extends keyof TEventMap>(eventName: K, detail: TEventMap[K]): void {
    this._target.dispatchEvent(new CustomEvent(eventName as string, { detail }));
  }

  // Subscribe once (auto-cleanup)
  once<K extends keyof TEventMap>(
    eventName: K,
    handler: (event: CustomEvent<TEventMap[K]>) => void,
  ): void {
    this.on(eventName, handler, { once: true });
  }
}

// 3. Create singleton instance
export const appEventBus = new TypedEventBus<AppEvents>();
```

### Using the Type-Safe Event Bus

```typescript
import { appEventBus } from './event-bus.js';

// ✓ CORRECT: Type-safe subscription (autocomplete works!)
appEventBus.on('user:login', (event) => {
  console.log(event.detail.userId); // ✓ TypeScript knows this is string
  console.log(event.detail.username); // ✓ TypeScript knows this is string
});

// ✓ CORRECT: Type-safe emission
appEventBus.emit('user:login', {
  userId: '123',
  username: 'john.doe',
});

// ✗ WRONG: TypeScript error (missing required property)
appEventBus.emit('user:login', {
  userId: '123',
  // Error: Property 'username' is missing in type
});

// ✗ WRONG: TypeScript error (invalid event name)
appEventBus.on('user:invalid', (event) => {
  // Error: Argument of type '"user:invalid"' is not assignable to parameter of type 'keyof AppEvents'
});
```

**Key benefit**: TypeScript autocomplete suggests all valid event names and enforces correct payload shapes at compile time.

### Namespaced Event Pattern

Organize events by domain for clarity and maintainability:

```typescript
// Group events by feature domain
interface AuthEvents {
  'auth:login:start': { provider: string };
  'auth:login:success': { userId: string; token: string };
  'auth:login:error': { error: string };
  'auth:logout:start': void;
  'auth:logout:complete': void;
}

interface NotificationEvents {
  'notification:show': { message: string; variant: string; duration?: number };
  'notification:hide': { id: string };
  'notification:clear-all': void;
}

interface AnalyticsEvents {
  'analytics:track': { event: string; properties?: Record<string, any> };
  'analytics:page-view': { path: string; title: string };
}

// Merge all event maps
type AppEvents = AuthEvents & NotificationEvents & AnalyticsEvents;

export const appEventBus = new TypedEventBus<AppEvents>();
```

**Naming convention**: Use `domain:action:status` pattern (e.g., `auth:login:success`) for IDE autocomplete grouping and clarity.

## Subscription Management

Proper subscription management prevents memory leaks and ensures clean component lifecycles. This is critical in long-lived healthcare applications where components mount and unmount frequently.

### Basic Subscribe/Unsubscribe Pattern

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { appEventBus } from './event-bus.js';

@customElement('hx-user-profile')
export class HelixUserProfile extends LitElement {
  // CRITICAL: Store handler as class property (not inline function)
  private _handleLogout = (event: CustomEvent<{ reason: string }>): void => {
    console.log('User logged out:', event.detail.reason);
    this.requestUpdate(); // Trigger re-render
  };

  override connectedCallback(): void {
    super.connectedCallback();
    // Subscribe when component connects to DOM
    appEventBus.on('user:logout', this._handleLogout);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // CRITICAL: Unsubscribe when component disconnects from DOM
    appEventBus.off('user:logout', this._handleLogout);
  }

  override render() {
    return html`<div class="profile">User Profile</div>`;
  }
}
```

**Critical rule**: **Always store handler as class method or arrow function property**, never inline. `removeEventListener` requires the **exact same function reference** to successfully unsubscribe.

### Common Mistake: Inline Functions

This is the #1 cause of memory leaks in event bus architectures:

```typescript
// ✗ WRONG: Cannot unsubscribe (different function reference each time)
override connectedCallback(): void {
  super.connectedCallback();
  appEventBus.on('user:logout', (event) => {
    console.log('Logged out');
  });
}

override disconnectedCallback(): void {
  super.disconnectedCallback();
  // This does NOTHING — it's a different arrow function instance!
  appEventBus.off('user:logout', (event) => {
    console.log('Logged out');
  });
}
```

**Fix**: Store handler as class property so both subscribe and unsubscribe use the same reference:

```typescript
// ✓ CORRECT: Same function reference for subscribe and unsubscribe
private _handleLogout = (event: CustomEvent): void => {
  console.log('Logged out');
};

override connectedCallback(): void {
  super.connectedCallback();
  appEventBus.on('user:logout', this._handleLogout);
}

override disconnectedCallback(): void {
  super.disconnectedCallback();
  appEventBus.off('user:logout', this._handleLogout);  // ✓ Works!
}
```

### Pattern: Auto-Cleanup with `once` Option

For one-time listeners, use `{ once: true }` to automatically remove the listener after the first invocation:

```typescript
// Subscribe to event that should only fire once
appEventBus.on(
  'app:ready',
  (event) => {
    console.log('App initialized:', event.detail);
    // Listener automatically removed after first invocation — no manual cleanup!
  },
  { once: true },
);

// Or use the convenience method
appEventBus.once('app:ready', (event) => {
  console.log('App initialized');
});
```

**Use cases**: Application bootstrap events, one-time feature flag updates, initial data load notifications.

### Pattern: Cleanup with AbortController

Modern browsers support `AbortSignal` for bulk listener cleanup. This is the most elegant pattern for components with many subscriptions:

```typescript
@customElement('hx-dashboard')
export class HelixDashboard extends LitElement {
  private _abortController: AbortController | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    // Create single abort controller for all listeners
    this._abortController = new AbortController();

    // Subscribe with shared abort signal
    appEventBus.on('user:login', this._handleLogin, {
      signal: this._abortController.signal,
    });

    appEventBus.on('user:logout', this._handleLogout, {
      signal: this._abortController.signal,
    });

    appEventBus.on('notification:show', this._handleNotification, {
      signal: this._abortController.signal,
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Abort all listeners at once — one line!
    this._abortController?.abort();
  }

  private _handleLogin = (event: CustomEvent): void => {
    /* ... */
  };
  private _handleLogout = (event: CustomEvent): void => {
    /* ... */
  };
  private _handleNotification = (event: CustomEvent): void => {
    /* ... */
  };
}
```

**Benefits**:

- Single line cleanup for multiple listeners
- No need to track individual handler references
- Standard browser API (also works with `fetch`, other async operations)
- Less error-prone than manual unsubscribe

## Memory Leak Prevention

Memory leaks occur when event listeners outlive their components, preventing garbage collection. In healthcare applications that run for hours or days, small leaks compound into performance disasters.

### Common Memory Leak Scenarios

#### Leak 1: Forgetting to Unsubscribe

```typescript
// ✗ WRONG: Memory leak (no cleanup in disconnectedCallback)
@customElement('hx-widget')
export class HelixWidget extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();
    appEventBus.on('data:update', this._handleUpdate);
    // Component removed from DOM, but listener still active!
    // Every mount/unmount cycle leaks one more listener
  }

  private _handleUpdate = (event: CustomEvent): void => {
    console.log('Update:', event.detail);
  };
}
```

**Result**: After 100 mount/unmount cycles (typical in single-page apps with navigation), there are 100 zombie listeners. Each dispatched `data:update` event calls all 100 dead handlers, consuming CPU and preventing garbage collection.

**Fix**: Always unsubscribe in `disconnectedCallback()`.

```typescript
// ✓ CORRECT: Proper cleanup prevents leaks
override disconnectedCallback(): void {
  super.disconnectedCallback();
  appEventBus.off('data:update', this._handleUpdate);
}
```

#### Leak 2: Global Listeners on Short-Lived Components

```typescript
// ✗ WRONG: Global listeners on temporary dialog
@customElement('hx-confirmation-dialog')
export class HelixConfirmationDialog extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();
    // This dialog is created/destroyed frequently
    window.addEventListener('resize', this._handleResize);
    appEventBus.on('theme:change', this._handleThemeChange);
    appEventBus.on('user:logout', this._handleLogout);
  }

  // No disconnectedCallback cleanup! Memory leak grows with each dialog usage.
}
```

**Result**: Every time a confirmation dialog opens and closes, three more global listeners accumulate. After 50 confirmations, 150 zombie listeners exist.

**Fix**: Clean up in `disconnectedCallback()` or use `{ once: true }` if appropriate.

### Memory Leak Detection Techniques

#### Programmatic Detection

Add listener count tracking to your event bus:

```typescript
class TypedEventBus<TEventMap extends Record<string, any>> {
  private _target = new EventTarget();
  private _listenerCounts = new Map<string, number>();

  on<K extends keyof TEventMap>(
    eventName: K,
    handler: (event: CustomEvent<TEventMap[K]>) => void,
    options?: AddEventListenerOptions,
  ): void {
    this._target.addEventListener(eventName as string, handler as EventListener, options);

    // Track listener count
    const key = eventName as string;
    this._listenerCounts.set(key, (this._listenerCounts.get(key) || 0) + 1);

    // Warn in development if count is suspiciously high
    if (import.meta.env.DEV && this._listenerCounts.get(key)! > 50) {
      console.warn(`High listener count for "${key}":`, this._listenerCounts.get(key));
    }
  }

  off<K extends keyof TEventMap>(
    eventName: K,
    handler: (event: CustomEvent<TEventMap[K]>) => void,
    options?: EventListenerOptions,
  ): void {
    this._target.removeEventListener(eventName as string, handler as EventListener, options);

    // Track listener count
    const key = eventName as string;
    this._listenerCounts.set(key, Math.max(0, (this._listenerCounts.get(key) || 0) - 1));
  }

  // Debug helper (only available in development)
  getListenerCounts(): Record<string, number> {
    return Object.fromEntries(this._listenerCounts);
  }
}

// Usage in development console
console.log('Listener counts:', appEventBus.getListenerCounts());
// { 'user:login': 3, 'user:logout': 2, 'notification:show': 15 }
```

**Warning sign**: Listener count grows unbounded over time. If `notification:show` has 2 listeners initially but 200 after an hour of use, you have a leak.

#### Browser DevTools Detection

Use Chrome DevTools Memory Profiler:

1. Open DevTools → Memory tab
2. Take heap snapshot (baseline)
3. Perform action that creates and destroys component (e.g., open/close dialog 10 times)
4. Force garbage collection (trash can icon)
5. Take second heap snapshot
6. Compare snapshots and look for:
   - Detached DOM nodes that reference event listeners
   - EventListener objects that shouldn't exist
   - Growing arrays of handler functions

### Best Practices for Memory Safety

1. **Always pair `connectedCallback` with `disconnectedCallback`**

   ```typescript
   override connectedCallback(): void {
     super.connectedCallback();
     appEventBus.on('event', this._handler);
   }

   override disconnectedCallback(): void {
     super.disconnectedCallback();
     appEventBus.off('event', this._handler);  // Required!
   }
   ```

2. **Store handlers as class properties, never inline**

   ```typescript
   private _handler = (event: CustomEvent): void => {
     // Implementation
   };
   ```

3. **Use `{ once: true }` for one-time listeners**

   ```typescript
   appEventBus.on('init', this._handleInit, { once: true });
   ```

4. **Use `AbortController` for components with many subscriptions**

   ```typescript
   this._abortController?.abort(); // Removes all listeners at once
   ```

5. **Test component cleanup in automated tests**

   ```typescript
   it('cleans up event listeners on disconnect', async () => {
     const el = await fixture<HelixWidget>(html`<hx-widget></hx-widget>`);
     const before = appEventBus.getListenerCounts()['data:update'] || 0;

     el.remove();
     await new Promise((resolve) => setTimeout(resolve, 0));

     const after = appEventBus.getListenerCounts()['data:update'] || 0;
     expect(after).toBe(before); // No leak
   });
   ```

## Real-World Pattern: Global Notification System

Complete implementation of a production-ready notification system using event bus:

```typescript
// notification-service.ts
interface NotificationEvents {
  'notification:show': {
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
  };
  'notification:hide': { id: string };
  'notification:clear-all': void;
}

export class NotificationService {
  private _bus = new TypedEventBus<NotificationEvents>();
  private _nextId = 0;

  show(
    message: string,
    variant: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration = 5000,
  ): string {
    const id = `notification-${this._nextId++}`;

    this._bus.emit('notification:show', { message, variant, duration });

    if (duration > 0) {
      setTimeout(() => this.hide(id), duration);
    }

    return id;
  }

  hide(id: string): void {
    this._bus.emit('notification:hide', { id });
  }

  clearAll(): void {
    this._bus.emit('notification:clear-all', undefined as any);
  }

  on<K extends keyof NotificationEvents>(
    eventName: K,
    handler: (event: CustomEvent<NotificationEvents[K]>) => void,
  ): void {
    this._bus.on(eventName, handler);
  }

  off<K extends keyof NotificationEvents>(
    eventName: K,
    handler: (event: CustomEvent<NotificationEvents[K]>) => void,
  ): void {
    this._bus.off(eventName, handler);
  }
}

export const notifications = new NotificationService();
```

**Usage in components**:

```typescript
// Publisher: any component can show notifications
import { notifications } from './notification-service.js';

@customElement('hx-save-button')
export class HelixSaveButton extends LitElement {
  private async _handleClick(): Promise<void> {
    try {
      await this._save();
      notifications.show('Changes saved successfully', 'success');
    } catch (error) {
      notifications.show('Failed to save changes', 'error');
    }
  }
}

// Subscriber: notification container renders toasts
@customElement('hx-notification-container')
export class HelixNotificationContainer extends LitElement {
  @state() private _notifications: Array<{
    id: string;
    message: string;
    variant: string;
  }> = [];

  private _handleShow = (event: CustomEvent<{ message: string; variant: string }>): void => {
    const id = `toast-${Date.now()}`;
    this._notifications = [
      ...this._notifications,
      { id, message: event.detail.message, variant: event.detail.variant },
    ];
  };

  private _handleHide = (event: CustomEvent<{ id: string }>): void => {
    this._notifications = this._notifications.filter((n) => n.id !== event.detail.id);
  };

  override connectedCallback(): void {
    super.connectedCallback();
    notifications.on('notification:show', this._handleShow);
    notifications.on('notification:hide', this._handleHide);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    notifications.off('notification:show', this._handleShow);
    notifications.off('notification:hide', this._handleHide);
  }

  override render() {
    return html`
      <div class="notification-stack">
        ${this._notifications.map(
          (n) => html`
            <hx-alert variant=${n.variant} @hx-close=${() => notifications.hide(n.id)}>
              ${n.message}
            </hx-alert>
          `,
        )}
      </div>
    `;
  }
}
```

**Key features**:

- Centralized service encapsulates event bus
- Type-safe API (TypeScript autocomplete for variant values)
- Clean separation between publishers (any component) and subscriber (container)
- Proper cleanup in `disconnectedCallback()`
- Auto-hide with configurable duration

## When to Avoid Event Buses

Event buses are powerful but can be overused. Avoid them when simpler patterns suffice:

### Anti-Pattern 1: Parent-Child Communication

```typescript
// ✗ WRONG: Using event bus for parent-child communication
@customElement('hx-parent')
class Parent extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();
    appEventBus.on('child:update', this._handleChildUpdate);
  }
}

@customElement('hx-child')
class Child extends LitElement {
  private _update(): void {
    appEventBus.emit('child:update', { data: 'value' });
  }
}
```

**Fix**: Use custom events for parent-child communication:

```typescript
// ✓ CORRECT: Custom events for parent-child
@customElement('hx-child')
class Child extends LitElement {
  private _update(): void {
    this.dispatchEvent(
      new CustomEvent('hx-update', {
        bubbles: true,
        composed: true,
        detail: { data: 'value' },
      }),
    );
  }
}

@customElement('hx-parent')
class Parent extends LitElement {
  override render() {
    return html`<hx-child @hx-update=${this._handleUpdate}></hx-child>`;
  }
}
```

### Anti-Pattern 2: Replacing State Management

Event buses are not state containers. Don't use them to replace proper state management:

```typescript
// ✗ WRONG: Using event bus as state storage
appEventBus.on('state:get', (event) => {
  event.detail.callback(currentState); // Anti-pattern!
});
```

**Fix**: Use dedicated state management solution (Redux, MobX, or simple reactive store).

## Best Practices Summary

1. **Use EventTarget as foundation** — Native, standard, zero dependencies
2. **Add TypeScript safety** — Define event map for compile-time checks
3. **Store handlers as class properties** — Required for proper cleanup
4. **Always unsubscribe in disconnectedCallback** — Prevent memory leaks
5. **Use `{ once: true }` for one-time listeners** — Automatic cleanup
6. **Use `AbortController` for bulk cleanup** — Modern, efficient
7. **Namespace events by domain** — `auth:login`, `notification:show`
8. **Keep payloads minimal** — Only include essential data
9. **Test cleanup in automated tests** — Verify no memory leaks
10. **Prefer custom events for component APIs** — Event buses for global concerns only

## Further Reading

- [CustomEvent - MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
- [EventTarget - MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
- [addEventListener options - MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- [AbortController - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Memory Management - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)

## Sources

Research from web search (February 2026):

- [Let's Create a Lightweight Native Event Bus in JavaScript | CSS-Tricks](https://css-tricks.com/lets-create-a-lightweight-native-event-bus-in-javascript/)
- [EventBus Pattern: Event-Driven Communication in JS | Medium](https://yaron-galperin.medium.com/eventbus-pattern-event-driven-communication-in-js-2f29c3875982)
- [How to Implement an Event Bus in TypeScript - This Dot Labs](https://www.thisdot.co/blog/how-to-implement-an-event-bus-in-typescript)
- [EventTarget with TypeScript | RJ Zaworski](https://rjzaworski.com/2021/06/event-target-with-typescript)
- [typescript-event-target - GitHub](https://github.com/DerZade/typescript-event-target)
- [Web Components Communication Using an Event Bus - This Dot Labs](https://www.thisdot.co/blog/web-components-communication-using-an-event-bus)
- [Troubleshooting JavaScript Memory Leaks from Event Listener Mismanagement](https://www.mindfulchase.com/explore/troubleshooting-tips/programming-languages/troubleshooting-javascript-memory-leaks-from-event-listener-mismanagement.html)
- [Understanding and Preventing Memory Leaks in JavaScript | Medium](https://medium.com/@simplycodesmart/understanding-and-preventing-memory-leaks-in-javascript-1a6fc5d9f4f5)

---

**Next steps**:

- Review [Custom Events Best Practices](/components/events/custom-events) for component-level event patterns
- Explore [Event Delegation Patterns](/components/events/delegation) for efficient event handling
- Read [Component Testing](/components/testing/vitest) for event bus testing strategies
