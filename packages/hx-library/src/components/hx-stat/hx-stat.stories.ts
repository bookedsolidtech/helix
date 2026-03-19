import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-stat.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Stat',
  component: 'hx-stat',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The metric label displayed below the value.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The metric value displayed prominently.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    trend: {
      control: { type: 'select' },
      options: ['up', 'down', 'neutral'],
      description: "Trend direction indicator. 'neutral' hides the indicator.",
      table: {
        category: 'Visual',
        defaultValue: { summary: 'neutral' },
        type: { summary: "'up' | 'down' | 'neutral'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant controlling font size.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
  },
  args: {
    label: 'Total Patients',
    value: '1,284',
    trend: 'neutral',
    size: 'md',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <hx-stat
      label=${args['label']}
      value=${args['value']}
      trend=${args['trend']}
      size=${args['size']}
    ></hx-stat>
  `,
};

export const TrendUp: Story = {
  name: 'Trend: Up',
  args: {
    label: 'Appointments Today',
    value: '42',
    trend: 'up',
  },
  render: (args) => html`
    <hx-stat
      label=${args['label']}
      value=${args['value']}
      trend=${args['trend']}
      size=${args['size']}
    ></hx-stat>
  `,
};

export const TrendDown: Story = {
  name: 'Trend: Down',
  args: {
    label: 'Readmissions',
    value: '7',
    trend: 'down',
  },
  render: (args) => html`
    <hx-stat
      label=${args['label']}
      value=${args['value']}
      trend=${args['trend']}
      size=${args['size']}
    ></hx-stat>
  `,
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <hx-stat label="Small" value="128" size="sm" trend="up"></hx-stat>
      <hx-stat label="Medium" value="1,284" size="md" trend="up"></hx-stat>
      <hx-stat label="Large" value="12,840" size="lg" trend="up"></hx-stat>
    </div>
  `,
};

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => html`
    <hx-stat label="Active Providers" value="56" trend="up" size="md">
      <svg
        slot="icon"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </hx-stat>
  `,
};

export const Dashboard: Story = {
  name: 'Dashboard Grid',
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;">
      <hx-stat label="Total Patients" value="1,284" trend="up" size="md"></hx-stat>
      <hx-stat label="Today's Appointments" value="42" trend="neutral" size="md"></hx-stat>
      <hx-stat label="Readmissions (30d)" value="7" trend="down" size="md"></hx-stat>
      <hx-stat label="Avg. Wait Time" value="18 min" trend="up" size="md"></hx-stat>
    </div>
  `,
};

export const DarkMode: Story = {
  decorators: [(story) => html`<hx-theme mode="dark" style="display: block; padding: 1rem;">${story()}</hx-theme>`],
  args: {
    label: 'Appointments Today',
    value: '42',
    trend: 'up',
  },
};
