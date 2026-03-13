---
title: Typing Lit Components
description: Comprehensive guide to TypeScript in Lit web components, covering property types, event types, template typing, ReactiveController types, and advanced type patterns.
sidebar:
  order: 20
---

TypeScript is a first-class citizen in Lit. Every component, property, event, and lifecycle method can be fully typed, giving you compile-time safety, IntelliSense in your IDE, and self-documenting code. This guide covers how to leverage TypeScript's type system throughout your Lit components, drawing on real-world patterns from the hx-library codebase.

## Why TypeScript in Lit?

Lit components are already strongly typed at runtime through decorator metadata, but TypeScript adds:

- **Compile-time safety**: Catch errors before they reach the browser
- **IDE autocomplete**: IntelliSense for properties, methods, and events
- **Refactoring confidence**: Rename properties or methods across the codebase safely
- **Self-documenting code**: Type signatures make intent explicit
- **Consumer ergonomics**: `.d.ts` files enable type checking in consuming applications

In an enterprise healthcare context, type safety is not a luxury—it is infrastructure. A typo in a property name or an incorrect event detail type can cascade into runtime failures that impact patient-facing software.

## TypeScript Configuration

The hx-library uses TypeScript's strictest settings. This is non-negotiable for enterprise-grade components.

```json
// tsconfig.base.json (monorepo root)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Key Settings

| Setting                            | Purpose                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `strict: true`                     | Enables all strict checks (no implicit `any`, strict null checks, etc.) |
| `noUncheckedIndexedAccess: true`   | Treats array/object indexing as possibly `undefined`                    |
| `exactOptionalPropertyTypes: true` | Distinguishes between `prop?: string` and `prop?: string \| undefined`  |
| `declaration: true`                | Generates `.d.ts` files for package consumers                           |
| `declarationMap: true`             | Enables "Go to Definition" into source files                            |

## Typing Properties

Properties are the public API of your component. Their types determine what values consumers can pass as attributes or via JavaScript.

### Basic Property Types

Use the `@property()` decorator with explicit TypeScript types:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-button')
export class HelixButton extends LitElement {
  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'ghost' = 'primary';

  /**
   * Size of the button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The type attribute for the underlying button element.
   * @attr type
   */
  @property({ type: String })
  type: 'button' | 'submit' | 'reset' = 'button';
}
```

**Key Patterns:**

- **Union types over enums**: `'primary' | 'secondary' | 'ghost'` is tree-shakeable and works seamlessly with HTML attributes. TypeScript enums do not.
- **Explicit defaults**: Always provide a default value so the component has a known initial state.
- **JSDoc annotations**: The `@attr` annotation feeds into Custom Elements Manifest (CEM) for Storybook autodocs.

### String Literal Unions (Preferred)

```typescript
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';
```

**Why not enums?**

```typescript
// Bad: Enum (not tree-shakeable, doesn't map to HTML attributes)
enum Variant { Primary = 'primary', Secondary = 'secondary', Ghost = 'ghost' }

@property({ type: String, reflect: true })
variant: Variant = Variant.Primary;
```

Enums are runtime constructs that add bundle size. String literal unions are compile-time only and tree-shake perfectly.

### Boolean Properties

Boolean properties map to the presence/absence of an HTML attribute:

```typescript
@property({ type: Boolean, reflect: true })
disabled = false;
```

```html
<!-- disabled = true -->
<hx-button disabled>Click me</hx-button>

<!-- disabled = false -->
<hx-button>Click me</hx-button>
```

### Number Properties

```typescript
@property({ type: Number })
maxLength = 100;
```

Lit's `type: Number` converter handles string-to-number coercion from HTML attributes.

### Complex Property Types

For object or array properties, use `type: Object` or `type: Array` and provide an explicit TypeScript type:

```typescript
interface ValidationRule {
  type: 'required' | 'email' | 'min-length';
  message: string;
  value?: number;
}

@property({ type: Array })
validationRules: ValidationRule[] = [];
```

**Important**: Complex properties should generally be set via JavaScript, not HTML attributes. Lit's default converters use `JSON.parse` for objects and arrays, which is fragile.

### Custom Attribute Names

By default, Lit maps `camelCase` properties to `lowercase` attributes. Use `attribute` to override:

```typescript
@property({ type: String, reflect: true, attribute: 'hx-size' })
size: 'sm' | 'md' | 'lg' = 'md';
```

This renders as:

```html
<hx-button hx-size="lg">Click me</hx-button>
```

### Overriding ARIA Properties

Lit's `LitElement` extends `HTMLElement`, which defines ARIA properties like `ariaLabel`. To allow consumers to override them, type them explicitly as nullable:

```typescript
@property({ type: String, attribute: 'aria-label' })
override ariaLabel: string | null = null;
```

## Typing Events

Custom events are the primary communication mechanism between components and their consumers. Typed events make event handling safe and self-documenting.

### Event Detail Types

Define an interface for the event detail payload:

```typescript
interface HxClickDetail {
  originalEvent: MouseEvent;
}

interface HxChangeDetail {
  checked: boolean;
  value: string;
}
```

### Dispatching Typed Events

Use `CustomEvent<T>` to type the event detail:

```typescript
private _handleClick(e: MouseEvent): void {
  if (this.disabled) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  /**
   * Dispatched when the button is clicked.
   * @event hx-click
   */
  this.dispatchEvent(
    new CustomEvent<HxClickDetail>('hx-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: e },
    })
  );
}
```

**Key Points:**

- `bubbles: true` — Event propagates up the DOM tree
- `composed: true` — Event crosses shadow DOM boundaries
- `detail` — Typed payload matching `HxClickDetail`

### Event Maps for Type-Safe Listeners

Define an interface mapping event names to their `CustomEvent<T>` types:

```typescript
interface HxButtonEventMap {
  'hx-click': CustomEvent<HxClickDetail>;
}

export class HelixButton extends LitElement {
  // ...

  addEventListener<K extends keyof HxButtonEventMap>(
    type: K,
    listener: (this: HelixButton, ev: HxButtonEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener, options);
  }
}
```

**Consumer benefit:**

```typescript
const button = document.querySelector('hx-button')!;

// TypeScript knows detail.originalEvent is a MouseEvent
button.addEventListener('hx-click', (e) => {
  console.log(e.detail.originalEvent.clientX);
});
```

### Real-World Example: hx-checkbox

```typescript
@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: String })
  value = 'on';

  private _handleChange(): void {
    if (this.disabled) return;

    this.checked = !this.checked;

    /**
     * Dispatched when the checkbox is toggled.
     * @event hx-change
     */
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

The `@event hx-change` JSDoc annotation generates CEM metadata, which Storybook's autodocs use to document events.

## Typing Templates

Lit's `html` tagged template returns a `TemplateResult`. TypeScript infers this automatically, but you can be explicit for clarity.

### Return Type Annotation

```typescript
import { html, TemplateResult } from 'lit';

override render(): TemplateResult {
  return html`
    <button part="button" ?disabled=${this.disabled}>
      <slot></slot>
    </button>
  `;
}
```

**When to omit:**

For most components, omit the return type annotation and let TypeScript infer it. This avoids boilerplate and allows Lit to evolve its return types without breaking your code.

### Template Expressions

Template expressions are typed based on the directive or binding:

```typescript
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

override render() {
  const classes = {
    button: true,
    [`button--${this.variant}`]: true,
    [`button--${this.size}`]: true,
  };

  return html`
    <button
      class=${classMap(classes)}
      type=${this.type}
      ?disabled=${this.disabled}
      aria-label=${ifDefined(this.ariaLabel ?? undefined)}
    >
      <slot></slot>
    </button>
  `;
}
```

**Directives and their types:**

- `classMap(obj: Record<string, boolean>)` — Conditional class application
- `ifDefined(value: T | undefined)` — Omit attribute if `undefined`
- `live(value: T)` — Force property update even if value hasn't changed
- `nothing` — Render nothing (equivalent to empty template)

### Conditional Rendering with `nothing`

```typescript
import { html, nothing } from 'lit';

override render() {
  return html`
    <label>
      ${this.label}
      ${this.required
        ? html`<span class="required-marker">*</span>`
        : nothing}
    </label>
  `;
}
```

`nothing` is typed as `typeof nothing`, which Lit recognizes as "render no DOM".

### Slot Content

Slots are untyped—consumers can slot any content. To type-check slotted content, use slot change handlers:

```typescript
import { state } from 'lit/decorators.js';

@state() private _hasLabelSlot = false;

private _handleLabelSlotChange(e: Event): void {
  const slot = e.target as HTMLSlotElement;
  this._hasLabelSlot = slot.assignedElements({ flatten: true }).length > 0;
}

override render() {
  return html`
    <slot name="label" @slotchange=${this._handleLabelSlotChange}>
      ${this.label ? html`<label>${this.label}</label>` : nothing}
    </slot>
  `;
}
```

## Typing Lifecycle Methods

Lit lifecycle methods are inherited from `LitElement` and `ReactiveElement`. Override them with explicit type annotations for clarity.

### `updated(changedProperties)`

The `changedProperties` parameter is a `Map<PropertyKey, unknown>`. For type-safe property checks, use a generic type:

```typescript
import { PropertyValues } from 'lit';

override updated(changedProperties: PropertyValues<this>): void {
  super.updated(changedProperties);

  if (changedProperties.has('value')) {
    this._internals.setFormValue(this.value);
    this._updateValidity();
  }

  if (changedProperties.has('checked')) {
    this._internals.setFormValue(this.checked ? this.value : null);
  }
}
```

**`PropertyValues<this>`:**

This generic type constrains `changedProperties` to only contain keys that exist on the current component instance. It prevents typos like `changedProperties.has('valu')`.

### `connectedCallback` and `disconnectedCallback`

```typescript
override connectedCallback(): void {
  super.connectedCallback();
  this.addEventListener('submit', this._handleSubmit);
  this.addEventListener('reset', this._handleReset);
}

override disconnectedCallback(): void {
  super.disconnectedCallback();
  this.removeEventListener('submit', this._handleSubmit);
  this.removeEventListener('reset', this._handleReset);
}
```

**Rule:** Always call `super.connectedCallback()` and `super.disconnectedCallback()` before your custom logic.

### `firstUpdated(changedProperties)`

```typescript
override firstUpdated(changedProperties: PropertyValues<this>): void {
  super.firstUpdated(changedProperties);
  this._select?.focus();
}
```

Runs once, after the component's first update. Use for initializing state that depends on the DOM.

## Typing ReactiveControllers

Reactive controllers encapsulate reusable behavior. They implement the `ReactiveController` interface.

### Basic Controller Type

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export class AdoptedStylesheetsController implements ReactiveController {
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

**Usage in component:**

```typescript
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';

@customElement('hx-form')
export class HelixForm extends LitElement {
  private _styles = new AdoptedStylesheetsController(this, helixFormScopedCss, document);
}
```

### Controller Generics

For controllers that manage specific property types, use generics:

```typescript
export class FormValueController<T> implements ReactiveController {
  private readonly _host: ReactiveControllerHost & LitElement;
  private _value: T;

  constructor(host: ReactiveControllerHost & LitElement, initialValue: T) {
    this._host = host;
    this._value = initialValue;
    this._host.addController(this);
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;
    this._host.requestUpdate();
  }

  hostConnected(): void {}
  hostDisconnected(): void {}
}
```

## Typing Styles

Lit styles use the `css` tagged template, which returns a `CSSResult`. For components with multiple stylesheets, use `CSSResultGroup`.

### Single Stylesheet

```typescript
import { LitElement, css } from 'lit';

export class HelixButton extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
    }
  `;
}
```

### Multiple Stylesheets

```typescript
import { CSSResultGroup } from 'lit';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixButtonStyles } from './hx-button.styles.js';

export class HelixButton extends LitElement {
  static override styles: CSSResultGroup = [tokenStyles, helixButtonStyles];
}
```

**Type:** `CSSResultGroup` is `CSSResult | CSSResult[]`. This allows single or multiple stylesheets.

### External Styles File

```typescript
// hx-button.styles.ts
import { css } from 'lit';

export const helixButtonStyles = css`
  :host {
    --_bg: var(--hx-button-bg, var(--hx-color-primary-500));
    --_color: var(--hx-button-color, var(--hx-color-neutral-0));
  }

  .button {
    background: var(--_bg);
    color: var(--_color);
  }
`;
```

**Why `CSSResult`?**

The `css` tagged template returns a `CSSResult`, which Lit optimizes by deduplicating identical stylesheets across components.

## Typing ElementInternals (Form-Associated Components)

Form-associated custom elements use `ElementInternals` to integrate with native form behavior.

### Typed Internals

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  get validity(): ValidityState {
    return this._internals.validity;
  }

  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  reportValidity(): boolean {
    return this._internals.reportValidity();
  }
}
```

**Key Methods:**

- `setFormValue(value: FormDataEntryValue | null)` — Set the form value
- `setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement)` — Set custom validity
- `checkValidity()` — Check if valid (no UI)
- `reportValidity()` — Check if valid (shows browser UI)

### Form Callbacks

```typescript
formResetCallback(): void {
  this.value = '';
  this._internals.setFormValue('');
}

formStateRestoreCallback(state: string): void {
  this.value = state;
}
```

These callbacks are invoked by the browser when the form resets or restores state (e.g., browser back button).

## Typing Query Decorators

The `@query` decorator retrieves a single element from the shadow DOM. Type it with the expected element type.

```typescript
import { query } from 'lit/decorators.js';

@query('.field__input')
private _input!: HTMLInputElement;

@query('.field__select')
private _select!: HTMLSelectElement;
```

**Non-null assertion (`!`):**

The `!` tells TypeScript that `_input` will definitely be assigned before use. This is safe because Lit guarantees the element exists after the first render.

### Query All

```typescript
import { queryAll } from 'lit/decorators.js';

@queryAll('.option')
private _options!: NodeListOf<HTMLElement>;
```

## Typing State

Internal state properties use the `@state()` decorator. They trigger re-renders but do not reflect to attributes.

```typescript
import { state } from 'lit/decorators.js';

@state() private _hasLabelSlot = false;
@state() private _hasErrorSlot = false;
```

**When to use `@state` vs `@property`:**

- `@property` — Public API (reflected to attributes, used by consumers)
- `@state` — Private implementation detail (no attribute reflection)

## Typing Public Methods

Public methods should have explicit parameter and return types.

```typescript
/** Moves focus to the input element. */
override focus(options?: FocusOptions): void {
  this._input?.focus(options);
}

/** Selects all text in the input. */
select(): void {
  this._input?.select();
}

/** Checks whether the input satisfies its constraints. */
checkValidity(): boolean {
  return this._internals.checkValidity();
}

/** Collects form data from all child form elements. */
getFormData(): FormData {
  const formData = new FormData();
  const elements = this.getNativeFormElements();

  for (const el of elements) {
    const input = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (input.name) {
      formData.append(input.name, input.value);
    }
  }

  return formData;
}
```

## Typing Private Methods

Private methods (prefixed with `_`) should also be typed, but can use `void` for event handlers:

```typescript
private _handleClick(e: MouseEvent): void {
  if (this.disabled) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  this.dispatchEvent(
    new CustomEvent('hx-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: e },
    })
  );
}

private _handleChange(e: Event): void {
  const target = e.target as HTMLSelectElement;
  this.value = target.value;
  this._internals.setFormValue(this.value);
  this._updateValidity();
}
```

## HTMLElementTagNameMap (Required)

Every component must extend the global `HTMLElementTagNameMap` interface. This enables type-safe `document.querySelector` and `document.createElement` calls.

```typescript
declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
    'hx-text-input': HelixTextInput;
    'hx-select': HelixSelect;
    'hx-checkbox': HelixCheckbox;
  }
}
```

**Consumer benefit:**

```typescript
// TypeScript knows this returns HelixButton | null
const button = document.querySelector('hx-button');

// TypeScript knows this returns HelixButton
const button = document.createElement('hx-button');
```

This is mandatory for every component. Without it, consumers get `HTMLElement` instead of your component's specific type.

## Advanced Type Patterns

### Branded Types

Use branded types to enforce type safety for identifiers:

```typescript
type ComponentTagName = `hx-${string}`;
type CSSCustomProperty = `--hx-${string}`;

function getComponent(tag: ComponentTagName): HTMLElement | undefined {
  return document.querySelector(tag) ?? undefined;
}

// OK: getComponent('hx-button')
// Error: getComponent('button')
```

### Type Guards

```typescript
function isHelixButton(el: Element): el is HelixButton {
  return el.tagName.toLowerCase() === 'hx-button';
}

const el = document.querySelector('.some-element');
if (el && isHelixButton(el)) {
  // TypeScript knows `el` is HelixButton
  el.focus();
}
```

### Utility Types

```typescript
// Extract property names from a component
type ComponentProps<T extends LitElement> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

// Make specific properties required
type RequireProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Conditional property type
type WithHref<T> = T & { href: string; role: 'link' };
type WithoutHref<T> = T & { href?: never; role?: never };
```

## Common Type Errors and Fixes

### Error: Property has no initializer

```typescript
// Bad: TypeScript doesn't know this will be assigned
@query('.field__input')
private _input: HTMLInputElement;

// Good: Non-null assertion (safe with @query)
@query('.field__input')
private _input!: HTMLInputElement;
```

### Error: Type 'undefined' is not assignable to type 'string'

```typescript
// Bad: Optional property without default
@property({ type: String })
label?: string;

// Good: Optional property with default
@property({ type: String })
label = '';

// Also good: Explicitly allow undefined
@property({ type: String })
label: string | undefined;
```

### Error: Object is possibly 'null'

```typescript
// Bad: No null check
this._input.focus();

// Good: Optional chaining
this._input?.focus();

// Also good: Type guard
if (this._input) {
  this._input.focus();
}
```

### Error: Type 'unknown' is not assignable to type 'HTMLSelectElement'

```typescript
// Bad: Event target is unknown
private _handleChange(e: Event): void {
  const target = e.target;
  this.value = target.value; // Error: Property 'value' does not exist on 'EventTarget | null'
}

// Good: Type assertion
private _handleChange(e: Event): void {
  const target = e.target as HTMLSelectElement;
  this.value = target.value;
}
```

## Real-World Example: hx-select

Here's a complete component demonstrating all the type patterns covered:

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

interface HxChangeDetail {
  value: string;
}

@customElement('hx-select')
export class HelixSelect extends LitElement {
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  name = '';

  @property({ type: String })
  error = '';

  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  @property({ type: String, attribute: 'aria-label' })
  override ariaLabel: string | null = null;

  // ─── Queries ───

  @query('.field__select')
  private _select!: HTMLSelectElement;

  @state() private _hasLabelSlot = false;
  @state() private _hasErrorSlot = false;

  // ─── Lifecycle ───

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
      if (this._select && this._select.value !== this.value) {
        this._select.value = this.value;
      }
    }
  }

  // ─── Form Integration ───

  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  get validity(): ValidityState {
    return this._internals.validity;
  }

  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select an option.',
        this._select,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue('');
  }

  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  // ─── Event Handling ───

  private _handleChange(e: Event): void {
    const target = e.target as HTMLSelectElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);
    this._updateValidity();

    this.dispatchEvent(
      new CustomEvent<HxChangeDetail>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Public Methods ───

  override focus(options?: FocusOptions): void {
    this._select?.focus(options);
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <slot name="label" @slotchange=${this._handleLabelSlotChange}>
          ${this.label ? html`<label part="label">${this.label}</label>` : nothing}
        </slot>

        <select
          part="select"
          ?required=${this.required}
          ?disabled=${this.disabled}
          name=${ifDefined(this.name || undefined)}
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          aria-invalid=${hasError ? 'true' : nothing}
          @change=${this._handleChange}
        >
          <slot></slot>
        </select>

        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${hasError ? html`<div part="error">${this.error}</div>` : nothing}
        </slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-select': HelixSelect;
  }
}
```

## Declaration File Generation

TypeScript generates `.d.ts` files for package consumers. Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

**What gets generated:**

For `hx-button.ts`:

```typescript
// hx-button.d.ts (generated)
import { LitElement } from 'lit';

export declare class HelixButton extends LitElement {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
  type: 'button' | 'submit' | 'reset';

  focus(options?: FocusOptions): void;

  static readonly styles: CSSResult[];

  render(): TemplateResult;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
}
```

Consumers import this and get full type safety.

## Best Practices

1. **Always use strict mode**: No `any`, no `@ts-ignore`, no non-null assertions except with `@query`.
2. **Prefer union types over enums**: Tree-shakeable, works with HTML attributes.
3. **Type event details**: `CustomEvent<T>` makes event handling safe.
4. **Use `PropertyValues<this>`**: Prevents typos in `updated()` checks.
5. **Annotate JSDoc for CEM**: `@attr`, `@event`, `@cssprop` feed into autodocs.
6. **Extend `HTMLElementTagNameMap`**: Required for type-safe DOM queries.
7. **Avoid `as` casts**: Use type guards instead. Casts bypass the type system.
8. **Use `??` for nullish coalescing**: Not `||`, which treats `''` and `0` as falsy.
9. **Prefix unused params with `_`**: e.g., `_changedProperties` if not used.
10. **Generate declaration files**: Consumers depend on `.d.ts` for type safety.

## Resources

- [Lit TypeScript Guide](https://lit.dev/docs/components/typescript/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/)
- [hx-library source code](https://github.com/bookedsolidtech/helix) (internal)

---

**Next Steps:**

- Read [Template Syntax](/components/fundamentals/template-syntax) for Lit's `html` tagged template
- Explore [Reactive Properties](/components/fundamentals/reactive-properties) for property lifecycle
- Review [Lifecycle Methods](/components/fundamentals/lifecycle) for component lifecycle
