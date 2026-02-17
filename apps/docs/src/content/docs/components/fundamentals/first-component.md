---
title: Your First Web Component
description: Step-by-step guide to building your first HELiX component with Lit 3.x.
---

# Your First Web Component

This guide walks you through building a complete HELiX component from scratch. By the end, you will have a working `hx-greeting` component that demonstrates every structural convention used in the library: file layout, class declaration, reactive properties, styles, event dispatch, and HTML usage.

## What You Will Build

A greeting card component that accepts a `name` attribute, a `role` attribute, and a dismissible state. It dispatches a custom event when dismissed.

```html
<hx-greeting name="Dr. Patel" role="Cardiologist"></hx-greeting>
```

---

## Step 1: Create the File Structure

Every HELiX component lives in its own directory under `src/components/`. The directory name matches the tag name.

```
packages/hx-library/src/components/hx-greeting/
├── index.ts              # Re-exports the component class
├── hx-greeting.ts        # Component class — the main file
├── hx-greeting.styles.ts # Lit css`` tagged template for styles
├── hx-greeting.test.ts   # Vitest browser-mode tests
└── hx-greeting.stories.ts # Storybook stories
```

Create the directory and the four source files (the stories file is out of scope for this guide):

```bash
mkdir -p packages/hx-library/src/components/hx-greeting
touch packages/hx-library/src/components/hx-greeting/index.ts
touch packages/hx-library/src/components/hx-greeting/hx-greeting.ts
touch packages/hx-library/src/components/hx-greeting/hx-greeting.styles.ts
touch packages/hx-library/src/components/hx-greeting/hx-greeting.test.ts
```

---

## Step 2: Write the Styles File

Create `hx-greeting.styles.ts`. Styles are authored in a Lit `css` tagged template and exported as a named constant.

```typescript
// packages/hx-library/src/components/hx-greeting/hx-greeting.styles.ts
import { css } from 'lit';

export const hxGreetingStyles = css`
  :host {
    /*
     * Private scoped tokens — the component consumes these.
     * Consumers override at the semantic level (--hx-color-primary-500),
     * never by changing --_bg directly.
     */
    --_bg: var(--hx-greeting-bg, var(--hx-color-surface-raised));
    --_border: var(--hx-greeting-border, var(--hx-color-border-subtle));
    --_radius: var(--hx-greeting-radius, var(--hx-border-radius-lg));
    --_padding: var(--hx-greeting-padding, var(--hx-spacing-lg));

    display: block;
    background: var(--_bg);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    padding: var(--_padding);
    font-family: var(--hx-font-family-sans);
  }

  :host([hidden]) {
    display: none;
  }

  .greeting__name {
    font-size: var(--hx-font-size-xl);
    font-weight: var(--hx-font-weight-semibold);
    color: var(--hx-color-text-primary);
    margin: 0 0 var(--hx-spacing-xs);
  }

  .greeting__role {
    font-size: var(--hx-font-size-sm);
    color: var(--hx-color-text-secondary);
    margin: 0 0 var(--hx-spacing-md);
  }

  .greeting__dismiss {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--hx-color-text-secondary);
    padding: var(--hx-spacing-xs);
    border-radius: var(--hx-border-radius-sm);
    font-size: var(--hx-font-size-sm);
    line-height: 1;
    transition: color var(--hx-duration-fast) ease;
  }

  .greeting__dismiss:hover {
    color: var(--hx-color-text-primary);
  }

  .greeting__dismiss:focus-visible {
    outline: 2px solid var(--hx-focus-ring-color);
    outline-offset: 2px;
  }
`;
```

Key rules in effect here:

- All values use `--hx-` design tokens. No hardcoded colors, spacing, or font sizes.
- The component-level `--hx-greeting-*` properties expose a customization surface. Consumers can override these without touching internal implementation.
- Private scoped tokens (`--_bg`, `--_border`, etc.) are single-underscore-prefixed to signal internal use.

---

## Step 3: Write the Component Class

Create `hx-greeting.ts`. This is the main file.

```typescript
// packages/hx-library/src/components/hx-greeting/hx-greeting.ts
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { hxGreetingStyles } from './hx-greeting.styles.js';

/**
 * A greeting card that identifies a healthcare professional.
 *
 * @summary Displays a named greeting with an optional role label and dismiss action.
 *
 * @tag hx-greeting
 *
 * @slot - Default slot for supplemental content rendered below the role.
 *
 * @fires {CustomEvent<{ name: string }>} hx-dismiss - Dispatched when the user
 *   clicks the dismiss button. Bubbles and crosses shadow boundaries.
 *
 * @csspart card - The root card container element.
 * @csspart dismiss - The dismiss button element.
 *
 * @cssprop [--hx-greeting-bg=var(--hx-color-surface-raised)] - Card background color.
 * @cssprop [--hx-greeting-border=var(--hx-color-border-subtle)] - Card border color.
 * @cssprop [--hx-greeting-radius=var(--hx-border-radius-lg)] - Card border radius.
 * @cssprop [--hx-greeting-padding=var(--hx-spacing-lg)] - Card inner padding.
 */
@customElement('hx-greeting')
export class HxGreeting extends LitElement {
  static override styles = hxGreetingStyles;

  /**
   * The person's name to display.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The person's clinical role (e.g. "Cardiologist", "Charge Nurse").
   * @attr role
   */
  @property({ type: String })
  role = '';

  /**
   * When true, renders a dismiss button the user can click.
   * @attr dismissible
   */
  @property({ type: Boolean, reflect: true })
  dismissible = false;

  /**
   * Internal dismissed state. Not exposed as an attribute.
   * Toggled when the user clicks the dismiss button.
   */
  @state()
  private _dismissed = false;

  // ─── Event Handlers ───

  private _handleDismiss(): void {
    this._dismissed = true;

    /**
     * Dispatched when the user dismisses the greeting.
     * @event hx-dismiss
     */
    this.dispatchEvent(
      new CustomEvent('hx-dismiss', {
        bubbles: true,
        composed: true,
        detail: { name: this.name },
      }),
    );
  }

  // ─── Render ───

  override render() {
    // Do not render anything once dismissed.
    if (this._dismissed) {
      return nothing;
    }

    const cardClasses = {
      greeting: true,
      'greeting--dismissible': this.dismissible,
    };

    return html`
      <div part="card" class=${classMap(cardClasses)}>
        <p class="greeting__name">${this.name || 'Anonymous'}</p>

        ${this.role ? html`<p class="greeting__role">${this.role}</p>` : nothing}

        <slot></slot>

        ${this.dismissible
          ? html`
              <button
                part="dismiss"
                class="greeting__dismiss"
                aria-label=${ifDefined(this.name ? `Dismiss greeting for ${this.name}` : undefined)}
                @click=${this._handleDismiss}
              >
                Dismiss
              </button>
            `
          : nothing}
      </div>
    `;
  }
}

// Augment the global element registry so TypeScript knows the tag name maps
// to this class. Required for querySelector() and createElement() type safety.
declare global {
  interface HTMLElementTagNameMap {
    'hx-greeting': HxGreeting;
  }
}
```

---

## Step 4: Write the Re-export Index

Create `index.ts`. This is a barrel file that re-exports everything consumers need.

```typescript
// packages/hx-library/src/components/hx-greeting/index.ts
export { HxGreeting } from './hx-greeting.js';
```

---

## Step 5: Register the Component in the Library Index

Open `packages/hx-library/src/index.ts` and add the new export alongside the existing components:

```typescript
// packages/hx-library/src/index.ts
export * from './components/hx-button/index.js';
export * from './components/hx-card/index.js';
export * from './components/hx-text-input/index.js';
export * from './components/hx-greeting/index.js'; // Add this line
```

Side-effect registration (the `customElements.define()` call) happens automatically when Lit processes the `@customElement` decorator at module evaluation time. Importing from the library is all consumers need.

---

## Step 6: Use the Component in HTML

### Standalone HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>HELiX Greeting Example</title>
    <!-- Load the component from the built library -->
    <script type="module" src="/dist/hx-greeting.js"></script>
  </head>
  <body>
    <!-- Basic usage -->
    <hx-greeting name="Dr. Patel" role="Cardiologist"></hx-greeting>

    <!-- With a dismiss button -->
    <hx-greeting name="Nurse Rivera" role="Charge Nurse" dismissible></hx-greeting>

    <!-- With slotted supplemental content -->
    <hx-greeting name="Dr. Chen" role="Emergency Medicine">
      <p>On call until 07:00</p>
    </hx-greeting>

    <script>
      document.querySelector('hx-greeting').addEventListener('hx-dismiss', (e) => {
        console.log('Dismissed greeting for:', e.detail.name);
      });
    </script>
  </body>
</html>
```

### In a Drupal Twig Template

```twig
{# modules/custom/my_module/templates/staff-card.html.twig #}
<hx-greeting
  name="{{ staff.name | escape }}"
  role="{{ staff.role | escape }}"
  {% if staff.dismissible %}dismissible{% endif %}
></hx-greeting>
```

### In React (with wrapper or direct)

```tsx
// React 19+ has native custom element support
function StaffCard({ name, role }: { name: string; role: string }) {
  return (
    <hx-greeting
      name={name}
      role={role}
      onHxDismiss={(e: CustomEvent) => console.log('dismissed', e.detail)}
    />
  );
}
```

---

## Step 7: Write the Tests

Create `hx-greeting.test.ts`. Tests run in Vitest browser mode using the shared test utilities.

```typescript
// packages/hx-library/src/components/hx-greeting/hx-greeting.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup, oneEvent } from '../../test-utils.js';
import { html } from 'lit';
import './hx-greeting.js';
import type { HxGreeting } from './hx-greeting.js';

describe('hx-greeting', () => {
  afterEach(cleanup);

  it('renders the name', async () => {
    const el = await fixture<HxGreeting>(html`<hx-greeting name="Dr. Patel"></hx-greeting>`);
    const nameEl = el.shadowRoot!.querySelector('.greeting__name');
    expect(nameEl?.textContent?.trim()).toBe('Dr. Patel');
  });

  it('renders a fallback when name is empty', async () => {
    const el = await fixture<HxGreeting>(html`<hx-greeting></hx-greeting>`);
    const nameEl = el.shadowRoot!.querySelector('.greeting__name');
    expect(nameEl?.textContent?.trim()).toBe('Anonymous');
  });

  it('renders the role when provided', async () => {
    const el = await fixture<HxGreeting>(
      html`<hx-greeting name="Dr. Patel" role="Cardiologist"></hx-greeting>`,
    );
    const roleEl = el.shadowRoot!.querySelector('.greeting__role');
    expect(roleEl?.textContent?.trim()).toBe('Cardiologist');
  });

  it('does not render the role element when role is empty', async () => {
    const el = await fixture<HxGreeting>(html`<hx-greeting name="Dr. Patel"></hx-greeting>`);
    expect(el.shadowRoot!.querySelector('.greeting__role')).toBeNull();
  });

  it('does not render the dismiss button by default', async () => {
    const el = await fixture<HxGreeting>(html`<hx-greeting name="Dr. Patel"></hx-greeting>`);
    expect(el.shadowRoot!.querySelector('.greeting__dismiss')).toBeNull();
  });

  it('renders the dismiss button when dismissible', async () => {
    const el = await fixture<HxGreeting>(
      html`<hx-greeting name="Dr. Patel" dismissible></hx-greeting>`,
    );
    expect(el.shadowRoot!.querySelector('.greeting__dismiss')).not.toBeNull();
  });

  it('dispatches hx-dismiss event when dismiss button is clicked', async () => {
    const el = await fixture<HxGreeting>(
      html`<hx-greeting name="Dr. Patel" dismissible></hx-greeting>`,
    );
    const dismissBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('.greeting__dismiss')!;
    const eventPromise = oneEvent(el, 'hx-dismiss');
    dismissBtn.click();
    const event = await eventPromise;
    expect((event as CustomEvent).detail.name).toBe('Dr. Patel');
  });

  it('removes content from the DOM after dismissal', async () => {
    const el = await fixture<HxGreeting>(
      html`<hx-greeting name="Dr. Patel" dismissible></hx-greeting>`,
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>('.greeting__dismiss')!.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.greeting')).toBeNull();
  });

  it('reflects the dismissible attribute to the host', async () => {
    const el = await fixture<HxGreeting>(
      html`<hx-greeting name="Dr. Patel" dismissible></hx-greeting>`,
    );
    expect(el.hasAttribute('dismissible')).toBe(true);
  });

  it('renders slotted content', async () => {
    const el = await fixture<HxGreeting>(html`
      <hx-greeting name="Dr. Patel">
        <p id="extra">On call until 07:00</p>
      </hx-greeting>
    `);
    const slotted = el.querySelector('#extra');
    expect(slotted?.textContent?.trim()).toBe('On call until 07:00');
  });
});
```

Run the tests:

```bash
npm run test:library
```

---

## Anatomy of the Component

Let's review what every section does:

### `@customElement('hx-greeting')`

This decorator calls `customElements.define('hx-greeting', HxGreeting)` at module evaluation time. After the module is imported, `<hx-greeting>` is a valid tag in any HTML document.

### `static override styles`

Lit creates a `<style>` element inside the component's shadow root using these styles. They are scoped entirely to this component. No styles leak out to the page, and page styles cannot penetrate the shadow boundary (except for inherited properties like `color` and `font-family`, and CSS custom properties).

### `@property({ type: Boolean, reflect: true })`

`type: Boolean` activates Lit's boolean attribute converter: the presence of the `dismissible` attribute maps to `true`, its absence to `false`. Setting `this.dismissible = false` removes the attribute from the host element. `reflect: true` means property changes are also reflected back to the attribute, enabling CSS attribute selectors like `[dismissible]`.

### `@state() private _dismissed`

Internal reactive state that has no attribute mapping. Changing `_dismissed` triggers a re-render but does not expose a public attribute. The underscore prefix signals that this field is private to the component.

### `dispatchEvent(new CustomEvent('hx-dismiss', { bubbles: true, composed: true }))`

`bubbles: true` — the event travels up the DOM tree from the shadow host.
`composed: true` — the event crosses shadow boundaries, reaching listeners registered on parent elements in the light DOM.

Both flags are required for all HELiX events. Without `composed: true`, the event would be stopped at the shadow root and callers using standard `addEventListener` on the host would never see it.

### `declare global { interface HTMLElementTagNameMap }`

This TypeScript module augmentation tells the compiler the mapping between the `'hx-greeting'` string and the `HxGreeting` class. It makes `document.querySelector('hx-greeting')` return `HxGreeting | null` rather than `HTMLElement | null`.

---

## Common Beginner Mistakes

### Mistake 1: Using `innerHTML` Instead of the `html` Tag

```typescript
// WRONG — loses Lit's efficient diffing, type safety, and XSS protection
override render() {
  this.shadowRoot!.innerHTML = `<p>${this.name}</p>`; // Manual DOM manipulation
}

// CORRECT — return a TemplateResult from render()
override render() {
  return html`<p>${this.name}</p>`;
}
```

### Mistake 2: Hardcoding Design Values in Styles

```typescript
// WRONG — hardcoded color breaks theming
const styles = css`
  :host {
    background: #ffffff;
    padding: 16px;
    border-radius: 8px;
  }
`;

// CORRECT — use design tokens
const styles = css`
  :host {
    background: var(--hx-color-surface-raised);
    padding: var(--hx-spacing-lg);
    border-radius: var(--hx-border-radius-lg);
  }
`;
```

### Mistake 3: Mutating State Without Creating a New Reference

Lit uses strict equality (`!==`) to detect property changes. Mutating an object or array in-place does not trigger a re-render because the reference stays the same.

```typescript
// WRONG — same array reference, no re-render
this.items.push(newItem);

// CORRECT — new array reference triggers re-render
this.items = [...this.items, newItem];
```

### Mistake 4: Forgetting `composed: true` on Events

```typescript
// WRONG — event is stopped at the shadow root boundary
this.dispatchEvent(new CustomEvent('hx-dismiss'));

// CORRECT — event crosses shadow boundaries
this.dispatchEvent(
  new CustomEvent('hx-dismiss', {
    bubbles: true,
    composed: true,
    detail: { name: this.name },
  }),
);
```

### Mistake 5: Not Calling `super()` in Lifecycle Overrides

```typescript
// WRONG — Lit's own connectedCallback logic never runs
override connectedCallback() {
  window.addEventListener('resize', this._handler);
}

// CORRECT — always call super first
override connectedCallback() {
  super.connectedCallback();
  window.addEventListener('resize', this._handler);
}
```

### Mistake 6: Setting `display` Inside the Component Instead of on `:host`

Custom elements default to `display: inline`. If you set `display: block` on an internal wrapper `<div>`, the host element is still inline, which surprises consumers.

```typescript
// WRONG — the host is still inline
const styles = css`
  .wrapper {
    display: block;
  }
`;

// CORRECT — set display on :host
const styles = css`
  :host {
    display: block;
  }
`;
```

### Mistake 7: Reading the Shadow DOM Before First Render

Properties decorated with `@query` return `null` until the first render completes. Use `firstUpdated()` rather than `connectedCallback()` for initial DOM access.

```typescript
// WRONG — shadowRoot is populated but render() hasn't run yet
override connectedCallback() {
  super.connectedCallback();
  const btn = this.shadowRoot!.querySelector('button'); // null
  btn?.focus(); // throws
}

// CORRECT — DOM exists after first render
override firstUpdated() {
  const btn = this.shadowRoot!.querySelector('button');
  btn?.focus();
}
```

### Mistake 8: Using `any` Types

TypeScript strict mode is enforced across the library. The `any` type disables all type safety and is forbidden.

```typescript
// WRONG — any type
private _handleEvent(e: any) {
  console.log(e.target.value);
}

// CORRECT — type the event
private _handleEvent(e: Event) {
  const input = e.target as HTMLInputElement;
  console.log(input.value);
}
```

---

## Next Steps

- Read [Properties vs Attributes](/components/fundamentals/properties-vs-attributes/) to understand how Lit maps `@property` options to HTML attributes.
- Read [The Reactive Update Cycle](/components/fundamentals/update-cycle/) to understand when and how Lit re-renders.
- Read [Built-in Directives](/components/fundamentals/directives/) for a full reference of `classMap`, `ifDefined`, `live`, `repeat`, and more.
- Read [Component Lifecycle In-Depth](/components/fundamentals/lifecycle/) for a detailed walkthrough of every lifecycle hook.
