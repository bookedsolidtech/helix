import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-toggle-button.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/ToggleButton',
  component: 'hx-toggle-button',
  tags: ['autodocs'],
  argTypes: {
    pressed: {
      control: 'boolean',
      description:
        'Whether the toggle button is in the pressed (active) state. Reflected as an attribute and communicated to assistive technology via `aria-pressed`.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'ghost', 'outline'],
      description: 'Visual style variant of the toggle button.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'secondary' },
        type: { summary: "'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Size of the toggle button. Controls padding, font-size, and min-height. Bound to the `hx-size` attribute on the element.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    disabled: {
      control: 'boolean',
      description:
        'Whether the toggle button is disabled. Prevents all interaction and does not dispatch `hx-toggle` events.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    name: {
      control: 'text',
      description:
        'Form field name submitted via ElementInternals when the button is in the pressed state.',
      table: {
        category: 'Form',
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description:
        'Form field value submitted via ElementInternals when the button is in the pressed state.',
      table: {
        category: 'Form',
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'Toggle button label text (passed via the default slot).',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    pressed: false,
    variant: 'secondary',
    size: 'md',
    disabled: false,
    label: 'Toggle Option',
  },
  render: (args) => html`
    <hx-toggle-button
      variant=${args.variant}
      hx-size=${args.size}
      ?pressed=${args.pressed}
      ?disabled=${args.disabled}
    >
      ${args.label}
    </hx-toggle-button>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Verifies hx-toggle event fires and aria-pressed updates
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Toggle Option',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const hxToggleButton = canvasElement.querySelector('hx-toggle-button');
    await expect(hxToggleButton).toBeTruthy();

    const innerButton = hxToggleButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();

    // Verify initial aria-pressed is "false"
    await expect(innerButton!.getAttribute('aria-pressed')).toBe('false');

    let eventFired = false;
    let eventDetail: { pressed: boolean } | null = null;
    const handler = (e: Event) => {
      eventFired = true;
      eventDetail = (e as CustomEvent<{ pressed: boolean }>).detail;
    };
    hxToggleButton!.addEventListener('hx-toggle', handler);

    await userEvent.click(innerButton!);

    await expect(eventFired).toBe(true);
    await expect(eventDetail).not.toBeNull();
    await expect(eventDetail!.pressed).toBe(true);

    // aria-pressed should now reflect the pressed state
    await expect(innerButton!.getAttribute('aria-pressed')).toBe('true');

    hxToggleButton!.removeEventListener('hx-toggle', handler);
  },
};

// ─────────────────────────────────────────────────
// 2. PRESSED STATE
// ─────────────────────────────────────────────────

export const PressedState: Story = {
  name: 'Pressed State',
  args: {
    pressed: true,
    label: 'Active Filter',
  },
};

// ─────────────────────────────────────────────────
// 3. UNPRESSED STATE
// ─────────────────────────────────────────────────

export const UnpressedState: Story = {
  name: 'Unpressed State',
  args: {
    pressed: false,
    label: 'Inactive Filter',
  },
};

// ─────────────────────────────────────────────────
// 4. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Unavailable',
  },
};

// ─────────────────────────────────────────────────
// 5. DISABLED + PRESSED
// ─────────────────────────────────────────────────

export const DisabledPressed: Story = {
  name: 'Disabled (Pressed)',
  args: {
    disabled: true,
    pressed: true,
    label: 'Locked Active',
  },
};

// ─────────────────────────────────────────────────
// 6. VARIANT STORIES
// ─────────────────────────────────────────────────

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Primary Toggle',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'Secondary Toggle',
  },
};

export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
    label: 'Tertiary Toggle',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Ghost Toggle',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Outline Toggle',
  },
};

// ─────────────────────────────────────────────────
// 7. SIZE STORIES
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Small',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Medium',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Large',
  },
};

// ─────────────────────────────────────────────────
// 8. ALL VARIANTS KITCHEN SINK
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.875rem; color: #6b7280;">
          Unpressed
        </p>
        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <hx-toggle-button variant="primary">Primary</hx-toggle-button>
          <hx-toggle-button variant="secondary">Secondary</hx-toggle-button>
          <hx-toggle-button variant="tertiary">Tertiary</hx-toggle-button>
          <hx-toggle-button variant="ghost">Ghost</hx-toggle-button>
          <hx-toggle-button variant="outline">Outline</hx-toggle-button>
        </div>
      </div>
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.875rem; color: #6b7280;">
          Pressed
        </p>
        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <hx-toggle-button variant="primary" pressed>Primary</hx-toggle-button>
          <hx-toggle-button variant="secondary" pressed>Secondary</hx-toggle-button>
          <hx-toggle-button variant="tertiary" pressed>Tertiary</hx-toggle-button>
          <hx-toggle-button variant="ghost" pressed>Ghost</hx-toggle-button>
          <hx-toggle-button variant="outline" pressed>Outline</hx-toggle-button>
        </div>
      </div>
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.875rem; color: #6b7280;">
          Disabled
        </p>
        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <hx-toggle-button variant="primary" disabled>Primary</hx-toggle-button>
          <hx-toggle-button variant="secondary" disabled>Secondary</hx-toggle-button>
          <hx-toggle-button variant="tertiary" disabled>Tertiary</hx-toggle-button>
          <hx-toggle-button variant="ghost" disabled>Ghost</hx-toggle-button>
          <hx-toggle-button variant="outline" disabled>Outline</hx-toggle-button>
        </div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. ALL SIZES
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.875rem; color: #6b7280;">
          Unpressed
        </p>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <hx-toggle-button hx-size="sm">Small</hx-toggle-button>
          <hx-toggle-button hx-size="md">Medium</hx-toggle-button>
          <hx-toggle-button hx-size="lg">Large</hx-toggle-button>
        </div>
      </div>
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.875rem; color: #6b7280;">
          Pressed
        </p>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <hx-toggle-button hx-size="sm" pressed>Small</hx-toggle-button>
          <hx-toggle-button hx-size="md" pressed>Medium</hx-toggle-button>
          <hx-toggle-button hx-size="lg" pressed>Large</hx-toggle-button>
        </div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. ICON ONLY — accessible name via label attribute
// ─────────────────────────────────────────────────

export const IconOnly: Story = {
  name: 'Icon Only (accessible name via label)',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        Icon-only toggle buttons require a <code>label</code> attribute so the inner
        <code>&lt;button&gt;</code> has an accessible name for screen readers.
      </p>
      <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
        <hx-toggle-button variant="outline" hx-size="sm" label="Grid view">
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </hx-toggle-button>

        <hx-toggle-button variant="outline" hx-size="sm" pressed label="List view">
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </hx-toggle-button>

        <hx-toggle-button variant="ghost" hx-size="sm" label="Mute audio">
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        </hx-toggle-button>

        <hx-toggle-button variant="ghost" hx-size="sm" disabled label="Bookmark (disabled)">
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </hx-toggle-button>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 12. WITH PREFIX SLOT
// ─────────────────────────────────────────────────

export const WithPrefixSlot: Story = {
  name: 'Prefix Slot (icon before label)',
  render: () => html`
    <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
      <hx-toggle-button variant="secondary">
        <svg
          slot="prefix"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        Grid View
      </hx-toggle-button>

      <hx-toggle-button variant="secondary" pressed>
        <svg
          slot="prefix"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        List View (Pressed)
      </hx-toggle-button>

      <hx-toggle-button variant="outline">
        <svg
          slot="prefix"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Active Patients
      </hx-toggle-button>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 11. WITH SUFFIX SLOT
// ─────────────────────────────────────────────────

export const WithSuffixSlot: Story = {
  name: 'Suffix Slot (icon after label)',
  render: () => html`
    <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
      <hx-toggle-button variant="secondary">
        Sort Options
        <svg
          slot="suffix"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </hx-toggle-button>

      <hx-toggle-button variant="secondary" pressed>
        Sorted (Pressed)
        <svg
          slot="suffix"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </hx-toggle-button>

      <hx-toggle-button variant="outline">
        Favorites
        <svg
          slot="suffix"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          />
        </svg>
      </hx-toggle-button>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 13. TOGGLE INTERACTION — play function clicks and verifies state change
// ─────────────────────────────────────────────────

export const ToggleInteraction: Story = {
  args: {
    label: 'Active Patients',
    pressed: false,
  },
  play: async ({ canvasElement }) => {
    const hxToggleButton = canvasElement.querySelector('hx-toggle-button');
    await expect(hxToggleButton).toBeTruthy();

    const innerButton = hxToggleButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();

    // Verify initial state is unpressed
    await expect(innerButton!.getAttribute('aria-pressed')).toBe('false');

    // Set up event spy before clicking
    const toggleSpy = fn();
    hxToggleButton!.addEventListener('hx-toggle', toggleSpy);

    // Click once — should transition to pressed
    await userEvent.click(innerButton!);

    await expect(toggleSpy).toHaveBeenCalledTimes(1);
    const firstCall = toggleSpy.mock.calls[0][0] as CustomEvent<{ pressed: boolean }>;
    await expect(firstCall.detail.pressed).toBe(true);
    await expect(firstCall.bubbles).toBe(true);
    await expect(firstCall.composed).toBe(true);
    await expect(innerButton!.getAttribute('aria-pressed')).toBe('true');

    // Click again — should transition back to unpressed
    await userEvent.click(innerButton!);

    await expect(toggleSpy).toHaveBeenCalledTimes(2);
    const secondCall = toggleSpy.mock.calls[1][0] as CustomEvent<{ pressed: boolean }>;
    await expect(secondCall.detail.pressed).toBe(false);
    await expect(innerButton!.getAttribute('aria-pressed')).toBe('false');

    hxToggleButton!.removeEventListener('hx-toggle', toggleSpy);
  },
};

// ─────────────────────────────────────────────────
// 14. KEYBOARD ACTIVATION — Space and Enter toggle the pressed state
// ─────────────────────────────────────────────────

export const KeyboardActivation: Story = {
  args: {
    label: 'Flag for Review',
    pressed: false,
  },
  play: async ({ canvasElement }) => {
    const hxToggleButton = canvasElement.querySelector('hx-toggle-button');
    await expect(hxToggleButton).toBeTruthy();

    const innerButton = hxToggleButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();

    // Tab to focus the toggle button
    await userEvent.tab();

    // Verify inner button receives focus
    const activeEl = hxToggleButton!.shadowRoot!.activeElement;
    await expect(activeEl).toBe(innerButton);

    // Press Space — should toggle to pressed
    const spaceSpy = fn();
    hxToggleButton!.addEventListener('hx-toggle', spaceSpy);
    await userEvent.keyboard(' ');
    await expect(spaceSpy).toHaveBeenCalledTimes(1);
    const spaceCall = spaceSpy.mock.calls[0][0] as CustomEvent<{ pressed: boolean }>;
    await expect(spaceCall.detail.pressed).toBe(true);
    hxToggleButton!.removeEventListener('hx-toggle', spaceSpy);

    // Press Space again — should toggle back to unpressed
    const spaceSpyTwo = fn();
    hxToggleButton!.addEventListener('hx-toggle', spaceSpyTwo);
    await userEvent.keyboard(' ');
    await expect(spaceSpyTwo).toHaveBeenCalledTimes(1);
    const spaceCallTwo = spaceSpyTwo.mock.calls[0][0] as CustomEvent<{ pressed: boolean }>;
    await expect(spaceCallTwo.detail.pressed).toBe(false);
    hxToggleButton!.removeEventListener('hx-toggle', spaceSpyTwo);

    // Press Enter — should toggle to pressed
    const enterSpy = fn();
    hxToggleButton!.addEventListener('hx-toggle', enterSpy);
    await userEvent.keyboard('{Enter}');
    await expect(enterSpy).toHaveBeenCalledTimes(1);
    const enterCall = enterSpy.mock.calls[0][0] as CustomEvent<{ pressed: boolean }>;
    await expect(enterCall.detail.pressed).toBe(true);
    hxToggleButton!.removeEventListener('hx-toggle', enterSpy);
  },
};

// ─────────────────────────────────────────────────
// 15. VIEW MODE TOGGLE — Healthcare scenario: Grid/List view toolbar
// ─────────────────────────────────────────────────

export const ViewModeToggle: Story = {
  name: 'Healthcare — View Mode Toggle',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 560px; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #f9fafb;"
    >
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Patient List</h3>
        <div
          style="display: flex; gap: 0.25rem;"
          role="toolbar"
          aria-label="Patient list view options"
        >
          <hx-toggle-button variant="outline" hx-size="sm" pressed aria-label="Grid view">
            <svg
              slot="prefix"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Grid View
          </hx-toggle-button>
          <hx-toggle-button variant="outline" hx-size="sm" aria-label="List view">
            <svg
              slot="prefix"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List View
          </hx-toggle-button>
        </div>
      </div>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        Use the toolbar above to switch between grid and list layout for the patient roster. The
        active view is indicated by the pressed state.
      </p>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 16. FILTER TOGGLE — Healthcare scenario: Active Patients filter
// ─────────────────────────────────────────────────

export const FilterToggle: Story = {
  name: 'Healthcare — Filter Toggle',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 560px; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;"
    >
      <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Patient Roster Filters</h3>
      <div
        style="display: flex; gap: 0.5rem; flex-wrap: wrap;"
        role="group"
        aria-label="Patient status filters"
      >
        <hx-toggle-button variant="outline" hx-size="sm" pressed>
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Active Patients
        </hx-toggle-button>
        <hx-toggle-button variant="outline" hx-size="sm">
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          All Patients
        </hx-toggle-button>
        <hx-toggle-button variant="outline" hx-size="sm">
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          High Acuity
        </hx-toggle-button>
        <hx-toggle-button variant="outline" hx-size="sm">
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Pending Discharge
        </hx-toggle-button>
        <hx-toggle-button variant="outline" hx-size="sm" disabled>
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Restricted View
        </hx-toggle-button>
      </div>
      <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">
        Pressed toggles indicate active filters. Multiple filters may be active simultaneously.
        Restricted view requires additional permissions.
      </p>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 17. FORM PARTICIPATION — Toggle button in a form with name/value
// ─────────────────────────────────────────────────

export const FormParticipation: Story = {
  name: 'Form Participation',
  render: () => html`
    <form
      id="filter-form"
      @submit=${(e: Event) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const entries = [...formData.entries()];
        const output = document.getElementById('form-output');
        if (output) {
          output.textContent =
            entries.length > 0
              ? entries.map(([k, v]) => `${k}=${v}`).join(', ')
              : '(no values — no toggles are pressed)';
        }
      }}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;"
    >
      <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Patient Dashboard Filters</h3>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        Toggle buttons participate in forms via ElementInternals. Their <code>value</code> is
        submitted only when <code>pressed</code>.
      </p>
      <div
        style="display: flex; gap: 0.5rem; flex-wrap: wrap;"
        role="group"
        aria-label="Status filters"
      >
        <hx-toggle-button variant="outline" hx-size="sm" name="status" value="active" pressed>
          Active Patients
        </hx-toggle-button>
        <hx-toggle-button variant="outline" hx-size="sm" name="status" value="high-acuity">
          High Acuity
        </hx-toggle-button>
        <hx-toggle-button variant="outline" hx-size="sm" name="view" value="flagged">
          Flagged for Review
        </hx-toggle-button>
      </div>
      <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
        <hx-toggle-button variant="secondary" hx-size="sm" name="priority" value="priority-only">
          Priority Only
          <svg
            slot="suffix"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            />
          </svg>
        </hx-toggle-button>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button
          type="submit"
          style="padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600; cursor: pointer;"
        >
          Apply Filters
        </button>
        <button
          type="reset"
          style="padding: 0.5rem 1rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600; cursor: pointer;"
        >
          Reset
        </button>
      </div>
      <div
        id="form-output"
        style="padding: 0.75rem; background: #f3f4f6; border-radius: 0.375rem; font-size: 0.8125rem; font-family: monospace; min-height: 2rem;"
      >
        Submit the form to see values.
      </div>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form');
    await expect(form).toBeTruthy();

    // The "Active Patients" toggle is pre-pressed with name="status" value="active"
    const activeToggle = canvasElement.querySelector('hx-toggle-button[value="active"]');
    await expect(activeToggle).toBeTruthy();
    await expect(activeToggle!.hasAttribute('pressed')).toBe(true);

    // Verify the form resets toggle state on reset
    const resetButton = form!.querySelector('button[type="reset"]');
    await expect(resetButton).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 18. DISABLED NO EVENT — disabled toggle fires no hx-toggle
// ─────────────────────────────────────────────────

export const DisabledNoEvent: Story = {
  name: 'Disabled — No Event Fired',
  args: {
    disabled: true,
    label: 'Restricted Toggle',
  },
  play: async ({ canvasElement }) => {
    const hxToggleButton = canvasElement.querySelector('hx-toggle-button');
    await expect(hxToggleButton).toBeTruthy();

    const innerButton = hxToggleButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();
    await expect(innerButton!.disabled).toBe(true);

    const toggleSpy = fn();
    hxToggleButton!.addEventListener('hx-toggle', toggleSpy);

    // Native click on a disabled inner button should not fire hx-toggle
    innerButton!.click();
    await expect(toggleSpy).toHaveBeenCalledTimes(0);

    // aria-pressed should not have changed
    await expect(innerButton!.getAttribute('aria-pressed')).toBe('false');

    hxToggleButton!.removeEventListener('hx-toggle', toggleSpy);
  },
};

// ─────────────────────────────────────────────────
// 19. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <style>
      .css-prop-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        max-width: 640px;
      }
      .css-prop-cell {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .css-prop-cell code {
        font-size: 0.75rem;
        color: #6b7280;
        font-family: monospace;
      }
    </style>
    <div class="css-prop-grid">
      <div class="css-prop-cell">
        <code>--hx-toggle-button-bg: #059669</code>
        <hx-toggle-button style="--hx-toggle-button-bg: #059669;"
          >Custom Background</hx-toggle-button
        >
      </div>

      <div class="css-prop-cell">
        <code>--hx-toggle-button-border-radius: 9999px</code>
        <hx-toggle-button style="--hx-toggle-button-border-radius: 9999px;"
          >Pill Shape</hx-toggle-button
        >
      </div>

      <div class="css-prop-cell">
        <code>pressed + --hx-toggle-button-pressed-bg</code>
        <hx-toggle-button
          pressed
          style="--hx-toggle-button-pressed-bg: #7c3aed; --hx-toggle-button-pressed-color: #fff;"
        >
          Custom Pressed BG
        </hx-toggle-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-toggle-button-focus-ring-color: #dc2626</code>
        <hx-toggle-button style="--hx-toggle-button-focus-ring-color: #dc2626;">
          Focus Ring (tab to see)
        </hx-toggle-button>
      </div>
    </div>

    <div style="margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem;">
      <strong>Usage</strong>
      <pre
        style="margin: 0.5rem 0 0; font-size: 0.8125rem; white-space: pre-wrap;"
      ><code>/* Override via host selector or inline style */
hx-toggle-button {
  --hx-toggle-button-pressed-bg: var(--hx-color-primary-700);
  --hx-toggle-button-border-radius: 9999px;
}</code></pre>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 20. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-toggle-button::part(button) {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        box-shadow: 0 2px 4px -1px rgb(0 0 0 / 0.15);
      }
      .parts-demo-label hx-toggle-button::part(label) {
        font-style: italic;
        font-weight: 700;
      }
    </style>

    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 640px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">
          Exposed part: <code>::part(button)</code>
        </p>
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #6b7280;">
          The inner native <code>&lt;button&gt;</code> is exposed via the <code>button</code> CSS
          part for external styling through Shadow DOM boundaries.
        </p>
      </div>

      <div class="parts-demo">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-toggle-button::part(button) { text-transform: uppercase; letter-spacing: 0.08em; }
        </code>
        <div style="display: flex; gap: 0.75rem;">
          <hx-toggle-button>Uppercase Style</hx-toggle-button>
          <hx-toggle-button pressed>Uppercase Pressed</hx-toggle-button>
        </div>
      </div>

      <div class="parts-demo-label">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-toggle-button::part(label) { font-style: italic; font-weight: 700; }
        </code>
        <div style="display: flex; gap: 0.75rem;">
          <hx-toggle-button>Styled Label</hx-toggle-button>
          <hx-toggle-button pressed>Styled Label Pressed</hx-toggle-button>
        </div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// DRUPAL / CDN INTEGRATION REFERENCE
// ─────────────────────────────────────────────────

/**
 * Drupal Twig integration reference for hx-toggle-button.
 *
 * A companion `hx-toggle-button.twig` template ships alongside this component.
 * It handles server-side pressed state, size, variant, and form binding.
 *
 * **Key Drupal integration points:**
 *
 * 1. **Pressed state from server** — Pass `pressed: true` from Twig to pre-render the button
 *    in pressed state (e.g., from a saved user preference or form field value).
 *
 * 2. **Size attribute** — The `size` property maps to the `hx-size` attribute (not `size`).
 *    The Twig template handles this automatically via `hx-size="{{ size|default('md') }}"`.
 *    Do not use `size=` directly in Twig — it will not work.
 *
 * 3. **Form integration** — The component uses ElementInternals for native form association.
 *    Set `name` and `value` attributes; when pressed, the value is submitted with the form.
 *
 * 4. **Exclusive toggle groups** — Use a Drupal behavior with `data-toggle-group` for
 *    radio-like exclusive selection (see `hx-toggle-button.twig` for the full behavior pattern).
 *
 * **Basic Twig usage:**
 * ```twig
 * {# Simple toggle — server-rendered pressed state #}
 * {% include 'hx-toggle-button.twig' with {
 *   label: 'Active Patients',
 *   name: 'filter',
 *   value: 'active',
 *   pressed: current_filter == 'active',
 * } %}
 *
 * {# Icon-only toggle — accessible name via aria_label #}
 * {% include 'hx-toggle-button.twig' with {
 *   aria_label: 'Grid view',
 *   variant: 'outline',
 *   size: 'sm',
 *   pressed: drupal_settings.viewMode == 'grid',
 * } %}
 *
 * {# Exclusive view-mode toggle group #}
 * <div role="group" aria-label="View mode">
 *   {% include 'hx-toggle-button.twig' with {
 *     label: 'List',
 *     data_toggle_group: 'view-mode',
 *     pressed: view_mode == 'list',
 *   } %}
 *   {% include 'hx-toggle-button.twig' with {
 *     label: 'Grid',
 *     data_toggle_group: 'view-mode',
 *     pressed: view_mode == 'grid',
 *   } %}
 * </div>
 * ```
 *
 * **Library registration** (`mytheme.libraries.yml`):
 * ```yaml
 * hx-toggle-button:
 *   js:
 *     path/to/@helixui/library/dist/hx-toggle-button.js: { attributes: { type: module } }
 *   dependencies:
 *     - core/drupal
 *     - core/once
 * ```
 */
export const DrupalIntegration: Story = {
  name: 'Drupal / CDN Integration',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 560px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6b7280; font-weight: 600;">
          Server-rendered pressed state (from Twig variable)
        </p>
        <div style="display: flex; gap: 0.75rem;">
          <hx-toggle-button pressed>Active Patients</hx-toggle-button>
          <hx-toggle-button>Discharged</hx-toggle-button>
        </div>
        <p style="margin: 0.5rem 0 0; font-size: 0.75rem; color: #9ca3af;">
          pressed attribute set server-side from Drupal filter state
        </p>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6b7280; font-weight: 600;">
          Exclusive view-mode toggle group (Drupal behavior pattern)
        </p>
        <div role="group" aria-label="View mode" style="display: flex; gap: 0.5rem;">
          <hx-toggle-button variant="outline" hx-size="sm" pressed>List</hx-toggle-button>
          <hx-toggle-button variant="outline" hx-size="sm">Grid</hx-toggle-button>
        </div>
        <p style="margin: 0.5rem 0 0; font-size: 0.75rem; color: #9ca3af;">
          data-toggle-group + Drupal behavior enforces single-active semantics
        </p>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6b7280; font-weight: 600;">
          Form-associated toggle (name + value submitted when pressed)
        </p>
        <form style="display: flex; gap: 0.75rem; align-items: center;">
          <hx-toggle-button name="notifications" value="enabled" variant="primary">
            Email Alerts
          </hx-toggle-button>
          <span style="font-size: 0.75rem; color: #6b7280;">
            Submitted as notifications=enabled when pressed
          </span>
        </form>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6b7280; font-weight: 600;">
          Disabled state — server-rendered (e.g., permission check in Twig)
        </p>
        <hx-toggle-button disabled>Feature Disabled</hx-toggle-button>
      </div>
    </div>
  `,
};
