---
title: Composing Higher-Order Components
description: Build new components by wrapping multiple HELiX components using slots and light DOM composition. Covers the SearchBar pattern, AdoptedStylesheetsController, ReactiveController authoring, property and event forwarding, and when to choose composition over inheritance.
sidebar:
  order: 5
  badge:
    text: Advanced
    variant: note
---

Composition is how enterprise teams build application-specific components on top of HELiX without inheriting maintenance risk. Rather than subclassing `hx-text-input` and adding a button, you write a new Lit element that _contains_ `hx-text-input` and `hx-button` as children — and then bridges their APIs to the outside world.

This guide walks through that pattern from first principles: a working `org-search-bar` component, an `AdoptedStylesheetsController` for injecting shared styles, and two `ReactiveController` recipes for form validation orchestration and keyboard shortcut registration.

---

## When Composition Is the Right Choice

Three signals indicate that composition is preferable to inheritance:

| Signal | Why composition wins |
|---|---|
| You need to combine **multiple** HELiX components | Inheritance gives you one parent class; composition lets you host as many components as you need |
| The base component's API is too opinionated | Subclassing inherits all public properties and their defaults — composition lets you expose only what your use case requires |
| You are targeting **multiple frameworks** | A composed Lit element works natively in React, Vue, Angular, and Twig; a subclass can trigger quirks with framework-specific element wrappers |

**Inherit** when you need to add reactive properties that change the rendering of a single HELiX component (see [Extending HELiX Components](/extending/)).

**Compose** when you are combining components, hiding complexity behind a narrower API, or building for cross-framework consumption.

---

## The SearchBar Pattern

`org-search-bar` wraps an `hx-text-input` and an `hx-button` into a single element. The outer component owns the query string, forwards it to the input, and emits an `org-search` event when the user submits.

### File Structure

```text
src/components/org-search-bar/
  index.ts
  org-search-bar.ts
  org-search-bar.styles.ts
```

### Component Source

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styles } from './org-search-bar.styles.js';
import '@helixui/library/components/hx-text-input';
import '@helixui/library/components/hx-button';

export interface OrgSearchDetail {
  query: string;
}

/**
 * A search bar that composes hx-text-input and hx-button.
 *
 * @element org-search-bar
 * @summary Combines a text input and a submit button into a single search control.
 *
 * @fires {CustomEvent<OrgSearchDetail>} org-search - Fired when the user submits
 *   the search query. bubbles: true, composed: true.
 *
 * @cssprop [--org-search-bar-gap=var(--hx-spacing-sm)] - Gap between the input and button.
 * @cssprop [--org-search-bar-width=100%] - Width of the search bar container.
 */
@customElement('org-search-bar')
export class OrgSearchBar extends LitElement {
  static styles = styles;

  /** The current search query value. Reflects to the input's value property. */
  @property({ type: String }) value = '';

  /** Label text for the internal text input. */
  @property({ type: String }) label = 'Search';

  /** Placeholder text for the internal text input. */
  @property({ type: String }) placeholder = '';

  /** Disables both the input and the button. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Shows a loading spinner on the submit button. */
  @property({ type: Boolean, reflect: true }) loading = false;

  /** Label for the submit button. */
  @property({ type: String }) submitLabel = 'Search';

  @query('hx-text-input') private _input!: HTMLElement & { value: string };

  private _handleInput(e: Event): void {
    const target = e.target as HTMLElement & { value: string };
    this.value = target.value;
  }

  private _handleSubmit(): void {
    if (this.disabled || this.loading) return;

    this.dispatchEvent(
      new CustomEvent<OrgSearchDetail>('org-search', {
        bubbles: true,
        composed: true,
        detail: { query: this.value.trim() },
      }),
    );
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this._handleSubmit();
    }
  }

  render() {
    return html`
      <div part="container">
        <hx-text-input
          part="input"
          label=${this.label}
          placeholder=${this.placeholder || nothing}
          .value=${this.value}
          ?disabled=${this.disabled}
          @hx-input=${this._handleInput}
          @keydown=${this._handleKeydown}
        ></hx-text-input>
        <hx-button
          part="button"
          variant="primary"
          ?disabled=${this.disabled}
          ?loading=${this.loading}
          @hx-click=${this._handleSubmit}
        >
          ${this.submitLabel}
        </hx-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'org-search-bar': OrgSearchBar;
  }
}
```

### Styles

```typescript
// org-search-bar.styles.ts
import { css } from 'lit';

export const styles = css`
  :host {
    --_gap: var(--org-search-bar-gap, var(--hx-spacing-sm));
    --_width: var(--org-search-bar-width, 100%);

    display: block;
    width: var(--_width);
  }

  [part='container'] {
    display: flex;
    align-items: flex-end;
    gap: var(--_gap);
  }

  hx-text-input {
    flex: 1 1 0%;
    min-width: 0;
  }

  hx-button {
    flex: 0 0 auto;
  }
`;
```

### Usage

```html
<org-search-bar
  label="Search patients"
  placeholder="Enter name or MRN"
  submit-label="Search"
></org-search-bar>
```

```javascript
document.querySelector('org-search-bar').addEventListener('org-search', (e) => {
  const { query } = e.detail;
  patientDirectory.search(query);
});
```

---

## Forwarding Properties Through the Composition Boundary

Composed components are responsible for bridging their own public API to the components they host internally. There are two mechanisms.

### Forwarding via Lit Property Bindings

The most direct path. Bind your outer properties directly to the inner component's properties in the template:

```typescript
// Outer property
@property({ type: String }) placeholder = '';

// Inner binding in render()
html`
  <hx-text-input
    placeholder=${this.placeholder || nothing}
  ></hx-text-input>
`;
```

Use `nothing` (from `lit`) instead of an empty string when a property should be omitted entirely. Binding an empty string to `placeholder` renders a visible empty placeholder; `nothing` skips the attribute completely.

### Forwarding via `exportparts`

CSS `::part()` selectors stop at shadow boundaries. When `org-search-bar` hosts `hx-text-input` internally, an external stylesheet cannot write:

```css
/* DOES NOT REACH through org-search-bar's shadow DOM */
org-search-bar hx-text-input::part(input) { ... }
```

Use `exportparts` in the template to forward named parts outward:

```typescript
render() {
  return html`
    <hx-text-input
      exportparts="input, label, input-wrapper, error"
    ></hx-text-input>
    <hx-button
      exportparts="button, label: button-label"
    ></hx-button>
  `;
}
```

With `exportparts` declared, external consumers can now write:

```css
/* Reaches the native <input> inside hx-text-input, through org-search-bar */
org-search-bar::part(input) {
  font-size: var(--hx-font-size-lg);
}

/* Renamed export: button-label refers to hx-button's 'label' part */
org-search-bar::part(button-label) {
  letter-spacing: 0.04em;
}
```

### Forwarding Events

Your composed component re-emits events from internal components after transforming them into your component's public API. Always set `bubbles: true, composed: true` so the event crosses shadow boundaries:

```typescript
private _handleInput(e: Event): void {
  // Consume the internal hx-input event.
  e.stopPropagation();

  const target = e.target as HTMLElement & { value: string };
  this.value = target.value;

  // Re-emit as your component's public event.
  this.dispatchEvent(
    new CustomEvent('org-search-input', {
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    }),
  );
}
```

Stopping propagation on the internal event (`e.stopPropagation()`) prevents `hx-input` from leaking out of the composition boundary as an unintended side-effect.

---

## AdoptedStylesheetsController

`AdoptedStylesheetsController` is a Lit `ReactiveController` that injects a `CSSStyleSheet` into a document or shadow root via the Adopted Stylesheets API. It handles global deduplication and reference counting so the same stylesheet is never created twice.

### Import Path

```typescript
import { AdoptedStylesheetsController } from '@helixui/library/controllers/adopted-stylesheets';
```

### Injecting Shared Styles at the Document Level

The most common use is injecting a shared stylesheet into `document` when your composed component needs styles that live outside the shadow DOM — for example, focus-ring utilities or page-level layout helpers:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { AdoptedStylesheetsController } from '@helixui/library/controllers/adopted-stylesheets';

const SHARED_CSS = `
  .org-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`;

@customElement('org-search-bar')
export class OrgSearchBar extends LitElement {
  // Injects SHARED_CSS into document.adoptedStyleSheets on hostConnected,
  // and removes it (ref-counted) on hostDisconnected.
  private _sharedStyles = new AdoptedStylesheetsController(
    this,
    SHARED_CSS,
    document,
  );

  // ...
}
```

### Injecting Styles into the Shadow Root

Pass `this.shadowRoot` as the third argument to scope the injected stylesheet to the component's own shadow root:

```typescript
// Injected into this component's shadow DOM — does not affect document.
private _shadowStyles = new AdoptedStylesheetsController(
  this,
  `:host { --_transition: var(--hx-transition-fast, 150ms ease); }`,
  this.shadowRoot!,
);
```

This pattern is useful for styles that depend on runtime values (e.g., dynamic theme tokens) or that you generate programmatically and do not want to ship as a static `css` tagged template.

### Deduplication Guarantee

`AdoptedStylesheetsController` uses a static `Map` keyed on `cssText` to ensure each unique stylesheet is created only once, even when hundreds of instances of the same component exist on the page. A companion reference counter removes the stylesheet from the root only when the last live instance disconnects.

You do not need to manage this manually — instantiate the controller and let it handle the lifecycle.

---

## ReactiveController Recipe

A `ReactiveController` is the Lit mechanism for extracting cross-cutting behaviors out of the component class into a reusable, testable object. The interface is minimal:

```typescript
interface ReactiveController {
  hostConnected?(): void;
  hostDisconnected?(): void;
  hostUpdate?(): void;
  hostUpdated?(): void;
}
```

### Recipe 1: Form Validation Orchestration

When your composed component hosts multiple form inputs, a controller can orchestrate their validation state in one place:

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface FieldConfig {
  name: string;
  required?: boolean;
  minLength?: number;
}

export class FormValidationController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & HTMLElement;
  private readonly _fields: FieldConfig[];
  private _errors = new Map<string, string>();

  constructor(host: ReactiveControllerHost & HTMLElement, fields: FieldConfig[]) {
    this._host = host;
    this._fields = fields;
    this._host.addController(this);
  }

  hostConnected(): void {
    this._host.addEventListener('hx-change', this._handleChange);
  }

  hostDisconnected(): void {
    this._host.removeEventListener('hx-change', this._handleChange);
  }

  private _handleChange = (e: Event): void => {
    const target = e.target as HTMLElement & { name?: string; value?: string };
    const name = target.name ?? '';
    const value = target.value ?? '';
    const config = this._fields.find((f) => f.name === name);

    if (!config) return;

    const error = this._validate(value, config);

    if (error) {
      this._errors.set(name, error);
    } else {
      this._errors.delete(name);
    }

    this._host.requestUpdate();
  };

  private _validate(value: string, config: FieldConfig): string | null {
    if (config.required && value.trim().length === 0) {
      return `${config.name} is required`;
    }

    if (config.minLength !== undefined && value.length < config.minLength) {
      return `${config.name} must be at least ${config.minLength} characters`;
    }

    return null;
  }

  get valid(): boolean {
    return this._errors.size === 0;
  }

  errorFor(name: string): string | undefined {
    return this._errors.get(name);
  }
}
```

Use it in your component:

```typescript
@customElement('org-patient-search')
export class OrgPatientSearch extends LitElement {
  private _validation = new FormValidationController(this, [
    { name: 'query', required: true, minLength: 2 },
  ]);

  render() {
    const queryError = this._validation.errorFor('query');

    return html`
      <hx-text-input
        name="query"
        label="Search"
        .error=${queryError ?? ''}
      ></hx-text-input>
      <hx-button
        variant="primary"
        ?disabled=${!this._validation.valid}
        @hx-click=${this._submit}
      >
        Search
      </hx-button>
    `;
  }

  private _submit(): void {
    if (!this._validation.valid) return;
    // ...
  }
}
```

### Recipe 2: Keyboard Shortcut Registration

A controller that registers and cleans up a keyboard shortcut — useful for composed components that expose a focus shortcut to users:

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface ShortcutConfig {
  /** Key combination, e.g. 'k', 'Escape', '/' */
  key: string;
  /** Require Cmd (Mac) or Ctrl (Windows/Linux) to be held */
  meta?: boolean;
  callback: () => void;
}

export class KeyboardShortcutController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & HTMLElement;
  private readonly _shortcuts: ShortcutConfig[];

  constructor(host: ReactiveControllerHost & HTMLElement, shortcuts: ShortcutConfig[]) {
    this._host = host;
    this._shortcuts = shortcuts;
    this._host.addController(this);
  }

  hostConnected(): void {
    window.addEventListener('keydown', this._handleKeydown);
  }

  hostDisconnected(): void {
    window.removeEventListener('keydown', this._handleKeydown);
  }

  private _handleKeydown = (e: KeyboardEvent): void => {
    for (const shortcut of this._shortcuts) {
      const metaMatch = !shortcut.meta || e.metaKey || e.ctrlKey;
      const keyMatch = e.key === shortcut.key;

      if (metaMatch && keyMatch) {
        e.preventDefault();
        shortcut.callback();
        return;
      }
    }
  };
}
```

Register it in `org-search-bar` so pressing `Cmd+K` (or `Ctrl+K`) focuses the search input:

```typescript
@customElement('org-search-bar')
export class OrgSearchBar extends LitElement {
  @query('hx-text-input') private _input!: HTMLElement & { focus: () => void };

  private _shortcuts = new KeyboardShortcutController(this, [
    {
      key: 'k',
      meta: true,
      callback: () => this._input?.focus(),
    },
  ]);

  // ...
}
```

---

## Composition vs. Inheritance: Decision Guide

```text
Does the new component wrap multiple HELiX components?
│
├─ YES → Use composition
│         Build a new LitElement that hosts hx-* as children.
│         Forward properties via Lit bindings.
│         Forward parts via exportparts.
│         Forward events by consuming and re-emitting.
│
└─ NO → Does it add behavior to a single HELiX component?
         │
         ├─ YES, behavior is purely presentational (new visual state, new CSS token) →
         │        Use CSS custom properties or ::part() selectors — no new element needed
         │
         ├─ YES, behavior is additive (new property, new event, new render state) →
         │        Use inheritance (extends HxFoo)
         │        See Extending HELiX Components
         │
         └─ YES, base API is too opinionated or you are targeting multiple frameworks →
                  Use composition even for a single component
                  Expose only the properties your use case requires
```

### Quick Comparison

| Concern | Composition | Inheritance |
|---|---|---|
| Combine multiple HELiX components | Natural fit | Not possible |
| Add a new reactive property | Possible via wrapper | Direct — `@property` decorator |
| Override render output | Full control — write your own `render()` | Via `super.render()` with limitations |
| Framework compatibility | Works everywhere | May require wrapper in React/Vue |
| CSS parts exposure | Requires `exportparts` declaration | Inherited automatically |
| Public API surface | Explicitly defined — only what you expose | All parent public properties inherited |
| Maintenance risk on HELiX upgrade | Low — API boundary is narrow | Medium — depends on parent internals |
| When to use | Compound patterns, multi-framework, opinionated APIs | Single-component extension, domain variants |

---

## References

- [AdoptedStylesheetsController source](https://github.com/bookedsolidtech/helix/blob/main/packages/hx-library/src/controllers/adopted-stylesheets.ts) — deduplication and reference-counting implementation
- [Lit ReactiveController guide](https://lit.dev/docs/composition/controllers/) — full controller lifecycle API
- [Extending HELiX Components](/extending/) — class inheritance for single-component extension
- [CSS Parts](/extending/style-components-with-css-parts/) — `::part()` selectors and `exportparts`
- [Theming Quick Start](/extending/theming-quick-start/) — CSS custom property cascades
