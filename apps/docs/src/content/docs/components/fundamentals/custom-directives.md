---
title: Custom Directives Guide
description: Deep dive into Lit's custom directives system — creating class-based directives, async directives, directive lifecycle, composition patterns, and advanced templating techniques for enterprise component libraries.
sidebar:
  order: 7
---

Custom directives extend Lit's templating capabilities beyond the built-in directives like `classMap`, `ifDefined`, and `repeat`. They allow you to encapsulate complex rendering logic, manage stateful DOM manipulations, handle asynchronous updates, and implement reusable template patterns that would otherwise require repetitive code across components.

In enterprise healthcare applications like the hx-library, custom directives are essential for:

- **Complex form validation**: Directives that manage async validation states and error messaging
- **Accessibility patterns**: Reusable ARIA attribute management and focus control
- **Data transformations**: Formatting medical codes, patient identifiers, or timestamps
- **Resource management**: Cleanup of subscriptions, timers, and external API connections
- **Performance optimization**: Preventing unnecessary re-renders through fine-grained change detection

This guide covers the complete directive lifecycle, from simple function directives to advanced async directives with full resource management.

## Understanding Directives

Directives are special functions that customize how expressions render in Lit templates. They intercept expression values during the rendering process, allowing you to transform data, manipulate the DOM directly, manage lifecycle concerns, or implement async updates.

### Built-in Directives in hx-library

The hx-library currently uses three built-in Lit directives across its components:

**classMap** — Conditionally applies CSS classes based on an object map:

```typescript
import { classMap } from 'lit/directives/class-map.js';

render() {
  const classes = {
    'input-wrapper': true,
    'has-error': this.error,
    'is-disabled': this.disabled
  };
  return html`<div class=${classMap(classes)}>...</div>`;
}
```

**ifDefined** — Only sets an attribute if the value is defined (not `undefined` or `null`):

```typescript
import { ifDefined } from 'lit/directives/if-defined.js';

render() {
  return html`
    <input
      placeholder=${ifDefined(this.placeholder)}
      aria-describedby=${ifDefined(this._ariaDescribedby)}
    />
  `;
}
```

**live** — Ensures the rendered value matches the live DOM value (critical for form inputs):

```typescript
import { live } from 'lit/directives/live.js';

render() {
  return html`
    <input
      .value=${live(this.value)}
      @input=${this._handleInput}
    />
  `;
}
```

These directives appear in form components like `hx-text-input`, `hx-textarea`, `hx-checkbox`, and `hx-select`, demonstrating how directives solve common templating challenges.

## Simple Function Directives

The simplest directives are pure functions that transform values before rendering. They don't maintain state or access the DOM—they simply map input to output.

### Basic Function Directive

```typescript
/**
 * Removes vowels from a string.
 * Used in templates like: ${noVowels('hello')} → 'hxllx'
 */
export const noVowels = (str: string): string => {
  return str.replaceAll(/[aeiou]/ig, 'x');
};

// Usage in template:
render() {
  return html`<p>${noVowels(this.message)}</p>`;
}
```

Function directives work well for:

- Data formatting (dates, numbers, currencies)
- String transformations
- Simple calculations
- Pure data mappings

### Healthcare-Specific Function Directive

```typescript
/**
 * Formats a Medical Record Number (MRN) for display.
 * Converts "123456789" to "12-345-6789" format.
 */
export const formatMRN = (mrn: string): string => {
  const cleaned = mrn.replace(/\D/g, ''); // Remove non-digits
  if (cleaned.length !== 9) return mrn; // Invalid format

  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
};

// Usage:
render() {
  return html`<span class="mrn">${formatMRN(this.patientMRN)}</span>`;
}
```

Function directives are lightweight and fast, but they can't:

- Persist state between renders
- Access or manipulate the DOM
- Clean up resources
- Handle async operations

For these advanced scenarios, you need class-based directives.

## Class-Based Directives

Class-based directives extend the `Directive` base class, enabling stateful logic, DOM access, and lifecycle management. They're created by passing a class to the `directive()` factory function.

### Anatomy of a Class-Based Directive

```typescript
import { Directive, directive } from 'lit/directive.js';
import { html } from 'lit';

class HighlightDirective extends Directive {
  // State persists between renders
  previousValue = '';

  render(value: string, searchTerm: string) {
    // Return the value to render in the template
    if (!searchTerm || !value.includes(searchTerm)) {
      return value;
    }

    const parts = value.split(searchTerm);
    const highlighted = parts.map((part, i) =>
      i < parts.length - 1
        ? html`${part}<mark>${searchTerm}</mark>`
        : part
    );

    return highlighted;
  }
}

// Create the directive function
export const highlight = directive(HighlightDirective);

// Usage in template:
render() {
  return html`
    <p>${highlight(this.patientName, this.searchQuery)}</p>
  `;
}
```

### The directive() Factory

The `directive()` function wraps your directive class and returns a function that consumers call in templates. When the template evaluates:

1. The directive function is called with the arguments you provide
2. It returns a `DirectiveResult` object
3. Lit creates or retrieves the directive instance for that expression location
4. The directive's `render()` method is called with your arguments
5. The return value is rendered in the template

Each expression position in your template gets its own directive instance, so state is preserved across renders at that location.

## Directive Lifecycle

Class-based directives have a three-phase lifecycle: construction, rendering, and (optionally) update. Understanding these phases is critical for managing state and resources correctly.

### Constructor: One-Time Initialization

The constructor runs only once when the directive is first encountered in a template expression. It receives a `PartInfo` object containing metadata about the expression context.

```typescript
import { Directive, PartInfo } from 'lit/directive.js';

class CounterDirective extends Directive {
  instanceId: number;
  createdAt: number;

  constructor(partInfo: PartInfo) {
    super(partInfo);

    this.instanceId = Math.random();
    this.createdAt = Date.now();

    console.log('Directive created at', this.createdAt);
  }

  render() {
    return `Instance ${this.instanceId}`;
  }
}
```

**Key points:**

- The constructor runs exactly once per expression location
- Class fields persist state between renders
- Don't perform side effects here—the directive might not render
- Use `partInfo` for validation (e.g., ensuring the directive is in the correct expression type)

### PartInfo: Expression Metadata

The `PartInfo` object describes where the directive is being used:

```typescript
interface PartInfo {
  type: PartType; // Type of expression (CHILD, ATTRIBUTE, PROPERTY, etc.)
  strings?: ReadonlyArray<string>; // Static strings around expressions
  name?: string; // Attribute/property name
  tagName?: string; // Element tag name
}

enum PartType {
  ATTRIBUTE = 1,
  CHILD = 2,
  PROPERTY = 3,
  BOOLEAN_ATTRIBUTE = 4,
  EVENT = 5,
  ELEMENT = 6,
}
```

Use `PartInfo` to validate directive usage:

```typescript
class StyleMapDirective extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (partInfo.type !== PartType.ATTRIBUTE || partInfo.name !== 'style') {
      throw new Error('styleMap() must be used in the style attribute');
    }
  }
}
```

### render(): Declarative Rendering

The `render()` method is called on every component update. It receives the arguments passed to the directive function and returns a value to render.

```typescript
class MaxValueDirective extends Directive {
  maxValue = Number.MIN_VALUE;

  render(value: number, minValue = Number.MIN_VALUE) {
    // Update internal state
    this.maxValue = Math.max(value, this.maxValue, minValue);

    // Return value to render
    return this.maxValue;
  }
}

export const maxValue = directive(MaxValueDirective);

// Usage: Always shows the highest value seen
render() {
  return html`<p>Peak: ${maxValue(this.currentValue, 0)}</p>`;
}
```

**render() characteristics:**

- Called on every component update (unless prevented by `shouldUpdate`)
- Can access and modify directive state (class fields)
- Should return a renderable value (string, number, template, array, `nothing`, `noChange`)
- Should not directly manipulate the DOM (use `update()` for that)
- Is called during server-side rendering (SSR), so avoid browser-specific APIs

### update(): Imperative DOM Access

The optional `update()` method provides direct access to the DOM through the `Part` object. It's called before `render()` and is skipped during SSR.

```typescript
import { Directive, DirectiveParameters, PartInfo } from 'lit/directive.js';
import { ChildPart } from 'lit';

class AttributeLoggerDirective extends Directive {
  attributeNames = '';

  // update() receives the Part and the directive arguments
  update(part: ChildPart, [prefix]: DirectiveParameters<this>) {
    // Access the DOM node
    const parentElement = part.parentNode as Element;

    // Read attributes
    this.attributeNames = parentElement
      .getAttributeNames()
      .filter(name => prefix ? name.startsWith(prefix) : true)
      .join(', ');

    // Call render() and return its value
    return this.render(prefix);
  }

  render(prefix?: string) {
    return this.attributeNames || 'No attributes';
  }
}

export const attributeLogger = directive(AttributeLoggerDirective);

// Usage: Logs all data-* attributes on the parent element
render() {
  return html`<div data-id="123" data-name="test">
    ${attributeLogger('data-')}
  </div>`;
}
```

**update() use cases:**

- Reading DOM properties or attributes
- Measuring element dimensions
- Direct DOM manipulation (scroll position, focus, etc.)
- Accessing parent or sibling elements
- Integration with non-Lit libraries

### Part Types and Their APIs

Different expression types have different Part objects:

**ChildPart** (child expressions):

```typescript
interface ChildPart {
  parentNode: Node;
  startNode: Node;
  endNode: Node;
  setValue(value: unknown): void;
  commit(): void;
}
```

**AttributePart** (attribute expressions):

```typescript
interface AttributePart {
  element: Element;
  name: string;
  strings: ReadonlyArray<string>;
  setValue(value: unknown): void;
  commit(): void;
}
```

**PropertyPart** (property expressions with `.` prefix):

```typescript
interface PropertyPart {
  element: Element;
  name: string;
  setValue(value: unknown): void;
  commit(): void;
}
```

**EventPart** (event listener expressions with `@` prefix):

```typescript
interface EventPart {
  element: Element;
  name: string;
  setValue(value: EventListener | undefined): void;
  commit(): void;
}
```

### Returning noChange

Import `noChange` from `lit` to signal that the Part shouldn't update:

```typescript
import { Directive } from 'lit/directive.js';
import { noChange } from 'lit';

class CachedDirective extends Directive {
  lastArgs: unknown[] = [];
  lastResult: unknown;

  render(...args: unknown[]) {
    // Shallow equality check
    if (this._argsEqual(args, this.lastArgs)) {
      return noChange; // Don't re-render
    }

    this.lastArgs = args;
    this.lastResult = this._expensiveComputation(...args);
    return this.lastResult;
  }

  private _argsEqual(a: unknown[], b: unknown[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  private _expensiveComputation(...args: unknown[]) {
    // Complex calculation
    return args.reduce((a, b) => (a as number) + (b as number), 0);
  }
}

export const cached = directive(CachedDirective);
```

**Note:** `noChange` is different from `undefined`. Returning `undefined` clears the Part (renders nothing), while `noChange` leaves the previous value in place.

## Async Directives

Async directives extend `AsyncDirective` and enable updates that occur outside the normal component render cycle. They're essential for:

- Observables and reactive streams
- Server-sent events
- WebSocket connections
- Periodic timers
- Dynamic imports
- Fetch requests

### AsyncDirective Base Class

```typescript
import { AsyncDirective } from 'lit/async-directive.js';
import { directive } from 'lit/directive.js';

class PromiseDirective extends AsyncDirective {
  render(promise: Promise<unknown>) {
    // Render initial state
    Promise.resolve(promise).then(value => {
      // Update asynchronously using setValue()
      this.setValue(value);
    });

    return 'Loading...';
  }
}

export const resolvePromise = directive(PromiseDirective);

// Usage:
render() {
  const dataPromise = fetch('/api/patient/123').then(r => r.json());
  return html`<div>${resolvePromise(dataPromise)}</div>`;
}
```

### setValue(): Asynchronous Updates

`setValue()` is the key method of async directives. It tells Lit to update the Part with a new value outside the normal render cycle.

```typescript
class StreamDirective extends AsyncDirective {
  unsubscribe?: () => void;

  render(observable: Observable<string>) {
    // Clean up previous subscription
    this.unsubscribe?.();

    // Subscribe to new observable
    this.unsubscribe = observable.subscribe((value) => {
      // Push updates as they arrive
      this.setValue(value);
    });

    return 'Connecting...';
  }
}
```

**setValue() characteristics:**

- Can be called from async callbacks, event handlers, or timers
- Causes the Part to update immediately (doesn't wait for component render)
- Can be called multiple times to "push" updates
- Should only be called when `isConnected` is true (see below)

### Async Lifecycle: Resource Management

Async directives have additional lifecycle methods for managing resources that outlive individual renders.

#### disconnected(): Cleanup

Called when the directive's expression is no longer connected to the DOM. This happens when:

- The containing element is removed from the document
- The component re-renders with a different template
- The expression location no longer uses the directive

```typescript
import { AsyncDirective } from 'lit/async-directive.js';

class TimerDirective extends AsyncDirective {
  intervalId?: number;

  render(intervalMs: number) {
    // Clear previous timer
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }

    let count = 0;

    // Start new timer
    this.intervalId = window.setInterval(() => {
      count++;
      this.setValue(count);
    }, intervalMs);

    return 0;
  }

  // Clean up when directive disconnects
  disconnected() {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}

export const timer = directive(TimerDirective);

// Usage: Shows incrementing counter
render() {
  return html`<p>Elapsed: ${timer(1000)}s</p>`;
}
```

**Critical:** Always clean up resources in `disconnected()` to prevent memory leaks.

#### reconnected(): Restoration

Called when a previously disconnected directive is connected again. This can happen when:

- A component uses `live()` or similar caching
- DOM nodes are moved rather than destroyed
- The template switches back to using the directive

```typescript
class ObservableDirective extends AsyncDirective {
  observable?: Observable<unknown>;
  unsubscribe?: () => void;

  render(observable: Observable<unknown>) {
    if (this.observable !== observable) {
      this.unsubscribe?.();
      this.observable = observable;

      // Only subscribe if connected
      if (this.isConnected) {
        this.subscribe();
      }
    }
    return 'Waiting...';
  }

  private subscribe() {
    this.unsubscribe = this.observable!.subscribe((value) => {
      this.setValue(value);
    });
  }

  disconnected() {
    this.unsubscribe?.();
  }

  reconnected() {
    // Restore subscription when reconnected
    this.subscribe();
  }
}
```

#### isConnected: Connection State

The `isConnected` boolean property reflects whether the directive is currently connected to the DOM. Always check this before subscribing to long-lived resources.

```typescript
class WebSocketDirective extends AsyncDirective {
  ws?: WebSocket;
  url = '';

  render(url: string) {
    if (this.url !== url) {
      this.ws?.close();
      this.url = url;

      // Only connect if directive is in the DOM
      if (this.isConnected) {
        this.connect();
      }
    }
    return 'Connecting...';
  }

  private connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onmessage = (event) => {
      // Only update if still connected
      if (this.isConnected) {
        this.setValue(event.data);
      }
    };

    this.ws.onerror = () => {
      this.setValue('Connection error');
    };
  }

  disconnected() {
    this.ws?.close();
    this.ws = undefined;
  }

  reconnected() {
    this.connect();
  }
}

export const websocket = directive(WebSocketDirective);

// Usage:
render() {
  return html`<pre>${websocket('wss://api.example.com/stream')}</pre>`;
}
```

### Complete Async Directive Example: Server-Sent Events

```typescript
import { AsyncDirective } from 'lit/async-directive.js';
import { directive } from 'lit/directive.js';

class ServerEventsDirective extends AsyncDirective {
  eventSource?: EventSource;
  url = '';
  eventType = '';

  render(url: string, eventType: string) {
    // Reconnect if URL or event type changes
    if (this.url !== url || this.eventType !== eventType) {
      this.cleanup();
      this.url = url;
      this.eventType = eventType;

      if (this.isConnected) {
        this.connect();
      }
    }

    return 'Connecting to event stream...';
  }

  private connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.addEventListener(this.eventType, (event) => {
      if (this.isConnected) {
        try {
          const data = JSON.parse((event as MessageEvent).data);
          this.setValue(data);
        } catch {
          this.setValue((event as MessageEvent).data);
        }
      }
    });

    this.eventSource.onerror = () => {
      this.setValue('Stream error - reconnecting...');
    };
  }

  private cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

  disconnected() {
    this.cleanup();
  }

  reconnected() {
    this.connect();
  }
}

export const serverEvents = directive(ServerEventsDirective);

// Usage in a healthcare monitoring component:
@customElement('hx-vital-monitor')
export class HelixVitalMonitor extends LitElement {
  @property() patientId = '';

  override render() {
    const streamUrl = `/api/vitals/stream?patient=${this.patientId}`;

    return html`
      <div class="vital-monitor">
        <h3>Real-time Vitals</h3>
        <div class="readings">${serverEvents(streamUrl, 'vital-update')}</div>
      </div>
    `;
  }
}
```

## Directive Composition Patterns

Complex functionality often requires combining multiple directives. Lit directives compose naturally through several patterns.

### Directive Factory Pattern

Create a factory function that returns configured directive instances:

```typescript
import { Directive, directive } from 'lit/directive.js';

class FormatDirective extends Directive {
  formatter: (value: unknown) => string;

  constructor(partInfo: PartInfo, formatter: (value: unknown) => string) {
    super(partInfo);
    this.formatter = formatter;
  }

  render(value: unknown) {
    return this.formatter(value);
  }
}

// Factory creates specialized directives
export const formatDate = directive(
  class extends FormatDirective {
    constructor(partInfo: PartInfo) {
      super(partInfo, (value) =>
        new Date(value as string).toLocaleDateString()
      );
    }
  }
);

export const formatCurrency = directive(
  class extends FormatDirective {
    constructor(partInfo: PartInfo) {
      super(partInfo, (value) =>
        `$${(value as number).toFixed(2)}`
      );
    }
  }
);

// Usage:
render() {
  return html`
    <p>Date: ${formatDate(this.timestamp)}</p>
    <p>Cost: ${formatCurrency(this.amount)}</p>
  `;
}
```

### Directive Chaining

Directives can return other directives' results:

```typescript
import { classMap } from 'lit/directives/class-map.js';
import { Directive, directive } from 'lit/directive.js';

class StatusClassesDirective extends Directive {
  render(status: 'pending' | 'success' | 'error') {
    // Return another directive's result
    return classMap({
      'status': true,
      'status--pending': status === 'pending',
      'status--success': status === 'success',
      'status--error': status === 'error'
    });
  }
}

export const statusClasses = directive(StatusClassesDirective);

// Usage:
render() {
  return html`
    <div class=${statusClasses(this.requestStatus)}>
      ${this.statusMessage}
    </div>
  `;
}
```

### Directive Nesting in Templates

Directives naturally nest when used in template expressions:

```typescript
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

render() {
  return html`
    <ul>
      ${repeat(
        this.items,
        item => item.id,
        item => html`
          <li class=${classMap({
            'item': true,
            'item--selected': item.id === this.selectedId
          })}>
            ${item.name}
          </li>
        `
      )}
    </ul>
  `;
}
```

## Real-World Examples from hx-library

Let's examine how custom directives could enhance existing hx-library patterns.

### Example 1: Form Field Status Directive

Current pattern in `hx-text-input`:

```typescript
// hx-text-input.ts (simplified)
render() {
  const classes = {
    'text-input': true,
    'text-input--error': this.error || this._hasErrorSlot,
    'text-input--disabled': this.disabled,
    'text-input--required': this.required
  };

  return html`
    <div class=${classMap(classes)}>
      <!-- input content -->
    </div>
  `;
}
```

Custom directive version:

```typescript
// directives/field-state-classes.ts
import { Directive, directive } from 'lit/directive.js';
import { classMap } from 'lit/directives/class-map.js';

interface FieldState {
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  focused?: boolean;
  readonly?: boolean;
}

class FieldStateClassesDirective extends Directive {
  render(baseClass: string, state: FieldState) {
    return classMap({
      [baseClass]: true,
      [`${baseClass}--error`]: !!state.error,
      [`${baseClass}--disabled`]: !!state.disabled,
      [`${baseClass}--required`]: !!state.required,
      [`${baseClass}--focused`]: !!state.focused,
      [`${baseClass}--readonly`]: !!state.readonly
    });
  }
}

export const fieldStateClasses = directive(FieldStateClassesDirective);

// Usage in components:
render() {
  return html`
    <div class=${fieldStateClasses('text-input', {
      error: this.error || this._hasErrorSlot,
      disabled: this.disabled,
      required: this.required,
      focused: this._focused
    })}>
      <!-- input content -->
    </div>
  `;
}
```

### Example 2: Live Validation Directive

Async directive for real-time field validation:

```typescript
// directives/live-validate.ts
import { AsyncDirective } from 'lit/async-directive.js';
import { directive } from 'lit/directive.js';
import { noChange } from 'lit';

type ValidationFn = (value: string) => Promise<ValidationResult>;

interface ValidationResult {
  valid: boolean;
  message?: string;
}

class LiveValidateDirective extends AsyncDirective {
  lastValue = '';
  validationTimer?: number;
  validationPromise?: Promise<ValidationResult>;

  render(value: string, validationFn: ValidationFn, debounceMs = 300) {
    // Only validate on value change
    if (this.lastValue === value) {
      return noChange;
    }

    this.lastValue = value;

    // Clear pending validation
    if (this.validationTimer !== undefined) {
      clearTimeout(this.validationTimer);
    }

    // Debounce validation
    this.validationTimer = window.setTimeout(() => {
      if (this.isConnected) {
        this.validate(value, validationFn);
      }
    }, debounceMs);

    return noChange;
  }

  private async validate(value: string, validationFn: ValidationFn) {
    const promise = validationFn(value);
    this.validationPromise = promise;

    try {
      const result = await promise;

      // Only update if this is still the latest validation
      if (this.validationPromise === promise && this.isConnected) {
        this.setValue(result);
      }
    } catch (error) {
      if (this.validationPromise === promise && this.isConnected) {
        this.setValue({
          valid: false,
          message: 'Validation error',
        });
      }
    }
  }

  disconnected() {
    if (this.validationTimer !== undefined) {
      clearTimeout(this.validationTimer);
      this.validationTimer = undefined;
    }
  }
}

export const liveValidate = directive(LiveValidateDirective);

// Usage in a component:
@customElement('hx-email-input')
export class HelixEmailInput extends LitElement {
  @property() value = '';
  @state() validationResult?: ValidationResult;

  private async _validateEmail(email: string): Promise<ValidationResult> {
    // Check format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, message: 'Invalid email format' };
    }

    // Check if email exists (API call)
    const response = await fetch(`/api/validate-email?email=${email}`);
    const data = await response.json();

    return {
      valid: data.available,
      message: data.available ? undefined : 'Email already registered',
    };
  }

  override render() {
    return html`
      <div class="email-input">
        <input type="email" .value=${this.value} @input=${this._handleInput} />
        ${liveValidate(this.value, this._validateEmail.bind(this))}
        ${this.validationResult
          ? html`
              <span class=${this.validationResult.valid ? 'valid' : 'error'}>
                ${this.validationResult.message || '✓ Valid'}
              </span>
            `
          : ''}
      </div>
    `;
  }

  private _handleInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
  }
}
```

### Example 3: Healthcare Code Formatter

Directive for formatting medical codes (ICD-10, CPT, etc.):

```typescript
// directives/format-medical-code.ts
import { Directive, directive } from 'lit/directive.js';

type CodeType = 'icd10' | 'cpt' | 'ndc' | 'hcpcs';

interface CodeFormat {
  pattern: RegExp;
  format: (code: string) => string;
  validate: (code: string) => boolean;
}

const CODE_FORMATS: Record<CodeType, CodeFormat> = {
  icd10: {
    pattern: /^[A-Z]\d{2}(\.\d{1,4})?$/,
    format: (code: string) => {
      // ICD-10: A12.345 format
      const cleaned = code.replace(/[^A-Z0-9]/g, '');
      if (cleaned.length <= 3) return cleaned;
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    },
    validate: (code: string) => /^[A-Z]\d{2}\.\d{1,4}$/.test(code),
  },

  cpt: {
    pattern: /^\d{5}$/,
    format: (code: string) => code.replace(/\D/g, '').slice(0, 5),
    validate: (code: string) => /^\d{5}$/.test(code),
  },

  ndc: {
    pattern: /^\d{5}-\d{4}-\d{2}$/,
    format: (code: string) => {
      // NDC: 12345-6789-01 format
      const cleaned = code.replace(/\D/g, '');
      if (cleaned.length < 5) return cleaned;
      if (cleaned.length < 9) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9, 11)}`;
    },
    validate: (code: string) => /^\d{5}-\d{4}-\d{2}$/.test(code),
  },

  hcpcs: {
    pattern: /^[A-Z]\d{4}$/,
    format: (code: string) => code.replace(/[^A-Z0-9]/g, '').slice(0, 5),
    validate: (code: string) => /^[A-Z]\d{4}$/.test(code),
  },
};

class FormatMedicalCodeDirective extends Directive {
  lastCode = '';
  lastType: CodeType | undefined;
  cachedResult = '';

  render(code: string, type: CodeType, showValidation = false) {
    // Cache to avoid re-formatting
    if (this.lastCode === code && this.lastType === type) {
      return this.cachedResult;
    }

    this.lastCode = code;
    this.lastType = type;

    const formatter = CODE_FORMATS[type];
    const formatted = formatter.format(code);
    const isValid = formatter.validate(formatted);

    if (showValidation && !isValid) {
      this.cachedResult = html`
        <span class="medical-code medical-code--invalid" title="Invalid format">
          ${formatted} <span class="error-indicator">⚠</span>
        </span>
      `;
    } else {
      this.cachedResult = html`
        <span class="medical-code medical-code--${type}"> ${formatted} </span>
      `;
    }

    return this.cachedResult;
  }
}

export const formatMedicalCode = directive(FormatMedicalCodeDirective);

// Usage:
@customElement('hx-diagnosis-list')
export class HelixDiagnosisList extends LitElement {
  @property({ type: Array }) diagnoses: Array<{ code: string }> = [];

  override render() {
    return html`
      <ul class="diagnosis-list">
        ${this.diagnoses.map((dx) => html` <li>${formatMedicalCode(dx.code, 'icd10', true)}</li> `)}
      </ul>
    `;
  }
}
```

## Testing Custom Directives

Directives require specialized testing approaches since they operate at the template level.

### Unit Testing Directive Logic

Test directives in isolation using a minimal Lit component:

```typescript
// directives/format-mrn.test.ts
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { fixture } from '@helixui/library/test-utils';
import { expect } from '@esm-bundle/chai';
import { formatMRN } from './format-mrn.js';

@customElement('test-format-mrn')
class TestFormatMRN extends LitElement {
  @property() mrn = '';

  override render() {
    return html`<span>${formatMRN(this.mrn)}</span>`;
  }
}

describe('formatMRN directive', () => {
  it('formats valid 9-digit MRN', async () => {
    const el = await fixture<TestFormatMRN>(html`
      <test-format-mrn mrn="123456789"></test-format-mrn>
    `);

    const span = el.shadowRoot!.querySelector('span');
    expect(span?.textContent).to.equal('12-345-6789');
  });

  it('leaves invalid MRN unchanged', async () => {
    const el = await fixture<TestFormatMRN>(html`
      <test-format-mrn mrn="12345"></test-format-mrn>
    `);

    const span = el.shadowRoot!.querySelector('span');
    expect(span?.textContent).to.equal('12345');
  });

  it('updates when MRN changes', async () => {
    const el = await fixture<TestFormatMRN>(html`
      <test-format-mrn mrn="111111111"></test-format-mrn>
    `);

    const span = el.shadowRoot!.querySelector('span');
    expect(span?.textContent).to.equal('11-111-1111');

    el.mrn = '999999999';
    await el.updateComplete;

    expect(span?.textContent).to.equal('99-999-9999');
  });
});
```

### Testing Async Directives

Async directives need tests that handle timing and resource cleanup:

```typescript
// directives/timer.test.ts
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { fixture } from '@helixui/library/test-utils';
import { expect } from '@esm-bundle/chai';
import { timer } from './timer.js';

@customElement('test-timer')
class TestTimer extends LitElement {
  @property({ type: Number }) interval = 100;
  @property({ type: Boolean }) show = true;

  override render() {
    return html` ${this.show ? html`<span>${timer(this.interval)}</span>` : ''} `;
  }
}

describe('timer directive', () => {
  it('increments over time', async () => {
    const el = await fixture<TestTimer>(html` <test-timer interval="50"></test-timer> `);

    const span = el.shadowRoot!.querySelector('span');
    expect(span?.textContent).to.equal('0');

    // Wait for first tick
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(span?.textContent).to.equal('1');

    // Wait for second tick
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(span?.textContent).to.equal('2');
  });

  it('cleans up timer on disconnect', async () => {
    const el = await fixture<TestTimer>(html` <test-timer interval="50"></test-timer> `);

    const span = el.shadowRoot!.querySelector('span');

    // Wait for first tick
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(span?.textContent).to.equal('1');

    // Hide the timer
    el.show = false;
    await el.updateComplete;

    // Wait longer than interval
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Show again - should restart at 0
    el.show = true;
    await el.updateComplete;

    const newSpan = el.shadowRoot!.querySelector('span');
    expect(newSpan?.textContent).to.equal('0');
  });
});
```

### Integration Testing with Real Components

Test directives in the context of actual hx-library components:

```typescript
// components/hx-text-input/hx-text-input.test.ts
import { html } from 'lit';
import { fixture, shadowQuery } from '@helixui/library/test-utils';
import { expect } from '@esm-bundle/chai';
import { HelixTextInput } from './hx-text-input.js';

describe('hx-text-input with directives', () => {
  it('applies correct classes via classMap directive', async () => {
    const el = await fixture<HelixTextInput>(html`
      <hx-text-input error="Required" disabled></hx-text-input>
    `);

    const wrapper = shadowQuery(el, '.text-input');
    expect(wrapper?.classList.contains('text-input--error')).to.be.true;
    expect(wrapper?.classList.contains('text-input--disabled')).to.be.true;
  });

  it('uses ifDefined directive for optional attributes', async () => {
    const el = await fixture<HelixTextInput>(html` <hx-text-input></hx-text-input> `);

    const input = shadowQuery(el, 'input');
    expect(input?.hasAttribute('placeholder')).to.be.false;

    el.placeholder = 'Enter text';
    await el.updateComplete;

    expect(input?.getAttribute('placeholder')).to.equal('Enter text');
  });

  it('uses live directive to sync input value', async () => {
    const el = await fixture<HelixTextInput>(html`
      <hx-text-input value="initial"></hx-text-input>
    `);

    const input = shadowQuery(el, 'input') as HTMLInputElement;
    expect(input.value).to.equal('initial');

    // Programmatic update should sync
    el.value = 'updated';
    await el.updateComplete;

    expect(input.value).to.equal('updated');
  });
});
```

## Performance Considerations

Custom directives can impact rendering performance. Follow these guidelines for optimal performance.

### Minimize Directive Overhead

Each directive instance adds memory and CPU overhead. Use directives judiciously:

**Bad** — unnecessary directive for simple logic:

```typescript
// Don't create a directive for trivial logic
class UpperCaseDirective extends Directive {
  render(str: string) {
    return str.toUpperCase();
  }
}
```

**Good** — inline expression:

```typescript
render() {
  return html`<p>${this.name.toUpperCase()}</p>`;
}
```

### Cache Expensive Computations

Use `noChange` to prevent unnecessary re-renders:

```typescript
class ExpensiveFormatDirective extends Directive {
  lastInput = '';
  lastOutput = '';

  render(input: string, options: FormatOptions) {
    if (this.lastInput === input) {
      return noChange; // Skip expensive formatting
    }

    this.lastInput = input;
    this.lastOutput = this.expensiveFormat(input, options);
    return this.lastOutput;
  }

  private expensiveFormat(input: string, options: FormatOptions): string {
    // Complex formatting logic
    return input; // Simplified
  }
}
```

### Debounce Async Updates

Prevent excessive `setValue()` calls with debouncing:

```typescript
class DebouncedDirective extends AsyncDirective {
  debounceTimer?: number;

  render(value: string, delay = 300) {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      if (this.isConnected) {
        this.setValue(this.process(value));
      }
    }, delay);

    return noChange;
  }

  private process(value: string): string {
    return value;
  }

  disconnected() {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }
  }
}
```

### Limit DOM Access in update()

Reading DOM properties can trigger layout recalculation. Batch DOM reads and minimize frequency:

```typescript
class MeasureDirective extends Directive {
  lastWidth = 0;

  update(part: ChildPart) {
    const element = part.parentNode as HTMLElement;
    const currentWidth = element.offsetWidth;

    // Only update if dimension changed significantly
    if (Math.abs(currentWidth - this.lastWidth) > 10) {
      this.lastWidth = currentWidth;
      return this.render(currentWidth);
    }

    return noChange;
  }

  render(width: number) {
    return `Width: ${width}px`;
  }
}
```

### Use WeakMap for External State

Store state associated with external objects using `WeakMap` to prevent memory leaks:

```typescript
class ObserverDirective extends AsyncDirective {
  // WeakMap allows garbage collection
  private static observers = new WeakMap<object, MutationObserver>();

  render(element: Element, callback: (mutations: MutationRecord[]) => void) {
    let observer = ObserverDirective.observers.get(element);

    if (!observer) {
      observer = new MutationObserver(callback);
      observer.observe(element, { attributes: true, childList: true });
      ObserverDirective.observers.set(element, observer);
    }

    return noChange;
  }

  disconnected() {
    // Observer is automatically cleaned up when element is garbage collected
  }
}
```

## Best Practices Summary

1. **Use function directives for simple transformations** — No need for class-based directives for pure functions
2. **Return values from render() for SSR compatibility** — Perform DOM operations in `update()` only
3. **Always clean up resources in disconnected()** — Prevent memory leaks from timers, subscriptions, and connections
4. **Check isConnected before async updates** — Don't call `setValue()` on disconnected directives
5. **Validate usage with PartInfo** — Throw errors early if the directive is used incorrectly
6. **Use noChange for optimization** — Skip re-rendering when output hasn't changed
7. **Debounce expensive operations** — Reduce CPU usage for frequent updates
8. **Test directives in isolation and integration** — Unit tests for logic, integration tests for real-world usage
9. **Document directive behavior** — Include usage examples, arguments, and any constraints
10. **Consider composition over complexity** — Break complex directives into smaller, reusable pieces

## Next Steps

- Read the [Template Syntax Guide](/components/fundamentals/template-syntax) for foundational concepts
- Explore [Decorators Reference](/components/fundamentals/decorators) for reactive property management
- Review Lit's built-in directives: `classMap`, `styleMap`, `repeat`, `when`, `choose`, `until`, `asyncAppend`
- Examine hx-library component source code to see directive usage in production
- Experiment with creating custom directives for your specific use cases

Custom directives are a powerful tool in your Lit development toolkit. They enable you to abstract complex template logic into reusable, testable functions that feel like native Lit features. When used appropriately, they improve code quality, maintainability, and developer experience across your entire component library.
