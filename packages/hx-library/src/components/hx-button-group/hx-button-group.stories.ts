import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import './hx-button-group.js';
import '../hx-button/hx-button.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/ButtonGroup',
  component: 'hx-button-group',
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Layout orientation of the button group.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'horizontal' },
        type: { summary: "'horizontal' | 'vertical'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Size cascaded to child buttons via --hx-button-group-size. Controls padding, font-size, and min-height of children.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
  },
  args: {
    orientation: 'horizontal',
    size: 'md',
  },
  render: (args) => html`
    <hx-button-group orientation=${args.orientation} hx-size=${args.size}>
      <hx-button variant="secondary">Save</hx-button>
      <hx-button variant="secondary">Cancel</hx-button>
      <hx-button variant="secondary">Reset</hx-button>
    </hx-button-group>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Verifies group renders and contains buttons
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    orientation: 'horizontal',
    size: 'md',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const group = canvasElement.querySelector('hx-button-group');
    await expect(group).toBeTruthy();

    const buttons = canvasElement.querySelectorAll('hx-button');
    await expect(buttons.length).toBe(3);

    const groupDiv = group?.shadowRoot?.querySelector('[part="group"]');
    await expect(groupDiv).toBeTruthy();
    await expect(groupDiv?.hasAttribute('role')).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 2. ORIENTATION STORIES
// ─────────────────────────────────────────────────

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: () => html`
    <hx-button-group orientation="horizontal">
      <hx-button variant="secondary">Previous</hx-button>
      <hx-button variant="secondary">Current</hx-button>
      <hx-button variant="secondary">Next</hx-button>
    </hx-button-group>
  `,
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: () => html`
    <hx-button-group orientation="vertical">
      <hx-button variant="secondary">Top Action</hx-button>
      <hx-button variant="secondary">Middle Action</hx-button>
      <hx-button variant="secondary">Bottom Action</hx-button>
    </hx-button-group>
  `,
};

// ─────────────────────────────────────────────────
// 3. SIZE STORIES — Child buttons do NOT set hx-size
//    explicitly, demonstrating the cascade mechanism
//    via --hx-button-group-size CSS custom property.
// ─────────────────────────────────────────────────

export const SmallSize: Story = {
  args: {
    size: 'sm',
  },
  render: () => html`
    <hx-button-group hx-size="sm">
      <hx-button variant="secondary">Edit</hx-button>
      <hx-button variant="secondary">Copy</hx-button>
      <hx-button variant="secondary">Delete</hx-button>
    </hx-button-group>
  `,
};

export const MediumSize: Story = {
  args: {
    size: 'md',
  },
  render: () => html`
    <hx-button-group hx-size="md">
      <hx-button variant="secondary">Edit</hx-button>
      <hx-button variant="secondary">Copy</hx-button>
      <hx-button variant="secondary">Delete</hx-button>
    </hx-button-group>
  `,
};

export const LargeSize: Story = {
  args: {
    size: 'lg',
  },
  render: () => html`
    <hx-button-group hx-size="lg">
      <hx-button variant="secondary">Edit</hx-button>
      <hx-button variant="secondary">Copy</hx-button>
      <hx-button variant="secondary">Delete</hx-button>
    </hx-button-group>
  `,
};

// ─────────────────────────────────────────────────
// 4. MIXED VARIANTS
// ─────────────────────────────────────────────────

export const MixedVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          Primary + Secondary + Ghost
        </p>
        <hx-button-group>
          <hx-button variant="primary">Confirm</hx-button>
          <hx-button variant="secondary">Review</hx-button>
          <hx-button variant="ghost">Dismiss</hx-button>
        </hx-button-group>
      </div>
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          All Secondary (recommended for grouped actions)
        </p>
        <hx-button-group>
          <hx-button variant="secondary">Day</hx-button>
          <hx-button variant="secondary">Week</hx-button>
          <hx-button variant="secondary">Month</hx-button>
        </hx-button-group>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const groups = canvasElement.querySelectorAll('hx-button-group');
    await expect(groups.length).toBe(2);

    const firstGroupButtons = groups[0].querySelectorAll('hx-button');
    await expect(firstGroupButtons.length).toBe(3);
    await expect(firstGroupButtons[0].getAttribute('variant')).toBe('primary');
    await expect(firstGroupButtons[1].getAttribute('variant')).toBe('secondary');
    await expect(firstGroupButtons[2].getAttribute('variant')).toBe('ghost');
  },
};

// ─────────────────────────────────────────────────
// 5. DISABLED CHILDREN — Mixed disabled states
// ─────────────────────────────────────────────────

export const DisabledChildren: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          One disabled button in the group
        </p>
        <hx-button-group aria-label="Actions with disabled">
          <hx-button variant="secondary">Edit</hx-button>
          <hx-button variant="secondary" disabled>Copy</hx-button>
          <hx-button variant="secondary">Delete</hx-button>
        </hx-button-group>
      </div>
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          All disabled buttons
        </p>
        <hx-button-group aria-label="All disabled actions">
          <hx-button variant="secondary" disabled>Edit</hx-button>
          <hx-button variant="secondary" disabled>Copy</hx-button>
          <hx-button variant="secondary" disabled>Delete</hx-button>
        </hx-button-group>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const groups = canvasElement.querySelectorAll('hx-button-group');
    await expect(groups.length).toBe(2);

    const firstGroupButtons = groups[0].querySelectorAll('hx-button');
    await expect(firstGroupButtons[1].hasAttribute('disabled')).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 6. ACCESSIBILITY — Dedicated aria-label demo
// ─────────────────────────────────────────────────

export const AccessibilityLabel: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          Always provide <code>aria-label</code> for screen reader context:
        </p>
        <hx-button-group aria-label="Text formatting">
          <hx-button variant="secondary">Bold</hx-button>
          <hx-button variant="secondary">Italic</hx-button>
          <hx-button variant="secondary">Underline</hx-button>
        </hx-button-group>
      </div>
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          Or use the <code>label</code> property (sets via ElementInternals):
        </p>
        <hx-button-group label="Record actions">
          <hx-button variant="primary">Save</hx-button>
          <hx-button variant="secondary">Cancel</hx-button>
        </hx-button-group>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const groups = canvasElement.querySelectorAll('hx-button-group');
    await expect(groups.length).toBe(2);
    await expect(groups[0].getAttribute('aria-label')).toBe('Text formatting');
    await expect(groups[1].getAttribute('label')).toBe('Record actions');
  },
};

// ─────────────────────────────────────────────────
// 7. DRUPAL USAGE — Twig/CMS pattern with Save/Cancel/Reset
// ─────────────────────────────────────────────────

export const DrupalUsage: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 600px;">
      <div>
        <p
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          Typical Drupal form action buttons rendered via Twig:
        </p>
        <pre
          style="margin: 0 0 1rem; padding: 1rem; background: var(--hx-color-neutral-100, #f3f4f6); border-radius: var(--hx-border-radius-md, 0.375rem); font-size: 0.75rem; white-space: pre-wrap; overflow-x: auto;"
        ><code>{# button-group.html.twig #}
&lt;hx-button-group orientation="horizontal" hx-size="md"&gt;
  &lt;hx-button variant="primary" type="submit"&gt;{{ 'Save'|t }}&lt;/hx-button&gt;
  &lt;hx-button variant="secondary" type="button"&gt;{{ 'Cancel'|t }}&lt;/hx-button&gt;
  &lt;hx-button variant="ghost" type="reset"&gt;{{ 'Reset'|t }}&lt;/hx-button&gt;
&lt;/hx-button-group&gt;</code></pre>
        <hx-button-group orientation="horizontal" hx-size="md">
          <hx-button variant="primary" type="submit">Save</hx-button>
          <hx-button variant="secondary" type="button">Cancel</hx-button>
          <hx-button variant="ghost" type="reset">Reset</hx-button>
        </hx-button-group>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. PATIENT RECORD — Healthcare scenario
// ─────────────────────────────────────────────────

export const PatientRecord: Story = {
  render: () => html`
    <div
      style="max-width: 640px; border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #e5e7eb); border-radius: var(--hx-border-radius-lg, 0.5rem); overflow: hidden;"
    >
      <div
        style="padding: 1.25rem 1.5rem; border-bottom: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #e5e7eb); background: var(--hx-color-neutral-50, #f9fafb);"
      >
        <h3
          style="margin: 0 0 0.25rem; font-size: 1rem; font-weight: var(--hx-font-weight-semibold, 600); color: var(--hx-color-neutral-900, #111827);"
        >
          Patient Record — Jane Doe (MRN: 00482917)
        </h3>
        <p style="margin: 0; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6b7280);">
          Last updated: 2026-03-03 at 09:14 AM by Dr. R. Patel
        </p>
      </div>

      <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
        <p style="margin: 0; font-size: 0.875rem; color: var(--hx-color-neutral-700, #374151);">
          Admission diagnosis: Acute exacerbation of chronic obstructive pulmonary disease (COPD).
          Oxygen saturation 92% on room air. Patient stable, scheduled for pulmonology consult.
        </p>

        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <hx-button-group aria-label="Chart view controls">
              <hx-button variant="secondary" hx-size="sm">Summary</hx-button>
              <hx-button variant="secondary" hx-size="sm">Labs</hx-button>
              <hx-button variant="secondary" hx-size="sm">Imaging</hx-button>
              <hx-button variant="secondary" hx-size="sm">Notes</hx-button>
            </hx-button-group>
          </div>

          <hx-button-group aria-label="Record actions">
            <hx-button variant="primary" hx-size="sm" type="submit">Save</hx-button>
            <hx-button variant="secondary" hx-size="sm">Print</hx-button>
            <hx-button variant="ghost" hx-size="sm">Discard</hx-button>
          </hx-button-group>
        </div>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const groups = canvasElement.querySelectorAll('hx-button-group');
    await expect(groups.length).toBe(2);

    for (const group of groups) {
      const groupDiv = group.shadowRoot?.querySelector('[part="group"]');
      await expect(groupDiv).toBeTruthy();
      await expect(groupDiv?.hasAttribute('role')).toBe(false);
    }
  },
};

// ─────────────────────────────────────────────────
// 9. ALL SIZES — Reference grid
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
        <span
          style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280); min-width: 3rem;"
          >sm</span
        >
        <hx-button-group hx-size="sm">
          <hx-button variant="secondary">Edit</hx-button>
          <hx-button variant="secondary">Copy</hx-button>
          <hx-button variant="secondary">Archive</hx-button>
        </hx-button-group>
      </div>
      <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
        <span
          style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280); min-width: 3rem;"
          >md</span
        >
        <hx-button-group hx-size="md">
          <hx-button variant="secondary">Edit</hx-button>
          <hx-button variant="secondary">Copy</hx-button>
          <hx-button variant="secondary">Archive</hx-button>
        </hx-button-group>
      </div>
      <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
        <span
          style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280); min-width: 3rem;"
          >lg</span
        >
        <hx-button-group hx-size="lg">
          <hx-button variant="secondary">Edit</hx-button>
          <hx-button variant="secondary">Copy</hx-button>
          <hx-button variant="secondary">Archive</hx-button>
        </hx-button-group>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. BOTH ORIENTATIONS — Side by side
// ─────────────────────────────────────────────────

export const BothOrientations: Story = {
  render: () => html`
    <div style="display: flex; gap: 3rem; align-items: flex-start; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <p
          style="margin: 0; font-size: 0.875rem; font-weight: var(--hx-font-weight-semibold, 600);"
        >
          Horizontal
        </p>
        <hx-button-group orientation="horizontal">
          <hx-button variant="secondary">Bold</hx-button>
          <hx-button variant="secondary">Italic</hx-button>
          <hx-button variant="secondary">Underline</hx-button>
        </hx-button-group>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <p
          style="margin: 0; font-size: 0.875rem; font-weight: var(--hx-font-weight-semibold, 600);"
        >
          Vertical
        </p>
        <hx-button-group orientation="vertical">
          <hx-button variant="secondary">Bold</hx-button>
          <hx-button variant="secondary">Italic</hx-button>
          <hx-button variant="secondary">Underline</hx-button>
        </hx-button-group>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 11. TWO BUTTONS — Edge case: only first/last, no middle
// ─────────────────────────────────────────────────

export const TwoButtons: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <hx-button-group orientation="horizontal">
        <hx-button variant="secondary">Yes</hx-button>
        <hx-button variant="secondary">No</hx-button>
      </hx-button-group>
      <hx-button-group orientation="vertical">
        <hx-button variant="secondary">Accept</hx-button>
        <hx-button variant="secondary">Decline</hx-button>
      </hx-button-group>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 12. SINGLE BUTTON — Edge case: single child, full border-radius
// ─────────────────────────────────────────────────

export const SingleButton: Story = {
  render: () => html`
    <hx-button-group>
      <hx-button variant="secondary">Solo Action</hx-button>
    </hx-button-group>
  `,
};
