import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './packages/hx-library/e2e',
  outputDir: './packages/hx-library/.cache/vrt-results',
  snapshotDir: './packages/hx-library/__screenshots__',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  updateSnapshots: 'missing',
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['json', { outputFile: './packages/hx-library/.cache/vrt-results.json' }]],
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
