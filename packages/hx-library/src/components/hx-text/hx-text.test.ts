import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { WcText } from './hx-text.js';
import './index.js';

afterEach(cleanup);

describe('hx-text', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcText>('<hx-text>Hello</hx-text>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a <span> element as the base', async () => {
      const el = await fixture<WcText>('<hx-text>Hello</hx-text>');
      const base = shadowQuery(el, 'span[part="base"]');
      expect(base).toBeInstanceOf(HTMLSpanElement);
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<WcText>('<hx-text>Hello</hx-text>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('renders default slot text content', async () => {
      const el = await fixture<WcText>('<hx-text>Patient record</hx-text>');
      expect(el.textContent?.trim()).toBe('Patient record');
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    const variants = [
      'body',
      'body-sm',
      'body-lg',
      'label',
      'label-sm',
      'caption',
      'code',
      'overline',
    ] as const;

    it('defaults to variant="body"', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      expect(el.variant).toBe('body');
    });

    it('reflects variant attribute to host', async () => {
      const el = await fixture<WcText>('<hx-text variant="label">Text</hx-text>');
      expect(el.getAttribute('variant')).toBe('label');
    });

    for (const variant of variants) {
      it(`applies text--${variant} class for variant="${variant}"`, async () => {
        const el = await fixture<WcText>(`<hx-text variant="${variant}">Text</hx-text>`);
        const base = shadowQuery(el, '[part="base"]')!;
        expect(base.classList.contains(`text--${variant}`)).toBe(true);
      });
    }
  });

  // ─── Property: weight ───

  describe('Property: weight', () => {
    const weights = ['regular', 'medium', 'semibold', 'bold'] as const;

    it('defaults to weight=undefined (no weight class)', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      expect(el.weight).toBeUndefined();
    });

    for (const weight of weights) {
      it(`applies text--weight-${weight} class for weight="${weight}"`, async () => {
        const el = await fixture<WcText>(`<hx-text weight="${weight}">Text</hx-text>`);
        const base = shadowQuery(el, '[part="base"]')!;
        expect(base.classList.contains(`text--weight-${weight}`)).toBe(true);
      });
    }
  });

  // ─── Property: color ───

  describe('Property: color', () => {
    const colors = [
      'default',
      'subtle',
      'disabled',
      'inverse',
      'danger',
      'success',
      'warning',
    ] as const;

    it('defaults to color="default"', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      expect(el.color).toBe('default');
    });

    it('reflects color attribute to host', async () => {
      const el = await fixture<WcText>('<hx-text color="subtle">Text</hx-text>');
      expect(el.getAttribute('color')).toBe('subtle');
    });

    for (const color of colors) {
      it(`applies text--color-${color} class for color="${color}"`, async () => {
        const el = await fixture<WcText>(`<hx-text color="${color}">Text</hx-text>`);
        const base = shadowQuery(el, '[part="base"]')!;
        expect(base.classList.contains(`text--color-${color}`)).toBe(true);
      });
    }
  });

  // ─── Property: as ───

  describe('Property: as', () => {
    it('defaults to as="span"', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      expect(el.as).toBe('span');
    });

    it('renders a <span> base by default', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      const base = shadowQuery(el, 'span[part="base"]');
      expect(base).toBeInstanceOf(HTMLSpanElement);
    });

    it('renders a <p> base when as="p"', async () => {
      const el = await fixture<WcText>('<hx-text as="p">Text</hx-text>');
      const base = shadowQuery(el, 'p[part="base"]');
      expect(base).toBeInstanceOf(HTMLParagraphElement);
    });

    it('renders a <strong> base when as="strong"', async () => {
      const el = await fixture<WcText>('<hx-text as="strong">Text</hx-text>');
      const base = shadowQuery(el, 'strong[part="base"]');
      expect(base).toBeTruthy();
    });

    it('renders a <em> base when as="em"', async () => {
      const el = await fixture<WcText>('<hx-text as="em">Text</hx-text>');
      const base = shadowQuery(el, 'em[part="base"]');
      expect(base).toBeTruthy();
    });

    it('renders a <div> base when as="div"', async () => {
      const el = await fixture<WcText>('<hx-text as="div">Text</hx-text>');
      const base = shadowQuery(el, 'div[part="base"]');
      expect(base).toBeInstanceOf(HTMLDivElement);
    });

    it('falls back to span for unknown as value', async () => {
      const el = await fixture<WcText>('<hx-text as="script">Text</hx-text>');
      const base = shadowQuery(el, 'span[part="base"]');
      expect(base).toBeInstanceOf(HTMLSpanElement);
    });

    it('reflects as attribute to host', async () => {
      const el = await fixture<WcText>('<hx-text as="p">Text</hx-text>');
      expect(el.getAttribute('as')).toBe('p');
    });
  });

  // ─── Property: truncate ───

  describe('Property: truncate', () => {
    it('defaults to truncate=false', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      expect(el.truncate).toBe(false);
    });

    it('applies text--truncate class when truncate=true', async () => {
      const el = await fixture<WcText>('<hx-text truncate>Text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('text--truncate')).toBe(true);
    });

    it('does not apply text--truncate when truncate=false', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('text--truncate')).toBe(false);
    });

    it('reflects truncate attribute to host', async () => {
      const el = await fixture<WcText>('<hx-text truncate>Text</hx-text>');
      expect(el.hasAttribute('truncate')).toBe(true);
    });
  });

  // ─── Property: lines ───

  describe('Property: lines', () => {
    it('defaults to lines=0', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      expect(el.lines).toBe(0);
    });

    it('applies text--clamp class when lines > 0', async () => {
      const el = await fixture<WcText>('<hx-text lines="3">Text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('text--clamp')).toBe(true);
    });

    it('does not apply text--clamp when lines=0', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('text--clamp')).toBe(false);
    });

    it('does not apply text--truncate when lines > 0', async () => {
      const el = await fixture<WcText>('<hx-text lines="2" truncate>Text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('text--truncate')).toBe(false);
    });

    it('reflects lines attribute to host', async () => {
      const el = await fixture<WcText>('<hx-text lines="2">Text</hx-text>');
      expect(el.getAttribute('lines')).toBe('2');
    });

    it('sets -webkit-line-clamp inline style when lines > 0', async () => {
      const el = await fixture<WcText>('<hx-text lines="3">Text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.style.getPropertyValue('-webkit-line-clamp')).toBe('3');
    });

    it('does not set -webkit-line-clamp inline style when lines=0', async () => {
      const el = await fixture<WcText>('<hx-text>Text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.style.getPropertyValue('-webkit-line-clamp')).toBe('');
    });

    it('treats negative lines as 0 (no clamping)', async () => {
      const el = await fixture<WcText>('<hx-text lines="-1">Text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('text--clamp')).toBe(false);
      expect(base.style.getPropertyValue('-webkit-line-clamp')).toBe('');
    });
  });

  // ─── Truncation: title attribute ───

  describe('Truncation: title attribute', () => {
    it('adds title to base span when truncate=true', async () => {
      const el = await fixture<WcText>('<hx-text truncate>Full patient name here</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('title')).toBe('Full patient name here');
    });

    it('adds title to base span when lines > 0', async () => {
      const el = await fixture<WcText>('<hx-text lines="2">Long clinical note text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('title')).toBe('Long clinical note text');
    });

    it('does not add title when text is not truncated', async () => {
      const el = await fixture<WcText>('<hx-text>Normal text</hx-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.hasAttribute('title')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcText>('<hx-text>Hello patient</hx-text>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      const variants = [
        'body',
        'body-sm',
        'body-lg',
        'label',
        'label-sm',
        'caption',
        'code',
        'overline',
      ];
      for (const variant of variants) {
        const el = await fixture<WcText>(`<hx-text variant="${variant}">Sample text</hx-text>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations for all colors', async () => {
      // "disabled" is intentionally low-contrast (WCAG 1.4.3 exempts inactive UI components)
      // "inverse" renders white text — tested below with dark background
      const colors = ['default', 'subtle', 'danger', 'success', 'warning'];
      for (const color of colors) {
        const el = await fixture<WcText>(`<hx-text color="${color}">Sample text</hx-text>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `color="${color}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations for inverse color on dark background', async () => {
      const wrapper = await fixture<HTMLDivElement>(
        '<div style="background: #1e293b; padding: 1rem;"><hx-text color="inverse">Inverse text</hx-text></div>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(wrapper);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when truncated', async () => {
      const el = await fixture<WcText>('<hx-text truncate>Long text that gets clipped</hx-text>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
