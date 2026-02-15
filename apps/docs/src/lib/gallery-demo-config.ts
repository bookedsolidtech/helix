/**
 * Curated demo HTML for each component in the gallery.
 * Runs at build time — strings are injected via set:html.
 */

export interface DemoConfig {
  primary: string;
  primaryLabel?: string;
}

const DEMO_MAP: Record<string, DemoConfig> = {
  'wc-button': {
    primaryLabel: 'Variants & Sizes',
    primary: `
      <div style="display:flex;flex-direction:column;gap:1.5rem;align-items:flex-start;">
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <wc-button variant="primary">Primary Action</wc-button>
          <wc-button variant="secondary">Secondary</wc-button>
          <wc-button variant="ghost">Ghost</wc-button>
          <wc-button variant="primary" disabled>Disabled</wc-button>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <wc-button variant="primary" wc-size="sm">Small</wc-button>
          <wc-button variant="primary" wc-size="md">Medium</wc-button>
          <wc-button variant="primary" wc-size="lg">Large</wc-button>
        </div>
      </div>`,
  },

  'wc-alert': {
    primaryLabel: 'Status Notifications',
    primary: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <wc-alert variant="info">Patient records have been updated successfully.</wc-alert>
        <wc-alert variant="success">Lab results are now available for review.</wc-alert>
        <wc-alert variant="warning">Medication interaction detected — please review.</wc-alert>
        <wc-alert variant="error" closable>Critical: Unable to connect to EHR system.</wc-alert>
      </div>`,
  },

  'wc-badge': {
    primaryLabel: 'Status Indicators',
    primary: `
      <div style="display:flex;flex-direction:column;gap:1.25rem;">
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <wc-badge variant="primary">Active</wc-badge>
          <wc-badge variant="success">Verified</wc-badge>
          <wc-badge variant="warning">Pending Review</wc-badge>
          <wc-badge variant="error">Critical</wc-badge>
          <wc-badge variant="neutral">Archived</wc-badge>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <wc-badge variant="success" pill>Compliant</wc-badge>
          <wc-badge variant="error" pill pulse>STAT</wc-badge>
          <wc-badge variant="primary" wc-size="sm">SM</wc-badge>
          <wc-badge variant="primary" wc-size="lg">Large</wc-badge>
        </div>
      </div>`,
  },

  'wc-card': {
    primaryLabel: 'Card Variants',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
        <wc-card variant="default">
          <span slot="header">Patient Summary</span>
          <p>View comprehensive patient demographics, insurance details, and visit history.</p>
        </wc-card>
        <wc-card variant="featured">
          <span slot="header">Lab Results</span>
          <p>Most recent lab panel results with trend analysis and reference ranges.</p>
        </wc-card>
        <wc-card variant="compact" wc-href="#">
          <span slot="header">Quick Link</span>
          <p>Interactive card that navigates on click.</p>
        </wc-card>
      </div>`,
  },

  'wc-container': {
    primaryLabel: 'Layout Widths',
    primary: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <wc-container width="narrow" padding="md" style="background:rgba(6,182,212,0.08);border:1px dashed rgba(6,182,212,0.3);border-radius:8px;">
          <div style="text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.7);">Narrow container (640px)</div>
        </wc-container>
        <wc-container width="content" padding="md" style="background:rgba(139,92,246,0.08);border:1px dashed rgba(139,92,246,0.3);border-radius:8px;">
          <div style="text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.7);">Content container (960px)</div>
        </wc-container>
        <wc-container width="full" padding="md" style="background:rgba(16,185,129,0.08);border:1px dashed rgba(16,185,129,0.3);border-radius:8px;">
          <div style="text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.7);">Full-width container</div>
        </wc-container>
      </div>`,
  },

  'wc-prose': {
    primaryLabel: 'Rich Text Content',
    primary: `
      <wc-prose>
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
      </wc-prose>`,
  },

  'wc-text-input': {
    primaryLabel: 'Input States',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;">
        <wc-text-input label="Patient Email" type="email" placeholder="patient@example.com" help-text="Used for appointment reminders"></wc-text-input>
        <wc-text-input label="Medical Record #" placeholder="MRN-000000" required></wc-text-input>
        <wc-text-input label="Password" type="password" placeholder="Enter password" error="Password must be at least 12 characters"></wc-text-input>
        <wc-text-input label="Search Records" type="search" placeholder="Search by name or MRN" disabled></wc-text-input>
      </div>`,
  },

  'wc-textarea': {
    primaryLabel: 'Multi-line Input',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;">
        <wc-textarea label="Clinical Notes" placeholder="Enter clinical observations..." rows="4" help-text="Document patient encounter details"></wc-textarea>
        <wc-textarea label="Discharge Summary" placeholder="Summarize discharge instructions..." rows="4" maxlength="500" show-count></wc-textarea>
      </div>`,
  },

  'wc-select': {
    primaryLabel: 'Dropdown Selection',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;">
        <wc-select label="Department" placeholder="Select department" help-text="Primary care department">
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
          <option value="oncology">Oncology</option>
          <option value="pediatrics">Pediatrics</option>
          <option value="radiology">Radiology</option>
        </wc-select>
        <wc-select label="Priority" placeholder="Select priority" error="Priority is required" required>
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="stat">STAT</option>
        </wc-select>
      </div>`,
  },

  'wc-checkbox': {
    primaryLabel: 'Checkbox States',
    primary: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <wc-checkbox label="I confirm the patient identity has been verified" checked></wc-checkbox>
        <wc-checkbox label="Patient has provided informed consent" help-text="Required before procedure"></wc-checkbox>
        <wc-checkbox label="Allergies have been reviewed" error="This field is required" required></wc-checkbox>
        <wc-checkbox label="Previous acknowledgment (read-only)" checked disabled></wc-checkbox>
      </div>`,
  },

  'wc-radio-group': {
    primaryLabel: 'Radio Selection',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;">
        <wc-radio-group label="Blood Type" name="blood-type" help-text="From most recent lab panel">
          <wc-radio value="a-pos" label="A+"></wc-radio>
          <wc-radio value="b-pos" label="B+"></wc-radio>
          <wc-radio value="o-pos" label="O+"></wc-radio>
          <wc-radio value="ab-pos" label="AB+"></wc-radio>
        </wc-radio-group>
        <wc-radio-group label="Visit Type" name="visit-type" orientation="horizontal">
          <wc-radio value="new" label="New Patient"></wc-radio>
          <wc-radio value="follow-up" label="Follow-Up"></wc-radio>
          <wc-radio value="urgent" label="Urgent Care"></wc-radio>
        </wc-radio-group>
      </div>`,
  },

  'wc-switch': {
    primaryLabel: 'Toggle Controls',
    primary: `
      <div style="display:flex;flex-direction:column;gap:1rem;">
        <wc-switch label="Enable appointment reminders" checked></wc-switch>
        <wc-switch label="Share records with referring provider" help-text="Patient consent required"></wc-switch>
        <wc-switch label="High-contrast mode" wc-size="lg"></wc-switch>
        <wc-switch label="Legacy system (locked)" disabled checked></wc-switch>
      </div>`,
  },

  'wc-form': {
    primaryLabel: 'Patient Intake Form',
    primary: `
      <wc-form name="patient-intake">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1rem;">
          <wc-text-input label="First Name" name="first-name" placeholder="Jane" required></wc-text-input>
          <wc-text-input label="Last Name" name="last-name" placeholder="Doe" required></wc-text-input>
          <wc-text-input label="Date of Birth" name="dob" type="text" placeholder="MM/DD/YYYY" required></wc-text-input>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1rem;">
          <wc-select label="Insurance Provider" name="insurance" placeholder="Select provider">
            <option value="aetna">Aetna</option>
            <option value="bcbs">Blue Cross Blue Shield</option>
            <option value="cigna">Cigna</option>
            <option value="united">UnitedHealthcare</option>
          </wc-select>
          <wc-text-input label="Policy Number" name="policy" placeholder="POL-000000"></wc-text-input>
        </div>
        <wc-checkbox label="I confirm all information is accurate" required style="margin-bottom:1rem;"></wc-checkbox>
        <wc-button variant="primary" type="submit">Submit Intake Form</wc-button>
      </wc-form>`,
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
