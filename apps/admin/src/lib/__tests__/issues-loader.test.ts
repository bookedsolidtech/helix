import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
}));

import { computeStats, loadIssues, saveIssues } from '@/lib/issues-loader';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import type { TrackedIssue, IssuesIndex, IssueCategory } from '@/types/issues';

const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockExistsSync = vi.mocked(existsSync);

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

describe('computeStats', () => {
  it('returns all zeros for empty array', () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.resolvedCount).toBe(0);
    expect(stats.resolutionRate).toBe(0);
    expect(stats.bySeverity.critical).toBe(0);
    expect(stats.bySeverity.high).toBe(0);
    expect(stats.bySeverity.medium).toBe(0);
    expect(stats.bySeverity.low).toBe(0);
    expect(stats.byStatus['not-started']).toBe(0);
    expect(stats.byStatus['in-progress']).toBe(0);
    expect(stats.byStatus.blocked).toBe(0);
    expect(stats.byStatus.complete).toBe(0);
  });

  it('counts total correctly', () => {
    const stats = computeStats([makeIssue(), makeIssue({ id: '2' })]);
    expect(stats.total).toBe(2);
  });

  it('counts bySeverity correctly', () => {
    const issues = [
      makeIssue({ severity: 'critical' }),
      makeIssue({ id: '2', severity: 'critical' }),
      makeIssue({ id: '3', severity: 'high' }),
    ];
    const stats = computeStats(issues);
    expect(stats.bySeverity.critical).toBe(2);
    expect(stats.bySeverity.high).toBe(1);
    expect(stats.bySeverity.medium).toBe(0);
    expect(stats.bySeverity.low).toBe(0);
  });

  it('counts byStatus correctly', () => {
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ id: '2', status: 'in-progress' }),
      makeIssue({ id: '3', status: 'complete' }),
    ];
    const stats = computeStats(issues);
    expect(stats.byStatus.complete).toBe(2);
    expect(stats.byStatus['in-progress']).toBe(1);
    expect(stats.resolvedCount).toBe(2);
  });

  it('calculates resolution rate with 4 decimal precision', () => {
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ id: '2', status: 'not-started' }),
      makeIssue({ id: '3', status: 'not-started' }),
    ];
    const stats = computeStats(issues);
    expect(stats.resolutionRate).toBeCloseTo(0.3333, 4);
  });

  it('calculates resolution rate of 1 when all complete', () => {
    const issues = [makeIssue({ status: 'complete' }), makeIssue({ id: '2', status: 'complete' })];
    const stats = computeStats(issues);
    expect(stats.resolutionRate).toBe(1);
  });

  it('groups by category', () => {
    const issues = [
      makeIssue({ category: 'accessibility' as IssueCategory }),
      makeIssue({ id: '2', category: 'accessibility' as IssueCategory }),
      makeIssue({ id: '3', category: 'testing' as IssueCategory }),
    ];
    const stats = computeStats(issues);
    expect(stats.byCategory['accessibility']).toBe(2);
    expect(stats.byCategory['testing']).toBe(1);
  });

  it('invariant: total = sum of bySeverity', () => {
    const issues = [
      makeIssue({ severity: 'critical' }),
      makeIssue({ id: '2', severity: 'high' }),
      makeIssue({ id: '3', severity: 'medium' }),
      makeIssue({ id: '4', severity: 'low' }),
    ];
    const stats = computeStats(issues);
    const sum = Object.values(stats.bySeverity).reduce((a, b) => a + b, 0);
    expect(sum).toBe(stats.total);
  });
});

describe('loadIssues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty index when file does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    const result = loadIssues();
    expect(result.issues).toEqual([]);
    expect(result.version).toBe('1.0.0');
    expect(result.stats.total).toBe(0);
  });

  it('parses issues from file when it exists', () => {
    const mockData: IssuesIndex = {
      version: '1.0.0',
      issues: [makeIssue()],
      stats: computeStats([makeIssue()]),
      lastUpdated: '2026-01-01',
    };
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(mockData) as unknown as Buffer);
    const result = loadIssues();
    expect(result.issues).toHaveLength(1);
    expect(result.version).toBe('1.0.0');
  });
});

describe('saveIssues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls writeFileSync with updated data', () => {
    mockExistsSync.mockReturnValue(true);
    const data: IssuesIndex = {
      version: '1.0.0',
      issues: [makeIssue({ status: 'complete' })],
      stats: computeStats([]),
      lastUpdated: 'old-value',
    };
    saveIssues(data);
    expect(mockWriteFileSync).toHaveBeenCalledOnce();
    expect(data.stats.total).toBe(1);
    expect(data.lastUpdated).not.toBe('old-value');
  });

  it('recomputes stats before writing', () => {
    mockExistsSync.mockReturnValue(true);
    const issues = [
      makeIssue({ status: 'complete' }),
      makeIssue({ id: '2', status: 'not-started' }),
    ];
    const data: IssuesIndex = {
      version: '1.0.0',
      issues,
      stats: computeStats([]),
      lastUpdated: '',
    };
    saveIssues(data);
    expect(data.stats.total).toBe(2);
    expect(data.stats.resolvedCount).toBe(1);
  });

  it('updates lastUpdated to current ISO timestamp', () => {
    mockExistsSync.mockReturnValue(true);
    const data: IssuesIndex = {
      version: '1.0.0',
      issues: [],
      stats: computeStats([]),
      lastUpdated: '',
    };
    const before = new Date().toISOString();
    saveIssues(data);
    const after = new Date().toISOString();
    expect(data.lastUpdated >= before).toBe(true);
    expect(data.lastUpdated <= after).toBe(true);
  });
});
