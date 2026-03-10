import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-theme.js';
import type { HelixTheme } from './hx-theme.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Infrastructure/Theme',
  component: 'hx-theme',
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: { type: 'select' },
      options: ['light', 'dark', 'high-contrast', 'auto'],
      description:
        'The theme to apply. Injects the matching set of --hx-* design tokens onto the host element. Use `"auto"` to follow the OS color scheme.',
      table: {
        category: 'Theme',
        defaultValue: { summary: 'light' },
        type: { summary: "'light' | 'dark' | 'high-contrast' | 'auto'" },
      },
    },
    system: {
      control: 'boolean',
      description:
        'When true, auto-detects theme from the OS prefers-color-scheme media query. Overrides the theme prop.',
      table: {
        category: 'Theme',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    theme: 'light',
    system: false,
  },
  render: (args) => html`
    <hx-theme theme=${args.theme} ?system=${args.system}>
      <div
        style="
          padding: 1.5rem;
          border: 1px solid var(--hx-color-border-default, var(--hx-color-neutral-200, #e2e8f0));
          border-radius: var(--hx-border-radius-md, 0.375rem);
          background: var(--hx-color-surface-default, var(--hx-color-neutral-0, #fff));
          color: var(--hx-color-text-primary, var(--hx-color-neutral-900, #0f172a));
          font-family: var(--hx-font-family-sans, sans-serif);
        "
      >
        <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 1rem;">
          Theme: <code>${args.theme}</code>
        </p>
        <p
          style="margin: 0 0 0.75rem; color: var(--hx-color-text-secondary, var(--hx-color-neutral-600, #475569));"
        >
          This content inherits <code>--hx-*</code> design tokens from the theme provider.
        </p>
        <p style="margin: 0; color: var(--hx-color-primary-500, #2563eb);">
          Primary color: <code>var(--hx-color-primary-500)</code>
        </p>
      </div>
    </hx-theme>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. LIGHT — Default theme
// ─────────────────────────────────────────────────

export const Light: Story = {
  name: 'Light (default)',
  args: { theme: 'light' },
};

// ─────────────────────────────────────────────────
// 2. DARK — Dark theme
// ─────────────────────────────────────────────────

export const Dark: Story = {
  name: 'Dark',
  args: { theme: 'dark' },
  decorators: [
    (story) => html`
      <div
        style="background: var(--hx-color-neutral-950, #0d1117); padding: 2rem; min-height: 120px;"
      >
        ${story()}
      </div>
    `,
  ],
};

// ─────────────────────────────────────────────────
// 3. HIGH CONTRAST — High contrast theme
// ─────────────────────────────────────────────────

export const HighContrast: Story = {
  name: 'High Contrast',
  args: { theme: 'high-contrast' },
  decorators: [
    (story) => html`
      <div style="background: #000; padding: 2rem; min-height: 120px;">${story()}</div>
    `,
  ],
};

// ─────────────────────────────────────────────────
// 4. SYSTEM — Auto-detect from OS preference
// ─────────────────────────────────────────────────

export const SystemDetection: Story = {
  name: 'System Detection',
  args: { system: true },
  render: () => html`
    <hx-theme system>
      <div
        style="
          padding: 1.5rem;
          border: 1px solid var(--hx-color-neutral-200, #e2e8f0);
          border-radius: 0.375rem;
          background: var(--hx-color-surface-default, #fff);
          color: var(--hx-color-text-primary, #0f172a);
          font-family: sans-serif;
        "
      >
        <p style="margin: 0 0 0.5rem; font-weight: 600;">System Theme Detection</p>
        <p style="margin: 0; color: var(--hx-color-neutral-600, #475569); font-size: 0.875rem;">
          This theme provider auto-detects your OS color scheme preference via
          <code>prefers-color-scheme</code> and applies the matching tokens.
        </p>
      </div>
    </hx-theme>
  `,
};

// ─────────────────────────────────────────────────
// 5. THEME SWITCHER DEMO
// ─────────────────────────────────────────────────

export const ThemeSwitcherDemo: Story = {
  name: 'Theme Switcher Demo',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 560px;">
      <hx-theme theme="light" id="demo-switcher-theme">
        <div
          style="
            padding: 1.5rem;
            border: 1px solid var(--hx-color-border-default);
            border-radius: 0.375rem;
            background: var(--hx-color-surface-default);
            color: var(--hx-color-text-primary);
            font-family: var(--hx-font-family-sans, sans-serif);
          "
        >
          <p style="margin: 0 0 0.5rem; font-weight: 600;">Themed Content</p>
          <p style="margin: 0; color: var(--hx-color-primary-500);">
            Primary color — updates when you switch theme
          </p>
          <p
            style="margin: 0.5rem 0 0; font-size: 0.875rem; color: var(--hx-color-text-secondary);"
          >
            Shadow: <code>var(--hx-shadow-sm)</code>
          </p>
        </div>
      </hx-theme>

      <div style="display: flex; gap: 0.5rem;">
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; cursor: pointer;"
          @click=${() => {
            const t = document.getElementById('demo-switcher-theme') as HelixTheme;
            if (t) t.theme = 'light';
          }}
        >
          Light
        </button>
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; cursor: pointer;"
          @click=${() => {
            const t = document.getElementById('demo-switcher-theme') as HelixTheme;
            if (t) t.theme = 'dark';
          }}
        >
          Dark
        </button>
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; cursor: pointer;"
          @click=${() => {
            const t = document.getElementById('demo-switcher-theme') as HelixTheme;
            if (t) t.theme = 'high-contrast';
          }}
        >
          High Contrast
        </button>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. SIDE-BY-SIDE COMPARISON
// ─────────────────────────────────────────────────

export const SideBySide: Story = {
  name: 'All Themes Side-by-Side',
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #6b7280;"
        >
          Light
        </p>
        <hx-theme theme="light">
          <div
            style="
              padding: 1rem;
              border: 1px solid var(--hx-color-border-default);
              border-radius: 0.375rem;
              background: var(--hx-color-surface-default);
              color: var(--hx-color-text-primary);
              font-family: var(--hx-font-family-sans, sans-serif);
              font-size: 0.875rem;
            "
          >
            <p style="margin: 0; color: var(--hx-color-primary-500);">Primary color</p>
            <p style="margin: 0.25rem 0 0; color: var(--hx-color-text-secondary);">
              Secondary text
            </p>
          </div>
        </hx-theme>
      </div>

      <div style="background: #1a1a2e; padding: 0.5rem; border-radius: 0.375rem;">
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #9ca3af;"
        >
          Dark
        </p>
        <hx-theme theme="dark">
          <div
            style="
              padding: 1rem;
              border: 1px solid var(--hx-color-border-default);
              border-radius: 0.375rem;
              background: var(--hx-color-surface-default);
              color: var(--hx-color-text-primary);
              font-family: var(--hx-font-family-sans, sans-serif);
              font-size: 0.875rem;
            "
          >
            <p style="margin: 0; color: var(--hx-color-primary-400);">Primary color</p>
            <p style="margin: 0.25rem 0 0; color: var(--hx-color-text-secondary);">
              Secondary text
            </p>
          </div>
        </hx-theme>
      </div>

      <div style="background: #000; padding: 0.5rem; border-radius: 0.375rem;">
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #9ca3af;"
        >
          High Contrast
        </p>
        <hx-theme theme="high-contrast">
          <div
            style="
              padding: 1rem;
              border: 1px solid var(--hx-color-border-default);
              border-radius: 0.375rem;
              background: var(--hx-color-surface-default);
              color: var(--hx-color-text-primary);
              font-family: var(--hx-font-family-sans, sans-serif);
              font-size: 0.875rem;
            "
          >
            <p style="margin: 0; color: var(--hx-color-text-link);">Primary link color (yellow)</p>
            <p style="margin: 0.25rem 0 0; color: var(--hx-color-text-secondary);">
              Secondary text
            </p>
          </div>
        </hx-theme>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. NESTED THEME SCOPING
// ─────────────────────────────────────────────────

export const NestedThemes: Story = {
  name: 'Nested Theme Scoping',
  render: () => html`
    <hx-theme theme="light">
      <div
        style="
          padding: 1.5rem;
          border: 1px solid var(--hx-color-border-default);
          background: var(--hx-color-surface-default);
          color: var(--hx-color-text-primary);
          font-family: var(--hx-font-family-sans, sans-serif);
          border-radius: 0.5rem;
        "
      >
        <p style="margin: 0 0 1rem; font-weight: 600;">Light page (outer hx-theme)</p>
        <p style="margin: 0 0 1rem; color: var(--hx-color-text-secondary); font-size: 0.875rem;">
          The sidebar below is wrapped in a nested <code>&lt;hx-theme theme="dark"&gt;</code>,
          scoping dark tokens to just that subtree.
        </p>

        <hx-theme theme="dark">
          <aside
            style="
              padding: 1rem;
              border: 1px solid var(--hx-color-border-default);
              background: var(--hx-color-surface-default);
              color: var(--hx-color-text-primary);
              border-radius: 0.375rem;
            "
          >
            <p style="margin: 0; font-weight: 600;">Dark sidebar (nested hx-theme)</p>
            <p
              style="margin: 0.5rem 0 0; color: var(--hx-color-text-secondary); font-size: 0.875rem;"
            >
              Tokens are scoped to this subtree. The outer light tokens remain unaffected.
            </p>
          </aside>
        </hx-theme>
      </div>
    </hx-theme>
  `,
};
