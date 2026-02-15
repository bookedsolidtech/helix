import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, cleanup, checkA11y } from '../../test-utils.js';
import type { WcProse } from './wc-prose.js';
import './index.js';

afterEach(cleanup);

describe('wc-prose', () => {

  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders as Light DOM (no shadowRoot)', async () => {
      const el = await fixture<WcProse>('<wc-prose><p>Hello</p></wc-prose>');
      expect(el.shadowRoot).toBeNull();
    });

    it('content is accessible in light DOM', async () => {
      const el = await fixture<WcProse>('<wc-prose><p>Accessible text</p></wc-prose>');
      const p = el.querySelector('p');
      expect(p).toBeTruthy();
      expect(p?.textContent).toBe('Accessible text');
    });

    it('displays as block', async () => {
      const el = await fixture<WcProse>('<wc-prose><p>Content</p></wc-prose>');
      expect(el.style.display).toBe('block');
    });
  });

  // ─── Properties (3) ───

  describe('Properties', () => {
    it('size defaults to "base"', async () => {
      const el = await fixture<WcProse>('<wc-prose><p>Text</p></wc-prose>');
      expect(el.size).toBe('base');
    });

    it('size attribute is reflected', async () => {
      const el = await fixture<WcProse>('<wc-prose size="sm"><p>Text</p></wc-prose>');
      expect(el.getAttribute('size')).toBe('sm');
      expect(el.size).toBe('sm');
    });

    it('max-width sets inline style', async () => {
      const el = await fixture<WcProse>('<wc-prose max-width="600px"><p>Text</p></wc-prose>');
      expect(el.style.maxWidth).toBe('600px');
    });
  });

  // ─── Scoped Styles (3) ───

  describe('Scoped Styles', () => {
    it('adopted stylesheet is injected into document', async () => {
      const el = await fixture<WcProse>('<wc-prose><p>Styled</p></wc-prose>');
      // The AdoptedStylesheetsController injects a CSSStyleSheet into document.adoptedStyleSheets
      const hasProseSheet = document.adoptedStyleSheets.some((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('wc-prose'));
        } catch {
          return false;
        }
      });
      expect(hasProseSheet).toBe(true);
    });

    it('styles are scoped to wc-prose', async () => {
      const el = await fixture<WcProse>('<wc-prose><p>Scoped content</p></wc-prose>');
      const p = el.querySelector('p');
      expect(p).toBeTruthy();
      // Verify that the prose scoped CSS uses wc-prose selectors
      const proseSheet = document.adoptedStyleSheets.find((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('wc-prose'));
        } catch {
          return false;
        }
      });
      expect(proseSheet).toBeTruthy();
      const rules = Array.from(proseSheet!.cssRules);
      const pRule = rules.find((rule) => rule.cssText.includes('wc-prose p'));
      expect(pRule).toBeTruthy();
    });

    it('stylesheet is removed on disconnect', async () => {
      const el = await fixture<WcProse>('<wc-prose><p>Temp</p></wc-prose>');
      const sheetCountBefore = document.adoptedStyleSheets.filter((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('wc-prose'));
        } catch {
          return false;
        }
      }).length;
      expect(sheetCountBefore).toBeGreaterThan(0);

      el.remove();

      const sheetCountAfter = document.adoptedStyleSheets.filter((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('wc-prose'));
        } catch {
          return false;
        }
      }).length;
      expect(sheetCountAfter).toBe(sheetCountBefore - 1);
    });
  });

  // ─── Typography (3) ───

  describe('Typography', () => {
    it('headings are styled', async () => {
      const el = await fixture<WcProse>('<wc-prose><h2>My Heading</h2></wc-prose>');
      const h2 = el.querySelector('h2');
      expect(h2).toBeTruthy();
      const computed = window.getComputedStyle(h2!);
      // Headings should have bold-range font weight (>=600)
      expect(Number(computed.fontWeight)).toBeGreaterThanOrEqual(600);
    });

    it('paragraphs are styled', async () => {
      const el = await fixture<WcProse>('<wc-prose><p>Paragraph text</p></wc-prose>');
      const p = el.querySelector('p');
      expect(p).toBeTruthy();
      const computed = window.getComputedStyle(p!);
      // Paragraphs should have a line-height set (relaxed ~1.75)
      expect(parseFloat(computed.lineHeight)).toBeGreaterThan(0);
    });

    it('links are styled', async () => {
      const el = await fixture<WcProse>('<wc-prose><p><a href="#">Test link</a></p></wc-prose>');
      const link = el.querySelector('a');
      expect(link).toBeTruthy();
      const computed = window.getComputedStyle(link!);
      // Links should have underline text decoration
      expect(computed.textDecorationLine).toContain('underline');
    });
  });

  // ─── Accessibility (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations with heading content', async () => {
      const el = await fixture<WcProse>(`
        <wc-prose>
          <h1>Main Heading</h1>
          <p>Introduction paragraph with <a href="#">a link</a>.</p>
          <h2>Section Heading</h2>
          <p>Section content goes here.</p>
        </wc-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with table content', async () => {
      const el = await fixture<WcProse>(`
        <wc-prose>
          <h2>Data Table</h2>
          <table>
            <thead>
              <tr><th>Name</th><th>Value</th></tr>
            </thead>
            <tbody>
              <tr><td>Item A</td><td>100</td></tr>
              <tr><td>Item B</td><td>200</td></tr>
            </tbody>
          </table>
        </wc-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with list content', async () => {
      const el = await fixture<WcProse>(`
        <wc-prose>
          <h2>Procedure Steps</h2>
          <ol>
            <li>Verify patient identity</li>
            <li>Review medication list</li>
            <li>Document findings</li>
          </ol>
          <ul>
            <li>Gloves</li>
            <li>Mask</li>
            <li>Gown</li>
          </ul>
        </wc-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

});
