/**
 * Tests for adoptStyles / removeStyles core functions.
 *
 * Tests run in Node environment with mocked DOM types.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks: minimal stand-ins for CSSStyleSheet, Document/ShadowRoot with
// adoptedStyleSheets array semantics.
// ---------------------------------------------------------------------------

class MockCSSStyleSheet {
  replaceSync(_css: string): void {
    /* no-op */
  }
}

function makeMockRoot(): DocumentOrShadowRoot {
  return {
    adoptedStyleSheets: [] as CSSStyleSheet[],
  } as unknown as DocumentOrShadowRoot;
}

// Inject window and CSSStyleSheet globals before module import.
if (typeof window === 'undefined') {
  (globalThis as Record<string, unknown>).window = {};
}
(globalThis as Record<string, unknown>).CSSStyleSheet = MockCSSStyleSheet;

// Import modules under test after globals are in place.
const { adoptStyles, removeStyles } = await import('./adopt-styles.js');
const { getRefCount, clearRegistry } = await import('./registry.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSheet(): CSSStyleSheet {
  return new MockCSSStyleSheet() as unknown as CSSStyleSheet;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('adoptStyles', () => {
  let root: DocumentOrShadowRoot;
  let sheet: CSSStyleSheet;

  beforeEach(() => {
    clearRegistry();
    root = makeMockRoot();
    sheet = makeSheet();
  });

  it('appends a sheet to adoptedStyleSheets', () => {
    adoptStyles(root, sheet);
    expect(root.adoptedStyleSheets).toContain(sheet);
  });

  it('increments the reference count', () => {
    adoptStyles(root, sheet);
    expect(getRefCount(root, sheet)).toBe(1);
  });

  it('does not append the sheet twice when called multiple times', () => {
    adoptStyles(root, sheet);
    adoptStyles(root, sheet);
    const count = root.adoptedStyleSheets.filter((s) => s === sheet).length;
    expect(count).toBe(1);
  });

  it('still increments the ref count on subsequent calls', () => {
    adoptStyles(root, sheet);
    adoptStyles(root, sheet);
    expect(getRefCount(root, sheet)).toBe(2);
  });

  it('handles multiple sheets in a single call', () => {
    const sheet2 = makeSheet();
    adoptStyles(root, sheet, sheet2);
    expect(root.adoptedStyleSheets).toContain(sheet);
    expect(root.adoptedStyleSheets).toContain(sheet2);
  });

  it('keeps sheets from different roots independent', () => {
    const root2 = makeMockRoot();
    adoptStyles(root, sheet);
    adoptStyles(root2, sheet);
    expect(getRefCount(root, sheet)).toBe(1);
    expect(getRefCount(root2, sheet)).toBe(1);
  });

  it('is a no-op when no sheets are passed', () => {
    adoptStyles(root);
    expect(root.adoptedStyleSheets).toHaveLength(0);
  });
});

describe('removeStyles', () => {
  let root: DocumentOrShadowRoot;
  let sheet: CSSStyleSheet;

  beforeEach(() => {
    clearRegistry();
    root = makeMockRoot();
    sheet = makeSheet();
  });

  it('removes a sheet when ref count drops to zero', () => {
    adoptStyles(root, sheet);
    removeStyles(root, sheet);
    expect(root.adoptedStyleSheets).not.toContain(sheet);
  });

  it('decrements the reference count', () => {
    adoptStyles(root, sheet);
    adoptStyles(root, sheet);
    removeStyles(root, sheet);
    expect(getRefCount(root, sheet)).toBe(1);
  });

  it('keeps the sheet when count is still above zero', () => {
    adoptStyles(root, sheet);
    adoptStyles(root, sheet);
    removeStyles(root, sheet);
    expect(root.adoptedStyleSheets).toContain(sheet);
  });

  it('removes the sheet only on the final removeStyles call', () => {
    adoptStyles(root, sheet);
    adoptStyles(root, sheet);
    removeStyles(root, sheet);
    expect(root.adoptedStyleSheets).toContain(sheet);
    removeStyles(root, sheet);
    expect(root.adoptedStyleSheets).not.toContain(sheet);
  });

  it('is safe to call without a prior adoptStyles (no crash)', () => {
    expect(() => removeStyles(root, sheet)).not.toThrow();
  });

  it('does not affect sheets on a different root', () => {
    const root2 = makeMockRoot();
    adoptStyles(root, sheet);
    adoptStyles(root2, sheet);
    removeStyles(root, sheet);
    expect(root2.adoptedStyleSheets).toContain(sheet);
  });

  it('handles multiple sheets in a single call', () => {
    const sheet2 = makeSheet();
    adoptStyles(root, sheet, sheet2);
    removeStyles(root, sheet, sheet2);
    expect(root.adoptedStyleSheets).not.toContain(sheet);
    expect(root.adoptedStyleSheets).not.toContain(sheet2);
  });

  it('is a no-op when no sheets are passed', () => {
    adoptStyles(root, sheet);
    removeStyles(root);
    expect(root.adoptedStyleSheets).toContain(sheet);
  });
});
