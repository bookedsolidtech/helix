import { describe, it, expect } from 'vitest';
import { SEVERITY_COLORS, STATUS_COLORS } from '@/lib/severity-colors';

describe('SEVERITY_COLORS', () => {
  it('has entries for all four severity levels', () => {
    expect(SEVERITY_COLORS).toHaveProperty('critical');
    expect(SEVERITY_COLORS).toHaveProperty('high');
    expect(SEVERITY_COLORS).toHaveProperty('medium');
    expect(SEVERITY_COLORS).toHaveProperty('low');
  });

  it('each severity entry has bg, text, border, gradient properties', () => {
    for (const value of Object.values(SEVERITY_COLORS)) {
      expect(value).toHaveProperty('bg');
      expect(value).toHaveProperty('text');
      expect(value).toHaveProperty('border');
      expect(value).toHaveProperty('gradient');
    }
  });

  it('critical uses red color scheme', () => {
    expect(SEVERITY_COLORS.critical.text).toContain('red');
    expect(SEVERITY_COLORS.critical.bg).toContain('red');
    expect(SEVERITY_COLORS.critical.border).toContain('red');
  });

  it('high uses amber color scheme', () => {
    expect(SEVERITY_COLORS.high.text).toContain('amber');
    expect(SEVERITY_COLORS.high.bg).toContain('amber');
  });

  it('medium uses blue color scheme', () => {
    expect(SEVERITY_COLORS.medium.text).toContain('blue');
    expect(SEVERITY_COLORS.medium.bg).toContain('blue');
  });

  it('low uses emerald color scheme', () => {
    expect(SEVERITY_COLORS.low.text).toContain('emerald');
    expect(SEVERITY_COLORS.low.bg).toContain('emerald');
  });

  it('gradient values are non-empty strings', () => {
    for (const value of Object.values(SEVERITY_COLORS)) {
      expect(typeof value.gradient).toBe('string');
      expect(value.gradient.length).toBeGreaterThan(0);
    }
  });

  it('has exactly 4 severity entries', () => {
    expect(Object.keys(SEVERITY_COLORS)).toHaveLength(4);
  });
});

describe('STATUS_COLORS', () => {
  it('has entries for all four statuses', () => {
    expect(STATUS_COLORS).toHaveProperty('not-started');
    expect(STATUS_COLORS).toHaveProperty('in-progress');
    expect(STATUS_COLORS).toHaveProperty('blocked');
    expect(STATUS_COLORS).toHaveProperty('complete');
  });

  it('each status entry has bg, text, icon properties', () => {
    for (const value of Object.values(STATUS_COLORS)) {
      expect(value).toHaveProperty('bg');
      expect(value).toHaveProperty('text');
      expect(value).toHaveProperty('icon');
    }
  });

  it('complete status uses emerald color and check-circle icon', () => {
    expect(STATUS_COLORS.complete.text).toContain('emerald');
    expect(STATUS_COLORS.complete.bg).toContain('emerald');
    expect(STATUS_COLORS.complete.icon).toBe('check-circle');
  });

  it('blocked status uses red color scheme', () => {
    expect(STATUS_COLORS.blocked.text).toContain('red');
    expect(STATUS_COLORS.blocked.bg).toContain('red');
  });

  it('in-progress status uses blue color scheme', () => {
    expect(STATUS_COLORS['in-progress'].text).toContain('blue');
  });

  it('not-started status uses zinc color scheme', () => {
    expect(STATUS_COLORS['not-started'].text).toContain('zinc');
  });

  it('has exactly 4 status entries', () => {
    expect(Object.keys(STATUS_COLORS)).toHaveLength(4);
  });
});
