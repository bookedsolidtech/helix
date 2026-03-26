import { test, expect } from '@playwright/test';

test.describe('Test Theater (/tests)', () => {
  test('loads /tests without server errors', async ({ page }) => {
    const response = await page.goto('/tests');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('does not return a 404', async ({ page }) => {
    const response = await page.goto('/tests');
    expect(response?.status()).not.toBe(404);
  });

  test('main content area is visible', async ({ page }) => {
    await page.goto('/tests');
    const main = page.locator('main, [role="main"]').first();
    await expect(main).toBeVisible();
  });

  test('page has at least one heading', async ({ page }) => {
    await page.goto('/tests');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('body is non-empty', async ({ page }) => {
    await page.goto('/tests');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('can navigate back to home from /tests', async ({ page }) => {
    await page.goto('/tests');
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
