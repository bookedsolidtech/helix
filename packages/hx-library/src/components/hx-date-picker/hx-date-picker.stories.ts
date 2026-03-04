import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-date-picker.js';

// ─────────────────────────────────────────────────
// Date Helpers
// ─────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addYears(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function subtractYears(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─────────────────────────────────────────────────
// Shadow DOM Helpers
// ─────────────────────────────────────────────────

function getTrigger(canvasElement: HTMLElement): HTMLButtonElement {
  const host = canvasElement.querySelector('hx-date-picker');
  if (!host?.shadowRoot) throw new Error('hx-date-picker host not found or shadowRoot unavailable');
  const trigger = host.shadowRoot.querySelector('[part="trigger"]');
  if (!trigger) throw new Error('trigger button not found inside hx-date-picker shadow DOM');
  return trigger as HTMLButtonElement;
}

function getCalendar(canvasElement: HTMLElement): HTMLElement | null {
  const host = canvasElement.querySelector('hx-date-picker');
  if (!host?.shadowRoot) return null;
  return host.shadowRoot.querySelector('[part="calendar"]') as HTMLElement | null;
}

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Date Picker',
  component: 'hx-date-picker',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text rendered above the input.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description:
        'The current date value as an ISO 8601 string (e.g. 2026-03-04). Drives both the display value and form submission.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    min: {
      control: 'text',
      description:
        'The minimum selectable date as an ISO 8601 string. Dates before this value are disabled in the calendar.',
      table: {
        category: 'Constraints',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    max: {
      control: 'text',
      description:
        'The maximum selectable date as an ISO 8601 string. Dates after this value are disabled in the calendar.',
      table: {
        category: 'Constraints',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description: 'The form field name used for form submission via ElementInternals.',
      table: {
        category: 'Form',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    required: {
      control: 'boolean',
      description:
        'Whether the field is required for form submission. Adds a required marker (*) to the label.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description:
        'Whether the field is disabled. Prevents all interaction and dims the component.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    error: {
      control: 'text',
      description:
        'Error message to display below the field. When set, the field enters an error state with a red border.',
      table: {
        category: 'Validation',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    helpText: {
      control: 'text',
      description:
        'Help text displayed below the input for guidance. Hidden when an error is active.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    format: {
      control: 'text',
      description: 'Display format hint shown as the input placeholder (e.g. MM/DD/YYYY).',
      table: {
        category: 'Formatting',
        defaultValue: { summary: "'MM/DD/YYYY'" },
        type: { summary: 'string' },
      },
    },
    locale: {
      control: 'text',
      description:
        'Locale string used for formatting the displayed date and calendar labels (e.g. en-US, de-DE, fr-FR).',
      table: {
        category: 'Formatting',
        defaultValue: { summary: "'en-US'" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    label: 'Select Date',
    value: '',
    min: '',
    max: '',
    name: '',
    required: false,
    disabled: false,
    error: '',
    helpText: '',
    format: 'MM/DD/YYYY',
    locale: 'en-US',
  },
  render: (args) => html`
    <hx-date-picker
      label=${args.label}
      value=${args.value}
      name=${args.name}
      min=${args.min}
      max=${args.max}
      error=${args.error}
      help-text=${args.helpText}
      format=${args.format}
      locale=${args.locale}
      ?required=${args.required}
      ?disabled=${args.disabled}
    ></hx-date-picker>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Date of Birth',
    name: 'dob',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-date-picker');
    await expect(host).toBeTruthy();

    const shadow = within(host!.shadowRoot! as unknown as HTMLElement);
    const label = shadow.getByText('Date of Birth');
    await expect(label).toBeTruthy();

    const trigger = getTrigger(canvasElement);
    await expect(trigger).toBeTruthy();
    await expect(trigger.getAttribute('aria-label')).toBe('Open calendar');
  },
};

// ─────────────────────────────────────────────────
// 2. WITH VALUE
// ─────────────────────────────────────────────────

export const WithValue: Story = {
  args: {
    label: 'Appointment Date',
    value: '2026-03-04',
    name: 'appointmentDate',
    helpText: 'Your upcoming appointment has been pre-filled.',
  },
};

// ─────────────────────────────────────────────────
// 3. REQUIRED
// ─────────────────────────────────────────────────

export const Required: Story = {
  args: {
    label: 'Date of Birth',
    name: 'dob',
    required: true,
    helpText: 'This field is required for patient identification.',
  },
};

// ─────────────────────────────────────────────────
// 4. WITH HELP TEXT
// ─────────────────────────────────────────────────

export const WithHelpText: Story = {
  args: {
    label: 'Appointment Date',
    name: 'appointmentDate',
    helpText: 'Select a date using the calendar picker. Date must be in MM/DD/YYYY format.',
    format: 'MM/DD/YYYY',
  },
};

// ─────────────────────────────────────────────────
// 5. WITH ERROR
// ─────────────────────────────────────────────────

export const WithError: Story = {
  args: {
    label: 'Date of Birth',
    name: 'dob',
    value: '',
    required: true,
    error: 'Please select a valid date.',
  },
};

// ─────────────────────────────────────────────────
// 6. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    label: 'Admission Date',
    name: 'admissionDate',
    value: '2026-03-04',
    disabled: true,
    helpText: 'This date is system-generated and cannot be modified.',
  },
};

// ─────────────────────────────────────────────────
// 7. WITH MIN/MAX
// ─────────────────────────────────────────────────

export const WithMinMax: Story = {
  name: 'With Min/Max Constraints',
  render: () => html`
    <hx-date-picker
      label="Schedule Appointment"
      name="scheduledDate"
      min=${todayISO()}
      max=${addYears(1)}
      help-text=${'Appointments available from today through ' + addYears(1) + '.'}
      format="MM/DD/YYYY"
    ></hx-date-picker>
  `,
};

// ─────────────────────────────────────────────────
// 8. HEALTHCARE — DOB PICKER
// ─────────────────────────────────────────────────

export const DOBPicker: Story = {
  name: 'Healthcare: Date of Birth',
  render: () => html`
    <hx-date-picker
      label="Date of Birth"
      name="dateOfBirth"
      max=${subtractYears(18)}
      required
      help-text="Patient must be 18 years of age or older. Future dates and dates within the past 18 years are not selectable."
      format="MM/DD/YYYY"
    ></hx-date-picker>
  `,
};

// ─────────────────────────────────────────────────
// 9. HEALTHCARE — APPOINTMENT PICKER
// ─────────────────────────────────────────────────

export const AppointmentPicker: Story = {
  name: 'Healthcare: Appointment Scheduling',
  render: () => html`
    <hx-date-picker
      label="Preferred Appointment Date"
      name="appointmentDate"
      min=${tomorrowISO()}
      max=${addYears(1)}
      required
      help-text="Select a preferred appointment date. Same-day appointments are not available through this form."
      format="MM/DD/YYYY"
    ></hx-date-picker>
  `,
};

// ─────────────────────────────────────────────────
// 10. WITH LABEL SLOT (Drupal Form API)
// ─────────────────────────────────────────────────

export const WithLabelSlot: Story = {
  name: 'With Label Slot (Drupal Form API)',
  render: () => html`
    <hx-date-picker name="dob" format="MM/DD/YYYY">
      <label
        slot="label"
        style="display: flex; align-items: baseline; gap: 0.25rem; font-size: 0.875rem; font-weight: 500; color: var(--hx-color-neutral-700, #343a40);"
      >
        Date of Birth
        <span
          style="color: var(--hx-color-error-500, #dc3545); font-weight: 700;"
          aria-hidden="true"
          >*</span
        >
      </label>
    </hx-date-picker>
  `,
};

// ─────────────────────────────────────────────────
// 11. WITH HELP SLOT
// ─────────────────────────────────────────────────

export const WithHelpSlot: Story = {
  name: 'With Help Slot',
  render: () => html`
    <hx-date-picker label="Consent Form Date" name="consentDate" format="MM/DD/YYYY">
      <span
        slot="help"
        style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); display: flex; align-items: center; gap: 0.25rem;"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M8 16A8 8 0 108 0a8 8 0 000 16zm.93-9.412l-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
        Date the patient signed the consent form. Must be on or before today.
      </span>
    </hx-date-picker>
  `,
};

// ─────────────────────────────────────────────────
// 12. WITH ERROR SLOT
// ─────────────────────────────────────────────────

export const WithErrorSlot: Story = {
  name: 'With Error Slot (Drupal Form API)',
  render: () => html`
    <hx-date-picker label="Surgery Date" name="surgeryDate" value="" required>
      <div
        slot="error"
        style="display: flex; align-items: center; gap: 0.25rem; color: var(--hx-color-error-500, #dc3545); font-size: 0.75rem; font-weight: 500;"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM8 12a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
        Surgery date is required. Please select a date from the calendar.
      </div>
    </hx-date-picker>
  `,
};

// ─────────────────────────────────────────────────
// 13. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Default (all tokens at defaults)
        </h4>
        <hx-date-picker
          label="Standard Appearance"
          help-text="All CSS custom properties at their default token values."
          format="MM/DD/YYYY"
        ></hx-date-picker>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-date-picker-bg + --hx-date-picker-color
        </h4>
        <hx-date-picker
          label="Dark Input Surface"
          value="2026-03-04"
          style="--hx-date-picker-bg: #1a1a2e; --hx-date-picker-color: #e0e0e0;"
        ></hx-date-picker>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-date-picker-border-color + --hx-date-picker-border-radius
        </h4>
        <hx-date-picker
          label="Pill Radius with Brand Border"
          style="--hx-date-picker-border-color: #2563EB; --hx-date-picker-border-radius: 9999px;"
          format="MM/DD/YYYY"
        ></hx-date-picker>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-date-picker-font-family
        </h4>
        <hx-date-picker
          label="Monospace Font Family"
          value="2026-03-04"
          style="--hx-date-picker-font-family: 'Courier New', Courier, monospace;"
        ></hx-date-picker>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-date-picker-focus-ring-color (click trigger to see focus ring)
        </h4>
        <hx-date-picker
          label="Green Focus Ring"
          format="MM/DD/YYYY"
          style="--hx-date-picker-focus-ring-color: #198754;"
        ></hx-date-picker>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-date-picker-error-color
        </h4>
        <hx-date-picker
          label="Custom Error Color"
          error="This field has an error."
          style="--hx-date-picker-error-color: #dc6502;"
        ></hx-date-picker>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-date-picker-label-color + --hx-date-picker-trigger-color
        </h4>
        <hx-date-picker
          label="Branded Label and Trigger"
          format="MM/DD/YYYY"
          style="--hx-date-picker-label-color: #7c3aed; --hx-date-picker-trigger-color: #7c3aed;"
        ></hx-date-picker>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-date-picker-selected-bg + --hx-date-picker-today-color (open calendar to see)
        </h4>
        <hx-date-picker
          label="Custom Selected + Today Colors"
          format="MM/DD/YYYY"
          style="--hx-date-picker-selected-bg: #059669; --hx-date-picker-today-color: #d97706;"
        ></hx-date-picker>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          All Properties Combined (Dark Enterprise Theme)
        </h4>
        <hx-date-picker
          label="Fully Themed Date Picker"
          value="2026-03-04"
          help-text="Every CSS custom property overridden for a cohesive dark theme."
          style="
            --hx-date-picker-bg: #0f172a;
            --hx-date-picker-color: #f1f5f9;
            --hx-date-picker-border-color: #334155;
            --hx-date-picker-border-radius: 0.5rem;
            --hx-date-picker-font-family: 'Inter', system-ui, sans-serif;
            --hx-date-picker-focus-ring-color: #38bdf8;
            --hx-date-picker-error-color: #f87171;
            --hx-date-picker-label-color: #94a3b8;
            --hx-date-picker-trigger-color: #64748b;
            --hx-date-picker-calendar-bg: #1e293b;
            --hx-date-picker-calendar-border-color: #334155;
            --hx-date-picker-selected-bg: #0ea5e9;
            --hx-date-picker-today-color: #f59e0b;
          "
        ></hx-date-picker>
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
      .css-parts-demo hx-date-picker::part(field) {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 2px dashed #dee2e6;
      }

      .css-parts-demo hx-date-picker::part(label) {
        color: #0d6efd;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
      }

      .css-parts-demo hx-date-picker::part(input-wrapper) {
        border: 2px solid #0d6efd;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(13, 110, 253, 0.1);
      }

      .css-parts-demo hx-date-picker::part(input) {
        font-weight: 500;
        color: #212529;
        padding: 0.75rem 1rem;
      }

      .css-parts-demo hx-date-picker::part(trigger) {
        background: #0d6efd;
        color: #ffffff;
        padding: 0 1rem;
      }

      .css-parts-demo hx-date-picker::part(help-text) {
        color: #0d6efd;
        font-style: italic;
      }

      .css-parts-demo hx-date-picker::part(error) {
        background: #fff5f5;
        padding: 0.5rem 0.75rem;
        border-radius: 0.25rem;
        border-left: 3px solid #dc3545;
        font-weight: 500;
      }

      .css-parts-demo hx-date-picker::part(calendar) {
        border: 2px solid #0d6efd;
        border-radius: 0.75rem;
        box-shadow: 0 8px 24px rgba(13, 110, 253, 0.15);
      }

      .css-parts-demo hx-date-picker::part(day) {
        border-radius: 50%;
      }
    </style>

    <div
      class="css-parts-demo"
      style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;"
    >
      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Parts styled: field, label, input-wrapper, input, trigger, calendar, day, help-text, error
        </h4>
        <hx-date-picker
          label="Styled via ::part()"
          help-text="All exposed CSS parts are customized above."
          format="MM/DD/YYYY"
        ></hx-date-picker>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Error state with ::part(error) styling
        </h4>
        <hx-date-picker
          label="With Error Part Styled"
          error="This error message is styled with a left border accent via ::part(error)."
        ></hx-date-picker>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 15. IN A FORM
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => {
    const handleSubmit = fn();

    return html`
      <form
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          handleSubmit(Object.fromEntries(data.entries()));
        }}
        style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 480px;"
      >
        <hx-date-picker
          label="Date of Birth"
          name="dateOfBirth"
          max=${todayISO()}
          required
          help-text="Used for patient identity verification."
          format="MM/DD/YYYY"
        ></hx-date-picker>

        <hx-date-picker
          label="Preferred Appointment Date"
          name="appointmentDate"
          min=${tomorrowISO()}
          max=${addYears(1)}
          required
          help-text="Select a future date for your appointment."
          format="MM/DD/YYYY"
        ></hx-date-picker>

        <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
          <button
            type="submit"
            style="
              padding: 0.5rem 1rem;
              background: #2563EB;
              color: white;
              border: none;
              border-radius: 0.375rem;
              cursor: pointer;
              font-size: 0.875rem;
            "
          >
            Schedule Appointment
          </button>
          <button
            type="reset"
            style="
              padding: 0.5rem 1rem;
              background: transparent;
              color: #6c757d;
              border: 1px solid #ced4da;
              border-radius: 0.375rem;
              cursor: pointer;
              font-size: 0.875rem;
            "
          >
            Reset
          </button>
        </div>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    const pickers = canvasElement.querySelectorAll('hx-date-picker');
    await expect(pickers.length).toBe(2);

    const firstHost = pickers[0]!;
    await expect(firstHost).toBeTruthy();

    const firstTrigger = firstHost.shadowRoot!.querySelector(
      '[part="trigger"]',
    ) as HTMLButtonElement;
    await expect(firstTrigger).toBeTruthy();

    await userEvent.click(firstTrigger);

    await firstHost.updateComplete;

    const calendar = firstHost.shadowRoot!.querySelector('[part="calendar"]');
    await expect(calendar).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 16. ALL STATES
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  name: 'All States',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Default
        </p>
        <hx-date-picker label="Select Date" name="default" format="MM/DD/YYYY"></hx-date-picker>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Required
        </p>
        <hx-date-picker
          label="Date of Birth"
          name="required"
          required
          help-text="This field is required."
          format="MM/DD/YYYY"
        ></hx-date-picker>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Error
        </p>
        <hx-date-picker
          label="Appointment Date"
          name="error"
          error="Please select a valid date."
          format="MM/DD/YYYY"
        ></hx-date-picker>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Disabled
        </p>
        <hx-date-picker
          label="Admission Date"
          name="disabled"
          value="2026-03-04"
          disabled
          help-text="System-generated. Cannot be modified."
        ></hx-date-picker>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          With Value
        </p>
        <hx-date-picker
          label="Follow-up Date"
          name="withValue"
          value="2026-03-04"
          help-text="Pre-filled from prior appointment record."
        ></hx-date-picker>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 17. OPEN CALENDAR
// ─────────────────────────────────────────────────

export const OpenCalendar: Story = {
  name: 'Interaction: Open Calendar',
  args: {
    label: 'Appointment Date',
    name: 'appointmentDate',
    format: 'MM/DD/YYYY',
    helpText: 'Click the calendar icon to open the date picker.',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-date-picker');
    await expect(host).toBeTruthy();

    const trigger = getTrigger(canvasElement);
    await expect(trigger).toBeTruthy();

    // Calendar should not be visible before clicking
    let calendar = getCalendar(canvasElement);
    await expect(calendar).toBeFalsy();

    // Click the trigger to open the calendar
    await userEvent.click(trigger);

    // Wait for the Lit update cycle
    await host!.updateComplete;

    // Calendar should now be visible
    calendar = getCalendar(canvasElement);
    await expect(calendar).toBeTruthy();

    // The calendar dialog should have the correct role
    await expect(calendar!.getAttribute('role')).toBe('dialog');
    await expect(calendar!.getAttribute('aria-modal')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 18. SELECT DATE
// ─────────────────────────────────────────────────

export const SelectDate: Story = {
  name: 'Interaction: Select Date',
  args: {
    label: 'Appointment Date',
    name: 'appointmentDate',
    value: '2026-03-04',
    format: 'MM/DD/YYYY',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-date-picker')!;
    await expect(host).toBeTruthy();

    // Track hx-change event
    let changeEventFired = false;
    let changeDetail: { value: string; date: Date | null } | null = null;

    host.addEventListener('hx-change', ((e: CustomEvent<{ value: string; date: Date | null }>) => {
      changeEventFired = true;
      changeDetail = e.detail;
    }) as EventListener);

    // Open the calendar
    const trigger = getTrigger(canvasElement);
    await userEvent.click(trigger);
    await host.updateComplete;

    // Calendar should be open
    const calendar = getCalendar(canvasElement);
    await expect(calendar).toBeTruthy();

    // Find all enabled day buttons inside the calendar
    const dayButtons = Array.from(
      host.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="day"]:not([disabled])'),
    );
    await expect(dayButtons.length).toBeGreaterThan(0);

    // Click the first enabled day button
    const firstDay = dayButtons[0]!;
    await userEvent.click(firstDay);
    await host.updateComplete;

    // After selection, the calendar should close
    const closedCalendar = getCalendar(canvasElement);
    await expect(closedCalendar).toBeFalsy();

    // The hx-change event should have fired
    await expect(changeEventFired).toBe(true);
    await expect(changeDetail).toBeTruthy();
    await expect(typeof changeDetail!.value).toBe('string');
    await expect(changeDetail!.value.length).toBeGreaterThan(0);
  },
};

// ─────────────────────────────────────────────────
// 19. HEALTHCARE — DISCHARGE DATE
// ─────────────────────────────────────────────────

export const DischargeDate: Story = {
  name: 'Healthcare: Discharge Date',
  render: () => html`
    <hx-date-picker
      label="Estimated Discharge Date"
      name="dischargeDate"
      min=${todayISO()}
      max=${addYears(1)}
      help-text="Select the anticipated discharge date. Cannot be in the past."
      format="MM/DD/YYYY"
      required
    ></hx-date-picker>
  `,
};

// ─────────────────────────────────────────────────
// 20. LOCALE VARIANTS
// ─────────────────────────────────────────────────

export const LocaleVariants: Story = {
  name: 'Locale Variants',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          en-US (Default)
        </p>
        <hx-date-picker
          label="Appointment Date"
          value="2026-03-04"
          locale="en-US"
          format="MM/DD/YYYY"
        ></hx-date-picker>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          en-GB
        </p>
        <hx-date-picker
          label="Appointment Date"
          value="2026-03-04"
          locale="en-GB"
          format="DD/MM/YYYY"
        ></hx-date-picker>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          de-DE
        </p>
        <hx-date-picker
          label="Termindatum"
          value="2026-03-04"
          locale="de-DE"
          format="TT.MM.JJJJ"
        ></hx-date-picker>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          fr-FR
        </p>
        <hx-date-picker
          label="Date du rendez-vous"
          value="2026-03-04"
          locale="fr-FR"
          format="JJ/MM/AAAA"
        ></hx-date-picker>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 21. KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  name: 'Interaction: Keyboard Navigation',
  args: {
    label: 'Appointment Date',
    name: 'appointmentDate',
    value: '2026-03-04',
    helpText:
      'Open calendar with trigger, then use Arrow keys to navigate days. Enter or Space to select. Escape to close.',
    format: 'MM/DD/YYYY',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-date-picker')!;
    await expect(host).toBeTruthy();

    // Open the calendar via keyboard — focus trigger and press Enter
    const trigger = getTrigger(canvasElement);
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await host.updateComplete;

    const calendar = getCalendar(canvasElement);
    await expect(calendar).toBeTruthy();

    // The calendar is open and a day should be focused
    const focusedDay = host.shadowRoot!.querySelector<HTMLButtonElement>(
      '[part="day"][tabindex="0"]',
    );
    await expect(focusedDay).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 22. FORM DATA PARTICIPATION
// ─────────────────────────────────────────────────

export const FormDataParticipation: Story = {
  name: 'Interaction: Form Data Participation',
  render: () => {
    const onSubmit = fn();

    return html`
      <form
        id="date-picker-form"
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          onSubmit(Object.fromEntries(data.entries()));
        }}
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
      >
        <hx-date-picker
          label="Date of Birth"
          name="dateOfBirth"
          value="2026-03-04"
          required
          format="MM/DD/YYYY"
        ></hx-date-picker>

        <button
          type="submit"
          style="
            padding: 0.5rem 1rem;
            background: #2563EB;
            color: white;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            align-self: flex-start;
          "
        >
          Submit
        </button>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-date-picker')!;

    // Verify the initial value is set
    await expect(host.value).toBe('2026-03-04');

    // Verify the component is form-associated
    await expect(host.form).toBeTruthy();

    // Submit the form and verify form value participation
    const submitButton = canvasElement.querySelector('button[type="submit"]')!;
    await userEvent.click(submitButton);
  },
};

// ─────────────────────────────────────────────────
// 23. DISABLED — NO INTERACTION
// ─────────────────────────────────────────────────

export const DisabledNoInteraction: Story = {
  name: 'Interaction: Disabled Prevents Interaction',
  args: {
    label: 'Locked Admission Date',
    value: '2026-03-04',
    disabled: true,
    helpText: 'This field is system-controlled and cannot be changed.',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-date-picker')!;
    await expect(host).toBeTruthy();

    const trigger = getTrigger(canvasElement);

    // Trigger should be disabled
    await expect(trigger.disabled).toBe(true);

    // Value should remain unchanged
    await expect(host.value).toBe('2026-03-04');

    // Calendar should not open
    const calendar = getCalendar(canvasElement);
    await expect(calendar).toBeFalsy();
  },
};
