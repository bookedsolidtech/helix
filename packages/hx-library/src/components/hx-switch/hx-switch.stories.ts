import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, fn } from 'storybook/test';
import './hx-switch.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Switch',
  component: 'hx-switch',
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the switch is toggled on.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the switch is required for form submission.',
      table: {
        category: 'Validation',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'The visible label text for the switch.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    hxSize: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the switch.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display. When set, the switch enters an error state.',
      table: {
        category: 'Validation',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the switch for guidance.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The value submitted when the switch is checked.',
      table: {
        category: 'Form',
        defaultValue: { summary: 'on' },
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description: 'The name of the switch, used for form submission.',
      table: {
        category: 'Form',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    checked: false,
    disabled: false,
    required: false,
    label: 'Enable notifications',
    hxSize: 'md',
    error: '',
    helpText: '',
    value: 'on',
    name: '',
  },
  render: (args) => html`
    <hx-switch
      label=${args.label}
      hx-size=${args.hxSize}
      ?checked=${args.checked}
      ?disabled=${args.disabled}
      ?required=${args.required}
      error=${args.error}
      help-text=${args.helpText}
      value=${args.value}
      name=${args.name}
    ></hx-switch>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

/** Resolves the native button[role="switch"] inside the shadow root. */
function getTrack(canvasElement: HTMLElement): HTMLButtonElement {
  const host = canvasElement.querySelector('hx-switch');
  if (!host) throw new Error('hx-switch not found in canvas');
  const track = host.shadowRoot?.querySelector<HTMLButtonElement>('[role="switch"]');
  if (!track) throw new Error('switch track not found in shadow root');
  return track;
}

/** Waits for Lit's updateComplete cycle on the host element. */
async function waitForUpdate(canvasElement: HTMLElement): Promise<void> {
  const host = canvasElement.querySelector('hx-switch') as HTMLElement & {
    updateComplete: Promise<boolean>;
  };
  if (host?.updateComplete) {
    await host.updateComplete;
  }
}

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Enable patient portal access',
  },
  play: async ({ canvasElement }) => {
    const track = getTrack(canvasElement);
    await expect(track.getAttribute('aria-checked')).toBe('false');

    await userEvent.click(track);
    await waitForUpdate(canvasElement);

    await expect(track.getAttribute('aria-checked')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY SIZE
// ─────────────────────────────────────────────────

export const SizeSmall: Story = {
  args: {
    label: 'Compact toggle',
    hxSize: 'sm',
  },
};

export const SizeMedium: Story = {
  args: {
    label: 'Default toggle',
    hxSize: 'md',
  },
};

export const SizeLarge: Story = {
  args: {
    label: 'Large toggle',
    hxSize: 'lg',
  },
};

// ─────────────────────────────────────────────────
// 3. EVERY STATE
// ─────────────────────────────────────────────────

export const Unchecked: Story = {
  args: {
    label: 'Receive appointment reminders',
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    label: 'Receive appointment reminders',
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'System-managed setting',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Mandatory compliance logging',
    disabled: true,
    checked: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Accept HIPAA authorization',
    required: true,
    helpText: 'You must accept before accessing patient records.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Acknowledge data privacy agreement',
    required: true,
    error: 'You must acknowledge the data privacy agreement to proceed.',
  },
};

export const WithHelpText: Story = {
  args: {
    label: 'Enable email notifications',
    helpText: 'Receive weekly summaries of your care team activity.',
  },
};

// ─────────────────────────────────────────────────
// 4. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <hx-switch label="Small (sm)" hx-size="sm"></hx-switch>
      <hx-switch label="Medium (md) -- default" hx-size="md"></hx-switch>
      <hx-switch label="Large (lg)" hx-size="lg"></hx-switch>
    </div>
  `,
};

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <hx-switch label="Unchecked"></hx-switch>
      <hx-switch label="Checked" checked></hx-switch>
      <hx-switch label="Disabled (off)" disabled></hx-switch>
      <hx-switch label="Disabled (on)" disabled checked></hx-switch>
      <hx-switch label="Required" required></hx-switch>
      <hx-switch label="With error" error="This field is required." required></hx-switch>
      <hx-switch
        label="With help text"
        help-text="Additional guidance for the clinician."
      ></hx-switch>
      <hx-switch
        label="Error supersedes help text"
        error="Acknowledgment required."
        help-text="This text is hidden when an error is present."
      ></hx-switch>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. COMPOSITION
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => {
    const outputId = 'switch-form-output';
    return html`
      <form
        @submit=${(e: Event) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          const entries = Object.fromEntries(data.entries());
          const output = document.getElementById(outputId);
          if (output) {
            output.textContent = JSON.stringify(entries, null, 2);
          }
        }}
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
      >
        <hx-switch
          label="Accept HIPAA authorization"
          name="hipaaAuth"
          required
          help-text="Required to access protected health information."
        ></hx-switch>

        <hx-switch
          label="Subscribe to care plan updates"
          name="carePlanUpdates"
          checked
        ></hx-switch>

        <hx-switch
          label="Enable two-factor authentication"
          name="twoFactor"
          help-text="Recommended for all clinical staff accounts."
        ></hx-switch>

        <button
          type="submit"
          style="
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          background: var(--hx-color-primary-500, #2563EB);
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          width: fit-content;
        "
        >
          Submit
        </button>

        <pre
          id=${outputId}
          style="
            background: var(--hx-color-neutral-50, #f8f9fa);
            padding: 1rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            min-height: 2rem;
            border: 1px solid var(--hx-color-neutral-200, #e9ecef);
          "
        ></pre>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    // Toggle the HIPAA switch on
    const switches = canvasElement.querySelectorAll('hx-switch');
    const hipaaSwitch = switches[0];
    const hipaaTrack = hipaaSwitch?.shadowRoot?.querySelector<HTMLButtonElement>('[role="switch"]');
    if (hipaaTrack) {
      await userEvent.click(hipaaTrack);
    }

    // Submit the form
    const submitBtn = canvasElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    await userEvent.click(submitBtn);

    // Verify FormData output appeared
    const output = canvasElement.querySelector('#switch-form-output');
    await expect(output?.textContent).toContain('hipaaAuth');
  },
};

export const SettingsPanel: Story = {
  render: () => html`
    <div style="max-width: 520px; font-family: var(--hx-font-family-sans, sans-serif);">
      <!-- Notifications Section -->
      <h3 style="margin: 0 0 1rem; font-size: 1rem; color: var(--hx-color-neutral-800, #212529);">
        Notification Preferences
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
        <hx-switch
          label="Appointment reminders"
          help-text="Receive reminders 24 hours before scheduled appointments."
          checked
        ></hx-switch>
        <hx-switch
          label="Lab result notifications"
          help-text="Get notified when new lab results are available."
          checked
        ></hx-switch>
        <hx-switch
          label="Medication refill alerts"
          help-text="Alerts when prescriptions are due for refill."
        ></hx-switch>
      </div>

      <!-- Privacy Section -->
      <h3 style="margin: 0 0 1rem; font-size: 1rem; color: var(--hx-color-neutral-800, #212529);">
        Privacy Settings
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
        <hx-switch
          label="Share data with care team"
          help-text="Allow your primary care team to view activity summaries."
          checked
        ></hx-switch>
        <hx-switch
          label="Anonymous usage analytics"
          help-text="Help improve the platform with anonymized usage data."
        ></hx-switch>
      </div>

      <!-- Accessibility Section -->
      <h3 style="margin: 0 0 1rem; font-size: 1rem; color: var(--hx-color-neutral-800, #212529);">
        Accessibility Preferences
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <hx-switch
          label="High contrast mode"
          help-text="Increase contrast for improved readability."
        ></hx-switch>
        <hx-switch
          label="Large text"
          help-text="Increase base font size across the application."
        ></hx-switch>
        <hx-switch
          label="Reduce motion"
          help-text="Minimize animations and transitions."
        ></hx-switch>
      </div>
    </div>
  `,
};

export const WithLabelsAndDescriptions: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <hx-switch
        label="Electronic prescriptions"
        help-text="Send prescriptions directly to the patient's preferred pharmacy."
      ></hx-switch>

      <hx-switch
        label="Automatic appointment scheduling"
        help-text="Allow the system to suggest follow-up appointment times based on care plan requirements."
        checked
      ></hx-switch>

      <hx-switch
        label="Discharge summary auto-generation"
        help-text="Automatically generate discharge summaries from clinical notes and orders."
      ></hx-switch>

      <hx-switch
        label="Patient portal messaging"
        help-text="Enable secure messaging between patients and their assigned care team members."
        checked
      ></hx-switch>
    </div>
  `,
};

export const InACard: Story = {
  render: () => html`
    <div
      style="
      max-width: 420px;
      padding: 1.5rem;
      border-radius: 0.5rem;
      border: 1px solid var(--hx-color-neutral-200, #e9ecef);
      background: var(--hx-color-neutral-0, #ffffff);
      box-shadow: var(--hx-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
      font-family: var(--hx-font-family-sans, sans-serif);
    "
    >
      <h3
        style="margin: 0 0 0.25rem; font-size: 1rem; color: var(--hx-color-neutral-800, #212529);"
      >
        Communication Preferences
      </h3>
      <p
        style="margin: 0 0 1.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Manage how and when you receive clinical communications.
      </p>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <hx-switch
          label="SMS alerts"
          help-text="Critical alerts sent via text message."
          checked
        ></hx-switch>
        <hx-switch
          label="Email digests"
          help-text="Weekly summary of activity and updates."
          checked
        ></hx-switch>
        <hx-switch
          label="Push notifications"
          help-text="Real-time alerts to your mobile device."
        ></hx-switch>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. EDGE CASES
// ─────────────────────────────────────────────────

export const LongLabel: Story = {
  args: {
    label:
      'I acknowledge that I have reviewed the patient informed consent documentation, understand the potential risks and benefits of the proposed treatment plan, and authorize the care team to proceed with the prescribed clinical interventions as outlined in the treatment agreement.',
  },
};

/**
 * When no visible label text is desired, use the `label` property or slot content
 * to provide an accessible name. `aria-label` on the host element does NOT propagate
 * into the shadow DOM — the internal `<button role="switch">` will be unnamed.
 * Use the `label` prop (visually hidden via CSS if needed) or slotted content instead.
 */
export const NoLabel: Story = {
  render: () => html` <hx-switch label="Toggle dark mode"></hx-switch> `,
};

export const RapidToggle: Story = {
  args: {
    label: 'Rapid toggle stress test',
  },
  play: async ({ canvasElement }) => {
    const track = getTrack(canvasElement);

    for (let i = 0; i < 5; i++) {
      await userEvent.click(track);
      await waitForUpdate(canvasElement);
    }

    // After 5 toggles (odd number), switch should be checked
    await expect(track.getAttribute('aria-checked')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 7. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          --hx-switch-track-bg / --hx-switch-track-checked-bg
        </p>
        <hx-switch
          label="Custom track colors"
          checked
          style="
            --hx-switch-track-bg: #e2e8f0;
            --hx-switch-track-checked-bg: #059669;
          "
        ></hx-switch>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          --hx-switch-thumb-bg / --hx-switch-thumb-shadow
        </p>
        <hx-switch
          label="Custom thumb appearance"
          checked
          style="
            --hx-switch-thumb-bg: #fef3c7;
            --hx-switch-thumb-shadow: 0 2px 8px rgba(0,0,0,0.2);
            --hx-switch-track-checked-bg: #d97706;
          "
        ></hx-switch>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          --hx-switch-focus-ring-color (tab to see)
        </p>
        <hx-switch
          label="Custom focus ring"
          style="--hx-switch-focus-ring-color: #7c3aed;"
        ></hx-switch>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          --hx-switch-label-color
        </p>
        <hx-switch label="Custom label color" style="--hx-switch-label-color: #0369a1;"></hx-switch>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          --hx-switch-error-color
        </p>
        <hx-switch
          label="Custom error color"
          error="Custom-colored validation message."
          style="--hx-switch-error-color: #be123c;"
        ></hx-switch>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          All properties combined
        </p>
        <hx-switch
          label="Fully themed switch"
          help-text="Every CSS custom property overridden."
          checked
          style="
            --hx-switch-track-bg: #1e293b;
            --hx-switch-track-checked-bg: #7c3aed;
            --hx-switch-thumb-bg: #f5f3ff;
            --hx-switch-thumb-shadow: 0 0 0 2px rgba(124, 58, 237, 0.3);
            --hx-switch-focus-ring-color: #a78bfa;
            --hx-switch-label-color: #4c1d95;
            --hx-switch-error-color: #9333ea;
          "
        ></hx-switch>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-switch::part(switch) {
        padding: 0.75rem;
        border: 1px dashed var(--hx-color-neutral-300, #ced4da);
        border-radius: 0.5rem;
      }

      .parts-demo hx-switch::part(track) {
        outline: 2px dashed #2563eb;
        outline-offset: 2px;
      }

      .parts-demo hx-switch::part(thumb) {
        background-color: #bfdbfe;
      }

      .parts-demo hx-switch::part(label) {
        font-style: italic;
        color: #1d4ed8;
      }

      .parts-demo hx-switch::part(help-text) {
        color: #059669;
        font-weight: 600;
      }

      .parts-demo hx-switch::part(error) {
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    </style>

    <div
      class="parts-demo"
      style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;"
    >
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(switch) - container with dashed border
        </p>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(track) - blue dashed outline
        </p>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(thumb) - light blue background
        </p>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(label) - italic blue text
        </p>
        <hx-switch
          label="Styled with CSS parts"
          help-text="This help text is styled via ::part(help-text)."
          checked
        ></hx-switch>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(error) - uppercase bold error
        </p>
        <hx-switch
          label="Error state with CSS parts"
          error="Validation failed -- styled via ::part(error)."
        ></hx-switch>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const ClickToggle: Story = {
  args: {
    label: 'Click to toggle',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-switch') as HTMLElement;
    const track = getTrack(canvasElement);
    const onChange = fn();
    host.addEventListener('hx-change', onChange);

    // Initially unchecked
    await expect(track.getAttribute('aria-checked')).toBe('false');

    // Click to check
    await userEvent.click(track);
    await waitForUpdate(canvasElement);
    await expect(track.getAttribute('aria-checked')).toBe('true');
    await expect(onChange).toHaveBeenCalledTimes(1);

    // Click to uncheck
    await userEvent.click(track);
    await waitForUpdate(canvasElement);
    await expect(track.getAttribute('aria-checked')).toBe('false');
    await expect(onChange).toHaveBeenCalledTimes(2);

    host.removeEventListener('hx-change', onChange);
  },
};

export const KeyboardToggle: Story = {
  args: {
    label: 'Keyboard accessible toggle',
  },
  play: async ({ canvasElement }) => {
    const track = getTrack(canvasElement);

    // Tab to focus the switch
    await userEvent.tab();
    await expect(track).toHaveFocus();

    // Press Space to toggle on
    await userEvent.keyboard(' ');
    await waitForUpdate(canvasElement);
    await expect(track.getAttribute('aria-checked')).toBe('true');

    // Press Space again to toggle off
    await userEvent.keyboard(' ');
    await waitForUpdate(canvasElement);
    await expect(track.getAttribute('aria-checked')).toBe('false');
  },
};

export const DisabledNoToggle: Story = {
  args: {
    label: 'Locked system preference',
    disabled: true,
    checked: false,
  },
  play: async ({ canvasElement }) => {
    const track = getTrack(canvasElement);

    // Verify initially unchecked
    await expect(track.getAttribute('aria-checked')).toBe('false');

    // Attempt to click -- state must NOT change
    await userEvent.click(track);
    await waitForUpdate(canvasElement);
    await expect(track.getAttribute('aria-checked')).toBe('false');

    // Verify the button is natively disabled
    await expect(track.disabled).toBe(true);
  },
};

export const FormDataParticipation: Story = {
  render: () => {
    const resultId = 'formdata-result';
    return html`
      <form
        @submit=${(e: Event) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          const output = document.getElementById(resultId);
          if (output) {
            output.textContent = JSON.stringify(Object.fromEntries(data.entries()), null, 2);
          }
        }}
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
      >
        <hx-switch label="Enable audit logging" name="auditLogging" value="enabled"></hx-switch>

        <button
          type="submit"
          style="
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          background: var(--hx-color-primary-500, #2563EB);
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          width: fit-content;
        "
        >
          Submit
        </button>

        <pre
          id=${resultId}
          data-testid="formdata-output"
          style="
            background: var(--hx-color-neutral-50, #f8f9fa);
            padding: 1rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            min-height: 2rem;
            border: 1px solid var(--hx-color-neutral-200, #e9ecef);
          "
        ></pre>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    // Toggle the switch on
    const switchEl = canvasElement.querySelector('hx-switch');
    const track = switchEl?.shadowRoot?.querySelector<HTMLButtonElement>('[role="switch"]');
    if (!track) throw new Error('Track not found');

    await userEvent.click(track);
    await (switchEl as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;

    // Submit the form
    const submitBtn = canvasElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    await userEvent.click(submitBtn);

    // Verify FormData contains the switch value
    const output = canvasElement.querySelector('[data-testid="formdata-output"]');
    await expect(output?.textContent).toContain('auditLogging');
    await expect(output?.textContent).toContain('enabled');
  },
};

// ─────────────────────────────────────────────────
// 10. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientPreferences: Story = {
  render: () => html`
    <div style="max-width: 520px; font-family: var(--hx-font-family-sans, sans-serif);">
      <h3
        style="margin: 0 0 0.25rem; font-size: 1.125rem; color: var(--hx-color-neutral-800, #212529);"
      >
        Patient Communication Preferences
      </h3>
      <p
        style="margin: 0 0 1.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Choose how you would like to receive health updates and reminders.
      </p>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <hx-switch
          label="SMS alerts"
          help-text="Receive critical alerts and appointment reminders via text message."
          checked
          name="smsAlerts"
        ></hx-switch>

        <hx-switch
          label="Email updates"
          help-text="Get weekly health summaries and care plan updates delivered to your inbox."
          checked
          name="emailUpdates"
        ></hx-switch>

        <hx-switch
          label="Patient portal messages"
          help-text="Receive secure messages from your care team through the patient portal."
          checked
          name="portalMessages"
        ></hx-switch>

        <hx-switch
          label="Pharmacy notifications"
          help-text="Alerts when prescriptions are ready for pickup or delivery."
          name="pharmacyNotifications"
        ></hx-switch>
      </div>
    </div>
  `,
};

export const AccessibilitySettings: Story = {
  render: () => html`
    <div style="max-width: 520px; font-family: var(--hx-font-family-sans, sans-serif);">
      <h3
        style="margin: 0 0 0.25rem; font-size: 1.125rem; color: var(--hx-color-neutral-800, #212529);"
      >
        Accessibility Settings
      </h3>
      <p
        style="margin: 0 0 1.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Customize the interface to meet your accessibility needs.
      </p>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <hx-switch
          label="High contrast mode"
          help-text="Increase color contrast to meet WCAG AAA guidelines for improved visibility."
          name="highContrast"
        ></hx-switch>

        <hx-switch
          label="Large text"
          help-text="Increase the base font size to 18px for improved readability."
          name="largeText"
        ></hx-switch>

        <hx-switch
          label="Screen reader announcements"
          help-text="Enable enhanced ARIA live region announcements for dynamic content updates."
          checked
          name="screenReader"
        ></hx-switch>

        <hx-switch
          label="Reduce motion"
          help-text="Disable animations and transitions throughout the application."
          name="reduceMotion"
        ></hx-switch>

        <hx-switch
          label="Focus indicators"
          help-text="Display prominent focus outlines on all interactive elements."
          checked
          name="focusIndicators"
        ></hx-switch>
      </div>
    </div>
  `,
};

export const ClinicalAlerts: Story = {
  render: () => html`
    <div style="max-width: 520px; font-family: var(--hx-font-family-sans, sans-serif);">
      <h3
        style="margin: 0 0 0.25rem; font-size: 1.125rem; color: var(--hx-color-neutral-800, #212529);"
      >
        Clinical Alert Configuration
      </h3>
      <p
        style="margin: 0 0 1.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Configure which clinical alerts are active for your patient panel.
      </p>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <hx-switch
          label="Critical lab result alerts"
          help-text="Immediate notification when lab values fall outside critical ranges."
          checked
          name="criticalLabAlerts"
        ></hx-switch>

        <hx-switch
          label="Medication interaction warnings"
          help-text="Alert when new prescriptions may interact with existing medications."
          checked
          name="medInteractions"
        ></hx-switch>

        <hx-switch
          label="Medication reminders"
          help-text="Automated reminders for patients to take scheduled medications."
          name="medReminders"
        ></hx-switch>

        <hx-switch
          label="Allergy alerts"
          help-text="Warnings when prescribed treatments conflict with documented allergies."
          checked
          disabled
          name="allergyAlerts"
        ></hx-switch>

        <hx-switch
          label="Sepsis screening alerts"
          help-text="Trigger Early Warning Score notifications based on vital sign trends."
          checked
          name="sepsisScreening"
        ></hx-switch>

        <hx-switch
          label="Discharge readiness notifications"
          help-text="Notify the care team when patients meet discharge criteria."
          name="dischargeReadiness"
        ></hx-switch>
      </div>
    </div>
  `,
};
