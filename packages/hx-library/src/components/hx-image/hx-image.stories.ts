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
      description: 'Accessible description. Required for informative images.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    decorative: {
      control: 'boolean',
      description:
        'Marks image as decorative (role="presentation", alt=""). Use for background/ornamental images.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
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
        'Border radius. Set to "" (boolean attribute) for theme token; a string for custom CSS value.',
      table: {
        category: 'Visual',
        type: { summary: 'string' },
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
    srcset: {
      control: 'text',
      description: 'Responsive image source set. Passed to the img srcset attribute.',
      table: {
        category: 'Responsive',
        type: { summary: 'string' },
      },
    },
    sizes: {
      control: 'text',
      description: 'Responsive image sizes descriptor. Passed to the img sizes attribute.',
      table: {
        category: 'Responsive',
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
      ?decorative=${args.decorative}
      fit=${args.fit ?? ''}
      ratio=${args.ratio ?? ''}
      rounded=${args.rounded ?? ''}
      fallback-src=${args.fallbackSrc ?? ''}
      srcset=${args.srcset ?? ''}
      sizes=${args.sizes ?? ''}
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
    await expect(img?.src).toBe('https://picsum.photos/seed/helix/800/600');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. DECORATIVE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Decorative image using the `decorative` prop.
 * The inner img receives role="presentation" and aria-hidden="true"
 * to suppress screen reader announcements.
 */
export const Decorative: Story = {
  args: {
    src: 'https://picsum.photos/seed/decorative/800/400',
    alt: '',
    decorative: true,
  },
  render: (args) => html` <hx-image src=${args.src} decorative style="width: 400px;"></hx-image> `,
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('hx-image');
    await expect(img).toBeTruthy();
    const innerImg = img?.shadowRoot?.querySelector('img');
    await expect(innerImg?.getAttribute('role')).toBe('presentation');
    await expect(innerImg?.getAttribute('alt')).toBe('');
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

// ════════════════════════════════════════════════════════════════════════════
// 7. LAZY LOADING
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates lazy vs eager loading. The lazy image defers loading until
 * it enters the viewport. The eager image loads immediately.
 */
export const LazyLoading: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 240px;">
        <hx-image
          src="https://picsum.photos/seed/lazy/480/360"
          alt="Lazy loaded image"
          loading="lazy"
          ratio="4/3"
          style="width: 240px;"
        ></hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">loading="lazy" (default)</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 240px;">
        <hx-image
          src="https://picsum.photos/seed/eager/480/360"
          alt="Eagerly loaded image"
          loading="eager"
          ratio="4/3"
          style="width: 240px;"
        ></hx-image>
        <span style="font-size: 0.75rem; color: #6b7280;">loading="eager"</span>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const images = canvasElement.querySelectorAll('hx-image');
    const lazyImg = images[0]?.shadowRoot?.querySelector('img');
    const eagerImg = images[1]?.shadowRoot?.querySelector('img');
    await expect(lazyImg?.getAttribute('loading')).toBe('lazy');
    await expect(eagerImg?.getAttribute('loading')).toBe('eager');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 8. RESPONSIVE (srcset/sizes)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Responsive image with srcset and sizes for Drupal-compatible responsive image output.
 */
export const Responsive: Story = {
  render: () => html`
    <hx-image
      src="https://picsum.photos/seed/responsive/800/600"
      srcset="https://picsum.photos/seed/responsive/400/300 400w, https://picsum.photos/seed/responsive/800/600 800w, https://picsum.photos/seed/responsive/1200/900 1200w"
      sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px"
      alt="Responsive image with srcset"
      ratio="4/3"
      style="max-width: 100%;"
    ></hx-image>
  `,
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('hx-image');
    const innerImg = img?.shadowRoot?.querySelector('img');
    await expect(innerImg?.hasAttribute('srcset')).toBe(true);
    await expect(innerImg?.hasAttribute('sizes')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 9. CAPTION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Image with a caption slot. Wraps the image in a `<figure>` with `<figcaption>`.
 */
export const WithCaption: Story = {
  render: () => html`
    <hx-image
      src="https://picsum.photos/seed/caption/800/500"
      alt="Patient care facility"
      ratio="16/9"
      style="max-width: 500px;"
    >
      <span slot="caption">Figure 1: Main reception area of the healthcare facility.</span>
    </hx-image>
  `,
};
