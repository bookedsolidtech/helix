import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-select.js';
import '../hx-button/hx-button.js';
import '../hx-text-input/hx-text-input.js';
import '../hx-card/hx-card.js';
import '../hx-checkbox/hx-checkbox.js';
import '../hx-checkbox-group/hx-checkbox-group.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Select',
  component: 'hx-select',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text for the select.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder option text shown as the first disabled option.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The current value of the select.',
      table: {
        category: 'State',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the select.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the select is required for form submission.',
      table: {
        category: 'Validation',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display. When set, the select enters an error state.',
      table: {
        category: 'Validation',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the select for guidance.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description: 'The name of the select, used for form submission.',
      table: {
        category: 'Form',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    label: 'Department',
    placeholder: 'Select a department...',
    value: '',
    size: 'md',
    required: false,
    disabled: false,
    error: '',
    helpText: '',
    name: '',
  },
  render: (args) => html`
    <hx-select
      label=${args.label}
      placeholder=${args.placeholder}
      value=${args.value}
      hx-size=${args.size}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
      help-text=${args.helpText}
      name=${args.name}
    >
      <option value="cardiology">Cardiology</option>
      <option value="neurology">Neurology</option>
      <option value="oncology">Oncology</option>
      <option value="pediatrics">Pediatrics</option>
    </hx-select>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Admitting Department',
    placeholder: 'Select a department...',
  },
  render: (args) => html`
    <hx-select
      label=${args.label}
      placeholder=${args.placeholder}
      hx-size=${args.size}
      ?required=${args.required}
      ?disabled=${args.disabled}
    >
      <option value="cardiology">Cardiology</option>
      <option value="neurology">Neurology</option>
      <option value="oncology">Oncology</option>
      <option value="orthopedics">Orthopedics</option>
      <option value="pediatrics">Pediatrics</option>
    </hx-select>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-select');
    await expect(host).toBeTruthy();

    const nativeSelect = host!.shadowRoot!.querySelector('select');
    await expect(nativeSelect).toBeTruthy();

    // Select the third option (oncology)
    nativeSelect!.value = 'oncology';
    nativeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    await expect(host!.value).toBe('oncology');
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY SIZE
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: {
    label: 'Ward (Small)',
    placeholder: 'Select ward...',
    size: 'sm',
  },
  render: (args) => html`
    <hx-select label=${args.label} placeholder=${args.placeholder} hx-size=${args.size}>
      <option value="icu">Intensive Care Unit</option>
      <option value="nicu">Neonatal ICU</option>
      <option value="er">Emergency Room</option>
    </hx-select>
  `,
};

export const Medium: Story = {
  args: {
    label: 'Ward (Medium)',
    placeholder: 'Select ward...',
    size: 'md',
  },
  render: (args) => html`
    <hx-select label=${args.label} placeholder=${args.placeholder} hx-size=${args.size}>
      <option value="icu">Intensive Care Unit</option>
      <option value="nicu">Neonatal ICU</option>
      <option value="er">Emergency Room</option>
    </hx-select>
  `,
};

export const Large: Story = {
  args: {
    label: 'Ward (Large)',
    placeholder: 'Select ward...',
    size: 'lg',
  },
  render: (args) => html`
    <hx-select label=${args.label} placeholder=${args.placeholder} hx-size=${args.size}>
      <option value="icu">Intensive Care Unit</option>
      <option value="nicu">Neonatal ICU</option>
      <option value="er">Emergency Room</option>
    </hx-select>
  `,
};

// ─────────────────────────────────────────────────
// 3. EVERY STATE
// ─────────────────────────────────────────────────

export const WithPlaceholder: Story = {
  args: {
    label: 'Attending Physician',
    placeholder: 'Choose attending physician...',
  },
  render: (args) => html`
    <hx-select label=${args.label} placeholder=${args.placeholder}>
      <option value="dr-chen">Dr. Chen, L.</option>
      <option value="dr-patel">Dr. Patel, R.</option>
      <option value="dr-johnson">Dr. Johnson, M.</option>
      <option value="dr-williams">Dr. Williams, S.</option>
    </hx-select>
  `,
};

export const WithValue: Story = {
  args: {
    label: 'Primary Care Provider',
    value: 'dr-patel',
  },
  render: (args) => html`
    <hx-select label=${args.label} value=${args.value}>
      <option value="dr-chen">Dr. Chen, L.</option>
      <option value="dr-patel">Dr. Patel, R.</option>
      <option value="dr-johnson">Dr. Johnson, M.</option>
      <option value="dr-williams">Dr. Williams, S.</option>
    </hx-select>
  `,
};

export const Required: Story = {
  args: {
    label: 'Triage Priority',
    placeholder: 'Select priority level...',
    required: true,
    helpText: 'Required. Determines the order in the care queue.',
  },
  render: (args) => html`
    <hx-select
      label=${args.label}
      placeholder=${args.placeholder}
      ?required=${args.required}
      help-text=${args.helpText}
    >
      <option value="stat">STAT</option>
      <option value="urgent">Urgent</option>
      <option value="routine">Routine</option>
      <option value="elective">Elective</option>
    </hx-select>
  `,
};

export const WithHelpText: Story = {
  args: {
    label: 'Insurance Provider',
    placeholder: 'Select provider...',
    helpText: 'Choose the primary insurance provider for this patient encounter.',
  },
  render: (args) => html`
    <hx-select label=${args.label} placeholder=${args.placeholder} help-text=${args.helpText}>
      <option value="aetna">Aetna</option>
      <option value="bcbs">Blue Cross Blue Shield</option>
      <option value="cigna">Cigna</option>
      <option value="united">UnitedHealthcare</option>
    </hx-select>
  `,
};

export const WithError: Story = {
  args: {
    label: 'Blood Type',
    placeholder: 'Select blood type...',
    error: 'Blood type is required for this procedure.',
    required: true,
  },
  render: (args) => html`
    <hx-select
      label=${args.label}
      placeholder=${args.placeholder}
      error=${args.error}
      ?required=${args.required}
    >
      <option value="a-pos">A+</option>
      <option value="a-neg">A-</option>
      <option value="b-pos">B+</option>
      <option value="b-neg">B-</option>
      <option value="o-pos">O+</option>
      <option value="o-neg">O-</option>
      <option value="ab-pos">AB+</option>
      <option value="ab-neg">AB-</option>
    </hx-select>
  `,
};

export const Disabled: Story = {
  args: {
    label: 'Facility',
    placeholder: 'Not available',
    disabled: true,
  },
  render: (args) => html`
    <hx-select label=${args.label} placeholder=${args.placeholder} ?disabled=${args.disabled}>
      <option value="main">Main Campus</option>
      <option value="north">North Pavilion</option>
      <option value="south">South Tower</option>
    </hx-select>
  `,
};

// ─────────────────────────────────────────────────
// 4. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;">
      <hx-select label="Small (sm)" hx-size="sm" placeholder="Select ward...">
        <option value="icu">Intensive Care Unit</option>
        <option value="nicu">Neonatal ICU</option>
        <option value="er">Emergency Room</option>
      </hx-select>

      <hx-select label="Medium (md) -- Default" hx-size="md" placeholder="Select ward...">
        <option value="icu">Intensive Care Unit</option>
        <option value="nicu">Neonatal ICU</option>
        <option value="er">Emergency Room</option>
      </hx-select>

      <hx-select label="Large (lg)" hx-size="lg" placeholder="Select ward...">
        <option value="icu">Intensive Care Unit</option>
        <option value="nicu">Neonatal ICU</option>
        <option value="er">Emergency Room</option>
      </hx-select>
    </div>
  `,
};

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;">
      <hx-select label="Default" placeholder="Select an option...">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </hx-select>

      <hx-select label="With Placeholder" placeholder="Choose attending physician...">
        <option value="dr-chen">Dr. Chen, L.</option>
        <option value="dr-patel">Dr. Patel, R.</option>
      </hx-select>

      <hx-select label="With Value" value="dr-patel">
        <option value="dr-chen">Dr. Chen, L.</option>
        <option value="dr-patel">Dr. Patel, R.</option>
      </hx-select>

      <hx-select label="Required" placeholder="This is required" required>
        <option value="stat">STAT</option>
        <option value="urgent">Urgent</option>
      </hx-select>

      <hx-select
        label="With Help Text"
        placeholder="Select..."
        help-text="Choose the primary insurance provider for this encounter."
      >
        <option value="aetna">Aetna</option>
        <option value="bcbs">Blue Cross Blue Shield</option>
      </hx-select>

      <hx-select
        label="With Error"
        placeholder="Select..."
        error="Blood type is required before transfusion."
        required
      >
        <option value="a-pos">A+</option>
        <option value="o-neg">O-</option>
      </hx-select>

      <hx-select label="Disabled" placeholder="Cannot select" disabled>
        <option value="main">Main Campus</option>
        <option value="north">North Pavilion</option>
      </hx-select>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. COMPOSITION
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
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;"
      >
        <hx-select
          label="Department"
          name="department"
          placeholder="Select department..."
          required
          help-text="Which department is this referral for?"
        >
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
          <option value="oncology">Oncology</option>
          <option value="orthopedics">Orthopedics</option>
        </hx-select>

        <hx-select label="Priority" name="priority" placeholder="Select priority..." required>
          <option value="stat">STAT</option>
          <option value="urgent">Urgent</option>
          <option value="routine">Routine</option>
          <option value="elective">Elective</option>
        </hx-select>

        <hx-select label="Insurance" name="insurance" placeholder="Select insurance...">
          <option value="aetna">Aetna</option>
          <option value="bcbs">Blue Cross Blue Shield</option>
          <option value="cigna">Cigna</option>
          <option value="united">UnitedHealthcare</option>
        </hx-select>

        <hx-button type="submit">Submit Referral</hx-button>
      </form>
    `;
  },
};

export const MultipleSelects: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
      <hx-select
        label="Department"
        name="department"
        placeholder="Select department..."
        required
        help-text="Select a department first, then choose a sub-department."
      >
        <option value="medical">Medical</option>
        <option value="surgical">Surgical</option>
        <option value="diagnostic">Diagnostic</option>
        <option value="support">Support Services</option>
      </hx-select>

      <hx-select
        label="Sub-Department"
        name="sub-department"
        placeholder="Select sub-department..."
        required
        help-text="Specific unit within the chosen department."
      >
        <option value="cardiology">Cardiology</option>
        <option value="neurology">Neurology</option>
        <option value="oncology">Oncology</option>
        <option value="pulmonology">Pulmonology</option>
        <option value="endocrinology">Endocrinology</option>
        <option value="gastroenterology">Gastroenterology</option>
      </hx-select>
    </div>
  `,
};

export const WithOtherFields: Story = {
  render: () => html`
    <form style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;">
      <hx-text-input
        label="Patient Name"
        name="patient-name"
        placeholder="Last, First MI"
        required
      ></hx-text-input>

      <hx-text-input
        label="Medical Record Number"
        name="mrn"
        placeholder="MRN-000000"
        required
      ></hx-text-input>

      <hx-select
        label="Admitting Department"
        name="department"
        placeholder="Select department..."
        required
      >
        <option value="cardiology">Cardiology</option>
        <option value="neurology">Neurology</option>
        <option value="oncology">Oncology</option>
      </hx-select>

      <hx-select label="Room Preference" name="room-preference" placeholder="Select preference...">
        <option value="private">Private Room</option>
        <option value="semi-private">Semi-Private</option>
        <option value="ward">Ward</option>
      </hx-select>

      <hx-checkbox label="Patient has signed consent forms" name="consent"></hx-checkbox>

      <hx-button type="submit">Admit Patient</hx-button>
    </form>
  `,
};

export const InACard: Story = {
  render: () => html`
    <hx-card style="max-width: 480px;">
      <span slot="heading">Patient Transfer Request</span>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <hx-select
          label="Transfer From"
          name="from-department"
          placeholder="Select originating department..."
          required
        >
          <option value="er">Emergency Department</option>
          <option value="icu">Intensive Care Unit</option>
          <option value="medsurg">Medical-Surgical</option>
          <option value="pacu">Post-Anesthesia Care Unit</option>
        </hx-select>

        <hx-select
          label="Transfer To"
          name="to-department"
          placeholder="Select receiving department..."
          required
        >
          <option value="icu">Intensive Care Unit</option>
          <option value="stepdown">Step-Down Unit</option>
          <option value="medsurg">Medical-Surgical</option>
          <option value="rehab">Rehabilitation</option>
          <option value="ltc">Long-Term Care</option>
        </hx-select>

        <hx-select
          label="Transfer Priority"
          name="priority"
          placeholder="Select priority..."
          required
          help-text="STAT transfers are processed within 30 minutes."
        >
          <option value="stat">STAT</option>
          <option value="urgent">Urgent</option>
          <option value="routine">Routine</option>
        </hx-select>
      </div>
      <div slot="actions" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <hx-button variant="ghost">Cancel</hx-button>
        <hx-button variant="primary">Submit Transfer</hx-button>
      </div>
    </hx-card>
  `,
};

// ─────────────────────────────────────────────────
// 6. EDGE CASES
// ─────────────────────────────────────────────────

export const ManyOptions: Story = {
  args: {
    label: 'ICD-10 Diagnosis Code',
    placeholder: 'Search or select diagnosis...',
    helpText: 'Scroll through the full list of diagnosis codes.',
  },
  render: (args) => {
    const codes = [
      'A00 - Cholera',
      'A01 - Typhoid and paratyphoid fevers',
      'A02 - Other salmonella infections',
      'A03 - Shigellosis',
      'A04 - Other bacterial intestinal infections',
      'A05 - Other bacterial foodborne intoxications',
      'A06 - Amebiasis',
      'A09 - Infectious gastroenteritis and colitis',
      'B00 - Herpesviral infections',
      'B01 - Varicella (chickenpox)',
      'B02 - Zoster (herpes zoster)',
      'B05 - Measles',
      'B06 - Rubella',
      'B15 - Acute hepatitis A',
      'B16 - Acute hepatitis B',
      'B17 - Other acute viral hepatitis',
      'B18 - Chronic viral hepatitis',
      'C00 - Malignant neoplasm of lip',
      'C01 - Malignant neoplasm of base of tongue',
      'C02 - Malignant neoplasm of other parts of tongue',
      'C15 - Malignant neoplasm of esophagus',
      'C16 - Malignant neoplasm of stomach',
      'C18 - Malignant neoplasm of colon',
      'C20 - Malignant neoplasm of rectum',
      'C34 - Malignant neoplasm of bronchus and lung',
      'C50 - Malignant neoplasm of breast',
      'D50 - Iron deficiency anemia',
      'D64 - Other anemias',
      'E08 - Diabetes mellitus due to underlying condition',
      'E10 - Type 1 diabetes mellitus',
      'E11 - Type 2 diabetes mellitus',
      'E13 - Other specified diabetes mellitus',
      'E66 - Overweight and obesity',
      'E78 - Disorders of lipoprotein metabolism',
      'F10 - Alcohol related disorders',
      'F32 - Major depressive disorder, single episode',
      'F33 - Major depressive disorder, recurrent',
      'F41 - Other anxiety disorders',
      'G20 - Parkinson disease',
      'G30 - Alzheimer disease',
      'G43 - Migraine',
      'G47 - Sleep disorders',
      'I10 - Essential (primary) hypertension',
      'I21 - Acute myocardial infarction',
      'I25 - Chronic ischemic heart disease',
      'I48 - Atrial fibrillation and flutter',
      'I50 - Heart failure',
      'I63 - Cerebral infarction',
      'J06 - Acute upper respiratory infections',
      'J18 - Pneumonia, unspecified organism',
      'J44 - Other chronic obstructive pulmonary disease',
      'J45 - Asthma',
      'K21 - Gastro-esophageal reflux disease',
      'K50 - Crohn disease',
      'K51 - Ulcerative colitis',
      'M54 - Dorsalgia (back pain)',
      'N18 - Chronic kidney disease',
      'R05 - Cough',
      'R10 - Abdominal and pelvic pain',
      'Z00 - Encounter for general adult medical exam',
    ];
    return html`
      <hx-select
        label=${args.label}
        placeholder=${args.placeholder}
        help-text=${args.helpText}
        style="max-width: 480px;"
      >
        ${codes.map(
          (code) => html` <option value=${code.split(' - ')[0].toLowerCase()}>${code}</option> `,
        )}
      </hx-select>
    `;
  },
};

export const LongOptionText: Story = {
  args: {
    label: 'Procedure Description',
    placeholder: 'Select procedure...',
  },
  render: (args) => html`
    <hx-select label=${args.label} placeholder=${args.placeholder} style="max-width: 480px;">
      <option value="cath">
        Cardiac catheterization with coronary angiography and left ventriculography
      </option>
      <option value="cabg">
        Coronary artery bypass graft surgery with saphenous vein and internal mammary artery
        conduits
      </option>
      <option value="ercp">
        Endoscopic retrograde cholangiopancreatography with sphincterotomy and stent placement
      </option>
      <option value="tka">
        Total knee arthroplasty with patellar resurfacing and posterior-stabilized prosthesis
      </option>
      <option value="lap-chole">
        Laparoscopic cholecystectomy with intraoperative cholangiogram and bile duct exploration
      </option>
    </hx-select>
  `,
};

export const WithOptgroups: Story = {
  args: {
    label: 'Hospital Department',
    placeholder: 'Select department...',
    helpText:
      'Departments are grouped by service line. Optgroups are rendered via slotted elements.',
  },
  render: (args) => html`
    <hx-select
      label=${args.label}
      placeholder=${args.placeholder}
      help-text=${args.helpText}
      style="max-width: 400px;"
    >
      <option value="cardiology">Cardiology (Medical)</option>
      <option value="neurology">Neurology (Medical)</option>
      <option value="oncology">Oncology (Medical)</option>
      <option value="pulmonology">Pulmonology (Medical)</option>
      <option value="gen-surgery">General Surgery (Surgical)</option>
      <option value="ortho-surgery">Orthopedic Surgery (Surgical)</option>
      <option value="neuro-surgery">Neurosurgery (Surgical)</option>
      <option value="cardiac-surgery">Cardiac Surgery (Surgical)</option>
      <option value="radiology">Radiology (Diagnostic)</option>
      <option value="pathology">Pathology (Diagnostic)</option>
      <option value="lab">Laboratory (Diagnostic)</option>
    </hx-select>
  `,
};

export const SingleOption: Story = {
  args: {
    label: 'System of Record',
    placeholder: 'Select system...',
    helpText: 'Only one system is available for this facility.',
  },
  render: (args) => html`
    <hx-select
      label=${args.label}
      placeholder=${args.placeholder}
      help-text=${args.helpText}
      style="max-width: 400px;"
    >
      <option value="epic">Epic EHR</option>
    </hx-select>
  `,
};

export const EmptySelect: Story = {
  args: {
    label: 'Available Beds',
    placeholder: 'No beds available',
    helpText: 'No options are currently available. Check back after discharge rounds.',
  },
  render: (args) => html`
    <hx-select
      label=${args.label}
      placeholder=${args.placeholder}
      help-text=${args.helpText}
      style="max-width: 400px;"
    ></hx-select>
  `,
};

// ─────────────────────────────────────────────────
// 7. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Default (no overrides)
        </h4>
        <hx-select label="Department" placeholder="Select department...">
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
        </hx-select>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-select-bg, --hx-select-color, --hx-select-border-color
        </h4>
        <hx-select
          label="Custom Background"
          placeholder="Dark background theme"
          style="
            --hx-select-bg: #1e293b;
            --hx-select-color: #f1f5f9;
            --hx-select-border-color: #475569;
            --hx-select-label-color: #cbd5e1;
            --hx-select-chevron-color: #94a3b8;
          "
        >
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
        </hx-select>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-select-border-radius
        </h4>
        <hx-select
          label="Rounded Corners"
          placeholder="Extra round borders"
          style="--hx-select-border-radius: 1.5rem;"
        >
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
        </hx-select>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-select-font-family
        </h4>
        <hx-select
          label="Custom Font"
          placeholder="Monospace font family"
          style="--hx-select-font-family: 'Courier New', monospace;"
        >
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
        </hx-select>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-select-focus-ring-color (click to focus)
        </h4>
        <hx-select
          label="Custom Focus Ring"
          placeholder="Green focus ring"
          style="--hx-select-focus-ring-color: #16a34a;"
        >
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
        </hx-select>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-select-error-color
        </h4>
        <hx-select
          label="Custom Error Color"
          placeholder="Select..."
          error="Custom error color applied."
          required
          style="--hx-select-error-color: #9333ea;"
        >
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
        </hx-select>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-select-label-color, --hx-select-chevron-color
        </h4>
        <hx-select
          label="Custom Label and Chevron"
          placeholder="Teal label and chevron"
          style="
            --hx-select-label-color: #0d9488;
            --hx-select-chevron-color: #0d9488;
          "
        >
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
        </hx-select>
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
      .parts-demo hx-select::part(field) {
        background: #f0fdf4;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 2px dashed #86efac;
      }
      .parts-demo hx-select::part(label) {
        color: #166534;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
      }
      .parts-demo hx-select::part(select-wrapper) {
        border: 2px solid #22c55e;
        border-radius: 0.5rem;
      }
      .parts-demo hx-select::part(select) {
        color: #14532d;
        font-weight: 600;
      }
      .parts-demo hx-select::part(help-text) {
        color: #15803d;
        font-style: italic;
      }
      .parts-demo-error hx-select::part(field) {
        background: #fef2f2;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 2px dashed #fca5a5;
      }
      .parts-demo-error hx-select::part(label) {
        color: #991b1b;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
      }
      .parts-demo-error hx-select::part(select-wrapper) {
        border: 2px solid #ef4444;
        border-radius: 0.5rem;
      }
      .parts-demo-error hx-select::part(error) {
        color: #7f1d1d;
        font-weight: 600;
        font-size: 0.875rem;
      }
    </style>
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Parts: field, label, select-wrapper, select, help-text
        </h4>
        <div class="parts-demo">
          <hx-select
            label="Styled via CSS Parts"
            placeholder="Select department..."
            help-text="Each part of this select is individually styled via ::part()."
          >
            <option value="cardiology">Cardiology</option>
            <option value="neurology">Neurology</option>
            <option value="oncology">Oncology</option>
          </hx-select>
        </div>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Parts: field, label, select-wrapper, error
        </h4>
        <div class="parts-demo-error">
          <hx-select
            label="Error State Parts"
            placeholder="Select..."
            error="This error message is styled via ::part(error)."
            required
          >
            <option value="a">Option A</option>
            <option value="b">Option B</option>
          </hx-select>
        </div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const SelectOption: Story = {
  args: {
    label: 'Discharge Disposition',
    placeholder: 'Select disposition...',
    name: 'disposition',
  },
  render: (args) => html`
    <hx-select label=${args.label} placeholder=${args.placeholder} name=${args.name}>
      <option value="home">Home</option>
      <option value="snf">Skilled Nursing Facility</option>
      <option value="rehab">Acute Rehabilitation</option>
      <option value="ltc">Long-Term Care</option>
    </hx-select>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-select');
    await expect(host).toBeTruthy();

    const nativeSelect = host!.shadowRoot!.querySelector('select');
    await expect(nativeSelect).toBeTruthy();

    // Verify placeholder is showing (no value selected)
    await expect(host!.value).toBe('');

    // Select "Skilled Nursing Facility"
    nativeSelect!.value = 'snf';
    nativeSelect!.dispatchEvent(new Event('change', { bubbles: true }));

    await expect(host!.value).toBe('snf');
  },
};

export const EventVerification: Story = {
  args: {
    label: 'Medication Route',
    placeholder: 'Select route...',
  },
  render: (args) => {
    const onChange = fn();
    return html`
      <hx-select label=${args.label} placeholder=${args.placeholder} @hx-change=${onChange}>
        <option value="oral">Oral (PO)</option>
        <option value="iv">Intravenous (IV)</option>
        <option value="im">Intramuscular (IM)</option>
        <option value="subq">Subcutaneous (SubQ)</option>
        <option value="topical">Topical</option>
      </hx-select>
    `;
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-select');
    await expect(host).toBeTruthy();

    const nativeSelect = host!.shadowRoot!.querySelector('select');
    await expect(nativeSelect).toBeTruthy();

    // Track the hx-change event
    let receivedDetail: { value: string } | null = null;
    host!.addEventListener('hx-change', ((e: CustomEvent<{ value: string }>) => {
      receivedDetail = e.detail;
    }) as EventListener);

    // Select "Intravenous (IV)"
    nativeSelect!.value = 'iv';
    nativeSelect!.dispatchEvent(new Event('change', { bubbles: true }));

    await expect(host!.value).toBe('iv');
    await expect(receivedDetail).not.toBeNull();
    await expect(receivedDetail!.value).toBe('iv');
  },
};

export const FormDataParticipation: Story = {
  render: () => {
    const onSubmit = fn();
    return html`
      <form
        id="formdata-test"
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          onSubmit(Object.fromEntries(data.entries()));
        }}
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;"
      >
        <hx-select
          label="Allergy Severity"
          name="allergy-severity"
          placeholder="Select severity..."
          required
        >
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
          <option value="life-threatening">Life-Threatening</option>
        </hx-select>

        <hx-button type="submit">Record Allergy</hx-button>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-select');
    await expect(host).toBeTruthy();

    const nativeSelect = host!.shadowRoot!.querySelector('select');
    await expect(nativeSelect).toBeTruthy();

    // Select "Severe"
    nativeSelect!.value = 'severe';
    nativeSelect!.dispatchEvent(new Event('change', { bubbles: true }));

    await expect(host!.value).toBe('severe');

    // Verify the form-associated value via the component's FormData participation
    const form = canvasElement.querySelector('form');
    await expect(form).toBeTruthy();

    const formData = new FormData(form!);
    await expect(formData.get('allergy-severity')).toBe('severe');
  },
};

export const KeyboardNavigation: Story = {
  args: {
    label: 'Admission Type',
    placeholder: 'Select admission type...',
  },
  render: (args) => html`
    <div style="max-width: 400px;">
      <p style="margin: 0 0 1rem; font-size: 0.875rem; color: #6c757d;">
        Tab into the select, then use arrow keys to navigate options.
      </p>
      <hx-select label=${args.label} placeholder=${args.placeholder}>
        <option value="emergency">Emergency</option>
        <option value="urgent">Urgent</option>
        <option value="elective">Elective</option>
        <option value="newborn">Newborn</option>
        <option value="trauma">Trauma Center</option>
      </hx-select>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the host element renders
    const host = canvasElement.querySelector('hx-select');
    await expect(host).toBeTruthy();

    const nativeSelect = host!.shadowRoot!.querySelector('select');
    await expect(nativeSelect).toBeTruthy();

    // Verify the instructional text is present
    await expect(canvas.getByText(/Tab into the select/)).toBeTruthy();

    // Tab to focus the select
    await userEvent.tab();

    // The native select should now have focus
    const activeEl = host!.shadowRoot!.activeElement;
    await expect(activeEl).toBe(nativeSelect);
  },
};

// ─────────────────────────────────────────────────
// 10. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const DepartmentSelector: Story = {
  render: () => html`
    <div style="max-width: 400px;">
      <hx-select
        label="Hospital Department"
        placeholder="Select department..."
        required
        help-text="Departments are organized by service line."
      >
        <option value="cardiology">Cardiology</option>
        <option value="internal-medicine">Internal Medicine</option>
        <option value="neurology">Neurology</option>
        <option value="oncology">Oncology</option>
        <option value="pulmonology">Pulmonology</option>
        <option value="endocrinology">Endocrinology</option>
        <option value="gastroenterology">Gastroenterology</option>
        <option value="rheumatology">Rheumatology</option>
        <option value="gen-surgery">General Surgery</option>
        <option value="ortho-surgery">Orthopedic Surgery</option>
        <option value="neuro-surgery">Neurosurgery</option>
        <option value="cardiac-surgery">Cardiothoracic Surgery</option>
        <option value="vascular-surgery">Vascular Surgery</option>
        <option value="radiology">Radiology</option>
        <option value="pathology">Pathology</option>
        <option value="laboratory">Laboratory</option>
        <option value="nuclear-medicine">Nuclear Medicine</option>
      </hx-select>
    </div>
  `,
};

export const BloodTypeSelector: Story = {
  render: () => html`
    <div style="max-width: 320px;">
      <hx-select
        label="Patient Blood Type"
        placeholder="Select blood type..."
        required
        help-text="Verify blood type against lab results before transfusion."
        name="blood-type"
      >
        <option value="a-pos">A+</option>
        <option value="a-neg">A-</option>
        <option value="b-pos">B+</option>
        <option value="b-neg">B-</option>
        <option value="ab-pos">AB+</option>
        <option value="ab-neg">AB-</option>
        <option value="o-pos">O+</option>
        <option value="o-neg">O-</option>
      </hx-select>
    </div>
  `,
};

export const InsuranceProvider: Story = {
  render: () => html`
    <div style="max-width: 400px;">
      <hx-select
        label="Primary Insurance Provider"
        placeholder="Select insurance provider..."
        required
        help-text="Verify insurance eligibility before scheduling procedures."
        name="insurance-provider"
      >
        <option value="aetna">Aetna</option>
        <option value="anthem">Anthem</option>
        <option value="bcbs">Blue Cross Blue Shield</option>
        <option value="centene">Centene</option>
        <option value="cigna">Cigna</option>
        <option value="emblem">EmblemHealth</option>
        <option value="guardian">Guardian Life</option>
        <option value="hcsc">Health Care Service Corporation</option>
        <option value="healthnet">Health Net</option>
        <option value="highmark">Highmark</option>
        <option value="humana">Humana</option>
        <option value="kaiser">Kaiser Permanente</option>
        <option value="medicaid">Medicaid</option>
        <option value="medicare">Medicare</option>
        <option value="molina">Molina Healthcare</option>
        <option value="oscar">Oscar Health</option>
        <option value="tricare">TRICARE</option>
        <option value="united">UnitedHealthcare</option>
        <option value="wellcare">WellCare</option>
        <option value="self-pay">Self-Pay</option>
        <option value="other">Other</option>
      </hx-select>
    </div>
  `,
};

export const PriorityLevel: Story = {
  render: () => html`
    <style>
      .priority-demo {
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .priority-stat {
        --hx-select-border-color: #dc2626;
        --hx-select-label-color: #991b1b;
        --hx-select-focus-ring-color: #dc2626;
      }
      .priority-urgent {
        --hx-select-border-color: #ea580c;
        --hx-select-label-color: #9a3412;
        --hx-select-focus-ring-color: #ea580c;
      }
      .priority-routine {
        --hx-select-border-color: #2563eb;
        --hx-select-label-color: #1e40af;
        --hx-select-focus-ring-color: #2563eb;
      }
      .priority-elective {
        --hx-select-border-color: #16a34a;
        --hx-select-label-color: #166534;
        --hx-select-focus-ring-color: #16a34a;
      }
    </style>
    <div class="priority-demo">
      <h3 style="margin: 0; font-size: 1rem; color: #374151;">
        Priority-Level Selects (Color-Coded)
      </h3>
      <p style="margin: 0; font-size: 0.875rem; color: #6c757d;">
        Each priority level uses CSS custom properties for visual differentiation.
      </p>

      <hx-select class="priority-stat" label="STAT Priority" value="stat" name="priority-stat">
        <option value="stat">STAT - Immediate (Life-Threatening)</option>
      </hx-select>

      <hx-select
        class="priority-urgent"
        label="Urgent Priority"
        value="urgent"
        name="priority-urgent"
      >
        <option value="urgent">Urgent - Within 1 Hour</option>
      </hx-select>

      <hx-select
        class="priority-routine"
        label="Routine Priority"
        value="routine"
        name="priority-routine"
      >
        <option value="routine">Routine - Within 24 Hours</option>
      </hx-select>

      <hx-select
        class="priority-elective"
        label="Elective Priority"
        value="elective"
        name="priority-elective"
      >
        <option value="elective">Elective - Scheduled</option>
      </hx-select>

      <h4 style="margin: 0; font-size: 0.875rem; color: #374151;">Combined Priority Selector</h4>
      <hx-select
        label="Order Priority"
        placeholder="Select priority level..."
        required
        help-text="STAT orders are processed immediately. Elective orders are scheduled."
        name="order-priority"
      >
        <option value="stat">STAT - Immediate (Life-Threatening)</option>
        <option value="urgent">Urgent - Within 1 Hour</option>
        <option value="routine">Routine - Within 24 Hours</option>
        <option value="elective">Elective - Scheduled</option>
      </hx-select>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// OPEN / INTERACTIVE LISTBOX STATE
// ─────────────────────────────────────────────────

// ─────────────────────────────────────────────────
// MULTI-SELECT LIMITATION DOCUMENTATION
// ─────────────────────────────────────────────────

/**
 * hx-select is a single-value select (combobox) only. Multi-value selection
 * is intentionally not supported. For healthcare forms that require selecting
 * multiple values (e.g., multiple conditions, multiple providers), use a
 * separate multi-select component or a checkbox group (hx-checkbox-group).
 *
 * This story exists to document this limitation explicitly in Storybook
 * so consumers encounter the guidance before implementing workarounds.
 */
export const SingleValueOnly: Story = {
  name: 'Limitation: Single Value Only',
  parameters: {
    docs: {
      description: {
        story:
          '**hx-select supports single-value selection only.** Multi-select (`multiple` attribute) ' +
          'is intentionally not implemented in this component. ' +
          'For multi-value selection use `hx-checkbox-group` or a dedicated multi-select pattern. ' +
          'This is a design-scoped decision — see the component JSDoc `@remarks` for rationale.',
      },
    },
  },
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--hx-space-6); max-width: 480px;">
      <p style="margin: 0; font-size: var(--hx-font-size-sm); color: var(--hx-color-text-secondary);">
        <strong>Design limitation:</strong> hx-select is a single-value combobox. The
        <code>multiple</code> attribute is not supported. For selecting multiple values use
        <code>hx-checkbox-group</code>.
      </p>

      <div>
        <p style="margin: 0 0 var(--hx-space-2); font-size: var(--hx-font-size-sm); color: var(--hx-color-text-secondary); font-weight: 600;">
          Correct: single-value select
        </p>
        <hx-select
          label="Primary Diagnosis"
          placeholder="Select one diagnosis..."
          help-text="Select a single primary diagnosis code for this encounter."
        >
          <option value="i10">I10 — Essential hypertension</option>
          <option value="e11">E11 — Type 2 diabetes mellitus</option>
          <option value="j44">J44 — COPD</option>
          <option value="i50">I50 — Heart failure</option>
        </hx-select>
      </div>

      <div>
        <p style="margin: 0 0 var(--hx-space-2); font-size: var(--hx-font-size-sm); color: var(--hx-color-text-secondary); font-weight: 600;">
          Alternative for multi-value: hx-checkbox-group
        </p>
        <hx-checkbox-group
          label="Comorbidities"
          help-text="Select all applicable comorbidities for this patient."
        >
          <hx-checkbox value="hypertension" label="Hypertension"></hx-checkbox>
          <hx-checkbox value="diabetes" label="Type 2 Diabetes"></hx-checkbox>
          <hx-checkbox value="copd" label="COPD"></hx-checkbox>
          <hx-checkbox value="heart-failure" label="Heart Failure"></hx-checkbox>
        </hx-checkbox-group>
      </div>
    </div>
  `,
};

export const OpenInteractive: Story = {
  name: 'Open / Interactive Listbox',
  parameters: {
    docs: {
      description: {
        story:
          'Shows the select with its dropdown listbox open, demonstrating option hover/focus states, ' +
          'keyboard navigation indicators, and the selected option highlight. ' +
          'This is the primary interactive state for visual regression testing.',
      },
    },
  },
  render: () => html`
    <div style="padding: 1rem; min-height: 20rem;">
      <hx-select
        label="Admitting Department"
        value="neurology"
        open
        name="department"
        help-text="Use arrow keys to navigate, Enter or Space to select, Escape to close."
      >
        <option value="cardiology">Cardiology</option>
        <option value="neurology">Neurology</option>
        <option value="oncology">Oncology</option>
        <option value="orthopedics">Orthopedics</option>
        <option value="pediatrics">Pediatrics</option>
        <option value="radiology" disabled>Radiology (unavailable)</option>
      </hx-select>
    </div>
  `,
};
