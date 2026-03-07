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
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders trigger button element', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
    });

    it('exposes "button" CSS part', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const part = shadowQuery(el, '[part~="button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "trigger" CSS part alias', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const part = shadowQuery(el, '[part~="trigger"]');
      expect(part).toBeTruthy();
    });

    it('does not render panel when closed', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const panel = shadowQuery(el, '[part~="panel"]');
      expect(panel).toBeNull();
    });

    it('renders panel after trigger click', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part~="panel"]');
      expect(panel).toBeTruthy();
    });

    it('exposes "menu" CSS part alias for panel', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part~="menu"]');
      expect(panel).toBeTruthy();
    });
  });

  // ─── Property: icon (2) ───

  describe('Property: icon', () => {
    it('defaults to vertical icon', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
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
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
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
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn?.classList.contains('trigger--sm')).toBe(true);
    });

    it('applies md class to trigger (default)', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn?.classList.contains('trigger--md')).toBe(true);
    });

    it('applies lg class to trigger', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu hx-size="lg"></hx-overflow-menu>',
      );
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn?.classList.contains('trigger--lg')).toBe(true);
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('sets native disabled on trigger button', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu disabled></hx-overflow-menu>');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      expect(btn?.disabled).toBe(true);
    });

    it('reflects disabled to host', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu disabled></hx-overflow-menu>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not open when disabled', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu disabled></hx-overflow-menu>');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part~="panel"]');
      expect(panel).toBeNull();
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('defaults label to "More actions"', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      expect(el.label).toBe('More actions');
    });

    it('reflects label attribute to trigger aria-label', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu label="Patient actions"></hx-overflow-menu>',
      );
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn?.getAttribute('aria-label')).toBe('Patient actions');
    });

    it('reflects label property change to trigger aria-label', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      el.label = 'Appointment options';
      await el.updateComplete;
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn?.getAttribute('aria-label')).toBe('Appointment options');
    });
  });

  // ─── ARIA (4) ───

  describe('ARIA', () => {
    it('trigger has aria-label="More actions" by default', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn?.getAttribute('aria-label')).toBe('More actions');
    });

    it('trigger has aria-haspopup="menu"', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn?.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('trigger aria-expanded is false when closed', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('trigger aria-expanded is true when open', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
    });

    it('panel has role="menu"', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part~="panel"]');
      expect(panel?.getAttribute('role')).toBe('menu');
    });
  });

  // ─── Events (5) ───

  describe('Events', () => {
    it('dispatches hx-show when panel opens', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const eventPromise = oneEvent(el, 'hx-show');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-show bubbles and is composed', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-show');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-hide when panel closes', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const eventPromise = oneEvent(el, 'hx-hide');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-hide bubbles and is composed', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-hide');
      btn?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-select with value when menu item clicked', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem" data-value="edit">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-select');
      const menuItem = el.querySelector('[role="menuitem"]') as HTMLButtonElement;
      menuItem.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('edit');
    });

    it('does not dispatch hx-select when disabled menu item is clicked', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem" disabled data-value="edit">Edit</button><button role="menuitem" data-value="delete">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      let selectFired = false;
      el.addEventListener('hx-select', () => {
        selectFired = true;
      });
      const disabledItem = el.querySelector('[role="menuitem"][disabled]') as HTMLButtonElement;
      disabledItem.click();
      await el.updateComplete;
      expect(selectFired).toBe(false);
    });
  });

  // ─── Keyboard (5) ───

  describe('Keyboard', () => {
    it('Escape closes the panel', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const hidePromise = oneEvent(el, 'hx-hide');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await hidePromise;

      const panel = shadowQuery(el, '[part~="panel"]');
      expect(panel).toBeNull();
    });

    it('Escape returns focus to the trigger button', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const hidePromise = oneEvent(el, 'hx-hide');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await hidePromise;

      expect(el.shadowRoot?.activeElement).toBe(shadowQuery(el, '[part~="button"]'));
    });

    it('Tab closes the panel', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const hidePromise = oneEvent(el, 'hx-hide');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await hidePromise;

      const panel = shadowQuery(el, '[part~="panel"]');
      expect(panel).toBeNull();
    });

    it('ArrowDown moves focus to next menu item', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
      items[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
    });

    it('ArrowDown wraps from last to first', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
      items[1].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('ArrowUp moves focus to previous menu item', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
      items[1].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('ArrowUp wraps from first to last', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
      items[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('Home moves focus to first menu item', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
      items[1].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('End moves focus to last menu item', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
      items[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('ArrowDown skips disabled menu items', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem" disabled>Disabled</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const allItems = el.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
      allItems[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(allItems[2]);
    });

    it('clicking outside closes the panel', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const panelBefore = shadowQuery(el, '[part~="panel"]');
      expect(panelBefore).toBeTruthy();

      const hidePromise = oneEvent(el, 'hx-hide');
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await hidePromise;

      await el.updateComplete;
      const panel = shadowQuery(el, '[part~="panel"]');
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
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
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
