import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
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
    label: {
      control: 'text',
      description: 'Accessible label for the toolbar.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'Actions' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    size: 'md',
    variant: 'default',
    sticky: false,
    label: 'Toolbar',
  },
  render: (args) => html`
    <hx-action-bar
      size=${args.size}
      variant=${args.variant}
      ?sticky=${args.sticky}
      label=${args.label}
    >
      <button slot="start">Save</button>
      <button slot="start">Edit</button>
      <span>Patient Record</span>
      <button slot="end">Cancel</button>
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
    <hx-action-bar variant=${args.variant} label="Toolbar" size=${args.size}>
      <button slot="start">New</button>
      <button slot="start">Import</button>
      <button slot="end">Export</button>
    </hx-action-bar>
  `,
};

// ─────────────────────────────────────────────────
// 3. FILLED VARIANT
// ─────────────────────────────────────────────────

export const Filled: Story = {
  args: { variant: 'filled' },
  render: (args) => html`
    <hx-action-bar variant=${args.variant} label="Toolbar" size=${args.size}>
      <button slot="start">Filter</button>
      <button slot="start">Sort</button>
      <span>24 results</span>
      <button slot="end">Clear</button>
    </hx-action-bar>
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
    <hx-action-bar label="Toolbar" variant="outlined">
      <button slot="start">Save</button>
      <button slot="start">Save & Close</button>
    </hx-action-bar>
  `,
};

// ─────────────────────────────────────────────────
// 6. END ONLY
// ─────────────────────────────────────────────────

export const EndSlotOnly: Story = {
  render: () => html`
    <hx-action-bar label="Toolbar" variant="outlined">
      <button slot="end">Cancel</button>
      <button slot="end">Confirm</button>
    </hx-action-bar>
  `,
};

// ─────────────────────────────────────────────────
// 7. STICKY
// ─────────────────────────────────────────────────

export const Sticky: Story = {
  args: { sticky: true, variant: 'filled' },
  render: (args) => html`
    <div style="height: 200px; overflow-y: auto;">
      <hx-action-bar ?sticky=${args.sticky} variant=${args.variant} label="Toolbar">
        <button slot="start">Action</button>
      </hx-action-bar>
      <div style="padding: var(--hx-space-4, 1rem); height: 400px;">
        <p>Scroll down to see the sticky action bar</p>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. HEALTHCARE — Patient record toolbar
// ─────────────────────────────────────────────────

export const PatientRecordToolbar: Story = {
  render: () => html`
    <hx-action-bar label="Patient record actions" variant="outlined" size="md">
      <button slot="start">Save Changes</button>
      <button slot="start">Print</button>
      <button slot="start">Share</button>
      <span>Jane Doe — MRN 12345678</span>
      <button slot="end">Discharge</button>
    </hx-action-bar>
  `,
};

// ─────────────────────────────────────────────────
// 9. KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  render: () => html`
    <p>Focus any button, then use Arrow Left/Right to navigate.</p>
    <hx-action-bar label="Navigable toolbar" variant="outlined">
      <button slot="start" id="kb-bold">Bold</button>
      <button slot="start" id="kb-italic">Italic</button>
      <button slot="start" id="kb-underline">Underline</button>
      <button slot="end" id="kb-clear">Clear</button>
    </hx-action-bar>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const boldBtn = canvas.getByText('Bold');

    await userEvent.click(boldBtn);
    await expect(document.activeElement).toBe(boldBtn);

    await userEvent.keyboard('{ArrowRight}');
    const italicBtn = canvas.getByText('Italic');
    await expect(document.activeElement).toBe(italicBtn);
  },
};
