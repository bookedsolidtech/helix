import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { WcBadge } from './hx-badge.js';
import './index.js';

afterEach(cleanup);

describe('hx-badge', () => {

  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "badge" CSS part', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, '[part="badge"]');
      expect(badge).toBeTruthy();
    });

    it('applies default variant=primary class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--primary')).toBe(true);
    });

    it('applies default size=md class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--md')).toBe(true);
    });

    it('renders a <span> element as the badge', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, 'span');
      expect(badge).toBeInstanceOf(HTMLSpanElement);
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('reflects variant attr to host', async () => {
      const _el = await fixture<WcBadge>('<hx-badge variant="success">OK</hx-badge>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('applies primary class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge variant="primary">New</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--primary')).toBe(true);
    });

    it('applies success class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge variant="success">OK</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--success')).toBe(true);
    });

    it('applies warning class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge variant="warning">Caution</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--warning')).toBe(true);
    });

    it('applies error class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge variant="error">Alert</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--error')).toBe(true);
    });

    it('applies neutral class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge variant="neutral">Info</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--neutral')).toBe(true);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge wc-size="sm">S</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--sm')).toBe(true);
    });

    it('applies md class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge wc-size="md">M</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--md')).toBe(true);
    });

    it('applies lg class', async () => {
      const _el = await fixture<WcBadge>('<hx-badge wc-size="lg">L</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--lg')).toBe(true);
    });
  });

  // ─── Property: pill (3) ───

  describe('Property: pill', () => {
    it('applies pill class when pill is set', async () => {
      const _el = await fixture<WcBadge>('<hx-badge pill>42</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--pill')).toBe(true);
    });

    it('does not apply pill class by default', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>42</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--pill')).toBe(false);
    });

    it('reflects pill attr to host', async () => {
      const _el = await fixture<WcBadge>('<hx-badge pill>42</hx-badge>');
      expect(el.hasAttribute('pill')).toBe(true);
    });
  });

  // ─── Property: pulse (3) ───

  describe('Property: pulse', () => {
    it('applies pulse class when pulse is set', async () => {
      const _el = await fixture<WcBadge>('<hx-badge pulse>3</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--pulse')).toBe(true);
    });

    it('does not apply pulse class by default', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>3</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--pulse')).toBe(false);
    });

    it('reflects pulse attr to host', async () => {
      const _el = await fixture<WcBadge>('<hx-badge pulse>3</hx-badge>');
      expect(el.hasAttribute('pulse')).toBe(true);
    });
  });

  // ─── Dot Indicator (3) ───

  describe('Dot Indicator', () => {
    it('renders as dot when slot is empty and pulse is true', async () => {
      const _el = await fixture<WcBadge>('<hx-badge pulse></hx-badge>');
      // Wait for slotchange to fire
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--dot')).toBe(true);
    });

    it('does not render as dot when slot has content', async () => {
      const _el = await fixture<WcBadge>('<hx-badge pulse>5</hx-badge>');
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--dot')).toBe(false);
    });

    it('does not render as dot when pulse is false and slot is empty', async () => {
      const _el = await fixture<WcBadge>('<hx-badge></hx-badge>');
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--dot')).toBe(false);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders text', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>Hello World</hx-badge>');
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('default slot renders HTML', async () => {
      const _el = await fixture<WcBadge>('<hx-badge><span class="icon">!</span> Alert</hx-badge>');
      const span = el.querySelector('span.icon');
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe('!');
    });
  });

  // ─── CSS Parts (1) ───

  describe('CSS Parts', () => {
    it('badge part is accessible for external styling', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, '[part="badge"]');
      expect(badge).toBeTruthy();
      expect(badge?.getAttribute('part')).toBe('badge');
    });
  });

  // ─── Accessibility (2) ───

  describe('Accessibility', () => {
    it('renders as inline element (no interactive role needed)', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>Status</hx-badge>');
      const display = getComputedStyle(el).display;
      expect(display).toBe('inline-block');
    });

    it('does not have interactive ARIA role', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>Status</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.hasAttribute('role')).toBe(false);
    });
  });

  // ─── Dynamic Updates (2) ───

  describe('Dynamic Updates', () => {
    it('updates variant class when property changes', async () => {
      const _el = await fixture<WcBadge>('<hx-badge variant="primary">New</hx-badge>');
      el.variant = 'error';
      await el.updateComplete;
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--error')).toBe(true);
      expect(badge.classList.contains('badge--primary')).toBe(false);
    });

    it('updates size class when property changes', async () => {
      const _el = await fixture<WcBadge>('<hx-badge wc-size="sm">S</hx-badge>');
      el.size = 'lg';
      await el.updateComplete;
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--lg')).toBe(true);
      expect(badge.classList.contains('badge--sm')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const _el = await fixture<WcBadge>('<hx-badge>Status</hx-badge>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['primary', 'success', 'warning', 'error', 'neutral']) {
        const _el = await fixture<WcBadge>(`<hx-badge variant="${variant}">Status</hx-badge>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });

});
