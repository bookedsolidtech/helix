/**
 * Curated demo HTML for each component in the gallery.
 * Runs at build time — strings are injected via set:html.
 */

export interface DemoConfig {
  primary: string;
  primaryLabel?: string;
}

const DEMO_MAP: Record<string, DemoConfig> = {
  'hx-button': {
    primaryLabel: 'Variants & Sizes',
    primary: `
      <div style="display:flex;flex-direction:column;gap:1.5rem;align-items:flex-start;">
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <hx-button variant="primary">Primary Action</hx-button>
          <hx-button variant="secondary">Secondary</hx-button>
          <hx-button variant="ghost">Ghost</hx-button>
          <hx-button variant="primary" disabled>Disabled</hx-button>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <hx-button variant="primary" wc-size="sm">Small</hx-button>
          <hx-button variant="primary" wc-size="md">Medium</hx-button>
          <hx-button variant="primary" wc-size="lg">Large</hx-button>
        </div>
      </div>`,
  },

  'hx-alert': {
    primaryLabel: 'Status Notifications',
    primary: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <hx-alert variant="info">Patient records have been updated successfully.</hx-alert>
        <hx-alert variant="success">Lab results are now available for review.</hx-alert>
        <hx-alert variant="warning">Medication interaction detected — please review.</hx-alert>
        <hx-alert variant="error" closable>Critical: Unable to connect to EHR system.</hx-alert>
      </div>`,
  },

  'hx-badge': {
    primaryLabel: 'Status Indicators',
    primary: `
      <div style="display:flex;flex-direction:column;gap:1.25rem;">
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <hx-badge variant="primary">Active</hx-badge>
          <hx-badge variant="success">Verified</hx-badge>
          <hx-badge variant="warning">Pending Review</hx-badge>
          <hx-badge variant="error">Critical</hx-badge>
          <hx-badge variant="neutral">Archived</hx-badge>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <hx-badge variant="success" pill>Compliant</hx-badge>
          <hx-badge variant="error" pill pulse>STAT</hx-badge>
          <hx-badge variant="primary" wc-size="sm">SM</hx-badge>
          <hx-badge variant="primary" wc-size="lg">Large</hx-badge>
        </div>
      </div>`,
  },

  'hx-card': {
    primaryLabel: 'Card Variants',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
        <hx-card variant="default">
          <span slot="header">Patient Summary</span>
          <p>View comprehensive patient demographics, insurance details, and visit history.</p>
        </hx-card>
        <hx-card variant="featured">
          <span slot="header">Lab Results</span>
          <p>Most recent lab panel results with trend analysis and reference ranges.</p>
        </hx-card>
        <hx-card variant="compact" wc-href="#">
          <span slot="header">Quick Link</span>
          <p>Interactive card that navigates on click.</p>
        </hx-card>
      </div>`,
  },

  'hx-container': {
    primaryLabel: 'Layout Widths',
    primary: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <hx-container width="narrow" padding="md" style="background:rgba(6,182,212,0.08);border:1px dashed rgba(6,182,212,0.3);border-radius:8px;">
          <div style="text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.7);">Narrow container (640px)</div>
        </hx-container>
        <hx-container width="content" padding="md" style="background:rgba(139,92,246,0.08);border:1px dashed rgba(139,92,246,0.3);border-radius:8px;">
          <div style="text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.7);">Content container (960px)</div>
        </hx-container>
        <hx-container width="full" padding="md" style="background:rgba(16,185,129,0.08);border:1px dashed rgba(16,185,129,0.3);border-radius:8px;">
          <div style="text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.7);">Full-width container</div>
        </hx-container>
      </div>`,
  },

  'hx-prose': {
    primaryLabel: 'Rich Text Content',
    primary: `
      <hx-prose>
        <h3>Clinical Documentation Standards</h3>
        <p>All clinical documentation must follow <strong>HL7 FHIR R4</strong> standards for structured data exchange. This ensures interoperability across healthcare systems.</p>
        <ul>
          <li>Use standardized terminology (SNOMED CT, ICD-10)</li>
          <li>Include patient identifiers on every page</li>
          <li>Document medication reconciliation at every transition of care</li>
        </ul>
        <blockquote>
          <p>"Good documentation is the foundation of safe patient care."</p>
        </blockquote>
      </hx-prose>`,
  },

  'hx-text-input': {
    primaryLabel: 'Input States',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;">
        <hx-text-input label="Patient Email" type="email" placeholder="patient@example.com" help-text="Used for appointment reminders"></hx-text-input>
        <hx-text-input label="Medical Record #" placeholder="MRN-000000" required></hx-text-input>
        <hx-text-input label="Password" type="password" placeholder="Enter password" error="Password must be at least 12 characters"></hx-text-input>
        <hx-text-input label="Search Records" type="search" placeholder="Search by name or MRN" disabled></hx-text-input>
      </div>`,
  },

  'hx-textarea': {
    primaryLabel: 'Multi-line Input',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;">
        <hx-textarea label="Clinical Notes" placeholder="Enter clinical observations..." rows="4" help-text="Document patient encounter details"></hx-textarea>
        <hx-textarea label="Discharge Summary" placeholder="Summarize discharge instructions..." rows="4" maxlength="500" show-count></hx-textarea>
      </div>`,
  },

  'hx-select': {
    primaryLabel: 'Dropdown Selection',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;">
        <hx-select label="Department" placeholder="Select department" help-text="Primary care department">
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
          <option value="oncology">Oncology</option>
          <option value="pediatrics">Pediatrics</option>
          <option value="radiology">Radiology</option>
        </hx-select>
        <hx-select label="Priority" placeholder="Select priority" error="Priority is required" required>
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="stat">STAT</option>
        </hx-select>
      </div>`,
  },

  'hx-checkbox': {
    primaryLabel: 'Checkbox States',
    primary: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <hx-checkbox label="I confirm the patient identity has been verified" checked></hx-checkbox>
        <hx-checkbox label="Patient has provided informed consent" help-text="Required before procedure"></hx-checkbox>
        <hx-checkbox label="Allergies have been reviewed" error="This field is required" required></hx-checkbox>
        <hx-checkbox label="Previous acknowledgment (read-only)" checked disabled></hx-checkbox>
      </div>`,
  },

  'hx-radio-group': {
    primaryLabel: 'Radio Selection',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;">
        <hx-radio-group label="Blood Type" name="blood-type" help-text="From most recent lab panel">
          <hx-radio value="a-pos" label="A+"></hx-radio>
          <hx-radio value="b-pos" label="B+"></hx-radio>
          <hx-radio value="o-pos" label="O+"></hx-radio>
          <hx-radio value="ab-pos" label="AB+"></hx-radio>
        </hx-radio-group>
        <hx-radio-group label="Visit Type" name="visit-type" orientation="horizontal">
          <hx-radio value="new" label="New Patient"></hx-radio>
          <hx-radio value="follow-up" label="Follow-Up"></hx-radio>
          <hx-radio value="urgent" label="Urgent Care"></hx-radio>
        </hx-radio-group>
      </div>`,
  },

  'hx-switch': {
    primaryLabel: 'Toggle Controls',
    primary: `
      <div style="display:flex;flex-direction:column;gap:1rem;">
        <hx-switch label="Enable appointment reminders" checked></hx-switch>
        <hx-switch label="Share records with referring provider" help-text="Patient consent required"></hx-switch>
        <hx-switch label="High-contrast mode" wc-size="lg"></hx-switch>
        <hx-switch label="Legacy system (locked)" disabled checked></hx-switch>
      </div>`,
  },

  'hx-form': {
    primaryLabel: 'Patient Intake Form',
    primary: `
      <hx-form name="patient-intake">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1rem;">
          <hx-text-input label="First Name" name="first-name" placeholder="Jane" required></hx-text-input>
          <hx-text-input label="Last Name" name="last-name" placeholder="Doe" required></hx-text-input>
          <hx-text-input label="Date of Birth" name="dob" type="text" placeholder="MM/DD/YYYY" required></hx-text-input>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1rem;">
          <hx-select label="Insurance Provider" name="insurance" placeholder="Select provider">
            <option value="aetna">Aetna</option>
            <option value="bcbs">Blue Cross Blue Shield</option>
            <option value="cigna">Cigna</option>
            <option value="united">UnitedHealthcare</option>
          </hx-select>
          <hx-text-input label="Policy Number" name="policy" placeholder="POL-000000"></hx-text-input>
        </div>
        <hx-checkbox label="I confirm all information is accurate" required style="margin-bottom:1rem;"></hx-checkbox>
        <hx-button variant="primary" type="submit">Submit Intake Form</hx-button>
      </hx-form>`,
  },
};

export function getDemoConfig(tagName: string): DemoConfig {
  return (
    DEMO_MAP[tagName] ?? {
      primary: `<${tagName}></${tagName}>`,
      primaryLabel: tagName,
    }
  );
}
