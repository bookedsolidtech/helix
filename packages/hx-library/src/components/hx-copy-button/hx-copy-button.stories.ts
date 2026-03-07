import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-copy-button.js';

// ─────────────────────────────────────────────────
// Shared SVG icon helpers
// ─────────────────────────────────────────────────

const iconCopy = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
  </svg>
`;

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/CopyButton',
  component: 'hx-copy-button',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description:
        'The text value to write to the clipboard on click. Required for the component to perform a copy operation.',
      table: {
        category: 'Data',
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },
    label: {
      control: 'text',
      description:
        'Accessible label applied as `aria-label` and `title` on the button. Announced by screen readers.',
      table: {
        category: 'Accessibility',
        type: { summary: 'string' },
        defaultValue: { summary: 'Copy to clipboard' },
      },
    },
    feedbackDuration: {
      control: { type: 'number', min: 100, max: 10000, step: 100 },
      description:
        'Duration in milliseconds to display the success (copied) state before reverting to the idle state. Maps to the `feedback-duration` attribute.',
      table: {
        category: 'Behavior',
        type: { summary: 'number' },
        defaultValue: { summary: '2000' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Visual size of the button. Controls height and padding tokens. Maps to the `hx-size` attribute.',
      table: {
        category: 'Visual',
        type: { summary: "'sm' | 'md' | 'lg'" },
        defaultValue: { summary: 'md' },
      },
    },
    disabled: {
      control: 'boolean',
      description:
        'Whether the button is disabled. When true, click events are suppressed and clipboard writes do not occur.',
      table: {
        category: 'State',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
  args: {
    value: 'Hello world',
    label: 'Copy to clipboard',
    feedbackDuration: 2000,
    size: 'md',
    disabled: false,
  },
  render: (args) => html`
    <hx-copy-button
      value=${args.value}
      label=${args.label}
      feedback-duration=${args.feedbackDuration}
      hx-size=${args.size}
      ?disabled=${args.disabled}
    >
      ${iconCopy}
      <svg
        slot="copy-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
      </svg>
      <svg
        slot="success-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </hx-copy-button>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Basic usage; verifies hx-copy fires after click
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    value: 'Hello world',
    label: 'Copy to clipboard',
  },
  render: (args) => html`
    <hx-copy-button
      value=${args.value}
      label=${args.label}
      feedback-duration=${args.feedbackDuration}
      hx-size=${args.size}
      ?disabled=${args.disabled}
    >
      <svg
        slot="copy-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
      </svg>
      <svg
        slot="success-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </hx-copy-button>
  `,
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);

    // Mock clipboard API so the copy actually resolves in test environment.
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async () => {} },
      configurable: true,
    });

    const el = canvasElement.querySelector('hx-copy-button');
    await expect(el).toBeTruthy();

    const eventSpy = fn();
    el?.addEventListener('hx-copy', eventSpy);

    const btn = el?.shadowRoot?.querySelector('button');
    await expect(btn).toBeTruthy();
    await userEvent.click(btn!);

    await expect(eventSpy).toHaveBeenCalledTimes(1);
    const evt = eventSpy.mock.calls[0]?.[0] as CustomEvent<{ value: string }>;
    await expect(evt.detail.value).toBe('Hello world');

    el?.removeEventListener('hx-copy', eventSpy);
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  },
};

// ─────────────────────────────────────────────────
// 2. WITH LABEL — Default slot label text alongside the copy icon
// ─────────────────────────────────────────────────

export const WithLabel: Story = {
  args: {
    value: 'patient@example.com',
    label: 'Copy email address',
  },
  render: (args) => html`
    <hx-copy-button
      value=${args.value}
      label=${args.label}
      feedback-duration=${args.feedbackDuration}
      hx-size=${args.size}
      ?disabled=${args.disabled}
    >
      <svg
        slot="copy-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
      </svg>
      <svg
        slot="success-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Copy email
    </hx-copy-button>
  `,
};

// ─────────────────────────────────────────────────
// 3. SIZE STORIES
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: {
    value: 'Small copy target',
    label: 'Copy to clipboard',
    size: 'sm',
  },
  render: (args) => html`
    <hx-copy-button
      value=${args.value}
      label=${args.label}
      feedback-duration=${args.feedbackDuration}
      hx-size=${args.size}
      ?disabled=${args.disabled}
    >
      <svg
        slot="copy-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
      </svg>
      <svg
        slot="success-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </hx-copy-button>
  `,
};

export const Medium: Story = {
  args: {
    value: 'Medium copy target',
    label: 'Copy to clipboard',
    size: 'md',
  },
  render: (args) => html`
    <hx-copy-button
      value=${args.value}
      label=${args.label}
      feedback-duration=${args.feedbackDuration}
      hx-size=${args.size}
      ?disabled=${args.disabled}
    >
      <svg
        slot="copy-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
      </svg>
      <svg
        slot="success-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </hx-copy-button>
  `,
};

export const Large: Story = {
  args: {
    value: 'Large copy target',
    label: 'Copy to clipboard',
    size: 'lg',
  },
  render: (args) => html`
    <hx-copy-button
      value=${args.value}
      label=${args.label}
      feedback-duration=${args.feedbackDuration}
      hx-size=${args.size}
      ?disabled=${args.disabled}
    >
      <svg
        slot="copy-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
      </svg>
      <svg
        slot="success-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </hx-copy-button>
  `,
};

// ─────────────────────────────────────────────────
// 4. DISABLED STATE — Verifies hx-copy does NOT fire
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    value: 'Disabled copy target',
    label: 'Copy unavailable',
    disabled: true,
  },
  render: (args) => html`
    <hx-copy-button
      value=${args.value}
      label=${args.label}
      feedback-duration=${args.feedbackDuration}
      hx-size=${args.size}
      ?disabled=${args.disabled}
    >
      <svg
        slot="copy-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
      </svg>
      <svg
        slot="success-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </hx-copy-button>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-copy-button');
    await expect(el).toBeTruthy();

    let fired = false;
    el?.addEventListener('hx-copy', () => {
      fired = true;
    });

    const btn = el?.shadowRoot?.querySelector('button');
    await expect(btn).toBeTruthy();
    await expect(btn!.disabled).toBe(true);

    // Native click on a disabled button must not trigger hx-copy.
    btn!.click();
    await expect(fired).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 5. SHORT FEEDBACK — feedback-duration=500 for quick feedback demo
// ─────────────────────────────────────────────────

export const ShortFeedback: Story = {
  args: {
    value: 'Quick copy value',
    label: 'Copy to clipboard',
    feedbackDuration: 500,
  },
  render: (args) => html`
    <div>
      <hx-copy-button
        value=${args.value}
        label=${args.label}
        feedback-duration=${args.feedbackDuration}
        hx-size=${args.size}
        ?disabled=${args.disabled}
      >
        <svg
          slot="copy-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
        </svg>
        <svg
          slot="success-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </hx-copy-button>
      <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
        The success icon reverts to the copy icon after 500 ms
        (<code>feedback-duration="500"</code>). Click to observe.
      </p>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. HEALTHCARE MRN — Copy patient Medical Record Number
// ─────────────────────────────────────────────────

export const HealthcareMRN: Story = {
  args: {
    value: 'MRN-2026-7823-HD',
    label: 'Copy patient MRN',
    feedbackDuration: 2000,
    size: 'sm',
  },
  render: (args) => html`
    <div
      style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;"
    >
      <span style="font-size: 0.875rem; font-weight: 600; color: #111827; letter-spacing: 0.05em;">
        ${args.value}
      </span>
      <hx-copy-button
        value=${args.value}
        label=${args.label}
        feedback-duration=${args.feedbackDuration}
        hx-size=${args.size}
        ?disabled=${args.disabled}
      >
        <svg
          slot="copy-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
        </svg>
        <svg
          slot="success-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </hx-copy-button>
    </div>
    <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
      Inline copy button for a patient Medical Record Number. The
      <code>label</code> attribute ("Copy patient MRN") provides full context for screen reader
      users beyond the visible icon alone.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 7. ALL SIZES — Kitchen sink showing all sizes in a row
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-copy-button value="Small copy" label="Copy to clipboard" hx-size="sm">
          <svg
            slot="copy-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
          </svg>
          <svg
            slot="success-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </hx-copy-button>
        <span style="font-size: 0.75rem; color: #6b7280;">sm</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-copy-button value="Medium copy" label="Copy to clipboard" hx-size="md">
          <svg
            slot="copy-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
          </svg>
          <svg
            slot="success-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </hx-copy-button>
        <span style="font-size: 0.75rem; color: #6b7280;">md</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-copy-button value="Large copy" label="Copy to clipboard" hx-size="lg">
          <svg
            slot="copy-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
          </svg>
          <svg
            slot="success-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </hx-copy-button>
        <span style="font-size: 0.75rem; color: #6b7280;">lg</span>
      </div>
    </div>
  `,
};
