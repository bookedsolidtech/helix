import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Tell Vue compiler all hx-* tags are custom elements
          isCustomElement: (tag) => tag.startsWith('hx-'),
        },
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HelixVue',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', /^@helix\//],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
