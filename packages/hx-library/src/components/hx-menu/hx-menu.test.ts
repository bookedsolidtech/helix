import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixMenu } from './hx-menu.js';
import type { HelixMenuItem } from './hx-menu-item.js';
import type { HelixMenuDivider } from './hx-menu-divider.js';
import './index.js';

afterEach(cleanup);

// ─────────────────────────────────────────────────────────────
// Helpers — assertions that accept BOTH host-canonical (modern) and
// inner-element (legacy) ARIA placements. Group 5b migrated the menu
// family to host-canonical; we keep helpers tolerant so the legacy path
// remains exercised on any engine without IDL ARIA element references.
// ─────────────────────────────────────────────────────────────

function getMenuRole(el: HTMLElement): string | null {
  // Modern path: host carries role; legacy: inner [role="menu"]
  return (
    el.getAttribute('role') ??
    (el as HTMLElement & { _internals?: ElementInternals })._internals?.role ??
    el.shadowRoot?.querySelector('[role="menu"]')?.getAttribute('role') ??
    null
  );
}

function getItemRole(el: HelixMenuItem): string | null {
  return (
    el.getAttribute('role') ??
    el.shadowRoot?.querySelector('[role^="menuitem"]')?.getAttribute('role') ??
    null
  );
}

function getItemAriaState(el: HelixMenuItem, attr: string): string | null {
  // Try host attribute first; fall back to inner element. ElementInternals
  // does not project to attributes, so on the modern path inspect via
  // accessibility tree if available.
  const host = el.getAttribute(attr);
  if (host !== null) return host;
  const inner = el.shadowRoot?.querySelector('.menu-item');
  return inner?.getAttribute(attr) ?? null;
}

function isItemFocused(el: HelixMenuItem): boolean {
  if (document.activeElement === el) return true;
  const inner = el.shadowRoot?.querySelector<HTMLElement>('.menu-item');
  return el.shadowRoot?.activeElement === inner;
}

// ─────────────────────────────────────────────────────────────
// hx-menu
// ─────────────────────────────────────────────────────────────

describe('hx-menu', () => {
  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixMenu>('<hx-menu></hx-menu>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes role="menu" on host or inner element', async () => {
      const el = await fixture<HelixMenu>('<hx-menu></hx-menu>');
      // Modern path: ElementInternals.role on host (not surfaced as
      // attribute, but the accessibility tree carries it). Verify by
      // inspecting either the inner [role="menu"] (legacy) or the
      // ElementInternals access on the host.
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const role =
        internals.role ?? el.shadowRoot?.querySelector('[role="menu"]')?.getAttribute('role');
      expect(role).toBe('menu');
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixMenu>('<hx-menu></hx-menu>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('applies max-height and overflow-y:auto to inner menu element', async () => {
      const el = await fixture<HelixMenu>('<hx-menu></hx-menu>');
      const base = shadowQuery<HTMLElement>(el, '[part~="base"]')!;
      const styles = getComputedStyle(base);
      expect(styles.overflowY).toBe('auto');
    });

    it('renders slotted hx-menu-item children', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">Item A</hx-menu-item>
          <hx-menu-item value="b">Item B</hx-menu-item>
        </hx-menu>
      `);
      const items = el.querySelectorAll('hx-menu-item');
      expect(items.length).toBe(2);
    });
  });

  describe('hx-select event', () => {
    it('dispatches hx-select when item is clicked', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="edit">Edit</hx-menu-item>
        </hx-menu>
      `);
      const item = el.querySelector('hx-menu-item') as HelixMenuItem;
      const inner = shadowQuery<HTMLElement>(item, '.menu-item')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      inner.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('edit');
    });

    it('hx-select detail contains item reference', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="x">Item</hx-menu-item>
        </hx-menu>
      `);
      const item = el.querySelector('hx-menu-item') as HelixMenuItem;
      const inner = shadowQuery<HTMLElement>(item, '.menu-item')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      inner.click();
      const event = await eventPromise;
      expect(event.detail.item).toBe(item);
    });

    it('hx-select bubbles and is composed', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="x">Item</hx-menu-item>
        </hx-menu>
      `);
      const item = el.querySelector('hx-menu-item') as HelixMenuItem;
      const inner = shadowQuery<HTMLElement>(item, '.menu-item')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      inner.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('does not dispatch hx-select for disabled items', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="x" disabled>Item</hx-menu-item>
        </hx-menu>
      `);
      const item = el.querySelector('hx-menu-item') as HelixMenuItem;
      const inner = shadowQuery<HTMLElement>(item, '.menu-item')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      inner.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  describe('Keyboard navigation', () => {
    it('ArrowDown moves focus to next item', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(isItemFocused(items[1])).toBe(true);
    });

    it('ArrowUp wraps to last item from first', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
          <hx-menu-item value="c">C</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      items[0].focus();
      await userEvent.keyboard('{ArrowUp}');
      expect(isItemFocused(items[2])).toBe(true);
    });

    it('ArrowDown wraps to first item from last', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      items[1].focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(isItemFocused(items[0])).toBe(true);
    });

    it('Escape dispatches hx-close', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
        </hx-menu>
      `);
      const item = el.querySelector('hx-menu-item') as HelixMenuItem;
      item.focus();
      const eventPromise = oneEvent(el, 'hx-close');
      await userEvent.keyboard('{Escape}');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Home focuses first item', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
          <hx-menu-item value="c">C</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      items[2].focus();
      await userEvent.keyboard('{Home}');
      expect(isItemFocused(items[0])).toBe(true);
    });

    it('End focuses last item', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
          <hx-menu-item value="c">C</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      items[0].focus();
      await userEvent.keyboard('{End}');
      expect(isItemFocused(items[2])).toBe(true);
    });

    it('skips disabled items during keyboard navigation', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b" disabled>B (disabled)</hx-menu-item>
          <hx-menu-item value="c">C</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      // Should skip disabled item B and focus C
      expect(isItemFocused(items[2])).toBe(true);
    });
  });

  describe('Roving tabindex (host-canonical)', () => {
    it('first enabled item host has tabindex=0, others have tabindex=-1', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
          <hx-menu-item value="c">C</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      await items[0].updateComplete;
      await items[1].updateComplete;
      await items[2].updateComplete;
      expect(items[0].tabIndex).toBe(0);
      expect(items[1].tabIndex).toBe(-1);
      expect(items[2].tabIndex).toBe(-1);
    });

    it('updates tabindex after ArrowDown navigation', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await items[0].updateComplete;
      await items[1].updateComplete;
      expect(items[0].tabIndex).toBe(-1);
      expect(items[1].tabIndex).toBe(0);
    });

    it('disabled items always have tabindex=-1', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a" disabled>A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      await items[0].updateComplete;
      expect(items[0].tabIndex).toBe(-1);
    });
  });

  describe('Public methods', () => {
    it('focusFirst() focuses the first enabled item', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
        </hx-menu>
      `);
      el.focusFirst();
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      expect(isItemFocused(items[0])).toBe(true);
    });

    it('focusLast() focuses the last enabled item', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
          <hx-menu-item value="c">C</hx-menu-item>
        </hx-menu>
      `);
      el.focusLast();
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      expect(isItemFocused(items[2])).toBe(true);
    });

    it('focusFirst() skips disabled items', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a" disabled>A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
        </hx-menu>
      `);
      el.focusFirst();
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      expect(isItemFocused(items[1])).toBe(true);
    });
  });

  describe('Property: label (host-canonical accessible name)', () => {
    it('projects label property onto internals.ariaLabel', async () => {
      const el = await fixture<HelixMenu>('<hx-menu label="Actions"></hx-menu>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Actions');
    });

    it('falls back to internals.ariaLabel="Menu" when label is empty', async () => {
      const el = await fixture<HelixMenu>('<hx-menu></hx-menu>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Menu');
    });

    it('host aria-label overrides label property', async () => {
      const el = await fixture<HelixMenu>(
        '<hx-menu label="Fallback" aria-label="Override"></hx-menu>',
      );
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Override');
    });

    it('host aria-labelledby resolves to ariaLabelledByElements', async () => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <h2 id="menu-heading">Patient actions</h2>
        <hx-menu aria-labelledby="menu-heading"></hx-menu>
      `;
      document.body.appendChild(wrap);
      const el = wrap.querySelector('hx-menu') as HelixMenu;
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const refs = (internals as ElementInternals & { ariaLabelledByElements?: Element[] | null })
        .ariaLabelledByElements;
      // On modern engines, ariaLabelledByElements is the projection. On
      // legacy engines, the flattened string is on ariaLabel instead.
      if (refs && refs.length > 0) {
        expect(refs[0]?.id).toBe('menu-heading');
      } else {
        expect(internals.ariaLabel).toContain('Patient actions');
      }
      wrap.remove();
    });
  });

  describe('Typeahead search', () => {
    it('focuses item matching typed character', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">Apple</hx-menu-item>
          <hx-menu-item value="b">Banana</hx-menu-item>
          <hx-menu-item value="c">Cherry</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      items[0].focus();
      await userEvent.keyboard('c');
      expect(isItemFocused(items[2])).toBe(true);
    });

    it('builds multi-character typeahead buffer', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">Copy</hx-menu-item>
          <hx-menu-item value="b">Cut</hx-menu-item>
          <hx-menu-item value="c">Close</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      items[0].focus();
      await userEvent.keyboard('cl');
      expect(isItemFocused(items[2])).toBe(true);
    });
  });

  describe('Submenu auto-handling', () => {
    it('opens nested submenu on hx-item-submenu-open (default behaviour)', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="parent">
            Parent
            <hx-menu slot="submenu">
              <hx-menu-item value="child">Child</hx-menu-item>
            </hx-menu>
          </hx-menu-item>
        </hx-menu>
      `);
      const parent = el.querySelector('hx-menu-item') as HelixMenuItem;
      await parent.updateComplete;
      parent.focus();
      await userEvent.keyboard('{ArrowRight}');
      await parent.updateComplete;
      // Expanded state should reflect on the host (modern) or inner (legacy)
      const expanded =
        parent.getAttribute('aria-expanded') ??
        parent.shadowRoot?.querySelector('.menu-item')?.getAttribute('aria-expanded');
      // Modern path projects via internals; check via internals when attr null.
      const internals = (parent as unknown as { _internals: ElementInternals })._internals;
      expect(expanded === 'true' || internals.ariaExpanded === 'true').toBe(true);
    });

    it('respects event.preventDefault() opt-out for consumer-controlled submenus', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="parent">
            Parent
            <hx-menu slot="submenu">
              <hx-menu-item value="child">Child</hx-menu-item>
            </hx-menu>
          </hx-menu-item>
        </hx-menu>
      `);
      el.addEventListener('hx-item-submenu-open', (e) => e.preventDefault());
      const parent = el.querySelector('hx-menu-item') as HelixMenuItem;
      await parent.updateComplete;
      parent.focus();
      await userEvent.keyboard('{ArrowRight}');
      await parent.updateComplete;
      const internals = (parent as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaExpanded).toBe('false');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// hx-menu-item
// ─────────────────────────────────────────────────────────────

describe('hx-menu-item', () => {
  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes role="menuitem" by default (host-canonical or inner)', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const role =
        internals.role ?? el.shadowRoot?.querySelector('[role^="menuitem"]')?.getAttribute('role');
      expect(role).toBe('menuitem');
    });

    it('exposes role="menuitemcheckbox" when type="checkbox"', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="checkbox">Item</hx-menu-item>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const role =
        internals.role ?? el.shadowRoot?.querySelector('[role^="menuitem"]')?.getAttribute('role');
      expect(role).toBe('menuitemcheckbox');
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "prefix" CSS part', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const prefix = shadowQuery(el, '[part~="prefix"]');
      expect(prefix).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const label = shadowQuery(el, '[part~="label"]');
      expect(label).toBeTruthy();
    });

    it('exposes "suffix" CSS part', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const suffix = shadowQuery(el, '[part~="suffix"]');
      expect(suffix).toBeTruthy();
    });
  });

  describe('Property: disabled', () => {
    it('reflects disabled to host attribute', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item disabled>Item</hx-menu-item>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('projects aria-disabled onto internals.ariaDisabled', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item disabled>Item</hx-menu-item>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaDisabled).toBe('true');
    });

    it('clears aria-disabled when enabled', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaDisabled).toBeNull();
    });

    it('does not dispatch hx-item-select when disabled', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item disabled>Item</hx-menu-item>');
      const inner = shadowQuery<HTMLElement>(el, '.menu-item')!;
      let fired = false;
      el.addEventListener('hx-item-select', () => {
        fired = true;
      });
      inner.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  describe('Property: type="checkbox"', () => {
    it('renders checked-icon part', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="checkbox">Item</hx-menu-item>');
      const icon = shadowQuery(el, '[part~="checked-icon"]');
      expect(icon).toBeTruthy();
    });

    it('projects aria-checked="false" via internals when unchecked', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="checkbox">Item</hx-menu-item>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaChecked).toBe('false');
    });

    it('projects aria-checked="true" via internals when checked', async () => {
      const el = await fixture<HelixMenuItem>(
        '<hx-menu-item type="checkbox" checked>Item</hx-menu-item>',
      );
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaChecked).toBe('true');
    });

    it('toggles checked on click', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="checkbox">Item</hx-menu-item>');
      const inner = shadowQuery<HTMLElement>(el, '.menu-item')!;
      expect(el.checked).toBe(false);
      inner.click();
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('does not project aria-checked for normal type', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaChecked).toBeNull();
    });
  });

  describe('Property: type="radio"', () => {
    it('exposes role="menuitemradio"', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="radio">Item</hx-menu-item>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const role =
        internals.role ?? el.shadowRoot?.querySelector('[role^="menuitem"]')?.getAttribute('role');
      expect(role).toBe('menuitemradio');
    });

    it('projects aria-checked="false" via internals when unchecked', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="radio">Item</hx-menu-item>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaChecked).toBe('false');
    });

    it('sets checked=true on click (does not toggle off)', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="radio">Item</hx-menu-item>');
      const inner = shadowQuery<HTMLElement>(el, '.menu-item')!;
      inner.click();
      await el.updateComplete;
      expect(el.checked).toBe(true);
      inner.click();
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('renders checked-icon part', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="radio">Item</hx-menu-item>');
      const icon = shadowQuery(el, '[part~="checked-icon"]');
      expect(icon).toBeTruthy();
    });

    it('unchecks sibling radio items on selection (mutual exclusion)', async () => {
      const menu = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item type="radio" value="a" checked>Alpha</hx-menu-item>
          <hx-menu-item type="radio" value="b">Beta</hx-menu-item>
          <hx-menu-item type="radio" value="c">Charlie</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(menu.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      expect(items[0].checked).toBe(true);

      const betaInner = shadowQuery<HTMLElement>(items[1], '.menu-item')!;
      betaInner.click();
      await items[1].updateComplete;
      await items[0].updateComplete;

      expect(items[0].checked).toBe(false);
      expect(items[1].checked).toBe(true);
      expect(items[2].checked).toBe(false);
    });
  });

  describe('Property: loading', () => {
    it('reflects loading to host attribute', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item loading>Item</hx-menu-item>');
      expect(el.hasAttribute('loading')).toBe(true);
    });

    it('projects aria-busy="true" via internals when loading', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item loading>Item</hx-menu-item>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaBusy).toBe('true');
    });

    it('does not dispatch hx-item-select when loading', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item loading>Item</hx-menu-item>');
      const inner = shadowQuery<HTMLElement>(el, '.menu-item')!;
      let fired = false;
      el.addEventListener('hx-item-select', () => {
        fired = true;
      });
      inner.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  describe('Events', () => {
    it('dispatches hx-item-select on click', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item value="test">Item</hx-menu-item>');
      const inner = shadowQuery<HTMLElement>(el, '.menu-item')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-item-select');
      inner.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('test');
    });

    it('dispatches hx-item-select on Enter key', async () => {
      const el = await fixture<HelixMenuItem>(
        '<hx-menu-item value="enter-test">Item</hx-menu-item>',
      );
      el.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-item-select');
      await userEvent.keyboard('{Enter}');
      const event = await eventPromise;
      expect(event.detail.value).toBe('enter-test');
    });

    it('dispatches hx-item-select on Space key', async () => {
      const el = await fixture<HelixMenuItem>(
        '<hx-menu-item value="space-test">Item</hx-menu-item>',
      );
      el.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-item-select');
      await userEvent.keyboard(' ');
      const event = await eventPromise;
      expect(event.detail.value).toBe('space-test');
    });
  });

  describe('Submenu', () => {
    it('projects aria-haspopup="menu" via internals when submenu is present', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="parent">
          Parent
          <hx-menu slot="submenu">
            <hx-menu-item value="child">Child</hx-menu-item>
          </hx-menu>
        </hx-menu-item>
      `);
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaHasPopup).toBe('menu');
    });

    it('projects aria-expanded="false" by default when submenu is present', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="parent">
          Parent
          <hx-menu slot="submenu">
            <hx-menu-item value="child">Child</hx-menu-item>
          </hx-menu>
        </hx-menu-item>
      `);
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaExpanded).toBe('false');
    });

    it('projects aria-expanded="true" via internals after setSubmenuOpen(true)', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="parent">
          Parent
          <hx-menu slot="submenu">
            <hx-menu-item value="child">Child</hx-menu-item>
          </hx-menu>
        </hx-menu-item>
      `);
      await el.updateComplete;
      el.setSubmenuOpen(true);
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaExpanded).toBe('true');
    });

    it('does not project aria-expanded when no submenu is present', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item value="leaf">Leaf</hx-menu-item>');
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaExpanded).toBeNull();
    });
  });

  describe('ArrowLeft submenu close', () => {
    it('dispatches hx-item-submenu-close when ArrowLeft is pressed', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="parent">
          Parent
          <hx-menu slot="submenu">
            <hx-menu-item value="child">Child</hx-menu-item>
          </hx-menu>
        </hx-menu-item>
      `);
      await el.updateComplete;
      el.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-item-submenu-close');
      await userEvent.keyboard('{ArrowLeft}');
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.detail.item).toBe(el);
    });

    it('hx-item-submenu-close bubbles and is composed', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item value="x">Item</hx-menu-item>');
      el.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-item-submenu-close');
      await userEvent.keyboard('{ArrowLeft}');
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  describe('Slots', () => {
    it('default slot renders label text', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Edit Record</hx-menu-item>');
      expect(el.textContent?.trim()).toBe('Edit Record');
    });

    it('prefix slot renders content', async () => {
      const el = await fixture<HelixMenuItem>(
        '<hx-menu-item><svg slot="prefix" aria-hidden="true"></svg>Label</hx-menu-item>',
      );
      const prefixSlotted = el.querySelector('[slot="prefix"]');
      expect(prefixSlotted).toBeTruthy();
      expect(prefixSlotted?.tagName.toLowerCase()).toBe('svg');
    });

    it('suffix slot renders content', async () => {
      const el = await fixture<HelixMenuItem>(
        '<hx-menu-item>Label<kbd slot="suffix">⌘C</kbd></hx-menu-item>',
      );
      const suffixSlotted = el.querySelector('[slot="suffix"]');
      expect(suffixSlotted).toBeTruthy();
      expect(suffixSlotted?.tagName.toLowerCase()).toBe('kbd');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// hx-menu-divider
// ─────────────────────────────────────────────────────────────

describe('hx-menu-divider', () => {
  it('renders with shadow DOM', async () => {
    const el = await fixture<HelixMenuDivider>('<hx-menu-divider></hx-menu-divider>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('exposes role="separator" (host-canonical or inner)', async () => {
    const el = await fixture<HelixMenuDivider>('<hx-menu-divider></hx-menu-divider>');
    const internals = (el as unknown as { _internals: ElementInternals })._internals;
    const role =
      internals.role ?? el.shadowRoot?.querySelector('[role="separator"]')?.getAttribute('role');
    expect(role).toBe('separator');
  });

  it('projects aria-orientation="horizontal" via internals', async () => {
    const el = await fixture<HelixMenuDivider>('<hx-menu-divider></hx-menu-divider>');
    const internals = (el as unknown as { _internals: ElementInternals })._internals;
    const orientation =
      internals.ariaOrientation ??
      el.shadowRoot?.querySelector('[role="separator"]')?.getAttribute('aria-orientation');
    expect(orientation).toBe('horizontal');
  });

  it('exposes "base" CSS part', async () => {
    const el = await fixture<HelixMenuDivider>('<hx-menu-divider></hx-menu-divider>');
    const base = shadowQuery(el, '[part~="base"]');
    expect(base).toBeTruthy();
  });

  it('renders inside hx-menu without errors', async () => {
    const menu = await fixture<HelixMenu>(`
      <hx-menu>
        <hx-menu-item value="a">A</hx-menu-item>
        <hx-menu-divider></hx-menu-divider>
        <hx-menu-item value="b">B</hx-menu-item>
      </hx-menu>
    `);
    const dividers = menu.querySelectorAll('hx-menu-divider');
    expect(dividers.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Accessibility (axe-core)
// ─────────────────────────────────────────────────────────────

describe('Accessibility (axe-core)', () => {
  it('hx-menu has no axe violations', async () => {
    const el = await fixture<HelixMenu>(`
      <hx-menu label="Patient Actions">
        <hx-menu-item value="a">View Chart</hx-menu-item>
        <hx-menu-item value="b">Edit Record</hx-menu-item>
        <hx-menu-divider></hx-menu-divider>
        <hx-menu-item value="c">Delete</hx-menu-item>
      </hx-menu>
    `);
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('hx-menu-item has no axe violations inside hx-menu', async () => {
    const el = await fixture<HelixMenu>(`
      <hx-menu label="Test">
        <hx-menu-item value="test">Edit</hx-menu-item>
      </hx-menu>
    `);
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('hx-menu-item type=checkbox has no axe violations inside hx-menu', async () => {
    const el = await fixture<HelixMenu>(`
      <hx-menu label="Test">
        <hx-menu-item type="checkbox" checked>Notifications</hx-menu-item>
      </hx-menu>
    `);
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('hx-menu-item type=radio has no axe violations inside hx-menu', async () => {
    const el = await fixture<HelixMenu>(`
      <hx-menu label="Priority">
        <hx-menu-item type="radio" value="a" checked>Low</hx-menu-item>
        <hx-menu-item type="radio" value="b">Medium</hx-menu-item>
        <hx-menu-item type="radio" value="c">High</hx-menu-item>
      </hx-menu>
    `);
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('hx-menu with label has no axe violations', async () => {
    const el = await fixture<HelixMenu>(`
      <hx-menu label="Patient Actions">
        <hx-menu-item value="view">View Chart</hx-menu-item>
        <hx-menu-item value="edit">Edit Record</hx-menu-item>
      </hx-menu>
    `);
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('hx-menu-divider has no axe violations', async () => {
    const el = await fixture<HelixMenuDivider>('<hx-menu-divider></hx-menu-divider>');
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });
});
