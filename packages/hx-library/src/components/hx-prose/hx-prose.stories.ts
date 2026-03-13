import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-prose.js';
import '../hx-card/hx-card.js';
import '../hx-container/hx-container.js';
import '../hx-alert/hx-alert.js';

const meta = {
  title: 'Components/Prose',
  component: 'hx-prose',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'base', 'lg'],
      description: 'Typography scale for the prose content.',
      table: {
        category: 'Properties',
        defaultValue: { summary: 'base' },
        type: { summary: "'sm' | 'base' | 'lg'" },
      },
    },
    'max-width': {
      control: 'text',
      description:
        'Maximum content width. When set, overrides the --hx-prose-max-width token. Accepts any valid CSS width value (e.g., "640px", "80ch", "100%").',
      table: {
        category: 'Properties',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    '--hx-prose-max-width': {
      control: 'text',
      description: 'Maximum content width.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: '720px' },
        type: { summary: 'CSS length' },
      },
    },
    '--hx-prose-font-size': {
      control: 'text',
      description: 'Base font size.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-font-size-base)' },
        type: { summary: 'CSS length' },
      },
    },
    '--hx-prose-line-height': {
      control: 'text',
      description: 'Base line height.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-line-height-relaxed)' },
        type: { summary: 'CSS number' },
      },
    },
    '--hx-prose-color': {
      control: 'color',
      description: 'Body text color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-text)' },
        type: { summary: 'CSS color' },
      },
    },
    '--hx-prose-heading-color': {
      control: 'color',
      description: 'Heading color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-text-strong)' },
        type: { summary: 'CSS color' },
      },
    },
    '--hx-prose-link-color': {
      control: 'color',
      description: 'Link color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-primary)' },
        type: { summary: 'CSS color' },
      },
    },
  },
  args: {
    size: 'base',
    'max-width': '',
  },
  render: (args) => html`
    <hx-prose size=${args.size} max-width=${args['max-width'] || ''}>
      <h2>Introduction to Patient Care Standards</h2>
      <p>
        Healthcare organizations rely on consistent, well-documented processes to ensure patient
        safety and quality of care. This document outlines the key principles and standards that
        guide clinical practice across our network.
      </p>
      <h3>Core Principles</h3>
      <p>
        Patient-centered care places the individual at the heart of every decision. By fostering
        open communication between providers and patients, we create a collaborative environment
        that promotes healing and trust.
      </p>
      <p>
        Evidence-based practice ensures that clinical decisions are informed by the latest research,
        clinical expertise, and patient preferences. This triad forms the foundation of modern
        healthcare delivery.
      </p>
    </hx-prose>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// Suppress unused variable warnings for required imports
void within;
void userEvent;
void fn;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();
    expect(prose?.getAttribute('size')).toBe('base');

    const headings = prose?.querySelectorAll('h2, h3');
    expect(headings?.length).toBe(2);

    const paragraphs = prose?.querySelectorAll('p');
    expect(paragraphs?.length).toBeGreaterThanOrEqual(2);
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY SIZE
// ─────────────────────────────────────────────────

export const SizeSmall: Story = {
  name: 'Size: Small (sm)',
  args: { size: 'sm' },
  render: (args) => html`
    <hx-prose size=${args.size}>
      <h2>Compact Clinical Notes</h2>
      <p>
        This text uses the small size variant, which reduces the base font size for denser
        information displays. Ideal for sidebar content, footnotes, or supplementary documentation
        that does not require full-size typography.
      </p>
      <ul>
        <li>Lab results within normal limits</li>
        <li>Medications reconciled per protocol</li>
        <li>Follow-up appointment scheduled for 14 days</li>
      </ul>
      <blockquote>
        <p>Patient expressed understanding of discharge instructions.</p>
      </blockquote>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();
    expect(prose?.getAttribute('size')).toBe('sm');
  },
};

export const SizeBase: Story = {
  name: 'Size: Base (default)',
  args: { size: 'base' },
  render: (args) => html`
    <hx-prose size=${args.size}>
      <h2>Standard Clinical Documentation</h2>
      <p>
        The base size is the default typographic scale for all prose content. It provides
        comfortable readability for clinicians reviewing patient records, care plans, and
        institutional policies during routine workflow.
      </p>
      <p>
        Line height and letter spacing are tuned for extended reading sessions, reducing eye strain
        across shift-length documentation review.
      </p>
      <ol>
        <li>Review patient history and current medications</li>
        <li>Document findings using structured SOAP format</li>
        <li>Submit for attending physician co-signature</li>
      </ol>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();
    expect(prose?.getAttribute('size')).toBe('base');
  },
};

export const SizeLarge: Story = {
  name: 'Size: Large (lg)',
  args: { size: 'lg' },
  render: (args) => html`
    <hx-prose size=${args.size}>
      <h2>Patient Education Materials</h2>
      <p>
        This text uses the large size variant for improved readability. Large typography is
        recommended for patient-facing materials, educational content, and any documents designed
        for audiences who may have visual impairments.
      </p>
      <p>
        Studies show that increasing font size and line height significantly improves reading
        comprehension for elderly patients and those with low health literacy. This variant applies
        those principles automatically.
      </p>
      <h3>Post-Procedure Instructions</h3>
      <ol>
        <li>Rest for the first 24 hours after the procedure</li>
        <li>Take prescribed medications as directed</li>
        <li>Contact your provider if you experience fever above 101&deg;F</li>
        <li>Schedule a follow-up visit within one week</li>
      </ol>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();
    expect(prose?.getAttribute('size')).toBe('lg');
  },
};

// ─────────────────────────────────────────────────
// 3. CONTENT TYPE DEMOS
// ─────────────────────────────────────────────────

export const Headings: Story = {
  render: () => html`
    <hx-prose>
      <h1>H1: Clinical Documentation Guide</h1>
      <p>
        First-level headings mark major document sections such as department protocols or policy
        chapters.
      </p>
      <h2>H2: Assessment Protocols</h2>
      <p>Second-level headings divide content into primary sections within a document.</p>
      <h3>H3: Vital Signs Monitoring</h3>
      <p>Third-level headings introduce specific topics within a section.</p>
      <h4>H4: Blood Pressure Measurement</h4>
      <p>Fourth-level headings provide granularity for procedures or sub-topics.</p>
      <h5>H5: Cuff Size Selection</h5>
      <p>Fifth-level headings are used sparingly for detailed procedural steps.</p>
      <h6>H6: Documentation Requirements</h6>
      <p>
        Sixth-level headings appear in deeply structured technical documents or regulatory
        references.
      </p>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();

    const h1 = prose?.querySelector('h1');
    const h2 = prose?.querySelector('h2');
    const h3 = prose?.querySelector('h3');
    const h4 = prose?.querySelector('h4');
    const h5 = prose?.querySelector('h5');
    const h6 = prose?.querySelector('h6');

    expect(h1).toBeTruthy();
    expect(h2).toBeTruthy();
    expect(h3).toBeTruthy();
    expect(h4).toBeTruthy();
    expect(h5).toBeTruthy();
    expect(h6).toBeTruthy();

    expect(h1?.textContent).toContain('H1');
    expect(h6?.textContent).toContain('H6');
  },
};

export const Lists: Story = {
  render: () => html`
    <hx-prose>
      <h2>Clinical Checklists</h2>

      <h3>Unordered List: Pre-Operative Checklist</h3>
      <ul>
        <li>Verify patient identity using two identifiers</li>
        <li>
          Confirm surgical site marking
          <ul>
            <li>Initials of operating surgeon visible</li>
            <li>Marking consistent with consent form</li>
            <li>
              Bilateral procedures marked appropriately
              <ul>
                <li>Left side marked with "L"</li>
                <li>Right side marked with "R"</li>
              </ul>
            </li>
          </ul>
        </li>
        <li>Review allergies and current medications</li>
        <li>Confirm NPO status</li>
      </ul>

      <h3>Ordered List: Medication Administration Protocol</h3>
      <ol>
        <li>Verify the correct patient using name and date of birth</li>
        <li>Confirm the correct medication and dosage</li>
        <li>Check the correct route of administration</li>
        <li>
          Verify the correct time
          <ol>
            <li>Compare with the medication administration record</li>
            <li>Confirm no conflicting scheduled doses</li>
          </ol>
        </li>
        <li>Document administration in the electronic health record</li>
      </ol>

      <h3>Definition List: Common Abbreviations</h3>
      <dl>
        <dt>NPO</dt>
        <dd>Nothing by mouth (nil per os). Patient should not eat or drink.</dd>
        <dt>PRN</dt>
        <dd>As needed (pro re nata). Medication administered based on patient symptoms.</dd>
        <dt>BID</dt>
        <dd>Twice daily (bis in die). Medication given every 12 hours.</dd>
      </dl>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();

    const unorderedLists = prose?.querySelectorAll('ul');
    expect(unorderedLists?.length).toBeGreaterThanOrEqual(1);

    const orderedLists = prose?.querySelectorAll('ol');
    expect(orderedLists?.length).toBeGreaterThanOrEqual(1);

    const defList = prose?.querySelector('dl');
    expect(defList).toBeTruthy();
  },
};

export const Tables: Story = {
  render: () => html`
    <hx-prose>
      <h2>Vital Signs Reference Ranges</h2>
      <table>
        <caption>
          Standard adult vital signs reference ranges for clinical assessment
        </caption>
        <thead>
          <tr>
            <th>Vital Sign</th>
            <th>Normal Range</th>
            <th>Unit</th>
            <th>Frequency</th>
            <th>Critical Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Blood Pressure (Systolic)</td>
            <td>90 - 120</td>
            <td>mmHg</td>
            <td>Every 4 hours</td>
            <td>&gt;180 or &lt;80</td>
          </tr>
          <tr>
            <td>Blood Pressure (Diastolic)</td>
            <td>60 - 80</td>
            <td>mmHg</td>
            <td>Every 4 hours</td>
            <td>&gt;120 or &lt;40</td>
          </tr>
          <tr>
            <td>Heart Rate</td>
            <td>60 - 100</td>
            <td>bpm</td>
            <td>Every 4 hours</td>
            <td>&gt;150 or &lt;40</td>
          </tr>
          <tr>
            <td>Temperature</td>
            <td>36.1 - 37.2</td>
            <td>&deg;C</td>
            <td>Every 8 hours</td>
            <td>&gt;40.0 or &lt;35.0</td>
          </tr>
          <tr>
            <td>Respiratory Rate</td>
            <td>12 - 20</td>
            <td>breaths/min</td>
            <td>Every 4 hours</td>
            <td>&gt;30 or &lt;8</td>
          </tr>
          <tr>
            <td>Oxygen Saturation</td>
            <td>95 - 100</td>
            <td>%</td>
            <td>Continuous</td>
            <td>&lt;90</td>
          </tr>
        </tbody>
      </table>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();

    const table = prose?.querySelector('table');
    expect(table).toBeTruthy();

    const thead = table?.querySelector('thead');
    expect(thead).toBeTruthy();

    const headerCells = thead?.querySelectorAll('th');
    expect(headerCells?.length).toBe(5);

    const bodyRows = table?.querySelectorAll('tbody tr');
    expect(bodyRows?.length).toBe(6);

    const caption = table?.querySelector('caption');
    expect(caption).toBeTruthy();
  },
};

export const CodeBlocks: Story = {
  render: () => html`
    <hx-prose>
      <h2>Technical Integration Reference</h2>
      <p>
        Use inline code for identifiers such as <code>ICD-10</code> diagnosis codes,
        <code>CPT</code> procedure codes, or <code>LOINC</code>
        laboratory observation identifiers.
      </p>

      <h3>HL7 FHIR Patient Resource</h3>
      <pre><code>// Example HL7 FHIR Patient Resource
{
  "resourceType": "Patient",
  "id": "example-001",
  "active": true,
  "name": [{
    "use": "official",
    "family": "Doe",
    "given": ["Jane", "Marie"]
  }],
  "gender": "female",
  "birthDate": "1985-03-15",
  "address": [{
    "use": "home",
    "line": ["123 Main Street"],
    "city": "Springfield",
    "state": "IL",
    "postalCode": "62704"
  }]
}</code></pre>

      <h3>Keyboard Shortcuts</h3>
      <p>
        Press <kbd>Ctrl</kbd> + <kbd>S</kbd> to save the current note. Use <kbd>Ctrl</kbd> +
        <kbd>Shift</kbd> + <kbd>P</kbd> to print the patient summary.
      </p>
    </hx-prose>
  `,
};

export const Blockquotes: Story = {
  render: () => html`
    <hx-prose>
      <h2>Guiding Principles of Care</h2>
      <blockquote>
        <p>
          "The good physician treats the disease; the great physician treats the patient who has the
          disease."
        </p>
        <cite>Sir William Osler</cite>
      </blockquote>
      <p>
        This principle underpins our approach to patient-centered care. Every clinical interaction
        should consider the whole person, not merely the presenting condition.
      </p>
      <blockquote>
        <p>"Wherever the art of medicine is loved, there is also a love of humanity."</p>
        <cite>Hippocrates</cite>
      </blockquote>
    </hx-prose>
  `,
};

export const Links: Story = {
  render: () => html`
    <hx-prose>
      <h2>Healthcare Resources</h2>
      <p>
        For clinical guidelines, consult the
        <a href="https://www.who.int">World Health Organization</a> or the
        <a href="https://www.cdc.gov">Centers for Disease Control and Prevention</a>. Medication
        references are available through <a href="https://www.drugs.com">Drugs.com</a> and the
        <a href="https://www.fda.gov">U.S. Food and Drug Administration</a>.
      </p>
      <p>
        Internal resources include the
        <a href="#formulary">Hospital Formulary</a>,
        <a href="#policies">Clinical Policies Database</a>, and the
        <a href="#education">Staff Education Portal</a>. All links open in the current window unless
        otherwise indicated.
      </p>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();

    const links = prose?.querySelectorAll('a');
    expect(links?.length).toBeGreaterThanOrEqual(4);

    links?.forEach((link) => {
      expect(link.hasAttribute('href')).toBe(true);
    });
  },
};

export const Images: Story = {
  render: () => html`
    <hx-prose>
      <h2>Clinical Workflow Diagrams</h2>
      <p>
        Visual aids support comprehension of complex clinical processes. The following diagrams
        illustrate standard patient care workflows used across our facility.
      </p>
      <figure>
        <img
          src="https://placehold.co/720x300/007878/ffffff?text=Patient+Admission+Workflow"
          alt="Flowchart showing the patient admission process from triage through bed assignment"
        />
        <figcaption>
          Figure 1: Patient admission workflow from emergency triage through inpatient bed
          assignment.
        </figcaption>
      </figure>
      <p>
        Each step in the workflow must be documented in the electronic health record within 30
        minutes of completion.
      </p>
      <figure>
        <img
          src="https://placehold.co/720x250/005252/ffffff?text=Discharge+Planning+Process"
          alt="Diagram of discharge planning process with multidisciplinary team coordination"
        />
        <figcaption>
          Figure 2: Discharge planning process with multidisciplinary team coordination steps.
        </figcaption>
      </figure>
    </hx-prose>
  `,
};

export const HorizontalRules: Story = {
  render: () => html`
    <hx-prose>
      <h2>Shift Report Summary</h2>
      <p>
        The following sections summarize key events from the current shift. Horizontal rules
        separate distinct reporting periods.
      </p>

      <h3>Morning Rounds (0700-1200)</h3>
      <p>
        All patients assessed. Two new admissions from the emergency department. No critical changes
        in condition for existing patients. Lab results reviewed and documented.
      </p>

      <hr />

      <h3>Afternoon Rounds (1200-1500)</h3>
      <p>
        One patient transferred to ICU due to respiratory decline. Attending physician notified and
        transfer orders completed. Family updated by bedside nurse.
      </p>

      <hr />

      <h3>Evening Handoff (1500-1900)</h3>
      <p>
        SBAR handoff completed for all patients. Outstanding lab results flagged for incoming shift.
        No pending critical interventions.
      </p>
    </hx-prose>
  `,
};

export const FullEditorOutput: Story = {
  render: () => html`
    <hx-prose>
      <h1>Clinical Documentation Guide</h1>
      <p>
        This comprehensive guide covers all aspects of clinical documentation, from initial patient
        intake through discharge summaries. Proper documentation is essential for continuity of
        care, legal compliance, and quality reporting.
      </p>

      <h2>Headings and Structure</h2>
      <p>
        Use headings to organize content into logical sections. Each section should address a single
        topic or concept.
      </p>

      <h3>Subsection Example</h3>
      <p>Subsections provide additional granularity within a major topic area.</p>

      <h4>Further Detail</h4>
      <p>Fourth-level headings are useful for specific procedures or protocols.</p>

      <hr />

      <h2>Lists</h2>
      <h3>Unordered Lists</h3>
      <ul>
        <li>Patient assessment and triage</li>
        <li>
          Vital signs monitoring
          <ul>
            <li>Blood pressure</li>
            <li>Heart rate</li>
            <li>Temperature</li>
          </ul>
        </li>
        <li>Medication administration and reconciliation</li>
        <li>Discharge planning and follow-up coordination</li>
      </ul>

      <h3>Ordered Lists</h3>
      <ol>
        <li>Verify patient identity using two identifiers</li>
        <li>Review current medication list</li>
        <li>Assess allergies and contraindications</li>
        <li>Document findings in the electronic health record</li>
      </ol>

      <h2>Tables</h2>
      <table>
        <caption>
          Vital Signs Reference Ranges
        </caption>
        <thead>
          <tr>
            <th>Vital Sign</th>
            <th>Normal Range</th>
            <th>Unit</th>
            <th>Frequency</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Blood Pressure</td>
            <td>90/60 - 120/80</td>
            <td>mmHg</td>
            <td>Every 4 hours</td>
          </tr>
          <tr>
            <td>Heart Rate</td>
            <td>60 - 100</td>
            <td>bpm</td>
            <td>Every 4 hours</td>
          </tr>
          <tr>
            <td>Temperature</td>
            <td>36.1 - 37.2</td>
            <td>&deg;C</td>
            <td>Every 8 hours</td>
          </tr>
          <tr>
            <td>Respiratory Rate</td>
            <td>12 - 20</td>
            <td>breaths/min</td>
            <td>Every 4 hours</td>
          </tr>
        </tbody>
      </table>

      <h2>Code Blocks</h2>
      <p>
        Use inline code for references like <code>ICD-10</code> codes or <code>CPT</code> procedure
        codes.
      </p>

      <pre><code>// Example HL7 FHIR Resource
{
  "resourceType": "Patient",
  "id": "example",
  "name": [{
    "family": "Doe",
    "given": ["Jane"]
  }]
}</code></pre>

      <h2>Blockquotes</h2>
      <blockquote>
        <p>"The art of medicine consists of amusing the patient while nature cures the disease."</p>
        <cite>Voltaire</cite>
      </blockquote>

      <h2>Links and Emphasis</h2>
      <p>
        For more information, visit the
        <a href="https://www.who.int">World Health Organization</a> website. Key terms should be
        <strong>bolded</strong> for emphasis, while secondary emphasis uses <em>italics</em>.
      </p>

      <h2>Images</h2>
      <figure>
        <img
          src="https://placehold.co/720x300/007878/ffffff?text=Clinical+Workflow+Diagram"
          alt="Clinical workflow diagram showing patient journey"
        />
        <figcaption>Figure 1: Patient journey from admission to discharge.</figcaption>
      </figure>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();

    const h1 = prose?.querySelector('h1');
    expect(h1).toBeTruthy();

    const table = prose?.querySelector('table');
    expect(table).toBeTruthy();

    const blockquote = prose?.querySelector('blockquote');
    expect(blockquote).toBeTruthy();

    const code = prose?.querySelector('pre code');
    expect(code).toBeTruthy();

    const link = prose?.querySelector('a');
    expect(link).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 4. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
      <div>
        <h3
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          Small (sm)
        </h3>
        <hx-prose
          size="sm"
          style="border: 1px solid #dee2e6; padding: 1rem; border-radius: 0.375rem;"
        >
          <h3>Patient Discharge Summary</h3>
          <p>
            Patient was admitted on 2026-02-10 with community-acquired pneumonia. Treatment included
            IV antibiotics and supplemental oxygen.
          </p>
          <ul>
            <li>Azithromycin 500mg daily x 3 days</li>
            <li>Ceftriaxone 1g IV q24h</li>
          </ul>
        </hx-prose>
      </div>

      <div>
        <h3
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          Base (default)
        </h3>
        <hx-prose
          size="base"
          style="border: 1px solid #dee2e6; padding: 1rem; border-radius: 0.375rem;"
        >
          <h3>Patient Discharge Summary</h3>
          <p>
            Patient was admitted on 2026-02-10 with community-acquired pneumonia. Treatment included
            IV antibiotics and supplemental oxygen.
          </p>
          <ul>
            <li>Azithromycin 500mg daily x 3 days</li>
            <li>Ceftriaxone 1g IV q24h</li>
          </ul>
        </hx-prose>
      </div>

      <div>
        <h3
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          Large (lg)
        </h3>
        <hx-prose
          size="lg"
          style="border: 1px solid #dee2e6; padding: 1rem; border-radius: 0.375rem;"
        >
          <h3>Patient Discharge Summary</h3>
          <p>
            Patient was admitted on 2026-02-10 with community-acquired pneumonia. Treatment included
            IV antibiotics and supplemental oxygen.
          </p>
          <ul>
            <li>Azithromycin 500mg daily x 3 days</li>
            <li>Ceftriaxone 1g IV q24h</li>
          </ul>
        </hx-prose>
      </div>
    </div>
  `,
};

export const AllContentTypes: Story = {
  render: () => html`
    <hx-prose>
      <h1>Comprehensive Content Type Reference</h1>
      <p>
        This story demonstrates every HTML element that <code>hx-prose</code>
        styles. Use this as a visual baseline for regression testing.
      </p>

      <h2>Headings</h2>
      <h1>Heading Level 1</h1>
      <h2>Heading Level 2</h2>
      <h3>Heading Level 3</h3>
      <h4>Heading Level 4</h4>
      <h5>Heading Level 5</h5>
      <h6>Heading Level 6</h6>

      <hr />

      <h2>Body Text and Inline Elements</h2>
      <p>
        Regular paragraph text with <strong>bold emphasis</strong> and <em>italic emphasis</em>.
        Inline <code>code references</code> appear with a subtle background. The
        <mark>highlighted text</mark> draws attention to key terms. <del>Deleted content</del> shows
        strikethrough formatting while <ins>inserted content</ins> is underlined.
      </p>
      <p>
        Abbreviations like <abbr title="Healthcare Information Technology">HIT</abbr> show dotted
        underlines. Chemical formulas use subscript as in H<sub>2</sub>O, while mathematical
        notation uses superscript as in E=mc<sup>2</sup>. The
        <small>small text element</small> renders at a reduced size.
      </p>

      <h2>Blockquote</h2>
      <blockquote>
        <p>
          "First, do no harm. This fundamental principle guides every clinical decision we make and
          every protocol we establish."
        </p>
        <cite>Primum Non Nocere</cite>
      </blockquote>

      <h2>Lists</h2>
      <h3>Unordered List</h3>
      <ul>
        <li>Hand hygiene compliance monitoring</li>
        <li>Personal protective equipment protocols</li>
        <li>Environmental cleaning schedules</li>
      </ul>

      <h3>Ordered List</h3>
      <ol>
        <li>Identify the patient</li>
        <li>Verify the procedure</li>
        <li>Confirm the surgical site</li>
      </ol>

      <h3>Definition List</h3>
      <dl>
        <dt>EHR</dt>
        <dd>Electronic Health Record</dd>
        <dt>HIPAA</dt>
        <dd>Health Insurance Portability and Accountability Act</dd>
      </dl>

      <h2>Table</h2>
      <table>
        <caption>
          Laboratory results from most recent panel
        </caption>
        <thead>
          <tr>
            <th scope="col">Test</th>
            <th scope="col">Result</th>
            <th scope="col">Reference</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Hemoglobin</th>
            <td>14.2 g/dL</td>
            <td>12.0 - 16.0</td>
            <td>Normal</td>
          </tr>
          <tr>
            <th scope="row">WBC</th>
            <td>8.5 K/uL</td>
            <td>4.5 - 11.0</td>
            <td>Normal</td>
          </tr>
          <tr>
            <th scope="row">Glucose</th>
            <td>142 mg/dL</td>
            <td>70 - 100</td>
            <td>High</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colspan="3">3 results — 1 abnormal</th>
            <td>Review required</td>
          </tr>
        </tfoot>
      </table>

      <h2>Code Block</h2>
      <pre><code>{
  "resourceType": "Observation",
  "status": "final",
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "8867-4",
      "display": "Heart rate"
    }]
  },
  "valueQuantity": {
    "value": 72,
    "unit": "beats/min"
  }
}</code></pre>

      <h2>Keyboard and Technical Text</h2>
      <p>
        Press <kbd>Ctrl</kbd> + <kbd>P</kbd> to print. Use <kbd>Alt</kbd> + <kbd>F4</kbd> to close
        the current window. Terminal output like <samp>Connection established. Waiting for
        data...</samp> uses the <code>samp</code> element. Mathematical variables such as
        <var>x</var> + <var>y</var> = <var>z</var> use the <code>var</code> element.
      </p>

      <h2>Links</h2>
      <p>
        Visit the <a href="https://www.hl7.org/fhir/">HL7 FHIR Specification</a>
        for interoperability standards.
      </p>

      <h2>Image with Caption</h2>
      <figure>
        <img
          src="https://placehold.co/720x250/007878/ffffff?text=Clinical+Dashboard"
          alt="Screenshot of the clinical monitoring dashboard"
        />
        <figcaption>Figure 1: Real-time clinical monitoring dashboard for ICU patients.</figcaption>
      </figure>

      <hr />

      <p>
        End of content type reference. All elements above should display consistent typography,
        spacing, and color treatment.
      </p>
    </hx-prose>
  `,
};

// ─────────────────────────────────────────────────
// 5. COMPOSITION
// ─────────────────────────────────────────────────

export const InsideCard: Story = {
  render: () => html`
    <hx-card elevation="raised" style="max-width: 600px;">
      <span slot="heading">Clinical Summary</span>
      <hx-prose>
        <p>
          The patient presented with acute onset of symptoms consistent with community-acquired
          pneumonia. Chest X-ray confirmed bilateral infiltrates. Empiric antibiotic therapy was
          initiated per institutional guidelines.
        </p>
        <h3>Treatment Plan</h3>
        <ul>
          <li>Azithromycin 500mg IV daily for 3 days</li>
          <li>Ceftriaxone 1g IV every 24 hours</li>
          <li>Supplemental oxygen via nasal cannula at 2L/min</li>
        </ul>
        <table>
          <thead>
            <tr>
              <th>Lab Test</th>
              <th>Result</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>WBC</td>
              <td>14.2 K/uL</td>
              <td>4.5 - 11.0</td>
            </tr>
            <tr>
              <td>CRP</td>
              <td>85 mg/L</td>
              <td>&lt; 10 mg/L</td>
            </tr>
          </tbody>
        </table>
        <blockquote>
          <p>
            Patient is clinically improving. Plan to transition to oral antibiotics within 48 hours
            if afebrile.
          </p>
        </blockquote>
      </hx-prose>
    </hx-card>
  `,
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('hx-card');
    expect(card).toBeTruthy();

    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();

    const table = prose?.querySelector('table');
    expect(table).toBeTruthy();
  },
};

export const InsideContainer: Story = {
  render: () => html`
    <hx-container width="narrow" padding="lg" style="--hx-container-bg: #fafafa;">
      <hx-prose>
        <h1>Institutional Policy: Infection Control</h1>
        <p>
          This policy establishes standard precautions for infection prevention and control across
          all clinical departments. Compliance is mandatory for all staff, contractors, and
          volunteers.
        </p>
        <h2>Scope</h2>
        <p>
          This policy applies to all inpatient units, outpatient clinics, surgical suites, and
          diagnostic facilities operated by or affiliated with our healthcare system.
        </p>
        <h2>Key Requirements</h2>
        <ol>
          <li>
            Hand hygiene must be performed before and after every patient contact, per WHO five
            moments guidelines
          </li>
          <li>
            Personal protective equipment must be worn as indicated by the type of precautions in
            effect
          </li>
          <li>
            Environmental surfaces must be cleaned and disinfected per the department-specific
            schedule
          </li>
        </ol>
        <blockquote>
          <p>
            Compliance with infection control policies is not optional. It is a condition of
            employment and a fundamental obligation to patient safety.
          </p>
          <cite>Chief Medical Officer</cite>
        </blockquote>
      </hx-prose>
    </hx-container>
  `,
};

export const DrupalCKEditor: Story = {
  render: () => html`
    <hx-prose>
      <div class="field">
        <div class="field__label">Article Body</div>
        <div class="field__item">
          <div class="text-formatted">
            <h2>Patient Safety Bulletin</h2>
            <p>
              The following safety guidelines have been updated for Q1 2026. All clinical staff must
              review and acknowledge these changes before their next shift.
            </p>

            <div class="media-embed align-left">
              <img
                src="https://placehold.co/300x200/007878/ffffff?text=Safety+Poster"
                alt="Hand hygiene reminder poster"
              />
            </div>

            <p>
              Hand hygiene remains the single most effective measure for preventing
              healthcare-associated infections. The updated protocol includes new guidance on
              alcohol-based hand rub usage and proper glove removal technique.
            </p>

            <div class="align-center">
              <img
                src="https://placehold.co/600x200/007878/ffffff?text=Compliance+Chart"
                alt="Monthly hand hygiene compliance rates"
              />
            </div>

            <h3>Key Changes</h3>
            <ul>
              <li>Extended hand washing duration from 20 to 30 seconds</li>
              <li>New signage placement at all patient room entries</li>
              <li>Updated PPE donning and doffing procedures</li>
            </ul>

            <div class="messages messages--warning">
              <strong>Important:</strong> These guidelines take effect immediately. Non-compliance
              may result in additional training requirements.
            </div>

            <div class="messages messages--status">
              <strong>Update:</strong> The compliance dashboard is now available in the staff portal
              for real-time monitoring.
            </div>

            <div class="caption">
              <figure>
                <img
                  src="https://placehold.co/600x200/005252/ffffff?text=PPE+Donning+Sequence"
                  alt="Step-by-step PPE donning and doffing procedure"
                />
                <figcaption>
                  Figure: Correct PPE donning sequence per CDC recommendations.
                </figcaption>
              </figure>
            </div>

            <div class="clearfix"></div>
          </div>
        </div>
      </div>
    </hx-prose>
  `,
};

export const WithAlerts: Story = {
  render: () => html`
    <hx-prose>
      <h2>Medication Administration Policy</h2>
      <p>
        All medications must be administered following the Five Rights of Medication Administration.
        This policy applies to all licensed clinical staff with prescribing or administration
        privileges.
      </p>

      <hx-alert variant="warning">
        High-alert medications require independent double verification by two licensed practitioners
        before administration.
      </hx-alert>

      <h3>Pre-Administration Checks</h3>
      <ol>
        <li>Right patient: Verify using two patient identifiers</li>
        <li>Right medication: Compare label to order</li>
        <li>Right dose: Calculate and confirm dosage</li>
        <li>Right route: Verify administration route matches order</li>
        <li>Right time: Confirm within approved administration window</li>
      </ol>

      <hx-alert variant="error">
        Never administer a medication if any of the Five Rights cannot be confirmed. Contact the
        prescribing provider immediately for clarification.
      </hx-alert>

      <h3>Post-Administration Documentation</h3>
      <p>
        Document the medication, dose, route, time, and patient response in the electronic health
        record within 30 minutes of administration. Include any adverse reactions observed.
      </p>

      <hx-alert variant="info">
        The pharmacy team is available 24/7 for medication verification and drug interaction
        queries. Dial extension 4500 from any clinical phone.
      </hx-alert>

      <hx-alert variant="success">
        Our unit achieved 99.8% medication scanning compliance last quarter. Thank you for your
        commitment to patient safety.
      </hx-alert>
    </hx-prose>
  `,
};

// ─────────────────────────────────────────────────
// 6. EDGE CASES
// ─────────────────────────────────────────────────

export const VeryLongContent: Story = {
  render: () => html`
    <hx-prose>
      <h1>Comprehensive Guide to Hospital Infection Prevention and Control</h1>

      <p>
        Healthcare-associated infections (HAIs) represent one of the most significant challenges
        facing modern healthcare systems worldwide. These infections affect hundreds of millions of
        patients globally each year, leading to prolonged hospital stays, increased antimicrobial
        resistance, substantial financial burden on healthcare systems, and preventable patient
        morbidity and mortality. The prevention and control of HAIs is therefore a critical priority
        for every healthcare organization, requiring a systematic, evidence-based approach that
        engages all levels of the organization.
      </p>

      <h2>Chapter 1: Understanding Healthcare-Associated Infections</h2>

      <p>
        Healthcare-associated infections are infections that patients acquire during the course of
        receiving healthcare treatment for other conditions. These infections can occur in any
        healthcare setting, including hospitals, ambulatory surgical centers, end-stage renal
        disease facilities, and long-term care facilities. The most common types of HAIs include
        central line-associated bloodstream infections (CLABSIs), catheter-associated urinary tract
        infections (CAUTIs), surgical site infections (SSIs), and ventilator-associated pneumonia
        (VAP).
      </p>

      <p>
        The epidemiology of HAIs varies significantly by geographic region, facility type, and
        patient population. In the United States, the Centers for Disease Control and Prevention
        estimates that approximately one in every 31 hospital patients has at least one
        healthcare-associated infection on any given day. In developing countries, the prevalence
        may be two to twenty times higher, reflecting differences in infrastructure, resources, and
        infection control practices.
      </p>

      <h3>Risk Factors for Healthcare-Associated Infections</h3>

      <p>
        Patient-related risk factors include advanced age, immunosuppression, diabetes mellitus,
        malnutrition, obesity, and the presence of chronic diseases. Procedure-related risk factors
        include the duration of surgical procedures, the use of invasive devices such as central
        venous catheters and urinary catheters, and the duration of mechanical ventilation.
        Environmental risk factors include inadequate hand hygiene practices, contaminated surfaces
        and equipment, and overcrowding in clinical areas.
      </p>

      <h2>Chapter 2: Hand Hygiene</h2>

      <p>
        Hand hygiene is universally recognized as the single most important measure to prevent the
        transmission of healthcare-associated pathogens. Despite decades of evidence supporting its
        effectiveness, compliance rates remain suboptimal in many healthcare settings. The World
        Health Organization has identified five moments for hand hygiene that form the basis of
        modern hand hygiene programs: before patient contact, before aseptic procedures, after body
        fluid exposure risk, after patient contact, and after contact with patient surroundings.
      </p>

      <p>
        Alcohol-based hand rubs (ABHRs) are the preferred method of hand hygiene in most clinical
        situations because they are more effective against most pathogens, require less time to use,
        are less irritating to skin, and are more accessible at the point of care. However, hand
        washing with soap and water is required when hands are visibly soiled, after caring for
        patients with known or suspected Clostridioides difficile infection, and after caring for
        patients with known or suspected norovirus infection.
      </p>

      <h3>Implementing an Effective Hand Hygiene Program</h3>

      <p>
        Successful hand hygiene programs incorporate multiple strategies including system change,
        training and education, evaluation and feedback, reminders in the workplace, and
        institutional safety climate. System changes include ensuring adequate availability of ABHRs
        at the point of care, providing access to sinks with running water and soap, and selecting
        hand hygiene products that are well-tolerated by healthcare workers.
      </p>

      <p>
        Monitoring and feedback are essential components of any hand hygiene improvement program.
        Direct observation by trained observers remains the gold standard for measuring hand hygiene
        compliance, although electronic monitoring systems are increasingly being used to supplement
        direct observation. Compliance data should be regularly reported to healthcare workers and
        leadership to drive improvement.
      </p>

      <h2>Chapter 3: Environmental Cleaning and Disinfection</h2>

      <p>
        The healthcare environment plays a significant role in the transmission of pathogens.
        Contaminated environmental surfaces serve as reservoirs for microorganisms that can be
        transferred to patients through direct contact or via the hands of healthcare workers.
        Effective environmental cleaning and disinfection are therefore essential components of a
        comprehensive infection prevention program.
      </p>

      <p>
        High-touch surfaces in patient rooms, such as bed rails, over-bed tables, call buttons,
        bathroom fixtures, and doorknobs, require frequent cleaning and disinfection. The choice of
        disinfectant depends on the target pathogen, the type of surface, and the required contact
        time. EPA-registered hospital-grade disinfectants are recommended for routine environmental
        cleaning in healthcare settings.
      </p>

      <h3>Terminal Cleaning Procedures</h3>

      <p>
        Terminal cleaning is performed after a patient is discharged or transferred and includes
        thorough cleaning and disinfection of all surfaces in the room. For patients who were on
        contact precautions for multidrug-resistant organisms or Clostridioides difficile, enhanced
        terminal cleaning with bleach-based products or ultraviolet light disinfection may be
        indicated. The effectiveness of terminal cleaning should be monitored using fluorescent
        markers, ATP bioluminescence, or microbiological sampling.
      </p>

      <h2>Chapter 4: Device-Associated Infection Prevention</h2>

      <p>
        Invasive devices such as central venous catheters, urinary catheters, and mechanical
        ventilators significantly increase the risk of healthcare-associated infections. Prevention
        strategies focus on reducing unnecessary device use, ensuring proper insertion technique,
        maintaining devices according to evidence-based protocols, and removing devices as soon as
        they are no longer clinically indicated.
      </p>

      <h3>Central Line-Associated Bloodstream Infection Prevention</h3>

      <p>
        The prevention of CLABSIs requires adherence to evidence-based insertion and maintenance
        bundles. The insertion bundle includes hand hygiene, maximal sterile barrier precautions,
        chlorhexidine skin preparation, optimal catheter site selection (avoiding the femoral vein
        when possible), and daily review of line necessity with prompt removal of unnecessary
        catheters. The maintenance bundle includes daily assessment of catheter necessity, proper
        hand hygiene before accessing the line, scrubbing the hub with an appropriate antiseptic
        agent, and using aseptic technique when changing dressings and tubing.
      </p>

      <h3>Catheter-Associated Urinary Tract Infection Prevention</h3>

      <p>
        CAUTIs are the most common type of healthcare-associated infection and are largely
        preventable through appropriate catheter use and maintenance. Prevention strategies include
        using catheters only for appropriate indications, inserting catheters using aseptic
        technique, maintaining a closed drainage system, ensuring the drainage bag is positioned
        below the level of the bladder, and removing catheters as soon as they are no longer needed.
        Nurse-driven catheter removal protocols and electronic reminder systems have been shown to
        significantly reduce CAUTI rates.
      </p>

      <h2>Chapter 5: Antimicrobial Stewardship</h2>

      <p>
        Antimicrobial resistance is a growing global health threat that is closely linked to
        antimicrobial use in healthcare settings. Antimicrobial stewardship programs aim to optimize
        antimicrobial prescribing to improve patient outcomes, reduce adverse events, decrease
        antimicrobial resistance, and lower healthcare costs. Core elements of an effective
        stewardship program include leadership commitment, accountability, pharmacy expertise,
        prospective audit and feedback, education, and tracking and reporting of antibiotic use and
        resistance patterns.
      </p>

      <p>
        Evidence-based stewardship interventions include prospective audit and feedback by
        infectious disease specialists or clinical pharmacists, preauthorization requirements for
        restricted antimicrobials, facility-specific treatment guidelines based on local resistance
        patterns, automatic stop orders and de-escalation protocols, and regular review of
        antibiotic duration to ensure appropriate course length. These interventions should be
        supported by robust antimicrobial susceptibility data and regularly updated to reflect
        changes in local resistance patterns.
      </p>

      <h2>Conclusion</h2>

      <p>
        The prevention of healthcare-associated infections requires a multifaceted approach that
        addresses hand hygiene, environmental cleaning, device management, antimicrobial
        stewardship, and organizational culture. Success depends on sustained leadership commitment,
        engagement of frontline healthcare workers, robust surveillance and reporting systems, and a
        culture of safety that empowers every member of the healthcare team to take ownership of
        infection prevention. Through consistent application of evidence-based practices and
        continuous quality improvement, healthcare organizations can significantly reduce the burden
        of HAIs and improve outcomes for the patients they serve.
      </p>
    </hx-prose>
  `,
};

export const EmptyProse: Story = {
  render: () => html`<hx-prose></hx-prose>`,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();
    expect(prose?.children.length).toBe(0);
  },
};

export const MaxWidth: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          Default max-width (720px via token)
        </p>
        <hx-prose style="border: 1px dashed #dee2e6; padding: 1rem;">
          <p>
            This prose container uses the default max-width of 720px as defined by the
            <code>--hx-prose-max-width</code> token. Content is constrained to an optimal reading
            width for clinical documentation.
          </p>
        </hx-prose>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          max-width="480px"
        </p>
        <hx-prose max-width="480px" style="border: 1px dashed #dee2e6; padding: 1rem;">
          <p>
            This prose container is constrained to 480px. Narrow widths are useful for sidebar
            content, modals, or compact layouts where screen real estate is limited.
          </p>
        </hx-prose>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          max-width="100%"
        </p>
        <hx-prose max-width="100%" style="border: 1px dashed #dee2e6; padding: 1rem;">
          <p>
            This prose container is set to 100% width, allowing it to fill the available space.
            Useful for full-bleed content sections or when the parent container already handles
            width constraints.
          </p>
        </hx-prose>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          max-width="60ch"
        </p>
        <hx-prose max-width="60ch" style="border: 1px dashed #dee2e6; padding: 1rem;">
          <p>
            Using a character-based width of 60ch ensures approximately 60 characters per line,
            which is within the optimal range for reading comfort as recommended by typographic best
            practices.
          </p>
        </hx-prose>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const proseElements = canvasElement.querySelectorAll('hx-prose');
    expect(proseElements.length).toBe(4);

    const narrowProse = canvasElement.querySelector('hx-prose[max-width="480px"]');
    expect(narrowProse).toBeTruthy();
    expect(narrowProse?.style.maxWidth).toBe('480px');

    const fullProse = canvasElement.querySelector('hx-prose[max-width="100%"]');
    expect(fullProse).toBeTruthy();
    expect(fullProse?.style.maxWidth).toBe('100%');
  },
};

export const DeepNesting: Story = {
  render: () => html`
    <hx-prose>
      <h2>Organizational Structure: Infection Control Committee</h2>
      <ul>
        <li>
          Hospital Infection Control Committee
          <ul>
            <li>
              Subcommittee: Environmental Services
              <ul>
                <li>
                  Work Group: Terminal Cleaning Standards
                  <ul>
                    <li>Task Force: UV Disinfection Protocols</li>
                    <li>Task Force: Chemical Disinfection Validation</li>
                  </ul>
                </li>
                <li>Work Group: Waste Management</li>
              </ul>
            </li>
            <li>
              Subcommittee: Antimicrobial Stewardship
              <ul>
                <li>Work Group: Empiric Therapy Guidelines</li>
                <li>
                  Work Group: Resistance Monitoring
                  <ul>
                    <li>Task Force: MDRO Surveillance</li>
                    <li>Task Force: Antibiogram Development</li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>

      <h3>Deeply Nested Blockquotes</h3>
      <blockquote>
        <p>Level 1: Initial patient complaint documented by triage nurse.</p>
        <blockquote>
          <p>Level 2: Attending physician assessment and preliminary diagnosis.</p>
          <blockquote>
            <p>Level 3: Specialist consultation notes and recommended diagnostic workup.</p>
          </blockquote>
        </blockquote>
      </blockquote>

      <h3>Nested Ordered Lists</h3>
      <ol>
        <li>
          Phase 1: Pre-Implementation
          <ol>
            <li>
              Stakeholder Analysis
              <ol>
                <li>Identify key decision makers</li>
                <li>Map approval workflows</li>
                <li>
                  Document resource requirements
                  <ol>
                    <li>Personnel allocations</li>
                    <li>Budget line items</li>
                    <li>Technology infrastructure</li>
                  </ol>
                </li>
              </ol>
            </li>
            <li>Risk Assessment</li>
          </ol>
        </li>
        <li>Phase 2: Implementation</li>
        <li>Phase 3: Post-Implementation Review</li>
      </ol>
    </hx-prose>
  `,
};

export const WideTable: Story = {
  render: () => html`
    <hx-prose style="max-width: 600px;">
      <h2>Comprehensive Laboratory Panel Results</h2>
      <p>
        The table below demonstrates overflow behavior when content exceeds the container width. On
        narrow viewports, tables scroll horizontally.
      </p>
      <table>
        <caption>
          Complete metabolic panel with trending data across admission
        </caption>
        <thead>
          <tr>
            <th>Test</th>
            <th>Admission</th>
            <th>Day 1</th>
            <th>Day 2</th>
            <th>Day 3</th>
            <th>Day 5</th>
            <th>Day 7</th>
            <th>Discharge</th>
            <th>Reference Range</th>
            <th>Unit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sodium</td>
            <td>131</td>
            <td>133</td>
            <td>135</td>
            <td>137</td>
            <td>138</td>
            <td>139</td>
            <td>140</td>
            <td>136-145</td>
            <td>mEq/L</td>
            <td>Normalized</td>
          </tr>
          <tr>
            <td>Potassium</td>
            <td>5.8</td>
            <td>5.2</td>
            <td>4.8</td>
            <td>4.5</td>
            <td>4.3</td>
            <td>4.1</td>
            <td>4.0</td>
            <td>3.5-5.0</td>
            <td>mEq/L</td>
            <td>Normalized</td>
          </tr>
          <tr>
            <td>Creatinine</td>
            <td>2.4</td>
            <td>2.1</td>
            <td>1.8</td>
            <td>1.5</td>
            <td>1.3</td>
            <td>1.2</td>
            <td>1.1</td>
            <td>0.7-1.3</td>
            <td>mg/dL</td>
            <td>Improving</td>
          </tr>
          <tr>
            <td>BUN</td>
            <td>45</td>
            <td>38</td>
            <td>32</td>
            <td>28</td>
            <td>24</td>
            <td>20</td>
            <td>18</td>
            <td>7-20</td>
            <td>mg/dL</td>
            <td>Improving</td>
          </tr>
          <tr>
            <td>Glucose</td>
            <td>245</td>
            <td>198</td>
            <td>165</td>
            <td>142</td>
            <td>118</td>
            <td>105</td>
            <td>98</td>
            <td>70-100</td>
            <td>mg/dL</td>
            <td>Normalized</td>
          </tr>
        </tbody>
      </table>
    </hx-prose>
  `,
};

// ─────────────────────────────────────────────────
// 7. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          Default tokens
        </p>
        <hx-prose style="border: 1px solid #dee2e6; padding: 1.5rem; border-radius: 0.375rem;">
          <h3>Default Prose Styling</h3>
          <p>
            This block uses default token values. All custom properties inherit from the design
            system tokens defined in the theme.
          </p>
          <a href="#demo">Sample link with default color</a>
        </hx-prose>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          --hx-prose-max-width: 480px
        </p>
        <hx-prose
          style="
            --hx-prose-max-width: 480px;
            border: 1px solid #dee2e6;
            padding: 1.5rem;
            border-radius: 0.375rem;
          "
        >
          <h3>Narrowed Max Width</h3>
          <p>
            Content constrained to 480px. Useful for sidebar prose or compact reading areas within
            clinical dashboards.
          </p>
        </hx-prose>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          --hx-prose-font-size: 1.25rem / --hx-prose-line-height: 2
        </p>
        <hx-prose
          style="
            --hx-prose-font-size: 1.25rem;
            --hx-prose-line-height: 2;
            border: 1px solid #dee2e6;
            padding: 1.5rem;
            border-radius: 0.375rem;
          "
        >
          <h3>Custom Font Size and Line Height</h3>
          <p>
            Larger font and generous line height for enhanced readability. Recommended for
            patient-facing materials designed for elderly or visually impaired readers.
          </p>
        </hx-prose>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;"
        >
          --hx-prose-color / --hx-prose-heading-color / --hx-prose-link-color
        </p>
        <hx-prose
          style="
            --hx-prose-color: #1a4731;
            --hx-prose-heading-color: #0d2818;
            --hx-prose-link-color: #2d6a4f;
            border: 1px solid #b7e4c7;
            padding: 1.5rem;
            border-radius: 0.375rem;
            background-color: #f0fdf4;
          "
        >
          <h3>Custom Color Scheme</h3>
          <p>
            Body text, headings, and links all use overridden color tokens. This demonstrates
            theming prose for a branded section or department-specific documentation.
          </p>
          <p>Visit <a href="#demo">internal resource links</a> to verify the custom link color.</p>
        </hx-prose>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts (Light DOM)',
  render: () => html`
    <hx-prose>
      <h2>Light DOM Component</h2>
      <p>
        The <code>hx-prose</code> component renders in the Light DOM and does not use Shadow DOM
        encapsulation. This means there are no CSS <code>::part()</code> selectors available.
        Instead, all child elements are directly styleable using standard CSS selectors scoped to
        the <code>hx-prose</code> tag name.
      </p>

      <h3>Styling Approach</h3>
      <p>
        The component uses an <code>AdoptedStylesheetsController</code> to inject scoped styles into
        the document. All selectors are prefixed with the <code>hx-prose</code> tag name to prevent
        style leakage. For example:
      </p>

      <pre><code>/* These styles are auto-injected and scoped */
hx-prose h1 { /* heading styles */ }
hx-prose p  { /* paragraph styles */ }
hx-prose a  { /* link styles */ }

/* Override via CSS custom properties */
hx-prose {
  --hx-prose-color: #333;
  --hx-prose-heading-color: #111;
  --hx-prose-link-color: #0066cc;
}</code></pre>

      <p>
        Since all content lives in the Light DOM, consumers can also target child elements directly
        when needed:
      </p>

      <pre><code>/* Direct child targeting (Light DOM) */
hx-prose table { border: 2px solid red; }
hx-prose blockquote { background: #f0f0f0; }</code></pre>
    </hx-prose>
  `,
};

// ─────────────────────────────────────────────────
// 9. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const InteractionTestHeadings: Story = {
  name: 'Interaction: Verify Heading Levels',
  render: () => html`
    <hx-prose>
      <h1>Level 1: Department Overview</h1>
      <h2>Level 2: Service Lines</h2>
      <h3>Level 3: Cardiology</h3>
      <h4>Level 4: Interventional Procedures</h4>
      <h5>Level 5: Catheter Laboratory</h5>
      <h6>Level 6: Equipment Specifications</h6>
      <p>All six heading levels are present and should be visually distinct.</p>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();

    const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
    for (const tag of headingTags) {
      const heading = prose?.querySelector(tag);
      expect(heading).toBeTruthy();
      expect(heading?.textContent?.length).toBeGreaterThan(0);
    }

    const h1 = prose?.querySelector('h1');
    const h6 = prose?.querySelector('h6');
    const h1Style = window.getComputedStyle(h1 as Element);
    const h6Style = window.getComputedStyle(h6 as Element);
    const h1Size = parseFloat(h1Style.fontSize);
    const h6Size = parseFloat(h6Style.fontSize);
    expect(h1Size).toBeGreaterThan(h6Size);
  },
};

export const InteractionTestLinks: Story = {
  name: 'Interaction: Verify Link Accessibility',
  render: () => html`
    <hx-prose>
      <h2>Accessible Links</h2>
      <p>
        Contact the <a href="https://www.who.int">World Health Organization</a>
        for international health guidelines. Review the
        <a href="https://www.cdc.gov">CDC recommendations</a> for infection control. Consult the
        <a href="https://www.nih.gov">National Institutes of Health</a> for clinical research
        updates.
      </p>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();

    const links = prose?.querySelectorAll('a');
    expect(links?.length).toBe(3);

    links?.forEach((link) => {
      expect(link.hasAttribute('href')).toBe(true);
      expect(link.href).toBeTruthy();
      expect(link.textContent?.trim().length).toBeGreaterThan(0);

      const style = window.getComputedStyle(link);
      expect(style.textDecoration).toContain('underline');
    });
  },
};

export const InteractionTestTable: Story = {
  name: 'Interaction: Verify Table Structure',
  render: () => html`
    <hx-prose>
      <h2>Medication Schedule</h2>
      <table>
        <caption>
          Current inpatient medication schedule
        </caption>
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dose</th>
            <th>Route</th>
            <th>Frequency</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Metoprolol</td>
            <td>25mg</td>
            <td>Oral</td>
            <td>BID</td>
          </tr>
          <tr>
            <td>Lisinopril</td>
            <td>10mg</td>
            <td>Oral</td>
            <td>Daily</td>
          </tr>
          <tr>
            <td>Aspirin</td>
            <td>81mg</td>
            <td>Oral</td>
            <td>Daily</td>
          </tr>
        </tbody>
      </table>
    </hx-prose>
  `,
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector('hx-prose');
    expect(prose).toBeTruthy();

    const table = prose?.querySelector('table');
    expect(table).toBeTruthy();

    const caption = table?.querySelector('caption');
    expect(caption).toBeTruthy();
    expect(caption?.textContent?.trim().length).toBeGreaterThan(0);

    const thead = table?.querySelector('thead');
    expect(thead).toBeTruthy();

    const headerCells = thead?.querySelectorAll('th');
    expect(headerCells?.length).toBe(4);

    const tbody = table?.querySelector('tbody');
    expect(tbody).toBeTruthy();

    const rows = tbody?.querySelectorAll('tr');
    expect(rows?.length).toBe(3);

    rows?.forEach((row) => {
      const cells = row.querySelectorAll('td');
      expect(cells.length).toBe(4);
    });
  },
};

// ─────────────────────────────────────────────────
// 10. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const ClinicalDocumentation: Story = {
  render: () => html`
    <hx-prose>
      <h1>Clinical Progress Note</h1>

      <h2>Patient: Jane Doe (MRN: 1234567)</h2>
      <p>
        <strong>Date:</strong> February 16, 2026<br />
        <strong>Provider:</strong> Dr. Sarah Chen, MD, Internal Medicine<br />
        <strong>Location:</strong> Medical-Surgical Unit, Room 412B
      </p>

      <h3>Subjective</h3>
      <p>
        Patient reports improvement in shortness of breath since initiation of diuretic therapy.
        Denies chest pain, palpitations, or orthopnea. Reports mild fatigue but improved exercise
        tolerance. Able to ambulate to the bathroom without supplemental oxygen for the first time
        since admission.
      </p>

      <h3>Objective</h3>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Temperature</td>
            <td>36.8&deg;C</td>
            <td>Stable</td>
          </tr>
          <tr>
            <td>Blood Pressure</td>
            <td>128/78 mmHg</td>
            <td>Improved</td>
          </tr>
          <tr>
            <td>Heart Rate</td>
            <td>76 bpm</td>
            <td>Improved</td>
          </tr>
          <tr>
            <td>Respiratory Rate</td>
            <td>16 breaths/min</td>
            <td>Improved</td>
          </tr>
          <tr>
            <td>SpO2</td>
            <td>96% on room air</td>
            <td>Improved</td>
          </tr>
          <tr>
            <td>Weight</td>
            <td>82.3 kg (-2.1 kg from admission)</td>
            <td>Responding to diuresis</td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>Physical Exam:</strong> Alert and oriented x3. Lungs: bibasilar crackles improved
        from admission, no wheezes. Heart: regular rate and rhythm, no murmurs, gallops, or rubs.
        Extremities: 1+ bilateral lower extremity edema, improved from 3+ on admission. JVP
        estimated at 8 cm.
      </p>

      <h3>Assessment</h3>
      <ol>
        <li>
          <strong>Acute decompensated heart failure (HFrEF)</strong> -- Responding well to IV
          diuresis. BNP trending down from 1,840 to 620 pg/mL. Target euvolemia expected within
          24-48 hours.
        </li>
        <li>
          <strong>Hypertension</strong> -- Currently well-controlled on lisinopril 10mg daily and
          metoprolol succinate 50mg daily.
        </li>
        <li>
          <strong>Type 2 diabetes mellitus</strong> -- Glucose controlled on sliding scale insulin.
          A1C 7.2% drawn on admission.
        </li>
      </ol>

      <h3>Plan</h3>
      <ul>
        <li>Continue IV furosemide 40mg BID, reassess fluid status in AM</li>
        <li>Transition to oral diuretics when net negative 2-3L achieved</li>
        <li>Echocardiogram scheduled for tomorrow to reassess EF</li>
        <li>Dietary consultation for low-sodium diet education</li>
        <li>
          Anticipate discharge in 48-72 hours if diuresis goals met and tolerating oral medications
        </li>
      </ul>

      <blockquote>
        <p>
          Discussed treatment plan and expected course with patient and her daughter. Patient
          verbalizes understanding and agreement with the plan of care. Questions addressed
          regarding medication changes and follow-up appointments.
        </p>
      </blockquote>
    </hx-prose>
  `,
};

export const PatientEducation: Story = {
  render: () => html`
    <hx-prose size="lg">
      <h1>Understanding Your Heart Failure</h1>

      <p>
        Your doctor has told you that you have heart failure. This does not mean your heart has
        stopped working. It means your heart is not pumping blood as well as it should.
      </p>

      <h2>What Is Heart Failure?</h2>
      <p>
        Your heart is a muscle that pumps blood to your entire body. When your heart is weak, it
        cannot pump enough blood. This can make you feel tired and short of breath. Fluid may build
        up in your lungs, legs, and belly.
      </p>

      <h2>Warning Signs to Watch For</h2>
      <p>Call your doctor right away if you notice any of these warning signs:</p>
      <ul>
        <li>
          <strong>Weight gain:</strong> You gain more than 2 pounds in one day or 5 pounds in one
          week
        </li>
        <li><strong>Swelling:</strong> Your legs, ankles, or belly get more swollen</li>
        <li>
          <strong>Breathing trouble:</strong> You feel more short of breath, especially when lying
          down
        </li>
        <li><strong>Cough:</strong> You have a new cough or your cough gets worse</li>
        <li><strong>Tiredness:</strong> You feel much more tired than usual</li>
      </ul>

      <h2>How to Take Care of Yourself</h2>

      <h3>Weigh Yourself Every Day</h3>
      <p>
        Weigh yourself every morning after you use the bathroom and before you eat. Write down your
        weight. Tell your doctor if it goes up quickly.
      </p>

      <h3>Eat Less Salt</h3>
      <p>
        Salt makes your body hold onto water. Too much water makes your heart work harder. Try to
        eat less than 2,000 milligrams of sodium each day.
      </p>

      <h3>Take Your Medicines</h3>
      <p>
        Take all your medicines exactly as your doctor tells you. Do not skip doses. Do not stop
        taking your medicine even if you feel better. If you have trouble paying for your medicines,
        talk to your care team.
      </p>

      <table>
        <caption>
          Your daily medication schedule
        </caption>
        <thead>
          <tr>
            <th>Medicine</th>
            <th>When to Take</th>
            <th>What It Does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Furosemide (Lasix)</td>
            <td>Morning</td>
            <td>Removes extra fluid from your body</td>
          </tr>
          <tr>
            <td>Lisinopril</td>
            <td>Morning</td>
            <td>Helps your heart pump better</td>
          </tr>
          <tr>
            <td>Metoprolol</td>
            <td>Morning and evening</td>
            <td>Slows your heart rate and lowers blood pressure</td>
          </tr>
        </tbody>
      </table>

      <h2>When to Call 911</h2>
      <p>
        <strong>Go to the emergency room or call 911 right away if you:</strong>
      </p>
      <ul>
        <li>Have chest pain that does not go away</li>
        <li>Cannot breathe</li>
        <li>Faint or pass out</li>
        <li>Have a very fast or very slow heartbeat</li>
      </ul>

      <blockquote>
        <p>
          You are not alone. Your care team is here to help you manage your heart failure. Ask
          questions at every visit. The more you understand, the better you can take care of
          yourself.
        </p>
      </blockquote>
    </hx-prose>
  `,
};

export const PolicyDocument: Story = {
  render: () => html`
    <hx-prose>
      <h1>Informed Consent for Cardiac Catheterization</h1>

      <p>
        <strong>Facility:</strong> Springfield Regional Medical Center<br />
        <strong>Department:</strong> Interventional Cardiology<br />
        <strong>Document ID:</strong> IC-CARD-2026-001<br />
        <strong>Effective Date:</strong> January 1, 2026<br />
        <strong>Review Date:</strong> January 1, 2027
      </p>

      <hr />

      <h2>1. Purpose of the Procedure</h2>
      <p>
        Cardiac catheterization is a diagnostic and potentially therapeutic procedure that involves
        inserting a thin, flexible tube (catheter) into a blood vessel, usually in the wrist (radial
        artery) or groin (femoral artery), and threading it to the heart. This procedure allows your
        physician to evaluate the function of your heart and the blood vessels that supply it.
      </p>

      <h2>2. Indications</h2>
      <p>Your physician has recommended this procedure because:</p>
      <ul>
        <li>Non-invasive tests suggest possible blockages in your coronary arteries</li>
        <li>
          You have symptoms such as chest pain, shortness of breath, or abnormal stress test results
          that require further evaluation
        </li>
        <li>
          Your physician needs to assess heart valve function or measure pressures within the heart
          chambers
        </li>
      </ul>

      <h2>3. Risks and Complications</h2>
      <p>
        As with any medical procedure, cardiac catheterization carries certain risks. While serious
        complications are uncommon, you should be aware of the following possibilities:
      </p>

      <h3>3.1 Common Risks (occurring in more than 1 in 100 cases)</h3>
      <ul>
        <li>Bruising or bleeding at the catheter insertion site</li>
        <li>Minor allergic reaction to contrast dye (rash, itching)</li>
        <li>Temporary discomfort at the access site</li>
      </ul>

      <h3>3.2 Uncommon Risks (occurring in fewer than 1 in 100 cases)</h3>
      <ul>
        <li>Blood vessel damage requiring surgical repair</li>
        <li>Kidney injury from contrast dye</li>
        <li>Abnormal heart rhythm requiring treatment</li>
        <li>Blood clot formation</li>
      </ul>

      <h3>3.3 Rare Risks (occurring in fewer than 1 in 1,000 cases)</h3>
      <ul>
        <li>Heart attack</li>
        <li>Stroke</li>
        <li>Emergency cardiac surgery</li>
        <li>Death</li>
      </ul>

      <h2>4. Alternatives</h2>
      <p>Alternatives to cardiac catheterization may include:</p>
      <ol>
        <li>Continued medical management with medication adjustment and monitoring</li>
        <li>Non-invasive imaging studies such as cardiac CT angiography or cardiac MRI</li>
        <li>No treatment, with the understanding that the underlying condition may progress</li>
      </ol>

      <h2>5. Patient Acknowledgment</h2>
      <p>By signing this document, I acknowledge that:</p>
      <ol>
        <li>
          I have read and understand the information provided above, or it has been read and
          explained to me in a language I understand
        </li>
        <li>
          I have had the opportunity to ask questions, and my questions have been answered to my
          satisfaction
        </li>
        <li>I understand the risks, benefits, and alternatives to this procedure</li>
        <li>
          I voluntarily consent to the performance of cardiac catheterization and any additional
          procedures deemed necessary during the course of the examination
        </li>
        <li>I understand that I may withdraw my consent at any time before the procedure begins</li>
      </ol>

      <hr />

      <table>
        <tbody>
          <tr>
            <td><strong>Patient Name (Print):</strong></td>
            <td>_________________________________</td>
          </tr>
          <tr>
            <td><strong>Patient Signature:</strong></td>
            <td>_________________________________</td>
          </tr>
          <tr>
            <td><strong>Date / Time:</strong></td>
            <td>_________________________________</td>
          </tr>
          <tr>
            <td><strong>Witness Name (Print):</strong></td>
            <td>_________________________________</td>
          </tr>
          <tr>
            <td><strong>Witness Signature:</strong></td>
            <td>_________________________________</td>
          </tr>
          <tr>
            <td><strong>Physician Signature:</strong></td>
            <td>_________________________________</td>
          </tr>
        </tbody>
      </table>

      <p>
        <small>
          This document is retained in the patient's medical record. A copy has been provided to the
          patient. Document control number IC-CARD-2026-001. This consent form has been approved by
          the Medical Executive Committee and the Office of General Counsel.
        </small>
      </p>
    </hx-prose>
  `,
};
