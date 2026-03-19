import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-counter.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Counter',
  component: 'hx-counter',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number' },
      description: 'The target numeric value to count to.',
      table: {
        category: 'Content',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    duration: {
      control: { type: 'number', min: 100, max: 5000, step: 100 },
      description: 'Animation duration in milliseconds.',
      table: {
        category: 'Animation',
        defaultValue: { summary: '1000' },
        type: { summary: 'number' },
      },
    },
    easing: {
      control: { type: 'select' },
      options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
      description: 'Easing function applied to the animation progress.',
      table: {
        category: 'Animation',
        defaultValue: { summary: 'ease-out' },
        type: { summary: "'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'" },
      },
    },
    format: {
      control: { type: 'select' },
      options: ['integer', 'decimal'],
      description: "Number format. 'integer' rounds; 'decimal' shows two decimal places.",
      table: {
        category: 'Content',
        defaultValue: { summary: 'integer' },
        type: { summary: "'integer' | 'decimal'" },
      },
    },
    prefix: {
      control: 'text',
      description: "String prepended to the formatted value (e.g., '$').",
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    suffix: {
      control: 'text',
      description: "String appended to the formatted value (e.g., '%').",
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
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
    value: 1284,
    duration: 1000,
    easing: 'ease-out',
    format: 'integer',
    prefix: '',
    suffix: '',
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
    <hx-counter
      .value=${args['value']}
      .duration=${args['duration']}
      easing=${args['easing']}
      format=${args['format']}
      prefix=${args['prefix']}
      suffix=${args['suffix']}
      size=${args['size']}
    ></hx-counter>
  `,
};

export const WithPrefix: Story = {
  name: 'With Prefix (Currency)',
  args: {
    value: 48750,
    prefix: '$',
    duration: 1500,
  },
  render: (args) => html`
    <hx-counter
      .value=${args['value']}
      .duration=${args['duration']}
      easing=${args['easing']}
      format=${args['format']}
      prefix=${args['prefix']}
      suffix=${args['suffix']}
      size=${args['size']}
    ></hx-counter>
  `,
};

export const WithSuffix: Story = {
  name: 'With Suffix (Percentage)',
  args: {
    value: 94.5,
    suffix: '%',
    format: 'decimal',
    duration: 1200,
  },
  render: (args) => html`
    <hx-counter
      .value=${args['value']}
      .duration=${args['duration']}
      easing=${args['easing']}
      format=${args['format']}
      prefix=${args['prefix']}
      suffix=${args['suffix']}
      size=${args['size']}
    ></hx-counter>
  `,
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; align-items: flex-start;">
      <hx-counter .value=${128} size="sm"></hx-counter>
      <hx-counter .value=${1284} size="md"></hx-counter>
      <hx-counter .value=${12840} size="lg"></hx-counter>
    </div>
  `,
};

export const EasingVariants: Story = {
  name: 'Easing Variants',
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;">
      <div>
        <p style="font-size: 0.75rem; margin-bottom: 0.5rem; color: #6c757d;">linear</p>
        <hx-counter .value=${1000} easing="linear"></hx-counter>
      </div>
      <div>
        <p style="font-size: 0.75rem; margin-bottom: 0.5rem; color: #6c757d;">ease-in</p>
        <hx-counter .value=${1000} easing="ease-in"></hx-counter>
      </div>
      <div>
        <p style="font-size: 0.75rem; margin-bottom: 0.5rem; color: #6c757d;">ease-out</p>
        <hx-counter .value=${1000} easing="ease-out"></hx-counter>
      </div>
      <div>
        <p style="font-size: 0.75rem; margin-bottom: 0.5rem; color: #6c757d;">ease-in-out</p>
        <hx-counter .value=${1000} easing="ease-in-out"></hx-counter>
      </div>
    </div>
  `,
};

export const HealthcareDashboard: Story = {
  name: 'Healthcare Dashboard',
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <hx-counter .value=${1284} size="lg"></hx-counter>
        <span style="font-size: 0.875rem; color: #6c757d;">Total Patients</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <hx-counter .value=${94.7} format="decimal" suffix="%" size="lg"></hx-counter>
        <span style="font-size: 0.875rem; color: #6c757d;">Satisfaction Rate</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <hx-counter .value=${2480000} prefix="$" size="lg" .duration=${2000}></hx-counter>
        <span style="font-size: 0.875rem; color: #6c757d;">Annual Revenue</span>
      </div>
    </div>
  `,
};
