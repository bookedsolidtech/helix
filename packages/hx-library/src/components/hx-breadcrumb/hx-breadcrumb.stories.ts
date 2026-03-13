import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-breadcrumb.js';
import './hx-breadcrumb-item.js';
import { HelixBreadcrumbItem } from './hx-breadcrumb-item.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Breadcrumb',
  component: 'hx-breadcrumb',
  subcomponents: { 'hx-breadcrumb-item': HelixBreadcrumbItem },
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
    maxItems: {
      control: { type: 'number', min: 0 },
      description:
        'Maximum number of items to show before collapsing middle items with an ellipsis. Set to 0 (default) to show all items. The ellipsis renders a keyboard-accessible button to expand the full path.',
      table: {
        category: 'Properties',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    jsonLd: {
      control: 'boolean',
      description:
        'When true, injects a JSON-LD BreadcrumbList structured data script into document.head. Not recommended for Drupal — use the Twig template instead (see component documentation).',
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
          'Hierarchical navigation breadcrumb showing the current page location within the site structure. Accepts `hx-breadcrumb-item` children. The last item (or any item with an explicit `current` attribute) automatically becomes the current page — rendered as static text with `aria-current="page"` on the inner element.',
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
 * text with no link and `aria-current="page"` on the inner span.
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
 * Use the `separator` named slot to provide a custom separator element.
 * The text content of the slotted element overrides the `separator` property.
 * The slotted element is visually hidden — only its text content is read.
 */
export const SeparatorSlot: Story = {
  args: {
    label: 'Breadcrumb',
  },
  render: (args) => html`
    <hx-breadcrumb label=${args.label}>
      <span slot="separator">›</span>
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
 * Use `max-items` to collapse a long path. Middle items are hidden and
 * replaced with an ellipsis button. Activating the button (click, Enter, or
 * Space) expands the full breadcrumb — keyboard users retain full access.
 */
export const Collapsed: Story = {
  args: {
    separator: '/',
    label: 'Breadcrumb',
    maxItems: 3,
  },
  render: (args) => html`
    <hx-breadcrumb separator=${args.separator} label=${args.label} max-items=${args.maxItems}>
      <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department/division">Division</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department/division/patient">Patient</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department/division/patient/visit">Visit</hx-breadcrumb-item>
      <hx-breadcrumb-item>Lab Results</hx-breadcrumb-item>
    </hx-breadcrumb>
  `,
};

/**
 * Breadcrumb items support arbitrary slot content, including SVG icons.
 * Icons render inside the link or text wrapper and inherit the item's color.
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
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="vertical-align: middle; margin-right: 0.25rem;"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        Home
      </hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
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
        --hx-breadcrumb-link-color: var(--hx-color-secondary-600);
        --hx-breadcrumb-link-hover-color: var(--hx-color-secondary-700);
        --hx-breadcrumb-text-color: var(--hx-color-neutral-800);
        --hx-breadcrumb-separator-color: var(--hx-color-neutral-300);
        --hx-breadcrumb-font-size: var(--hx-font-size-md);
      "
    >
      <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
      <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
      <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
    </hx-breadcrumb>
  `,
};
