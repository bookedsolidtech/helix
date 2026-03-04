import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-breadcrumb.js';
import './hx-breadcrumb-item.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Breadcrumb',
  component: 'hx-breadcrumb',
  subcomponents: { 'hx-breadcrumb-item': 'hx-breadcrumb-item' },
  tags: ['autodocs'],
  argTypes: {
    separator: {
      control: 'text',
      description: 'The separator character displayed between breadcrumb items.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'/'" },
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'The accessible aria-label for the nav landmark.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'Breadcrumb'" },
        type: { summary: 'string' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Hierarchical navigation breadcrumb showing the current page location within the site structure. Accepts `hx-breadcrumb-item` children. The last item automatically receives `aria-current="page"` and renders without a link.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

/**
 * The default breadcrumb shows a 3-item navigation path typical in a
 * healthcare application. The last item (current page) renders as static
 * text with no link.
 */
export const Default: Story = {
  args: {
    separator: '/',
    label: 'Breadcrumb',
  },
  render: (args) => html`
    <hx-breadcrumb separator=${args.separator} label=${args.label}>
      <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
    </hx-breadcrumb>
  `,
};

/**
 * Use a custom separator character to match your design system. Common
 * choices include `>`, `›`, `→`, or `/`.
 */
export const CustomSeparator: Story = {
  args: {
    separator: '>',
    label: 'Breadcrumb',
  },
  render: (args) => html`
    <hx-breadcrumb separator=${args.separator} label=${args.label}>
      <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
    </hx-breadcrumb>
  `,
};

/**
 * Long breadcrumb paths with five levels are common in enterprise healthcare
 * applications with deep navigation hierarchies.
 */
export const LongPath: Story = {
  args: {
    separator: '/',
    label: 'Breadcrumb',
  },
  render: (args) => html`
    <hx-breadcrumb separator=${args.separator} label=${args.label}>
      <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department/division">Division</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department/division/patient">Patient</hx-breadcrumb-item>
      <hx-breadcrumb-item>Lab Results</hx-breadcrumb-item>
    </hx-breadcrumb>
  `,
};

/**
 * A single breadcrumb item represents the current page with no preceding
 * navigation path. No separator is rendered.
 */
export const SingleItem: Story = {
  args: {
    separator: '/',
    label: 'Breadcrumb',
  },
  render: (args) => html`
    <hx-breadcrumb separator=${args.separator} label=${args.label}>
      <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
    </hx-breadcrumb>
  `,
};

/**
 * CSS custom properties allow full visual customization without modifying
 * component internals. Override token values at the consumer level.
 */
export const WithCustomStyling: Story = {
  args: {
    separator: '/',
    label: 'Breadcrumb',
  },
  render: (args) => html`
    <hx-breadcrumb
      separator=${args.separator}
      label=${args.label}
      style="
        --hx-breadcrumb-link-color: #7c3aed;
        --hx-breadcrumb-link-hover-color: #5b21b6;
        --hx-breadcrumb-text-color: #1f2937;
        --hx-breadcrumb-separator-color: #d1d5db;
        --hx-breadcrumb-font-size: 1rem;
      "
    >
      <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
    </hx-breadcrumb>
  `,
};
