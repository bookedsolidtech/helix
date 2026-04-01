import { describe, it, expect } from 'vitest';
import { getBreadcrumbItems, getComponentBreadcrumbs, getTokenBreadcrumbs } from './breadcrumb-utils';

// ── getBreadcrumbItems ────────────────────────────────────────────────────────

describe('getBreadcrumbItems — home route', () => {
  it('returns an empty array for the root path', () => {
    const items = getBreadcrumbItems('/');
    expect(items).toEqual([]);
  });
});

describe('getBreadcrumbItems — top-level known routes', () => {
  it('generates correct breadcrumbs for /components', () => {
    const items = getBreadcrumbItems('/components');
    expect(items).toHaveLength(2);
    expect(items[0]?.label).toBe('Home');
    expect(items[0]?.href).toBe('/');
    expect(items[1]?.label).toBe('Components');
    expect(items[1]?.href).toBeUndefined();
  });

  it('generates correct breadcrumbs for /tests', () => {
    const items = getBreadcrumbItems('/tests');
    expect(items).toHaveLength(2);
    expect(items[0]?.label).toBe('Home');
    expect(items[1]?.label).toBe('Verification Suite');
    expect(items[1]?.href).toBeUndefined();
  });

  it('generates correct breadcrumbs for /tokens', () => {
    const items = getBreadcrumbItems('/tokens');
    expect(items).toHaveLength(2);
    expect(items[1]?.label).toBe('Tokens');
  });

  it('generates correct breadcrumbs for /pipeline', () => {
    const items = getBreadcrumbItems('/pipeline');
    expect(items).toHaveLength(2);
    expect(items[1]?.label).toBe('Pipeline');
  });

  it('generates correct breadcrumbs for /roadmap', () => {
    const items = getBreadcrumbItems('/roadmap');
    expect(items).toHaveLength(2);
    expect(items[1]?.label).toBe('Issue Tracker');
  });

  it('generates correct breadcrumbs for /hooks', () => {
    const items = getBreadcrumbItems('/hooks');
    expect(items).toHaveLength(2);
    expect(items[1]?.label).toBe('Hooks & MCP Servers');
  });

  it('generates correct breadcrumbs for /mcp', () => {
    const items = getBreadcrumbItems('/mcp');
    expect(items).toHaveLength(2);
    expect(items[1]?.label).toBe('MCP Server');
  });
});

describe('getBreadcrumbItems — nested token routes', () => {
  it.each(['colors', 'spacing', 'typography', 'borders', 'shadows', 'utilities'])(
    'generates breadcrumbs for /tokens/%s',
    (category) => {
      const items = getBreadcrumbItems(`/tokens/${category}`);
      expect(items).toHaveLength(3);
      expect(items[0]?.label).toBe('Home');
      expect(items[1]?.label).toBe('Tokens');
      expect(items[1]?.href).toBe('/tokens');
      expect(items[2]?.href).toBeUndefined();
    },
  );

  it('generates breadcrumb with correct label for /tokens/colors', () => {
    const items = getBreadcrumbItems('/tokens/colors');
    expect(items[2]?.label).toBe('Colors');
  });

  it('generates breadcrumb with correct label for /tokens/spacing', () => {
    const items = getBreadcrumbItems('/tokens/spacing');
    expect(items[2]?.label).toBe('Spacing');
  });

  it('generates breadcrumb with correct label for /tokens/typography', () => {
    const items = getBreadcrumbItems('/tokens/typography');
    expect(items[2]?.label).toBe('Typography');
  });
});

describe('getBreadcrumbItems — dynamic component routes', () => {
  it('generates breadcrumbs for /components/[tag] with a component tag', () => {
    const items = getBreadcrumbItems('/components/[tag]', 'hx-button');
    expect(items).toHaveLength(3);
    expect(items[0]?.label).toBe('Home');
    expect(items[1]?.label).toBe('Components');
    expect(items[2]?.label).toBe('hx-button');
    expect(items[2]?.href).toBeUndefined();
  });

  it('assigns component-tag iconType to the last item', () => {
    const items = getBreadcrumbItems('/components/[tag]', 'hx-card');
    expect(items[2]?.iconType).toBe('component-tag');
  });
});

describe('getBreadcrumbItems — intermediate items have href', () => {
  it('the first intermediate item links back to /tokens', () => {
    const items = getBreadcrumbItems('/tokens/colors');
    expect(items[1]?.href).toBe('/tokens');
  });

  it('the home item always has href set to /', () => {
    const items = getBreadcrumbItems('/components');
    expect(items[0]?.href).toBe('/');
  });
});

describe('getBreadcrumbItems — icon types', () => {
  it('home item has iconType "home"', () => {
    const items = getBreadcrumbItems('/components');
    expect(items[0]?.iconType).toBe('home');
  });

  it('/components item has iconType "components"', () => {
    const items = getBreadcrumbItems('/components');
    expect(items[1]?.iconType).toBe('components');
  });

  it('/tests item has iconType "tests"', () => {
    const items = getBreadcrumbItems('/tests');
    expect(items[1]?.iconType).toBe('tests');
  });

  it('token sub-page items have iconType "tokens"', () => {
    const items = getBreadcrumbItems('/tokens/colors');
    expect(items[2]?.iconType).toBe('tokens');
  });
});

describe('getBreadcrumbItems — unknown routes', () => {
  it('formats unknown single segment with capitalization', () => {
    const items = getBreadcrumbItems('/unknown-page');
    expect(items).toHaveLength(2);
    expect(items[1]?.label).toBe('Unknown Page');
  });

  it('produces multiple items for multi-segment unknown routes', () => {
    const items = getBreadcrumbItems('/a/b/c');
    expect(items).toHaveLength(4);
    expect(items[0]?.label).toBe('Home');
  });
});

// ── getComponentBreadcrumbs ───────────────────────────────────────────────────

describe('getComponentBreadcrumbs', () => {
  it('returns 3 items: Home > Components > tag', () => {
    const items = getComponentBreadcrumbs('hx-button');
    expect(items).toHaveLength(3);
  });

  it('first item is Home with href /', () => {
    const items = getComponentBreadcrumbs('hx-button');
    expect(items[0]?.label).toBe('Home');
    expect(items[0]?.href).toBe('/');
  });

  it('second item is Components with href /components', () => {
    const items = getComponentBreadcrumbs('hx-button');
    expect(items[1]?.label).toBe('Components');
    expect(items[1]?.href).toBe('/components');
  });

  it('third item is the component tag with no href', () => {
    const items = getComponentBreadcrumbs('hx-button');
    expect(items[2]?.label).toBe('hx-button');
    expect(items[2]?.href).toBeUndefined();
  });

  it('works for any hx- prefixed component', () => {
    const items = getComponentBreadcrumbs('hx-text-input');
    expect(items[2]?.label).toBe('hx-text-input');
  });

  it('last item has component-tag iconType', () => {
    const items = getComponentBreadcrumbs('hx-card');
    expect(items[2]?.iconType).toBe('component-tag');
  });
});

// ── getTokenBreadcrumbs ───────────────────────────────────────────────────────

describe('getTokenBreadcrumbs', () => {
  it('returns 3 items: Home > Tokens > category', () => {
    const items = getTokenBreadcrumbs('colors');
    expect(items).toHaveLength(3);
  });

  it('first item is Home with href /', () => {
    const items = getTokenBreadcrumbs('colors');
    expect(items[0]?.label).toBe('Home');
    expect(items[0]?.href).toBe('/');
  });

  it('second item is Tokens with href /tokens', () => {
    const items = getTokenBreadcrumbs('colors');
    expect(items[1]?.label).toBe('Tokens');
    expect(items[1]?.href).toBe('/tokens');
  });

  it('uses known label for "colors"', () => {
    const items = getTokenBreadcrumbs('colors');
    expect(items[2]?.label).toBe('Colors');
  });

  it('uses known label for "spacing"', () => {
    const items = getTokenBreadcrumbs('spacing');
    expect(items[2]?.label).toBe('Spacing');
  });

  it('uses known label for "typography"', () => {
    const items = getTokenBreadcrumbs('typography');
    expect(items[2]?.label).toBe('Typography');
  });

  it('uses known label for "borders"', () => {
    const items = getTokenBreadcrumbs('borders');
    expect(items[2]?.label).toBe('Borders');
  });

  it('uses known label for "shadows"', () => {
    const items = getTokenBreadcrumbs('shadows');
    expect(items[2]?.label).toBe('Shadows');
  });

  it('uses known label for "utilities"', () => {
    const items = getTokenBreadcrumbs('utilities');
    expect(items[2]?.label).toBe('Utilities');
  });

  it('falls back to capitalized category for unknown token categories', () => {
    const items = getTokenBreadcrumbs('motion');
    expect(items[2]?.label).toBe('Motion');
  });

  it('last item has no href', () => {
    const items = getTokenBreadcrumbs('colors');
    expect(items[2]?.href).toBeUndefined();
  });
});
