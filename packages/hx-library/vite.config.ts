import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.stories.ts'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/hx-button/index': resolve(__dirname, 'src/components/hx-button/index.ts'),
        'components/hx-card/index': resolve(__dirname, 'src/components/hx-card/index.ts'),
        'components/hx-container/index': resolve(__dirname, 'src/components/hx-container/index.ts'),
        'components/hx-text-input/index': resolve(
          __dirname,
          'src/components/hx-text-input/index.ts',
        ),
        'components/hx-checkbox/index': resolve(__dirname, 'src/components/hx-checkbox/index.ts'),
        'components/hx-select/index': resolve(__dirname, 'src/components/hx-select/index.ts'),
        'components/hx-radio-group/index': resolve(
          __dirname,
          'src/components/hx-radio-group/index.ts',
        ),
        'components/hx-alert/index': resolve(__dirname, 'src/components/hx-alert/index.ts'),
        'components/hx-textarea/index': resolve(__dirname, 'src/components/hx-textarea/index.ts'),
        'components/hx-badge/index': resolve(__dirname, 'src/components/hx-badge/index.ts'),
        'components/hx-switch/index': resolve(__dirname, 'src/components/hx-switch/index.ts'),
        'components/hx-slider/index': resolve(__dirname, 'src/components/hx-slider/index.ts'),
        'components/hx-toggle-button/index': resolve(
          __dirname,
          'src/components/hx-toggle-button/index.ts',
        ),
        'components/hx-form/index': resolve(__dirname, 'src/components/hx-form/index.ts'),
        'components/hx-prose/index': resolve(__dirname, 'src/components/hx-prose/index.ts'),
      },
      formats: ['es'],
    },
    outDir: 'dist',
    rollupOptions: {
      // Externalize Lit and workspace dependencies
      external: [/^lit/, /^@lit/, /^@helix\/tokens/],
      output: {
        // Place entry points at their expected paths
        entryFileNames: '[name].js',
        // Shared code (e.g., design tokens) is chunked to avoid duplication
        chunkFileNames: 'shared/[name]-[hash].js',
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
