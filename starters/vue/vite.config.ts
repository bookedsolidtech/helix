import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat all hx-* tags as native custom elements, not Vue components
          isCustomElement: (tag) => tag.startsWith('hx-'),
        },
      },
    }),
  ],
  server: {
    port: 3162,
    open: true,
  },
});
