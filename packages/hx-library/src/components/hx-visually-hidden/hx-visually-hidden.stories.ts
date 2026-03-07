import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-visually-hidden.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/VisuallyHidden',
  component: 'hx-visually-hidden',
  tags: ['autodocs'],
  render: () => html` <hx-visually-hidden>Screen reader only text</hx-visually-hidden> `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — basic screen reader text
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => html`
    <div>
      <p>The text below is visually hidden but accessible to screen readers:</p>
      <hx-visually-hidden>This text is only visible to screen readers.</hx-visually-hidden>
      <p>(Nothing visible appears between these paragraphs)</p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-visually-hidden');
    await expect(el).toBeTruthy();
    await expect(el?.shadowRoot?.querySelector('[part="base"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. ICON BUTTON — accessible label pattern
// ─────────────────────────────────────────────────

export const IconButtonLabel: Story = {
  render: () => html`
    <button
      type="button"
      style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; background: white; cursor: pointer;"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1.25em"
        height="1.25em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <hx-visually-hidden>Close dialog</hx-visually-hidden>
    </button>
  `,
};

// ─────────────────────────────────────────────────
// 3. SKIP LINK — accessible navigation pattern
// ─────────────────────────────────────────────────

export const ScreenReaderAnnouncement: Story = {
  render: () => html`
    <div>
      <p style="color: #6b7280; font-size: 0.875rem;">
        Inspect the DOM or use a screen reader to see the hidden content:
      </p>
      <nav aria-label="Breadcrumb">
        <ol
          style="display: flex; gap: 0.5rem; list-style: none; padding: 0; margin: 0; align-items: center;"
        >
          <li><a href="#">Home</a></li>
          <li aria-hidden="true" style="color: #9ca3af;">/</li>
          <li><a href="#">Patients</a></li>
          <li aria-hidden="true" style="color: #9ca3af;">/</li>
          <li aria-current="page">
            Jane Doe
            <hx-visually-hidden>, current page</hx-visually-hidden>
          </li>
        </ol>
      </nav>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. SKIP LINK — focusable variant becomes visible on focus
// ─────────────────────────────────────────────────

export const SkipLink: Story = {
  render: () => html`
    <div>
      <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
        Press <kbd>Tab</kbd> to focus the skip link and see it appear:
      </p>
      <hx-visually-hidden focusable>
        <a
          href="#main-content"
          style="display: inline-block; padding: 0.5rem 1rem; background: var(--hx-color-primary-500, #007878); color: white; text-decoration: none; border-radius: 0.25rem; font-weight: 600;"
        >
          Skip to main content
        </a>
      </hx-visually-hidden>
      <nav
        style="margin-top: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.375rem;"
      >
        <a href="#">Home</a> | <a href="#">Patients</a> |
        <a href="#">Dashboard</a>
      </nav>
      <main
        id="main-content"
        style="margin-top: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.375rem;"
      >
        <h2 style="margin: 0 0 0.5rem;">Main Content</h2>
        <p>The skip link above becomes visible when focused via keyboard.</p>
      </main>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. HEALTHCARE — status indicator with context
// ─────────────────────────────────────────────────

export const HealthcareContext: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <p style="color: #6b7280; font-size: 0.875rem;">
        Colored status indicators that include accessible text for screen readers:
      </p>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span
          style="display: inline-block; width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #22c55e;"
          aria-hidden="true"
        ></span>
        <hx-visually-hidden>Status: </hx-visually-hidden>
        <span>Active</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span
          style="display: inline-block; width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #ef4444;"
          aria-hidden="true"
        ></span>
        <hx-visually-hidden>Status: </hx-visually-hidden>
        <span>Critical</span>
      </div>
    </div>
  `,
};
