import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTopNav } from './hx-top-nav.js';
import './index.js';

afterEach(cleanup);

describe('hx-top-nav', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a <header> landmark wrapper', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const header = shadowQuery(el, '[part="header"]');
      expect(header).toBeTruthy();
      expect(header?.tagName.toLowerCase()).toBe('header');
    });

    it('exposes "nav" CSS part on <nav> element inside header', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const nav = shadowQuery(el, '[part="nav"]');
      expect(nav).toBeTruthy();
      expect(nav?.tagName.toLowerCase()).toBe('nav');
    });

    it('renders with default label "Site Navigation"', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const nav = shadowQuery(el, '[part="nav"]')!;
      expect(nav.getAttribute('aria-label')).toBe('Site Navigation');
    });
  });

  // ─── Property: sticky (2) ───

  describe('Property: sticky', () => {
    it('does not have sticky attribute by default', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      expect(el.hasAttribute('sticky')).toBe(false);
    });

    it('reflects sticky attribute to host element', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav sticky></hx-top-nav>');
      expect(el.hasAttribute('sticky')).toBe(true);
      expect(el.sticky).toBe(true);
    });
  });

  // ─── Property: label (2) ───

  describe('Property: label', () => {
    it('defaults to "Site Navigation"', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      expect(el.label).toBe('Site Navigation');
    });

    it('applies label to aria-label on nav', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav label="Primary Navigation"></hx-top-nav>');
      const nav = shadowQuery(el, '[part="nav"]')!;
      expect(nav.getAttribute('aria-label')).toBe('Primary Navigation');
    });
  });

  // ─── CSS Parts (6) ───

  describe('CSS Parts', () => {
    it('header part exposed', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const header = shadowQuery(el, '[part="header"]');
      expect(header).toBeTruthy();
    });

    it('nav part exposed', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const nav = shadowQuery(el, '[part="nav"]');
      expect(nav).toBeTruthy();
    });

    it('logo part exposed', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const logo = shadowQuery(el, '[part="logo"]');
      expect(logo).toBeTruthy();
    });

    it('menu part exposed', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const menu = shadowQuery(el, '[part="menu"]');
      expect(menu).toBeTruthy();
    });

    it('actions part exposed', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const actions = shadowQuery(el, '[part="actions"]');
      expect(actions).toBeTruthy();
    });

    it('mobile-toggle part exposed', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const toggle = shadowQuery(el, '[part="mobile-toggle"]');
      expect(toggle).toBeTruthy();
    });
  });

  // ─── Mobile Toggle (3) ───

  describe('Mobile Toggle', () => {
    it('mobile toggle button exists', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const btn = shadowQuery(el, '[part="mobile-toggle"]');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
    });

    it('clicking toggle dispatches hx-mobile-toggle event', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const btn = shadowQuery(el, '[part="mobile-toggle"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-mobile-toggle');
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-mobile-toggle detail.open is true after first click, false after second click', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const btn = shadowQuery(el, '[part="mobile-toggle"]')!;

      const firstEventPromise = oneEvent<CustomEvent>(el, 'hx-mobile-toggle');
      btn.click();
      const firstEvent = await firstEventPromise;
      expect(firstEvent.detail.open).toBe(true);

      const secondEventPromise = oneEvent<CustomEvent>(el, 'hx-mobile-toggle');
      btn.click();
      const secondEvent = await secondEventPromise;
      expect(secondEvent.detail.open).toBe(false);
    });
  });

  // ─── Keyboard Navigation (4) ───

  describe('Keyboard Navigation', () => {
    it('pressing Escape closes the mobile menu and dispatches hx-mobile-toggle with open: false', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav><a href="/home">Home</a></hx-top-nav>');
      const btn = shadowQuery(el, '[part="mobile-toggle"]')! as HTMLButtonElement;

      // Open the menu
      btn.click();
      await el.updateComplete;
      expect(btn.getAttribute('aria-expanded')).toBe('true');

      // Listen for close event, then press Escape
      const closeEventPromise = oneEvent<CustomEvent>(el, 'hx-mobile-toggle');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;

      expect(btn.getAttribute('aria-expanded')).toBe('false');

      const closeEvent = await closeEventPromise;
      expect(closeEvent.detail.open).toBe(false);
    });

    it('pressing Escape when menu is closed does nothing', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav><a href="/home">Home</a></hx-top-nav>');
      const btn = shadowQuery(el, '[part="mobile-toggle"]')! as HTMLButtonElement;

      expect(btn.getAttribute('aria-expanded')).toBe('false');

      // Escape on closed menu should be a no-op
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;

      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });

    it('aria-expanded attribute reflects current open state as string', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const btn = shadowQuery(el, '[part="mobile-toggle"]')! as HTMLButtonElement;

      expect(btn.getAttribute('aria-expanded')).toBe('false');

      btn.click();
      await el.updateComplete;

      expect(btn.getAttribute('aria-expanded')).toBe('true');

      btn.click();
      await el.updateComplete;

      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });

    it('toggle button has aria-controls pointing to nav-menu', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav></hx-top-nav>');
      const btn = shadowQuery(el, '[part="mobile-toggle"]')!;
      const collapsible = shadowQuery(el, '#nav-menu');

      expect(btn.getAttribute('aria-controls')).toBe('nav-menu');
      expect(collapsible).toBeTruthy();
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('logo slot renders content', async () => {
      const el = await fixture<HelixTopNav>(
        '<hx-top-nav><img slot="logo" src="logo.png" alt="Brand" /></hx-top-nav>',
      );
      const logo = el.querySelector('[slot="logo"]');
      expect(logo).toBeTruthy();
      expect(logo?.tagName.toLowerCase()).toBe('img');
    });

    it('default slot renders content', async () => {
      const el = await fixture<HelixTopNav>('<hx-top-nav><a href="/home">Home</a></hx-top-nav>');
      const link = el.querySelector('a');
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe('Home');
    });

    it('actions slot renders content', async () => {
      const el = await fixture<HelixTopNav>(
        '<hx-top-nav><button slot="actions">Sign In</button></hx-top-nav>',
      );
      const action = el.querySelector('[slot="actions"]');
      expect(action).toBeTruthy();
      expect(action?.textContent).toBe('Sign In');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state with bare link content', async () => {
      const el = await fixture<HelixTopNav>(
        '<hx-top-nav><a href="/home">Home</a><a href="/about">About</a><button slot="actions">Sign In</button></hx-top-nav>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with sticky enabled', async () => {
      const el = await fixture<HelixTopNav>(
        '<hx-top-nav sticky><a href="/home">Home</a><button slot="actions">Sign In</button></hx-top-nav>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when mobile menu is open', async () => {
      // Provide explicit color to avoid browser-default link color contrast failures
      const el = await fixture<HelixTopNav>(
        '<hx-top-nav><a href="/home" style="color:#212529;">Home</a><a href="/about" style="color:#212529;">About</a></hx-top-nav>',
      );
      const btn = shadowQuery(el, '[part="mobile-toggle"]')! as HTMLButtonElement;
      btn.click();
      await el.updateComplete;
      // Wait for the 150ms open animation to complete before axe checks contrast
      await new Promise((r) => setTimeout(r, 200));

      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
