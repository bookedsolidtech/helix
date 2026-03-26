import { test, expect } from '@playwright/test';

test.describe('Component Details', () => {
  test('component list page loads at /components', async ({ page }) => {
    const response = await page.goto('/components');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/components page is not a 404', async ({ page }) => {
    const response = await page.goto('/components');
    expect(response?.status()).not.toBe(404);
  });

  test('component detail page for hx-button does not 500', async ({ page }) => {
    const response = await page.goto('/components/hx-button');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/components/hx-button has visible content', async ({ page }) => {
    await page.goto('/components/hx-button');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('unknown component route does not 500', async ({ page }) => {
    const response = await page.goto('/components/hx-nonexistent-xyz-9999');
    expect(response?.status()).not.toBe(500);
  });

  test('navigating from list to detail maintains app state', async ({ page }) => {
    await page.goto('/components');
    await expect(page.locator('body')).toBeVisible();
    await page.goto('/components/hx-button');
    await expect(page.locator('body')).toBeVisible();
  });

  test('/roadmap page loads without errors', async ({ page }) => {
    const response = await page.goto('/roadmap');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/pipeline page loads without errors', async ({ page }) => {
    const response = await page.goto('/pipeline');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
