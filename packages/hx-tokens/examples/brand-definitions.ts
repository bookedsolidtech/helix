/**
 * Reference brand definitions for HELiX multi-brand theming.
 *
 * These are illustrative examples showing how hospital system white-label
 * implementations register their brand token sets. Import and call
 * HelixBrandRegistry.register() once at application bootstrap — typically
 * in the entry point before any <hx-theme brand="..."> elements render.
 *
 * See packages/hx-tokens/docs/BRAND_THEMING.md for full documentation.
 */

import { HelixBrandRegistry } from '../src/index.js';

// ─── Example: Mercy Health ───────────────────────────────────────────────────
// Deep blue primary palette typical of regional health systems.

HelixBrandRegistry.register('mercy-health', {
  // Primary ramp — brand blue
  '--hx-color-primary-50': '#EFF4FF',
  '--hx-color-primary-100': '#DCE8FF',
  '--hx-color-primary-200': '#BDD3FF',
  '--hx-color-primary-300': '#90B4FF',
  '--hx-color-primary-400': '#5B8AFF',
  '--hx-color-primary-500': '#003DA5',
  '--hx-color-primary-600': '#002D8A',
  '--hx-color-primary-700': '#002070',
  '--hx-color-primary-800': '#001559',
  '--hx-color-primary-900': '#000D3D',
  '--hx-color-primary-950': '#00061F',
  // Secondary ramp — steel teal
  '--hx-color-secondary-50': '#F0FAFB',
  '--hx-color-secondary-100': '#DBF2F5',
  '--hx-color-secondary-200': '#B3E4EA',
  '--hx-color-secondary-300': '#7ACCD7',
  '--hx-color-secondary-400': '#3DAFC0',
  '--hx-color-secondary-500': '#1D8FA3',
  '--hx-color-secondary-600': '#177285',
  '--hx-color-secondary-700': '#135C6C',
  '--hx-color-secondary-800': '#104956',
  '--hx-color-secondary-900': '#0D3A43',
  '--hx-color-secondary-950': '#072229',
});

// ─── Example: Lakeside Medical ───────────────────────────────────────────────
// HELiX default teal palette repurposed for a regional medical center.

HelixBrandRegistry.register('lakeside-medical', {
  // Primary ramp — healthcare teal
  '--hx-color-primary-50': '#F0FDFC',
  '--hx-color-primary-100': '#CCFBF1',
  '--hx-color-primary-200': '#99F6E4',
  '--hx-color-primary-300': '#5EEAD4',
  '--hx-color-primary-400': '#2DD4BF',
  '--hx-color-primary-500': '#007878',
  '--hx-color-primary-600': '#006060',
  '--hx-color-primary-700': '#004F4F',
  '--hx-color-primary-800': '#003B3B',
  '--hx-color-primary-900': '#002B2B',
  '--hx-color-primary-950': '#001A1A',
  // Secondary ramp — warm slate
  '--hx-color-secondary-50': '#F8FAFC',
  '--hx-color-secondary-100': '#F1F5F9',
  '--hx-color-secondary-200': '#E2E8F0',
  '--hx-color-secondary-300': '#CBD5E1',
  '--hx-color-secondary-400': '#94A3B8',
  '--hx-color-secondary-500': '#64748B',
  '--hx-color-secondary-600': '#475569',
  '--hx-color-secondary-700': '#334155',
  '--hx-color-secondary-800': '#1E293B',
  '--hx-color-secondary-900': '#0F172A',
  '--hx-color-secondary-950': '#020617',
});

// ─── Example: Summit Children's Hospital ─────────────────────────────────────
// Warm, approachable purple palette for a pediatric care setting.

HelixBrandRegistry.register('summit-childrens', {
  // Primary ramp — pediatric purple
  '--hx-color-primary-50': '#FAF5FF',
  '--hx-color-primary-100': '#F3E8FF',
  '--hx-color-primary-200': '#E9D5FF',
  '--hx-color-primary-300': '#D8B4FE',
  '--hx-color-primary-400': '#C084FC',
  '--hx-color-primary-500': '#7C3AED',
  '--hx-color-primary-600': '#6D28D9',
  '--hx-color-primary-700': '#5B21B6',
  '--hx-color-primary-800': '#4C1D95',
  '--hx-color-primary-900': '#3B1478',
  '--hx-color-primary-950': '#2E1065',
  // Secondary ramp — soft rose
  '--hx-color-secondary-50': '#FFF1F2',
  '--hx-color-secondary-100': '#FFE4E6',
  '--hx-color-secondary-200': '#FECDD3',
  '--hx-color-secondary-300': '#FDA4AF',
  '--hx-color-secondary-400': '#FB7185',
  '--hx-color-secondary-500': '#E11D48',
  '--hx-color-secondary-600': '#BE123C',
  '--hx-color-secondary-700': '#9F1239',
  '--hx-color-secondary-800': '#881337',
  '--hx-color-secondary-900': '#6D1030',
  '--hx-color-secondary-950': '#4C0519',
});
