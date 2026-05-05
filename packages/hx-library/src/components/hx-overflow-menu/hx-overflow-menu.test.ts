import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixOverflowMenu } from './hx-overflow-menu.js';
import type { HelixMenuItem } from '../hx-menu/hx-menu-item.js';
import './index.js';
import '../hx-menu/index.js';

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

  // ─── Typeahead — submenu-aware label extractor (codex round-7) ───

  describe('Typeahead with nested submenus (codex push-gate round-7 finding 3)', () => {
    it('parent item with submenu-only-text does not match its grandchild prefix', async () => {
      // Parent has NO own-text — only a nested submenu containing "Apple".
      // Pre-fix: textContent walks into submenu and returns "Apple", so
      // typing "a" matches the parent. Post-fix: parent's own label is "",
      // so "a" matches the legitimate sibling "Apricot".
      const el = await fixture<HelixOverflowMenu>(`
        <hx-overflow-menu>
          <hx-menu-item value="parent"><hx-menu slot="submenu"><hx-menu-item value="apple">Apple</hx-menu-item></hx-menu></hx-menu-item>
          <hx-menu-item value="apricot">Apricot</hx-menu-item>
        </hx-overflow-menu>
      `);
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const parentItem = el.querySelector<HelixMenuItem>('hx-menu-item[value="parent"]')!;
      const apricotItem = el.querySelector<HelixMenuItem>('hx-menu-item[value="apricot"]')!;
      // Focus a known-not-target item first so we can detect movement.
      apricotItem.focus();
      parentItem.focus();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      // Pre-fix: parent matches first ("Apple" via grandchild text) → focus
      // stays on parent. Post-fix: parent has empty effective label → only
      // Apricot starts with "a" → focus moves to Apricot.
      expect(document.activeElement === apricotItem || apricotItem.matches(':focus-within')).toBe(
        true,
      );
    });
  });

  // ─── Nested submenu routing (codex push-gate round-9) ───

  describe('Nested submenu open/close routing (codex push-gate round-9 P1)', () => {
    it('ArrowLeft on a child of a nested submenu closes the parent submenu and keeps the overflow panel open', async () => {
      const el = await fixture<HelixOverflowMenu>(`
        <hx-overflow-menu>
          <hx-menu-item value="parent" submenu-open>
            Parent
            <hx-menu slot="submenu">
              <hx-menu-item value="child">Child</hx-menu-item>
            </hx-menu>
          </hx-menu-item>
        </hx-overflow-menu>
      `);
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]')!;
      btn.click();
      await el.updateComplete;

      const parent = el.querySelector<HelixMenuItem>('hx-menu-item[value="parent"]')!;
      const child = el.querySelector<HelixMenuItem>('hx-menu-item[value="child"]')!;
      await parent.updateComplete;
      await child.updateComplete;

      child.focus();
      child.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
      await parent.updateComplete;
      await child.updateComplete;

      const parentInternals = (parent as unknown as { _internals: ElementInternals })._internals;
      expect(parentInternals.ariaExpanded).toBe('false');
      // Overflow panel must stay open (close belongs to the inner menu).
      const panel = shadowQuery(el, '[part~="panel"]');
      expect(panel).toBeTruthy();
      // Focus returned to Parent.
      expect(document.activeElement === parent || parent.matches(':focus-within')).toBe(true);
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

  // ─── Host-canonical hx-menu-item integration (codex round-2) ───

  describe('Host-canonical hx-menu-item integration', () => {
    it('walks slotted hx-menu-item children for focus / arrow nav', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><hx-menu-item value="edit">Edit</hx-menu-item><hx-menu-item value="delete">Delete</hx-menu-item></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('hx-menu-item') as NodeListOf<HTMLElement>;
      expect(items.length).toBe(2);
      // Roving tabindex must hand the first item a tab stop (tabindex=0)
      // and demote the rest to -1.
      expect(items[0].tabIndex).toBe(0);
      expect(items[1].tabIndex).toBe(-1);

      items[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
    });

    it('routes hx-item-select from hx-menu-item through hx-select', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><hx-menu-item value="edit">Edit</hx-menu-item><hx-menu-item value="delete">Delete</hx-menu-item></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('hx-menu-item') as NodeListOf<HTMLElement>;
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-select');
      items[0].click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('edit');
    });

    it('closes the panel after hx-menu-item activation', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><hx-menu-item value="edit">Edit</hx-menu-item></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const item = el.querySelector('hx-menu-item') as HTMLElement;
      const hidePromise = oneEvent(el, 'hx-hide');
      item.click();
      await hidePromise;

      await el.updateComplete;
      const panel = shadowQuery(el, '[part~="panel"]');
      expect(panel).toBeNull();
    });

    it('does not double-fire hx-select for a single hx-menu-item click', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><hx-menu-item value="edit">Edit</hx-menu-item></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      let count = 0;
      el.addEventListener('hx-select', () => {
        count += 1;
      });
      const item = el.querySelector('hx-menu-item') as HTMLElement;
      item.click();
      await el.updateComplete;
      expect(count).toBe(1);
    });

    // Codex round-3: descendant-target click bypass. If a consumer slots a
    // `[role="menuitem"]` descendant inside an `hx-menu-item`, `closest()` on
    // the legacy selector resolves to the inner element (nearest match) and
    // the localName guard misses — dispatching twice (here AND from the
    // bubbled `hx-item-select` -> `_handleSlotItemSelect`). The host-canonical
    // bail must run FIRST, independent of legacy selectors.
    it('does not double-fire hx-select when clicking a [role="menuitem"] descendant inside hx-menu-item', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><hx-menu-item value="edit"><button role="menuitem" type="button">Edit</button></hx-menu-item></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      let count = 0;
      el.addEventListener('hx-select', () => {
        count += 1;
      });
      const inner = el.querySelector<HTMLElement>('button[role="menuitem"]')!;
      inner.click();
      await el.updateComplete;
      expect(count).toBe(1);
    });

    it('skips hx-menu-divider when collecting menu items (APG separator stays non-focusable)', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><hx-menu-item value="edit">Edit</hx-menu-item><hx-menu-divider></hx-menu-divider><hx-menu-item value="delete">Delete</hx-menu-item></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('hx-menu-item') as NodeListOf<HTMLElement>;
      items[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      // ArrowDown must move past the divider directly to the next menu-item,
      // not stop on the separator.
      expect(document.activeElement).toBe(items[1]);
    });

    it('skips disabled hx-menu-item children', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><hx-menu-item value="edit">Edit</hx-menu-item><hx-menu-item value="delete" disabled>Delete</hx-menu-item><hx-menu-item value="archive">Archive</hx-menu-item></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('hx-menu-item') as NodeListOf<HTMLElement>;
      items[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      // Disabled middle item must be skipped — focus must land on archive.
      expect(document.activeElement).toBe(items[2]);
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

  // ─────────────────────────────────────────────────────────────
  // Codex push-gate round-2 finding 3: roving tabindex must reach the
  // canonical focusable surface for each item shape. On the host-canonical
  // hx-menu-item fallback path (`_supportsIdrefRefs === false`), the host
  // is forced to `tabindex=-1` and the inner `.menu-item` is the Tab stop.
  // Direct host-tabIndex writes from hx-overflow-menu would never reach
  // that inner element — `setRovingTabIndex()` is the routing seam.
  // ─────────────────────────────────────────────────────────────

  describe('roving tabindex routing for slotted hx-menu-item (codex push-gate round-2 finding 3)', () => {
    type HelixMenuItemCtor = typeof HelixMenuItem & {
      __testSupportsIdrefRefsOverride: boolean | null;
    };

    afterEach(() => {
      const ctor = customElements.get('hx-menu-item') as unknown as HelixMenuItemCtor | undefined;
      if (ctor) ctor.__testSupportsIdrefRefsOverride = null;
    });

    it('routes roving tabindex to inner .menu-item on the fallback path', async () => {
      const ctor = customElements.get('hx-menu-item') as unknown as HelixMenuItemCtor;
      ctor.__testSupportsIdrefRefsOverride = false;

      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><hx-menu-item value="edit">Edit</hx-menu-item><hx-menu-item value="delete">Delete</hx-menu-item></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('hx-menu-item') as NodeListOf<HelixMenuItem>;
      await items[0]!.updateComplete;
      await items[1]!.updateComplete;

      // Host MUST stay out of the tab order on the fallback path —
      // direct host-tabIndex writes would have left this at 0 here.
      expect(items[0]!.tabIndex).toBe(-1);
      expect(items[1]!.tabIndex).toBe(-1);

      // Inner `.menu-item` carries the active roving tabindex.
      const inner0 = items[0]!.shadowRoot!.querySelector<HTMLElement>('.menu-item')!;
      const inner1 = items[1]!.shadowRoot!.querySelector<HTMLElement>('.menu-item')!;
      expect(inner0.getAttribute('tabindex')).toBe('0');
      expect(inner1.getAttribute('tabindex')).toBe('-1');

      // Land focus on item[0] before ArrowDown — `_focusFirstItem` runs
      // inside the async `_show()` chain so it may not have settled by the
      // time we dispatch. Without an active item, the keydown handler
      // resets the roving target back to 0 (focused index = -1 fall-back).
      items[0]!.focus();

      // ArrowDown advances the roving target through the inner surface.
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      // Lit re-render flush — both items had _rovingTabIndex change.
      await el.updateComplete;
      await items[0]!.updateComplete;
      await items[1]!.updateComplete;

      expect(inner0.getAttribute('tabindex')).toBe('-1');
      expect(inner1.getAttribute('tabindex')).toBe('0');
    });

    it('keeps direct tabIndex write for plain [role="menuitem"] children', async () => {
      const el = await fixture<HelixOverflowMenu>(
        '<hx-overflow-menu><button role="menuitem">Edit</button><button role="menuitem">Delete</button></hx-overflow-menu>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="button"]');
      btn?.click();
      await el.updateComplete;

      const items = el.querySelectorAll('button[role="menuitem"]') as NodeListOf<HTMLElement>;
      // Plain children keep the legacy direct-write semantics.
      expect(items[0]!.tabIndex).toBe(0);
      expect(items[1]!.tabIndex).toBe(-1);
    });
  });
});
