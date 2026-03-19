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
        'Accessible description. Required for informative images. Use the `decorative` prop for decorative images.',
      table: {
        category: 'Accessibility',
        type: { summary: 'string' },
      },
    },
    decorative: {
      control: 'boolean',
      description:
        'Marks the image as decorative. Use instead of alt="" to make intent explicit. Applies role="presentation" and alt="" to the inner img.',
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
    srcset: {
      control: 'text',
      description:
        'Comma-separated list of image candidates for responsive images (srcset attribute).',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
    sizes: {
      control: 'text',
      description: 'Media conditions for responsive image selection. Used alongside srcset.',
      table: {
        category: 'Content',
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
      alt=${args.alt ?? ''}
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
    // Check the Lit property directly — alt is a reflected property but we read it
    // as a DOM property to avoid dependence on attribute serialization behavior.
    await expect(img?.alt).toBe('A sample image');
    const innerImg = img?.shadowRoot?.querySelector('img');
    await expect(innerImg?.getAttribute('alt')).toBe('A sample image');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. DECORATIVE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Decorative image using the explicit `decorative` prop.
 * The inner img receives role="presentation" to suppress screen reader announcements.
 * Prefer `decorative` over `alt=""` to make decorative intent explicit in markup.
 */
export const Decorative: Story = {
  args: {
    src: 'https://picsum.photos/seed/decorative/800/400',
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
// 7. CAPTION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Image with a caption using the named `caption` slot.
 * The caption is rendered in a semantic figcaption element.
 */
export const WithCaption: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
      <div style="width: 300px;">
        <hx-image
          src="https://picsum.photos/seed/caption/600/400"
          alt="Healthcare facility entrance"
          ratio="3/2"
          style="width: 300px;"
        >
          <span slot="caption">Healthcare facility entrance, 2024.</span>
        </hx-image>
      </div>
      <div style="width: 300px;">
        <hx-image
          src="https://picsum.photos/seed/caption2/600/400"
          alt="Medical team in consultation"
          ratio="3/2"
          rounded="0.5rem"
          style="width: 300px;"
        >
          <span slot="caption"
            >Medical team in consultation — <em>Photo courtesy of Helix Health.</em></span
          >
        </hx-image>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 8. LAZY LOADING DEMO
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates lazy vs eager loading strategies.
 * The `loading` attribute controls when the browser fetches the image resource.
 * Use `lazy` for below-the-fold images (default) and `eager` for above-the-fold hero images.
 */
export const LazyLoading: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 260px;">
        <hx-image
          src="https://picsum.photos/seed/lazy/520/390"
          alt="Lazy-loaded image"
          loading="lazy"
          ratio="4/3"
          style="width: 260px;"
        ></hx-image>
        <code style="font-size: 0.75rem;">loading="lazy"</code>
        <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">
          Deferred until near viewport. Default behavior. Ideal for below-the-fold images.
        </p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 260px;">
        <hx-image
          src="https://picsum.photos/seed/eager/520/390"
          alt="Eagerly-loaded image"
          loading="eager"
          ratio="4/3"
          style="width: 260px;"
        ></hx-image>
        <code style="font-size: 0.75rem;">loading="eager"</code>
        <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">
          Fetched immediately. Use for hero images and above-the-fold content.
        </p>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const imgs = canvasElement.querySelectorAll('hx-image');
    const [lazyImg, eagerImg] = Array.from(imgs);
    const lazyInner = lazyImg?.shadowRoot?.querySelector('img');
    const eagerInner = eagerImg?.shadowRoot?.querySelector('img');
    await expect(lazyInner?.getAttribute('loading')).toBe('lazy');
    await expect(eagerInner?.getAttribute('loading')).toBe('eager');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 9. RESPONSIVE (srcset / sizes)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Responsive image using `srcset` and `sizes` — the Drupal-native pattern.
 * The browser selects the best candidate based on viewport width and device pixel ratio.
 * This enables Drupal responsive image styles without bypassing the component.
 */
export const Responsive: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 600px;">
      <hx-image
        src="https://picsum.photos/seed/resp/800/600"
        srcset="https://picsum.photos/seed/resp/400/300 400w, https://picsum.photos/seed/resp/800/600 800w, https://picsum.photos/seed/resp/1200/900 1200w"
        sizes="(max-width: 400px) 100vw, (max-width: 800px) 50vw, 400px"
        alt="Responsive image — browser selects optimal size"
        ratio="4/3"
        style="width: 100%;"
      ></hx-image>
      <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">
        Browser selects from 400w, 800w, or 1200w candidates based on viewport and device pixel
        ratio.
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('hx-image');
    const innerImg = img?.shadowRoot?.querySelector('img');
    await expect(innerImg?.getAttribute('srcset')).toContain('400w');
    await expect(innerImg?.getAttribute('sizes')).toContain('max-width');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 10. EVENTS DEMO — hx-load, hx-error
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates the `hx-load` event dispatched when an image loads successfully,
 * and the `hx-error` event dispatched when an image fails to load.
 * Use these events to track loading state, trigger analytics, or show custom feedback.
 */
export const LoadEventDemo: Story = {
  name: 'Events: hx-load',
  render: () => html`
    <div>
      <hx-image
        id="load-demo"
        src="https://picsum.photos/seed/event-load/400/300"
        alt="Image that fires hx-load on success"
        ratio="4/3"
        style="width: 300px;"
      ></hx-image>
      <p
        id="load-event-output"
        style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280; font-family: sans-serif;"
      >
        The hx-load event fires when the image loads successfully.
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('hx-image');
    await expect(img).toBeTruthy();

    let loadFired = false;
    img!.addEventListener('hx-load', () => {
      loadFired = true;
    });

    // Trigger load by setting src on the inner img (the image may already be cached)
    const innerImg = img!.shadowRoot!.querySelector('img');
    await expect(innerImg).toBeTruthy();

    // Dispatch a synthetic load event on the inner img to verify the component
    // re-emits it as hx-load — this tests the event wiring without network dependency.
    innerImg!.dispatchEvent(new Event('load'));

    await expect(loadFired).toBe(true);
  },
};

/**
 * Demonstrates the `hx-error` event dispatched when an image fails to load.
 * The component shows the fallback slot content and fires `hx-error`.
 * Use this to show custom error UI or log load failures.
 */
export const ErrorEventDemo: Story = {
  name: 'Events: hx-error',
  render: () => html`
    <div>
      <hx-image
        id="error-demo"
        src="https://broken.url/nonexistent-image.jpg"
        alt="Image that fires hx-error on failure"
        ratio="4/3"
        style="width: 300px;"
      >
        <div
          slot="fallback"
          style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #fef2f2; color: #991b1b; font-size: 0.875rem; font-family: sans-serif;"
        >
          Image failed to load
        </div>
      </hx-image>
      <p
        id="error-event-output"
        style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280; font-family: sans-serif;"
      >
        The hx-error event fires when the image URL cannot be resolved.
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('hx-image');
    await expect(img).toBeTruthy();

    let errorFired = false;
    img!.addEventListener('hx-error', () => {
      errorFired = true;
    });

    // Dispatch a synthetic error event on the inner img to verify event wiring
    // without depending on a real network failure timing.
    const innerImg = img!.shadowRoot?.querySelector('img');
    if (innerImg) {
      innerImg.dispatchEvent(new Event('error'));
    }

    await expect(errorFired).toBe(true);
  },
};
