/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';

export default defineConfig({
  plugins: [
    analog({
      ssr: true,
      nitro: {
        routeRules: {
          '/': { prerender: true },
        },
      },
    }),
  ],
  server: {
    port: 3163,
    open: true,
  },
});
