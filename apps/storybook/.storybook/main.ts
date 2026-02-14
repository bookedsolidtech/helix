import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: [
    '../../../packages/wc-library/src/**/*.stories.@(ts|tsx)',
  ],

  addons: [getAbsolutePath("@storybook/addon-a11y"), getAbsolutePath("@storybook/addon-docs")],

  framework: {
    name: getAbsolutePath("@storybook/web-components-vite"),
    options: {},
  },

  core: {
    disableTelemetry: true,
  },

  viteFinal: async (config) => {
    // Ensure Lit and the component library resolve correctly in the monorepo
    return config;
  }
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
