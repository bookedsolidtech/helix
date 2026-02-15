import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    include: ['src/components/**/*.test.ts'],
    reporters: ['verbose', 'json'],
    outputFile: { json: '.cache/test-results.json' },
    globals: true,
    coverage: {
      provider: 'v8',
      enabled: true,
      include: ['src/components/**/*.ts'],
      exclude: [
        'src/components/**/*.test.ts',
        'src/components/**/*.stories.ts',
        'src/components/**/*.styles.ts',
        'src/components/**/index.ts',
      ],
      reporter: ['text', 'json-summary'],
      reportsDirectory: '.cache/coverage',
    },
  },
});
