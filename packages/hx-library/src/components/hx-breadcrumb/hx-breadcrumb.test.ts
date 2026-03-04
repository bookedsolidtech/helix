import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixBreadcrumb } from './hx-breadcrumb.js';
import type { HelixBreadcrumbItem } from './hx-breadcrumb-item.js';
import './index.js';

afterEach(cleanup);

describe('hx-breadcrumb', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a nav landmark element', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      const nav = shadowQuery(el, 'nav');
      expect(nav).toBeInstanceOf(HTMLElement);
    });

    it('exposes "nav" CSS part', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      expect(shadowQuery(el, '[part="nav"]')).toBeTruthy();
    });

    it('exposes "list" CSS part', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      expect(shadowQuery(el, '[part="list"]')).toBeTruthy();
    });

    it('renders a list container element with role="list"', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      const list = shadowQuery(el, '[role="list"]');
      expect(list).toBeInstanceOf(HTMLElement);
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('sets aria-label on nav from label property', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb label="Page navigation">
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Page navigation');
    });

    it('defaults aria-label to "Breadcrumb"', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb');
    });

    it('updates aria-label when label property changes', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb label="Original">
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      el.label = 'Updated';
      await el.updateComplete;
      const nav = shadowQuery(el, 'nav');
      expect(nav?.getAttribute('aria-label')).toBe('Updated');
    });
  });

  // ─── Property: separator (3) ───

  describe('Property: separator', () => {
    it('defaults separator to "/"', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      expect(el.separator).toBe('/');
    });

    it('updates CSS custom property when separator changes', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb separator="/">
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      el.separator = '>';
      await el.updateComplete;
      const propValue = el.style.getPropertyValue('--hx-breadcrumb-separator-content');
      expect(propValue).toBe('">"');
    });

    it('accepts custom separator via attribute', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb separator="›">
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      expect(el.separator).toBe('›');
    });
  });

  // ─── Slot & Item Management (5) ───

  describe('Slot & Item Management', () => {
    it('sets aria-current="page" on the last item', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/dept">Department</hx-breadcrumb-item>
          <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item'));
      expect(items[2]?.getAttribute('aria-current')).toBe('page');
    });

    it('does not set aria-current on non-last items', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/dept">Department</hx-breadcrumb-item>
          <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item'));
      expect(items[0]?.hasAttribute('aria-current')).toBe(false);
      expect(items[1]?.hasAttribute('aria-current')).toBe(false);
    });

    it('sets data-bc-last on the last item', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item'));
      expect(items[1]?.hasAttribute('data-bc-last')).toBe(true);
    });

    it('does not set data-bc-last on non-last items', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item'));
      expect(items[0]?.hasAttribute('data-bc-last')).toBe(false);
    });

    it('single item receives aria-current="page" and data-bc-last', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item>Only Item</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const item = el.querySelector('hx-breadcrumb-item');
      expect(item?.getAttribute('aria-current')).toBe('page');
      expect(item?.hasAttribute('data-bc-last')).toBe(true);
    });
  });

  // ─── hx-breadcrumb-item: Rendering (6) ───

  describe('hx-breadcrumb-item: Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders an anchor when href is provided', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      const link = shadowQuery(el, '[part="link"]');
      expect(link).toBeInstanceOf(HTMLAnchorElement);
    });

    it('renders a span when no href is provided', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item>Current Page</hx-breadcrumb-item>',
      );
      const text = shadowQuery(el, '[part="text"]');
      expect(text).toBeInstanceOf(HTMLSpanElement);
    });

    it('anchor href matches the href property', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/about">About</hx-breadcrumb-item>',
      );
      const link = shadowQuery<HTMLAnchorElement>(el, '[part="link"]');
      expect(link?.getAttribute('href')).toBe('/about');
    });

    it('exposes "link" CSS part on anchor', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      expect(shadowQuery(el, '[part="link"]')).toBeTruthy();
    });

    it('exposes "text" CSS part on span when no href', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item>Current</hx-breadcrumb-item>',
      );
      expect(shadowQuery(el, '[part="text"]')).toBeTruthy();
    });
  });

  // ─── hx-breadcrumb-item: Separator (4) ───

  describe('hx-breadcrumb-item: Separator', () => {
    it('renders separator span when data-bc-last is false', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      const separator = shadowQuery(el, '.separator');
      expect(separator).toBeTruthy();
    });

    it('does not render separator span when data-bc-last is set', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item data-bc-last>Current</hx-breadcrumb-item>',
      );
      const separator = shadowQuery(el, '.separator');
      expect(separator).toBeNull();
    });

    it('separator has aria-hidden="true"', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      const separator = shadowQuery(el, '.separator');
      expect(separator?.getAttribute('aria-hidden')).toBe('true');
    });

    it('separator is removed when dataBcLast property is set to true', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      el.dataBcLast = true;
      await el.updateComplete;
      const separator = shadowQuery(el, '.separator');
      expect(separator).toBeNull();
    });
  });

  // ─── hx-breadcrumb-item: Properties (3) ───

  describe('hx-breadcrumb-item: Properties', () => {
    it('href reflects to host attribute', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      expect(el.getAttribute('href')).toBe('/home');
    });

    it('data-bc-last reflects to host attribute', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item data-bc-last>Current</hx-breadcrumb-item>',
      );
      expect(el.hasAttribute('data-bc-last')).toBe(true);
    });

    it('switching href from value to undefined renders span instead of anchor', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      el.href = undefined;
      await el.updateComplete;
      expect(shadowQuery(el, '[part="link"]')).toBeNull();
      expect(shadowQuery(el, '[part="text"]')).toBeTruthy();
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders text content', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      expect(el.textContent?.trim()).toBe('Home');
    });

    it('default slot renders HTML content', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home"><strong>Home</strong></hx-breadcrumb-item>',
      );
      const strong = el.querySelector('strong');
      expect(strong).toBeTruthy();
      expect(strong?.textContent).toBe('Home');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb label="Page navigation">
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/department">Department</hx-breadcrumb-item>
          <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for single item', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb label="Page navigation">
          <hx-breadcrumb-item>Home</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with custom separator', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb label="Page navigation" separator=">">
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
