/**
 * Playwright configuration for Phase 1 Production External Testing.
 * Runs integration tests against static HTML fixtures that simulate
 * Drupal 11 and Next.js 15 consumer environments.
 */
import { defineConfig, devices } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');

export default defineConfig({
  testDir: __dirname,
  testMatch: ['integration.spec.ts'],
  outputDir: resolve(PACKAGE_ROOT, '.cache/integration-results'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: resolve(PACKAGE_ROOT, '.cache/integration-results.json') }],
    ['html', { outputFolder: resolve(PACKAGE_ROOT, '.cache/integration-report'), open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    // Allow extra time for CDN imports in importmaps
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `node ${resolve(__dirname, 'server.js')}`,
    url: 'http://localhost:4321/packages/hx-library/integration/drupal/index.html',
    reuseExistingServer: true,
    timeout: 30000,
    env: {
      PORT: '4321',
    },
  },
});
