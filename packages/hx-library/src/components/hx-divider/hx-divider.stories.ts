import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-divider.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Divider',
  component: 'hx-divider',
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description:
        'Determines whether the divider renders as a horizontal rule or a vertical separator.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'horizontal' },
        type: { summary: "'horizontal' | 'vertical'" },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['solid', 'dashed', 'dotted'],
      description: 'Controls the line style of the divider.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'solid' },
        type: { summary: "'solid' | 'dashed' | 'dotted'" },
      },
    },
    spacing: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Sets the margin around the divider. For horizontal dividers this applies block margin; for vertical dividers it applies inline margin.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    role: {
      control: { type: 'select' },
      options: ['separator', 'presentation'],
      description:
        'ARIA role applied to the host element. Use "presentation" for purely decorative dividers that should be hidden from assistive technology.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'separator' },
        type: { summary: "'separator' | 'presentation'" },
      },
    },
  },
  args: {
    orientation: 'horizontal',
    variant: 'solid',
    spacing: 'md',
    role: 'separator',
  },
  render: (args) => html`
    <hx-divider
      orientation=${args.orientation}
      variant=${args.variant}
      spacing=${args.spacing}
      role=${args.role}
    ></hx-divider>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ════════════════════════════════════════════════════════════════════════════
// 1. DEFAULT
// ════════════════════════════════════════════════════════════════════════════

/** Default divider: horizontal orientation, solid line, medium spacing, and separator role. */
export const Default: Story = {
  args: {
    orientation: 'horizontal',
    variant: 'solid',
    spacing: 'md',
    role: 'separator',
  },
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    await expect(divider).toBeTruthy();

    const hr = divider?.shadowRoot?.querySelector('hr');
    await expect(hr).toBeTruthy();
    await expect(hr?.classList.contains('divider--horizontal')).toBe(true);
    await expect(hr?.classList.contains('divider--solid')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. ORIENTATION STORIES
// ════════════════════════════════════════════════════════════════════════════

/** Horizontal divider spans the full width of its container to separate stacked content sections. */
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    await expect(divider).toBeTruthy();
    const hr = divider?.shadowRoot?.querySelector('hr');
    await expect(hr?.classList.contains('divider--horizontal')).toBe(true);
  },
};

/** Vertical divider separates inline content such as toolbar actions or adjacent panels. Requires a flex container with an explicit height. */
export const Vertical: Story = {
  render: () => html`
    <div style="display: flex; height: 100px; align-items: center;">
      <hx-divider orientation="vertical"></hx-divider>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    await expect(divider).toBeTruthy();
    const hr = divider?.shadowRoot?.querySelector('hr');
    await expect(hr?.classList.contains('divider--vertical')).toBe(true);
  },
};

/** Both orientations side by side to illustrate the layout difference at a glance. */
export const Orientations: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div>
        <p
          style="font-family: var(--hx-font-family-sans, sans-serif); font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280); margin: 0 0 0.5rem;"
        >
          Horizontal
        </p>
        <hx-divider orientation="horizontal"></hx-divider>
      </div>
      <div>
        <p
          style="font-family: var(--hx-font-family-sans, sans-serif); font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280); margin: 0 0 0.5rem;"
        >
          Vertical
        </p>
        <div style="display: flex; height: 100px; align-items: center;">
          <hx-divider orientation="vertical"></hx-divider>
        </div>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dividers = canvasElement.querySelectorAll('hx-divider');
    await expect(dividers.length).toBe(2);

    const horizontalHr = dividers[0]?.shadowRoot?.querySelector('hr');
    await expect(horizontalHr?.classList.contains('divider--horizontal')).toBe(true);

    const verticalHr = dividers[1]?.shadowRoot?.querySelector('hr');
    await expect(verticalHr?.classList.contains('divider--vertical')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. VARIANT STORIES
// ════════════════════════════════════════════════════════════════════════════

/** Solid line: the default variant, providing a clear, unambiguous visual boundary. */
export const Solid: Story = {
  args: {
    variant: 'solid',
  },
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    const hr = divider?.shadowRoot?.querySelector('hr');
    await expect(hr?.classList.contains('divider--solid')).toBe(true);
  },
};

/** Dashed line: a lighter boundary for grouping related content without full visual separation. */
export const Dashed: Story = {
  args: {
    variant: 'dashed',
  },
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    const hr = divider?.shadowRoot?.querySelector('hr');
    await expect(hr?.classList.contains('divider--dashed')).toBe(true);
  },
};

/** Dotted line: a subtle decorative separator for low-emphasis content boundaries. */
export const Dotted: Story = {
  args: {
    variant: 'dotted',
  },
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    const hr = divider?.shadowRoot?.querySelector('hr');
    await expect(hr?.classList.contains('divider--dotted')).toBe(true);
  },
};

/** All three line style variants displayed together for direct visual comparison. */
export const Variants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <p
          style="font-family: var(--hx-font-family-sans, sans-serif); font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280); margin: 0 0 0.5rem;"
        >
          Solid
        </p>
        <hx-divider variant="solid" spacing="sm"></hx-divider>
      </div>
      <div>
        <p
          style="font-family: var(--hx-font-family-sans, sans-serif); font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280); margin: 0 0 0.5rem;"
        >
          Dashed
        </p>
        <hx-divider variant="dashed" spacing="sm"></hx-divider>
      </div>
      <div>
        <p
          style="font-family: var(--hx-font-family-sans, sans-serif); font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280); margin: 0 0 0.5rem;"
        >
          Dotted
        </p>
        <hx-divider variant="dotted" spacing="sm"></hx-divider>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dividers = canvasElement.querySelectorAll('hx-divider');
    await expect(dividers.length).toBe(3);

    const solidHr = dividers[0]?.shadowRoot?.querySelector('hr');
    await expect(solidHr?.classList.contains('divider--solid')).toBe(true);

    const dashedHr = dividers[1]?.shadowRoot?.querySelector('hr');
    await expect(dashedHr?.classList.contains('divider--dashed')).toBe(true);

    const dottedHr = dividers[2]?.shadowRoot?.querySelector('hr');
    await expect(dottedHr?.classList.contains('divider--dotted')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 4. SPACING STORIES
// ════════════════════════════════════════════════════════════════════════════

/** Small spacing (0.5rem block margin) for compact layouts such as form field groups. */
export const SpacingSm: Story = {
  name: 'Spacing — Small',
  render: () => html`
    <div
      style="font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
    >
      <p style="margin: 0;">Patient Name: Jane Doe</p>
      <hx-divider spacing="sm"></hx-divider>
      <p style="margin: 0;">DOB: 1982-04-15</p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    await expect(divider).toBeTruthy();
    await expect(divider?.getAttribute('spacing')).toBe('sm');
  },
};

/** Medium spacing (1rem block margin) — the default for most interface contexts. */
export const SpacingMd: Story = {
  name: 'Spacing — Medium',
  render: () => html`
    <div
      style="font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
    >
      <p style="margin: 0;">Vital Signs</p>
      <hx-divider spacing="md"></hx-divider>
      <p style="margin: 0;">Medications</p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    await expect(divider).toBeTruthy();
    await expect(divider?.getAttribute('spacing')).toBe('md');
  },
};

/** Large spacing (2rem block margin) for major section breaks in clinical documents or dashboards. */
export const SpacingLg: Story = {
  name: 'Spacing — Large',
  render: () => html`
    <div
      style="font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
    >
      <p style="margin: 0;">Patient Summary</p>
      <hx-divider spacing="lg"></hx-divider>
      <p style="margin: 0;">Clinical Notes</p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    await expect(divider).toBeTruthy();
    await expect(divider?.getAttribute('spacing')).toBe('lg');
  },
};

/** All three spacing sizes shown together for side-by-side comparison of margin scale. */
export const Spacing: Story = {
  render: () => html`
    <div
      style="font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
    >
      <p style="margin: 0; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);">
        Small (0.5rem)
      </p>
      <hx-divider spacing="sm"></hx-divider>
      <p style="margin: 0; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);">
        Medium (1rem)
      </p>
      <hx-divider spacing="md"></hx-divider>
      <p style="margin: 0; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);">
        Large (2rem)
      </p>
      <hx-divider spacing="lg"></hx-divider>
      <p style="margin: 0; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);">
        End of scale
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dividers = canvasElement.querySelectorAll('hx-divider');
    await expect(dividers.length).toBe(3);
    await expect(dividers[0]?.getAttribute('spacing')).toBe('sm');
    await expect(dividers[1]?.getAttribute('spacing')).toBe('md');
    await expect(dividers[2]?.getAttribute('spacing')).toBe('lg');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5. PRESENTATION ROLE
// ════════════════════════════════════════════════════════════════════════════

/** Presentation role hides the divider from assistive technology, suitable for purely decorative separators that add no semantic meaning. */
export const PresentationRole: Story = {
  args: {
    role: 'presentation',
  },
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('hx-divider');
    await expect(divider).toBeTruthy();
    await expect(divider?.getAttribute('role')).toBe('presentation');

    const hr = divider?.shadowRoot?.querySelector('hr');
    await expect(hr).toBeTruthy();
  },
};
