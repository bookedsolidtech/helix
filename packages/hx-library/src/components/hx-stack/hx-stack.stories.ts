import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-stack.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Stack',
  component: 'hx-stack',
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'Direction of the stack layout.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'vertical' },
        type: { summary: "'vertical' | 'horizontal'" },
      },
    },
    gap: {
      control: { type: 'select' },
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Gap between children using design tokens.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'md' },
        type: { summary: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
      },
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
      description: 'Cross-axis alignment of children.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'stretch' },
        type: { summary: "'start' | 'center' | 'end' | 'stretch' | 'baseline'" },
      },
    },
    justify: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
      description: 'Main-axis distribution of children.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'start' },
        type: { summary: "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'" },
      },
    },
    wrap: {
      control: { type: 'boolean' },
      description: 'When true, children wrap onto multiple lines.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    inline: {
      control: { type: 'boolean' },
      description: 'When true, renders as display: inline-flex.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    direction: 'vertical',
    gap: 'md',
    align: 'stretch',
    justify: 'start',
    wrap: false,
    inline: false,
  },
  render: (args) => html`
    <hx-stack
      direction=${args.direction}
      gap=${args.gap}
      align=${args.align}
      justify=${args.justify}
      ?wrap=${args.wrap}
      ?inline=${args.inline}
    >
      <div style="padding: 0.75rem 1rem; background: #e0f2fe; border-radius: 0.25rem; font-size: 0.875rem;">
        Item 1
      </div>
      <div style="padding: 0.75rem 1rem; background: #e0f2fe; border-radius: 0.25rem; font-size: 0.875rem;">
        Item 2
      </div>
      <div style="padding: 0.75rem 1rem; background: #e0f2fe; border-radius: 0.25rem; font-size: 0.875rem;">
        Item 3
      </div>
    </hx-stack>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT (Vertical)
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-stack');
    await expect(el).toBeTruthy();
    await expect(el?.shadowRoot?.querySelector('[part="base"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. HORIZONTAL
// ─────────────────────────────────────────────────

export const Horizontal: Story = {
  args: {
    direction: 'horizontal',
    gap: 'md',
    align: 'center',
  },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-stack');
    await expect(el?.getAttribute('direction')).toBe('horizontal');
  },
};

// ─────────────────────────────────────────────────
// 3. CENTERED (vertical + center aligned)
// ─────────────────────────────────────────────────

export const Centered: Story = {
  args: {
    direction: 'vertical',
    align: 'center',
    justify: 'center',
    gap: 'lg',
  },
  render: (args) => html`
    <hx-stack
      direction=${args.direction}
      gap=${args.gap}
      align=${args.align}
      justify=${args.justify}
      style="min-height: 200px; border: 1px dashed #cbd5e1; padding: 1rem;"
    >
      <div style="padding: 0.5rem 1rem; background: #dbeafe; border-radius: 0.25rem; font-size: 0.875rem;">
        Centered Item A
      </div>
      <div style="padding: 0.5rem 1rem; background: #dbeafe; border-radius: 0.25rem; font-size: 0.875rem;">
        Centered Item B
      </div>
    </hx-stack>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-stack');
    await expect(el?.getAttribute('align')).toBe('center');
    await expect(el?.getAttribute('justify')).toBe('center');
  },
};

// ─────────────────────────────────────────────────
// 4. SPACE BETWEEN
// ─────────────────────────────────────────────────

export const SpaceBetween: Story = {
  args: {
    direction: 'horizontal',
    justify: 'between',
    align: 'center',
    gap: 'none',
  },
  render: (args) => html`
    <hx-stack
      direction=${args.direction}
      gap=${args.gap}
      align=${args.align}
      justify=${args.justify}
      style="border: 1px dashed #cbd5e1; padding: 1rem;"
    >
      <div style="padding: 0.5rem 1rem; background: #fef9c3; border-radius: 0.25rem; font-size: 0.875rem;">
        Left
      </div>
      <div style="padding: 0.5rem 1rem; background: #fef9c3; border-radius: 0.25rem; font-size: 0.875rem;">
        Right
      </div>
    </hx-stack>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-stack');
    await expect(el?.getAttribute('justify')).toBe('between');
  },
};

// ─────────────────────────────────────────────────
// 5. ALL GAP SIZES
// ─────────────────────────────────────────────────

export const AllGapSizes: Story = {
  render: () => html`
    <hx-stack direction="vertical" gap="lg">
      ${(['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map(
        (gap) => html`
          <div>
            <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 0.25rem;">
              gap="${gap}"
            </div>
            <hx-stack direction="horizontal" gap=${gap}>
              <div style="padding: 0.5rem 1rem; background: #dbeafe; border-radius: 0.25rem; font-size: 0.875rem;">A</div>
              <div style="padding: 0.5rem 1rem; background: #dbeafe; border-radius: 0.25rem; font-size: 0.875rem;">B</div>
              <div style="padding: 0.5rem 1rem; background: #dbeafe; border-radius: 0.25rem; font-size: 0.875rem;">C</div>
            </hx-stack>
          </div>
        `,
      )}
    </hx-stack>
  `,
  play: async ({ canvasElement }) => {
    const stacks = canvasElement.querySelectorAll('hx-stack[direction="horizontal"]');
    await expect(stacks.length).toBe(6);
  },
};

// ─────────────────────────────────────────────────
// 6. ALL ALIGNMENTS
// ─────────────────────────────────────────────────

export const AllAlignments: Story = {
  render: () => html`
    <hx-stack direction="vertical" gap="lg">
      ${(['start', 'center', 'end', 'stretch', 'baseline'] as const).map(
        (align) => html`
          <div>
            <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 0.25rem;">
              align="${align}"
            </div>
            <hx-stack direction="horizontal" gap="sm" align=${align} style="border: 1px dashed #cbd5e1; padding: 0.5rem; min-height: 80px;">
              <div style="padding: 0.5rem 1rem; background: #fce7f3; border-radius: 0.25rem; font-size: 0.875rem;">Short</div>
              <div style="padding: 1rem 1rem; background: #fce7f3; border-radius: 0.25rem; font-size: 0.875rem;">Taller</div>
              <div style="padding: 0.25rem 1rem; background: #fce7f3; border-radius: 0.25rem; font-size: 0.875rem;">Tiny</div>
            </hx-stack>
          </div>
        `,
      )}
    </hx-stack>
  `,
  play: async ({ canvasElement }) => {
    const stacks = canvasElement.querySelectorAll('hx-stack[direction="horizontal"]');
    await expect(stacks.length).toBe(5);
  },
};

// ─────────────────────────────────────────────────
// 7. WRAPPING
// ─────────────────────────────────────────────────

export const Wrapping: Story = {
  args: {
    direction: 'horizontal',
    gap: 'md',
    wrap: true,
  },
  render: (args) => html`
    <hx-stack
      direction=${args.direction}
      gap=${args.gap}
      ?wrap=${args.wrap}
      style="max-width: 320px; border: 1px dashed #cbd5e1; padding: 1rem;"
    >
      ${Array.from({ length: 8 }, (_, i) => html`
        <div style="padding: 0.5rem 1rem; background: #d1fae5; border-radius: 0.25rem; font-size: 0.875rem; white-space: nowrap;">
          Item ${i + 1}
        </div>
      `)}
    </hx-stack>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-stack');
    await expect(el?.hasAttribute('wrap')).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 8. INLINE
// ─────────────────────────────────────────────────

export const Inline: Story = {
  render: () => html`
    <div style="font-size: 0.875rem;">
      Text before
      <hx-stack direction="horizontal" gap="xs" inline>
        <div style="padding: 0.25rem 0.5rem; background: #fef3c7; border-radius: 0.25rem; font-size: 0.875rem;">Tag A</div>
        <div style="padding: 0.25rem 0.5rem; background: #fef3c7; border-radius: 0.25rem; font-size: 0.875rem;">Tag B</div>
      </hx-stack>
      text after.
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-stack');
    await expect(el?.hasAttribute('inline')).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 9. HEALTHCARE — Patient Form Layout
// ─────────────────────────────────────────────────

export const PatientFormLayout: Story = {
  render: () => html`
    <hx-stack direction="vertical" gap="lg" style="max-width: 480px; font-family: sans-serif;">
      <hx-stack direction="horizontal" gap="md" align="center">
        <div style="padding: 0.5rem 0.75rem; background: #dcfce7; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">
          Active
        </div>
        <span style="font-size: 0.875rem; color: #374151; font-weight: 600;">Jane Doe — MRN: 885521</span>
      </hx-stack>
      <hx-stack direction="vertical" gap="sm">
        <label style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
          Chief Complaint
        </label>
        <div style="padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem;">
          Chest pain, shortness of breath
        </div>
      </hx-stack>
      <hx-stack direction="horizontal" gap="md">
        <hx-stack direction="vertical" gap="xs">
          <label style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            BP
          </label>
          <span style="font-size: 0.875rem;">120/80</span>
        </hx-stack>
        <hx-stack direction="vertical" gap="xs">
          <label style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            HR
          </label>
          <span style="font-size: 0.875rem;">72 bpm</span>
        </hx-stack>
        <hx-stack direction="vertical" gap="xs">
          <label style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            Temp
          </label>
          <span style="font-size: 0.875rem;">98.6°F</span>
        </hx-stack>
      </hx-stack>
    </hx-stack>
  `,
  play: async ({ canvasElement }) => {
    const stacks = canvasElement.querySelectorAll('hx-stack');
    await expect(stacks.length).toBeGreaterThanOrEqual(4);
  },
};
