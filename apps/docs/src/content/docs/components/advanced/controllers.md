---
title: Reactive Controllers
description: Master Lit's Reactive Controller API for composable, reusable logic that integrates seamlessly with component lifecycle. Learn to build controllers for cross-cutting concerns, state management, and behavior composition in enterprise healthcare web components.
sidebar:
  order: 69
---

# Reactive Controllers

Reactive Controllers are Lit's solution for composing reusable behavior across components. Instead of using mixins or inheritance hierarchies, controllers provide a lightweight pattern for sharing lifecycle-aware logic, state management, and cross-cutting concerns. This guide explores the ReactiveController interface, lifecycle hooks, composition patterns, and real-world examples from building enterprise healthcare components.

## What Are Reactive Controllers?

A Reactive Controller is an object that hooks into a Lit component's reactive update lifecycle. Controllers participate in the same lifecycle callbacks as the host component—`connectedCallback()`, `disconnectedCallback()`, and the update cycle—without requiring inheritance or wrapper components.

Controllers excel at:

- **Cross-cutting concerns**: Logging, analytics, feature flags
- **Reusable behaviors**: Keyboard navigation, focus management, resize observation
- **State management**: Integrating with external stores, context providers
- **DOM APIs**: Managing global event listeners, intersection observers, mutation observers
- **Complex logic extraction**: Separating concerns from component implementation

### The Controller Pattern vs. Alternatives

| Pattern                    | Use Case                       | Pros                            | Cons                           |
| -------------------------- | ------------------------------ | ------------------------------- | ------------------------------ |
| **Reactive Controller**    | Lifecycle-aware reusable logic | Composition, testable, portable | Extra abstraction layer        |
| **Mixin**                  | Extending class functionality  | Direct property/method access   | Conflicts, fragile inheritance |
| **Higher-Order Component** | Wrapping components            | Familiar pattern from React     | Nesting, prop drilling         |
| **Base Class**             | Shared component foundation    | Simple, straightforward         | Single inheritance limit       |
| **Utility Function**       | Pure logic, no lifecycle       | Simple, no overhead             | No lifecycle hooks             |

**Rule of thumb**: If your logic needs lifecycle hooks (`connected`, `updated`, `disconnected`), use a controller. If it's pure computation, use a utility function.

## The ReactiveController Interface

The `ReactiveController` interface defines four optional lifecycle methods. Controllers implement only the methods they need:

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface ReactiveController {
  /**
   * Called when the host element is connected to the DOM.
   * Runs after the host's connectedCallback() and after the render root exists.
   */
  hostConnected?(): void;

  /**
   * Called when the host element is disconnected from the DOM.
   * Use this for cleanup: removing listeners, disconnecting observers, etc.
   */
  hostDisconnected?(): void;

  /**
   * Called before the host's update() method runs.
   * Runs before render(), useful for reading DOM before it changes.
   */
  hostUpdate?(): void;

  /**
   * Called after the host's update() completes.
   * Runs after render() and DOM updates. Safe to read layout.
   */
  hostUpdated?(): void;
}
```

### ReactiveControllerHost Interface

Controllers receive a `ReactiveControllerHost` reference to their host component. This interface provides access to the update system:

```typescript
export interface ReactiveControllerHost {
  /**
   * Registers a controller with the host.
   */
  addController(controller: ReactiveController): void;

  /**
   * Unregisters a controller (rarely needed).
   */
  removeController(controller: ReactiveController): void;

  /**
   * Schedules an update of the host.
   */
  requestUpdate(): void;

  /**
   * Returns a Promise that resolves when the host's next update completes.
   */
  readonly updateComplete: Promise<boolean>;
}
```

In practice, the host is always a `LitElement`, which extends this interface with additional methods and properties.

## Controller Lifecycle Hooks

### hostConnected()

**When it runs**: After the host's `connectedCallback()`, once the shadow root exists and the first update is scheduled.

**Purpose**: Setup work that requires the component to be in the DOM.

**Common uses**:

- Add event listeners to `window`, `document`, or other global objects
- Setup observers (ResizeObserver, IntersectionObserver, MutationObserver)
- Subscribe to external data sources (stores, event buses, WebSockets)
- Initialize third-party libraries

**Example: Window resize listener**

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export class ResizeController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private handleResize = () => {
    this.host.requestUpdate();
  };

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected(): void {
    window.addEventListener('resize', this.handleResize);
  }

  hostDisconnected(): void {
    window.removeEventListener('resize', this.handleResize);
  }

  getViewportWidth(): number {
    return window.innerWidth;
  }
}
```

**Usage in component:**

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ResizeController } from './resize-controller.js';

@customElement('hx-responsive-card')
export class HelixResponsiveCard extends LitElement {
  private resizeController = new ResizeController(this);

  render() {
    const width = this.resizeController.getViewportWidth();
    const variant = width < 768 ? 'compact' : 'expanded';

    return html`
      <div class="card card--${variant}">
        <slot></slot>
      </div>
    `;
  }
}
```

### hostDisconnected()

**When it runs**: When the host is removed from the DOM (before garbage collection).

**Purpose**: Clean up resources created in `hostConnected()`.

**Critical**: This callback is essential for preventing memory leaks. Always clean up:

- Event listeners on global objects
- Observers (ResizeObserver, IntersectionObserver, MutationObserver)
- Timers (setTimeout, setInterval, requestAnimationFrame)
- Subscriptions (RxJS, stores, event buses)
- WebSocket connections
- Open requests (use AbortController)

**Example: Intersection observer cleanup**

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export class LazyLoadController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private observer?: IntersectionObserver;
  public visible = false;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        this.visible = entries[0].isIntersecting;
        this.host.requestUpdate();
      },
      { threshold: 0.1 },
    );

    this.observer.observe(this.host);
  }

  hostDisconnected(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }
}
```

**Usage:**

```typescript
@customElement('hx-lazy-image')
export class HelixLazyImage extends LitElement {
  @property({ type: String })
  src = '';

  private lazyLoad = new LazyLoadController(this);

  render() {
    return html`
      ${this.lazyLoad.visible
        ? html`<img src="${this.src}" alt="" />`
        : html`<div class="placeholder">Loading...</div>`}
    `;
  }
}
```

### hostUpdate()

**When it runs**: Before the host's `update()` method, which means before `render()` is called.

**Purpose**: Read DOM state before it changes. Useful for animations that need to capture "before" measurements.

**Common uses**:

- Capture element dimensions before render
- Read scroll positions before content changes
- Store current DOM state for comparison
- Prepare animation state transitions

**Example: FLIP animation controller**

FLIP (First, Last, Invert, Play) is a technique for performant animations. Read element bounds before update, compare after update, then animate the delta.

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class FlipController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private before?: Position;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    this.host.addController(this);
  }

  hostUpdate(): void {
    // First: Capture current position before render
    const rect = this.host.getBoundingClientRect();
    this.before = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  hostUpdated(): void {
    if (!this.before) return;

    // Last: Capture new position after render
    const rect = this.host.getBoundingClientRect();
    const after = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };

    // Invert: Calculate delta
    const deltaX = this.before.x - after.x;
    const deltaY = this.before.y - after.y;
    const deltaWidth = this.before.width / after.width;
    const deltaHeight = this.before.height / after.height;

    // Skip animation if no movement
    if (deltaX === 0 && deltaY === 0 && deltaWidth === 1 && deltaHeight === 1) {
      return;
    }

    // Play: Animate from old position to new
    this.host.animate(
      [
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaWidth}, ${deltaHeight})`,
        },
        { transform: 'translate(0, 0) scale(1, 1)' },
      ],
      {
        duration: 300,
        easing: 'ease-out',
      },
    );

    this.before = undefined;
  }
}
```

### hostUpdated()

**When it runs**: After the host's `updated()` method, which means after the DOM has been updated and painted.

**Purpose**: Perform work that requires the updated DOM. Safe to read layout, dispatch events, or trigger follow-up updates.

**Common uses**:

- Measure DOM after render (element dimensions, scroll positions)
- Synchronize with external libraries (charts, maps, editors)
- Dispatch custom events
- Trigger animations based on layout
- Update third-party UI components

**Example: Chart synchronization controller**

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Chart } from 'chart.js';

export class ChartController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private chart?: Chart;
  private canvas?: HTMLCanvasElement;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected(): void {
    // Chart initialization happens in hostUpdated after first render
  }

  hostUpdated(): void {
    // Find canvas in shadow DOM
    const shadowRoot = (this.host as LitElement).renderRoot;
    const canvas = shadowRoot.querySelector('canvas');

    if (!canvas) return;

    // Initialize chart on first update
    if (!this.chart) {
      this.chart = new Chart(canvas, {
        type: 'line',
        data: { datasets: [] },
        options: { responsive: true },
      });
      this.canvas = canvas;
    }
  }

  hostDisconnected(): void {
    this.chart?.destroy();
    this.chart = undefined;
    this.canvas = undefined;
  }

  updateData(data: unknown): void {
    if (this.chart) {
      this.chart.data = data as any;
      this.chart.update();
    }
  }
}
```

## Accessing the Host Element

Controllers have full access to the host component via the `ReactiveControllerHost` reference. Cast it to `LitElement & HTMLElement` to access component properties, shadow root, and DOM methods.

### Reading Host Properties

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { LitElement } from 'lit';

export class ThemeController implements ReactiveController {
  private host: ReactiveControllerHost & LitElement;

  constructor(host: ReactiveControllerHost & LitElement) {
    this.host = host;
    this.host.addController(this);
  }

  hostUpdated(): void {
    // Access host properties
    const shadowRoot = this.host.renderRoot as ShadowRoot;
    const theme = (this.host as any).theme || 'light';

    // Apply theme styles
    shadowRoot.adoptedStyleSheets = [
      /* theme-specific stylesheets */
    ];
  }
}
```

### Triggering Host Updates

Call `this.host.requestUpdate()` to schedule a re-render when controller state changes:

```typescript
export class TimerController implements ReactiveController {
  private host: ReactiveControllerHost;
  private intervalId?: number;
  public seconds = 0;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected(): void {
    this.intervalId = window.setInterval(() => {
      this.seconds++;
      this.host.requestUpdate(); // Trigger host re-render
    }, 1000);
  }

  hostDisconnected(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
```

### Awaiting Host Updates

Use `await this.host.updateComplete` to wait for the host to finish rendering:

```typescript
export class AnimationController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    this.host.addController(this);
  }

  async animateIn(): Promise<void> {
    // Wait for any pending render to complete
    await this.host.updateComplete;

    // Now safe to animate
    await this.host.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' })
      .finished;
  }
}
```

## Controller Composition Patterns

### Multiple Controllers

A component can use multiple controllers simultaneously. Each controller manages a distinct concern:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ResizeController } from './resize-controller.js';
import { LazyLoadController } from './lazy-load-controller.js';
import { KeyboardController } from './keyboard-controller.js';

@customElement('hx-data-table')
export class HelixDataTable extends LitElement {
  // Controller 1: Responsive layout
  private resizeController = new ResizeController(this);

  // Controller 2: Lazy loading rows
  private lazyLoadController = new LazyLoadController(this);

  // Controller 3: Keyboard navigation
  private keyboardController = new KeyboardController(this, {
    ArrowUp: () => this.previousRow(),
    ArrowDown: () => this.nextRow(),
  });

  @property({ type: Array })
  data: unknown[] = [];

  render() {
    const isMobile = this.resizeController.getViewportWidth() < 768;
    const shouldLoad = this.lazyLoadController.visible;

    return html`
      <div class="table ${isMobile ? 'table--mobile' : 'table--desktop'}">
        ${shouldLoad ? this.renderRows() : this.renderPlaceholder()}
      </div>
    `;
  }

  private renderRows() {
    return html`<!-- Render data rows -->`;
  }

  private renderPlaceholder() {
    return html`<div class="placeholder">Scroll to load...</div>`;
  }

  private previousRow() {
    /* Navigate to previous row */
  }
  private nextRow() {
    /* Navigate to next row */
  }
}
```

### Parameterized Controllers

Controllers can accept configuration options to customize behavior:

```typescript
interface KeyboardOptions {
  [key: string]: () => void;
}

export class KeyboardController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private keyMap: KeyboardOptions;

  private handleKeydown = (e: KeyboardEvent) => {
    const handler = this.keyMap[e.key];
    if (handler) {
      e.preventDefault();
      handler();
    }
  };

  constructor(host: ReactiveControllerHost & HTMLElement, keyMap: KeyboardOptions) {
    this.host = host;
    this.keyMap = keyMap;
    this.host.addController(this);
  }

  hostConnected(): void {
    this.host.addEventListener('keydown', this.handleKeydown);
  }

  hostDisconnected(): void {
    this.host.removeEventListener('keydown', this.handleKeydown);
  }

  updateKeyMap(keyMap: KeyboardOptions): void {
    this.keyMap = keyMap;
  }
}
```

**Usage:**

```typescript
@customElement('hx-dialog')
export class HelixDialog extends LitElement {
  private keyboard = new KeyboardController(this, {
    Escape: () => this.close(),
    Enter: () => this.confirm(),
    Tab: () => this.focusNext(),
  });

  // Methods referenced by controller
  private close() {
    /* Close dialog */
  }
  private confirm() {
    /* Confirm action */
  }
  private focusNext() {
    /* Move focus */
  }
}
```

### Controller Inheritance

Controllers can extend other controllers to build on existing behavior:

```typescript
// Base controller
export class BaseObserverController implements ReactiveController {
  protected host: ReactiveControllerHost & HTMLElement;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    this.host.addController(this);
  }

  protected triggerUpdate(): void {
    this.host.requestUpdate();
  }
}

// Specialized controller
export class ResizeObserverController extends BaseObserverController {
  private observer?: ResizeObserver;
  public width = 0;
  public height = 0;

  hostConnected(): void {
    this.observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      this.width = entry.contentRect.width;
      this.height = entry.contentRect.height;
      this.triggerUpdate(); // Inherited method
    });

    this.observer.observe(this.host);
  }

  hostDisconnected(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }
}
```

## Built-In Controllers

Lit provides several built-in controllers for common patterns. While not part of core Lit, these are available in the `@lit-labs/` namespace.

### Task Controller (@lit-labs/task)

Manages asynchronous tasks like data fetching, ensuring only the latest task result is used:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit-labs/task';

@customElement('hx-patient-details')
export class HelixPatientDetails extends LitElement {
  @property({ type: String })
  patientId = '';

  private patientTask = new Task(
    this,
    async ([patientId]) => {
      // Fetch patient data
      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) throw new Error('Failed to fetch patient');
      return response.json();
    },
    () => [this.patientId], // Task args (re-runs when patientId changes)
  );

  render() {
    return this.patientTask.render({
      pending: () => html`<hx-spinner></hx-spinner>`,
      complete: (patient) => html`
        <div class="patient">
          <h2>${patient.name}</h2>
          <p>MRN: ${patient.mrn}</p>
        </div>
      `,
      error: (error) => html`<hx-alert variant="error">${error.message}</hx-alert>`,
    });
  }
}
```

**Key features:**

- Automatic task cancellation when args change
- Loading, success, and error states
- Integrates with component lifecycle
- Prevents race conditions

### Context Controller (@lit/context)

Provides dependency injection via context:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide, consume } from '@lit/context';

// Define context
export const themeContext = createContext<string>('theme');

// Provider component
@customElement('hx-app')
export class HelixApp extends LitElement {
  @provide({ context: themeContext })
  @property({ type: String })
  theme = 'light';

  render() {
    return html`
      <hx-header></hx-header>
      <hx-content></hx-content>
    `;
  }
}

// Consumer component
@customElement('hx-header')
export class HelixHeader extends LitElement {
  @consume({ context: themeContext })
  @property({ type: String })
  theme = 'light';

  render() {
    return html`<header class="header header--${this.theme}">Header</header>`;
  }
}
```

## Creating Custom Controllers

### Example 1: Click Outside Controller

Detects clicks outside the host element, useful for closing dropdowns and modals.

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export class ClickOutsideController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private callback: () => void;

  private handleClick = (e: MouseEvent) => {
    const target = e.target as Node;
    // Check if click is outside host element
    if (!this.host.contains(target)) {
      this.callback();
    }
  };

  constructor(host: ReactiveControllerHost & HTMLElement, callback: () => void) {
    this.host = host;
    this.callback = callback;
    this.host.addController(this);
  }

  hostConnected(): void {
    // Use capture phase to detect clicks before they're handled
    document.addEventListener('click', this.handleClick, true);
  }

  hostDisconnected(): void {
    document.removeEventListener('click', this.handleClick, true);
  }
}
```

**Usage:**

```typescript
@customElement('hx-dropdown')
export class HelixDropdown extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  private clickOutside = new ClickOutsideController(this, () => {
    if (this.open) {
      this.open = false;
    }
  });

  render() {
    return html`
      <div class="dropdown ${this.open ? 'dropdown--open' : ''}">
        <slot></slot>
      </div>
    `;
  }
}
```

### Example 2: Focus Trap Controller

Traps keyboard focus within the host element, critical for modal dialogs and overlays.

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export class FocusTrapController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private active = false;

  private handleKeydown = (e: KeyboardEvent) => {
    if (!this.active || e.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      // Shift+Tab on first element: focus last
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      // Tab on last element: focus first
      e.preventDefault();
      firstElement.focus();
    }
  };

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected(): void {
    this.host.addEventListener('keydown', this.handleKeydown);
  }

  hostDisconnected(): void {
    this.host.removeEventListener('keydown', this.handleKeydown);
    this.deactivate();
  }

  activate(): void {
    this.active = true;
    // Focus first focusable element
    const firstElement = this.getFocusableElements()[0];
    firstElement?.focus();
  }

  deactivate(): void {
    this.active = false;
  }

  private getFocusableElements(): HTMLElement[] {
    const shadowRoot = (this.host as any).renderRoot as ShadowRoot;
    const selector =
      'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
    return Array.from(shadowRoot.querySelectorAll(selector)).filter(
      (el) => !el.hasAttribute('disabled'),
    ) as HTMLElement[];
  }
}
```

**Usage:**

```typescript
@customElement('hx-modal')
export class HelixModal extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  private focusTrap = new FocusTrapController(this);

  updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('open')) {
      if (this.open) {
        this.focusTrap.activate();
      } else {
        this.focusTrap.deactivate();
      }
    }
  }

  render() {
    return html`
      <dialog ?open=${this.open}>
        <slot></slot>
      </dialog>
    `;
  }
}
```

### Example 3: Media Query Controller

Reacts to media query changes and triggers host updates.

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export class MediaQueryController implements ReactiveController {
  private host: ReactiveControllerHost;
  private mediaQuery: MediaQueryList;
  public matches = false;

  private handleChange = (e: MediaQueryListEvent) => {
    this.matches = e.matches;
    this.host.requestUpdate();
  };

  constructor(host: ReactiveControllerHost, query: string) {
    this.host = host;
    this.mediaQuery = window.matchMedia(query);
    this.matches = this.mediaQuery.matches;
    this.host.addController(this);
  }

  hostConnected(): void {
    this.mediaQuery.addEventListener('change', this.handleChange);
  }

  hostDisconnected(): void {
    this.mediaQuery.removeEventListener('change', this.handleChange);
  }
}
```

**Usage:**

```typescript
@customElement('hx-responsive-nav')
export class HelixResponsiveNav extends LitElement {
  private mobileQuery = new MediaQueryController(this, '(max-width: 768px)');
  private darkModeQuery = new MediaQueryController(this, '(prefers-color-scheme: dark)');

  render() {
    const isMobile = this.mobileQuery.matches;
    const isDark = this.darkModeQuery.matches;

    return html`
      <nav class="nav ${isMobile ? 'nav--mobile' : 'nav--desktop'} ${isDark ? 'nav--dark' : ''}">
        <slot></slot>
      </nav>
    `;
  }
}
```

## Real-World Example: AdoptedStylesheetsController

The `hx-library` includes a production controller for managing adopted stylesheets across components. This is a real-world example from the codebase.

### Implementation

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Manages adopted stylesheets on a given root (document or ShadowRoot),
 * ensuring each unique stylesheet is created only once and cleaned up on
 * disconnect.
 */
export class AdoptedStylesheetsController implements ReactiveController {
  /** Global cache keyed by cssText to avoid creating duplicate CSSStyleSheet instances. */
  private static _cache = new Map<string, CSSStyleSheet>();

  private readonly _host: ReactiveControllerHost & HTMLElement;
  private readonly _cssText: string;
  private readonly _root: Document | ShadowRoot;
  private _sheet: CSSStyleSheet | undefined;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    cssText: string,
    root: Document | ShadowRoot = document,
  ) {
    this._host = host;
    this._cssText = cssText;
    this._root = root;
    this._host.addController(this);
  }

  hostConnected(): void {
    // Reuse or create the CSSStyleSheet for this cssText.
    let sheet = AdoptedStylesheetsController._cache.get(this._cssText);

    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(this._cssText);
      AdoptedStylesheetsController._cache.set(this._cssText, sheet);
    }

    this._sheet = sheet;

    // Only add if not already adopted on this root.
    if (!this._root.adoptedStyleSheets.includes(sheet)) {
      this._root.adoptedStyleSheets = [...this._root.adoptedStyleSheets, sheet];
    }
  }

  hostDisconnected(): void {
    if (this._sheet) {
      this._root.adoptedStyleSheets = this._root.adoptedStyleSheets.filter(
        (s) => s !== this._sheet,
      );
    }
  }
}
```

### Usage

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { AdoptedStylesheetsController } from '../controllers/adopted-stylesheets.js';

@customElement('hx-card')
export class HelixCard extends LitElement {
  // Inject global design tokens into document
  private globalStyles = new AdoptedStylesheetsController(
    this,
    `
      :root {
        --hx-color-primary: #2563EB;
        --hx-color-success: #10B981;
        --hx-color-error: #EF4444;
      }
    `,
    document,
  );

  render() {
    return html`
      <div class="card">
        <slot></slot>
      </div>
    `;
  }
}
```

**Key features:**

- **Global deduplication**: Identical stylesheets share a single `CSSStyleSheet` instance
- **Automatic cleanup**: Stylesheets removed when last component disconnects
- **Document or shadow root**: Can inject into global scope or component scope
- **Zero performance overhead**: Uses Constructable Stylesheets API (modern browsers)

## Testing Controllers

Controllers are independently testable, which is a major advantage over mixins or tightly coupled logic.

### Unit Testing a Controller

```typescript
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { ResizeController } from './resize-controller.js';

describe('ResizeController', () => {
  let host: any;
  let controller: ResizeController;

  beforeEach(() => {
    // Mock host
    host = {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
    };

    controller = new ResizeController(host);
  });

  afterEach(() => {
    controller.hostDisconnected?.();
  });

  it('registers with host', () => {
    expect(host.addController).toHaveBeenCalledWith(controller);
  });

  it('adds resize listener on connect', () => {
    const spy = vi.spyOn(window, 'addEventListener');
    controller.hostConnected?.();
    expect(spy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('removes resize listener on disconnect', () => {
    controller.hostConnected?.();
    const spy = vi.spyOn(window, 'removeEventListener');
    controller.hostDisconnected?.();
    expect(spy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('requests update on resize', () => {
    controller.hostConnected?.();

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it('returns viewport width', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    expect(controller.getViewportWidth()).toBe(1024);
  });
});
```

### Integration Testing with Component

```typescript
import { fixture, expect } from '@open-wc/testing';
import { html } from 'lit';
import './hx-responsive-card.js';
import type { HelixResponsiveCard } from './hx-responsive-card.js';

describe('hx-responsive-card', () => {
  it('changes layout on resize', async () => {
    const el = await fixture<HelixResponsiveCard>(html`<hx-responsive-card></hx-responsive-card>`);

    // Mock small viewport
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
    window.dispatchEvent(new Event('resize'));
    await el.updateComplete;

    const card = el.shadowRoot!.querySelector('.card');
    expect(card?.classList.contains('card--compact')).toBe(true);

    // Mock large viewport
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    window.dispatchEvent(new Event('resize'));
    await el.updateComplete;

    expect(card?.classList.contains('card--expanded')).toBe(true);
  });
});
```

## Best Practices

### 1. Always Register with Host

Call `host.addController(this)` in the constructor:

```typescript
constructor(host: ReactiveControllerHost) {
  this.host = host;
  this.host.addController(this); // Essential
}
```

### 2. Clean Up in hostDisconnected

Every resource created in `hostConnected()` must be cleaned up:

```typescript
hostConnected(): void {
  this.observer = new ResizeObserver(/* ... */);
  this.observer.observe(this.host);
}

hostDisconnected(): void {
  this.observer?.disconnect(); // Always clean up
  this.observer = undefined;
}
```

### 3. Use Bound Methods for Event Handlers

Bind event handlers in the constructor or use arrow functions to preserve `this` context:

```typescript
// Option 1: Arrow function
private handleResize = () => {
  this.host.requestUpdate();
};

// Option 2: Bind in constructor
constructor(host: ReactiveControllerHost) {
  this.host = host;
  this.handleResize = this.handleResize.bind(this);
  this.host.addController(this);
}

private handleResize() {
  this.host.requestUpdate();
}
```

### 4. Request Updates When Controller State Changes

If controller state is used in render, call `requestUpdate()`:

```typescript
export class TimerController implements ReactiveController {
  public seconds = 0; // Used in host's render()

  hostConnected(): void {
    this.intervalId = window.setInterval(() => {
      this.seconds++;
      this.host.requestUpdate(); // Trigger re-render
    }, 1000);
  }
}
```

### 5. Type Host Appropriately

Cast host to `LitElement & HTMLElement` for full access:

```typescript
constructor(host: ReactiveControllerHost & LitElement) {
  this.host = host;
  this.host.addController(this);
}
```

### 6. Make Controllers Reusable

Design controllers to work with any component, not just specific elements:

```typescript
// Good: Generic, reusable
export class KeyboardController implements ReactiveController {
  constructor(host: ReactiveControllerHost & HTMLElement, keyMap: KeyMap) {
    /* ... */
  }
}

// Bad: Tightly coupled to specific component
export class DialogKeyboardController implements ReactiveController {
  constructor(host: HelixDialog) {
    /* Only works with HelixDialog */
  }
}
```

### 7. Document Controller Public API

Controllers are APIs. Document constructor parameters, public methods, and public properties:

````typescript
/**
 * Manages keyboard navigation within a component.
 *
 * @example
 * ```typescript
 * private keyboard = new KeyboardController(this, {
 *   ArrowUp: () => this.previous(),
 *   ArrowDown: () => this.next(),
 * });
 * ```
 */
export class KeyboardController implements ReactiveController {
  /**
   * @param host - The host component
   * @param keyMap - Map of key names to handler functions
   */
  constructor(host: ReactiveControllerHost & HTMLElement, keyMap: KeyMap) {
    /* ... */
  }
}
````

## Common Pitfalls

### 1. Forgetting to Call addController

Controllers don't work unless registered:

```typescript
// WRONG
constructor(host: ReactiveControllerHost) {
  this.host = host;
  // Missing: this.host.addController(this);
}

// CORRECT
constructor(host: ReactiveControllerHost) {
  this.host = host;
  this.host.addController(this);
}
```

### 2. Memory Leaks from Uncleaned Resources

Forgetting cleanup causes memory leaks:

```typescript
// WRONG
hostConnected(): void {
  window.addEventListener('resize', this.handleResize);
  // No hostDisconnected cleanup
}

// CORRECT
hostConnected(): void {
  window.addEventListener('resize', this.handleResize);
}

hostDisconnected(): void {
  window.removeEventListener('resize', this.handleResize);
}
```

### 3. Not Preserving this Context

Event handlers lose `this` context if not bound:

```typescript
// WRONG
private handleClick() {
  this.host.requestUpdate(); // this is undefined
}

hostConnected(): void {
  document.addEventListener('click', this.handleClick);
}

// CORRECT
private handleClick = () => {
  this.host.requestUpdate(); // this preserved
};

hostConnected(): void {
  document.addEventListener('click', this.handleClick);
}
```

### 4. Mutating State Without requestUpdate

Controller state changes don't automatically trigger updates:

```typescript
// WRONG
export class CounterController implements ReactiveController {
  public count = 0;

  increment() {
    this.count++; // No re-render triggered
  }
}

// CORRECT
export class CounterController implements ReactiveController {
  public count = 0;

  increment() {
    this.count++;
    this.host.requestUpdate(); // Trigger re-render
  }
}
```

## Summary

Reactive Controllers are Lit's solution for reusable, lifecycle-aware logic. They provide:

1. **Composition over inheritance**: Mix multiple controllers without class hierarchies
2. **Lifecycle hooks**: `hostConnected`, `hostDisconnected`, `hostUpdate`, `hostUpdated`
3. **Host access**: Full access to component properties, methods, and shadow root
4. **Testability**: Controllers are independently testable units
5. **Portability**: Same controller works across multiple components

**When to use controllers:**

- Cross-cutting concerns (analytics, logging, feature flags)
- Reusable behaviors (keyboard nav, focus management, observers)
- State management (stores, context, external data)
- DOM API integration (global listeners, observers, third-party libraries)

**When NOT to use controllers:**

- Pure computation (use utility functions)
- Component-specific logic (keep in component class)
- One-off behaviors (inline in lifecycle methods)

With Reactive Controllers, you can build a library of reusable behaviors that compose cleanly across your component ecosystem, reducing duplication and improving maintainability.

## References

- [Reactive Controllers – Lit](https://lit.dev/docs/composition/controllers/)
- [Controllers API – Lit](https://lit.dev/docs/api/controllers/)
- [@lit-labs/task](https://www.npmjs.com/package/@lit-labs/task)
- [@lit/context](https://www.npmjs.com/package/@lit/context)
- [Reusable Accessibility with Web Components and Lit Controllers](https://coryrylan.com/blog/reusable-accessibility-with-web-components-and-lit-controllers)
- [Managing Multiple Contexts in Lit Using Reactive Controllers](https://elfsternberg.com/blog/managing-multiple-lit-contexts/)

---

**Next Steps:**

- Explore [Component Lifecycle](/components/fundamentals/lifecycle) for detailed lifecycle documentation
- Learn about [Reactive Properties](/components/fundamentals/reactive-properties) for property system internals
- Study the [AdoptedStylesheetsController source](https://github.com/bookedsolidtech/helix/blob/main/packages/hx-library/src/controllers/adopted-stylesheets.ts) for a production example
