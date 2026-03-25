import type { PresetConfig, DrupalPreset } from '../types.js';

export const VALID_PRESETS: DrupalPreset[] = ['standard', 'blog', 'healthcare', 'intranet'];

export function isValidPreset(preset: string): preset is DrupalPreset {
  return VALID_PRESETS.includes(preset as DrupalPreset);
}

const STANDARD_SDCS: string[] = [
  'node-teaser',
  'views-grid',
  'hero-banner',
  'site-header',
  'site-footer',
  'breadcrumb',
  'search-form',
];

const BLOG_SDCS: string[] = [
  ...STANDARD_SDCS,
  'article-full',
  'author-byline',
  'related-articles',
  'tag-cloud',
  'newsletter-signup',
];

const HEALTHCARE_SDCS: string[] = [
  ...BLOG_SDCS,
  'provider-card',
  'appointment-cta',
  'condition-tag',
  'medical-disclaimer',
];

const INTRANET_SDCS: string[] = [
  ...STANDARD_SDCS,
  'dashboard-card',
  'notification-banner',
  'data-table-view',
  'user-profile',
];

const SHARED_DEPENDENCIES: Record<string, string> = {
  '@helixui/drupal-starter': '^0.1.0',
  '@helixui/tokens': '^0.2.0',
};

export const PRESETS: PresetConfig[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Core Drupal SDCs for a general-purpose Drupal theme.',
    sdcList: STANDARD_SDCS,
    dependencies: { ...SHARED_DEPENDENCIES },
    templateVars: {},
    architectureNotes:
      'Includes core content display, navigation, and search patterns suitable for most Drupal sites.',
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Standard SDCs plus blog-specific content components.',
    sdcList: BLOG_SDCS,
    dependencies: { ...SHARED_DEPENDENCIES },
    templateVars: {},
    architectureNotes:
      'Extends standard with article display, authoring, taxonomy, and newsletter patterns.',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Blog SDCs plus healthcare-specific components following The Well patterns.',
    sdcList: HEALTHCARE_SDCS,
    dependencies: { ...SHARED_DEPENDENCIES },
    templateVars: {},
    architectureNotes:
      'Extends blog with provider directory, appointment flows, condition taxonomy, and medical disclaimers. HIPAA-aware component boundaries.',
  },
  {
    id: 'intranet',
    name: 'Intranet',
    description: 'Standard SDCs plus intranet and employee portal components.',
    sdcList: INTRANET_SDCS,
    dependencies: { ...SHARED_DEPENDENCIES },
    templateVars: {},
    architectureNotes:
      'Extends standard with dashboard widgets, notifications, data tables, and user profile patterns for internal applications.',
  },
];

export function getPreset(id: DrupalPreset): PresetConfig {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset) {
    throw new Error(`Unknown preset: "${id}". Valid presets: ${VALID_PRESETS.join(', ')}`);
  }
  return preset;
}
