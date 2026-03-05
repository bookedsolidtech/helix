import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Serve from repo root so relative paths (../../packages/hx-library/dist) resolve correctly
const SERVE_ROOT = path.resolve(__dirname, '../..');

export default defineConfig({
  testDir: '.',
  testMatch: 'verify-integration.spec.ts',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:9123',
    trace: 'off',
  },
  webServer: {
    // npx serve serves the repo root so /testing/static-html/index.html is accessible
    command: `npx serve ${SERVE_ROOT} --listen 9123 --no-clipboard`,
    url: 'http://localhost:9123',
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
