import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-menu-item.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Menu Item',
  component: 'hx-menu-item',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'The value emitted in the hx-item-select event.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the item is disabled. Prevents interaction and event dispatch.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    checked: {
      control: 'boolean',
      description: 'Whether the item is checked. Only meaningful when type="checkbox" or type="radio".',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    type: {
      control: { type: 'select' },
      options: ['normal', 'checkbox', 'radio'],
      description: 'The type of menu item.',
      table: {
        category: 'Content',
        defaultValue: { summary: 'normal' },
        type: { summary: "'normal' | 'checkbox' | 'radio'" },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Whether the item is in a loading state.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    value: 'item-value',
    disabled: false,
    checked: false,
    type: 'normal',
    loading: false,
  },
  // hx-menu-item requires a parent role="menu" for valid ARIA context
  render: (args) => html`
    <div role="menu" aria-label="Example menu" style="display: inline-flex; flex-direction: column; min-width: 12rem; padding: 0.25rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
      <hx-menu-item
        value=${args.value}
        ?disabled=${args.disabled}
        ?checked=${args.checked}
        type=${args.type}
        ?loading=${args.loading}
      >Menu Item Label</hx-menu-item>
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
    value: 'default',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const item = canvasElement.querySelector('hx-menu-item');
    await expect(item).toBeTruthy();

    const selectSpy = fn();
    item!.addEventListener('hx-item-select', selectSpy);

    const inner = item!.shadowRoot!.querySelector('.menu-item') as HTMLElement;
    await userEvent.click(inner);

    await expect(selectSpy).toHaveBeenCalledTimes(1);
    const callArg = selectSpy.mock.calls[0][0] as CustomEvent<{ value: string }>;
    await expect(callArg.detail.value).toBe('default');

    item!.removeEventListener('hx-item-select', selectSpy);
  },
};

// ─────────────────────────────────────────────────
// 2. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'disabled-item',
  },
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('hx-menu-item');
    await expect(item).toBeTruthy();

    let fired = false;
    item!.addEventListener('hx-item-select', () => { fired = true; });

    const inner = item!.shadowRoot!.querySelector('.menu-item') as HTMLElement;
    inner?.click();

    await expect(fired).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 3. CHECKBOX TYPE
// ─────────────────────────────────────────────────

export const Checkbox: Story = {
  args: {
    type: 'checkbox',
    value: 'checkbox-item',
  },
  render: () => html`
    <div role="menu" aria-label="Checkbox menu" style="display: inline-flex; flex-direction: column; min-width: 12rem; padding: 0.25rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
      <hx-menu-item type="checkbox" value="option-a">Option A</hx-menu-item>
      <hx-menu-item type="checkbox" value="option-b" checked>Option B (checked)</hx-menu-item>
      <hx-menu-item type="checkbox" value="option-c">Option C</hx-menu-item>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. RADIO TYPE
// ─────────────────────────────────────────────────

export const Radio: Story = {
  args: {
    type: 'radio',
    value: 'radio-item',
  },
  render: () => html`
    <div role="menu" aria-label="Radio menu" style="display: inline-flex; flex-direction: column; min-width: 12rem; padding: 0.25rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
      <hx-menu-item type="radio" value="size-sm">Small</hx-menu-item>
      <hx-menu-item type="radio" value="size-md" checked>Medium (selected)</hx-menu-item>
      <hx-menu-item type="radio" value="size-lg">Large</hx-menu-item>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. LOADING STATE
// ─────────────────────────────────────────────────

export const Loading: Story = {
  args: {
    loading: true,
    value: 'loading-item',
  },
};

// ─────────────────────────────────────────────────
// 6. WITH PREFIX / SUFFIX SLOTS
// ─────────────────────────────────────────────────

export const WithPrefixSuffix: Story = {
  name: 'With Prefix and Suffix',
  render: () => html`
    <div role="menu" aria-label="Menu with icons" style="display: inline-flex; flex-direction: column; min-width: 14rem; padding: 0.25rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;">
      <hx-menu-item value="save">
        <span slot="prefix" aria-hidden="true">💾</span>
        Save
        <span slot="suffix" style="font-size: 0.75rem; color: #6b7280;">Ctrl+S</span>
      </hx-menu-item>
      <hx-menu-item value="copy">
        <span slot="prefix" aria-hidden="true">📋</span>
        Copy
        <span slot="suffix" style="font-size: 0.75rem; color: #6b7280;">Ctrl+C</span>
      </hx-menu-item>
      <hx-menu-item value="delete" disabled>
        <span slot="prefix" aria-hidden="true">🗑️</span>
        Delete
      </hx-menu-item>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. HEALTHCARE CONTEXT
// ─────────────────────────────────────────────────

export const HealthcareActions: Story = {
  name: 'Healthcare — Patient Record Actions',
  render: () => html`
    <div role="menu" aria-label="Patient record actions" style="display: inline-flex; flex-direction: column; min-width: 16rem; padding: 0.25rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <hx-menu-item value="view-history">View Visit History</hx-menu-item>
      <hx-menu-item value="print-chart">Print Chart</hx-menu-item>
      <hx-menu-item value="export-fhir">Export as FHIR</hx-menu-item>
      <hx-menu-item value="flag-review">Flag for Review</hx-menu-item>
      <hx-menu-item value="transfer" disabled>Transfer Patient (Unavailable)</hx-menu-item>
    </div>
  `,
};
