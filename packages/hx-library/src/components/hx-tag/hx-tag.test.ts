import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y, oneEvent } from '../../test-utils.js';
import type { WcTag } from './hx-tag.js';
import './index.js';

afterEach(cleanup);

describe('hx-tag', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcTag>('<hx-tag>Healthcare</hx-tag>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<WcTag>('<hx-tag>Healthcare</hx-tag>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<WcTag>('<hx-tag>Healthcare</hx-tag>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('exposes "prefix" CSS part', async () => {
      const el = await fixture<WcTag>('<hx-tag>Healthcare</hx-tag>');
      const prefix = shadowQuery(el, '[part="prefix"]');
      expect(prefix).toBeTruthy();
    });

    it('applies default variant=default class', async () => {
      const el = await fixture<WcTag>('<hx-tag>Healthcare</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--default')).toBe(true);
    });

    it('applies default size=md class', async () => {
      const el = await fixture<WcTag>('<hx-tag>Healthcare</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--md')).toBe(true);
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('reflects variant attr to host', async () => {
      const el = await fixture<WcTag>('<hx-tag variant="primary">Tag</hx-tag>');
      expect(el.getAttribute('variant')).toBe('primary');
    });

    it('applies primary class', async () => {
      const el = await fixture<WcTag>('<hx-tag variant="primary">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--primary')).toBe(true);
    });

    it('applies success class', async () => {
      const el = await fixture<WcTag>('<hx-tag variant="success">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--success')).toBe(true);
    });

    it('applies warning class', async () => {
      const el = await fixture<WcTag>('<hx-tag variant="warning">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--warning')).toBe(true);
    });

    it('applies danger class', async () => {
      const el = await fixture<WcTag>('<hx-tag variant="danger">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--danger')).toBe(true);
    });

    it('applies default class', async () => {
      const el = await fixture<WcTag>('<hx-tag variant="default">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--default')).toBe(true);
    });
  });

  // ─── Property: size ───

  describe('Property: size', () => {
    it('applies sm class', async () => {
      const el = await fixture<WcTag>('<hx-tag hx-size="sm">S</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--sm')).toBe(true);
    });

    it('applies md class', async () => {
      const el = await fixture<WcTag>('<hx-tag hx-size="md">M</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--md')).toBe(true);
    });

    it('applies lg class', async () => {
      const el = await fixture<WcTag>('<hx-tag hx-size="lg">L</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--lg')).toBe(true);
    });
  });

  // ─── Property: pill ───

  describe('Property: pill', () => {
    it('applies pill class when pill is set', async () => {
      const el = await fixture<WcTag>('<hx-tag pill>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--pill')).toBe(true);
    });

    it('does not apply pill class by default', async () => {
      const el = await fixture<WcTag>('<hx-tag>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--pill')).toBe(false);
    });

    it('reflects pill attr to host', async () => {
      const el = await fixture<WcTag>('<hx-tag pill>Tag</hx-tag>');
      expect(el.hasAttribute('pill')).toBe(true);
    });
  });

  // ─── Property: removable ───

  describe('Property: removable', () => {
    it('does not render remove button by default', async () => {
      const el = await fixture<WcTag>('<hx-tag>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn).toBeNull();
    });

    it('renders remove button when removable is set', async () => {
      const el = await fixture<WcTag>('<hx-tag removable>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn).toBeTruthy();
    });

    it('reflects removable attr to host', async () => {
      const el = await fixture<WcTag>('<hx-tag removable>Tag</hx-tag>');
      expect(el.hasAttribute('removable')).toBe(true);
    });

    it('remove button has correct aria-label', async () => {
      const el = await fixture<WcTag>('<hx-tag removable>Healthcare</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn?.getAttribute('aria-label')).toContain('Remove');
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('reflects disabled attr to host', async () => {
      const el = await fixture<WcTag>('<hx-tag disabled>Tag</hx-tag>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('sets aria-disabled on base when disabled', async () => {
      const el = await fixture<WcTag>('<hx-tag disabled>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled when not disabled', async () => {
      const el = await fixture<WcTag>('<hx-tag>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-disabled')).toBeNull();
    });

    it('remove button is disabled when tag is disabled', async () => {
      const el = await fixture<WcTag>('<hx-tag removable disabled>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement | null;
      expect(btn?.disabled).toBe(true);
    });
  });

  // ─── Events: hx-remove ───

  describe('Events: hx-remove', () => {
    it('dispatches hx-remove when remove button is clicked', async () => {
      const el = await fixture<WcTag>('<hx-tag removable>Tag</hx-tag>');
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
      const el = await fixture<WcTag>('<hx-tag removable>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement;
      btn.focus();
      const eventPromise = oneEvent(el, 'hx-remove');
      await userEvent.keyboard('{Enter}');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-remove when Space is pressed on remove button', async () => {
      const el = await fixture<WcTag>('<hx-tag removable>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement;
      btn.focus();
      const eventPromise = oneEvent(el, 'hx-remove');
      await userEvent.keyboard(' ');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders text', async () => {
      const el = await fixture<WcTag>('<hx-tag>Hello World</hx-tag>');
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('prefix slot renders slotted content', async () => {
      const el = await fixture<WcTag>(
        '<hx-tag><span slot="prefix" class="icon">★</span>Active</hx-tag>',
      );
      const icon = el.querySelector('span.icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('★');
    });

    it('suffix slot renders slotted content', async () => {
      const el = await fixture<WcTag>(
        '<hx-tag>Category<span slot="suffix" class="count">42</span></hx-tag>',
      );
      const count = el.querySelector('span.count');
      expect(count).toBeTruthy();
      expect(count?.textContent).toBe('42');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('base part is accessible for external styling', async () => {
      const el = await fixture<WcTag>('<hx-tag>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('part')).toBe('base');
    });

    it('remove-button part is accessible for external styling when removable', async () => {
      const el = await fixture<WcTag>('<hx-tag removable>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn?.getAttribute('part')).toBe('remove-button');
    });
  });

  // ─── Dynamic Updates ───

  describe('Dynamic Updates', () => {
    it('updates variant class when property changes', async () => {
      const el = await fixture<WcTag>('<hx-tag variant="default">Tag</hx-tag>');
      el.variant = 'primary';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--primary')).toBe(true);
      expect(base.classList.contains('tag--default')).toBe(false);
    });

    it('updates size class when property changes', async () => {
      const el = await fixture<WcTag>('<hx-tag hx-size="sm">Tag</hx-tag>');
      el.size = 'lg';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--lg')).toBe(true);
      expect(base.classList.contains('tag--sm')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcTag>('<hx-tag>Healthcare</hx-tag>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['default', 'primary', 'success', 'warning', 'danger']) {
        const el = await fixture<WcTag>(`<hx-tag variant="${variant}">Label</hx-tag>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when removable', async () => {
      const el = await fixture<WcTag>('<hx-tag removable>Healthcare</hx-tag>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
