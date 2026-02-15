import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/wc-library/vitest.config.ts',
  'apps/storybook/vitest.config.ts',
]);
