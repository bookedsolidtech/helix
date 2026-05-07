import { aaaCertifiedPlugin } from './cem-plugins/aaa-certified.mjs';

/** @type {import('@custom-elements-manifest/analyzer').Options} */
export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['**/*.stories.ts', '**/*.styles.ts', '**/*.test.ts'],
  outdir: '.',
  litelement: true,
  dev: false,
  plugins: [
    // AAA Cert Epic — Workstream A.3
    // Reads `@aaa-certified [date]` JSDoc tags and emits `aaaCertified: true`
    // (and optionally `aaaCertifiedDate`) on the matching class declaration.
    aaaCertifiedPlugin(),
  ],
};
