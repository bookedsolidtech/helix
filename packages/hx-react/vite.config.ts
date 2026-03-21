import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function discoverEntryPoints() {
  const componentsDir = resolve(__dirname, 'src/components');
  const entries: Record<string, string> = {
    index: resolve(__dirname, 'src/index.ts'),
  };

  if (!existsSync(componentsDir)) return entries;

  const dirs = readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
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
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [],
    }),
  ],
  build: {
    lib: {
      entry: discoverEntryPoints(),
      formats: ['es'],
    },
    outDir: 'dist',
    rollupOptions: {
      external: [/^react/, /^@lit/, /^lit/, /^@helixui\/library/, /^@helixui\/tokens/],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[name]-[hash].js',
      },
    },
    sourcemap: true,
    minify: false,
  },
});
