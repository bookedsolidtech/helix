---
title: Writing Storybook Stories
description: Comprehensive guide to authoring Component Story Format 3.0 stories for HELIX web components
order: 66
---

Storybook is the component development and documentation platform for HELIX. Stories are written in **Component Story Format 3.0 (CSF 3.0)**, the modern standard for component examples that dramatically reduces boilerplate and allows authors to focus on showcasing component variants, states, and interactions.

This guide covers the complete story authoring workflow: CSF 3.0 format, meta configuration, argTypes, controls, decorators, play functions, autodocs integration with Custom Elements Manifest (CEM), and best practices drawn from the production stories in `hx-button`, `hx-card`, and `hx-text-input`.

## Overview: Why Storybook?

Storybook serves three critical roles in HELIX:

1. **Component Playground** — Interactive development environment where engineers build, iterate, and test components in isolation
2. **Living Documentation** — Auto-generated API tables driven by Custom Elements Manifest (CEM) ensure docs stay in sync with code
3. **Visual Test Baseline** — Every story is a visual regression test baseline tracked by Chromatic or Percy in CI

Storybook runs independently from the application layer, allowing components to be tested in every possible state without requiring a full app context.

## Component Story Format 3.0

CSF 3.0 is the third major iteration of the Component Story Format standard. It reduces boilerplate by introducing automatic render functions, default args, and improved type safety via `satisfies Meta` syntax.

### Key CSF 3.0 Features

- **Automatic render functions** — Framework defaults eliminate redundant render code for simple stories
- **Default args** — Args defined at the meta level are inherited by all stories
- **Play functions** — Interaction testing via `@storybook/test` executes after render
- **Type safety** — `satisfies Meta` provides full TypeScript inference without explicit generics
- **Backward compatibility** — CSF 1, CSF 2, and CSF 3 coexist in the same codebase

CSF 3.0 has been the default in Storybook 7+ and is fully supported in Storybook 8+, which is the version HELIX uses.

## Anatomy of a Story File

Every story file for a HELIX component follows this structure:

```typescript
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-button.js';

// ─────────────────────────────────────────────────
// Meta Configuration (Default Export)
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs'],
  argTypes: {
    /* ... */
  },
  args: {
    /* ... */
  },
  render: (args) => html`<hx-button>${args.label}</hx-button>`,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// Story Definitions (Named Exports)
// ─────────────────────────────────────────────────

export const Primary: Story = {
  args: { variant: 'primary' },
};
```

### File Structure Breakdown

1. **Imports** — Type imports from `@storybook/web-components`, `html` from Lit, test utilities from `storybook/test`, and the component itself
2. **Meta object** — Configuration for the entire component (title, tags, argTypes, default args, default render)
3. **Default export** — The meta object satisfying `Meta` type for full type inference
4. **Type alias** — `type Story = StoryObj;` for concise story type annotations
5. **Named exports** — Each story is a named export of type `Story`

## Default Export: Meta Configuration

The meta object is the single source of truth for the component's Storybook configuration. It defines the sidebar title, autodocs behavior, controls, default args, and default render function.

### Required Meta Properties

```typescript
const meta = {
  title: 'Components/Button', // Sidebar navigation path
  component: 'hx-button', // Tag name for CEM lookup
  tags: ['autodocs'], // Enable auto-generated docs page
} satisfies Meta;
```

- **`title`** — Sidebar path using `/` separators (e.g., `Components/Button`, `Components/Forms/Text Input`)
- **`component`** — Web component tag name (must match CEM entry for autodocs)
- **`tags`** — Array including `'autodocs'` to enable CEM-driven documentation

### Optional Meta Properties

```typescript
const meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs'],

  argTypes: {
    // Control definitions for each prop (see next section)
  },

  args: {
    // Default values inherited by all stories
    variant: 'primary',
    size: 'md',
  },

  render: (args) => html` <hx-button variant=${args.variant}>${args.label}</hx-button> `,

  decorators: [
    // Wrappers applied to all stories (e.g., padding, containers)
  ],

  parameters: {
    // Story-level configuration (backgrounds, viewport, docs)
  },
} satisfies Meta;
```

## ArgTypes: Control Configuration

ArgTypes define the interactive controls in the Storybook UI. Each control maps to a component property (or custom arg) and provides documentation, type information, and a UI widget for manipulation.

### ArgType Structure

```typescript
argTypes: {
  variant: {
    control: { type: 'select' },              // Control widget type
    options: ['primary', 'secondary', 'ghost'], // Available options
    description: 'Visual style variant.',     // Docs description
    table: {
      category: 'Visual',                     // Group in docs table
      defaultValue: { summary: 'primary' },   // Default shown in docs
      type: { summary: "'primary' | 'secondary' | 'ghost'" },
    },
  },
}
```

### Control Types

| Control Type | Use Case                    | Example                     |
| ------------ | --------------------------- | --------------------------- |
| `text`       | String inputs               | `placeholder`, `label`      |
| `boolean`    | Boolean props               | `disabled`, `required`      |
| `number`     | Numeric props               | `max`, `min`, `step`        |
| `select`     | Enum values                 | `variant`, `size`, `type`   |
| `radio`      | Few options, always visible | `alignment` with 2-3 values |
| `color`      | Color pickers               | Design token overrides      |
| `date`       | Date inputs                 | `minDate`, `maxDate`        |

### Complete ArgTypes Example

From `hx-button.stories.ts`:

```typescript
argTypes: {
  variant: {
    control: { type: 'select' },
    options: ['primary', 'secondary', 'ghost'],
    description: 'Visual style variant of the button.',
    table: {
      category: 'Visual',
      defaultValue: { summary: 'primary' },
      type: { summary: "'primary' | 'secondary' | 'ghost'" },
    },
  },
  size: {
    control: { type: 'select' },
    options: ['sm', 'md', 'lg'],
    description: 'Size of the button. Controls padding, font-size, and min-height.',
    table: {
      category: 'Visual',
      defaultValue: { summary: 'md' },
      type: { summary: "'sm' | 'md' | 'lg'" },
    },
  },
  disabled: {
    control: 'boolean',
    description: 'Whether the button is disabled. Prevents interaction and fires no events.',
    table: {
      category: 'State',
      defaultValue: { summary: 'false' },
      type: { summary: 'boolean' },
    },
  },
  label: {
    control: 'text',
    description: 'Button label text (passed via the default slot).',
    table: {
      category: 'Content',
      type: { summary: 'string' },
    },
  },
}
```

### ArgTypes Best Practices

1. **Use table categories** — Group related props: `Visual`, `State`, `Behavior`, `Content`, `Form`, `Validation`, `Accessibility`
2. **Write clear descriptions** — Explain the prop's purpose and impact (e.g., "Prevents interaction and fires no events")
3. **Document defaults** — Include `table.defaultValue` matching the component's actual default
4. **Show type signatures** — Include `table.type` with union types (e.g., `'sm' | 'md' | 'lg'`)
5. **Limit options** — For select/radio controls, provide only valid values

## Args: Default Values

Args define the default values for controls. Args set at the meta level are inherited by all stories. Individual stories can override these defaults.

```typescript
const meta = {
  // ... other meta config
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    label: 'Schedule Appointment',
  },
  render: (args) => html`
    <hx-button variant=${args.variant} hx-size=${args.size} ?disabled=${args.disabled}>
      ${args.label}
    </hx-button>
  `,
} satisfies Meta;
```

### Args Best Practices

1. **Set sensible defaults** — Use the most common values for each property
2. **Use healthcare context** — Label text should reflect real-world clinical use (e.g., "Schedule Appointment", "Submit Order")
3. **Match component defaults** — Args should match the component's internal defaults for consistency
4. **Override per story** — Individual stories override args to demonstrate specific variants or states

```typescript
export const Secondary: Story = {
  args: {
    variant: 'secondary', // Overrides meta default of 'primary'
    label: 'Cancel', // Overrides meta default label
  },
};
```

## Render Function

The render function generates the HTML template for a story. It receives the `args` object and returns a Lit `html` tagged template literal.

### Basic Render Function

```typescript
render: (args) => html`
  <hx-button
    variant=${args.variant}
    hx-size=${args.size}
    ?disabled=${args.disabled}
  >
    ${args.label}
  </hx-button>
`,
```

### Lit Template Syntax Primer

HELIX stories use Lit's `html` tagged template for rendering. Key syntax patterns:

- **Property binding** — `variant=${args.variant}`
- **Boolean attribute** — `?disabled=${args.disabled}` (adds/removes attribute)
- **Event handler** — `@hx-click=${handler}` (do not use in render, use play functions)
- **Slot content** — `${args.label}` for text or nested templates

### Advanced Render Functions

For complex stories, render functions can include multiple components, conditional logic, and inline styles:

```typescript
export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
      <hx-button variant="primary">Primary</hx-button>
      <hx-button variant="secondary">Secondary</hx-button>
      <hx-button variant="ghost">Ghost</hx-button>
      <hx-button disabled>Disabled</hx-button>
    </div>
  `,
};
```

### Custom Render for Interaction Testing

Play functions can reference elements rendered by the render function. Use consistent patterns for querying:

```typescript
export const FormSubmit: Story = {
  render: () => html`
    <form id="test-form" @submit=${(e: Event) => e.preventDefault()}>
      <hx-text-input label="Patient Name" name="patientName"></hx-text-input>
      <hx-button type="submit">Submit</hx-button>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form');
    const button = canvasElement.querySelector('hx-button');
    // ... assertions
  },
};
```

## Story Definitions

Stories are named exports of type `Story`. Each story showcases a specific variant, state, or use case.

### Minimal Story

A story can be as simple as an object with overridden args:

```typescript
export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};
```

This story inherits the meta's default args and render function, overriding only `variant`.

### Story with Custom Render

For stories that require unique markup, override the render function:

```typescript
export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <hx-button hx-size="sm">Small</hx-button>
      <hx-button hx-size="md">Medium</hx-button>
      <hx-button hx-size="lg">Large</hx-button>
    </div>
  `,
};
```

### Story with Play Function

Play functions execute after the story renders. Use them for interaction testing:

```typescript
export const ClickTest: Story = {
  args: {
    label: 'Verify Prescription',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await userEvent.click(innerButton!);

    // Verify the component responded to the click
  },
};
```

## Play Functions: Interaction Testing

Play functions are small snippets of code that execute after a story renders. They are used for interaction testing, accessibility verification, and visual regression test setup.

### Play Function Structure

```typescript
export const KeyboardActivation: Story = {
  args: {
    label: 'Approve Order',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const innerButton = hxButton!.shadowRoot!.querySelector('button');

    // Tab to focus the button
    await userEvent.tab();

    // Verify focus
    const activeEl = hxButton!.shadowRoot!.activeElement;
    await expect(activeEl).toBe(innerButton);

    // Press Enter and verify event fires
    const enterSpy = fn();
    hxButton!.addEventListener('hx-click', enterSpy);
    await userEvent.keyboard('{Enter}');
    await expect(enterSpy).toHaveBeenCalledTimes(1);
  },
};
```

### Testing Library API

Play functions use `@storybook/test`, which re-exports Vitest and Testing Library utilities:

- **`expect(value)`** — Assertion API from Vitest
- **`within(element)`** — Query elements inside a container (shadow DOM not supported directly)
- **`userEvent.click(element)`** — Simulate mouse click
- **`userEvent.type(input, 'text')`** — Simulate keyboard typing
- **`userEvent.tab()`** — Simulate tab key (focus navigation)
- **`userEvent.keyboard('{Enter}')`** — Simulate keyboard input
- **`fn()`** — Create a mock function for event spying

### Shadow DOM Querying

HELIX components use Shadow DOM. Play functions must query through `shadowRoot`:

```typescript
const hxButton = canvasElement.querySelector('hx-button');
const innerButton = hxButton!.shadowRoot!.querySelector('button');
await userEvent.click(innerButton!);
```

For form components, query the internal `<input>`, `<select>`, or `<textarea>`:

```typescript
const hxInput = canvasElement.querySelector('hx-text-input');
const nativeInput = hxInput!.shadowRoot!.querySelector('input');
await userEvent.type(nativeInput!, 'Jane Doe');
await expect(nativeInput!.value).toBe('Jane Doe');
```

### Event Verification

Verify custom events fire correctly:

```typescript
const eventSpy = fn();
hxButton!.addEventListener('hx-click', eventSpy);
await userEvent.click(innerButton!);
await expect(eventSpy).toHaveBeenCalledTimes(1);

const callArg = eventSpy.mock.calls[0][0] as CustomEvent;
await expect(callArg.type).toBe('hx-click');
await expect(callArg.detail.originalEvent).toBeTruthy();
```

### Play Function Best Practices

1. **Test one thing per story** — Each play function should verify a single interaction or state
2. **Always await** — All userEvent calls and expect assertions should be awaited
3. **Clean up event listeners** — Remove listeners at the end of the play function to prevent leaks
4. **Use descriptive labels** — Args like `label: 'Verify Prescription'` make visual test screenshots meaningful
5. **Verify accessibility** — Test keyboard navigation, focus management, and ARIA attributes

## Decorators

Decorators wrap stories with additional markup or context. They are defined at the meta level (applied to all stories) or per-story.

### Global Decorator Example

From `.storybook/preview.ts`:

```typescript
decorators: [
  (story) => html`<div style="padding: 2rem;">${story()}</div>`,
],
```

This adds consistent padding to all stories.

### Per-Story Decorator

For stories requiring special layout:

```typescript
export const InACard: Story = {
  decorators: [
    (story) => html` <hx-card elevation="raised" style="max-width: 480px;"> ${story()} </hx-card> `,
  ],
  render: () => html` <hx-button>Submit</hx-button> `,
};
```

### Common Decorator Use Cases

- **Container width** — Wrap in `<div style="max-width: 480px;">` for narrow components
- **Background color** — Wrap in `<div style="background: #f8f9fa; padding: 2rem;">` for contrast
- **Grid layout** — Wrap in `<div style="display: grid; gap: 1rem;">` for multi-component stories
- **Theme context** — Apply data attributes for theme switching (handled globally in HELIX)

## Autodocs: Custom Elements Manifest Integration

Storybook autodocs generates API documentation by reading `custom-elements.json` (the Custom Elements Manifest). The CEM is generated by `@custom-elements-manifest/analyzer` and contains metadata about every component's properties, events, slots, CSS custom properties, and CSS parts.

### Enabling Autodocs

Add the `'autodocs'` tag to the meta configuration:

```typescript
const meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs'], // Enables autodocs page
} satisfies Meta;
```

### CEM Registration

The CEM is registered globally in `.storybook/preview.ts`:

```typescript
import { setCustomElementsManifest } from '@storybook/web-components';
import customElements from '@helixui/library/custom-elements.json';

setCustomElementsManifest(customElements);
```

### What Autodocs Shows

The autodocs page includes:

1. **Component description** — Extracted from the component's JSDoc `@summary` tag
2. **Properties table** — All `@property` decorated fields with types, defaults, and descriptions
3. **Events table** — All `@fires` documented custom events with detail types
4. **Slots table** — All `@slot` documented slots with descriptions
5. **CSS Custom Properties table** — All `@cssprop` documented design tokens
6. **CSS Parts table** — All `@csspart` documented shadow DOM parts
7. **Interactive controls** — Generated from argTypes configuration

### Improving Autodocs Quality

Autodocs quality depends on JSDoc completeness in the component source:

```typescript
/**
 * @summary Interactive button component with multiple variants and sizes.
 *
 * @tag hx-button
 * @slot - Default slot for button label text or inline icons
 * @fires hx-click - Emitted when the button is clicked. Detail: { originalEvent }
 * @csspart button - The internal native <button> element
 * @cssprop --hx-button-bg - Background color of the button
 * @cssprop --hx-button-color - Text color of the button
 * @cssprop --hx-button-border-radius - Border radius of the button
 */
@customElement('hx-button')
export class HxButton extends LitElement {
  /**
   * Visual style variant. Affects color scheme and emphasis.
   * @type {'primary' | 'secondary' | 'ghost'}
   */
  @property({ reflect: true })
  variant: 'primary' | 'secondary' | 'ghost' = 'primary';
}
```

Well-documented components produce high-quality autodocs with minimal argTypes configuration.

## Story Organization Patterns

HELIX story files follow a consistent organization pattern for discoverability and maintainability.

### Standard Section Order

```typescript
// ─────────────────────────────────────────────────
// 1. DEFAULT — Most common use case
// ─────────────────────────────────────────────────

export const Default: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 2. VARIANT STORIES — Every variant value
// ─────────────────────────────────────────────────

export const Primary: Story = {
  /* ... */
};
export const Secondary: Story = {
  /* ... */
};
export const Ghost: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 3. SIZE STORIES — Every size value
// ─────────────────────────────────────────────────

export const Small: Story = {
  /* ... */
};
export const Medium: Story = {
  /* ... */
};
export const Large: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 4. STATE STORIES — Disabled, error, required, etc.
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  /* ... */
};
export const WithError: Story = {
  /* ... */
};
export const Required: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 5. SLOT DEMOS — Every documented slot
// ─────────────────────────────────────────────────

export const WithPrefixSlot: Story = {
  /* ... */
};
export const WithSuffixSlot: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 6. KITCHEN SINKS — All variants, sizes, states
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  /* ... */
};
export const AllSizes: Story = {
  /* ... */
};
export const AllStates: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 7. COMPOSITION — Multi-component stories
// ─────────────────────────────────────────────────

export const ButtonGroup: Story = {
  /* ... */
};
export const InACard: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 8. EDGE CASES — Long labels, overflow, etc.
// ─────────────────────────────────────────────────

export const LongLabel: Story = {
  /* ... */
};
export const OverflowContent: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 9. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 10. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 11. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const ClickEvent: Story = {
  /* ... */
};
export const KeyboardActivation: Story = {
  /* ... */
};

// ─────────────────────────────────────────────────
// 12. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientActions: Story = {
  /* ... */
};
export const EmergencyAction: Story = {
  /* ... */
};
```

### Section Rationale

1. **Default** — The first story is the canonical example, displayed prominently in autodocs
2. **Variants & Sizes** — Exhaustive coverage of all property values for visual regression
3. **States** — Disabled, error, required, and other state permutations
4. **Slots** — Critical for Drupal integration (CMS content fills slots)
5. **Kitchen sinks** — Comprehensive matrices for screenshot-based testing
6. **Composition** — Real-world multi-component patterns
7. **Edge cases** — Stress tests (long text, overflow, narrow containers)
8. **CSS properties & parts** — Theming surface documentation
9. **Interaction tests** — Automated interaction verification via play functions
10. **Healthcare scenarios** — Domain-specific use cases with clinical context

## Complete Story File Example

From `hx-button.stories.ts` (condensed):

```typescript
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-button.js';

const meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
      description: 'Visual style variant of the button.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'secondary' | 'ghost'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'Button label text.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    label: 'Schedule Appointment',
  },
  render: (args) => html`
    <hx-button variant=${args.variant} hx-size=${args.size} ?disabled=${args.disabled}>
      ${args.label}
    </hx-button>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    label: 'Schedule Appointment',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    let eventFired = false;
    hxButton!.addEventListener('hx-click', () => {
      eventFired = true;
    });
    await userEvent.click(innerButton!);
    await expect(eventFired).toBe(true);
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Confirm Order',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'View Details',
  },
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem;">
      <hx-button variant="primary">Primary</hx-button>
      <hx-button variant="secondary">Secondary</hx-button>
      <hx-button variant="ghost">Ghost</hx-button>
    </div>
  `,
};

export const CSSCustomProperties: Story = {
  render: () => html`
    <hx-button style="--hx-button-bg: #059669;">Custom BG</hx-button>
    <hx-button style="--hx-button-border-radius: 9999px;">Pill</hx-button>
  `,
};
```

## Best Practices Summary

### Do

- **Use `satisfies Meta`** — Enables full type inference without explicit generics
- **Include `tags: ['autodocs']`** — Generates API documentation from CEM
- **Write descriptive argTypes** — Clear descriptions, default values, and type signatures
- **Organize stories consistently** — Follow the 12-section pattern for discoverability
- **Test interactions** — Use play functions for click, keyboard, focus, and event verification
- **Shadow DOM awareness** — Query through `shadowRoot` for internal elements
- **Healthcare context** — Use real clinical labels ("Schedule Appointment", "Submit Order")
- **Document CSS parts and properties** — Demonstrate theming surface with dedicated stories
- **Kitchen sink stories** — Include "All Variants", "All Sizes", "All States" for visual regression

### Don't

- **Don't skip autodocs** — `tags: ['autodocs']` is mandatory for all components
- **Don't hardcode values** — Use args for all configurable properties
- **Don't test in stories** — Move complex logic to play functions, not inline event handlers
- **Don't use React/Vue syntax** — HELIX uses Lit's `html` tagged template, not JSX
- **Don't skip edge cases** — Long labels, overflow, narrow containers are critical for visual regression
- **Don't forget keyboard tests** — Every interactive component must test tab, enter, space navigation
- **Don't skip healthcare scenarios** — Clinical use cases validate the component's real-world utility

## Storybook Configuration Files

HELIX Storybook is configured via two files in `apps/storybook/.storybook/`:

### `main.ts` — Build Configuration

```typescript
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../../../packages/hx-library/src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
};

export default config;
```

### `preview.ts` — Global Decorators and Parameters

```typescript
import '@helixui/tokens/tokens.css';
import type { Preview } from '@storybook/web-components';
import { setCustomElementsManifest } from '@storybook/web-components';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { html } from 'lit';
import customElements from '@helixui/library/custom-elements.json';

setCustomElementsManifest(customElements);

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
      sort: 'requiredFirst',
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  decorators: [
    (story) => html`<div style="padding: 2rem;">${story()}</div>`,
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
```

## Running Storybook

### Development Mode

```bash
npm run dev:storybook
```

Starts Storybook on `http://localhost:3151` with hot module reloading.

### Build for Production

```bash
npm run build:storybook
```

Generates a static site in `apps/storybook/storybook-static/` for deployment to Vercel or Netlify.

### Test Stories

```bash
npm run test:storybook
```

Runs play functions as automated tests in headless Chromium via Playwright.

## Visual Regression Testing

Every story is a visual test baseline. HELIX uses Chromatic (or Percy) for pixel-perfect screenshot diffing in CI.

### How Visual Regression Works

1. **Baseline capture** — First CI run captures screenshots of all stories
2. **Change detection** — Subsequent runs compare new screenshots to baselines
3. **Review workflow** — Diffs are flagged for human review before merge
4. **Acceptance** — Approved changes become the new baseline

### Story Naming for VRT

Story names appear in screenshot filenames. Use clear, descriptive names:

```typescript
export const AllVariants: Story = {
  /* ... */
}; // Good
export const Story1: Story = {
  /* ... */
}; // Bad (unclear)
export const ButtonWithIconLeft: Story = {
  /* ... */
}; // Good
export const Test: Story = {
  /* ... */
}; // Bad (vague)
```

## Troubleshooting

### Autodocs Not Showing

**Symptom**: Autodocs page is blank or missing API tables.

**Solution**: Verify `tags: ['autodocs']` is set in meta and `component` matches the tag name in `custom-elements.json`.

### Controls Not Working

**Symptom**: Controls panel is empty or props don't update the story.

**Solution**: Check that argTypes are defined and the render function references `args` correctly.

### Play Function Fails

**Symptom**: Play function throws errors in Storybook or Playwright.

**Solution**: Ensure all userEvent calls and expect assertions are awaited. Verify shadow DOM queries are correct.

### Slow Storybook Build

**Symptom**: `npm run build:storybook` takes over 2 minutes.

**Solution**: Reduce the number of stories (split large story files) or disable autodocs for non-critical stories.

## Next Steps

- [Component Testing](/components/testing/) — Vitest browser mode tests
- [Custom Elements Manifest](/components/cem/) — CEM generation and JSDoc conventions
- [Accessibility Testing](/components/accessibility/) — WCAG 2.1 AA compliance
- [Visual Regression Testing](/ci/visual-regression/) — Chromatic configuration

## Additional Resources

- [Component Story Format 3.0 Announcement](https://storybook.js.org/blog/component-story-format-3-0)
- [Storybook Web Components Documentation](https://storybook.js.org/docs/8/web-components/writing-stories)
- [CSF Specification on GitHub](https://github.com/ComponentDriven/csf)
- [Testing Library for Storybook](https://storybook.js.org/docs/8/writing-tests/interaction-testing)
