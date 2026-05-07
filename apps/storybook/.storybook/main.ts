import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: [
    '../../../packages/hx-library/src/**/*.stories.@(ts|tsx)',
    '../stories/**/*.stories.@(ts|tsx)',
    '../stories/**/*.mdx',
  ],

  addons: [
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-themes'),
    // Figma frame embeds in autodocs (Design panel + <Source> Figma block).
    getAbsolutePath('@storybook/addon-designs'),
    // Toolbar for forcing :hover/:focus/:active/:focus-visible across stories.
    getAbsolutePath('storybook-addon-pseudo-states'),
    // Chromatic capture hooks. Inert without a CHROMATIC_PROJECT_TOKEN; safe
    // to register so consumers opting into VRT do not need a Storybook config
    // change to enable it.
    getAbsolutePath('@chromatic-com/storybook'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/web-components-vite'),
    options: {},
  },

  core: {
    disableTelemetry: true,
  },

  viteFinal: async (config) => {
    config.define = {
      ...config.define,
      'import.meta.env.HELIX_DOCS_URL': JSON.stringify(
        process.env.NEXT_PUBLIC_HELIX_DOCS_URL ?? 'http://localhost:3150',
      ),
      'import.meta.env.HELIX_ADMIN_URL': JSON.stringify(
        process.env.NEXT_PUBLIC_HELIX_ADMIN_URL ?? 'http://localhost:3159',
      ),
    };
    return config;
  },
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
