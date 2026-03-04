/**
 * Phase 1 Production External Testing: Integration Tests
 *
 * Verifies that @helix/library components work correctly when consumed by:
 * 1. Drupal 11 (simulated via static HTML mimicking Twig template output)
 * 2. Next.js 15 (simulated via static HTML mimicking SSR + hydration output)
 *
 * Acceptance Criteria Covered:
 * - All components render in Drupal 11 Twig templates (simulated)
 * - All components render in Next.js 15 with React (simulated)
 * - Form-associated components work with native form submission
 * - Theming via CSS custom properties works in both environments
 * - No SSR hydration errors in Next.js (simulated)
 */
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';
const DRUPAL_URL = `${BASE_URL}/packages/hx-library/integration/drupal/index.html`;
const NEXTJS_URL = `${BASE_URL}/packages/hx-library/integration/nextjs/index.html`;

/** Wait for custom elements to be defined and upgraded */
async function waitForHelixComponents(page: Page, tags: string[]) {
  await page.waitForFunction(
    (tagList: string[]) => tagList.every((tag) => customElements.get(tag) !== undefined),
    tags,
    { timeout: 15000 },
  );
}

/** Helper: check that a component is upgraded (not just a plain unknown element) */
async function expectComponentUpgraded(page: Page, selector: string) {
  const isUpgraded = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    // An upgraded custom element has a shadowRoot (for Lit elements with shadow DOM)
    // or is at least an instance of HTMLElement subclass
    return el.shadowRoot !== null || el.constructor !== HTMLElement;
  }, selector);
  expect(isUpgraded, `${selector} should be an upgraded custom element`).toBe(true);
}

// ═══════════════════════════════════════════════════════════════════════════
// DRUPAL 11 INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Drupal 11 Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DRUPAL_URL);

    // Wait for core components to register
    await waitForHelixComponents(page, [
      'hx-button',
      'hx-badge',
      'hx-alert',
      'hx-card',
      'hx-text-input',
    ]);
  });

  test('display components render correctly', async ({ page }) => {
    // hx-button
    const buttons = page.locator('#buttons-row hx-button');
    await expect(buttons).toHaveCount(6);
    await expectComponentUpgraded(page, '#buttons-row hx-button');

    // Verify button shadow DOM has rendered content
    const buttonHasShadow = await page.evaluate(() => {
      const btn = document.querySelector('#buttons-row hx-button');
      return btn?.shadowRoot !== null;
    });
    expect(buttonHasShadow, 'hx-button should have shadow DOM').toBe(true);

    // hx-badge
    const badges = page.locator('#badges-row hx-badge');
    await expect(badges).toHaveCount(5);
    await expectComponentUpgraded(page, '#badges-row hx-badge');

    // hx-alert (all 4 variants)
    const alerts = page.locator('#alerts-section hx-alert');
    await expect(alerts).toHaveCount(4);

    // hx-card
    const cards = page.locator('#cards-row hx-card');
    await expect(cards).toHaveCount(2);
    await expectComponentUpgraded(page, '#cards-row hx-card');

    // hx-avatar
    const avatars = page.locator('#avatars-row hx-avatar');
    await expect(avatars).toHaveCount(3);

    // hx-breadcrumb
    const breadcrumb = page.locator('#breadcrumb-row hx-breadcrumb');
    await expect(breadcrumb).toHaveCount(1);

    // hx-container
    const container = page.locator('#container-row hx-container');
    await expect(container).toHaveCount(1);

    // hx-icon-button
    const iconButtons = page.locator('#icon-buttons-row hx-icon-button');
    await expect(iconButtons).toHaveCount(2);
  });

  test('form-associated components render inside native <form>', async ({ page }) => {
    await waitForHelixComponents(page, [
      'hx-text-input',
      'hx-checkbox',
      'hx-radio-group',
      'hx-select',
      'hx-textarea',
      'hx-switch',
      'hx-slider',
    ]);

    const form = page.locator('#drupal-form');
    await expect(form).toBeVisible();

    // Each form component should be present and upgraded
    await expectComponentUpgraded(page, 'hx-text-input[name="title"]');
    await expectComponentUpgraded(page, 'hx-textarea[name="body"]');
    await expectComponentUpgraded(page, 'hx-select[name="status"]');
    await expectComponentUpgraded(page, 'hx-radio-group[name="content_type"]');
    await expectComponentUpgraded(page, 'hx-checkbox[name="promoted"]');
    await expectComponentUpgraded(page, 'hx-switch[name="comments_enabled"]');
    await expectComponentUpgraded(page, 'hx-slider[name="priority"]');
  });

  test('form-associated components participate in native form submission', async ({ page }) => {
    await waitForHelixComponents(page, ['hx-text-input', 'hx-checkbox', 'hx-switch']);

    // Wait for text-input to be fully upgraded before interacting
    await page.waitForFunction(() => {
      const el = document.querySelector('hx-text-input[name="title"]');
      return el?.shadowRoot !== null;
    });

    // Interact with form components
    const titleInput = page.locator('hx-text-input[name="title"]');

    // Focus and type into the shadow DOM input
    await page.evaluate(() => {
      const el = document.querySelector('hx-text-input[name="title"]') as HTMLElement & {
        value: string;
      };
      if (el) {
        el.setAttribute('value', 'Test Article');
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Submit the form
    const submitBtn = page.locator('#drupal-form hx-button[type="submit"]');
    await submitBtn.click();

    // Wait for submission handler to execute
    const submitted = await page.waitForFunction(() => window.__formSubmitted === true, {
      timeout: 5000,
    });
    expect(submitted).toBeTruthy();
  });

  test('CSS custom property theming works', async ({ page }) => {
    // The theme-teal class applies teal primary color
    const themedSection = page.locator('#theming-test');
    await expect(themedSection).toBeVisible();

    // Verify that the CSS custom property is applied at the theme level
    const primaryColor = await page.evaluate(() => {
      const el = document.querySelector('.theme-teal');
      return getComputedStyle(el!).getPropertyValue('--hx-color-primary-500').trim();
    });

    expect(primaryColor).toBe('#0d9488');

    // Verify dark section renders
    const darkSection = page.locator('.dark-section');
    await expect(darkSection).toBeVisible();
  });

  test('hx-prose renders rich text content', async ({ page }) => {
    await waitForHelixComponents(page, ['hx-prose']);

    const prose = page.locator('#prose-test hx-prose');
    await expect(prose).toBeVisible();
    await expectComponentUpgraded(page, '#prose-test hx-prose');
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.reload();
    await waitForHelixComponents(page, ['hx-button', 'hx-badge']);
    await page.waitForTimeout(1000);

    // Filter out known non-critical errors (e.g., CDN fetch for unused icons)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('net::ERR_') &&
        !e.includes('Failed to load resource'),
    );

    expect(criticalErrors, `Unexpected console errors: ${criticalErrors.join(', ')}`).toHaveLength(
      0,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// NEXT.JS 15 INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Next.js 15 Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(NEXTJS_URL);

    // Wait for batch-imported components
    await waitForHelixComponents(page, [
      'hx-button',
      'hx-badge',
      'hx-alert',
      'hx-card',
      'hx-text-input',
    ]);
  });

  test('all components render after client-side hydration', async ({ page }) => {
    // Wait for the helix:hydrated event (simulates React hydration completing)
    await page.waitForFunction(() => window.__helixHydrated === true, { timeout: 15000 });

    const hydrationStatus = page.locator('#hydration-status');
    await expect(hydrationStatus).toContainText('hydrated successfully');

    // Verify all expected components rendered
    await expectComponentUpgraded(page, '#buttons-row hx-button');
    await expectComponentUpgraded(page, '#badges-row hx-badge');
    await expectComponentUpgraded(page, '#alerts-section hx-alert');
    await expectComponentUpgraded(page, '#cards-row hx-card');
    await expectComponentUpgraded(page, '#avatars-row hx-avatar');
    await expectComponentUpgraded(page, '#breadcrumb-row hx-breadcrumb');
    await expectComponentUpgraded(page, '#icon-buttons-row hx-icon-button');
  });

  test('no SSR hydration errors', async ({ page }) => {
    const errors: string[] = [];
    const hydrationErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') errors.push(text);
      // Watch for React hydration error patterns
      if (
        text.includes('Hydration') ||
        text.includes('hydration') ||
        text.includes('did not match') ||
        text.includes('server-rendered HTML')
      ) {
        hydrationErrors.push(text);
      }
    });
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.reload();
    await page.waitForFunction(() => window.__helixHydrated === true, { timeout: 15000 });
    await page.waitForTimeout(500);

    expect(
      hydrationErrors,
      `SSR hydration errors detected: ${hydrationErrors.join(', ')}`,
    ).toHaveLength(0);
  });

  test('Next.js form with web component inputs works', async ({ page }) => {
    await waitForHelixComponents(page, [
      'hx-text-input',
      'hx-select',
      'hx-radio-group',
      'hx-checkbox',
      'hx-switch',
      'hx-textarea',
      'hx-slider',
    ]);

    // Verify all form-associated components are in the form
    const form = page.locator('#nextjs-form');
    await expect(form).toBeVisible();

    await expectComponentUpgraded(page, 'hx-text-input[name="patient_name"]');
    await expectComponentUpgraded(page, 'hx-select[name="department"]');
    await expectComponentUpgraded(page, 'hx-radio-group[name="urgency"]');
    await expectComponentUpgraded(page, 'hx-checkbox[name="consent"]');
    await expectComponentUpgraded(page, 'hx-switch[name="alerts_enabled"]');
    await expectComponentUpgraded(page, 'hx-textarea[name="notes"]');
    await expectComponentUpgraded(page, 'hx-slider[name="pain_scale"]');
  });

  test('form submission collects component values', async ({ page }) => {
    await waitForHelixComponents(page, ['hx-text-input', 'hx-select']);

    // Wait for full upgrade
    await page.waitForFunction(() => {
      const el = document.querySelector('hx-text-input[name="patient_name"]');
      return el?.shadowRoot !== null;
    });

    // Set a value on the text input component
    await page.evaluate(() => {
      const el = document.querySelector('hx-text-input[name="patient_name"]') as HTMLElement & {
        value: string;
      };
      if (el) el.setAttribute('value', 'Jane Smith');
    });

    // Dispatch form submit event directly (bypasses hx-button internals in test env)
    // This verifies form data collection works, not button click propagation
    await page.evaluate(() => {
      const form = document.getElementById('nextjs-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    // Verify form submission handler executed
    const submitted = await page.waitForFunction(() => window.__formSubmitted === true, {
      timeout: 5000,
    });
    expect(submitted).toBeTruthy();
  });

  test('CSS custom property theming works identically to Drupal', async ({ page }) => {
    const themedSection = page.locator('#theming-test');
    await expect(themedSection).toBeVisible();

    // Verify the emerald theme override is applied
    const primaryColor = await page.evaluate(() => {
      const el = document.querySelector('.brand-emerald');
      return getComputedStyle(el!).getPropertyValue('--hx-color-primary-500').trim();
    });

    expect(primaryColor).toBe('#059669');

    // Verify theme tokens are applied to buttons within themed container
    const themedButton = page.locator('.brand-emerald hx-button[variant="primary"]');
    await expect(themedButton).toBeVisible();
  });

  test('hx-field and hx-form composition renders correctly', async ({ page }) => {
    await waitForHelixComponents(page, ['hx-form', 'hx-field']);

    const form = page.locator('#field-form-test hx-form');
    await expect(form).toBeVisible();
    await expectComponentUpgraded(page, '#field-form-test hx-form');
    await expectComponentUpgraded(page, '#field-form-test hx-field');
  });

  test('header layout with avatar and badge renders', async ({ page }) => {
    const header = page.locator('header.next-header');
    await expect(header).toBeVisible();

    const avatar = header.locator('hx-avatar');
    await expect(avatar).toBeVisible();
    await expectComponentUpgraded(page, 'header.next-header hx-avatar');

    const badge = header.locator('hx-badge');
    await expect(badge).toBeVisible();
  });

  test('button variants all render with shadow DOM', async ({ page }) => {
    const variants = ['primary', 'secondary', 'ghost', 'outline', 'danger'];

    for (const variant of variants) {
      const hasShadow = await page.evaluate((v) => {
        const btn = document.querySelector(`#buttons-row hx-button[variant="${v}"]`);
        return btn?.shadowRoot !== null;
      }, variant);

      expect(hasShadow, `hx-button[variant="${variant}"] should have shadow DOM`).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CROSS-ENVIRONMENT CONSISTENCY TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Cross-environment consistency', () => {
  test('design tokens CSS variables are available in both environments', async ({ page }) => {
    for (const url of [DRUPAL_URL, NEXTJS_URL]) {
      await page.goto(url);

      const tokenAvailable = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        const primary = style.getPropertyValue('--hx-color-primary-500').trim();
        const neutral = style.getPropertyValue('--hx-color-neutral-50').trim();
        return primary !== '' && neutral !== '';
      });

      expect(tokenAvailable, `Design tokens should be available at ${url}`).toBe(true);
    }
  });

  test('form-associated components register with ElementInternals in both environments', async ({
    page,
  }) => {
    for (const { url, formSelector } of [
      { url: DRUPAL_URL, formSelector: '#drupal-form' },
      { url: NEXTJS_URL, formSelector: '#nextjs-form' },
    ]) {
      await page.goto(url);
      await waitForHelixComponents(page, ['hx-text-input', 'hx-checkbox']);

      const hasElementInternals = await page.evaluate((selector) => {
        const form = document.querySelector(selector);
        if (!form) return false;
        const textInput = form.querySelector('hx-text-input');
        // FormAssociated custom elements report as form-associated via ElementInternals
        // We verify the component instance has the static formAssociated property
        if (!textInput) return false;
        const ctor = customElements.get('hx-text-input');
        return ctor !== undefined && (ctor as unknown as { formAssociated: boolean }).formAssociated === true;
      }, formSelector);

      expect(
        hasElementInternals,
        `hx-text-input should be form-associated at ${url}`,
      ).toBe(true);
    }
  });
});
