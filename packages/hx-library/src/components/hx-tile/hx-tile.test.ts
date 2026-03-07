import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTile } from './hx-tile.js';
import './index.js';

afterEach(cleanup);

describe('hx-tile', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "tile" CSS part', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]');
      expect(tile).toBeTruthy();
    });

    it('applies default variant class', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.classList.contains('tile--default')).toBe(true);
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('applies outlined class', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile variant="outlined"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.classList.contains('tile--outlined')).toBe(true);
    });

    it('applies filled class', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile variant="filled"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.classList.contains('tile--filled')).toBe(true);
    });
  });

  // ─── Static mode (clickable=false) ───

  describe('Static mode (clickable=false)', () => {
    it('renders as div with no role when clickable=false', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile clickable="false"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.tagName.toLowerCase()).toBe('div');
      expect(tile.hasAttribute('role')).toBe(false);
    });

    it('has no tabindex in static mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile clickable="false"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.hasAttribute('tabindex')).toBe(false);
    });

    it('has no aria-pressed in static mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile clickable="false"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.hasAttribute('aria-pressed')).toBe(false);
    });

    it('applies tile--static class in static mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile clickable="false"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.classList.contains('tile--static')).toBe(true);
    });

    it('does not dispatch hx-select when clicked in static mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile clickable="false"><span slot="label">Test</span></hx-tile>',
      );
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      const tile = shadowQuery(el, '[part="tile"]')!;
      tile.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Button mode (no href) ───

  describe('Button mode (no href)', () => {
    it('renders as div with role="button"', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.tagName.toLowerCase()).toBe('div');
      expect(tile.getAttribute('role')).toBe('button');
    });

    it('has aria-pressed="false" by default', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.getAttribute('aria-pressed')).toBe('false');
    });

    it('has aria-pressed="true" when selected', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile selected><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.getAttribute('aria-pressed')).toBe('true');
    });

    it('has tabindex="0"', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.getAttribute('tabindex')).toBe('0');
    });

    it('applies tile--selected class when selected', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile selected><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.classList.contains('tile--selected')).toBe(true);
    });
  });

  // ─── Link mode (href) ───

  describe('Link mode (href)', () => {
    it('renders as anchor element when href set', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.tagName.toLowerCase()).toBe('a');
    });

    it('anchor has correct href', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, 'a[part="tile"]') as HTMLAnchorElement;
      expect(tile.getAttribute('href')).toBe('/dashboard');
    });

    it('does not render role="button" in link mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.hasAttribute('role')).toBe(false);
    });

    it('removes href from anchor when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard" disabled><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, 'a[part="tile"]') as HTMLAnchorElement;
      expect(tile.hasAttribute('href')).toBe(false);
      expect(tile.getAttribute('aria-disabled')).toBe('true');
    });

    it('sets tabindex="-1" on disabled anchor', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard" disabled><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, 'a[part="tile"]') as HTMLAnchorElement;
      expect(tile.getAttribute('tabindex')).toBe('-1');
    });

    it('does not apply tile--selected class in link mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard" selected><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.classList.contains('tile--selected')).toBe(false);
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('applies tile--disabled class', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.classList.contains('tile--disabled')).toBe(true);
    });

    it('has aria-disabled="true" when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.getAttribute('aria-disabled')).toBe('true');
    });

    it('has tabindex="-1" when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(tile.getAttribute('tabindex')).toBe('-1');
    });
  });

  // ─── Events: button mode ───

  describe('Events: button mode', () => {
    it('dispatches hx-select on click', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      tile.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-select detail contains selected state and originalEvent', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      tile.click();
      const event = await eventPromise;
      expect(typeof event.detail.selected).toBe('boolean');
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('toggles selected property on click', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]')!;
      expect(el.selected).toBe(false);
      tile.click();
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
      // Click on shadow tile element (disabled tile has pointer-events: none, so use dispatchEvent)
      const tile = shadowQuery(el, '[part="tile"]')!;
      tile.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });

    it('does not dispatch hx-select when disabled via keyboard', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });

    it('does not dispatch hx-select via Space when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
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
      const tile = shadowQuery(el, '[part="tile"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      // Use dispatchEvent (untrusted) to avoid anchor navigation in headless browser
      tile.dispatchEvent(
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
      const tile = shadowQuery(el, '[part="tile"]')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      // Use dispatchEvent (untrusted) to avoid anchor navigation in headless browser
      tile.dispatchEvent(
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
      const tile = shadowQuery(el, '[part="tile"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Space fires hx-select in button mode', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Enter fires hx-click in link mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/test"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.href).toBe('/test');
    });

    it('Space fires hx-click in link mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/test"><span slot="label">Test</span></hx-tile>',
      );
      const tile = shadowQuery(el, '[part="tile"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.href).toBe('/test');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('tile part exposed', async () => {
      const el = await fixture<HelixTile>('<hx-tile><span slot="label">Test</span></hx-tile>');
      const tile = shadowQuery(el, '[part="tile"]');
      expect(tile).toBeTruthy();
    });

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
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when selected', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile selected><span slot="label">Selected Tile</span></hx-tile>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile disabled><span slot="label">Disabled Tile</span></hx-tile>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in link mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile href="/dashboard"><span slot="label">Dashboard</span></hx-tile>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in static mode', async () => {
      const el = await fixture<HelixTile>(
        '<hx-tile clickable="false"><span slot="label">Info Tile</span></hx-tile>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['default', 'outlined', 'filled']) {
        const el = await fixture<HelixTile>(
          `<hx-tile variant="${variant}"><span slot="label">Tile</span></hx-tile>`,
        );
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });
});
