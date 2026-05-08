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
    // Mark @helixui/library source modules as side-effecting so Rollup's
    // tree-shake preserves them through the prod bundle.
    //
    // Why this is necessary: the library uses Lit's `@customElement('hx-tag')`
    // decorator. esbuild compiles this to a top-level expression
    // `Cls = __decorateClass([customElement('hx-tag')], Cls)`, whose only
    // observable side effect is a `customElements.define()` call deep inside
    // Lit's decorator. Rollup's static analysis cannot see that side effect —
    // the call site looks like an assignment to a variable that's only
    // re-exported as a named binding. Story files import these modules with
    // side-effect syntax (`import './hx-button.js'`) but never USE the named
    // exports, so Rollup eliminates the entire module. Result: 0 / 102
    // components register and the deployed Storybook shows raw, unupgraded
    // `<hx-button>` tags.
    //
    // The marker case is `hx-breadcrumb.stories.ts` — the only story that
    // imports a class as a VALUE (`subcomponents: { HelixBreadcrumbItem }`).
    // That value-use forces preservation of the decorator call site for that
    // ONE component; every other story gets shaken to nothing.
    //
    // We expose this as a Vite plugin (rather than `build.rollupOptions.
    // treeshake.moduleSideEffects`) because Storybook's builder-vite passes
    // the merged config through `presets.apply("viteFinal", ...)`, which
    // can serialize functions out of the config object before Rollup sees
    // them. Plugin hooks are NOT serialized, so this fires reliably.
    config.plugins = [
      ...(config.plugins ?? []),
      {
        name: 'helix:preserve-customelement-decorators',
        enforce: 'pre',
        // Rollup's per-module side-effect signal. Returning `true` from the
        // `load` hook's `moduleSideEffects` field tells the tree-shaker:
        // "do not drop this module even if no exports are consumed." We do
        // NOT return code from this hook — only the metadata. The actual
        // module body still flows through esbuild's TS transform.
        async resolveId(source, importer) {
          if (!importer) return null;
          // Resolve through the default pipeline first, then tag.
          const resolved = await this.resolve(source, importer, {
            skipSelf: true,
          });
          if (!resolved || resolved.external) return null;
          const norm = resolved.id.replace(/\\/g, '/');
          if (norm.includes('/packages/hx-library/src/') && norm.endsWith('.ts')) {
            return { ...resolved, moduleSideEffects: true };
          }
          return null;
        },
      },
    ];
    return config;
  },
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
