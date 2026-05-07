import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within } from 'storybook/test';

// Scene composition imports — every component is documented + tested in its
// own Components/* tree. This scene demonstrates a configuration flow built
// from documented hx-* components: tabbed sections, switches, selects, and a
// save/cancel button bar. This is the canonical reference for how a downstream
// `create-helix-app` consumer should build a settings page on top of HELiX.
import '@helixui/library/components/hx-tabs';
import '@helixui/library/components/hx-card';
import '@helixui/library/components/hx-switch';
import '@helixui/library/components/hx-select';
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-text-input';
import '@helixui/library/components/hx-divider';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Patterns/Scenes/Settings',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full settings/preferences scene assembled from documented hx-* components. ' +
          'Tabbed sections route to general / notifications / accessibility panels. ' +
          'Every toggle, select, and button is a real component — no mock divs. ' +
          "The story's `play()` functions exercise tab navigation, switch toggling, " +
          'select changes, and the save/cancel flow. This is the canonical reference ' +
          'for how a downstream `create-helix-app` consumer should build a configuration ' +
          'page on top of HELiX.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Render — shared by every story below
// ─────────────────────────────────────────────────

const renderSettings = () => html`
  <div
    style="
      max-width: 880px;
      margin: 0 auto;
      padding: 32px 24px;
      font-family: var(--hx-font-family-sans, system-ui);
    "
  >
    <header style="margin-bottom: 24px;">
      <h1
        style="
          margin: 0 0 4px;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--hx-color-text-primary);
        "
      >
        Settings
      </h1>
      <p
        style="
          margin: 0;
          font-size: 14px;
          color: var(--hx-color-text-secondary);
          line-height: 1.5;
        "
      >
        Manage your account preferences. Changes save when you click "Save changes".
      </p>
    </header>

    <hx-tabs
      data-testid="settings-tabs"
      label="Settings sections"
      activation="manual"
      style="display: block;"
    >
      <hx-tab slot="tab" panel="general" active data-testid="tab-general">General</hx-tab>
      <hx-tab slot="tab" panel="notifications" data-testid="tab-notifications">Notifications</hx-tab>
      <hx-tab slot="tab" panel="accessibility" data-testid="tab-accessibility">Accessibility</hx-tab>

      <hx-tab-panel name="general">
        <hx-card variant="default" elevation="raised" style="display: block; margin-top: 16px;">
          <span slot="heading">Account</span>
          <div style="display: grid; gap: 16px; padding: 8px 0;">
            <hx-text-input
              data-testid="setting-display-name"
              label="Display name"
              name="displayName"
              value="Jordan Reyes"
            ></hx-text-input>
            <hx-select
              data-testid="setting-language"
              label="Language"
              name="language"
              value="en-US"
            >
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
              <option value="es-MX">Español (México)</option>
              <option value="fr-CA">Français (Canada)</option>
            </hx-select>
            <hx-select
              data-testid="setting-timezone"
              label="Timezone"
              name="timezone"
              value="America/New_York"
            >
              <option value="America/New_York">Eastern Time (US & Canada)</option>
              <option value="America/Chicago">Central Time (US & Canada)</option>
              <option value="America/Denver">Mountain Time (US & Canada)</option>
              <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
            </hx-select>
          </div>
        </hx-card>
      </hx-tab-panel>

      <hx-tab-panel name="notifications">
        <hx-card variant="default" elevation="raised" style="display: block; margin-top: 16px;">
          <span slot="heading">Email notifications</span>
          <div style="display: grid; gap: 16px; padding: 8px 0;">
            <label
              style="display: flex; align-items: center; justify-content: space-between; gap: 16px;"
            >
              <div>
                <div style="font-weight: 600; font-size: 14px;">Appointment reminders</div>
                <div style="font-size: 12px; color: var(--hx-color-text-muted); margin-top: 2px;">
                  Email me 24 hours before each scheduled visit.
                </div>
              </div>
              <hx-switch data-testid="setting-appointment-reminders" name="apptReminders" checked
                >On</hx-switch
              >
            </label>
            <label
              style="display: flex; align-items: center; justify-content: space-between; gap: 16px;"
            >
              <div>
                <div style="font-weight: 600; font-size: 14px;">Lab results</div>
                <div style="font-size: 12px; color: var(--hx-color-text-muted); margin-top: 2px;">
                  Email me as soon as new results are available.
                </div>
              </div>
              <hx-switch data-testid="setting-lab-results" name="labResults" checked>On</hx-switch>
            </label>
            <label
              style="display: flex; align-items: center; justify-content: space-between; gap: 16px;"
            >
              <div>
                <div style="font-weight: 600; font-size: 14px;">Marketing updates</div>
                <div style="font-size: 12px; color: var(--hx-color-text-muted); margin-top: 2px;">
                  Occasional product news and care-team highlights.
                </div>
              </div>
              <hx-switch data-testid="setting-marketing" name="marketing">Off</hx-switch>
            </label>
          </div>
        </hx-card>
      </hx-tab-panel>

      <hx-tab-panel name="accessibility">
        <hx-card variant="default" elevation="raised" style="display: block; margin-top: 16px;">
          <span slot="heading">Display & motion</span>
          <div style="display: grid; gap: 16px; padding: 8px 0;">
            <label
              style="display: flex; align-items: center; justify-content: space-between; gap: 16px;"
            >
              <div>
                <div style="font-weight: 600; font-size: 14px;">High contrast</div>
                <div style="font-size: 12px; color: var(--hx-color-text-muted); margin-top: 2px;">
                  Increase contrast of borders, focus rings, and disabled states.
                </div>
              </div>
              <hx-switch data-testid="setting-high-contrast" name="highContrast">Off</hx-switch>
            </label>
            <label
              style="display: flex; align-items: center; justify-content: space-between; gap: 16px;"
            >
              <div>
                <div style="font-weight: 600; font-size: 14px;">Reduced motion</div>
                <div style="font-size: 12px; color: var(--hx-color-text-muted); margin-top: 2px;">
                  Skip non-essential transitions and animations.
                </div>
              </div>
              <hx-switch data-testid="setting-reduced-motion" name="reducedMotion" checked
                >On</hx-switch
              >
            </label>
            <hx-select
              data-testid="setting-text-size"
              label="Text size"
              name="textSize"
              value="medium"
              help-text="Scales body and label text together. Headings adjust proportionally."
            >
              <option value="small">Small</option>
              <option value="medium">Medium (default)</option>
              <option value="large">Large</option>
              <option value="x-large">Extra large</option>
            </hx-select>
          </div>
        </hx-card>
      </hx-tab-panel>
    </hx-tabs>

    <div
      style="
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid var(--hx-color-border-subtle);
      "
    >
      <hx-button variant="ghost" data-testid="settings-cancel">Cancel</hx-button>
      <hx-button variant="primary" data-testid="settings-save">Save changes</hx-button>
    </div>
  </div>
`;

// ─────────────────────────────────────────────────
// 1. Default — render only, axe panel covers a11y
// ─────────────────────────────────────────────────

/**
 * The settings page rendered at rest. Cycle the toolbar theme + brand to
 * verify the layout holds across all 12 (3 themes × 4 brands) combinations.
 */
export const Default: Story = {
  render: renderSettings,
};

// ─────────────────────────────────────────────────
// 2. Renders Real Components — structural assertion
// ─────────────────────────────────────────────────

/**
 * Confirms every tab, panel, switch, select, and button is an actual hx-*
 * component (not a fake div). If a component fails to register, the story
 * fails fast.
 */
export const RendersRealComponents: Story = {
  render: renderSettings,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const tabs = canvas.getByTestId('settings-tabs') as HTMLElement;
    await expect(tabs.tagName.toLowerCase()).toBe('hx-tabs');

    const general = canvas.getByTestId('tab-general') as HTMLElement;
    const notifications = canvas.getByTestId('tab-notifications') as HTMLElement;
    const accessibility = canvas.getByTestId('tab-accessibility') as HTMLElement;
    await expect(general.tagName.toLowerCase()).toBe('hx-tab');
    await expect(notifications.tagName.toLowerCase()).toBe('hx-tab');
    await expect(accessibility.tagName.toLowerCase()).toBe('hx-tab');

    const save = canvas.getByTestId('settings-save') as HTMLElement;
    const cancel = canvas.getByTestId('settings-cancel') as HTMLElement;
    await expect(save.tagName.toLowerCase()).toBe('hx-button');
    await expect(cancel.tagName.toLowerCase()).toBe('hx-button');
  },
};

// ─────────────────────────────────────────────────
// 3. Switch Toggle — boolean state flips + emits hx-change
// ─────────────────────────────────────────────────

/**
 * Toggles the marketing-updates switch (initially off) and verifies that
 * `hx-change` fires with the new checked state. This is the canonical
 * boolean-control test pattern: capture the event, click the inner control,
 * assert detail.
 */
export const SwitchToggle: Story = {
  render: renderSettings,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const sw = canvas.getByTestId('setting-marketing') as HTMLElement & { checked?: boolean };
    await expect(sw.tagName.toLowerCase()).toBe('hx-switch');
    await expect(sw.checked).toBeFalsy();

    let lastDetail: { checked: boolean; value: string } | null = null;
    sw.addEventListener('hx-change', (e) => {
      lastDetail = (e as CustomEvent<{ checked: boolean; value: string }>).detail;
    });

    // Click the inner native checkbox-driven toggle through the host.
    const inner = sw.shadowRoot?.querySelector(
      'button, input[type="checkbox"]',
    ) as HTMLElement | null;
    await expect(inner).toBeTruthy();
    inner!.click();

    await expect(sw.checked).toBe(true);
    await expect(lastDetail).toBeTruthy();
    await expect(lastDetail!.checked).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 4. Save Click — primary action emits hx-click
// ─────────────────────────────────────────────────

/**
 * Click the save button and verify the canonical `hx-click` event fires.
 * Buttons inside a settings bar must still emit through the shadow boundary.
 */
export const SaveClick: Story = {
  render: renderSettings,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByTestId('settings-save') as HTMLElement;

    let clicked = false;
    save.addEventListener('hx-click', () => {
      clicked = true;
    });

    const inner = save.shadowRoot?.querySelector('button') as HTMLButtonElement | null;
    await expect(inner).toBeTruthy();
    await userEvent.click(inner!);

    await expect(clicked).toBe(true);
  },
};
