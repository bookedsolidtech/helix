import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-form.js';
import '../hx-text-input/hx-text-input.js';
import '../hx-button/hx-button.js';
import '../hx-checkbox/hx-checkbox.js';
import '../hx-select/hx-select.js';
import '../hx-textarea/hx-textarea.js';
import '../hx-radio-group/hx-radio-group.js';
import '../hx-radio-group/hx-radio.js';
import '../hx-switch/hx-switch.js';
import '../hx-card/hx-card.js';
import '../hx-alert/hx-alert.js';

// ─── Meta ───

const meta = {
  title: 'Components/Form',
  component: 'hx-form',
  tags: ['autodocs'],
  argTypes: {
    action: {
      control: 'text',
      description:
        'The URL to submit the form to. When empty, the form handles submission client-side only and dispatches `hx-submit`.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    method: {
      control: { type: 'select' },
      options: ['get', 'post'],
      description: 'The HTTP method used when submitting the form.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'post'" },
        type: { summary: "'get' | 'post'" },
      },
    },
    novalidate: {
      control: 'boolean',
      description:
        'When true, disables the browser built-in constraint validation on form submission.',
      table: {
        category: 'Properties',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    name: {
      control: 'text',
      description: 'Identifies the form for scripting and form discovery.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    action: '',
    method: 'post',
    novalidate: false,
    name: '',
  },
  render: (args) => html`
    <hx-form
      action=${args.action}
      method=${args.method}
      ?novalidate=${args.novalidate}
      name=${args.name}
    >
      <form>
        <hx-text-input
          label="Patient Name"
          name="patientName"
          placeholder="Enter patient full name"
          required
        ></hx-text-input>

        <hx-text-input
          label="Medical Record Number"
          name="mrn"
          placeholder="MRN-000000"
          help-text="Unique identifier assigned at registration."
        ></hx-text-input>

        <div class="form-actions">
          <hx-button type="submit">Submit</hx-button>
          <hx-button type="reset" variant="secondary">Reset</hx-button>
        </div>
      </form>
    </hx-form>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);

    const nameInput = canvasElement.querySelector(
      'hx-text-input[name="patientName"]',
    ) as HTMLElement & { value: string };

    const mrnInput = canvasElement.querySelector('hx-text-input[name="mrn"]') as HTMLElement & {
      value: string;
    };

    // Type into the shadow DOM inputs
    const nameNative = nameInput.shadowRoot?.querySelector('input');
    const mrnNative = mrnInput.shadowRoot?.querySelector('input');

    if (nameNative) {
      await userEvent.clear(nameNative);
      await userEvent.type(nameNative, 'Dr. Sarah Chen');
    }

    if (mrnNative) {
      await userEvent.clear(mrnNative);
      await userEvent.type(mrnNative, 'MRN-204819');
    }

    const submitBtn = canvasElement.querySelector('hx-button[type="submit"]') as HTMLElement;
    const nativeBtn = submitBtn?.shadowRoot?.querySelector('button');
    if (nativeBtn) {
      await userEvent.click(nativeBtn);
    }
  },
};

// ─────────────────────────────────────────────────
// 2. FORM MODES
// ─────────────────────────────────────────────────

/** Form using only native HTML inputs styled by hx-form scoped CSS. */
export const NativeHtmlForm: Story = {
  render: () => html`
    <hx-form>
      <form>
        <div class="form-item">
          <label for="native-name">
            Full Name
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="text" id="native-name" name="fullName" placeholder="Jane Doe" required />
        </div>

        <div class="form-item">
          <label for="native-email">
            Email Address
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input
            type="email"
            id="native-email"
            name="email"
            placeholder="jane@hospital.org"
            required
          />
        </div>

        <div class="form-item">
          <label for="native-dept">Department</label>
          <select id="native-dept" name="department">
            <option value="">Select a department</option>
            <option value="cardiology">Cardiology</option>
            <option value="neurology">Neurology</option>
            <option value="orthopedics">Orthopedics</option>
            <option value="oncology">Oncology</option>
          </select>
        </div>

        <div class="form-item">
          <label for="native-notes">Clinical Notes</label>
          <textarea
            id="native-notes"
            name="notes"
            placeholder="Additional clinical observations..."
            rows="3"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit">Submit Referral</button>
          <button type="reset">Clear</button>
        </div>
      </form>
    </hx-form>
  `,
};

/** Form using only hx-* web components for all fields. */
export const WithWebComponents: Story = {
  render: () => html`
    <hx-form action="/api/patients" method="post">
      <hx-text-input
        label="Patient Name"
        name="patientName"
        placeholder="Enter patient name"
        required
      ></hx-text-input>

      <hx-text-input
        label="Date of Birth"
        name="dob"
        type="text"
        placeholder="MM/DD/YYYY"
        required
      ></hx-text-input>

      <hx-select label="Insurance Provider" name="insurance" placeholder="Select provider">
        <option value="blue-cross">Blue Cross Blue Shield</option>
        <option value="aetna">Aetna</option>
        <option value="united">UnitedHealthcare</option>
        <option value="cigna">Cigna</option>
      </hx-select>

      <hx-textarea
        label="Medical History"
        name="history"
        placeholder="Relevant medical history..."
        rows="4"
      ></hx-textarea>

      <hx-checkbox
        label="I confirm this information is accurate"
        name="confirm"
        required
      ></hx-checkbox>

      <div class="form-actions">
        <hx-button type="submit">Register Patient</hx-button>
        <hx-button type="reset" variant="secondary">Clear</hx-button>
      </div>
    </hx-form>
  `,
};

/** Form mixing native HTML inputs and hx-* web components. */
export const HybridMode: Story = {
  render: () => html`
    <hx-form>
      <form>
        <hx-text-input
          label="Username"
          name="username"
          placeholder="Choose a username"
          required
        ></hx-text-input>

        <div class="form-item">
          <label for="hybrid-password">
            Password
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input
            type="password"
            id="hybrid-password"
            name="password"
            placeholder="Enter password"
            required
          />
          <span class="description">Must be at least 8 characters.</span>
        </div>

        <hx-checkbox label="Remember me" name="remember"></hx-checkbox>

        <div class="form-actions">
          <hx-button type="submit">Sign In</hx-button>
        </div>
      </form>
    </hx-form>
  `,
};

// ─────────────────────────────────────────────────
// 3. VALIDATION
// ─────────────────────────────────────────────────

/** Form with required fields. Submit empty to see validation errors. */
export const RequiredFields: Story = {
  render: () => html`
    <hx-form>
      <form>
        <hx-text-input label="First Name" name="firstName" required></hx-text-input>

        <hx-text-input label="Last Name" name="lastName" required></hx-text-input>

        <hx-text-input label="Email" name="email" type="email" required></hx-text-input>

        <hx-select label="Blood Type" name="bloodType" placeholder="Select blood type" required>
          <option value="a-pos">A+</option>
          <option value="a-neg">A-</option>
          <option value="b-pos">B+</option>
          <option value="b-neg">B-</option>
          <option value="o-pos">O+</option>
          <option value="o-neg">O-</option>
          <option value="ab-pos">AB+</option>
          <option value="ab-neg">AB-</option>
        </hx-select>

        <hx-checkbox
          label="I have reviewed the patient consent form"
          name="consent"
          required
        ></hx-checkbox>

        <div class="form-actions">
          <hx-button type="submit">Submit</hx-button>
        </div>
      </form>
    </hx-form>
  `,
  play: async ({ canvasElement }) => {
    // Submit the empty form to trigger validation errors
    const submitBtn = canvasElement.querySelector('hx-button[type="submit"]') as HTMLElement;
    const nativeBtn = submitBtn?.shadowRoot?.querySelector('button');
    if (nativeBtn) {
      await userEvent.click(nativeBtn);
    }
  },
};

/** Form fields pre-set with error messages demonstrating error states. */
export const ErrorStates: Story = {
  render: () => html`
    <hx-form>
      <form>
        <div class="form-item error">
          <label for="err-email">
            Email Address
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="email" id="err-email" name="email" value="not-a-valid-email" />
          <span class="error-message">Please enter a valid email address.</span>
        </div>

        <div class="form-item has-error">
          <label for="err-phone">
            Phone Number
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="tel" id="err-phone" name="phone" value="abc-invalid" />
          <span class="form-item__error-message">Please enter a valid 10-digit phone number.</span>
        </div>

        <hx-text-input
          label="Provider NPI"
          name="npi"
          value="123"
          error="NPI must be exactly 10 digits."
          required
        ></hx-text-input>

        <hx-select
          label="Primary Care Physician"
          name="pcp"
          error="Please select a physician."
          required
          placeholder="Select a physician"
        >
          <option value="smith">Dr. Smith</option>
          <option value="patel">Dr. Patel</option>
          <option value="garcia">Dr. Garcia</option>
        </hx-select>

        <div class="form-actions">
          <hx-button type="submit">Save Changes</hx-button>
        </div>
      </form>
    </hx-form>
  `,
};

/** Form in a success state after submission. */
export const SuccessState: Story = {
  render: () => html`
    <hx-form>
      <form>
        <div class="form-item success">
          <label for="suc-name">Full Name</label>
          <input type="text" id="suc-name" name="name" value="Dr. Jane Smith" />
          <span class="success-message">Verified against provider registry.</span>
        </div>

        <div class="form-item success">
          <label for="suc-npi">NPI Number</label>
          <input type="text" id="suc-npi" name="npi" value="1234567890" />
          <span class="success-message">NPI validated successfully.</span>
        </div>

        <div class="form-item success">
          <label for="suc-dept">Department</label>
          <select id="suc-dept" name="department">
            <option value="cardiology" selected>Cardiology</option>
          </select>
          <span class="success-message">Department confirmed.</span>
        </div>

        <div class="form-actions">
          <hx-button type="submit" disabled>Submitted</hx-button>
        </div>
      </form>
    </hx-form>
  `,
};

/**
 * Complete validation flow: submit empty form to see errors,
 * then fill in fields and resubmit.
 */
export const ValidationFlow: Story = {
  render: () => html`
    <hx-form>
      <form>
        <div class="form-item">
          <label for="vf-name">
            Patient Name
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="text" id="vf-name" name="patientName" required />
        </div>

        <div class="form-item">
          <label for="vf-email">
            Contact Email
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="email" id="vf-email" name="contactEmail" required />
        </div>

        <div class="form-actions">
          <hx-button type="submit">Submit</hx-button>
        </div>
      </form>
    </hx-form>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Step 1: Submit the empty form to trigger native validation
    const submitBtn = canvasElement.querySelector('hx-button[type="submit"]') as HTMLElement;
    const nativeBtn = submitBtn?.shadowRoot?.querySelector('button');
    if (nativeBtn) {
      await userEvent.click(nativeBtn);
    }

    // Step 2: Fill in the required fields
    const nameInput = canvas.getByLabelText('Patient Name *');
    await userEvent.type(nameInput, 'Maria Rodriguez');

    const emailInput = canvas.getByLabelText('Contact Email *');
    await userEvent.type(emailInput, 'maria.rodriguez@hospital.org');

    // Step 3: Resubmit (should pass validation now)
    if (nativeBtn) {
      await userEvent.click(nativeBtn);
    }
  },
};

// ─────────────────────────────────────────────────
// 4. KITCHEN SINKS
// ─────────────────────────────────────────────────

/** Demonstrates every hx-* form component inside a single form. */
export const AllFormComponents: Story = {
  render: () => html`
    <hx-form>
      <form>
        <hx-text-input
          label="Patient Full Name"
          name="patientName"
          placeholder="Enter patient name"
          help-text="Legal name as it appears on government ID."
          required
        ></hx-text-input>

        <hx-text-input
          label="Email Address"
          name="email"
          type="email"
          placeholder="patient@example.com"
          required
        ></hx-text-input>

        <hx-text-input
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="(555) 123-4567"
        ></hx-text-input>

        <hx-textarea
          label="Reason for Visit"
          name="reason"
          placeholder="Describe the reason for your visit..."
          rows="3"
          show-count
          maxlength="500"
        ></hx-textarea>

        <hx-select label="Preferred Language" name="language" placeholder="Select language">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="zh">Mandarin</option>
          <option value="vi">Vietnamese</option>
        </hx-select>

        <hx-radio-group label="Preferred Contact Method" name="contactMethod" required>
          <hx-radio value="phone" label="Phone"></hx-radio>
          <hx-radio value="email" label="Email"></hx-radio>
          <hx-radio value="portal" label="Patient Portal"></hx-radio>
        </hx-radio-group>

        <hx-checkbox
          label="I have read and agree to the Notice of Privacy Practices"
          name="hipaaConsent"
          required
        ></hx-checkbox>

        <hx-switch
          label="Receive appointment reminders via SMS"
          name="smsReminders"
          help-text="Standard messaging rates may apply."
        ></hx-switch>

        <div class="form-actions">
          <hx-button type="submit">Submit Registration</hx-button>
          <hx-button type="reset" variant="secondary">Clear Form</hx-button>
        </div>
      </form>
    </hx-form>
  `,
};

// ─────────────────────────────────────────────────
// 5. COMPOSITION
// ─────────────────────────────────────────────────

/** Form with multiple fieldsets organizing patient, insurance, and emergency contact data. */
export const MultiFieldsetForm: Story = {
  render: () => html`
    <hx-form>
      <form>
        <fieldset>
          <legend>Patient Information</legend>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="mf-first">
                First Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="mf-first" name="firstName" required />
            </div>

            <div class="form-item">
              <label for="mf-last">
                Last Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="mf-last" name="lastName" required />
            </div>
          </div>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="mf-dob">Date of Birth</label>
              <input type="text" id="mf-dob" name="dob" placeholder="MM/DD/YYYY" />
            </div>

            <div class="form-item">
              <label for="mf-gender">Gender</label>
              <select id="mf-gender" name="gender">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="nonbinary">Non-binary</option>
                <option value="prefer-not">Prefer not to say</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Insurance Details</legend>

          <div class="form-item">
            <label for="mf-provider">Insurance Provider</label>
            <select id="mf-provider" name="insuranceProvider">
              <option value="">Select provider</option>
              <option value="blue-cross">Blue Cross Blue Shield</option>
              <option value="aetna">Aetna</option>
              <option value="united">UnitedHealthcare</option>
              <option value="cigna">Cigna</option>
              <option value="medicare">Medicare</option>
              <option value="medicaid">Medicaid</option>
            </select>
          </div>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="mf-policy">Policy Number</label>
              <input type="text" id="mf-policy" name="policyNumber" />
            </div>

            <div class="form-item">
              <label for="mf-group">Group Number</label>
              <input type="text" id="mf-group" name="groupNumber" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Emergency Contact</legend>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="mf-ec-name">
                Contact Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="mf-ec-name" name="emergencyName" required />
            </div>

            <div class="form-item">
              <label for="mf-ec-relation">Relationship</label>
              <select id="mf-ec-relation" name="emergencyRelationship">
                <option value="">Select</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="child">Child</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-item">
            <label for="mf-ec-phone">
              Contact Phone
              <span class="form-required" aria-hidden="true">*</span>
            </label>
            <input type="tel" id="mf-ec-phone" name="emergencyPhone" required />
          </div>
        </fieldset>

        <div class="form-actions">
          <hx-button type="submit">Complete Registration</hx-button>
          <hx-button type="reset" variant="secondary">Clear All</hx-button>
        </div>
      </form>
    </hx-form>
  `,
};

/** Form rendered inside an hx-card component. */
export const InACard: Story = {
  render: () => html`
    <hx-card elevation="raised">
      <span slot="heading" style="font-size: 1.25rem; font-weight: 600;">
        Schedule Appointment
      </span>
      <hx-form>
        <form>
          <hx-text-input
            label="Patient Name"
            name="patientName"
            placeholder="Enter patient name"
            required
          ></hx-text-input>

          <hx-select label="Department" name="department" placeholder="Select department" required>
            <option value="primary-care">Primary Care</option>
            <option value="cardiology">Cardiology</option>
            <option value="dermatology">Dermatology</option>
            <option value="neurology">Neurology</option>
          </hx-select>

          <hx-text-input
            label="Preferred Date"
            name="preferredDate"
            type="text"
            placeholder="MM/DD/YYYY"
          ></hx-text-input>

          <hx-textarea
            label="Additional Notes"
            name="notes"
            placeholder="Any special requirements or concerns..."
            rows="3"
          ></hx-textarea>

          <div class="form-actions">
            <hx-button type="submit">Request Appointment</hx-button>
            <hx-button type="reset" variant="ghost">Cancel</hx-button>
          </div>
        </form>
      </hx-form>
    </hx-card>
  `,
};

/** Form with success and error hx-alert components on submission. */
export const WithAlerts: Story = {
  render: () => html`
    <div>
      <hx-alert variant="error" .open=${false} closable id="form-error-alert">
        Please correct the errors below before submitting.
      </hx-alert>

      <hx-alert variant="success" .open=${false} closable id="form-success-alert">
        Patient referral submitted successfully. Confirmation ID: REF-20260216-0042.
      </hx-alert>

      <hx-form
        @hx-submit=${(_e: CustomEvent) => {
          const successAlert = document.getElementById('form-success-alert') as HTMLElement & {
            open: boolean;
          };
          const errorAlert = document.getElementById('form-error-alert') as HTMLElement & {
            open: boolean;
          };
          if (successAlert) successAlert.open = true;
          if (errorAlert) errorAlert.open = false;
        }}
        @hx-invalid=${() => {
          const successAlert = document.getElementById('form-success-alert') as HTMLElement & {
            open: boolean;
          };
          const errorAlert = document.getElementById('form-error-alert') as HTMLElement & {
            open: boolean;
          };
          if (errorAlert) errorAlert.open = true;
          if (successAlert) successAlert.open = false;
        }}
      >
        <form>
          <hx-text-input
            label="Referring Physician"
            name="referringPhysician"
            required
            placeholder="Dr. Last Name"
          ></hx-text-input>

          <hx-text-input
            label="Patient MRN"
            name="mrn"
            required
            placeholder="MRN-000000"
          ></hx-text-input>

          <hx-textarea
            label="Referral Reason"
            name="reason"
            required
            placeholder="Clinical indication for referral..."
          ></hx-textarea>

          <div class="form-actions">
            <hx-button type="submit">Submit Referral</hx-button>
            <hx-button type="reset" variant="secondary">Clear</hx-button>
          </div>
        </form>
      </hx-form>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. EDGE CASES
// ─────────────────────────────────────────────────

/** Empty form with no fields at all. */
export const EmptyForm: Story = {
  render: () => html`
    <hx-form>
      <form>
        <p style="color: var(--hx-color-neutral-500, #6c757d); font-style: italic;">
          No form fields have been configured for this form.
        </p>
        <div class="form-actions">
          <hx-button type="submit">Submit</hx-button>
        </div>
      </form>
    </hx-form>
  `,
};

/** Form with 15+ fields demonstrating scrollable long forms. */
export const ManyFields: Story = {
  render: () => html`
    <hx-form>
      <form>
        <hx-text-input label="First Name" name="firstName" required></hx-text-input>
        <hx-text-input label="Middle Name" name="middleName"></hx-text-input>
        <hx-text-input label="Last Name" name="lastName" required></hx-text-input>
        <hx-text-input
          label="Date of Birth"
          name="dob"
          placeholder="MM/DD/YYYY"
          required
        ></hx-text-input>
        <hx-text-input
          label="Social Security Number"
          name="ssn"
          placeholder="XXX-XX-XXXX"
          help-text="Encrypted at rest. Used for insurance verification only."
        ></hx-text-input>
        <hx-text-input label="Phone (Home)" name="phoneHome" type="tel"></hx-text-input>
        <hx-text-input label="Phone (Mobile)" name="phoneMobile" type="tel"></hx-text-input>
        <hx-text-input label="Email Address" name="email" type="email" required></hx-text-input>
        <hx-text-input label="Street Address" name="street" required></hx-text-input>
        <hx-text-input label="City" name="city" required></hx-text-input>
        <hx-text-input label="State" name="state" required></hx-text-input>
        <hx-text-input label="ZIP Code" name="zip" required></hx-text-input>
        <hx-text-input label="Primary Care Physician" name="pcp"></hx-text-input>
        <hx-text-input label="Pharmacy Name" name="pharmacy"></hx-text-input>
        <hx-text-input label="Pharmacy Phone" name="pharmacyPhone" type="tel"></hx-text-input>
        <hx-textarea
          label="Known Allergies"
          name="allergies"
          placeholder="List known allergies and reactions..."
          rows="3"
        ></hx-textarea>
        <hx-textarea
          label="Current Medications"
          name="medications"
          placeholder="List current medications and dosages..."
          rows="3"
        ></hx-textarea>

        <div class="form-actions">
          <hx-button type="submit">Complete Intake</hx-button>
          <hx-button type="reset" variant="secondary">Clear All</hx-button>
        </div>
      </form>
    </hx-form>
  `,
};

/** Fill form, click reset, verify fields are cleared. */
export const FormReset: Story = {
  render: () => html`
    <hx-form>
      <form>
        <div class="form-item">
          <label for="reset-name">Patient Name</label>
          <input type="text" id="reset-name" name="patientName" />
        </div>

        <div class="form-item">
          <label for="reset-email">Email</label>
          <input type="email" id="reset-email" name="email" />
        </div>

        <div class="form-item">
          <label for="reset-notes">Notes</label>
          <textarea id="reset-notes" name="notes" rows="2"></textarea>
        </div>

        <div class="form-actions">
          <hx-button type="submit">Submit</hx-button>
          <hx-button type="reset" variant="secondary">Reset</hx-button>
        </div>
      </form>
    </hx-form>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Fill fields
    const nameInput = canvas.getByLabelText('Patient Name') as HTMLInputElement;
    await userEvent.type(nameInput, 'Dr. Michael Torres');

    const emailInput = canvas.getByLabelText('Email') as HTMLInputElement;
    await userEvent.type(emailInput, 'mtorres@hospital.org');

    const notesInput = canvas.getByLabelText('Notes') as HTMLTextAreaElement;
    await userEvent.type(notesInput, 'Follow-up in 2 weeks');

    // Verify fields have content
    await expect(nameInput).toHaveValue('Dr. Michael Torres');
    await expect(emailInput).toHaveValue('mtorres@hospital.org');

    // Click reset
    const resetBtn = canvasElement.querySelector('hx-button[type="reset"]') as HTMLElement;
    const nativeResetBtn = resetBtn?.shadowRoot?.querySelector('button');
    if (nativeResetBtn) {
      await userEvent.click(nativeResetBtn);
    }

    // Verify fields are cleared
    await expect(nameInput).toHaveValue('');
    await expect(emailInput).toHaveValue('');
    await expect(notesInput).toHaveValue('');
  },
};

// ─────────────────────────────────────────────────
// 7. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

/**
 * Demonstrates all `--hx-form-*` CSS custom properties.
 * The form uses adopted stylesheets with scoped CSS, so customization
 * happens via the design token layer (`--wc-*` variables).
 */
export const CSSCustomProperties: Story = {
  render: () => html`
    <div
      style="
        --hx-form-gap: 1.5rem;
        --hx-form-max-width: 600px;
        --hx-form-padding: 2rem;
      "
    >
      <h4 style="margin-bottom: 1rem; font-family: sans-serif; font-weight: 600;">
        CSS Custom Properties: --hx-form-gap, --hx-form-max-width, --hx-form-padding
      </h4>
      <hx-form>
        <form>
          <hx-text-input
            label="First Name"
            name="firstName"
            placeholder="Controlled by --hx-form-gap"
          ></hx-text-input>

          <hx-text-input
            label="Last Name"
            name="lastName"
            placeholder="Controlled by --hx-form-max-width"
          ></hx-text-input>

          <hx-textarea
            label="Notes"
            name="notes"
            placeholder="Controlled by --hx-form-padding"
            rows="2"
          ></hx-textarea>

          <div class="form-actions">
            <hx-button type="submit">Save</hx-button>
          </div>
        </form>
      </hx-form>
    </div>

    <hr style="margin: 2rem 0; border: none; border-top: 1px solid #dee2e6;" />

    <div>
      <h4 style="margin-bottom: 1rem; font-family: sans-serif; font-weight: 600;">
        Default values (no custom property overrides)
      </h4>
      <hx-form>
        <form>
          <hx-text-input
            label="First Name"
            name="firstName2"
            placeholder="Default gap"
          ></hx-text-input>

          <hx-text-input
            label="Last Name"
            name="lastName2"
            placeholder="Default max-width (none)"
          ></hx-text-input>

          <div class="form-actions">
            <hx-button type="submit">Save</hx-button>
          </div>
        </form>
      </hx-form>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. CSS PARTS DEMO
// ─────────────────────────────────────────────────

/**
 * hx-form is a Light DOM component and does not expose CSS Parts.
 * This story documents the CSS class hooks available for styling
 * native elements within the form scope.
 */
export const CSSPartsDemo: Story = {
  name: 'CSS Class Hooks (Light DOM)',
  render: () => html`
    <div style="font-family: sans-serif;">
      <h4 style="margin-bottom: 1rem; font-weight: 600;">Light DOM CSS Class Hooks</h4>
      <p style="margin-bottom: 1.5rem; color: #6c757d; font-size: 0.875rem;">
        Since hx-form renders in Light DOM, styling is scoped via class-based selectors prefixed
        with <code>hx-form</code>. These classes serve the same purpose as CSS Parts in Shadow DOM
        components.
      </p>

      <hx-form>
        <form>
          <div
            class="form-item"
            style="outline: 2px dashed #2563EB; outline-offset: 4px; position: relative;"
          >
            <span
              style="position: absolute; top: -12px; left: 8px; background: white; padding: 0 4px; font-size: 0.625rem; color: #2563EB; font-weight: 700;"
            >
              .form-item
            </span>
            <label for="parts-name">Patient Name</label>
            <input
              type="text"
              id="parts-name"
              name="name"
              placeholder="Styled by hx-form scoped CSS"
            />
            <span class="description"> .description </span>
          </div>

          <div
            class="form-item error"
            style="outline: 2px dashed #dc3545; outline-offset: 4px; position: relative;"
          >
            <span
              style="position: absolute; top: -12px; left: 8px; background: white; padding: 0 4px; font-size: 0.625rem; color: #dc3545; font-weight: 700;"
            >
              .form-item.error
            </span>
            <label for="parts-email">
              Email
              <span class="form-required">*</span>
            </label>
            <input type="email" id="parts-email" name="email" value="invalid" />
            <span class="error-message">.error-message</span>
          </div>

          <div
            class="form-item success"
            style="outline: 2px dashed #198754; outline-offset: 4px; position: relative;"
          >
            <span
              style="position: absolute; top: -12px; left: 8px; background: white; padding: 0 4px; font-size: 0.625rem; color: #198754; font-weight: 700;"
            >
              .form-item.success
            </span>
            <label for="parts-phone">Phone</label>
            <input type="tel" id="parts-phone" name="phone" value="(555) 123-4567" />
            <span class="success-message">.success-message</span>
          </div>

          <div
            class="form-type-checkbox"
            style="outline: 2px dashed #6f42c1; outline-offset: 4px; position: relative;"
          >
            <span
              style="position: absolute; top: -12px; left: 8px; background: white; padding: 0 4px; font-size: 0.625rem; color: #6f42c1; font-weight: 700;"
            >
              .form-type-checkbox
            </span>
            <input type="checkbox" id="parts-agree" name="agree" />
            <label for="parts-agree">Checkbox layout hook</label>
          </div>

          <div
            class="form-actions"
            style="outline: 2px dashed #fd7e14; outline-offset: 4px; position: relative;"
          >
            <span
              style="position: absolute; top: -12px; left: 8px; background: white; padding: 0 4px; font-size: 0.625rem; color: #fd7e14; font-weight: 700;"
            >
              .form-actions
            </span>
            <button type="submit">Submit</button>
            <button type="reset">Reset</button>
          </div>
        </form>
      </hx-form>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. INTERACTION TESTS
// ─────────────────────────────────────────────────

/** Fill form fields, submit, and verify the hx-submit event fires with FormData. */
export const FormSubmission: Story = {
  render: () => {
    const onSubmit = fn();
    return html`
      <hx-form @hx-submit=${onSubmit} id="submission-test-form">
        <form>
          <div class="form-item">
            <label for="sub-name">Physician Name</label>
            <input type="text" id="sub-name" name="physician" />
          </div>

          <div class="form-item">
            <label for="sub-dept">Department</label>
            <input type="text" id="sub-dept" name="department" />
          </div>

          <div class="form-actions">
            <hx-button type="submit">Submit</hx-button>
          </div>
        </form>
      </hx-form>
    `;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameInput = canvas.getByLabelText('Physician Name') as HTMLInputElement;
    await userEvent.type(nameInput, 'Dr. Amara Okafor');

    const deptInput = canvas.getByLabelText('Department') as HTMLInputElement;
    await userEvent.type(deptInput, 'Internal Medicine');

    const submitBtn = canvasElement.querySelector('hx-button[type="submit"]') as HTMLElement;
    const nativeBtn = submitBtn?.shadowRoot?.querySelector('button');
    if (nativeBtn) {
      await userEvent.click(nativeBtn);
    }

    // Verify the inputs have expected values
    await expect(nameInput).toHaveValue('Dr. Amara Okafor');
    await expect(deptInput).toHaveValue('Internal Medicine');
  },
};

/** Fill form, reset, and verify all field values are cleared. */
export const FormResetInteraction: Story = {
  name: 'Form Reset (Interaction)',
  render: () => html`
    <hx-form>
      <form>
        <div class="form-item">
          <label for="ri-name">Patient Name</label>
          <input type="text" id="ri-name" name="patientName" />
        </div>

        <div class="form-item">
          <label for="ri-phone">Phone</label>
          <input type="tel" id="ri-phone" name="phone" />
        </div>

        <div class="form-actions">
          <hx-button type="submit">Submit</hx-button>
          <hx-button type="reset" variant="secondary">Reset</hx-button>
        </div>
      </form>
    </hx-form>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameInput = canvas.getByLabelText('Patient Name') as HTMLInputElement;
    const phoneInput = canvas.getByLabelText('Phone') as HTMLInputElement;

    await userEvent.type(nameInput, 'James Patterson');
    await userEvent.type(phoneInput, '5551234567');

    await expect(nameInput).toHaveValue('James Patterson');
    await expect(phoneInput).toHaveValue('5551234567');

    const resetBtn = canvasElement.querySelector('hx-button[type="reset"]') as HTMLElement;
    const nativeResetBtn = resetBtn?.shadowRoot?.querySelector('button');
    if (nativeResetBtn) {
      await userEvent.click(nativeResetBtn);
    }

    await expect(nameInput).toHaveValue('');
    await expect(phoneInput).toHaveValue('');
  },
};

/** Submit form and verify FormData entries contain all expected values. */
export const FormDataExtraction: Story = {
  render: () => html`
    <hx-form
      @hx-submit=${(
        e: CustomEvent<{ valid: boolean; values: Record<string, FormDataEntryValue> }>,
      ) => {
        const output = document.getElementById('formdata-output');
        if (output) {
          output.textContent = JSON.stringify(e.detail.values, null, 2);
        }
      }}
    >
      <form>
        <div class="form-item">
          <label for="fd-first">First Name</label>
          <input type="text" id="fd-first" name="firstName" />
        </div>

        <div class="form-item">
          <label for="fd-last">Last Name</label>
          <input type="text" id="fd-last" name="lastName" />
        </div>

        <div class="form-item">
          <label for="fd-dept">Department</label>
          <select id="fd-dept" name="department">
            <option value="">Select</option>
            <option value="cardiology">Cardiology</option>
            <option value="neurology">Neurology</option>
          </select>
        </div>

        <div class="form-actions">
          <hx-button type="submit">Extract Data</hx-button>
        </div>
      </form>
    </hx-form>

    <pre
      id="formdata-output"
      style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 0.375rem; font-size: 0.875rem; min-height: 3rem; font-family: monospace;"
    >
Submit the form to see extracted FormData here.</pre
    >
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const firstInput = canvas.getByLabelText('First Name') as HTMLInputElement;
    await userEvent.type(firstInput, 'Chen');

    const lastInput = canvas.getByLabelText('Last Name') as HTMLInputElement;
    await userEvent.type(lastInput, 'Wei');

    const deptSelect = canvas.getByLabelText('Department') as HTMLSelectElement;
    await userEvent.selectOptions(deptSelect, 'cardiology');

    const submitBtn = canvasElement.querySelector('hx-button[type="submit"]') as HTMLElement;
    const nativeBtn = submitBtn?.shadowRoot?.querySelector('button');
    if (nativeBtn) {
      await userEvent.click(nativeBtn);
    }

    // Verify the output contains the submitted data
    const output = canvasElement.querySelector('#formdata-output');
    await expect(output?.textContent).toContain('Chen');
    await expect(output?.textContent).toContain('Wei');
    await expect(output?.textContent).toContain('cardiology');
  },
};

/** Submit form with empty required fields and verify errors appear. */
export const ValidationTrigger: Story = {
  render: () => html`
    <hx-form>
      <form>
        <div class="form-item">
          <label for="vt-name">
            Patient Name
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="text" id="vt-name" name="patientName" required />
        </div>

        <div class="form-item">
          <label for="vt-email">
            Email
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="email" id="vt-email" name="email" required />
        </div>

        <div class="form-item">
          <label for="vt-phone">
            Phone
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="tel" id="vt-phone" name="phone" required />
        </div>

        <div class="form-actions">
          <hx-button type="submit">Submit</hx-button>
        </div>
      </form>
    </hx-form>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Submit empty form to trigger validation
    const submitBtn = canvasElement.querySelector('hx-button[type="submit"]') as HTMLElement;
    const nativeBtn = submitBtn?.shadowRoot?.querySelector('button');
    if (nativeBtn) {
      await userEvent.click(nativeBtn);
    }

    // Verify required fields are invalid
    const nameInput = canvas.getByLabelText('Patient Name *') as HTMLInputElement;
    await expect(nameInput.validity.valid).toBe(false);

    const emailInput = canvas.getByLabelText('Email *') as HTMLInputElement;
    await expect(emailInput.validity.valid).toBe(false);

    const phoneInput = canvas.getByLabelText('Phone *') as HTMLInputElement;
    await expect(phoneInput.validity.valid).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 10. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

/** Full patient intake form with personal, insurance, and emergency contact sections. */
export const PatientRegistration: Story = {
  render: () => html`
    <hx-form>
      <form>
        <fieldset>
          <legend>Personal Information</legend>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="pr-first">
                First Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="pr-first" name="firstName" required />
            </div>

            <div class="form-item">
              <label for="pr-last">
                Last Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="pr-last" name="lastName" required />
            </div>
          </div>

          <div class="form-columns form-columns--3">
            <div class="form-item">
              <label for="pr-dob">
                Date of Birth
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="pr-dob" name="dob" placeholder="MM/DD/YYYY" required />
            </div>

            <div class="form-item">
              <label for="pr-ssn">Social Security Number</label>
              <input type="text" id="pr-ssn" name="ssn" placeholder="XXX-XX-XXXX" />
              <span class="description">Used for insurance verification. Encrypted at rest.</span>
            </div>

            <div class="form-item">
              <label for="pr-gender">Gender</label>
              <select id="pr-gender" name="gender">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="nonbinary">Non-binary</option>
                <option value="prefer-not">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="pr-phone">
                Phone
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="tel" id="pr-phone" name="phone" placeholder="(555) 123-4567" required />
            </div>

            <div class="form-item">
              <label for="pr-email">
                Email
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input
                type="email"
                id="pr-email"
                name="email"
                placeholder="patient@example.com"
                required
              />
            </div>
          </div>

          <div class="form-item">
            <label for="pr-address">Street Address</label>
            <input type="text" id="pr-address" name="address" placeholder="123 Main Street" />
          </div>

          <div class="form-columns form-columns--3">
            <div class="form-item">
              <label for="pr-city">City</label>
              <input type="text" id="pr-city" name="city" />
            </div>

            <div class="form-item">
              <label for="pr-state">State</label>
              <select id="pr-state" name="state">
                <option value="">Select</option>
                <option value="CA">California</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
                <option value="FL">Florida</option>
                <option value="IL">Illinois</option>
              </select>
            </div>

            <div class="form-item">
              <label for="pr-zip">ZIP Code</label>
              <input type="text" id="pr-zip" name="zip" placeholder="00000" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Insurance Information</legend>

          <div class="form-item">
            <label for="pr-ins-provider">Insurance Provider</label>
            <select id="pr-ins-provider" name="insuranceProvider">
              <option value="">Select provider</option>
              <option value="blue-cross">Blue Cross Blue Shield</option>
              <option value="aetna">Aetna</option>
              <option value="united">UnitedHealthcare</option>
              <option value="cigna">Cigna</option>
              <option value="humana">Humana</option>
              <option value="medicare">Medicare</option>
              <option value="medicaid">Medicaid</option>
              <option value="tricare">TRICARE</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="pr-policy">Policy Number</label>
              <input type="text" id="pr-policy" name="policyNumber" />
            </div>

            <div class="form-item">
              <label for="pr-group">Group Number</label>
              <input type="text" id="pr-group" name="groupNumber" />
            </div>
          </div>

          <div class="form-item">
            <label for="pr-subscriber">Subscriber Name (if different from patient)</label>
            <input type="text" id="pr-subscriber" name="subscriberName" />
          </div>
        </fieldset>

        <fieldset>
          <legend>Emergency Contact</legend>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="pr-ec-name">
                Contact Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="pr-ec-name" name="emergencyName" required />
            </div>

            <div class="form-item">
              <label for="pr-ec-rel">Relationship</label>
              <select id="pr-ec-rel" name="emergencyRelationship">
                <option value="">Select</option>
                <option value="spouse">Spouse / Partner</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="child">Adult Child</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="pr-ec-phone">
                Contact Phone
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="tel" id="pr-ec-phone" name="emergencyPhone" required />
            </div>

            <div class="form-item">
              <label for="pr-ec-email">Contact Email</label>
              <input type="email" id="pr-ec-email" name="emergencyEmail" />
            </div>
          </div>
        </fieldset>

        <hr class="form-divider" />

        <div class="form-type-checkbox">
          <input type="checkbox" id="pr-consent" name="consent" required />
          <label for="pr-consent">
            I certify that the information provided is true and correct to the best of my knowledge.
            I authorize the release of medical information necessary to process insurance claims.
            <span class="form-required" aria-hidden="true">*</span>
          </label>
        </div>

        <div class="form-actions">
          <hx-button type="submit">Complete Registration</hx-button>
          <hx-button type="reset" variant="secondary">Clear All Fields</hx-button>
        </div>
      </form>
    </hx-form>
  `,
};

/** Drupal-style login form with username and password fields. */
export const DrupalLoginSimulation: Story = {
  render: () => html`
    <hx-form>
      <form>
        <div class="form-item">
          <label for="drupal-user">
            Username
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="text" id="drupal-user" name="name" maxlength="60" required />
          <span class="description">Enter your Clinical Portal username.</span>
        </div>

        <div class="form-item">
          <label for="drupal-pass">
            Password
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="password" id="drupal-pass" name="pass" required />
          <span class="description">Enter the password that accompanies your username.</span>
        </div>

        <div class="form-actions">
          <button type="submit">Log in</button>
        </div>
      </form>
    </hx-form>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const usernameInput = canvas.getByLabelText('Username *') as HTMLInputElement;
    await userEvent.type(usernameInput, 'dr.chen');

    const passwordInput = canvas.getByLabelText('Password *') as HTMLInputElement;
    await userEvent.type(passwordInput, 'SecurePass2026');

    await expect(usernameInput).toHaveValue('dr.chen');
    await expect(passwordInput).toHaveValue('SecurePass2026');
  },
};

/** Multi-section clinical assessment form with radio groups, textareas, and structured data collection. */
export const ClinicalWebform: Story = {
  render: () => html`
    <hx-form>
      <form>
        <fieldset>
          <legend>Patient Demographics</legend>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="cw-first">
                First Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="cw-first" name="firstName" required />
            </div>

            <div class="form-item">
              <label for="cw-last">
                Last Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="cw-last" name="lastName" required />
            </div>
          </div>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="cw-dob">Date of Birth</label>
              <input type="text" id="cw-dob" name="dob" placeholder="MM/DD/YYYY" />
            </div>

            <div class="form-item">
              <label for="cw-mrn">Medical Record Number</label>
              <input type="text" id="cw-mrn" name="mrn" placeholder="MRN-000000" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Pain Assessment</legend>

          <div class="form-item">
            <label>Current Pain Level (0-10)</label>
            <div class="form-radios form-radios--horizontal">
              <div class="form-type-radio">
                <input type="radio" id="cw-pain-0" name="painLevel" value="0" />
                <label for="cw-pain-0">0</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-pain-2" name="painLevel" value="2" />
                <label for="cw-pain-2">2</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-pain-4" name="painLevel" value="4" />
                <label for="cw-pain-4">4</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-pain-6" name="painLevel" value="6" />
                <label for="cw-pain-6">6</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-pain-8" name="painLevel" value="8" />
                <label for="cw-pain-8">8</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-pain-10" name="painLevel" value="10" />
                <label for="cw-pain-10">10</label>
              </div>
            </div>
          </div>

          <div class="form-item">
            <label>Pain Location</label>
            <div class="form-radios">
              <div class="form-type-radio">
                <input type="radio" id="cw-loc-head" name="painLocation" value="head" />
                <label for="cw-loc-head">Head / Neck</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-loc-chest" name="painLocation" value="chest" />
                <label for="cw-loc-chest">Chest</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-loc-abdomen" name="painLocation" value="abdomen" />
                <label for="cw-loc-abdomen">Abdomen</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-loc-back" name="painLocation" value="back" />
                <label for="cw-loc-back">Back</label>
              </div>
              <div class="form-type-radio">
                <input
                  type="radio"
                  id="cw-loc-extremities"
                  name="painLocation"
                  value="extremities"
                />
                <label for="cw-loc-extremities">Extremities</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-loc-other" name="painLocation" value="other" />
                <label for="cw-loc-other">Other</label>
              </div>
            </div>
          </div>

          <div class="form-item">
            <label for="cw-pain-desc">Describe Pain Characteristics</label>
            <textarea
              id="cw-pain-desc"
              name="painDescription"
              rows="3"
              placeholder="Sharp, dull, throbbing, constant, intermittent..."
            ></textarea>
          </div>
        </fieldset>

        <fieldset>
          <legend>Vital Signs</legend>

          <div class="form-columns form-columns--3">
            <div class="form-item">
              <label for="cw-bp">Blood Pressure (mmHg)</label>
              <input type="text" id="cw-bp" name="bloodPressure" placeholder="120/80" />
            </div>

            <div class="form-item">
              <label for="cw-hr">Heart Rate (bpm)</label>
              <input type="number" id="cw-hr" name="heartRate" placeholder="72" />
            </div>

            <div class="form-item">
              <label for="cw-temp">Temperature (F)</label>
              <input type="number" id="cw-temp" name="temperature" placeholder="98.6" />
            </div>
          </div>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="cw-resp">Respiratory Rate (breaths/min)</label>
              <input type="number" id="cw-resp" name="respiratoryRate" placeholder="16" />
            </div>

            <div class="form-item">
              <label for="cw-o2">O2 Saturation (%)</label>
              <input type="number" id="cw-o2" name="o2Saturation" placeholder="98" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Assessment and Plan</legend>

          <div class="form-item">
            <label for="cw-assessment">
              Clinical Assessment
              <span class="form-required" aria-hidden="true">*</span>
            </label>
            <textarea
              id="cw-assessment"
              name="assessment"
              rows="4"
              placeholder="Document clinical findings, differential diagnosis, and assessment..."
              required
            ></textarea>
          </div>

          <div class="form-item">
            <label for="cw-plan">
              Treatment Plan
              <span class="form-required" aria-hidden="true">*</span>
            </label>
            <textarea
              id="cw-plan"
              name="plan"
              rows="4"
              placeholder="Medications, procedures, follow-up, referrals..."
              required
            ></textarea>
          </div>

          <div class="form-item">
            <label>Follow-Up Recommended</label>
            <div class="form-radios">
              <div class="form-type-radio">
                <input type="radio" id="cw-fu-1wk" name="followUp" value="1-week" />
                <label for="cw-fu-1wk">1 Week</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-fu-2wk" name="followUp" value="2-weeks" />
                <label for="cw-fu-2wk">2 Weeks</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-fu-1mo" name="followUp" value="1-month" />
                <label for="cw-fu-1mo">1 Month</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-fu-3mo" name="followUp" value="3-months" />
                <label for="cw-fu-3mo">3 Months</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="cw-fu-asneeded" name="followUp" value="as-needed" />
                <label for="cw-fu-asneeded">As Needed</label>
              </div>
            </div>
          </div>
        </fieldset>

        <hr class="form-divider" />

        <div class="form-type-checkbox">
          <input type="checkbox" id="cw-attest" name="attestation" required />
          <label for="cw-attest">
            I attest that this clinical documentation is accurate and complete to the best of my
            medical judgment.
            <span class="form-required" aria-hidden="true">*</span>
          </label>
        </div>

        <div class="form-actions">
          <hx-button type="submit">Sign and Submit</hx-button>
          <hx-button type="reset" variant="secondary">Clear Form</hx-button>
        </div>
      </form>
    </hx-form>
  `,
};

// ─────────────────────────────────────────────────
// VALIDATION ERROR CYCLE
// ─────────────────────────────────────────────────

/**
 * Demonstrates the complete validation/error cycle:
 * 1. Submit empty required fields → hx-invalid fires
 * 2. Error summary with role="alert" appears
 * 3. Fields get aria-invalid="true"
 * 4. User corrects fields → resubmit fires hx-submit
 *
 * This story documents the expected consumer pattern for hx-form validation.
 */
export const ValidationErrorCycle: Story = {
  render: () => html`
    <hx-form id="validation-demo-form">
      <form>
        <div class="form-item">
          <label for="ve-name">
            Full Name
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="text" id="ve-name" name="fullName" required />
        </div>

        <div class="form-item">
          <label for="ve-email">
            Email Address
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="email" id="ve-email" name="email" required />
        </div>

        <div class="form-actions">
          <hx-button type="submit">Submit</hx-button>
          <hx-button type="reset" variant="secondary">Reset</hx-button>
        </div>
      </form>
    </hx-form>
  `,
  play: async ({ canvasElement }) => {
    const hxForm = canvasElement.querySelector('#validation-demo-form') as HTMLElement & {
      updateComplete: Promise<boolean>;
    };
    const form = canvasElement.querySelector('form')!;

    // Step 1: Submit with empty required fields → triggers hx-invalid
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await hxForm.updateComplete;

    // Step 2: Verify error summary appears
    const summary = canvasElement.querySelector('.hx-form-error-summary');
    await expect(summary).toBeTruthy();
    await expect(summary?.getAttribute('role')).toBe('alert');

    // Step 3: Verify aria-invalid is set on invalid inputs
    const nameInput = canvasElement.querySelector('input[name="fullName"]') as HTMLInputElement;
    await expect(nameInput?.getAttribute('aria-invalid')).toBe('true');

    // Step 4: Fill in the fields
    await userEvent.type(nameInput, 'Dr. Jane Smith');
    const emailInput = canvasElement.querySelector('input[name="email"]') as HTMLInputElement;
    await userEvent.type(emailInput, 'jane.smith@hospital.org');

    // Step 5: Resubmit — should fire hx-submit (no errors)
    let submitted = false;
    hxForm.addEventListener('hx-submit', () => {
      submitted = true;
    });
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await hxForm.updateComplete;

    await expect(submitted).toBe(true);
    // Error summary should be gone
    await expect(canvasElement.querySelector('.hx-form-error-summary')).toBeNull();
  },
};

// ─────────────────────────────────────────────────
// RESET BEHAVIOR
// ─────────────────────────────────────────────────

/**
 * Demonstrates the reset cycle:
 * 1. Fill in fields
 * 2. Click Reset → hx-reset fires
 * 3. Error summary is removed if present
 */
export const ResetBehavior: Story = {
  render: () => html`
    <hx-form id="reset-demo-form">
      <form>
        <div class="form-item">
          <label for="rb-name">
            Patient Name
            <span class="form-required" aria-hidden="true">*</span>
          </label>
          <input type="text" id="rb-name" name="patientName" required />
        </div>

        <div class="form-item">
          <label for="rb-mrn">MRN</label>
          <input type="text" id="rb-mrn" name="mrn" />
        </div>

        <div class="form-actions">
          <hx-button type="submit">Submit</hx-button>
          <hx-button type="reset" variant="secondary">Reset</hx-button>
        </div>
      </form>
    </hx-form>
  `,
  play: async ({ canvasElement }) => {
    const hxForm = canvasElement.querySelector('#reset-demo-form') as HTMLElement & {
      updateComplete: Promise<boolean>;
    };
    const form = canvasElement.querySelector('form')!;
    const nameInput = canvasElement.querySelector('input[name="patientName"]') as HTMLInputElement;
    const mrnInput = canvasElement.querySelector('input[name="mrn"]') as HTMLInputElement;

    // Step 1: Fill in fields
    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(mrnInput, 'MRN-123456');
    await expect(nameInput.value).toBe('John Doe');

    // Step 2: Trigger validation failure to show error summary
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await hxForm.updateComplete;

    // Step 3: Reset the form
    let resetFired = false;
    hxForm.addEventListener('hx-reset', () => {
      resetFired = true;
    });
    form.dispatchEvent(new Event('reset', { bubbles: true }));
    await hxForm.updateComplete;

    // Step 4: Verify hx-reset was dispatched
    await expect(resetFired).toBe(true);

    // Step 5: Verify error summary is cleared
    await expect(canvasElement.querySelector('.hx-form-error-summary')).toBeNull();
  },
};
