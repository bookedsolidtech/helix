import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, fn } from 'storybook/test';
import './hx-tile.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Tile',
  component: 'hx-tile',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outlined', 'filled'],
      description: 'Visual style variant of the tile.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'outlined' | 'filled'" },
      },
    },
    href: {
      control: 'text',
      description: 'Optional URL. When set, the tile renders as a link.',
      table: {
        category: 'Interaction',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    clickable: {
      control: 'boolean',
      description:
        'When false, the tile is purely static/decorative with no interactive role or behavior.',
      table: {
        category: 'Interaction',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    selected: {
      control: 'boolean',
      description: 'Whether the tile is in a selected/pressed state.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'When true, the tile is non-interactive and visually dimmed.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    variant: 'default',
    href: '',
    clickable: true,
    selected: false,
    disabled: false,
  },
  render: (args) => html`
    <hx-tile
      variant=${args.variant}
      ?selected=${args.selected}
      ?disabled=${args.disabled}
      ?clickable=${args.clickable}
      href=${ifDefined(args.href || undefined)}
      style="width: 160px;"
    >
      <span slot="icon">&#127968;</span>
      <span slot="label">Dashboard</span>
      <span slot="description">View your overview</span>
    </hx-tile>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {},
};

export const Static: Story = {
  name: 'Static (non-interactive)',
  args: {
    clickable: false,
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
  },
};

export const Selected: Story = {
  args: {
    selected: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const LinkMode: Story = {
  name: 'Link Mode (href)',
  args: {
    href: '/dashboard',
  },
};

export const WithBadge: Story = {
  render: () => html`
    <hx-tile style="width: 160px;">
      <span slot="icon">&#128203;</span>
      <span slot="label">Reports</span>
      <span slot="description">Monthly summary</span>
      <span
        slot="badge"
        style="
          background: var(--hx-color-error-500, #ef4444);
          color: var(--hx-color-neutral-0, #ffffff);
          border-radius: var(--hx-border-radius-full, 9999px);
          font-size: var(--hx-font-size-xs, 0.75rem);
          padding: var(--hx-space-0-5, 2px) var(--hx-space-1-5, 6px);
          font-weight: var(--hx-font-weight-semibold, 600);
        "
        >3</span
      >
    </hx-tile>
  `,
};

export const IconOnly: Story = {
  render: () => html`
    <hx-tile style="width: 100px;">
      <span slot="icon">&#128200;</span>
      <span slot="label">Analytics</span>
    </hx-tile>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
      <hx-tile variant="default" style="width: 160px;">
        <span slot="icon">&#127968;</span>
        <span slot="label">Default</span>
        <span slot="description">Default variant</span>
      </hx-tile>
      <hx-tile variant="outlined" style="width: 160px;">
        <span slot="icon">&#128203;</span>
        <span slot="label">Outlined</span>
        <span slot="description">Outlined variant</span>
      </hx-tile>
      <hx-tile variant="filled" style="width: 160px;">
        <span slot="icon">&#128200;</span>
        <span slot="label">Filled</span>
        <span slot="description">Filled variant</span>
      </hx-tile>
    </div>
  `,
};

export const NavigationGrid: Story = {
  render: () => html`
    <div
      style="
        display: grid;
        grid-template-columns: repeat(3, 160px);
        gap: 1rem;
      "
    >
      <hx-tile href="/dashboard">
        <span slot="icon">&#127968;</span>
        <span slot="label">Dashboard</span>
      </hx-tile>
      <hx-tile href="/patients">
        <span slot="icon">&#128100;</span>
        <span slot="label">Patients</span>
      </hx-tile>
      <hx-tile href="/reports">
        <span slot="icon">&#128203;</span>
        <span slot="label">Reports</span>
      </hx-tile>
      <hx-tile href="/analytics">
        <span slot="icon">&#128200;</span>
        <span slot="label">Analytics</span>
      </hx-tile>
      <hx-tile href="/settings">
        <span slot="icon">&#9881;</span>
        <span slot="label">Settings</span>
      </hx-tile>
      <hx-tile disabled>
        <span slot="icon">&#128274;</span>
        <span slot="label">Restricted</span>
      </hx-tile>
    </div>
  `,
};

export const SelectionPattern: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem;">
      <hx-tile selected style="width: 160px;">
        <span slot="icon">&#127968;</span>
        <span slot="label">Selected Tile</span>
      </hx-tile>
      <hx-tile style="width: 160px;">
        <span slot="icon">&#128203;</span>
        <span slot="label">Unselected</span>
      </hx-tile>
    </div>
  `,
};

export const InteractiveEvents: Story = {
  args: {
    href: '',
    selected: false,
  },
  render: (args) => {
    const onHxSelect = fn();
    return html`
      <hx-tile
        variant=${args.variant}
        ?selected=${args.selected}
        style="width: 160px;"
        @hx-select=${onHxSelect}
      >
        <span slot="icon">&#127968;</span>
        <span slot="label">Click Me</span>
        <span slot="description">Toggle selection</span>
      </hx-tile>
    `;
  },
  play: async ({ canvasElement }) => {
    const tile = canvasElement.querySelector('hx-tile')!;
    const base = tile.shadowRoot?.querySelector('[part="tile"]') as HTMLElement;

    // Test click activation
    base.click();
    await expect(tile.selected).toBe(true);

    // Reset
    base.click();
    await expect(tile.selected).toBe(false);

    // Test keyboard activation (Enter)
    base.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await expect(tile.selected).toBe(true);

    // Reset
    base.click();
    await expect(tile.selected).toBe(false);

    // Test keyboard activation (Space)
    base.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await expect(tile.selected).toBe(true);
  },
};
