---
title: Storybook for Web Components
description: Write and organize Storybook stories for HELiX web components using CSF3 and @storybook/web-components-vite.
---

HELiX uses Storybook as its component workbench. Stories serve as living documentation, interactive playgrounds, and the source for accessibility audits. This page covers story format, controls configuration, and HELiX naming conventions.

## Setup

HELiX Storybook uses `@storybook/web-components-vite`:

```bash
pnpm add -D @storybook/web-components-vite @storybook/addon-a11y @storybook/test
```

`.storybook/main.ts`:

```typescript
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.ts'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
};

export default config;
```

## Story File Structure

HELiX story files are colocated with the component: `src/components/hx-button/hx-button.stories.ts`.

### `Meta` Configuration

```typescript
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-button.js';

const meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'outline'],
      description: 'Visual style variant of the button.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'" },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Prevents interaction and fires no events.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Shows spinner and prevents double-submission.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;
```

### CSF3 Story Format with `render()`

CSF3 stories use a `render` function that receives `args` and returns a Lit template:

```typescript
export const Default: Story = {
  args: {
    variant: 'primary',
    disabled: false,
    loading: false,
  },
  render: (args) => html`
    <hx-button
      variant=${args.variant}
      ?disabled=${args.disabled}
      ?loading=${args.loading}
    >
      Save changes
    </hx-button>
  `,
};
```

### Named Stories for Each Variant

Each significant variant gets its own story for easy navigation:

```typescript
export const Primary: Story = {
  args: { variant: 'primary' },
  render: (args) => html`
    <hx-button variant=${args.variant}>Primary</hx-button>
  `,
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: (args) => html`
    <hx-button variant=${args.variant}>Secondary</hx-button>
  `,
};

export const Danger: Story = {
  args: { variant: 'danger' },
  render: (args) => html`
    <hx-button variant=${args.variant}>Delete</hx-button>
  `,
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => html`
    <hx-button ?loading=${args.loading}>Saving...</hx-button>
  `,
};
```

## `args` and `argTypes`

`args` supply default values for story controls. `argTypes` configure how those controls appear in the Storybook UI:

| Control type | Use for |
|---|---|
| `'text'` | String values |
| `'boolean'` | Boolean properties |
| `'select'` | Enum / union types |
| `'number'` | Numeric properties |
| `'color'` | CSS color strings |
| `'object'` | JSON object/array |

The `table` key in `argTypes` groups controls into categories visible in the Controls panel:

```typescript
argTypes: {
  variant:  { table: { category: 'Visual' } },
  disabled: { table: { category: 'State' } },
  type:     { table: { category: 'Form' } },
  href:     { table: { category: 'Navigation' } },
}
```

## `@storybook/addon-a11y`

The a11y addon runs axe-core on every story. Violations appear in the "Accessibility" panel under "Violations" with element references, impact levels, and links to fix documentation.

To disable a specific rule for a story when there is a known, intentional deviation:

```typescript
export const IconOnly: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
  render: () => html`
    <hx-button accessible-label="Close" variant="ghost">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" />
      </svg>
    </hx-button>
  `,
};
```

## Interaction Testing with `@storybook/test`

CSF3 stories can include `play` functions that simulate user interactions and run assertions:

```typescript
import { expect, userEvent, fn, within } from '@storybook/test';

export const ClickTest: Story = {
  args: { onHxClick: fn() },
  render: (args) => html`
    <hx-button @hx-click=${args.onHxClick}>Click me</hx-button>
  `,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByText('Click me');
    await userEvent.click(button);
    expect(args.onHxClick).toHaveBeenCalledOnce();
  },
};
```

## HELiX Story Title Conventions

| Component | `title` |
|---|---|
| `hx-button` | `Components/Button` |
| `hx-text-input` | `Forms/Text Input` |
| `hx-dialog` | `Overlays/Dialog` |
| `hx-data-table` | `Data/Data Table` |
| `hx-badge` | `Components/Badge` |
| `hx-card` | `Layout/Card` |

The first segment groups components in the Storybook sidebar. Use the same categories as the HELiX docs navigation.

## Next Steps

- [Custom Elements Manifest](/components-guide/documentation/cem-fundamentals/) — machine-readable API that powers Storybook autodocs
- [JSDoc for Components](/components-guide/documentation/jsdoc/) — source annotations that generate docs automatically
- [API Documentation](/components-guide/documentation/api-docs/) — publishing and versioning the docs site
