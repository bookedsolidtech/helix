---
title: Storybook with React Wrappers
description: Setting up framework-specific Storybook integration for HELiX web components using React wrappers, CSF3 stories, and custom decorators.
---

# Storybook with React Wrappers

HELiX ships a Storybook 10.x instance (`apps/storybook`) that documents every component using native web component stories. This guide covers how to integrate HELiX components into a **consumer application's** Storybook using React wrappers — the pattern used when your app is React-based and you want HELiX components in your own Storybook.

---

## Overview

The recommended approach for framework-specific Storybook is to wrap each HELiX component in a thin React component that:

1. Registers the custom element on import
2. Handles event forwarding via `useRef` + `addEventListener`
3. Passes properties correctly (attributes for primitives, DOM assignment for objects)
4. Exposes the same API surface as the HELiX element via React props

This produces stories that render identically to production usage and integrate with Storybook's controls panel.

---

## Setup

### Install Dependencies

```bash
npm install @wc-2026/library
npm install --save-dev @storybook/react @storybook/react-vite
```

### Configure `.storybook/main.ts`

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal(config) {
    // Ensure HELiX custom elements are not treated as Vue/Svelte components
    return config;
  },
};

export default config;
```

### Configure `.storybook/preview.ts`

Register HELiX components once in Storybook's preview entry:

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';

// Register all HELiX components for all stories
import '@wc-2026/library';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

---

## Writing React Wrapper Components

### Pattern: Thin React Wrapper

Create a wrapper component for each HELiX element you want to story. The wrapper translates React props into DOM attributes/properties and React callbacks into event listeners.

```tsx
// src/helix-wrappers/HxButton.tsx
import { useRef, useEffect, forwardRef } from 'react';
import '@wc-2026/library/components/hx-button';

export interface HxButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children?: React.ReactNode;
  onHxClick?: (event: CustomEvent) => void;
}

export const HxButton = forwardRef<HTMLElement, HxButtonProps>(function HxButton(
  { variant = 'primary', size = 'md', disabled = false, type = 'button', children, onHxClick },
  forwardedRef
) {
  const innerRef = useRef<HTMLElement>(null);
  const ref = (forwardedRef as React.RefObject<HTMLElement>) ?? innerRef;

  useEffect(() => {
    const el = ref.current;
    if (!el || !onHxClick) return;
    el.addEventListener('hx-click', onHxClick as EventListener);
    return () => el.removeEventListener('hx-click', onHxClick as EventListener);
  }, [onHxClick, ref]);

  return (
    <hx-button
      ref={ref}
      variant={variant}
      size={size}
      disabled={disabled || undefined}
      type={type}
    >
      {children}
    </hx-button>
  );
});
```

---

### Pattern: Input Wrapper with Controlled Value

For form inputs, the wrapper handles both value syncing and event callbacks:

```tsx
// src/helix-wrappers/HxTextInput.tsx
import { useRef, useEffect } from 'react';
import '@wc-2026/library/components/hx-text-input';

export interface HxTextInputProps {
  label?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onHxChange?: (value: string) => void;
  onHxInput?: (value: string) => void;
}

export function HxTextInput({
  label,
  value,
  placeholder,
  required = false,
  disabled = false,
  error,
  onHxChange,
  onHxInput,
}: HxTextInputProps) {
  const ref = useRef<HTMLElement>(null);

  // Sync value prop to DOM property
  useEffect(() => {
    if (ref.current && value !== undefined) {
      (ref.current as HTMLElement & { value: string }).value = value;
    }
  }, [value]);

  // Attach event listeners
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleChange = (e: Event) => {
      onHxChange?.((e as CustomEvent<{ value: string }>).detail.value);
    };
    const handleInput = (e: Event) => {
      onHxInput?.((e as CustomEvent<{ value: string }>).detail.value);
    };

    el.addEventListener('hx-change', handleChange);
    el.addEventListener('hx-input', handleInput);

    return () => {
      el.removeEventListener('hx-change', handleChange);
      el.removeEventListener('hx-input', handleInput);
    };
  }, [onHxChange, onHxInput]);

  return (
    <hx-text-input
      ref={ref}
      label={label}
      placeholder={placeholder}
      required={required || undefined}
      disabled={disabled || undefined}
      error={error}
    />
  );
}
```

---

## Writing Stories (CSF3)

### Button Stories

```tsx
// src/helix-wrappers/HxButton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { HxButton } from './HxButton';

const meta: Meta<typeof HxButton> = {
  title: 'HELiX/hx-button',
  component: HxButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Primary action button component from HELiX.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    onHxClick: {
      action: 'hx-click',
      description: 'Fires when the button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HxButton>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Save Patient',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    children: 'Cancel',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    size: 'md',
    children: 'Delete Record',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    disabled: true,
    children: 'Unavailable',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <HxButton variant="primary">Primary</HxButton>
      <HxButton variant="secondary">Secondary</HxButton>
      <HxButton variant="ghost">Ghost</HxButton>
      <HxButton variant="danger">Danger</HxButton>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <HxButton variant="primary" size="sm">Small</HxButton>
      <HxButton variant="primary" size="md">Medium</HxButton>
      <HxButton variant="primary" size="lg">Large</HxButton>
    </div>
  ),
};
```

---

### Input Stories

```tsx
// src/helix-wrappers/HxTextInput.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { HxTextInput } from './HxTextInput';

const meta: Meta<typeof HxTextInput> = {
  title: 'HELiX/hx-text-input',
  component: HxTextInput,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    onHxChange: { action: 'hx-change' },
    onHxInput: { action: 'hx-input' },
  },
};

export default meta;
type Story = StoryObj<typeof HxTextInput>;

export const Default: Story = {
  args: {
    label: 'Patient Name',
    placeholder: 'Enter patient name',
  },
};

export const Required: Story = {
  args: {
    label: 'MRN',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Date of Birth',
    error: 'Invalid date format. Use MM/DD/YYYY.',
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div>
        <HxTextInput
          label="Patient Name"
          value={value}
          onHxInput={setValue}
        />
        <p style={{ marginTop: '8px', fontSize: '14px' }}>
          Current value: <code>{value || '(empty)'}</code>
        </p>
      </div>
    );
  },
};
```

---

## Storybook Decorators for HELiX Theming

Add a global decorator to inject HELiX design tokens into Storybook stories:

```typescript
// .storybook/preview.ts
import type { Preview, Decorator } from '@storybook/react';
import '@wc-2026/library';

const withHelixTheme: Decorator = (Story) => (
  <div
    style={{
      // Inject semantic design tokens at the story root
      '--hx-color-primary': '#0066CC',
      '--hx-color-surface': '#FFFFFF',
      '--hx-spacing-md': '16px',
      padding: '24px',
    } as React.CSSProperties}
  >
    <Story />
  </div>
);

const preview: Preview = {
  decorators: [withHelixTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
      },
    },
  },
};

export default preview;
```

---

## Storybook Interaction Tests

Use `@storybook/test` (Storybook 8+) to write interaction tests that verify HELiX component behavior:

```tsx
// src/helix-wrappers/HxButton.stories.tsx
import { expect, fn, userEvent, within } from '@storybook/test';

export const ClickInteraction: Story = {
  args: {
    children: 'Save Patient',
    onHxClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the button in the shadow DOM
    const button = canvas.getByRole('button', { hidden: true });

    // Simulate a click
    await userEvent.click(button);

    // Verify the event was fired
    await expect(args.onHxClick).toHaveBeenCalledOnce();
  },
};
```

> **Shadow DOM Note:** Storybook's `within` queries the light DOM. To query inside a HELiX shadow root, use the native DOM API:
>
> ```typescript
> const hxButton = canvasElement.querySelector('hx-button');
> const innerButton = hxButton?.shadowRoot?.querySelector('button');
> ```

---

## Complete Project Structure

```
src/
  helix-wrappers/
    HxButton.tsx              # React wrapper
    HxButton.stories.tsx      # Stories
    HxCard.tsx
    HxCard.stories.tsx
    HxTextInput.tsx
    HxTextInput.stories.tsx
    index.ts                  # Re-exports all wrappers

.storybook/
  main.ts
  preview.ts
```

---

## Tips

- **Import individually** — Import `@wc-2026/library/components/hx-button` per wrapper, not the full library. This keeps bundle analysis accurate in Storybook.
- **Use `argTypes` actions** — Map `onHxClick`, `onHxChange`, etc. to Storybook actions for automatic event logging.
- **Test in isolation** — Each wrapper story should demonstrate a single behavior or variant, not a full page layout.
- **Re-export wrappers** — Export all wrappers from a single `index.ts` so consumers can tree-shake easily.

---

## Related

- [React & Next.js](./react/)
- [Common Gotchas](./gotchas/)
- [SSR/SSG Compatibility](./ssr-compatibility/)
