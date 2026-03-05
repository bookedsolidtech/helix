import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@lit/react', 'lit', 'lit/decorators.js', 'lit/directives/class-map.js', 'lit/directives/if-defined.js', 'lit/directives/live.js'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@lit/react': 'LitReact',
        },
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@helix/library': resolve(import.meta.dirname, '../hx-library/src'),
    },
  },
});
