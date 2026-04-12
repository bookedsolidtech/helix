import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-style-scope.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Utilities/StyleScope',
  component: 'hx-style-scope',
  tags: ['autodocs'],
  argTypes: {
    component: {
      control: 'text',
      description:
        'The component tag name whose light DOM styles should be injected. Must match a registered component name (e.g. "hx-card"). Sets `data-hx-styled` on the element for scoped CSS selector resolution.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    'light-css': {
      control: 'text',
      description:
        'Raw CSS to inject as scoped light DOM styles. When provided alongside `component`, the CSS is scoped under `[data-hx-styled="component"]` and injected into `document.head` once per component type.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    component: 'hx-card',
    'light-css': '',
  },
  render: (args) => html`
    <hx-style-scope component=${args.component} light-css=${args['light-css'] || ''}>
      <p>Slotted content receiving scoped styles for <code>${args.component}</code>.</p>
    </hx-style-scope>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// 1. DEFAULT — basic usage with component attribute
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => html`
    <div>
      <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
        The <code>&lt;hx-style-scope&gt;</code> wraps light DOM content and applies scoped styles.
        It renders as <code>display: contents</code> so it does not affect layout.
      </p>
      <hx-style-scope component="hx-card">
        <p>This paragraph is wrapped by hx-style-scope targeting hx-card styles.</p>
      </hx-style-scope>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-style-scope');
    await expect(el).toBeTruthy();
    await expect(el?.getAttribute('data-hx-styled')).toBe('hx-card');
    await expect(el?.getAttribute('component')).toBe('hx-card');
  },
};

// ─────────────────────────────────────────────────
// 2. WITH LIGHT CSS — injecting custom scoped styles
// ─────────────────────────────────────────────────

export const WithLightCss: Story = {
  args: {
    component: 'hx-card',
    'light-css': 'p { color: #007878; font-weight: 600; }',
  },
  render: (args) => html`
    <div>
      <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
        When <code>light-css</code> is provided, the CSS is scoped and injected into
        <code>document.head</code> once per component type.
      </p>
      <hx-style-scope component=${args.component} light-css=${args['light-css'] || ''}>
        <p>This content receives injected light DOM styles.</p>
        <p>Multiple children are all affected by the scoped styles.</p>
      </hx-style-scope>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-style-scope');
    await expect(el).toBeTruthy();
    await expect(el?.getAttribute('data-hx-styled')).toBe('hx-card');
    await expect(el?.getAttribute('light-css')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 3. NO COMPONENT — empty state without component attr
// ─────────────────────────────────────────────────

export const NoComponent: Story = {
  args: {
    component: '',
    'light-css': '',
  },
  render: () => html`
    <div>
      <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
        Without a <code>component</code> attribute, hx-style-scope acts as a transparent pass-through.
        No <code>data-hx-styled</code> attribute is set and no styles are injected.
      </p>
      <hx-style-scope>
        <p>This content passes through without any scoped styles applied.</p>
      </hx-style-scope>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-style-scope');
    await expect(el).toBeTruthy();
    await expect(el?.hasAttribute('data-hx-styled')).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 4. DISPLAY CONTENTS — layout transparency demo
// ─────────────────────────────────────────────────

export const DisplayContents: Story = {
  render: () => html`
    <div>
      <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
        The element renders as <code>display: contents</code>, so it does not create a box in the
        layout. Children lay out as if the wrapper were absent.
      </p>
      <div
        style="display: flex; gap: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.375rem;"
      >
        <div
          style="padding: 0.75rem; background: #f0f4f8; border-radius: 0.25rem; flex: 1; text-align: center;"
        >
          Before
        </div>
        <hx-style-scope component="hx-card">
          <div
            style="padding: 0.75rem; background: #e0f2fe; border-radius: 0.25rem; flex: 1; text-align: center;"
          >
            Inside hx-style-scope
          </div>
        </hx-style-scope>
        <div
          style="padding: 0.75rem; background: #f0f4f8; border-radius: 0.25rem; flex: 1; text-align: center;"
        >
          After
        </div>
      </div>
      <p style="color: #6b7280; font-size: 0.75rem; margin-top: 0.5rem;">
        All three items participate equally in the flex layout despite the middle one being wrapped.
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-style-scope');
    await expect(el).toBeTruthy();
    const style = getComputedStyle(el!);
    await expect(style.display).toBe('contents');
  },
};

// ─────────────────────────────────────────────────
// 5. DRUPAL TWIG — realistic Drupal integration example
// ─────────────────────────────────────────────────

export const DrupalIntegration: Story = {
  render: () => html`
    <div>
      <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
        In Drupal Twig templates, slotted content lives in the light DOM and cannot inherit Shadow
        DOM styles. <code>hx-style-scope</code> bridges this gap by injecting scoped styles into the
        document head.
      </p>
      <div
        style="font-family: monospace; font-size: 0.8rem; background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.375rem; margin-bottom: 1rem; white-space: pre; overflow-x: auto;"
      >
        &lt;hx-style-scope component="hx-card"&gt;
        {{ content }}
        &lt;/hx-style-scope&gt;</div
      >
      <hx-style-scope component="hx-card">
        <div
          style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; background: white;"
        >
          <h3 style="margin: 0 0 0.5rem;">Patient Record</h3>
          <p style="margin: 0; color: #6b7280;">
            This content simulates Drupal-rendered markup inside an hx-style-scope wrapper.
          </p>
        </div>
      </hx-style-scope>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-style-scope');
    await expect(el).toBeTruthy();
    await expect(el?.getAttribute('data-hx-styled')).toBe('hx-card');
    const slot = el?.shadowRoot?.querySelector('slot');
    await expect(slot).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 6. MULTIPLE COMPONENTS — different scoping targets
// ─────────────────────────────────────────────────

export const MultipleComponents: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <p style="color: #6b7280; font-size: 0.875rem;">
        Multiple hx-style-scope elements can target different components on the same page, each
        injecting their respective scoped styles independently.
      </p>
      <hx-style-scope component="hx-card">
        <div
          style="padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; background: #f0f4f8;"
        >
          Scoped to <code>hx-card</code>
        </div>
      </hx-style-scope>
      <hx-style-scope component="hx-alert">
        <div
          style="padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; background: #fef3c7;"
        >
          Scoped to <code>hx-alert</code>
        </div>
      </hx-style-scope>
      <hx-style-scope component="hx-button">
        <div
          style="padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; background: #e0f2fe;"
        >
          Scoped to <code>hx-button</code>
        </div>
      </hx-style-scope>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const elements = canvasElement.querySelectorAll('hx-style-scope');
    await expect(elements.length).toBe(3);
    await expect(elements[0]?.getAttribute('data-hx-styled')).toBe('hx-card');
    await expect(elements[1]?.getAttribute('data-hx-styled')).toBe('hx-alert');
    await expect(elements[2]?.getAttribute('data-hx-styled')).toBe('hx-button');
  },
};
