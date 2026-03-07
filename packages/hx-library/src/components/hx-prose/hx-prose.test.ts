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
      expect(el.style.display).toBe('block');
    });
  });

  // ─── Properties (3) ───

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

    it('max-width sets inline style', async () => {
      const el = await fixture<HelixProse>('<hx-prose max-width="600px"><p>Text</p></hx-prose>');
      expect(el.style.maxWidth).toBe('600px');
    });
  });

  // ─── Scoped Styles (3) ───

  describe('Scoped Styles', () => {
    it('adopted stylesheet is injected into document', async () => {
      const _el = await fixture<HelixProse>('<hx-prose><p>Styled</p></hx-prose>');
      // The AdoptedStylesheetsController injects a CSSStyleSheet into document.adoptedStyleSheets
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

    it('styles are scoped to wc-prose', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Scoped content</p></hx-prose>');
      const p = el.querySelector('p');
      expect(p).toBeTruthy();
      // Verify that the prose scoped CSS uses wc-prose selectors
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

  // ─── Typography (3) ───

  describe('Typography', () => {
    it('headings are styled', async () => {
      const el = await fixture<HelixProse>('<hx-prose><h2>My Heading</h2></hx-prose>');
      const h2 = el.querySelector('h2');
      expect(h2).toBeTruthy();
      const computed = window.getComputedStyle(h2!);
      // Headings should have bold-range font weight (>=600)
      expect(Number(computed.fontWeight)).toBeGreaterThanOrEqual(600);
    });

    it('paragraphs are styled with healthcare-mandated line-height (≥1.5)', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Paragraph text</p></hx-prose>');
      const p = el.querySelector('p');
      expect(p).toBeTruthy();
      const computed = window.getComputedStyle(p!);
      // Healthcare mandate: body copy must have a minimum 1.5 line-height ratio
      const lineHeightRatio = parseFloat(computed.lineHeight) / parseFloat(computed.fontSize);
      expect(lineHeightRatio).toBeGreaterThanOrEqual(1.5);
    });

    it('links are styled', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p><a href="#">Test link</a></p></hx-prose>');
      const link = el.querySelector('a');
      expect(link).toBeTruthy();
      const computed = window.getComputedStyle(link!);
      // Links should have underline text decoration
      expect(computed.textDecorationLine).toContain('underline');
    });
  });

  // ─── Size Variants ───

  describe('Size Variants', () => {
    it('size="lg" sets --hx-prose-font-size to lg token', async () => {
      const el = await fixture<HelixProse>('<hx-prose size="lg"><p>Text</p></hx-prose>');
      expect(el.getAttribute('size')).toBe('lg');
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe(
        'var(--hx-font-size-lg, 1.125rem)',
      );
    });

    it('size="sm" sets --hx-prose-font-size to sm token', async () => {
      const el = await fixture<HelixProse>('<hx-prose size="sm"><p>Text</p></hx-prose>');
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe(
        'var(--hx-font-size-sm, 0.875rem)',
      );
    });

    it('size="base" removes --hx-prose-font-size custom property', async () => {
      const el = await fixture<HelixProse>('<hx-prose size="base"><p>Text</p></hx-prose>');
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe('');
    });

    it('changing size dynamically updates the CSS custom property', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Text</p></hx-prose>');
      expect(el.size).toBe('base');
      el.size = 'sm';
      await el.updateComplete;
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe(
        'var(--hx-font-size-sm, 0.875rem)',
      );
      el.size = 'lg';
      await el.updateComplete;
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe(
        'var(--hx-font-size-lg, 1.125rem)',
      );
    });
  });

  // ─── Max Width ───

  describe('Max Width', () => {
    it('setting maxWidth to empty string clears the inline style', async () => {
      const el = await fixture<HelixProse>('<hx-prose max-width="800px"><p>Text</p></hx-prose>');
      expect(el.style.maxWidth).toBe('800px');
      el.maxWidth = '';
      await el.updateComplete;
      expect(el.style.maxWidth).toBe('');
    });
  });

  // ─── Content Styles ───

  describe('Content Styles', () => {
    it('blockquote renders with left border styling', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose><blockquote><p>Quote text</p></blockquote></hx-prose>',
      );
      const bq = el.querySelector('blockquote');
      expect(bq).toBeTruthy();
      const computed = window.getComputedStyle(bq!);
      expect(computed.borderLeftStyle).not.toBe('none');
      expect(parseFloat(computed.borderLeftWidth)).toBeGreaterThan(0);
    });

    it('pre/code renders with monospace font family', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose><pre><code>const x = 1;</code></pre></hx-prose>',
      );
      const pre = el.querySelector('pre');
      expect(pre).toBeTruthy();
      const computed = window.getComputedStyle(pre!);
      expect(computed.fontFamily).toContain('mono');
    });

    it('img renders as block element', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose><img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="test"></hx-prose>',
      );
      const img = el.querySelector('img');
      expect(img).toBeTruthy();
      const computed = window.getComputedStyle(img!);
      expect(computed.display).toBe('block');
    });

    it('figure renders with bottom margin', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose><figure><img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="test"><figcaption>Caption</figcaption></figure></hx-prose>',
      );
      const figure = el.querySelector('figure');
      expect(figure).toBeTruthy();
      const computed = window.getComputedStyle(figure!);
      expect(parseFloat(computed.marginBottom)).toBeGreaterThan(0);
    });

    it('definition list renders dt/dd elements', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose><dl><dt>Term</dt><dd>Definition</dd></dl></hx-prose>',
      );
      const dt = el.querySelector('dt');
      const dd = el.querySelector('dd');
      expect(dt).toBeTruthy();
      expect(dd).toBeTruthy();
    });
  });

  // ─── Accessibility (3) ───

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
            <li>Goon</li>
          </ul>
        </hx-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('detects axe violation for img missing alt attribute', async () => {
      const el = await fixture<HelixProse>(`
        <hx-prose>
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">
        </hx-prose>
      `);
      const { violations } = await checkA11y(el);
      // axe can scan Light DOM children directly — img without alt is a violation
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.id === 'image-alt')).toBe(true);
    });

    it('has no axe violations for decorative img with empty alt', async () => {
      const el = await fixture<HelixProse>(`
        <hx-prose>
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="">
        </hx-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for img with descriptive alt text', async () => {
      const el = await fixture<HelixProse>(`
        <hx-prose>
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="Patient vital signs chart showing normal range">
        </hx-prose>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
