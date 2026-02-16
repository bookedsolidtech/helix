---
title: State Management
description: Comprehensive guide to state management in hx-library web components using Lit's reactive decorators, controllers, and patterns.
order: 72
---

State management is the foundation of component interactivity. This guide covers local state, shared state, context API patterns, reactive controllers, and cross-component communication strategies used throughout hx-library.

---

## Overview

**State management in web components differs from traditional frameworks** because components are isolated by Shadow DOM and distributed across framework boundaries. In hx-library, we use:

- **Local state** — Component-internal state using `@state()` decorator
- **Reactive properties** — Public properties using `@property()` decorator
- **Reactive controllers** — Reusable state/behavior encapsulation
- **Custom events** — Component-to-component communication
- **Form-associated state** — State synchronized via ElementInternals API
- **Context API** — Shared state across component hierarchies (via `@lit/context`)

**Key principles:**

1. **Minimize shared state** — Default to local state unless coordination is required.
2. **Use properties for public API** — External state flows in via properties, flows out via events.
3. **Encapsulate logic in controllers** — Reusable behaviors like adopted stylesheets, keyboard navigation, or timers belong in controllers.
4. **Respect platform patterns** — Form state uses ElementInternals, not custom stores.

---

## Local State

### The `@state()` Decorator

Local state is private to the component and **does not appear as an attribute**. Changes trigger reactive updates.

```ts
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('hx-dropdown')
export class HelixDropdown extends LitElement {
  @state() private _isOpen = false;

  private _toggle(): void {
    this._isOpen = !this._isOpen;
  }

  override render() {
    return html`
      <button @click=${this._toggle}>Toggle</button>
      ${this._isOpen ? html`<div class="dropdown-menu">Content</div>` : null}
    `;
  }
}
```

**When to use `@state()`:**

- Component-internal UI state (open/closed, focused, hover, etc.)
- Derived or computed state (e.g., `_hasError` from slot detection)
- Temporary state that never needs external access

**Real-world example from `hx-select`:**

```ts
@state() private _hasLabelSlot = false;
@state() private _hasErrorSlot = false;

private _handleLabelSlotChange(e: Event): void {
  const slot = e.target as HTMLSlotElement;
  this._hasLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
}
```

**State reactivity:**

Lit tracks changes to `@state()` properties. When you modify a `@state()` property, Lit schedules a re-render. This is **batched** — multiple state changes in the same task only trigger one render.

---

## Reactive Properties

### The `@property()` Decorator

Public properties are part of the component's API. They can be set via attributes, properties, or JavaScript.

```ts
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-alert')
export class HelixAlert extends LitElement {
  @property({ type: String })
  variant: 'info' | 'warning' | 'error' | 'success' = 'info';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  message = '';

  override render() {
    return html`
      <div class="alert alert--${this.variant}" ?hidden=${!this.open}>${this.message}</div>
    `;
  }
}
```

**Options:**

- `type` — Type converter (String, Number, Boolean, Array, Object)
- `reflect` — Sync property changes back to attributes (e.g., for CSS selectors)
- `attribute` — Custom attribute name (default: lowercase property name with dashes)
- `converter` — Custom serialization/deserialization logic

**Example from `hx-checkbox`:**

```ts
@property({ type: Boolean, reflect: true })
checked = false;

@property({ type: String, attribute: 'help-text' })
helpText = '';
```

**When to use `@property()`:**

- Any value consumers need to configure (variant, disabled, label, etc.)
- State that should reflect to the DOM (for styling or inspection)
- Values that participate in form state (value, checked, etc.)

---

## Property vs State Decision Matrix

| Scenario                                 | Use                                                    | Reason                                          |
| ---------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Open/closed state of a dropdown          | `@state()`                                             | Internal UI concern, not part of public API     |
| Checked state of a checkbox              | `@property()`                                          | Public API, reflected to DOM, synced with forms |
| Slot content detection (`_hasErrorSlot`) | `@state()`                                             | Internal rendering logic, no external access    |
| Error message to display                 | `@property()`                                          | Public API, configurable by consumers           |
| Loading spinner visibility               | `@state()` (if async) or `@property()` (if controlled) | Depends on whether parent controls it           |
| Focus state                              | `@state()`                                             | Internal UI state, managed by focus events      |

---

## Reactive Controllers

### What Are Controllers?

Reactive controllers are **reusable encapsulations of state and behavior** that hook into a component's lifecycle. They implement the `ReactiveController` interface:

```ts
interface ReactiveController {
  hostConnected?(): void;
  hostDisconnected?(): void;
  hostUpdate?(): void;
  hostUpdated?(): void;
}
```

**Controllers are registered via `addController()`:**

```ts
class MyElement extends LitElement {
  private _myController = new MyController(this);
}

class MyController implements ReactiveController {
  constructor(private host: ReactiveControllerHost) {
    this.host.addController(this);
  }

  hostConnected(): void {
    console.log('Component connected');
  }
}
```

### Real-World Example: Adopted Stylesheets Controller

hx-library uses a controller to inject CSS into the document **without Shadow DOM**, enabling Light DOM components like `hx-form` to style native elements:

```ts
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';
import { helixFormScopedCss } from './hx-form.styles.js';

@customElement('hx-form')
export class HelixForm extends LitElement {
  override createRenderRoot(): HTMLElement {
    return this; // Light DOM
  }

  private _styles = new AdoptedStylesheetsController(this, helixFormScopedCss, document);

  // The controller automatically injects styles on connectedCallback
  // and removes them on disconnectedCallback
}
```

**Controller implementation:**

```ts
export class AdoptedStylesheetsController implements ReactiveController {
  private static _cache = new Map<string, CSSStyleSheet>();
  private _sheet: CSSStyleSheet | undefined;

  constructor(
    private _host: ReactiveControllerHost & HTMLElement,
    private _cssText: string,
    private _root: Document | ShadowRoot = document,
  ) {
    this._host.addController(this);
  }

  hostConnected(): void {
    let sheet = AdoptedStylesheetsController._cache.get(this._cssText);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(this._cssText);
      AdoptedStylesheetsController._cache.set(this._cssText, sheet);
    }
    this._sheet = sheet;
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

**Benefits:**

- Global deduplication (same CSS text reuses the same `CSSStyleSheet`)
- Automatic lifecycle management
- Reusable across multiple components
- No manual `connectedCallback`/`disconnectedCallback` boilerplate

### When to Use Controllers

| Use Case             | Controller                     | Why                                    |
| -------------------- | ------------------------------ | -------------------------------------- |
| Global CSS injection | `AdoptedStylesheetsController` | Manages document-level state           |
| Keyboard navigation  | `RovingTabindexController`     | Reusable focus management              |
| Mouse tracking       | `MouseController`              | External event subscription            |
| Resize observation   | `ResizeController`             | Manages ResizeObserver lifecycle       |
| Timers/intervals     | `TaskController`               | Automatic cleanup on disconnect        |
| Media queries        | `MediaQueryController`         | Reactively updates based on breakpoint |

**Controller pattern is superior to mixins or HOCs** because it:

- Composes without inheritance
- Encapsulates state without leaking to the component
- Cleans up automatically

---

## Parent-Child Communication

### Passing State Down: Properties

**Properties flow down from parent to child:**

```html
<!-- Parent passes state via properties -->
<hx-text-input
  label="Email"
  value="${this.email}"
  ?disabled="${this.isSubmitting}"
  error="${this.emailError}"
></hx-text-input>
```

**Child component receives via `@property()`:**

```ts
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  @property({ type: String })
  value = '';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  error = '';
}
```

### Passing State Up: Events

**Child dispatches custom events:**

```ts
@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  private _handleChange(): void {
    this.checked = !this.checked;

    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }),
    );
  }
}
```

**Parent listens:**

```ts
override render() {
  return html`
    <hx-checkbox
      @hx-change=${this._handleCheckboxChange}
    ></hx-checkbox>
  `;
}

private _handleCheckboxChange(e: CustomEvent<{ checked: boolean }>): void {
  console.log('Checkbox changed:', e.detail.checked);
  this.acceptedTerms = e.detail.checked;
}
```

**Event naming convention:**

- Prefix: `hx-` (e.g., `hx-change`, `hx-submit`, `hx-close`)
- Use past tense for completed actions (e.g., `hx-loaded`, not `hx-load`)
- Always set `bubbles: true` and `composed: true` (crosses Shadow DOM)

---

## Form State: ElementInternals API

hx-library form controls use the **ElementInternals API** for native form participation. This is **platform state management** — no custom store required.

### Form-Associated Component Pattern

```ts
@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: String })
  value = 'on';

  @property({ type: String })
  name = '';

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      // Sync form value
      this._internals.setFormValue(this.checked ? this.value : null);
      this._updateValidity();
    }
  }

  private _updateValidity(): void {
    if (this.required && !this.checked) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._inputEl);
    } else {
      this._internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.checked = false;
    this._internals.setFormValue(null);
  }

  formStateRestoreCallback(state: string): void {
    this.checked = state === this.value;
  }
}
```

**Key methods:**

- `setFormValue(value)` — Updates the form's value for this field
- `setValidity(flags, message, anchor)` — Updates validation state
- `checkValidity()` — Returns true if valid
- `reportValidity()` — Shows native validation UI

**Benefits:**

- Native browser validation UI
- Works with `<form>` submission (HTTP POST)
- Integrates with Constraint Validation API
- State persists across back/forward navigation (`formStateRestoreCallback`)

---

## Cross-Component State

### Sibling Communication: Events

**Siblings communicate via a shared parent:**

```ts
@customElement('hx-wizard')
export class HelixWizard extends LitElement {
  @state() private _currentStep = 0;

  override render() {
    return html`
      <hx-wizard-step ?active=${this._currentStep === 0} @hx-next=${this._handleNext}>
        Step 1
      </hx-wizard-step>

      <hx-wizard-step
        ?active=${this._currentStep === 1}
        @hx-next=${this._handleNext}
        @hx-previous=${this._handlePrevious}
      >
        Step 2
      </hx-wizard-step>
    `;
  }

  private _handleNext(): void {
    this._currentStep++;
  }

  private _handlePrevious(): void {
    this._currentStep--;
  }
}
```

**Pattern:**

1. Parent holds shared state (`_currentStep`)
2. Parent passes state down to children via properties (`?active`)
3. Children dispatch events (`hx-next`, `hx-previous`)
4. Parent updates state, triggering re-render
5. Children receive updated properties

### Deeply Nested Communication: Context API

For deeply nested components (e.g., radio group managing individual radios), use `@lit/context`:

**Install:**

```bash
npm install @lit/context
```

**Create a context:**

```ts
import { createContext } from '@lit/context';

export interface RadioGroupContext {
  name: string;
  value: string;
  select: (value: string) => void;
}

export const radioGroupContext = createContext<RadioGroupContext>(Symbol('radio-group-context'));
```

**Provide context (parent):**

```ts
import { provide } from '@lit/context';
import { radioGroupContext } from './context.js';

@customElement('hx-radio-group')
export class HelixRadioGroup extends LitElement {
  @property({ type: String })
  value = '';

  @provide({ context: radioGroupContext })
  private _context: RadioGroupContext = {
    name: this.name,
    value: this.value,
    select: (value: string) => {
      this.value = value;
    },
  };

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._context = { ...this._context, value: this.value };
    }
  }
}
```

**Consume context (child):**

```ts
import { consume } from '@lit/context';
import { radioGroupContext, RadioGroupContext } from './context.js';

@customElement('hx-radio')
export class HelixRadio extends LitElement {
  @consume({ context: radioGroupContext, subscribe: true })
  @state()
  private _groupContext?: RadioGroupContext;

  private _handleClick(): void {
    this._groupContext?.select(this.value);
  }

  override render() {
    const isChecked = this._groupContext?.value === this.value;
    return html`
      <input
        type="radio"
        name=${this._groupContext?.name ?? ''}
        ?checked=${isChecked}
        @click=${this._handleClick}
      />
    `;
  }
}
```

**When to use Context API:**

- Parent-child relationships with deep nesting (e.g., radio group, tabs, accordion)
- Avoiding prop drilling through intermediate components
- Theming (light/dark mode)
- Localization (language strings)

**When NOT to use Context API:**

- Sibling-to-sibling communication (use parent state + events instead)
- Global application state (use a framework store like Redux/Zustand)
- Form state (use ElementInternals)

---

## State Machines

State machines model component behavior as a **finite set of states** and **transitions**. This eliminates invalid states and improves testability.

### Example: Dialog State Machine

**States:**

- `closed` → `opening` → `open` → `closing` → `closed`

**Implementation:**

```ts
type DialogState = 'closed' | 'opening' | 'open' | 'closing';

@customElement('hx-dialog')
export class HelixDialog extends LitElement {
  @state() private _state: DialogState = 'closed';

  async open(): Promise<void> {
    if (this._state !== 'closed') return;

    this._state = 'opening';
    await this.updateComplete;

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, 200));
    this._state = 'open';
  }

  async close(): Promise<void> {
    if (this._state !== 'open') return;

    this._state = 'closing';
    await this.updateComplete;

    await new Promise((resolve) => setTimeout(resolve, 200));
    this._state = 'closed';
  }

  override render() {
    const classes = {
      dialog: true,
      'dialog--opening': this._state === 'opening',
      'dialog--open': this._state === 'open',
      'dialog--closing': this._state === 'closing',
    };

    return this._state === 'closed' ? null : html`<div class=${classMap(classes)}>Content</div>`;
  }
}
```

**Benefits:**

- No invalid states (e.g., "opening while closing")
- Transitions are explicit and auditable
- Animation timing is coordinated with state

### State Machine Libraries

For complex state machines, consider:

- **XState** — Visual state machine library with editor
- **Robot** — Lightweight finite state machine
- **Custom reducer** — Simple `switch` statement

```ts
type Action = { type: 'OPEN' } | { type: 'CLOSE' };

function dialogReducer(state: DialogState, action: Action): DialogState {
  switch (action.type) {
    case 'OPEN':
      return state === 'closed' ? 'opening' : state;
    case 'CLOSE':
      return state === 'open' ? 'closing' : state;
    default:
      return state;
  }
}
```

---

## Observable Patterns

### Custom Property Accessors

For fine-grained reactivity, use **getters and setters**:

```ts
@customElement('hx-counter')
export class HelixCounter extends LitElement {
  private _count = 0;

  get count(): number {
    return this._count;
  }

  set count(value: number) {
    const oldValue = this._count;
    this._count = Math.max(0, value); // Clamp to non-negative

    // Manual reactive update
    this.requestUpdate('count', oldValue);

    // Side effect: log to analytics
    console.log('Count changed:', this._count);
  }

  override render() {
    return html`<div>Count: ${this.count}</div>`;
  }
}
```

**When to use accessors:**

- Input validation (e.g., clamping, coercion)
- Side effects on change (analytics, localStorage sync)
- Computed properties based on multiple inputs

### External State: RxJS

For complex async state, integrate RxJS:

```ts
import { fromEvent, map } from 'rxjs';

@customElement('hx-mouse-tracker')
export class HelixMouseTracker extends LitElement {
  @state() private _x = 0;
  @state() private _y = 0;

  override connectedCallback(): void {
    super.connectedCallback();

    const move$ = fromEvent<MouseEvent>(document, 'mousemove').pipe(
      map((e) => ({ x: e.clientX, y: e.clientY })),
    );

    this._subscription = move$.subscribe(({ x, y }) => {
      this._x = x;
      this._y = y;
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._subscription?.unsubscribe();
  }
}
```

**Note:** For simple cases, a controller is cleaner than RxJS.

---

## Store Patterns

### When to Use a Store

**Use a store when:**

- State is shared across **unrelated components** (no parent-child relationship)
- State persists across **route changes** or **page reloads**
- State requires **centralized business logic** (e.g., authentication, cart)

**Do NOT use a store for:**

- Form state (use ElementInternals)
- Parent-child communication (use properties and events)
- UI state (open/closed, focus, hover)

### Store Implementation: Signals

Lit 3.x introduced **signals** (via `@lit-labs/preact-signals`):

```bash
npm install @lit-labs/preact-signals @preact/signals-core
```

**Create a store:**

```ts
// store.ts
import { signal, computed } from '@preact/signals-core';

export const cartItems = signal<Array<{ id: string; name: string }>>([]);

export const cartCount = computed(() => cartItems.value.length);

export function addToCart(item: { id: string; name: string }): void {
  cartItems.value = [...cartItems.value, item];
}

export function removeFromCart(id: string): void {
  cartItems.value = cartItems.value.filter((item) => item.id !== id);
}
```

**Consume in components:**

```ts
import { SignalWatcher } from '@lit-labs/preact-signals';
import { cartCount, addToCart } from './store.js';

@customElement('hx-cart-badge')
export class HelixCartBadge extends SignalWatcher(LitElement) {
  override render() {
    return html`<hx-badge>${cartCount.value}</hx-badge>`;
  }
}

@customElement('hx-product-card')
export class HelixProductCard extends LitElement {
  @property({ type: String })
  productId = '';

  private _handleAddToCart(): void {
    addToCart({ id: this.productId, name: 'Product Name' });
  }

  override render() {
    return html` <hx-button @click=${this._handleAddToCart}> Add to Cart </hx-button> `;
  }
}
```

**Benefits:**

- Automatic reactivity (components re-render when signals change)
- No prop drilling
- Framework-agnostic (works in React, Vue, etc.)

### Store Persistence

Sync store to localStorage:

```ts
import { signal, effect } from '@preact/signals-core';

export const theme = signal<'light' | 'dark'>(
  (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
);

// Persist to localStorage on change
effect(() => {
  localStorage.setItem('theme', theme.value);
});
```

---

## State Persistence

### localStorage

```ts
@customElement('hx-theme-toggle')
export class HelixThemeToggle extends LitElement {
  @property({ type: String })
  theme: 'light' | 'dark' = 'light';

  override connectedCallback(): void {
    super.connectedCallback();
    this.theme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  }

  private _toggle(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
  }
}
```

### sessionStorage

Same API as localStorage, but cleared when the tab closes:

```ts
sessionStorage.setItem('wizard-step', '3');
const step = sessionStorage.getItem('wizard-step');
```

### URL State (Query Parameters)

For shareable/bookmarkable state:

```ts
@customElement('hx-search-results')
export class HelixSearchResults extends LitElement {
  @property({ type: String })
  query = '';

  override connectedCallback(): void {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    this.query = params.get('q') || '';
  }

  private _handleSearch(e: CustomEvent<{ query: string }>): void {
    this.query = e.detail.query;
    const url = new URL(window.location.href);
    url.searchParams.set('q', this.query);
    window.history.pushState({}, '', url);
  }
}
```

---

## Best Practices

### 1. Default to Local State

**Start with `@state()` until you need external access:**

```ts
// Good
@state() private _isOpen = false;

// Bad (unless external control is required)
@property({ type: Boolean }) isOpen = false;
```

### 2. Immutable State Updates

**Always create new objects/arrays for state updates:**

```ts
// Good
this.items = [...this.items, newItem];

// Bad (mutation)
this.items.push(newItem); // Lit won't detect the change
```

### 3. Batch Updates

**Multiple state changes in the same task batch into one render:**

```ts
private _handleSubmit(): void {
  this.loading = true;
  this.error = '';
  this.submitted = true;
  // Only renders once
}
```

### 4. Avoid State Duplication

**Don't copy prop values into state unless transformation is required:**

```ts
// Bad
@property() count = 0;
@state() private _count = 0;

override updated(changedProps: Map<string, unknown>): void {
  if (changedProps.has('count')) {
    this._count = this.count; // Unnecessary duplication
  }
}

// Good (just use the property directly)
@property() count = 0;
```

### 5. Computed Properties via Getters

**Derive state instead of storing it:**

```ts
// Bad
@state() private _hasErrors = false;

override updated(): void {
  this._hasErrors = this.errors.length > 0;
}

// Good
private get _hasErrors(): boolean {
  return this.errors.length > 0;
}
```

### 6. Encapsulate Complex State in Controllers

**If state management logic exceeds ~20 lines, extract to a controller:**

```ts
// Instead of inline logic:
@customElement('hx-tooltip')
export class HelixTooltip extends LitElement {
  @state() private _visible = false;
  private _hoverTimeout?: number;

  private _handleMouseEnter(): void {
    clearTimeout(this._hoverTimeout);
    this._hoverTimeout = window.setTimeout(() => {
      this._visible = true;
    }, 200);
  }

  private _handleMouseLeave(): void {
    clearTimeout(this._hoverTimeout);
    this._visible = false;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._hoverTimeout);
  }
}

// Prefer a controller:
class TooltipController implements ReactiveController {
  visible = false;
  private _timeout?: number;

  constructor(private host: ReactiveControllerHost) {
    this.host.addController(this);
  }

  show(delay = 200): void {
    clearTimeout(this._timeout);
    this._timeout = window.setTimeout(() => {
      this.visible = true;
      this.host.requestUpdate();
    }, delay);
  }

  hide(): void {
    clearTimeout(this._timeout);
    this.visible = false;
    this.host.requestUpdate();
  }

  hostDisconnected(): void {
    clearTimeout(this._timeout);
  }
}
```

---

## Real-World Example: Radio Group

**Parent manages shared state, children consume via events:**

```ts
// hx-radio-group.ts
@customElement('hx-radio-group')
export class HelixRadioGroup extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: String })
  value = '';

  @property({ type: String })
  name = '';

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Listen for child radio selections
    this.addEventListener('hx-radio-select', this._handleRadioSelect);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      // Sync all child radios
      this._syncRadios();
      // Update form state
      this._internals.setFormValue(this.value || null);
    }
  }

  private _handleRadioSelect = (e: CustomEvent<{ value: string }>): void => {
    e.stopPropagation();
    const newValue = e.detail.value;
    if (newValue === this.value) return;

    this.value = newValue;

    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  private _syncRadios(): void {
    const radios = this.querySelectorAll('hx-radio');
    radios.forEach((radio) => {
      radio.checked = radio.value === this.value;
    });
  }

  override render() {
    return html`
      <fieldset>
        <legend>${this.label}</legend>
        <slot></slot>
      </fieldset>
    `;
  }
}

// hx-radio.ts
@customElement('hx-radio')
export class HelixRadio extends LitElement {
  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  checked = false;

  private _handleClick(): void {
    this.dispatchEvent(
      new CustomEvent('hx-radio-select', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  override render() {
    return html`
      <label @click=${this._handleClick}>
        <input type="radio" .checked=${this.checked} @click=${(e: Event) => e.preventDefault()} />
        <slot></slot>
      </label>
    `;
  }
}
```

**Usage:**

```html
<hx-radio-group name="color" value="blue">
  <hx-radio value="red">Red</hx-radio>
  <hx-radio value="green">Green</hx-radio>
  <hx-radio value="blue">Blue</hx-radio>
</hx-radio-group>
```

**State flow:**

1. User clicks radio → `hx-radio` dispatches `hx-radio-select` event
2. `hx-radio-group` listens → updates `value` property
3. `updated()` lifecycle → `_syncRadios()` updates all children's `checked` property
4. Form state synced via `_internals.setFormValue()`

---

## Summary

| Pattern                  | Use Case                     | Implementation             |
| ------------------------ | ---------------------------- | -------------------------- |
| **Local State**          | Component-internal UI state  | `@state()`                 |
| **Public Properties**    | External configuration       | `@property()`              |
| **Reactive Controllers** | Reusable behaviors/logic     | `ReactiveController`       |
| **Parent-Child**         | Direct relationships         | Properties down, events up |
| **Context API**          | Deeply nested hierarchies    | `@lit/context`             |
| **Form State**           | Native form participation    | ElementInternals           |
| **Global Store**         | Cross-component shared state | Signals, Redux, Zustand    |
| **State Machines**       | Complex state transitions    | Custom reducer, XState     |
| **Persistence**          | State across sessions        | localStorage, URL params   |

**Golden rules:**

1. **Start simple** — Default to `@state()` and `@property()`
2. **Lift state only when necessary** — Avoid premature abstraction
3. **Prefer platform APIs** — Use ElementInternals for forms, not custom stores
4. **Extract to controllers** — Reusable logic belongs in controllers
5. **Events over callbacks** — Use `CustomEvent` for component communication
6. **Immutability** — Always create new objects/arrays for state updates
7. **Test state transitions** — Write tests for every state change

State management in web components is **declarative and composable**. By following these patterns, you build components that are testable, maintainable, and framework-agnostic.

---

## Further Reading

- [Lit Reactive Properties](https://lit.dev/docs/components/properties/)
- [Lit Reactive Controllers](https://lit.dev/docs/composition/controllers/)
- [Lit Context API](https://lit.dev/docs/data/context/)
- [ElementInternals API](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation)
- [@lit-labs/preact-signals](https://www.npmjs.com/package/@lit-labs/preact-signals)
