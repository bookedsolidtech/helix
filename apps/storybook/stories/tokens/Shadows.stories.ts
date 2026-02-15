import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

const meta: Meta = {
  title: 'Design Tokens/Shadows',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/* ─── Shared ─────────────────────────────────────────────────────── */

const sectionTitle = (text: string) => html`
  <h2 style="
    font-family: var(--wc-font-family-sans, sans-serif);
    font-size: var(--wc-font-size-xl, 1.25rem);
    font-weight: var(--wc-font-weight-semibold, 600);
    color: var(--wc-color-neutral-800);
    margin: 0 0 0.5rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--wc-color-neutral-200);
  ">${text}</h2>
`;

const sectionDescription = (text: string) => html`
  <p style="
    font-family: var(--wc-font-family-sans, sans-serif);
    font-size: var(--wc-font-size-sm, 0.875rem);
    color: var(--wc-color-neutral-500);
    margin: 0 0 1.5rem 0;
  ">${text}</p>
`;

/* ─── Shadow Data ────────────────────────────────────────────────── */

const shadows: Array<{
  token: string;
  label: string;
  description: string;
  value: string;
}> = [
  {
    token: '--wc-shadow-sm',
    label: 'sm',
    description: 'Subtle lift. Use for cards and list items at rest.',
    value: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  {
    token: '--wc-shadow-md',
    label: 'md',
    description: 'Medium elevation. Use for dropdowns and popovers.',
    value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  {
    token: '--wc-shadow-lg',
    label: 'lg',
    description: 'Pronounced lift. Use for modals and floating panels.',
    value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  {
    token: '--wc-shadow-xl',
    label: 'xl',
    description: 'Maximum elevation. Use sparingly for overlays and high-priority surfaces.',
    value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
];

/* ─── Shadow Elevation ───────────────────────────────────────────── */

export const Elevation: Story = {
  render: () => html`
    ${sectionTitle('Elevation / Shadows')}
    ${sectionDescription(
      'Shadow tokens create visual depth and indicate elevation in the UI hierarchy. The scale progresses from barely-there (sm) to dramatic (xl).',
    )}

    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 32px;
      padding: 16px;
    ">
      ${shadows.map(
        (s) => html`
          <div style="
            background: var(--wc-color-neutral-0, #fff);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            padding: 32px 24px;
            box-shadow: var(${s.token});
            transition: box-shadow var(--wc-transition-normal, 250ms ease);
          ">
            <div style="
              font-family: var(--wc-font-family-sans, sans-serif);
              font-size: var(--wc-font-size-lg, 1.125rem);
              font-weight: var(--wc-font-weight-semibold, 600);
              color: var(--wc-color-neutral-800);
              margin-bottom: 4px;
            ">shadow-${s.label}</div>
            <div style="
              font-family: var(--wc-font-family-sans, sans-serif);
              font-size: var(--wc-font-size-sm, 0.875rem);
              color: var(--wc-color-neutral-500);
              margin-bottom: 16px;
              line-height: var(--wc-line-height-normal, 1.5);
            ">${s.description}</div>
            <div style="
              font-family: var(--wc-font-family-mono, monospace);
              font-size: var(--wc-font-size-xs, 0.75rem);
              color: var(--wc-color-neutral-600);
              padding: 8px 10px;
              background: var(--wc-color-neutral-50);
              border-radius: var(--wc-border-radius-sm, 0.25rem);
              border: 1px solid var(--wc-color-neutral-200);
              word-break: break-all;
            ">${s.token}</div>
          </div>
        `,
      )}
    </div>
  `,
};

/* ─── Side-by-side Comparison ────────────────────────────────────── */

export const Comparison: Story = {
  render: () => html`
    ${sectionTitle('Side-by-Side Comparison')}
    ${sectionDescription(
      'Identical cards rendered with each shadow level to highlight the visual progression.',
    )}

    <div style="
      display: flex;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
      padding: 24px 16px;
      background: var(--wc-color-neutral-50);
      border-radius: var(--wc-border-radius-lg, 0.5rem);
    ">
      <!-- No shadow baseline -->
      <div style="
        text-align: center;
        flex: 0 0 auto;
      ">
        <div style="
          width: 140px;
          height: 100px;
          background: var(--wc-color-neutral-0, #fff);
          border-radius: var(--wc-border-radius-md, 0.375rem);
          border: 1px solid var(--wc-color-neutral-200);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            font-family: var(--wc-font-family-sans, sans-serif);
            font-size: var(--wc-font-size-sm, 0.875rem);
            color: var(--wc-color-neutral-400);
          ">none</span>
        </div>
        <div style="
          margin-top: 12px;
          font-family: var(--wc-font-family-mono, monospace);
          font-size: 11px;
          color: var(--wc-color-neutral-400);
        ">baseline</div>
      </div>

      ${shadows.map(
        (s) => html`
          <div style="
            text-align: center;
            flex: 0 0 auto;
          ">
            <div style="
              width: 140px;
              height: 100px;
              background: var(--wc-color-neutral-0, #fff);
              border-radius: var(--wc-border-radius-md, 0.375rem);
              box-shadow: var(${s.token});
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="
                font-family: var(--wc-font-family-sans, sans-serif);
                font-size: var(--wc-font-size-sm, 0.875rem);
                color: var(--wc-color-neutral-600);
                font-weight: var(--wc-font-weight-medium, 500);
              ">${s.label}</span>
            </div>
            <div style="
              margin-top: 12px;
              font-family: var(--wc-font-family-mono, monospace);
              font-size: 11px;
              color: var(--wc-color-neutral-500);
            ">${s.token}</div>
          </div>
        `,
      )}
    </div>
  `,
};

/* ─── Interactive Card Example ───────────────────────────────────── */

export const InteractiveCard: Story = {
  render: () => html`
    ${sectionTitle('Elevation in Context')}
    ${sectionDescription(
      'A realistic card using shadow-sm at rest. Hover to see shadow-lg applied via CSS transition (demonstrating the transition token).',
    )}

    <style>
      .token-demo-card {
        background: var(--wc-color-neutral-0, #fff);
        border-radius: var(--wc-border-radius-lg, 0.5rem);
        padding: 24px;
        max-width: 360px;
        box-shadow: var(--wc-shadow-sm);
        transition: box-shadow var(--wc-transition-normal, 250ms ease);
        cursor: pointer;
      }
      .token-demo-card:hover {
        box-shadow: var(--wc-shadow-lg);
      }
    </style>

    <div style="padding: 24px; background: var(--wc-color-neutral-50); border-radius: var(--wc-border-radius-lg);">
      <div class="token-demo-card">
        <div style="
          font-family: var(--wc-font-family-sans, sans-serif);
          font-size: var(--wc-font-size-lg, 1.125rem);
          font-weight: var(--wc-font-weight-semibold, 600);
          color: var(--wc-color-neutral-800);
          margin-bottom: 8px;
        ">Patient Summary</div>
        <div style="
          font-family: var(--wc-font-family-sans, sans-serif);
          font-size: var(--wc-font-size-sm, 0.875rem);
          color: var(--wc-color-neutral-500);
          line-height: var(--wc-line-height-normal, 1.5);
          margin-bottom: 16px;
        ">
          A card at rest uses shadow-sm for a subtle lift. On hover, it
          transitions to shadow-lg to draw attention and indicate
          interactivity.
        </div>
        <div style="
          display: flex;
          gap: 8px;
        ">
          <span style="
            display: inline-block;
            padding: 4px 12px;
            background: var(--wc-color-success-100);
            color: var(--wc-color-success-500);
            border-radius: var(--wc-border-radius-full);
            font-family: var(--wc-font-family-sans, sans-serif);
            font-size: var(--wc-font-size-xs, 0.75rem);
            font-weight: var(--wc-font-weight-medium, 500);
          ">Active</span>
          <span style="
            display: inline-block;
            padding: 4px 12px;
            background: var(--wc-color-primary-50);
            color: var(--wc-color-primary-700);
            border-radius: var(--wc-border-radius-full);
            font-family: var(--wc-font-family-sans, sans-serif);
            font-size: var(--wc-font-size-xs, 0.75rem);
            font-weight: var(--wc-font-weight-medium, 500);
          ">Outpatient</span>
        </div>
      </div>
    </div>
  `,
};
