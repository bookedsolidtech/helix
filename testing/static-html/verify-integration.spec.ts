/**
 * Phase 1 Integration Verification — Static HTML (Drupal Simulation)
 *
 * Tests that all HELIX components load correctly when the library is included
 * as a script module, simulating Drupal 11 usage pattern.
 *
 * TEMPORARY: This file is for one-time verification. Delete after confirming.
 */

import { test, expect } from '@playwright/test';

// Trailing slash prevents serve from redirecting index.html to parent path
const PAGE = '/testing/static-html/';

test.describe('HELIX Static HTML Integration (Drupal simulation)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    // Wait for ES module to load and tests to run
    await page.waitForTimeout(2000);
  });

  test('page loads without JS errors', async ({ page }) => {
    await expect(page).toHaveTitle(/HELIX Integration Test/);
  });

  test('library loads as ES module', async ({ page }) => {
    const result = page.locator('[data-testid="result-library-loads-as-es-module"]').first();
    await expect(result).toBeVisible({ timeout: 8000 });
    await expect(result).toContainText('PASS');
  });

  test('hx-button registers in customElements', async ({ page }) => {
    const result = page.locator('[data-testid="result-hx-button-registered"]').first();
    await expect(result).toBeVisible({ timeout: 8000 });
    await expect(result).toContainText('PASS');
  });

  test('hx-button renders with shadow DOM', async ({ page }) => {
    const result = page.locator('[data-testid="result-hx-button-has-shadow-dom"]').first();
    await expect(result).toBeVisible({ timeout: 8000 });
    await expect(result).toContainText('PASS');
  });

  test('CSS custom properties applied for theming', async ({ page }) => {
    const result = page.locator('[data-testid="result-css-custom-property-theming"]').first();
    await expect(result).toBeVisible({ timeout: 8000 });
    await expect(result).toContainText('PASS');
  });

  test('hx-button appears on page', async ({ page }) => {
    const button = page.locator('hx-button[data-testid="hx-button"]');
    await expect(button).toBeVisible({ timeout: 5000 });
  });

  test('hx-card is in the DOM', async ({ page }) => {
    const card = page.locator('hx-card[data-testid="hx-card"]');
    await expect(card).toBeAttached();
  });

  test('themed container has CSS custom property override', async ({ page }) => {
    const themed = page.locator('[data-testid="themed-container"]');
    await expect(themed).toBeVisible();
    const primaryColor = await themed.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--hx-color-primary').trim()
    );
    expect(primaryColor).toBeTruthy();
  });

  test('form contains hx-* form inputs', async ({ page }) => {
    const form = page.locator('[data-testid="test-form"]');
    await expect(form).toBeAttached();
    await expect(form.locator('hx-text-input[data-testid="hx-text-input"]')).toBeAttached();
    await expect(form.locator('hx-checkbox[data-testid="hx-checkbox"]')).toBeAttached();
    await expect(form.locator('hx-switch[data-testid="hx-switch"]')).toBeAttached();
  });

  test('pass count > 15 after library loads', async ({ page }) => {
    await page.waitForFunction(
      () => document.querySelectorAll('.badge-pass').length > 15,
      { timeout: 8000 }
    );
    const passCount = await page.locator('.badge-pass').count();
    expect(passCount).toBeGreaterThan(15);
  });
});
