import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './hx-time-picker.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

/**
 * `hx-time-picker` is a form-associated time picker with a combobox pattern:
 * a text input with format masking and a dropdown listbox of pre-generated
 * time slots. Supports both 12-hour (AM/PM) and 24-hour display formats.
 *
 * Designed for enterprise healthcare scheduling workflows where precise,
 * accessible time selection is critical.
 *
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ ARIA Combobox Pattern}
 */
const meta = {
  title: 'Components/Time Picker',
  component: 'hx-time-picker',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text for the field.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description:
        'The name submitted with the form. The submitted value is always HH:MM (24-hour).',
      table: {
        category: 'Form',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The current value in HH:MM (24-hour) format.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    min: {
      control: 'text',
      description: 'The earliest selectable time in HH:MM format.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: "'00:00'" },
        type: { summary: 'string' },
      },
    },
    max: {
      control: 'text',
      description: 'The latest selectable time in HH:MM format.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: "'23:59'" },
        type: { summary: 'string' },
      },
    },
    step: {
      control: { type: 'number', min: 1, max: 120, step: 1 },
      description: 'Step interval between dropdown options, in minutes.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '30' },
        type: { summary: 'number' },
      },
    },
    format: {
      control: { type: 'select' },
      options: ['12h', '24h'],
      description: "Display format. '12h' shows AM/PM; '24h' shows bare HH:MM.",
      table: {
        category: 'Behavior',
        defaultValue: { summary: "'12h'" },
        type: { summary: "'12h' | '24h'" },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required for form submission.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the field is disabled. Prevents all interaction.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display. When set, the field enters an error state.',
      table: {
        category: 'Validation',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    label: 'Select Time',
    name: '',
    value: '',
    min: '00:00',
    max: '23:59',
    step: 30,
    format: '12h',
    required: false,
    disabled: false,
    error: '',
  },
  render: (args) => html`
    <hx-time-picker
      label=${args.label}
      name=${args.name}
      value=${args.value}
      min=${args.min}
      max=${args.max}
      step=${args.step}
      format=${args.format}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
    ></hx-time-picker>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// Helper: Query the native input inside shadow DOM
// ─────────────────────────────────────────────────

function getNativeInput(canvasElement: HTMLElement): HTMLInputElement {
  const host = canvasElement.querySelector('hx-time-picker');
  if (!host || !host.shadowRoot) {
    throw new Error('hx-time-picker not found or shadowRoot unavailable');
  }
  const input = host.shadowRoot.querySelector('input');
  if (!input) {
    throw new Error('Native <input> not found inside hx-time-picker shadow DOM');
  }
  return input;
}

// ─────────────────────────────────────────────────
// 1. DEFAULT — Basic time picker with label
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Select Time',
    step: 30,
    format: '12h',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-time-picker')!;
    await expect(host).toBeTruthy();

    const shadow = within(host.shadowRoot! as unknown as HTMLElement);
    const label = shadow.getByText('Select Time');
    await expect(label).toBeTruthy();

    const input = getNativeInput(canvasElement);
    await expect(input).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. WITH 12-HOUR FORMAT — AM/PM display, business hours
// ─────────────────────────────────────────────────

export const With12HourFormat: Story = {
  name: 'Format: 12-Hour (AM/PM)',
  args: {
    label: 'Appointment Time',
    format: '12h',
    step: 30,
    min: '08:00',
    max: '17:00',
  },
};

// ─────────────────────────────────────────────────
// 3. WITH 24-HOUR FORMAT — HH:MM bare display
// ─────────────────────────────────────────────────

export const With24HourFormat: Story = {
  name: 'Format: 24-Hour',
  args: {
    label: 'Appointment Time',
    format: '24h',
    step: 15,
  },
};

// ─────────────────────────────────────────────────
// 4. APPOINTMENT SCHEDULER — Primary healthcare use case
// ─────────────────────────────────────────────────

export const AppointmentScheduler: Story = {
  name: 'Healthcare: Appointment Scheduler',
  args: {
    name: 'appointment_time',
    label: 'Appointment Time',
    min: '08:00',
    max: '17:00',
    step: 15,
    format: '12h',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-time-picker')!;
    await expect(host).toBeTruthy();

    const shadow = within(host.shadowRoot! as unknown as HTMLElement);
    const label = shadow.getByText('Appointment Time');
    await expect(label).toBeTruthy();

    const input = getNativeInput(canvasElement);
    await expect(input.placeholder).toBe('hh:mm AM');
  },
};

// ─────────────────────────────────────────────────
// 5. REQUIRED — Required field with asterisk marker
// ─────────────────────────────────────────────────

export const Required: Story = {
  args: {
    label: 'Check-In Time',
    required: true,
    step: 30,
    format: '12h',
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.required).toBe(true);
    await expect(input.getAttribute('aria-required')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 6. DISABLED — Non-interactive with pre-set value
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    label: 'Scheduled Time',
    value: '14:30',
    disabled: true,
    format: '12h',
    step: 30,
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.disabled).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 7. WITH ERROR — Validation error state
// ─────────────────────────────────────────────────

export const WithError: Story = {
  args: {
    label: 'Appointment Time',
    error: 'Please select a valid appointment time.',
    step: 30,
    format: '12h',
    min: '08:00',
    max: '17:00',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-time-picker')!;
    const shadow = within(host.shadowRoot! as unknown as HTMLElement);
    const errorMessage = shadow.getByText('Please select a valid appointment time.');
    await expect(errorMessage).toBeTruthy();

    const input = getNativeInput(canvasElement);
    await expect(input.getAttribute('aria-invalid')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 8. WITH SMALL STEP — 15-minute intervals
// ─────────────────────────────────────────────────

export const WithSmallStep: Story = {
  name: 'Step: 15 Minutes',
  args: {
    label: 'Procedure Time',
    step: 15,
    format: '12h',
    min: '06:00',
    max: '18:00',
  },
};

// ─────────────────────────────────────────────────
// 9. WITH LARGE STEP — 60-minute intervals
// ─────────────────────────────────────────────────

export const WithLargeStep: Story = {
  name: 'Step: 60 Minutes',
  args: {
    label: 'Shift Start Time',
    step: 60,
    format: '24h',
    min: '00:00',
    max: '23:00',
  },
};

// ─────────────────────────────────────────────────
// 10. ALL STATES — Kitchen sink visual reference
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 360px;">
      <hx-time-picker label="Default (empty)" step="30" format="12h"></hx-time-picker>

      <hx-time-picker
        label="With Preset Value"
        value="09:30"
        step="30"
        format="12h"
      ></hx-time-picker>

      <hx-time-picker
        label="Required Field"
        step="30"
        format="12h"
        required
      ></hx-time-picker>

      <hx-time-picker
        label="Error State"
        error="Please select a valid appointment time."
        step="30"
        format="12h"
        min="08:00"
        max="17:00"
      ></hx-time-picker>

      <hx-time-picker
        label="Disabled (pre-set)"
        value="14:30"
        step="30"
        format="12h"
        disabled
      ></hx-time-picker>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 11. FORMAT COMPARISON — 12h vs 24h side by side
// ─────────────────────────────────────────────────

export const FormatComparison: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; flex-wrap: wrap; max-width: 760px;">
      <div style="flex: 1; min-width: 280px;">
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          12-Hour Format (default)
        </p>
        <hx-time-picker
          label="Appointment Time"
          step="30"
          format="12h"
          min="08:00"
          max="17:00"
        ></hx-time-picker>
      </div>
      <div style="flex: 1; min-width: 280px;">
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          24-Hour Format
        </p>
        <hx-time-picker
          label="Appointment Time"
          step="30"
          format="24h"
          min="08:00"
          max="17:00"
        ></hx-time-picker>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 12. SLOT DEMOS — Drupal integration patterns
// ─────────────────────────────────────────────────

export const WithLabelSlot: Story = {
  name: 'With Label Slot (Drupal Form API)',
  render: () => html`
    <hx-time-picker step="30" format="12h" min="08:00" max="17:00" name="appointment_time">
      <label
        slot="label"
        style="font-size: 0.875rem; font-weight: 500; color: var(--hx-color-neutral-700, #343a40);"
      >
        Appointment Time
        <span style="color: var(--hx-color-error-500, #dc3545);">*</span>
      </label>
    </hx-time-picker>
  `,
};

export const WithHelpSlot: Story = {
  name: 'With Help Slot',
  render: () => html`
    <hx-time-picker label="Procedure Start Time" step="15" format="12h" min="07:00" max="19:00">
      <div
        slot="help"
        style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Select the scheduled start time for this procedure. Times are shown in 15-minute intervals.
      </div>
    </hx-time-picker>
  `,
};

export const WithErrorSlot: Story = {
  name: 'With Error Slot (Drupal Form API)',
  render: () => html`
    <hx-time-picker
      label="Appointment Time"
      step="30"
      format="12h"
      min="08:00"
      max="17:00"
      name="appointment_time"
    >
      <div
        slot="error"
        style="display: flex; align-items: center; gap: 0.25rem; color: var(--hx-color-error-500, #dc3545); font-size: 0.75rem;"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM8 12a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
        No appointment slot is available at the selected time. Please choose a time between 8:00 AM
        and 5:00 PM.
      </div>
    </hx-time-picker>
  `,
};

// ─────────────────────────────────────────────────
// 13. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 360px;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Default (all tokens at defaults)
        </p>
        <hx-time-picker label="Standard Appearance" step="30" format="12h"></hx-time-picker>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Custom border radius + border color
        </p>
        <hx-time-picker
          label="Rounded Picker"
          step="30"
          format="12h"
          style="--hx-time-picker-border-radius: 9999px; --hx-time-picker-border-color: #2563EB;"
        ></hx-time-picker>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Dark surface
        </p>
        <hx-time-picker
          label="Dark Theme"
          step="30"
          format="12h"
          style="
            --hx-time-picker-bg: #1e293b;
            --hx-time-picker-color: #f1f5f9;
            --hx-time-picker-border-color: #334155;
            --hx-time-picker-label-color: #94a3b8;
            --hx-time-picker-chevron-color: #94a3b8;
            --hx-time-picker-listbox-bg: #1e293b;
            --hx-time-picker-option-color: #f1f5f9;
          "
        ></hx-time-picker>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Custom focus ring color (click to focus)
        </p>
        <hx-time-picker
          label="Green Focus Ring"
          step="30"
          format="12h"
          style="--hx-time-picker-focus-ring-color: #198754;"
        ></hx-time-picker>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Custom error color
        </p>
        <hx-time-picker
          label="Custom Error"
          error="Invalid time selection."
          step="30"
          format="12h"
          style="--hx-time-picker-error-color: #dc6502;"
        ></hx-time-picker>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 14. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .css-parts-demo hx-time-picker::part(label) {
        color: #0d6efd;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
      }

      .css-parts-demo hx-time-picker::part(input) {
        font-weight: 500;
        color: #212529;
      }

      .css-parts-demo hx-time-picker::part(listbox) {
        border: 2px solid #0d6efd;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
      }

      .css-parts-demo hx-time-picker::part(option) {
        font-weight: 500;
      }
    </style>

    <div
      class="css-parts-demo"
      style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 360px;"
    >
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;"
        >
          Parts styled: label, input, listbox, option
        </p>
        <hx-time-picker
          label="Styled via ::part()"
          step="30"
          format="12h"
          min="08:00"
          max="17:00"
        ></hx-time-picker>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 15. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  args: {
    label: 'Appointment Time',
    step: 30,
    format: '12h',
    min: '08:00',
    max: '17:00',
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);

    // Focus the input
    input.focus();
    await expect(input).toBeTruthy();

    // Press ArrowDown to open the listbox
    await userEvent.keyboard('{ArrowDown}');

    // Press ArrowDown to advance to the next option
    await userEvent.keyboard('{ArrowDown}');

    // Press Escape to close
    await userEvent.keyboard('{Escape}');

    const host = canvasElement.querySelector('hx-time-picker')!;
    const shadow = host.shadowRoot!;
    const listbox = shadow.querySelector('[role="listbox"]');
    await expect(listbox).toBeNull();
  },
};

export const EventVerification: Story = {
  args: {
    label: 'Appointment Time',
    name: 'appointment_time',
    step: 30,
    format: '12h',
    min: '08:00',
    max: '17:00',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-time-picker')!;
    const input = getNativeInput(canvasElement);

    let changeEventFired = false;
    let changeDetail = '';

    host.addEventListener('hx-change', ((e: CustomEvent<{ value: string }>) => {
      changeEventFired = true;
      changeDetail = e.detail.value;
    }) as EventListener);

    // Open the listbox via ArrowDown, select the first option with Enter
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    await expect(changeEventFired).toBe(true);
    // Detail value is HH:MM 24-hour format
    await expect(changeDetail).toMatch(/^\d{2}:\d{2}$/);
  },
};

export const DisabledNoInteraction: Story = {
  args: {
    label: 'Locked Time',
    value: '10:00',
    disabled: true,
    step: 30,
    format: '12h',
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.disabled).toBe(true);

    const host = canvasElement.querySelector('hx-time-picker')!;
    await expect(host.getAttribute('disabled')).not.toBeNull();
  },
};

export const FocusManagement: Story = {
  args: {
    label: 'Focusable Time Picker',
    step: 30,
    format: '12h',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-time-picker')!;
    const input = getNativeInput(canvasElement);

    // Programmatically call focus() on the host — delegates to inner input
    host.focus();

    await expect(host.shadowRoot?.activeElement).toBe(input);
  },
};

// ─────────────────────────────────────────────────
// 16. FORM INTEGRATION
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => html`
    <form
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
      }}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;"
    >
      <hx-time-picker
        label="Appointment Time"
        name="appointment_time"
        step="15"
        format="12h"
        min="08:00"
        max="17:00"
        required
      ></hx-time-picker>

      <hx-time-picker
        label="Follow-up Time"
        name="followup_time"
        step="30"
        format="12h"
        min="08:00"
        max="17:00"
      ></hx-time-picker>

      <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
        <button
          type="submit"
          style="padding: 0.5rem 1rem; background: #2563EB; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
        >
          Schedule Appointment
        </button>
        <button
          type="reset"
          style="padding: 0.5rem 1rem; background: transparent; color: #6c757d; border: 1px solid #dee2e6; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
        >
          Reset
        </button>
      </div>
    </form>
  `,
};

// ─────────────────────────────────────────────────
// 17. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const SurgerySchedule: Story = {
  name: 'Healthcare: Surgery Schedule',
  render: () => html`
    <div
      style="
      padding: 1.5rem;
      border: 1px solid #dee2e6;
      border-radius: 0.5rem;
      max-width: 400px;
      background: #fff;
    "
    >
      <h3 style="margin: 0 0 1rem; font-size: 1rem; font-weight: 600; color: #212529;">
        OR Scheduling
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <hx-time-picker
          label="Procedure Start Time"
          name="procedure_start"
          step="15"
          format="12h"
          min="06:00"
          max="18:00"
          required
        ></hx-time-picker>

        <hx-time-picker
          label="Expected End Time"
          name="procedure_end"
          step="15"
          format="12h"
          min="06:00"
          max="20:00"
        ></hx-time-picker>

        <hx-time-picker
          label="Recovery Room Available From"
          name="recovery_from"
          step="30"
          format="12h"
          min="06:00"
          max="22:00"
        ></hx-time-picker>
      </div>
    </div>
  `,
};

export const MedicationSchedule: Story = {
  name: 'Healthcare: Medication Administration',
  render: () => html`
    <div
      style="
      padding: 1.5rem;
      border: 1px solid #dee2e6;
      border-radius: 0.5rem;
      max-width: 400px;
      background: #fff;
    "
    >
      <h3 style="margin: 0 0 1rem; font-size: 1rem; font-weight: 600; color: #212529;">
        Medication Administration Times
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <hx-time-picker
          label="Morning Dose"
          name="dose_morning"
          step="30"
          format="12h"
          min="05:00"
          max="11:00"
        ></hx-time-picker>

        <hx-time-picker
          label="Afternoon Dose"
          name="dose_afternoon"
          step="30"
          format="12h"
          min="11:00"
          max="16:00"
        ></hx-time-picker>

        <hx-time-picker
          label="Evening Dose"
          name="dose_evening"
          step="30"
          format="12h"
          min="16:00"
          max="22:00"
        ></hx-time-picker>
      </div>
    </div>
  `,
};

export const ShiftHandoff: Story = {
  name: 'Healthcare: Shift Handoff',
  render: () => html`
    <div
      style="
      padding: 1.5rem;
      border: 1px solid #dee2e6;
      border-radius: 0.5rem;
      max-width: 400px;
      background: #fff;
    "
    >
      <h3 style="margin: 0 0 1rem; font-size: 1rem; font-weight: 600; color: #212529;">
        Nursing Shift Times
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <hx-time-picker
          label="Day Shift Start"
          value="07:00"
          name="shift_day"
          step="60"
          format="12h"
          min="06:00"
          max="10:00"
        ></hx-time-picker>

        <hx-time-picker
          label="Evening Shift Start"
          value="15:00"
          name="shift_evening"
          step="60"
          format="12h"
          min="14:00"
          max="17:00"
        ></hx-time-picker>

        <hx-time-picker
          label="Night Shift Start"
          value="23:00"
          name="shift_night"
          step="60"
          format="24h"
          min="22:00"
          max="23:59"
        ></hx-time-picker>
      </div>
    </div>
  `,
};
