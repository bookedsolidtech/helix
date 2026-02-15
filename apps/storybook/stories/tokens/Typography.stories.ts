import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

const meta: Meta = {
  title: 'Design Tokens/Typography',
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

const sampleText = 'The quick brown fox jumps over the lazy dog';

/* ─── Font Sizes ─────────────────────────────────────────────────── */

const fontSizes: Array<{ token: string; label: string; value: string }> = [
  { token: '--wc-font-size-xs', label: 'xs', value: '0.75rem (12px)' },
  { token: '--wc-font-size-sm', label: 'sm', value: '0.875rem (14px)' },
  { token: '--wc-font-size-md', label: 'md', value: '1rem (16px)' },
  { token: '--wc-font-size-lg', label: 'lg', value: '1.125rem (18px)' },
  { token: '--wc-font-size-xl', label: 'xl', value: '1.25rem (20px)' },
];

export const FontSizes: Story = {
  render: () => html`
    ${sectionTitle('Font Sizes')}
    ${sectionDescription(
      'The type scale provides five sizes ranging from extra-small (xs) to extra-large (xl). All sizes use rem units relative to the document root.',
    )}

    <div style="display: flex; flex-direction: column; gap: 20px;">
      ${fontSizes.map(
        (fs) => html`
          <div style="
            display: grid;
            grid-template-columns: 180px 1fr;
            align-items: baseline;
            gap: 16px;
            padding: 12px 0;
            border-bottom: 1px solid var(--wc-color-neutral-100);
          ">
            <div>
              <div style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-neutral-600);
              ">${fs.token}</div>
              <div style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: 11px;
                color: var(--wc-color-neutral-400);
                margin-top: 2px;
              ">${fs.value}</div>
            </div>
            <div style="
              font-family: var(--wc-font-family-sans, sans-serif);
              font-size: var(${fs.token});
              color: var(--wc-color-neutral-800);
              line-height: var(--wc-line-height-normal, 1.5);
            ">${sampleText}</div>
          </div>
        `,
      )}
    </div>
  `,
};

/* ─── Font Weights ───────────────────────────────────────────────── */

const fontWeights: Array<{ token: string; label: string; value: string }> = [
  { token: '--wc-font-weight-normal', label: 'normal', value: '400' },
  { token: '--wc-font-weight-medium', label: 'medium', value: '500' },
  { token: '--wc-font-weight-semibold', label: 'semibold', value: '600' },
  { token: '--wc-font-weight-bold', label: 'bold', value: '700' },
];

export const FontWeights: Story = {
  render: () => html`
    ${sectionTitle('Font Weights')}
    ${sectionDescription(
      'Four weight stops are available. Inter supports variable weight, so these values render as true optical weights rather than faux bold.',
    )}

    <div style="display: flex; flex-direction: column; gap: 20px;">
      ${fontWeights.map(
        (fw) => html`
          <div style="
            display: grid;
            grid-template-columns: 220px 1fr;
            align-items: baseline;
            gap: 16px;
            padding: 12px 0;
            border-bottom: 1px solid var(--wc-color-neutral-100);
          ">
            <div>
              <div style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-neutral-600);
              ">${fw.token}</div>
              <div style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: 11px;
                color: var(--wc-color-neutral-400);
                margin-top: 2px;
              ">${fw.value}</div>
            </div>
            <div style="
              font-family: var(--wc-font-family-sans, sans-serif);
              font-size: var(--wc-font-size-lg, 1.125rem);
              font-weight: var(${fw.token});
              color: var(--wc-color-neutral-800);
              line-height: var(--wc-line-height-normal, 1.5);
            ">${sampleText}</div>
          </div>
        `,
      )}
    </div>
  `,
};

/* ─── Line Heights ───────────────────────────────────────────────── */

const lineHeights: Array<{ token: string; label: string; value: string }> = [
  { token: '--wc-line-height-tight', label: 'tight', value: '1.25' },
  { token: '--wc-line-height-normal', label: 'normal', value: '1.5' },
  { token: '--wc-line-height-relaxed', label: 'relaxed', value: '1.75' },
];

const multiLineText =
  'Design tokens are the visual design atoms of the design system. They are named entities that store visual design attributes. We use them in place of hard-coded values in order to maintain a scalable and consistent visual system for UI development.';

export const LineHeights: Story = {
  render: () => html`
    ${sectionTitle('Line Heights')}
    ${sectionDescription(
      'Line height controls vertical rhythm. Tight is suited to headings, normal to body copy, and relaxed to long-form reading or captions.',
    )}

    <div style="display: flex; flex-direction: column; gap: 32px;">
      ${lineHeights.map(
        (lh) => html`
          <div>
            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;
            ">
              <span style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-neutral-600);
              ">${lh.token}</span>
              <span style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: 11px;
                color: var(--wc-color-neutral-400);
              ">(${lh.value})</span>
            </div>
            <div style="
              font-family: var(--wc-font-family-sans, sans-serif);
              font-size: var(--wc-font-size-md, 1rem);
              line-height: var(${lh.token});
              color: var(--wc-color-neutral-700);
              max-width: 640px;
              padding: 16px;
              background: var(--wc-color-neutral-50);
              border-radius: var(--wc-border-radius-md, 0.375rem);
              border: 1px solid var(--wc-color-neutral-200);
            ">${multiLineText}</div>
          </div>
        `,
      )}
    </div>
  `,
};

/* ─── Font Families ──────────────────────────────────────────────── */

export const FontFamilies: Story = {
  render: () => html`
    ${sectionTitle('Font Families')}
    ${sectionDescription(
      'Two font stacks are defined: a sans-serif stack (Inter) for UI text and a monospace stack (JetBrains Mono) for code, tokens, and technical labels.',
    )}

    <div style="display: flex; flex-direction: column; gap: 32px;">
      <div>
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        ">
          <span style="
            font-family: var(--wc-font-family-mono, monospace);
            font-size: var(--wc-font-size-xs, 0.75rem);
            color: var(--wc-color-neutral-600);
          ">--wc-font-family-sans</span>
          <span style="
            display: inline-block;
            padding: 2px 8px;
            background: var(--wc-color-primary-50);
            color: var(--wc-color-primary-700);
            border-radius: var(--wc-border-radius-sm, 0.25rem);
            font-family: var(--wc-font-family-mono, monospace);
            font-size: 10px;
          ">Default UI</span>
        </div>
        <div style="
          font-family: var(--wc-font-family-sans, sans-serif);
          font-size: var(--wc-font-size-lg, 1.125rem);
          color: var(--wc-color-neutral-800);
          line-height: var(--wc-line-height-normal, 1.5);
          padding: 20px;
          background: var(--wc-color-neutral-50);
          border-radius: var(--wc-border-radius-md, 0.375rem);
          border: 1px solid var(--wc-color-neutral-200);
        ">
          <div style="margin-bottom: 8px;">${sampleText}</div>
          <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
          <div>abcdefghijklmnopqrstuvwxyz</div>
          <div>0123456789 !@#$%^&*()</div>
        </div>
        <div style="
          font-family: var(--wc-font-family-mono, monospace);
          font-size: 11px;
          color: var(--wc-color-neutral-400);
          margin-top: 6px;
        ">Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif</div>
      </div>

      <div>
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        ">
          <span style="
            font-family: var(--wc-font-family-mono, monospace);
            font-size: var(--wc-font-size-xs, 0.75rem);
            color: var(--wc-color-neutral-600);
          ">--wc-font-family-mono</span>
          <span style="
            display: inline-block;
            padding: 2px 8px;
            background: var(--wc-color-neutral-100);
            color: var(--wc-color-neutral-600);
            border-radius: var(--wc-border-radius-sm, 0.25rem);
            font-family: var(--wc-font-family-mono, monospace);
            font-size: 10px;
          ">Code / Technical</span>
        </div>
        <div style="
          font-family: var(--wc-font-family-mono, monospace);
          font-size: var(--wc-font-size-lg, 1.125rem);
          color: var(--wc-color-neutral-800);
          line-height: var(--wc-line-height-normal, 1.5);
          padding: 20px;
          background: var(--wc-color-neutral-50);
          border-radius: var(--wc-border-radius-md, 0.375rem);
          border: 1px solid var(--wc-color-neutral-200);
        ">
          <div style="margin-bottom: 8px;">${sampleText}</div>
          <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
          <div>abcdefghijklmnopqrstuvwxyz</div>
          <div>0123456789 !@#$%^&*()</div>
        </div>
        <div style="
          font-family: var(--wc-font-family-mono, monospace);
          font-size: 11px;
          color: var(--wc-color-neutral-400);
          margin-top: 6px;
        ">JetBrains Mono, ui-monospace, Cascadia Code, monospace</div>
      </div>
    </div>
  `,
};

/* ─── Complete Typography Overview ───────────────────────────────── */

export const Overview: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 3rem;">
      <!-- Size scale -->
      <div>
        ${sectionTitle('Size Scale')}
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${fontSizes.map(
            (fs) => html`
              <div style="
                display: flex;
                align-items: baseline;
                gap: 16px;
                padding: 8px 0;
                border-bottom: 1px solid var(--wc-color-neutral-100);
              ">
                <span style="
                  width: 40px;
                  font-family: var(--wc-font-family-mono, monospace);
                  font-size: 11px;
                  color: var(--wc-color-primary-500);
                  font-weight: var(--wc-font-weight-semibold, 600);
                ">${fs.label}</span>
                <span style="
                  font-family: var(--wc-font-family-sans, sans-serif);
                  font-size: var(${fs.token});
                  color: var(--wc-color-neutral-800);
                ">${sampleText}</span>
              </div>
            `,
          )}
        </div>
      </div>

      <!-- Weight scale -->
      <div>
        ${sectionTitle('Weight Scale')}
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${fontWeights.map(
            (fw) => html`
              <div style="
                display: flex;
                align-items: baseline;
                gap: 16px;
                padding: 8px 0;
                border-bottom: 1px solid var(--wc-color-neutral-100);
              ">
                <span style="
                  width: 80px;
                  font-family: var(--wc-font-family-mono, monospace);
                  font-size: 11px;
                  color: var(--wc-color-primary-500);
                  font-weight: var(--wc-font-weight-semibold, 600);
                ">${fw.label}</span>
                <span style="
                  font-family: var(--wc-font-family-sans, sans-serif);
                  font-size: var(--wc-font-size-lg, 1.125rem);
                  font-weight: var(${fw.token});
                  color: var(--wc-color-neutral-800);
                ">${sampleText}</span>
              </div>
            `,
          )}
        </div>
      </div>
    </div>
  `,
};
