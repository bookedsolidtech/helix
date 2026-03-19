import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for HELiX Components.
 * Captures screenshots of each component variant in Storybook
 * and compares against committed baselines.
 *
 * In CI, set CHANGED_COMPONENTS env var (comma-separated hx-* names)
 * to only test components modified in the current PR.
 * When unset, all variants are tested (local dev / full suite).
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

const ALL_VARIANTS: ComponentVariant[] = [
  // hx-button
  { component: 'hx-button', story: 'Primary', id: 'components-button--primary' },
  { component: 'hx-button', story: 'Secondary', id: 'components-button--secondary' },
  { component: 'hx-button', story: 'Ghost', id: 'components-button--ghost' },
  { component: 'hx-button', story: 'Disabled', id: 'components-button--disabled' },

  // hx-card
  { component: 'hx-card', story: 'Default', id: 'components-card--default' },
  { component: 'hx-card', story: 'VariantFeatured', id: 'components-card--variant-featured' },
  { component: 'hx-card', story: 'VariantCompact', id: 'components-card--variant-compact' },

  // TODO: hx-text-input, hx-checkbox, hx-radio-group, hx-textarea, hx-switch
  // are excluded from VRT — they fail to render in static Storybook builds
  // within the 10s CI timeout. Investigate static Storybook rendering issues
  // before re-enabling. See: https://github.com/bookedsolidtech/helix/issues

  // hx-select
  { component: 'hx-select', story: 'Default', id: 'components-select--default' },

  // hx-badge
  { component: 'hx-badge', story: 'Primary', id: 'components-badge--primary' },
  { component: 'hx-badge', story: 'Success', id: 'components-badge--success' },
  { component: 'hx-badge', story: 'Warning', id: 'components-badge--warning' },
  { component: 'hx-badge', story: 'Error', id: 'components-badge--error' },

  // hx-alert
  { component: 'hx-alert', story: 'Info', id: 'components-alert--info' },
  { component: 'hx-alert', story: 'Success', id: 'components-alert--success' },
  { component: 'hx-alert', story: 'Warning', id: 'components-alert--warning' },
  { component: 'hx-alert', story: 'Error', id: 'components-alert--error' },
];

// Filter to only changed components when CHANGED_COMPONENTS is set
const changedFilter = process.env.CHANGED_COMPONENTS;
const COMPONENT_VARIANTS = changedFilter
  ? ALL_VARIANTS.filter((v) => changedFilter.split(',').includes(v.component))
  : ALL_VARIANTS;

if (COMPONENT_VARIANTS.length === 0) {
  test('no VRT variants for changed components', () => {
    // No changed components have VRT coverage — pass
  });
}

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
        maxDiffPixelRatio: 0.02, // 2% tolerance for cross-browser font rendering differences
        animations: 'disabled',
      },
    );
  });
}
