import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      rollupTypes: true,
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HelixAdoptedStylesheets',
      formats: ['es', 'cjs'],
      fileName: 'adopted-stylesheets',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [/^lit/],
    },
    sourcemap: true,
  },
});
