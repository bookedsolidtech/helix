import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTile } from './hx-tile.js';
import './index.js';

afterEach(cleanup);

describe('hx-tile', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
    });

    it('applies default variant class', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tile--default')).toBe(true);
    });
  });

  // ─── Property: variant (3) ───

  describe('Property: variant', () => {
    it('applies default class', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tile--default')).toBe(true);
    });

    it('applies outlined class', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile variant="outlined"><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tile--outlined')).toBe(true);
    });

    it('applies filled class', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile variant="filled"><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tile--filled')).toBe(true);
    });
  });

  // ─── Button mode (no href) ───

  describe('Button mode (no href)', () => {
    it('renders as div with role="button"', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.tagName.toLowerCase()).toBe('div');
      expect(base.getAttribute('role')).toBe('button');
    });

    it('has aria-pressed="false" by default', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-pressed')).toBe('false');
    });

    it('has aria-pressed="true" when selected', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile selected><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-pressed')).toBe('true');
    });

    it('has tabindex="0"', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('tabindex')).toBe('0');
    });

    it('applies tile--selected class when selected', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile selected><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tile--selected')).toBe(true);
    });
  });

  // ─── Link mode (href) ───

  describe('Link mode (href)', () => {
    it('renders as anchor element when href set', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard"><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.tagName.toLowerCase()).toBe('a');
    });

    it('anchor has correct href', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard"><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, 'a[part="base"]') as HTMLAnchorElement;
      expect(base.getAttribute('href')).toBe('/dashboard');
    });

    it('does not render role="button" in link mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard"><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.hasAttribute('role')).toBe(false);
    });

    it('removes href from anchor when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard" disabled><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, 'a[part="base"]') as HTMLAnchorElement;
      expect(base.hasAttribute('href')).toBe(false);
      expect(base.getAttribute('aria-disabled')).toBe('true');
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('applies tile--disabled class', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('tile--disabled')).toBe(true);
    });

    it('has aria-disabled="true" when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-disabled')).toBe('true');
    });

    it('has tabindex="-1" when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('tabindex')).toBe('-1');
    });
  });

  // ─── Events: button mode ───

  describe('Events: button mode', () => {
    it('dispatches hx-select on click', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      base.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-select detail contains selected state and originalEvent', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      base.click();
      const event = await eventPromise;
      expect(typeof event.detail.selected).toBe('boolean');
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('toggles selected property on click', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(el.selected).toBe(false);
      base.click();
      await el.updateComplete;
      expect(el.selected).toBe(true);
    });

    it('does not dispatch hx-select when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      el.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });

    it('does not dispatch hx-select when disabled via keyboard', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      base.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Events: link mode ───

  describe('Events: link mode', () => {
    it('dispatches hx-click when href + click', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/test"><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      // Use dispatchEvent (untrusted) to avoid anchor navigation in headless browser
      base.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }),
      );
      const event = await eventPromise;
      expect(event.detail.href).toBe('/test');
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('does not dispatch hx-select in link mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/test"><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      // Use dispatchEvent (untrusted) to avoid anchor navigation in headless browser
      base.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }),
      );
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard ───

  describe('Keyboard', () => {
    it('Enter fires hx-select in button mode', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      base.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Space fires hx-select in button mode', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const base = shadowQuery(el, '[part="base"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      base.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Enter fires hx-click in link mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/test"><span slot="label">Test</span></hx-tile>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      base.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.href).toBe('/test');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('icon part exposed', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile><span slot="icon">&#127968;</span><span slot="label">Test</span></hx-tile>',
      );
      const icon = shadowQuery(el, '[part="icon"]');
      expect(icon).toBeTruthy();
    });

    it('label part exposed', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('description part exposed', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const description = shadowQuery(el, '[part="description"]');
      expect(description).toBeTruthy();
    });

    it('badge part exposed', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const badge = shadowQuery(el, '[part="badge"]');
      expect(badge).toBeTruthy();
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('icon slot hidden when empty', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const iconDiv = shadowQuery(el, '.tile__icon')!;
      expect(iconDiv.hasAttribute('hidden')).toBe(true);
    });

    it('icon slot visible when filled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile><span slot="icon">&#127968;</span><span slot="label">Test</span></hx-tile>',
      );
      const iconDiv = shadowQuery(el, '.tile__icon')!;
      expect(iconDiv.hasAttribute('hidden')).toBe(false);
    });

    it('description slot hidden when empty', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const descDiv = shadowQuery(el, '.tile__description')!;
      expect(descDiv.hasAttribute('hidden')).toBe(true);
    });

    it('badge slot hidden when empty', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const badgeDiv = shadowQuery(el, '.tile__badge')!;
      expect(badgeDiv.hasAttribute('hidden')).toBe(true);
    });

    it('badge slot visible when filled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile><span slot="label">Test</span><span slot="badge">3</span></hx-tile>',
      );
      const badgeDiv = shadowQuery(el, '.tile__badge')!;
      expect(badgeDiv.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in button mode', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Dashboard</span></hx-tile>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when selected', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile selected><span slot="label">Selected Tile</span></hx-tile>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Disabled Tile</span></hx-tile>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in link mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard"><span slot="label">Dashboard</span></hx-tile>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['default', 'outlined', 'filled']) {
        const el = await fixture<HelixTile>(
          `<hx-tile variant="${variant}"><span slot="label">Tile</span></hx-tile>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });
});
