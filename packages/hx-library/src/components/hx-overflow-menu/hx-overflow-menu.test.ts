import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixOverflowMenu } from './hx-overflow-menu.js';
import './index.js';

afterEach(cleanup);

describe('hx-overflow-menu', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders trigger button element', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
    });

    it('exposes "button" CSS part', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      const part = shadowQuery(el, '[part="button"]');
      expect(part).toBeTruthy();
    });

    it('does not render panel when closed', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel).toBeNull();
    });

    it('renders panel after trigger click', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel).toBeTruthy();
    });
  });

  // ─── Property: icon (2) ───

  describe('Property: icon', () => {
    it('defaults to vertical icon', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      expect(el.icon).toBe('vertical');
    });

    it('reflects icon attribute to host', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu icon="horizontal"></hx-overflow-menu>',
      );
      expect(el.getAttribute('icon')).toBe('horizontal');
    });
  });

  // ─── Property: placement (2) ───

  describe('Property: placement', () => {
    it('defaults to bottom-end', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      expect(el.placement).toBe('bottom-end');
    });

    it('reflects placement attribute', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu placement="top-start"></hx-overflow-menu>',
      );
      expect(el.getAttribute('placement')).toBe('top-start');
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm class to trigger', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu hx-size="sm"></hx-overflow-menu>',
      );
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn?.classList.contains('trigger--sm')).toBe(true);
    });

    it('applies md class to trigger (default)', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn?.classList.contains('trigger--md')).toBe(true);
    });

    it('applies lg class to trigger', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu hx-size="lg"></hx-overflow-menu>',
      );
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn?.classList.contains('trigger--lg')).toBe(true);
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('sets native disabled on trigger button', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu disabled></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      expect(btn?.disabled).toBe(true);
    });

    it('reflects disabled to host', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu disabled></hx-overflow-menu>',
      );
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not open when disabled', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu disabled></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel).toBeNull();
    });
  });

  // ─── ARIA (4) ───

  describe('ARIA', () => {
    it('trigger has aria-label="More actions"', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn?.getAttribute('aria-label')).toBe('More actions');
    });

    it('trigger has aria-haspopup="true"', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn?.getAttribute('aria-haspopup')).toBe('true');
    });

    it('trigger aria-expanded is false when closed', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu></hx-overflow-menu>',
      );
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('trigger aria-expanded is true when open', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
    });

    it('panel has role="menu"', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('role')).toBe('menu');
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-show when panel opens', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const eventPromise = oneEvent(el, 'hx-show');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-show bubbles and is composed', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-show');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-hide when panel closes', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;

      const eventPromise = oneEvent(el, 'hx-hide');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-select with value when menu item clicked', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem" data-value="edit">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-select');
      const menuItem = el.querySelector('[role="menuitem"]') as HTMLButtonElement;
      menuItem.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('edit');
    });
  });

  // ─── Keyboard (2) ───

  describe('Keyboard', () => {
    it('Escape closes the panel', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;

      const hidePromise = oneEvent(el, 'hx-hide');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await hidePromise;

      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel).toBeNull();
    });

    it('Tab closes the panel', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;

      const hidePromise = oneEvent(el, 'hx-hide');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await hidePromise;

      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel).toBeNull();
    });
  });

  // ─── Slots (1) ───

  describe('Slots', () => {
    it('default slot renders menu items', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const items = el.querySelectorAll('[role="menuitem"]');
      expect(items.length).toBe(2);
    });
  });

  // ─── Accessibility (axe-core) (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in closed state', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in open state', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu disabled><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
