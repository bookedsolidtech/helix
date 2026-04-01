import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    include: ['__tests__/**/*.{spec,test}.ts'],
    globals: true,
    setupFiles: ['__tests__/dom-setup.ts'],
  },
});
