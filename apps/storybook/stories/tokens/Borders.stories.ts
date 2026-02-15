import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

const meta: Meta = {
  title: 'Design Tokens/Borders',
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

/* ─── Border Radius Data ─────────────────────────────────────────── */

const borderRadii: Array<{ token: string; label: string; value: string }> = [
  { token: '--wc-border-radius-sm', label: 'sm', value: '0.25rem (4px)' },
  { token: '--wc-border-radius-md', label: 'md', value: '0.375rem (6px)' },
  { token: '--wc-border-radius-lg', label: 'lg', value: '0.5rem (8px)' },
  { token: '--wc-border-radius-xl', label: 'xl', value: '0.75rem (12px)' },
  { token: '--wc-border-radius-full', label: 'full', value: '9999px' },
];

/* ─── Border Widths Data ─────────────────────────────────────────── */

const borderWidths: Array<{ token: string; label: string; value: string }> = [
  { token: '--wc-border-width-thin', label: 'thin', value: '1px' },
  { token: '--wc-border-width-medium', label: 'medium', value: '2px' },
];

/* ─── Border Radius ──────────────────────────────────────────────── */

export const BorderRadius: Story = {
  render: () => html`
    ${sectionTitle('Border Radius')}
    ${sectionDescription(
      'Border radius tokens control the rounding of corners. The scale ranges from subtle rounding (sm) to fully circular (full).',
    )}

    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 24px;
    ">
      ${borderRadii.map(
        (br) => html`
          <div style="text-align: center;">
            <div style="
              width: 120px;
              height: 120px;
              margin: 0 auto;
              background: var(--wc-color-primary-100);
              border: 2px solid var(--wc-color-primary-400);
              border-radius: var(${br.token});
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-primary-700);
                font-weight: var(--wc-font-weight-medium, 500);
              ">${br.label}</span>
            </div>
            <div style="
              margin-top: 12px;
              font-family: var(--wc-font-family-mono, monospace);
              font-size: var(--wc-font-size-xs, 0.75rem);
              color: var(--wc-color-neutral-600);
            ">${br.token}</div>
            <div style="
              font-family: var(--wc-font-family-mono, monospace);
              font-size: 11px;
              color: var(--wc-color-neutral-400);
              margin-top: 2px;
            ">${br.value}</div>
          </div>
        `,
      )}
    </div>
  `,
};

/* ─── Border Widths ──────────────────────────────────────────────── */

export const BorderWidths: Story = {
  render: () => html`
    ${sectionTitle('Border Widths')}
    ${sectionDescription(
      'Two border width tokens are available. Thin (1px) is used for most element borders. Medium (2px) is suited to focus rings and emphasis borders.',
    )}

    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    ">
      ${borderWidths.map(
        (bw) => html`
          <div style="
            padding: 24px;
            background: var(--wc-color-neutral-0, #fff);
            border-style: solid;
            border-color: var(--wc-color-primary-500);
            border-width: var(${bw.token});
            border-radius: var(--wc-border-radius-md, 0.375rem);
          ">
            <div style="
              font-family: var(--wc-font-family-mono, monospace);
              font-size: var(--wc-font-size-sm, 0.875rem);
              color: var(--wc-color-neutral-700);
              font-weight: var(--wc-font-weight-medium, 500);
              margin-bottom: 4px;
            ">${bw.token}</div>
            <div style="
              font-family: var(--wc-font-family-mono, monospace);
              font-size: var(--wc-font-size-xs, 0.75rem);
              color: var(--wc-color-neutral-400);
            ">${bw.value}</div>
          </div>
        `,
      )}
    </div>
  `,
};

/* ─── Combined: Radius + Width ───────────────────────────────────── */

export const RadiusAndWidth: Story = {
  render: () => html`
    ${sectionTitle('Radius + Width Combinations')}
    ${sectionDescription(
      'The matrix below shows every combination of border radius and border width, giving a feel for how these tokens interact.',
    )}

    <div style="overflow-x: auto;">
      <table style="
        border-collapse: separate;
        border-spacing: 16px;
        font-family: var(--wc-font-family-sans, sans-serif);
      ">
        <thead>
          <tr>
            <th></th>
            ${borderRadii.map(
              (br) => html`
                <th style="
                  font-family: var(--wc-font-family-mono, monospace);
                  font-size: 11px;
                  color: var(--wc-color-neutral-500);
                  font-weight: var(--wc-font-weight-normal, 400);
                  padding-bottom: 8px;
                  white-space: nowrap;
                ">radius-${br.label}</th>
              `,
            )}
          </tr>
        </thead>
        <tbody>
          ${borderWidths.map(
            (bw) => html`
              <tr>
                <td style="
                  font-family: var(--wc-font-family-mono, monospace);
                  font-size: 11px;
                  color: var(--wc-color-neutral-500);
                  padding-right: 8px;
                  white-space: nowrap;
                  vertical-align: middle;
                ">width-${bw.label}</td>
                ${borderRadii.map(
                  (br) => html`
                    <td>
                      <div style="
                        width: 80px;
                        height: 80px;
                        background: var(--wc-color-neutral-50);
                        border-style: solid;
                        border-color: var(--wc-color-primary-500);
                        border-width: var(${bw.token});
                        border-radius: var(${br.token});
                      "></div>
                    </td>
                  `,
                )}
              </tr>
            `,
          )}
        </tbody>
      </table>
    </div>
  `,
};
