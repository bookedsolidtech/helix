import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixProse } from './hx-prose.js';
import './index.js';

afterEach(cleanup);

describe('hx-prose', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders as Light DOM (no shadowRoot)', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Hello</p></hx-prose>');
      expect(el.shadowRoot).toBeNull();
    });

    it('content is accessible in light DOM', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Accessible text</p></hx-prose>');
      const p = el.querySelector('p');
      expect(p).toBeTruthy();
      expect(p?.textContent).toBe('Accessible text');
    });

    it('displays as block', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Content</p></hx-prose>');
      const computed = window.getComputedStyle(el);
      expect(computed.display).toBe('block');
    });
  });

  // ─── Properties (5) ───

  describe('Properties', () => {
    it('size defaults to "base"', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Text</p></hx-prose>');
      expect(el.size).toBe('base');
    });

    it('size attribute is reflected', async () => {
      const el = await fixture<HelixProse>('<hx-prose size="sm"><p>Text</p></hx-prose>');
      expect(el.getAttribute('size')).toBe('sm');
      expect(el.size).toBe('sm');
    });

    it('size="lg" sets font-size CSS custom property', async () => {
      const el = await fixture<HelixProse>('<hx-prose size="lg"><p>Text</p></hx-prose>');
      expect(el.size).toBe('lg');
      const value = el.style.getPropertyValue('--hx-prose-font-size');
      expect(value).toContain('--hx-font-size-lg');
    });

    it('max-width sets inline style', async () => {
      const el = await fixture<HelixProse>('<hx-prose max-width="600px"><p>Text</p></hx-prose>');
      expect(el.style.maxWidth).toBe('600px');
    });

    it('clearing maxWidth removes inline style', async () => {
      const el = await fixture<HelixProse>('<hx-prose max-width="600px"><p>Text</p></hx-prose>');
      expect(el.style.maxWidth).toBe('600px');
      el.maxWidth = '';
      await el.updateComplete;
      expect(el.style.maxWidth).toBe('');
    });

    it('dynamically updating size changes CSS custom property', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Text</p></hx-prose>');
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe('');
      el.size = 'sm';
      await el.updateComplete;
      const value = el.style.getPropertyValue('--hx-prose-font-size');
      expect(value).toContain('--hx-font-size-sm');
    });
  });

  // ─── Scoped Styles (3) ───

  describe('Scoped Styles', () => {
    it('adopted stylesheet is injected into document', async () => {
      const _el = await fixture<HelixProse>('<hx-prose><p>Styled</p></hx-prose>');
      const hasProseSheet = document.adoptedStyleSheets.some((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('hx-prose'));
        } catch {
          return false;
        }
      });
      expect(hasProseSheet).toBe(true);
    });

    it('styles are scoped to hx-prose', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Scoped content</p></hx-prose>');
      const p = el.querySelector('p');
      expect(p).toBeTruthy();
      const proseSheet = document.adoptedStyleSheets.find((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('hx-prose'));
        } catch {
          return false;
        }
      });
      expect(proseSheet).toBeTruthy();
      const rules = Array.from(proseSheet!.cssRules);
      const pRule = rules.find((rule) => rule.cssText.includes('hx-prose p'));
      expect(pRule).toBeTruthy();
    });

    it('stylesheet is removed on disconnect', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Temp</p></hx-prose>');
      const sheetCountBefore = document.adoptedStyleSheets.filter((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('hx-prose'));
        } catch {
          return false;
        }
      }).length;
      expect(sheetCountBefore).toBeGreaterThan(0);

      el.remove();

      const sheetCountAfter = document.adoptedStyleSheets.filter((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          return rules.some((rule) => rule.cssText.includes('hx-prose'));
        } catch {
          return false;
        }
      }).length;
      expect(sheetCountAfter).toBe(sheetCountBefore - 1);
    });
  });

  // ─── Typography (5) ───

  describe('Typography', () => {
    it('headings are styled with bold weight', async () => {
      const el = await fixture<HelixProse>('<hx-prose><h2>My Heading</h2></hx-prose>');
      const h2 = el.querySelector('h2');
      expect(h2).toBeTruthy();
      const computed = window.getComputedStyle(h2!);
      expect(Number(computed.fontWeight)).toBeGreaterThanOrEqual(600);
    });

    it('paragraphs have healthcare-appropriate line-height (>=1.5)', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Paragraph text</p></hx-prose>');
      const p = el.querySelector('p');
      expect(p).toBeTruthy();
      const computed = window.getComputedStyle(p!);
      const fontSize = parseFloat(computed.fontSize);
      const lineHeight = parseFloat(computed.lineHeight);
      const ratio = lineHeight / fontSize;
      expect(ratio).toBeGreaterThanOrEqual(1.5);
    });

    it('links are styled with underline', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p><a href="#">Test link</a></p></hx-prose>');
      const link = el.querySelector('a');
      expect(link).toBeTruthy();
      const computed = window.getComputedStyle(link!);
      expect(computed.textDecorationLine).toContain('underline');
    });

    it('blockquotes have left border and italic style', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose><blockquote><p>Quote text</p></blockquote></hx-prose>',
      );
      const bq = el.querySelector('blockquote');
      expect(bq).toBeTruthy();
      const computed = window.getComputedStyle(bq!);
      expect(computed.fontStyle).toBe('italic');
      expect(computed.borderLeftStyle).not.toBe('none');
    });

    it('code blocks have monospace font', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose><pre><code>const x = 1;</code></pre></hx-prose>',
      );
      const pre = el.querySelector('pre');
      expect(pre).toBeTruthy();
      const computed = window.getComputedStyle(pre!);
      expect(computed.fontFamily).toMatch(/mono/i);
    });
  });

  // ─── Accessibility (4) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations with heading content', async () => {
      const el = await fixture<HelixProse>(`
        <hx-prose>
          <h1>Main Heading</h1>
          <p>Introduction paragraph with <a href="#">a link</a>.</p>
          <h2>Section Heading</h2>
          <p>Section content goes here.</p>
        </hx-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with table content', async () => {
      const el = await fixture<HelixProse>(`
        <hx-prose>
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
        </hx-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with list content', async () => {
      const el = await fixture<HelixProse>(`
        <hx-prose>
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
        </hx-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with images that have alt text', async () => {
      const el = await fixture<HelixProse>(`
        <hx-prose>
          <h2>Patient Chart</h2>
          <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="Patient vital signs chart">
          <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="">
        </hx-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
