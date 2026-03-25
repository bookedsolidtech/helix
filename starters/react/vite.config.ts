import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vite handles HELiX web components as ESM - no special config needed
  // Web components register themselves via customElements.define()
  optimizeDeps: {
    // Ensure lit and web component deps are pre-bundled
    include: ['react', 'react-dom', '@helixui/react', '@lit/react'],
  },
});
