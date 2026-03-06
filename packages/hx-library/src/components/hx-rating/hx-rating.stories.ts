import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, fn } from 'storybook/test';
import './hx-rating.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Rating',
  component: 'hx-rating',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 5, step: 0.5 },
      description: 'The current rating value (0 to max).',
      table: {
        category: 'Value',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    max: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'The maximum number of stars.',
      table: {
        category: 'Value',
        defaultValue: { summary: '5' },
        type: { summary: 'number' },
      },
    },
    precision: {
      control: { type: 'select' },
      options: [0.5, 1],
      description: 'Minimum selectable increment. Use 0.5 for half-star ratings.',
      table: {
        category: 'Value',
        defaultValue: { summary: '1' },
        type: { summary: "'0.5' | '1'" },
      },
    },
    readonly: {
      control: 'boolean',
      description: 'When true, the rating is display-only.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'When true, the rating cannot be interacted with.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible label for the rating group.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'Rating' },
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description: 'The name submitted with the form.',
      table: {
        category: 'Form',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    value: 0,
    max: 5,
    precision: 1,
    readonly: false,
    disabled: false,
    label: 'Product rating',
    name: 'rating',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <hx-rating
      value="${args.value}"
      max="${args.max}"
      precision="${args.precision}"
      ?readonly="${args.readonly}"
      ?disabled="${args.disabled}"
      label="${args.label}"
      name="${args.name}"
    ></hx-rating>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rating = canvas.getByShadowRole?.('radiogroup') ?? canvasElement.querySelector('hx-rating');
    expect(rating).toBeTruthy();
  },
};

export const WithValue: Story = {
  args: {
    value: 3,
  },
  render: (args) => html`
    <hx-rating
      value="${args.value}"
      max="${args.max}"
      label="${args.label}"
    ></hx-rating>
  `,
};

export const Readonly: Story = {
  args: {
    value: 4,
    readonly: true,
  },
  render: (args) => html`
    <hx-rating
      value="${args.value}"
      max="${args.max}"
      ?readonly="${args.readonly}"
      label="${args.label}"
    ></hx-rating>
  `,
};

export const HalfStar: Story = {
  args: {
    value: 3.5,
    precision: 0.5,
  },
  render: (args) => html`
    <hx-rating
      value="${args.value}"
      max="${args.max}"
      precision="${args.precision}"
      label="${args.label}"
    ></hx-rating>
  `,
};

export const HalfStarReadonly: Story = {
  args: {
    value: 2.5,
    precision: 0.5,
    readonly: true,
  },
  render: (args) => html`
    <hx-rating
      value="${args.value}"
      max="${args.max}"
      precision="${args.precision}"
      ?readonly="${args.readonly}"
      label="${args.label}"
    ></hx-rating>
  `,
};

export const Disabled: Story = {
  args: {
    value: 2,
    disabled: true,
  },
  render: (args) => html`
    <hx-rating
      value="${args.value}"
      max="${args.max}"
      ?disabled="${args.disabled}"
      label="${args.label}"
    ></hx-rating>
  `,
};

export const MaxTen: Story = {
  args: {
    value: 7,
    max: 10,
  },
  render: (args) => html`
    <hx-rating
      value="${args.value}"
      max="${args.max}"
      label="${args.label}"
    ></hx-rating>
  `,
};

export const FormParticipation: Story = {
  render: () => html`
    <form
      id="rating-form"
      @submit="${(e: Event) => {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        alert('Rating submitted: ' + data.get('product-rating'));
      }}"
    >
      <hx-rating
        name="product-rating"
        value="0"
        label="Rate this product"
      ></hx-rating>
      <button type="submit" style="margin-left: 1rem;">Submit</button>
    </form>
  `,
};

export const InteractiveEvents: Story = {
  render: () => {
    const onChange = fn();
    const onHover = fn();

    return html`
      <div>
        <hx-rating
          label="Rating with events"
          @hx-change="${(e: CustomEvent) => onChange(e.detail)}"
          @hx-hover="${(e: CustomEvent) => onHover(e.detail)}"
        ></hx-rating>
        <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;">
          Check the Actions panel for event logs.
        </p>
      </div>
    `;
  },
};
