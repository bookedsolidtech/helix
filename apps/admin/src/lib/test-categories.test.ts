import { describe, it, expect } from 'vitest';
import { TEST_CATEGORY_META, classifyTest } from './test-categories';
import type { TestCategory } from './test-categories';

// ── TEST_CATEGORY_META ────────────────────────────────────────────────────────

describe('TEST_CATEGORY_META — key coverage', () => {
  const categories: TestCategory[] = [
    'rendering',
    'api-surface',
    'accessibility',
    'events-interaction',
    'form-integration',
    'slots-styling',
  ];

  it('has an entry for every category', () => {
    for (const category of categories) {
      expect(TEST_CATEGORY_META).toHaveProperty(category);
    }
  });

  it('has exactly 6 category entries', () => {
    expect(Object.keys(TEST_CATEGORY_META)).toHaveLength(6);
  });
});

describe('TEST_CATEGORY_META — shape', () => {
  const allCategories = Object.keys(TEST_CATEGORY_META) as TestCategory[];

  it.each(allCategories)('%s has label, description, and color', (category) => {
    const meta = TEST_CATEGORY_META[category];
    expect(meta).toHaveProperty('label');
    expect(meta).toHaveProperty('description');
    expect(meta).toHaveProperty('color');
    expect(typeof meta.label).toBe('string');
    expect(typeof meta.description).toBe('string');
    expect(typeof meta.color).toBe('string');
    expect(meta.label.length).toBeGreaterThan(0);
    expect(meta.description.length).toBeGreaterThan(0);
  });

  it('all color values are valid hex codes', () => {
    for (const category of allCategories) {
      expect(TEST_CATEGORY_META[category].color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

// ── classifyTest ──────────────────────────────────────────────────────────────

describe('classifyTest — accessibility', () => {
  it('classifies "accessibility" suites correctly', () => {
    expect(classifyTest('accessibility')).toBe('accessibility');
    expect(classifyTest('Accessibility')).toBe('accessibility');
    expect(classifyTest('ACCESSIBILITY')).toBe('accessibility');
  });

  it('classifies "axe-core" suites correctly', () => {
    expect(classifyTest('axe-core audit')).toBe('accessibility');
    expect(classifyTest('axe-core')).toBe('accessibility');
  });

  it('classifies "aria" suites correctly', () => {
    expect(classifyTest('aria attributes')).toBe('accessibility');
    expect(classifyTest('ARIA')).toBe('accessibility');
  });

  it('classifies "roving tabindex" exactly', () => {
    expect(classifyTest('Roving tabindex')).toBe('accessibility');
    expect(classifyTest('roving tabindex')).toBe('accessibility');
  });
});

describe('classifyTest — form-integration', () => {
  it('classifies suites starting with "form"', () => {
    expect(classifyTest('form')).toBe('form-integration');
    expect(classifyTest('form association')).toBe('form-integration');
    expect(classifyTest('form validation')).toBe('form-integration');
    expect(classifyTest('form submission')).toBe('form-integration');
  });

  it('classifies "validation" exactly', () => {
    expect(classifyTest('validation')).toBe('form-integration');
    expect(classifyTest('Validation')).toBe('form-integration');
  });

  it('classifies "form association" exactly', () => {
    expect(classifyTest('form association')).toBe('form-integration');
  });

  it('classifies "form discovery" exactly', () => {
    expect(classifyTest('form discovery')).toBe('form-integration');
  });
});

describe('classifyTest — events-interaction', () => {
  it('classifies suites starting with "event"', () => {
    expect(classifyTest('events')).toBe('events-interaction');
    expect(classifyTest('event dispatching')).toBe('events-interaction');
    expect(classifyTest('Event handling')).toBe('events-interaction');
  });

  it('classifies suites starting with "keyboard"', () => {
    expect(classifyTest('keyboard navigation')).toBe('events-interaction');
    expect(classifyTest('keyboard shortcuts')).toBe('events-interaction');
    expect(classifyTest('Keyboard')).toBe('events-interaction');
  });

  it('classifies "interactivity" exactly', () => {
    expect(classifyTest('interactivity')).toBe('events-interaction');
    expect(classifyTest('Interactivity')).toBe('events-interaction');
  });

  it('classifies "close behavior" exactly', () => {
    expect(classifyTest('close behavior')).toBe('events-interaction');
  });

  it('classifies "disabled behavior" exactly', () => {
    expect(classifyTest('disabled behavior')).toBe('events-interaction');
  });
});

describe('classifyTest — slots-styling', () => {
  it('classifies suites starting with "slot"', () => {
    expect(classifyTest('slots')).toBe('slots-styling');
    expect(classifyTest('slot content')).toBe('slots-styling');
    expect(classifyTest('Slots')).toBe('slots-styling');
  });

  it('classifies suites starting with "css part"', () => {
    expect(classifyTest('css parts')).toBe('slots-styling');
    expect(classifyTest('css part styling')).toBe('slots-styling');
    expect(classifyTest('CSS part')).toBe('slots-styling');
  });

  it('classifies suites starting with "css custom"', () => {
    expect(classifyTest('css custom properties')).toBe('slots-styling');
    expect(classifyTest('CSS Custom Properties')).toBe('slots-styling');
  });

  it('classifies "scoped styles" exactly', () => {
    expect(classifyTest('scoped styles')).toBe('slots-styling');
  });

  it('classifies "typography" exactly', () => {
    expect(classifyTest('typography')).toBe('slots-styling');
    expect(classifyTest('Typography')).toBe('slots-styling');
  });

  it('classifies "dot indicator" exactly', () => {
    expect(classifyTest('dot indicator')).toBe('slots-styling');
  });

  it('classifies "character counter" exactly', () => {
    expect(classifyTest('character counter')).toBe('slots-styling');
  });

  it('classifies "auto-resize" exactly', () => {
    expect(classifyTest('auto-resize')).toBe('slots-styling');
  });

  it('classifies "layout behavior" exactly', () => {
    expect(classifyTest('layout behavior')).toBe('slots-styling');
  });
});

describe('classifyTest — rendering', () => {
  it('classifies suites starting with "rendering"', () => {
    expect(classifyTest('rendering')).toBe('rendering');
    expect(classifyTest('rendering — shadow DOM')).toBe('rendering');
    expect(classifyTest('Rendering')).toBe('rendering');
  });

  it('classifies "default icons" exactly', () => {
    expect(classifyTest('default icons')).toBe('rendering');
    expect(classifyTest('Default icons')).toBe('rendering');
  });
});

describe('classifyTest — api-surface (catch-all)', () => {
  it('classifies property/attribute suites as api-surface', () => {
    expect(classifyTest('properties')).toBe('api-surface');
    expect(classifyTest('attributes')).toBe('api-surface');
    expect(classifyTest('methods')).toBe('api-surface');
    expect(classifyTest('Property: variant')).toBe('api-surface');
    expect(classifyTest('Property: size')).toBe('api-surface');
  });

  it('classifies unrecognized suites as api-surface', () => {
    expect(classifyTest('unknown suite name')).toBe('api-surface');
    expect(classifyTest('')).toBe('api-surface');
    expect(classifyTest('some random test suite')).toBe('api-surface');
  });
});

describe('classifyTest — priority ordering', () => {
  it('accessibility takes priority over other patterns', () => {
    // "accessibility" should match before form/event/slot checks
    expect(classifyTest('accessibility form')).toBe('accessibility');
  });

  it('form-integration matches before events when starting with "form"', () => {
    expect(classifyTest('form')).toBe('form-integration');
  });
});
