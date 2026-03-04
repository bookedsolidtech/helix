import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import dts from 'vite-plugin-dts';

// Auto-discover component entry points from src/components/hx-*/index.ts
// Eliminates merge conflicts when multiple component PRs modify this file.
function discoverEntryPoints() {
  const componentsDir = resolve(__dirname, 'src/components');
  const entries: Record<string, string> = {
    index: resolve(__dirname, 'src/index.ts'),
  };

  if (!existsSync(componentsDir)) return entries;

  const dirs = readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('hx-'))
    .map((d) => d.name)
    .sort();

  for (const dir of dirs) {
    const indexPath = resolve(componentsDir, dir, 'index.ts');
    if (existsSync(indexPath)) {
      entries[`components/${dir}/index`] = indexPath;
    }
  }

  return entries;
}

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.stories.ts'],
    }),
  ],
  build: {
    lib: {
      entry: discoverEntryPoints(),
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
