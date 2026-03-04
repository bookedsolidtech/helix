import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, fn, userEvent, within } from 'storybook/test';
import './hx-tag.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Tag',
  component: 'hx-tag',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'neutral', 'outline'],
      description: 'Visual style variant that determines the tag color scheme.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'neutral' },
        type: { summary: "'primary' | 'secondary' | 'neutral' | 'outline'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Controls the font size and padding of the tag.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    removable: {
      control: 'boolean',
      description: 'When true, displays a remove button to allow the user to dismiss the tag.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'When true, prevents all user interaction with the tag.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    selected: {
      control: 'boolean',
      description:
        'When true, the tag is in an active/selected state. Used for filter toggle patterns.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'Tag label text passed via the default slot.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'neutral',
    size: 'md',
    removable: false,
    disabled: false,
    selected: false,
    label: 'Diagnosis',
  },
  render: (args) => html`
    <hx-tag
      variant=${args.variant}
      hx-size=${args.size}
      ?removable=${args.removable}
      ?disabled=${args.disabled}
      ?selected=${args.selected}
    >
      ${args.label}
    </hx-tag>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ════════════════════════════════════════════════════════════════════════════
// 1. DEFAULT
// ════════════════════════════════════════════════════════════════════════════

/** Standard tag in its default neutral state. Suitable for categories, filters, and labels. */
export const Default: Story = {
  args: {
    variant: 'neutral',
    label: 'Diagnosis',
  },
  play: async ({ canvasElement }) => {
    const tag = canvasElement.querySelector('hx-tag');
    await expect(tag).toBeTruthy();

    const shadowSpan = tag?.shadowRoot?.querySelector('span');
    await expect(shadowSpan).toBeTruthy();
    await expect(shadowSpan?.classList.contains('tag')).toBe(true);
    await expect(shadowSpan?.classList.contains('tag--neutral')).toBe(true);
    await expect(shadowSpan?.classList.contains('tag--md')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. ALL VARIANTS
// ════════════════════════════════════════════════════════════════════════════

/** All four tag variants displayed side by side for visual comparison. */
export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
      <hx-tag variant="primary">Primary</hx-tag>
      <hx-tag variant="secondary">Secondary</hx-tag>
      <hx-tag variant="neutral">Neutral</hx-tag>
      <hx-tag variant="outline">Outline</hx-tag>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tags = canvasElement.querySelectorAll('hx-tag');
    await expect(tags.length).toBe(4);

    const variants = ['primary', 'secondary', 'neutral', 'outline'];
    for (const [index, tag] of Array.from(tags).entries()) {
      const span = tag.shadowRoot?.querySelector('span');
      await expect(span?.classList.contains(`tag--${variants[index]}`)).toBe(true);
    }
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. REMOVABLE
// ════════════════════════════════════════════════════════════════════════════

/** A removable tag that displays a dismiss button. Fires hx-remove when clicked. */
export const Removable: Story = {
  args: {
    removable: true,
    label: 'Cardiology',
  },
  play: async ({ canvasElement }) => {
    const tag = canvasElement.querySelector('hx-tag');
    await expect(tag).toBeTruthy();

    const removeButton = tag?.shadowRoot?.querySelector('button[part="remove-button"]');
    await expect(removeButton).toBeTruthy();
    await expect(removeButton?.getAttribute('aria-label')).toBe('Remove');
    await expect(removeButton?.getAttribute('type')).toBe('button');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 4. SELECTED
// ════════════════════════════════════════════════════════════════════════════

/** A tag in the selected/active state, used for active filter indicators. */
export const Selected: Story = {
  args: {
    selected: true,
    label: 'Oncology',
  },
  play: async ({ canvasElement }) => {
    const tag = canvasElement.querySelector('hx-tag');
    await expect(tag).toBeTruthy();

    const span = tag?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('tag--selected')).toBe(true);
    await expect(span?.getAttribute('aria-pressed')).toBe('true');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5. WITH PREFIX
// ════════════════════════════════════════════════════════════════════════════

/** A tag with an icon in the prefix slot, demonstrating slot-based content composition. */
export const WithPrefix: Story = {
  render: () => html`
    <hx-tag variant="primary">
      <svg
        slot="prefix"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        ></path>
      </svg>
      Cardiology
    </hx-tag>
  `,
  play: async ({ canvasElement }) => {
    const tag = canvasElement.querySelector('hx-tag');
    await expect(tag).toBeTruthy();

    const svgEl = tag?.querySelector('svg[slot="prefix"]');
    await expect(svgEl).toBeTruthy();
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 6. SIZES
// ════════════════════════════════════════════════════════════════════════════

/** All three size variants displayed side by side. */
export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <hx-tag hx-size="sm">Small</hx-tag>
      <hx-tag hx-size="md">Medium</hx-tag>
      <hx-tag hx-size="lg">Large</hx-tag>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tags = canvasElement.querySelectorAll('hx-tag');
    await expect(tags.length).toBe(3);

    const sizes = ['sm', 'md', 'lg'];
    for (const [index, tag] of Array.from(tags).entries()) {
      const span = tag.shadowRoot?.querySelector('span');
      await expect(span?.classList.contains(`tag--${sizes[index]}`)).toBe(true);
    }
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 7. DISABLED
// ════════════════════════════════════════════════════════════════════════════

/** A disabled tag that cannot be interacted with. Removable button is also disabled. */
export const Disabled: Story = {
  args: {
    disabled: true,
    removable: true,
    label: 'Restricted',
  },
  play: async ({ canvasElement }) => {
    const tag = canvasElement.querySelector('hx-tag');
    await expect(tag).toBeTruthy();
    await expect(tag?.hasAttribute('disabled')).toBe(true);

    const span = tag?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('tag--disabled')).toBe(true);
    await expect(span?.getAttribute('aria-disabled')).toBe('true');

    const removeButton = tag?.shadowRoot?.querySelector('button[part="remove-button"]');
    await expect(removeButton?.hasAttribute('disabled')).toBe(true);
    await expect(removeButton?.getAttribute('aria-disabled')).toBe('true');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 8. FILTER TAG GROUP
// ════════════════════════════════════════════════════════════════════════════

/**
 * Multiple tags used together as a filter group. Demonstrates the toggle behavior
 * where clicking a tag selects or deselects it as an active filter.
 */
export const FilterTagGroup: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280; font-family: sans-serif;">
        Active filters (click to toggle):
      </p>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <hx-tag variant="primary" selected>Cardiology</hx-tag>
        <hx-tag variant="primary" selected>Oncology</hx-tag>
        <hx-tag variant="neutral">Neurology</hx-tag>
        <hx-tag variant="neutral">Pediatrics</hx-tag>
        <hx-tag variant="neutral">Radiology</hx-tag>
      </div>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280; font-family: sans-serif;">
        Removable filters:
      </p>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <hx-tag variant="primary" removable>Cardiology</hx-tag>
        <hx-tag variant="primary" removable>Oncology</hx-tag>
        <hx-tag variant="neutral" removable>Neurology</hx-tag>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tags = canvasElement.querySelectorAll('hx-tag');
    await expect(tags.length).toBe(8);

    const selectedTags = canvasElement.querySelectorAll('hx-tag[selected]');
    await expect(selectedTags.length).toBe(2);

    const removableTags = canvasElement.querySelectorAll('hx-tag[removable]');
    await expect(removableTags.length).toBe(3);
  },
};
