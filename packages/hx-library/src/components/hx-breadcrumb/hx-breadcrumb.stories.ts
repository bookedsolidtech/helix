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
    'max-items': {
      control: 'number',
      description:
        'Maximum number of items to show before collapsing middle items with an ellipsis. Set to 0 to show all items.',
      table: {
        category: 'Properties',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    'json-ld': {
      control: 'boolean',
      description:
        'When true, injects a JSON-LD BreadcrumbList structured data script into the document head.',
      table: {
        category: 'Properties',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
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

/**
 * When `max-items` is set and the item count exceeds it, middle items
 * collapse behind an interactive ellipsis button. Click or press
 * Enter/Space to expand the full path.
 */
export const Collapsed: Story = {
  args: {
    separator: '/',
    label: 'Breadcrumb',
  },
  render: (args) => html`
    <hx-breadcrumb separator=${args.separator} label=${args.label} max-items="2">
      <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/division">Division</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/patient">Patient</hx-breadcrumb-item>
      <hx-breadcrumb-item>Lab Results</hx-breadcrumb-item>
    </hx-breadcrumb>
  `,
};

/**
 * Breadcrumb items accept any slotted content, including icons.
 * Use inline SVG or an icon component alongside text.
 */
export const WithIcons: Story = {
  args: {
    separator: '/',
    label: 'Breadcrumb',
  },
  render: (args) => html`
    <hx-breadcrumb separator=${args.separator} label=${args.label}>
      <hx-breadcrumb-item href="/home">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style="vertical-align: text-bottom; margin-inline-end: 4px;"
          aria-hidden="true"
        >
          <path d="M8 1.5l-5.5 5v7a.5.5 0 00.5.5h3.5v-4h3v4H13a.5.5 0 00.5-.5v-7L8 1.5z" />
        </svg>
        Home
      </hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
    </hx-breadcrumb>
  `,
};

/**
 * The named `separator` slot overrides the `separator` property, allowing
 * custom separator elements (icons, styled spans, etc.).
 */
export const SeparatorSlot: Story = {
  args: {
    label: 'Breadcrumb',
  },
  render: (args) => html`
    <hx-breadcrumb label=${args.label}>
      <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
      <span slot="separator">&rsaquo;</span>
    </hx-breadcrumb>
  `,
};
