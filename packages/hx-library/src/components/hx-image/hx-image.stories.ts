import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-image.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Image',
  component: 'hx-image',
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'The URL of the image to display.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    alt: {
      control: 'text',
      description:
        'Accessible description. Set to empty string for decorative images (applies role="presentation").',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    width: {
      control: 'text',
      description: 'Width of the image (number in px or CSS string).',
      table: {
        category: 'Layout',
        type: { summary: 'number | string' },
      },
    },
    height: {
      control: 'text',
      description: 'Height of the image (number in px or CSS string).',
      table: {
        category: 'Layout',
        type: { summary: 'number | string' },
      },
    },
    loading: {
      control: { type: 'select' },
      options: ['lazy', 'eager'],
      description: 'Loading strategy for the image.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'lazy' },
        type: { summary: "'lazy' | 'eager'" },
      },
    },
    fit: {
      control: { type: 'select' },
      options: [undefined, 'contain', 'cover', 'fill', 'none', 'scale-down'],
      description: 'How the image fills its container. Maps to CSS object-fit.',
      table: {
        category: 'Visual',
        type: { summary: "'contain' | 'cover' | 'fill' | 'none' | 'scale-down'" },
      },
    },
    ratio: {
      control: 'text',
      description: "CSS aspect-ratio value (e.g. '16/9', '1', '4/3').",
      table: {
        category: 'Layout',
        type: { summary: 'string' },
      },
    },
    rounded: {
      control: 'text',
      description:
        'Border radius. Boolean true uses the theme radius token; a string is used as a CSS value.',
      table: {
        category: 'Visual',
        type: { summary: 'boolean | string' },
      },
    },
    fallbackSrc: {
      name: 'fallback-src',
      control: 'text',
      description: 'Fallback image URL shown when the primary src fails to load.',
      table: {
        category: 'Behavior',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    src: 'https://picsum.photos/seed/helix/800/600',
    alt: 'A sample image',
    loading: 'lazy',
  },
  render: (args) => html`
    <hx-image
      src=${args.src}
      alt=${args.alt}
      loading=${args.loading}
      fit=${args.fit ?? ''}
      ratio=${args.ratio ?? ''}
      rounded=${args.rounded ?? ''}
      fallback-src=${args.fallbackSrc ?? ''}
      width=${args.width ?? ''}
      height=${args.height ?? ''}
      style="width: 400px;"
    ></hx-image>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ════════════════════════════════════════════════════════════════════════════
// 1. DEFAULT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Default image with alt text provided. Renders with lazy loading.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('hx-image');
    await expect(img).toBeTruthy();
    await expect(img?.getAttribute('alt')).toBe('A sample image');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. DECORATIVE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Decorative image with an empty alt string.
 * The inner img receives role="presentation" to suppress screen reader announcements.
 */
export const Decorative: Story = {
  args: {
    src: 'https://picsum.photos/seed/decorative/800/400',
    alt: '',
  },
  render: (args) => html`
    <hx-image
      src=${args.src}
      alt=${args.alt}
      style="width: 400px;"
    ></hx-image>
  `,
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('hx-image');
    await expect(img).toBeTruthy();
    const innerImg = img?.shadowRoot?.querySelector('img');
    await expect(innerImg?.getAttribute('role')).toBe('presentation');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. ASPECT RATIOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Common aspect ratios side-by-side: 16/9, 4/3, 1/1.
 */
export const AspectRatios: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 240px;">
        <hx-image
          src="https://picsum.photos/seed/a/480/270"
          alt="16:9 ratio"
          ratio="16/9"
          style="width: 240px;"
        ></hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">16/9</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 240px;">
        <hx-image
          src="https://picsum.photos/seed/b/480/360"
          alt="4:3 ratio"
          ratio="4/3"
          style="width: 240px;"
        ></hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">4/3</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 240px;">
        <hx-image
          src="https://picsum.photos/seed/c/480/480"
          alt="1:1 ratio"
          ratio="1"
          style="width: 240px;"
        ></hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">1/1</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 4. FIT MODES
// ════════════════════════════════════════════════════════════════════════════

/**
 * All object-fit modes demonstrated in a fixed-size container.
 */
export const FitModes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
      ${(['cover', 'contain', 'fill', 'none', 'scale-down'] as const).map(
        (fit) => html`
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <hx-image
              src="https://picsum.photos/seed/fit/300/200"
              alt=${`fit=${fit}`}
              fit=${fit}
              ratio="4/3"
              style="width: 180px; border: 1px solid #e5e7eb;"
            ></hx-image>
            <span style="font-size: 0.75rem; color: #6b7280;">${fit}</span>
          </div>
        `,
      )}
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 5. ROUNDED
// ════════════════════════════════════════════════════════════════════════════

/**
 * Border-radius variants: theme token (boolean), custom value, and full circle.
 */
export const Rounded: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <hx-image
          src="https://picsum.photos/seed/r1/400/400"
          alt="Rounded with theme token"
          ratio="1"
          rounded
          style="width: 160px;"
        ></hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">rounded (token)</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <hx-image
          src="https://picsum.photos/seed/r2/400/400"
          alt="Rounded with custom value"
          ratio="1"
          rounded="1rem"
          style="width: 160px;"
        ></hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">rounded="1rem"</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <hx-image
          src="https://picsum.photos/seed/r3/400/400"
          alt="Circular image"
          ratio="1"
          rounded="50%"
          style="width: 160px;"
        ></hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">rounded="50%"</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 6. FALLBACK
// ════════════════════════════════════════════════════════════════════════════

/**
 * Broken image with a fallback-src and a custom fallback slot.
 */
export const Fallback: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <hx-image
          src="https://broken.url/image.jpg"
          fallback-src="https://picsum.photos/seed/fallback/400/300"
          alt="Image with fallback src"
          ratio="4/3"
          style="width: 240px;"
        ></hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">fallback-src</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <hx-image
          src="https://broken.url/image2.jpg"
          alt="Image with custom fallback slot"
          ratio="4/3"
          style="width: 240px;"
        >
          <div
            slot="fallback"
            style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f3f4f6; color: #6b7280; font-size: 0.875rem;"
          >
            Image unavailable
          </div>
        </hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">fallback slot</span>
      </div>
    </div>
  `,
};
