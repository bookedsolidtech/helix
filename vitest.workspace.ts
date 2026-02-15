import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/hx-library/vitest.config.ts',
  'apps/storybook/vitest.config.ts',
]);
