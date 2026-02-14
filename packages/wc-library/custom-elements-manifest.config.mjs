/** @type {import('@custom-elements-manifest/analyzer').Options} */
export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['**/*.stories.ts', '**/*.styles.ts', '**/*.test.ts'],
  outdir: '.',
  litelement: true,
  dev: false,
};
