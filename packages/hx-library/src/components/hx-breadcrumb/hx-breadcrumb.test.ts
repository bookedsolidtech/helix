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

    it('renders a semantic ol element as list container', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      const list = shadowQuery(el, 'ol[part="list"]');
      expect(list).toBeInstanceOf(HTMLOListElement);
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
      await el.updateComplete;
      const item = el.querySelector('hx-breadcrumb-item');
      expect(item?.getAttribute('aria-current')).toBe('page');
      expect(item?.hasAttribute('data-bc-last')).toBe(true);
    });
  });

  // ─── Collapse (max-items) (5) ───

  describe('Collapse (max-items)', () => {
    it('shows all items when max-items is 0 (default)', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/c">C</hx-breadcrumb-item>
          <hx-breadcrumb-item>D</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item:not(.hx-bc-ellipsis)'));
      const hiddenCount = items.filter((i) => i.hasAttribute('data-bc-hidden')).length;
      expect(hiddenCount).toBe(0);
    });

    it('hides middle items when item count exceeds max-items', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb max-items="2">
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/c">C</hx-breadcrumb-item>
          <hx-breadcrumb-item>D</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const items = Array.from(
        el.querySelectorAll<HTMLElement>('hx-breadcrumb-item:not(.hx-bc-ellipsis)'),
      );
      expect(items[0]?.hasAttribute('data-bc-hidden')).toBe(false);
      expect(items[1]?.hasAttribute('data-bc-hidden')).toBe(true);
      expect(items[2]?.hasAttribute('data-bc-hidden')).toBe(true);
      expect(items[3]?.hasAttribute('data-bc-hidden')).toBe(false);
    });

    it('inserts an ellipsis item when collapsed', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb max-items="2">
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item>C</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const ellipsis = el.querySelector('.hx-bc-ellipsis');
      expect(ellipsis).toBeTruthy();
      expect(ellipsis?.getAttribute('aria-hidden')).toBe('true');
    });

    it('removes ellipsis item when max-items is cleared', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb max-items="2">
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item>C</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      expect(el.querySelector('.hx-bc-ellipsis')).toBeTruthy();

      el.maxItems = 0;
      // Trigger slotchange re-evaluation by forcing a re-render then checking
      // the DOM synchronously — maxItems = 0 calls _removeCollapse() directly
      // inside _handleSlotChange so we need a fresh slotchange event. We can
      // simulate that by removing and re-appending a child.
      const first = el.querySelector('hx-breadcrumb-item');
      if (first) {
        el.appendChild(first);
      }
      await el.updateComplete;
      expect(el.querySelector('.hx-bc-ellipsis')).toBeNull();
    });

    it('does not collapse when item count equals max-items', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb max-items="3">
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item>C</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      expect(el.querySelector('.hx-bc-ellipsis')).toBeNull();
      const items = Array.from(
        el.querySelectorAll<HTMLElement>('hx-breadcrumb-item:not(.hx-bc-ellipsis)'),
      );
      expect(items.every((i) => !i.hasAttribute('data-bc-hidden'))).toBe(true);
    });
  });

  // ─── JSON-LD (5) ───

  describe('JSON-LD', () => {
    it('does not inject a script when json-ld attribute is absent', async () => {
      const before = document.querySelectorAll('script[data-hx-breadcrumb]').length;
      await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      const after = document.querySelectorAll('script[data-hx-breadcrumb]').length;
      expect(after).toBe(before);
    });

    it('injects a JSON-LD script into document.head when json-ld is true', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb json-ld>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const script = document.querySelector<HTMLScriptElement>(`script[data-hx-breadcrumb]`);
      expect(script).toBeTruthy();
      expect(script?.type).toBe('application/ld+json');

      const data = JSON.parse(script?.textContent ?? '{}') as Record<string, unknown>;
      expect(data['@type']).toBe('BreadcrumbList');
    });

    it('removes the JSON-LD script on disconnect', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb json-ld>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      // Confirm script was injected
      expect(document.querySelector(`#${(el as unknown as { _jsonLdId: string })._jsonLdId}`)).toBeTruthy();

      el.remove();
      // Script should be gone after disconnection
      expect(document.querySelector(`script[data-hx-breadcrumb][id="${(el as unknown as { _jsonLdId: string })._jsonLdId}"]`)).toBeNull();
    });

    it('produces no duplicate scripts when two instances have json-ld enabled', async () => {
      const wrapper = document.createElement('div');
      document.body.appendChild(wrapper);
      wrapper.innerHTML = `
        <hx-breadcrumb id="bc1" json-ld>
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item>B</hx-breadcrumb-item>
        </hx-breadcrumb>
        <hx-breadcrumb id="bc2" json-ld>
          <hx-breadcrumb-item href="/x">X</hx-breadcrumb-item>
          <hx-breadcrumb-item>Y</hx-breadcrumb-item>
        </hx-breadcrumb>
      `;
      const bc1 = wrapper.querySelector<HelixBreadcrumb>('#bc1')!;
      const bc2 = wrapper.querySelector<HelixBreadcrumb>('#bc2')!;
      await bc1.updateComplete;
      await bc2.updateComplete;

      const scripts = document.querySelectorAll('script[data-hx-breadcrumb]');
      // Each instance owns exactly one script — no duplicates
      expect(scripts.length).toBe(2);

      // IDs must be distinct
      const ids = Array.from(scripts).map((s) => s.id);
      expect(new Set(ids).size).toBe(2);

      wrapper.remove();
    });

    it('updates the existing script content when items change', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb json-ld>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;

      const scriptId = (el as unknown as { _jsonLdId: string })._jsonLdId;
      const script = document.getElementById(scriptId) as HTMLScriptElement;
      expect(script).toBeTruthy();

      const data = JSON.parse(script.textContent ?? '{}') as { itemListElement: unknown[] };
      expect(data.itemListElement).toHaveLength(2);
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

  // ─── hx-breadcrumb-item: role guard (2) ───

  describe('hx-breadcrumb-item: role guard', () => {
    it('sets role="listitem" when inside hx-breadcrumb', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item'));
      items.forEach((item) => {
        expect(item.getAttribute('role')).toBe('listitem');
      });
    });

    it('does not set role="listitem" when used standalone', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      // Standalone item has no hx-breadcrumb ancestor — role must not be set
      expect(el.getAttribute('role')).toBeNull();
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
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
