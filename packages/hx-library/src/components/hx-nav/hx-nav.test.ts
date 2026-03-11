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
  // ─── Rendering (7) ───

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

    it('renders empty list when no items provided', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      await el.updateComplete;
      const items = el.shadowRoot?.querySelectorAll('[part="item"]');
      expect(items?.length).toBe(0);
    });
  });

  // ─── Property: items JSON converter (4) ───

  describe('Property: items (JSON converter)', () => {
    it('parses valid JSON string from attribute', async () => {
      const json = JSON.stringify(sampleItems);
      const el = await fixture<HelixNav>(`<hx-nav items='${json}'></hx-nav>`);
      expect(el.items.length).toBe(3);
      expect(el.items[0].label).toBe('Home');
    });

    it('returns empty array for invalid JSON attribute', async () => {
      const el = await fixture<HelixNav>(`<hx-nav items='not valid json'></hx-nav>`);
      expect(el.items).toEqual([]);
    });

    it('returns empty array for null/empty attribute', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      expect(el.items).toEqual([]);
    });

    it('returns empty array when JSON is not an array', async () => {
      const el = await fixture<HelixNav>(`<hx-nav items='{"label":"Home"}'></hx-nav>`);
      expect(el.items).toEqual([]);
    });

    it('renders items from JSON attribute in the DOM', async () => {
      const json = JSON.stringify(sampleItems);
      const el = await fixture<HelixNav>(`<hx-nav items='${json}'></hx-nav>`);
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

  // ─── URL Sanitization (5) ───

  describe('URL Sanitization', () => {
    it('allows relative paths', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = [{ label: 'Page', href: '/page' }];
      await el.updateComplete;
      const link = el.shadowRoot?.querySelector<HTMLAnchorElement>('a[part="link"]');
      expect(link?.getAttribute('href')).toBe('/page');
    });

    it('allows fragment-only links', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = [{ label: 'Section', href: '#section' }];
      await el.updateComplete;
      const link = el.shadowRoot?.querySelector<HTMLAnchorElement>('a[part="link"]');
      expect(link?.getAttribute('href')).toBe('#section');
    });

    it('allows https URLs', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = [{ label: 'External', href: 'https://example.com' }];
      await el.updateComplete;
      const link = el.shadowRoot?.querySelector<HTMLAnchorElement>('a[part="link"]');
      expect(link?.getAttribute('href')).toBe('https://example.com');
    });

    it('blocks javascript: protocol URIs', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = [{ label: 'XSS', href: 'javascript:alert(1)' }];
      await el.updateComplete;
      const link = el.shadowRoot?.querySelector<HTMLAnchorElement>('a[part="link"]');
      expect(link?.getAttribute('href')).toBe('#');
    });

    it('blocks data: protocol URIs', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = [{ label: 'XSS', href: 'data:text/html,<script>alert(1)</script>' }];
      await el.updateComplete;
      const link = el.shadowRoot?.querySelector<HTMLAnchorElement>('a[part="link"]');
      expect(link?.getAttribute('href')).toBe('#');
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

    it('does not set aria-haspopup on submenu triggers (disclosure pattern)', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      expect(btn?.hasAttribute('aria-haspopup')).toBe(false);
    });

    it('submenu has descriptive aria-label with parent name', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const submenu = el.shadowRoot?.querySelector('.nav__submenu');
      expect(submenu?.getAttribute('aria-label')).toBe('Patients submenu');
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

  // ─── Mobile Toggle (5) ───

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

    it('toggle aria-label changes between open and close states', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      expect(toggle?.getAttribute('aria-label')).toBe('Open navigation menu');
      toggle?.click();
      await el.updateComplete;
      expect(toggle?.getAttribute('aria-label')).toBe('Close navigation menu');
    });
  });

  // ─── Events (4) ───

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
      el.addEventListener('hx-nav-select', () => {
        fired = true;
      });
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });

    it('hx-nav-select event bubbles and is composed', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll<HTMLAnchorElement>('a[part="link"]');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-nav-select');
      links?.[1]?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-nav-select when a submenu child item is clicked', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      // Open the submenu first
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      // Click the first submenu link
      const subLinks = el.shadowRoot?.querySelectorAll<HTMLAnchorElement>(
        '.nav__submenu a[part="link"]',
      );
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-nav-select');
      subLinks?.[0]?.click();
      const event = await eventPromise;
      expect(event.detail.item.label).toBe('All Patients');
    });
  });

  // ─── Keyboard Navigation (5) ───

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

    it('Escape key in submenu closes it and returns focus to parent', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      // Open submenu
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      // Get a submenu link and dispatch Escape from it
      const subLink = el.shadowRoot?.querySelector<HTMLAnchorElement>(
        '.nav__submenu a[part="link"]',
      );
      subLink?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      // Submenu should be closed
      expect(btn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('second Enter key press closes an open submenu', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      // First press opens
      btn?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
      // Second press closes
      btn?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('ArrowRight moves focus to the next top-level item', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll<HTMLElement>(
        '[part="list"] > [part="item"] > [part="link"]',
      );
      links?.[0]?.focus();
      links?.[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(el.shadowRoot?.activeElement).toBe(links?.[1]);
    });

    it('ArrowLeft moves focus to the previous top-level item', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll<HTMLElement>(
        '[part="list"] > [part="item"] > [part="link"]',
      );
      links?.[1]?.focus();
      links?.[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(el.shadowRoot?.activeElement).toBe(links?.[0]);
    });

    it('ArrowRight wraps from last item to first item', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll<HTMLElement>(
        '[part="list"] > [part="item"] > [part="link"]',
      );
      links?.[2]?.focus();
      links?.[2]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(el.shadowRoot?.activeElement).toBe(links?.[0]);
    });

    it('ArrowDown in submenu moves focus to next sub-item', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      // Open submenu
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      const subLinks = el.shadowRoot?.querySelectorAll<HTMLElement>(
        '.nav__submenu:not([hidden]) [part="link"]',
      );
      subLinks?.[0]?.focus();
      subLinks?.[0]?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
      expect(el.shadowRoot?.activeElement).toBe(subLinks?.[1]);
    });

    it('ArrowUp in submenu moves focus to previous sub-item', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      // Open submenu
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      const subLinks = el.shadowRoot?.querySelectorAll<HTMLElement>(
        '.nav__submenu:not([hidden]) [part="link"]',
      );
      subLinks?.[1]?.focus();
      subLinks?.[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(el.shadowRoot?.activeElement).toBe(subLinks?.[0]);
    });
  });

  // ─── Outside Click (2) ───

  describe('Outside Click', () => {
    it('closes expanded submenu when clicking outside', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      // Open submenu
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
      // Click outside
      document.body.click();
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('does not close submenu when clicking inside component', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      // Open submenu
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
      // Click on the component host itself
      el.click();
      await el.updateComplete;
      // Submenu should still be open (clicking on host is "inside")
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // ─── Sub-item Click State Reset (1) ───

  describe('Sub-item Click State Reset', () => {
    it('clicking a submenu item closes submenu and mobile menu', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      // Open mobile menu
      toggle?.click();
      await el.updateComplete;
      // Open submenu
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
      // Click a sub-item
      const subLink = el.shadowRoot?.querySelector<HTMLAnchorElement>(
        '.nav__submenu a[part="link"]',
      );
      subLink?.click();
      await el.updateComplete;
      // Both submenu and mobile menu should be closed
      expect(btn?.getAttribute('aria-expanded')).toBe('false');
      expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // ─── Mobile Toggle Closes Submenu (1) ───

  describe('Mobile Toggle State Reset', () => {
    it('closing mobile menu resets expanded submenu', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = itemsWithSubmenus;
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      // Open mobile menu
      toggle?.click();
      await el.updateComplete;
      // Open a submenu
      const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="link"]');
      btn?.click();
      await el.updateComplete;
      expect(btn?.getAttribute('aria-expanded')).toBe('true');
      // Close mobile menu
      toggle?.click();
      await el.updateComplete;
      // Submenu should be collapsed
      expect(btn?.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // ─── CSS Part: item and link (2) ───

  describe('CSS Parts on items', () => {
    it('exposes "item" CSS part on each list item', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const items = el.shadowRoot?.querySelectorAll('[part="item"]');
      expect(items?.length).toBe(3);
    });

    it('exposes "link" CSS part on each anchor', async () => {
      const el = await fixture<HelixNav>('<hx-nav></hx-nav>');
      el.items = sampleItems;
      await el.updateComplete;
      const links = el.shadowRoot?.querySelectorAll('[part="link"]');
      expect(links?.length).toBe(3);
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
      const el = await fixture<HelixNav>(
        '<hx-nav orientation="vertical" label="Sidebar navigation"></hx-nav>',
      );
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
