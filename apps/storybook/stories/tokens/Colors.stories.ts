import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

const meta: Meta = {
  title: 'Design Tokens/Colors',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/* ─── Shared Styles ──────────────────────────────────────────────── */

const sectionTitle = (text: string) => html`
  <h2 style="
    font-family: var(--wc-font-family-sans, sans-serif);
    font-size: var(--wc-font-size-xl, 1.25rem);
    font-weight: var(--wc-font-weight-semibold, 600);
    color: var(--wc-color-neutral-800);
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--wc-color-neutral-200);
  ">${text}</h2>
`;

const swatchCard = (tokenName: string, hexValue: string) => {
  /* Determine if the swatch is dark enough to warrant white label text */
  const isDark = [
    '500', '600', '700', '800', '900',
  ].some((s) => tokenName.endsWith(s));

  return html`
    <div style="
      display: flex;
      flex-direction: column;
      border-radius: var(--wc-border-radius-lg, 0.5rem);
      overflow: hidden;
      border: 1px solid var(--wc-color-neutral-200);
      background: var(--wc-color-neutral-0, #fff);
    ">
      <div style="
        width: 100%;
        height: 80px;
        background: var(${tokenName});
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        padding: 6px 8px;
      ">
        <span style="
          font-family: var(--wc-font-family-mono, monospace);
          font-size: 11px;
          color: ${isDark ? '#fff' : 'var(--wc-color-neutral-700)'};
          opacity: 0.9;
        ">${hexValue}</span>
      </div>
      <div style="
        padding: 8px 10px;
        font-family: var(--wc-font-family-mono, monospace);
        font-size: var(--wc-font-size-xs, 0.75rem);
        color: var(--wc-color-neutral-600);
        line-height: var(--wc-line-height-normal, 1.5);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">${tokenName}</div>
    </div>
  `;
};

const paletteGridStyle = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;';

/* ─── Primary Palette ────────────────────────────────────────────── */

const primaryColors: Array<{ token: string; hex: string }> = [
  { token: '--wc-color-primary-50', hex: '#e6f3f3' },
  { token: '--wc-color-primary-100', hex: '#b3dada' },
  { token: '--wc-color-primary-200', hex: '#80c2c2' },
  { token: '--wc-color-primary-300', hex: '#4da9a9' },
  { token: '--wc-color-primary-400', hex: '#269191' },
  { token: '--wc-color-primary-500', hex: '#007878' },
  { token: '--wc-color-primary-600', hex: '#006868' },
  { token: '--wc-color-primary-700', hex: '#005252' },
  { token: '--wc-color-primary-800', hex: '#003c3c' },
  { token: '--wc-color-primary-900', hex: '#002626' },
];

export const PrimaryPalette: Story = {
  render: () => html`
    ${sectionTitle('Primary')}
    <p style="
      font-family: var(--wc-font-family-sans, sans-serif);
      font-size: var(--wc-font-size-sm, 0.875rem);
      color: var(--wc-color-neutral-500);
      margin: 0 0 1.5rem 0;
    ">
      The primary palette is the core brand color used for interactive
      elements, links, and key UI affordances throughout the system.
    </p>
    <div style="${paletteGridStyle}">
      ${primaryColors.map((c) => swatchCard(c.token, c.hex))}
    </div>
  `,
};

/* ─── Neutral Palette ────────────────────────────────────────────── */

const neutralColors: Array<{ token: string; hex: string }> = [
  { token: '--wc-color-neutral-0', hex: '#ffffff' },
  { token: '--wc-color-neutral-50', hex: '#f8f9fa' },
  { token: '--wc-color-neutral-100', hex: '#e9ecef' },
  { token: '--wc-color-neutral-200', hex: '#dee2e6' },
  { token: '--wc-color-neutral-300', hex: '#ced4da' },
  { token: '--wc-color-neutral-400', hex: '#adb5bd' },
  { token: '--wc-color-neutral-500', hex: '#6c757d' },
  { token: '--wc-color-neutral-600', hex: '#495057' },
  { token: '--wc-color-neutral-700', hex: '#343a40' },
  { token: '--wc-color-neutral-800', hex: '#212529' },
  { token: '--wc-color-neutral-900', hex: '#0d1117' },
];

export const NeutralPalette: Story = {
  render: () => html`
    ${sectionTitle('Neutral')}
    <p style="
      font-family: var(--wc-font-family-sans, sans-serif);
      font-size: var(--wc-font-size-sm, 0.875rem);
      color: var(--wc-color-neutral-500);
      margin: 0 0 1.5rem 0;
    ">
      Neutrals provide the structural backbone of the UI -- backgrounds,
      borders, text, and dividers. The scale runs from pure white (0) to
      near-black (900).
    </p>
    <div style="${paletteGridStyle}">
      ${neutralColors.map((c) => swatchCard(c.token, c.hex))}
    </div>
  `,
};

/* ─── Semantic Colors ────────────────────────────────────────────── */

const semanticColors: Array<{
  token: string;
  hex: string;
  category: string;
}> = [
  { token: '--wc-color-error-100', hex: '#f8d7da', category: 'Error' },
  { token: '--wc-color-error-500', hex: '#dc3545', category: 'Error' },
  { token: '--wc-color-success-100', hex: '#d1e7dd', category: 'Success' },
  { token: '--wc-color-success-500', hex: '#198754', category: 'Success' },
  { token: '--wc-color-warning-100', hex: '#fff3cd', category: 'Warning' },
  { token: '--wc-color-warning-500', hex: '#ffc107', category: 'Warning' },
];

export const SemanticColors: Story = {
  render: () => html`
    ${sectionTitle('Semantic')}
    <p style="
      font-family: var(--wc-font-family-sans, sans-serif);
      font-size: var(--wc-font-size-sm, 0.875rem);
      color: var(--wc-color-neutral-500);
      margin: 0 0 1.5rem 0;
    ">
      Semantic colors communicate meaning -- errors, successes, and warnings.
      Each category includes a light background tint (100) and a full-strength
      foreground value (500).
    </p>
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      ${['Error', 'Success', 'Warning'].map(
        (category) => html`
          <div>
            <h3 style="
              font-family: var(--wc-font-family-sans, sans-serif);
              font-size: var(--wc-font-size-md, 1rem);
              font-weight: var(--wc-font-weight-medium, 500);
              color: var(--wc-color-neutral-700);
              margin: 0 0 0.75rem 0;
            ">${category}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;">
              ${semanticColors
                .filter((c) => c.category === category)
                .map((c) => swatchCard(c.token, c.hex))}
            </div>
          </div>
        `,
      )}
    </div>
  `,
};

/* ─── All Colors (overview) ──────────────────────────────────────── */

export const AllColors: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 3rem;">
      <div>
        ${sectionTitle('Primary')}
        <div style="${paletteGridStyle}">
          ${primaryColors.map((c) => swatchCard(c.token, c.hex))}
        </div>
      </div>
      <div>
        ${sectionTitle('Neutral')}
        <div style="${paletteGridStyle}">
          ${neutralColors.map((c) => swatchCard(c.token, c.hex))}
        </div>
      </div>
      <div>
        ${sectionTitle('Semantic')}
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;">
          ${semanticColors.map((c) => swatchCard(c.token, c.hex))}
        </div>
      </div>
    </div>
  `,
};
