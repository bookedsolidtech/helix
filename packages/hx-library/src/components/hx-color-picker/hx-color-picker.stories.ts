import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './hx-color-picker.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/ColorPicker',
  component: 'hx-color-picker',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current color value as a CSS color string.',
      table: {
        category: 'Value',
        defaultValue: { summary: '#000000' },
        type: { summary: 'string' },
      },
    },
    format: {
      control: { type: 'select' },
      options: ['hex', 'rgb', 'hsl', 'hsv'],
      description: 'Output format for the color value.',
      table: {
        category: 'Value',
        defaultValue: { summary: 'hex' },
        type: { summary: "'hex' | 'rgb' | 'hsl' | 'hsv'" },
      },
    },
    opacity: {
      control: 'boolean',
      description: 'Show the alpha/opacity channel slider.',
      table: {
        category: 'Features',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    swatches: {
      control: 'object',
      description: 'Array of preset swatch color strings.',
      table: {
        category: 'Features',
        type: { summary: 'string[]' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the control is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    inline: {
      control: 'boolean',
      description: 'Show the picker inline instead of in a popover.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    name: {
      control: 'text',
      description: 'Form field name.',
      table: {
        category: 'Form',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    value: '#3b82f6',
    format: 'hex',
    opacity: false,
    disabled: false,
    inline: false,
    name: 'color',
    swatches: [],
  },
  render: (args) => html`
    <div style="padding: 2rem;">
      <hx-color-picker
        value=${args.value}
        format=${args.format}
        ?opacity=${args.opacity}
        .swatches=${args.swatches ?? []}
        ?disabled=${args.disabled}
        ?inline=${args.inline}
        name=${args.name}
      ></hx-color-picker>
    </div>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    value: '#3b82f6',
    format: 'hex',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const el = canvasElement.querySelector('hx-color-picker');
    await expect(el).toBeTruthy();

    const trigger = el?.shadowRoot?.querySelector('[part="trigger"]') as HTMLElement | null;
    await expect(trigger).toBeTruthy();
    await expect(trigger?.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(trigger!);
    await expect(trigger?.getAttribute('aria-expanded')).toBe('true');

    const panel = el?.shadowRoot?.querySelector('.panel');
    await expect(panel).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. INLINE
// ─────────────────────────────────────────────────

export const Inline: Story = {
  args: {
    value: '#10b981',
    inline: true,
  },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-color-picker');
    await expect(el).toBeTruthy();
    const panel = el?.shadowRoot?.querySelector('.panel');
    await expect(panel).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 3. WITH OPACITY
// ─────────────────────────────────────────────────

export const WithOpacity: Story = {
  args: {
    value: '#f59e0b',
    opacity: true,
    inline: true,
  },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-color-picker');
    await expect(el).toBeTruthy();
    // part="slider opacity-slider" — use word-match selector
    const opacitySlider = el?.shadowRoot?.querySelector('[part~="opacity-slider"]');
    await expect(opacitySlider).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 4. WITH SWATCHES
// ─────────────────────────────────────────────────

export const WithSwatches: Story = {
  args: {
    value: '#ef4444',
    inline: true,
    swatches: [
      '#ef4444',
      '#f97316',
      '#eab308',
      '#22c55e',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#6b7280',
      '#000000',
      '#ffffff',
    ],
  },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-color-picker');
    await expect(el).toBeTruthy();
    const swatches = el?.shadowRoot?.querySelector('[part="swatches"]');
    await expect(swatches).toBeTruthy();
    const swatchBtns = el?.shadowRoot?.querySelectorAll('.swatch-btn');
    await expect(swatchBtns?.length).toBe(10);
  },
};

// ─────────────────────────────────────────────────
// 5. FORMAT: RGB
// ─────────────────────────────────────────────────

export const FormatRgb: Story = {
  args: {
    value: 'rgb(59, 130, 246)',
    format: 'rgb',
    inline: true,
  },
};

// ─────────────────────────────────────────────────
// 6. FORMAT: HSL
// ─────────────────────────────────────────────────

export const FormatHsl: Story = {
  args: {
    value: 'hsl(217, 91%, 60%)',
    format: 'hsl',
    inline: true,
  },
};

// ─────────────────────────────────────────────────
// 7. FORMAT: HSV
// ─────────────────────────────────────────────────

export const FormatHsv: Story = {
  args: {
    value: '#3b82f6',
    format: 'hsv',
    inline: true,
  },
};

// ─────────────────────────────────────────────────
// 8. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    value: '#6b7280',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-color-picker');
    await expect(el).toBeTruthy();
    const trigger = el?.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    await expect(trigger?.disabled).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 9. HEALTHCARE THEME SELECTOR
// ─────────────────────────────────────────────────

export const HealthcareThemeSelector: Story = {
  args: {
    value: '#0ea5e9',
    inline: true,
    swatches: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#1e293b'],
  },
  render: () => html`
    <div style="padding: 2rem; max-width: 320px;">
      <label
        style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.875rem; color: #374151;"
        >Brand color</label
      >
      <hx-color-picker
        value="#0ea5e9"
        inline
        .swatches=${['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#1e293b']}
        name="brand-color"
      ></hx-color-picker>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. FULL FEATURED (all options)
// ─────────────────────────────────────────────────

export const FullFeatured: Story = {
  args: {
    value: '#3b82f6',
    opacity: true,
    inline: true,
    swatches: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
  },
};

// ─────────────────────────────────────────────────
// 11. SWATCHES ONLY (P1-9)
// Hides gradient/sliders — shows only preset swatches + input.
// Useful for preset-only color selection UIs where free-form picking
// is not desired (e.g. brand color selection from a defined palette).
// ─────────────────────────────────────────────────

export const SwatchesOnly: Story = {
  args: {
    value: '#3b82f6',
    inline: true,
    swatchesOnly: true,
    swatches: [
      '#ef4444',
      '#f97316',
      '#eab308',
      '#22c55e',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#6b7280',
      '#000000',
      '#ffffff',
    ],
  },
  render: (args) => html`
    <div style="padding: 2rem; max-width: 320px;">
      <p
        style="margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280; font-family: sans-serif;"
      >
        Swatches-only mode: gradient grid and sliders are hidden. Only preset colors and the text
        input are shown.
      </p>
      <hx-color-picker
        value=${args.value}
        inline
        swatches-only
        .swatches=${args.swatches ?? []}
        name="preset-color"
      ></hx-color-picker>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-color-picker');
    await expect(el).toBeTruthy();
    // Grid and sliders should NOT be present in swatches-only mode
    const grid = el?.shadowRoot?.querySelector('[part="grid"]');
    await expect(grid).toBeNull();
    const hueSlider = el?.shadowRoot?.querySelector('[part="hue-slider"]');
    await expect(hueSlider).toBeNull();
    // Swatches should be present
    const swatches = el?.shadowRoot?.querySelector('[part="swatches"]');
    await expect(swatches).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 12. COMPACT (P1-9)
// Inline picker in a constrained container.
// Demonstrates resizing via CSS custom properties:
//   --hx-color-picker-width and --hx-color-picker-grid-height
// ─────────────────────────────────────────────────

export const Compact: Story = {
  args: {
    value: '#22c55e',
    inline: true,
    swatches: ['#ef4444', '#22c55e', '#3b82f6', '#8b5cf6'],
  },
  render: (args) => html`
    <div style="padding: 2rem;">
      <p
        style="margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280; font-family: sans-serif;"
      >
        Compact mode: reduced panel width and grid height via CSS custom properties.
      </p>
      <hx-color-picker
        value=${args.value}
        inline
        .swatches=${args.swatches ?? []}
        name="compact-color"
        style="--hx-color-picker-width: 200px; --hx-color-picker-grid-height: 100px;"
      ></hx-color-picker>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-color-picker');
    await expect(el).toBeTruthy();
    const panel = el?.shadowRoot?.querySelector('.panel');
    await expect(panel).toBeTruthy();
    const grid = el?.shadowRoot?.querySelector('[part="grid"]');
    await expect(grid).toBeTruthy();
  },
};
