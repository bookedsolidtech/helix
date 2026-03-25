/**
 * Tests for the internal registry module.
 *
 * The registry is responsible for tracking reference counts per
 * (root, sheet) pair. Tests run in Node environment and use
 * plain objects as stand-ins for DOM types.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Because registry.ts guards on `typeof window === 'undefined'` we need to
// provide a minimal window global before importing the module so the registry
// code-paths are active during tests.
// ---------------------------------------------------------------------------
const mockSheet1 = { _id: 'sheet1' } as unknown as CSSStyleSheet;
const mockSheet2 = { _id: 'sheet2' } as unknown as CSSStyleSheet;
const mockRoot1 = { _id: 'root1' } as unknown as DocumentOrShadowRoot;
const mockRoot2 = { _id: 'root2' } as unknown as DocumentOrShadowRoot;

// Provide minimal window so SSR guard evaluates to false.
if (typeof window === 'undefined') {
  (globalThis as Record<string, unknown>).window = {};
}

// Import after setting window so the SSR constant is captured correctly.
const {
  getRefCount,
  getRootSheets,
  incrementRef,
  decrementRef,
  clearRegistry,
} = await import('./registry.js');

describe('registry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  // -------------------------------------------------------------------------
  // getRefCount
  // -------------------------------------------------------------------------

  describe('getRefCount', () => {
    it('returns 0 for an unknown root/sheet combination', () => {
      expect(getRefCount(mockRoot1, mockSheet1)).toBe(0);
    });

    it('returns 0 for a known root but unknown sheet', () => {
      incrementRef(mockRoot1, mockSheet1);
      expect(getRefCount(mockRoot1, mockSheet2)).toBe(0);
    });

    it('returns the current ref count after increments', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot1, mockSheet1);
      expect(getRefCount(mockRoot1, mockSheet1)).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // getRootSheets
  // -------------------------------------------------------------------------

  describe('getRootSheets', () => {
    it('returns an empty array for an unknown root', () => {
      expect(getRootSheets(mockRoot1)).toEqual([]);
    });

    it('returns all tracked sheets for a root', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot1, mockSheet2);
      const sheets = getRootSheets(mockRoot1);
      expect(sheets).toHaveLength(2);
      expect(sheets).toContain(mockSheet1);
      expect(sheets).toContain(mockSheet2);
    });

    it('does not return sheets from a different root', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot2, mockSheet2);
      expect(getRootSheets(mockRoot1)).toContain(mockSheet1);
      expect(getRootSheets(mockRoot1)).not.toContain(mockSheet2);
    });
  });

  // -------------------------------------------------------------------------
  // incrementRef
  // -------------------------------------------------------------------------

  describe('incrementRef', () => {
    it('initialises the count at 1 on first call', () => {
      incrementRef(mockRoot1, mockSheet1);
      expect(getRefCount(mockRoot1, mockSheet1)).toBe(1);
    });

    it('increments the count on subsequent calls', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot1, mockSheet1);
      expect(getRefCount(mockRoot1, mockSheet1)).toBe(3);
    });

    it('tracks sheets independently per root', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot2, mockSheet1);
      expect(getRefCount(mockRoot1, mockSheet1)).toBe(1);
      expect(getRefCount(mockRoot2, mockSheet1)).toBe(1);
    });

    it('tracks different sheets independently on the same root', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot1, mockSheet2);
      expect(getRefCount(mockRoot1, mockSheet1)).toBe(2);
      expect(getRefCount(mockRoot1, mockSheet2)).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // decrementRef
  // -------------------------------------------------------------------------

  describe('decrementRef', () => {
    it('returns 0 for an unknown root/sheet combination', () => {
      expect(decrementRef(mockRoot1, mockSheet1)).toBe(0);
    });

    it('decrements the count and returns the new value', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot1, mockSheet1);
      const result = decrementRef(mockRoot1, mockSheet1);
      expect(result).toBe(1);
      expect(getRefCount(mockRoot1, mockSheet1)).toBe(1);
    });

    it('removes the sheet entry when count reaches zero', () => {
      incrementRef(mockRoot1, mockSheet1);
      decrementRef(mockRoot1, mockSheet1);
      expect(getRefCount(mockRoot1, mockSheet1)).toBe(0);
      expect(getRootSheets(mockRoot1)).not.toContain(mockSheet1);
    });

    it('cleans up root entry when all sheets are removed', () => {
      incrementRef(mockRoot1, mockSheet1);
      decrementRef(mockRoot1, mockSheet1);
      // Root should have no tracked sheets
      expect(getRootSheets(mockRoot1)).toHaveLength(0);
    });

    it('floors at zero and does not go negative', () => {
      incrementRef(mockRoot1, mockSheet1);
      decrementRef(mockRoot1, mockSheet1);
      const result = decrementRef(mockRoot1, mockSheet1);
      expect(result).toBe(0);
    });

    it('does not remove a sheet from root when count is still positive', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot1, mockSheet1);
      decrementRef(mockRoot1, mockSheet1);
      expect(getRootSheets(mockRoot1)).toContain(mockSheet1);
    });

    it('removes only the target sheet when multiple sheets exist on root', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot1, mockSheet2);
      decrementRef(mockRoot1, mockSheet1);
      const sheets = getRootSheets(mockRoot1);
      expect(sheets).not.toContain(mockSheet1);
      expect(sheets).toContain(mockSheet2);
    });
  });

  // -------------------------------------------------------------------------
  // clearRegistry
  // -------------------------------------------------------------------------

  describe('clearRegistry', () => {
    it('resets all tracked state', () => {
      incrementRef(mockRoot1, mockSheet1);
      incrementRef(mockRoot2, mockSheet2);
      clearRegistry();
      expect(getRefCount(mockRoot1, mockSheet1)).toBe(0);
      expect(getRefCount(mockRoot2, mockSheet2)).toBe(0);
    });
  });
});
