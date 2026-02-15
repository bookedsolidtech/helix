import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './wc-prose.js';
import '../wc-card/wc-card.js';

const meta = {
  title: 'Components/Prose',
  component: 'wc-prose',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'base', 'lg'],
      description: 'Typography scale for the prose content.',
      table: {
        defaultValue: { summary: 'base' },
      },
    },
    'max-width': {
      control: 'text',
      description: 'Maximum content width (any valid CSS value).',
      table: {
        defaultValue: { summary: '' },
      },
    },
  },
  args: {
    size: 'base',
    'max-width': '',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Default ───

export const Default: Story = {
  render: (args) => html`
    <wc-prose size=${args.size} max-width=${args['max-width'] || ''}>
      <h2>Introduction to Patient Care Standards</h2>
      <p>
        Healthcare organizations rely on consistent, well-documented processes
        to ensure patient safety and quality of care. This document outlines the
        key principles and standards that guide clinical practice across our network.
      </p>
      <h3>Core Principles</h3>
      <p>
        Patient-centered care places the individual at the heart of every decision.
        By fostering open communication between providers and patients, we create
        a collaborative environment that promotes healing and trust.
      </p>
      <p>
        Evidence-based practice ensures that clinical decisions are informed by the
        latest research, clinical expertise, and patient preferences. This triad
        forms the foundation of modern healthcare delivery.
      </p>
    </wc-prose>
  `,
};

// ─── Full Editor Output ───

export const FullEditorOutput: Story = {
  render: () => html`
    <wc-prose>
      <h1>Clinical Documentation Guide</h1>
      <p>
        This comprehensive guide covers all aspects of clinical documentation,
        from initial patient intake through discharge summaries. Proper documentation
        is essential for continuity of care, legal compliance, and quality reporting.
      </p>

      <h2>Headings and Structure</h2>
      <p>Use headings to organize content into logical sections. Each section
      should address a single topic or concept.</p>

      <h3>Subsection Example</h3>
      <p>Subsections provide additional granularity within a major topic area.</p>

      <h4>Further Detail</h4>
      <p>Fourth-level headings are useful for specific procedures or protocols.</p>

      <hr />

      <h2>Lists</h2>
      <h3>Unordered Lists</h3>
      <ul>
        <li>Patient assessment and triage</li>
        <li>Vital signs monitoring
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
        <caption>Vital Signs Reference Ranges</caption>
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
      <p>Use inline code for references like <code>ICD-10</code> codes or
      <code>CPT</code> procedure codes.</p>

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
        <p>
          "The art of medicine consists of amusing the patient while nature
          cures the disease."
        </p>
        <cite>Voltaire</cite>
      </blockquote>

      <h2>Links and Emphasis</h2>
      <p>
        For more information, visit the <a href="https://www.who.int">World Health
        Organization</a> website. Key terms should be <strong>bolded</strong> for
        emphasis, while secondary emphasis uses <em>italics</em>.
      </p>

      <h2>Images</h2>
      <figure>
        <img src="https://placehold.co/720x300/007878/ffffff?text=Clinical+Workflow+Diagram" alt="Clinical workflow diagram showing patient journey" />
        <figcaption>Figure 1: Patient journey from admission to discharge.</figcaption>
      </figure>
    </wc-prose>
  `,
};

// ─── Drupal CKEditor ───

export const DrupalCKEditor: Story = {
  render: () => html`
    <wc-prose>
      <div class="field">
        <div class="field__label">Article Body</div>
        <div class="field__item">
          <div class="text-formatted">
            <h2>Patient Safety Bulletin</h2>
            <p>
              The following safety guidelines have been updated for Q1 2026.
              All clinical staff must review and acknowledge these changes
              before their next shift.
            </p>

            <div class="media-embed align-left">
              <img src="https://placehold.co/300x200/007878/ffffff?text=Safety+Poster" alt="Hand hygiene reminder poster" />
            </div>

            <p>
              Hand hygiene remains the single most effective measure for
              preventing healthcare-associated infections. The updated protocol
              includes new guidance on alcohol-based hand rub usage and
              proper glove removal technique.
            </p>

            <div class="align-center">
              <img src="https://placehold.co/600x200/007878/ffffff?text=Compliance+Chart" alt="Monthly hand hygiene compliance rates" />
            </div>

            <h3>Key Changes</h3>
            <ul>
              <li>Extended hand washing duration from 20 to 30 seconds</li>
              <li>New signage placement at all patient room entries</li>
              <li>Updated PPE donning and doffing procedures</li>
            </ul>

            <div class="messages messages--warning">
              <strong>Important:</strong> These guidelines take effect
              immediately. Non-compliance may result in additional training
              requirements.
            </div>

            <div class="messages messages--status">
              <strong>Update:</strong> The compliance dashboard is now available
              in the staff portal for real-time monitoring.
            </div>

            <div class="clearfix"></div>
          </div>
        </div>
      </div>
    </wc-prose>
  `,
};

// ─── Size Small ───

export const SizeSmall: Story = {
  args: {
    size: 'sm',
  },
  render: (args) => html`
    <wc-prose size=${args.size}>
      <h2>Compact Clinical Notes</h2>
      <p>
        This text uses the small size variant, which reduces the base font size
        for denser information displays. Ideal for sidebar content, footnotes,
        or supplementary documentation that does not require full-size typography.
      </p>
      <ul>
        <li>Lab results within normal limits</li>
        <li>Medications reconciled per protocol</li>
        <li>Follow-up appointment scheduled for 14 days</li>
      </ul>
      <blockquote>
        <p>Patient expressed understanding of discharge instructions.</p>
      </blockquote>
    </wc-prose>
  `,
};

// ─── Size Large ───

export const SizeLarge: Story = {
  args: {
    size: 'lg',
  },
  render: (args) => html`
    <wc-prose size=${args.size}>
      <h2>Patient Education Materials</h2>
      <p>
        This text uses the large size variant for improved readability. Large
        typography is recommended for patient-facing materials, educational
        content, and any documents designed for audiences who may have
        visual impairments.
      </p>
      <p>
        Studies show that increasing font size and line height significantly
        improves reading comprehension for elderly patients and those with
        low health literacy. This variant applies those principles automatically.
      </p>
      <h3>Post-Procedure Instructions</h3>
      <ol>
        <li>Rest for the first 24 hours after the procedure</li>
        <li>Take prescribed medications as directed</li>
        <li>Contact your provider if you experience fever above 101&deg;F</li>
        <li>Schedule a follow-up visit within one week</li>
      </ol>
    </wc-prose>
  `,
};

// ─── Inside Card ───

export const InsideCard: Story = {
  render: () => html`
    <wc-card elevation="raised" style="max-width: 600px;">
      <span slot="heading">Clinical Summary</span>
      <wc-prose>
        <p>
          The patient presented with acute onset of symptoms consistent with
          community-acquired pneumonia. Chest X-ray confirmed bilateral
          infiltrates. Empiric antibiotic therapy was initiated per institutional
          guidelines.
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
              <td>14.2</td>
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
          <p>Patient is clinically improving. Plan to transition to oral antibiotics
          within 48 hours if afebrile.</p>
        </blockquote>
      </wc-prose>
    </wc-card>
  `,
};
