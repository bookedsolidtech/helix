import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import './hx-help-text.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/HelpText',
  component: 'hx-help-text',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'error', 'warning', 'success'],
      description: 'Visual variant that determines the text color and icon indicator.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'error' | 'warning' | 'success'" },
      },
    },
    label: {
      name: 'default (slot)',
      control: 'text',
      description:
        '**Storybook only.** Controls the default slot content. This is not a component property — pass text between `<hx-help-text>` tags to populate the default slot.',
      table: {
        category: 'Slots',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'default',
    label: 'Enter your full name as it appears on your ID.',
  },
  render: (args) => html`<hx-help-text variant=${args.variant}>${args.label}</hx-help-text>`,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    variant: 'default',
    label: 'Enter your full name as it appears on your ID.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByText('Enter your full name as it appears on your ID.');
    await expect(el).toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    label: 'This field is required.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByText('This field is required.');
    await expect(el).toBeInTheDocument();
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    label: 'This value will be visible to other users.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByText('This value will be visible to other users.');
    await expect(el).toBeInTheDocument();
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    label: 'Your password meets all requirements.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByText('Your password meets all requirements.');
    await expect(el).toBeInTheDocument();
  },
};

// ─────────────────────────────────────────────────
// Form Field Integration
// ─────────────────────────────────────────────────

export const FormFieldIntegration: Story = {
  name: 'Form Field Integration',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;">
      <div>
        <label for="email" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
          Email address
        </label>
        <input
          id="email"
          type="email"
          aria-describedby="email-help"
          style="display: block; width: 100%; padding: 0.5rem; border: 1px solid var(--hx-color-neutral-300); border-radius: 0.375rem;"
          placeholder="you@example.com"
        />
        <hx-help-text id="email-help" style="margin-top: 0.25rem;">
          We'll never share your email with anyone else.
        </hx-help-text>
      </div>

      <div>
        <label for="password" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
          Password
        </label>
        <input
          id="password"
          type="password"
          aria-describedby="password-error"
          aria-invalid="true"
          style="display: block; width: 100%; padding: 0.5rem; border: 1px solid var(--hx-color-error-600); border-radius: 0.375rem;"
        />
        <hx-help-text id="password-error" variant="error" style="margin-top: 0.25rem;">
          Password must be at least 8 characters.
        </hx-help-text>
      </div>

      <div>
        <label for="username" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
          Username
        </label>
        <input
          id="username"
          type="text"
          aria-describedby="username-success"
          style="display: block; width: 100%; padding: 0.5rem; border: 1px solid var(--hx-color-success-700); border-radius: 0.375rem;"
          value="john_doe"
        />
        <hx-help-text id="username-success" variant="success" style="margin-top: 0.25rem;">
          Username is available!
        </hx-help-text>
      </div>
    </div>
  `,
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <hx-help-text variant="default"
        >Default: Enter your full name as it appears on your ID.</hx-help-text
      >
      <hx-help-text variant="error">Error: This field is required.</hx-help-text>
      <hx-help-text variant="warning"
        >Warning: This value will be visible to other users.</hx-help-text
      >
      <hx-help-text variant="success">Success: Your password meets all requirements.</hx-help-text>
    </div>
  `,
};
