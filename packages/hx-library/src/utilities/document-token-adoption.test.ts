import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tokenEntries } from '@helixui/tokens';

/**
 * Tests for the document-token-adoption utility module.
 *
 * IMPORTANT: The module auto-executes `ensureDocumentTokens()` on import,
 * so the first import in each test file will trigger adoption immediately.
 *
 * NOTE on module caching (N1): Vitest browser mode does not support
 * `vi.resetModules()`, so the auto-execute path is only tested on
 * first import. Manual calls via `ensureDocumentTokens()` are tested
 * explicitly below with marker resets between tests.
 */

/** Cross-bundle marker — must match the Symbol.for key used in the implementation */
const MARKER = Symbol.for('hx-tokens-adopted');

/** Snapshot of adoptedStyleSheets length before any test-added sheets */
let baseAdoptedCount: number;

/**
 * Resets the document marker and adopted stylesheets between tests
 * so each test starts with a clean slate.
 */
function cleanup(): void {
  // Delete the symbol-keyed marker
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete (document as unknown as Record<symbol, unknown>)[MARKER];
  document.adoptedStyleSheets = [];
}

describe('document-token-adoption', () => {
  beforeEach(() => {
    cleanup();
    baseAdoptedCount = document.adoptedStyleSheets.length;
  });

  afterEach(cleanup);

  /**
   * Helper: dynamically imports the module and returns ensureDocumentTokens.
   * Each call gets a fresh module evaluation because we clear the marker,
   * but the function reference itself is stable.
   */
  async function getEnsureDocumentTokens() {
    const mod = await import('./document-token-adoption.js');
    return mod.ensureDocumentTokens;
  }

  describe('stylesheet adoption', () => {
    it('adds a stylesheet to document.adoptedStyleSheets on first call', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();

      expect(document.adoptedStyleSheets.length).toBe(baseAdoptedCount + 1);
    });

    it('does not add a second stylesheet when called again after the first adoption', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();

      // First call adopts the sheet
      ensureDocumentTokens();
      const countAfterFirst = document.adoptedStyleSheets.length;

      // Second call should be a no-op because the marker is set
      ensureDocumentTokens();

      expect(document.adoptedStyleSheets.length).toBe(countAfterFirst);
    });
  });

  describe('idempotency', () => {
    it('only adopts one stylesheet when called multiple times', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();

      ensureDocumentTokens();
      ensureDocumentTokens();
      ensureDocumentTokens();

      // Regardless of how many calls, only 1 sheet should be added
      // (the auto-execute on import counts as the first call)
      const tokenSheetCount = document.adoptedStyleSheets.length - baseAdoptedCount;
      expect(tokenSheetCount).toBe(1);
    });

    it('does not duplicate the stylesheet across five consecutive calls', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();

      for (let i = 0; i < 5; i++) {
        ensureDocumentTokens();
      }

      const tokenSheetCount = document.adoptedStyleSheets.length - baseAdoptedCount;
      expect(tokenSheetCount).toBe(1);
    });
  });

  describe('document marker', () => {
    it('sets the Symbol marker on document after first call', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();

      const markerValue = (document as unknown as Record<symbol, unknown>)[MARKER];
      expect(markerValue).toBe(MARKER);
    });

    it('does not set the marker before ensureDocumentTokens is called', () => {
      const markerValue = (document as unknown as Record<symbol, unknown>)[MARKER];
      expect(markerValue).toBeUndefined();
    });

    it('marker persists as truthy after multiple calls', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();
      ensureDocumentTokens();
      ensureDocumentTokens();

      const markerValue = (document as unknown as Record<symbol, unknown>)[MARKER];
      expect(markerValue).toBe(MARKER);
    });
  });

  describe('CSS content', () => {
    it('adopted stylesheet contains a :root rule', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();

      const sheet = document.adoptedStyleSheets[document.adoptedStyleSheets.length - 1];
      const rules = Array.from(sheet.cssRules);
      const rootRule = rules.find(
        (r) => r instanceof CSSStyleRule && r.selectorText === ':root',
      );
      expect(rootRule).toBeTruthy();
    });

    it('adopted stylesheet contains --hx- prefixed custom properties', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();

      const sheet = document.adoptedStyleSheets[document.adoptedStyleSheets.length - 1];
      const rootRule = Array.from(sheet.cssRules).find(
        (r) => r instanceof CSSStyleRule && r.selectorText === ':root',
      );

      expect(rootRule).toBeInstanceOf(CSSStyleRule);
      const cssText = (rootRule as CSSStyleRule).cssText;
      expect(cssText).toContain('--hx-');
    });

    it('contains specific known token names from @helixui/tokens', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();

      const sheet = document.adoptedStyleSheets[document.adoptedStyleSheets.length - 1];
      const rootRule = Array.from(sheet.cssRules).find(
        (r) => r instanceof CSSStyleRule && r.selectorText === ':root',
      );
      expect(rootRule).toBeInstanceOf(CSSStyleRule);
      const cssText = (rootRule as CSSStyleRule).cssText;

      // Verify a sampling of tokens that should exist in any HELiX token set
      const sampleTokenNames = tokenEntries.slice(0, 3).map((t) => t.name);
      for (const name of sampleTokenNames) {
        expect(cssText).toContain(name);
      }
    });
  });

  describe('token count', () => {
    it('includes all tokens from @helixui/tokens in the stylesheet', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();

      const sheet = document.adoptedStyleSheets[document.adoptedStyleSheets.length - 1];
      const rootRule = Array.from(sheet.cssRules).find(
        (r) => r instanceof CSSStyleRule && r.selectorText === ':root',
      );
      expect(rootRule).toBeInstanceOf(CSSStyleRule);
      const cssText = (rootRule as CSSStyleRule).cssText;

      // Every token entry name should appear in the stylesheet
      for (const entry of tokenEntries) {
        expect(cssText).toContain(entry.name);
      }
    });

    it('has at least one token entry to validate against', () => {
      // Sanity check: ensure tokenEntries is non-empty so our tests are meaningful
      expect(tokenEntries.length).toBeGreaterThan(0);
    });
  });

  describe('stylesheet presence in document.adoptedStyleSheets', () => {
    it('the last entry in adoptedStyleSheets is the token sheet after adoption', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();

      const lastSheet = document.adoptedStyleSheets[document.adoptedStyleSheets.length - 1];
      expect(lastSheet).toBeInstanceOf(CSSStyleSheet);

      // Verify it contains token declarations
      const rules = Array.from(lastSheet.cssRules);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('preserves existing adoptedStyleSheets when adding tokens', async () => {
      // Add a pre-existing sheet before calling ensureDocumentTokens
      const existingSheet = new CSSStyleSheet();
      existingSheet.replaceSync('body { margin: 0; }');
      document.adoptedStyleSheets = [existingSheet];

      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();

      // The pre-existing sheet should still be first
      expect(document.adoptedStyleSheets[0]).toBe(existingSheet);
      // Token sheet should be appended
      expect(document.adoptedStyleSheets.length).toBe(2);
    });

    it('the token stylesheet is a CSSStyleSheet instance', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();
      ensureDocumentTokens();

      const sheet = document.adoptedStyleSheets[document.adoptedStyleSheets.length - 1];
      expect(sheet).toBeInstanceOf(CSSStyleSheet);
    });
  });

  describe('fresh adoption after marker reset', () => {
    it('re-adopts tokens when the marker is cleared between calls', async () => {
      const ensureDocumentTokens = await getEnsureDocumentTokens();

      ensureDocumentTokens();
      expect(document.adoptedStyleSheets.length).toBe(baseAdoptedCount + 1);

      // Simulate a fresh state (e.g., multiple bundles clearing each other)
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (document as unknown as Record<symbol, unknown>)[MARKER];
      document.adoptedStyleSheets = [];

      ensureDocumentTokens();
      expect(document.adoptedStyleSheets.length).toBe(1);
    });
  });
});
