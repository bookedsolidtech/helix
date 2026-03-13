---
title: JSDoc for Components
description: Complete guide to documenting web components with JSDoc annotations for Custom Elements Manifest extraction.
sidebar:
  order: 64
---

JSDoc is the foundation of the hx-library documentation system. Every component, property, event, slot, and CSS custom property is documented using standardized JSDoc annotations that feed into the Custom Elements Manifest (CEM) and power Storybook autodocs, IDE IntelliSense, and the Astro documentation site.

This guide covers the complete JSDoc annotation system for web components, from basic property documentation to advanced CEM extraction patterns.

## Why JSDoc for Web Components

Web components have a unique API surface that extends beyond traditional JavaScript objects. They expose:

- **Properties** (JavaScript values)
- **Attributes** (HTML string values)
- **Events** (custom events dispatched)
- **Slots** (content insertion points)
- **CSS Parts** (Shadow DOM styling hooks)
- **CSS Custom Properties** (themeable design tokens)

Standard JSDoc was designed for functions and classes, not declarative component APIs. The web components ecosystem has extended JSDoc with specialized tags (`@fires`, `@slot`, `@csspart`, `@cssprop`) that the Custom Elements Manifest Analyzer extracts into structured JSON.

### Benefits

1. **Single source of truth** — Documentation lives in code, never drifts
2. **IDE autocomplete** — VS Code, WebStorm, and other editors read JSDoc for IntelliSense
3. **Storybook autodocs** — CEM powers automatic controls and documentation panels
4. **Type safety** — JSDoc types provide runtime type hints and compile-time validation
5. **Searchable API** — Tools can query CEM for component capabilities
6. **Framework agnostic** — Works with Lit, Stencil, vanilla custom elements

## Component-Level Documentation

Every component file starts with a comprehensive JSDoc block above the `@customElement` decorator.

### Basic Structure

```typescript
/**
 * A brief one-sentence description of the component.
 *
 * @summary Extended summary with more context (optional).
 *
 * @tag hx-button
 *
 * @slot - Default slot description.
 * @slot prefix - Named slot description.
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Event description.
 *
 * @csspart button - The native button element.
 *
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Background color.
 */
@customElement('hx-button')
export class HelixButton extends LitElement {
  // Implementation...
}
```

### Tag Breakdown

| Tag         | Purpose                                             | Required           |
| ----------- | --------------------------------------------------- | ------------------ |
| Description | First line(s) of the JSDoc block                    | Yes                |
| `@summary`  | Extended description (shows in CEM)                 | Recommended        |
| `@tag`      | Explicit tag name (useful for dynamic registration) | No                 |
| `@slot`     | Slot documentation (see below)                      | If slots exist     |
| `@fires`    | Event documentation (see below)                     | If events exist    |
| `@csspart`  | CSS part documentation (see below)                  | If parts exist     |
| `@cssprop`  | CSS custom property documentation (see below)       | If variables exist |

### Real-World Example: hx-text-input

```typescript
/**
 * A text input component with label, validation, and form association.
 *
 * @summary Form-associated text input with built-in label, error, and help text.
 *
 * @tag hx-text-input
 *
 * @slot label - Custom label content (overrides the label property). Use for Drupal Form API rendered labels.
 * @slot prefix - Content rendered before the input (e.g., icon).
 * @slot suffix - Content rendered after the input (e.g., icon or button).
 * @slot help-text - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property). Use for Drupal Form API rendered errors.
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on every keystroke as the user types.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the input loses focus after its value changed.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart input-wrapper - The wrapper around prefix, input, and suffix.
 * @csspart input - The native input element.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-input-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-input-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-input-border-color=var(--hx-color-neutral-300)] - Input border color.
 * @cssprop [--hx-input-border-radius=var(--hx-border-radius-md)] - Input border radius.
 * @cssprop [--hx-input-font-family=var(--hx-font-family-sans)] - Input font family.
 * @cssprop [--hx-input-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-input-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-input-label-color=var(--hx-color-neutral-700)] - Label text color.
 */
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  // ...
}
```

## The `@property` Tag

Use `@property` to document reactive properties. The CEM Analyzer auto-detects Lit `@property()` decorators, so explicit JSDoc is optional but recommended for complex types.

### Basic Property Documentation

```typescript
/**
 * Visual style variant of the button.
 * @attr variant
 */
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';
```

### Key Points

- The first line is the description
- `@attr` documents the HTML attribute name (if different from property)
- The TypeScript type (`'primary' | 'secondary' | 'ghost'`) is auto-extracted
- Default values are auto-extracted from the assignment

### Advanced Property Documentation

For complex types or properties that need extra context:

```typescript
/**
 * The current value of the input.
 *
 * This value is synced with the underlying form via ElementInternals.
 * Changes to this property trigger validation.
 *
 * @attr value
 * @type {string}
 * @default ''
 */
@property({ type: String })
value = '';
```

### Custom Attribute Names

When the attribute name differs from the property name (common for kebab-case attributes):

```typescript
/**
 * Size of the button.
 * @attr hx-size
 */
@property({ type: String, reflect: true, attribute: 'hx-size' })
size: 'sm' | 'md' | 'lg' = 'md';
```

The `@attr` tag tells CEM (and developers) the exact HTML attribute to use.

### Boolean Properties

Boolean properties should document both states:

```typescript
/**
 * Whether the input is required for form submission.
 * When true, the input displays a required marker and validates on submit.
 * @attr required
 */
@property({ type: Boolean, reflect: true })
required = false;
```

## The `@fires` Tag

The `@fires` tag documents custom events dispatched by the component. This is critical for event-driven architectures.

### Syntax

```typescript
@fires {EventType<DetailType>} event-name - Event description.
```

### Basic Event Documentation

```typescript
/**
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when the button is clicked (not disabled).
 */
```

This appears in the component-level JSDoc block, not on individual methods.

### Event Detail Types

Always document the event detail structure:

```typescript
/**
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on every keystroke as the user types.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the input loses focus after its value changed.
 */
```

For events with complex payloads:

```typescript
/**
 * @fires {CustomEvent<{url: string, originalEvent: MouseEvent}>} hx-card-click - Dispatched when an interactive card (with hx-href) is clicked.
 */
```

### Event Implementation Pattern

The event dispatch code should mirror the JSDoc:

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
    new CustomEvent('hx-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: e },
    })
  );
}
```

**Note:** The inline `@event` comment (line 87 above) is optional but helpful for maintainers navigating code. The component-level `@fires` tag is what CEM extracts.

### Event Naming Convention

All hx-library events use the `hx-` prefix:

- `hx-click` (not `click`)
- `hx-input` (not `input`)
- `hx-change` (not `change`)
- `hx-card-click` (custom compound event)

This prevents naming collisions with native DOM events and clearly signals custom behavior.

## The `@slot` Tag

Slots are content insertion points in Shadow DOM. The `@slot` tag documents each slot's purpose.

### Syntax

```typescript
@slot [name] - Slot description and usage guidance.
```

### Default Slot

The unnamed default slot uses an empty name:

```typescript
/**
 * @slot - Default slot for button label text or content.
 */
```

### Named Slots

Named slots specify the slot name:

```typescript
/**
 * @slot prefix - Content rendered before the input (e.g., icon).
 * @slot suffix - Content rendered after the input (e.g., icon or button).
 */
```

### Slot Usage Examples

For complex slots, include usage examples:

```typescript
/**
 * @slot label - Custom label content (overrides the label property). Use for Drupal Form API rendered labels.
 * @slot error - Custom error content (overrides the error property). Use for Drupal Form API rendered errors.
 */
```

### Real-World Example: hx-card

```typescript
/**
 * @slot image - Optional image or media content at the top of the card.
 * @slot heading - The card heading/title content.
 * @slot - Default slot for the card body content.
 * @slot footer - Optional footer content below the body.
 * @slot actions - Optional action buttons, rendered with a top border separator.
 */
```

### Implementation Pattern

Slots in the template should match JSDoc names exactly:

```typescript
render() {
  return html`
    <div class="field__label-wrapper">
      <slot name="label" @slotchange=${this._handleLabelSlotChange}>
        ${this.label ? html`<label part="label" class="field__label">${this.label}</label>` : nothing}
      </slot>
    </div>

    <div class="field__input-wrapper">
      <span class="field__prefix">
        <slot name="prefix"></slot>
      </span>

      <input part="input" class="field__input" />

      <span class="field__suffix">
        <slot name="suffix"></slot>
      </span>
    </div>
  `;
}
```

## The `@csspart` Tag

CSS parts expose Shadow DOM elements for external styling via `::part()`.

### Syntax

```typescript
@csspart part-name - Element description and styling guidance.
```

### Basic Part Documentation

```typescript
/**
 * @csspart button - The native button element.
 */
```

### Multiple Parts

Document all exposed parts:

```typescript
/**
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart input-wrapper - The wrapper around prefix, input, and suffix.
 * @csspart input - The native input element.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 */
```

### Usage Guidance

For parts with specific styling purposes, add context:

```typescript
/**
 * @csspart alert - The outer alert container. Use to override layout or borders.
 * @csspart icon - The icon container. Use to customize icon size or color.
 * @csspart message - The message content area. Use to override typography.
 * @csspart close-button - The dismiss button (only rendered when closable). Use to restyle the close icon.
 * @csspart actions - The actions container. Use to adjust button spacing or alignment.
 */
```

### Implementation Pattern

Parts must be applied to elements in the template:

```typescript
render() {
  return html`
    <div part="field" class="field">
      <label part="label" class="field__label">${this.label}</label>

      <div part="input-wrapper" class="field__input-wrapper">
        <input part="input" class="field__input" />
      </div>

      <div part="error" class="field__error">${this.error}</div>
    </div>
  `;
}
```

### Consumer Usage

Parts are styled from outside the component:

```css
hx-text-input::part(input) {
  font-family: monospace;
  border: 2px solid blue;
}

hx-text-input::part(label) {
  font-weight: bold;
  color: purple;
}
```

## The `@cssprop` Tag

CSS custom properties (CSS variables) are the primary theming mechanism for Shadow DOM components.

### Syntax

```typescript
@cssprop [--property-name=default-value] - Property description and usage guidance.
```

The square brackets `[]` indicate an optional parameter with a default value.

### Basic Custom Property Documentation

```typescript
/**
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color.
 * @cssprop [--hx-button-color=var(--hx-color-neutral-0)] - Button text color.
 * @cssprop [--hx-button-border-color=transparent] - Button border color.
 */
```

### Full Documentation Pattern

Document all custom properties with their semantic fallbacks:

```typescript
/**
 * @cssprop [--hx-input-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-input-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-input-border-color=var(--hx-color-neutral-300)] - Input border color.
 * @cssprop [--hx-input-border-radius=var(--hx-border-radius-md)] - Input border radius.
 * @cssprop [--hx-input-font-family=var(--hx-font-family-sans)] - Input font family.
 * @cssprop [--hx-input-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-input-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-input-label-color=var(--hx-color-neutral-700)] - Label text color.
 */
```

### Implementation Pattern

Custom properties must be consumed in the component styles:

```typescript
import { css } from 'lit';

export const helixButtonStyles = css`
  :host {
    /* Component-scoped defaults with semantic fallbacks */
    --_bg: var(--hx-button-bg, var(--hx-color-primary-500));
    --_color: var(--hx-button-color, var(--hx-color-neutral-0));
    --_border-color: var(--hx-button-border-color, transparent);
    --_border-radius: var(--hx-button-border-radius, var(--hx-border-radius-md));
  }

  .button {
    background: var(--_bg);
    color: var(--_color);
    border: 1px solid var(--_border-color);
    border-radius: var(--_border-radius);
  }
`;
```

**Pattern explanation:**

1. Component-scoped tokens (`--hx-button-bg`) allow per-component overrides
2. Semantic tokens (`--hx-color-primary-500`) provide global theme defaults
3. Private tokens (`--_bg`) encapsulate the cascade within the component

### Consumer Usage

Consumers override custom properties from outside:

```html
<style>
  hx-button {
    --hx-button-bg: purple;
    --hx-button-color: white;
  }

  hx-button[variant='secondary'] {
    --hx-button-bg: transparent;
    --hx-button-color: purple;
    --hx-button-border-color: purple;
  }
</style>

<hx-button>Primary (purple)</hx-button>
<hx-button variant="secondary">Secondary (outlined purple)</hx-button>
```

### Naming Convention

All hx-library custom properties follow a three-tier naming system:

1. **Primitive tokens** (raw values): `--hx-color-blue-500`, `--hx-space-4`
2. **Semantic tokens** (meaning-based): `--hx-color-primary`, `--hx-spacing-md`
3. **Component tokens** (scoped): `--hx-button-bg`, `--hx-input-border-color`

Always document the component-level token with its semantic fallback.

## The `@example` Tag

The `@example` tag provides inline usage examples in JSDoc. While Storybook stories are the primary source of live examples, `@example` is useful for quick reference.

### Basic Example

````typescript
/**
 * A button component for user interaction.
 *
 * @example
 * ```html
 * <hx-button variant="primary">Click me</hx-button>
 * ```
 */
````

### Multiple Examples

Document common use cases:

````typescript
/**
 * A text input component with label, validation, and form association.
 *
 * @example Basic usage
 * ```html
 * <hx-text-input
 *   label="Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   required
 * ></hx-text-input>
 * ```
 *
 * @example With slots
 * ```html
 * <hx-text-input label="Search">
 *   <svg slot="prefix" width="16" height="16">...</svg>
 * </hx-text-input>
 * ```
 *
 * @example With error state
 * ```html
 * <hx-text-input
 *   label="Username"
 *   value="ab"
 *   error="Username must be at least 3 characters"
 * ></hx-text-input>
 * ```
 */
````

### JavaScript Usage Examples

For event listeners and imperative APIs:

````typescript
/**
 * @example Listening to events
 * ```javascript
 * const input = document.querySelector('hx-text-input');
 *
 * input.addEventListener('hx-input', (e) => {
 *   console.log('User typed:', e.detail.value);
 * });
 *
 * input.addEventListener('hx-change', (e) => {
 *   console.log('Final value:', e.detail.value);
 * });
 * ```
 */
````

## Other Useful Tags

### `@deprecated`

Mark deprecated APIs with migration guidance:

```typescript
/**
 * @deprecated Use `variant="ghost"` instead. Will be removed in v2.0.0.
 */
@property({ type: Boolean })
outline = false;
```

### `@see`

Link to related documentation or components:

```typescript
/**
 * A text input component with label, validation, and form association.
 *
 * @see hx-textarea for multi-line text input
 * @see hx-select for dropdown selection
 */
```

### `@since`

Document when a feature was added:

```typescript
/**
 * Whether the card is interactive (clickable).
 *
 * @since 1.2.0
 */
@property({ type: String, attribute: 'hx-href' })
wcHref = '';
```

### `@default`

Explicitly document default values (though TypeScript usually makes this redundant):

```typescript
/**
 * Visual style variant of the button.
 * @default 'primary'
 */
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';
```

### `@type`

Specify complex types not captured by TypeScript:

```typescript
/**
 * Configuration object for validation rules.
 * @type {{ minLength?: number; maxLength?: number; pattern?: RegExp }}
 */
@property({ type: Object })
validation = {};
```

## CEM Extraction from JSDoc

The Custom Elements Manifest Analyzer (`@custom-elements-manifest/analyzer`) parses your component source and JSDoc to generate a structured JSON manifest.

### Running CEM Analysis

```bash
npm run cem
```

This runs the analyzer and outputs to `packages/hx-library/custom-elements.json`.

### CEM Configuration

The analyzer is configured in `packages/hx-library/custom-elements-manifest.config.js`:

```javascript
export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['src/components/**/*.test.ts', 'src/components/**/*.stories.ts'],
  litelement: true,
  outdir: '.',
};
```

### What CEM Extracts

The analyzer automatically extracts:

- **Component class names** and inheritance chains
- **Properties** from `@property()` decorators
- **Attributes** from `reflect: true` and explicit `attribute` options
- **Events** from `@fires` JSDoc tags
- **Slots** from `@slot` JSDoc tags
- **CSS Parts** from `@csspart` JSDoc tags
- **CSS Custom Properties** from `@cssprop` JSDoc tags
- **Methods** (public methods only)
- **TypeScript types** (converted to JSON schema)

### CEM Output Example

For `hx-button`, CEM generates:

```json
{
  "kind": "class",
  "name": "HelixButton",
  "tagName": "hx-button",
  "members": [
    {
      "kind": "field",
      "name": "variant",
      "type": { "text": "'primary' | 'secondary' | 'ghost'" },
      "default": "'primary'",
      "description": "Visual style variant of the button.",
      "attribute": "variant",
      "reflects": true
    }
  ],
  "events": [
    {
      "name": "hx-click",
      "type": { "text": "CustomEvent<{originalEvent: MouseEvent}>" },
      "description": "Dispatched when the button is clicked (not disabled)."
    }
  ],
  "slots": [
    {
      "name": "",
      "description": "Default slot for button label text or content."
    }
  ],
  "cssParts": [
    {
      "name": "button",
      "description": "The native button element."
    }
  ],
  "cssProperties": [
    {
      "name": "--hx-button-bg",
      "description": "Button background color.",
      "default": "var(--hx-color-primary-500)"
    }
  ]
}
```

### CEM Consumers

The CEM is consumed by:

1. **Storybook** — Powers autodocs, controls, and component metadata
2. **VS Code** — Provides autocomplete and hover documentation (via `vscode-custom-data.json`)
3. **Astro docs** — Generates API reference tables
4. **IDE plugins** — JetBrains, Sublime, etc.
5. **Custom tooling** — Health scoring, dependency graphs, test coverage reports

## Examples from hx-library

### Example 1: hx-button (Minimal)

```typescript
/**
 * A button component for user interaction.
 *
 * @summary Primary interactive element for triggering actions.
 *
 * @tag hx-button
 *
 * @slot - Default slot for button label text or content.
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when the button is clicked (not disabled).
 *
 * @csspart button - The native button element.
 *
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color.
 * @cssprop [--hx-button-color=var(--hx-color-neutral-0)] - Button text color.
 * @cssprop [--hx-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-button-font-family=var(--hx-font-family-sans)] - Button font family.
 * @cssprop [--hx-button-font-weight=var(--hx-font-weight-semibold)] - Button font weight.
 * @cssprop [--hx-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 */
@customElement('hx-button')
export class HelixButton extends LitElement {
  static override styles = [tokenStyles, helixButtonStyles];

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
      }),
    );
  }

  override render() {
    return html`
      <button
        part="button"
        class="button"
        ?disabled=${this.disabled}
        type=${this.type}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

### Example 2: hx-text-input (Complex Form Component)

```typescript
/**
 * A text input component with label, validation, and form association.
 *
 * @summary Form-associated text input with built-in label, error, and help text.
 *
 * @tag hx-text-input
 *
 * @slot label - Custom label content (overrides the label property). Use for Drupal Form API rendered labels.
 * @slot prefix - Content rendered before the input (e.g., icon).
 * @slot suffix - Content rendered after the input (e.g., icon or button).
 * @slot help-text - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property). Use for Drupal Form API rendered errors.
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on every keystroke as the user types.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the input loses focus after its value changed.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart input-wrapper - The wrapper around prefix, input, and suffix.
 * @csspart input - The native input element.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-input-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-input-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-input-border-color=var(--hx-color-neutral-300)] - Input border color.
 * @cssprop [--hx-input-border-radius=var(--hx-border-radius-md)] - Input border radius.
 * @cssprop [--hx-input-font-family=var(--hx-font-family-sans)] - Input font family.
 * @cssprop [--hx-input-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-input-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-input-label-color=var(--hx-color-neutral-700)] - Label text color.
 */
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static override styles = [tokenStyles, helixTextInputStyles];
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  /**
   * The visible label text for the input.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder text shown when the input is empty.
   * @attr placeholder
   */
  @property({ type: String })
  placeholder = '';

  /**
   * The current value of the input.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * The type of the native input element.
   * @attr type
   */
  @property({ type: String })
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' = 'text';

  /**
   * Whether the input is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the input is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Error message to display. When set, the input enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the input for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * The name of the input, used for form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  // ... implementation
}
```

### Example 3: hx-card (Slot-Heavy Component)

```typescript
/**
 * A flexible card component for displaying grouped content.
 *
 * @summary Content container with image, heading, body, footer, and action slots.
 *
 * @tag hx-card
 *
 * @slot image - Optional image or media content at the top of the card.
 * @slot heading - The card heading/title content.
 * @slot - Default slot for the card body content.
 * @slot footer - Optional footer content below the body.
 * @slot actions - Optional action buttons, rendered with a top border separator.
 *
 * @fires {CustomEvent<{url: string, originalEvent: MouseEvent}>} hx-card-click - Dispatched when an interactive card (with hx-href) is clicked.
 *
 * @csspart card - The outer card container element.
 * @csspart image - The image slot container.
 * @csspart heading - The heading slot container.
 * @csspart body - The body slot container.
 * @csspart footer - The footer slot container.
 * @csspart actions - The actions slot container.
 *
 * @cssprop [--hx-card-bg=var(--hx-color-neutral-0)] - Card background color.
 * @cssprop [--hx-card-color=var(--hx-color-neutral-800)] - Card text color.
 * @cssprop [--hx-card-border-color=var(--hx-color-neutral-200)] - Card border color.
 * @cssprop [--hx-card-border-radius=var(--hx-border-radius-lg)] - Card border radius.
 * @cssprop [--hx-card-padding=var(--hx-space-6)] - Internal padding for card sections.
 * @cssprop [--hx-card-gap=var(--hx-space-4)] - Gap between card sections.
 */
@customElement('hx-card')
export class HelixCard extends LitElement {
  static override styles = [tokenStyles, helixCardStyles];

  /**
   * Visual style variant of the card.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'featured' | 'compact' = 'default';

  /**
   * Elevation (shadow depth) of the card.
   * @attr elevation
   */
  @property({ type: String, reflect: true })
  elevation: 'flat' | 'raised' | 'floating' = 'flat';

  /**
   * Optional URL. When set, the card becomes interactive (clickable)
   * and navigates to this URL on click.
   * Uses hx-href to avoid conflicting with the native HTML href attribute.
   * @attr hx-href
   */
  @property({ type: String, attribute: 'hx-href' })
  wcHref = '';

  // ... implementation
}
```

## Documentation Best Practices

### 1. Write for Humans, Not Machines

JSDoc is read by developers more often than it's parsed by tools. Write clear, helpful descriptions.

**Bad:**

```typescript
/**
 * @cssprop --hx-button-bg - bg
 */
```

**Good:**

```typescript
/**
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color. Override to theme the button.
 */
```

### 2. Document the "Why", Not the "What"

The code already says "what". JSDoc should explain "why" and "when".

**Bad:**

```typescript
/**
 * The disabled property.
 * @attr disabled
 */
@property({ type: Boolean, reflect: true })
disabled = false;
```

**Good:**

```typescript
/**
 * Whether the button is disabled. When true, prevents interaction and changes visual appearance.
 * @attr disabled
 */
@property({ type: Boolean, reflect: true })
disabled = false;
```

### 3. Document Behavior, Not Implementation

Focus on the public API contract, not internal details.

**Bad:**

```typescript
/**
 * Stores the internal ElementInternals reference for form association.
 */
private _internals: ElementInternals;
```

**Good:**

```typescript
// Private field — no JSDoc needed (or mark @internal if you must document)
private _internals: ElementInternals;
```

### 4. Keep JSDoc and Code in Sync

When you change a property name, update the JSDoc. When you add a slot, document it.

Use linting to enforce this:

```bash
npm run cem -- --analyze
```

This validates that all `@fires`, `@slot`, `@csspart`, and `@cssprop` tags match the actual implementation.

### 5. Use Consistent Formatting

Follow the hx-library JSDoc style guide:

- Component-level JSDoc comes immediately before `@customElement()`
- Properties are documented inline above the `@property()` decorator
- Events use `@fires` in the component-level block
- Slots use `@slot` in the component-level block
- CSS parts use `@csspart` in the component-level block
- CSS custom properties use `@cssprop` in the component-level block

### 6. Provide Default Values for CSS Custom Properties

Always document the default value in `@cssprop` tags using the `[--name=value]` syntax:

```typescript
/**
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color.
 */
```

This tells consumers exactly what happens if they don't override.

### 7. Link Related Components

Use `@see` to create a documentation graph:

```typescript
/**
 * A text input component with label, validation, and form association.
 *
 * @see hx-textarea for multi-line text input
 * @see hx-select for dropdown selection
 * @see hx-checkbox for boolean input
 */
```

### 8. Document Breaking Changes

When deprecating or removing features:

```typescript
/**
 * @deprecated Use `variant="outlined"` instead. This property will be removed in v2.0.0.
 * @see https://github.com/bookedsolidtech/helix/issues for migration guide
 */
@property({ type: Boolean })
outline = false;
```

### 9. Test Your JSDoc

Generate the CEM and verify the output:

```bash
npm run cem
cat packages/hx-library/custom-elements.json | jq '.modules[0].declarations[0].events'
```

Spot-check that events, slots, parts, and properties are correctly extracted.

### 10. Use JSDoc as a Code Review Gate

Before merging a component PR:

1. Run `npm run cem`
2. Verify all public APIs are documented
3. Check that descriptions are clear and helpful
4. Confirm that examples compile and run

No component ships without complete JSDoc.

## Summary

JSDoc is the single source of truth for component API documentation in hx-library. It powers:

- Custom Elements Manifest (CEM) generation
- Storybook autodocs and controls
- IDE autocomplete and IntelliSense
- API reference documentation
- Type checking and validation

**Key tags:**

- `@property` — Document reactive properties (optional, usually inferred)
- `@fires` — Document custom events with typed details
- `@slot` — Document content insertion points
- `@csspart` — Document styleable Shadow DOM elements
- `@cssprop` — Document themeable CSS custom properties
- `@example` — Provide inline usage examples

**Best practices:**

- Write for humans, not machines
- Document behavior, not implementation
- Keep JSDoc and code in sync
- Use consistent formatting across all components
- Test CEM output before merging

Follow these patterns, and your components will have world-class documentation that serves developers, designers, and tooling alike.

---

## Further Reading

- [Custom Elements Manifest (open-wc.org)](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
- [API Viewer JSDoc Guide (open-wc.org)](https://api-viewer.open-wc.org/docs/guide/writing-jsdoc/)
- [JSDoc Official Documentation (jsdoc.app)](https://jsdoc.app/)
- [Web Component Analyzer (GitHub)](https://github.com/runem/web-component-analyzer)
- [Lit Documentation (lit.dev)](https://lit.dev/docs/)

**Related hx-library docs:**

- [Custom Elements Manifest](/components/documentation/cem) (coming soon)
- [Storybook Autodocs](/storybook/autodocs) (coming soon)
- [TypeScript Strict Mode](/components/typescript/strict-mode)
