import { helixMetadataPlugin } from './cem-plugins/helix-metadata.mjs';

/** @type {import('@custom-elements-manifest/analyzer').Options} */
export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['**/*.stories.ts', '**/*.styles.ts', '**/*.test.ts'],
  outdir: '.',
  litelement: true,
  dev: false,
  plugins: [
    // AAA Cert Epic — Phase B.1 (rich metadata schema)
    // Reads the @aaa-* / @keyboard-contract / @aria-pattern / @priority-tier /
    // @figma-* / @phi-handles / etc. JSDoc tags and emits a structured
    // `helixMeta: {...}` field on each class declaration. Also keeps the
    // back-compat top-level `aaaCertified` / `aaaCertifiedDate` fields the
    // 3.5.0 schema introduced.
    helixMetadataPlugin(),
  ],
};
