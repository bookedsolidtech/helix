import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist',
    rollupOptions: {
      // Externalize Lit so consumers provide their own copy
      external: [/^lit/, /^@lit/],
    },
    sourcemap: true,
    minify: false,
  },
});
