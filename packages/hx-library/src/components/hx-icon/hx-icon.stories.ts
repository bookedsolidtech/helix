import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { registerIconLibrary, getBasePath } from '@helixui/icons';
import './hx-icon.js';

// Curated 32-glyph helix set names (mirrors @helixui/icons/dist/helix-names.json
// at the time of authoring). Listed inline so the story renders without an
// async fetch/import, and so designers can see the canonical set in source.
const HELIX_GLYPHS = [
  'arrow-down',
  'arrow-flat',
  'arrow-up',
  'calendar',
  'check',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'chevrons-left',
  'chevrons-right',
  'clock',
  'close',
  'copy',
  'dash',
  'dot',
  'ellipsis',
  'error',
  'external-link',
  'eye',
  'eye-off',
  'file',
  'info',
  'lock',
  'menu',
  'plus',
  'star-filled',
  'star-outline',
  'success',
  'trash',
  'upload',
  'warning',
];

// Representative subset of FA Free Solid (2000-glyph set). Rendering all
// 2000 in one story would crash the autodocs panel; this sample covers the
// common UI categories so the gallery is useful without being abusive.
const FA_FREE_SAMPLE = [
  'address-book',
  'bell',
  'bookmark',
  'calendar',
  'chart-line',
  'circle-check',
  'circle-exclamation',
  'circle-info',
  'circle-question',
  'circle-xmark',
  'clipboard',
  'clock',
  'cloud',
  'comment',
  'envelope',
  'eye',
  'file',
  'filter',
  'gear',
  'heart',
  'house',
  'magnifying-glass',
  'pen',
  'star',
  'trash',
  'user',
];

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
    library: 'helix',
    src: undefined,
    spriteUrl: undefined,
    size: 'md',
    label: '',
  },
  render: (args) => html`
    <hx-icon
      name=${args.name}
      library=${args.library}
      src=${ifDefined(args.src)}
      sprite-url=${ifDefined(args.spriteUrl)}
      hx-size=${args.size}
      label=${args.label}
    ></hx-icon>
  `,
  decorators: [
    (story) => html`
      <div
        style="display: inline-flex; align-items: center; gap: 1rem; padding: 1.5rem 2rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #f9fafb; min-width: 14rem; font: 0.875rem system-ui, sans-serif;"
      >
        ${story()}
        <span style="color: #4b5563;">hx-icon</span>
      </div>
    `,
  ],
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
      <hx-icon library="helix" name=${args.name} hx-size=${args.size} label=""></hx-icon>
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
        <hx-icon library="helix" hx-size="xs" name="check" label="Check icon, extra small"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">xs</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon library="helix" hx-size="sm" name="check" label="Check icon, small"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">sm</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon library="helix" hx-size="md" name="check" label="Check icon, medium"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">md</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon library="helix" hx-size="lg" name="check" label="Check icon, large"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">lg</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon library="helix" hx-size="xl" name="check" label="Check icon, extra large"></hx-icon>
        <span style="font-size: 0.75rem; color: #6b7280;">xl</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 6. INLINE SVG MODE
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

export const DarkMode: Story = {
  decorators: [(story) => html`<hx-theme mode="dark" style="display: block; padding: 1rem;">${story()}</hx-theme>`],
  args: {
    name: 'check',
    src: undefined,
    spriteUrl: undefined,
    label: '',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 8. LIBRARY: HELIX
// ════════════════════════════════════════════════════════════════════════════

/**
 * The curated 32-glyph `helix` icon library, resolved through the
 * `@helixui/icons` registry. Each tile renders `<hx-icon library="helix"
 * name="…">` and exposes the glyph id beneath the icon. Use these glyphs
 * for HELiX-internal patterns where consistency with the design system is
 * required (form indicators, navigation chevrons, status states). Phase 5
 * migrates internal components (hx-checkbox checkmark, hx-alert close, etc.)
 * onto these names so consumers can override the entire HELiX glyph surface
 * by re-registering `helix` as a custom library.
 */
export const LibraryHelix: Story = {
  name: 'Library: helix',
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; padding: 1rem;"
    >
      ${HELIX_GLYPHS.map(
        (name) => html`
          <div
            style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--hx-color-border-default, #e5e7eb); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-surface-default, #ffffff);"
          >
            <hx-icon library="helix" name=${name} hx-size="lg" label=${name}></hx-icon>
            <code
              style="font-size: 0.75rem; color: var(--hx-color-text-secondary, #6b7280); text-align: center; word-break: break-word;"
              >${name}</code
            >
          </div>
        `,
      )}
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 9. LIBRARY: FA-FREE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Representative slice of the bundled `fa-free` library (FA Free Solid,
 * CC BY 4.0). The full set ships 2000 glyphs at
 * `@helixui/icons/dist/fa-free-solid.svg`; this story shows a curated 26-glyph
 * sample covering the most common UI categories. Use the controls panel on the
 * Default story to render any FA Free Solid name.
 */
export const LibraryFaFree: Story = {
  name: 'Library: fa-free',
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; padding: 1rem;"
    >
      ${FA_FREE_SAMPLE.map(
        (name) => html`
          <div
            style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--hx-color-border-default, #e5e7eb); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-surface-default, #ffffff);"
          >
            <hx-icon library="fa-free" name=${name} hx-size="lg" label=${name}></hx-icon>
            <code
              style="font-size: 0.75rem; color: var(--hx-color-text-secondary, #6b7280); text-align: center; word-break: break-word;"
              >${name}</code
            >
          </div>
        `,
      )}
    </div>
  `,
};

// Representative subset of the bundled `feather` library (287 glyphs, MIT).
// Feather is a stroke/outline set; these names cover the common UI categories
// so the gallery demonstrates the stroke-paint look without rendering all 287.
const FEATHER_SAMPLE = [
  'activity',
  'home',
  'settings',
  'heart',
  'search',
  'bell',
  'calendar',
  'check',
  'clock',
  'edit',
  'eye',
  'file',
  'mail',
  'star',
  'trash-2',
  'user',
];

// Representative subset of the bundled `lucide` library (~1986 glyphs, ISC).
// Lucide is a stroke/outline set (a community fork of Feather); the shared
// base names below render identically against the lucide sprite so the two
// galleries read as a like-for-like comparison.
const LUCIDE_SAMPLE = [
  'activity',
  'home',
  'settings',
  'heart',
  'search',
  'bell',
  'calendar',
  'check',
  'clock',
  'pencil',
  'eye',
  'file',
  'mail',
  'star',
  'trash-2',
  'user',
];

// ════════════════════════════════════════════════════════════════════════════
// 10. CUSTOM LIBRARY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Pattern for registering a consumer library at runtime via
 * `registerIconLibrary()`. The story registers a one-off library named
 * `story-demo` whose resolver returns a tiny inline SVG via a `data:` URI.
 * Real consumer libraries typically resolve to a CDN URL or a sprite sheet
 * served by the host application.
 */
export const CustomLibrary: Story = {
  name: 'Custom library',
  render: () => {
    // Register on first render. Idempotent — subsequent registrations
    // overwrite the previous entry, which is Shoelace-compatible behaviour.
    // Demo of registering a custom library that aliases a name into the
    // bundled helix sprite. Re-uses the locally-served helix sprite so the
    // story renders without a network round-trip and without relying on
    // hx-icon's data:-URI sanitizer (which blocks data: URIs by design).
    registerIconLibrary('story-demo', {
      resolver: () => `${getBasePath()}/helix.svg#dot`,
      spriteSheet: true,
      paintMode: 'fill',
    });
    return html`
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 1rem;">
        <div style="display: flex; gap: 1rem; align-items: center;">
          <hx-icon library="story-demo" name="anything" hx-size="xl" label="Demo"></hx-icon>
          <code style="font-size: 0.875rem;"
            >&lt;hx-icon library="story-demo" name="anything"&gt;</code
          >
        </div>
        <p style="font-size: 0.875rem; color: #6b7280; max-width: 60ch; margin: 0;">
          Consumer libraries register through
          <code>registerIconLibrary(name, options)</code> from
          <code>@helixui/icons</code>. The resolver maps an icon name to a sprite href or a
          standalone SVG URL; an optional <code>mutator</code> runs after the component's built-in
          security sanitization and lets you rewrite attributes (e.g. force <code>fill</code> to
          <code>currentColor</code>). Current registry base path:
          <code>${getBasePath()}</code>.
        </p>
      </div>
    `;
  },
};

// ─────────────────────────────────────────────────
// KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  name: 'Keyboard Navigation',
  render: () => html`
    <div style="padding: 1rem;">
      <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">
        This component is presentational. It exposes no interactive keyboard targets of its own.
        Screen readers will encounter it in the reading order and announce its content.
      </p>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 11. LIBRARY: FEATHER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Representative slice of the bundled `feather` library (Feather Icons, MIT).
 * The full set ships 287 glyphs at `@helixui/icons/dist/feather.svg`; this story
 * shows a curated 16-glyph sample. Unlike `helix`/`fa-free` (fill libraries),
 * Feather is registered with `paintMode: 'stroke'`, so `<hx-icon>` renders the
 * geometry with `fill: none; stroke: currentColor` and the round line caps/joins
 * that give outline icons their look. The stroke width is driven by the
 * `--hx-icon-stroke-width` token (default `2`) — see the
 * `Library: feather (stroke-width)` story for an override. Use the controls panel
 * on the Default story with `library="feather"` to render any Feather name.
 */
export const LibraryFeather: Story = {
  name: 'Library: feather',
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; padding: 1rem;"
    >
      ${FEATHER_SAMPLE.map(
        (name) => html`
          <div
            style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--hx-color-border-default, #e5e7eb); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-surface-default, #ffffff);"
          >
            <hx-icon library="feather" name=${name} hx-size="lg" label=${name}></hx-icon>
            <code
              style="font-size: 0.75rem; color: var(--hx-color-text-secondary, #6b7280); text-align: center; word-break: break-word;"
              >${name}</code
            >
          </div>
        `,
      )}
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 12. LIBRARY: FEATHER — STROKE-WIDTH TOKEN
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates the `--hx-icon-stroke-width` token on a stroke-paint library.
 * The token only takes effect for libraries registered with `paintMode: 'stroke'`
 * (`feather`, `lucide`); fill libraries ignore it. Each tile sets the token via an
 * inline style on the host so consumers can see the visual weight shift from a
 * hairline `1` through the default `2` up to a heavy `3`. Override it at any
 * cascade level (`:root`, a wrapper, or the element) to tune outline weight to a
 * brand or density target.
 */
export const LibraryFeatherStrokeWidth: Story = {
  name: 'Library: feather (stroke-width)',
  render: () => html`
    <div style="display: flex; align-items: flex-end; gap: 2.5rem; flex-wrap: wrap; padding: 1rem;">
      ${[
        { width: '1', label: 'thin (1)' },
        { width: '2', label: 'default (2)' },
        { width: '3', label: 'heavy (3)' },
      ].map(
        ({ width, label }) => html`
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <hx-icon
              library="feather"
              name="activity"
              hx-size="xl"
              label="Activity, stroke width ${width}"
              style="--hx-icon-stroke-width: ${width};"
            ></hx-icon>
            <code style="font-size: 0.75rem; color: var(--hx-color-text-secondary, #6b7280);"
              >${label}</code
            >
          </div>
        `,
      )}
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 13. LIBRARY: LUCIDE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Representative slice of the bundled `lucide` library (Lucide Icons, ISC).
 * The full set ships ~1986 glyphs at `@helixui/icons/dist/lucide.svg`; this story
 * shows a curated 16-glyph sample. Lucide is a community fork of Feather and is
 * likewise registered with `paintMode: 'stroke'`, so the glyphs render with
 * `fill: none; stroke: currentColor`. The shared base names mirror the Feather
 * gallery so the two read as a like-for-like comparison; the
 * `--hx-icon-stroke-width` token applies here identically. Use the controls panel
 * on the Default story with `library="lucide"` to render any Lucide name.
 */
export const LibraryLucide: Story = {
  name: 'Library: lucide',
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; padding: 1rem;"
    >
      ${LUCIDE_SAMPLE.map(
        (name) => html`
          <div
            style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--hx-color-border-default, #e5e7eb); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-surface-default, #ffffff);"
          >
            <hx-icon library="lucide" name=${name} hx-size="lg" label=${name}></hx-icon>
            <code
              style="font-size: 0.75rem; color: var(--hx-color-text-secondary, #6b7280); text-align: center; word-break: break-word;"
              >${name}</code
            >
          </div>
        `,
      )}
    </div>
  `,
};
