/**
 * Vite build config for creating a self-contained integration test bundle.
 * Bundles Lit + @helix/tokens + all components — no CDN or importmap required.
 */
import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'bundle-entry.ts'),
      formats: ['es'],
      fileName: 'helix-bundle',
    },
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      // Include everything — Lit, tokens, all components bundled together
      external: [],
      output: {
        entryFileNames: 'helix-bundle.js',
        inlineDynamicImports: false,
      },
    },
    sourcemap: false,
    minify: false,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@helix/tokens/lit': resolve(__dirname, '../../../packages/hx-tokens/src/lit.ts'),
      '@helix/tokens/css': resolve(__dirname, '../../../packages/hx-tokens/src/css.ts'),
      '@helix/tokens': resolve(__dirname, '../../../packages/hx-tokens/src/index.ts'),
    },
  },
});
