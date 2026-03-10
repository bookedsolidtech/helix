import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, fn, userEvent } from 'storybook/test';
import './hx-top-nav.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Top Nav',
  component: 'hx-top-nav',
  tags: ['autodocs'],
  argTypes: {
    sticky: {
      control: 'boolean',
      description: 'When true, the navigation bar sticks to the top of the viewport during scroll.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description:
        'Accessible label applied to the inner `<nav>` element via `aria-label`. Describes the landmark to screen reader users.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: "'Site Navigation'" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    sticky: false,
    label: 'Site Navigation',
  },
  render: (args) => html`
    <hx-top-nav ?sticky=${args.sticky} label=${args.label}>
      <a
        slot="logo"
        href="/"
        style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.125rem;"
        >HealthSystem</a
      >
      <!-- Use <div style="display: contents;"> or bare links — NOT <nav> — the component renders a <nav> landmark internally -->
      <div style="display: contents;">
        <a href="/dashboard" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Dashboard</a
        >
        <a href="/patients" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Patients</a
        >
        <a href="/schedule" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Schedule</a
        >
        <a
          href="/lab-results"
          style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Lab Results</a
        >
      </div>
      <div slot="actions" style="display: flex; align-items: center; gap: 0.5rem;">
        <button
          type="button"
          style="background: none; border: none; cursor: pointer; color: inherit; padding: 0.5rem;"
          aria-label="Search"
        >
          Search
        </button>
        <button
          type="button"
          style="background: none; border: none; cursor: pointer; color: inherit; padding: 0.5rem;"
          aria-label="User profile"
        >
          Profile
        </button>
      </div>
    </hx-top-nav>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('hx-top-nav');
    await expect(nav).toBeTruthy();

    // Verify shadow DOM structure
    const shadow = nav?.shadowRoot;
    await expect(shadow?.querySelector('[part="header"]')).toBeTruthy();
    await expect(shadow?.querySelector('[part="nav"]')).toBeTruthy();
    await expect(shadow?.querySelector('[part="logo"]')).toBeTruthy();
    await expect(shadow?.querySelector('[part="menu"]')).toBeTruthy();
    await expect(shadow?.querySelector('[part="actions"]')).toBeTruthy();
    await expect(shadow?.querySelector('[part="mobile-toggle"]')).toBeTruthy();

    // Verify the nav landmark has a label
    const navEl = shadow?.querySelector('[part="nav"]');
    await expect(navEl?.getAttribute('aria-label')).toBe('Site Navigation');
  },
};

// ─────────────────────────────────────────────────
// 2. WITH LOGO SLOT
// ─────────────────────────────────────────────────

export const WithLogoSlot: Story = {
  render: (args) => html`
    <hx-top-nav ?sticky=${args.sticky} label=${args.label}>
      <a
        slot="logo"
        href="/"
        style="display: flex; align-items: center; gap: 0.5rem; color: inherit; text-decoration: none;"
      >
        <span
          style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            background: var(--hx-color-primary-600, #1d4ed8);
            color: #fff;
            border-radius: 0.375rem;
            font-weight: 700;
            font-size: 0.875rem;
          "
          >H</span
        >
        <span style="font-weight: 700; font-size: 1.125rem;">HealthSystem</span>
      </a>
      <div style="display: contents;">
        <a href="/dashboard" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Dashboard</a
        >
        <a href="/patients" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Patients</a
        >
        <a href="/schedule" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Schedule</a
        >
      </div>
    </hx-top-nav>
  `,
};

// ─────────────────────────────────────────────────
// 3. WITH ACTIONS SLOT
// ─────────────────────────────────────────────────

export const WithActionsSlot: Story = {
  render: (args) => html`
    <hx-top-nav ?sticky=${args.sticky} label=${args.label}>
      <a
        slot="logo"
        href="/"
        style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.125rem;"
        >HealthSystem</a
      >
      <div style="display: contents;">
        <a href="/dashboard" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Dashboard</a
        >
        <a href="/patients" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Patients</a
        >
        <a href="/orders" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Orders</a
        >
      </div>
      <div slot="actions" style="display: flex; align-items: center; gap: 0.75rem;">
        <input
          type="search"
          placeholder="Search patients..."
          aria-label="Search patients"
          style="
            padding: 0.375rem 0.75rem;
            border: 1px solid var(--hx-color-neutral-300, #ced4da);
            border-radius: 0.375rem;
            font-size: 0.875rem;
            width: 14rem;
          "
        />
        <button
          type="button"
          style="
            padding: 0.375rem 0.875rem;
            background: var(--hx-color-primary-600, #1d4ed8);
            color: #fff;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
          "
        >
          New Patient
        </button>
      </div>
    </hx-top-nav>
  `,
};

// ─────────────────────────────────────────────────
// 4. WITH SEARCH
// ─────────────────────────────────────────────────

export const WithSearch: Story = {
  name: 'With Search',
  render: (args) => html`
    <hx-top-nav ?sticky=${args.sticky} label=${args.label}>
      <a
        slot="logo"
        href="/"
        style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.125rem;"
        >HealthSystem</a
      >
      <div style="display: contents;">
        <a href="/dashboard" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Dashboard</a
        >
        <a href="/patients" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Patients</a
        >
        <a href="/schedule" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Schedule</a
        >
      </div>
      <div slot="actions" style="display: flex; align-items: center; gap: 0.75rem;">
        <input
          type="search"
          placeholder="Search patients, orders..."
          aria-label="Search"
          style="
            padding: 0.375rem 0.75rem;
            border: 1px solid var(--hx-color-neutral-300, #ced4da);
            border-radius: 0.375rem;
            font-size: 0.875rem;
            width: 16rem;
          "
        />
      </div>
    </hx-top-nav>
  `,
};

// ─────────────────────────────────────────────────
// 5. WITH ARIA-CURRENT (Active Page Indicator)
// ─────────────────────────────────────────────────

export const WithAriaCurrent: Story = {
  name: 'With aria-current (Active Page)',
  render: (args) => html`
    <!--
      Mark the current page link with aria-current="page".

      In Drupal Twig, use the in_active_trail variable:
        <a href="{{ item.url }}"
           {% if item.in_active_trail %}aria-current="page"{% endif %}>
          {{ item.title }}
        </a>
    -->
    <hx-top-nav ?sticky=${args.sticky} label=${args.label}>
      <a
        slot="logo"
        href="/"
        style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.125rem;"
        >HealthSystem</a
      >
      <div style="display: contents;">
        <a href="/dashboard" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Dashboard</a
        >
        <!-- aria-current="page" marks the active link for screen readers -->
        <a
          href="/patients"
          aria-current="page"
          style="
            color: inherit;
            text-decoration: none;
            padding: 0.5rem 0.75rem;
            font-weight: 600;
            border-bottom: 2px solid currentColor;
          "
          >Patients</a
        >
        <a href="/schedule" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Schedule</a
        >
        <a
          href="/lab-results"
          style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Lab Results</a
        >
      </div>
    </hx-top-nav>
  `,
};

// ─────────────────────────────────────────────────
// 6. STICKY MODE
// ─────────────────────────────────────────────────

export const StickyMode: Story = {
  args: { sticky: true },
  render: (args) => html`
    <div style="height: 400px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 0.5rem;">
      <hx-top-nav ?sticky=${args.sticky} label=${args.label}>
        <a
          slot="logo"
          href="/"
          style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.125rem;"
          >HealthSystem</a
        >
        <div style="display: contents;">
          <a
            href="/dashboard"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
            >Dashboard</a
          >
          <a
            href="/patients"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
            >Patients</a
          >
          <a
            href="/schedule"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
            >Schedule</a
          >
        </div>
        <div slot="actions" style="display: flex; align-items: center; gap: 0.5rem;">
          <button
            type="button"
            style="background: none; border: none; cursor: pointer; color: inherit;"
          >
            Profile
          </button>
        </div>
      </hx-top-nav>
      <div style="padding: 2rem; display: flex; flex-direction: column; gap: 1rem;">
        <p style="margin: 0; color: #6c757d; font-size: 0.875rem;">
          Scroll this container to see the nav remain fixed at the top. The
          <code>sticky</code> attribute sets <code>position: sticky; top: 0</code> on the inner nav
          element.
        </p>
        ${Array.from(
          { length: 20 },
          (_, i) => html`
            <p style="margin: 0; padding: 0.75rem; background: #f8f9fa; border-radius: 0.25rem;">
              Page content row ${i + 1} — clinical workflow data, patient notes, or dashboard
              widgets.
            </p>
          `,
        )}
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('hx-top-nav');
    await expect(nav).toBeTruthy();
    await expect(nav?.hasAttribute('sticky')).toBe(true);

    const navEl = nav?.shadowRoot?.querySelector('[part="nav"]');
    await expect(navEl).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 7. MOBILE TOGGLE
// ─────────────────────────────────────────────────

const mobileToggleHandler = fn();

export const MobileToggle: Story = {
  render: (args) => html`
    <!--
      Resize the Storybook canvas to a narrow viewport (< 768 px) to make the
      hamburger button visible. On desktop the button is hidden via CSS media query.
    -->
    <div style="max-width: 480px;">
      <hx-top-nav
        ?sticky=${args.sticky}
        label=${args.label}
        @hx-mobile-toggle=${mobileToggleHandler}
      >
        <a
          slot="logo"
          href="/"
          style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.125rem;"
          >HealthSystem</a
        >
        <div style="display: contents;">
          <a
            href="/dashboard"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem; display: block;"
            >Dashboard</a
          >
          <a
            href="/patients"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem; display: block;"
            >Patients</a
          >
          <a
            href="/schedule"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem; display: block;"
            >Schedule</a
          >
        </div>
        <div slot="actions">
          <button
            type="button"
            style="background: none; border: none; cursor: pointer; color: inherit;"
          >
            Profile
          </button>
        </div>
      </hx-top-nav>
    </div>
  `,
  play: async ({ canvasElement }) => {
    mobileToggleHandler.mockClear();

    const nav = canvasElement.querySelector('hx-top-nav');
    await expect(nav).toBeTruthy();

    const toggleBtn = nav?.shadowRoot?.querySelector<HTMLButtonElement>('[part="mobile-toggle"]');
    await expect(toggleBtn).toBeTruthy();

    // Verify initial closed state
    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');

    // Click the mobile toggle button
    await userEvent.click(toggleBtn!);

    // Verify open state reflected in aria-expanded
    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');

    // Verify hx-mobile-toggle event fired with open: true
    await expect(mobileToggleHandler).toHaveBeenCalledTimes(1);
    const eventDetail = mobileToggleHandler.mock.calls[0]?.[0]?.detail as { open: boolean };
    await expect(eventDetail?.open).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 8. MOBILE VIEWPORT (Responsive)
// ─────────────────────────────────────────────────

export const MobileViewport: Story = {
  name: 'Mobile Viewport',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => html`
    <!--
      This story demonstrates mobile layout with the hamburger menu.
      The nav items are hidden until the hamburger button is clicked.
    -->
    <hx-top-nav ?sticky=${args.sticky} label=${args.label}>
      <a
        slot="logo"
        href="/"
        style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.125rem;"
        >HealthSystem</a
      >
      <div style="display: contents;">
        <a
          href="/dashboard"
          aria-current="page"
          style="
            color: inherit;
            text-decoration: none;
            padding: 0.75rem;
            display: block;
            font-weight: 600;
          "
          >Dashboard</a
        >
        <a
          href="/patients"
          style="color: inherit; text-decoration: none; padding: 0.75rem; display: block;"
          >Patients</a
        >
        <a
          href="/schedule"
          style="color: inherit; text-decoration: none; padding: 0.75rem; display: block;"
          >Schedule</a
        >
        <a
          href="/lab-results"
          style="color: inherit; text-decoration: none; padding: 0.75rem; display: block;"
          >Lab Results</a
        >
      </div>
      <div slot="actions">
        <button
          type="button"
          style="
            background: none;
            border: 1px solid currentColor;
            border-radius: 0.375rem;
            cursor: pointer;
            color: inherit;
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
          "
        >
          Sign Out
        </button>
      </div>
    </hx-top-nav>
  `,
};

// ─────────────────────────────────────────────────
// 9. HOSPITAL PORTAL
// ─────────────────────────────────────────────────

export const HospitalPortal: Story = {
  render: () => html`
    <!--
      Drupal integration pattern:

      <hx-top-nav sticky label="Site Navigation">
        <a slot="logo" href="{{ path('<front>') }}" class="logo-link">
          {{ site_name }}
        </a>
        {% for item in main_menu %}
          <a
            href="{{ item.url }}"
            {% if item.in_active_trail %}aria-current="page"{% endif %}
            class="nav-link"
          >{{ item.title }}</a>
        {% endfor %}
        <div slot="actions">
          <a href="{{ path('user.page') }}" class="user-menu-link">My Account</a>
        </div>
      </hx-top-nav>

      NOTE: Use bare <a> links or <div style="display: contents;"> — do NOT wrap in <nav>.
    -->
    <hx-top-nav sticky label="Hospital Staff Navigation">
      <a
        slot="logo"
        href="/"
        style="display: flex; align-items: center; gap: 0.625rem; color: inherit; text-decoration: none;"
      >
        <span
          style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            background: var(--hx-color-primary-700, #1e40af);
            color: #fff;
            border-radius: 0.375rem;
            font-weight: 800;
            font-size: 0.875rem;
          "
          >M</span
        >
        <span style="font-weight: 700; font-size: 1.0625rem;">Memorial Health</span>
      </a>
      <div style="display: contents;">
        <a
          href="/dashboard"
          aria-current="page"
          style="
            color: inherit;
            text-decoration: none;
            padding: 0.5rem 0.75rem;
            font-weight: 600;
            border-bottom: 2px solid currentColor;
          "
          >Dashboard</a
        >
        <a href="/patients" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Patients</a
        >
        <a href="/schedule" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Schedule</a
        >
        <a
          href="/lab-results"
          style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Lab Results</a
        >
        <a href="/orders" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Orders</a
        >
        <a href="/reports" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Reports</a
        >
      </div>
      <div slot="actions" style="display: flex; align-items: center; gap: 0.75rem;">
        <input
          type="search"
          placeholder="Search patients, orders..."
          aria-label="Search"
          style="
            padding: 0.375rem 0.75rem;
            border: 1px solid var(--hx-color-neutral-300, #ced4da);
            border-radius: 0.375rem;
            font-size: 0.875rem;
            width: 16rem;
          "
        />
        <button
          type="button"
          aria-label="Notifications (3 unread)"
          style="
            position: relative;
            background: none;
            border: none;
            cursor: pointer;
            color: inherit;
            padding: 0.375rem;
            font-size: 0.875rem;
          "
        >
          Alerts
          <span
            style="
              position: absolute;
              top: 0;
              right: 0;
              background: var(--hx-color-error-500, #dc2626);
              color: #fff;
              border-radius: 9999px;
              font-size: 0.625rem;
              font-weight: 700;
              padding: 0 0.3rem;
              line-height: 1.4;
            "
            >3</span
          >
        </button>
        <span
          style="
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.875rem;
            cursor: pointer;
          "
        >
          Dr. Chen
        </span>
      </div>
    </hx-top-nav>
  `,
};

// ─────────────────────────────────────────────────
// 10. PATIENT PORTAL
// ─────────────────────────────────────────────────

export const PatientPortal: Story = {
  render: () => html`
    <!--
      Patient-facing portal navigation.

      Drupal integration pattern:

      <hx-top-nav label="Patient Portal Navigation">
        <a slot="logo" href="{{ path('<front>') }}" class="logo-link">
          {{ site_name }} Patient Portal
        </a>
        {% for item in main_menu %}
          <a
            href="{{ item.url }}"
            {% if item.in_active_trail %}aria-current="page"{% endif %}
            class="nav-link"
          >{{ item.title }}</a>
        {% endfor %}
        <div slot="actions">
          <a href="{{ path('user.logout') }}">Sign Out</a>
        </div>
      </hx-top-nav>
    -->
    <hx-top-nav label="Patient Portal Navigation">
      <a
        slot="logo"
        href="/"
        style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.0625rem;"
      >
        MyHealth Portal
      </a>
      <div style="display: contents;">
        <a href="/home" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Home</a
        >
        <a href="/my-health" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >My Health</a
        >
        <a
          href="/appointments"
          aria-current="page"
          style="
            color: inherit;
            text-decoration: none;
            padding: 0.5rem 0.75rem;
            font-weight: 600;
            border-bottom: 2px solid currentColor;
          "
          >Appointments</a
        >
        <a href="/messages" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Messages</a
        >
        <a
          href="/prescriptions"
          style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
          >Prescriptions</a
        >
      </div>
      <div slot="actions" style="display: flex; align-items: center; gap: 0.75rem;">
        <button
          type="button"
          style="
            background: none;
            border: 1px solid currentColor;
            border-radius: 0.375rem;
            cursor: pointer;
            color: inherit;
            padding: 0.375rem 0.875rem;
            font-size: 0.875rem;
          "
        >
          Sign Out
        </button>
      </div>
    </hx-top-nav>
  `,
};

// ─────────────────────────────────────────────────
// 11. CSS CUSTOM PROPERTIES
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div>
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: #6c757d;">
          Dark theme — override background, text, and border color
        </p>
        <hx-top-nav
          label="Dark Theme Navigation"
          style="
            --hx-top-nav-bg: #0f172a;
            --hx-top-nav-color: #e2e8f0;
            --hx-top-nav-border-color: #334155;
            --hx-top-nav-toggle-color: #94a3b8;
          "
        >
          <a
            slot="logo"
            href="/"
            style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.125rem;"
            >HealthSystem</a
          >
          <div style="display: contents;">
            <a
              href="/dashboard"
              style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
              >Dashboard</a
            >
            <a
              href="/patients"
              style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
              >Patients</a
            >
            <a
              href="/schedule"
              style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
              >Schedule</a
            >
          </div>
          <div slot="actions">
            <button
              type="button"
              style="background: none; border: none; cursor: pointer; color: inherit;"
            >
              Profile
            </button>
          </div>
        </hx-top-nav>
      </div>

      <div>
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: #6c757d;">
          Branded teal theme — custom height and horizontal padding
        </p>
        <hx-top-nav
          label="Teal Branded Navigation"
          style="
            --hx-top-nav-bg: #0f766e;
            --hx-top-nav-color: #ffffff;
            --hx-top-nav-border-color: #0d9488;
            --hx-top-nav-height: 3.5rem;
            --hx-top-nav-padding-x: 2rem;
            --hx-top-nav-toggle-color: #ffffff;
          "
        >
          <a
            slot="logo"
            href="/"
            style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.125rem;"
            >CareConnect</a
          >
          <div style="display: contents;">
            <a href="/home" style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
              >Home</a
            >
            <a
              href="/appointments"
              style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
              >Appointments</a
            >
            <a
              href="/messages"
              style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
              >Messages</a
            >
          </div>
          <div slot="actions">
            <button
              type="button"
              style="
                background: rgba(255,255,255,0.15);
                border: 1px solid rgba(255,255,255,0.4);
                border-radius: 0.375rem;
                cursor: pointer;
                color: #fff;
                padding: 0.375rem 0.875rem;
                font-size: 0.875rem;
              "
            >
              Sign Out
            </button>
          </div>
        </hx-top-nav>
      </div>

      <details style="max-width: 640px;">
        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">
          View CSS Custom Properties Reference
        </summary>
        <pre
          style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; font-size: 0.8125rem; overflow-x: auto; line-height: 1.6;"
        >
hx-top-nav {
  /* Navigation bar background color */
  --hx-top-nav-bg: var(--hx-color-neutral-0);

  /* Navigation bar text color */
  --hx-top-nav-color: var(--hx-color-neutral-800);

  /* Bottom border color */
  --hx-top-nav-border-color: var(--hx-color-neutral-200);

  /* Navigation bar height */
  --hx-top-nav-height: var(--hx-space-16);

  /* Horizontal padding on the bar row */
  --hx-top-nav-padding-x: var(--hx-space-6);

  /* Z-index when sticky is true */
  --hx-top-nav-z-index: var(--hx-z-index-sticky);

  /* Hamburger icon color */
  --hx-top-nav-toggle-color: var(--hx-color-neutral-700);
}</pre
        >
      </details>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 12. CSS PARTS
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-top-nav::part(nav) {
        border-bottom: 3px solid #6366f1;
        background: linear-gradient(135deg, #faf5ff, #ede9fe);
      }
      .parts-demo hx-top-nav::part(logo) {
        border-right: 2px dashed #a78bfa;
        padding-right: 1rem;
        margin-right: 0.5rem;
      }
      .parts-demo hx-top-nav::part(menu) {
        gap: 0.25rem;
      }
      .parts-demo hx-top-nav::part(actions) {
        border-left: 2px dashed #a78bfa;
        padding-left: 1rem;
        margin-left: 0.5rem;
      }
      .parts-demo hx-top-nav::part(mobile-toggle) {
        background: #ede9fe;
        border-radius: 0.375rem;
      }
    </style>
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div class="parts-demo">
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: #6c757d;">
          All CSS parts styled externally via <code>::part()</code>
        </p>
        <hx-top-nav label="CSS Parts Demo Navigation">
          <a
            slot="logo"
            href="/"
            style="font-weight: 700; color: inherit; text-decoration: none; font-size: 1.0625rem;"
            >::part(logo)</a
          >
          <div style="display: contents;">
            <a
              href="/dashboard"
              style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
              >Menu Item 1</a
            >
            <a
              href="/patients"
              style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
              >Menu Item 2</a
            >
            <a
              href="/schedule"
              style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
              >Menu Item 3</a
            >
          </div>
          <div slot="actions">
            <span style="font-size: 0.875rem; color: #4338ca;">::part(actions)</span>
          </div>
        </hx-top-nav>
      </div>

      <details style="max-width: 640px;">
        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">
          View CSS Parts Reference
        </summary>
        <pre
          style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; font-size: 0.8125rem; overflow-x: auto; line-height: 1.6;"
        >
/* Available CSS Parts */
hx-top-nav::part(header)        { /* The outer &lt;header&gt; landmark element */ }
hx-top-nav::part(nav)           { /* The &lt;nav&gt; element inside the header */ }
hx-top-nav::part(logo)          { /* The logo slot container */ }
hx-top-nav::part(menu)          { /* The primary navigation slot container */ }
hx-top-nav::part(actions)       { /* The actions slot container */ }
hx-top-nav::part(mobile-toggle) { /* The hamburger toggle button */ }</pre
        >
      </details>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// INTERACTION TESTS
// ─────────────────────────────────────────────────

const toggleOpenHandler = fn();

export const MobileToggleOpen: Story = {
  name: 'Test: Mobile Toggle Opens Menu',
  render: () => html`
    <div style="max-width: 480px;">
      <hx-top-nav label="Test Navigation" @hx-mobile-toggle=${toggleOpenHandler}>
        <a slot="logo" href="/" style="font-weight: 700; color: inherit; text-decoration: none;"
          >HealthSystem</a
        >
        <div style="display: contents;">
          <a
            href="/patients"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
            >Patients</a
          >
          <a
            href="/schedule"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
            >Schedule</a
          >
        </div>
      </hx-top-nav>
    </div>
  `,
  play: async ({ canvasElement }) => {
    toggleOpenHandler.mockClear();

    const nav = canvasElement.querySelector('hx-top-nav');
    await expect(nav).toBeTruthy();

    const toggleBtn = nav?.shadowRoot?.querySelector<HTMLButtonElement>('[part="mobile-toggle"]');
    await expect(toggleBtn).toBeTruthy();

    // Initial state: collapsed
    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');

    const collapsible = nav?.shadowRoot?.querySelector('#nav-menu');
    await expect(collapsible?.classList.contains('nav__collapsible--open')).toBe(false);

    // Click to open
    await userEvent.click(toggleBtn!);

    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');
    await expect(collapsible?.classList.contains('nav__collapsible--open')).toBe(true);
    await expect(toggleOpenHandler).toHaveBeenCalledTimes(1);

    const openDetail = toggleOpenHandler.mock.calls[0]?.[0]?.detail as { open: boolean };
    await expect(openDetail?.open).toBe(true);
  },
};

const toggleCloseHandler = fn();

export const MobileToggleClose: Story = {
  name: 'Test: Mobile Toggle Closes Menu',
  render: () => html`
    <div style="max-width: 480px;">
      <hx-top-nav label="Test Navigation" @hx-mobile-toggle=${toggleCloseHandler}>
        <a slot="logo" href="/" style="font-weight: 700; color: inherit; text-decoration: none;"
          >HealthSystem</a
        >
        <div style="display: contents;">
          <a
            href="/patients"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
            >Patients</a
          >
        </div>
      </hx-top-nav>
    </div>
  `,
  play: async ({ canvasElement }) => {
    toggleCloseHandler.mockClear();

    const nav = canvasElement.querySelector('hx-top-nav');
    const toggleBtn = nav?.shadowRoot?.querySelector<HTMLButtonElement>('[part="mobile-toggle"]');
    await expect(toggleBtn).toBeTruthy();

    // Open first
    await userEvent.click(toggleBtn!);
    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');

    // Close
    await userEvent.click(toggleBtn!);
    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');

    await expect(toggleCloseHandler).toHaveBeenCalledTimes(2);

    // Second call detail should carry open: false
    const closeDetail = toggleCloseHandler.mock.calls[1]?.[0]?.detail as { open: boolean };
    await expect(closeDetail?.open).toBe(false);
  },
};

export const AriaLabelApplied: Story = {
  name: 'Test: aria-label Applied to Nav',
  args: { label: 'Primary Site Navigation' },
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('hx-top-nav');
    await expect(nav).toBeTruthy();

    const navEl = nav?.shadowRoot?.querySelector('[part="nav"]');
    await expect(navEl?.getAttribute('aria-label')).toBe('Primary Site Navigation');
  },
};

export const StickyAttribute: Story = {
  name: 'Test: Sticky Attribute Reflects',
  args: { sticky: true },
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('hx-top-nav');
    await expect(nav).toBeTruthy();
    // The sticky property reflects to the attribute
    await expect(nav?.hasAttribute('sticky')).toBe(true);
  },
};

export const MobileToggleKeyboard: Story = {
  name: 'Test: Mobile Toggle Keyboard Activation',
  render: () => html`
    <div style="max-width: 480px;">
      <hx-top-nav label="Test Navigation">
        <a slot="logo" href="/" style="font-weight: 700; color: inherit; text-decoration: none;"
          >HealthSystem</a
        >
        <div style="display: contents;">
          <a
            href="/patients"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
            >Patients</a
          >
        </div>
      </hx-top-nav>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('hx-top-nav');
    const toggleBtn = nav?.shadowRoot?.querySelector<HTMLButtonElement>('[part="mobile-toggle"]');
    await expect(toggleBtn).toBeTruthy();

    // Focus the toggle button and activate with Enter
    toggleBtn!.focus();
    await expect(toggleBtn).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');

    // Activate again with Space to close
    await userEvent.keyboard(' ');
    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');
  },
};

export const EscapeClosesMenu: Story = {
  name: 'Test: Escape Key Closes Mobile Menu',
  render: () => html`
    <div style="max-width: 480px;">
      <hx-top-nav label="Test Navigation">
        <a slot="logo" href="/" style="font-weight: 700; color: inherit; text-decoration: none;"
          >HealthSystem</a
        >
        <div style="display: contents;">
          <a
            href="/patients"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
            >Patients</a
          >
          <a
            href="/schedule"
            style="color: inherit; text-decoration: none; padding: 0.5rem 0.75rem;"
            >Schedule</a
          >
        </div>
      </hx-top-nav>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('hx-top-nav');
    const toggleBtn = nav?.shadowRoot?.querySelector<HTMLButtonElement>('[part="mobile-toggle"]');
    await expect(toggleBtn).toBeTruthy();

    // Open the menu
    await userEvent.click(toggleBtn!);
    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');

    // Press Escape — menu should close and focus should return to toggle
    await userEvent.keyboard('{Escape}');
    await expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');
    await expect(toggleBtn).toHaveFocus();
  },
};
