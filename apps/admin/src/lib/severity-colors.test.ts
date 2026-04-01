import { describe, it, expect } from 'vitest';
import { SEVERITY_COLORS, STATUS_COLORS } from './severity-colors';
import type { Severity, IssueStatus } from '@/types/issues';

// ── SEVERITY_COLORS ──────────────────────────────────────────────────────────

describe('SEVERITY_COLORS — key coverage', () => {
  const severities: Severity[] = ['critical', 'high', 'medium', 'low'];

  it('has an entry for every severity level', () => {
    for (const severity of severities) {
      expect(SEVERITY_COLORS).toHaveProperty(severity);
    }
  });

  it('has exactly 4 severity entries', () => {
    expect(Object.keys(SEVERITY_COLORS)).toHaveLength(4);
  });
});

describe('SEVERITY_COLORS — shape', () => {
  const requiredKeys = ['bg', 'text', 'border', 'gradient'] as const;

  it.each(['critical', 'high', 'medium', 'low'] as Severity[])(
    '%s has bg, text, border, and gradient keys',
    (severity) => {
      const entry = SEVERITY_COLORS[severity];
      for (const key of requiredKeys) {
        expect(entry).toHaveProperty(key);
        expect(typeof entry[key]).toBe('string');
        expect(entry[key].length).toBeGreaterThan(0);
      }
    },
  );
});

describe('SEVERITY_COLORS — values', () => {
  it('critical uses red classes', () => {
    expect(SEVERITY_COLORS.critical.bg).toContain('red');
    expect(SEVERITY_COLORS.critical.text).toContain('red');
    expect(SEVERITY_COLORS.critical.border).toContain('red');
    expect(SEVERITY_COLORS.critical.gradient).toContain('red');
  });

  it('high uses amber classes', () => {
    expect(SEVERITY_COLORS.high.bg).toContain('amber');
    expect(SEVERITY_COLORS.high.text).toContain('amber');
    expect(SEVERITY_COLORS.high.border).toContain('amber');
    expect(SEVERITY_COLORS.high.gradient).toContain('amber');
  });

  it('medium uses blue classes', () => {
    expect(SEVERITY_COLORS.medium.bg).toContain('blue');
    expect(SEVERITY_COLORS.medium.text).toContain('blue');
    expect(SEVERITY_COLORS.medium.border).toContain('blue');
    expect(SEVERITY_COLORS.medium.gradient).toContain('blue');
  });

  it('low uses emerald classes', () => {
    expect(SEVERITY_COLORS.low.bg).toContain('emerald');
    expect(SEVERITY_COLORS.low.text).toContain('emerald');
    expect(SEVERITY_COLORS.low.border).toContain('emerald');
    expect(SEVERITY_COLORS.low.gradient).toContain('emerald');
  });

  it('gradient values contain "to-" pattern', () => {
    for (const severity of ['critical', 'high', 'medium', 'low'] as Severity[]) {
      expect(SEVERITY_COLORS[severity].gradient).toContain('from-');
      expect(SEVERITY_COLORS[severity].gradient).toContain('to-');
    }
  });
});

// ── STATUS_COLORS ────────────────────────────────────────────────────────────

describe('STATUS_COLORS — key coverage', () => {
  const statuses: IssueStatus[] = ['not-started', 'in-progress', 'blocked', 'complete'];

  it('has an entry for every status', () => {
    for (const status of statuses) {
      expect(STATUS_COLORS).toHaveProperty(status);
    }
  });

  it('has exactly 4 status entries', () => {
    expect(Object.keys(STATUS_COLORS)).toHaveLength(4);
  });
});

describe('STATUS_COLORS — shape', () => {
  const requiredKeys = ['bg', 'text', 'icon'] as const;

  it.each(['not-started', 'in-progress', 'blocked', 'complete'] as IssueStatus[])(
    '%s has bg, text, and icon keys',
    (status) => {
      const entry = STATUS_COLORS[status];
      for (const key of requiredKeys) {
        expect(entry).toHaveProperty(key);
        expect(typeof entry[key]).toBe('string');
        expect(entry[key].length).toBeGreaterThan(0);
      }
    },
  );
});

describe('STATUS_COLORS — values', () => {
  it('not-started uses zinc/neutral classes', () => {
    expect(STATUS_COLORS['not-started'].bg).toContain('zinc');
    expect(STATUS_COLORS['not-started'].text).toContain('zinc');
  });

  it('in-progress uses blue classes', () => {
    expect(STATUS_COLORS['in-progress'].bg).toContain('blue');
    expect(STATUS_COLORS['in-progress'].text).toContain('blue');
  });

  it('blocked uses red classes', () => {
    expect(STATUS_COLORS.blocked.bg).toContain('red');
    expect(STATUS_COLORS.blocked.text).toContain('red');
  });

  it('complete uses emerald classes', () => {
    expect(STATUS_COLORS.complete.bg).toContain('emerald');
    expect(STATUS_COLORS.complete.text).toContain('emerald');
  });

  it('each status has a non-empty icon identifier', () => {
    for (const status of ['not-started', 'in-progress', 'blocked', 'complete'] as IssueStatus[]) {
      expect(STATUS_COLORS[status].icon).toBeTruthy();
    }
  });
});
