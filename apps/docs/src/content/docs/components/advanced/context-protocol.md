---
title: Context Protocol
description: Sharing data between ancestor and descendant components without prop-drilling using @lit/context.
---

When a piece of data is needed by components deep in a tree, threading it through every intermediate component via properties is brittle and verbose. The `@lit/context` package solves this with a typed provider/consumer protocol built on the browser's native event system. It works across shadow DOM boundaries, requires no global store, and integrates directly with Lit's reactive update cycle. This guide covers the full API, shadow DOM traversal mechanics, practical healthcare patterns, and testing strategies.

## Installing @lit/context

```bash
npm install @lit/context
```

The package ships its own TypeScript declarations. The minimum Lit version is 3.0.

## The Core Concept

Context is a provider/consumer pattern. A provider component holds a value and makes it available to any descendant that requests it. Consumers declare interest in a context by key. When a consumer connects to the DOM, it dispatches a context-request event that bubbles up the tree. The nearest ancestor providing that context intercepts the event and fulfills the request.

The mechanism deliberately mirrors dependency injection: consumers do not need to know where the data comes from, and providers do not need to know how many consumers exist or where they are.

```
hx-theme-provider (provides: ThemeContext)
  └── hx-card
        └── hx-card-header
              └── hx-badge  <-- consumes ThemeContext without prop drilling
```

## createContext()

Every context has a key. The key is an opaque value used to match providers with consumers. The canonical approach is to create the key with `createContext()`:

```typescript
import { createContext } from '@lit/context';

// The type parameter determines what value the context carries
export const themeContext = createContext<'light' | 'dark'>('hx-theme');
```

The string argument (`'hx-theme'`) is the runtime key. It must be unique within the application. Using namespaced strings prevents collisions when multiple libraries use context:

```typescript
// Good: namespaced key
export const formContext = createContext<FormContextValue>('hx-form-context');

// Risky: generic key could collide
export const formContext = createContext<FormContextValue>('form');
```

For situations where you need guaranteed uniqueness, use a `Symbol`:

```typescript
export const radioGroupContext = createContext<RadioGroupContext>(Symbol('hx-radio-group-context'));
```

Symbols are unique by identity, so two different modules can each call `Symbol('hx-radio-group-context')` and they will never match — which is usually what you want for library-internal contexts.

### Typing the context value

The generic type passed to `createContext<T>()` is enforced at every provider and consumer site. If you try to provide a `string` where the context expects `ThemeValue`, TypeScript will error:

```typescript
interface ThemeValue {
  mode: 'light' | 'dark';
  primaryColor: string;
  fontScale: number;
}

export const themeContext = createContext<ThemeValue>('hx-theme');
// Providers must supply ThemeValue; consumers receive ThemeValue
```

---

## ContextProvider Controller

The `ContextProvider` controller makes a component provide a context value. The controller handles the event system automatically: it listens for `context-request` events, matches them against the registered context key, and responds with the current value.

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';
import { themeContext, type ThemeValue } from './theme-context.js';

@customElement('hx-theme-provider')
export class HelixThemeProvider extends LitElement {
  @property({ type: String })
  mode: 'light' | 'dark' = 'light';

  @property({ type: String, attribute: 'primary-color' })
  primaryColor = '#2563EB';

  // The provider holds the current context value
  private _themeProvider = new ContextProvider(this, {
    context: themeContext,
    initialValue: {
      mode: this.mode,
      primaryColor: this.primaryColor,
      fontScale: 1,
    },
  });

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);

    // Push a new value whenever the relevant properties change
    if (changed.has('mode') || changed.has('primaryColor')) {
      this._themeProvider.setValue({
        mode: this.mode,
        primaryColor: this.primaryColor,
        fontScale: 1,
      });
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}
```

`ContextProvider.setValue()` notifies all subscribed consumers synchronously, causing them to re-render with the new value.

---

## ContextConsumer Controller

The `ContextConsumer` controller lets a component receive a context value from an ancestor provider.

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import { themeContext } from './theme-context.js';

@customElement('hx-themed-badge')
export class HelixThemedBadge extends LitElement {
  // subscribe: true — component re-renders when context value changes
  private _theme = new ContextConsumer(this, {
    context: themeContext,
    subscribe: true,
  });

  override render() {
    // _theme.value is ThemeValue | undefined (undefined if no provider found)
    const mode = this._theme.value?.mode ?? 'light';

    return html`
      <span part="badge" class="badge badge--${mode}">
        <slot></slot>
      </span>
    `;
  }
}
```

When `subscribe: true`, the consumer registers as a subscriber. The provider retains a reference to all subscribers and calls their callback when `setValue()` is called. This triggers a `requestUpdate()` on each consumer, causing re-renders.

Without `subscribe: true`, the consumer receives the value once at connection time and does not update when the provider's value changes. Use this for values that are set once at boot (e.g., application configuration).

---

## @provide() and @consume() Decorators

For the common case where context maps directly to a reactive property, the decorator API is more concise than the controller API.

### @provide() decorator

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { themeContext } from './theme-context.js';

@customElement('hx-theme-provider')
export class HelixThemeProvider extends LitElement {
  // @provide links this property to the context key
  // When the property changes, the context value updates automatically
  @provide({ context: themeContext })
  @property({ type: String })
  theme: 'light' | 'dark' = 'light';

  override render() {
    return html`<slot></slot>`;
  }
}
```

When you use `@provide()` on a reactive property, the context value is always in sync with the property. Lit's property change detection handles the update cycle — no manual `setValue()` call is needed.

### @consume() decorator

```typescript
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { themeContext } from './theme-context.js';

@customElement('hx-themed-card')
export class HelixThemedCard extends LitElement {
  // @consume links an internal state property to the context value
  // subscribe: true causes re-render when the provider pushes a new value
  @consume({ context: themeContext, subscribe: true })
  @state()
  private _theme: 'light' | 'dark' = 'light';

  override render() {
    return html`
      <div part="card" class="card card--${this._theme}">
        <slot></slot>
      </div>
    `;
  }
}
```

The `@consume()` decorator and `@state()` work together: `@consume()` keeps the property updated from context, and `@state()` ensures changes to it trigger re-renders.

### Decorator vs. controller API

| Situation                                                      | Recommendation                                          |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| Context maps 1:1 to a reactive property                        | Use `@provide()` / `@consume()` decorators              |
| Provider needs logic before updating consumers                 | Use `ContextProvider` controller directly               |
| Consumer needs to react with a callback rather than a property | Use `ContextConsumer` controller with `callback` option |
| Multiple contexts consumed in one component                    | Either approach works; decorators are more readable     |

---

## How Context Flows Through Shadow DOM

This is the most important behavior to understand. Context is built on the DOM event system. When a consumer connects, it fires a `context-request` event:

```typescript
// Internal to @lit/context — this is what the consumer does
this.dispatchEvent(new ContextRequestEvent(this.context, callback, subscribe));
```

This event bubbles up the DOM tree. Critically, it uses `composed: true`, which means it **crosses shadow DOM boundaries**. A provider in the light DOM can supply context to a consumer inside a shadow DOM, and vice versa.

The provider listens for `context-request` events on itself (via `addEventListener` in `hostConnected`). When it receives one whose context key matches, it calls the callback with the current value.

```
document
  └── hx-form [provides: formContext]     ← provider intercepts event here
        └── (shadow root)
              └── slot
  └── hx-text-input [consumes: formContext]
        └── (shadow root)                 ← event fires here (composed: true)
              └── input
```

The event bubbles from inside the consumer's shadow root, crosses the shadow boundary, continues up through the composed tree, and reaches the provider. The provider does not need to be a direct parent — it just needs to be an ancestor in the composed tree.

This is why context works in Drupal Twig templates where components are mixed with arbitrary HTML nesting. The event traversal is topology-independent.

---

## Practical Example: Form Context

The most valuable application of context in hx-library is form coordination. `hx-form` provides form-wide state (disabled status, validation mode, name prefix) to all descendant form controls without prop drilling.

### Define the context

```typescript
// packages/hx-library/src/contexts/form-context.ts

import { createContext } from '@lit/context';

export interface FormContextValue {
  /** When true, all form controls are disabled */
  disabled: boolean;
  /** Validation mode: validate on blur, on input, or on submit only */
  validationMode: 'onblur' | 'oninput' | 'onsubmit';
  /** Optional name prefix for nested form field naming (e.g., "patient." prefix) */
  namePrefix: string;
  /** Called by controls when their validity changes */
  notifyValidityChange(name: string, valid: boolean): void;
}

export const formContext = createContext<FormContextValue>(Symbol('hx-form-context'));
```

### Provider: hx-form

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';
import { formContext, type FormContextValue } from '../../contexts/form-context.js';

@customElement('hx-form')
export class HelixForm extends LitElement {
  // Light DOM — no shadow root
  override createRenderRoot(): HTMLElement {
    return this;
  }

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String, attribute: 'validation-mode' })
  validationMode: FormContextValue['validationMode'] = 'onblur';

  @property({ type: String, attribute: 'name-prefix' })
  namePrefix = '';

  @state()
  private _fieldValidity = new Map<string, boolean>();

  private _formProvider = new ContextProvider(this, {
    context: formContext,
    initialValue: this._buildContextValue(),
  });

  private _buildContextValue(): FormContextValue {
    return {
      disabled: this.disabled,
      validationMode: this.validationMode,
      namePrefix: this.namePrefix,
      notifyValidityChange: (name, valid) => {
        this._fieldValidity.set(name, valid);
        // Optionally dispatch a form-level validity event
      },
    };
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);

    const contextProps: (keyof HelixForm)[] = ['disabled', 'validationMode', 'namePrefix'];
    if (contextProps.some((p) => changed.has(p))) {
      this._formProvider.setValue(this._buildContextValue());
    }
  }

  /** Returns true if all registered fields are valid */
  checkValidity(): boolean {
    return Array.from(this._fieldValidity.values()).every(Boolean);
  }

  override render() {
    return html`
      <form part="form" @submit=${this._handleSubmit} novalidate>
        <slot></slot>
      </form>
    `;
  }

  private _handleSubmit(e: SubmitEvent): void {
    e.preventDefault();

    if (!this.checkValidity()) {
      this.dispatchEvent(
        new CustomEvent('hx-invalid', {
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent('hx-submit', {
        bubbles: true,
        composed: true,
        detail: { formData: new FormData(e.target as HTMLFormElement) },
      }),
    );
  }
}
```

### Consumer: hx-text-input

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import { live } from 'lit/directives/live.js';
import { formContext, type FormContextValue } from '../../contexts/form-context.js';

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: String })
  label = '';

  @property({ type: String })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  required = false;

  // Subscribe to form context — re-renders when form disables or changes mode
  private _formCtx = new ContextConsumer(this, {
    context: formContext,
    subscribe: true,
  });

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  /** Effective disabled: own property OR form context disabled */
  private get _effectivelyDisabled(): boolean {
    return this.disabled || (this._formCtx.value?.disabled ?? false);
  }

  /** Full field name, accounting for form context namePrefix */
  private get _fullName(): string {
    const prefix = this._formCtx.value?.namePrefix ?? '';
    return prefix ? `${prefix}${this.name}` : this.name;
  }

  private _handleInput(e: Event): void {
    if (this._effectivelyDisabled) return;

    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);
    this._updateValidity();

    // If form wants to validate on input, trigger now
    const mode = this._formCtx.value?.validationMode;
    if (mode === 'oninput') {
      this._internals.reportValidity();
    }

    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, name: this._fullName },
      }),
    );
  }

  private _handleBlur(): void {
    const mode = this._formCtx.value?.validationMode;
    if (mode === 'onblur') {
      this._internals.reportValidity();
    }
  }

  private _updateValidity(): void {
    if (this.required && !this.value.trim()) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.');
    } else {
      this._internals.setValidity({});
    }

    // Notify the form of our current validity
    this._formCtx.value?.notifyValidityChange(this._fullName, this._internals.validity.valid);
  }

  override render() {
    const isDisabled = this._effectivelyDisabled;

    return html`
      <div part="field">
        <slot name="label">
          ${this.label
            ? html`
                <label part="label">
                  ${this.label}
                  ${this.required ? html`<span aria-hidden="true"> *</span>` : nothing}
                </label>
              `
            : nothing}
        </slot>

        <input
          part="input"
          name=${this._fullName}
          .value=${live(this.value)}
          ?disabled=${isDisabled}
          ?required=${this.required}
          @input=${this._handleInput}
          @blur=${this._handleBlur}
        />
      </div>
    `;
  }
}
```

Usage in a Twig template (Drupal):

```html
<!-- Twig: patient_intake.html.twig -->
<hx-form name-prefix="patient." validation-mode="onblur">
  <hx-text-input label="First Name" name="first_name" required></hx-text-input>
  <hx-text-input label="Last Name" name="last_name" required></hx-text-input>
  <hx-text-input label="Date of Birth" name="dob" type="date" required></hx-text-input>

  <hx-button type="submit" variant="primary">Submit</hx-button>
</hx-form>
```

Setting `disabled` on `hx-form` propagates to all inputs via context — no `disabled` attribute on each input required. The `name-prefix="patient."` means the inputs submit as `patient.first_name`, `patient.last_name`, and `patient.dob`.

---

## Practical Example: Theme Context

```typescript
// packages/hx-library/src/contexts/theme-context.ts

import { createContext } from '@lit/context';

export type ColorMode = 'light' | 'dark' | 'high-contrast';

export interface ThemeContextValue {
  mode: ColorMode;
  /** CSS custom property map for dynamic theming */
  tokens: Record<string, string>;
}

export const themeContext = createContext<ThemeContextValue>('hx-theme');
```

```typescript
// hx-app-shell.ts — top-level provider

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import {
  themeContext,
  type ThemeContextValue,
  type ColorMode,
} from '../../contexts/theme-context.js';

const TOKEN_MAPS: Record<ColorMode, Record<string, string>> = {
  light: {
    '--hx-color-primary': '#2563EB',
    '--hx-color-surface': '#FFFFFF',
    '--hx-color-text-primary': '#111827',
  },
  dark: {
    '--hx-color-primary': '#3B82F6',
    '--hx-color-surface': '#111827',
    '--hx-color-text-primary': '#F9FAFB',
  },
  'high-contrast': {
    '--hx-color-primary': '#0000EE',
    '--hx-color-surface': '#FFFFFF',
    '--hx-color-text-primary': '#000000',
  },
};

@customElement('hx-app-shell')
export class HelixAppShell extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }
  `;

  @provide({ context: themeContext })
  @property({ type: Object })
  theme: ThemeContextValue = {
    mode: 'light',
    tokens: TOKEN_MAPS.light,
  };

  setMode(mode: ColorMode): void {
    this.theme = { mode, tokens: TOKEN_MAPS[mode] };
  }

  override render() {
    return html`<slot></slot>`;
  }
}
```

Any descendant can consume the theme:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { state } from 'lit/decorators.js';
import { themeContext, type ThemeContextValue } from '../../contexts/theme-context.js';

@customElement('hx-nav-bar')
export class HelixNavBar extends LitElement {
  @consume({ context: themeContext, subscribe: true })
  @state()
  private _theme: ThemeContextValue = { mode: 'light', tokens: {} };

  override render() {
    return html`
      <nav part="nav" class="nav nav--${this._theme.mode}">
        <slot></slot>
      </nav>
    `;
  }
}
```

---

## Testing Context

Testing context requires both a provider and a consumer in the same fixture. You can nest them as real components:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { provide, consume } from '@lit/context';
import { createContext } from '@lit/context';
import { fixture, cleanup } from '../../test-utils.js';

// Define a test-only context
interface TestValue {
  count: number;
}
const testContext = createContext<TestValue>('test-ctx');

// Minimal provider for tests
@customElement('test-provider')
class TestProvider extends LitElement {
  @provide({ context: testContext })
  @property({ type: Object })
  value: TestValue = { count: 0 };

  override render() {
    return html`<slot></slot>`;
  }
}

// Minimal consumer for tests
@customElement('test-consumer')
class TestConsumer extends LitElement {
  @consume({ context: testContext, subscribe: true })
  @state()
  contextValue: TestValue | undefined;

  override render() {
    return html`<span id="count">${this.contextValue?.count ?? 'none'}</span>`;
  }
}

describe('context protocol', () => {
  afterEach(cleanup);

  it('consumer receives initial provider value', async () => {
    const el = await fixture<TestProvider>(html`
      <test-provider .value=${{ count: 42 }}>
        <test-consumer></test-consumer>
      </test-provider>
    `);

    await el.updateComplete;

    const consumer = el.querySelector('test-consumer')!;
    await consumer.updateComplete;

    const span = consumer.shadowRoot!.querySelector('#count');
    expect(span?.textContent?.trim()).toBe('42');
  });

  it('consumer updates when provider value changes', async () => {
    const el = await fixture<TestProvider>(html`
      <test-provider .value=${{ count: 0 }}>
        <test-consumer></test-consumer>
      </test-provider>
    `);

    const consumer = el.querySelector('test-consumer')!;
    await el.updateComplete;
    await consumer.updateComplete;

    // Change the provider value
    el.value = { count: 99 };
    await el.updateComplete;
    await consumer.updateComplete;

    const span = consumer.shadowRoot!.querySelector('#count');
    expect(span?.textContent?.trim()).toBe('99');
  });

  it('consumer falls back gracefully when no provider exists', async () => {
    // No provider in the fixture — consumer gets undefined
    const consumer = await fixture<TestConsumer>(html`<test-consumer></test-consumer>`);

    await consumer.updateComplete;

    const span = consumer.shadowRoot!.querySelector('#count');
    expect(span?.textContent?.trim()).toBe('none');
  });
});
```

### Testing with real hx-form + hx-text-input

```typescript
describe('hx-form context propagation', () => {
  afterEach(cleanup);

  it('disables all inputs when form is disabled', async () => {
    const form = await fixture<HelixForm>(html`
      <hx-form disabled>
        <hx-text-input label="Name" name="name"></hx-text-input>
        <hx-text-input label="Email" name="email"></hx-text-input>
      </hx-form>
    `);

    await form.updateComplete;

    const inputs = form.querySelectorAll('hx-text-input');
    for (const input of Array.from(inputs)) {
      await (input as LitElement).updateComplete;
      const nativeInput = (input as LitElement).shadowRoot?.querySelector('input');
      expect(nativeInput?.disabled).toBe(true);
    }
  });

  it('prefixes field names from name-prefix attribute', async () => {
    const form = await fixture<HelixForm>(html`
      <hx-form name-prefix="patient.">
        <hx-text-input label="First Name" name="first_name"></hx-text-input>
      </hx-form>
    `);

    await form.updateComplete;

    const input = form.querySelector('hx-text-input')!;
    await (input as LitElement).updateComplete;

    const nativeInput = (input as LitElement).shadowRoot?.querySelector('input');
    expect(nativeInput?.name).toBe('patient.first_name');
  });
});
```

---

## Context vs. Custom Events for Communication

Both context and custom events are valid communication mechanisms. The choice depends on the direction and frequency of the data flow.

| Scenario                                                       | Use                            | Reason                                                                                     |
| -------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| Ancestor to many descendants (one-to-many, top-down)           | Context                        | Avoids repeating the same prop on every intermediate element                               |
| Child notifying parent of an action (one-to-one, bottom-up)    | Custom event                   | Simpler, no provider setup needed                                                          |
| Sibling-to-sibling communication                               | Custom event via shared parent | Context is for hierarchy; events work with a parent listener                               |
| Infrequently changing shared config (theme, locale, form meta) | Context                        | Context subscribers batch efficiently; events are fire-and-forget                          |
| Frequently changing values (mouse position, scroll)            | Neither — use a controller     | Context and events both cause re-renders; a controller with requestUpdate is more targeted |
| Components outside a common ancestor                           | Global store or URL params     | Context requires ancestry; events require a shared parent                                  |

---

## Context vs. @lit/context vs. Custom Event-Based Provider

The [Composition Patterns](/components/advanced/composition-patterns) guide shows a custom event-based provider (the `hx-theme-provider` example using `querySelectorAll` and a dispatch loop). `@lit/context` is strictly better for this use case:

| Aspect                  | Custom event loop                     | @lit/context                            |
| ----------------------- | ------------------------------------- | --------------------------------------- |
| Shadow DOM traversal    | Only light DOM descendants            | Crosses shadow boundaries automatically |
| TypeScript types        | Manual casting                        | Fully generic and type-safe             |
| Subscription management | Manual tracking                       | Automatic via context protocol          |
| Disconnection cleanup   | Must implement manually               | Handled by the controller lifecycle     |
| Performance             | Loops all descendants on every change | Only notifies registered subscribers    |

Use `@lit/context` for any new provider/consumer patterns. The custom event approach is shown in the composition guide only for conceptual illustration.

---

## Common Pitfalls

### Consumer using subscribe: false misses updates

Without `subscribe: true`, the consumer receives the value once at connection time and never again:

```typescript
// Wrong for mutable context values
private _ctx = new ContextConsumer(this, {
  context: formContext,
  subscribe: false, // Default — does not re-render on provider changes
});

// Correct
private _ctx = new ContextConsumer(this, {
  context: formContext,
  subscribe: true,
});
```

### Symbol keys across module instances

If two modules create `Symbol('same-description')`, they get different symbols. This will silently cause context not to match:

```typescript
// module-a.ts
export const ctx = createContext<string>(Symbol('my-context'));

// module-b.ts — different Symbol, won't match module-a's context
const ctx = createContext<string>(Symbol('my-context'));
```

Always import context objects from a single shared module.

### Forgetting @state() with @consume()

Without `@state()`, changes to the consumed property don't trigger re-renders:

```typescript
// Wrong — re-renders won't happen when context changes
@consume({ context: themeContext, subscribe: true })
private _theme: ThemeValue | undefined;

// Correct
@consume({ context: themeContext, subscribe: true })
@state()
private _theme: ThemeValue | undefined;
```

### Providing an object reference that mutates

Context comparison is by reference. Mutating a provided object without replacing the reference will not notify subscribers:

```typescript
// Wrong — subscribers don't see this change
this._provider.setValue(this._buildContextValue());
// ...later:
contextValue.disabled = true; // Mutation — subscribers not notified

// Correct — always replace the object
this._provider.setValue({ ...this._provider.value, disabled: true });
```

---

## References

- [@lit/context on npm](https://www.npmjs.com/package/@lit/context)
- [Lit — Context documentation](https://lit.dev/docs/data/context/)
- [Context Community Protocol spec](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md)
- [Reactive Controllers](/components/advanced/controllers) — the controller pattern context is built on
- [State Management](/components/advanced/state-management) — for comparison with other state patterns
- [Component Composition Patterns](/components/advanced/composition-patterns) — slot-based and event-based alternatives
