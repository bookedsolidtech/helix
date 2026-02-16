import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import './hx-container.js';
import '../hx-card/hx-card.js';
import '../hx-alert/hx-alert.js';

// ─── Helper ───

/** Reusable label showing the current width/padding configuration. */
const configLabel = (width: string, padding?: string) => {
  const parts = [`width="${width}"`];
  if (padding) parts.push(`padding="${padding}"`);
  return parts.join(' ');
};

// ─── Meta ───

const meta = {
  title: 'Layout/Container',
  component: 'hx-container',
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: { type: 'select' },
      options: ['full', 'content', 'narrow', 'sm', 'md', 'lg', 'xl'],
      description: 'Controls the max-width of the inner content wrapper.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'content' },
        type: { summary: "'full' | 'content' | 'narrow' | 'sm' | 'md' | 'lg' | 'xl'" },
      },
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Vertical padding applied to the outer wrapper.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'none' },
        type: { summary: "'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'" },
      },
    },
  },
  args: {
    width: 'content',
    padding: 'none',
  },
  render: (args) => html`
    <hx-container width=${args.width} padding=${args.padding} style="--hx-container-bg: #f0f4f8;">
      <p style="margin: 0; line-height: 1.6;">
        Helix Container constrains content to a maximum width while centering it horizontally with
        consistent gutters. This layout primitive is the foundation for page structure in healthcare
        portal interfaces.
      </p>
    </hx-container>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <hx-container width=${args.width} padding=${args.padding} style="--hx-container-bg: #f0f4f8;">
      <p style="margin: 0; line-height: 1.6;">
        This is the default container using the <code>content</code> width preset (72rem). It
        constrains content to a comfortable width while centering it horizontally with automatic
        margins and consistent horizontal gutters. Ideal for general page content in clinical
        dashboards and patient portal views.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const container = canvasElement.querySelector('hx-container');
    expect(container).toBeTruthy();
    expect(container?.getAttribute('width')).toBe('content');
    expect(container?.getAttribute('padding')).toBe('none');

    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner).toBeTruthy();
    expect(inner?.classList.contains('container__inner')).toBe(true);
    expect(inner?.classList.contains('container__inner--content')).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY WIDTH — Individual Exports
// ─────────────────────────────────────────────────

export const WidthFull: Story = {
  name: 'Width: full',
  args: { width: 'full' },
  render: (args) => html`
    <hx-container width=${args.width} style="--hx-container-bg: #e3f2fd;">
      <p style="margin: 0;">
        <strong>full</strong> -- No max-width constraint. Content spans the entire viewport width.
        Use for hero sections, full-bleed banners, and department-wide notification bars.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner?.classList.contains('container__inner--full')).toBe(true);
  },
};

export const WidthXl: Story = {
  name: 'Width: xl',
  args: { width: 'xl' },
  render: (args) => html`
    <hx-container width=${args.width} style="--hx-container-bg: #e8f5e9;">
      <p style="margin: 0;">
        <strong>xl (1280px)</strong> -- Wide layout for complex clinical dashboards, multi-column
        patient charts, and administrative data tables that require maximum horizontal real estate.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner?.classList.contains('container__inner--xl')).toBe(true);
  },
};

export const WidthLg: Story = {
  name: 'Width: lg',
  args: { width: 'lg' },
  render: (args) => html`
    <hx-container width=${args.width} style="--hx-container-bg: #fff3e0;">
      <p style="margin: 0;">
        <strong>lg (1024px)</strong> -- Standard page content width. Suitable for most clinical
        workflow views, patient intake forms, and department landing pages.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner?.classList.contains('container__inner--lg')).toBe(true);
  },
};

export const WidthContent: Story = {
  name: 'Width: content',
  args: { width: 'content' },
  render: (args) => html`
    <hx-container width=${args.width} style="--hx-container-bg: #fce4ec;">
      <p style="margin: 0;">
        <strong>content (72rem)</strong> -- The default. General-purpose content width appropriate
        for mixed layouts combining text, cards, and data visualization in clinical portals.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner?.classList.contains('container__inner--content')).toBe(true);
  },
};

export const WidthMd: Story = {
  name: 'Width: md',
  args: { width: 'md' },
  render: (args) => html`
    <hx-container width=${args.width} style="--hx-container-bg: #f3e5f5;">
      <p style="margin: 0;">
        <strong>md (768px)</strong> -- Medium width for focused content. Ideal for patient
        registration forms, appointment scheduling dialogs, and consent forms requiring careful
        reading.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner?.classList.contains('container__inner--md')).toBe(true);
  },
};

export const WidthSm: Story = {
  name: 'Width: sm',
  args: { width: 'sm' },
  render: (args) => html`
    <hx-container width=${args.width} style="--hx-container-bg: #e0f7fa;">
      <p style="margin: 0;">
        <strong>sm (640px)</strong> -- Narrow container for login panels, password reset flows,
        single-field search forms, and other constrained UI patterns.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner?.classList.contains('container__inner--sm')).toBe(true);
  },
};

export const WidthNarrow: Story = {
  name: 'Width: narrow (prose)',
  args: { width: 'narrow' },
  render: (args) => html`
    <hx-container width=${args.width} style="--hx-container-bg: #fff9c4;">
      <p style="margin: 0; line-height: 1.7;">
        <strong>narrow (48rem)</strong> -- Optimized for long-form reading. Clinical guidelines,
        patient education materials, informed consent documents, and discharge instructions benefit
        from this constrained measure that keeps line lengths within the 50-75 character ideal range
        for comfortable reading.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner?.classList.contains('container__inner--narrow')).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 3. EVERY PADDING — Individual Exports
// ─────────────────────────────────────────────────

export const PaddingNone: Story = {
  name: 'Padding: none',
  args: { padding: 'none' },
  render: (args) => html`
    <hx-container padding=${args.padding} style="--hx-container-bg: #e3f2fd;">
      <p style="margin: 0;">
        <strong>none</strong> -- No vertical padding. Used when the container is a structural
        wrapper only, such as inline content sections within a larger padded region.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container?.getAttribute('padding')).toBe('none');
  },
};

export const PaddingSm: Story = {
  name: 'Padding: sm',
  args: { padding: 'sm' },
  render: (args) => html`
    <hx-container padding=${args.padding} style="--hx-container-bg: #e8f5e9;">
      <p style="margin: 0;">
        <strong>sm (1.5rem)</strong> -- Subtle vertical spacing. Appropriate for compact
        notification bars, secondary navigation strips, and dense data display regions in clinical
        dashboards.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container?.getAttribute('padding')).toBe('sm');
  },
};

export const PaddingMd: Story = {
  name: 'Padding: md',
  args: { padding: 'md' },
  render: (args) => html`
    <hx-container padding=${args.padding} style="--hx-container-bg: #fff3e0;">
      <p style="margin: 0;">
        <strong>md (3rem)</strong> -- Standard section spacing. The workhorse padding for separating
        content blocks, form sections, and card grids across the portal.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container?.getAttribute('padding')).toBe('md');
  },
};

export const PaddingLg: Story = {
  name: 'Padding: lg',
  args: { padding: 'lg' },
  render: (args) => html`
    <hx-container padding=${args.padding} style="--hx-container-bg: #fce4ec;">
      <p style="margin: 0;">
        <strong>lg (4rem)</strong> -- Generous section spacing. Ideal for separating major page
        sections, feature showcases, and visually distinct content blocks.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container?.getAttribute('padding')).toBe('lg');
  },
};

export const PaddingXl: Story = {
  name: 'Padding: xl',
  args: { padding: 'xl' },
  render: (args) => html`
    <hx-container padding=${args.padding} style="--hx-container-bg: #f3e5f5;">
      <p style="margin: 0;">
        <strong>xl (6rem)</strong> -- Hero-level spacing. Used for landing page hero sections,
        call-to-action areas, and department welcome banners.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container?.getAttribute('padding')).toBe('xl');
  },
};

export const Padding2xl: Story = {
  name: 'Padding: 2xl',
  args: { padding: '2xl' },
  render: (args) => html`
    <hx-container padding=${args.padding} style="--hx-container-bg: #e0f7fa;">
      <p style="margin: 0;">
        <strong>2xl (8rem)</strong> -- Maximum emphasis spacing. Reserved for full-page hero
        sections, onboarding welcome screens, and high-impact marketing areas in patient-facing
        portals.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container?.getAttribute('padding')).toBe('2xl');
  },
};

// ─────────────────────────────────────────────────
// 4. SPECIAL MODES
// ─────────────────────────────────────────────────

export const FullBleed: Story = {
  render: () => html`
    <hx-container width="full" padding="xl" style="--hx-container-bg: #1a237e;">
      <div style="text-align: center; color: #ffffff;">
        <h1 style="margin: 0 0 1rem 0; font-size: 2.5rem; font-weight: 700;">
          Welcome to the Patient Portal
        </h1>
        <p
          style="margin: 0; font-size: 1.25rem; opacity: 0.9; max-width: 40rem; margin-left: auto; margin-right: auto;"
        >
          Access your health records, schedule appointments, and communicate with your care team --
          all in one secure location.
        </p>
      </div>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container?.getAttribute('width')).toBe('full');
    expect(container?.getAttribute('padding')).toBe('xl');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner?.classList.contains('container__inner--full')).toBe(true);
  },
};

export const ProseWidth: Story = {
  render: () => html`
    <hx-container width="narrow" padding="lg" style="--hx-container-bg: #fafafa;">
      <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">Patient Discharge Instructions</h2>
      <p style="margin: 0 0 1rem 0; line-height: 1.8;">
        Following your procedure, it is important to rest for at least 24 hours. Avoid strenuous
        physical activity, heavy lifting, or driving until cleared by your physician. Take all
        prescribed medications as directed, and contact the clinic immediately if you experience
        fever above 101.3F, excessive bleeding, or unusual swelling at the procedure site.
      </p>
      <p style="margin: 0; line-height: 1.8;">
        Your follow-up appointment is scheduled for two weeks from today. Please bring a list of all
        current medications, including over-the-counter supplements, to that visit. If you need to
        reschedule, call the scheduling office at least 48 hours in advance.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container?.getAttribute('width')).toBe('narrow');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner?.classList.contains('container__inner--narrow')).toBe(true);
  },
};

export const Centered: Story = {
  render: () => html`
    <div
      style="background: repeating-linear-gradient(90deg, #f0f0f0 0px, #f0f0f0 1px, transparent 1px, transparent 100px); min-height: 200px;"
    >
      <hx-container
        width="md"
        padding="lg"
        style="--hx-container-bg: rgba(25, 118, 210, 0.08); border: 2px dashed #1976d2;"
      >
        <p style="margin: 0; text-align: center; color: #1976d2; font-weight: 500;">
          This container is centered within its parent. The <code>auto</code>
          horizontal margins on the inner wrapper ensure consistent centering regardless of the
          parent width.
        </p>
      </hx-container>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner).toBeTruthy();
    const style = getComputedStyle(inner!);
    expect(style.marginLeft).toBe(style.marginRight);
  },
};

// ─────────────────────────────────────────────────
// 5. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllWidths: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <hx-container width="sm" style="--hx-container-bg: #e0f7fa;">
        <p style="margin: 0;"><strong>sm</strong> -- 640px max</p>
      </hx-container>
      <hx-container width="md" style="--hx-container-bg: #f3e5f5;">
        <p style="margin: 0;"><strong>md</strong> -- 768px max</p>
      </hx-container>
      <hx-container width="narrow" style="--hx-container-bg: #fff9c4;">
        <p style="margin: 0;"><strong>narrow</strong> -- 48rem max</p>
      </hx-container>
      <hx-container width="lg" style="--hx-container-bg: #fff3e0;">
        <p style="margin: 0;"><strong>lg</strong> -- 1024px max</p>
      </hx-container>
      <hx-container width="content" style="--hx-container-bg: #fce4ec;">
        <p style="margin: 0;"><strong>content</strong> -- 72rem max (default)</p>
      </hx-container>
      <hx-container width="xl" style="--hx-container-bg: #e8f5e9;">
        <p style="margin: 0;"><strong>xl</strong> -- 1280px max</p>
      </hx-container>
      <hx-container width="full" style="--hx-container-bg: #e3f2fd;">
        <p style="margin: 0;"><strong>full</strong> -- no max-width constraint</p>
      </hx-container>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');
    expect(containers.length).toBe(7);
    const widths = ['sm', 'md', 'narrow', 'lg', 'content', 'xl', 'full'];
    containers.forEach((el, i) => {
      expect(el.getAttribute('width')).toBe(widths[i]);
    });
  },
};

export const AllPaddings: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2px;">
      <hx-container padding="none" style="--hx-container-bg: #e3f2fd;">
        <div style="background: rgba(25, 118, 210, 0.15); padding: 0.5rem; text-align: center;">
          <strong>none</strong> -- 0 vertical padding
        </div>
      </hx-container>
      <hx-container padding="sm" style="--hx-container-bg: #e8f5e9;">
        <div style="background: rgba(46, 125, 50, 0.15); padding: 0.5rem; text-align: center;">
          <strong>sm</strong> -- 1.5rem vertical padding
        </div>
      </hx-container>
      <hx-container padding="md" style="--hx-container-bg: #fff3e0;">
        <div style="background: rgba(230, 126, 34, 0.15); padding: 0.5rem; text-align: center;">
          <strong>md</strong> -- 3rem vertical padding
        </div>
      </hx-container>
      <hx-container padding="lg" style="--hx-container-bg: #fce4ec;">
        <div style="background: rgba(198, 40, 40, 0.15); padding: 0.5rem; text-align: center;">
          <strong>lg</strong> -- 4rem vertical padding
        </div>
      </hx-container>
      <hx-container padding="xl" style="--hx-container-bg: #f3e5f5;">
        <div style="background: rgba(123, 31, 162, 0.15); padding: 0.5rem; text-align: center;">
          <strong>xl</strong> -- 6rem vertical padding
        </div>
      </hx-container>
      <hx-container padding="2xl" style="--hx-container-bg: #e0f7fa;">
        <div style="background: rgba(0, 131, 143, 0.15); padding: 0.5rem; text-align: center;">
          <strong>2xl</strong> -- 8rem vertical padding
        </div>
      </hx-container>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');
    expect(containers.length).toBe(6);
    const paddings = ['none', 'sm', 'md', 'lg', 'xl', '2xl'];
    containers.forEach((el, i) => {
      expect(el.getAttribute('padding')).toBe(paddings[i]);
    });
  },
};

export const WidthPaddingMatrix: Story = {
  render: () => {
    const widths = ['sm', 'md', 'lg', 'content', 'xl'] as const;
    const paddings = ['none', 'sm', 'md', 'lg'] as const;
    const colors: Record<string, string> = {
      sm: '#e0f7fa',
      md: '#f3e5f5',
      lg: '#fff3e0',
      content: '#fce4ec',
      xl: '#e8f5e9',
    };

    return html`
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${widths.map(
          (w) => html`
            <div>
              <p
                style="margin: 0 0 0.25rem 1.5rem; font-weight: 600; font-size: 0.875rem; color: #546e7a;"
              >
                width="${w}"
              </p>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                ${paddings.map(
                  (p) => html`
                    <hx-container width=${w} padding=${p} style="--hx-container-bg: ${colors[w]};">
                      <div
                        style="background: rgba(0,0,0,0.06); padding: 0.25rem 0.5rem; font-size: 0.8125rem; border-radius: 4px;"
                      >
                        ${configLabel(w, p)}
                      </div>
                    </hx-container>
                  `,
                )}
              </div>
            </div>
          `,
        )}
      </div>
    `;
  },
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');
    // 5 widths x 4 paddings = 20 combinations
    expect(containers.length).toBe(20);
  },
};

// ─────────────────────────────────────────────────
// 6. COMPOSITION
// ─────────────────────────────────────────────────

export const NestedContainers: Story = {
  render: () => html`
    <hx-container width="full" padding="lg" style="--hx-container-bg: #eceff1;">
      <p style="margin: 0 0 1rem 0; text-align: center; color: #546e7a; font-size: 0.875rem;">
        <strong>Outer:</strong> <code>width="full"</code>
      </p>
      <hx-container width="lg" padding="md" style="--hx-container-bg: #cfd8dc;">
        <p style="margin: 0 0 1rem 0; text-align: center; color: #37474f; font-size: 0.875rem;">
          <strong>Middle:</strong> <code>width="lg"</code>
        </p>
        <hx-container
          width="md"
          padding="sm"
          style="--hx-container-bg: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);"
        >
          <p style="margin: 0; text-align: center;">
            <strong>Inner:</strong> <code>width="md"</code> -- This three-layer nesting pattern is
            common for full-bleed backgrounds that contain progressively narrower content areas.
          </p>
        </hx-container>
      </hx-container>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const allContainers = canvasElement.querySelectorAll('hx-container');
    expect(allContainers.length).toBe(3);
    expect(allContainers[0].getAttribute('width')).toBe('full');
    expect(allContainers[1].getAttribute('width')).toBe('lg');
    expect(allContainers[2].getAttribute('width')).toBe('md');

    // Verify each has a rendered inner part
    allContainers.forEach((el) => {
      const inner = el.shadowRoot?.querySelector('[part="inner"]');
      expect(inner).toBeTruthy();
    });
  },
};

export const WithCards: Story = {
  render: () => html`
    <hx-container width="lg" padding="lg" style="--hx-container-bg: #fafafa;">
      <h2 style="margin: 0 0 1.5rem 0; font-size: 1.5rem; font-weight: 600;">Clinical Services</h2>
      <div
        style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;"
      >
        <hx-card elevation="raised">
          <span slot="heading">Primary Care</span>
          Annual physicals, preventive screenings, chronic disease management, and referral
          coordination for specialized care.
        </hx-card>
        <hx-card elevation="raised">
          <span slot="heading">Cardiology</span>
          Comprehensive cardiac diagnostics including echocardiography, stress testing, Holter
          monitoring, and interventional procedures.
        </hx-card>
        <hx-card elevation="raised">
          <span slot="heading">Laboratory Services</span>
          Full-service clinical laboratory with rapid turnaround for complete blood counts,
          metabolic panels, and specialized assays.
        </hx-card>
        <hx-card elevation="raised">
          <span slot="heading">Pharmacy</span>
          On-site pharmacy with prescription filling, medication therapy management, and patient
          counseling services.
        </hx-card>
      </div>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container).toBeTruthy();
    const cards = canvasElement.querySelectorAll('hx-card');
    expect(cards.length).toBe(4);
  },
};

export const WithAlerts: Story = {
  render: () => html`
    <hx-container width="lg" padding="md" style="--hx-container-bg: #ffffff;">
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <hx-alert variant="info">
          Your annual wellness visit is due. Schedule your appointment today to stay current on
          preventive screenings.
        </hx-alert>
        <hx-alert variant="success">
          Lab results from your visit on February 10 are now available. All values are within the
          normal reference range.
        </hx-alert>
        <hx-alert variant="warning">
          Your prescription for Lisinopril 10mg requires renewal before March 1. Contact your
          provider or use the portal refill feature.
        </hx-alert>
        <hx-alert variant="error">
          An allergy to Penicillin is recorded in your chart. Confirm or update this information at
          your next visit.
        </hx-alert>
      </div>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container).toBeTruthy();
    const alerts = canvasElement.querySelectorAll('hx-alert');
    expect(alerts.length).toBe(4);
  },
};

export const PageLayout: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column;">
      <!-- Hero: full bleed -->
      <hx-container width="full" padding="xl" style="--hx-container-bg: #0d47a1;">
        <div style="text-align: center; color: #ffffff;">
          <h1 style="margin: 0 0 0.75rem 0; font-size: 2.25rem; font-weight: 700;">
            Department of Cardiology
          </h1>
          <p style="margin: 0; font-size: 1.125rem; opacity: 0.85;">
            Comprehensive cardiac care for patients of all ages.
          </p>
        </div>
      </hx-container>

      <!-- Content: lg width -->
      <hx-container width="lg" padding="lg" style="--hx-container-bg: #ffffff;">
        <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">Our Services</h2>
        <div
          style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;"
        >
          <hx-card>
            <span slot="heading">Echocardiography</span>
            Non-invasive ultrasound imaging of the heart for structural and functional assessment.
          </hx-card>
          <hx-card>
            <span slot="heading">Cardiac Catheterization</span>
            Diagnostic and interventional procedures for coronary artery disease.
          </hx-card>
          <hx-card>
            <span slot="heading">Electrophysiology</span>
            Diagnosis and treatment of heart rhythm disorders including ablation and device
            implantation.
          </hx-card>
        </div>
      </hx-container>

      <!-- Reading: narrow prose width -->
      <hx-container width="narrow" padding="lg" style="--hx-container-bg: #f5f5f5;">
        <h3 style="margin: 0 0 0.75rem 0; font-size: 1.25rem;">Patient Information</h3>
        <p style="margin: 0 0 1rem 0; line-height: 1.7;">
          If you have been referred to our department, please bring your insurance card, a photo ID,
          and any relevant medical records to your first appointment. Arrive 15 minutes early to
          complete the intake process and verify your demographic information.
        </p>
        <p style="margin: 0; line-height: 1.7;">
          For questions about scheduling, insurance coverage, or preparation for specific
          procedures, please contact our office during regular business hours. Emergency cardiac
          concerns should be directed to the nearest emergency department or call 911.
        </p>
      </hx-container>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');
    expect(containers.length).toBe(3);
    expect(containers[0].getAttribute('width')).toBe('full');
    expect(containers[1].getAttribute('width')).toBe('lg');
    expect(containers[2].getAttribute('width')).toBe('narrow');
  },
};

export const WithBackground: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2px;">
      <hx-container padding="lg" style="--hx-container-bg: #e8f5e9;">
        <p style="margin: 0;">
          <strong>Success context:</strong> Light green background for positive status, confirmed
          appointments, and successful lab results.
        </p>
      </hx-container>

      <hx-container padding="lg" style="--hx-container-bg: #fff3e0;">
        <p style="margin: 0;">
          <strong>Warning context:</strong> Light amber background for pending actions, upcoming
          deadlines, and items requiring patient attention.
        </p>
      </hx-container>

      <hx-container padding="lg" style="--hx-container-bg: #fce4ec;">
        <p style="margin: 0;">
          <strong>Critical context:</strong> Light red background for critical alerts, overdue
          items, and patient safety notifications.
        </p>
      </hx-container>

      <hx-container padding="lg" style="--hx-container-bg: #e3f2fd;">
        <p style="margin: 0;">
          <strong>Informational context:</strong> Light blue background for general announcements,
          system updates, and educational content.
        </p>
      </hx-container>

      <hx-container padding="lg" style="--hx-container-bg: #f5f5f5;">
        <p style="margin: 0;">
          <strong>Neutral context:</strong> Light gray background for secondary content, supporting
          information, and muted sections.
        </p>
      </hx-container>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. EDGE CASES
// ─────────────────────────────────────────────────

export const EmptyContainer: Story = {
  render: () => html`
    <hx-container
      width="md"
      padding="md"
      style="--hx-container-bg: #f0f4f8; border: 1px dashed #90a4ae;"
    ></hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container).toBeTruthy();
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner).toBeTruthy();
    // Container renders even with no slotted content
    const slot = inner?.querySelector('slot');
    expect(slot).toBeTruthy();
  },
};

export const OverflowContent: Story = {
  render: () => html`
    <hx-container width="sm" padding="md" style="--hx-container-bg: #f0f4f8;">
      <p style="margin: 0 0 1rem 0; font-weight: 600;">
        Overflow behavior with a wide data table in a narrow container:
      </p>
      <div style="overflow-x: auto;">
        <table style="width: 800px; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="background: #e3f2fd;">
              <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #90caf9;">
                Patient ID
              </th>
              <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #90caf9;">
                Name
              </th>
              <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #90caf9;">
                Date of Birth
              </th>
              <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #90caf9;">
                Primary Diagnosis
              </th>
              <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #90caf9;">
                Provider
              </th>
              <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #90caf9;">
                Next Appointment
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">MRN-10042</td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">Thompson, R.</td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">1958-03-14</td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">
                Hypertension, Stage 2
              </td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">Dr. Patel</td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">2026-03-01</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">MRN-10087</td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">Garcia, M.</td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">1972-11-22</td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">
                Type 2 Diabetes Mellitus
              </td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">Dr. Chen</td>
              <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">2026-02-28</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="margin: 1rem 0 0 0; font-size: 0.8125rem; color: #78909c;">
        The table exceeds the container width. Wrapping it in
        <code>overflow-x: auto</code> ensures horizontal scrolling.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container?.getAttribute('width')).toBe('sm');
    const table = canvasElement.querySelector('table');
    expect(table).toBeTruthy();
  },
};

export const SingleWordContent: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <hx-container width="sm" style="--hx-container-bg: #e0f7fa;">
        <p style="margin: 0; text-align: center;"><strong>sm:</strong> Cardiology</p>
      </hx-container>
      <hx-container width="md" style="--hx-container-bg: #f3e5f5;">
        <p style="margin: 0; text-align: center;"><strong>md:</strong> Radiology</p>
      </hx-container>
      <hx-container width="narrow" style="--hx-container-bg: #fff9c4;">
        <p style="margin: 0; text-align: center;"><strong>narrow:</strong> Pharmacy</p>
      </hx-container>
      <hx-container width="lg" style="--hx-container-bg: #fff3e0;">
        <p style="margin: 0; text-align: center;"><strong>lg:</strong> Oncology</p>
      </hx-container>
      <hx-container width="content" style="--hx-container-bg: #fce4ec;">
        <p style="margin: 0; text-align: center;"><strong>content:</strong> Pediatrics</p>
      </hx-container>
      <hx-container width="xl" style="--hx-container-bg: #e8f5e9;">
        <p style="margin: 0; text-align: center;"><strong>xl:</strong> Emergency</p>
      </hx-container>
      <hx-container width="full" style="--hx-container-bg: #e3f2fd;">
        <p style="margin: 0; text-align: center;"><strong>full:</strong> Administration</p>
      </hx-container>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- --hx-container-bg -->
      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          --hx-container-bg
        </p>
        <hx-container
          padding="md"
          style="--hx-container-bg: linear-gradient(135deg, #1a237e, #283593);"
        >
          <p style="margin: 0; color: #ffffff;">
            Background set to a linear gradient. Accepts any valid CSS background-color or
            background value, enabling solid colors, gradients, and pattern overlays.
          </p>
        </hx-container>
      </div>

      <!-- --hx-container-gutter -->
      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          --hx-container-gutter (custom: 4rem)
        </p>
        <hx-container padding="sm" style="--hx-container-bg: #e8f5e9; --hx-container-gutter: 4rem;">
          <p style="margin: 0;">
            Horizontal gutters increased to 4rem. The default is
            <code>var(--hx-space-6, 1.5rem)</code>. Increasing gutters adds breathing room on wide
            screens while maintaining the same max-width constraint.
          </p>
        </hx-container>
      </div>

      <!-- --hx-container-max-width -->
      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          --hx-container-max-width (override: 500px)
        </p>
        <hx-container
          width="lg"
          padding="sm"
          style="--hx-container-bg: #fff3e0; --hx-container-max-width: 500px;"
        >
          <p style="margin: 0;">
            Even though <code>width="lg"</code> is set (normally 1024px), the
            <code>--hx-container-max-width</code> override constrains this to 500px. Useful for
            one-off layouts without creating a new width variant.
          </p>
        </hx-container>
      </div>

      <!-- --hx-container-content -->
      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          --hx-container-content (custom: 60rem)
        </p>
        <hx-container
          width="content"
          padding="sm"
          style="--hx-container-bg: #fce4ec; --hx-container-content: 60rem;"
        >
          <p style="margin: 0;">
            The <code>content</code> preset max-width adjusted from the default 72rem to 60rem. This
            custom property allows theme-level adjustment of the content width without component
            changes.
          </p>
        </hx-container>
      </div>

      <!-- --hx-container-sm -->
      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          --hx-container-sm (custom: 480px)
        </p>
        <hx-container
          width="sm"
          padding="sm"
          style="--hx-container-bg: #e0f7fa; --hx-container-sm: 480px;"
        >
          <p style="margin: 0;">
            The <code>sm</code> preset narrowed from 640px to 480px via the
            <code>--hx-container-sm</code> custom property.
          </p>
        </hx-container>
      </div>

      <!-- --hx-container-md -->
      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          --hx-container-md (custom: 700px)
        </p>
        <hx-container
          width="md"
          padding="sm"
          style="--hx-container-bg: #f3e5f5; --hx-container-md: 700px;"
        >
          <p style="margin: 0;">
            The <code>md</code> preset adjusted from 768px to 700px via
            <code>--hx-container-md</code>.
          </p>
        </hx-container>
      </div>

      <!-- --hx-container-lg -->
      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          --hx-container-lg (custom: 960px)
        </p>
        <hx-container
          width="lg"
          padding="sm"
          style="--hx-container-bg: #fff9c4; --hx-container-lg: 960px;"
        >
          <p style="margin: 0;">
            The <code>lg</code> preset adjusted from 1024px to 960px via
            <code>--hx-container-lg</code>.
          </p>
        </hx-container>
      </div>

      <!-- --hx-container-xl -->
      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          --hx-container-xl (custom: 1440px)
        </p>
        <hx-container
          width="xl"
          padding="sm"
          style="--hx-container-bg: #e8f5e9; --hx-container-xl: 1440px;"
        >
          <p style="margin: 0;">
            The <code>xl</code> preset widened from 1280px to 1440px via
            <code>--hx-container-xl</code>. Useful for ultra-wide clinical monitoring dashboards.
          </p>
        </hx-container>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');
    expect(containers.length).toBe(8);
    // Verify the override example works
    const overrideContainer = containers[2];
    const inner = overrideContainer.shadowRoot?.querySelector('[part="inner"]');
    expect(inner).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 9. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-container::part(inner) {
        border: 2px dashed #1976d2;
        border-radius: 8px;
        background: rgba(25, 118, 210, 0.04);
      }
    </style>
    <div class="parts-demo" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          ::part(inner) -- The inner wrapper element
        </p>
        <hx-container width="lg" padding="md" style="--hx-container-bg: #f5f5f5;">
          <p style="margin: 0;">
            The <code>::part(inner)</code> selector targets the inner wrapper that constrains
            max-width and applies horizontal gutters. This is the only exposed CSS part. Use it for
            custom borders, backgrounds, or border-radius on the content area without affecting the
            full-width host element.
          </p>
        </hx-container>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.875rem; color: #546e7a;">
          ::part(inner) styled with custom padding and radius
        </p>
        <style>
          .custom-inner hx-container::part(inner) {
            padding: 2.5rem;
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(25, 118, 210, 0.08), rgba(25, 118, 210, 0.02));
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
          }
        </style>
        <div class="custom-inner">
          <hx-container width="md" padding="sm" style="--hx-container-bg: #fafafa;">
            <p style="margin: 0;">
              The inner part receives custom padding (2.5rem), larger border radius (16px), a subtle
              gradient background, and an inset shadow -- all applied from outside the Shadow DOM
              via the
              <code>::part(inner)</code> selector.
            </p>
          </hx-container>
        </div>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');
    expect(containers.length).toBe(2);
    // Verify both containers expose the inner part
    containers.forEach((el) => {
      const inner = el.shadowRoot?.querySelector('[part="inner"]');
      expect(inner).toBeTruthy();
      expect(inner?.getAttribute('part')).toBe('inner');
    });
  },
};

// ─────────────────────────────────────────────────
// 10. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const InteractionWidthVerification: Story = {
  name: 'Interaction: Width Verification',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <hx-container width="sm" style="--hx-container-bg: #e0f7fa;">
        <p style="margin: 0;">sm container for verification</p>
      </hx-container>
      <hx-container width="lg" style="--hx-container-bg: #fff3e0;">
        <p style="margin: 0;">lg container for verification</p>
      </hx-container>
      <hx-container width="full" style="--hx-container-bg: #e3f2fd;">
        <p style="margin: 0;">full container for verification</p>
      </hx-container>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');

    // Verify sm container has correct max-width class
    const smInner = containers[0].shadowRoot?.querySelector('[part="inner"]');
    expect(smInner?.classList.contains('container__inner--sm')).toBe(true);

    // Verify lg container has correct max-width class
    const lgInner = containers[1].shadowRoot?.querySelector('[part="inner"]');
    expect(lgInner?.classList.contains('container__inner--lg')).toBe(true);

    // Verify full container has no max-width constraint class
    const fullInner = containers[2].shadowRoot?.querySelector('[part="inner"]');
    expect(fullInner?.classList.contains('container__inner--full')).toBe(true);

    // Verify all inner parts are accessible
    containers.forEach((el) => {
      const inner = el.shadowRoot?.querySelector('[part="inner"]');
      expect(inner).toBeTruthy();
      expect(inner?.getAttribute('part')).toBe('inner');
    });
  },
};

export const InteractionNestedVerification: Story = {
  name: 'Interaction: Nested Container Verification',
  render: () => html`
    <hx-container width="full" padding="md" style="--hx-container-bg: #eceff1;">
      <hx-container width="lg" padding="sm" style="--hx-container-bg: #cfd8dc;">
        <hx-container width="sm" style="--hx-container-bg: #ffffff;">
          <p style="margin: 0; text-align: center;">Innermost container</p>
        </hx-container>
      </hx-container>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');
    expect(containers.length).toBe(3);

    // Verify correct width attribute on each level
    expect(containers[0].getAttribute('width')).toBe('full');
    expect(containers[1].getAttribute('width')).toBe('lg');
    expect(containers[2].getAttribute('width')).toBe('sm');

    // Verify each container renders its inner part independently
    containers.forEach((el) => {
      const inner = el.shadowRoot?.querySelector('[part="inner"]');
      expect(inner).toBeTruthy();
      expect(inner?.classList.contains('container__inner')).toBe(true);
    });

    // Verify the innermost container class is correct
    const innermostPart = containers[2].shadowRoot?.querySelector('[part="inner"]');
    expect(innermostPart?.classList.contains('container__inner--sm')).toBe(true);
  },
};

export const InteractionPartAccessibility: Story = {
  name: 'Interaction: Part Accessibility',
  render: () => html`
    <hx-container width="content" padding="md" style="--hx-container-bg: #f0f4f8;">
      <p style="margin: 0;">
        Verifying that the <code>inner</code> CSS part is accessible and properly structured for
        external styling in healthcare portal themes.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container).toBeTruthy();

    // Verify Shadow DOM exists
    expect(container?.shadowRoot).toBeTruthy();

    // Verify inner part is present
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner).toBeTruthy();
    expect(inner?.getAttribute('part')).toBe('inner');

    // Verify inner has the correct base class
    expect(inner?.classList.contains('container__inner')).toBe(true);

    // Verify slot is present inside inner
    const slot = inner?.querySelector('slot');
    expect(slot).toBeTruthy();
    // Default slot has no name attribute
    expect(slot?.hasAttribute('name')).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 11. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const HospitalPortalLayout: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column;">
      <!-- Navigation Hero: full width -->
      <hx-container width="full" padding="xl" style="--hx-container-bg: #0d47a1;">
        <div style="text-align: center; color: #ffffff;">
          <h1 style="margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700;">
            Memorial Regional Medical Center
          </h1>
          <p style="margin: 0; font-size: 1rem; opacity: 0.85;">
            Delivering compassionate, evidence-based care since 1952
          </p>
        </div>
      </hx-container>

      <!-- Alert Banner -->
      <hx-container width="full" padding="none" style="--hx-container-bg: #fff3e0;">
        <hx-container width="lg" padding="sm">
          <hx-alert variant="warning">
            Flu season advisory: Walk-in vaccination clinics available Monday through Friday, 8:00
            AM to 4:00 PM at all outpatient locations.
          </hx-alert>
        </hx-container>
      </hx-container>

      <!-- Department Cards: lg width -->
      <hx-container width="lg" padding="lg" style="--hx-container-bg: #ffffff;">
        <h2 style="margin: 0 0 1.5rem 0; font-size: 1.5rem; font-weight: 600;">Our Departments</h2>
        <div
          style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;"
        >
          <hx-card elevation="raised">
            <span slot="heading">Emergency Medicine</span>
            Level I trauma center with 24/7 board-certified emergency physicians, rapid triage, and
            direct admission pathways.
          </hx-card>
          <hx-card elevation="raised">
            <span slot="heading">Cardiology</span>
            Comprehensive cardiac care including catheterization lab, electrophysiology, and cardiac
            rehabilitation programs.
          </hx-card>
          <hx-card elevation="raised">
            <span slot="heading">Orthopedics</span>
            Joint replacement, sports medicine, spine surgery, and physical therapy with same-day
            appointment availability.
          </hx-card>
          <hx-card elevation="raised">
            <span slot="heading">Oncology</span>
            Multidisciplinary cancer care with medical, surgical, and radiation oncology under one
            roof. Clinical trials available.
          </hx-card>
          <hx-card elevation="raised">
            <span slot="heading">Pediatrics</span>
            Child-focused care from newborn through adolescence, including developmental screening
            and immunization services.
          </hx-card>
          <hx-card elevation="raised">
            <span slot="heading">Women's Health</span>
            Obstetrics, gynecology, mammography, and prenatal care with dedicated birthing suites
            and NICU support.
          </hx-card>
        </div>
      </hx-container>

      <!-- Clinical Notes: prose width -->
      <hx-container width="narrow" padding="lg" style="--hx-container-bg: #f5f5f5;">
        <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600;">
          Patient Rights and Responsibilities
        </h3>
        <p style="margin: 0 0 1rem 0; line-height: 1.8;">
          Every patient has the right to receive respectful, considerate care regardless of age,
          gender, race, national origin, religion, sexual orientation, or disability. You have the
          right to know the names and roles of all healthcare providers involved in your care, to
          receive complete information about your diagnosis and treatment options, and to
          participate in decisions about your care plan.
        </p>
        <p style="margin: 0; line-height: 1.8;">
          As a patient, you are responsible for providing accurate and complete health history
          information, following the treatment plan agreed upon with your care team, and treating
          hospital staff and other patients with courtesy and respect. Please inform your nurse if
          you have any concerns about your care or safety.
        </p>
      </hx-container>

      <!-- Footer: full width -->
      <hx-container width="full" padding="md" style="--hx-container-bg: #263238;">
        <hx-container width="lg">
          <div style="color: #b0bec5; font-size: 0.875rem; text-align: center;">
            <p style="margin: 0;">
              Memorial Regional Medical Center -- 1200 Healthcare Drive, Suite 100 -- Licensed by
              the State Department of Health
            </p>
          </div>
        </hx-container>
      </hx-container>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');
    // Hero (full) + Alert outer (full) + Alert inner (lg) + Departments (lg)
    // + Clinical notes (narrow) + Footer outer (full) + Footer inner (lg) = 7
    expect(containers.length).toBe(7);

    const cards = canvasElement.querySelectorAll('hx-card');
    expect(cards.length).toBe(6);

    const alerts = canvasElement.querySelectorAll('hx-alert');
    expect(alerts.length).toBe(1);
  },
};

export const DashboardLayout: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column;">
      <!-- Dashboard Header -->
      <hx-container width="full" padding="sm" style="--hx-container-bg: #1565c0;">
        <hx-container width="xl">
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;"
          >
            <h1 style="margin: 0; font-size: 1.25rem; font-weight: 600;">
              Clinical Operations Dashboard
            </h1>
            <span style="font-size: 0.875rem; opacity: 0.85;">
              Memorial Regional -- February 16, 2026
            </span>
          </div>
        </hx-container>
      </hx-container>

      <!-- Dashboard Alerts -->
      <hx-container width="xl" padding="sm" style="--hx-container-bg: #fff8e1;">
        <hx-alert variant="info">
          Bed capacity at 87%. Six discharges expected by 14:00. ED wait time averaging 22 minutes.
        </hx-alert>
      </hx-container>

      <!-- Dashboard Content: sidebar + main -->
      <hx-container width="xl" padding="md" style="--hx-container-bg: #fafafa;">
        <div style="display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem;">
          <!-- Sidebar -->
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <hx-card>
              <span slot="heading">Census Summary</span>
              <div style="font-size: 0.875rem; line-height: 1.6;">
                <p style="margin: 0 0 0.5rem 0;"><strong>Total beds:</strong> 342</p>
                <p style="margin: 0 0 0.5rem 0;"><strong>Occupied:</strong> 298 (87%)</p>
                <p style="margin: 0 0 0.5rem 0;"><strong>Available:</strong> 44</p>
                <p style="margin: 0;"><strong>Pending discharge:</strong> 6</p>
              </div>
            </hx-card>
            <hx-card>
              <span slot="heading">ED Status</span>
              <div style="font-size: 0.875rem; line-height: 1.6;">
                <p style="margin: 0 0 0.5rem 0;"><strong>Patients in ED:</strong> 18</p>
                <p style="margin: 0 0 0.5rem 0;"><strong>Avg wait:</strong> 22 min</p>
                <p style="margin: 0 0 0.5rem 0;"><strong>Admits pending:</strong> 4</p>
                <p style="margin: 0;"><strong>Left without being seen:</strong> 1</p>
              </div>
            </hx-card>
            <hx-card>
              <span slot="heading">Staffing</span>
              <div style="font-size: 0.875rem; line-height: 1.6;">
                <p style="margin: 0 0 0.5rem 0;"><strong>RN on shift:</strong> 86</p>
                <p style="margin: 0 0 0.5rem 0;"><strong>Physicians:</strong> 24</p>
                <p style="margin: 0;"><strong>Open positions:</strong> 3</p>
              </div>
            </hx-card>
          </div>

          <!-- Main Content Area -->
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <hx-card elevation="raised">
              <span slot="heading">Department Metrics</span>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8125rem;">
                  <thead>
                    <tr style="background: #e3f2fd;">
                      <th
                        style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #90caf9;"
                      >
                        Department
                      </th>
                      <th
                        style="padding: 0.5rem; text-align: right; border-bottom: 2px solid #90caf9;"
                      >
                        Beds
                      </th>
                      <th
                        style="padding: 0.5rem; text-align: right; border-bottom: 2px solid #90caf9;"
                      >
                        Occupied
                      </th>
                      <th
                        style="padding: 0.5rem; text-align: right; border-bottom: 2px solid #90caf9;"
                      >
                        Avg LOS
                      </th>
                      <th
                        style="padding: 0.5rem; text-align: right; border-bottom: 2px solid #90caf9;"
                      >
                        Discharges Today
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">
                        Medical/Surgical
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        120
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        108
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        4.2 days
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        3
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">ICU</td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        32
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        30
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        6.8 days
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        1
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">Pediatrics</td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        48
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        38
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        2.9 days
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        2
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0.5rem; border-bottom: 1px solid #e0e0e0;">
                        Labor and Delivery
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        24
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        18
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        2.1 days
                      </td>
                      <td
                        style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #e0e0e0;"
                      >
                        0
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0.5rem;">Cardiac Care</td>
                      <td style="padding: 0.5rem; text-align: right;">28</td>
                      <td style="padding: 0.5rem; text-align: right;">26</td>
                      <td style="padding: 0.5rem; text-align: right;">5.4 days</td>
                      <td style="padding: 0.5rem; text-align: right;">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </hx-card>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <hx-card elevation="raised">
                <span slot="heading">Recent Admissions</span>
                <div style="font-size: 0.8125rem; line-height: 1.6;">
                  <p style="margin: 0 0 0.5rem 0;">
                    09:42 -- MRN-20481 -- Chest pain, r/o ACS -- ED to CCU
                  </p>
                  <p style="margin: 0 0 0.5rem 0;">
                    08:15 -- MRN-20479 -- Pneumonia -- ED to Med/Surg
                  </p>
                  <p style="margin: 0 0 0.5rem 0;">
                    07:30 -- MRN-20477 -- Scheduled knee replacement -- Pre-op
                  </p>
                  <p style="margin: 0;">06:55 -- MRN-20475 -- Diabetic ketoacidosis -- ED to ICU</p>
                </div>
              </hx-card>
              <hx-card elevation="raised">
                <span slot="heading">Pending Results</span>
                <div style="font-size: 0.8125rem; line-height: 1.6;">
                  <p style="margin: 0 0 0.5rem 0;">MRN-20481 -- Troponin panel -- Expected 10:30</p>
                  <p style="margin: 0 0 0.5rem 0;">MRN-20479 -- Blood cultures -- Expected 14:00</p>
                  <p style="margin: 0 0 0.5rem 0;">MRN-20475 -- ABG -- Expected 09:00</p>
                  <p style="margin: 0;">MRN-20468 -- CT Abdomen -- Expected 11:15</p>
                </div>
              </hx-card>
            </div>
          </div>
        </div>
      </hx-container>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const containers = canvasElement.querySelectorAll('hx-container');
    // Header outer (full) + Header inner (xl) + Alerts (xl) + Content (xl) = 4
    expect(containers.length).toBe(4);

    const cards = canvasElement.querySelectorAll('hx-card');
    expect(cards.length).toBe(6);

    const alerts = canvasElement.querySelectorAll('hx-alert');
    expect(alerts.length).toBe(1);

    // Verify dashboard uses xl width for wide layout
    const contentContainer = containers[3];
    expect(contentContainer.getAttribute('width')).toBe('xl');
  },
};
