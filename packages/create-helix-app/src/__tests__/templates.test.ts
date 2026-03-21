import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  COMPONENT_BUNDLES,
  getTemplate,
  getComponentsForBundles,
} from '../templates.js';
import type { Framework } from '../types.js';

// ─── TEMPLATES registry ──────────────────────────────────────────────────────

describe('TEMPLATES', () => {
  const expectedFrameworks: Framework[] = [
    'react-next',
    'react-vite',
    'vue-nuxt',
    'vue-vite',
    'svelte-kit',
    'angular',
    'astro',
    'vanilla',
  ];

  it('defines exactly 8 framework templates', () => {
    expect(TEMPLATES).toHaveLength(8);
  });

  it.each(expectedFrameworks)('includes template for %s', (framework) => {
    const template = TEMPLATES.find((t) => t.id === framework);
    expect(template).toBeDefined();
  });

  it('every template has required fields', () => {
    for (const template of TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.hint).toBeTruthy();
      expect(typeof template.color).toBe('function');
      expect(template.dependencies).toBeDefined();
      expect(template.devDependencies).toBeDefined();
      expect(Array.isArray(template.features)).toBe(true);
      expect(template.features.length).toBeGreaterThan(0);
    }
  });

  it('has unique IDs across all templates', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('vanilla template has no dependencies or devDependencies', () => {
    const vanilla = TEMPLATES.find((t) => t.id === 'vanilla');
    expect(vanilla).toBeDefined();
    expect(Object.keys(vanilla!.dependencies)).toHaveLength(0);
    expect(Object.keys(vanilla!.devDependencies)).toHaveLength(0);
  });

  it('all non-vanilla templates depend on @helixui/library', () => {
    const nonVanilla = TEMPLATES.filter((t) => t.id !== 'vanilla');
    for (const template of nonVanilla) {
      expect(template.dependencies['@helixui/library']).toBeDefined();
    }
  });

  it('all non-vanilla templates include typescript as a devDependency', () => {
    const nonVanilla = TEMPLATES.filter((t) => t.id !== 'vanilla');
    for (const template of nonVanilla) {
      expect(template.devDependencies['typescript']).toBeDefined();
    }
  });
});

// ─── getTemplate ─────────────────────────────────────────────────────────────

describe('getTemplate', () => {
  it('returns the correct template for a valid framework ID', () => {
    const template = getTemplate('react-next');
    expect(template).toBeDefined();
    expect(template!.id).toBe('react-next');
    expect(template!.name).toBe('React + Next.js 15');
  });

  it('returns undefined for an unknown framework ID', () => {
    expect(getTemplate('ember')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getTemplate('')).toBeUndefined();
  });

  it.each([
    ['react-next', 'React + Next.js 15'],
    ['react-vite', 'React + Vite'],
    ['vue-nuxt', 'Vue + Nuxt 4'],
    ['vue-vite', 'Vue + Vite'],
    ['svelte-kit', 'SvelteKit'],
    ['angular', 'Angular 18'],
    ['astro', 'Astro'],
    ['vanilla', 'Vanilla (HTML + CDN)'],
  ] as const)('getTemplate(%s) returns name "%s"', (id, expectedName) => {
    const template = getTemplate(id);
    expect(template).toBeDefined();
    expect(template!.name).toBe(expectedName);
  });
});

// ─── COMPONENT_BUNDLES ───────────────────────────────────────────────────────

describe('COMPONENT_BUNDLES', () => {
  it('defines 7 component bundles', () => {
    expect(COMPONENT_BUNDLES).toHaveLength(7);
  });

  it('has unique bundle IDs', () => {
    const ids = COMPONENT_BUNDLES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all bundles have required fields', () => {
    for (const bundle of COMPONENT_BUNDLES) {
      expect(bundle.id).toBeTruthy();
      expect(bundle.name).toBeTruthy();
      expect(bundle.description).toBeTruthy();
      expect(Array.isArray(bundle.components)).toBe(true);
      expect(bundle.components.length).toBeGreaterThan(0);
    }
  });

  it('"all" bundle contains only the wildcard ["*"]', () => {
    const allBundle = COMPONENT_BUNDLES.find((b) => b.id === 'all');
    expect(allBundle).toBeDefined();
    expect(allBundle!.components).toEqual(['*']);
  });

  it('non-"all" bundles contain only hx-* prefixed components', () => {
    const nonAll = COMPONENT_BUNDLES.filter((b) => b.id !== 'all');
    for (const bundle of nonAll) {
      for (const component of bundle.components) {
        expect(component).toMatch(/^hx-/);
      }
    }
  });

  it('core bundle includes essential components', () => {
    const core = COMPONENT_BUNDLES.find((b) => b.id === 'core');
    expect(core).toBeDefined();
    expect(core!.components).toContain('hx-button');
    expect(core!.components).toContain('hx-card');
    expect(core!.components).toContain('hx-icon');
  });

  it('forms bundle includes form-related components', () => {
    const forms = COMPONENT_BUNDLES.find((b) => b.id === 'forms');
    expect(forms).toBeDefined();
    expect(forms!.components).toContain('hx-text-input');
    expect(forms!.components).toContain('hx-select');
    expect(forms!.components).toContain('hx-checkbox');
  });
});

// ─── getComponentsForBundles ─────────────────────────────────────────────────

describe('getComponentsForBundles', () => {
  it('returns ["*"] when "all" is included', () => {
    expect(getComponentsForBundles(['all'])).toEqual(['*']);
  });

  it('returns ["*"] when "all" is mixed with other bundles', () => {
    expect(getComponentsForBundles(['core', 'all', 'forms'])).toEqual(['*']);
  });

  it('returns components from a single bundle', () => {
    const components = getComponentsForBundles(['core']);
    const coreBundle = COMPONENT_BUNDLES.find((b) => b.id === 'core')!;
    expect(components).toHaveLength(coreBundle.components.length);
    for (const c of coreBundle.components) {
      expect(components).toContain(c);
    }
  });

  it('merges components from multiple bundles', () => {
    const components = getComponentsForBundles(['core', 'forms']);
    const coreBundle = COMPONENT_BUNDLES.find((b) => b.id === 'core')!;
    const formsBundle = COMPONENT_BUNDLES.find((b) => b.id === 'forms')!;

    // Must include all components from both bundles
    for (const c of coreBundle.components) {
      expect(components).toContain(c);
    }
    for (const c of formsBundle.components) {
      expect(components).toContain(c);
    }
  });

  it('produces no duplicate components in merged result', () => {
    const components = getComponentsForBundles([
      'core',
      'forms',
      'navigation',
      'data-display',
      'feedback',
      'layout',
    ]);
    expect(new Set(components).size).toBe(components.length);
  });

  it('returns empty array for unknown bundle IDs', () => {
    const components = getComponentsForBundles(['nonexistent']);
    expect(components).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    const components = getComponentsForBundles([]);
    expect(components).toEqual([]);
  });

  it('ignores unknown bundles mixed with valid ones', () => {
    const components = getComponentsForBundles(['core', 'nonexistent']);
    const coreBundle = COMPONENT_BUNDLES.find((b) => b.id === 'core')!;
    expect(components).toHaveLength(coreBundle.components.length);
  });
});
