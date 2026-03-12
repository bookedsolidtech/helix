import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y, oneEvent } from '../../test-utils.js';
import type { HxTag } from './hx-tag.js';
import './index.js';

afterEach(cleanup);

describe('hx-tag', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxTag>('<hx-tag>Healthcare</hx-tag>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HxTag>('<hx-tag>Healthcare</hx-tag>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HxTag>('<hx-tag>Healthcare</hx-tag>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('exposes "prefix" CSS part', async () => {
      const el = await fixture<HxTag>('<hx-tag>Healthcare</hx-tag>');
      const prefix = shadowQuery(el, '[part="prefix"]');
      expect(prefix).toBeTruthy();
    });

    it('applies default variant=default class', async () => {
      const el = await fixture<HxTag>('<hx-tag>Healthcare</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--default')).toBe(true);
    });

    it('applies default size=md class', async () => {
      const el = await fixture<HxTag>('<hx-tag>Healthcare</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--md')).toBe(true);
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('reflects variant attr to host', async () => {
      const el = await fixture<HxTag>('<hx-tag variant="primary">Tag</hx-tag>');
      expect(el.getAttribute('variant')).toBe('primary');
    });

    it('applies primary class', async () => {
      const el = await fixture<HxTag>('<hx-tag variant="primary">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--primary')).toBe(true);
    });

    it('applies success class', async () => {
      const el = await fixture<HxTag>('<hx-tag variant="success">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--success')).toBe(true);
    });

    it('applies warning class', async () => {
      const el = await fixture<HxTag>('<hx-tag variant="warning">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--warning')).toBe(true);
    });

    it('applies danger class', async () => {
      const el = await fixture<HxTag>('<hx-tag variant="danger">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--danger')).toBe(true);
    });

    it('applies default class', async () => {
      const el = await fixture<HxTag>('<hx-tag variant="default">Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--default')).toBe(true);
    });
  });

  // ─── Property: size ───

  describe('Property: size', () => {
    it('applies sm class', async () => {
      const el = await fixture<HxTag>('<hx-tag hx-size="sm">S</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--sm')).toBe(true);
    });

    it('applies md class', async () => {
      const el = await fixture<HxTag>('<hx-tag hx-size="md">M</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--md')).toBe(true);
    });

    it('applies lg class', async () => {
      const el = await fixture<HxTag>('<hx-tag hx-size="lg">L</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--lg')).toBe(true);
    });
  });

  // ─── Property: pill ───

  describe('Property: pill', () => {
    it('applies pill class when pill is set', async () => {
      const el = await fixture<HxTag>('<hx-tag pill>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--pill')).toBe(true);
    });

    it('does not apply pill class by default', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--pill')).toBe(false);
    });

    it('reflects pill attr to host', async () => {
      const el = await fixture<HxTag>('<hx-tag pill>Tag</hx-tag>');
      expect(el.hasAttribute('pill')).toBe(true);
    });
  });

  // ─── Property: removable ───

  describe('Property: removable', () => {
    it('does not render remove button by default', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn).toBeNull();
    });

    it('renders remove button when removable is set', async () => {
      const el = await fixture<HxTag>('<hx-tag removable>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn).toBeTruthy();
    });

    it('reflects removable attr to host', async () => {
      const el = await fixture<HxTag>('<hx-tag removable>Tag</hx-tag>');
      expect(el.hasAttribute('removable')).toBe(true);
    });

    it('remove button aria-label contains only default slot text, not prefix icon text', async () => {
      const el = await fixture<HxTag>(
        '<hx-tag removable><span slot="prefix">★</span>Healthcare</hx-tag>',
      );
      await el.updateComplete;
      const btn = shadowQuery(el, '[part="remove-button"]');
      const label = btn?.getAttribute('aria-label') ?? '';
      // Must contain the label text
      expect(label).toContain('Healthcare');
      // Must NOT contain the prefix icon character
      expect(label).not.toContain('★');
    });

    it('remove button aria-label is "Remove <label>"', async () => {
      const el = await fixture<HxTag>('<hx-tag removable>Healthcare</hx-tag>');
      await el.updateComplete;
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn?.getAttribute('aria-label')).toBe('Remove Healthcare');
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('reflects disabled attr to host', async () => {
      const el = await fixture<HxTag>('<hx-tag disabled>Tag</hx-tag>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not set aria-disabled on non-interactive base span (ARIA 1.2)', async () => {
      // aria-disabled is only meaningful on elements with interactive roles.
      // Disabled state is communicated via the host [disabled] attr and the native button disabled attr.
      const el = await fixture<HxTag>('<hx-tag disabled>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-disabled')).toBeNull();
    });

    it('remove button is disabled when tag is disabled', async () => {
      const el = await fixture<HxTag>('<hx-tag removable disabled>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement | null;
      expect(btn?.disabled).toBe(true);
    });
  });

  // ─── Events: hx-remove ───

  describe('Events: hx-remove', () => {
    it('dispatches hx-remove when remove button is clicked', async () => {
      const el = await fixture<HxTag>('<hx-tag removable>Tag</hx-tag>');
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
      const el = await fixture<HxTag>('<hx-tag removable>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement;
      btn.focus();
      const eventPromise = oneEvent(el, 'hx-remove');
      await userEvent.keyboard('{Enter}');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-remove when Space is pressed on remove button', async () => {
      const el = await fixture<HxTag>('<hx-tag removable>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement;
      btn.focus();
      const eventPromise = oneEvent(el, 'hx-remove');
      await userEvent.keyboard(' ');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('does not dispatch hx-remove when tag is disabled', async () => {
      const el = await fixture<HxTag>('<hx-tag removable disabled>Tag</hx-tag>');
      let fired = false;
      el.addEventListener('hx-remove', () => {
        fired = true;
      });
      // The native button is disabled so click events are suppressed by the browser,
      // and the _handleRemove guard provides a second layer of defense.
      const btn = shadowQuery(el, '[part="remove-button"]') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders text', async () => {
      const el = await fixture<HxTag>('<hx-tag>Hello World</hx-tag>');
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('prefix slot renders slotted content', async () => {
      const el = await fixture<HxTag>(
        '<hx-tag><span slot="prefix" class="icon">★</span>Active</hx-tag>',
      );
      const icon = el.querySelector('span.icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('★');
    });

    it('suffix slot renders slotted content', async () => {
      const el = await fixture<HxTag>(
        '<hx-tag>Category<span slot="suffix" class="count">42</span></hx-tag>',
      );
      const count = el.querySelector('span.count');
      expect(count).toBeTruthy();
      expect(count?.textContent).toBe('42');
    });

    it('prefix wrapper is hidden when prefix slot is empty', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      await el.updateComplete;
      const prefix = shadowQuery(el, '[part="prefix"]')!;
      expect(prefix.classList.contains('tag__prefix--hidden')).toBe(true);
    });

    it('suffix wrapper is hidden when suffix slot is empty', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      await el.updateComplete;
      const suffix = shadowQuery(el, '[part="suffix"]')!;
      expect(suffix.classList.contains('tag__suffix--hidden')).toBe(true);
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('base part is accessible for external styling', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('part')).toBe('base');
    });

    it('suffix part is accessible for external styling', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      const suffix = shadowQuery(el, '[part="suffix"]');
      expect(suffix?.getAttribute('part')).toBe('suffix');
    });

    it('remove-button part is accessible for external styling when removable', async () => {
      const el = await fixture<HxTag>('<hx-tag removable>Tag</hx-tag>');
      const btn = shadowQuery(el, '[part="remove-button"]');
      expect(btn?.getAttribute('part')).toBe('remove-button');
    });
  });

  // ─── Dynamic Updates ───

  describe('Dynamic Updates', () => {
    it('updates variant class when property changes', async () => {
      const el = await fixture<HxTag>('<hx-tag variant="default">Tag</hx-tag>');
      el.variant = 'primary';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--primary')).toBe(true);
      expect(base.classList.contains('tag--default')).toBe(false);
    });

    it('updates size class when property changes', async () => {
      const el = await fixture<HxTag>('<hx-tag hx-size="sm">Tag</hx-tag>');
      el.size = 'lg';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--lg')).toBe(true);
      expect(base.classList.contains('tag--sm')).toBe(false);
    });

    it('shows remove button when removable is set dynamically', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      expect(shadowQuery(el, '[part="remove-button"]')).toBeNull();
      el.removable = true;
      await el.updateComplete;
      expect(shadowQuery(el, '[part="remove-button"]')).toBeTruthy();
    });

    it('toggles pill class when pill is set dynamically', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tag--pill')).toBe(false);
      el.pill = true;
      await el.updateComplete;
      expect(base.classList.contains('tag--pill')).toBe(true);
    });

    it('prefix wrapper becomes visible when prefix content is added', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      await el.updateComplete;
      const prefix = shadowQuery(el, '[part="prefix"]')!;
      expect(prefix.classList.contains('tag__prefix--hidden')).toBe(true);
      const icon = document.createElement('span');
      icon.slot = 'prefix';
      icon.textContent = '★';
      el.appendChild(icon);
      await el.updateComplete;
      // Wait for slotchange event to fire
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      expect(prefix.classList.contains('tag__prefix--hidden')).toBe(false);
    });

    it('suffix wrapper becomes visible when suffix content is added', async () => {
      const el = await fixture<HxTag>('<hx-tag>Tag</hx-tag>');
      await el.updateComplete;
      const suffix = shadowQuery(el, '[part="suffix"]')!;
      expect(suffix.classList.contains('tag__suffix--hidden')).toBe(true);
      const badge = document.createElement('span');
      badge.slot = 'suffix';
      badge.textContent = '5';
      el.appendChild(badge);
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      expect(suffix.classList.contains('tag__suffix--hidden')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HxTag>('<hx-tag>Healthcare</hx-tag>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['default', 'primary', 'success', 'warning', 'danger']) {
        const el = await fixture<HxTag>(`<hx-tag variant="${variant}">Label</hx-tag>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations for all sizes', async () => {
      for (const size of ['sm', 'md', 'lg']) {
        const el = await fixture<HxTag>(`<hx-tag hx-size="${size}">Label</hx-tag>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `size="${size}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when removable', async () => {
      const el = await fixture<HxTag>('<hx-tag removable>Healthcare</hx-tag>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
