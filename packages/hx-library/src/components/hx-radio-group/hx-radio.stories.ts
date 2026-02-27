import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-radio.js';
import './hx-radio-group.js';

// ─────────────────────────────────────────────────
//  Meta
// ─────────────────────────────────────────────────

/**
 * `hx-radio` is a presentational radio button component designed to be used
 * inside an `<hx-radio-group>`. It does not manage its own checked state --
 * the parent group handles selection, keyboard navigation, and form
 * association.
 *
 * **For grouped usage (the standard pattern), see
 * [Components/Radio Group](?path=/docs/components-radio-group--docs).**
 */
const meta = {
  title: 'Components/Radio',
  component: 'hx-radio',
  tags: ['autodocs'],
  argTypes: {
    // ── Properties ──
    value: {
      control: 'text',
      description: 'The value this radio represents.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'Visible label text for the radio.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether this radio is disabled.',
      table: {
        category: 'Properties',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    checked: {
      control: 'boolean',
      description: 'Whether this radio is checked. Managed by the parent group.',
      table: {
        category: 'Properties',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    // ── Slots ──
    defaultSlot: {
      name: '',
      description: 'Custom label content (overrides the label property).',
      table: {
        category: 'Slots',
        type: { summary: 'HTMLElement | string' },
      },
      control: false,
    },
    // ── CSS Custom Properties ──
    '--hx-radio-size': {
      description: 'Radio circle size.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-size-5, 1.25rem)' },
        type: { summary: 'CSS length' },
      },
      control: false,
    },
    '--hx-radio-border-color': {
      description: 'Radio border color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-300, #ced4da)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-radio-checked-bg': {
      description: 'Checked background color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-primary-500, #2563EB)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-radio-checked-border-color': {
      description: 'Checked border color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-primary-500, #2563EB)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-radio-dot-color': {
      description: 'Inner dot color when checked.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-0, #ffffff)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-radio-focus-ring-color': {
      description: 'Focus ring color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-focus-ring-color, #2563EB)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-radio-label-color': {
      description: 'Label text color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-700, #343a40)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    // ── CSS Parts ──
    radio: {
      description: 'The visual radio circle.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(radio)' },
      },
      control: false,
    },
    labelPart: {
      description: 'The label text.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(label)' },
      },
      control: false,
    },
  },
  args: {
    value: 'option-1',
    label: 'Radio option',
    disabled: false,
    checked: false,
  },
  render: (args) => html`
    <hx-radio
      value=${args.value}
      label=${args.label}
      ?disabled=${args.disabled}
      ?checked=${args.checked}
    ></hx-radio>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
//  Default
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    value: 'consent',
    label: 'I consent to treatment',
  },
  play: async ({ canvasElement }) => {
    const radio = canvasElement.querySelector('hx-radio');
    expect(radio).toBeTruthy();
    expect(radio!.getAttribute('role')).toBe('radio');
    expect(radio!.getAttribute('aria-checked')).toBe('false');
  },
};

// ─────────────────────────────────────────────────
//  Checked
// ─────────────────────────────────────────────────

export const Checked: Story = {
  args: {
    value: 'confirmed',
    label: 'Patient identity confirmed',
    checked: true,
  },
  play: async ({ canvasElement }) => {
    const radio = canvasElement.querySelector('hx-radio');
    expect(radio).toBeTruthy();
    expect(radio!.getAttribute('aria-checked')).toBe('true');
    const control = radio!.shadowRoot!.querySelector('.radio--checked');
    expect(control).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
//  Disabled
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    value: 'unavailable',
    label: 'Weekend appointment (unavailable)',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const radio = canvasElement.querySelector('hx-radio');
    expect(radio).toBeTruthy();
    expect(radio!.getAttribute('aria-disabled')).toBe('true');
    expect(radio!.hasAttribute('disabled')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
//  Disabled Checked
// ─────────────────────────────────────────────────

export const DisabledChecked: Story = {
  args: {
    value: 'locked',
    label: 'Previously selected (locked)',
    disabled: true,
    checked: true,
  },
};

// ─────────────────────────────────────────────────
//  With Slot Content
// ─────────────────────────────────────────────────

export const WithSlotContent: Story = {
  render: () => html`
    <hx-radio value="custom-label" checked>
      <span style="font-weight: 600;">Custom HTML label</span>
      <span
        style="display: block; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Slot content overrides the label property
      </span>
    </hx-radio>
  `,
};

// ─────────────────────────────────────────────────
//  All States
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <hx-radio value="default" label="Default (unchecked)"></hx-radio>
      <hx-radio value="checked" label="Checked" checked></hx-radio>
      <hx-radio value="disabled" label="Disabled" disabled></hx-radio>
      <hx-radio value="disabled-checked" label="Disabled and checked" disabled checked></hx-radio>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  CSS Custom Properties
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #6c757d;">
          Default appearance
        </h3>
        <hx-radio value="default" label="Default radio" checked></hx-radio>
      </div>

      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #6c757d;">
          Custom size, colors, and focus ring
        </h3>
        <hx-radio
          value="custom"
          label="Larger radio with green theme"
          checked
          style="
            --hx-radio-size: 1.75rem;
            --hx-radio-border-color: #9ca3af;
            --hx-radio-checked-bg: #059669;
            --hx-radio-checked-border-color: #059669;
            --hx-radio-dot-color: #ffffff;
            --hx-radio-focus-ring-color: #059669;
            --hx-radio-label-color: #1f2937;
          "
        ></hx-radio>
      </div>

      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #6c757d;">Compact variant</h3>
        <hx-radio
          value="compact"
          label="Smaller radio with muted label"
          style="
            --hx-radio-size: 0.875rem;
            --hx-radio-label-color: #9ca3af;
          "
        ></hx-radio>
      </div>

      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #6c757d;">
          Warning / alert theme
        </h3>
        <hx-radio
          value="warning"
          label="Critical alert radio"
          checked
          style="
            --hx-radio-checked-bg: #dc2626;
            --hx-radio-checked-border-color: #dc2626;
            --hx-radio-focus-ring-color: #dc2626;
            --hx-radio-label-color: #991b1b;
          "
        ></hx-radio>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  CSS Parts
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .radio-parts-demo hx-radio::part(radio) {
        border-width: 3px;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      }
      .radio-parts-demo hx-radio::part(label) {
        font-weight: 700;
        color: #6366f1;
        letter-spacing: 0.02em;
      }
    </style>
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #6c757d;">
          ::part(radio) and ::part(label) customization
        </h3>
        <div class="radio-parts-demo" style="display: flex; flex-direction: column; gap: 0.75rem;">
          <hx-radio value="a" label="Styled via ::part(radio) and ::part(label)"></hx-radio>
          <hx-radio value="b" label="Custom border, shadow, and label weight" checked></hx-radio>
        </div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  In a Radio Group (recommended usage)
// ─────────────────────────────────────────────────

export const InARadioGroup: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <p
        style="margin: 0; padding: 0.75rem 1rem; background: var(--hx-color-neutral-50, #f8f9fa); border-left: 3px solid var(--hx-color-primary-500, #2563EB); font-size: 0.875rem; color: var(--hx-color-neutral-700, #343a40); line-height: 1.5;"
      >
        <strong>Recommended:</strong> Always use <code>&lt;hx-radio&gt;</code> inside an
        <code>&lt;hx-radio-group&gt;</code>. The group handles selection state, keyboard navigation
        (roving tabindex), form association, and accessibility attributes.
      </p>
      <hx-radio-group label="Appointment Type" name="appt" required>
        <hx-radio value="in-person" label="In-Person Visit"></hx-radio>
        <hx-radio value="telehealth" label="Telehealth"></hx-radio>
        <hx-radio value="phone" label="Phone Consultation"></hx-radio>
      </hx-radio-group>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// THEME COMPARISON — Light and Dark side by side
// ─────────────────────────────────────────────────

export const ThemeComparison: Story = {
  parameters: {
    backgrounds: { disable: true },
  },
  render: () => html`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: 200px;">
      <div
        data-theme="light"
        style="padding: 2rem; background: #ffffff; display: flex; flex-direction: column; gap: 1rem;"
      >
        <p
          style="margin: 0 0 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;"
        >
          Light Theme
        </p>
        <hx-radio-group label="Appointment Type" name="appt-radio-light">
          <hx-radio value="in-person" label="In-Person Visit" checked></hx-radio>
          <hx-radio value="telehealth" label="Telehealth"></hx-radio>
          <hx-radio value="phone" label="Phone Consultation" disabled></hx-radio>
        </hx-radio-group>
      </div>
      <div
        data-theme="dark"
        style="padding: 2rem; background: #1a1a2e; display: flex; flex-direction: column; gap: 1rem;"
      >
        <p
          style="margin: 0 0 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;"
        >
          Dark Theme
        </p>
        <hx-radio-group label="Appointment Type" name="appt-radio-dark">
          <hx-radio value="in-person" label="In-Person Visit" checked></hx-radio>
          <hx-radio value="telehealth" label="Telehealth"></hx-radio>
          <hx-radio value="phone" label="Phone Consultation" disabled></hx-radio>
        </hx-radio-group>
      </div>
    </div>
  `,
};
