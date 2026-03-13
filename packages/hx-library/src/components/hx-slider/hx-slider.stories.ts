import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, fn, userEvent } from 'storybook/test';
import './hx-slider.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Slider',
  component: 'hx-slider',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text for the slider.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    value: {
      control: { type: 'number' },
      description: 'The current numeric value of the slider.',
      table: {
        category: 'State',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    min: {
      control: { type: 'number' },
      description: 'The minimum allowed value.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    max: {
      control: { type: 'number' },
      description: 'The maximum allowed value.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '100' },
        type: { summary: 'number' },
      },
    },
    step: {
      control: { type: 'number' },
      description: 'The stepping interval between values.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the slider is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the slider for guidance.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    showValue: {
      control: 'boolean',
      description: 'When true, the current value is shown next to the label.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    showTicks: {
      control: 'boolean',
      description: 'When true, tick marks are rendered at each step interval.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the slider.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    name: {
      control: 'text',
      description: 'The name submitted with the form.',
      table: {
        category: 'Form',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    label: 'Volume',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    helpText: '',
    showValue: false,
    showTicks: false,
    size: 'md',
    name: '',
  },
  render: (args) => html`
    <hx-slider
      label=${args.label}
      value=${args.value}
      min=${args.min}
      max=${args.max}
      step=${args.step}
      ?disabled=${args.disabled}
      help-text=${args.helpText}
      ?show-value=${args.showValue}
      ?show-ticks=${args.showTicks}
      hx-size=${args.size}
      name=${args.name}
    ></hx-slider>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

/** Resolves the native range input inside the shadow root. */
function getInput(canvasElement: HTMLElement): HTMLInputElement {
  const host = canvasElement.querySelector('hx-slider');
  if (!host) throw new Error('hx-slider not found in canvas');
  const input = host.shadowRoot?.querySelector<HTMLInputElement>('input[type="range"]');
  if (!input) throw new Error('range input not found in shadow root');
  return input;
}

/** Waits for Lit's updateComplete cycle on the host element. */
async function waitForUpdate(canvasElement: HTMLElement): Promise<void> {
  const host = canvasElement.querySelector('hx-slider') as HTMLElement & {
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
    label: 'Volume',
    value: 50,
  },
  play: async ({ canvasElement }) => {
    const input = getInput(canvasElement);
    await expect(input).toBeTruthy();
    await expect(input.value).toBe('50');
    await expect(input.getAttribute('aria-valuemin')).toBe('0');
    await expect(input.getAttribute('aria-valuemax')).toBe('100');
    await expect(input.getAttribute('aria-valuenow')).toBe('50');
  },
};

// ─────────────────────────────────────────────────
// 2. WITH VALUE DISPLAY
// ─────────────────────────────────────────────────

export const WithValue: Story = {
  args: {
    label: 'Brightness',
    value: 75,
    showValue: true,
  },
  play: async ({ canvasElement }) => {
    await waitForUpdate(canvasElement);
    const host = canvasElement.querySelector('hx-slider');
    const valueDisplay = host?.shadowRoot?.querySelector('[part="value-display"]');
    await expect(valueDisplay).toBeTruthy();
    await expect(valueDisplay?.textContent?.trim()).toBe('75');
  },
};

// ─────────────────────────────────────────────────
// 3. WITH TICKS
// ─────────────────────────────────────────────────

export const WithTicks: Story = {
  args: {
    label: 'Percentage',
    value: 40,
    min: 0,
    max: 100,
    step: 10,
    showTicks: true,
  },
  play: async ({ canvasElement }) => {
    await waitForUpdate(canvasElement);
    const host = canvasElement.querySelector('hx-slider');
    const ticks = host?.shadowRoot?.querySelectorAll('[part="tick"]');
    // step=10 on a 0-100 range yields 11 tick marks (0, 10, 20, ... 100)
    await expect(ticks?.length).toBe(11);
  },
};

// ─────────────────────────────────────────────────
// 4. WITH RANGE LABELS
// ─────────────────────────────────────────────────

export const WithRangeLabels: Story = {
  render: (args) => html`
    <hx-slider
      label=${args.label}
      value=${args.value}
      min=${args.min}
      max=${args.max}
      step=${args.step}
      ?disabled=${args.disabled}
      ?show-value=${args.showValue}
      hx-size=${args.size}
    >
      <span slot="min-label">Low</span>
      <span slot="max-label">High</span>
    </hx-slider>
  `,
  args: {
    label: 'Intensity',
    value: 30,
  },
};

// ─────────────────────────────────────────────────
// 5. WITH HELP TEXT
// ─────────────────────────────────────────────────

export const WithHelpText: Story = {
  args: {
    label: 'Notification threshold',
    value: 20,
    helpText: 'Alerts are sent when the metric exceeds this value.',
  },
  play: async ({ canvasElement }) => {
    await waitForUpdate(canvasElement);
    const host = canvasElement.querySelector('hx-slider');
    const helpText = host?.shadowRoot?.querySelector('[part="help-text"]');
    await expect(helpText).toBeTruthy();
    await expect(helpText?.textContent?.trim()).toBe(
      'Alerts are sent when the metric exceeds this value.',
    );
  },
};

// ─────────────────────────────────────────────────
// 6. SIZES
// ─────────────────────────────────────────────────

export const SizeSmall: Story = {
  args: {
    label: 'Small slider',
    value: 40,
    size: 'sm',
  },
};

export const SizeMedium: Story = {
  args: {
    label: 'Medium slider (default)',
    value: 50,
    size: 'md',
  },
};

export const SizeLarge: Story = {
  args: {
    label: 'Large slider',
    value: 60,
    size: 'lg',
  },
};

// ─────────────────────────────────────────────────
// 7. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    label: 'System-managed level',
    value: 65,
    disabled: true,
    helpText: 'This value is managed by the system and cannot be changed.',
  },
  play: async ({ canvasElement }) => {
    const input = getInput(canvasElement);
    await expect(input.disabled).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 8. HEALTHCARE: PAIN SCALE
// ─────────────────────────────────────────────────

export const PainScale: Story = {
  render: () => html`
    <hx-slider
      label="Pain Level"
      value="0"
      min="0"
      max="10"
      step="1"
      show-value
      show-ticks
      help-text="Rate your current pain level from 0 (no pain) to 10 (worst possible pain)."
      name="painScale"
    >
      <span slot="min-label">No Pain</span>
      <span slot="max-label">Worst Pain</span>
    </hx-slider>
  `,
  play: async ({ canvasElement }) => {
    await waitForUpdate(canvasElement);
    const host = canvasElement.querySelector('hx-slider');
    const input = host?.shadowRoot?.querySelector<HTMLInputElement>('input[type="range"]');
    const ticks = host?.shadowRoot?.querySelectorAll('[part="tick"]');
    // step=1 on 0-10 range yields 11 ticks
    await expect(ticks?.length).toBe(11);
    await expect(input?.getAttribute('aria-valuemin')).toBe('0');
    await expect(input?.getAttribute('aria-valuemax')).toBe('10');
  },
};

// ─────────────────────────────────────────────────
// 9. HEALTHCARE: SATISFACTION SURVEY
// ─────────────────────────────────────────────────

export const Satisfaction: Story = {
  render: () => html`
    <hx-slider
      label="Overall Satisfaction"
      value="3"
      min="1"
      max="5"
      step="1"
      show-value
      show-ticks
      help-text="Rate your overall satisfaction with your care experience."
      name="satisfaction"
    >
      <span slot="min-label">Very Dissatisfied</span>
      <span slot="max-label">Very Satisfied</span>
    </hx-slider>
  `,
  play: async ({ canvasElement }) => {
    await waitForUpdate(canvasElement);
    const host = canvasElement.querySelector('hx-slider');
    const valueDisplay = host?.shadowRoot?.querySelector('[part="value-display"]');
    await expect(valueDisplay?.textContent?.trim()).toBe('3');
    const input = host?.shadowRoot?.querySelector<HTMLInputElement>('input[type="range"]');
    await expect(input?.getAttribute('aria-valuemin')).toBe('1');
    await expect(input?.getAttribute('aria-valuemax')).toBe('5');
  },
};

// ─────────────────────────────────────────────────
// KITCHEN SINK
// ─────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <hx-slider label="Small (sm)" value="30" hx-size="sm" show-value></hx-slider>
      <hx-slider label="Medium (md) -- default" value="50" hx-size="md" show-value></hx-slider>
      <hx-slider label="Large (lg)" value="70" hx-size="lg" show-value></hx-slider>
    </div>
  `,
};

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <hx-slider label="Default" value="50"></hx-slider>
      <hx-slider label="With value display" value="60" show-value></hx-slider>
      <hx-slider label="With ticks (step=10)" value="40" step="10" show-ticks></hx-slider>
      <hx-slider
        label="With help text"
        value="25"
        help-text="Adjust this value to configure the threshold."
      ></hx-slider>
      <hx-slider
        label="Disabled"
        value="65"
        disabled
        help-text="This value is managed by the system."
      ></hx-slider>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// INTERACTION TESTS
// ─────────────────────────────────────────────────

export const InputEvent: Story = {
  args: {
    label: 'Drag to trigger hx-input',
    value: 50,
    showValue: true,
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-slider') as HTMLElement;
    const input = getInput(canvasElement);
    const onInput = fn();
    host.addEventListener('hx-input', onInput);

    // Focus the native input and use keyboard to change the value
    input.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitForUpdate(canvasElement);

    await expect(onInput).toHaveBeenCalled();

    host.removeEventListener('hx-input', onInput);
  },
};

export const ChangeEvent: Story = {
  args: {
    label: 'Release to trigger hx-change',
    value: 50,
    showValue: true,
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-slider') as HTMLElement;
    const input = getInput(canvasElement);
    const onChange = fn();
    host.addEventListener('hx-change', onChange);

    input.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitForUpdate(canvasElement);

    await expect(onChange).toHaveBeenCalled();

    host.removeEventListener('hx-change', onChange);
  },
};

export const KeyboardNavigation: Story = {
  args: {
    label: 'Keyboard accessible slider',
    value: 50,
    showValue: true,
  },
  play: async ({ canvasElement }) => {
    const input = getInput(canvasElement);

    input.focus();
    await expect(input).toHaveFocus();

    // Arrow right increases value
    await userEvent.keyboard('{ArrowRight}');
    await waitForUpdate(canvasElement);
    await expect(input.value).toBe('51');

    // Arrow left decreases value
    await userEvent.keyboard('{ArrowLeft}');
    await waitForUpdate(canvasElement);
    await expect(input.value).toBe('50');

    // Home key sets minimum
    await userEvent.keyboard('{Home}');
    await waitForUpdate(canvasElement);
    await expect(input.value).toBe('0');

    // End key sets maximum
    await userEvent.keyboard('{End}');
    await waitForUpdate(canvasElement);
    await expect(input.value).toBe('100');

    // Page Down decreases value by a large step (native behaviour: ~10% of range)
    await userEvent.keyboard('{PageDown}');
    await waitForUpdate(canvasElement);
    // Native range input decreases by 10 on a 0–100 range with step=1
    await expect(Number(input.value)).toBeLessThan(100);

    // Page Up increases value by a large step
    const beforePageUp = Number(input.value);
    await userEvent.keyboard('{PageUp}');
    await waitForUpdate(canvasElement);
    await expect(Number(input.value)).toBeGreaterThan(beforePageUp);
  },
};

export const DisabledNoInteraction: Story = {
  args: {
    label: 'Locked system preference',
    value: 40,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const input = getInput(canvasElement);
    await expect(input.disabled).toBe(true);
    await expect(input.value).toBe('40');
  },
};

// ─────────────────────────────────────────────────
// FORM PARTICIPATION
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => {
    const outputId = 'slider-form-output';
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
        style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;"
      >
        <hx-slider
          label="Pain Level"
          name="painLevel"
          value="0"
          min="0"
          max="10"
          step="1"
          show-value
          show-ticks
          help-text="Rate your current pain from 0 to 10."
        >
          <span slot="min-label">No Pain</span>
          <span slot="max-label">Worst Pain</span>
        </hx-slider>

        <hx-slider
          label="Fatigue Level"
          name="fatigueLevel"
          value="0"
          min="0"
          max="10"
          step="1"
          show-value
          help-text="Rate your fatigue on a scale of 0 to 10."
        ></hx-slider>

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
          Submit Assessment
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
    const sliders = canvasElement.querySelectorAll('hx-slider');
    const painInput =
      sliders[0]?.shadowRoot?.querySelector<HTMLInputElement>('input[type="range"]');
    if (painInput) {
      painInput.focus();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    }

    const submitBtn = canvasElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    await userEvent.click(submitBtn);

    const output = canvasElement.querySelector('#slider-form-output');
    await expect(output?.textContent).toContain('painLevel');
    await expect(output?.textContent).toContain('fatigueLevel');
  },
};

// ─────────────────────────────────────────────────
// CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          --hx-slider-fill-bg / --hx-slider-track-bg
        </p>
        <hx-slider
          label="Custom fill and track colors"
          value="60"
          show-value
          style="
            --hx-slider-fill-bg: #059669;
            --hx-slider-track-bg: #d1fae5;
          "
        ></hx-slider>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          --hx-slider-thumb-bg / --hx-slider-thumb-border-color / --hx-slider-thumb-shadow
        </p>
        <hx-slider
          label="Custom thumb appearance"
          value="45"
          show-value
          style="
            --hx-slider-thumb-bg: #fef3c7;
            --hx-slider-thumb-border-color: #d97706;
            --hx-slider-thumb-shadow: 0 2px 8px rgba(0,0,0,0.2);
            --hx-slider-fill-bg: #d97706;
          "
        ></hx-slider>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          --hx-slider-focus-ring-color (tab to see focus)
        </p>
        <hx-slider
          label="Custom focus ring"
          value="50"
          style="--hx-slider-focus-ring-color: #7c3aed;"
        ></hx-slider>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          --hx-slider-label-color / --hx-slider-value-color / --hx-slider-tick-color
        </p>
        <hx-slider
          label="Custom text and tick colors"
          value="70"
          step="10"
          show-value
          show-ticks
          style="
            --hx-slider-label-color: #0369a1;
            --hx-slider-value-color: #0369a1;
            --hx-slider-tick-color: #7dd3fc;
          "
        ></hx-slider>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          All properties combined
        </p>
        <hx-slider
          label="Fully themed slider"
          value="55"
          step="5"
          show-value
          show-ticks
          help-text="Every CSS custom property overridden."
          style="
            --hx-slider-track-bg: #1e293b;
            --hx-slider-fill-bg: #7c3aed;
            --hx-slider-thumb-bg: #f5f3ff;
            --hx-slider-thumb-border-color: #7c3aed;
            --hx-slider-thumb-shadow: 0 0 0 2px rgba(124, 58, 237, 0.3);
            --hx-slider-focus-ring-color: #a78bfa;
            --hx-slider-label-color: #4c1d95;
            --hx-slider-value-color: #4c1d95;
            --hx-slider-tick-color: #a78bfa;
          "
        ></hx-slider>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-slider::part(slider) {
        padding: 0.75rem;
        border: 1px dashed var(--hx-color-neutral-300, #ced4da);
        border-radius: 0.5rem;
      }

      .parts-demo hx-slider::part(track) {
        outline: 2px dashed #2563eb;
        outline-offset: 2px;
      }

      .parts-demo hx-slider::part(fill) {
        background-color: #059669;
      }

      .parts-demo hx-slider::part(thumb) {
        background-color: #bfdbfe;
        border-color: #2563eb;
      }

      .parts-demo hx-slider::part(label) {
        font-style: italic;
        color: #1d4ed8;
      }

      .parts-demo hx-slider::part(value-display) {
        font-weight: 700;
        color: #059669;
      }
    </style>

    <div
      class="parts-demo"
      style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;"
    >
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(slider) - dashed border container
        </p>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(track) - blue dashed outline
        </p>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(fill) - green fill
        </p>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(thumb) - light blue thumb
        </p>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(label) - italic blue label
        </p>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6c757d;">
          ::part(value-display) - bold green value
        </p>
        <hx-slider label="Styled with CSS parts" value="65" show-value></hx-slider>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientSymptomAssessment: Story = {
  render: () => html`
    <div style="max-width: 520px; font-family: var(--hx-font-family-sans, sans-serif);">
      <h3
        style="margin: 0 0 0.25rem; font-size: 1.125rem; color: var(--hx-color-neutral-800, #212529);"
      >
        Daily Symptom Check-In
      </h3>
      <p
        style="margin: 0 0 1.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Rate each symptom on a scale of 0 to 10.
      </p>

      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <hx-slider
          label="Pain Level"
          name="pain"
          value="0"
          min="0"
          max="10"
          step="1"
          show-value
          show-ticks
          help-text="0 = No pain, 10 = Worst imaginable pain."
        >
          <span slot="min-label">No Pain</span>
          <span slot="max-label">Worst Pain</span>
        </hx-slider>

        <hx-slider
          label="Fatigue"
          name="fatigue"
          value="0"
          min="0"
          max="10"
          step="1"
          show-value
          show-ticks
          help-text="0 = No fatigue, 10 = Cannot perform any activity."
        >
          <span slot="min-label">No Fatigue</span>
          <span slot="max-label">Exhausted</span>
        </hx-slider>

        <hx-slider
          label="Shortness of Breath"
          name="dyspnea"
          value="0"
          min="0"
          max="10"
          step="1"
          show-value
          show-ticks
          help-text="0 = Breathing normally, 10 = Severe difficulty breathing."
        >
          <span slot="min-label">Normal</span>
          <span slot="max-label">Severe</span>
        </hx-slider>
      </div>
    </div>
  `,
};

export const MedicationDosageSelector: Story = {
  render: () => html`
    <div style="max-width: 520px; font-family: var(--hx-font-family-sans, sans-serif);">
      <h3
        style="margin: 0 0 0.25rem; font-size: 1.125rem; color: var(--hx-color-neutral-800, #212529);"
      >
        Medication Dosage Adjustment
      </h3>
      <p
        style="margin: 0 0 1.5rem; font-size: 0.875rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Adjust the dosage within the clinician-approved range.
      </p>

      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <hx-slider
          label="Metformin (mg)"
          name="metformin"
          value="500"
          min="500"
          max="2000"
          step="250"
          show-value
          show-ticks
          help-text="Approved range: 500 mg to 2000 mg per day. Increase gradually as tolerated."
        >
          <span slot="min-label">500 mg</span>
          <span slot="max-label">2000 mg</span>
        </hx-slider>

        <hx-slider
          label="Lisinopril (mg)"
          name="lisinopril"
          value="5"
          min="5"
          max="40"
          step="5"
          show-value
          show-ticks
          help-text="Approved range: 5 mg to 40 mg per day."
        >
          <span slot="min-label">5 mg</span>
          <span slot="max-label">40 mg</span>
        </hx-slider>

        <hx-slider
          label="System-managed dosage (locked)"
          name="lockedDose"
          value="10"
          min="5"
          max="40"
          step="5"
          show-value
          disabled
          help-text="This dosage is managed by the attending physician and cannot be changed."
        ></hx-slider>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// OUT-OF-RANGE VALUE
// ─────────────────────────────────────────────────

/**
 * Demonstrates what happens when `value` is set outside `[min, max]`.
 *
 * The native `<input type="range">` clamps out-of-range values internally, so
 * `input.value` will always report the clamped result (e.g. setting `value="150"` on
 * `max="100"` results in the thumb sitting at the maximum position). The play function
 * confirms the rendered input value stays within bounds regardless of the initial prop.
 *
 * NOTE: The component itself does not yet implement a property-level setter that clamps
 * the `value` property before assigning it to the internal input — this story exposes that
 * gap (audit finding hx-slider:P1-02) and acts as a visual regression baseline.
 */
export const OutOfRangeValue: Story = {
  name: 'Out-of-Range Value (clamping)',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--hx-space-8); max-width: 480px;">
      <div>
        <p
          style="margin: 0 0 var(--hx-space-2); font-size: var(--hx-font-size-xs); font-weight: var(--hx-font-weight-semibold); color: var(--hx-color-neutral-500); font-family: var(--hx-font-family-mono);"
        >
          value="150" on max="100" — native input clamps to 100
        </p>
        <hx-slider label="Over-max value" value="150" min="0" max="100" show-value></hx-slider>
      </div>
      <div>
        <p
          style="margin: 0 0 var(--hx-space-2); font-size: var(--hx-font-size-xs); font-weight: var(--hx-font-weight-semibold); color: var(--hx-color-neutral-500); font-family: var(--hx-font-family-mono);"
        >
          value="-20" on min="0" — native input clamps to 0
        </p>
        <hx-slider label="Under-min value" value="-20" min="0" max="100" show-value></hx-slider>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const sliders = canvasElement.querySelectorAll('hx-slider');
    await expect(sliders.length).toBe(2);

    // Over-max: native input must report clamped value of exactly 100
    const overMaxInput =
      sliders[0]?.shadowRoot?.querySelector<HTMLInputElement>('input[type="range"]');
    await expect(overMaxInput).toBeTruthy();
    await expect(overMaxInput!.value).toBe('100');

    // Under-min: native input must report clamped value of exactly 0
    const underMinInput =
      sliders[1]?.shadowRoot?.querySelector<HTMLInputElement>('input[type="range"]');
    await expect(underMinInput).toBeTruthy();
    await expect(underMinInput!.value).toBe('0');
  },
};

/**
 * Demonstrates the `label` slot for rich label content. The `<input type="range">` inside
 * shadow DOM receives `aria-labelledby` pointing to the `<label>` wrapper element, which
 * always exists in shadow DOM when a label slot is populated — fixing the P0 accessible
 * name failure that previously occurred when the `label` prop was empty.
 */
export const LabelSlotAccessibleName: Story = {
  render: () => html`
    <div style="max-width: 400px; display: flex; flex-direction: column; gap: 2rem;">
      <hx-slider name="pain" value="5" min="0" max="10" step="1" show-value>
        <strong slot="label">Pain Level <em style="font-weight: normal;">(0–10)</em></strong>
        <span slot="min-label">No Pain</span>
        <span slot="max-label">Worst Pain</span>
      </hx-slider>

      <hx-slider
        name="satisfaction"
        value="3"
        min="1"
        max="5"
        step="1"
        show-value
        aria-valuetext="3 — Neutral"
        help-text="Select a satisfaction rating from 1 (Very Poor) to 5 (Excellent)."
      >
        <span slot="label">Patient Satisfaction</span>
        <span slot="min-label">Very Poor</span>
        <span slot="max-label">Excellent</span>
      </hx-slider>
    </div>
  `,
};
