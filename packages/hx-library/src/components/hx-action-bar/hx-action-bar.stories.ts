import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import './hx-action-bar.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/ActionBar',
  component: 'hx-action-bar',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the action bar.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'outlined', 'filled'],
      description: 'Visual variant controlling the bar background.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'outlined' | 'filled'" },
      },
    },
    sticky: {
      control: 'boolean',
      description: 'When true, the bar sticks to the top of its scroll container.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    size: 'md',
    variant: 'default',
    sticky: false,
  },
  render: (args) => html`
    <hx-action-bar
      size=${args.size}
      variant=${args.variant}
      ?sticky=${args.sticky}
      aria-label="Toolbar"
      style="border: 1px dashed #e5e7eb;"
    >
      <button
        slot="start"
        style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
      >
        Save
      </button>
      <button
        slot="start"
        style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
      >
        Edit
      </button>
      <span style="font-size: 0.875rem; color: #6b7280;">Patient Record</span>
      <button
        slot="end"
        style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
      >
        Cancel
      </button>
    </hx-action-bar>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const el = canvasElement.querySelector('hx-action-bar');
    await expect(el).toBeTruthy();

    const base = el?.shadowRoot?.querySelector('[part="base"]');
    await expect(base).toBeTruthy();
    await expect(base?.getAttribute('role')).toBe('toolbar');
  },
};

// ─────────────────────────────────────────────────
// 2. OUTLINED VARIANT
// ─────────────────────────────────────────────────

export const Outlined: Story = {
  args: { variant: 'outlined' },
  render: (args) => html`
    <div style="padding: 1rem;">
      <hx-action-bar variant=${args.variant} aria-label="Toolbar" size=${args.size}>
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          New
        </button>
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Import
        </button>
        <button
          slot="end"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Export
        </button>
      </hx-action-bar>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 3. FILLED VARIANT
// ─────────────────────────────────────────────────

export const Filled: Story = {
  args: { variant: 'filled' },
  render: (args) => html`
    <div style="padding: 1rem;">
      <hx-action-bar variant=${args.variant} aria-label="Toolbar" size=${args.size}>
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Filter
        </button>
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Sort
        </button>
        <span style="font-size: 0.875rem; color: #6b7280;">24 results</span>
        <button
          slot="end"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Clear
        </button>
      </hx-action-bar>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. SIZE VARIANTS
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: { size: 'sm', variant: 'outlined' },
};

export const Medium: Story = {
  args: { size: 'md', variant: 'outlined' },
};

export const Large: Story = {
  args: { size: 'lg', variant: 'outlined' },
};

// ─────────────────────────────────────────────────
// 5. START ONLY
// ─────────────────────────────────────────────────

export const StartSlotOnly: Story = {
  render: () => html`
    <div style="padding: 1rem;">
      <hx-action-bar aria-label="Toolbar" variant="outlined">
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Save
        </button>
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Save & Close
        </button>
      </hx-action-bar>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. END ONLY
// ─────────────────────────────────────────────────

export const EndSlotOnly: Story = {
  render: () => html`
    <div style="padding: 1rem;">
      <hx-action-bar aria-label="Toolbar" variant="outlined">
        <button
          slot="end"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Cancel
        </button>
        <button
          slot="end"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Confirm
        </button>
      </hx-action-bar>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. STICKY
// ─────────────────────────────────────────────────

export const Sticky: Story = {
  args: { sticky: true, variant: 'filled' },
  render: (args) => html`
    <div style="height: 200px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
      <hx-action-bar ?sticky=${args.sticky} variant=${args.variant} aria-label="Toolbar">
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Action
        </button>
      </hx-action-bar>
      <div
        style="padding: 1rem; height: 400px; background: linear-gradient(to bottom, #f9fafb, #e5e7eb);"
      >
        <p style="color: #6b7280; font-size: 0.875rem;">Scroll down to see the sticky action bar</p>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. HEALTHCARE — Patient record toolbar
// ─────────────────────────────────────────────────

export const PatientRecordToolbar: Story = {
  render: () => html`
    <div style="max-width: 800px; font-family: system-ui, sans-serif;">
      <hx-action-bar aria-label="Patient record actions" variant="outlined" size="md">
        <button
          slot="start"
          style="padding: 0.375rem 0.875rem; background: #2563eb; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
        >
          Save Changes
        </button>
        <button
          slot="start"
          style="padding: 0.375rem 0.875rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer; font-size: 0.875rem;"
        >
          Print
        </button>
        <button
          slot="start"
          style="padding: 0.375rem 0.875rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer; font-size: 0.875rem;"
        >
          Share
        </button>
        <span style="font-size: 0.875rem; color: #374151; font-weight: 500;">
          Jane Doe — MRN 12345678
        </span>
        <button
          slot="end"
          style="padding: 0.375rem 0.875rem; border: 1px solid #fca5a5; border-radius: 0.375rem; background: #fef2f2; color: #dc2626; cursor: pointer; font-size: 0.875rem;"
        >
          Discharge
        </button>
      </hx-action-bar>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  render: () => html`
    <div style="padding: 1rem;">
      <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">
        Focus any button, then use Arrow Left/Right to navigate.
      </p>
      <hx-action-bar aria-label="Navigable toolbar" variant="outlined">
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Bold
        </button>
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Italic
        </button>
        <button
          slot="start"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Underline
        </button>
        <button
          slot="end"
          style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Clear
        </button>
      </hx-action-bar>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-action-bar');
    await expect(el).toBeTruthy();

    const base = el?.shadowRoot?.querySelector('[part="base"]');
    await expect(base?.getAttribute('role')).toBe('toolbar');
  },
};
