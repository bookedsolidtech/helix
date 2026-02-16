/**
 * Gallery-specific CEM helpers.
 * Runs at build time in Astro frontmatter — never shipped to browser.
 */
import type { ComponentData } from './cem-utils';

// ── Category types ──────────────────────────────────────────────────

export type GalleryCategory =
  | 'actions'
  | 'feedback'
  | 'content'
  | 'form-controls'
  | 'composition'
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
  'hx-button': 'actions',
  'hx-alert': 'feedback',
  'hx-badge': 'feedback',
  'hx-card': 'content',
  'hx-container': 'content',
  'hx-prose': 'content',
  'hx-text-input': 'form-controls',
  'hx-textarea': 'form-controls',
  'hx-select': 'form-controls',
  'hx-checkbox': 'form-controls',
  'hx-radio-group': 'form-controls',
  'hx-switch': 'form-controls',
  'hx-form': 'composition',
};

const CATEGORY_ORDER: GalleryCategory[] = [
  'actions',
  'feedback',
  'content',
  'form-controls',
  'composition',
  'uncategorized',
];

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  actions: 'Actions',
  feedback: 'Feedback',
  content: 'Content & Layout',
  'form-controls': 'Form Controls',
  composition: 'Composition',
  uncategorized: 'Uncategorized',
};

const CATEGORY_ACCENTS: Record<GalleryCategory, string> = {
  actions: 'electric',
  feedback: 'amber',
  content: 'accent',
  'form-controls': 'cyan',
  composition: 'green',
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
