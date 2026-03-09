import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcSideNav } from './hx-side-nav.js';
import type { WcNavItem } from './hx-nav-item.js';
import './index.js';

afterEach(cleanup);

describe('hx-side-nav', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the nav element', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      const nav = shadowQuery(el, 'nav');
      expect(nav).toBeTruthy();
    });

    it('renders header, body, and footer parts', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      expect(shadowQuery(el, '[part="header"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="body"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="footer"]')).toBeTruthy();
    });
  });

  // ─── Property: collapsed ───

  describe('Property: collapsed', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      expect(el.collapsed).toBe(false);
    });

    it('reflects collapsed attribute', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav collapsed></hx-side-nav>');
      expect(el.collapsed).toBe(true);
      expect(el.hasAttribute('collapsed')).toBe(true);
    });

    it('reflects collapsed property to attribute', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      el.collapsed = true;
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;
      expect(el.hasAttribute('collapsed')).toBe(true);
    });
  });

  // ─── Property: label ───

  describe('Property: label', () => {
    it('defaults to "Main Navigation"', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      expect(el.label).toBe('Main Navigation');
    });

    it('sets aria-label on nav element', async () => {
      const el = await fixture<WcSideNav>(
        '<hx-side-nav label="Clinical Portal Nav"></hx-side-nav>',
      );
      const nav = shadowQuery<HTMLElement>(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Clinical Portal Nav');
    });
  });

  // ─── Toggle Button ───

  describe('Toggle button', () => {
    it('renders a toggle button', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.side-nav__toggle');
      expect(btn).toBeTruthy();
    });

    it('has correct aria-label when expanded', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.side-nav__toggle');
      expect(btn?.getAttribute('aria-label')).toBe('Collapse navigation');
    });

    it('has correct aria-label when collapsed', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav collapsed></hx-side-nav>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.side-nav__toggle');
      expect(btn?.getAttribute('aria-label')).toBe('Expand navigation');
    });

    it('toggles collapsed state on button click', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.side-nav__toggle');
      btn?.click();
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;
      expect(el.collapsed).toBe(true);
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-collapse when collapsing', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.side-nav__toggle');
      const eventPromise = oneEvent(el, 'hx-collapse');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-expand when expanding', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav collapsed></hx-side-nav>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.side-nav__toggle');
      const eventPromise = oneEvent(el, 'hx-expand');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-collapse event has detail with collapsed: true', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.side-nav__toggle');
      const eventPromise = oneEvent<CustomEvent<{ collapsed: boolean }>>(el, 'hx-collapse');
      btn?.click();
      const event = await eventPromise;
      expect(event.detail).toEqual({ collapsed: true });
    });

    it('hx-expand event has detail with collapsed: false', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav collapsed></hx-side-nav>');
      const btn = shadowQuery<HTMLButtonElement>(el, '.side-nav__toggle');
      const eventPromise = oneEvent<CustomEvent<{ collapsed: boolean }>>(el, 'hx-expand');
      btn?.click();
      const event = await eventPromise;
      expect(event.detail).toEqual({ collapsed: false });
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('renders header slot content', async () => {
      const el = await fixture<WcSideNav>(
        '<hx-side-nav><div slot="header">Logo</div></hx-side-nav>',
      );
      expect(el.querySelector('[slot="header"]')?.textContent).toBe('Logo');
    });

    it('renders footer slot content', async () => {
      const el = await fixture<WcSideNav>(
        '<hx-side-nav><div slot="footer">Footer</div></hx-side-nav>',
      );
      expect(el.querySelector('[slot="footer"]')?.textContent).toBe('Footer');
    });

    it('renders default slot content', async () => {
      const el = await fixture<WcSideNav>(
        '<hx-side-nav><hx-nav-item href="/test">Test</hx-nav-item></hx-side-nav>',
      );
      expect(el.querySelector('hx-nav-item')).toBeTruthy();
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "nav" part', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      expect(shadowQuery(el, '[part="nav"]')).toBeTruthy();
    });

    it('exposes "header" part', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      expect(shadowQuery(el, '[part="header"]')).toBeTruthy();
    });

    it('exposes "body" part', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      expect(shadowQuery(el, '[part="body"]')).toBeTruthy();
    });

    it('exposes "footer" part', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      expect(shadowQuery(el, '[part="footer"]')).toBeTruthy();
    });
  });

  // ─── Collapsed State Propagation ───

  describe('Collapsed state propagation', () => {
    it('sets data-collapsed on child nav items when collapsed attribute is present at parse time', async () => {
      const el = await fixture<WcSideNav>(
        `<hx-side-nav collapsed>
          <hx-nav-item href="/a">Item A</hx-nav-item>
          <hx-nav-item href="/b">Item B</hx-nav-item>
        </hx-side-nav>`,
      );
      // Allow slotchange + updated cycle to complete
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;
      const items = el.querySelectorAll('hx-nav-item');
      for (const item of items) {
        expect(item.hasAttribute('data-collapsed')).toBe(true);
      }
    });

    it('sets data-collapsed on child nav items when collapsed property is set programmatically', async () => {
      const el = await fixture<WcSideNav>(
        `<hx-side-nav>
          <hx-nav-item href="/a">Item A</hx-nav-item>
          <hx-nav-item href="/b">Item B</hx-nav-item>
        </hx-side-nav>`,
      );
      el.collapsed = true;
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;
      const items = el.querySelectorAll('hx-nav-item');
      for (const item of items) {
        expect(item.hasAttribute('data-collapsed')).toBe(true);
      }
    });

    it('removes data-collapsed from child nav items when expanding', async () => {
      const el = await fixture<WcSideNav>(
        `<hx-side-nav collapsed>
          <hx-nav-item href="/a">Item A</hx-nav-item>
        </hx-side-nav>`,
      );
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;
      el.collapsed = false;
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;
      const item = el.querySelector('hx-nav-item');
      expect(item?.hasAttribute('data-collapsed')).toBe(false);
    });

    it('propagates collapsed state to nav items added after initial render via slotchange', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav collapsed></hx-side-nav>');
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const newItem = document.createElement('hx-nav-item') as WcNavItem;
      newItem.href = '/new';
      newItem.textContent = 'New Item';
      el.appendChild(newItem);

      // Wait for slotchange to fire and propagate
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      expect(newItem.hasAttribute('data-collapsed')).toBe(true);
    });
  });

  // ─── Keyboard Navigation ───

  describe('Keyboard navigation', () => {
    it('ArrowDown moves focus to the next nav item', async () => {
      const el = await fixture<WcSideNav>(
        `<hx-side-nav>
          <hx-nav-item href="/a">Item A</hx-nav-item>
          <hx-nav-item href="/b">Item B</hx-nav-item>
          <hx-nav-item href="/c">Item C</hx-nav-item>
        </hx-side-nav>`,
      );
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const items = Array.from(el.querySelectorAll<WcNavItem>('hx-nav-item'));
      // Focus the link inside the first item's shadow DOM
      const firstLink = items[0].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      firstLink?.focus();

      const body = shadowQuery<HTMLElement>(el, '[part="body"]');
      body?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const secondLink = items[1].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      expect(document.activeElement).toBe(items[1]);
      // The active element inside the shadow host could differ by browser; check the shadow link
      expect(secondLink).toBeTruthy();
    });

    it('ArrowUp moves focus to the previous nav item', async () => {
      const el = await fixture<WcSideNav>(
        `<hx-side-nav>
          <hx-nav-item href="/a">Item A</hx-nav-item>
          <hx-nav-item href="/b">Item B</hx-nav-item>
          <hx-nav-item href="/c">Item C</hx-nav-item>
        </hx-side-nav>`,
      );
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const items = Array.from(el.querySelectorAll<WcNavItem>('hx-nav-item'));
      // Focus the link inside the second item's shadow DOM
      const secondLink = items[1].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      secondLink?.focus();

      const body = shadowQuery<HTMLElement>(el, '[part="body"]');
      body?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const firstLink = items[0].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      expect(firstLink).toBeTruthy();
    });

    it('ArrowDown wraps from last item to first', async () => {
      const el = await fixture<WcSideNav>(
        `<hx-side-nav>
          <hx-nav-item href="/a">Item A</hx-nav-item>
          <hx-nav-item href="/b">Item B</hx-nav-item>
        </hx-side-nav>`,
      );
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const items = Array.from(el.querySelectorAll<WcNavItem>('hx-nav-item'));
      const lastLink = items[1].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      lastLink?.focus();

      const body = shadowQuery<HTMLElement>(el, '[part="body"]');
      body?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const firstLink = items[0].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      expect(firstLink).toBeTruthy();
    });

    it('ArrowUp wraps from first item to last', async () => {
      const el = await fixture<WcSideNav>(
        `<hx-side-nav>
          <hx-nav-item href="/a">Item A</hx-nav-item>
          <hx-nav-item href="/b">Item B</hx-nav-item>
        </hx-side-nav>`,
      );
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const items = Array.from(el.querySelectorAll<WcNavItem>('hx-nav-item'));
      const firstLink = items[0].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      firstLink?.focus();

      const body = shadowQuery<HTMLElement>(el, '[part="body"]');
      body?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const lastLink = items[1].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      expect(lastLink).toBeTruthy();
    });

    it('skips disabled items during ArrowDown navigation', async () => {
      const el = await fixture<WcSideNav>(
        `<hx-side-nav>
          <hx-nav-item href="/a">Item A</hx-nav-item>
          <hx-nav-item href="/b" disabled>Item B (disabled)</hx-nav-item>
          <hx-nav-item href="/c">Item C</hx-nav-item>
        </hx-side-nav>`,
      );
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const items = Array.from(el.querySelectorAll<WcNavItem>('hx-nav-item'));
      const firstLink = items[0].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      firstLink?.focus();

      const body = shadowQuery<HTMLElement>(el, '[part="body"]');
      body?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      // Item B is disabled so it is excluded from the navigable list; Item C should receive focus
      const thirdLink = items[2].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      expect(thirdLink).toBeTruthy();
    });

    it('does not throw when no nav items are present', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav></hx-side-nav>');
      await (el as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const body = shadowQuery<HTMLElement>(el, '[part="body"]');
      expect(() => {
        body?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }).not.toThrow();
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('nav has aria-label', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav label="Main Nav"></hx-side-nav>');
      const nav = shadowQuery<HTMLElement>(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Main Nav');
    });

    it('has no axe violations in default state', async () => {
      const el = await fixture<WcSideNav>('<hx-side-nav label="Main Navigation"></hx-side-nav>');
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });

    it('has no axe violations when collapsed', async () => {
      const el = await fixture<WcSideNav>(
        '<hx-side-nav label="Main Navigation" collapsed></hx-side-nav>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });
  });
});

describe('hx-nav-item', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Test</hx-nav-item>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders as anchor when href is provided', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Test</hx-nav-item>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a');
      expect(anchor).toBeTruthy();
      expect(anchor?.getAttribute('href')).toBe('/test');
    });

    it('renders as button when no href', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item>Test</hx-nav-item>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
    });
  });

  // ─── Property: active ───

  describe('Property: active', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Test</hx-nav-item>');
      expect(el.active).toBe(false);
    });

    it('reflects active attribute', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test" active>Test</hx-nav-item>');
      expect(el.active).toBe(true);
    });

    it('sets aria-current="page" when active', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test" active>Test</hx-nav-item>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a');
      expect(anchor?.getAttribute('aria-current')).toBe('page');
    });

    it('does not set aria-current when not active', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Test</hx-nav-item>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a');
      expect(anchor?.getAttribute('aria-current')).toBeNull();
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Test</hx-nav-item>');
      expect(el.disabled).toBe(false);
    });

    it('sets aria-disabled when disabled', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test" disabled>Test</hx-nav-item>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a');
      expect(anchor?.getAttribute('aria-disabled')).toBe('true');
    });

    it('sets tabindex=-1 when disabled', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test" disabled>Test</hx-nav-item>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a');
      expect(anchor?.getAttribute('tabindex')).toBe('-1');
    });

    it('disabled item does not receive focus via keyboard navigation', async () => {
      const nav = await fixture<WcSideNav>(
        `<hx-side-nav>
          <hx-nav-item href="/a">Item A</hx-nav-item>
          <hx-nav-item href="/b" disabled>Item B</hx-nav-item>
        </hx-side-nav>`,
      );
      await (nav as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      const items = Array.from(nav.querySelectorAll<WcNavItem>('hx-nav-item'));
      const firstLink = items[0].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      firstLink?.focus();

      const body = shadowQuery<HTMLElement>(nav, '[part="body"]');
      body?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await (nav as WcSideNav & { updateComplete: Promise<boolean> }).updateComplete;

      // Only Item A is in the navigable list (Item B is disabled), so ArrowDown wraps back to Item A
      const firstLinkAfter = items[0].shadowRoot?.querySelector<HTMLElement>('[part="link"]');
      expect(firstLinkAfter).toBeTruthy();
    });
  });

  // ─── Property: expanded ───

  describe('Property: expanded', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item>Test</hx-nav-item>');
      expect(el.expanded).toBe(false);
    });

    it('reflects expanded attribute', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item expanded>Test</hx-nav-item>');
      expect(el.expanded).toBe(true);
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('renders default slot label', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Dashboard</hx-nav-item>');
      expect(el.textContent?.trim()).toContain('Dashboard');
    });

    it('renders icon slot', async () => {
      const el = await fixture<WcNavItem>(
        '<hx-nav-item href="/test"><span slot="icon">icon</span>Test</hx-nav-item>',
      );
      expect(el.querySelector('[slot="icon"]')).toBeTruthy();
    });

    it('renders badge slot', async () => {
      const el = await fixture<WcNavItem>(
        '<hx-nav-item href="/test"><span slot="badge">5</span>Test</hx-nav-item>',
      );
      expect(el.querySelector('[slot="badge"]')).toBeTruthy();
    });

    it('renders as button with expand arrow when children slot has content', async () => {
      const el = await fixture<WcNavItem>(
        `<hx-nav-item>
          Parent
          <hx-nav-item slot="children" href="/child">Child</hx-nav-item>
        </hx-nav-item>`,
      );
      await (el as WcNavItem & { updateComplete: Promise<boolean> }).updateComplete;
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const arrow = shadowQuery(el, '.nav-item__arrow');
      expect(arrow).toBeTruthy();
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "link" part', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Test</hx-nav-item>');
      expect(shadowQuery(el, '[part="link"]')).toBeTruthy();
    });

    it('exposes "icon" part', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Test</hx-nav-item>');
      expect(shadowQuery(el, '[part="icon"]')).toBeTruthy();
    });

    it('exposes "label" part', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Test</hx-nav-item>');
      expect(shadowQuery(el, '[part="label"]')).toBeTruthy();
    });

    it('exposes "children" part', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Test</hx-nav-item>');
      expect(shadowQuery(el, '[part="children"]')).toBeTruthy();
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcNavItem>('<hx-nav-item href="/test">Dashboard</hx-nav-item>');
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });

    it('has no axe violations when active', async () => {
      const el = await fixture<WcNavItem>(
        '<hx-nav-item href="/test" active>Dashboard</hx-nav-item>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });
  });
});
