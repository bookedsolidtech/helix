import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

const meta: Meta = {
  title: 'Design Tokens/Spacing',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/* ─── Token Data ─────────────────────────────────────────────────── */

const spacingTokens: Array<{ token: string; value: string; step: string }> = [
  { token: '--wc-space-0', value: '0', step: '0' },
  { token: '--wc-space-1', value: '0.25rem', step: '1' },
  { token: '--wc-space-2', value: '0.5rem', step: '2' },
  { token: '--wc-space-3', value: '0.75rem', step: '3' },
  { token: '--wc-space-4', value: '1rem', step: '4' },
  { token: '--wc-space-5', value: '1.25rem', step: '5' },
  { token: '--wc-space-6', value: '1.5rem', step: '6' },
  { token: '--wc-space-8', value: '2rem', step: '8' },
  { token: '--wc-space-10', value: '2.5rem', step: '10' },
  { token: '--wc-space-12', value: '3rem', step: '12' },
  { token: '--wc-space-16', value: '4rem', step: '16' },
];

/* ─── Spacing Scale ──────────────────────────────────────────────── */

export const SpacingScale: Story = {
  render: () => html`
    <h2 style="
      font-family: var(--wc-font-family-sans, sans-serif);
      font-size: var(--wc-font-size-xl, 1.25rem);
      font-weight: var(--wc-font-weight-semibold, 600);
      color: var(--wc-color-neutral-800);
      margin: 0 0 0.5rem 0;
    ">Spacing Scale</h2>
    <p style="
      font-family: var(--wc-font-family-sans, sans-serif);
      font-size: var(--wc-font-size-sm, 0.875rem);
      color: var(--wc-color-neutral-500);
      margin: 0 0 2rem 0;
    ">
      A consistent spacing scale used for padding, margins, and gaps.
      Each step produces the bar width shown below using the actual
      CSS custom property value.
    </p>

    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${spacingTokens.map(
        (s) => html`
          <div style="
            display: grid;
            grid-template-columns: 140px 80px 1fr;
            align-items: center;
            gap: 16px;
          ">
            <span style="
              font-family: var(--wc-font-family-mono, monospace);
              font-size: var(--wc-font-size-xs, 0.75rem);
              color: var(--wc-color-neutral-600);
            ">${s.token}</span>
            <span style="
              font-family: var(--wc-font-family-mono, monospace);
              font-size: var(--wc-font-size-xs, 0.75rem);
              color: var(--wc-color-neutral-400);
              text-align: right;
            ">${s.value}</span>
            <div style="
              height: 24px;
              width: var(${s.token});
              min-width: ${s.step === '0' ? '2px' : '0'};
              background: var(--wc-color-primary-400);
              border-radius: var(--wc-border-radius-sm, 0.25rem);
              transition: width var(--wc-transition-normal, 250ms ease);
            "></div>
          </div>
        `,
      )}
    </div>
  `,
};

/* ─── Spacing Boxes ──────────────────────────────────────────────── */

export const SpacingBoxes: Story = {
  render: () => html`
    <h2 style="
      font-family: var(--wc-font-family-sans, sans-serif);
      font-size: var(--wc-font-size-xl, 1.25rem);
      font-weight: var(--wc-font-weight-semibold, 600);
      color: var(--wc-color-neutral-800);
      margin: 0 0 0.5rem 0;
    ">Spacing as Padding</h2>
    <p style="
      font-family: var(--wc-font-family-sans, sans-serif);
      font-size: var(--wc-font-size-sm, 0.875rem);
      color: var(--wc-color-neutral-500);
      margin: 0 0 2rem 0;
    ">
      Each box below uses its respective spacing token as padding on all
      sides. The teal background represents the padded area; the white
      inner box represents the content region.
    </p>

    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 20px;
    ">
      ${spacingTokens.map(
        (s) => html`
          <div style="text-align: center;">
            <div style="
              display: inline-block;
              padding: var(${s.token});
              background: var(--wc-color-primary-100, #b3dada);
              border-radius: var(--wc-border-radius-md, 0.375rem);
              border: 1px solid var(--wc-color-primary-300);
            ">
              <div style="
                width: 48px;
                height: 48px;
                background: var(--wc-color-neutral-0, #fff);
                border-radius: var(--wc-border-radius-sm, 0.25rem);
                border: 1px dashed var(--wc-color-neutral-300);
              "></div>
            </div>
            <div style="
              margin-top: 8px;
              font-family: var(--wc-font-family-mono, monospace);
              font-size: 11px;
              color: var(--wc-color-neutral-600);
            ">space-${s.step}</div>
            <div style="
              font-family: var(--wc-font-family-mono, monospace);
              font-size: 10px;
              color: var(--wc-color-neutral-400);
            ">${s.value}</div>
          </div>
        `,
      )}
    </div>
  `,
};
