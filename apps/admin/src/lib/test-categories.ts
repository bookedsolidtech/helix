/**
 * Test category types and metadata — client-safe (no Node.js imports).
 * Used by both server-side test-results-reader.ts and client UI components.
 */

export type TestCategory =
  | 'rendering'
  | 'api-surface'
  | 'accessibility'
  | 'events-interaction'
  | 'form-integration'
  | 'slots-styling';

export interface CategorySummary {
  category: TestCategory;
  label: string;
  description: string;
  total: number;
  passed: number;
  failed: number;
  color: string;
}

export const TEST_CATEGORY_META: Record<
  TestCategory,
  { label: string; description: string; color: string }
> = {
  rendering: {
    label: 'Rendering',
    description: 'Shadow DOM, component lifecycle, element creation',
    color: '#818cf8', // indigo-400
  },
  'api-surface': {
    label: 'API Surface',
    description: 'Properties, attributes, methods, reflection',
    color: '#38bdf8', // sky-400
  },
  accessibility: {
    label: 'Accessibility',
    description: 'WCAG 2.1 AA, axe-core audits, ARIA, keyboard nav',
    color: '#34d399', // emerald-400
  },
  'events-interaction': {
    label: 'Events & Interaction',
    description: 'Custom events, click handling, keyboard dispatch',
    color: '#fb923c', // orange-400
  },
  'form-integration': {
    label: 'Form Integration',
    description: 'ElementInternals, validation, form association',
    color: '#a78bfa', // violet-400
  },
  'slots-styling': {
    label: 'Slots & Styling',
    description: 'Slot projection, CSS parts, scoped styles, tokens',
    color: '#f472b6', // pink-400
  },
};

/**
 * Classify a test's suite name into one of 6 categories.
 */
export function classifyTest(suite: string): TestCategory {
  const s = suite.toLowerCase();

  // Accessibility
  if (
    s.includes('accessibility') ||
    s.includes('axe-core') ||
    s.includes('aria') ||
    s === 'roving tabindex'
  ) {
    return 'accessibility';
  }

  // Form integration
  if (
    s.startsWith('form') ||
    s === 'validation' ||
    s === 'form association' ||
    s === 'form discovery'
  ) {
    return 'form-integration';
  }

  // Events & Interaction
  if (
    s.startsWith('event') ||
    s.startsWith('keyboard') ||
    s === 'interactivity' ||
    s === 'close behavior' ||
    s === 'disabled behavior'
  ) {
    return 'events-interaction';
  }

  // Slots & Styling
  if (
    s.startsWith('slot') ||
    s.startsWith('css part') ||
    s.startsWith('css custom') ||
    s === 'scoped styles' ||
    s === 'typography' ||
    s === 'dot indicator' ||
    s === 'character counter' ||
    s === 'auto-resize' ||
    s === 'layout behavior'
  ) {
    return 'slots-styling';
  }

  // Rendering
  if (s.startsWith('rendering') || s === 'default icons') {
    return 'rendering';
  }

  // API Surface (properties, methods, attributes — catch-all for Property: *)
  return 'api-surface';
}
