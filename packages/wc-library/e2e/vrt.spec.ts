import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for WC-2026 Components.
 * Captures screenshots of each component variant in Storybook
 * and compares against committed baselines.
 *
 * Prerequisites: Storybook must be running on port 3151
 * Run: npm run dev:storybook (or npx storybook dev -p 3151)
 */

const STORYBOOK_URL = 'http://localhost:3151';

interface ComponentVariant {
  component: string;
  story: string;
  id: string;
}

const COMPONENT_VARIANTS: ComponentVariant[] = [
  // wc-button
  { component: 'wc-button', story: 'Primary', id: 'components-wc-button--primary' },
  { component: 'wc-button', story: 'Secondary', id: 'components-wc-button--secondary' },
  { component: 'wc-button', story: 'Ghost', id: 'components-wc-button--ghost' },
  { component: 'wc-button', story: 'Disabled', id: 'components-wc-button--disabled' },

  // wc-card
  { component: 'wc-card', story: 'Default', id: 'components-wc-card--default' },
  { component: 'wc-card', story: 'Featured', id: 'components-wc-card--featured' },
  { component: 'wc-card', story: 'Compact', id: 'components-wc-card--compact' },

  // wc-text-input
  { component: 'wc-text-input', story: 'Default', id: 'components-wc-text-input--default' },
  { component: 'wc-text-input', story: 'ErrorState', id: 'components-wc-text-input--error-state' },
  { component: 'wc-text-input', story: 'Disabled', id: 'components-wc-text-input--disabled' },

  // wc-checkbox
  { component: 'wc-checkbox', story: 'Default', id: 'components-wc-checkbox--default' },
  { component: 'wc-checkbox', story: 'Checked', id: 'components-wc-checkbox--checked' },

  // wc-select
  { component: 'wc-select', story: 'Default', id: 'components-wc-select--default' },

  // wc-badge
  { component: 'wc-badge', story: 'Primary', id: 'components-wc-badge--primary' },
  { component: 'wc-badge', story: 'Success', id: 'components-wc-badge--success' },
  { component: 'wc-badge', story: 'Warning', id: 'components-wc-badge--warning' },
  { component: 'wc-badge', story: 'Error', id: 'components-wc-badge--error' },

  // wc-radio-group
  { component: 'wc-radio-group', story: 'Default', id: 'components-wc-radio-group--default' },

  // wc-textarea
  { component: 'wc-textarea', story: 'Default', id: 'components-wc-textarea--default' },

  // wc-switch
  { component: 'wc-switch', story: 'Default', id: 'components-wc-switch--default' },
  { component: 'wc-switch', story: 'Checked', id: 'components-wc-switch--checked' },

  // wc-alert
  { component: 'wc-alert', story: 'Info', id: 'components-wc-alert--info' },
  { component: 'wc-alert', story: 'Success', id: 'components-wc-alert--success' },
  { component: 'wc-alert', story: 'Warning', id: 'components-wc-alert--warning' },
  { component: 'wc-alert', story: 'Error', id: 'components-wc-alert--error' },
];

for (const variant of COMPONENT_VARIANTS) {
  test(`${variant.component} - ${variant.story}`, async ({ page }) => {
    // Navigate to the isolated story iframe
    const storyUrl = `${STORYBOOK_URL}/iframe.html?id=${variant.id}&viewMode=story`;
    await page.goto(storyUrl);

    // Wait for the component to render
    await page.waitForSelector(variant.component, { timeout: 10000 });

    // Wait for fonts and animations to settle
    await page.waitForTimeout(500);

    // Screenshot comparison
    await expect(page).toHaveScreenshot(
      `${variant.component}--${variant.story.toLowerCase()}.png`,
      {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
      }
    );
  });
}
