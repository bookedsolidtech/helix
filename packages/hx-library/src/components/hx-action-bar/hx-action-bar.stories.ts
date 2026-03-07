import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within } from 'storybook/test';
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
    position: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'sticky'],
      description:
        'Position behavior. `sticky` sticks to top; `bottom` sticks to bottom with safe-area support.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'top' },
        type: { summary: "'top' | 'bottom' | 'sticky'" },
      },
    },
  },
  args: {
    size: 'md',
    variant: 'default',
    position: 'top',
  },
  render: (args) => html`
    <hx-action-bar
      size=${args.size}
      variant=${args.variant}
      position=${args.position}
      aria-label="Toolbar"
      style="border: 1px dashed var(--hx-color-neutral-200, #e5e7eb);"
    >
      <button
        slot="start"
        style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
      >
        Save
      </button>
      <button
        slot="start"
        style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
      >
        Edit
      </button>
      <span
        style="font-size: var(--hx-text-sm, 0.875rem); color: var(--hx-color-neutral-500, #6b7280);"
        >Patient Record</span
      >
      <button
        slot="end"
        style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
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
    const canvas = within(canvasElement);
    const el = canvasElement.querySelector('hx-action-bar');
    await expect(el).toBeTruthy();

    const base = el?.shadowRoot?.querySelector('[part="base"]');
    await expect(base).toBeTruthy();
    await expect(base?.getAttribute('role')).toBe('toolbar');

    // Verify aria-label is applied to the inner toolbar element
    await expect(base?.getAttribute('aria-label')).toBe('Toolbar');

    // Verify slotted buttons are present
    const buttons = canvas.getAllByRole('button');
    await expect(buttons.length).toBeGreaterThan(0);
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
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          New
        </button>
        <button
          slot="start"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Import
        </button>
        <button
          slot="end"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
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
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Filter
        </button>
        <button
          slot="start"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Sort
        </button>
        <span
          style="font-size: var(--hx-text-sm, 0.875rem); color: var(--hx-color-neutral-500, #6b7280);"
          >24 results</span
        >
        <button
          slot="end"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
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
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Save
        </button>
        <button
          slot="start"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Save &amp; Close
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
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Cancel
        </button>
        <button
          slot="end"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
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
  args: { position: 'sticky', variant: 'filled' },
  render: (args) => html`
    <div
      style="height: 200px; overflow-y: auto; border: 1px solid var(--hx-color-neutral-200, #e5e7eb); border-radius: 0.5rem;"
    >
      <hx-action-bar position=${args.position} variant=${args.variant} aria-label="Toolbar">
        <button
          slot="start"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Action
        </button>
      </hx-action-bar>
      <div
        style="padding: 1rem; height: 400px; background: linear-gradient(to bottom, var(--hx-color-neutral-50, #f9fafb), var(--hx-color-neutral-100, #e5e7eb));"
      >
        <p
          style="color: var(--hx-color-neutral-500, #6b7280); font-size: var(--hx-text-sm, 0.875rem);"
        >
          Scroll down to see the sticky action bar.
        </p>
        <p
          style="color: var(--hx-color-neutral-400, #9ca3af); font-size: var(--hx-text-sm, 0.875rem); margin-top: 1rem;"
        >
          Tip: add <code>scroll-padding-top</code> equal to the bar height on the scroll container
          so anchor targets are not hidden behind the bar.
        </p>
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
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3-5, 0.875rem); background: var(--hx-color-primary-600, #2563eb); color: var(--hx-color-neutral-0, #fff); border: none; border-radius: var(--hx-border-radius-md, 0.375rem); cursor: pointer; font-size: var(--hx-text-sm, 0.875rem);"
        >
          Save Changes
        </button>
        <button
          slot="start"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3-5, 0.875rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer; font-size: var(--hx-text-sm, 0.875rem);"
        >
          Print
        </button>
        <button
          slot="start"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3-5, 0.875rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer; font-size: var(--hx-text-sm, 0.875rem);"
        >
          Share
        </button>
        <span
          style="font-size: var(--hx-text-sm, 0.875rem); color: var(--hx-color-neutral-700, #374151); font-weight: var(--hx-font-weight-medium, 500);"
        >
          Jane Doe — MRN 12345678
        </span>
        <button
          slot="end"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3-5, 0.875rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-danger-200, #fca5a5); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-danger-50, #fef2f2); color: var(--hx-color-danger-600, #dc2626); cursor: pointer; font-size: var(--hx-text-sm, 0.875rem);"
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
      <p
        style="font-size: var(--hx-text-sm, 0.875rem); color: var(--hx-color-neutral-500, #6b7280); margin-bottom: 0.5rem;"
      >
        Focus any button, then use Arrow Left/Right to navigate. Home moves to first, End to last.
      </p>
      <hx-action-bar aria-label="Navigable toolbar" variant="outlined">
        <button
          slot="start"
          id="kb-btn-bold"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Bold
        </button>
        <button
          slot="start"
          id="kb-btn-italic"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Italic
        </button>
        <button
          slot="start"
          id="kb-btn-underline"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Underline
        </button>
        <button
          slot="end"
          id="kb-btn-clear"
          style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
        >
          Clear
        </button>
      </hx-action-bar>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvasElement.querySelector('hx-action-bar');
    await expect(el).toBeTruthy();

    const base = el?.shadowRoot?.querySelector('[part="base"]');
    await expect(base?.getAttribute('role')).toBe('toolbar');

    const bold = canvas.getByText('Bold');
    const italic = canvas.getByText('Italic');
    const underline = canvas.getByText('Underline');
    const clear = canvas.getByText('Clear');

    // Focus the first button via click
    await userEvent.click(bold);
    await expect(document.activeElement).toBe(bold);

    // ArrowRight moves to next
    await userEvent.keyboard('{ArrowRight}');
    await expect(document.activeElement).toBe(italic);

    // ArrowRight moves to next
    await userEvent.keyboard('{ArrowRight}');
    await expect(document.activeElement).toBe(underline);

    // End moves to last item
    await userEvent.keyboard('{End}');
    await expect(document.activeElement).toBe(clear);

    // Home moves to first item
    await userEvent.keyboard('{Home}');
    await expect(document.activeElement).toBe(bold);

    // ArrowLeft wraps from first to last
    await userEvent.keyboard('{ArrowLeft}');
    await expect(document.activeElement).toBe(clear);
  },
};
