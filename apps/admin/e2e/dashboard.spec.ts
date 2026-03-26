import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('loads home page without server errors', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('page has a non-empty title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('navigation or sidebar is visible', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav, [role="navigation"], aside').first();
    await expect(nav).toBeVisible();
  });

  test('can navigate to /components without errors', async ({ page }) => {
    await page.goto('/components');
    const response = await page.goto('/components');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('can navigate to /tests without errors', async ({ page }) => {
    const response = await page.goto('/tests');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('can navigate to /tokens without errors', async ({ page }) => {
    const response = await page.goto('/tokens');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
