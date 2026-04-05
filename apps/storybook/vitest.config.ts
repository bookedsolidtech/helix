import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    storybookTest({
      configDir: path.join(dirname, '.storybook'),
    }),
  ],
  // Story files live in packages/hx-library/src/ and import component source
  // files that use TypeScript experimentalDecorators. Vite's esbuild-based dep
  // scanner must be told to use experimental decorator mode or it fails to parse
  // those files. Excluding @helixui/library prevents pre-bundling the already-
  // built dist artifacts — CI builds the library before running these tests.
  optimizeDeps: {
    exclude: ['@helixui/library'],
    esbuildOptions: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          useDefineForClassFields: false,
        },
      },
    },
  },
  server: {
    fs: {
      // Allow serving files from the monorepo root and parent directories.
      // Required in git worktrees where node_modules are symlinked from the
      // main project root (outside the worktree directory).
      allow: [
        path.join(dirname, '../..'), // monorepo root in standard checkout
        path.join(dirname, '../../../..'), // main project root in git worktrees
      ],
    },
  },
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: [path.join(dirname, '.storybook/vitest.setup.ts')],
    // Prevent OOM on CI runners with limited memory — story tests are
    // browser-based and cannot be parallelised safely at the file level.
    fileParallelism: false,
  },
});
