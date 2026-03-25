/**
 * Tests for create-stylesheet module.
 *
 * Tests run in Node environment. CSSStyleSheet is mocked globally so that
 * the browser-dependent code paths can be exercised without a real browser.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Setup: provide window and CSSStyleSheet globals so SSR guards pass and
// the factory can create sheet objects.
// ---------------------------------------------------------------------------

class MockCSSStyleSheet {
  private _css = '';

  replaceSync(css: string): void {
    this._css = css;
  }

  get cssText(): string {
    return this._css;
  }
}

// Inject globals before module import.
if (typeof window === 'undefined') {
  (globalThis as Record<string, unknown>).window = {};
}
(globalThis as Record<string, unknown>).CSSStyleSheet = MockCSSStyleSheet;

const { createStyleSheet, createStyleSheetSSR, clearStyleSheetCache } = await import(
  './create-stylesheet.js'
);

describe('createStyleSheet', () => {
  beforeEach(() => {
    clearStyleSheetCache();
  });

  it('returns a CSSStyleSheet instance', () => {
    const sheet = createStyleSheet(':root { color: red; }');
    expect(sheet).toBeInstanceOf(MockCSSStyleSheet);
  });

  it('calls replaceSync with the provided CSS', () => {
    const css = ':root { --color: blue; }';
    const sheet = createStyleSheet(css) as unknown as MockCSSStyleSheet;
    expect(sheet.cssText).toBe(css);
  });

  it('returns the same object for identical CSS strings (deduplication)', () => {
    const css = ':root { --color: green; }';
    const sheet1 = createStyleSheet(css);
    const sheet2 = createStyleSheet(css);
    expect(sheet1).toBe(sheet2);
  });

  it('returns distinct objects for different CSS strings', () => {
    const sheet1 = createStyleSheet(':root { --a: 1; }');
    const sheet2 = createStyleSheet(':root { --b: 2; }');
    expect(sheet1).not.toBe(sheet2);
  });

  it('cache survives multiple calls with the same content', () => {
    const css = 'body { margin: 0; }';
    clearStyleSheetCache();

    const ref1 = createStyleSheet(css);
    const ref2 = createStyleSheet(css);
    const ref3 = createStyleSheet(css);

    // All three calls must return the exact same object — no new allocation.
    expect(ref1).toBe(ref2);
    expect(ref2).toBe(ref3);
  });
});

describe('clearStyleSheetCache', () => {
  it('causes a new CSSStyleSheet to be allocated after clearing', () => {
    const css = ':root { --cleared: true; }';
    const sheet1 = createStyleSheet(css);
    clearStyleSheetCache();
    const sheet2 = createStyleSheet(css);
    // Different object identity — cache was cleared.
    expect(sheet1).not.toBe(sheet2);
  });
});

describe('createStyleSheetSSR', () => {
  it('returns the css string unchanged', () => {
    const css = ':root { --ssr: 1; }';
    expect(createStyleSheetSSR(css)).toBe(css);
  });

  it('is callable in any environment (no window check)', () => {
    // This must not throw even if window were undefined.
    expect(() => createStyleSheetSSR('body {}'));
  });
});
