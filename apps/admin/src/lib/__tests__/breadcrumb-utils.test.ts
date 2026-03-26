import { describe, it, expect } from 'vitest';
import { getBreadcrumbItems, getComponentBreadcrumbs, getTokenBreadcrumbs } from '@/lib/breadcrumb-utils';

describe('getBreadcrumbItems', () => {
  it('returns empty array for root path', () => {
    expect(getBreadcrumbItems('/')).toEqual([]);
  });

  it('returns Home + Components for /components', () => {
    const items = getBreadcrumbItems('/components');
    expect(items).toHaveLength(2);
    expect(items[0].label).toBe('Home');
    expect(items[0].href).toBe('/');
    expect(items[1].label).toBe('Components');
    expect(items[1].href).toBeUndefined();
  });

  it('returns 3 items for /tokens/colors with correct hrefs', () => {
    const items = getBreadcrumbItems('/tokens/colors');
    expect(items).toHaveLength(3);
    expect(items[0].label).toBe('Home');
    expect(items[1].label).toBe('Tokens');
    expect(items[1].href).toBe('/tokens');
    expect(items[2].label).toBe('Colors');
    expect(items[2].href).toBeUndefined();
  });

  it('handles [tag] dynamic segments with componentTag', () => {
    const items = getBreadcrumbItems('/components/[tag]', 'hx-button');
    const last = items[items.length - 1];
    expect(last.label).toBe('hx-button');
    expect(last.iconType).toBe('component-tag');
  });

  it('keeps hx- prefixed segments as-is', () => {
    const items = getBreadcrumbItems('/components/hx-button');
    const last = items[items.length - 1];
    expect(last.label).toBe('hx-button');
  });

  it('title-cases unknown kebab-case segments', () => {
    const items = getBreadcrumbItems('/some-path');
    const last = items[items.length - 1];
    expect(last.label).toBe('Some Path');
  });

  it('assigns home iconType to first item', () => {
    const items = getBreadcrumbItems('/components');
    expect(items[0].iconType).toBe('home');
  });

  it('assigns components iconType for /components', () => {
    const items = getBreadcrumbItems('/components');
    expect(items[1].iconType).toBe('components');
  });

  it('assigns tests iconType for /tests', () => {
    const items = getBreadcrumbItems('/tests');
    expect(items[1].iconType).toBe('tests');
  });

  it('assigns tokens iconType for /tokens and sub-pages', () => {
    const items = getBreadcrumbItems('/tokens/colors');
    expect(items[1].iconType).toBe('tokens');
    expect(items[2].iconType).toBe('tokens');
  });

  it('assigns pipeline iconType for /pipeline', () => {
    const items = getBreadcrumbItems('/pipeline');
    expect(items[1].iconType).toBe('pipeline');
  });

  it('assigns architecture iconType for /architecture', () => {
    const items = getBreadcrumbItems('/architecture');
    expect(items[1].iconType).toBe('architecture');
  });

  it('assigns hooks iconType for /hooks', () => {
    const items = getBreadcrumbItems('/hooks');
    expect(items[1].iconType).toBe('hooks');
  });

  it('assigns mcp iconType for /mcp', () => {
    const items = getBreadcrumbItems('/mcp');
    expect(items[1].iconType).toBe('mcp');
  });

  it('handles /tokens/spacing', () => {
    const items = getBreadcrumbItems('/tokens/spacing');
    expect(items[2].label).toBe('Spacing');
  });

  it('handles /tokens/typography', () => {
    const items = getBreadcrumbItems('/tokens/typography');
    expect(items[2].label).toBe('Typography');
  });

  it('handles /roadmap with correct label', () => {
    const items = getBreadcrumbItems('/roadmap');
    expect(items[1].label).toBe('Issue Tracker');
  });

  it('intermediate items have href, last item does not', () => {
    const items = getBreadcrumbItems('/tokens/colors');
    for (let i = 0; i < items.length - 1; i++) {
      expect(items[i].href).toBeDefined();
    }
    expect(items[items.length - 1].href).toBeUndefined();
  });
});

describe('getComponentBreadcrumbs', () => {
  it('returns 3 items: Home, Components, tag', () => {
    const items = getComponentBreadcrumbs('hx-button');
    expect(items).toHaveLength(3);
    expect(items[0].label).toBe('Home');
    expect(items[1].label).toBe('Components');
    expect(items[2].label).toBe('hx-button');
  });

  it('sets correct hrefs', () => {
    const items = getComponentBreadcrumbs('hx-card');
    expect(items[0].href).toBe('/');
    expect(items[1].href).toBe('/components');
    expect(items[2].href).toBeUndefined();
  });

  it('assigns component-tag iconType to last item', () => {
    const items = getComponentBreadcrumbs('hx-select');
    expect(items[2].iconType).toBe('component-tag');
  });

  it('works with any component tag name', () => {
    const items = getComponentBreadcrumbs('hx-text-input');
    expect(items[2].label).toBe('hx-text-input');
  });
});

describe('getTokenBreadcrumbs', () => {
  it('returns 3 items for a token sub-page', () => {
    const items = getTokenBreadcrumbs('colors');
    expect(items).toHaveLength(3);
    expect(items[0].label).toBe('Home');
    expect(items[1].label).toBe('Tokens');
    expect(items[2].label).toBe('Colors');
  });

  it('uses ROUTE_LABELS for known categories', () => {
    const items = getTokenBreadcrumbs('spacing');
    expect(items[2].label).toBe('Spacing');
  });

  it('capitalizes unknown categories as fallback', () => {
    const items = getTokenBreadcrumbs('motion');
    expect(items[2].label).toBe('Motion');
  });

  it('sets tokens href for middle item', () => {
    const items = getTokenBreadcrumbs('borders');
    expect(items[1].href).toBe('/tokens');
    expect(items[2].href).toBeUndefined();
  });
});
