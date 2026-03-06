import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-split-panel.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Split Panel',
  component: 'hx-split-panel',
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Position of the divider as a percentage (0–100) of the start panel.',
      table: {
        category: 'Layout',
        defaultValue: { summary: '50' },
        type: { summary: 'number' },
      },
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Orientation of the split.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'horizontal' },
        type: { summary: "'horizontal' | 'vertical'" },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'When true, the divider cannot be dragged.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    position: 50,
    orientation: 'horizontal',
    disabled: false,
  },
  render: (args) => html`
    <hx-split-panel
      position=${args.position}
      orientation=${args.orientation}
      ?disabled=${args.disabled}
      style="height: 300px; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden;"
    >
      <div slot="start" style="padding: 1rem; background: #f8fafc; height: 100%; box-sizing: border-box;">
        <strong>Start Panel</strong>
        <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem;">Patient list or navigation</p>
      </div>
      <div slot="end" style="padding: 1rem; background: #ffffff; height: 100%; box-sizing: border-box;">
        <strong>End Panel</strong>
        <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem;">Detail view or content area</p>
      </div>
    </hx-split-panel>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT (Horizontal)
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-split-panel');
    await expect(el).toBeTruthy();
    await expect(el?.shadowRoot?.querySelector('[part="divider"]')).toBeTruthy();
    await expect(el?.shadowRoot?.querySelector('[part="start"]')).toBeTruthy();
    await expect(el?.shadowRoot?.querySelector('[part="end"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. VERTICAL
// ─────────────────────────────────────────────────

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    position: 40,
  },
  render: (args) => html`
    <hx-split-panel
      position=${args.position}
      orientation="vertical"
      style="height: 400px; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden;"
    >
      <div slot="start" style="padding: 1rem; background: #f8fafc; box-sizing: border-box;">
        <strong>Patient Summary</strong>
        <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem;">Jane Doe — MRN: 885521</p>
      </div>
      <div slot="end" style="padding: 1rem; background: #ffffff; box-sizing: border-box;">
        <strong>Clinical Notes</strong>
        <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem;">Vitals and lab results</p>
      </div>
    </hx-split-panel>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-split-panel');
    await expect(el?.getAttribute('orientation')).toBe('vertical');
  },
};

// ─────────────────────────────────────────────────
// 3. WITH SNAP POINTS
// ─────────────────────────────────────────────────

export const WithSnapPoints: Story = {
  render: () => html`
    <p style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #64748b;">
      Snap points at 25%, 50%, and 75% — drag the divider near a snap point to snap.
    </p>
    <hx-split-panel
      .snap=${[25, 50, 75]}
      style="height: 300px; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden;"
    >
      <div slot="start" style="padding: 1rem; background: #f8fafc; height: 100%; box-sizing: border-box;">
        <strong>Navigation</strong>
        <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem;">Snaps at 25%, 50%, 75%</p>
      </div>
      <div slot="end" style="padding: 1rem; background: #ffffff; height: 100%; box-sizing: border-box;">
        <strong>Content</strong>
        <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem;">Drag the divider to a snap point</p>
      </div>
    </hx-split-panel>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-split-panel');
    await expect(el).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 4. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    disabled: true,
    position: 30,
  },
  render: (args) => html`
    <hx-split-panel
      position=${args.position}
      ?disabled=${args.disabled}
      style="height: 300px; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden;"
    >
      <div slot="start" style="padding: 1rem; background: #f8fafc; height: 100%; box-sizing: border-box;">
        <strong>Fixed Panel</strong>
        <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem;">Divider is locked — cannot be dragged</p>
      </div>
      <div slot="end" style="padding: 1rem; background: #ffffff; height: 100%; box-sizing: border-box;">
        <strong>Main Content</strong>
        <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem;">Fixed layout, no resizing</p>
      </div>
    </hx-split-panel>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-split-panel');
    await expect(el?.getAttribute('disabled')).not.toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 5. HEALTHCARE — PATIENT RECORD LAYOUT
// ─────────────────────────────────────────────────

export const PatientRecordLayout: Story = {
  render: () => html`
    <hx-split-panel
      position="35"
      style="height: 450px; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; font-family: sans-serif;"
    >
      <div slot="start" style="padding: 1rem; background: #f8fafc; height: 100%; box-sizing: border-box; overflow-y: auto;">
        <h3 style="margin: 0 0 1rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
          Patient List
        </h3>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
          <li style="padding: 0.5rem; background: #e0f2fe; border-radius: 0.25rem; font-size: 0.875rem; cursor: pointer;">
            <strong>Jane Doe</strong><br><span style="color: #64748b;">MRN: 885521</span>
          </li>
          <li style="padding: 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; cursor: pointer;">
            <strong>John Smith</strong><br><span style="color: #64748b;">MRN: 442209</span>
          </li>
          <li style="padding: 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; cursor: pointer;">
            <strong>Maria Garcia</strong><br><span style="color: #64748b;">MRN: 771834</span>
          </li>
        </ul>
      </div>
      <div slot="end" style="padding: 1.5rem; background: #ffffff; height: 100%; box-sizing: border-box; overflow-y: auto;">
        <h2 style="margin: 0 0 0.25rem; font-size: 1.125rem;">Jane Doe</h2>
        <p style="margin: 0 0 1rem; color: #64748b; font-size: 0.875rem;">DOB: 1982-03-15 — Room 214-B — Dr. Patel</p>
        <section>
          <h3 style="margin: 0 0 0.5rem; font-size: 0.875rem;">Vitals</h3>
          <p style="margin: 0; font-size: 0.875rem;">BP: 120/80 — HR: 72 bpm — Temp: 98.6°F</p>
        </section>
      </div>
    </hx-split-panel>
  `,
};
