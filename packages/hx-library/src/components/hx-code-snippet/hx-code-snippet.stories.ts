import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-code-snippet.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Code Snippet',
  component: 'hx-code-snippet',
  tags: ['autodocs'],
  argTypes: {
    language: {
      control: 'text',
      description:
        'Language hint for consumers integrating syntax highlighting. Does not affect rendering.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
    inline: {
      control: 'boolean',
      description: 'When true, renders as an inline <code> element instead of a block.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    wrap: {
      control: 'boolean',
      description: 'Enable word-wrap in block mode.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    copyable: {
      control: 'boolean',
      description: 'Show the copy-to-clipboard button.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    maxLines: {
      control: 'number',
      description: 'Maximum lines before truncation with a "Show more" button. 0 = no limit.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
  },
  args: {
    language: 'javascript',
    inline: false,
    wrap: false,
    copyable: true,
    maxLines: 0,
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — JavaScript block
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => html`
    <hx-code-snippet language="javascript">
      const greeting = 'Hello, world!'; console.log(greeting);
    </hx-code-snippet>
  `,
  play: async ({ canvasElement }) => {
    const snippet = canvasElement.querySelector('hx-code-snippet');
    await expect(snippet).toBeTruthy();
    await expect(snippet!.shadowRoot).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. JAVASCRIPT EXAMPLE
// ─────────────────────────────────────────────────

export const JavaScript: Story = {
  name: 'Language: JavaScript',
  render: () => html`
    <hx-code-snippet language="javascript">
      function fetchPatient(id) { return fetch('/api/patients/' + id) .then(function (res) { return
      res.json(); }); }
    </hx-code-snippet>
  `,
};

// ─────────────────────────────────────────────────
// 3. HTML EXAMPLE
// ─────────────────────────────────────────────────

export const HTML: Story = {
  name: 'Language: HTML',
  render: () => html`
    <hx-code-snippet language="html">
      &lt;hx-button variant="primary"&gt;Schedule Appointment&lt;/hx-button&gt;
    </hx-code-snippet>
  `,
};

// ─────────────────────────────────────────────────
// 4. CSS EXAMPLE
// ─────────────────────────────────────────────────

export const CSS: Story = {
  name: 'Language: CSS',
  render: () => html`
    <hx-code-snippet language="css">
      hx-button { --hx-button-bg: var(--hx-color-success-500); --hx-button-border-radius: 9999px; }
    </hx-code-snippet>
  `,
};

// ─────────────────────────────────────────────────
// 5. BASH EXAMPLE
// ─────────────────────────────────────────────────

export const Bash: Story = {
  name: 'Language: Bash',
  render: () => html`
    <hx-code-snippet language="bash">
      npm install @helixui/library npm run build npm run test
    </hx-code-snippet>
  `,
};

// ─────────────────────────────────────────────────
// 6. TYPESCRIPT EXAMPLE
// ─────────────────────────────────────────────────

export const TypeScript: Story = {
  name: 'Language: TypeScript',
  render: () => html`
    <hx-code-snippet language="typescript">
      interface Patient { id: string; name: string; dateOfBirth: string; } function getPatient(id:
      string): Promise&lt;Patient&gt; { return fetch('/api/patients/' + id).then((res) => res.json()
      as Promise&lt;Patient&gt;); }
    </hx-code-snippet>
  `,
};

// ─────────────────────────────────────────────────
// 7. INLINE MODE
// ─────────────────────────────────────────────────

export const Inline: Story = {
  render: () => html`
    <p style="font-family: sans-serif; font-size: 1rem;">
      Use the <hx-code-snippet inline>hx-button</hx-code-snippet> component with
      <hx-code-snippet inline>variant="primary"</hx-code-snippet> for primary actions.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 8. WRAP MODE
// ─────────────────────────────────────────────────

export const Wrap: Story = {
  name: 'Block: Word Wrap',
  render: () => html`
    <div style="max-width: 400px;">
      <hx-code-snippet language="javascript" wrap>
        const patientRecord = { id: 'pt-001', name: 'Jane Doe', diagnosis: 'Hypertension',
        medications: ['Lisinopril 10mg', 'Metoprolol 25mg'], lastVisit: '2026-02-15' };
      </hx-code-snippet>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. WITHOUT COPY BUTTON
// ─────────────────────────────────────────────────

export const NoCopyButton: Story = {
  name: 'Copy: Disabled',
  render: () => html`
    <hx-code-snippet language="javascript" ?copyable=${false}> const x = 42; </hx-code-snippet>
  `,
};

// ─────────────────────────────────────────────────
// 10. MAX LINES — Truncated
// ─────────────────────────────────────────────────

export const MaxLines: Story = {
  name: 'Max Lines: Show More/Less',
  render: () => html`
    <hx-code-snippet language="javascript" max-lines="5">
      const a = 1; const b = 2; const c = 3; const d = 4; const e = 5; const f = 6; const g = 7;
      const h = 8; const i = 9; const j = 10;
    </hx-code-snippet>
  `,
  play: async ({ canvasElement }) => {
    const snippet = canvasElement.querySelector('hx-code-snippet');
    await expect(snippet).toBeTruthy();
    // Wait for slot to be processed
    await snippet!.updateComplete;
    const expandBtn = snippet!.shadowRoot!.querySelector('[part="expand-button"]');
    await expect(expandBtn).toBeTruthy();
    await expect(expandBtn!.textContent?.trim()).toBe('Show more');
    (expandBtn as HTMLButtonElement).click();
    await snippet!.updateComplete;
    await expect(expandBtn!.textContent?.trim()).toBe('Show less');
  },
};

// ─────────────────────────────────────────────────
// 11. COPY INTERACTION
// ─────────────────────────────────────────────────

export const CopyInteraction: Story = {
  name: 'Copy: Interaction Test',
  render: () => html`
    <hx-code-snippet language="javascript">npm install @helixui/library</hx-code-snippet>
  `,
  play: async ({ canvasElement }) => {
    const snippet = canvasElement.querySelector('hx-code-snippet');
    await expect(snippet).toBeTruthy();

    const copyBtn = snippet!.shadowRoot!.querySelector('[part="copy-button"]');
    await expect(copyBtn).toBeTruthy();
    await expect(copyBtn!.getAttribute('aria-label')).toBe('Copy code');
  },
};

// ─────────────────────────────────────────────────
// 12. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-code-snippet::part(copy-button) {
        background-color: #2563eb;
        border-color: #1d4ed8;
        color: #ffffff;
      }
    </style>
    <div class="parts-demo">
      <hx-code-snippet language="typescript">
        interface Patient { id: string; name: string; }
      </hx-code-snippet>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 13. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const DrugDosageSnippet: Story = {
  name: 'Healthcare: Drug Dosage Config',
  render: () => html`
    <div style="max-width: 600px;">
      <p style="font-family: sans-serif; margin-bottom: 0.5rem; font-size: 0.875rem;">
        Configure dosage alerts with the following JSON:
      </p>
      <hx-code-snippet language="json">
        { "medication": "Amoxicillin", "dosage": "500mg", "frequency": "every 8 hours",
        "maxDailyDose": "1500mg", "alertThreshold": 1400 }
      </hx-code-snippet>
    </div>
  `,
};

export const ApiEndpointSnippet: Story = {
  name: 'Healthcare: API Endpoint',
  render: () => html`
    <div style="max-width: 600px;">
      <p style="font-family: sans-serif; margin-bottom: 0.5rem; font-size: 0.875rem;">
        FHIR patient lookup endpoint:
      </p>
      <hx-code-snippet language="bash">
        curl -X GET https://fhir.example.org/Patient/pt-00123 -H "Authorization: Bearer
        $ACCESS_TOKEN" -H "Accept: application/fhir+json"
      </hx-code-snippet>
    </div>
  `,
};

export const InlineInDocs: Story = {
  name: 'Healthcare: Inline in Documentation',
  render: () => html`
    <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6;">
      <p>
        To register a patient, call
        <hx-code-snippet inline>POST /api/v1/patients</hx-code-snippet>
        with the patient's
        <hx-code-snippet inline>firstName</hx-code-snippet>,
        <hx-code-snippet inline>lastName</hx-code-snippet>, and
        <hx-code-snippet inline>dateOfBirth</hx-code-snippet>
        fields in the request body.
      </p>
    </div>
  `,
};
