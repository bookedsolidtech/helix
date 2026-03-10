import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
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
      options: ['default', 'primary', 'success', 'warning', 'danger'],
      description: 'Visual style variant that determines the tag color scheme.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'primary' | 'success' | 'warning' | 'danger'" },
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
    pill: {
      control: 'boolean',
      description: 'Applies fully rounded (pill) border-radius styling.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    removable: {
      control: 'boolean',
      description: 'Renders a dismiss button. Fires hx-remove when clicked.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables interactions on the tag.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    variant: 'default',
    size: 'md',
    pill: false,
    removable: false,
    disabled: false,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <hx-tag
      variant=${args.variant}
      hx-size=${args.size}
      ?pill=${args.pill}
      ?removable=${args.removable}
      ?disabled=${args.disabled}
    >
      Healthcare
    </hx-tag>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag variant="default">Default</hx-tag>
      <hx-tag variant="primary">Primary</hx-tag>
      <hx-tag variant="success">Success</hx-tag>
      <hx-tag variant="warning">Warning</hx-tag>
      <hx-tag variant="danger">Danger</hx-tag>
    </div>
  `,
};

export const AllSizes: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;align-items:center;">
      <hx-tag hx-size="sm">Small</hx-tag>
      <hx-tag hx-size="md">Medium</hx-tag>
      <hx-tag hx-size="lg">Large</hx-tag>
    </div>
  `,
};

export const Pill: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag pill variant="default">Default</hx-tag>
      <hx-tag pill variant="primary">Primary</hx-tag>
      <hx-tag pill variant="success">Success</hx-tag>
      <hx-tag pill variant="warning">Warning</hx-tag>
      <hx-tag pill variant="danger">Danger</hx-tag>
    </div>
  `,
};

export const Removable: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag removable variant="default">Default</hx-tag>
      <hx-tag removable variant="primary">Primary</hx-tag>
      <hx-tag removable variant="success">Success</hx-tag>
      <hx-tag removable variant="warning">Warning</hx-tag>
      <hx-tag removable variant="danger">Danger</hx-tag>
    </div>
  `,
};

export const Disabled: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag disabled>Disabled</hx-tag>
      <hx-tag disabled removable>Disabled Removable</hx-tag>
      <hx-tag disabled variant="primary">Disabled Primary</hx-tag>
    </div>
  `,
};

export const WithPrefix: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag variant="primary">
        <span slot="prefix">★</span>
        Featured
      </hx-tag>
      <hx-tag variant="success" removable>
        <span slot="prefix">✓</span>
        Verified
      </hx-tag>
    </div>
  `,
};

export const WithSuffix: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag variant="default">
        Category
        <span slot="suffix">42</span>
      </hx-tag>
    </div>
  `,
};

export const RemovableInteractive: Story = {
  render: () => html`
    <div
      style="display:flex;gap:0.5rem;flex-wrap:wrap;"
      @hx-remove=${(e: Event) => (e.target as HTMLElement).remove()}
    >
      <hx-tag removable>Healthcare</hx-tag>
      <hx-tag removable>Cardiology</hx-tag>
      <hx-tag removable>Oncology</hx-tag>
      <hx-tag removable>Neurology</hx-tag>
    </div>
  `,
};
