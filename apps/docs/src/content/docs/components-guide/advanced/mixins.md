---
title: Mixins
description: Apply the TypeScript mixin pattern in HELiX to compose behaviors like ARIA delegation and focus management onto LitElement subclasses.
---

Mixins are functions that accept a base class and return a new class extending it. They add reusable behavior to the prototype chain at definition time, rather than at instance time like controllers. HELiX uses mixins for behaviors that need to intercept lifecycle hooks, patch prototype methods, or augment `observedAttributes`.

## The TypeScript Mixin Constructor Type

TypeScript requires mixin functions to accept `any[]` arguments — this is a known limitation (TS2545) stemming from the way ES class constructors interact with TypeScript's type system. HELiX and Lit both use the same canonical pattern:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;
```

The `any[]` is not a code quality issue — it is the only way TypeScript can reason about arbitrary base class constructors.

## Writing a Mixin

A mixin function takes a constrained base class, returns a new class that extends it, and is typed to express the members it adds:

```typescript
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = LitElement> = new (...args: any[]) => T;

// The interface describes what the mixin adds — exported for consumers
export interface DisabledMixinInterface {
  /** Whether the component is disabled. Reflects to the `disabled` attribute. */
  disabled: boolean;
}

export function DisabledMixin<T extends Constructor>(Base: T) {
  class DisabledMixinClass extends Base implements DisabledMixinInterface {
    @property({ type: Boolean, reflect: true })
    disabled: boolean = false;

    // Intercept connectedCallback to set ARIA state on connect
    override connectedCallback(): void {
      super.connectedCallback();
      this.setAttribute('aria-disabled', String(this.disabled));
    }
  }

  // Cast to satisfy the return type — the interface members are present
  return DisabledMixinClass as unknown as T & Constructor<DisabledMixinInterface>;
}
```

## Mixin Interfaces for Type Safety

Exporting a separate interface from the mixin lets consumers type references without needing to import the mixin function itself:

```typescript
import type { DisabledMixinInterface } from './mixins/disabled-mixin.js';

// Type a reference to any element that has the disabled mixin applied
function disableElement(el: HTMLElement & DisabledMixinInterface): void {
  el.disabled = true;
}
```

## HELiX Real Example: `mixinDelegatesAria`

`mixinDelegatesAria` is used on every HELiX component that contains a focusable inner element. It prevents ARIA double-announcement by intercepting `attributeChangedCallback` for all `aria-*` attributes, moving their values to `data-aria-*`, and providing JS property accessors that read from the `data-aria-*` storage:

```typescript
import { mixinDelegatesAria } from '../../mixins/index.js';

// Applied directly on LitElement — no other base class needed
@customElement('hx-button')
export class HelixButton extends mixinDelegatesAria(LitElement) {
  static override styles = [tokenStyles];

  override render() {
    return html`
      <button
        // Read from data-aria-label via the mixin's property accessor
        aria-label=${this.ariaLabel ?? nothing}
        aria-busy=${this.ariaLabel ?? nothing}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

When a consumer writes `<hx-button aria-label="Close">`, the mixin:

1. Intercepts `attributeChangedCallback('aria-label', null, 'Close')`
2. Sets `data-aria-label="Close"` on the host
3. Removes `aria-label` from the host element
4. Triggers `requestUpdate()` so `render()` re-reads `this.ariaLabel`

The inner `<button>` now has `aria-label="Close"` directly, and the host element has no `aria-label` — eliminating the double-announcement.

## HELiX Real Example: `FocusMixin`

`FocusMixin` adds standardized focus delegation and keyboard-vs-pointer focus tracking to any component. Subclasses override `_focusableNode` to declare which inner element receives focus:

```typescript
import { FocusMixin } from '../../mixins/FocusMixin.js';

@customElement('hx-text-input')
export class HelixTextInput extends FocusMixin(mixinDelegatesAria(LitElement)) {
  static override styles = [tokenStyles];

  @query('input')
  private _inputEl: HTMLInputElement | null = null;

  // Required override — tells FocusMixin which element to delegate to
  protected override get _focusableNode(): HTMLElement | null {
    return this._inputEl;
  }

  override render() {
    return html`
      <div class="field">
        <input
          type="text"
          class=${classMap({
            'input': true,
            'input--focused-visible': this.focusedVisible,
          })}
        />
      </div>
    `;
  }
}
```

`FocusMixin` provides:

- `focused` — reflects to the `focused` attribute for `:host([focused])` CSS selectors.
- `focusedVisible` — reflects to `focused-visible` for keyboard-only focus rings.
- `focus()` and `blur()` delegation to the inner element.
- Autofocus support after the first render.

## Stacking Mixins

Mixins stack by nesting calls. The outermost mixin is highest in the prototype chain and its methods run first (or last, depending on whether they call `super`):

```typescript
// Order: FocusMixin → AriaD DelegationMixin → LitElement
@customElement('hx-search-input')
export class HelixSearchInput extends FocusMixin(mixinDelegatesAria(LitElement)) {
  // has both focus management AND aria delegation
}

// Three mixins stacked
@customElement('hx-date-picker-input')
export class HelixDatePickerInput extends FocusMixin(DisabledMixin(mixinDelegatesAria(LitElement))) {
  // focus management + disabled state + aria delegation
}
```

Stacking order matters when multiple mixins override the same lifecycle hook. Each mixin should call `super.connectedCallback()` (and equivalent) to ensure the chain completes:

```typescript
// Both FocusMixin and DisabledMixin override connectedCallback.
// Each calls super.connectedCallback(), so both run.
// The call order follows the prototype chain: FocusMixin first, then DisabledMixin, then LitElement.
```

## Next Steps

- [Reactive Controllers](/components-guide/advanced/controllers/) — instance-based behavior composition
- [Composition Patterns](/components-guide/advanced/composition-patterns/) — when to use mixins vs controllers vs inheritance
- [Component Interfaces](/components-guide/typescript/interfaces/) — typing mixin return values with interfaces
