import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for @helix/library components.
 *
 * Captures screenshots of each component variant rendered in Storybook
 * and compares against committed baselines. Tests run across:
 *   - 3 viewports via Playwright projects: desktop, tablet, mobile
 *   - 2 themes: light, dark (via Storybook globals → data-theme on <html>)
 *
 * Prerequisites: Storybook must be running on port 3151.
 *   CI:    storybook static build is served before `npm run test:vrt`
 *   Local: `npm run dev:storybook`, then `npm run test:vrt`
 *
 * To update baselines after intentional visual changes:
 *   npm run test:vrt:update
 */

const STORYBOOK_URL = 'http://localhost:3151';

/** Storybook theme globals — maps to data-theme on <html> via withThemeByDataAttribute */
const THEMES = ['light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

interface ComponentVariant {
  /** Custom element tag name */
  component: string;
  /** Human-readable story label */
  story: string;
  /** Storybook story ID (used in iframe URL) */
  id: string;
}

/**
 * All 13 components with their key story variants.
 * Story IDs follow the Storybook convention: components-{name}--{story}.
 */
const COMPONENT_VARIANTS: ComponentVariant[] = [
  // hx-alert
  { component: 'hx-alert', story: 'Info', id: 'components-alert--info' },
  { component: 'hx-alert', story: 'Success', id: 'components-alert--success' },
  { component: 'hx-alert', story: 'Warning', id: 'components-alert--warning' },
  { component: 'hx-alert', story: 'Error', id: 'components-alert--error' },

  // hx-badge
  { component: 'hx-badge', story: 'Primary', id: 'components-badge--primary' },
  { component: 'hx-badge', story: 'Success', id: 'components-badge--success' },
  { component: 'hx-badge', story: 'Warning', id: 'components-badge--warning' },
  { component: 'hx-badge', story: 'Error', id: 'components-badge--error' },

  // hx-button
  { component: 'hx-button', story: 'Primary', id: 'components-button--primary' },
  { component: 'hx-button', story: 'Secondary', id: 'components-button--secondary' },
  { component: 'hx-button', story: 'Ghost', id: 'components-button--ghost' },
  { component: 'hx-button', story: 'Disabled', id: 'components-button--disabled' },

  // hx-card
  { component: 'hx-card', story: 'Default', id: 'components-card--default' },
  { component: 'hx-card', story: 'VariantFeatured', id: 'components-card--variant-featured' },
  { component: 'hx-card', story: 'VariantCompact', id: 'components-card--variant-compact' },

  // hx-checkbox
  { component: 'hx-checkbox', story: 'Default', id: 'components-checkbox--default' },
  { component: 'hx-checkbox', story: 'Checked', id: 'components-checkbox--checked' },

  // hx-container
  { component: 'hx-container', story: 'Default', id: 'components-container--default' },

  // hx-form
  { component: 'hx-form', story: 'Default', id: 'components-form--default' },

  // hx-prose
  { component: 'hx-prose', story: 'Default', id: 'components-prose--default' },

  // hx-radio-group
  { component: 'hx-radio-group', story: 'Default', id: 'components-radio-group--default' },

  // hx-select
  { component: 'hx-select', story: 'Default', id: 'components-select--default' },

  // hx-switch
  { component: 'hx-switch', story: 'Default', id: 'components-switch--default' },
  { component: 'hx-switch', story: 'Checked', id: 'components-switch--checked' },

  // hx-text-input
  { component: 'hx-text-input', story: 'Default', id: 'components-text-input--default' },
  { component: 'hx-text-input', story: 'WithError', id: 'components-text-input--with-error' },
  { component: 'hx-text-input', story: 'Disabled', id: 'components-text-input--disabled' },

  // hx-textarea
  { component: 'hx-textarea', story: 'Default', id: 'components-textarea--default' },
];

/**
 * Build the Storybook iframe URL for a given story + theme.
 * Theme is passed as a Storybook global so the withThemeByDataAttribute
 * decorator activates the correct CSS custom property overrides.
 */
function buildStoryUrl(storyId: string, theme: Theme): string {
  return `${STORYBOOK_URL}/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`;
}

for (const theme of THEMES) {
  for (const variant of COMPONENT_VARIANTS) {
    test(`${variant.component} / ${variant.story} / ${theme}`, async ({ page }) => {
      const url = buildStoryUrl(variant.id, theme);
      await page.goto(url);

      // Wait for the custom element to be defined and rendered
      await page.waitForSelector(variant.component, { timeout: 10_000 });

      // Allow fonts, tokens, and shadow DOM rendering to settle
      await page.waitForTimeout(300);

      // Stable snapshot name: component--story--theme.png
      const snapshotName = `${variant.component}--${variant.story.toLowerCase()}--${theme}.png`;

      await expect(page).toHaveScreenshot(snapshotName, {
        // 2% pixel ratio tolerance covers cross-platform font rendering differences
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  }
}
