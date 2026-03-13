import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-steps.js';
import './hx-step.js';

// ─────────────────────────────────────────────────
//  Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Steps',
  component: 'hx-steps',
  subcomponents: { 'hx-step': 'hx-step' },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Layout orientation of the step list.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'horizontal'" },
        type: { summary: "'horizontal' | 'vertical'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant controlling indicator and text sizes.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'md'" },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    'hx-step-click': {
      description:
        'Dispatched when a step is clicked. Detail: `{ step: HelixStep, index: number }`.',
      table: {
        category: 'Events',
        type: { summary: 'CustomEvent<{ step: HelixStep; index: number }>' },
      },
    },
  },
  args: {
    orientation: 'horizontal',
    size: 'md',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
//  Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default (Horizontal)',
  render: (args) => html`
    <hx-steps orientation=${args['orientation']} size=${args['size']}>
      <hx-step label="Account" status="complete" description="Create your account"></hx-step>
      <hx-step label="Profile" status="active" description="Set up your profile"></hx-step>
      <hx-step label="Review" status="pending" description="Review and confirm"></hx-step>
    </hx-steps>
  `,
};

export const Vertical: Story = {
  name: 'Vertical',
  render: () => html`
    <hx-steps orientation="vertical" style="max-width: 20rem;">
      <hx-step
        label="Account setup"
        status="complete"
        description="Create and verify your account"
      ></hx-step>
      <hx-step
        label="Personal info"
        status="active"
        description="Provide your personal details"
      ></hx-step>
      <hx-step
        label="Preferences"
        status="pending"
        description="Configure your preferences"
      ></hx-step>
    </hx-steps>
  `,
};

export const AllStatuses: Story = {
  name: 'All Statuses',
  render: () => html`
    <hx-steps orientation="horizontal">
      <hx-step label="Complete" status="complete" description="Finished"></hx-step>
      <hx-step label="Active" status="active" description="In progress"></hx-step>
      <hx-step label="Error" status="error" description="Something went wrong"></hx-step>
      <hx-step label="Pending" status="pending" description="Not started"></hx-step>
    </hx-steps>
  `,
};

export const SizeSm: Story = {
  name: 'Size: Small',
  render: () => html`
    <hx-steps size="sm">
      <hx-step label="Step 1" status="complete"></hx-step>
      <hx-step label="Step 2" status="active"></hx-step>
      <hx-step label="Step 3" status="pending"></hx-step>
    </hx-steps>
  `,
};

export const SizeMd: Story = {
  name: 'Size: Medium',
  render: () => html`
    <hx-steps size="md">
      <hx-step label="Step 1" status="complete"></hx-step>
      <hx-step label="Step 2" status="active"></hx-step>
      <hx-step label="Step 3" status="pending"></hx-step>
    </hx-steps>
  `,
};

export const SizeLg: Story = {
  name: 'Size: Large',
  render: () => html`
    <hx-steps size="lg">
      <hx-step label="Step 1" status="complete"></hx-step>
      <hx-step label="Step 2" status="active"></hx-step>
      <hx-step label="Step 3" status="pending"></hx-step>
    </hx-steps>
  `,
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-family: sans-serif; font-size: 0.875rem; color: #64748b;"
        >
          Small
        </p>
        <hx-steps size="sm">
          <hx-step label="Step 1" status="complete"></hx-step>
          <hx-step label="Step 2" status="active"></hx-step>
          <hx-step label="Step 3" status="pending"></hx-step>
        </hx-steps>
      </div>
      <div>
        <p
          style="margin: 0 0 0.5rem; font-family: sans-serif; font-size: 0.875rem; color: #64748b;"
        >
          Medium (default)
        </p>
        <hx-steps size="md">
          <hx-step label="Step 1" status="complete"></hx-step>
          <hx-step label="Step 2" status="active"></hx-step>
          <hx-step label="Step 3" status="pending"></hx-step>
        </hx-steps>
      </div>
      <div>
        <p
          style="margin: 0 0 0.5rem; font-family: sans-serif; font-size: 0.875rem; color: #64748b;"
        >
          Large
        </p>
        <hx-steps size="lg">
          <hx-step label="Step 1" status="complete"></hx-step>
          <hx-step label="Step 2" status="active"></hx-step>
          <hx-step label="Step 3" status="pending"></hx-step>
        </hx-steps>
      </div>
    </div>
  `,
};

export const SizeSmVertical: Story = {
  name: 'Size: Small + Vertical',
  render: () => html`
    <hx-steps size="sm" orientation="vertical" style="max-width: 20rem;">
      <hx-step label="Step 1" status="complete" description="Done"></hx-step>
      <hx-step label="Step 2" status="active" description="In progress"></hx-step>
      <hx-step label="Step 3" status="pending" description="Upcoming"></hx-step>
    </hx-steps>
  `,
};

export const SizeLgVertical: Story = {
  name: 'Size: Large + Vertical',
  render: () => html`
    <hx-steps size="lg" orientation="vertical" style="max-width: 24rem;">
      <hx-step label="Step 1" status="complete" description="Done"></hx-step>
      <hx-step label="Step 2" status="active" description="In progress"></hx-step>
      <hx-step label="Step 3" status="pending" description="Upcoming"></hx-step>
    </hx-steps>
  `,
};

export const WithError: Story = {
  name: 'With Error Step',
  render: () => html`
    <hx-steps orientation="horizontal">
      <hx-step label="Submit" status="complete" description="Form submitted"></hx-step>
      <hx-step label="Validate" status="error" description="Validation failed"></hx-step>
      <hx-step label="Process" status="pending" description="Processing"></hx-step>
    </hx-steps>
  `,
};

export const WithCustomIcon: Story = {
  name: 'With Custom Icon',
  render: () => html`
    <hx-steps orientation="horizontal">
      <hx-step label="Upload" status="complete">
        <svg
          slot="icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
      </hx-step>
      <hx-step label="Review" status="active">
        <svg
          slot="icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </hx-step>
      <hx-step label="Approve" status="pending">
        <svg
          slot="icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </hx-step>
    </hx-steps>
  `,
};

export const WithDisabledStep: Story = {
  name: 'With Disabled Step',
  render: () => html`
    <hx-steps orientation="horizontal">
      <hx-step label="Complete" status="complete"></hx-step>
      <hx-step label="Active" status="active"></hx-step>
      <hx-step label="Disabled" status="pending" disabled></hx-step>
      <hx-step label="Pending" status="pending"></hx-step>
    </hx-steps>
  `,
};

export const VerticalAllStatuses: Story = {
  name: 'Vertical — All Statuses',
  render: () => html`
    <hx-steps orientation="vertical" style="max-width: 22rem;">
      <hx-step label="Complete" status="complete" description="This step is done"></hx-step>
      <hx-step label="Active" status="active" description="Currently in progress"></hx-step>
      <hx-step label="Error" status="error" description="An error occurred"></hx-step>
      <hx-step label="Pending" status="pending" description="Not yet started"></hx-step>
    </hx-steps>
  `,
};

export const InteractiveEvent: Story = {
  name: 'Interactive: hx-step-click Event',
  render: () => {
    const onStepClick = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      const output = document.getElementById('step-click-output');
      if (output) {
        output.textContent = `Step clicked: index ${customEvent.detail.index}`;
      }
    };

    return html`
      <hx-steps
        orientation="horizontal"
        aria-label="Interactive wizard"
        @hx-step-click=${onStepClick}
      >
        <hx-step label="Account" status="complete" description="Done"></hx-step>
        <hx-step label="Profile" status="active" description="Active"></hx-step>
        <hx-step label="Review" status="pending" description="Upcoming"></hx-step>
      </hx-steps>
      <p id="step-click-output" style="margin-top: 1rem; font-family: sans-serif; color: #334155;">
        Click a step above to see the event detail.
      </p>
    `;
  },
};
