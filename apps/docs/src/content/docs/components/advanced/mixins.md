---
title: Mixins in Lit
description: Using TypeScript mixins to share behavior across multiple web components without inheritance chains.
---

TypeScript mixins provide a pattern for composing shared behavior across multiple `LitElement` subclasses without creating brittle inheritance chains. Where reactive controllers add lifecycle-aware behavior from the outside, mixins extend the class itself — adding reactive properties, template contributions, and overrideable methods. This guide covers the mixin pattern in depth, correct TypeScript typing, practical healthcare component examples, and clear guidance on when to reach for a mixin versus a controller.

## What Is a Mixin?

A mixin is a function that accepts a base class and returns a new class that extends it:

```typescript
type Constructor<T = object> = new (...args: unknown[]) => T;

function MyMixin<TBase extends Constructor<LitElement>>(Base: TBase) {
  return class extends Base {
    // New properties and methods added here
  };
}
```

The returned class is a fully valid subclass. It can add reactive `@property()` and `@state()` decorators, override lifecycle methods, contribute to `render()`, and define static properties like `formAssociated`.

The defining characteristic is that the mixin receives the base class as a runtime argument. This means you can chain multiple mixins without deep inheritance and reuse the same mixin across any `LitElement` subclass.

## Typing Mixins Correctly

TypeScript requires a precise generic constraint to keep the type system happy. The `Constructor<T>` pattern is the canonical approach:

```typescript
import { LitElement } from 'lit';

// Generic constructor type
type Constructor<T = object> = new (...args: unknown[]) => T;

// Constrain base to LitElement subclasses
function DisabledMixin<TBase extends Constructor<LitElement>>(Base: TBase) {
  return class DisabledElement extends Base {
    // ...
  };
}
```

When a mixin needs to read or call methods defined on the host (the class being mixed into), declare an interface for those prerequisites and intersect it with the base type:

```typescript
interface WithName {
  name: string;
}

function LoggingMixin<TBase extends Constructor<LitElement & WithName>>(Base: TBase) {
  return class extends Base {
    override connectedCallback(): void {
      super.connectedCallback();
      console.log(`${this.name} connected`);
    }
  };
}
```

If the mixin returns a class you need to instantiate directly or pass to `customElement`, extract the return type to preserve inference:

```typescript
// Type alias for the mixed class
const DisabledLitElement = DisabledMixin(LitElement);
type DisabledLitElementType = InstanceType<typeof DisabledLitElement>;
```

## Practical Mixin Examples

### DisabledMixin

All interactive form controls in hx-library share `disabled` behavior: a boolean property that reflects to an attribute, propagates via ARIA, and prevents interaction. Rather than repeating this in every component, a mixin encapsulates it.

````typescript
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { nothing } from 'lit';

type Constructor<T = object> = new (...args: unknown[]) => T;

/**
 * Adds a `disabled` reactive property with attribute reflection and an ARIA
 * helper method. Apply to any interactive LitElement subclass.
 *
 * @example
 * ```typescript
 * @customElement('hx-button')
 * export class HelixButton extends DisabledMixin(LitElement) { ... }
 * ```
 */
export function DisabledMixin<TBase extends Constructor<LitElement>>(Base: TBase) {
  class DisabledElement extends Base {
    /**
     * When true, the component is non-interactive.
     * Reflected as the `disabled` attribute so CSS selectors like
     * `:host([disabled])` work correctly.
     */
    @property({ type: Boolean, reflect: true })
    disabled = false;

    /**
     * Returns the `aria-disabled` attribute value for elements that cannot
     * use the native `disabled` attribute (e.g. anchors, divs).
     * Returns `nothing` when not disabled so the attribute is omitted.
     */
    protected get ariaDisabledAttr(): 'true' | typeof nothing {
      return this.disabled ? 'true' : nothing;
    }

    /**
     * Guard method. Call at the top of any event handler that must not fire
     * while disabled.
     */
    protected isDisabled(): boolean {
      return this.disabled;
    }
  }

  return DisabledElement;
}
````

#### Applying DisabledMixin to hx-button

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { DisabledMixin } from '../../mixins/disabled-mixin.js';

@customElement('hx-button')
export class HelixButton extends DisabledMixin(LitElement) {
  static override styles = css`
    :host([disabled]) button {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  `;

  private _handleClick(e: MouseEvent): void {
    if (this.isDisabled()) {
      e.stopImmediatePropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent('hx-click', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <button
        part="button"
        ?disabled=${this.disabled}
        aria-disabled=${this.ariaDisabledAttr}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

#### Applying DisabledMixin to hx-text-input

The same mixin applies unchanged to a form input:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { DisabledMixin } from '../../mixins/disabled-mixin.js';

@customElement('hx-text-input')
export class HelixTextInput extends DisabledMixin(LitElement) {
  static override styles = css`
    :host([disabled]) input {
      background: var(--hx-input-disabled-bg, var(--hx-color-surface-muted));
      color: var(--hx-input-disabled-color, var(--hx-color-text-muted));
      cursor: not-allowed;
    }
  `;

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  private _handleInput(e: Event): void {
    if (this.isDisabled()) return;

    const target = e.target as HTMLInputElement;
    this.value = target.value;

    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  override render() {
    return html`
      <label part="label">${this.label}</label>
      <input
        part="input"
        .value=${live(this.value)}
        ?disabled=${this.disabled}
        aria-disabled=${this.ariaDisabledAttr}
        @input=${this._handleInput}
      />
    `;
  }
}
```

Both components now share identical `disabled` behavior, attribute reflection, and CSS hooks from a single source of truth.

---

### FocusableMixin

Focus management is repetitive across every interactive component. This mixin delegates focus to an internal element and exposes `focus()` and `blur()` on the host:

```typescript
import { LitElement } from 'lit';

type Constructor<T = object> = new (...args: unknown[]) => T;

/**
 * Delegates focus() and blur() calls from the host element to an internal
 * focusable element identified by the `focusTarget` getter.
 *
 * Subclasses must override `focusTarget` to return the element that should
 * receive focus (e.g., the internal <button> or <input>).
 */
export function FocusableMixin<TBase extends Constructor<LitElement>>(Base: TBase) {
  class FocusableElement extends Base {
    /**
     * Override in subclass to return the internal element that receives focus.
     * Default: queries `[part="focus-target"]` in the shadow root.
     */
    protected get focusTarget(): HTMLElement | null {
      return (this.renderRoot?.querySelector('[part="focus-target"]') ??
        null) as HTMLElement | null;
    }

    override focus(options?: FocusOptions): void {
      const target = this.focusTarget;
      if (target) {
        target.focus(options);
      } else {
        super.focus(options);
      }
    }

    override blur(): void {
      const target = this.focusTarget;
      if (target) {
        target.blur();
      } else {
        super.blur();
      }
    }
  }

  return FocusableElement;
}
```

Usage — by setting `part="focus-target"` on the internal element, the mixin finds it automatically:

```typescript
@customElement('hx-select')
export class HelixSelect extends FocusableMixin(DisabledMixin(LitElement)) {
  override render() {
    return html`
      <select part="focus-target" ?disabled=${this.disabled}>
        <slot></slot>
      </select>
    `;
  }
}
```

Calling `document.querySelector('hx-select')?.focus()` now correctly focuses the internal `<select>`, which is what accessibility tools and programmatic focus management expect.

---

### SizeMixin

Consistent size variants (`sm`, `md`, `lg`) appear on buttons, inputs, badges, and cards. Rather than duplicating the property and CSS class logic in each component, `SizeMixin` centralizes it:

```typescript
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

type Constructor<T = object> = new (...args: unknown[]) => T;

export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * Adds a `size` reactive property with reflect, providing consistent sizing
 * across all components that accept a `sm | md | lg` size variant.
 *
 * The size is reflected to the `size` attribute so CSS selectors like
 * `:host([size="sm"])` work without class manipulation.
 */
export function SizeMixin<TBase extends Constructor<LitElement>>(Base: TBase) {
  class SizedElement extends Base {
    /**
     * Visual size variant. Reflected as the `size` attribute.
     * @default 'md'
     */
    @property({ type: String, reflect: true })
    size: ComponentSize = 'md';
  }

  return SizedElement;
}
```

Applied to a button:

```typescript
@customElement('hx-button')
export class HelixButton extends SizeMixin(DisabledMixin(LitElement)) {
  static override styles = css`
    :host([size='sm']) button {
      padding: var(--hx-button-padding-sm, var(--hx-spacing-xs) var(--hx-spacing-sm));
      font-size: var(--hx-button-font-size-sm, var(--hx-font-size-sm));
    }

    :host([size='md']) button {
      padding: var(--hx-button-padding-md, var(--hx-spacing-sm) var(--hx-spacing-md));
      font-size: var(--hx-button-font-size-md, var(--hx-font-size-md));
    }

    :host([size='lg']) button {
      padding: var(--hx-button-padding-lg, var(--hx-spacing-md) var(--hx-spacing-lg));
      font-size: var(--hx-button-font-size-lg, var(--hx-font-size-lg));
    }
  `;

  override render() {
    return html`
      <button part="button" ?disabled=${this.disabled}>
        <slot></slot>
      </button>
    `;
  }
}
```

No CSS class manipulation is needed — `size` reflects to an attribute and the cascade handles the rest.

---

## Composing Multiple Mixins

Mixins compose by chaining. Each mixin wraps the result of the previous one:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends FocusableMixin(SizeMixin(DisabledMixin(LitElement))) {
  // DisabledMixin runs first (innermost), FocusableMixin last (outermost)
}
```

The leftmost mixin is applied last and wraps the others. This means its lifecycle methods run first. If you have:

```typescript
class A extends C(B(LitElement)) {}
```

The prototype chain is: `A → C-returned-class → B-returned-class → LitElement`.

When `connectedCallback()` is called:

1. `C`'s override runs
2. `C` calls `super.connectedCallback()` → `B`'s override runs
3. `B` calls `super.connectedCallback()` → `LitElement.connectedCallback()` runs

This means **every mixin must call `super` in any lifecycle override**:

```typescript
export function LoggingMixin<TBase extends Constructor<LitElement>>(Base: TBase) {
  class LoggingElement extends Base {
    override connectedCallback(): void {
      super.connectedCallback(); // Always call super
      console.log(`${this.tagName} connected`);
    }
  }

  return LoggingElement;
}
```

---

## Mixin Ordering and Conflict Resolution

When two mixins define the same property or method, the outermost mixin (leftmost in the chain) wins.

### Property conflicts

If two mixins both define `disabled`, the last mixin applied (outermost/leftmost) controls the final property descriptor. To prevent silent conflicts, use the TypeScript intersection approach to declare what the mixin depends on:

```typescript
// Signal that this mixin expects the host to already have `disabled`
interface WithDisabled {
  disabled: boolean;
}

export function DisabledAriaSync<TBase extends Constructor<LitElement & WithDisabled>>(
  Base: TBase,
) {
  class SyncedElement extends Base {
    override updated(changed: Map<string, unknown>): void {
      super.updated(changed);

      if (changed.has('disabled')) {
        // Sync aria-disabled on the host element itself (light DOM label patterns)
        this.toggleAttribute('aria-disabled', this.disabled);
      }
    }
  }

  return SyncedElement;
}
```

This mixin reads `disabled` but does not declare it — that is `DisabledMixin`'s job. By declaring `WithDisabled` in the constraint, TypeScript errors at compile time if the mixin is applied without `DisabledMixin` in the chain.

### Method conflicts

For lifecycle methods (`connectedCallback`, `updated`, `render`), the chain is inherently ordered. Document the expected ordering in JSDoc:

```typescript
/**
 * Must be applied after DisabledMixin in the composition chain so that
 * `this.disabled` is available when `updated()` runs.
 *
 * Correct:   DisabledAriaSync(DisabledMixin(LitElement))
 * Incorrect: DisabledMixin(DisabledAriaSync(LitElement))
 */
export function DisabledAriaSync<TBase extends Constructor<LitElement & WithDisabled>>(
  Base: TBase,
) {
  // ...
}
```

---

## Testing Mixin Behavior

Mixins are tested through a concrete component that applies them. Create a minimal test fixture in your test file:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fixture, cleanup } from '../../test-utils.js';
import { DisabledMixin } from './disabled-mixin.js';

// Minimal test host — register once in this test file
@customElement('test-disabled-element')
class TestDisabledElement extends DisabledMixin(LitElement) {
  override render() {
    return html`<button part="focus-target" ?disabled=${this.disabled}>Click</button>`;
  }
}

describe('DisabledMixin', () => {
  afterEach(cleanup);

  it('defaults to enabled', async () => {
    const el = await fixture<TestDisabledElement>(
      html`<test-disabled-element></test-disabled-element>`,
    );

    expect(el.disabled).toBe(false);
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('reflects disabled to attribute', async () => {
    const el = await fixture<TestDisabledElement>(
      html`<test-disabled-element disabled></test-disabled-element>`,
    );

    expect(el.disabled).toBe(true);
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('isDisabled returns false when enabled', async () => {
    const el = await fixture<TestDisabledElement>(
      html`<test-disabled-element></test-disabled-element>`,
    );

    // Access protected method via cast for testing
    expect((el as unknown as { isDisabled(): boolean }).isDisabled()).toBe(false);
  });

  it('isDisabled returns true when disabled', async () => {
    const el = await fixture<TestDisabledElement>(
      html`<test-disabled-element disabled></test-disabled-element>`,
    );

    expect((el as unknown as { isDisabled(): boolean }).isDisabled()).toBe(true);
  });

  it('ariaDisabledAttr returns "true" when disabled', async () => {
    const el = await fixture<TestDisabledElement>(
      html`<test-disabled-element disabled></test-disabled-element>`,
    );

    expect((el as unknown as { ariaDisabledAttr: string }).ariaDisabledAttr).toBe('true');
  });

  it('setting disabled property triggers re-render', async () => {
    const el = await fixture<TestDisabledElement>(
      html`<test-disabled-element></test-disabled-element>`,
    );

    el.disabled = true;
    await el.updateComplete;

    const button = el.shadowRoot!.querySelector('button');
    expect(button?.disabled).toBe(true);
  });
});
```

For mixins with multiple dependents (like `DisabledMixin` on both `hx-button` and `hx-text-input`), each component's own test suite implicitly covers the mixin behavior. Only test the mixin directly when the mixin contains logic that is not component-specific.

---

## Mixins vs Reactive Controllers

This is the most important decision when choosing a reuse pattern. The distinction is clear-cut:

| Question                                                         | Answer | Use        |
| ---------------------------------------------------------------- | ------ | ---------- |
| Does the behavior need `@property()` or `@state()` decorators?   | Yes    | Mixin      |
| Does the behavior contribute template markup via `render()`?     | Yes    | Mixin      |
| Does the behavior only need lifecycle hooks and external APIs?   | Yes    | Controller |
| Do you need multiple instances of the behavior on one component? | Yes    | Controller |
| Is the behavior independently testable without a real component? | Yes    | Controller |
| Does the behavior define part of the component's public API?     | Yes    | Mixin      |

### Mixins add state and template integration

Mixins are the right tool when the shared behavior is intrinsic to what the component is. `disabled` is not a behavior that sits alongside the component — it is part of the component's identity and public API. The same applies to `size` and `focusable`. These belong in mixins.

### Controllers add reactive behavior

Controllers are the right tool when the shared behavior is something the component uses, not something it is. A `ResizeObserver` setup, a keyboard shortcut listener, or a lazy-load watcher are services the component consumes. They don't add to the public API surface and they don't need reactive decorators.

```typescript
// Correct: disabled is identity-level — use a mixin
export class HelixButton extends DisabledMixin(LitElement) { ... }

// Correct: resize observation is a service — use a controller
export class HelixCard extends LitElement {
  private resize = new ResizeController(this);
}

// Wrong: resize controller does not need to be a mixin
export class HelixCard extends ResizeMixin(LitElement) { ... }

// Wrong: disabled as a controller adds awkward external state
export class HelixButton extends LitElement {
  private disabled = new DisabledController(this); // Doesn't integrate with @property
}
```

---

## Complete Example: DisabledMixin Across the Library

The following shows the complete, production-ready `DisabledMixin` as it would be implemented in `packages/hx-library/src/mixins/disabled-mixin.ts` and consumed by both `hx-button` and `hx-text-input`.

**`/packages/hx-library/src/mixins/disabled-mixin.ts`**

````typescript
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { nothing } from 'lit';

type Constructor<T = object> = new (...args: unknown[]) => T;

/**
 * Shared mixin for interactive components that support a `disabled` state.
 *
 * Adds:
 * - `disabled` reactive property reflected to the `disabled` attribute
 * - `ariaDisabledAttr` protected getter for non-natively-disableable elements
 * - `isDisabled()` protected guard method for event handlers
 *
 * Used by: hx-button, hx-text-input, hx-select, hx-checkbox, hx-switch
 *
 * @example
 * ```typescript
 * @customElement('hx-button')
 * export class HelixButton extends DisabledMixin(LitElement) { ... }
 * ```
 */
export function DisabledMixin<TBase extends Constructor<LitElement>>(Base: TBase) {
  class DisabledElement extends Base {
    /**
     * When true, the component does not respond to user interaction.
     * @attr
     * @reflect
     */
    @property({ type: Boolean, reflect: true })
    disabled = false;

    /**
     * Returns `'true'` when disabled (for `aria-disabled` on non-native elements),
     * or `nothing` to omit the attribute entirely when enabled.
     */
    protected get ariaDisabledAttr(): 'true' | typeof nothing {
      return this.disabled ? 'true' : nothing;
    }

    /**
     * Returns true if the component is currently disabled.
     * Use this as a guard at the top of event handlers.
     *
     * @example
     * ```typescript
     * private _handleClick(): void {
     *   if (this.isDisabled()) return;
     *   // ...
     * }
     * ```
     */
    protected isDisabled(): boolean {
      return this.disabled;
    }
  }

  return DisabledElement;
}
````

**`/packages/hx-library/src/components/hx-button/hx-button.ts`** (excerpt)

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { DisabledMixin } from '../../mixins/disabled-mixin.js';
import { SizeMixin } from '../../mixins/size-mixin.js';
import { buttonStyles } from './hx-button.styles.js';

@customElement('hx-button')
export class HelixButton extends SizeMixin(DisabledMixin(LitElement)) {
  static override styles = buttonStyles;

  @property({ type: String })
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';

  @property({ type: String })
  type: 'button' | 'submit' | 'reset' = 'button';

  private _handleClick(e: MouseEvent): void {
    if (this.isDisabled()) {
      e.stopImmediatePropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent('hx-click', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <button
        part="button"
        type=${this.type}
        ?disabled=${this.disabled}
        aria-disabled=${this.ariaDisabledAttr}
        @click=${this._handleClick}
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </button>
    `;
  }
}
```

**`/packages/hx-library/src/components/hx-text-input/hx-text-input.ts`** (excerpt)

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { DisabledMixin } from '../../mixins/disabled-mixin.js';
import { SizeMixin } from '../../mixins/size-mixin.js';
import { textInputStyles } from './hx-text-input.styles.js';

@customElement('hx-text-input')
export class HelixTextInput extends SizeMixin(DisabledMixin(LitElement)) {
  static formAssociated = true;
  static override styles = textInputStyles;

  private _internals: ElementInternals;

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: String })
  name = '';

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private _handleInput(e: Event): void {
    if (this.isDisabled()) return;

    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);

    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  override render() {
    return html`
      <div part="field">
        <slot name="label">
          ${this.label ? html`<label part="label">${this.label}</label>` : nothing}
        </slot>
        <input
          part="input"
          .value=${live(this.value)}
          name=${this.name}
          ?disabled=${this.disabled}
          aria-disabled=${this.ariaDisabledAttr}
          @input=${this._handleInput}
        />
      </div>
    `;
  }
}
```

Both components get identical `disabled` behavior — attribute reflection, CSS hooks, ARIA output, and the event-guard method — from a single 30-line source file.

---

## Best Practices

### Always call super in lifecycle overrides

Forgetting `super.connectedCallback()` silently breaks everything downstream in the mixin chain:

```typescript
// Wrong
override connectedCallback(): void {
  this.addEventListener('keydown', this._handleKey);
}

// Correct
override connectedCallback(): void {
  super.connectedCallback();
  this.addEventListener('keydown', this._handleKey);
}
```

### Document the mixin's constraints and ordering

Use JSDoc to describe any interface prerequisites and required composition order:

```typescript
/**
 * Must be applied after DisabledMixin.
 * @example SomeMixin(DisabledMixin(LitElement))
 */
export function SomeMixin<TBase extends Constructor<LitElement & { disabled: boolean }>>(
  Base: TBase,
) { ... }
```

### Keep mixins narrow

A mixin that does one thing is easy to test and compose. If you find yourself adding a fifth property to a mixin, split it.

### Prefer attribute reflection for state that CSS needs to see

Reflected attributes let styles respond with `:host([disabled])` and `:host([size="sm"])` without any class manipulation in the component's `render()` method.

### Use `nothing` to omit optional attributes

When a mixin conditionally sets an attribute (like `aria-disabled`), use `nothing` from Lit rather than an empty string or `undefined`. Empty strings still render the attribute.

---

## References

- [Lit — Mixins](https://lit.dev/docs/composition/mixins/)
- [TypeScript Handbook — Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)
- [MDN — ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [Reactive Controllers](/components/advanced/controllers) — for the alternative reuse pattern
- [Component Composition Patterns](/components/advanced/composition-patterns) — for slot-based composition
