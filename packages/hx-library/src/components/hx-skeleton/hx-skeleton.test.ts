import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixSkeleton } from './hx-skeleton.js';
import './index.js';

afterEach(cleanup);

describe('hx-skeleton', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
      expect(base?.getAttribute('part')).toBe('base');
    });

    it('renders a <span> as the base element', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeInstanceOf(HTMLSpanElement);
    });

    it('is hidden from assistive technology (shadow child)', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-hidden')).toBe('true');
      expect(base.getAttribute('role')).toBe('presentation');
    });

    it('sets aria-hidden and role on host element', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.getAttribute('role')).toBe('presentation');
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('defaults to rect', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      expect(el.variant).toBe('rect');
    });

    it('reflects variant attr to host', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton variant="circle"></hx-skeleton>');
      expect(el.getAttribute('variant')).toBe('circle');
    });

    it('applies text variant class', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton variant="text"></hx-skeleton>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('skeleton--text')).toBe(true);
    });

    it('applies circle variant class', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton variant="circle"></hx-skeleton>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('skeleton--circle')).toBe(true);
    });

    it('applies rect variant class', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton variant="rect"></hx-skeleton>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('skeleton--rect')).toBe(true);
    });

    it('applies button variant class', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton variant="button"></hx-skeleton>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('skeleton--button')).toBe(true);
    });
  });

  // ─── Property: animated (3) ───

  describe('Property: animated', () => {
    it('defaults to true', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      expect(el.animated).toBe(true);
    });

    it('applies animated class by default', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('skeleton--animated')).toBe(true);
    });

    it('does not apply animated class when animated attribute is absent', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      el.removeAttribute('animated');
      el.animated = false;
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('skeleton--animated')).toBe(false);
    });
  });

  // ─── Property: width (2) ───

  describe('Property: width', () => {
    it('defaults to 100%', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      expect(el.width).toBe('100%');
    });

    it('applies custom width via CSS custom property', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton width="200px"></hx-skeleton>');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]') as HTMLElement;
      expect(base.style.getPropertyValue('--_width')).toBe('200px');
    });
  });

  // ─── Property: height (2) ───

  describe('Property: height', () => {
    it('defaults to undefined', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      expect(el.height).toBeUndefined();
    });

    it('applies custom height via CSS custom property', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton height="80px"></hx-skeleton>');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]') as HTMLElement;
      expect(base.style.getPropertyValue('--_height')).toBe('80px');
    });
  });

  // ─── Dynamic Updates (2) ───

  describe('Dynamic Updates', () => {
    it('updates variant class when property changes', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton variant="rect"></hx-skeleton>');
      el.variant = 'circle';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('skeleton--circle')).toBe(true);
      expect(base.classList.contains('skeleton--rect')).toBe(false);
    });

    it('updates animated class when property changes', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      el.animated = false;
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('skeleton--animated')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixSkeleton>('<hx-skeleton></hx-skeleton>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['text', 'circle', 'rect', 'button'] as const) {
        const el = await fixture<HelixSkeleton>(
          `<hx-skeleton variant="${variant}" width="100px" height="100px"></hx-skeleton>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when not animated', async () => {
      const el = await fixture<HelixSkeleton>(
        '<hx-skeleton variant="rect" width="200px" height="1rem"></hx-skeleton>',
      );
      el.animated = false;
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
