import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-avatar.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Avatar',
  component: 'hx-avatar',
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Image URL. When provided and loaded successfully, displays the image.',
      table: {
        category: 'Content',
        defaultValue: { summary: 'undefined' },
        type: { summary: 'string | undefined' },
      },
    },
    alt: {
      control: 'text',
      description: 'Accessible label for the image or avatar.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    initials: {
      control: 'text',
      description:
        'Fallback initials text displayed when no image is available. Up to 2–3 characters recommended.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    size: {
      name: 'hx-size',
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size variant controlling the width and height of the avatar.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
      },
    },
    shape: {
      control: { type: 'select' },
      options: ['circle', 'square'],
      description:
        'Shape variant. Circle uses 50% border-radius; square uses the theme radius token.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'circle' },
        type: { summary: "'circle' | 'square'" },
      },
    },
  },
  args: {
    src: undefined,
    alt: '',
    initials: '',
    size: 'md',
    shape: 'circle',
  },
  render: (args) => html`
    <hx-avatar
      src=${args.src ?? ''}
      alt=${args.alt}
      initials=${args.initials}
      hx-size=${args.size}
      shape=${args.shape}
    ></hx-avatar>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ════════════════════════════════════════════════════════════════════════════
// 1. DEFAULT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Default state with no src or initials. The fallback icon (person silhouette) is rendered.
 * This is the baseline rendering for an unresolved or anonymous user entity.
 */
export const Default: Story = {
  args: {
    src: undefined,
    initials: '',
    alt: 'Anonymous user',
  },
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector('hx-avatar');
    await expect(avatar).toBeTruthy();

    const shadowDiv = avatar?.shadowRoot?.querySelector('[part="avatar"]');
    await expect(shadowDiv).toBeTruthy();
    await expect(shadowDiv?.classList.contains('avatar--md')).toBe(true);
    await expect(shadowDiv?.classList.contains('avatar--circle')).toBe(true);

    const fallbackIcon = avatar?.shadowRoot?.querySelector('[part="fallback-icon"]');
    await expect(fallbackIcon).toBeTruthy();
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. WITH IMAGE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Avatar displaying a loaded image via the `src` attribute.
 * In healthcare contexts this may be a clinician or patient photo.
 */
export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'Dr. Jane Smith',
    initials: 'JS',
  },
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector('hx-avatar');
    await expect(avatar).toBeTruthy();
    await expect(avatar?.getAttribute('src')).toBe('https://i.pravatar.cc/150?img=1');
    await expect(avatar?.getAttribute('alt')).toBe('Dr. Jane Smith');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. WITH INITIALS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Avatar displaying user initials as the primary identifier when no image src is set.
 * Useful for users without a profile photo, common in enterprise healthcare workflows.
 */
export const WithInitials: Story = {
  args: {
    src: undefined,
    initials: 'JD',
    alt: 'John Doe',
  },
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector('hx-avatar');
    await expect(avatar).toBeTruthy();

    const initialsEl = avatar?.shadowRoot?.querySelector('[part="initials"]');
    await expect(initialsEl).toBeTruthy();
    await expect(initialsEl?.textContent?.trim()).toBe('JD');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 4. SIZES
// ════════════════════════════════════════════════════════════════════════════

/**
 * All five size variants displayed side-by-side.
 * Sizes range from `xs` (compact list views) to `xl` (profile headers).
 */
export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar hx-size="xs" initials="XS"></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">xs</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar hx-size="sm" initials="SM"></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">sm</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar hx-size="md" initials="MD"></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">md</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar hx-size="lg" initials="LG"></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">lg</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar hx-size="xl" initials="XL"></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">xl</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 5. SHAPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Circle versus square shape comparison at `lg` size.
 * Circle is the default; square is appropriate for icon-style or system avatars.
 */
export const Shapes: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: 2rem;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar hx-size="lg" shape="circle" initials="RN"></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">circle</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar hx-size="lg" shape="square" initials="RN"></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">square</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 6. WITH BADGE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Avatar with a status indicator slotted into the `badge` slot.
 * The badge is positioned at the bottom-right of the avatar container.
 * Common in healthcare UIs to indicate clinician availability or patient alert status.
 */
export const WithBadge: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=5',
    alt: 'Dr. Maria Chen',
    initials: 'MC',
    size: 'lg',
  },
  render: (args) => html`
    <hx-avatar
      src=${args.src ?? ''}
      alt=${args.alt}
      initials=${args.initials}
      hx-size=${args.size}
      shape=${args.shape}
    >
      <span
        slot="badge"
        style="
          display: inline-block;
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
          background-color: #22c55e;
          border: 2px solid #ffffff;
        "
        aria-label="Online"
      ></span>
    </hx-avatar>
  `,
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector('hx-avatar');
    await expect(avatar).toBeTruthy();

    const badgeSlotContent = canvasElement.querySelector('[slot="badge"]');
    await expect(badgeSlotContent).toBeTruthy();
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 7. FALLBACK CHAIN
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates the three-tier fallback chain side-by-side:
 * 1. Image loaded successfully
 * 2. Initials shown when no valid src is provided
 * 3. Generic person icon shown when neither src nor initials are set
 *
 * The image-error scenario (src set but broken) resolves to initials when initials
 * are also present, otherwise falls back to the icon.
 */
export const FallbackChain: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar
          hx-size="lg"
          src="https://i.pravatar.cc/150?img=3"
          alt="User with image"
          initials="AB"
        ></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">Image loaded</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar hx-size="lg" initials="AB" alt="User with initials"></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">Initials fallback</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-avatar hx-size="lg" alt="Anonymous user"></hx-avatar>
        <span style="font-size: 0.75rem; color: #6b7280;">Icon fallback</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 8. SLOTTED CONTENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Avatar with fully custom content placed into the default slot.
 * When slotted content is present it overrides the src/initials rendering path entirely.
 * The component removes its `role="img"` and `aria-label` when a slot is filled,
 * delegating accessibility semantics to the slotted content.
 */
export const SlottedContent: Story = {
  render: () => html`
    <hx-avatar hx-size="lg" shape="square">
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-label="System avatar"
        role="img"
        style="width: 60%; height: 60%;"
      >
        <path
          d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"
        />
      </svg>
    </hx-avatar>
  `,
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector('hx-avatar');
    await expect(avatar).toBeTruthy();

    const slottedSvg = canvasElement.querySelector('svg');
    await expect(slottedSvg).toBeTruthy();
  },
};
