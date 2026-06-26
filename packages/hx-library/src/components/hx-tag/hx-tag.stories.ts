import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, userEvent } from 'storybook/test';
import './hx-tag.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Tag',
  component: 'hx-tag',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'primary', 'success', 'warning', 'danger'],
      description: 'Visual style variant that determines the tag color scheme.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'primary' | 'success' | 'warning' | 'danger'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Controls the font size and padding of the tag. **Storybook controls bind to the `size` property name**, but the HTML attribute is `hx-size` (e.g. `<hx-tag hx-size="sm">`). Use `hx-size` in Twig templates and raw HTML.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    pill: {
      control: 'boolean',
      description: 'Applies fully rounded (pill) border-radius styling.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    removable: {
      control: 'boolean',
      description: 'Renders a dismiss button. Fires hx-remove when clicked.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables interactions on the tag.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    labelRemove: {
      control: 'text',
      description:
        'Accessible name for the remove button (shown when `removable`). Bind to the `label-remove` attribute for i18n. Use the `{label}` placeholder to interpolate the tag text — e.g. `Quitar {label}`. Without a placeholder the value is used verbatim. When unset, defaults to `Remove <tag text>`.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'Remove <label>' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'default',
    size: 'md',
    pill: false,
    removable: false,
    disabled: false,
    labelRemove: '',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <hx-tag
      variant=${args.variant}
      hx-size=${args.size}
      ?pill=${args.pill}
      ?removable=${args.removable}
      ?disabled=${args.disabled}
      label-remove=${ifDefined(args.labelRemove || undefined)}
    >
      Healthcare
    </hx-tag>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag variant="default">Default</hx-tag>
      <hx-tag variant="primary">Primary</hx-tag>
      <hx-tag variant="success">Success</hx-tag>
      <hx-tag variant="warning">Warning</hx-tag>
      <hx-tag variant="danger">Danger</hx-tag>
    </div>
  `,
};

export const AllSizes: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;align-items:center;">
      <hx-tag hx-size="sm">Small</hx-tag>
      <hx-tag hx-size="md">Medium</hx-tag>
      <hx-tag hx-size="lg">Large</hx-tag>
    </div>
  `,
};

export const Pill: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag pill variant="default">Default</hx-tag>
      <hx-tag pill variant="primary">Primary</hx-tag>
      <hx-tag pill variant="success">Success</hx-tag>
      <hx-tag pill variant="warning">Warning</hx-tag>
      <hx-tag pill variant="danger">Danger</hx-tag>
    </div>
  `,
};

export const Removable: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag removable variant="default">Default</hx-tag>
      <hx-tag removable variant="primary">Primary</hx-tag>
      <hx-tag removable variant="success">Success</hx-tag>
      <hx-tag removable variant="warning">Warning</hx-tag>
      <hx-tag removable variant="danger">Danger</hx-tag>
    </div>
  `,
};

/**
 * The remove button's accessible name is localizable via the `label-remove`
 * attribute. Use the `{label}` placeholder to interpolate the tag text
 * (`Quitar {label}` → "Quitar Cardiology"), or pass a fixed string to use it
 * verbatim. When unset, the name defaults to `Remove <tag text>`. Inspect each
 * button with a screen reader or the accessibility panel to hear the localized
 * name.
 */
export const RemovableLocalized: Story = {
  name: 'Removable (localized remove label)',
  render: () => html`
    <div style="display:flex;gap:var(--hx-space-2, 0.5rem);flex-wrap:wrap;align-items:center;">
      <hx-tag removable label-remove="Quitar {label}">Cardiología</hx-tag>
      <hx-tag removable label-remove="Entfernen {label}" variant="primary">Kardiologie</hx-tag>
      <hx-tag removable label-remove="Retirer {label}" variant="success">Cardiologie</hx-tag>
      <hx-tag removable label-remove="Dismiss" variant="warning">Verbatim label</hx-tag>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tags = canvasElement.querySelectorAll('hx-tag');
    const first = tags[0].shadowRoot?.querySelector('[part="remove-button"]');
    // {label} placeholder is interpolated with the tag text.
    await expect(first?.getAttribute('aria-label')).toBe('Quitar Cardiología');
    // A value without {label} is used verbatim (tag text not appended).
    const verbatim = tags[3].shadowRoot?.querySelector('[part="remove-button"]');
    await expect(verbatim?.getAttribute('aria-label')).toBe('Dismiss');
  },
};

export const Disabled: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag disabled>Disabled</hx-tag>
      <hx-tag disabled removable>Disabled Removable</hx-tag>
      <hx-tag disabled variant="primary">Disabled Primary</hx-tag>
    </div>
  `,
};

export const WithPrefix: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag variant="primary">
        <span slot="prefix">★</span>
        Featured
      </hx-tag>
      <hx-tag variant="success" removable>
        <span slot="prefix">✓</span>
        Verified
      </hx-tag>
    </div>
  `,
};

export const WithSuffix: Story = {
  render: () => html`
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
      <hx-tag variant="default">
        Category
        <span slot="suffix">42</span>
      </hx-tag>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;gap:1rem;align-items:center;">
      ${(['sm', 'md', 'lg'] as const).map(
        (size) => html`
          <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:center;">
            <hx-tag hx-size=${size}>${size}</hx-tag>
            <hx-tag hx-size=${size} variant="primary" removable>${size}</hx-tag>
            <hx-tag hx-size=${size} pill variant="success">${size}</hx-tag>
          </div>
        `,
      )}
    </div>
  `,
};

export const RemovableInteractive: Story = {
  render: () => html`
    <div
      style="display:flex;gap:0.5rem;flex-wrap:wrap;"
      @hx-remove=${(e: Event) => (e.target as HTMLElement).remove()}
    >
      <hx-tag removable>Healthcare</hx-tag>
      <hx-tag removable>Cardiology</hx-tag>
      <hx-tag removable>Oncology</hx-tag>
      <hx-tag removable>Neurology</hx-tag>
    </div>
  `,
  play: async ({ canvasElement }) => {
    // Verify all four tags rendered
    const tags = canvasElement.querySelectorAll('hx-tag');
    await expect(tags.length).toBe(4);

    // Each tag must have a remove button inside shadow DOM
    const firstTag = tags[0];
    await expect(firstTag).toBeTruthy();
    const removeButton =
      firstTag.shadowRoot?.querySelector<HTMLButtonElement>('[part="remove-button"]');
    await expect(removeButton).toBeTruthy();

    // First confirm the remove button is keyboard-reachable. A regression
    // like `tabindex="-1"` on the button, an `inert` ancestor, or a CSS
    // `display: none` would hide this behavior — asserting the positive
    // tabindex characteristics here keeps the story honest as a "keyboard
    // user can dismiss a tag" smoke test. `tabIndex` reflects the effective
    // tab order: default for a <button> is 0, anything negative means the
    // button has been removed from sequential keyboard navigation.
    await expect(removeButton!.tabIndex).toBeGreaterThanOrEqual(0);
    await expect(removeButton!.hasAttribute('disabled')).toBe(false);

    // Focus the remove button directly. Relying on userEvent.tab() from the
    // canvas body is non-deterministic in Storybook's iframe runner because
    // the initial activeElement is not guaranteed to be document.body — any
    // prior story's teardown or runner chrome may leave focus elsewhere, and
    // tab stops inside Shadow DOM are resolved by the browser rather than by
    // userEvent's DOM walker. Directly focusing the button mirrors the
    // pattern in hx-tag.test.ts and keeps this assertion hermetic to the
    // specific tag-removal behavior under test. Keyboard traversal itself is
    // verified in hx-tag.test.ts (see `keyboard navigation` test block).
    //
    // When focus is inside a Shadow DOM, document.activeElement points at the
    // shadow host (the <hx-tag>), not the inner button — so jest-dom's
    // toHaveFocus() matcher must be asserted on the host. We separately
    // confirm the host's shadowRoot.activeElement is the actual remove
    // button, which is what "focus is on the dismiss control" really means.
    removeButton!.focus();
    await expect(firstTag).toHaveFocus();
    await expect(firstTag.shadowRoot?.activeElement).toBe(removeButton);

    // Keyboard activation must fire hx-remove (verified via @hx-remove handler
    // on the render container). Enter on a native <button> synthesizes a
    // click, which triggers the component's _handleRemove handler.
    await userEvent.keyboard('{Enter}');

    // After removal, only 3 tags should remain in the container
    const remaining = canvasElement.querySelectorAll('hx-tag');
    await expect(remaining.length).toBe(3);
  },
};

export const DarkMode: Story = {
  decorators: [
    (story) =>
      html`<hx-theme mode="dark" style="display: block; padding: 1rem;">${story()}</hx-theme>`,
  ],
  render: (args) => html`
    <div style="display: inline-flex; gap: 0.5rem; flex-wrap: wrap; max-width: 32rem;">
      <hx-tag variant=${args.variant ?? 'default'} hx-size=${args.size ?? 'md'}>Default</hx-tag>
      <hx-tag variant="primary" hx-size=${args.size ?? 'md'}>Primary</hx-tag>
      <hx-tag variant="success" hx-size=${args.size ?? 'md'}>Success</hx-tag>
      <hx-tag variant="warning" hx-size=${args.size ?? 'md'}>Warning</hx-tag>
      <hx-tag variant="danger" hx-size=${args.size ?? 'md'}>Danger</hx-tag>
    </div>
  `,
};
