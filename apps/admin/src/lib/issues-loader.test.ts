import { describe, it, expect } from 'vitest';
import { computeStats } from './issues-loader';
import type { TrackedIssue } from '@/types/issues';

// ── computeStats ─────────────────────────────────────────────────────────────
// Only testing the pure, side-effect-free computeStats function.
// loadIssues / saveIssues / loadReviewsIndex require filesystem access.

function makeIssue(overrides: Partial<TrackedIssue> = {}): TrackedIssue {
  return {
    id: 'test-001',
    title: 'Test issue',
    description: 'A test issue',
    severity: 'medium',
    category: 'testing',
    tags: [],
    status: 'not-started',
    statusHistory: [],
    source: 'manual',
    reporter: 'test',
    firstSeenIn: '0.1.0',
    lastSeenIn: '0.1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('computeStats — empty input', () => {
  it('returns zero total for an empty list', () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
  });

  it('returns 0 resolution rate for an empty list', () => {
    const stats = computeStats([]);
    expect(stats.resolutionRate).toBe(0);
  });

  it('returns 0 resolvedCount for an empty list', () => {
    const stats = computeStats([]);
    expect(stats.resolvedCount).toBe(0);
  });

  it('returns all-zero bySeverity for an empty list', () => {
    const stats = computeStats([]);
    expect(stats.bySeverity.critical).toBe(0);
    expect(stats.bySeverity.high).toBe(0);
    expect(stats.bySeverity.medium).toBe(0);
    expect(stats.bySeverity.low).toBe(0);
  });

  it('returns all-zero byStatus for an empty list', () => {
    const stats = computeStats([]);
    expect(stats.byStatus['not-started']).toBe(0);
    expect(stats.byStatus['in-progress']).toBe(0);
    expect(stats.byStatus.blocked).toBe(0);
    expect(stats.byStatus.complete).toBe(0);
  });

  it('returns empty byCategory for an empty list', () => {
    const stats = computeStats([]);
    expect(stats.byCategory).toEqual({});
  });
});

describe('computeStats — total count', () => {
  it('counts one issue', () => {
    const stats = computeStats([makeIssue()]);
    expect(stats.total).toBe(1);
  });

  it('counts multiple issues', () => {
    const issues = [makeIssue(), makeIssue({ id: 'test-002' }), makeIssue({ id: 'test-003' })];
    const stats = computeStats(issues);
    expect(stats.total).toBe(3);
  });
});

describe('computeStats — bySeverity', () => {
  it('increments the correct severity bucket', () => {
    const issues = [
      makeIssue({ severity: 'critical' }),
      makeIssue({ severity: 'critical' }),
      makeIssue({ severity: 'high' }),
      makeIssue({ severity: 'low' }),
    ];
    const stats = computeStats(issues);
    expect(stats.bySeverity.critical).toBe(2);
    expect(stats.bySeverity.high).toBe(1);
    expect(stats.bySeverity.medium).toBe(0);
    expect(stats.bySeverity.low).toBe(1);
  });

  it('bySeverity values sum to total', () => {
    const issues = [
      makeIssue({ severity: 'critical' }),
      makeIssue({ severity: 'high' }),
      makeIssue({ severity: 'medium' }),
      makeIssue({ severity: 'low' }),
      makeIssue({ severity: 'low' }),
    ];
    const stats = computeStats(issues);
    const sum = Object.values(stats.bySeverity).reduce((a, b) => a + b, 0);
    expect(sum).toBe(stats.total);
  });
});

describe('computeStats — byStatus', () => {
  it('increments the correct status bucket', () => {
    const issues = [
      makeIssue({ status: 'not-started' }),
      makeIssue({ status: 'in-progress' }),
      makeIssue({ status: 'in-progress' }),
      makeIssue({ status: 'complete' }),
    ];
    const stats = computeStats(issues);
    expect(stats.byStatus['not-started']).toBe(1);
    expect(stats.byStatus['in-progress']).toBe(2);
    expect(stats.byStatus.blocked).toBe(0);
    expect(stats.byStatus.complete).toBe(1);
  });

  it('byStatus values sum to total', () => {
    const issues = [
      makeIssue({ status: 'not-started' }),
      makeIssue({ status: 'blocked' }),
      makeIssue({ status: 'complete' }),
    ];
    const stats = computeStats(issues);
    const sum = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);
    expect(sum).toBe(stats.total);
  });
});

describe('computeStats — byCategory', () => {
  it('groups issues by category', () => {
    const issues = [
      makeIssue({ category: 'accessibility' }),
      makeIssue({ category: 'accessibility' }),
      makeIssue({ category: 'testing' }),
    ];
    const stats = computeStats(issues);
    expect(stats.byCategory.accessibility).toBe(2);
    expect(stats.byCategory.testing).toBe(1);
  });

  it('only includes categories present in the input', () => {
    const issues = [makeIssue({ category: 'performance' })];
    const stats = computeStats(issues);
    expect(stats.byCategory.performance).toBe(1);
    expect(stats.byCategory.accessibility).toBeUndefined();
  });
});

describe('computeStats — resolvedCount and resolutionRate', () => {
  it('counts completed issues as resolvedCount', () => {
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ status: 'complete' }),
      makeIssue({ status: 'not-started' }),
    ];
    const stats = computeStats(issues);
    expect(stats.resolvedCount).toBe(2);
  });

  it('calculates resolutionRate as resolved / total (4 decimal precision)', () => {
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ status: 'not-started' }),
    ];
    const stats = computeStats(issues);
    expect(stats.resolutionRate).toBeCloseTo(0.5, 4);
  });

  it('resolutionRate is 1 when all issues are complete', () => {
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ status: 'complete' }),
    ];
    const stats = computeStats(issues);
    expect(stats.resolutionRate).toBe(1);
  });

  it('resolutionRate is 0 when no issues are complete', () => {
    const issues = [
      makeIssue({ status: 'not-started' }),
      makeIssue({ status: 'in-progress' }),
    ];
    const stats = computeStats(issues);
    expect(stats.resolutionRate).toBe(0);
    expect(stats.resolvedCount).toBe(0);
  });
});

describe('computeStats — integration invariants', () => {
  it('bySeverity + byStatus + byCategory all reflect the same list', () => {
    const issues = [
      makeIssue({ id: '1', severity: 'critical', status: 'complete', category: 'accessibility' }),
      makeIssue({ id: '2', severity: 'high', status: 'in-progress', category: 'testing' }),
      makeIssue({ id: '3', severity: 'medium', status: 'not-started', category: 'accessibility' }),
    ];
    const stats = computeStats(issues);

    // Total
    expect(stats.total).toBe(3);

    // Severity
    expect(stats.bySeverity.critical).toBe(1);
    expect(stats.bySeverity.high).toBe(1);
    expect(stats.bySeverity.medium).toBe(1);

    // Status
    expect(stats.byStatus.complete).toBe(1);
    expect(stats.byStatus['in-progress']).toBe(1);
    expect(stats.byStatus['not-started']).toBe(1);

    // Category
    expect(stats.byCategory.accessibility).toBe(2);
    expect(stats.byCategory.testing).toBe(1);

    // Resolution
    expect(stats.resolvedCount).toBe(1);
  });
});
