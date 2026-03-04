import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixSpinner } from './hx-spinner.js';
import './index.js';

afterEach(cleanup);

describe('hx-spinner', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "spinner" CSS part on the container element', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]');
      expect(spinner).toBeTruthy();
    });

    it('renders the spinner container as a <span>', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]');
      expect(spinner).toBeInstanceOf(HTMLSpanElement);
    });

    it('applies default size=md class on initial render', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--md')).toBe(true);
    });

    it('applies default variant=primary class on initial render', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--primary')).toBe(true);
    });
  });

  // ─── Property: size (5) ───

  describe('Property: size', () => {
    it('defaults to "md"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.size).toBe('md');
    });

    it('reflects default size as hx-size attribute', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.getAttribute('hx-size')).toBe('md');
    });

    it('applies spinner--sm class when hx-size="sm"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner hx-size="sm"></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--sm')).toBe(true);
    });

    it('applies spinner--md class when hx-size="md"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner hx-size="md"></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--md')).toBe(true);
    });

    it('applies spinner--lg class when hx-size="lg"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner hx-size="lg"></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--lg')).toBe(true);
    });

    it('reflects hx-size attribute to host element', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner hx-size="lg"></hx-spinner>');
      expect(el.getAttribute('hx-size')).toBe('lg');
    });
  });

  // ─── Property: label (4) ───

  describe('Property: label', () => {
    it('defaults to "Loading"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.label).toBe('Loading');
    });

    it('reflects label as attribute on the host', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner label="Saving"></hx-spinner>');
      expect(el.getAttribute('label')).toBe('Saving');
    });

    it('sets aria-label on the spinner element to match label property', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner label="Processing"></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]');
      expect(spinner?.getAttribute('aria-label')).toBe('Processing');
    });

    it('updates aria-label when label property changes', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      el.label = 'Uploading';
      await el.updateComplete;
      const spinner = shadowQuery(el, '[part="spinner"]');
      expect(spinner?.getAttribute('aria-label')).toBe('Uploading');
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('defaults to "primary"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      expect(el.variant).toBe('primary');
    });

    it('reflects variant attribute to host', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="neutral"></hx-spinner>');
      expect(el.getAttribute('variant')).toBe('neutral');
    });

    it('applies spinner--primary class when variant="primary"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="primary"></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--primary')).toBe(true);
    });

    it('applies spinner--neutral class when variant="neutral"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="neutral"></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--neutral')).toBe(true);
    });

    it('does not apply spinner--neutral class when variant="primary"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="primary"></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--neutral')).toBe(false);
    });
  });

  // ─── CSS Parts (3) ───

  describe('CSS Parts', () => {
    it('exposes "spinner" part for external styling', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const part = shadowQuery(el, '[part="spinner"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('spinner');
    });

    it('exposes "track" part for external styling', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const part = shadowQuery(el, '[part="track"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('track');
    });

    it('exposes "indicator" part for external styling', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const part = shadowQuery(el, '[part="indicator"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('indicator');
    });
  });

  // ─── Accessibility (5) ───

  describe('Accessibility', () => {
    it('has role="status" on the spinner element', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]');
      expect(spinner?.getAttribute('role')).toBe('status');
    });

    it('has aria-live="polite" on the spinner element', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]');
      expect(spinner?.getAttribute('aria-live')).toBe('polite');
    });

    it('aria-label defaults to "Loading"', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]');
      expect(spinner?.getAttribute('aria-label')).toBe('Loading');
    });

    it('aria-label reflects custom label attribute', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner label="Fetching data"></hx-spinner>');
      const spinner = shadowQuery(el, '[part="spinner"]');
      expect(spinner?.getAttribute('aria-label')).toBe('Fetching data');
    });

    it('role="status" is present for both variants', async () => {
      for (const variant of ['primary', 'neutral'] as const) {
        const el = await fixture<HelixSpinner>(`<hx-spinner variant="${variant}"></hx-spinner>`);
        const spinner = shadowQuery(el, '[part="spinner"]');
        expect(
          spinner?.getAttribute('role'),
          `variant="${variant}" should have role="status"`,
        ).toBe('status');
        el.remove();
      }
    });
  });

  // ─── Dynamic Updates (2) ───

  describe('Dynamic Updates', () => {
    it('updates size class when size property changes', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner hx-size="sm"></hx-spinner>');
      el.size = 'lg';
      await el.updateComplete;
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--lg')).toBe(true);
      expect(spinner.classList.contains('spinner--sm')).toBe(false);
    });

    it('updates variant class when variant property changes', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="primary"></hx-spinner>');
      el.variant = 'neutral';
      await el.updateComplete;
      const spinner = shadowQuery(el, '[part="spinner"]')!;
      expect(spinner.classList.contains('spinner--neutral')).toBe(true);
      expect(spinner.classList.contains('spinner--primary')).toBe(false);
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

    it('has no axe violations for the primary variant', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="primary"></hx-spinner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations, 'variant="primary" should have no violations').toEqual([]);
    });

    it('has no axe violations for the neutral variant', async () => {
      const el = await fixture<HelixSpinner>('<hx-spinner variant="neutral"></hx-spinner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations, 'variant="neutral" should have no violations').toEqual([]);
    });

    it('has no axe violations for all size variants', async () => {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const el = await fixture<HelixSpinner>(`<hx-spinner hx-size="${size}"></hx-spinner>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `hx-size="${size}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations with a custom label', async () => {
      const el = await fixture<HelixSpinner>(
        '<hx-spinner label="Saving your progress"></hx-spinner>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
