/**
 * Integration test bundle entry point.
 * Bundles Lit + @helix/tokens + all @helix/library components into a single ESM file.
 * This bundle is used by the integration HTML pages instead of importmaps + CDN.
 *
 * Build: npx vite build --config integration/vite.bundle.config.ts
 * Output: integration/dist/helix-bundle.js
 */

// Register all components
export * from '../src/components/hx-alert/index.js';
export * from '../src/components/hx-avatar/index.js';
export * from '../src/components/hx-badge/index.js';
export * from '../src/components/hx-breadcrumb/index.js';
export * from '../src/components/hx-button/index.js';
export * from '../src/components/hx-button-group/index.js';
export * from '../src/components/hx-card/index.js';
export * from '../src/components/hx-checkbox/index.js';
export * from '../src/components/hx-container/index.js';
export * from '../src/components/hx-field/index.js';
export * from '../src/components/hx-form/index.js';
export * from '../src/components/hx-icon-button/index.js';
export * from '../src/components/hx-prose/index.js';
export * from '../src/components/hx-radio-group/index.js';
export * from '../src/components/hx-select/index.js';
export * from '../src/components/hx-slider/index.js';
export * from '../src/components/hx-switch/index.js';
export * from '../src/components/hx-text-input/index.js';
export * from '../src/components/hx-textarea/index.js';
