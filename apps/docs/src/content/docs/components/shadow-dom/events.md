---
title: Shadow DOM Events
description: Understanding event propagation, retargeting, composed events, and cross-shadow communication patterns in Shadow DOM.
sidebar:
  order: 5
---

Events are the communication backbone of web applications. In Shadow DOM, event propagation follows special rules that preserve component encapsulation while enabling seamless interaction with the broader document. Understanding event retargeting, the `composed` flag, `composedPath()`, and cross-boundary communication patterns is essential for building enterprise-grade web components.

This guide provides a comprehensive exploration of Shadow DOM event behavior, from fundamental propagation rules to advanced communication patterns, with real-world examples from wc-2026 components.

## Prerequisites

Before reading this guide, you should understand:

- [Shadow DOM Architecture](/components/shadow-dom/architecture) — Shadow boundaries, shadow roots, and encapsulation fundamentals
- Basic JavaScript event handling (addEventListener, event bubbling, capture phase)
- Web Components lifecycle and custom elements

## Event Propagation Fundamentals

### Standard DOM Event Flow

In a standard DOM tree without Shadow DOM, events follow a three-phase propagation model:

1. **Capture phase** — Event travels from `window` down through ancestors to the target element
2. **Target phase** — Event reaches the actual target element where the event originated
3. **Bubble phase** — Event travels back up through ancestors to `window`

```javascript
document.addEventListener('click', handler, true); // Capture phase
element.addEventListener('click', handler); // Bubble phase (default)
```

This model remains intact with Shadow DOM, but with additional rules when events cross shadow boundaries.

### The Shadow DOM Challenge

Shadow DOM introduces a critical question: when an event originates inside a shadow tree, how should it propagate through shadow boundaries? The answer involves two complementary mechanisms:

1. **Event retargeting** — Adjusting `event.target` as events cross shadow boundaries to preserve encapsulation
2. **Event composition** — Determining whether an event can cross shadow boundaries at all

These mechanisms work together to maintain the encapsulation contract while enabling practical component communication.

## Event Retargeting

Event retargeting is Shadow DOM's mechanism for preserving implementation details. When a composed event crosses a shadow boundary, the browser automatically adjusts `event.target` to reference the shadow host element instead of the internal element that triggered the event.

### Why Retargeting Exists

Without retargeting, external event listeners would receive `event.target` references pointing to elements inside the shadow tree. This would violate encapsulation by exposing internal implementation details that consumers should not depend on.

Consider a button component. The consumer interacts with `<hx-button>`, not the internal `<button>` element inside its shadow DOM. If `event.target` exposed the internal button, consumers could:

- Query its classes and attributes (implementation details)
- Manipulate its DOM structure (breaking the component)
- Depend on its existence (preventing refactoring)

Retargeting prevents these issues by presenting `<hx-button>` as the event target when listeners observe from outside the shadow boundary.

### How Retargeting Works

```javascript
// Component implementation
class HxButton extends LitElement {
  render() {
    return html`
      <button @click=${this._handleClick} part="button">
        <slot></slot>
      </button>
    `;
  }

  _handleClick(event) {
    console.log('Inside shadow DOM:');
    console.log('  event.target =', event.target);
    // → <button part="button">...</button>
    console.log('  event.currentTarget =', event.currentTarget);
    // → <button part="button">...</button>
  }
}

// Consumer code (light DOM)
const wcButton = document.querySelector('hx-button');
wcButton.addEventListener('click', (event) => {
  console.log('Outside shadow DOM:');
  console.log('  event.target =', event.target);
  // → <hx-button> (retargeted!)
  console.log('  event.currentTarget =', event.currentTarget);
  // → <hx-button>
});
```

**Key insight**: The same event has different `event.target` values depending on where the listener is attached. Inside the shadow tree, you see the original target. Outside the shadow boundary, you see the host element.

### Retargeting Rules

Event retargeting follows these precise rules:

1. **Within the same shadow root**: `event.target` is the actual element that triggered the event
2. **Crossing a shadow boundary**: `event.target` is retargeted to the shadow host element
3. **Multiple nested shadow boundaries**: Retargeting happens independently at each boundary
4. **Slotted elements**: Events on slotted content are **not retargeted** because the element physically lives in light DOM

### Visualizing Retargeting

```
Document:
  <body>
    <hx-card id="card1">
      #shadow-root
        <div class="card-wrapper">
          <button class="internal-btn">Click</button>
        </div>
    </hx-card>
  </body>

Event Listener Locations:
┌─────────────────────────────────────────────────────────────────┐
│ Listener on document:                                           │
│   event.target → hx-card                    (retargeted)        │
│   event.currentTarget → document                                │
├─────────────────────────────────────────────────────────────────┤
│ Listener on hx-card (shadow host):                              │
│   event.target → hx-card                    (retargeted)        │
│   event.currentTarget → hx-card                                 │
├─────────────────────────────────────────────────────────────────┤
│ Listener inside shadow DOM (on .card-wrapper):                  │
│   event.target → button.internal-btn        (original)          │
│   event.currentTarget → div.card-wrapper                        │
└─────────────────────────────────────────────────────────────────┘
```

### Retargeting with Slotted Content

Slotted elements are a special case. Because they physically live in the light DOM (they are projected into shadow DOM via `<slot>` elements), events originating from slotted content are **not retargeted**.

```html
<hx-card>
  <button slot="action">Save</button>
  <!--        ↑
       This button lives in light DOM,
       even though it renders inside the shadow tree
  -->
</hx-card>
```

```javascript
// Component shadow DOM
render() {
  return html`
    <div class="card">
      <div class="content"><slot></slot></div>
      <div class="actions"><slot name="action"></slot></div>
    </div>
  `;
}

// External listener
document.addEventListener('click', (event) => {
  console.log(event.target);
  // → <button slot="action">Save</button>
  // NOT retargeted, because the button is slotted content (light DOM)
});
```

This behavior is intentional. Slotted content is authored by the component consumer, not the component implementer, so exposing it does not break encapsulation.

## The `composed` Flag

While retargeting determines how `event.target` appears at each scope, the `composed` property determines whether an event can cross shadow boundaries at all.

### Understanding Composition

When an event has `composed: false` (the default for custom events), the event is **trapped inside the shadow tree** and never reaches the light DOM. When `composed: true`, the event crosses shadow boundaries during both capture and bubble phases.

```typescript
// Event TRAPPED inside shadow DOM
this.dispatchEvent(
  new CustomEvent('internal-update', {
    bubbles: true,
    composed: false, // ← Default; event stops at shadow boundary
  }),
);

// Event CROSSES shadow boundaries
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true, // ← Event can escape shadow DOM
  }),
);
```

### Browser-Generated Events

Most events generated by the browser are `composed: true` by default, meaning they cross shadow boundaries:

**Composed events** (cross shadow boundaries):

- **Mouse events**: `click`, `dblclick`, `mousedown`, `mouseup`, `mousemove`, `mouseout`, `mouseover`
- **Pointer events**: `pointerdown`, `pointerup`, `pointermove`, `pointerover`, `pointerout`, `pointerenter`, `pointerleave`
- **Touch events**: `touchstart`, `touchend`, `touchmove`, `touchcancel`
- **Keyboard events**: `keydown`, `keyup`, `keypress`
- **Focus events**: `focus`, `blur`, `focusin`, `focusout`
- **Input events**: `input`, `change`, `beforeinput`
- **Form events**: `submit`, `reset`, `formdata`
- **Drag events**: `drag`, `drop`, `dragstart`, `dragend`, `dragenter`, `dragleave`, `dragover`
- **Clipboard events**: `copy`, `cut`, `paste`

**Non-composed events** (do not cross shadow boundaries):

- `load`, `error`, `abort`
- `scroll` (in most contexts)
- `resize`
- `select`
- `slotchange`

:::tip[Focus Event Best Practices]
When working with Shadow DOM, prefer `focusin` and `focusout` over `focus` and `blur`. The `focusin`/`focusout` events bubble (while `focus`/`blur` do not), making them better suited for event delegation and cross-boundary listening in component hierarchies.
:::

### Custom Events and `composed`

When you dispatch a custom event from a web component, you must explicitly set `composed: true` to allow it to cross shadow boundaries:

```typescript
// ✗ WRONG: Event trapped inside shadow tree
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    // composed defaults to false
    detail: { value: this.value },
  }),
);

// ✓ CORRECT: Event crosses shadow boundaries
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true, // ← Required for cross-boundary propagation
    detail: { value: this.value },
  }),
);
```

### Why Both `bubbles` and `composed` Matter

These two flags serve distinct, complementary purposes:

| Flag             | Purpose                                                           | Scope                                                 |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| `bubbles: true`  | Event propagates up the DOM tree within the same document context | Works within light DOM or within a single shadow tree |
| `composed: true` | Event crosses shadow boundaries during propagation                | Required for events to escape shadow DOM              |

For web components, you almost always want **both** flags set to `true`:

```typescript
// ✓ BEST: Bubbles AND composed
new CustomEvent('hx-change', {
  bubbles: true,
  composed: true,
  detail: { value: this.value },
});

// ✗ Event bubbles but is trapped inside shadow tree
new CustomEvent('hx-change', {
  bubbles: true,
  composed: false, // default
  detail: { value },
});

// ✗ Event crosses shadow boundary but doesn't propagate up
new CustomEvent('hx-change', {
  bubbles: false,
  composed: true,
  detail: { value },
});
```

### Real-World Example: hx-text-input

```typescript
// From packages/hx-library/src/components/hx-text-input/hx-text-input.ts
private _handleInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  this.value = target.value;
  this._internals.setFormValue(this.value);

  // Dispatched on every keystroke
  this.dispatchEvent(new CustomEvent('hx-input', {
    bubbles: true,      // ✓ Propagates up the tree
    composed: true,     // ✓ Crosses shadow boundaries
    detail: { value: this.value }
  }));
}

private _handleChange(e: Event): void {
  const target = e.target as HTMLInputElement;
  this.value = target.value;
  this._internals.setFormValue(this.value);
  this._updateValidity();

  // Dispatched on blur after value changed
  this.dispatchEvent(new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: { value: this.value }
  }));
}
```

This pattern appears consistently across all wc-2026 form components:

- `hx-checkbox` — dispatches `hx-change` with `composed: true`
- `hx-select` — dispatches `hx-change` with `composed: true`
- `wc-radio-group` — dispatches `hx-change` with `composed: true`
- `wc-textarea` — dispatches `hx-input` and `hx-change` with `composed: true`

## Event Bubbling Through Shadow Boundaries

Understanding how events bubble through shadow trees is essential for effective event delegation and component composition.

### Single Shadow Boundary

```
Light DOM:
  <body>
    <hx-button>  ← shadow host
      #shadow-root
        <button>  ← native button (original target)
          <slot></slot>
        </button>
    </hx-button>
  </body>
```

When the native `<button>` inside `hx-button` is clicked:

**Capture phase** (top-down):

```
window → document → body → hx-button → #shadow-root → button
```

**Target phase**:

```
Event fires on <button>
```

**Bubble phase** (bottom-up):

```
button → #shadow-root → hx-button → body → document → window
```

Event listeners in the light DOM see `event.target` as `<hx-button>`, not `<button>`.

### Nested Shadow Roots

When shadow roots are nested (components inside components), events propagate through each boundary with independent retargeting:

```
Light DOM:
  <wc-form>               ← outer shadow host
    #shadow-root
      <form>
        <slot></slot>     ← Projects hx-text-input
      </form>

    <hx-text-input>       ← inner shadow host (slotted into wc-form)
      #shadow-root
        <input>           ← native input (original target)
      </hx-text-input>
  </wc-form>
```

When the native `<input>` fires a `change` event:

1. Event bubbles through `hx-text-input`'s shadow root
2. Event is retargeted to `<hx-text-input>` when crossing that shadow boundary
3. Event propagates through `wc-form`'s shadow root (via the `<slot>`)
4. Event is retargeted to `<wc-form>` when crossing that shadow boundary
5. Event continues bubbling through light DOM

**Listeners at each level see different `event.target` values:**

| Listener Location             | `event.target` Value                             |
| ----------------------------- | ------------------------------------------------ |
| Inside `hx-text-input` shadow | `<input>` (original)                             |
| On `hx-text-input` element    | `<hx-text-input>` (retargeted at first boundary) |
| Inside `wc-form` shadow       | `<hx-text-input>` (slotted element)              |
| On `wc-form` element          | `<wc-form>` (retargeted at second boundary)      |
| On `document`                 | `<wc-form>` (final retargeted value)             |

### Propagation Visualization

```
EVENT: click on <input> inside <hx-text-input> inside <wc-form>

┌─ Capture Phase ────────────────────────────────────────────────┐
│                                                                 │
│  window → document → body                                       │
│    ↓                                                            │
│  wc-form (event.target = wc-form)                               │
│    ↓                                                            │
│  [crosses shadow boundary into wc-form's shadow]                │
│    ↓                                                            │
│  <form> → <slot>                                                │
│    ↓                                                            │
│  hx-text-input (event.target = hx-text-input)                   │
│    ↓                                                            │
│  [crosses shadow boundary into hx-text-input's shadow]          │
│    ↓                                                            │
│  <input> (event.target = input)                                 │
│                                                                 │
├─ Target Phase ─────────────────────────────────────────────────┤
│                                                                 │
│  Event fires on <input>                                         │
│                                                                 │
├─ Bubble Phase ─────────────────────────────────────────────────┤
│                                                                 │
│  <input> (event.target = input)                                 │
│    ↑                                                            │
│  [crosses shadow boundary exiting hx-text-input's shadow]       │
│    ↑                                                            │
│  hx-text-input (event.target = hx-text-input) ← retargeted     │
│    ↑                                                            │
│  <slot> → <form>                                                │
│    ↑                                                            │
│  [crosses shadow boundary exiting wc-form's shadow]             │
│    ↑                                                            │
│  wc-form (event.target = wc-form) ← retargeted                  │
│    ↑                                                            │
│  body → document → window                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## `event.composedPath()`

The `composedPath()` method returns the full path the event will follow during propagation, including elements inside shadow trees that would normally be hidden by retargeting.

### Basic Usage

```typescript
document.addEventListener('click', (event) => {
  console.log('Retargeted target:', event.target);
  console.log('Full event path:', event.composedPath());
});
```

**Example output when clicking a button inside `<hx-checkbox>`**:

```javascript
// Retargeted target:
wc -
  checkbox[
    // Full event path:
    (button.checkbox__control, // index 0: original target (inside shadow)
    label.checkbox__wrapper,
    div.checkbox,
    ShadowRoot,
    wc - checkbox, // index 4: shadow host
    div.form - group,
    body,
    html,
    HTMLDocument,
    Window)
  ];
```

### Why `composedPath()` Is Essential

1. **Debugging** — Inspect the complete event path including shadow internals
2. **Event delegation** — Identify elements inside shadow roots for advanced delegation patterns
3. **Custom routing** — Implement sophisticated event handling that crosses shadow boundaries
4. **Testing** — Verify events propagate through expected component hierarchies

### Practical Example: Finding Data Attributes

```typescript
// Find the first element in the path with a data-action attribute
document.addEventListener('click', (event) => {
  const path = event.composedPath();

  const actionElement = path.find((el) => el instanceof HTMLElement && el.dataset.action);

  if (actionElement instanceof HTMLElement) {
    const action = actionElement.dataset.action;
    console.log('Action triggered:', action);

    // This works even if actionElement is inside a shadow root,
    // because composedPath() includes shadow internals
  }
});
```

### `composedPath()` and Closed Shadow Roots

If a shadow root is created with `mode: 'closed'`, `composedPath()` will **not include elements inside that shadow tree** for listeners outside the closed boundary:

```typescript
// Component with closed shadow root
class SecretComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'closed' }); // ← closed mode
    this.shadowRoot.innerHTML = `
      <button>Secret Button</button>
    `;
  }
}

// External listener
document.addEventListener('click', (event) => {
  console.log(event.composedPath());
  // → [secret-component, body, html, document, window]
  // Does NOT include <button> or ShadowRoot
});
```

**Recommendation**: Always use `mode: 'open'` (the default for Lit) unless you have specific security requirements. Closed shadow roots complicate debugging and break `composedPath()` inspection without providing real security benefits (browser DevTools can bypass closed mode).

### wc-2026 Convention

All wc-2026 components use **open mode** shadow roots for maximum testability, accessibility tooling compatibility, and developer experience.

## Cross-Shadow Communication Patterns

Web components need to communicate across shadow boundaries. Here are proven patterns used in wc-2026 components.

### Pattern 1: Custom Events (Child → Parent)

The most common pattern: child components dispatch custom events that parent components or applications listen for.

**Child component dispatches event:**

```typescript
class WcTextInput extends LitElement {
  private _handleInput(e: Event): void {
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
}
```

**Parent component or application listens:**

```typescript
const input = document.querySelector('hx-text-input');
input.addEventListener('hx-input', (event) => {
  console.log('User typed:', event.detail.value);
});
```

**Benefits:**

- Decoupled — child doesn't need to know about parent
- Standard DOM pattern (works with any event listener)
- Enables event delegation
- Framework-agnostic

**Drawbacks:**

- One-way communication only (child → parent)
- No return values
- Requires consumers to listen for events

### Pattern 2: Properties and Attributes (Parent → Child)

The parent sets properties or attributes on child components to pass data down.

**Declarative (HTML attributes):**

```html
<hx-text-input
  label="Email Address"
  required
  value="user@example.com"
  error="Invalid email format"
></hx-text-input>
```

**Programmatic (JavaScript properties):**

```typescript
const input = document.querySelector('hx-text-input');
input.label = 'Email Address';
input.required = true;
input.value = 'user@example.com';
input.error = 'Invalid email format';
```

**Benefits:**

- Standard HTML/DOM pattern
- Works declaratively with frameworks (React, Vue, Lit, etc.)
- Easy to reason about
- Type-safe (with TypeScript)

**Drawbacks:**

- One-way communication only (parent → child)
- Attributes are always strings (properties support any type)
- Cannot pass complex objects via attributes

### Pattern 3: Methods (Parent → Child)

For imperative interactions, components expose public methods:

```typescript
// hx-text-input exposes focus() and select()
const input = document.querySelector('hx-text-input');
input.focus(); // ← Calls the component's focus() method
input.select(); // ← Calls the component's select() method
```

**Component implementation:**

```typescript
class WcTextInput extends LitElement {
  private _input?: HTMLInputElement;

  /** Moves focus to the input element. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  /** Selects all text in the input. */
  select(): void {
    this._input?.select();
  }
}
```

**Benefits:**

- Imperative control for complex interactions
- Can trigger multiple state changes atomically
- Can return values
- Type-safe with TypeScript

**Drawbacks:**

- Requires JavaScript (doesn't work declaratively)
- Harder to integrate with declarative frameworks
- More difficult to test than declarative patterns

### Pattern 4: Event Delegation

Listen for events at a higher level in the DOM tree, even if the actual target is inside a shadow root:

```typescript
// Listen on document for all hx-change events
document.addEventListener('hx-change', (event) => {
  const component = event.target; // Retargeted to shadow host
  console.log('Component changed:', component.tagName, event.detail);

  if (component.matches('hx-text-input')) {
    console.log('Text input changed to:', event.detail.value);
  }
});
```

This works because:

1. Custom events are dispatched with `composed: true`
2. Events bubble through shadow boundaries
3. `event.target` is retargeted to the shadow host

**Real-world example: Form validation controller**

```typescript
class FormController {
  constructor(formElement) {
    formElement.addEventListener('hx-change', this._handleChange);
  }

  _handleChange = (event) => {
    // Works for hx-text-input, hx-checkbox, hx-select, etc.
    const field = event.target;
    const value = event.detail.value;

    this.validateField(field, value);
  };
}
```

**Benefits:**

- Single listener handles multiple components
- Scales to dynamic content
- Reduces memory overhead
- Supports heterogeneous component types

**Drawbacks:**

- Requires careful event naming conventions
- Can make debugging harder
- Must filter events by component type

### Pattern 5: Parent-Child Coordination via Internal Events

Components coordinate with their children using internal events that are stopped from propagating to external consumers:

```typescript
// wc-radio-group listens for wc-radio-select events from children
class WcRadioGroup extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('hx-radio-select', this._handleRadioSelect);
  }

  private _handleRadioSelect = (e: CustomEvent<{ value: string }>) => {
    e.stopPropagation(); // ← Stop internal event from leaking

    const newValue = e.detail.value;
    this.value = newValue;
    this._internals.setFormValue(this.value);
    this._updateValidity();

    // Dispatch public event for external consumers
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };
}
```

**Benefits:**

- Clear separation between internal and public APIs
- Parent coordinates children without tight coupling
- Public API remains clean and stable
- Internal implementation can evolve

**Drawbacks:**

- Requires discipline to maintain separation
- More events to document
- Can complicate debugging

### Pattern 6: Slots with `slotchange`

Monitor when slotted content changes and react accordingly:

```typescript
class HxSelect extends LitElement {
  render() {
    return html`
      <select @change=${this._handleNativeChange}>
        <!-- Options cloned here -->
      </select>
      <slot @slotchange=${this._handleSlotChange}></slot>
    `;
  }

  private _handleSlotChange(): void {
    this._syncOptions();
  }

  private _syncOptions(): void {
    const slot = this.shadowRoot?.querySelector('slot');
    const slottedOptions = slot
      ?.assignedElements({ flatten: true })
      .filter((el): el is HTMLOptionElement => el instanceof HTMLOptionElement);

    // Clone light DOM options into shadow DOM select
    slottedOptions?.forEach((option) => {
      const clone = option.cloneNode(true) as HTMLOptionElement;
      this.shadowRoot.querySelector('select')?.appendChild(clone);
    });
  }
}
```

**Benefits:**

- Reacts to DOM changes automatically
- Works with dynamic content
- Keeps shadow DOM in sync with light DOM

**Drawbacks:**

- `slotchange` fires frequently in dynamic applications
- Requires careful performance management
- Can lead to infinite loops if not handled carefully

## Best Practices for Custom Events

After analyzing wc-2026 component patterns, these best practices emerge:

### 1. Always Use `bubbles` and `composed`

```typescript
// ✓ CORRECT: All wc-2026 events follow this pattern
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: { value: this.value },
  }),
);

// ✗ WRONG: Event trapped in shadow tree
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    // composed defaults to false
  }),
);
```

### 2. Use Namespaced Event Names

Prefix event names with your library prefix to avoid collisions:

```typescript
// ✓ CORRECT: wc- prefix avoids collision with native events
new CustomEvent('hx-change', {
  /* ... */
});

// ✗ WRONG: Could collide with native events or other libraries
new CustomEvent('change', {
  /* ... */
});
```

### 3. Include Relevant Data in `detail`

```typescript
// ✓ CORRECT: Provides all context consumers need
new CustomEvent('hx-change', {
  detail: {
    value: this.value,
    checked: this.checked,
  },
});

// ✗ WRONG: Forces consumers to query the component
new CustomEvent('hx-change', {
  detail: {},
});
```

### 4. Document Events in JSDoc

```typescript
/**
 * Dispatched when the checkbox is toggled.
 * @event hx-change
 * @type {CustomEvent<{checked: boolean, value: string}>}
 */
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: { checked: this.checked, value: this.value },
  }),
);
```

This JSDoc annotation:

- Appears in Custom Elements Manifest (CEM)
- Generates Storybook autodocs
- Provides IDE autocomplete
- Documents the event contract

### 5. Stop Propagation for Internal Events Only

```typescript
// Internal event used for parent-child coordination
private _handleRadioSelect = (e: CustomEvent<{ value: string }>) => {
  e.stopPropagation();  // ← Prevents internal event from leaking

  // Handle internally, then dispatch public event
  this.value = e.detail.value;

  this.dispatchEvent(new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: { value: this.value }
  }));
};
```

### 6. Dispatch Events After State Updates

```typescript
// ✓ CORRECT: Update state before dispatching event
private _handleClick(): void {
  this.checked = !this.checked;
  this._internals.setFormValue(this.checked ? this.value : null);

  // State is consistent when event fires
  this.dispatchEvent(new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: { checked: this.checked }
  }));
}

// ✗ WRONG: Event dispatched before state update
private _handleClick(): void {
  this.dispatchEvent(new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: { checked: this.checked }  // ← Old value!
  }));

  this.checked = !this.checked;  // ← Happens after event
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Forgetting `composed: true`

**Problem**: Custom events don't escape the shadow tree.

```typescript
// ✗ WRONG: Event trapped inside shadow DOM
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    // composed defaults to false
  }),
);
```

**Solution**: Always set `composed: true` for public events.

```typescript
// ✓ CORRECT
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
  }),
);
```

### Pitfall 2: Relying on `event.target` Across Boundaries

**Problem**: `event.target` changes as the event crosses shadow boundaries.

```javascript
// Outside shadow DOM
document.addEventListener('click', (event) => {
  console.log(event.target.classList);
  // May not be what you expect if event crossed shadow boundary
});
```

**Solution**: Use `event.currentTarget` (the element the listener is attached to) or `composedPath()`:

```javascript
document.addEventListener('click', (event) => {
  const originalTarget = event.composedPath()[0];
  console.log('Original target:', originalTarget);
  console.log('Retargeted target:', event.target);
  console.log('Listener attached to:', event.currentTarget);
});
```

### Pitfall 3: Stopping Propagation Too Early

**Problem**: Stopping propagation inside a shadow root prevents external listeners from receiving the event.

```typescript
// ✗ WRONG: Prevents event from reaching parent
private _handleClick(event: Event): void {
  event.stopPropagation();  // ← Blocks all external listeners
  this.dispatchEvent(new CustomEvent('hx-click', {
    bubbles: true,
    composed: true
  }));
}
```

**Solution**: Don't stop propagation unless you specifically want to prevent parents from receiving the event.

```typescript
// ✓ CORRECT: Let events propagate naturally
private _handleClick(event: Event): void {
  // Don't call stopPropagation() unless necessary
  this.dispatchEvent(new CustomEvent('hx-click', {
    bubbles: true,
    composed: true
  }));
}
```

### Pitfall 4: Dispatching Events Before Component Initialization

**Problem**: Dispatching events in `constructor()` or before the element is in the DOM can fail.

```typescript
// ✗ WRONG: Element not yet connected to DOM
constructor() {
  super();
  this.dispatchEvent(new CustomEvent('ready'));  // May not work
}
```

**Solution**: Dispatch events after the component is fully initialized.

```typescript
// ✓ CORRECT: Wait until component is ready
override firstUpdated(): void {
  this.dispatchEvent(new CustomEvent('hx-ready', {
    bubbles: true,
    composed: true
  }));
}
```

### Pitfall 5: Not Handling Dynamic Slot Changes

**Problem**: Slotted content changes but component doesn't react.

**Solution**: Listen for `slotchange` events.

```typescript
render() {
  return html`
    <slot @slotchange=${this._handleSlotChange}></slot>
  `;
}

private _handleSlotChange(event: Event): void {
  const slot = event.target as HTMLSlotElement;
  const elements = slot.assignedElements();
  // React to slot changes
  this._updateInternalState(elements);
}
```

## Event Delegation with Shadow DOM

Event delegation is a performance optimization where you attach a single event listener to a parent element instead of individual listeners on each child.

### Classic Event Delegation (Without Shadow DOM)

```javascript
// Without shadow DOM
document.querySelector('.button-container').addEventListener('click', (event) => {
  if (event.target.matches('button')) {
    // Handle button click
  }
});
```

### Event Delegation with Shadow DOM

Event delegation still works, but you must account for retargeting:

```javascript
// With shadow DOM
document.querySelector('.component-container').addEventListener('click', (event) => {
  // event.target may be retargeted to a shadow host
  const target = event.target;

  if (target.matches('hx-button')) {
    // Clicked on hx-button (retargeted from internal <button>)
    console.log('Button clicked:', target);
  }
});
```

**Key difference**: You delegate based on the shadow host element, not the element inside the shadow tree.

### Using `composedPath()` for Deep Delegation

If you need to inspect elements inside shadow roots, use `composedPath()`:

```typescript
document.addEventListener('click', (event) => {
  const path = event.composedPath();

  // Check if any element in the path has a data-action attribute
  const actionElement = path.find((el) => el instanceof HTMLElement && el.dataset.action);

  if (actionElement instanceof HTMLElement) {
    const action = actionElement.dataset.action;
    console.log('Action triggered:', action);
    // Works even if actionElement is inside a shadow root
  }
});
```

## Summary

Shadow DOM events follow these core principles:

1. **Event retargeting** preserves encapsulation by adjusting `event.target` at shadow boundaries
2. **`composed: true`** is required for custom events to cross shadow boundaries
3. **`composedPath()`** provides the full event path including shadow internals
4. **Slotted content** is not retargeted because it lives in light DOM
5. **Browser events** are mostly composed by default; custom events are not

**Best practices for web component events:**

- Always use `bubbles: true` and `composed: true` for public custom events
- Use namespaced event names (`hx-change`, not `change`)
- Include relevant data in `event.detail`
- Document events in JSDoc for CEM generation
- Stop propagation only for internal coordination events
- Dispatch events after state updates complete

**Communication patterns:**

- **Child → Parent**: Custom events with `composed: true`
- **Parent → Child**: Properties, attributes, and methods
- **Delegation**: Listen at document level; use `composedPath()` when needed
- **Coordination**: Internal events (stopped) + public events (composed)

Understanding these patterns is essential for building enterprise-grade web components that integrate seamlessly with host applications, frameworks, and other components. Shadow DOM events preserve encapsulation while enabling practical, real-world communication—the foundation of healthcare-grade component systems.

## Next Steps

- [Advanced Slots](/components/shadow-dom/advanced-slots) — Dynamic slot manipulation and fallback patterns
- [CSS Parts](/components/shadow-dom/parts) — Expose controlled styling hooks to consumers
- [Form-Associated Custom Elements](/components/forms/form-association) — Integrate components with native forms
- [Testing Web Components](/testing/component-testing) — Test event behavior across shadow boundaries

## Sources

- [Event: composed property - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)
- [Event: composedPath() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath)
- [Shadow DOM and events - JavaScript.info](https://javascript.info/shadow-dom-events)
- [A complete guide on shadow DOM and event propagation - pmdartus](https://pm.dartus.fr/blog/a-complete-guide-on-shadow-dom-and-event-propagation/)
- [Events - Lit](https://lit.dev/docs/components/events/)
- [Shadow DOM v1 - web.dev](https://web.dev/articles/shadowdom-v1)
