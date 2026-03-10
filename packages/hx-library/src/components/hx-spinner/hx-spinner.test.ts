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

    it('does not render .spinner__sr-text (aria-label only approach)', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const srText = shadowQuery(el, '.spinner__sr-text');
      expect(srText).toBeNull();
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

    it('reflects label attribute to host', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner label="Uploading"></hx-spinner>');
      expect(el.getAttribute('label')).toBe('Uploading');
    });

    it('updates aria-label reactively when label property changes', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner label="Loading"></hx-spinner>');
      el.label = 'Saving record';
      await el.updateComplete;
      const base = shadowQuery(el, '[part~="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Saving record');
    });

    it('does not set aria-label when label is empty string (WCAG guard)', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner label=""></hx-spinner>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base?.hasAttribute('aria-label')).toBe(false);
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

  // ─── Property: decorative ───

  describe('Property: decorative', () => {
    it('defaults to decorative=false', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.decorative).toBe(false);
    });

    it('sets role="presentation" when decorative=true', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner decorative></hx-spinner>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base?.getAttribute('role')).toBe('presentation');
    });

    it('removes aria-label when decorative=true', async () => {
      const el = await fixture<HelixSpinner>(
        '<hx-spinner decorative label="Loading"></hx-spinner>',
      );
      const base = shadowQuery(el, '[part~="base"]');
      expect(base?.hasAttribute('aria-label')).toBe(false);
    });

    it('reflects decorative attribute to host', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner decorative></hx-spinner>');
      expect(el.hasAttribute('decorative')).toBe(true);
    });

    it('restores role="status" when decorative toggled off', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner decorative></hx-spinner>');
      el.decorative = false;
      await el.updateComplete;
      const base = shadowQuery(el, '[part~="base"]');
      expect(base?.getAttribute('role')).toBe('status');
    });
  });

  // ─── Reduced Motion ───

  describe('Reduced Motion', () => {
    // Verify that the prefers-reduced-motion media query rules are authored correctly
    // in the component's adopted stylesheets. Computed-style emulation requires
    // Playwright's raw `page.emulateMedia()` which is not exposed by the Vitest
    // browser wrapper — stylesheet inspection is the reliable alternative.
    it('includes prefers-reduced-motion CSS rules in component stylesheet', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const sheets = el.shadowRoot!.adoptedStyleSheets;
      const allRules: string[] = [];
      for (const sheet of sheets) {
        for (const rule of sheet.cssRules) {
          allRules.push(rule.cssText);
        }
      }
      const hasReducedMotion = allRules.some((r) => r.includes('prefers-reduced-motion'));
      expect(hasReducedMotion).toBe(true);
    });

    it('reduced-motion CSS sets animation to none on .spinner__svg and .spinner__arc', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const sheets = el.shadowRoot!.adoptedStyleSheets;
      let reducedMotionRuleText = '';
      for (const sheet of sheets) {
        for (const rule of sheet.cssRules) {
          if (rule.cssText.includes('prefers-reduced-motion')) {
            reducedMotionRuleText += rule.cssText;
          }
        }
      }
      expect(reducedMotionRuleText).toContain('animation');
      expect(reducedMotionRuleText).toContain('.spinner__svg');
      expect(reducedMotionRuleText).toContain('.spinner__arc');
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
      const el = await fixture<HelixSpinner>('<hx-spinner label="Saving changes"></hx-spinner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in decorative mode', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner decorative></hx-spinner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
