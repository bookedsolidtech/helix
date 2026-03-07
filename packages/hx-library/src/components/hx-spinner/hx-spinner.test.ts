import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixSpinner } from './hx-spinner.js';
import './index.js';

afterEach(cleanup);

describe('hx-spinner', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('renders an SVG element', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const svg = shadowQuery(el, 'svg');
      expect(svg).toBeTruthy();
    });

    it('renders visually-hidden sr text', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const srText = shadowQuery(el, '.spinner__sr-text');
      expect(srText).toBeTruthy();
    });
  });

  // ─── Property: size ───

  describe('Property: size', () => {
    it('defaults to size="md"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.size).toBe('md');
    });

    it('reflects size attr to host', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner size="sm"></hx-spinner>');
      expect(el.getAttribute('size')).toBe('sm');
    });

    it('accepts "sm" size', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner size="sm"></hx-spinner>');
      expect(el.size).toBe('sm');
    });

    it('accepts "lg" size', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner size="lg"></hx-spinner>');
      expect(el.size).toBe('lg');
    });

    it('accepts custom CSS size string', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner size="3rem"></hx-spinner>');
      expect(el.size).toBe('3rem');
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('defaults to variant="default"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.variant).toBe('default');
    });

    it('reflects variant attr to host', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="primary"></hx-spinner>');
      expect(el.getAttribute('variant')).toBe('primary');
    });

    it('accepts "primary" variant', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="primary"></hx-spinner>');
      expect(el.variant).toBe('primary');
    });

    it('accepts "inverted" variant', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="inverted"></hx-spinner>');
      expect(el.variant).toBe('inverted');
    });
  });

  // ─── Property: label ───

  describe('Property: label', () => {
    it('defaults to label="Loading"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.label).toBe('Loading');
    });

    it('accepts custom label', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner label="Saving data"></hx-spinner>');
      expect(el.label).toBe('Saving data');
    });

    it('sets aria-label on the base element', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner label="Processing"></hx-spinner>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Processing');
    });
  });

  // ─── ARIA ───

  describe('ARIA', () => {
    it('has role="status" on base element', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base?.getAttribute('role')).toBe('status');
    });

    it('has default aria-label="Loading"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Loading');
    });

    it('SVG has aria-hidden="true"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const svg = shadowQuery(el, 'svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "base" part', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for sm size', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner size="sm"></hx-spinner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for lg size', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner size="lg"></hx-spinner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for primary variant', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="primary"></hx-spinner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for inverted variant', async () => {
      const wrapper = await fixture<HTMLDivElement>(
        '<div style="background:#2563eb;padding:1rem"><hx-spinner variant="inverted"></hx-spinner></div>',
      );
      await page.screenshot();
      const spinner = wrapper.querySelector('hx-spinner') as HelixSpinner;
      const { violations } = await checkA11y(spinner);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with custom label', async () => {
      const el = await fixture<HelixSpinner>(
        '<hx-spinner label="Saving changes"></hx-spinner>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
