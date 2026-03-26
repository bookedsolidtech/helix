import { describe, it, expect } from 'vitest';
import { classifyTest, TEST_CATEGORY_META } from '@/lib/test-categories';
import type { TestCategory } from '@/lib/test-categories';

describe('classifyTest', () => {
  it('classifies accessibility suites', () => {
    expect(classifyTest('Accessibility')).toBe('accessibility');
    expect(classifyTest('axe-core audit')).toBe('accessibility');
    expect(classifyTest('ARIA patterns')).toBe('accessibility');
    expect(classifyTest('roving tabindex')).toBe('accessibility');
  });

  it('classifies form integration suites', () => {
    expect(classifyTest('Form association')).toBe('form-integration');
    expect(classifyTest('validation')).toBe('form-integration');
    expect(classifyTest('form discovery')).toBe('form-integration');
    expect(classifyTest('Forms')).toBe('form-integration');
  });

  it('classifies events and interaction suites', () => {
    expect(classifyTest('Events')).toBe('events-interaction');
    expect(classifyTest('Keyboard navigation')).toBe('events-interaction');
    expect(classifyTest('interactivity')).toBe('events-interaction');
    expect(classifyTest('close behavior')).toBe('events-interaction');
    expect(classifyTest('disabled behavior')).toBe('events-interaction');
  });

  it('classifies slots and styling suites', () => {
    expect(classifyTest('Slots')).toBe('slots-styling');
    expect(classifyTest('CSS parts')).toBe('slots-styling');
    expect(classifyTest('CSS custom properties')).toBe('slots-styling');
    expect(classifyTest('scoped styles')).toBe('slots-styling');
    expect(classifyTest('typography')).toBe('slots-styling');
    expect(classifyTest('dot indicator')).toBe('slots-styling');
    expect(classifyTest('character counter')).toBe('slots-styling');
    expect(classifyTest('auto-resize')).toBe('slots-styling');
    expect(classifyTest('layout behavior')).toBe('slots-styling');
  });

  it('classifies rendering suites', () => {
    expect(classifyTest('rendering')).toBe('rendering');
    expect(classifyTest('Rendering lifecycle')).toBe('rendering');
    expect(classifyTest('default icons')).toBe('rendering');
  });

  it('catches unknown suites as api-surface', () => {
    expect(classifyTest('Properties')).toBe('api-surface');
    expect(classifyTest('unknown suite')).toBe('api-surface');
    expect(classifyTest('Property: variant')).toBe('api-surface');
    expect(classifyTest('Methods')).toBe('api-surface');
  });

  it('classification is case-insensitive', () => {
    expect(classifyTest('ACCESSIBILITY')).toBe('accessibility');
    expect(classifyTest('FORM association')).toBe('form-integration');
    expect(classifyTest('EVENTS')).toBe('events-interaction');
  });
});

describe('TEST_CATEGORY_META', () => {
  it('has entries for all 6 categories', () => {
    const categories: TestCategory[] = [
      'rendering',
      'api-surface',
      'accessibility',
      'events-interaction',
      'form-integration',
      'slots-styling',
    ];
    for (const cat of categories) {
      expect(TEST_CATEGORY_META).toHaveProperty(cat);
    }
  });

  it('each category has label, description, color', () => {
    for (const meta of Object.values(TEST_CATEGORY_META)) {
      expect(typeof meta.label).toBe('string');
      expect(meta.label.length).toBeGreaterThan(0);
      expect(typeof meta.description).toBe('string');
      expect(meta.description.length).toBeGreaterThan(0);
      expect(typeof meta.color).toBe('string');
    }
  });

  it('all colors are valid hex values', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    for (const meta of Object.values(TEST_CATEGORY_META)) {
      expect(meta.color).toMatch(hexPattern);
    }
  });

  it('classifyTest output is always a key in TEST_CATEGORY_META', () => {
    const suites = [
      'Accessibility',
      'Form association',
      'Events',
      'Slots',
      'Rendering',
      'Properties',
      'Unknown anything',
    ];
    for (const suite of suites) {
      const category = classifyTest(suite);
      expect(TEST_CATEGORY_META).toHaveProperty(category);
    }
  });

  it('has exactly 6 entries', () => {
    expect(Object.keys(TEST_CATEGORY_META)).toHaveLength(6);
  });
});
