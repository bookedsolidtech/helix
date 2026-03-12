import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, fn } from 'storybook/test';
import './hx-textarea.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Textarea',
  component: 'hx-textarea',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text for the textarea.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when the textarea is empty.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The current value of the textarea.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    rows: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'The number of visible text rows.',
      table: {
        category: 'Layout',
        defaultValue: { summary: '4' },
        type: { summary: 'number' },
      },
    },
    maxlength: {
      control: 'number',
      description: 'Maximum number of characters allowed.',
      table: {
        category: 'Validation',
        defaultValue: { summary: 'undefined' },
        type: { summary: 'number | undefined' },
      },
    },
    resize: {
      control: { type: 'select' },
      options: ['none', 'vertical', 'both', 'auto'],
      description: "Controls how the textarea can be resized. Use 'auto' for auto-grow behavior.",
      table: {
        category: 'Layout',
        defaultValue: { summary: "'vertical'" },
        type: { summary: "'none' | 'vertical' | 'both' | 'auto'" },
      },
    },
    showCount: {
      control: 'boolean',
      description: 'Whether to show a character count below the textarea.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the textarea is required for form submission.',
      table: {
        category: 'Validation',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled. Prevents interaction entirely.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display. When set, the textarea enters an error state.',
      table: {
        category: 'Validation',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the textarea for guidance.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description: 'The name of the textarea, used for form submission.',
      table: {
        category: 'Form',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    label: 'Label',
    placeholder: 'Enter text...',
    value: '',
    rows: 4,
    resize: 'vertical',
    showCount: false,
    required: false,
    disabled: false,
    error: '',
    helpText: '',
    name: '',
  },
  render: (args) => html`
    <hx-textarea
      label=${args.label}
      placeholder=${args.placeholder}
      value=${args.value}
      rows=${args.rows}
      resize=${args.resize}
      ?show-count=${args.showCount}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
      help-text=${args.helpText}
      name=${args.name}
    ></hx-textarea>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT -- Textarea with label, play function types and verifies value
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Patient Notes',
    placeholder: 'Enter clinical observations...',
  },
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('hx-textarea');
    await expect(textarea).toBeTruthy();

    const nativeTextarea = textarea!.shadowRoot!.querySelector('textarea');
    await expect(nativeTextarea).toBeTruthy();

    await userEvent.type(nativeTextarea!, 'Patient reports moderate chest pain');
    await expect(nativeTextarea!.value).toBe('Patient reports moderate chest pain');
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY STATE
// ─────────────────────────────────────────────────

export const WithPlaceholder: Story = {
  args: {
    label: 'Medication Notes',
    placeholder: 'Describe dosage, frequency, and administration route...',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Current Medications',
    value: 'Metformin 500mg twice daily. Lisinopril 10mg once daily. Aspirin 81mg once daily.',
  },
};

export const Required: Story = {
  args: {
    label: 'Reason for Visit',
    placeholder: 'Describe the primary reason for this encounter...',
    required: true,
    helpText: 'Required for all patient encounters.',
  },
};

export const WithHelpText: Story = {
  args: {
    label: 'Allergy Information',
    placeholder: 'List known allergies and reactions...',
    helpText: 'Include drug allergies, food allergies, and environmental sensitivities.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Assessment Notes',
    value: '',
    error: 'Assessment notes are required before submitting the encounter.',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Previous Visit Summary',
    value:
      'Patient presented with bilateral knee pain, grade 2 on visual analog scale. Physical therapy referral placed. Follow-up in 6 weeks.',
    disabled: true,
  },
};

export const Readonly: Story = {
  render: () => html`
    <hx-textarea
      label="Finalized Discharge Summary"
      value="Patient was admitted on 2026-01-15 for elective knee replacement surgery. Procedure completed without complications. Discharged to home with physical therapy orders."
      help-text="This record has been finalized and cannot be edited."
    ></hx-textarea>
    <p style="margin-top: 0.5rem; font-size: 0.75rem; color: #6b7280;">
      Note: hx-textarea does not have a native readonly property. For read-only display, use the
      disabled state or render content as plain text.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 3. SPECIAL FEATURES
// ─────────────────────────────────────────────────

export const WithMaxlength: Story = {
  args: {
    label: 'Brief Summary',
    placeholder: 'Summarize the encounter in 200 characters or fewer...',
    maxlength: 200,
    helpText: 'Maximum 200 characters.',
  },
};

export const WithCharacterCounter: Story = {
  args: {
    label: 'Procedure Notes',
    placeholder: 'Document the procedure performed...',
    maxlength: 500,
    showCount: true,
    helpText: 'Include technique, findings, and complications if any.',
  },
};

export const AutoResize: Story = {
  args: {
    label: 'Progress Notes',
    placeholder: 'Type your notes here. The textarea will grow as you type...',
    resize: 'auto',
    helpText: 'This textarea automatically expands to fit your content.',
  },
};

export const FixedHeight: Story = {
  args: {
    label: 'Vital Signs Log',
    placeholder: 'Record vital sign measurements...',
    rows: 8,
    resize: 'none',
    helpText: 'Fixed height textarea with 8 visible rows.',
  },
};

export const MaxlengthReached: Story = {
  args: {
    label: 'Short Impression',
    placeholder: 'Enter your clinical impression...',
    maxlength: 50,
    showCount: true,
  },
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('hx-textarea');
    await expect(textarea).toBeTruthy();

    const nativeTextarea = textarea!.shadowRoot!.querySelector('textarea');
    await expect(nativeTextarea).toBeTruthy();

    // Type exactly 50 characters to hit the maxlength limit
    const fiftyChars = 'Acute bronchitis with productive cough. Follow up.';
    await userEvent.type(nativeTextarea!, fiftyChars);

    // Verify the counter displays 50 / 50
    const counter = textarea!.shadowRoot!.querySelector('.field__counter');
    await expect(counter).toBeTruthy();
    await expect(counter!.textContent!.trim()).toBe('50 / 50');
  },
};

// ─────────────────────────────────────────────────
// 4. RESIZE MODES
// ─────────────────────────────────────────────────

export const ResizeNone: Story = {
  args: {
    label: 'Resize: none',
    placeholder: 'This textarea cannot be resized by the user.',
    resize: 'none',
    helpText: 'resize="none" -- No resize handle.',
  },
};

export const ResizeVertical: Story = {
  args: {
    label: 'Resize: vertical',
    placeholder: 'This textarea can be resized vertically.',
    resize: 'vertical',
    helpText: 'resize="vertical" -- Default. Drag the bottom edge to resize.',
  },
};

export const ResizeBoth: Story = {
  args: {
    label: 'Resize: both',
    placeholder: 'This textarea can be resized in both directions.',
    resize: 'both',
    helpText: 'resize="both" -- Drag the corner handle to resize horizontally and vertically.',
  },
};

export const ResizeAuto: Story = {
  args: {
    label: 'Resize: auto',
    placeholder: 'This textarea grows automatically as you type...',
    resize: 'auto',
    helpText: 'resize="auto" -- The textarea expands to fit content. No manual resize handle.',
  },
};

// ─────────────────────────────────────────────────
// 5. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 500px;">
      <hx-textarea label="Default" placeholder="Standard textarea"></hx-textarea>

      <hx-textarea
        label="With Placeholder"
        placeholder="Describe symptoms, onset, and severity..."
      ></hx-textarea>

      <hx-textarea
        label="With Value"
        value="Patient is alert and oriented. Lungs clear to auscultation bilaterally."
      ></hx-textarea>

      <hx-textarea
        label="Required"
        placeholder="This field must be completed"
        required
      ></hx-textarea>

      <hx-textarea
        label="With Help Text"
        placeholder="Enter notes..."
        help-text="Include relevant clinical observations and findings."
      ></hx-textarea>

      <hx-textarea
        label="With Error"
        value="Incomplete"
        error="Clinical notes must include assessment and plan sections."
      ></hx-textarea>

      <hx-textarea
        label="With Character Counter"
        value="Brief observation"
        show-count
        maxlength="200"
      ></hx-textarea>

      <hx-textarea
        label="Disabled"
        value="Finalized encounter notes. No further edits allowed."
        disabled
      ></hx-textarea>
    </div>
  `,
};

export const AllResizeModes: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 800px;">
      <hx-textarea label="Resize: none" placeholder="Cannot be resized" resize="none"></hx-textarea>

      <hx-textarea
        label="Resize: vertical"
        placeholder="Drag bottom edge"
        resize="vertical"
      ></hx-textarea>

      <hx-textarea
        label="Resize: both"
        placeholder="Drag corner handle"
        resize="both"
      ></hx-textarea>

      <hx-textarea
        label="Resize: auto"
        placeholder="Grows as you type..."
        resize="auto"
      ></hx-textarea>
    </div>
  `,
};

export const WithAndWithoutCounter: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 800px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">Without Counter</p>
        <hx-textarea
          label="Assessment Notes"
          placeholder="Enter your assessment..."
          maxlength="500"
        ></hx-textarea>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">With Counter</p>
        <hx-textarea
          label="Assessment Notes"
          placeholder="Enter your assessment..."
          maxlength="500"
          show-count
        ></hx-textarea>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">Counter Without Maxlength</p>
        <hx-textarea
          label="Open Notes"
          placeholder="No character limit..."
          show-count
        ></hx-textarea>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">Counter With Pre-filled Value</p>
        <hx-textarea
          label="Pre-filled Notes"
          value="Patient presents with acute onset headache, rated 7/10 on pain scale."
          maxlength="200"
          show-count
        ></hx-textarea>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. COMPOSITION
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
      }}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 500px;"
    >
      <hx-textarea
        label="Chief Complaint"
        name="chiefComplaint"
        placeholder="Describe the primary reason for this visit..."
        required
        rows="3"
        help-text="Brief description of the patient's main concern."
      ></hx-textarea>

      <hx-textarea
        label="History of Present Illness"
        name="hpi"
        placeholder="Document onset, duration, severity, and associated symptoms..."
        rows="6"
        maxlength="2000"
        show-count
      ></hx-textarea>

      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button
          type="reset"
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Reset
        </button>
        <button
          type="submit"
          style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: white; cursor: pointer;"
        >
          Save Encounter
        </button>
      </div>
    </form>
  `,
};

export const InACard: Story = {
  render: () => html`
    <div
      style="max-width: 560px; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;"
    >
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
        <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Clinical Notes</h3>
        <p style="margin: 0.25rem 0 0; font-size: 0.875rem; color: #6b7280;">
          Patient: Jane Doe | MRN: 1234567 | DOB: 1985-03-14
        </p>
      </div>
      <div style="padding: 1.5rem;">
        <hx-textarea
          label="Subjective"
          placeholder="Document patient-reported symptoms..."
          rows="3"
          resize="auto"
        ></hx-textarea>
        <div style="margin-top: 1rem;">
          <hx-textarea
            label="Objective"
            placeholder="Document physical exam findings and test results..."
            rows="3"
            resize="auto"
          ></hx-textarea>
        </div>
        <div style="margin-top: 1rem;">
          <hx-textarea
            label="Assessment and Plan"
            placeholder="Document diagnosis and treatment plan..."
            rows="4"
            maxlength="2000"
            show-count
            resize="auto"
            required
          ></hx-textarea>
        </div>
      </div>
      <div
        style="padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; background: #f9fafb; display: flex; gap: 0.75rem; justify-content: flex-end;"
      >
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;"
        >
          Save Draft
        </button>
        <button
          style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: white; cursor: pointer;"
        >
          Sign and Submit
        </button>
      </div>
    </div>
  `,
};

export const WithCharacterLimit: Story = {
  render: () => html`
    <div style="max-width: 500px;">
      <hx-textarea
        label="Referral Reason"
        name="referralReason"
        placeholder="Describe the clinical reason for this referral..."
        maxlength="300"
        show-count
        required
        help-text="Keep your referral reason concise. Maximum 300 characters."
      ></hx-textarea>
      <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
        <button
          id="submit-referral"
          style="padding: 0.5rem 1.25rem; border: none; border-radius: 0.375rem; background: #2563eb; color: white; cursor: pointer;"
        >
          Submit Referral
        </button>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('hx-textarea');
    await expect(textarea).toBeTruthy();

    const nativeTextarea = textarea!.shadowRoot!.querySelector('textarea');
    await expect(nativeTextarea).toBeTruthy();

    // Type a reason and verify the submit button remains enabled
    await userEvent.type(
      nativeTextarea!,
      'Persistent lower back pain unresponsive to conservative treatment over 12 weeks.',
    );
    const submitButton = canvasElement.querySelector('#submit-referral') as HTMLButtonElement;
    await expect(submitButton).toBeTruthy();
    await expect(submitButton.disabled).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 7. EDGE CASES
// ─────────────────────────────────────────────────

const LONG_CLINICAL_TEXT = `HISTORY OF PRESENT ILLNESS:
The patient is a 67-year-old male with a past medical history significant for type 2 diabetes mellitus, hypertension, hyperlipidemia, and coronary artery disease status post percutaneous coronary intervention in 2022. He presents today with a three-day history of progressive dyspnea on exertion and bilateral lower extremity edema.

REVIEW OF SYSTEMS:
Constitutional: Denies fever, chills, or unintentional weight loss. Reports fatigue and decreased exercise tolerance.
Cardiovascular: Reports orthopnea requiring three pillows. Denies chest pain or palpitations.
Respiratory: Reports progressive shortness of breath, worse with exertion, partially relieved by rest.
Gastrointestinal: Denies nausea, vomiting, abdominal pain, or changes in bowel habits.
Musculoskeletal: Reports bilateral ankle swelling, worse at end of day.
Neurological: Denies headache, dizziness, or focal weakness.

PHYSICAL EXAMINATION:
Vitals: BP 152/88 mmHg, HR 92 bpm, RR 22, SpO2 93% on room air, Temp 98.4F.
General: Alert and oriented, mild respiratory distress at rest.
HEENT: Normocephalic, atraumatic. JVD noted at 10cm above sternal angle at 45 degrees.
Cardiovascular: Regular rate and rhythm. S1, S2 present. S3 gallop noted. No murmurs. 2+ bilateral pitting edema to mid-shin.
Respiratory: Bibasilar crackles extending to mid-lung fields bilaterally. No wheezes or rhonchi.
Abdomen: Soft, non-tender, non-distended. Positive hepatojugular reflux.
Extremities: Bilateral 2+ pitting edema. No cyanosis or clubbing.

ASSESSMENT AND PLAN:
1. Acute decompensated heart failure - New York Heart Association Class III
   - Admit to telemetry floor for IV diuresis with furosemide 40mg IV BID
   - Daily weights, strict I/O monitoring
   - Fluid restriction 1.5L/day, low sodium diet
   - Echocardiogram in the morning to assess ejection fraction
   - BNP, BMP, CBC, hepatic panel, TSH
   - Cardiology consultation

2. Type 2 Diabetes Mellitus - A1C 7.8% (elevated from baseline 6.9%)
   - Continue metformin 1000mg BID
   - Endocrinology follow-up as outpatient
   - Sliding scale insulin while inpatient

3. Hypertension - Suboptimal control
   - Increase lisinopril from 20mg to 40mg daily
   - Monitor renal function with BMP in 48 hours
   - Goal BP < 130/80 per ACC/AHA guidelines

4. Hyperlipidemia
   - Continue atorvastatin 40mg daily
   - Repeat lipid panel at next outpatient visit

5. Disposition: Anticipate 3-5 day hospitalization pending response to diuresis.

This note has been reviewed and signed electronically.`;

export const VeryLongContent: Story = {
  args: {
    label: 'Comprehensive Assessment',
    value: LONG_CLINICAL_TEXT,
    rows: 12,
    resize: 'vertical',
  },
};

export const EmptyTextarea: Story = {
  args: {
    label: 'Additional Comments',
    placeholder:
      'Enter any additional observations or concerns regarding this patient encounter...',
    value: '',
  },
};

export const SingleLine: Story = {
  args: {
    label: 'Quick Note',
    placeholder: 'Brief one-line note...',
    rows: 1,
    resize: 'none',
    helpText: 'Single row textarea for brief annotations.',
  },
};

export const LongLabel: Story = {
  render: () => html`
    <div style="max-width: 400px; border: 1px dashed #d1d5db; padding: 1rem;">
      <hx-textarea
        label="Please provide a detailed description of the patient's current symptoms, including onset date, severity on a 1-10 scale, and any aggravating or alleviating factors"
        placeholder="Enter symptoms..."
        required
      ></hx-textarea>
    </div>
    <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
      Very long labels will wrap naturally within the available width.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 8. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <style>
      .textarea-css-prop-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        max-width: 800px;
      }
      .textarea-css-prop-cell {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .textarea-css-prop-cell code {
        font-size: 0.75rem;
        color: #6b7280;
        font-family: monospace;
      }
    </style>
    <div class="textarea-css-prop-grid">
      <div class="textarea-css-prop-cell">
        <code>--hx-input-bg: #f0fdf4</code>
        <hx-textarea
          label="Custom Background"
          placeholder="Light green background..."
          style="--hx-input-bg: #f0fdf4;"
        ></hx-textarea>
      </div>

      <div class="textarea-css-prop-cell">
        <code>--hx-input-color: #7c3aed</code>
        <hx-textarea
          label="Custom Text Color"
          value="Purple text content"
          style="--hx-input-color: #7c3aed;"
        ></hx-textarea>
      </div>

      <div class="textarea-css-prop-cell">
        <code>--hx-input-border-color: #2563eb</code>
        <hx-textarea
          label="Custom Border Color"
          placeholder="Blue border..."
          style="--hx-input-border-color: #2563eb;"
        ></hx-textarea>
      </div>

      <div class="textarea-css-prop-cell">
        <code>--hx-input-border-radius: 1rem</code>
        <hx-textarea
          label="Custom Border Radius"
          placeholder="Rounded corners..."
          style="--hx-input-border-radius: 1rem;"
        ></hx-textarea>
      </div>

      <div class="textarea-css-prop-cell">
        <code>--hx-input-font-family: Georgia, serif</code>
        <hx-textarea
          label="Custom Font Family"
          value="Serif font for clinical narratives"
          style="--hx-input-font-family: Georgia, serif;"
        ></hx-textarea>
      </div>

      <div class="textarea-css-prop-cell">
        <code>--hx-input-focus-ring-color: #059669</code>
        <hx-textarea
          label="Custom Focus Ring (tab to see)"
          placeholder="Green focus ring on focus..."
          style="--hx-input-focus-ring-color: #059669;"
        ></hx-textarea>
      </div>

      <div class="textarea-css-prop-cell">
        <code>--hx-input-error-color: #ea580c</code>
        <hx-textarea
          label="Custom Error Color"
          error="Orange error state"
          style="--hx-input-error-color: #ea580c;"
        ></hx-textarea>
      </div>

      <div class="textarea-css-prop-cell">
        <code>--hx-input-label-color: #0891b2</code>
        <hx-textarea
          label="Custom Label Color"
          placeholder="Teal label text..."
          style="--hx-input-label-color: #0891b2;"
        ></hx-textarea>
      </div>

      <div class="textarea-css-prop-cell" style="grid-column: span 2;">
        <code>--hx-textarea-min-height: 10rem</code>
        <hx-textarea
          label="Custom Min Height"
          placeholder="Taller minimum height (10rem)..."
          style="--hx-textarea-min-height: 10rem;"
        ></hx-textarea>
      </div>
    </div>

    <div style="margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem;">
      <strong>Usage</strong>
      <pre
        style="margin: 0.5rem 0 0; font-size: 0.8125rem; white-space: pre-wrap;"
      ><code>/* Override via host selector or inline style */
hx-textarea {
  --hx-input-bg: var(--hx-color-success-50);
  --hx-input-border-color: var(--hx-color-primary-500);
  --hx-textarea-min-height: 10rem;
}</code></pre>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .textarea-parts-demo hx-textarea::part(field) {
        padding: 1rem;
        background: #fafafa;
        border: 1px dashed #d1d5db;
        border-radius: 0.5rem;
      }
      .textarea-parts-label hx-textarea::part(label) {
        color: #7c3aed;
        font-size: 1rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .textarea-parts-wrapper hx-textarea::part(textarea-wrapper) {
        border: 2px solid #2563eb;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      .textarea-parts-native hx-textarea::part(textarea) {
        font-family: 'Courier New', monospace;
        font-size: 0.875rem;
        color: #065f46;
      }
      .textarea-parts-counter hx-textarea::part(counter) {
        font-weight: 700;
        color: #2563eb;
        font-size: 0.875rem;
      }
      .textarea-parts-helptext hx-textarea::part(help-text) {
        font-style: italic;
        color: #7c3aed;
      }
      .textarea-parts-error hx-textarea::part(error) {
        font-weight: 700;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    </style>

    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 600px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">Available CSS Parts</p>
        <p style="margin: 0 0 1rem; font-size: 0.875rem; color: #6b7280;">
          Each part below is styled independently through Shadow DOM using
          <code>::part()</code> selectors.
        </p>
      </div>

      <div class="textarea-parts-demo">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-textarea::part(field) { padding: 1rem; background: #fafafa; border: 1px dashed ... }
        </code>
        <hx-textarea
          label="Styled Field Container"
          placeholder="The outer field container has custom styling..."
        ></hx-textarea>
      </div>

      <div class="textarea-parts-label">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-textarea::part(label) { color: #7c3aed; font-weight: 700; text-transform: uppercase; }
        </code>
        <hx-textarea
          label="Styled Label"
          placeholder="The label element has custom styling..."
        ></hx-textarea>
      </div>

      <div class="textarea-parts-wrapper">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-textarea::part(textarea-wrapper) { border: 2px solid #2563eb; border-radius: 0.75rem; }
        </code>
        <hx-textarea
          label="Styled Textarea Wrapper"
          placeholder="The wrapper has custom border and shadow..."
        ></hx-textarea>
      </div>

      <div class="textarea-parts-native">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-textarea::part(textarea) { font-family: monospace; color: #065f46; }
        </code>
        <hx-textarea
          label="Styled Native Textarea"
          value="Monospace font with custom color for clinical code documentation."
        ></hx-textarea>
      </div>

      <div class="textarea-parts-counter">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-textarea::part(counter) { font-weight: 700; color: #2563eb; }
        </code>
        <hx-textarea
          label="Styled Counter"
          value="Bold blue character counter"
          maxlength="200"
          show-count
        ></hx-textarea>
      </div>

      <div class="textarea-parts-helptext">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-textarea::part(help-text) { font-style: italic; color: #7c3aed; }
        </code>
        <hx-textarea
          label="Styled Help Text"
          placeholder="Enter notes..."
          help-text="This help text is styled with italic purple text."
        ></hx-textarea>
      </div>

      <div class="textarea-parts-error">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-textarea::part(error) { font-weight: 700; text-transform: uppercase; }
        </code>
        <hx-textarea label="Styled Error" error="Bold uppercase error message"></hx-textarea>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const TypeAndVerify: Story = {
  args: {
    label: 'Observation Notes',
    placeholder: 'Type your observation...',
  },
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('hx-textarea');
    await expect(textarea).toBeTruthy();

    const nativeTextarea = textarea!.shadowRoot!.querySelector('textarea');
    await expect(nativeTextarea).toBeTruthy();

    const testText = 'Bilateral breath sounds clear. No adventitious sounds.';
    await userEvent.type(nativeTextarea!, testText);
    await expect(nativeTextarea!.value).toBe(testText);
    await expect(textarea!.value).toBe(testText);
  },
};

export const EventVerification: Story = {
  args: {
    label: 'Event Test',
    placeholder: 'Type here to test events...',
  },
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('hx-textarea');
    await expect(textarea).toBeTruthy();

    const nativeTextarea = textarea!.shadowRoot!.querySelector('textarea');
    await expect(nativeTextarea).toBeTruthy();

    // Verify hx-input fires on keystroke
    const inputSpy = fn();
    textarea!.addEventListener('hx-input', inputSpy);

    await userEvent.type(nativeTextarea!, 'Vital');

    // hx-input should fire once per keystroke (5 characters = 5 events)
    await expect(inputSpy).toHaveBeenCalledTimes(5);

    // Verify the last hx-input event detail contains the full value
    const lastInputCall = inputSpy.mock.calls[4][0] as CustomEvent;
    await expect(lastInputCall.detail.value).toBe('Vital');
    await expect(lastInputCall.bubbles).toBe(true);
    await expect(lastInputCall.composed).toBe(true);

    textarea!.removeEventListener('hx-input', inputSpy);

    // Verify hx-change fires on blur
    const changeSpy = fn();
    textarea!.addEventListener('hx-change', changeSpy);

    // Blur the textarea to trigger change
    nativeTextarea!.dispatchEvent(new Event('change', { bubbles: true }));
    await expect(changeSpy).toHaveBeenCalledTimes(1);

    const changeCall = changeSpy.mock.calls[0][0] as CustomEvent;
    await expect(changeCall.detail.value).toBe('Vital');

    textarea!.removeEventListener('hx-change', changeSpy);
  },
};

export const CharacterCounter: Story = {
  args: {
    label: 'Counter Test',
    placeholder: 'Type to watch the counter...',
    maxlength: 100,
    showCount: true,
  },
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('hx-textarea');
    await expect(textarea).toBeTruthy();

    // Verify initial counter shows 0 / 100
    const counter = textarea!.shadowRoot!.querySelector('.field__counter');
    await expect(counter).toBeTruthy();
    await expect(counter!.textContent!.trim()).toBe('0 / 100');

    const nativeTextarea = textarea!.shadowRoot!.querySelector('textarea');
    await expect(nativeTextarea).toBeTruthy();

    // Type some text and verify counter updates
    await userEvent.type(nativeTextarea!, 'Afebrile');

    // Wait for Lit to update the DOM
    await new Promise((r) => setTimeout(r, 100));

    const updatedCounter = textarea!.shadowRoot!.querySelector('.field__counter');
    await expect(updatedCounter!.textContent!.trim()).toBe('8 / 100');
  },
};

export const MaxlengthEnforcement: Story = {
  args: {
    label: 'Maxlength Test',
    placeholder: 'Try typing past 20 characters...',
    maxlength: 20,
    showCount: true,
  },
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('hx-textarea');
    await expect(textarea).toBeTruthy();

    const nativeTextarea = textarea!.shadowRoot!.querySelector('textarea');
    await expect(nativeTextarea).toBeTruthy();

    // Attempt to type more than 20 characters
    // The native maxlength attribute will truncate input
    await userEvent.type(nativeTextarea!, 'This text is definitely longer than twenty characters');

    // The native textarea should enforce maxlength=20
    await expect(nativeTextarea!.value.length).toBeLessThanOrEqual(20);

    // Wait for Lit update
    await new Promise((r) => setTimeout(r, 100));

    // Counter should show the capped length
    const counter = textarea!.shadowRoot!.querySelector('.field__counter');
    await expect(counter).toBeTruthy();
  },
};

export const AutoResizeGrow: Story = {
  args: {
    label: 'Auto-Resize Test',
    placeholder: 'Type multiple lines to watch the textarea grow...',
    resize: 'auto',
  },
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('hx-textarea');
    await expect(textarea).toBeTruthy();

    const nativeTextarea = textarea!.shadowRoot!.querySelector('textarea');
    await expect(nativeTextarea).toBeTruthy();

    // Record initial height
    const initialHeight = nativeTextarea!.offsetHeight;

    // Type multiple lines of content to trigger auto-resize
    const multiLineText = [
      'Line 1: Patient history reviewed.',
      'Line 2: Vitals within normal limits.',
      'Line 3: Physical examination unremarkable.',
      'Line 4: Labs pending CBC, BMP, lipid panel.',
      'Line 5: Follow-up scheduled in 2 weeks.',
      'Line 6: Medications reconciled.',
      'Line 7: Discharge instructions provided.',
      'Line 8: Patient verbalized understanding of care plan.',
    ].join('\n');

    await userEvent.type(nativeTextarea!, multiLineText);

    // Wait for Lit update and auto-resize logic
    await new Promise((r) => setTimeout(r, 200));

    // The textarea should have grown in height
    const newHeight = nativeTextarea!.offsetHeight;
    await expect(newHeight).toBeGreaterThan(initialHeight);
  },
};

export const FormDataParticipation: Story = {
  render: () => html`
    <form
      id="form-data-test"
      @submit=${(e: Event) => e.preventDefault()}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 500px;"
    >
      <hx-textarea
        label="Clinical Assessment"
        name="assessment"
        placeholder="Enter clinical assessment..."
        required
      ></hx-textarea>
      <button
        type="submit"
        style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: white; cursor: pointer;"
      >
        Submit
      </button>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('#form-data-test') as HTMLFormElement;
    await expect(form).toBeTruthy();

    const textarea = canvasElement.querySelector('hx-textarea');
    await expect(textarea).toBeTruthy();

    const nativeTextarea = textarea!.shadowRoot!.querySelector('textarea');
    await expect(nativeTextarea).toBeTruthy();

    // Type a value
    const assessmentText = 'Stable condition, no acute distress.';
    await userEvent.type(nativeTextarea!, assessmentText);

    // Verify the form-associated value is set correctly
    const formData = new FormData(form);
    const formValue = formData.get('assessment');
    await expect(formValue).toBe(assessmentText);
  },
};

// ─────────────────────────────────────────────────
// 11. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const ClinicalNotes: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <div
        style="margin-bottom: 1rem; padding: 0.75rem 1rem; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 0.25rem;"
      >
        <strong style="font-size: 0.875rem;">Clinical Documentation</strong>
        <p style="margin: 0.25rem 0 0; font-size: 0.8125rem; color: #374151;">
          Document all relevant clinical observations. Notes are part of the permanent medical
          record.
        </p>
      </div>
      <hx-textarea
        label="Clinical Notes"
        name="clinicalNotes"
        placeholder="Document subjective complaints, objective findings, assessment, and plan..."
        maxlength="2000"
        show-count
        required
        resize="auto"
        rows="8"
        help-text="Follow SOAP format: Subjective, Objective, Assessment, Plan."
      ></hx-textarea>
    </div>
  `,
};

export const DischargeSummary: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <div
        style="margin-bottom: 1rem; padding: 0.75rem 1rem; background: #fef3c7; border-left: 4px solid #d97706; border-radius: 0.25rem;"
      >
        <strong style="font-size: 0.875rem;">Discharge Summary</strong>
        <p style="margin: 0.25rem 0 0; font-size: 0.8125rem; color: #374151;">
          Provide a comprehensive summary of the patient's hospital course and discharge plan.
        </p>
      </div>
      <hx-textarea
        label="Hospital Course and Discharge Plan"
        name="dischargeSummary"
        placeholder="Include admission diagnosis, procedures performed, hospital course, condition at discharge, discharge medications, follow-up instructions, and activity restrictions..."
        resize="auto"
        rows="10"
        required
        help-text="This summary will be shared with the patient's primary care provider."
      ></hx-textarea>
    </div>
  `,
};

export const PatientHistory: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <div
        style="margin-bottom: 1rem; padding: 0.75rem 1rem; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 0.25rem;"
      >
        <strong style="font-size: 0.875rem;">Medical History Review</strong>
        <p style="margin: 0.25rem 0 0; font-size: 0.8125rem; color: #374151;">
          Comprehensive patient medical history imported from the health information exchange.
        </p>
      </div>
      <hx-textarea
        label="Past Medical History"
        name="pastMedicalHistory"
        value="CHRONIC CONDITIONS:
- Type 2 Diabetes Mellitus (diagnosed 2018), managed with metformin 1000mg BID and insulin glargine 20 units at bedtime
- Essential Hypertension (diagnosed 2015), managed with lisinopril 20mg daily and amlodipine 5mg daily
- Hyperlipidemia (diagnosed 2016), managed with atorvastatin 40mg daily
- Chronic Kidney Disease Stage 3a (eGFR 48, last measured 2025-11-15)
- Osteoarthritis bilateral knees

SURGICAL HISTORY:
- Appendectomy (2001)
- Right knee arthroscopy (2019)
- Coronary angioplasty with drug-eluting stent to LAD (2022)

FAMILY HISTORY:
- Father: Deceased at 72 from myocardial infarction, history of type 2 diabetes
- Mother: Living, age 85, history of hypertension and breast cancer (diagnosed age 68)
- Siblings: Brother (60) with type 2 diabetes; Sister (55) healthy

SOCIAL HISTORY:
- Former smoker (quit 2015, 20 pack-year history)
- Alcohol: Occasional social use, 1-2 drinks per week
- Occupation: Retired school teacher
- Lives with spouse, independent with ADLs

ALLERGIES:
- Penicillin (anaphylaxis, documented 1998)
- Sulfa drugs (rash)
- Codeine (nausea and vomiting)"
        rows="12"
        resize="vertical"
        help-text="Review and update as needed. Last verified: 2026-01-20."
      ></hx-textarea>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 12. SLOT PATTERNS
// ─────────────────────────────────────────────────

export const ErrorSlot: Story = {
  render: () => html`
    <hx-textarea label="Assessment Notes" value="">
      <span slot="error">This field is required by hospital policy.</span>
    </hx-textarea>
  `,
};

export const HelpTextSlot: Story = {
  render: () => html`
    <hx-textarea label="Medication Notes" placeholder="Enter medication details...">
      <span slot="help-text">Include dosage, route, and frequency for each medication.</span>
    </hx-textarea>
  `,
};

export const AllSlots: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 500px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">Error via Slot</p>
        <hx-textarea label="Field with Slot Error" value="">
          <span slot="error">Slot-based error message for Drupal integration.</span>
        </hx-textarea>
      </div>
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">Help Text via Slot</p>
        <hx-textarea label="Field with Slot Help Text" placeholder="Enter notes...">
          <span slot="help-text">Slot-based help text for Drupal Form API.</span>
        </hx-textarea>
      </div>
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">Label via Slot</p>
        <hx-textarea placeholder="Custom label via slot...">
          <label slot="label" style="font-weight: 600; color: #7c3aed;">Custom Slotted Label</label>
        </hx-textarea>
      </div>
    </div>
  `,
};
