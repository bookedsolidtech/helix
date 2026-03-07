import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-card.js';
import '../hx-button/hx-button.js';
import '../hx-badge/hx-badge.js';
import '../hx-alert/hx-alert.js';
import '../hx-text-input/hx-text-input.js';
import '../hx-container/hx-container.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Card',
  component: 'hx-card',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'featured', 'compact'],
      description: 'Visual style variant of the card.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'featured' | 'compact'" },
      },
    },
    elevation: {
      control: { type: 'select' },
      options: ['flat', 'raised', 'floating'],
      description: 'Elevation (shadow depth) of the card.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'flat' },
        type: { summary: "'flat' | 'raised' | 'floating'" },
      },
    },
    hxHref: {
      control: 'text',
      description:
        'Optional URL. When set, the card becomes interactive (clickable) and navigates to this URL on click.',
      table: {
        category: 'Interaction',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'default',
    elevation: 'flat',
    hxHref: '',
  },
  render: (args) => html`
    <hx-card
      variant=${args.variant}
      elevation=${args.elevation}
      hx-href=${args.hxHref || ''}
      style="max-width: 400px;"
    >
      <span slot="heading">Patient Overview</span>
      <p>
        Review the latest vitals, lab results, and care plan updates for this patient before the
        next scheduled appointment.
      </p>
    </hx-card>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <hx-card variant=${args.variant} elevation=${args.elevation} style="max-width: 400px;">
      <span slot="heading">Patient Overview</span>
      <p>
        Review the latest vitals, lab results, and care plan updates for this patient before the
        next scheduled appointment.
      </p>
    </hx-card>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector('hx-card');
    await expect(card).toBeTruthy();

    // Verify shadow DOM structure
    const shadow = card?.shadowRoot;
    await expect(shadow?.querySelector('.card')).toBeTruthy();
    await expect(shadow?.querySelector('.card__heading')).toBeTruthy();
    await expect(shadow?.querySelector('.card__body')).toBeTruthy();

    // Verify the card is rendered in the canvas
    await expect(canvas.getByText('Patient Overview')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY VARIANT
// ─────────────────────────────────────────────────

export const VariantDefault: Story = {
  name: 'Variant: Default',
  args: { variant: 'default' },
  render: (args) => html`
    <hx-card variant=${args.variant} style="max-width: 400px;">
      <span slot="heading">Default Variant</span>
      <p>
        Standard card used for general-purpose content display across the clinical dashboard.
        Suitable for patient summaries, appointment details, and care plan overviews.
      </p>
    </hx-card>
  `,
};

export const VariantFeatured: Story = {
  name: 'Variant: Featured',
  args: { variant: 'featured' },
  render: (args) => html`
    <hx-card variant=${args.variant} elevation="raised" style="max-width: 400px;">
      <span slot="heading">Featured Variant</span>
      <p>
        Highlighted card with a prominent border, used to draw attention to priority items such as
        critical lab results or urgent care notifications.
      </p>
    </hx-card>
  `,
};

export const VariantCompact: Story = {
  name: 'Variant: Compact',
  args: { variant: 'compact' },
  render: (args) => html`
    <hx-card variant=${args.variant} style="max-width: 300px;">
      <span slot="heading">Compact Variant</span>
      <p>Reduced padding for dense layouts such as sidebar widgets and secondary data panels.</p>
    </hx-card>
  `,
};

// ─────────────────────────────────────────────────
// 3. EVERY ELEVATION
// ─────────────────────────────────────────────────

export const ElevationFlat: Story = {
  name: 'Elevation: Flat',
  args: { elevation: 'flat' },
  render: (args) => html`
    <hx-card elevation=${args.elevation} style="max-width: 400px;">
      <span slot="heading">Flat Elevation</span>
      <p>
        No box shadow. Used for inline content that blends with the page surface, such as embedded
        data tables or inline patient notes.
      </p>
    </hx-card>
  `,
};

export const ElevationRaised: Story = {
  name: 'Elevation: Raised',
  args: { elevation: 'raised' },
  render: (args) => html`
    <hx-card elevation=${args.elevation} style="max-width: 400px;">
      <span slot="heading">Raised Elevation</span>
      <p>
        Medium box shadow providing subtle depth. The standard elevation for dashboard cards and
        primary content containers.
      </p>
    </hx-card>
  `,
};

export const ElevationFloating: Story = {
  name: 'Elevation: Floating',
  args: { elevation: 'floating' },
  render: (args) => html`
    <hx-card elevation=${args.elevation} style="max-width: 400px;">
      <span slot="heading">Floating Elevation</span>
      <p>
        Heavy box shadow for content that appears to float above the surface. Use sparingly for
        modals, popovers, or high-priority alerts.
      </p>
    </hx-card>
  `,
};

// ─────────────────────────────────────────────────
// 4. SLOT DEMOS
// ─────────────────────────────────────────────────

export const WithImage: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 400px;">
      <img
        slot="image"
        src="https://placehold.co/400x200/007878/ffffff?text=Patient+Imaging"
        alt="Chest X-ray thumbnail for patient record"
      />
      <span slot="heading">Diagnostic Imaging</span>
      <p>
        Chest X-ray completed on 2026-02-14. Radiologist notes are pending review. Click to view
        full resolution scan in the PACS viewer.
      </p>
    </hx-card>
  `,
};

export const WithHeading: Story = {
  render: () => html`
    <hx-card style="max-width: 400px;">
      <span slot="heading">Medication Reconciliation</span>
      <p>
        Current medications have been verified against the pharmacy database. No interactions
        detected. Last reconciled: 2026-02-15.
      </p>
    </hx-card>
  `,
};

export const WithFooter: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 400px;">
      <span slot="heading">Lab Results</span>
      <p>
        Complete blood count (CBC) results are within normal ranges. Hemoglobin 14.2 g/dL, white
        blood cell count 7.8 x10^9/L.
      </p>
      <span slot="footer">
        <small style="color: var(--hx-color-neutral-500, #6c757d);">
          Collected: 2026-02-14 at 08:30 AM | Resulted: 2026-02-14 at 02:15 PM
        </small>
      </span>
    </hx-card>
  `,
};

export const WithActions: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 400px;">
      <span slot="heading">Pending Orders</span>
      <p>
        3 orders require physician signature before they can be processed by the pharmacy. Review
        and sign to avoid delays in patient care.
      </p>
      <span slot="actions">
        <hx-button hx-size="sm">Review Orders</hx-button>
        <hx-button hx-size="sm" variant="secondary">Dismiss</hx-button>
      </span>
    </hx-card>
  `,
};

export const WithAllSlots: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 400px;">
      <img
        slot="image"
        src="https://placehold.co/400x180/007878/ffffff?text=Facility+Photo"
        alt="Main campus entrance of the healthcare facility"
      />
      <span slot="heading">Facility Update: Main Campus</span>
      <p>
        The new ambulatory care wing is now open for outpatient visits. Departments relocated
        include Cardiology, Pulmonology, and Endocrinology. Updated wayfinding signage has been
        installed throughout the facility.
      </p>
      <span slot="footer">
        <small style="color: var(--hx-color-neutral-500, #6c757d);">
          Posted by Facilities Management | Feb 10, 2026
        </small>
      </span>
      <span slot="actions">
        <hx-button hx-size="sm">View Floor Plan</hx-button>
        <hx-button hx-size="sm" variant="secondary">Share Update</hx-button>
      </span>
    </hx-card>
  `,
};

export const MinimalCard: Story = {
  render: () => html`
    <hx-card style="max-width: 400px;">
      <p>
        This card contains only body content with no heading, footer, or action slots. Useful for
        simple informational blocks where a title is not necessary, such as brief status messages or
        inline notifications.
      </p>
    </hx-card>
  `,
};

// ─────────────────────────────────────────────────
// 5. INTERACTIVE CARD
// ─────────────────────────────────────────────────

const cardClickHandler = fn();

export const Interactive: Story = {
  args: {
    hxHref: 'https://ehr.example.com/patient/12345',
  },
  render: () => html`
    <hx-card
      hx-href="https://ehr.example.com/patient/12345"
      elevation="raised"
      style="max-width: 400px;"
      @hx-card-click=${cardClickHandler}
    >
      <span slot="heading">Patient Record: James Wilson</span>
      <p>
        MRN: 00-12345 | DOB: 1958-03-22 | Primary Care<br />
        Click this card to open the full patient record in the EHR.
      </p>
    </hx-card>
  `,
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('hx-card');
    await expect(card).toBeTruthy();

    const cardEl = card?.shadowRoot?.querySelector('.card');
    await expect(cardEl?.getAttribute('role')).toBe('link');
    await expect(cardEl?.getAttribute('tabindex')).toBe('0');

    // Click interaction
    card?.click();
    await expect(cardClickHandler).toHaveBeenCalled();
  },
};

// ─────────────────────────────────────────────────
// 6. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;">
      <hx-card variant="default" elevation="raised" style="max-width: 260px; flex: 1 1 260px;">
        <span slot="heading">Default</span>
        <p>Standard card for general-purpose content across clinical dashboards.</p>
      </hx-card>

      <hx-card variant="featured" elevation="raised" style="max-width: 260px; flex: 1 1 260px;">
        <span slot="heading">Featured</span>
        <p>Prominent border draws attention to priority items and urgent updates.</p>
      </hx-card>

      <hx-card variant="compact" elevation="raised" style="max-width: 260px; flex: 1 1 260px;">
        <span slot="heading">Compact</span>
        <p>Reduced padding for dense sidebar layouts.</p>
      </hx-card>
    </div>
  `,
};

export const AllElevations: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; padding: 1rem; background: var(--hx-color-neutral-50, #f8f9fa);"
    >
      <hx-card elevation="flat" style="max-width: 260px; flex: 1 1 260px;">
        <span slot="heading">Flat</span>
        <p>No shadow. Blends with the page surface for inline content.</p>
      </hx-card>

      <hx-card elevation="raised" style="max-width: 260px; flex: 1 1 260px;">
        <span slot="heading">Raised</span>
        <p>Medium shadow. Standard depth for dashboard cards.</p>
      </hx-card>

      <hx-card elevation="floating" style="max-width: 260px; flex: 1 1 260px;">
        <span slot="heading">Floating</span>
        <p>Heavy shadow. Reserved for high-priority elevated content.</p>
      </hx-card>
    </div>
  `,
};

export const AllCombinations: Story = {
  render: () => {
    const variants = ['default', 'featured', 'compact'] as const;
    const elevations = ['flat', 'raised', 'floating'] as const;

    return html`
      <div
        style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 1rem; background: var(--hx-color-neutral-50, #f8f9fa);"
      >
        ${variants.map(
          (variant) => html`
            ${elevations.map(
              (elevation) => html`
                <hx-card variant=${variant} elevation=${elevation}>
                  <span slot="heading">${variant} / ${elevation}</span>
                  <p>
                    Variant: <strong>${variant}</strong><br />Elevation:
                    <strong>${elevation}</strong>
                  </p>
                </hx-card>
              `,
            )}
          `,
        )}
      </div>
    `;
  },
};

// ─────────────────────────────────────────────────
// 7. COMPOSITION
// ─────────────────────────────────────────────────

export const CardGrid: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;"
    >
      <hx-card elevation="raised">
        <span slot="heading">Cardiology</span>
        <p>
          Dr. Sarah Chen | 14 patients today<br />
          Next available: 10:30 AM
        </p>
        <span slot="actions">
          <hx-button hx-size="sm">View Schedule</hx-button>
        </span>
      </hx-card>

      <hx-card elevation="raised">
        <span slot="heading">Neurology</span>
        <p>
          Dr. Michael Torres | 9 patients today<br />
          Next available: 2:15 PM
        </p>
        <span slot="actions">
          <hx-button hx-size="sm">View Schedule</hx-button>
        </span>
      </hx-card>

      <hx-card elevation="raised">
        <span slot="heading">Oncology</span>
        <p>
          Dr. Aisha Patel | 11 patients today<br />
          Next available: 11:00 AM
        </p>
        <span slot="actions">
          <hx-button hx-size="sm">View Schedule</hx-button>
        </span>
      </hx-card>

      <hx-card elevation="raised">
        <span slot="heading">Pediatrics</span>
        <p>
          Dr. James Okafor | 18 patients today<br />
          Next available: 3:45 PM
        </p>
        <span slot="actions">
          <hx-button hx-size="sm">View Schedule</hx-button>
        </span>
      </hx-card>

      <hx-card elevation="raised">
        <span slot="heading">Radiology</span>
        <p>
          Dr. Emily Nakamura | 22 scans today<br />
          Next available: 1:00 PM
        </p>
        <span slot="actions">
          <hx-button hx-size="sm">View Schedule</hx-button>
        </span>
      </hx-card>

      <hx-card elevation="raised">
        <span slot="heading">Emergency Medicine</span>
        <p>
          Dr. Robert Kim | Currently on shift<br />
          12 active patients in department
        </p>
        <span slot="actions">
          <hx-button hx-size="sm">View Dashboard</hx-button>
        </span>
      </hx-card>
    </div>
  `,
};

export const CardWithBadge: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 400px;">
      <span slot="heading" style="display: flex; align-items: center; gap: 0.5rem;">
        Critical Lab Result
        <hx-badge variant="error" hx-size="sm" pill>STAT</hx-badge>
      </span>
      <p>
        Potassium level 6.2 mEq/L (critical high). Immediate physician review required. Repeat
        specimen has been requested.
      </p>
      <span slot="footer">
        <small style="color: var(--hx-color-neutral-500, #6c757d);">
          Resulted: 2026-02-16 at 06:42 AM | Lab ID: L-2026-08417
        </small>
      </span>
      <span slot="actions">
        <hx-button hx-size="sm">Acknowledge</hx-button>
        <hx-button hx-size="sm" variant="secondary">View History</hx-button>
      </span>
    </hx-card>
  `,
};

export const CardWithAlert: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 480px;">
      <span slot="heading">Allergy Information</span>
      <div>
        <hx-alert variant="warning" style="margin-bottom: 1rem;">
          Patient has a documented allergy to Penicillin (anaphylaxis). Verify all antibiotic orders
          before administration.
        </hx-alert>
        <p>
          Additional sensitivities: Sulfa drugs (rash), Latex (contact dermatitis). Last allergy
          review conducted on 2026-01-20.
        </p>
      </div>
    </hx-card>
  `,
};

export const CardWithForm: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 480px;">
      <span slot="heading">Patient Intake</span>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <hx-text-input label="Patient Name" placeholder="Last, First MI" required></hx-text-input>
        <hx-text-input
          label="Medical Record Number"
          placeholder="00-00000"
          required
        ></hx-text-input>
        <hx-text-input label="Date of Birth" type="date" required></hx-text-input>
      </div>
      <span slot="actions">
        <hx-button hx-size="sm">Submit</hx-button>
        <hx-button hx-size="sm" variant="ghost">Cancel</hx-button>
      </span>
    </hx-card>
  `,
};

export const InAContainer: Story = {
  render: () => html`
    <hx-container width="md" padding="lg">
      <hx-card elevation="raised">
        <span slot="heading">Department Announcement</span>
        <p>
          The Nursing Education Department will host a mandatory training session on updated sepsis
          protocols. All ICU and ED nursing staff must complete the module by March 1, 2026. Contact
          the Education Department for scheduling conflicts.
        </p>
        <span slot="actions">
          <hx-button hx-size="sm">Register</hx-button>
          <hx-button hx-size="sm" variant="secondary">View Details</hx-button>
        </span>
      </hx-card>
    </hx-container>
  `,
};

// ─────────────────────────────────────────────────
// 8. EDGE CASES
// ─────────────────────────────────────────────────

export const LongHeading: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 400px;">
      <span slot="heading">
        Comprehensive Multi-Disciplinary Care Coordination Meeting Notes for Oncology, Cardiology,
        and Palliative Care Teams Regarding Patient Treatment Plan Revisions and Follow-Up
        Scheduling
      </span>
      <p>
        This card tests how the heading slot handles extremely long text. The heading should wrap
        gracefully without breaking the card layout or overlapping the body content.
      </p>
    </hx-card>
  `,
};

export const NoBody: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 400px;">
      <span slot="heading">Heading Only Card</span>
    </hx-card>
  `,
};

export const OverflowContent: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 400px; max-height: 300px; overflow: auto;">
      <span slot="heading">Discharge Summary</span>
      <div>
        <p><strong>Admission Date:</strong> 2026-01-28</p>
        <p><strong>Discharge Date:</strong> 2026-02-10</p>
        <p><strong>Primary Diagnosis:</strong> Acute myocardial infarction, anterior wall</p>
        <p>
          <strong>Secondary Diagnoses:</strong> Type 2 diabetes mellitus, essential hypertension,
          hyperlipidemia, chronic kidney disease stage III
        </p>
        <p>
          <strong>Procedures Performed:</strong> Percutaneous coronary intervention with
          drug-eluting stent placement in the left anterior descending artery
        </p>
        <p>
          <strong>Hospital Course:</strong> Patient presented to the emergency department with acute
          onset chest pain radiating to the left arm. Initial troponin was elevated at 2.4 ng/mL.
          ECG showed ST elevation in leads V1-V4. Patient was taken emergently to the
          catheterization lab.
        </p>
        <p>
          <strong>Medications at Discharge:</strong> Aspirin 81mg daily, Clopidogrel 75mg daily,
          Metoprolol 50mg twice daily, Lisinopril 10mg daily, Atorvastatin 80mg daily, Metformin
          1000mg twice daily
        </p>
        <p>
          <strong>Follow-Up:</strong> Cardiology in 2 weeks, Primary Care in 1 week, Cardiac
          Rehabilitation referral submitted
        </p>
        <p><strong>Diet:</strong> Heart-healthy, low sodium, diabetic diet</p>
        <p>
          <strong>Activity:</strong> No heavy lifting greater than 10 pounds for 2 weeks. Gradual
          return to normal activity as tolerated.
        </p>
      </div>
    </hx-card>
  `,
};

export const NarrowCard: Story = {
  render: () => html`
    <hx-card elevation="raised" style="width: 200px;">
      <span slot="heading">Vitals</span>
      <div style="font-size: 0.875rem;">
        <p>BP: 128/82</p>
        <p>HR: 74 bpm</p>
        <p>Temp: 98.6 F</p>
        <p>SpO2: 97%</p>
      </div>
    </hx-card>
  `,
};

// ─────────────────────────────────────────────────
// 9. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">
          Themed Card with All Custom Properties
        </h3>
        <hx-card
          elevation="raised"
          style="
            max-width: 400px;
            --hx-card-bg: #f0fdf4;
            --hx-card-color: #14532d;
            --hx-card-border-color: #86efac;
            --hx-card-border-radius: 1rem;
            --hx-card-padding: 2rem;
            --hx-card-gap: 1.5rem;
          "
        >
          <span slot="heading">Custom Themed Card</span>
          <p>
            This card overrides all six CSS custom properties to demonstrate the full theming
            surface available to consumers.
          </p>
          <span slot="actions">
            <hx-button hx-size="sm">Confirm</hx-button>
          </span>
        </hx-card>
      </div>

      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">Dark Theme Override</h3>
        <hx-card
          elevation="raised"
          style="
            max-width: 400px;
            --hx-card-bg: #1e293b;
            --hx-card-color: #e2e8f0;
            --hx-card-border-color: #334155;
            --hx-card-border-radius: 0.25rem;
            --hx-card-padding: 1.25rem;
            --hx-card-gap: 0.75rem;
          "
        >
          <span slot="heading">Dark Theme Card</span>
          <p>
            Demonstrates how design token overrides enable dark mode without modifying the component
            source.
          </p>
          <span slot="footer">
            <small style="color: #94a3b8;">Footer text in dark theme</small>
          </span>
        </hx-card>
      </div>

      <details style="max-width: 640px;">
        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">
          View CSS Custom Properties Reference
        </summary>
        <pre
          style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; font-size: 0.8125rem; overflow-x: auto; line-height: 1.6;"
        >
hx-card {
  /* Background color */
  --hx-card-bg: var(--hx-color-neutral-0);

  /* Text color */
  --hx-card-color: var(--hx-color-neutral-800);

  /* Border color */
  --hx-card-border-color: var(--hx-color-neutral-200);

  /* Border radius */
  --hx-card-border-radius: var(--hx-border-radius-lg);

  /* Internal padding for card sections */
  --hx-card-padding: var(--hx-space-6);

  /* Gap between card sections */
  --hx-card-gap: var(--hx-space-4);
}</pre
        >
      </details>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-card::part(card) {
        border: 2px dashed #6366f1;
        background: linear-gradient(135deg, #faf5ff, #f5f3ff);
      }
      .parts-demo hx-card::part(image) {
        border-bottom: 3px solid #6366f1;
      }
      .parts-demo hx-card::part(heading) {
        background: #ede9fe;
        color: #4338ca;
        border-radius: 0;
      }
      .parts-demo hx-card::part(body) {
        background: #faf5ff;
        font-style: italic;
      }
      .parts-demo hx-card::part(footer) {
        background: #f5f3ff;
        border-top: 1px dashed #c4b5fd;
      }
      .parts-demo hx-card::part(actions) {
        background: #ede9fe;
        border-top: 2px solid #6366f1;
      }
    </style>
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div class="parts-demo">
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">
          All CSS Parts Styled Externally
        </h3>
        <hx-card elevation="raised" style="max-width: 400px;">
          <img
            slot="image"
            src="https://placehold.co/400x120/6366f1/ffffff?text=::part(image)"
            alt="Demonstration of the image CSS part"
          />
          <span slot="heading">::part(heading)</span>
          <p>::part(body) -- The body content area of the card, styled externally via CSS parts.</p>
          <span slot="footer">::part(footer) -- Footer styled externally</span>
          <span slot="actions">
            <hx-button hx-size="sm">::part(actions)</hx-button>
          </span>
        </hx-card>
      </div>

      <details style="max-width: 640px;">
        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">
          View CSS Parts Reference
        </summary>
        <pre
          style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; font-size: 0.8125rem; overflow-x: auto; line-height: 1.6;"
        >
/* Available CSS Parts */
hx-card::part(card)    { /* The outer card container element */ }
hx-card::part(image)   { /* The image slot container */ }
hx-card::part(heading) { /* The heading slot container */ }
hx-card::part(body)    { /* The body slot container */ }
hx-card::part(footer)  { /* The footer slot container */ }
hx-card::part(actions) { /* The actions slot container */ }</pre
        >
      </details>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 11. INTERACTION TESTS
// ─────────────────────────────────────────────────

const interactiveClickHandler = fn();

export const InteractiveClickTest: Story = {
  name: 'Test: Interactive Click',
  render: () => html`
    <hx-card
      hx-href="https://ehr.example.com/patient/67890"
      elevation="raised"
      style="max-width: 400px;"
      @hx-card-click=${interactiveClickHandler}
    >
      <span slot="heading">Clickable Patient Card</span>
      <p>Click this card to verify the hx-card-click event fires correctly.</p>
    </hx-card>
  `,
  play: async ({ canvasElement }) => {
    interactiveClickHandler.mockClear();
    const card = canvasElement.querySelector('hx-card');
    await expect(card).toBeTruthy();

    // Verify interactive attributes
    const cardEl = card?.shadowRoot?.querySelector('.card');
    await expect(cardEl?.getAttribute('role')).toBe('link');
    await expect(cardEl?.getAttribute('tabindex')).toBe('0');
    await expect(cardEl?.classList.contains('card--interactive')).toBe(true);

    // Click the card
    card?.click();
    await expect(interactiveClickHandler).toHaveBeenCalledTimes(1);

    const callDetail = interactiveClickHandler.mock.calls[0]?.[0]?.detail;
    await expect(callDetail?.href).toBe('https://ehr.example.com/patient/67890');
  },
};

const keyboardEnterHandler = fn();

export const InteractiveKeyboardEnter: Story = {
  name: 'Test: Keyboard Enter',
  render: () => html`
    <hx-card
      hx-href="https://ehr.example.com/orders"
      elevation="raised"
      style="max-width: 400px;"
      @hx-card-click=${keyboardEnterHandler}
    >
      <span slot="heading">Keyboard Navigation Test</span>
      <p>Focus this card and press Enter to activate it.</p>
    </hx-card>
  `,
  play: async ({ canvasElement }) => {
    keyboardEnterHandler.mockClear();
    const card = canvasElement.querySelector('hx-card');
    await expect(card).toBeTruthy();

    const cardEl = card?.shadowRoot?.querySelector('.card') as HTMLElement;
    await expect(cardEl).toBeTruthy();

    // Focus the internal card element
    cardEl.focus();
    await expect(cardEl).toHaveFocus();

    // Press Enter
    await userEvent.keyboard('{Enter}');
    await expect(keyboardEnterHandler).toHaveBeenCalledTimes(1);
  },
};

const keyboardSpaceHandler = fn();

export const InteractiveKeyboardSpace: Story = {
  name: 'Test: Keyboard Space',
  render: () => html`
    <hx-card
      hx-href="https://ehr.example.com/labs"
      elevation="raised"
      style="max-width: 400px;"
      @hx-card-click=${keyboardSpaceHandler}
    >
      <span slot="heading">Space Key Activation Test</span>
      <p>Focus this card and press Space to activate it.</p>
    </hx-card>
  `,
  play: async ({ canvasElement }) => {
    keyboardSpaceHandler.mockClear();
    const card = canvasElement.querySelector('hx-card');
    await expect(card).toBeTruthy();

    const cardEl = card?.shadowRoot?.querySelector('.card') as HTMLElement;
    await expect(cardEl).toBeTruthy();

    // Focus the internal card element
    cardEl.focus();
    await expect(cardEl).toHaveFocus();

    // Press Space
    await userEvent.keyboard(' ');
    await expect(keyboardSpaceHandler).toHaveBeenCalledTimes(1);
  },
};

const focusTestHandler = fn();

export const InteractiveFocusManagement: Story = {
  name: 'Test: Focus Management',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
      <hx-button>Focusable element before card</hx-button>
      <hx-card
        hx-href="https://ehr.example.com/vitals"
        elevation="raised"
        @hx-card-click=${focusTestHandler}
      >
        <span slot="heading">Focus Target Card</span>
        <p>Tab to this card to verify it receives focus in the tab order.</p>
      </hx-card>
      <hx-button>Focusable element after card</hx-button>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('hx-card');
    await expect(card).toBeTruthy();

    const cardEl = card?.shadowRoot?.querySelector('.card') as HTMLElement;
    await expect(cardEl).toBeTruthy();

    // Verify the card is focusable
    await expect(cardEl.getAttribute('tabindex')).toBe('0');
    await expect(cardEl.getAttribute('role')).toBe('link');

    // Focus the card directly
    cardEl.focus();
    await expect(cardEl).toHaveFocus();
  },
};

// ─────────────────────────────────────────────────
// 12. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientSummaryCard: Story = {
  render: () => html`
    <hx-card
      variant="featured"
      elevation="raised"
      hx-href="https://ehr.example.com/patient/00-54321"
      style="max-width: 420px;"
    >
      <span
        slot="heading"
        style="display: flex; align-items: center; justify-content: space-between; width: 100%;"
      >
        <span>Margaret Thompson</span>
        <hx-badge variant="success" hx-size="sm" pill>Stable</hx-badge>
      </span>
      <div>
        <div
          style="display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem; font-size: 0.875rem;"
        >
          <strong>MRN:</strong>
          <span>00-54321</span>
          <strong>DOB:</strong>
          <span>1947-11-03 (Age 78)</span>
          <strong>Department:</strong>
          <span>Cardiology - 4 West</span>
          <strong>Attending:</strong>
          <span>Dr. Sarah Chen</span>
          <strong>Admitted:</strong>
          <span>2026-02-12</span>
        </div>
      </div>
      <span slot="footer">
        <small style="color: var(--hx-color-neutral-500, #6c757d);">
          Last vitals: 2026-02-16 at 06:00 AM | BP 132/78, HR 72, Temp 98.4 F
        </small>
      </span>
      <span slot="actions">
        <hx-button hx-size="sm">View Chart</hx-button>
        <hx-button hx-size="sm" variant="secondary">Orders</hx-button>
        <hx-button hx-size="sm" variant="ghost">Notes</hx-button>
      </span>
    </hx-card>
  `,
};

export const PatientDashboard: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;"
    >
      <!-- Critical patient -->
      <hx-card
        variant="featured"
        elevation="raised"
        hx-href="https://ehr.example.com/patient/00-11001"
      >
        <span
          slot="heading"
          style="display: flex; align-items: center; justify-content: space-between; width: 100%;"
        >
          <span>Robert Martinez</span>
          <hx-badge variant="error" hx-size="sm" pill>Critical</hx-badge>
        </span>
        <div style="font-size: 0.875rem;">
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem;">
            <strong>MRN:</strong> <span>00-11001</span> <strong>DOB:</strong>
            <span>1952-07-14 (Age 73)</span> <strong>Dept:</strong> <span>ICU - Bed 4</span>
          </div>
        </div>
        <span slot="footer">
          <small style="color: var(--hx-color-neutral-500, #6c757d);"
            >BP 88/52, HR 112, SpO2 89%</small
          >
        </span>
        <span slot="actions">
          <hx-button hx-size="sm">View Chart</hx-button>
          <hx-button hx-size="sm" variant="secondary">Orders</hx-button>
        </span>
      </hx-card>

      <!-- Observation patient -->
      <hx-card elevation="raised" hx-href="https://ehr.example.com/patient/00-11002">
        <span
          slot="heading"
          style="display: flex; align-items: center; justify-content: space-between; width: 100%;"
        >
          <span>Linda Chen</span>
          <hx-badge variant="warning" hx-size="sm" pill>Observation</hx-badge>
        </span>
        <div style="font-size: 0.875rem;">
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem;">
            <strong>MRN:</strong> <span>00-11002</span> <strong>DOB:</strong>
            <span>1968-03-29 (Age 57)</span> <strong>Dept:</strong> <span>Telemetry - 3 East</span>
          </div>
        </div>
        <span slot="footer">
          <small style="color: var(--hx-color-neutral-500, #6c757d);"
            >BP 142/88, HR 84, SpO2 96%</small
          >
        </span>
        <span slot="actions">
          <hx-button hx-size="sm">View Chart</hx-button>
          <hx-button hx-size="sm" variant="secondary">Orders</hx-button>
        </span>
      </hx-card>

      <!-- Stable patient -->
      <hx-card elevation="raised" hx-href="https://ehr.example.com/patient/00-11003">
        <span
          slot="heading"
          style="display: flex; align-items: center; justify-content: space-between; width: 100%;"
        >
          <span>James Okafor</span>
          <hx-badge variant="success" hx-size="sm" pill>Stable</hx-badge>
        </span>
        <div style="font-size: 0.875rem;">
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem;">
            <strong>MRN:</strong> <span>00-11003</span> <strong>DOB:</strong>
            <span>1985-12-01 (Age 40)</span> <strong>Dept:</strong> <span>Med/Surg - 5 North</span>
          </div>
        </div>
        <span slot="footer">
          <small style="color: var(--hx-color-neutral-500, #6c757d);"
            >BP 124/76, HR 68, SpO2 98%</small
          >
        </span>
        <span slot="actions">
          <hx-button hx-size="sm">View Chart</hx-button>
          <hx-button hx-size="sm" variant="secondary">Orders</hx-button>
        </span>
      </hx-card>

      <!-- Discharge pending -->
      <hx-card elevation="raised" hx-href="https://ehr.example.com/patient/00-11004">
        <span
          slot="heading"
          style="display: flex; align-items: center; justify-content: space-between; width: 100%;"
        >
          <span>Emily Nakamura</span>
          <hx-badge variant="primary" hx-size="sm" pill>Discharge</hx-badge>
        </span>
        <div style="font-size: 0.875rem;">
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem;">
            <strong>MRN:</strong> <span>00-11004</span> <strong>DOB:</strong>
            <span>1990-06-18 (Age 35)</span> <strong>Dept:</strong> <span>OB/GYN - 2 South</span>
          </div>
        </div>
        <span slot="footer">
          <small style="color: var(--hx-color-neutral-500, #6c757d);"
            >BP 118/72, HR 74, SpO2 99%</small
          >
        </span>
        <span slot="actions">
          <hx-button hx-size="sm">View Chart</hx-button>
          <hx-button hx-size="sm" variant="secondary">Discharge</hx-button>
        </span>
      </hx-card>

      <!-- Stable patient 2 -->
      <hx-card elevation="raised" hx-href="https://ehr.example.com/patient/00-11005">
        <span
          slot="heading"
          style="display: flex; align-items: center; justify-content: space-between; width: 100%;"
        >
          <span>William Foster</span>
          <hx-badge variant="success" hx-size="sm" pill>Stable</hx-badge>
        </span>
        <div style="font-size: 0.875rem;">
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem;">
            <strong>MRN:</strong> <span>00-11005</span> <strong>DOB:</strong>
            <span>1944-09-07 (Age 81)</span> <strong>Dept:</strong>
            <span>Orthopedics - 6 West</span>
          </div>
        </div>
        <span slot="footer">
          <small style="color: var(--hx-color-neutral-500, #6c757d);"
            >BP 136/80, HR 76, SpO2 97%</small
          >
        </span>
        <span slot="actions">
          <hx-button hx-size="sm">View Chart</hx-button>
          <hx-button hx-size="sm" variant="secondary">Orders</hx-button>
        </span>
      </hx-card>

      <!-- New admission -->
      <hx-card elevation="raised" hx-href="https://ehr.example.com/patient/00-11006">
        <span
          slot="heading"
          style="display: flex; align-items: center; justify-content: space-between; width: 100%;"
        >
          <span>Priya Sharma</span>
          <hx-badge variant="neutral" hx-size="sm" pill>Admitted</hx-badge>
        </span>
        <div style="font-size: 0.875rem;">
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem;">
            <strong>MRN:</strong> <span>00-11006</span> <strong>DOB:</strong>
            <span>1975-04-22 (Age 50)</span> <strong>Dept:</strong> <span>Neurology - 7 East</span>
          </div>
        </div>
        <span slot="footer">
          <small style="color: var(--hx-color-neutral-500, #6c757d);"
            >BP 148/92, HR 80, SpO2 96%</small
          >
        </span>
        <span slot="actions">
          <hx-button hx-size="sm">View Chart</hx-button>
          <hx-button hx-size="sm" variant="secondary">Orders</hx-button>
        </span>
      </hx-card>
    </div>
  `,
};
