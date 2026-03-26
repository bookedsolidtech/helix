import { describe, it, expect } from 'vitest';
import { computeStats } from '@/lib/issues-loader';
import { SEVERITY_COLORS, STATUS_COLORS } from '@/lib/severity-colors';
import { getBreadcrumbItems } from '@/lib/breadcrumb-utils';
import { classifyTest, TEST_CATEGORY_META } from '@/lib/test-categories';
import type { TrackedIssue, IssueCategory } from '@/types/issues';

function makeIssue(overrides: Partial<TrackedIssue> = {}): TrackedIssue {
  return {
    id: 'issue-1',
    title: 'Test Issue',
    description: 'A test issue',
    severity: 'medium',
    category: 'accessibility' as IssueCategory,
    tags: [],
    status: 'not-started',
    statusHistory: [],
    source: 'manual',
    reporter: 'test',
    firstSeenIn: '0.1.0',
    lastSeenIn: '0.1.0',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeStats invariants', () => {
  it('total equals sum of bySeverity', () => {
    const issues = [
      makeIssue({ severity: 'critical' }),
      makeIssue({ id: '2', severity: 'high' }),
      makeIssue({ id: '3', severity: 'medium' }),
      makeIssue({ id: '4', severity: 'low' }),
    ];
    const stats = computeStats(issues);
    const sumBySeverity = Object.values(stats.bySeverity).reduce((a, b) => a + b, 0);
    expect(sumBySeverity).toBe(stats.total);
  });

  it('total equals sum of byStatus', () => {
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ id: '2', status: 'in-progress' }),
      makeIssue({ id: '3', status: 'blocked' }),
      makeIssue({ id: '4', status: 'not-started' }),
    ];
    const stats = computeStats(issues);
    const sumByStatus = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);
    expect(sumByStatus).toBe(stats.total);
  });

  it('resolvedCount matches byStatus.complete', () => {
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ id: '2', status: 'complete' }),
      makeIssue({ id: '3', status: 'not-started' }),
    ];
    const stats = computeStats(issues);
    expect(stats.resolvedCount).toBe(stats.byStatus.complete);
    expect(stats.resolvedCount).toBe(2);
  });

  it('resolutionRate is 0 for empty array', () => {
    const stats = computeStats([]);
    expect(stats.resolutionRate).toBe(0);
  });

  it('resolutionRate is between 0 and 1', () => {
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ id: '2', status: 'not-started' }),
    ];
    const stats = computeStats(issues);
    expect(stats.resolutionRate).toBeGreaterThanOrEqual(0);
    expect(stats.resolutionRate).toBeLessThanOrEqual(1);
  });
});

describe('severity/status color map consistency', () => {
  it('SEVERITY_COLORS keys cover all possible bySeverity keys', () => {
    const issues = [
      makeIssue({ severity: 'critical' }),
      makeIssue({ id: '2', severity: 'high' }),
      makeIssue({ id: '3', severity: 'medium' }),
      makeIssue({ id: '4', severity: 'low' }),
    ];
    const stats = computeStats(issues);
    for (const key of Object.keys(stats.bySeverity)) {
      expect(SEVERITY_COLORS).toHaveProperty(key);
    }
  });

  it('STATUS_COLORS keys cover all possible byStatus keys', () => {
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ id: '2', status: 'in-progress' }),
      makeIssue({ id: '3', status: 'blocked' }),
      makeIssue({ id: '4', status: 'not-started' }),
    ];
    const stats = computeStats(issues);
    for (const key of Object.keys(stats.byStatus)) {
      expect(STATUS_COLORS).toHaveProperty(key);
    }
  });
});

describe('breadcrumb route pipeline', () => {
  it('generates correct 3-level breadcrumbs for nested route', () => {
    const items = getBreadcrumbItems('/tokens/colors');
    expect(items[0].href).toBe('/');
    expect(items[1].href).toBe('/tokens');
    expect(items[2].href).toBeUndefined();
  });

  it('all intermediate breadcrumbs have href, last does not', () => {
    const routes = ['/tokens/spacing', '/tokens/typography', '/components'];
    for (const route of routes) {
      const items = getBreadcrumbItems(route);
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].href).toBeDefined();
      }
      expect(items[items.length - 1].href).toBeUndefined();
    }
  });

  it('root path returns empty breadcrumbs', () => {
    expect(getBreadcrumbItems('/')).toHaveLength(0);
  });
});

describe('classifyTest + TEST_CATEGORY_META integration', () => {
  it('every classifyTest result has a corresponding meta entry', () => {
    const suites = [
      'Accessibility',
      'Form association',
      'Events',
      'Slots',
      'Rendering',
      'Properties',
      'Unknown suite name',
    ];
    for (const suite of suites) {
      const category = classifyTest(suite);
      expect(TEST_CATEGORY_META[category]).toBeDefined();
      expect(TEST_CATEGORY_META[category].label).toBeTruthy();
      expect(TEST_CATEGORY_META[category].color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('all 6 categories are reachable via classifyTest', () => {
    const reached = new Set<string>();
    const testSuites = [
      'Rendering',
      'Properties',
      'Accessibility',
      'Events',
      'Form association',
      'Slots',
    ];
    for (const suite of testSuites) {
      reached.add(classifyTest(suite));
    }
    expect(reached.size).toBe(6);
  });
});
