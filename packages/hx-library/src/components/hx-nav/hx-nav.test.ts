import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixNav } from './hx-nav.js';
import './index.js';

const sampleItems = [
  { label: 'Home', href: '/home', current: true },
  { label: 'Patients', href: '/patients' },
  { label: 'Reports', href: '/reports' },
];

const itemsWithSubmenus = [
  { label: 'Home', href: '/home', current: true },
  {
    label: 'Patients',
    children: [
      { label: 'All Patients', href: '/patients' },
      { label: 'New Intake', href: '/patients/new' },
    ],
  },
  { label: 'Reports', href: '/reports' },
];

afterEach(cleanup);

describe('hx-nav', () => {
  // ─── Rendering (6) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a nav landmark element', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      const nav = shadowQuery(el, 'nav');
      expect(nav).toBeInstanceOf(HTMLElement);
    });

    it('exposes "nav" CSS part', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      expect(shadowQuery(el, '[part="nav"]')).toBeTruthy();
    });

    it('exposes "list" CSS part', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      expect(shadowQuery(el, '[part="list"]')).toBeTruthy();
    });

    it('exposes "toggle" CSS part', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      expect(shadowQuery(el, '[part="toggle"]')).toBeTruthy();
    });

    it('renders items when items property is set', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const items = el.shadowRoot?.querySelectorAll('[part="item"]');
      expect(items?.length).toBe(3);
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('sets aria-label on nav from label property', async () => {
      const el = await fixture<HelixNav>('<hx-nav label="Site navigation"></hx-nav>');
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Site navigation');
    });

    it('defaults aria-label to "Main navigation"', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
    });

    it('updates aria-label when label property changes', async () => {
      const el = await fixture<HelixNav>('<hx-nav label="Original"></hx-nav>');
      el.label = 'Updated';
      await el.updateComplete;
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Updated');
    });
  });

  // ─── Property: orientation (3) ───

  describe('Property: orientation', () => {
    it('defaults orientation to "horizontal"', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      expect(el.orientation).toBe('horizontal');
    });

    it('reflects orientation attribute', async () => {
      const el = await fixture<HelixNav>('<hx-nav orientation="vertical"></hx-nav>');
      expect(el.orientation).toBe('vertical');
      expect(el.getAttribute('orientation')).toBe('vertical');
    });

    it('updates orientation when property changes', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.orientation = 'vertical';
      await el.updateComplete;
      expect(el.getAttribute('orientation')).toBe('vertical');
    });
  });

  // ─── Links and Active State (4) ───

  describe('Links and Active State', () => {
    it('renders anchor elements with href', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll<HTMLAnchorElement>('a[part="link"]');
      expect(links?.length).toBe(3);
      expect(links?.[0]?.getAttribute('href')).toBe('/home');
    });

    it('sets aria-current="page" on current item', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll<HTMLAnchorElement>('a[part="link"]');
      expect(links?.[0]?.getAttribute('aria-current')).toBe('page');
    });

    it('does not set aria-current on non-current items', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll<HTMLAnchorElement>('a[part="link"]');
      expect(links?.[1]?.hasAttribute('aria-current')).toBe(false);
      expect(links?.[2]?.hasAttribute('aria-current')).toBe(false);
    });

    it('applies active class to current item link', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll<HTMLAnchorElement>('a[part="link"]');
      expect(links?.[0]?.classList.contains('nav__link--active')).toBe(true);
    });
  });

  // ─── Submenus (6) ───

  describe('Submenus', () => {
    it('renders button for items with children', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      expect(btn).toBeTruthy();
      expect(btn?.textContent?.trim().startsWith('Patients')).toBe(true);
    });

    it('sets aria-haspopup="menu" on items with children', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      expect(btn?.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('sets aria-expanded="false" on collapsed submenu trigger', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      expect(btn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('toggles submenu on button click', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
    });

    it('submenu is hidden by default', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const submenu = el.shadowRoot?.querySelector('.nav__submenu');
      expect(submenu?.hasAttribute('hidden')).toBe(true);
    });

    it('submenu becomes visible after toggling', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      const submenu = el.shadowRoot?.querySelector('.nav__submenu');
      expect(submenu?.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── Mobile Toggle (4) ───

  describe('Mobile Toggle', () => {
    it('toggle button has aria-expanded="false" initially', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    });

    it('toggle button updates aria-expanded when clicked', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    });

    it('toggle button has aria-controls="nav-list"', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      expect(toggle?.getAttribute('aria-controls')).toBe('nav-list');
    });

    it('list has id="nav-list"', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      const list = shadowQuery(el, '[part="list"]');
      expect(list?.id).toBe('nav-list');
    });
  });

  // ─── Events (2) ───

  describe('Events', () => {
    it('dispatches hx-nav-select when a link is clicked', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll<HTMLAnchorElement>('a[part="link"]');
      const eventPromise = oneEvent(el, 'hx-nav-select');
      links?.[1]?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect((event as CustomEvent).detail.item.label).toBe('Patients');
    });

    it('does not dispatch hx-nav-select when submenu trigger is clicked', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      let fired = false;
      el.addEventListener('hx-nav-select', () => { fired = true; });
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard Navigation (3) ───

  describe('Keyboard Navigation', () => {
    it('Escape key closes an open submenu', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
      btn?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('Enter key toggles submenu visibility', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
    });

    it('Space key toggles submenu visibility', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // ─── Accessibility (axe-core) (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default horizontal state', async () => {
      const el = await fixture<HelixNav>('<hx-nav label="Main navigation"></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in vertical orientation', async () => {
      const el = await fixture<HelixNav>('<hx-nav orientation="vertical" label="Sidebar navigation"></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with open submenu', async () => {
      const el = await fixture<HelixNav>('<hx-nav label="Main navigation"></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
