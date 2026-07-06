import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adoptedStylesheetRegistry } from '../adoptedStylesheetRegistry.js';

/**
 * These tests run in Vitest browser mode (Chromium), where Constructable
 * Stylesheets and `document.adoptedStyleSheets` are available. That means the
 * modern path in `register` — the one that carried the scope-leak defect — is
 * the branch that actually executes here. The fallback (`injectLightStyles`)
 * path cannot run in this environment and is covered by its own tests.
 *
 * The module-level `sheetCache` persists across tests and cannot be cleared, so
 * every test uses a UNIQUE component name. We snapshot and restore
 * `document.adoptedStyleSheets` around each test so adopted sheets from one test
 * do not pollute another.
 */

let adoptedSnapshot: CSSStyleSheet[] = [];

beforeEach(() => {
  adoptedSnapshot = [...document.adoptedStyleSheets];
});

afterEach(() => {
  document.adoptedStyleSheets = adoptedSnapshot;
});

/** Returns the sheets adopted since the snapshot taken in `beforeEach`. */
function newlyAdopted(): CSSStyleSheet[] {
  const before = new Set(adoptedSnapshot);
  return [...document.adoptedStyleSheets].filter((s) => !before.has(s));
}

describe('adoptedStylesheetRegistry', () => {
  describe('scoping (regression guard for the light-DOM leak defect)', () => {
    it('adopts a stylesheet whose rule selector is scoped under [data-hx-styled], never a bare selector', () => {
      adoptedStylesheetRegistry.register('tw-scope-a', 'p { color: red; }');

      const added = newlyAdopted();
      expect(added.length).toBe(1);

      const rules = Array.from(added[0]!.cssRules) as CSSStyleRule[];
      expect(rules.length).toBeGreaterThan(0);

      // Every top-level rule must be scoped to the component wrapper...
      for (const rule of rules) {
        expect(rule.selectorText).toContain('[data-hx-styled="tw-scope-a"]');
      }
      // ...and no rule may keep the bare, page-global `p` selector.
      const selectors = rules.map((r) => r.selectorText);
      expect(selectors).not.toContain('p');
    });
  });

  describe('deduplication', () => {
    it('does not adopt a second sheet when register is called twice with the same name + css', () => {
      adoptedStylesheetRegistry.register('tw-scope-dedup', 'span { margin: 0; }');
      adoptedStylesheetRegistry.register('tw-scope-dedup', 'span { margin: 0; }');

      expect(newlyAdopted().length).toBe(1);
    });
  });

  describe('sanitizeCss rejection', () => {
    it('adopts nothing (and does not throw) when the CSS is rejected by sanitizeCss', () => {
      // `@import` is a hard rejection in sanitizeCss → register must early-return.
      expect(() =>
        adoptedStylesheetRegistry.register(
          'tw-scope-reject',
          '@import url("x.css"); p { color: red; }',
        ),
      ).not.toThrow();

      expect(newlyAdopted().length).toBe(0);
    });

    it('adopts nothing when the CSS has unbalanced braces', () => {
      expect(() =>
        adoptedStylesheetRegistry.register('tw-scope-unbalanced', '.a { color: red; } }'),
      ).not.toThrow();

      expect(newlyAdopted().length).toBe(0);
    });
  });
});
