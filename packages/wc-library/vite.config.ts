import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'index': resolve(__dirname, 'src/index.ts'),
        'components/wc-button/index': resolve(__dirname, 'src/components/wc-button/index.ts'),
        'components/wc-card/index': resolve(__dirname, 'src/components/wc-card/index.ts'),
        'components/wc-text-input/index': resolve(__dirname, 'src/components/wc-text-input/index.ts'),
        'components/wc-checkbox/index': resolve(__dirname, 'src/components/wc-checkbox/index.ts'),
        'components/wc-select/index': resolve(__dirname, 'src/components/wc-select/index.ts'),
        'components/wc-radio-group/index': resolve(__dirname, 'src/components/wc-radio-group/index.ts'),
        'components/wc-alert/index': resolve(__dirname, 'src/components/wc-alert/index.ts'),
        'components/wc-textarea/index': resolve(__dirname, 'src/components/wc-textarea/index.ts'),
        'components/wc-badge/index': resolve(__dirname, 'src/components/wc-badge/index.ts'),
        'components/wc-switch/index': resolve(__dirname, 'src/components/wc-switch/index.ts'),
        'components/wc-form/index': resolve(__dirname, 'src/components/wc-form/index.ts'),
        'components/wc-prose/index': resolve(__dirname, 'src/components/wc-prose/index.ts'),
      },
      formats: ['es'],
    },
    outDir: 'dist',
    rollupOptions: {
      // Externalize Lit so consumers provide their own copy
      external: [/^lit/, /^@lit/],
      output: {
        // Place entry points at their expected paths
        entryFileNames: '[name].js',
        // Shared code (e.g., design tokens) is chunked to avoid duplication
        chunkFileNames: 'shared/[name]-[hash].js',
      },
    },
    sourcemap: true,
    minify: false,
  },
});
