import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-overflow-menu.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/OverflowMenu',
  component: 'hx-overflow-menu',
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'left',
        'left-start',
        'left-end',
        'right',
        'right-start',
        'right-end',
      ],
      description: 'Preferred placement of the floating panel.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: 'bottom-end' },
        type: { summary: 'string' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the trigger icon button.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the trigger button is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    icon: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'Icon orientation: vertical (kebab ⋮) or horizontal (meatball ···).',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'vertical' },
        type: { summary: "'vertical' | 'horizontal'" },
      },
    },
  },
  args: {
    placement: 'bottom-end',
    size: 'md',
    disabled: false,
    icon: 'vertical',
  },
  render: (args) => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu
        placement=${args.placement}
        hx-size=${args.size}
        ?disabled=${args.disabled}
        icon=${args.icon}
      >
        <button role="menuitem">Edit record</button>
        <button role="menuitem">Duplicate</button>
        <button role="menuitem">Archive</button>
        <button role="menuitem" style="color: #dc2626;">Delete</button>
      </hx-overflow-menu>
    </div>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — vertical kebab, fires hx-show on open
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    icon: 'vertical',
    placement: 'bottom-end',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const el = canvasElement.querySelector('hx-overflow-menu');
    await expect(el).toBeTruthy();

    const triggerBtn = el?.shadowRoot?.querySelector('[part="button"]') as HTMLElement | null;
    await expect(triggerBtn).toBeTruthy();

    let showFired = false;
    el?.addEventListener('hx-show', () => {
      showFired = true;
    });

    await userEvent.click(triggerBtn!);
    await expect(showFired).toBe(true);

    // Panel should be present after open
    const panel = el?.shadowRoot?.querySelector('[part="panel"]');
    await expect(panel).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. HORIZONTAL (meatball) icon
// ─────────────────────────────────────────────────

export const HorizontalIcon: Story = {
  args: {
    icon: 'horizontal',
  },
  render: (args) => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu icon=${args.icon} placement=${args.placement} hx-size=${args.size}>
        <button role="menuitem">View details</button>
        <button role="menuitem">Assign</button>
        <button role="menuitem">Export</button>
      </hx-overflow-menu>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 3. VERTICAL (kebab) icon — explicit
// ─────────────────────────────────────────────────

export const VerticalIcon: Story = {
  args: {
    icon: 'vertical',
  },
  render: (args) => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu icon=${args.icon} placement=${args.placement} hx-size=${args.size}>
        <button role="menuitem">View details</button>
        <button role="menuitem">Assign</button>
        <button role="menuitem">Export</button>
      </hx-overflow-menu>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. SIZE VARIANTS
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: { size: 'sm' },
};

export const Medium: Story = {
  args: { size: 'md' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

// ─────────────────────────────────────────────────
// 5. DISABLED STATE
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-overflow-menu');
    await expect(el).toBeTruthy();

    const triggerBtn = el?.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement | null;
    await expect(triggerBtn).toBeTruthy();
    await expect(triggerBtn?.disabled).toBe(true);

    let opened = false;
    el?.addEventListener('hx-show', () => {
      opened = true;
    });
    triggerBtn?.click();
    await expect(opened).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 6. HX-SELECT event
// ─────────────────────────────────────────────────

export const SelectEvent: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu>
        <button role="menuitem" data-value="edit">Edit</button>
        <button role="menuitem" data-value="delete">Delete</button>
      </hx-overflow-menu>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-overflow-menu');
    await expect(el).toBeTruthy();

    const selectSpy = fn();
    el?.addEventListener('hx-select', selectSpy);

    const triggerBtn = el?.shadowRoot?.querySelector('[part="button"]') as HTMLElement | null;
    await userEvent.click(triggerBtn!);

    const slot = el?.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    const items = slot?.assignedElements({ flatten: true }) as HTMLElement[] | undefined;
    const editItem = items?.[0];
    await expect(editItem).toBeTruthy();

    await userEvent.click(editItem!);
    await expect(selectSpy).toHaveBeenCalledTimes(1);

    const callArg = selectSpy.mock.calls[0]?.[0] as CustomEvent | undefined;
    await expect(callArg?.detail?.value).toBe('edit');

    el?.removeEventListener('hx-select', selectSpy);
  },
};

// ─────────────────────────────────────────────────
// 7. FEW ITEMS (2)
// ─────────────────────────────────────────────────

export const FewItems: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu>
        <button role="menuitem">Edit</button>
        <button role="menuitem">Delete</button>
      </hx-overflow-menu>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. MANY ITEMS (6)
// ─────────────────────────────────────────────────

export const ManyItems: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu>
        <button role="menuitem">View details</button>
        <button role="menuitem">Edit</button>
        <button role="menuitem">Duplicate</button>
        <button role="menuitem">Archive</button>
        <button role="menuitem">Export</button>
        <button role="menuitem" style="color: #dc2626;">Delete</button>
      </hx-overflow-menu>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. HEALTHCARE — patient row actions
// ─────────────────────────────────────────────────

export const PatientRowActions: Story = {
  render: () => html`
    <table style="border-collapse: collapse; width: 100%; max-width: 640px; font-size: 0.875rem;">
      <thead>
        <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #374151;">
            Patient
          </th>
          <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #374151;">
            Ward
          </th>
          <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #374151;">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 0.75rem 1rem; color: #111827;">Jane Doe</td>
          <td style="padding: 0.75rem 1rem; color: #6b7280;">Cardiology</td>
          <td style="padding: 0.5rem 1rem; text-align: right;">
            <hx-overflow-menu hx-size="sm" placement="bottom-end">
              <button role="menuitem">View record</button>
              <button role="menuitem">Edit record</button>
              <button role="menuitem">Schedule follow-up</button>
              <button role="menuitem" style="color: #dc2626;">Discharge</button>
            </hx-overflow-menu>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 0.75rem 1rem; color: #111827;">John Smith</td>
          <td style="padding: 0.75rem 1rem; color: #6b7280;">Neurology</td>
          <td style="padding: 0.5rem 1rem; text-align: right;">
            <hx-overflow-menu hx-size="sm" placement="bottom-end">
              <button role="menuitem">View record</button>
              <button role="menuitem">Edit record</button>
              <button role="menuitem">Schedule follow-up</button>
              <button role="menuitem" style="color: #dc2626;">Discharge</button>
            </hx-overflow-menu>
          </td>
        </tr>
      </tbody>
    </table>
  `,
};

// ─────────────────────────────────────────────────
// 10. ESCAPE KEY closes panel
// ─────────────────────────────────────────────────

export const KeyboardEscape: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu>
        <button role="menuitem">Edit</button>
        <button role="menuitem">Delete</button>
      </hx-overflow-menu>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-overflow-menu');
    await expect(el).toBeTruthy();

    let hideFired = false;
    el?.addEventListener('hx-hide', () => {
      hideFired = true;
    });

    const triggerBtn = el?.shadowRoot?.querySelector('[part="button"]') as HTMLElement | null;
    await userEvent.click(triggerBtn!);

    const panel = el?.shadowRoot?.querySelector('[part="panel"]');
    await expect(panel).toBeTruthy();

    await userEvent.keyboard('{Escape}');
    await expect(hideFired).toBe(true);

    const panelAfter = el?.shadowRoot?.querySelector('[part="panel"]');
    await expect(panelAfter).toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 11. WITH DIVIDERS — separator between groups
// ─────────────────────────────────────────────────

export const WithDividers: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu>
        <button role="menuitem">View details</button>
        <button role="menuitem">Edit</button>
        <hr role="separator" />
        <button role="menuitem">Duplicate</button>
        <button role="menuitem">Archive</button>
        <hr role="separator" />
        <button role="menuitem" style="color: #dc2626;">Delete</button>
      </hx-overflow-menu>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 12. DISABLED ITEMS — aria-disabled on individual items
// ─────────────────────────────────────────────────

export const DisabledItems: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu>
        <button role="menuitem">View details</button>
        <button role="menuitem" aria-disabled="true">Edit (locked)</button>
        <button role="menuitem">Duplicate</button>
        <button role="menuitem" aria-disabled="true">Delete (no permission)</button>
      </hx-overflow-menu>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 13. ALL PLACEMENTS — visual reference for each position
// ─────────────────────────────────────────────────

export const AllPlacements: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; padding: 6rem 2rem; justify-items: center;"
    >
      ${(
        [
          'top-start',
          'top',
          'top-end',
          'left-start',
          'bottom',
          'right-start',
          'left',
          'bottom-start',
          'right',
          'left-end',
          'bottom-end',
          'right-end',
        ] as const
      ).map(
        (p) => html`
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.75rem; color: #6b7280; font-family: monospace;">${p}</span>
            <hx-overflow-menu placement=${p} hx-size="sm">
              <button role="menuitem">Action A</button>
              <button role="menuitem">Action B</button>
              <button role="menuitem">Action C</button>
            </hx-overflow-menu>
          </div>
        `,
      )}
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 14. KEYBOARD NAVIGATION — arrow keys move focus
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 4rem 2rem;">
      <hx-overflow-menu>
        <button role="menuitem">First</button>
        <button role="menuitem">Second</button>
        <button role="menuitem">Third</button>
      </hx-overflow-menu>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-overflow-menu');
    await expect(el).toBeTruthy();

    const triggerBtn = el?.shadowRoot?.querySelector('[part="button"]') as HTMLElement | null;
    await userEvent.click(triggerBtn!);

    // First item should have focus after open
    const items = el?.querySelectorAll('[role="menuitem"]');
    await expect(document.activeElement).toBe(items?.[0]);

    // ArrowDown moves to second
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toBe(items?.[1]);

    // ArrowDown moves to third
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toBe(items?.[2]);
  },
};
