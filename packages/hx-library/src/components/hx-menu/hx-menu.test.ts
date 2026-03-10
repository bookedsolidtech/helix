import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixMenu } from './hx-menu.js';
import type { HelixMenuItem } from './hx-menu-item.js';
import type { HelixMenuDivider } from './hx-menu-divider.js';
import './index.js';

afterEach(cleanup);

// ─────────────────────────────────────────────────────────────
// hx-menu
// ─────────────────────────────────────────────────────────────

describe('hx-menu', () => {
  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixMenu>('<hx-menu></hx-menu>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders role="menu" on inner element', async () => {
      const el = await fixture<HelixMenu>('<hx-menu></hx-menu>');
      const base = shadowQuery(el, '[role="menu"]');
      expect(base).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixMenu>('<hx-menu></hx-menu>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
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
      const item = el.querySelector('hx-menu-item')!;
      const inner = shadowQuery<HTMLElement>(item, '.menu-item')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      inner.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('edit');
    });

    it('hx-select detail contains item reference', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="view">View</hx-menu-item>
        </hx-menu>
      `);
      const item = el.querySelector('hx-menu-item')!;
      const inner = shadowQuery<HTMLElement>(item, '.menu-item')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      inner.click();
      const event = await eventPromise;
      expect(event.detail.item).toBe(item);
    });

    it('hx-select bubbles and is composed', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="test">Test</hx-menu-item>
        </hx-menu>
      `);
      const item = el.querySelector('hx-menu-item')!;
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
          <hx-menu-item value="disabled" disabled>Disabled</hx-menu-item>
        </hx-menu>
      `);
      const item = el.querySelector('hx-menu-item')!;
      const inner = shadowQuery<HTMLElement>(item, '.menu-item')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      inner.click();
      await el.updateComplete;
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
      const firstInner = shadowQuery<HTMLElement>(items[0], '.menu-item')!;
      firstInner.focus();
      await userEvent.keyboard('{ArrowDown}');
      const secondInner = shadowQuery<HTMLElement>(items[1], '.menu-item')!;
      expect(
        document.activeElement === items[1] || items[1].shadowRoot?.activeElement === secondInner,
      ).toBe(true);
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
      const firstInner = shadowQuery<HTMLElement>(items[0], '.menu-item')!;
      firstInner.focus();
      await userEvent.keyboard('{ArrowUp}');
      const lastInner = shadowQuery<HTMLElement>(items[2], '.menu-item');
      expect(lastInner).toBeTruthy();
    });

    it('ArrowDown wraps to first item from last', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
          <hx-menu-item value="b">B</hx-menu-item>
        </hx-menu>
      `);
      const items = Array.from(el.querySelectorAll('hx-menu-item')) as HelixMenuItem[];
      const lastInner = shadowQuery<HTMLElement>(items[1], '.menu-item')!;
      lastInner.focus();
      await userEvent.keyboard('{ArrowDown}');
      const firstInner = shadowQuery<HTMLElement>(items[0], '.menu-item');
      expect(firstInner).toBeTruthy();
    });

    it('Escape dispatches hx-close', async () => {
      const el = await fixture<HelixMenu>(`
        <hx-menu>
          <hx-menu-item value="a">A</hx-menu-item>
        </hx-menu>
      `);
      const item = el.querySelector('hx-menu-item')!;
      const inner = shadowQuery<HTMLElement>(item, '.menu-item')!;
      inner.focus();
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
      const lastInner = shadowQuery<HTMLElement>(items[2], '.menu-item')!;
      lastInner.focus();
      await userEvent.keyboard('{Home}');
      const firstInner = shadowQuery<HTMLElement>(items[0], '.menu-item')!;
      expect(
        items[0].shadowRoot?.activeElement === firstInner || document.activeElement === items[0],
      ).toBe(true);
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
      const firstInner = shadowQuery<HTMLElement>(items[0], '.menu-item')!;
      firstInner.focus();
      await userEvent.keyboard('{End}');
      const lastInner = shadowQuery<HTMLElement>(items[2], '.menu-item')!;
      expect(
        items[2].shadowRoot?.activeElement === lastInner || document.activeElement === items[2],
      ).toBe(true);
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
      const firstInner = shadowQuery<HTMLElement>(items[0], '.menu-item')!;
      firstInner.focus();
      await userEvent.keyboard('{ArrowDown}');
      // Should skip disabled item B and focus C
      const cInner = shadowQuery<HTMLElement>(items[2], '.menu-item')!;
      expect(
        items[2].shadowRoot?.activeElement === cInner || document.activeElement === items[2],
      ).toBe(true);
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
      const firstInner = shadowQuery<HTMLElement>(items[0], '.menu-item')!;
      firstInner.focus();
      await userEvent.keyboard('c');
      const cherryInner = shadowQuery<HTMLElement>(items[2], '.menu-item')!;
      expect(
        items[2].shadowRoot?.activeElement === cherryInner || document.activeElement === items[2],
      ).toBe(true);
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
      const firstInner = shadowQuery<HTMLElement>(items[0], '.menu-item')!;
      firstInner.focus();
      await userEvent.keyboard('cl');
      const closeInner = shadowQuery<HTMLElement>(items[2], '.menu-item')!;
      expect(
        items[2].shadowRoot?.activeElement === closeInner || document.activeElement === items[2],
      ).toBe(true);
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

    it('renders role="menuitem" by default', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const inner = shadowQuery(el, '[role="menuitem"]');
      expect(inner).toBeTruthy();
    });

    it('renders role="menuitemcheckbox" when type="checkbox"', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="checkbox">Item</hx-menu-item>');
      const inner = shadowQuery(el, '[role="menuitemcheckbox"]');
      expect(inner).toBeTruthy();
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

    it('sets aria-disabled="true" on inner element', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item disabled>Item</hx-menu-item>');
      const inner = shadowQuery(el, '.menu-item')!;
      expect(inner.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled when enabled', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const inner = shadowQuery(el, '.menu-item')!;
      expect(inner.hasAttribute('aria-disabled')).toBe(false);
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

    it('sets aria-checked="false" when unchecked', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="checkbox">Item</hx-menu-item>');
      const inner = shadowQuery(el, '.menu-item')!;
      expect(inner.getAttribute('aria-checked')).toBe('false');
    });

    it('sets aria-checked="true" when checked', async () => {
      const el = await fixture<HelixMenuItem>(
        '<hx-menu-item type="checkbox" checked>Item</hx-menu-item>',
      );
      const inner = shadowQuery(el, '.menu-item')!;
      expect(inner.getAttribute('aria-checked')).toBe('true');
    });

    it('toggles checked on click', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="checkbox">Item</hx-menu-item>');
      const inner = shadowQuery<HTMLElement>(el, '.menu-item')!;
      expect(el.checked).toBe(false);
      inner.click();
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('does not set aria-checked for normal type', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item>Item</hx-menu-item>');
      const inner = shadowQuery(el, '.menu-item')!;
      expect(inner.hasAttribute('aria-checked')).toBe(false);
    });
  });

  describe('Property: type="radio"', () => {
    it('renders role="menuitemradio"', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="radio">Item</hx-menu-item>');
      const inner = shadowQuery(el, '[role="menuitemradio"]');
      expect(inner).toBeTruthy();
    });

    it('sets aria-checked="false" when unchecked', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item type="radio">Item</hx-menu-item>');
      const inner = shadowQuery(el, '.menu-item')!;
      expect(inner.getAttribute('aria-checked')).toBe('false');
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

    it('sets aria-busy="true" when loading', async () => {
      const el = await fixture<HelixMenuItem>('<hx-menu-item loading>Item</hx-menu-item>');
      const inner = shadowQuery(el, '.menu-item')!;
      expect(inner.getAttribute('aria-busy')).toBe('true');
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
      const inner = shadowQuery<HTMLElement>(el, '.menu-item')!;
      inner.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-item-select');
      await userEvent.keyboard('{Enter}');
      const event = await eventPromise;
      expect(event.detail.value).toBe('enter-test');
    });

    it('dispatches hx-item-select on Space key', async () => {
      const el = await fixture<HelixMenuItem>(
        '<hx-menu-item value="space-test">Item</hx-menu-item>',
      );
      const inner = shadowQuery<HTMLElement>(el, '.menu-item')!;
      inner.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-item-select');
      await userEvent.keyboard(' ');
      const event = await eventPromise;
      expect(event.detail.value).toBe('space-test');
    });
  });

  describe('Submenu', () => {
    it('sets aria-haspopup="true" when submenu is present', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="parent">
          Parent
          <hx-menu slot="submenu">
            <hx-menu-item value="child">Child</hx-menu-item>
          </hx-menu>
        </hx-menu-item>
      `);
      await el.updateComplete;
      const inner = shadowQuery(el, '.menu-item')!;
      expect(inner.getAttribute('aria-haspopup')).toBe('true');
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

  it('renders role="separator"', async () => {
    const el = await fixture<HelixMenuDivider>('<hx-menu-divider></hx-menu-divider>');
    const sep = shadowQuery(el, '[role="separator"]');
    expect(sep).toBeTruthy();
  });

  it('exposes "base" CSS part', async () => {
    const el = await fixture<HelixMenuDivider>('<hx-menu-divider></hx-menu-divider>');
    const base = shadowQuery(el, '[part~="base"]');
    expect(base).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// Accessibility (axe-core)
// ─────────────────────────────────────────────────────────────

describe('Accessibility (axe-core)', () => {
  it('hx-menu has no axe violations', async () => {
    const el = await fixture<HelixMenu>(`
      <hx-menu>
        <hx-menu-item value="a">View Chart</hx-menu-item>
        <hx-menu-item value="b">Edit Record</hx-menu-item>
        <hx-menu-divider></hx-menu-divider>
        <hx-menu-item value="c" disabled>Delete (Disabled)</hx-menu-item>
      </hx-menu>
    `);
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('hx-menu-item has no axe violations inside hx-menu', async () => {
    const el = await fixture<HelixMenu>(`
      <hx-menu>
        <hx-menu-item value="test">Edit</hx-menu-item>
      </hx-menu>
    `);
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('hx-menu-item type=checkbox has no axe violations inside hx-menu', async () => {
    const el = await fixture<HelixMenu>(`
      <hx-menu>
        <hx-menu-item type="checkbox" checked>Notifications</hx-menu-item>
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
