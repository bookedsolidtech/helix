/**
 * Gallery-specific CEM helpers.
 * Runs at build time in Astro frontmatter — never shipped to browser.
 */
import type { ComponentData } from './cem-utils';

// ── Category types ──────────────────────────────────────────────────

export type GalleryCategory =
  | 'actions'
  | 'navigation'
  | 'feedback'
  | 'data-display'
  | 'content'
  | 'form-controls'
  | 'overlays'
  | 'layout'
  | 'media'
  | 'utility'
  | 'uncategorized';

export interface GalleryStats {
  components: number;
  properties: number;
  events: number;
  slots: number;
  cssProperties: number;
  cssParts: number;
}

// ── Category mapping ────────────────────────────────────────────────

const TAG_CATEGORY_MAP: Record<string, GalleryCategory> = {
  // Actions
  'hx-button': 'actions',
  'hx-button-group': 'actions',
  'hx-copy-button': 'actions',
  'hx-icon-button': 'actions',
  'hx-split-button': 'actions',
  'hx-toggle-button': 'actions',
  'hx-link': 'actions',

  // Navigation
  'hx-accordion': 'navigation',
  'hx-accordion-item': 'navigation',
  'hx-breadcrumb': 'navigation',
  'hx-breadcrumb-item': 'navigation',
  'hx-nav': 'navigation',
  'hx-nav-item': 'navigation',
  'hx-pagination': 'navigation',
  'hx-side-nav': 'navigation',
  'hx-steps': 'navigation',
  'hx-step': 'navigation',
  'hx-tabs': 'navigation',
  'hx-tab': 'navigation',
  'hx-tab-panel': 'navigation',
  'hx-top-nav': 'navigation',

  // Feedback
  'hx-alert': 'feedback',
  'hx-badge': 'feedback',
  'hx-message-bar': 'feedback',
  'hx-progress-bar': 'feedback',
  'hx-progress-ring': 'feedback',
  'hx-meter': 'feedback',
  'hx-spinner': 'feedback',
  'hx-skeleton': 'feedback',
  'hx-status-indicator': 'feedback',
  'hx-toast': 'feedback',
  'hx-toast-stack': 'feedback',

  // Data Display
  'hx-data-table': 'data-display',
  'hx-list': 'data-display',
  'hx-list-item': 'data-display',
  'hx-structured-list': 'data-display',
  'hx-structured-list-row': 'data-display',
  'hx-tree-view': 'data-display',
  'hx-tree-item': 'data-display',
  'hx-tag': 'data-display',
  'hx-rating': 'data-display',
  'hx-carousel': 'data-display',
  'hx-carousel-item': 'data-display',
  'hx-code-snippet': 'data-display',

  // Content
  'hx-card': 'content',
  'hx-container': 'content',
  'hx-prose': 'content',
  'hx-text': 'content',
  'hx-tile': 'content',
  'hx-image': 'content',
  'hx-avatar': 'content',
  'hx-icon': 'content',
  'hx-divider': 'content',

  // Form Controls
  'hx-text-input': 'form-controls',
  'hx-textarea': 'form-controls',
  'hx-select': 'form-controls',
  'hx-checkbox': 'form-controls',
  'hx-checkbox-group': 'form-controls',
  'hx-radio': 'form-controls',
  'hx-radio-group': 'form-controls',
  'hx-switch': 'form-controls',
  'hx-number-input': 'form-controls',
  'hx-slider': 'form-controls',
  'hx-date-picker': 'form-controls',
  'hx-time-picker': 'form-controls',
  'hx-color-picker': 'form-controls',
  'hx-combobox': 'form-controls',
  'hx-search': 'form-controls',
  'hx-file-upload': 'form-controls',
  'hx-field': 'form-controls',
  'hx-field-label': 'form-controls',
  'hx-help-text': 'form-controls',
  'hx-form': 'form-controls',
  'hx-format-date': 'form-controls',

  // Overlays
  'hx-dialog': 'overlays',
  'hx-drawer': 'overlays',
  'hx-dropdown': 'overlays',
  'hx-popover': 'overlays',
  'hx-popup': 'overlays',
  'hx-tooltip': 'overlays',
  'hx-contextual-help': 'overlays',
  'hx-menu': 'overlays',
  'hx-menu-item': 'overlays',
  'hx-menu-divider': 'overlays',
  'hx-overflow-menu': 'overlays',
  'hx-action-bar': 'overlays',

  // Layout
  'hx-grid': 'layout',
  'hx-grid-item': 'layout',
  'hx-stack': 'layout',
  'hx-split-panel': 'layout',

  // Utility
  'hx-focus-ring': 'utility',
  'hx-ripple': 'utility',
  'hx-theme': 'utility',
  'hx-visually-hidden': 'utility',
};

const CATEGORY_ORDER: GalleryCategory[] = [
  'actions',
  'navigation',
  'form-controls',
  'data-display',
  'feedback',
  'content',
  'overlays',
  'layout',
  'utility',
  'uncategorized',
];

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  actions: 'Actions',
  navigation: 'Navigation',
  feedback: 'Feedback & Status',
  'data-display': 'Data Display',
  content: 'Content & Media',
  'form-controls': 'Form Controls',
  overlays: 'Overlays & Menus',
  layout: 'Layout',
  media: 'Media',
  utility: 'Utility',
  uncategorized: 'Uncategorized',
};

const CATEGORY_ACCENTS: Record<GalleryCategory, string> = {
  actions: 'electric',
  navigation: 'purple',
  feedback: 'amber',
  'data-display': 'teal',
  content: 'accent',
  'form-controls': 'cyan',
  overlays: 'orange',
  layout: 'green',
  media: 'blue',
  utility: 'neutral',
  uncategorized: 'pink',
};

// ── Public API ──────────────────────────────────────────────────────

export function getCategoryForTag(tagName: string): GalleryCategory {
  return TAG_CATEGORY_MAP[tagName] ?? 'uncategorized';
}

export function getCategoryLabel(category: GalleryCategory): string {
  return CATEGORY_LABELS[category];
}

export function getCategoryAccent(category: GalleryCategory): string {
  return CATEGORY_ACCENTS[category];
}

export function getGalleryStats(components: ComponentData[]): GalleryStats {
  return components.reduce(
    (acc, c) => ({
      components: acc.components + 1,
      properties: acc.properties + c.properties.length,
      events: acc.events + c.events.length,
      slots: acc.slots + c.slots.length,
      cssProperties: acc.cssProperties + c.cssProperties.length,
      cssParts: acc.cssParts + c.cssParts.length,
    }),
    { components: 0, properties: 0, events: 0, slots: 0, cssProperties: 0, cssParts: 0 },
  );
}

export function sortComponentsByCategory(components: ComponentData[]): ComponentData[] {
  return [...components].sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf(getCategoryForTag(a.tagName));
    const catB = CATEGORY_ORDER.indexOf(getCategoryForTag(b.tagName));
    if (catA !== catB) return catA - catB;
    return a.tagName.localeCompare(b.tagName);
  });
}

export function getUniqueCategories(components: ComponentData[]): GalleryCategory[] {
  const seen = new Set<GalleryCategory>();
  for (const c of components) {
    seen.add(getCategoryForTag(c.tagName));
  }
  return CATEGORY_ORDER.filter((cat) => seen.has(cat));
}
