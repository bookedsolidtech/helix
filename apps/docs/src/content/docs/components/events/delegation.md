---
title: Event Delegation Patterns
description: Master event delegation fundamentals including event.target vs event.currentTarget, delegated listener patterns, Shadow DOM considerations, performance benefits, and real-world examples from hx-library.
sidebar:
  order: 2
prev:
  link: /components/events/custom-events/
  label: Custom Events Best Practices
---

Event delegation is a powerful JavaScript pattern that allows you to handle events on multiple child elements with a single listener attached to a parent element. Instead of attaching individual event listeners to every interactive element, you attach one listener to a common ancestor and use event bubbling to catch events as they propagate up the DOM tree.

This guide covers event delegation fundamentals, the critical difference between `event.target` and `event.currentTarget`, delegation patterns in Shadow DOM contexts, performance benefits, and real-world examples from the hx-library component library.

## Why Event Delegation?

Event delegation solves several common problems in modern web development:

1. **Performance** — Reduces memory footprint by using fewer event listeners
2. **Dynamic content** — Automatically handles dynamically added/removed elements
3. **Simplified code** — Centralized event handling logic in one place
4. **Scalability** — Efficiently handles hundreds or thousands of interactive elements
5. **Framework compatibility** — Works across React, Vue, Angular, and vanilla JavaScript

### The Traditional Approach (No Delegation)

Without delegation, you must attach listeners to every interactive element:

```javascript
// Attach 100 individual listeners
const buttons = document.querySelectorAll('button');
buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    console.log('Button clicked:', event.target.textContent);
  });
});

// Problem: New buttons added later won't have listeners
const newButton = document.createElement('button');
newButton.textContent = 'New Button';
document.body.appendChild(newButton);
// This button won't respond to clicks unless you manually attach a listener
```

**Problems with this approach:**

- 100 event listeners consume significant memory
- Dynamically added elements require manual listener attachment
- Removing elements requires cleanup to prevent memory leaks
- More code to write and maintain

### The Event Delegation Approach

With delegation, you attach a single listener to a parent element:

```javascript
// Attach ONE listener to the parent
document.addEventListener('click', (event) => {
  // Check if the clicked element is a button
  if (event.target.matches('button')) {
    console.log('Button clicked:', event.target.textContent);
  }
});

// New buttons automatically work without additional listeners
const newButton = document.createElement('button');
newButton.textContent = 'New Button';
document.body.appendChild(newButton);
// This button responds to clicks automatically
```

**Benefits:**

- Single listener regardless of the number of buttons
- Dynamically added elements work immediately
- No cleanup required when elements are removed
- Less code, easier to maintain

## Event Bubbling: The Foundation of Delegation

Event delegation relies on **event bubbling**, the process by which events propagate up the DOM tree from the target element to its ancestors.

### Event Flow Phases

When an event occurs, it goes through three phases:

```
1. CAPTURE PHASE (top-down)
   window → document → body → parent → child

2. TARGET PHASE
   The event reaches the target element

3. BUBBLE PHASE (bottom-up)
   child → parent → body → document → window
```

Most event listeners operate during the **bubble phase** (the default), which is what makes delegation possible.

### Bubbling in Action

```html
<div id="parent">
  <button id="child">Click Me</button>
</div>

<script>
  const parent = document.getElementById('parent');
  const child = document.getElementById('child');

  parent.addEventListener('click', () => {
    console.log('Parent clicked'); // Fires due to bubbling
  });

  child.addEventListener('click', () => {
    console.log('Child clicked'); // Fires first
  });

  // Click the button:
  // Output:
  // "Child clicked"
  // "Parent clicked"  ← Event bubbled up
</script>
```

### Events That Don't Bubble

Not all events bubble. Events that **do not bubble** cannot be used with delegation:

| Non-Bubbling Events        | Workaround                                     |
| -------------------------- | ---------------------------------------------- |
| `focus`, `blur`            | Use `focusin`, `focusout` (bubble equivalents) |
| `mouseenter`, `mouseleave` | Use `mouseover`, `mouseout`                    |
| `load`, `unload`, `scroll` | Attach directly to target or use capture phase |
| `abort`, `error`           | Attach directly to target                      |

```javascript
// ✗ WRONG: focus doesn't bubble
document.addEventListener('focus', (event) => {
  console.log('This will never fire for child elements');
});

// ✓ CORRECT: focusin bubbles
document.addEventListener('focusin', (event) => {
  console.log('This fires for all child focus events');
});
```

## `event.target` vs `event.currentTarget`

Understanding the difference between `event.target` and `event.currentTarget` is critical for effective event delegation.

### Definitions

| Property              | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| `event.target`        | The element that originally fired the event (the **actual** element clicked) |
| `event.currentTarget` | The element to which the listener is attached (the **delegating** element)   |

### Visual Example

```html
<ul id="menu">
  <li>
    <button id="btn1">
      <span id="icon">🏠</span>
      <span id="text">Home</span>
    </button>
  </li>
</ul>
```

When you click on the "🏠" icon:

```javascript
const menu = document.getElementById('menu');

menu.addEventListener('click', (event) => {
  console.log('target:', event.target.id); // "icon" (what you clicked)
  console.log('currentTarget:', event.currentTarget.id); // "menu" (where listener is)
});

// Output when clicking the icon:
// target: icon
// currentTarget: menu
```

### Common Delegation Pattern

Use `event.target` to determine **what** was clicked, and `event.currentTarget` to access the element with the listener:

```javascript
// Delegate button clicks in a toolbar
const toolbar = document.getElementById('toolbar');

toolbar.addEventListener('click', (event) => {
  // Find the closest button ancestor (handles clicks on child elements)
  const button = event.target.closest('button');

  if (!button) {
    return; // Not a button click
  }

  if (toolbar.contains(button)) {
    handleButtonClick(button);
  }
});

function handleButtonClick(button) {
  console.log('Button clicked:', button.dataset.action);
}
```

### Why `closest()` Matters

When an element contains nested children (like icons or text spans), `event.target` might be the child, not the parent element you care about. The `closest()` method traverses **up** the DOM tree to find the first ancestor matching the selector:

```javascript
menu.addEventListener('click', (event) => {
  // ✗ WRONG: event.target might be <span>, not <button>
  if (event.target.tagName === 'BUTTON') {
    console.log('This might not fire if you clicked the icon');
  }

  // ✓ CORRECT: Find the button ancestor
  const button = event.target.closest('button');
  if (button && menu.contains(button)) {
    console.log('This always works');
  }
});
```

### `currentTarget` Is Only Available During Handler Execution

**Important**: `event.currentTarget` is only available **during** the event handler execution. If you reference it asynchronously (e.g., in a `setTimeout` or after `await`), it will be `null`.

```javascript
element.addEventListener('click', (event) => {
  console.log(event.currentTarget); // ✓ Works: HTMLElement

  setTimeout(() => {
    console.log(event.currentTarget); // ✗ null (handler finished)
  }, 100);

  // ✓ CORRECT: Save reference before async operation
  const currentTarget = event.currentTarget;
  setTimeout(() => {
    console.log(currentTarget); // ✓ Works: HTMLElement
  }, 100);
});
```

## Event Delegation Patterns

Common patterns for implementing event delegation in modern web applications.

### Pattern 1: Delegate by Element Type

Handle all clicks on a specific element type within a container:

```javascript
// Handle all button clicks in the document
document.addEventListener('click', (event) => {
  const button = event.target.closest('button');

  if (!button) {
    return;
  }

  console.log('Button clicked:', button.textContent);
});
```

### Pattern 2: Delegate by Class Name

Handle events on elements with a specific class:

```javascript
// Handle clicks on all elements with "action-button" class
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('action-button')) {
    const action = event.target.dataset.action;
    executeAction(action);
  }
});
```

### Pattern 3: Delegate by Data Attribute

Use data attributes for semantic event handling:

```javascript
// HTML:
// <button data-action="save">Save</button>
// <button data-action="cancel">Cancel</button>

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  switch (action) {
    case 'save':
      saveData();
      break;
    case 'cancel':
      cancelOperation();
      break;
  }
});
```

### Pattern 4: Delegate Multiple Event Types

Handle multiple event types with a single delegation pattern:

```javascript
const form = document.getElementById('myForm');

// Delegate both input and change events
form.addEventListener('input', handleFormInput);
form.addEventListener('change', handleFormChange);

function handleFormInput(event) {
  if (event.target.matches('input[type="text"]')) {
    console.log('Text input changed:', event.target.value);
  }
}

function handleFormChange(event) {
  if (event.target.matches('select')) {
    console.log('Select changed:', event.target.value);
  }
}
```

### Pattern 5: Constrained Delegation

Limit delegation to a specific container (not document-wide):

```javascript
// Only handle clicks within the sidebar
const sidebar = document.getElementById('sidebar');

sidebar.addEventListener('click', (event) => {
  const link = event.target.closest('a');

  // Ensure the link is actually inside our sidebar
  if (link && sidebar.contains(link)) {
    event.preventDefault();
    navigateTo(link.href);
  }
});
```

### Pattern 6: Conditional Delegation

Apply different logic based on event target characteristics:

```javascript
document.addEventListener('click', (event) => {
  const target = event.target;

  // Primary buttons
  if (target.matches('.btn-primary')) {
    handlePrimaryAction(target);
  }

  // Secondary buttons
  else if (target.matches('.btn-secondary')) {
    handleSecondaryAction(target);
  }

  // Danger zone actions
  else if (target.matches('.btn-danger')) {
    if (confirm('Are you sure?')) {
      handleDangerousAction(target);
    }
  }
});
```

## Event Delegation in Shadow DOM

Event delegation in Shadow DOM requires special consideration due to event retargeting and encapsulation boundaries.

### Shadow DOM Event Retargeting

When events bubble out of a shadow tree, the browser **retargets** the event so that `event.target` appears to be the shadow host (the custom element), not the internal element that actually fired the event.

```html
<my-button>
  #shadow-root
  <button>Click Me</button>
</my-button>
```

```javascript
// Light DOM listener
document.addEventListener('click', (event) => {
  console.log('target:', event.target.tagName);
  // Output: "MY-BUTTON" (not "BUTTON")
  // The internal <button> is hidden by retargeting
});
```

**Why retargeting happens:**

Shadow DOM encapsulation means light DOM code shouldn't know about internal implementation details. Retargeting preserves this abstraction by making events appear to originate from the shadow host.

### Accessing the Original Target with `composedPath()`

To access the **actual** element that fired the event (before retargeting), use `event.composedPath()`:

```javascript
document.addEventListener('click', (event) => {
  const path = event.composedPath();

  console.log('Visible target:', event.target.tagName); // "MY-BUTTON"
  console.log('Actual target:', path[0].tagName); // "BUTTON"
  console.log(
    'Full path:',
    path.map((el) => el.tagName || el),
  );
  // ["BUTTON", "MY-BUTTON", "BODY", "HTML", "DOCUMENT", Window]
});
```

**Use cases for `composedPath()`:**

- Debugging event propagation issues
- Accessing internal shadow DOM elements (in your own components)
- Advanced event coordination between shadow trees

**Security note**: `composedPath()` exposes shadow tree internals. Only use it in trusted contexts, not for public API design.

### Delegation Inside Shadow Roots

You can delegate events **inside** a shadow root by attaching listeners to the shadow root itself:

```javascript
class MyList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <ul>
        <li><button>Item 1</button></li>
        <li><button>Item 2</button></li>
        <li><button>Item 3</button></li>
      </ul>
    `;

    // Delegate clicks to shadow root
    this.shadowRoot.addEventListener('click', (event) => {
      const button = event.target.closest('button');

      if (button) {
        console.log('Button clicked:', button.textContent);

        // Dispatch custom event to light DOM
        this.dispatchEvent(
          new CustomEvent('item-selected', {
            bubbles: true,
            composed: true, // Cross shadow boundary
            detail: { label: button.textContent },
          }),
        );
      }
    });
  }
}

customElements.define('my-list', MyList);
```

### Delegation Across Shadow Boundaries

For events to cross shadow boundaries, they must have `composed: true`:

```javascript
// Inside web component
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true, // ← Required to cross shadow boundary
    detail: { value: this.value },
  }),
);

// Light DOM can delegate these events
document.addEventListener('hx-change', (event) => {
  console.log('A component changed:', event.target.tagName);
  console.log('New value:', event.detail.value);
});
```

**All native UI events are composed** (click, input, change, focus, blur, etc.), so you can delegate them across shadow boundaries without issue.

### Real-World Shadow DOM Delegation: hx-library

The hx-library uses delegation extensively for parent-child coordination:

```typescript
// hx-radio-group delegates hx-radio-select events from children
class HelixRadioGroup extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();

    // Delegate internal coordination events
    this.addEventListener('hx-radio-select', this._handleRadioSelect as EventListener);
  }

  private _handleRadioSelect = (e: CustomEvent<{ value: string }>): void => {
    e.stopPropagation(); // ← Internal event, don't let it escape

    const newValue = e.detail.value;
    if (newValue === this.value) {
      return;
    }

    // Update group state
    this.value = newValue;
    this._internals.setFormValue(this.value);
    this._syncRadios();

    // Dispatch public event for external consumers
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true, // ← Public event, let it escape
        detail: { value: this.value },
      }),
    );
  };
}
```

**Pattern**: Internal events for delegation, public events for API.

## Performance Benefits of Event Delegation

Event delegation provides measurable performance improvements in real-world applications.

### Memory Footprint Reduction

**Without delegation** (1000 buttons):

```javascript
const buttons = document.querySelectorAll('button');
// 1000 event listeners × ~100 bytes per listener ≈ 100KB memory
buttons.forEach((button) => {
  button.addEventListener('click', handleClick);
});
```

**With delegation** (1000 buttons):

```javascript
// 1 event listener × ~100 bytes ≈ 100 bytes memory
document.addEventListener('click', (event) => {
  if (event.target.matches('button')) {
    handleClick(event);
  }
});
```

**Memory saved**: ~99.9% (from 100KB to 100 bytes)

### Initialization Performance

**Benchmark**: Attaching listeners to 1000 buttons

| Approach             | Time  | Memory     |
| -------------------- | ----- | ---------- |
| Individual listeners | ~50ms | ~100KB     |
| Event delegation     | ~1ms  | ~100 bytes |

**50x faster initialization** with delegation.

### Handling Dynamic Content

**Without delegation**: Manual listener management

```javascript
function addButton(text) {
  const button = document.createElement('button');
  button.textContent = text;

  // Must manually attach listener
  button.addEventListener('click', handleClick);

  document.body.appendChild(button);
}

function removeButton(button) {
  // Must manually remove listener to prevent memory leak
  button.removeEventListener('click', handleClick);
  button.remove();
}
```

**With delegation**: Automatic support for dynamic content

```javascript
// Set up once
document.addEventListener('click', (event) => {
  if (event.target.matches('button')) {
    handleClick(event);
  }
});

function addButton(text) {
  const button = document.createElement('button');
  button.textContent = text;
  document.body.appendChild(button);
  // That's it. Works automatically.
}

function removeButton(button) {
  button.remove();
  // That's it. No cleanup needed.
}
```

### Real-World Use Case: hx-form Delegation

The `hx-form` component uses delegation to handle submit and reset events from any form element (native or custom):

```typescript
class HelixForm extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();

    // Delegate submit/reset to ALL child elements
    this.addEventListener('submit', this._handleSubmit);
    this.addEventListener('reset', this._handleReset);
  }

  private _handleSubmit = (e: Event): void => {
    if (this.action) {
      return; // Let native form submission happen
    }

    e.preventDefault(); // Client-side only

    if (!this.novalidate && !this.checkValidity()) {
      const errors = this._collectValidationErrors();

      this.dispatchEvent(
        new CustomEvent('hx-invalid', {
          bubbles: true,
          composed: true,
          detail: { errors },
        }),
      );
      return;
    }

    const formData = this.getFormData();
    const values: Record<string, FormDataEntryValue> = {};
    formData.forEach((value, key) => {
      values[key] = value;
    });

    this.dispatchEvent(
      new CustomEvent('hx-submit', {
        bubbles: true,
        composed: true,
        detail: { valid: true, values },
      }),
    );
  };
}
```

**Benefits:**

- Single listener handles submit from any button (`<button type="submit">` or `<hx-button type="submit">`)
- Works with dynamically added form controls
- No cleanup required when elements are removed
- Consistent validation across native and custom elements

## Best Practices

Follow these best practices to implement event delegation effectively.

### 1. Use `closest()` for Nested Elements

Always use `closest()` to handle clicks on nested elements:

```javascript
// ✗ WRONG: Only works if you click directly on the button
container.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON') {
    handleButtonClick(event.target);
  }
});

// ✓ CORRECT: Works even if you click on child elements
container.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (button && container.contains(button)) {
    handleButtonClick(button);
  }
});
```

### 2. Verify the Element Is Inside the Delegate Container

Always check that the matched element is actually inside your delegate container:

```javascript
sidebar.addEventListener('click', (event) => {
  const link = event.target.closest('a');

  // ✓ CORRECT: Verify link is inside sidebar
  if (link && sidebar.contains(link)) {
    handleLinkClick(link);
  }
});
```

Without this check, you might handle events from elements **outside** your container if they bubble through it.

### 3. Stop Propagation for Internal Events

If you're delegating internal coordination events, stop propagation to prevent them from leaking:

```javascript
// Internal event for parent-child coordination
this.addEventListener('hx-radio-select', (event) => {
  event.stopPropagation(); // ← Don't let internal events escape

  // Handle internally, then dispatch public event
  this.value = event.detail.value;

  this.dispatchEvent(
    new CustomEvent('hx-change', {
      /* public API */
    }),
  );
});
```

### 4. Use Data Attributes for Semantic Actions

Use `data-*` attributes to encode action semantics:

```html
<div id="toolbar">
  <button data-action="save" data-entity="document">Save</button>
  <button data-action="delete" data-entity="document">Delete</button>
  <button data-action="share" data-entity="document">Share</button>
</div>
```

```javascript
toolbar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');

  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const entity = button.dataset.entity;

  performAction(action, entity);
});
```

### 5. Delegate at the Appropriate Level

Don't always delegate to `document`. Delegate to the **nearest common ancestor**:

```javascript
// ✗ WRONG: Document-level delegation for app-specific UI
document.addEventListener('click', (event) => {
  if (event.target.matches('.app-button')) {
    // This fires for ALL .app-button clicks on the entire page
  }
});

// ✓ CORRECT: Delegate to the app container
const app = document.getElementById('app');
app.addEventListener('click', (event) => {
  if (event.target.matches('.app-button')) {
    // Only fires for buttons inside the app
  }
});
```

**Benefits:**

- Reduces unnecessary event handler invocations
- Easier to reason about event scope
- Avoids conflicts with other scripts

### 6. Handle Non-Bubbling Events Separately

For events that don't bubble, attach listeners directly or use their bubbling equivalents:

```javascript
// ✗ WRONG: focus doesn't bubble
form.addEventListener('focus', handleFocus); // Won't catch child focus events

// ✓ CORRECT: focusin bubbles
form.addEventListener('focusin', handleFocus); // Catches all child focus events
```

### 7. Be Mindful of Performance

While delegation is generally faster, extreme cases can impact performance:

```javascript
// ✗ WRONG: Complex selector on every document click
document.addEventListener('click', (event) => {
  // This runs on EVERY click in the document
  if (event.target.matches('.deeply > .nested > .complex [data-attr="value"]')) {
    // ...
  }
});

// ✓ CORRECT: Delegate to a closer ancestor with simpler selectors
const widget = document.getElementById('widget');
widget.addEventListener('click', (event) => {
  // This only runs on clicks inside the widget
  if (event.target.matches('[data-attr="value"]')) {
    // ...
  }
});
```

## Common Mistakes to Avoid

### Mistake 1: Forgetting to Check `contains()`

```javascript
// ✗ WRONG: Might handle elements outside the container
container.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (button) {
    handleButtonClick(button); // Could be any button in the document
  }
});

// ✓ CORRECT: Verify the button is inside the container
container.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (button && container.contains(button)) {
    handleButtonClick(button);
  }
});
```

### Mistake 2: Using `event.target` Directly Without `closest()`

```javascript
// ✗ WRONG: Breaks when clicking on nested elements
list.addEventListener('click', (event) => {
  if (event.target.tagName === 'LI') {
    console.log('List item clicked');
  }
  // Clicking on <span> inside <li> won't trigger this
});

// ✓ CORRECT: Use closest() to traverse up
list.addEventListener('click', (event) => {
  const listItem = event.target.closest('li');
  if (listItem && list.contains(listItem)) {
    console.log('List item clicked');
  }
});
```

### Mistake 3: Delegating Non-Bubbling Events

```javascript
// ✗ WRONG: focus doesn't bubble
document.addEventListener('focus', (event) => {
  console.log('This will never fire for child elements');
});

// ✓ CORRECT: Use focusin (bubbling version)
document.addEventListener('focusin', (event) => {
  console.log('This fires for all child focus events');
});
```

### Mistake 4: Not Stopping Propagation for Internal Events

```javascript
// ✗ WRONG: Internal event leaks to light DOM
private _handleRadioSelect(e: CustomEvent): void {
  // Forgot to stop propagation!
  this.value = e.detail.value;
}

// ✓ CORRECT: Stop internal events from escaping
private _handleRadioSelect(e: CustomEvent): void {
  e.stopPropagation(); // ← Internal coordination only
  this.value = e.detail.value;

  // Dispatch public event after handling
  this.dispatchEvent(new CustomEvent('hx-change', { /* ... */ }));
}
```

### Mistake 5: Over-Delegating to `document`

```javascript
// ✗ WRONG: Every click in the document checks this condition
document.addEventListener('click', (event) => {
  if (event.target.matches('.specific-component-button')) {
    // This runs on every document click!
  }
});

// ✓ CORRECT: Delegate to the nearest common ancestor
const component = document.getElementById('specific-component');
component.addEventListener('click', (event) => {
  if (event.target.matches('.button')) {
    // Only runs on clicks inside the component
  }
});
```

## Real-World Examples from hx-library

### Example 1: hx-form Submit Delegation

The `hx-form` component delegates submit and reset events from all child form controls:

```typescript
override connectedCallback(): void {
  super.connectedCallback();

  // Delegate submit from any button[type="submit"]
  this.addEventListener('submit', this._handleSubmit);
  this.addEventListener('reset', this._handleReset);
}

private _handleSubmit = (e: Event): void => {
  if (this.action) {
    return; // Let native form submission happen
  }

  e.preventDefault(); // Client-side only

  if (!this.novalidate && !this.checkValidity()) {
    this.dispatchEvent(
      new CustomEvent('hx-invalid', {
        bubbles: true,
        composed: true,
        detail: { errors: this._collectValidationErrors() },
      })
    );
    return;
  }

  const formData = this.getFormData();
  this.dispatchEvent(
    new CustomEvent('hx-submit', {
      bubbles: true,
      composed: true,
      detail: { valid: true, values: Object.fromEntries(formData) },
    })
  );
};
```

**Pattern**: Single listener handles submit from any button, regardless of when it was added.

### Example 2: hx-radio-group Child Coordination

The `hx-radio-group` component delegates `hx-radio-select` events from child `hx-radio` elements:

```typescript
override connectedCallback(): void {
  super.connectedCallback();

  // Delegate internal events from children
  this.addEventListener('hx-radio-select', this._handleRadioSelect as EventListener);
  this.addEventListener('keydown', this._handleKeydown);
}

private _handleRadioSelect = (e: CustomEvent<{ value: string }>): void => {
  e.stopPropagation(); // ← Internal event, don't leak

  const newValue = e.detail.value;
  if (newValue === this.value) {
    return;
  }

  // Update state
  this.value = newValue;
  this._internals.setFormValue(this.value);
  this._syncRadios();
  this._updateValidity();

  // Dispatch public event
  this.dispatchEvent(
    new CustomEvent('hx-change', {
      bubbles: true,
      composed: true, // ← Public event, let it escape
      detail: { value: this.value },
    })
  );
};
```

**Pattern**: Delegate internal coordination events, stop propagation, dispatch public API events.

### Example 3: Keyboard Navigation with Delegation

The `hx-radio-group` delegates keyboard events for arrow key navigation:

```typescript
private _handleKeydown = (e: KeyboardEvent): void => {
  const enabledRadios = this._getEnabledRadios();
  if (enabledRadios.length === 0) {
    return;
  }

  const isNavigationKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
  if (!isNavigationKey) {
    return;
  }

  e.preventDefault();

  const currentIndex = enabledRadios.findIndex(
    (radio) => radio === (e.target as Element)?.closest?.('hx-radio') || radio.checked
  );

  let nextIndex: number;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % enabledRadios.length;
  } else {
    nextIndex = currentIndex <= 0 ? enabledRadios.length - 1 : currentIndex - 1;
  }

  const nextRadio = enabledRadios[nextIndex];
  if (nextRadio) {
    nextRadio.focus();
    nextRadio.dispatchEvent(
      new CustomEvent('hx-radio-select', {
        bubbles: true,
        composed: true,
        detail: { value: nextRadio.value },
      })
    );
  }
};
```

**Pattern**: Delegate keyboard events to the group, use `closest()` to find the focused radio, programmatically trigger selection.

## Summary

Event delegation is a fundamental pattern for scalable, performant web applications:

1. **Use `event.target` to identify what was clicked**, and `event.currentTarget` to access the delegating element
2. **Always use `closest()` for nested elements** to traverse up the DOM tree
3. **Verify matched elements are inside the delegate container** with `contains()`
4. **Stop propagation for internal coordination events** to prevent leaking
5. **Delegate at the appropriate level** (nearest common ancestor, not always `document`)
6. **Use `focusin`/`focusout` instead of `focus`/`blur`** for delegation (bubbling equivalents)
7. **Leverage `composedPath()` for Shadow DOM debugging** (but don't expose internals in public APIs)
8. **Dispatch public events after handling internal events** for clean component APIs

Event delegation reduces memory footprint, simplifies dynamic content handling, and scales to thousands of interactive elements with minimal performance impact.

## Further Reading

- [Event: target property - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/target)
- [Event: currentTarget property - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget)
- [Event delegation - JavaScript.info](https://javascript.info/event-delegation)
- [Event bubbling - Learn web development | MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)
- [Event: composed property - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)
- [Shadow DOM and events - JavaScript.info](https://javascript.info/shadow-dom-events)
- [Event Delegation in JavaScript Explained | Medium](https://medium.com/@AlexanderObregon/event-delegation-in-javascript-explained-1cc2ee7bd1cc)
- [Event Delegation in Modern Frameworks | Medium](https://medium.com/@bharathofficial05/event-delegation-in-modern-frameworks-022c61af5e71)

---

**Next steps**:

- Review [Custom Events Best Practices](/components/events/custom-events/) for event dispatch patterns
- Explore [Shadow DOM Events](/components/shadow-dom/events/) for event retargeting and composition
- Read [Component Testing](/components/testing/vitest/) for testing delegated event handlers
