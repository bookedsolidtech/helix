---
title: Composition Patterns
description: Compose HELiX components from mixins, controllers, and slots rather than deep inheritance chains to keep code reusable and testable.
---

Inheritance is appropriate for "is-a" relationships. Composition is appropriate for "has-a" behavior. In practice, most component behavior — focus management, ARIA delegation, form association — is a behavior that a component *has*, not a thing that it *is*. HELiX uses composition as the default.

## Favor Composition Over Inheritance

Deep inheritance chains make it hard to understand which class provides which behavior, and they make overriding behavior without breaking other levels of the chain fragile. Consider this problematic hierarchy:

```typescript
// Problematic: deeply nested inheritance
class HelixBaseElement extends LitElement { ... }
class HelixFocusableElement extends HelixBaseElement { ... }
class HelixFormElement extends HelixFocusableElement { ... }
class HelixButton extends HelixFormElement { ... }
```

A change to `HelixFocusableElement` potentially breaks `HelixFormElement`, `HelixButton`, and every other subclass. Instead, HELiX composes behaviors:

```typescript
// Composed: each mixin is independent and stackable
@customElement('hx-button')
export class HelixButton extends mixinDelegatesAria(LitElement) {
  // aria delegation behavior — via mixin
  // form association behavior — via static formAssociated + ElementInternals
  // focus management — not needed; native <button> handles it
}

@customElement('hx-text-input')
export class HelixTextInput extends FocusMixin(mixinDelegatesAria(LitElement)) {
  // aria delegation + focus management — two independent mixins stacked
  // form association — via static formAssociated
}
```

## Mixin Composition Pattern

Mixins are functions that accept a base class and return a new class extending that base. They are stackable:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = LitElement> = new (...args: any[]) => T;

// Each mixin is an independent unit
function MixinA<T extends Constructor>(Base: T) {
  return class extends Base {
    methodA(): string { return 'A'; }
  };
}

function MixinB<T extends Constructor>(Base: T) {
  return class extends Base {
    methodB(): string { return 'B'; }
  };
}

// Stack them — MixinA wraps MixinB wraps LitElement
@customElement('hx-example')
export class HelixExample extends MixinA(MixinB(LitElement)) {
  override render() {
    return html`${this.methodA()} ${this.methodB()}`;
  }
}
```

Mixin application order matters for the prototype chain. Mixins applied last in the argument list are lowest in the chain — their methods are overridden by mixins applied earlier.

## HELiX Example: `mixinDelegatesAria`

`mixinDelegatesAria` is the most widely used mixin in HELiX. It intercepts all `aria-*` attributes set on the host and redirects them to `data-aria-*`, preventing double announcement by screen readers when shadow DOM and delegated focus are both active:

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { mixinDelegatesAria } from '../../mixins/index.js';

@customElement('hx-icon-button')
export class HelixIconButton extends mixinDelegatesAria(LitElement) {
  static override styles = [tokenStyles];

  override render() {
    return html`
      <button
        aria-label=${this.ariaLabel ?? nothing}
        aria-pressed=${this.ariaPressed ?? nothing}
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-icon-button': HelixIconButton;
  }
}
```

When a consumer sets `aria-label="Close"` on `<hx-icon-button>`, the mixin intercepts it, stores it as `data-aria-label="Close"`, removes `aria-label` from the host, and `this.ariaLabel` returns `"Close"` for use on the inner `<button>`.

## Controller Composition

[Reactive Controllers](/components-guide/advanced/controllers/) are separate classes that plug into the component lifecycle. Unlike mixins, controllers are instantiated rather than applied to the prototype chain, which means they can hold private state cleanly:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

// Controller for viewport-based lazy rendering
class IntersectionController {
  private _observer: IntersectionObserver | null = null;
  intersecting = false;

  constructor(private host: LitElement, private threshold = 0.1) {
    host.addController(this);
  }

  hostConnected(): void {
    this._observer = new IntersectionObserver(
      ([entry]) => {
        this.intersecting = entry!.isIntersecting;
        this.host.requestUpdate();
      },
      { threshold: this.threshold },
    );
    this._observer.observe(this.host);
  }

  hostDisconnected(): void {
    this._observer?.disconnect();
    this._observer = null;
  }
}

@customElement('hx-lazy-image')
export class HelixLazyImage extends LitElement {
  static override styles = [tokenStyles];

  private _intersection = new IntersectionController(this);

  override render() {
    return html`
      ${this._intersection.intersecting
        ? html`<slot></slot>`
        : html`<div class="placeholder"></div>`}
    `;
  }
}
```

## Slot-Based Composition

Named slots are the primary mechanism for composing component trees. Rather than accepting every possible child shape as a property, a component provides structural slots that consumers fill:

```typescript
@customElement('hx-card')
export class HelixCard extends LitElement {
  static override styles = [tokenStyles];

  override render() {
    return html`
      <article class="card">
        <header class="card__header">
          <slot name="header"></slot>
        </header>
        <div class="card__body">
          <slot></slot>
        </div>
        <footer class="card__footer">
          <slot name="footer"></slot>
        </footer>
      </article>
    `;
  }
}
```

```html
<!-- Consumer composes freely inside the structural slots -->
<hx-card>
  <hx-avatar slot="header" src="..." label="Jake"></hx-avatar>
  <p>Card body content goes here.</p>
  <hx-button slot="footer" variant="primary">Action</hx-button>
</hx-card>
```

## When to Use Inheritance

Inheritance remains appropriate when:

- All subclasses truly share state and implementation (not just interface).
- The base class is a pure infrastructure layer — `HelixElement` extends `LitElement` to add shared form association infrastructure.
- The hierarchy is shallow (one level of extension beyond the framework base).

`HelixElement` is the only intentional base class in HELiX. All component-specific behavior above it uses mixins, controllers, or slots.

## Next Steps

- [Reactive Controllers](/components-guide/advanced/controllers/) — encapsulating reusable behavior in controller classes
- [Mixins](/components-guide/advanced/mixins/) — the `FocusMixin` and `mixinDelegatesAria` patterns in full
- [Context Protocol](/components-guide/advanced/context-protocol/) — sharing data across the component tree
