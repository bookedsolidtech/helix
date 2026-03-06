import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-drawer.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Drawer',
  component: 'hx-drawer',
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls whether the drawer is open.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    placement: {
      control: 'select',
      options: ['start', 'end', 'top', 'bottom'],
      description: 'Which edge of the viewport the drawer slides in from.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'end' },
        type: { summary: "'start' | 'end' | 'top' | 'bottom'" },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'full'],
      description:
        "The size of the drawer panel. Accepts 'sm', 'md', 'lg', 'full', or any valid CSS length.",
      table: {
        category: 'Layout',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg' | 'full' | string" },
      },
    },
    contained: {
      control: 'boolean',
      description:
        'When true, constrains the drawer to its positioned parent instead of the viewport.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    noHeader: {
      name: 'no-header',
      control: 'boolean',
      description: 'When true, hides the header (title, actions, close button).',
      table: {
        category: 'Content',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    noFooter: {
      name: 'no-footer',
      control: 'boolean',
      description: 'When true, hides the footer.',
      table: {
        category: 'Content',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    open: false,
    placement: 'end',
    size: 'md',
    contained: false,
    noHeader: false,
    noFooter: false,
  },
  render: (args) => html`
    <div>
      <button
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {
            open: boolean;
          };
          if (host) host.open = true;
        }}
      >
        Open Drawer
      </button>
      <hx-drawer
        ?open=${args.open}
        placement=${args.placement}
        size=${args.size}
        ?contained=${args.contained}
        ?no-header=${args.noHeader}
        ?no-footer=${args.noFooter}
      >
        <span slot="label">Drawer Title</span>
        <p>Drawer body content goes here. Add any content you like.</p>
        <button slot="footer">Cancel</button>
        <button slot="footer">Confirm</button>
      </hx-drawer>
    </div>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

/** Default drawer — slides in from the end (right) edge. */
export const Default: Story = {
  args: {
    open: false,
    placement: 'end',
    size: 'md',
  },
};

/** Drawer slides in from the start (left) edge. */
export const PlacementStart: Story = {
  args: {
    placement: 'start',
    open: false,
  },
};

/** Drawer slides in from the top edge. */
export const PlacementTop: Story = {
  args: {
    placement: 'top',
    open: false,
  },
};

/** Drawer slides in from the bottom edge. */
export const PlacementBottom: Story = {
  args: {
    placement: 'bottom',
    open: false,
  },
};

/** Small-sized drawer panel. */
export const SizeSmall: Story = {
  args: {
    size: 'sm',
  },
};

/** Large-sized drawer panel. */
export const SizeLarge: Story = {
  args: {
    size: 'lg',
  },
};

/** Full-sized drawer panel that fills the edge dimension. */
export const SizeFull: Story = {
  args: {
    size: 'full',
  },
};

/** Drawer without a header — no title, header-actions, or close button. */
export const NoHeader: Story = {
  args: {
    noHeader: true,
  },
};

/** Drawer without a footer. */
export const NoFooter: Story = {
  args: {
    noFooter: true,
  },
};

/** Drawer contained to a positioned parent element instead of the viewport. */
export const Contained: Story = {
  render: (args) => html`
    <div
      style="position: relative; width: 600px; height: 400px; border: 2px dashed #ccc; overflow: hidden;"
    >
      <button
        style="margin: 1rem;"
        @click=${(e: Event) => {
          const container = (e.target as HTMLElement).closest('[style]') as HTMLElement;
          const drawer = container?.querySelector('hx-drawer') as HTMLElement & { open: boolean };
          if (drawer) drawer.open = true;
        }}
      >
        Open Contained Drawer
      </button>
      <hx-drawer ?open=${args.open} placement=${args.placement} size=${args.size} contained>
        <span slot="label">Contained Drawer</span>
        <p>This drawer is constrained to its parent container.</p>
      </hx-drawer>
    </div>
  `,
  args: {
    open: false,
    placement: 'end',
    size: 'md',
  },
};

/** Drawer with header action buttons alongside the close button. */
export const WithHeaderActions: Story = {
  render: (args) => html`
    <div>
      <button
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {
            open: boolean;
          };
          if (host) host.open = true;
        }}
      >
        Open Drawer
      </button>
      <hx-drawer ?open=${args.open} placement=${args.placement} size=${args.size}>
        <span slot="label">Drawer with Actions</span>
        <button slot="header-actions" title="Settings">&#9881;</button>
        <p>Drawer body content. The header shows extra actions next to the close button.</p>
        <button slot="footer">Cancel</button>
        <button slot="footer">Save</button>
      </hx-drawer>
    </div>
  `,
  args: {
    open: false,
    placement: 'end',
    size: 'md',
  },
};

/** Drawer with navigation content — demonstrates focus trap with multiple interactive elements. */
export const WithNavigationContent: Story = {
  render: (args) => html`
    <div>
      <button
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {
            open: boolean;
          };
          if (host) host.open = true;
        }}
      >
        Open Navigation Drawer
      </button>
      <hx-drawer ?open=${args.open} placement="start" size=${args.size} label="Site Navigation">
        <span slot="label">Navigation</span>
        <nav>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 0.5rem;"><a href="#dashboard">Dashboard</a></li>
            <li style="margin-bottom: 0.5rem;"><a href="#patients">Patients</a></li>
            <li style="margin-bottom: 0.5rem;"><a href="#appointments">Appointments</a></li>
            <li style="margin-bottom: 0.5rem;"><a href="#records">Records</a></li>
            <li style="margin-bottom: 0.5rem;"><a href="#settings">Settings</a></li>
          </ul>
        </nav>
        <button slot="footer">Log Out</button>
      </hx-drawer>
    </div>
  `,
  args: {
    open: false,
    size: 'sm',
  },
};

/** Drawer with a form — demonstrates focus trap with form inputs. */
export const WithForm: Story = {
  render: (args) => html`
    <div>
      <button
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).nextElementSibling as HTMLElement & {
            open: boolean;
          };
          if (host) host.open = true;
        }}
      >
        Open Form Drawer
      </button>
      <hx-drawer ?open=${args.open} placement=${args.placement} size=${args.size}>
        <span slot="label">Patient Details</span>
        <form style="display: flex; flex-direction: column; gap: 1rem;">
          <label>
            First Name
            <input type="text" style="display: block; width: 100%; padding: 0.5rem;" />
          </label>
          <label>
            Last Name
            <input type="text" style="display: block; width: 100%; padding: 0.5rem;" />
          </label>
          <label>
            Date of Birth
            <input type="date" style="display: block; width: 100%; padding: 0.5rem;" />
          </label>
          <label>
            Notes
            <textarea rows="3" style="display: block; width: 100%; padding: 0.5rem;"></textarea>
          </label>
        </form>
        <button slot="footer">Cancel</button>
        <button slot="footer">Save Patient</button>
      </hx-drawer>
    </div>
  `,
  args: {
    open: false,
    placement: 'end',
    size: 'md',
  },
};
