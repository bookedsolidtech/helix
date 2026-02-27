import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Visual Regression Testing configuration for @helix/library.
 *
 * Tests capture screenshots of all 13 components across:
 * - Themes: light, dark
 * - Viewports: desktop (1280x720), tablet (768x1024), mobile (375x667)
 *
 * Prerequisites: Storybook must be running on port 3151.
 * In CI, the storybook static build is served before this suite runs.
 * Locally, run `npm run dev:storybook` then `npm run test:vrt`.
 */
export default defineConfig({
  testDir: './tests/vrt',
  snapshotDir: './__screenshots__',
  outputDir: './.cache/vrt-results',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: './.cache/vrt-report', open: 'never' }],
    ['json', { outputFile: './.cache/vrt-results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:3151',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    // Disable CSS animations and transitions for stable screenshots
    reducedMotion: 'reduce',
  },

  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],

  webServer: {
    // In CI: storybook is served externally before this runs.
    // Locally: run `npm run dev:storybook` first, or let this start a static server.
    command: 'npx http-server ../../apps/storybook/dist -p 3151 --silent',
    url: 'http://localhost:3151',
    // Always reuse an existing server so CI pre-started storybook is used.
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
