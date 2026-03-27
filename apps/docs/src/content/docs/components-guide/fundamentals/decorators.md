---
title: Decorators
description: Complete reference for all Lit decorators — @customElement, @property, @state, @query, @queryAll, @queryAssignedElements, and @eventOptions.
---

Lit decorators are syntactic sugar over standard Web Components APIs. They reduce boilerplate and make component classes easier to read. All decorators are imported from `lit/decorators.js`.

```typescript
import {
  customElement,
  property,
  state,
  query,
  queryAll,
  queryAssignedElements,
  eventOptions,
} from 'lit/decorators.js';
```

## `@customElement`

Registers the class as a custom element with the browser's `CustomElementRegistry`. Equivalent to calling `customElements.define('tag-name', ClassName)`.

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-badge')
export class HelixBadge extends LitElement {
  override render() {
    return html`<slot></slot>`;
  }
}
```

The argument must be a valid custom element name: lowercase, containing at least one hyphen. HELiX convention: use the `hx-` prefix.

Always export the class so TypeScript can see the type and consumers can extend it.

## `@property`

Declares a reactive public property that:

1. Triggers a re-render when it changes.
2. Can be observed as an HTML attribute (by default, the lowercase version of the property name).
3. Is part of the component's public API.

```typescript
@customElement('hx-avatar')
export class HelixAvatar extends LitElement {
  static override styles = [tokenStyles];

  // String property — attribute name: "src"
  @property({ type: String })
  src = '';

  // String property — attribute name: "alt"
  @property({ type: String })
  alt = '';

  // Number — attribute name: "size"
  @property({ type: Number })
  size = 40;

  // Boolean — attribute name: "round"
  @property({ type: Boolean, reflect: true })
  round = false;

  // String with custom attribute name
  @property({ type: String, attribute: 'aria-label' })
  ariaLabel: string | undefined;

  // Property only — no attribute observation
  @property({ attribute: false })
  metadata: Record<string, unknown> = {};

  override render() {
    return html`
      <img
        src=${this.src}
        alt=${this.alt}
        width=${this.size}
        height=${this.size}
        aria-label=${ifDefined(this.ariaLabel)}
      />
    `;
  }
}
```

Full option reference: see [Reactive Properties](/components-guide/fundamentals/reactive-properties/).

## `@state`

Declares reactive private state. Like `@property`, it triggers re-renders when the value changes. Unlike `@property`, it has no attribute observation and is not part of the public API.

```typescript
@customElement('hx-password-input')
export class HelixPasswordInput extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: String })
  label = 'Password';

  // Private state — not an attribute, not in the public API
  @state()
  private _showPassword = false;

  private _toggleVisibility() {
    this._showPassword = !this._showPassword;
  }

  override render() {
    return html`
      <label>${this.label}</label>
      <div class="input-wrapper">
        <input type=${this._showPassword ? 'text' : 'password'} />
        <button
          type="button"
          aria-label=${this._showPassword ? 'Hide password' : 'Show password'}
          @click=${this._toggleVisibility}
        >
          <hx-icon name=${this._showPassword ? 'eye-off' : 'eye'}></hx-icon>
        </button>
      </div>
    `;
  }
}
```

Convention in HELiX: prefix `@state` fields with `_` to make their private nature clear at a glance.

## `@query`

Queries the component's shadow DOM for a single element. The property value is `null` before the first render and after the element is removed from the template.

```typescript
import { query } from 'lit/decorators.js';

@customElement('hx-search')
export class HelixSearch extends LitElement {
  static override styles = [tokenStyles];

  // Queries this.shadowRoot.querySelector('input')
  @query('input')
  private _input!: HTMLInputElement;

  // Queries a class
  @query('.dropdown')
  private _dropdown!: HTMLElement;

  focus() {
    this._input?.focus();
  }

  override firstUpdated() {
    // _input is available here
    this._input.setAttribute('data-helix-search', '');
  }

  override render() {
    return html`
      <input type="search" placeholder="Search..." />
      <div class="dropdown"><slot name="results"></slot></div>
    `;
  }
}
```

The `!` non-null assertion is safe when the element is always present in the template. For conditionally rendered elements, use `@query` with a `?` optional chain: `this._input?.focus()`.

By default, `@query` caches the result. Pass `{ cache: false }` as the second argument to always re-query:

```typescript
@query('input', { cache: false })
private _input!: HTMLInputElement;
```

Use `{ cache: false }` when the queried element may be dynamically added or removed from the template.

## `@queryAll`

Like `@query`, but returns a `NodeList` of all matching elements.

```typescript
import { queryAll } from 'lit/decorators.js';

@customElement('hx-radio-group')
export class HelixRadioGroup extends LitElement {
  static override styles = [tokenStyles];

  @queryAll('input[type="radio"]')
  private _radios!: NodeListOf<HTMLInputElement>;

  get value(): string {
    for (const radio of this._radios) {
      if (radio.checked) return radio.value;
    }
    return '';
  }

  override render() {
    return html`
      <fieldset>
        <slot></slot>
      </fieldset>
    `;
  }
}
```

The result is a live `NodeList` — it reflects the current state of the shadow DOM.

## `@queryAssignedElements`

Queries elements assigned to a named or default slot. Returns an array of elements, not a `NodeList`.

```typescript
import { queryAssignedElements } from 'lit/decorators.js';

@customElement('hx-action-bar')
export class HelixActionBar extends LitElement {
  static override styles = [tokenStyles];

  // Elements assigned to the default slot
  @queryAssignedElements()
  private _defaultSlotItems!: Array<HTMLElement>;

  // Elements assigned to the named "actions" slot
  @queryAssignedElements({ slot: 'actions' })
  private _actionItems!: Array<HTMLElement>;

  // Filter to only button elements in the actions slot
  @queryAssignedElements({ slot: 'actions', selector: 'button, hx-button' })
  private _buttons!: Array<HTMLElement>;

  override updated() {
    // Count visible actions
    const visibleCount = this._actionItems.filter(
      (el) => !el.hasAttribute('hidden'),
    ).length;
    this.setAttribute('data-action-count', String(visibleCount));
  }

  override render() {
    return html`
      <div class="content"><slot></slot></div>
      <div class="actions"><slot name="actions"></slot></div>
    `;
  }
}
```

Options:

| Option | Type | Description |
|---|---|---|
| `slot` | `string` | Name of the slot to query (omit for default slot) |
| `selector` | `string` | CSS selector to filter assigned elements |
| `flatten` | `boolean` | Include elements from nested slots (default: `false`) |

## `@eventOptions`

Configures the event listener options for a method decorated event handler in the template. This is an alternative to calling `addEventListener` directly with options.

```typescript
import { eventOptions } from 'lit/decorators.js';

@customElement('hx-scroll-container')
export class HelixScrollContainer extends LitElement {
  static override styles = [tokenStyles];

  // Passive listener — improves scroll performance
  @eventOptions({ passive: true })
  private _handleScroll(_event: Event) {
    // Cannot call event.preventDefault() in a passive listener
    this._updateScrollIndicators();
  }

  // Capture phase listener
  @eventOptions({ capture: true })
  private _handleCaptureFocus(_event: FocusEvent) {
    this._trackFocusedElement();
  }

  // Once — listener removes itself after first call
  @eventOptions({ once: true })
  private _handleFirstInteraction(_event: Event) {
    this._initLazyContent();
  }

  private _updateScrollIndicators() { /* ... */ }
  private _trackFocusedElement() { /* ... */ }
  private _initLazyContent() { /* ... */ }

  override render() {
    return html`
      <div
        class="scroll-area"
        @scroll=${this._handleScroll}
        @focusin=${this._handleCaptureFocus}
        @pointerdown=${this._handleFirstInteraction}
      >
        <slot></slot>
      </div>
    `;
  }
}
```

`@eventOptions` supports the standard `AddEventListenerOptions`: `{ passive, capture, once }`.

## Decorator Summary

| Decorator | Source | Description |
|---|---|---|
| `@customElement(tag)` | `lit/decorators.js` | Registers element in `CustomElementRegistry` |
| `@property(options?)` | `lit/decorators.js` | Public reactive property with attribute support |
| `@state()` | `lit/decorators.js` | Private reactive state, no attribute |
| `@query(selector)` | `lit/decorators.js` | Single shadow DOM element query |
| `@queryAll(selector)` | `lit/decorators.js` | Multiple shadow DOM element query |
| `@queryAssignedElements(opts?)` | `lit/decorators.js` | Slotted element query |
| `@eventOptions(opts)` | `lit/decorators.js` | Event listener options for template handlers |

## Next Steps

- [Reactive Properties](/components-guide/fundamentals/reactive-properties/) — `@property` options in depth
- [Slots Introduction](/components-guide/fundamentals/slots-intro/) — `@queryAssignedElements` in context
- [Events Overview](/components-guide/fundamentals/events-overview/) — `@eventOptions` and custom events
