import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-split-button.js';
import '../hx-menu/hx-menu-item.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Split Button',
  component: 'hx-split-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'outline'],
      description: 'Visual style variant of the split button.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Size of the split button. Controls padding, font-size, and min-height. Rendered via the `hx-size` attribute.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    disabled: {
      control: 'boolean',
      description:
        'Whether the split button is disabled. Both the primary action button and the dropdown trigger are disabled when true.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description:
        'Primary button label text. When set, this property overrides the default slot content.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    label: 'Save Record',
  },
  render: (args) => html`
    <hx-split-button
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      .label=${args.label}
    >
      <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
      <hx-menu-item slot="menu" value="save-publish">Save &amp; Publish</hx-menu-item>
      <hx-menu-item slot="menu" value="save-notify">Save &amp; Notify Team</hx-menu-item>
    </hx-split-button>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Verifies click interaction and hx-click event
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Save Record',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    const primaryButton = splitButton!.shadowRoot!.querySelector('.split-button__primary');
    await expect(primaryButton).toBeTruthy();

    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    splitButton!.addEventListener('hx-click', handler);

    await userEvent.click(primaryButton as HTMLElement);
    await expect(eventFired).toBe(true);

    splitButton!.removeEventListener('hx-click', handler);
  },
};

// ─────────────────────────────────────────────────
// 2. VARIANT STORIES — All 6 variants
// ─────────────────────────────────────────────────

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Save Record',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'Export Report',
  },
};

export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
    label: 'More Options',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    label: 'Delete Record',
  },
  render: (args) => html`
    <hx-split-button
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      .label=${args.label}
    >
      <hx-menu-item slot="menu" value="archive">Archive Record</hx-menu-item>
      <hx-menu-item slot="menu" value="flag">Flag for Review</hx-menu-item>
      <hx-menu-item slot="menu" value="delete-all">Delete All Related</hx-menu-item>
    </hx-split-button>
  `,
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Actions',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'File Options',
  },
};

// ─────────────────────────────────────────────────
// 3. SIZE STORIES — Small, Medium, Large
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Save',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Save Record',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Save Patient Record',
  },
};

// ─────────────────────────────────────────────────
// 4. DISABLED STATE
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Save Record',
  },
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    // Both inner buttons must carry disabled
    const primaryButton = splitButton!.shadowRoot!.querySelector('.split-button__primary');
    const triggerButton = splitButton!.shadowRoot!.querySelector('.split-button__trigger');
    await expect((primaryButton as HTMLButtonElement).disabled).toBe(true);
    await expect((triggerButton as HTMLButtonElement).disabled).toBe(true);

    // hx-click must not fire when disabled
    let clickFired = false;
    const clickHandler = () => {
      clickFired = true;
    };
    splitButton!.addEventListener('hx-click', clickHandler);
    (primaryButton as HTMLButtonElement).click();
    await expect(clickFired).toBe(false);
    splitButton!.removeEventListener('hx-click', clickHandler);
  },
};

// ─────────────────────────────────────────────────
// 5. MENU ITEM DISABLED
// ─────────────────────────────────────────────────

export const MenuItemDisabled: Story = {
  name: 'Menu Item — Disabled Item',
  args: {
    label: 'Save Record',
  },
  render: (args) => html`
    <hx-split-button variant=${args.variant} hx-size=${args.size} ?disabled=${args.disabled}>
      <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
      <hx-menu-item slot="menu" value="save-publish" disabled>
        Save &amp; Publish (Unavailable)
      </hx-menu-item>
      <hx-menu-item slot="menu" value="save-notify">Save &amp; Notify Team</hx-menu-item>
    </hx-split-button>
  `,
};

// ─────────────────────────────────────────────────
// 6. hx-select EVENT VERIFICATION
// ─────────────────────────────────────────────────

export const MenuSelectEvent: Story = {
  name: 'Menu — hx-select Event',
  args: {
    label: 'Save Record',
  },
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    const selectSpy = fn();
    splitButton!.addEventListener('hx-select', selectSpy);

    // Open the menu via the trigger
    const triggerButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__trigger',
    ) as HTMLButtonElement;
    await expect(triggerButton).toBeTruthy();
    await userEvent.click(triggerButton);

    // Wait for the menu to open and the first item to be focusable
    await splitButton!.updateComplete;

    // Click the first hx-menu-item (Save as Draft)
    const firstMenuItem = canvasElement.querySelector('hx-menu-item[value="save-draft"]');
    await expect(firstMenuItem).toBeTruthy();
    const firstItemButton = firstMenuItem!.shadowRoot!.querySelector('button') as HTMLButtonElement;
    await expect(firstItemButton).toBeTruthy();
    await userEvent.click(firstItemButton);

    await expect(selectSpy).toHaveBeenCalledTimes(1);
    const callArg = selectSpy.mock.calls[0][0] as CustomEvent<{ value: string; label: string }>;
    await expect(callArg.type).toBe('hx-select');
    await expect(callArg.detail.value).toBe('save-draft');
    await expect(callArg.detail.label).toBe('Save as Draft');
    await expect(callArg.bubbles).toBe(true);
    await expect(callArg.composed).toBe(true);

    splitButton!.removeEventListener('hx-select', selectSpy);
  },
};

// ─────────────────────────────────────────────────
// 7. KITCHEN SINK — All Variants
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
      <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
        <span style="font-size: 0.75rem; font-weight: 600; color: #6b7280;">Primary</span>
        <hx-split-button variant="primary">
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
          <hx-menu-item slot="menu" value="save-publish">Save &amp; Publish</hx-menu-item>
          <hx-menu-item slot="menu" value="save-notify">Save &amp; Notify Team</hx-menu-item>
        </hx-split-button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
        <span style="font-size: 0.75rem; font-weight: 600; color: #6b7280;">Secondary</span>
        <hx-split-button variant="secondary">
          Export Report
          <hx-menu-item slot="menu" value="export-pdf">Export as PDF</hx-menu-item>
          <hx-menu-item slot="menu" value="export-csv">Export as CSV</hx-menu-item>
          <hx-menu-item slot="menu" value="export-xlsx">Export as Excel</hx-menu-item>
        </hx-split-button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
        <span style="font-size: 0.75rem; font-weight: 600; color: #6b7280;">Tertiary</span>
        <hx-split-button variant="tertiary">
          More Options
          <hx-menu-item slot="menu" value="duplicate">Duplicate</hx-menu-item>
          <hx-menu-item slot="menu" value="archive">Archive</hx-menu-item>
          <hx-menu-item slot="menu" value="move">Move to Folder</hx-menu-item>
        </hx-split-button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
        <span style="font-size: 0.75rem; font-weight: 600; color: #6b7280;">Danger</span>
        <hx-split-button variant="danger">
          Delete Record
          <hx-menu-item slot="menu" value="archive">Archive Record</hx-menu-item>
          <hx-menu-item slot="menu" value="flag">Flag for Review</hx-menu-item>
          <hx-menu-item slot="menu" value="delete-all">Delete All Related</hx-menu-item>
        </hx-split-button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
        <span style="font-size: 0.75rem; font-weight: 600; color: #6b7280;">Ghost</span>
        <hx-split-button variant="ghost">
          Actions
          <hx-menu-item slot="menu" value="view">View Details</hx-menu-item>
          <hx-menu-item slot="menu" value="copy">Copy Link</hx-menu-item>
          <hx-menu-item slot="menu" value="share">Share</hx-menu-item>
        </hx-split-button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
        <span style="font-size: 0.75rem; font-weight: 600; color: #6b7280;">Outline</span>
        <hx-split-button variant="outline">
          File Options
          <hx-menu-item slot="menu" value="rename">Rename</hx-menu-item>
          <hx-menu-item slot="menu" value="move">Move</hx-menu-item>
          <hx-menu-item slot="menu" value="delete">Delete</hx-menu-item>
        </hx-split-button>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const SaveRecord: Story = {
  name: 'Healthcare — Save Record',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;"
    >
      <div>
        <h3 style="margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600;">Patient Chart</h3>
        <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
          Jane Doe · MRN 00041827 · Last modified 2 min ago
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <hx-split-button variant="primary">
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
          <hx-menu-item slot="menu" value="save-publish">Save &amp; Publish</hx-menu-item>
          <hx-menu-item slot="menu" value="save-notify">Save &amp; Notify Team</hx-menu-item>
        </hx-split-button>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    // Verify primary button fires hx-click
    const primaryButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__primary',
    ) as HTMLButtonElement;
    await expect(primaryButton).toBeTruthy();

    const clickSpy = fn();
    splitButton!.addEventListener('hx-click', clickSpy);
    await userEvent.click(primaryButton);
    await expect(clickSpy).toHaveBeenCalledTimes(1);
    splitButton!.removeEventListener('hx-click', clickSpy);
  },
};

export const PrintOptions: Story = {
  name: 'Healthcare — Print Options',
  render: () => html`
    <div
      style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.375rem;"
      role="toolbar"
      aria-label="Document actions"
    >
      <hx-split-button variant="outline" hx-size="sm">
        Print Chart
        <hx-menu-item slot="menu" value="print-summary">Print Summary</hx-menu-item>
        <hx-menu-item slot="menu" value="print-full">Print Full Chart</hx-menu-item>
        <hx-menu-item slot="menu" value="print-labs">Print Lab Results Only</hx-menu-item>
        <hx-menu-item slot="menu" value="print-medications">Print Medication List</hx-menu-item>
      </hx-split-button>
    </div>
  `,
};

export const ExportFormats: Story = {
  name: 'Healthcare — Export Formats',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;">
      <p style="margin: 0; font-size: 0.875rem; color: #374151;">
        Export patient data in multiple formats for downstream systems.
      </p>
      <hx-split-button variant="secondary">
        Export as PDF
        <hx-menu-item slot="menu" value="export-hl7">Export as HL7 FHIR</hx-menu-item>
        <hx-menu-item slot="menu" value="export-ccda">Export as C-CDA</hx-menu-item>
        <hx-menu-item slot="menu" value="export-csv">Export as CSV</hx-menu-item>
        <hx-menu-item slot="menu" value="export-xlsx">Export as Excel</hx-menu-item>
      </hx-split-button>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    const selectSpy = fn();
    splitButton!.addEventListener('hx-select', selectSpy);

    // Open the dropdown
    const triggerButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__trigger',
    ) as HTMLButtonElement;
    await userEvent.click(triggerButton);
    await splitButton!.updateComplete;

    // Select "Export as CSV"
    const csvItem = canvasElement.querySelector('hx-menu-item[value="export-csv"]');
    await expect(csvItem).toBeTruthy();
    const csvItemButton = csvItem!.shadowRoot!.querySelector('button') as HTMLButtonElement;
    await userEvent.click(csvItemButton);

    await expect(selectSpy).toHaveBeenCalledTimes(1);
    const callArg = selectSpy.mock.calls[0][0] as CustomEvent<{ value: string; label: string }>;
    await expect(callArg.detail.value).toBe('export-csv');

    splitButton!.removeEventListener('hx-select', selectSpy);
  },
};

// ─────────────────────────────────────────────────
// 9. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const PrimaryClickEvent: Story = {
  name: 'Interaction — Primary Click Fires hx-click',
  args: {
    label: 'Approve Referral',
  },
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    const eventSpy = fn();
    splitButton!.addEventListener('hx-click', eventSpy);

    const primaryButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__primary',
    ) as HTMLButtonElement;
    await userEvent.click(primaryButton);

    await expect(eventSpy).toHaveBeenCalledTimes(1);
    const callArg = eventSpy.mock.calls[0][0] as CustomEvent<{ originalEvent: MouseEvent }>;
    await expect(callArg.type).toBe('hx-click');
    await expect(callArg.detail.originalEvent).toBeTruthy();
    await expect(callArg.bubbles).toBe(true);
    await expect(callArg.composed).toBe(true);

    splitButton!.removeEventListener('hx-click', eventSpy);
  },
};

export const TriggerOpensMenu: Story = {
  name: 'Interaction — Trigger Opens Menu',
  args: {
    label: 'Submit Order',
  },
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    const triggerButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__trigger',
    ) as HTMLButtonElement;
    await expect(triggerButton).toBeTruthy();

    // Initially the menu is closed
    await expect(triggerButton.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(triggerButton);
    await splitButton!.updateComplete;

    // After click the menu should be open
    await expect(triggerButton.getAttribute('aria-expanded')).toBe('true');

    const menuPanel = splitButton!.shadowRoot!.querySelector('.split-button__menu');
    await expect(menuPanel).toBeTruthy();
    await expect(menuPanel!.classList.contains('split-button__menu--open')).toBe(true);
  },
};

export const MenuItemSelectEvent: Story = {
  name: 'Interaction — Menu Item Fires hx-select',
  args: {
    label: 'Save Order',
  },
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    const selectSpy = fn();
    splitButton!.addEventListener('hx-select', selectSpy);

    // Open the menu
    const triggerButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__trigger',
    ) as HTMLButtonElement;
    await userEvent.click(triggerButton);
    await splitButton!.updateComplete;

    // Activate the second menu item (save-publish)
    const publishItem = canvasElement.querySelector('hx-menu-item[value="save-publish"]');
    await expect(publishItem).toBeTruthy();
    const publishItemButton = publishItem!.shadowRoot!.querySelector('button') as HTMLButtonElement;
    await userEvent.click(publishItemButton);

    await expect(selectSpy).toHaveBeenCalledTimes(1);
    const callArg = selectSpy.mock.calls[0][0] as CustomEvent<{ value: string; label: string }>;
    await expect(callArg.type).toBe('hx-select');
    await expect(callArg.detail.value).toBe('save-publish');
    await expect(typeof callArg.detail.label).toBe('string');

    // Menu should close after selection
    await splitButton!.updateComplete;
    const triggerAfter = splitButton!.shadowRoot!.querySelector(
      '.split-button__trigger',
    ) as HTMLButtonElement;
    await expect(triggerAfter.getAttribute('aria-expanded')).toBe('false');

    splitButton!.removeEventListener('hx-select', selectSpy);
  },
};

export const KeyboardArrowDownOpensMenu: Story = {
  name: 'Interaction — ArrowDown Opens Menu from Primary',
  args: {
    label: 'Prescribe Medication',
  },
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    const primaryButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__primary',
    ) as HTMLButtonElement;
    await expect(primaryButton).toBeTruthy();

    primaryButton.focus();

    await userEvent.keyboard('{ArrowDown}');
    await splitButton!.updateComplete;

    const triggerButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__trigger',
    ) as HTMLButtonElement;
    await expect(triggerButton.getAttribute('aria-expanded')).toBe('true');
  },
};

export const KeyboardEscapeClosesMenu: Story = {
  name: 'Interaction — Escape Closes Menu',
  args: {
    label: 'Discharge Patient',
  },
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    // Open the menu
    const triggerButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__trigger',
    ) as HTMLButtonElement;
    await userEvent.click(triggerButton);
    await splitButton!.updateComplete;
    await expect(triggerButton.getAttribute('aria-expanded')).toBe('true');

    // Press Escape to close
    await userEvent.keyboard('{Escape}');
    await splitButton!.updateComplete;
    await expect(triggerButton.getAttribute('aria-expanded')).toBe('false');
  },
};

export const DisabledNoEvents: Story = {
  name: 'Interaction — Disabled Fires No Events',
  args: {
    disabled: true,
    label: 'Processing',
  },
  play: async ({ canvasElement }) => {
    const splitButton = canvasElement.querySelector('hx-split-button');
    await expect(splitButton).toBeTruthy();

    const clickSpy = fn();
    const selectSpy = fn();
    splitButton!.addEventListener('hx-click', clickSpy);
    splitButton!.addEventListener('hx-select', selectSpy);

    const primaryButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__primary',
    ) as HTMLButtonElement;
    const triggerButton = splitButton!.shadowRoot!.querySelector(
      '.split-button__trigger',
    ) as HTMLButtonElement;

    await expect(primaryButton.disabled).toBe(true);
    await expect(triggerButton.disabled).toBe(true);

    // Native click on disabled button should not fire hx-click
    primaryButton.click();
    await expect(clickSpy).toHaveBeenCalledTimes(0);

    splitButton!.removeEventListener('hx-click', clickSpy);
    splitButton!.removeEventListener('hx-select', selectSpy);
  },
};
