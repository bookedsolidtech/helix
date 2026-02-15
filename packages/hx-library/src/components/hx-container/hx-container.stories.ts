import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-container.js';

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
        defaultValue: { summary: 'content' },
      },
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Vertical padding applied to the outer wrapper.',
      table: {
        defaultValue: { summary: 'none' },
      },
    },
  },
  args: {
    width: 'content',
    padding: 'none',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Default ───

export const Default: Story = {
  render: (args) => html`
    <hx-container
      width=${args.width}
      padding=${args.padding}
      style="--hx-container-bg: #f5f5f5;"
    >
      <p style="margin: 0;">
        This is a default container using the <code>content</code> width preset.
        It constrains content to a comfortable reading width while centering it
        horizontally with automatic margins and consistent horizontal gutters.
      </p>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    expect(container).toBeTruthy();
    const inner = container?.shadowRoot?.querySelector('[part="inner"]');
    expect(inner).toBeTruthy();
  },
};

// ─── Width Variants ───

export const WidthVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <hx-container width="full" style="--hx-container-bg: #e3f2fd;">
        <p style="margin: 0;"><strong>full</strong> -- No max-width constraint. Content spans the entire viewport width.</p>
      </hx-container>

      <hx-container width="xl" style="--hx-container-bg: #e8f5e9;">
        <p style="margin: 0;"><strong>xl</strong> -- Max-width of 1280px. Suitable for wide dashboard layouts.</p>
      </hx-container>

      <hx-container width="lg" style="--hx-container-bg: #fff3e0;">
        <p style="margin: 0;"><strong>lg</strong> -- Max-width of 1024px. Standard page content width.</p>
      </hx-container>

      <hx-container width="content" style="--hx-container-bg: #fce4ec;">
        <p style="margin: 0;"><strong>content</strong> -- Max-width of 72rem (default). General-purpose content width.</p>
      </hx-container>

      <hx-container width="md" style="--hx-container-bg: #f3e5f5;">
        <p style="margin: 0;"><strong>md</strong> -- Max-width of 768px. Forms and medium-width content.</p>
      </hx-container>

      <hx-container width="sm" style="--hx-container-bg: #e0f7fa;">
        <p style="margin: 0;"><strong>sm</strong> -- Max-width of 640px. Narrow forms or dialog-like content.</p>
      </hx-container>

      <hx-container width="narrow" style="--hx-container-bg: #fff9c4;">
        <p style="margin: 0;"><strong>narrow</strong> -- Max-width of 48rem. Optimized for long-form reading.</p>
      </hx-container>
    </div>
  `,
};

// ─── Padding Variants ───

export const PaddingVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2px;">
      <hx-container padding="none" style="--hx-container-bg: #e3f2fd;">
        <p style="margin: 0;"><strong>none</strong> -- No vertical padding.</p>
      </hx-container>

      <hx-container padding="sm" style="--hx-container-bg: #e8f5e9;">
        <p style="margin: 0;"><strong>sm</strong> -- 1.5rem vertical padding. Subtle spacing between sections.</p>
      </hx-container>

      <hx-container padding="md" style="--hx-container-bg: #fff3e0;">
        <p style="margin: 0;"><strong>md</strong> -- 3rem vertical padding. Standard section spacing.</p>
      </hx-container>

      <hx-container padding="lg" style="--hx-container-bg: #fce4ec;">
        <p style="margin: 0;"><strong>lg</strong> -- 4rem vertical padding. Generous section spacing.</p>
      </hx-container>

      <hx-container padding="xl" style="--hx-container-bg: #f3e5f5;">
        <p style="margin: 0;"><strong>xl</strong> -- 6rem vertical padding. Hero-level spacing.</p>
      </hx-container>

      <hx-container padding="2xl" style="--hx-container-bg: #e0f7fa;">
        <p style="margin: 0;"><strong>2xl</strong> -- 8rem vertical padding. Maximum emphasis spacing.</p>
      </hx-container>
    </div>
  `,
};

// ─── Full Bleed ───

export const FullBleed: Story = {
  render: () => html`
    <hx-container width="full" padding="xl" style="--hx-container-bg: #1a237e;">
      <div style="text-align: center; color: #ffffff;">
        <h1 style="margin: 0 0 1rem 0; font-size: 2.5rem; font-weight: 700;">
          Welcome to the Patient Portal
        </h1>
        <p style="margin: 0; font-size: 1.25rem; opacity: 0.9; max-width: 40rem; margin-left: auto; margin-right: auto;">
          Access your health records, schedule appointments, and communicate
          with your care team -- all in one secure location.
        </p>
      </div>
    </hx-container>
  `,
};

// ─── Nested Containers ───

export const NestedContainers: Story = {
  render: () => html`
    <hx-container width="full" padding="lg" style="--hx-container-bg: #eceff1;">
      <p style="margin: 0 0 1rem 0; text-align: center; color: #546e7a;">
        <strong>Outer container:</strong> <code>width="full"</code> with <code>padding="lg"</code>
      </p>
      <hx-container width="md" padding="md" style="--hx-container-bg: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
        <p style="margin: 0; text-align: center;">
          <strong>Inner container:</strong> <code>width="md"</code> with <code>padding="md"</code>.
          This pattern is common for centering a form or card within a full-bleed section.
        </p>
      </hx-container>
    </hx-container>
  `,
};

// ─── With Background ───

export const WithBackground: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2px;">
      <hx-container padding="lg" style="--hx-container-bg: #e8f5e9;">
        <p style="margin: 0;">
          <strong>Success context:</strong> Uses <code>--hx-container-bg: #e8f5e9</code> for a light green background
          that communicates positive status or confirmation sections.
        </p>
      </hx-container>

      <hx-container padding="lg" style="--hx-container-bg: #fff3e0;">
        <p style="margin: 0;">
          <strong>Warning context:</strong> Uses <code>--hx-container-bg: #fff3e0</code> for a light amber background
          that draws attention to important notices or pending actions.
        </p>
      </hx-container>

      <hx-container padding="lg" style="--hx-container-bg: #fce4ec;">
        <p style="margin: 0;">
          <strong>Error context:</strong> Uses <code>--hx-container-bg: #fce4ec</code> for a light red background
          appropriate for alerts or critical information sections.
        </p>
      </hx-container>

      <hx-container padding="lg" style="--hx-container-bg: #e3f2fd;">
        <p style="margin: 0;">
          <strong>Info context:</strong> Uses <code>--hx-container-bg: #e3f2fd</code> for a light blue background
          suitable for informational banners or callout sections.
        </p>
      </hx-container>
    </div>
  `,
};

// ─── Page Layout Demo ───

export const PageLayoutDemo: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column;">
      <!-- Hero Section -->
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

      <!-- Content Section -->
      <hx-container width="content" padding="lg" style="--hx-container-bg: #ffffff;">
        <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">Our Services</h2>
        <p style="margin: 0 0 1rem 0; line-height: 1.6;">
          Our cardiology department offers a full range of diagnostic and treatment
          services including echocardiography, cardiac catheterization, electrophysiology
          studies, and cardiac rehabilitation programs. Each patient receives a
          personalized care plan developed by our multidisciplinary team.
        </p>
        <p style="margin: 0; line-height: 1.6;">
          We are committed to delivering evidence-based cardiac care using the latest
          technology and treatment protocols. Our team includes board-certified
          cardiologists, cardiac surgeons, and specialized nursing staff.
        </p>
      </hx-container>

      <!-- Narrow Reading Column -->
      <hx-container width="narrow" padding="md" style="--hx-container-bg: #fafafa;">
        <h3 style="margin: 0 0 0.75rem 0; font-size: 1.25rem;">Patient Information</h3>
        <p style="margin: 0 0 1rem 0; line-height: 1.7;">
          If you have been referred to our department, please bring your insurance
          card, a photo ID, and any relevant medical records to your first appointment.
          Arrive 15 minutes early to complete the intake process.
        </p>
        <p style="margin: 0; line-height: 1.7;">
          For questions about scheduling, insurance coverage, or preparation for
          specific procedures, please contact our office during regular business hours.
          Emergency cardiac concerns should be directed to the nearest emergency department.
        </p>
      </hx-container>
    </div>
  `,
};
