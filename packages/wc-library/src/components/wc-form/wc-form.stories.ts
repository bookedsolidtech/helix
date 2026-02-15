import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './wc-form.js';
import '../wc-text-input/wc-text-input.js';
import '../wc-button/wc-button.js';
import '../wc-checkbox/wc-checkbox.js';
import '../wc-select/wc-select.js';
import '../wc-textarea/wc-textarea.js';

const meta = {
  title: 'Components/Form',
  component: 'wc-form',
  tags: ['autodocs'],
  argTypes: {
    action: {
      control: 'text',
      description: 'Submission URL. Empty = client-side only.',
      table: {
        defaultValue: { summary: "''" },
      },
    },
    method: {
      control: { type: 'select' },
      options: ['get', 'post'],
      description: 'HTTP method for form submission.',
      table: {
        defaultValue: { summary: 'post' },
      },
    },
    novalidate: {
      control: 'boolean',
      description: 'Disable constraint validation on submit.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    name: {
      control: 'text',
      description: 'Form identification name.',
    },
  },
  args: {
    action: '',
    method: 'post',
    novalidate: false,
    name: '',
  },
  render: (args) => html`
    <wc-form
      action=${args.action}
      method=${args.method}
      ?novalidate=${args.novalidate}
      name=${args.name}
    >
      <div class="form-item">
        <label for="default-input">Name</label>
        <input type="text" id="default-input" name="name" placeholder="Enter your name" />
      </div>
    </wc-form>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Default ───

export const Default: Story = {};

// ─── Native HTML Form ───

export const NativeHtmlForm: Story = {
  render: () => html`
    <wc-form
      @wc-submit=${(e: CustomEvent) => {
        console.log('wc-submit:', e.detail);
      }}
    >
      <form>
        <div class="form-item">
          <label for="native-name">Full Name</label>
          <input type="text" id="native-name" name="fullName" placeholder="Jane Doe" required />
        </div>

        <div class="form-item">
          <label for="native-email">Email Address</label>
          <input type="email" id="native-email" name="email" placeholder="jane@example.com" required />
        </div>

        <div class="form-item">
          <label for="native-select">Department</label>
          <select id="native-select" name="department">
            <option value="">Select a department</option>
            <option value="cardiology">Cardiology</option>
            <option value="neurology">Neurology</option>
            <option value="orthopedics">Orthopedics</option>
          </select>
        </div>

        <div class="form-item">
          <label for="native-textarea">Notes</label>
          <textarea id="native-textarea" name="notes" placeholder="Additional notes..." rows="3"></textarea>
        </div>

        <div class="form-actions">
          <button type="submit">Submit</button>
          <button type="reset">Reset</button>
        </div>
      </form>
    </wc-form>
  `,
};

// ─── With WC Components ───

export const WithWcComponents: Story = {
  render: () => html`
    <wc-form action="/api/patients" method="post">
      <wc-text-input
        label="Patient Name"
        name="patientName"
        placeholder="Enter patient name"
        required
      ></wc-text-input>

      <wc-text-input
        label="Date of Birth"
        name="dob"
        type="text"
        placeholder="MM/DD/YYYY"
        required
      ></wc-text-input>

      <wc-select label="Insurance Provider" name="insurance">
        <option value="">Select provider</option>
        <option value="blue-cross">Blue Cross Blue Shield</option>
        <option value="aetna">Aetna</option>
        <option value="united">UnitedHealthcare</option>
        <option value="cigna">Cigna</option>
      </wc-select>

      <wc-textarea
        label="Medical History"
        name="history"
        placeholder="Relevant medical history..."
      ></wc-textarea>

      <wc-checkbox label="I confirm this information is accurate" name="confirm" required></wc-checkbox>

      <div class="form-actions">
        <wc-button type="submit">Register Patient</wc-button>
        <wc-button type="reset" variant="secondary">Clear</wc-button>
      </div>
    </wc-form>
  `,
};

// ─── Hybrid Mode ───

export const HybridMode: Story = {
  render: () => html`
    <wc-form
      @wc-submit=${(e: CustomEvent) => {
        console.log('Hybrid form submitted:', e.detail);
      }}
    >
      <form>
        <wc-text-input
          label="Username"
          name="username"
          placeholder="Choose a username"
          required
        ></wc-text-input>

        <div class="form-item">
          <label for="hybrid-password">Password</label>
          <input type="password" id="hybrid-password" name="password" placeholder="Enter password" required />
          <span class="description">Must be at least 8 characters.</span>
        </div>

        <wc-checkbox label="Remember me" name="remember"></wc-checkbox>

        <div class="form-actions">
          <wc-button type="submit">Sign In</wc-button>
        </div>
      </form>
    </wc-form>
  `,
};

// ─── Validation States ───

export const ValidationStates: Story = {
  render: () => html`
    <wc-form>
      <form>
        <div class="form-item error">
          <label for="val-email">Email Address <span class="form-required">*</span></label>
          <input type="email" id="val-email" name="email" value="not-valid" />
          <span class="error-message">Please enter a valid email address.</span>
        </div>

        <div class="form-item has-error">
          <label for="val-phone">Phone Number <span class="form-required">*</span></label>
          <input type="tel" id="val-phone" name="phone" value="abc" />
          <span class="form-item__error-message">Please enter a valid phone number.</span>
        </div>

        <div class="form-item success">
          <label for="val-name">Full Name</label>
          <input type="text" id="val-name" name="name" value="Dr. Jane Smith" />
          <span class="success-message">Looks good!</span>
        </div>

        <div class="form-item">
          <label for="val-dept">Department</label>
          <select id="val-dept" name="department">
            <option value="">Select a department</option>
            <option value="er" selected>Emergency Room</option>
          </select>
          <span class="description">Choose your primary department.</span>
        </div>

        <div class="form-actions">
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </wc-form>
  `,
};

// ─── Drupal Login Simulation ───

export const DrupalLoginSimulation: Story = {
  render: () => html`
    <wc-form>
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
    </wc-form>
  `,
};

// ─── Webform Simulation ───

export const WebformSimulation: Story = {
  render: () => html`
    <wc-form
      @wc-submit=${(e: CustomEvent) => {
        console.log('Webform data:', e.detail);
      }}
    >
      <form>
        <fieldset>
          <legend>Patient Information</legend>

          <div class="form-columns form-columns--2">
            <div class="form-item">
              <label for="wf-first">
                First Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="wf-first" name="first_name" required />
            </div>

            <div class="form-item">
              <label for="wf-last">
                Last Name
                <span class="form-required" aria-hidden="true">*</span>
              </label>
              <input type="text" id="wf-last" name="last_name" required />
            </div>
          </div>

          <div class="form-item">
            <label for="wf-email">
              Email
              <span class="form-required" aria-hidden="true">*</span>
            </label>
            <input type="email" id="wf-email" name="email" required />
            <span class="description">We will send appointment confirmations to this address.</span>
          </div>

          <div class="form-item">
            <label for="wf-phone">Phone</label>
            <input type="tel" id="wf-phone" name="phone" />
          </div>
        </fieldset>

        <fieldset>
          <legend>Appointment Details</legend>

          <div class="form-item">
            <label for="wf-dept">
              Department
              <span class="form-required" aria-hidden="true">*</span>
            </label>
            <select id="wf-dept" name="department" required>
              <option value="">-- Select --</option>
              <option value="primary-care">Primary Care</option>
              <option value="cardiology">Cardiology</option>
              <option value="dermatology">Dermatology</option>
              <option value="neurology">Neurology</option>
              <option value="orthopedics">Orthopedics</option>
            </select>
          </div>

          <div class="form-item">
            <label>Preferred Time</label>
            <div class="form-radios">
              <div class="form-type-radio">
                <input type="radio" id="wf-morning" name="preferred_time" value="morning" />
                <label for="wf-morning">Morning (8am - 12pm)</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="wf-afternoon" name="preferred_time" value="afternoon" />
                <label for="wf-afternoon">Afternoon (12pm - 5pm)</label>
              </div>
              <div class="form-type-radio">
                <input type="radio" id="wf-evening" name="preferred_time" value="evening" />
                <label for="wf-evening">Evening (5pm - 8pm)</label>
              </div>
            </div>
          </div>

          <div class="form-item">
            <label for="wf-reason">Reason for Visit</label>
            <textarea id="wf-reason" name="reason" rows="4" placeholder="Briefly describe your symptoms or reason for the visit..."></textarea>
          </div>
        </fieldset>

        <div class="form-type-checkbox">
          <input type="checkbox" id="wf-consent" name="consent" required />
          <label for="wf-consent">
            I consent to the collection and processing of my health information.
            <span class="form-required" aria-hidden="true">*</span>
          </label>
        </div>

        <div class="form-actions">
          <button type="submit">Submit Request</button>
          <button type="reset">Clear Form</button>
        </div>
      </form>
    </wc-form>
  `,
};
