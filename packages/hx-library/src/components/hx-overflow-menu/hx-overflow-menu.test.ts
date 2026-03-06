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
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
    });

    it('exposes "button" CSS part', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const part = shadowQuery(el, '[part="button"]');
      expect(part).toBeTruthy();
    });

    it('does not render panel when closed', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
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
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn?.classList.contains('trigger--sm')).toBe(true);
    });

    it('applies md class to trigger (default)', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
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
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu disabled></hx-overflow-menu>');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      expect(btn?.disabled).toBe(true);
    });

    it('reflects disabled to host', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu disabled></hx-overflow-menu>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not open when disabled', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu disabled></hx-overflow-menu>');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel).toBeNull();
    });
  });

  // ─── ARIA (5) ───

  describe('ARIA', () => {
    it('trigger has aria-label="More actions"', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn?.getAttribute('aria-label')).toBe('More actions');
    });

    it('trigger has aria-haspopup="menu"', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn?.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('trigger aria-expanded is false when closed', async () => {
      const el = await fixture<HelixOverflowMenu>('<hx-overflow-menu></hx-overflow-menu>');
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

  // ─── Keyboard Navigation (9) ───

  describe('Keyboard Navigation', () => {
    /** Shared fixture HTML for 3-item menus. */
    const threeItemHtml =
      '<hx-overflow-menu>' +
      '<button role="menuitem">One</button>' +
      '<button role="menuitem">Two</button>' +
      '<button role="menuitem">Three</button>' +
      '</hx-overflow-menu>';

    /** Helper: open the menu and return the element + its menu items. */
    async function openMenu(html: string) {
      const el = await fixture<HelixOverflowMenu>(html);
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
      return { el, btn, items };
    }

    it('ArrowDown on closed trigger opens the menu', async () => {
      const el = await fixture<HelixOverflowMenu>(threeItemHtml);
      const showPromise = oneEvent(el, 'hx-show');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await showPromise;
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel).toBeTruthy();
    });

    it('ArrowDown moves focus to next menu item', async () => {
      const { items } = await openMenu(threeItemHtml);
      // After opening, first item has focus — ArrowDown from it should move to second
      items[0]?.focus();
      items[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
    });

    it('ArrowDown wraps from last to first item', async () => {
      const { items } = await openMenu(threeItemHtml);
      // Focus the last item, then ArrowDown should wrap to first
      items[2]?.focus();
      items[2]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('ArrowUp moves focus to previous menu item', async () => {
      const { items } = await openMenu(threeItemHtml);
      items[1]?.focus();
      items[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('ArrowUp wraps from first to last item', async () => {
      const { items } = await openMenu(threeItemHtml);
      items[0]?.focus();
      items[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[2]);
    });

    it('Home moves focus to first menu item', async () => {
      const { items } = await openMenu(threeItemHtml);
      items[2]?.focus();
      items[2]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('End moves focus to last menu item', async () => {
      const { items } = await openMenu(threeItemHtml);
      items[0]?.focus();
      items[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(items[2]);
    });

    it('ArrowDown skips disabled items (aria-disabled="true")', async () => {
      const disabledMiddleHtml =
        '<hx-overflow-menu>' +
        '<button role="menuitem">One</button>' +
        '<button role="menuitem" aria-disabled="true">Two</button>' +
        '<button role="menuitem">Three</button>' +
        '</hx-overflow-menu>';
      const { items } = await openMenu(disabledMiddleHtml);
      const enabledItems = items.filter((i) => i.getAttribute('aria-disabled') !== 'true');
      // Focus first enabled item, ArrowDown should skip disabled middle -> land on Three
      enabledItems[0]?.focus();
      enabledItems[0]?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
      expect(document.activeElement).toBe(enabledItems[1]);
      expect(document.activeElement?.textContent).toBe('Three');
    });

    it('ArrowUp skips disabled items (aria-disabled="true")', async () => {
      const disabledMiddleHtml =
        '<hx-overflow-menu>' +
        '<button role="menuitem">One</button>' +
        '<button role="menuitem" aria-disabled="true">Two</button>' +
        '<button role="menuitem">Three</button>' +
        '</hx-overflow-menu>';
      const { items } = await openMenu(disabledMiddleHtml);
      const enabledItems = items.filter((i) => i.getAttribute('aria-disabled') !== 'true');
      // Focus last enabled item (Three), ArrowUp should skip disabled middle -> land on One
      enabledItems[1]?.focus();
      enabledItems[1]?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
      expect(document.activeElement).toBe(enabledItems[0]);
      expect(document.activeElement?.textContent).toBe('One');
    });
  });

  // ─── Disabled Items (2) ───

  describe('Disabled Items', () => {
    it('does not fire hx-select for aria-disabled items', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu>' +
          '<button role="menuitem" aria-disabled="true" data-value="nope">Disabled</button>' +
          '</hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;

      let selectFired = false;
      el.addEventListener('hx-select', () => {
        selectFired = true;
      });

      const disabledItem = el.querySelector('[role="menuitem"]') as HTMLButtonElement;
      disabledItem.click();

      // Give a microtask tick for any async event dispatch
      await el.updateComplete;
      expect(selectFired).toBe(false);
    });

    it('renders separator elements (hr with role="separator")', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu>' +
          '<button role="menuitem">Edit</button>' +
          '<hr role="separator" />' +
          '<button role="menuitem">Delete</button>' +
          '</hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part="button"]');
      btn?.click();
      await el.updateComplete;

      const separator = el.querySelector('hr[role="separator"]');
      expect(separator).toBeTruthy();
      // Separator should be slotted and visible in the panel
      const items = el.querySelectorAll('[role="menuitem"]');
      expect(items.length).toBe(2);
    });
  });
});
