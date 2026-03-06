import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './hx-icon.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Icon',
  component: 'hx-icon',
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description:
        'Icon name used as the fragment identifier when referencing a sprite sheet. ' +
        'For sprite mode provide the bare symbol id (e.g. `check`). ' +
        'If `name` already starts with `#` it is used as-is as an inline sprite reference.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    src: {
      control: 'text',
      description:
        'URL of a standalone SVG file to fetch and render inline. ' +
        'Takes precedence over sprite mode when both `src` and `spriteUrl`/`name` are set.',
      table: {
        category: 'Content',
        defaultValue: { summary: 'undefined' },
        type: { summary: 'string | undefined' },
      },
    },
    spriteUrl: {
      name: 'sprite-url',
      control: 'text',
      description:
        'Base URL of the SVG sprite sheet. Used together with `name` to construct ' +
        'the `<use>` href: `${spriteUrl}#${name}`.',
      table: {
        category: 'Content',
        defaultValue: { summary: 'undefined' },
        type: { summary: 'string | undefined' },
      },
    },
    size: {
      name: 'hx-size',
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size variant controlling the width and height of the icon.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
      },
    },
    label: {
      control: 'text',
      description:
        'Accessible label for the icon. When non-empty, `role="img"` and `aria-label` are ' +
        'applied so assistive technology announces the icon. When empty the icon is treated ' +
        'as decorative and `aria-hidden="true"` is applied.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    name: 'check',
    src: undefined,
    spriteUrl: undefined,
    size: 'md',
    label: '',
  },
  render: (args) => html`
    <hx-icon
      name=${args.name}
      src=${ifDefined(args.src)}
      sprite-url=${ifDefined(args.spriteUrl)}
      hx-size=${args.size}
      label=${args.label}
    ></hx-icon>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ════════════════════════════════════════════════════════════════════════════
// 1. DEFAULT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Default sprite mode with `name="check"` and no `sprite-url`.
 * The component builds an inline sprite reference `#check` and renders an
 * `<svg>` with a `<use href="#check">` element. The SVG part is present in
 * the shadow root and the icon is decorative (`aria-hidden="true"`) because
 * no label is provided.
 */
export const Default: Story = {
  args: {
    name: 'check',
    src: undefined,
    spriteUrl: undefined,
    label: '',
  },
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('hx-icon');
    await expect(icon).toBeTruthy();

    const svgPart = icon?.shadowRoot?.querySelector('[part="svg"]');
    await expect(svgPart).toBeTruthy();
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. WITH SPRITE URL
// ════════════════════════════════════════════════════════════════════════════

/**
 * Sprite mode with an explicit `sprite-url` attribute.
 * The component constructs the `<use>` href as `${spriteUrl}#${name}`,
 * i.e. `/icons/sprite.svg#check`. This is the recommended production pattern
 * when serving a shared sprite sheet from a CDN or static asset path.
 */
export const WithSpriteUrl: Story = {
  args: {
    name: 'check',
    spriteUrl: '/icons/sprite.svg',
    label: '',
  },
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('hx-icon');
    await expect(icon).toBeTruthy();

    const svgPart = icon?.shadowRoot?.querySelector('[part="svg"]');
    await expect(svgPart).toBeTruthy();

    const useEl = icon?.shadowRoot?.querySelector('use');
    await expect(useEl).toBeTruthy();
    await expect(useEl?.getAttribute('href')).toBe('/icons/sprite.svg#check');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. WITH LABEL
// ════════════════════════════════════════════════════════════════════════════

/**
 * Icon with an accessible label. When `label` is non-empty the component
 * adds `role="img"` and `aria-label` to the SVG so assistive technology
 * announces the icon with a meaningful description. Use this pattern for
 * standalone icons that convey information without accompanying visible text.
 */
export const WithLabel: Story = {
  args: {
    name: 'check',
    label: 'Check icon',
  },
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('hx-icon');
    await expect(icon).toBeTruthy();

    const svgPart = icon?.shadowRoot?.querySelector('[part="svg"]');
    await expect(svgPart).toBeTruthy();
    await expect(svgPart?.getAttribute('role')).toBe('img');
    await expect(svgPart?.getAttribute('aria-label')).toBe('Check icon');
    await expect(svgPart?.hasAttribute('aria-hidden')).toBe(false);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 4. DECORATIVE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Decorative icon with an empty `label`. When label is empty the component
 * applies `aria-hidden="true"` to the SVG so it is completely invisible to
 * assistive technology. Use this pattern when the icon is purely visual and
 * an adjacent text label already conveys the meaning.
 */
export const Decorative: Story = {
  args: {
    name: 'check',
    label: '',
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <hx-icon name=${args.name} hx-size=${args.size} label=""></hx-icon>
      <span>Decorative icon — hidden from screen readers</span>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('hx-icon');
    await expect(icon).toBeTruthy();

    const svgPart = icon?.shadowRoot?.querySelector('[part="svg"]');
    await expect(svgPart).toBeTruthy();
    await expect(svgPart?.getAttribute('aria-hidden')).toBe('true');
    await expect(svgPart?.hasAttribute('role')).toBe(false);
    await expect(svgPart?.hasAttribute('aria-label')).toBe(false);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5. SIZES
// ════════════════════════════════════════════════════════════════════════════

/**
 * All five size variants displayed side-by-side.
 * Sizes range from `xs` (compact inline use) to `xl` (hero or prominent UI
 * locations). The `--hx-icon-size` CSS custom property drives the rendered
 * dimensions at each tier.
 */
export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; align-items: flex-end; gap: 2rem; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon hx-size="xs" name="check" label="Check icon, extra small"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">xs</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon hx-size="sm" name="check" label="Check icon, small"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">sm</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon hx-size="md" name="check" label="Check icon, medium"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">md</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon hx-size="lg" name="check" label="Check icon, large"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">lg</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon hx-size="xl" name="check" label="Check icon, extra large"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">xl</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 6. COLOR VARIANTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates `--hx-icon-color` custom property and `currentColor` inheritance.
 * Icons inherit color from their parent context by default. Override with
 * `--hx-icon-color` for explicit control. Useful for status indicators,
 * branded icons, or icons that need to differ from surrounding text color.
 */
export const ColorVariants: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon name="check" hx-size="lg" label="Default color"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">currentColor</span>
      </div>
      <div
        style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: var(--hx-color-success, #16a34a);"
      >
        <hx-icon name="check" hx-size="lg" label="Success"></hx-icon>
        <span style="font-size: 0.75rem;">Inherited green</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon
          name="check"
          hx-size="lg"
          label="Explicit red"
          style="--hx-icon-color: var(--hx-color-error, #dc2626);"
        ></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">--hx-icon-color</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon
          name="check"
          hx-size="lg"
          label="Blue override"
          style="--hx-icon-color: var(--hx-color-info, #2563eb);"
        ></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">--hx-icon-color</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 7. ICON CATALOG
// ════════════════════════════════════════════════════════════════════════════

/**
 * Browseable catalog of common icon names for use with sprite mode.
 * These are representative names — the actual available icons depend on the
 * sprite sheet provided via `sprite-url`. In healthcare applications, icons
 * carry clinical significance (e.g., "warning" vs "error" vs "alert").
 *
 * Since `hx-icon` is sprite-source agnostic, icons will only render visually
 * when a matching sprite sheet is loaded. This catalog demonstrates the
 * naming pattern and layout.
 */
export const IconCatalog: Story = {
  render: () => {
    const iconNames = [
      'check',
      'close',
      'search',
      'home',
      'settings',
      'user',
      'heart',
      'star',
      'warning',
      'error',
      'info',
      'help',
      'edit',
      'delete',
      'add',
      'remove',
      'arrow-left',
      'arrow-right',
      'arrow-up',
      'arrow-down',
      'chevron-left',
      'chevron-right',
      'menu',
      'notifications',
    ];
    return html`
      <div
        style="display: grid; grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr)); gap: 1rem;"
      >
        ${iconNames.map(
          (name) => html`
            <div
              style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;"
            >
              <hx-icon name=${name} hx-size="lg" label=${name}></hx-icon>
              <span
                style="font-size: 0.625rem; color: #6b7280; text-align: center; word-break: break-all;"
                >${name}</span
              >
            </div>
          `,
        )}
      </div>
    `;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 8. INLINE SVG MODE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Inline SVG fetch mode via the `src` attribute.
 *
 * When `src` is set the component fetches the SVG file, sanitizes it
 * (removing `<script>` elements and `on*` event-handler attributes), and
 * renders the markup directly into the shadow root inside a `<span part="svg">`.
 * This mode takes precedence over sprite mode when both attributes are present.
 *
 * The data URI below encodes a minimal check-mark SVG so the story renders
 * without requiring a live network request. In production, `src` would point
 * to an absolute or relative URL served from a static asset path.
 */
export const InlineSvgMode: Story = {
  args: {
    // A data URI encodes a minimal inline check-mark SVG for static Storybook.
    // In production this would be a URL such as "/assets/icons/check.svg".
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E",
    name: '',
    spriteUrl: undefined,
    label: 'Check mark',
    size: 'lg',
  },
  render: (args) => html`
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <hx-icon src=${args.src ?? ''} hx-size=${args.size} label=${args.label}></hx-icon>
      <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">
        The <code>src</code> attribute triggers inline fetch mode. The SVG is fetched, sanitised,
        and embedded directly inside the shadow root. Script elements and event-handler attributes
        are stripped before rendering.
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('hx-icon');
    await expect(icon).toBeTruthy();
    await expect(icon?.getAttribute('src')).toBeTruthy();
  },
};
