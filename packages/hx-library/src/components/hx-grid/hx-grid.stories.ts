import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-grid.js';

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

const ITEM_COLORS = [
  'var(--hx-color-primary-100, #dbeafe)',
  'var(--hx-color-warning-100, #fef9c3)',
  'var(--hx-color-success-100, #dcfce7)',
  'var(--hx-color-danger-100, #fce7f3)',
  'var(--hx-color-neutral-100, #f1f5f9)',
  'var(--hx-color-warning-50, #ffedd5)',
] as const;

const gridItem = (label: string, colorToken = ITEM_COLORS[0]) => html`
  <div
    style="
      padding: 1rem;
      background: ${colorToken};
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-family: sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 4rem;
    "
  >
    ${label}
  </div>
`;

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Grid',
  component: 'hx-grid',
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: { type: 'text' },
      description: 'Number of equal columns or a CSS grid-template-columns string.',
      table: {
        category: 'Layout',
        defaultValue: { summary: '1' },
        type: { summary: 'number | string' },
      },
    },
    gap: {
      control: { type: 'select' },
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Gap size applied to both row and column gaps.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'md' },
        type: { summary: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
      },
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'stretch'],
      description: 'Aligns grid items along the block axis (align-items).',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'stretch' },
        type: { summary: "'start' | 'center' | 'end' | 'stretch'" },
      },
    },
    justify: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'stretch'],
      description: 'Justifies grid items along the inline axis (justify-items).',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'stretch' },
        type: { summary: "'start' | 'center' | 'end' | 'stretch'" },
      },
    },
    rowGap: {
      control: { type: 'select' },
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Row gap override. When set, takes precedence over `gap` for row spacing.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'undefined' },
        type: { summary: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
      },
    },
    columnGap: {
      control: { type: 'select' },
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Column gap override. When set, takes precedence over `gap` for column spacing.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'undefined' },
        type: { summary: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
      },
    },
  },
  args: {
    columns: 3,
    gap: 'md',
    align: 'stretch',
    justify: 'stretch',
  },
  render: (args) => html`
    <hx-grid
      columns=${args.columns}
      gap=${args.gap}
      align=${args.align}
      justify=${args.justify}
    >
      ${gridItem('Column 1')}
      ${gridItem('Column 2', ITEM_COLORS[1])}
      ${gridItem('Column 3', ITEM_COLORS[2])}
    </hx-grid>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT (3-column)
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-grid');
    await expect(el).toBeTruthy();
    await expect(el?.shadowRoot?.querySelector('[part="base"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. TWO COLUMNS
// ─────────────────────────────────────────────────

export const TwoColumns: Story = {
  args: { columns: 2 },
  render: (args) => html`
    <hx-grid columns=${args.columns} gap=${args.gap}>
      ${gridItem('Left Panel')}
      ${gridItem('Right Panel', ITEM_COLORS[1])}
    </hx-grid>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-grid');
    await expect(el?.getAttribute('columns')).toBe('2');
  },
};

// ─────────────────────────────────────────────────
// 3. FOUR COLUMNS
// ─────────────────────────────────────────────────

export const FourColumns: Story = {
  args: { columns: 4 },
  render: (args) => html`
    <hx-grid columns=${args.columns} gap=${args.gap}>
      ${gridItem('Q1')}
      ${gridItem('Q2', ITEM_COLORS[1])}
      ${gridItem('Q3', ITEM_COLORS[2])}
      ${gridItem('Q4', ITEM_COLORS[3])}
    </hx-grid>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-grid');
    await expect(el?.getAttribute('columns')).toBe('4');
  },
};

// ─────────────────────────────────────────────────
// 4. TWELVE COLUMNS
// ─────────────────────────────────────────────────

export const TwelveColumns: Story = {
  args: { columns: 12 },
  render: (args) => html`
    <hx-grid columns=${args.columns} gap="xs">
      ${Array.from({ length: 12 }, (_, i) => gridItem(`${i + 1}`))}
    </hx-grid>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-grid');
    await expect(el?.getAttribute('columns')).toBe('12');
  },
};

// ─────────────────────────────────────────────────
// 5. CUSTOM TEMPLATE (asymmetric)
// ─────────────────────────────────────────────────

export const CustomTemplate: Story = {
  args: { columns: '1fr 2fr 1fr' },
  render: (args) => html`
    <hx-grid columns=${args.columns} gap="md">
      ${gridItem('Sidebar')}
      ${gridItem('Main Content', ITEM_COLORS[1])}
      ${gridItem('Aside', ITEM_COLORS[2])}
    </hx-grid>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-grid');
    await expect(el).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 6. WITH hx-grid-item PLACEMENT
// ─────────────────────────────────────────────────

export const WithGridItems: Story = {
  render: () => html`
    <hx-grid columns="4" gap="md">
      <hx-grid-item span="2">
        ${gridItem('Span 2 columns', ITEM_COLORS[0])}
      </hx-grid-item>
      <hx-grid-item>
        ${gridItem('1 col', ITEM_COLORS[1])}
      </hx-grid-item>
      <hx-grid-item>
        ${gridItem('1 col', ITEM_COLORS[2])}
      </hx-grid-item>
      <hx-grid-item column="1 / 3">
        ${gridItem('Explicit 1/3', ITEM_COLORS[3])}
      </hx-grid-item>
      <hx-grid-item column="3 / 5">
        ${gridItem('Explicit 3/5', ITEM_COLORS[5])}
      </hx-grid-item>
    </hx-grid>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-grid');
    await expect(el).toBeTruthy();
    const items = canvasElement.querySelectorAll('hx-grid-item');
    await expect(items.length).toBe(5);
  },
};

// ─────────────────────────────────────────────────
// 7. RESPONSIVE — HEALTHCARE PATIENT DASHBOARD
// ─────────────────────────────────────────────────

export const PatientDashboard: Story = {
  render: () => html`
    <div style="font-family: sans-serif;">
      <hx-grid columns="3" gap="lg">
        <div style="padding: 1.25rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; grid-column: span 2;">
          <h3 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Patient Overview</h3>
          <p style="margin: 0; font-size: 1.25rem; font-weight: 600;">Jane Doe — MRN: 885521</p>
          <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.875rem;">DOB: 1982-03-15 — Room 214-B — Dr. Patel</p>
        </div>
        <div style="padding: 1.25rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem;">
          <h3 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em;">Status</h3>
          <p style="margin: 0; font-weight: 600; color: #16a34a;">Stable</p>
        </div>
        <div style="padding: 1.25rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
          <h3 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Blood Pressure</h3>
          <p style="margin: 0; font-size: 1.125rem; font-weight: 600;">120 / 80</p>
        </div>
        <div style="padding: 1.25rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
          <h3 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Heart Rate</h3>
          <p style="margin: 0; font-size: 1.125rem; font-weight: 600;">72 bpm</p>
        </div>
        <div style="padding: 1.25rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
          <h3 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Temperature</h3>
          <p style="margin: 0; font-size: 1.125rem; font-weight: 600;">98.6 °F</p>
        </div>
      </hx-grid>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-grid');
    await expect(el).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 8. GAP VARIANTS
// ─────────────────────────────────────────────────

export const GapVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; font-family: sans-serif;">
      ${(['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map(
        (gap) => html`
          <div>
            <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">gap="${gap}"</p>
            <hx-grid columns="3" gap=${gap}>
              ${gridItem('A')}
              ${gridItem('B', ITEM_COLORS[1])}
              ${gridItem('C', ITEM_COLORS[2])}
            </hx-grid>
          </div>
        `,
      )}
    </div>
  `,
  play: async ({ canvasElement }) => {
    const grids = canvasElement.querySelectorAll('hx-grid');
    await expect(grids.length).toBe(6);
  },
};
