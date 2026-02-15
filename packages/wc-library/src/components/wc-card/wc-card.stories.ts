import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './wc-card.js';
import '../wc-button/wc-button.js';

const meta = {
  title: 'Components/Card',
  component: 'wc-card',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'featured', 'compact'],
      description: 'Visual style variant of the card.',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    elevation: {
      control: { type: 'select' },
      options: ['flat', 'raised', 'floating'],
      description: 'Elevation (shadow depth) of the card.',
      table: {
        defaultValue: { summary: 'flat' },
      },
    },
    href: {
      control: 'text',
      description: 'Optional URL that makes the card interactive.',
    },
  },
  args: {
    variant: 'default',
    elevation: 'flat',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Default Card ───

export const Default: Story = {
  render: (args) => html`
    <wc-card variant=${args.variant} elevation=${args.elevation} style="max-width: 400px;">
      <span slot="heading">Card Heading</span>
      <p>This is the card body content. It can contain any HTML or text you need to display.</p>
    </wc-card>
  `,
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('wc-card');
    expect(button).toBeTruthy();
    expect(button?.shadowRoot?.querySelector('.card')).toBeTruthy();
  },
};

// ─── With All Slots ───

export const WithAllSlots: Story = {
  render: () => html`
    <wc-card elevation="raised" style="max-width: 400px;">
      <img slot="image" src="https://placehold.co/400x200/007878/ffffff?text=Card+Image" alt="Placeholder" />
      <span slot="heading">Full Featured Card</span>
      <p>This card demonstrates all available slots including image, heading, body, footer, and actions.</p>
      <span slot="footer">
        <small>Last updated: Feb 2026</small>
      </span>
      <span slot="actions">
        <wc-button wc-size="sm">Action 1</wc-button>
        <wc-button wc-size="sm" variant="secondary">Action 2</wc-button>
      </span>
    </wc-card>
  `,
};

// ─── Featured Variant ───

export const Featured: Story = {
  render: () => html`
    <wc-card variant="featured" elevation="raised" style="max-width: 400px;">
      <span slot="heading">Featured Card</span>
      <p>This card uses the featured variant, which adds a colored border to draw attention.</p>
      <span slot="actions">
        <wc-button wc-size="sm">Learn More</wc-button>
      </span>
    </wc-card>
  `,
};

// ─── Compact Variant ───

export const Compact: Story = {
  render: () => html`
    <wc-card variant="compact" style="max-width: 300px;">
      <span slot="heading">Compact Card</span>
      <p>A compact card with reduced padding for denser layouts.</p>
    </wc-card>
  `,
};

// ─── Interactive Card ───

export const Interactive: Story = {
  render: () => html`
    <wc-card
      wc-href="https://example.com"
      elevation="raised"
      style="max-width: 400px;"
      @wc-card-click=${(e: CustomEvent) => console.log('Card clicked:', e.detail)}
    >
      <span slot="heading">Clickable Card</span>
      <p>This card has an href prop, making it interactive. Click it or press Enter when focused.</p>
    </wc-card>
  `,
};

// ─── Elevation Comparison ───

export const ElevationComparison: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
      <wc-card elevation="flat" style="max-width: 240px;">
        <span slot="heading">Flat</span>
        <p>No shadow elevation.</p>
      </wc-card>

      <wc-card elevation="raised" style="max-width: 240px;">
        <span slot="heading">Raised</span>
        <p>Medium shadow elevation.</p>
      </wc-card>

      <wc-card elevation="floating" style="max-width: 240px;">
        <span slot="heading">Floating</span>
        <p>Heavy shadow elevation.</p>
      </wc-card>
    </div>
  `,
};
