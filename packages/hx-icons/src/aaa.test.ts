import { describe, it, expect } from 'vitest';
import { iconLibraryAaaVerdict } from './aaa.js';

describe('iconLibraryAaaVerdict', () => {
  it('returns the canonical verdict for the helix library', () => {
    const v = iconLibraryAaaVerdict('helix');
    expect(v).toEqual({
      contrast: 'pass',
      forcedColors: 'pass',
      opticalSizing: 'pass',
    });
  });

  it('returns the canonical verdict for the fa-free library', () => {
    const v = iconLibraryAaaVerdict('fa-free');
    expect(v).toEqual({
      contrast: 'pass',
      forcedColors: 'pass',
      opticalSizing: 'pass',
    });
  });

  it('returns undefined for unknown libraries (no evidence on file)', () => {
    expect(iconLibraryAaaVerdict('not-a-real-library')).toBeUndefined();
    expect(iconLibraryAaaVerdict('')).toBeUndefined();
  });

  it('does not alias one library to another', () => {
    // Sanity check: each library's verdict is a distinct object reference,
    // not a shared singleton — this protects against future mutation bugs
    // if the verdicts diverge.
    const helix = iconLibraryAaaVerdict('helix');
    const faFree = iconLibraryAaaVerdict('fa-free');
    expect(helix).not.toBe(faFree);
  });

  it('verdict states are typed to the canonical three-state union', () => {
    const v = iconLibraryAaaVerdict('helix');
    expect(v).toBeDefined();
    if (!v) return;
    for (const state of [v.contrast, v.forcedColors, v.opticalSizing]) {
      expect(['pass', 'fail', 'unknown']).toContain(state);
    }
  });
});
