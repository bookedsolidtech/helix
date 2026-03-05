import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HelixTelemetry',
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
