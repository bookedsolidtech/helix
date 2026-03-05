import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y, oneEvent } from '../../test-utils.js';
import type { WcBadge } from './hx-badge.js';
import './index.js';

afterEach(cleanup);

describe('hx-badge', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "badge" CSS part', async () => {
      const el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, '[part="badge"]');
      expect(badge).toBeTruthy();
    });

    it('applies default variant=primary class', async () => {
      const el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--primary')).toBe(true);
    });

    it('applies default size=md class', async () => {
      const el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--md')).toBe(true);
    });

    it('renders a <span> element as the badge', async () => {
      const el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, 'span');
      expect(badge).toBeInstanceOf(HTMLSpanElement);
    });
  });

  // ─── Property: variant (8) ───

  describe('Property: variant', () => {
    it('reflects variant attr to host', async () => {
      const el = await fixture<WcBadge>('<hx-badge variant="success">OK</hx-badge>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('applies primary class', async () => {
      const el = await fixture<WcBadge>('<hx-badge variant="primary">New</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--primary')).toBe(true);
    });

    it('applies success class', async () => {
      const el = await fixture<WcBadge>('<hx-badge variant="success">OK</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--success')).toBe(true);
    });

    it('applies warning class', async () => {
      const el = await fixture<WcBadge>('<hx-badge variant="warning">Caution</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--warning')).toBe(true);
    });

    it('applies error class', async () => {
      const el = await fixture<WcBadge>('<hx-badge variant="error">Alert</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--error')).toBe(true);
    });

    it('applies neutral class', async () => {
      const el = await fixture<WcBadge>('<hx-badge variant="neutral">Info</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--neutral')).toBe(true);
    });

    it('applies secondary class', async () => {
      const el = await fixture<WcBadge>('<hx-badge variant="secondary">Tag</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--secondary')).toBe(true);
    });

    it('applies info class', async () => {
      const el = await fixture<WcBadge>('<hx-badge variant="info">Note</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--info')).toBe(true);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm class', async () => {
      const el = await fixture<WcBadge>('<hx-badge hx-size="sm">S</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--sm')).toBe(true);
    });

    it('applies md class', async () => {
      const el = await fixture<WcBadge>('<hx-badge hx-size="md">M</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--md')).toBe(true);
    });

    it('applies lg class', async () => {
      const el = await fixture<WcBadge>('<hx-badge hx-size="lg">L</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--lg')).toBe(true);
    });
  });

  // ─── Property: pill (3) ───

  describe('Property: pill', () => {
    it('applies pill class when pill is set', async () => {
      const el = await fixture<WcBadge>('<hx-badge pill>42</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--pill')).toBe(true);
    });

    it('does not apply pill class by default', async () => {
      const el = await fixture<WcBadge>('<hx-badge>42</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--pill')).toBe(false);
    });

    it('reflects pill attr to host', async () => {
      const el = await fixture<WcBadge>('<hx-badge pill>42</hx-badge>');
      expect(el.hasAttribute('pill')).toBe(true);
    });
  });

  // ─── Property: pulse (3) ───

  describe('Property: pulse', () => {
    it('applies pulse class when pulse is set', async () => {
      const el = await fixture<WcBadge>('<hx-badge pulse>3</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--pulse')).toBe(true);
    });

    it('does not apply pulse class by default', async () => {
      const el = await fixture<WcBadge>('<hx-badge>3</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--pulse')).toBe(false);
    });

    it('reflects pulse attr to host', async () => {
      const el = await fixture<WcBadge>('<hx-badge pulse>3</hx-badge>');
      expect(el.hasAttribute('pulse')).toBe(true);
    });
  });

  // ─── Property: removable (3) ───

  describe('Property: removable', () => {
    it('does not render remove button by default', async () => {
      const el = await fixture<WcBadge>('<hx-badge>Tag</hx-badge>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn).toBeNull();
    });

    it('renders remove button when removable is set', async () => {
      const el = await fixture<WcBadge>('<hx-badge removable>Tag</hx-badge>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn).toBeTruthy();
    });

    it('reflects removable attr to host', async () => {
      const el = await fixture<WcBadge>('<hx-badge removable>Tag</hx-badge>');
      expect(el.hasAttribute('removable')).toBe(true);
    });
  });

  // ─── Dot Indicator (3) ───

  describe('Dot Indicator', () => {
    it('renders as dot when slot is empty and pulse is true', async () => {
      const el = await fixture<WcBadge>('<hx-badge pulse></hx-badge>');
      await el.updateComplete;
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--dot')).toBe(true);
    });

    it('does not render as dot when slot has content', async () => {
      const el = await fixture<WcBadge>('<hx-badge pulse>5</hx-badge>');
      await el.updateComplete;
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--dot')).toBe(false);
    });

    it('does not render as dot when pulse is false and slot is empty', async () => {
      const el = await fixture<WcBadge>('<hx-badge></hx-badge>');
      await el.updateComplete;
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--dot')).toBe(false);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders text', async () => {
      const el = await fixture<WcBadge>('<hx-badge>Hello World</hx-badge>');
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('default slot renders HTML', async () => {
      const el = await fixture<WcBadge>('<hx-badge><span class="icon">!</span> Alert</hx-badge>');
      const span = el.querySelector('span.icon');
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe('!');
    });
  });

  // ─── Slots: prefix (1) ───

  describe('Slots: prefix', () => {
    it('prefix slot renders slotted content', async () => {
      const el = await fixture<WcBadge>(
        '<hx-badge><span slot="prefix" class="icon">★</span>Active</hx-badge>',
      );
      const icon = el.querySelector('span.icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('★');
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('badge part is accessible for external styling', async () => {
      const el = await fixture<WcBadge>('<hx-badge>New</hx-badge>');
      const badge = shadowQuery(el, '[part="badge"]');
      expect(badge).toBeTruthy();
      expect(badge?.getAttribute('part')).toBe('badge');
    });

    it('remove-button part is accessible for external styling when removable', async () => {
      const el = await fixture<WcBadge>('<hx-badge removable>Tag</hx-badge>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('part')).toBe('remove-button');
    });
  });

  // ─── Events: hx-remove (3) ───

  describe('Events: hx-remove', () => {
    it('dispatches hx-remove when remove button is clicked', async () => {
      const el = await fixture<WcBadge>('<hx-badge removable>Tag</hx-badge>');
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent(el, 'hx-remove');
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-remove when Enter is pressed on remove button', async () => {
      const el = await fixture<WcBadge>('<hx-badge removable>Tag</hx-badge>');
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      btn.focus();
      const eventPromise = oneEvent(el, 'hx-remove');
      await userEvent.keyboard('{Enter}');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-remove when Space is pressed on remove button', async () => {
      const el = await fixture<WcBadge>('<hx-badge removable>Tag</hx-badge>');
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      btn.focus();
      const eventPromise = oneEvent(el, 'hx-remove');
      await userEvent.keyboard(' ');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Accessibility (2) ───

  describe('Accessibility', () => {
    it('renders as inline element (no interactive role needed)', async () => {
      const el = await fixture<WcBadge>('<hx-badge>Status</hx-badge>');
      const display = getComputedStyle(el).display;
      expect(display).toBe('inline-block');
    });

    it('does not have interactive ARIA role', async () => {
      const el = await fixture<WcBadge>('<hx-badge>Status</hx-badge>');
      const badge = shadowQuery(el, 'span')!;
      expect(badge.hasAttribute('role')).toBe(false);
    });
  });

  // ─── Dynamic Updates (2) ───

  describe('Dynamic Updates', () => {
    it('updates variant class when property changes', async () => {
      const el = await fixture<WcBadge>('<hx-badge variant="primary">New</hx-badge>');
      el.variant = 'error';
      await el.updateComplete;
      const badge = shadowQuery(el, 'span')!;
      expect(badge.classList.contains('badge--error')).toBe(true);
      expect(badge.classList.contains('badge--primary')).toBe(false);
    });

    it('updates size class when property changes', async () => {
      const el = await fixture<WcBadge>('<hx-badge hx-size="sm">S</hx-badge>');
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
      const el = await fixture<WcBadge>('<hx-badge>Status</hx-badge>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of [
        'primary',
        'secondary',
        'success',
        'warning',
        'error',
        'neutral',
        'info',
      ]) {
        const el = await fixture<WcBadge>(`<hx-badge variant="${variant}">Status</hx-badge>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });
});
