import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './packages/wc-library/e2e',
  outputDir: './packages/wc-library/.cache/vrt-results',
  snapshotDir: './packages/wc-library/__screenshots__',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['json', { outputFile: './packages/wc-library/.cache/vrt-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3151',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
