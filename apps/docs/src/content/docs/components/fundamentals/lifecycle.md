---
title: Component Lifecycle In-Depth
description: Master the Lit component lifecycle—from construction through updates to disconnection—with detailed examples, flow diagrams, best practices, and common pitfalls to avoid when building enterprise healthcare components.
sidebar:
  order: 3
---

# Component Lifecycle In-Depth

Understanding the component lifecycle is essential for building robust, performant web components. The lifecycle consists of two distinct phases: the **standard custom element lifecycle** defined by Web Component specifications, and the **reactive update cycle** implemented by Lit. This guide provides an in-depth exploration of both phases, with practical examples and patterns for building enterprise-grade healthcare components.

## Lifecycle Flow Overview

The component lifecycle follows a predictable sequence from creation through updates to removal. Here's the complete flow:

```
┌─────────────────────────────────────────────────────────────┐
│                     CONSTRUCTION PHASE                      │
├─────────────────────────────────────────────────────────────┤
│  constructor()                                              │
│    └─> Initialize properties, set defaults                 │
│                                                             │
│  connectedCallback()                                        │
│    └─> Element inserted into DOM                           │
│    └─> Create renderRoot (shadowRoot)                      │
│    └─> Trigger first update cycle                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACTIVE UPDATE CYCLE                    │
├─────────────────────────────────────────────────────────────┤
│  Property change or requestUpdate()                         │
│    └─> Schedule update (microtask timing)                  │
│                                                             │
│  shouldUpdate(changedProperties)                            │
│    └─> Return true to proceed, false to cancel             │
│                                                             │
│  willUpdate(changedProperties)                              │
│    └─> Compute derived values                              │
│                                                             │
│  update(changedProperties)                                  │
│    └─> Reflect properties to attributes                    │
│    └─> Call render()                                        │
│                                                             │
│  render()                                                   │
│    └─> Return TemplateResult                               │
│                                                             │
│  firstUpdated(changedProperties) [first render only]        │
│    └─> One-time DOM operations                             │
│                                                             │
│  updated(changedProperties)                                 │
│    └─> Post-render DOM operations                          │
│                                                             │
│  updateComplete Promise resolves                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    DISCONNECTION PHASE                      │
├─────────────────────────────────────────────────────────────┤
│  disconnectedCallback()                                     │
│    └─> Element removed from DOM                            │
│    └─> Pause update cycle                                  │
│    └─> Clean up external listeners                         │
└─────────────────────────────────────────────────────────────┘
```

### Timing Guarantees

Understanding when callbacks fire is critical for correct implementation:

1. **Synchronous**: `constructor()`, `attributeChangedCallback()`
2. **Microtask timing**: Reactive update cycle (before next frame paint)
3. **DOM-dependent**: `firstUpdated()`, `updated()` (only run in browser)
4. **Server-compatible**: `constructor()`, `willUpdate()`, `render()`

## Standard Custom Element Lifecycle

These lifecycle methods are defined by the Web Components specification and are common to all custom elements, regardless of framework.

### constructor()

**When it fires**: Called when an element is created or upgraded.

**What Lit does**:

- Requests an asynchronous update
- Saves pre-existing properties (values set before element definition loads)
- Initializes reactive controllers

**Best practices**:

- Perform one-time initialization before the first render
- Set default property values (when not using decorators)
- Initialize private fields
- **Never** manipulate DOM or attributes here
- **Always** call `super()` first

**Example**:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-counter')
export class HxCounter extends LitElement {
  @property({ type: Number }) count = 0;

  // Private fields for internal state
  private _clickCount = 0;
  private _startTime: number;

  constructor() {
    super(); // MUST be first

    // One-time initialization
    this._startTime = Date.now();

    // Set defaults that can't be expressed in property decorators
    this.count = Math.floor(Math.random() * 10);

    console.log('HxCounter constructed');
  }

  render() {
    return html`
      <div>
        <p>Count: ${this.count}</p>
        <p>Clicks: ${this._clickCount}</p>
        <button @click=${this._increment}>Increment</button>
      </div>
    `;
  }

  private _increment() {
    this.count++;
    this._clickCount++;
  }
}
```

**Common pitfalls**:

- Forgetting to call `super()` first
- Attempting to access DOM (doesn't exist yet)
- Reading attributes (use `connectedCallback()` instead)
- Adding event listeners (use `connectedCallback()` instead)

### connectedCallback()

**When it fires**: Invoked when the component is inserted into the document's DOM.

**What Lit does**:

- Creates the `renderRoot` (typically `shadowRoot`)
- Initiates the first update cycle
- Resumes update cycle if previously disconnected

**Best practices**:

- Set up tasks requiring document connection
- Add event listeners to external nodes (`window`, `document`, parent elements)
- Start timers, intervals, or animations
- **Always** call `super.connectedCallback()` first
- **Always** pair with cleanup in `disconnectedCallback()`

**Example**:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-window-size')
export class HxWindowSize extends LitElement {
  @state() private _width = 0;
  @state() private _height = 0;

  private _resizeHandler = () => {
    this._width = window.innerWidth;
    this._height = window.innerHeight;
  };

  connectedCallback() {
    super.connectedCallback(); // MUST call super first

    // Set initial values
    this._width = window.innerWidth;
    this._height = window.innerHeight;

    // Add external event listener
    window.addEventListener('resize', this._resizeHandler);

    console.log('HxWindowSize connected to DOM');
  }

  disconnectedCallback() {
    super.disconnectedCallback(); // MUST call super

    // Clean up external listener
    window.removeEventListener('resize', this._resizeHandler);

    console.log('HxWindowSize disconnected from DOM');
  }

  render() {
    return html` <div>Window size: ${this._width} × ${this._height}</div> `;
  }
}
```

**Common use cases**:

- Adding `window` or `document` event listeners
- Observing parent element properties
- Fetching initial data from APIs
- Starting animations or timers
- Integrating with third-party libraries requiring DOM

**Important notes**:

- Internal listeners on your own DOM don't need cleanup (Shadow DOM handles this)
- External listeners **must** be removed in `disconnectedCallback()`
- Element may connect/disconnect multiple times (e.g., moved in DOM)

### disconnectedCallback()

**When it fires**: Called when the component is removed from the document's DOM.

**What Lit does**:

- Pauses the reactive update cycle
- Resumes cycle if element reconnects

**Best practices**:

- Remove external event listeners
- Clear timers and intervals
- Cancel pending network requests
- Clean up third-party library instances
- **Always** call `super.disconnectedCallback()`

**Example**:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-live-clock')
export class HxLiveClock extends LitElement {
  @state() private _time = new Date();

  private _intervalId?: number;

  connectedCallback() {
    super.connectedCallback();

    // Start interval
    this._intervalId = window.setInterval(() => {
      this._time = new Date();
    }, 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up interval
    if (this._intervalId !== undefined) {
      window.clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
  }

  render() {
    return html`
      <time datetime=${this._time.toISOString()}> ${this._time.toLocaleTimeString()} </time>
    `;
  }
}
```

**Memory leak prevention**:

```typescript
@customElement('hx-data-fetcher')
export class HxDataFetcher extends LitElement {
  @state() private _data: any = null;

  private _abortController?: AbortController;

  async connectedCallback() {
    super.connectedCallback();

    // Create abort controller
    this._abortController = new AbortController();

    // Fetch with abort signal
    try {
      const response = await fetch('/api/data', {
        signal: this._abortController.signal,
      });
      this._data = await response.json();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch failed:', err);
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Cancel pending fetch
    this._abortController?.abort();
    this._abortController = undefined;
  }

  render() {
    return html`<pre>${JSON.stringify(this._data, null, 2)}</pre>`;
  }
}
```

### attributeChangedCallback()

**When it fires**: Fires when an observed attribute changes.

**What Lit does**:

- Automatically manages the `observedAttributes` array
- Syncs attribute changes to corresponding reactive properties
- Handles type conversion (string to Boolean, Number, etc.)

**Best practices**:

- **Rarely override this** — Lit handles it automatically
- Use `@property()` decorator to define reactive properties instead
- Only override for advanced cases requiring custom attribute handling

**Example (automatic handling)**:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-badge')
export class HxBadge extends LitElement {
  // Lit automatically observes 'variant' attribute
  // and syncs changes to this property
  @property({ type: String, reflect: true })
  variant: 'info' | 'success' | 'warning' | 'error' = 'info';

  @property({ type: Number, reflect: true })
  count = 0;

  render() {
    return html` <span class="badge badge--${this.variant}"> ${this.count} </span> `;
  }
}
```

```html
<!-- Attribute changes automatically sync to properties -->
<hx-badge variant="success" count="5"></hx-badge>

<script>
  const badge = document.querySelector('hx-badge');
  badge.setAttribute('count', '10'); // Triggers update
  // badge.count === 10 (automatically converted to Number)
</script>
```

**Manual override (advanced)**:

```typescript
@customElement('hx-custom-sync')
export class HxCustomSync extends LitElement {
  @property({ type: String })
  value = '';

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    // Call super to maintain Lit's automatic behavior
    super.attributeChangedCallback(name, oldValue, newValue);

    // Custom logic after Lit's handling
    if (name === 'value' && newValue !== oldValue) {
      console.log(`Value changed: ${oldValue} → ${newValue}`);
    }
  }

  render() {
    return html`<div>${this.value}</div>`;
  }
}
```

### adoptedCallback()

**When it fires**: Triggered when the component moves to a new `document` (rare).

**What Lit does**: Nothing special — passes through to your implementation.

**Best practices**:

- Use only for advanced scenarios
- Most components don't need this
- Not polyfilled in older browsers

**Example**:

```typescript
@customElement('hx-portable')
export class HxPortable extends LitElement {
  adoptedCallback() {
    console.log('Element moved to new document');

    // Example: Update references to new document
    // (Most components don't need this)
  }

  render() {
    return html`<div>Portable component</div>`;
  }
}
```

## Reactive Update Cycle

The reactive update cycle is Lit's mechanism for efficiently reflecting property changes to the DOM. Updates are **asynchronous** and **batched** — multiple property changes within the same event loop trigger only one render.

### Update Triggers

An update cycle begins when:

1. **A reactive property changes** (decorated with `@property()` or `@state()`)
2. **`requestUpdate()` is explicitly called**

```typescript
@customElement('hx-demo')
export class HxDemo extends LitElement {
  @property({ type: Number }) count = 0;
  @state() private _internal = 0;

  increment() {
    // Triggers update (reactive property changed)
    this.count++;
  }

  manualUpdate() {
    // Explicitly request update
    this.requestUpdate();
  }

  notReactive() {
    // Does NOT trigger update (not a reactive property)
    this.dataset.foo = 'bar';
  }
}
```

### shouldUpdate()

**When it fires**: Before `update()` executes; determines if the cycle continues.

**Arguments**: `changedProperties` — Map with previous values for changed properties.

**Default behavior**: Returns `true` (always update).

**Best practices**:

- Override to optimize performance
- Return `false` to cancel update when changes don't affect rendering
- Compare current and previous values from `changedProperties` Map

**Example (performance optimization)**:

```typescript
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-expensive-chart')
export class HxExpensiveChart extends LitElement {
  @property({ type: Array }) data: number[] = [];
  @property({ type: String }) title = '';
  @property({ type: Number }) updateCounter = 0; // Non-visual property

  shouldUpdate(changedProperties: PropertyValues) {
    // Only update if data or title changed
    // Ignore updateCounter changes
    return changedProperties.has('data') || changedProperties.has('title');
  }

  render() {
    return html`
      <div class="chart">
        <h3>${this.title}</h3>
        <div class="chart-data">
          ${this.data.map((value) => html` <div style="height: ${value}px"></div> `)}
        </div>
      </div>
    `;
  }
}
```

**Conditional update based on value change**:

```typescript
@customElement('hx-smart-update')
export class HxSmartUpdate extends LitElement {
  @property({ type: String }) status = '';

  shouldUpdate(changedProperties: PropertyValues) {
    // Only update if status actually changed value
    if (changedProperties.has('status')) {
      const oldValue = changedProperties.get('status');
      return oldValue !== this.status;
    }
    return true;
  }

  render() {
    return html`<div>Status: ${this.status}</div>`;
  }
}
```

### willUpdate()

**When it fires**: After `shouldUpdate()` returns `true`, before `update()`.

**Arguments**: `changedProperties` — Map with previous values.

**Called on server**: Yes (SSR-compatible).

**Best practices**:

- Compute derived values that depend on multiple properties
- Avoid expensive recalculations in `render()`
- Process only changed properties when possible
- **Do not** trigger new property changes here

**Example (derived state)**:

```typescript
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-patient-risk')
export class HxPatientRisk extends LitElement {
  @property({ type: Number }) age = 0;
  @property({ type: Number }) bloodPressure = 120;
  @property({ type: Number }) cholesterol = 200;
  @property({ type: Boolean }) smoker = false;

  // Derived state (expensive to compute)
  @state() private _riskScore = 0;
  @state() private _riskLevel: 'low' | 'medium' | 'high' = 'low';

  willUpdate(changedProperties: PropertyValues) {
    // Only recalculate if relevant properties changed
    if (
      changedProperties.has('age') ||
      changedProperties.has('bloodPressure') ||
      changedProperties.has('cholesterol') ||
      changedProperties.has('smoker')
    ) {
      this._computeRiskScore();
    }
  }

  private _computeRiskScore() {
    // Expensive calculation performed once per update
    let score = 0;

    if (this.age > 65) score += 30;
    else if (this.age > 50) score += 20;

    if (this.bloodPressure > 140) score += 25;
    else if (this.bloodPressure > 130) score += 15;

    if (this.cholesterol > 240) score += 25;
    else if (this.cholesterol > 200) score += 15;

    if (this.smoker) score += 30;

    this._riskScore = score;
    this._riskLevel = score > 70 ? 'high' : score > 40 ? 'medium' : 'low';
  }

  render() {
    return html`
      <div class="risk-assessment risk--${this._riskLevel}">
        <h3>Cardiovascular Risk Assessment</h3>
        <p>Risk Score: ${this._riskScore}</p>
        <p>Risk Level: ${this._riskLevel.toUpperCase()}</p>
      </div>
    `;
  }
}
```

**Computing dependent values**:

```typescript
@customElement('hx-price-calculator')
export class HxPriceCalculator extends LitElement {
  @property({ type: Number }) quantity = 1;
  @property({ type: Number }) unitPrice = 10;
  @property({ type: Number }) taxRate = 0.08;

  @state() private _subtotal = 0;
  @state() private _tax = 0;
  @state() private _total = 0;

  willUpdate(changedProperties: PropertyValues) {
    // Compute all derived values in one place
    if (
      changedProperties.has('quantity') ||
      changedProperties.has('unitPrice') ||
      changedProperties.has('taxRate')
    ) {
      this._subtotal = this.quantity * this.unitPrice;
      this._tax = this._subtotal * this.taxRate;
      this._total = this._subtotal + this._tax;
    }
  }

  render() {
    return html`
      <dl>
        <dt>Subtotal:</dt>
        <dd>$${this._subtotal.toFixed(2)}</dd>

        <dt>Tax:</dt>
        <dd>$${this._tax.toFixed(2)}</dd>

        <dt>Total:</dt>
        <dd>$${this._total.toFixed(2)}</dd>
      </dl>
    `;
  }
}
```

### update()

**When it fires**: After `willUpdate()`, performs the actual update.

**What it does**:

- Reflects properties to attributes (when `reflect: true`)
- Calls `render()` to generate template
- Updates the DOM

**Best practices**:

- **Rarely override this** — Lit handles it
- If you override, **always** call `super.update(changedProperties)`

**Example (advanced override)**:

```typescript
@customElement('hx-custom-update')
export class HxCustomUpdate extends LitElement {
  @property({ type: String }) value = '';

  update(changedProperties: PropertyValues) {
    // Custom logic before render
    console.log('About to render with:', changedProperties);

    // MUST call super to perform actual update
    super.update(changedProperties);

    // Custom logic after render (before updated() fires)
    console.log('Render complete');
  }

  render() {
    return html`<div>${this.value}</div>`;
  }
}
```

### render()

**When it fires**: Called by `update()` to generate the component's DOM.

**Returns**: `TemplateResult` or other renderable type.

**Called on server**: Yes (SSR-compatible).

**Best practices**:

- Keep logic minimal — delegate complex operations to `willUpdate()`
- Reference component properties directly
- Return `nothing` or empty template for conditional rendering
- Pure function — same properties should always produce same output

**Example (basic render)**:

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-notification')
export class HxNotification extends LitElement {
  @property({ type: String }) message = '';
  @property({ type: String }) variant: 'info' | 'success' | 'warning' | 'error' = 'info';
  @property({ type: Boolean }) dismissible = false;

  render() {
    // Don't render if no message
    if (!this.message) {
      return nothing;
    }

    return html`
      <div class="notification notification--${this.variant}" role="alert">
        <span class="notification__message">${this.message}</span>
        ${this.dismissible
          ? html`
              <button
                @click=${this._handleDismiss}
                class="notification__dismiss"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            `
          : nothing}
      </div>
    `;
  }

  private _handleDismiss() {
    this.dispatchEvent(new CustomEvent('hx-dismiss'));
  }
}
```

**Conditional rendering patterns**:

```typescript
@customElement('hx-data-view')
export class HxDataView extends LitElement {
  @property({ type: Object }) data: any = null;
  @property({ type: Boolean }) loading = false;
  @property({ type: Object }) error: Error | null = null;

  render() {
    // Loading state
    if (this.loading) {
      return html`<div class="spinner" role="status">Loading...</div>`;
    }

    // Error state
    if (this.error) {
      return html`
        <div class="error" role="alert"><strong>Error:</strong> ${this.error.message}</div>
      `;
    }

    // Empty state
    if (!this.data) {
      return html`<div class="empty">No data available</div>`;
    }

    // Success state
    return html`
      <div class="data">
        <pre>${JSON.stringify(this.data, null, 2)}</pre>
      </div>
    `;
  }
}
```

### firstUpdated()

**When it fires**: After the component's **first** DOM update, before `updated()`.

**Arguments**: `changedProperties` — Map with previous values.

**Runs only once**: Yes (per connection lifetime).

**Best practices**:

- Focus elements
- Attach observers (`ResizeObserver`, `IntersectionObserver`, `MutationObserver`)
- Query and cache DOM references
- Perform one-time DOM measurements
- Initialize third-party libraries requiring rendered DOM

**Example (focus management)**:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('hx-dialog')
export class HxDialog extends LitElement {
  @property({ type: Boolean }) open = false;

  @query('button.dialog__close')
  private _closeButton!: HTMLButtonElement;

  firstUpdated() {
    // Focus close button when dialog first renders
    if (this.open) {
      this._closeButton.focus();
    }
  }

  render() {
    return html`
      <dialog ?open=${this.open}>
        <h2>Dialog Title</h2>
        <p>Dialog content goes here.</p>
        <button class="dialog__close" @click=${this._handleClose}>Close</button>
      </dialog>
    `;
  }

  private _handleClose() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('hx-close'));
  }
}
```

**Example (intersection observer)**:

```typescript
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-lazy-load')
export class HxLazyLoad extends LitElement {
  @property({ type: String }) src = '';

  @state() private _visible = false;
  @state() private _loaded = false;

  private _observer?: IntersectionObserver;

  firstUpdated() {
    // Set up intersection observer
    this._observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this._visible = true;
          this._observer?.disconnect();
        }
      },
      { rootMargin: '50px' },
    );

    this._observer.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  render() {
    return html`
      <div class="lazy-load">
        ${this._visible
          ? html`
              <img src=${this.src} @load=${() => (this._loaded = true)} alt="Lazy loaded image" />
            `
          : html` <div class="placeholder">Loading...</div> `}
      </div>
    `;
  }
}
```

**Example (ResizeObserver)**:

```typescript
@customElement('hx-responsive-container')
export class HxResponsiveContainer extends LitElement {
  @state() private _width = 0;
  @state() private _size: 'small' | 'medium' | 'large' = 'medium';

  private _resizeObserver?: ResizeObserver;

  firstUpdated() {
    this._resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      this._width = width;
      this._size = width < 400 ? 'small' : width < 800 ? 'medium' : 'large';
    });

    this._resizeObserver.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
  }

  render() {
    return html`
      <div class="container container--${this._size}">
        <p>Width: ${this._width}px</p>
        <p>Size: ${this._size}</p>
        <slot></slot>
      </div>
    `;
  }
}
```

### updated()

**When it fires**: After **every** DOM update completes (including first update).

**Arguments**: `changedProperties` — Map with previous values.

**Best practices**:

- Measure DOM for animations or layout calculations
- Dispatch events reflecting rendered state
- Integrate with imperative APIs requiring rendered DOM
- **Warning**: Property changes here trigger new update cycles

**Example (measuring DOM)**:

```typescript
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

@customElement('hx-auto-height')
export class HxAutoHeight extends LitElement {
  @property({ type: String }) content = '';

  @query('.content')
  private _contentEl!: HTMLDivElement;

  @state() private _height = 0;

  updated(changedProperties: PropertyValues) {
    // Measure content height after render
    if (changedProperties.has('content')) {
      this._height = this._contentEl.offsetHeight;
    }
  }

  render() {
    return html`
      <div class="wrapper">
        <div class="content">${this.content}</div>
        <p>Content height: ${this._height}px</p>
      </div>
    `;
  }
}
```

**Example (dispatching state events)**:

```typescript
@customElement('hx-stepper')
export class HxStepper extends LitElement {
  @property({ type: Number }) step = 1;
  @property({ type: Number }) totalSteps = 5;

  updated(changedProperties: PropertyValues) {
    // Dispatch event when step changes
    if (changedProperties.has('step')) {
      this.dispatchEvent(
        new CustomEvent('hx-step-change', {
          detail: {
            step: this.step,
            total: this.totalSteps,
            isFirst: this.step === 1,
            isLast: this.step === this.totalSteps,
          },
        }),
      );
    }
  }

  render() {
    return html`
      <div class="stepper">
        <button @click=${this._previous} ?disabled=${this.step === 1}>Previous</button>
        <span>Step ${this.step} of ${this.totalSteps}</span>
        <button @click=${this._next} ?disabled=${this.step === this.totalSteps}>Next</button>
      </div>
    `;
  }

  private _previous() {
    if (this.step > 1) this.step--;
  }

  private _next() {
    if (this.step < this.totalSteps) this.step++;
  }
}
```

**Avoiding infinite loops**:

```typescript
@customElement('hx-safe-update')
export class HxSafeUpdate extends LitElement {
  @property({ type: Number }) input = 0;
  @state() private _output = 0;

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('input')) {
      // Safe: Only updates internal state once per input change
      this._output = this.input * 2;
    }
  }

  // DANGEROUS - DO NOT DO THIS:
  // updated() {
  //   this.input++; // Infinite loop!
  // }

  render() {
    return html` <div>Input: ${this.input}, Output: ${this._output}</div> `;
  }
}
```

### updateComplete

**Type**: Promise that resolves when update cycle finishes.

**Resolves**: After `updated()` completes.

**Rejects**: If uncaught errors occur during update.

**Best practices**:

- Await before DOM assertions in tests
- Use when coordinating multiple components
- Required for measuring critical DOM dimensions
- Chain updates when later components depend on earlier renders

**Example (testing)**:

```typescript
import { fixture, expect } from '@open-wc/testing';
import { html } from 'lit';
import './hx-button';

describe('hx-button', () => {
  it('updates text content', async () => {
    const el = await fixture(html`<hx-button>Click me</hx-button>`);

    // Change property
    el.disabled = true;

    // Wait for update to complete
    await el.updateComplete;

    // Now safe to assert DOM state
    const button = el.shadowRoot!.querySelector('button');
    expect(button?.disabled).to.be.true;
  });
});
```

**Example (component coordination)**:

```typescript
@customElement('hx-master')
export class HxMaster extends LitElement {
  @query('hx-detail')
  private _detail!: HxDetail;

  async connectedCallback() {
    super.connectedCallback();

    // Wait for this component's first render
    await this.updateComplete;

    // Now safe to interact with child components
    await this._detail.updateComplete;

    // Both components are fully rendered
    this._initializeDetail();
  }

  private _initializeDetail() {
    // Safe to call methods on child component
    this._detail.loadData();
  }

  render() {
    return html`<hx-detail></hx-detail>`;
  }
}
```

**Example (measuring DOM)**:

```typescript
@customElement('hx-tooltip')
export class HxTooltip extends LitElement {
  @property({ type: Boolean }) open = false;
  @state() private _position = { x: 0, y: 0 };

  async updated(changedProperties: PropertyValues) {
    if (changedProperties.has('open') && this.open) {
      // Wait for render to complete
      await this.updateComplete;

      // Now safe to measure and position
      this._calculatePosition();
    }
  }

  private _calculatePosition() {
    const tooltip = this.shadowRoot!.querySelector('.tooltip') as HTMLElement;
    const rect = tooltip.getBoundingClientRect();

    // Calculate position based on actual rendered size
    this._position = {
      x: window.innerWidth - rect.width - 10,
      y: window.innerHeight - rect.height - 10,
    };
  }

  render() {
    return html`
      <div
        class="tooltip"
        ?hidden=${!this.open}
        style="left: ${this._position.x}px; top: ${this._position.y}px"
      >
        <slot></slot>
      </div>
    `;
  }
}
```

## Lifecycle Order and Timing

Understanding the precise order and timing of lifecycle callbacks is essential for correct implementation.

### Initial Render Sequence

When a component is first connected to the DOM:

```
1. constructor()                    [synchronous]
2. connectedCallback()              [synchronous]
3. --- requestUpdate() scheduled --- [microtask]
4. shouldUpdate()                   [before next frame]
5. willUpdate()                     [before next frame]
6. update()                         [before next frame]
7. render()                         [before next frame]
8. firstUpdated()                   [before next frame]
9. updated()                        [before next frame]
10. updateComplete resolves         [before next frame]
```

### Subsequent Update Sequence

When a reactive property changes:

```
1. Property setter called           [synchronous]
2. --- requestUpdate() scheduled --- [microtask]
3. shouldUpdate()                   [before next frame]
4. willUpdate()                     [before next frame]
5. update()                         [before next frame]
6. render()                         [before next frame]
7. updated()                        [before next frame]
8. updateComplete resolves          [before next frame]
```

### Timing Example

```typescript
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-lifecycle-demo')
export class HxLifecycleDemo extends LitElement {
  @property({ type: Number }) count = 0;

  constructor() {
    super();
    console.log('1. constructor');
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('2. connectedCallback');
  }

  shouldUpdate(changedProperties: PropertyValues) {
    console.log('3. shouldUpdate', changedProperties);
    return true;
  }

  willUpdate(changedProperties: PropertyValues) {
    console.log('4. willUpdate', changedProperties);
  }

  update(changedProperties: PropertyValues) {
    console.log('5. update (before super)');
    super.update(changedProperties);
    console.log('6. update (after super / after render)');
  }

  render() {
    console.log('  5.5 render');
    return html`
      <div>
        <p>Count: ${this.count}</p>
        <button @click=${this._increment}>Increment</button>
      </div>
    `;
  }

  firstUpdated(changedProperties: PropertyValues) {
    console.log('7. firstUpdated', changedProperties);
  }

  updated(changedProperties: PropertyValues) {
    console.log('8. updated', changedProperties);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    console.log('9. disconnectedCallback');
  }

  private _increment() {
    this.count++;
  }
}
```

**Console output on first render**:

```
1. constructor
2. connectedCallback
3. shouldUpdate Map(0) {}
4. willUpdate Map(0) {}
5. update (before super)
  5.5 render
6. update (after super / after render)
7. firstUpdated Map(0) {}
8. updated Map(0) {}
```

**Console output after clicking button**:

```
3. shouldUpdate Map(1) { 'count' => 0 }
4. willUpdate Map(1) { 'count' => 0 }
5. update (before super)
  5.5 render
6. update (after super / after render)
8. updated Map(1) { 'count' => 0 }
```

## Best Practices

### Property Changes and Update Batching

Multiple synchronous property changes trigger only **one** render:

```typescript
@customElement('hx-batch-demo')
export class HxBatchDemo extends LitElement {
  @property({ type: String }) firstName = '';
  @property({ type: String }) lastName = '';
  @property({ type: Number }) age = 0;

  updatePerson(first: string, last: string, age: number) {
    // All three changes batch into one update
    this.firstName = first;
    this.lastName = last;
    this.age = age;

    // Only ONE render will occur (not three)
  }

  render() {
    console.log('render called');
    return html`
      <div>
        <p>Name: ${this.firstName} ${this.lastName}</p>
        <p>Age: ${this.age}</p>
      </div>
    `;
  }
}
```

### External Listener Cleanup Pattern

Always pair `connectedCallback()` with `disconnectedCallback()`:

```typescript
@customElement('hx-keyboard-handler')
export class HxKeyboardHandler extends LitElement {
  @state() private _lastKey = '';

  private _keyHandler = (e: KeyboardEvent) => {
    this._lastKey = e.key;
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._keyHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._keyHandler);
  }

  render() {
    return html`<div>Last key: ${this._lastKey}</div>`;
  }
}
```

### Expensive Computation Optimization

Move expensive calculations to `willUpdate()`:

```typescript
@customElement('hx-data-grid')
export class HxDataGrid extends LitElement {
  @property({ type: Array }) items: any[] = [];
  @property({ type: String }) sortBy = 'name';
  @property({ type: String }) filterBy = '';

  @state() private _processedItems: any[] = [];

  willUpdate(changedProperties: PropertyValues) {
    // Only reprocess when relevant properties change
    if (
      changedProperties.has('items') ||
      changedProperties.has('sortBy') ||
      changedProperties.has('filterBy')
    ) {
      // Expensive operation happens once per update
      this._processedItems = this.items
        .filter((item) => !this.filterBy || item.name.includes(this.filterBy))
        .sort((a, b) => (a[this.sortBy] > b[this.sortBy] ? 1 : -1));
    }
  }

  render() {
    // Render is fast — just template generation
    return html`
      <table>
        ${this._processedItems.map(
          (item) => html`
            <tr>
              <td>${item.name}</td>
            </tr>
          `,
        )}
      </table>
    `;
  }
}
```

### DOM Measurement After Render

Always measure DOM in `firstUpdated()` or `updated()`:

```typescript
@customElement('hx-auto-scroll')
export class HxAutoScroll extends LitElement {
  @property({ type: Array }) messages: string[] = [];

  @query('.messages')
  private _container!: HTMLDivElement;

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('messages')) {
      // Scroll to bottom after new messages render
      this._container.scrollTop = this._container.scrollHeight;
    }
  }

  render() {
    return html` <div class="messages">${this.messages.map((msg) => html`<p>${msg}</p>`)}</div> `;
  }
}
```

## Common Pitfalls

### Pitfall 1: DOM Operations in constructor()

**Wrong**:

```typescript
constructor() {
  super();
  // ERROR: No DOM exists yet!
  this.shadowRoot.querySelector('button'); // null
  this.setAttribute('foo', 'bar'); // Don't manipulate attributes here
}
```

**Right**:

```typescript
connectedCallback() {
  super.connectedCallback();
  // Safe: Element is in DOM
  this.setAttribute('foo', 'bar');
}

firstUpdated() {
  // Safe: Shadow DOM is rendered
  const button = this.shadowRoot.querySelector('button');
}
```

### Pitfall 2: Forgetting super() Calls

**Wrong**:

```typescript
connectedCallback() {
  // ERROR: Forgot super.connectedCallback()
  window.addEventListener('resize', this._handler);
}
```

**Right**:

```typescript
connectedCallback() {
  super.connectedCallback(); // MUST call super first
  window.addEventListener('resize', this._handler);
}
```

### Pitfall 3: Property Changes in updated()

**Wrong**:

```typescript
updated() {
  // ERROR: Infinite loop!
  this.count++; // Triggers new update → updated() → count++ → ...
}
```

**Right**:

```typescript
updated(changedProperties: PropertyValues) {
  if (changedProperties.has('count')) {
    // Safe: Only runs once per count change
    console.log('Count changed to:', this.count);
  }
}
```

### Pitfall 4: Missing Cleanup in disconnectedCallback()

**Wrong**:

```typescript
connectedCallback() {
  super.connectedCallback();
  this._interval = setInterval(() => this.tick++, 1000);
  // ERROR: Interval never cleared → memory leak!
}
```

**Right**:

```typescript
connectedCallback() {
  super.connectedCallback();
  this._interval = setInterval(() => this.tick++, 1000);
}

disconnectedCallback() {
  super.disconnectedCallback();
  clearInterval(this._interval); // Clean up!
}
```

### Pitfall 5: Measuring DOM Before Render

**Wrong**:

```typescript
willUpdate() {
  // ERROR: DOM not updated yet!
  const height = this._element.offsetHeight; // Stale value
}
```

**Right**:

```typescript
updated() {
  // Safe: DOM is updated
  const height = this._element.offsetHeight; // Current value
}
```

### Pitfall 6: Not Awaiting updateComplete

**Wrong**:

```typescript
async test() {
  element.count = 5;
  // ERROR: Update hasn't completed yet!
  expect(element.textContent).to.include('5'); // Fails
}
```

**Right**:

```typescript
async test() {
  element.count = 5;
  await element.updateComplete; // Wait for render
  expect(element.textContent).to.include('5'); // Passes
}
```

## Summary

The Lit component lifecycle provides precise control over every phase of a component's existence:

- **Construction**: `constructor()` for one-time initialization
- **Connection**: `connectedCallback()` for DOM-dependent setup
- **Updates**: `shouldUpdate()`, `willUpdate()`, `render()`, `updated()` for reactive changes
- **First Render**: `firstUpdated()` for one-time DOM operations
- **Disconnection**: `disconnectedCallback()` for cleanup

Key principles:

1. Always call `super` first in lifecycle methods
2. Pair setup in `connectedCallback()` with cleanup in `disconnectedCallback()`
3. Compute derived state in `willUpdate()`, not `render()`
4. Measure DOM in `updated()` or `firstUpdated()`, not before
5. Await `updateComplete` when coordinating updates or testing
6. Never change properties in `updated()` without guards

Mastering the lifecycle enables you to build performant, maintainable, and robust enterprise healthcare components that integrate seamlessly with any framework or CMS.
