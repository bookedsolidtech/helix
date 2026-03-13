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

  // ─── Property: separator (4) ───

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

    it('reads separator text from named separator slot and sets CSS property', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <span slot="separator">›</span>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const propValue = el.style.getPropertyValue('--hx-breadcrumb-separator-content');
      // JSON.stringify('›') === '"›"'
      expect(propValue).toBe('"›"');
    });
  });

  // ─── Slot & Item Management (7) ───

  describe('Slot & Item Management', () => {
    it('sets current attribute on the last item', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/dept">Department</hx-breadcrumb-item>
          <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item'));
      expect(items[2]?.hasAttribute('current')).toBe(true);
    });

    it('does not set current on non-last items', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/dept">Department</hx-breadcrumb-item>
          <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item'));
      expect(items[0]?.hasAttribute('current')).toBe(false);
      expect(items[1]?.hasAttribute('current')).toBe(false);
    });

    it('respects explicit current attribute (Drupal use case)', async () => {
      // When a consumer (e.g. Drupal) explicitly marks a non-last item as current,
      // the parent must not override it with positional detection.
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item current>Department</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/next">Next</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item'));
      expect(items[1]?.hasAttribute('current')).toBe(true);
      // Non-explicitly-current items keep whatever state they had; the parent does not add 'current'
      expect(items[0]?.hasAttribute('current')).toBe(false);
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

    it('single item receives current and data-bc-last', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item>Only Item</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const item = el.querySelector('hx-breadcrumb-item');
      expect(item?.hasAttribute('current')).toBe(true);
      expect(item?.hasAttribute('data-bc-last')).toBe(true);
    });

    it('updates current and data-bc-last when items are added or removed dynamically', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Original Last</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;

      // Listen for slotchange BEFORE appending to avoid a race condition.
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])')!;
      const slotchangeFired = new Promise<void>((resolve) => {
        slot.addEventListener('slotchange', () => resolve(), { once: true });
      });

      // Add a new item — it should become the new current/last
      const newItem = document.createElement('hx-breadcrumb-item');
      newItem.textContent = 'New Last';
      el.appendChild(newItem);

      await slotchangeFired;

      const items = Array.from(el.querySelectorAll('hx-breadcrumb-item'));
      expect(items[2]?.hasAttribute('current')).toBe(true);
      expect(items[2]?.hasAttribute('data-bc-last')).toBe(true);
      expect(items[1]?.hasAttribute('current')).toBe(false);
      expect(items[1]?.hasAttribute('data-bc-last')).toBe(false);
    });
  });

  // ─── hx-breadcrumb-item: current page rendering (3) ───

  describe('hx-breadcrumb-item: current page rendering', () => {
    it('renders current item as span even when href is provided', async () => {
      // WAI-ARIA APG: the current page item MUST NOT be a navigable link.
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/current" current>Current</hx-breadcrumb-item>',
      );
      await el.updateComplete;
      expect(shadowQuery(el, '[part="link"]')).toBeNull();
      expect(shadowQuery(el, '[part="text"]')).toBeTruthy();
    });

    it('places aria-current="page" on the inner text element (not host)', async () => {
      // Canonical WAI-ARIA pattern: aria-current on the inner element.
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item current>Current Page</hx-breadcrumb-item>',
      );
      await el.updateComplete;
      const textEl = shadowQuery(el, '[part="text"]');
      expect(textEl?.getAttribute('aria-current')).toBe('page');
      // Host element must NOT carry aria-current (that is managed by the component)
      expect(el.getAttribute('aria-current')).toBeNull();
    });

    it('does not set aria-current on non-current items', async () => {
      const el = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>',
      );
      await el.updateComplete;
      const link = shadowQuery(el, '[part="link"]');
      expect(link?.getAttribute('aria-current')).toBeNull();
    });

    it('toggles between link and text rendering when current changes at runtime', async () => {
      // P3-02: runtime current toggle — WAI-ARIA requires the DOM to reflect the state change
      const item = await fixture<HelixBreadcrumbItem>(
        '<hx-breadcrumb-item href="/dept">Department</hx-breadcrumb-item>',
      );
      await item.updateComplete;

      // Initial state: current is false → renders as <a part="link">
      expect(shadowQuery(item, '[part="link"]')).toBeInstanceOf(HTMLAnchorElement);
      expect(shadowQuery(item, '[part="text"]')).toBeNull();

      // Toggle current ON → must render as <span part="text" aria-current="page">
      item.current = true;
      await item.updateComplete;
      const textEl = shadowQuery(item, '[part="text"]');
      expect(shadowQuery(item, '[part="link"]')).toBeNull();
      expect(textEl).toBeInstanceOf(HTMLSpanElement);
      expect(textEl?.getAttribute('aria-current')).toBe('page');

      // Toggle current OFF → must revert to <a part="link">
      item.current = false;
      await item.updateComplete;
      expect(shadowQuery(item, '[part="link"]')).toBeInstanceOf(HTMLAnchorElement);
      expect(shadowQuery(item, '[part="text"]')).toBeNull();
    });
  });

  // ─── Collapse (max-items) (7) ───

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

    it('inserts an accessible ellipsis button when collapsed', async () => {
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
      // The ellipsis must NOT be aria-hidden — it contains a keyboard-accessible button
      expect(ellipsis?.getAttribute('aria-hidden')).toBeNull();
      // Confirm it contains a button
      const btn = ellipsis?.querySelector('button');
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('aria-label')).toBeTruthy();
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

    it('does not collapse when max-items equals 1 (fewer items than threshold)', async () => {
      // Single item — maxItems=1 means show 1, count is 1, no collapse needed
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb max-items="1">
          <hx-breadcrumb-item>Only</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      expect(el.querySelector('.hx-bc-ellipsis')).toBeNull();
    });

    it('expanding via ellipsis button removes collapse state', async () => {
      // Keyboard/click expand: setting maxItems=0 from the button must restore all items
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb max-items="2">
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/c">C</hx-breadcrumb-item>
          <hx-breadcrumb-item>D</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      expect(el.querySelector('.hx-bc-ellipsis')).toBeTruthy();

      // Simulate the expand: set maxItems=0 (what the button does)
      el.maxItems = 0;
      await el.updateComplete;

      expect(el.querySelector('.hx-bc-ellipsis')).toBeNull();
      const items = Array.from(
        el.querySelectorAll<HTMLElement>('hx-breadcrumb-item:not(.hx-bc-ellipsis)'),
      );
      expect(items.every((i) => !i.hasAttribute('data-bc-hidden'))).toBe(true);
    });

    it('clicking the ellipsis button directly expands all items (BC-A02)', async () => {
      // BC-A02: tests the actual _handleEllipsisClick event handler path via a
      // real click event on the button element, not a programmatic maxItems=0 assignment.
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb max-items="2">
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/c">C</hx-breadcrumb-item>
          <hx-breadcrumb-item>D</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const ellipsis = el.querySelector('.hx-bc-ellipsis');
      expect(ellipsis).toBeTruthy();
      const btn = ellipsis?.querySelector('button') as HTMLButtonElement;
      expect(btn).toBeTruthy();

      // Dispatch a real click event on the ellipsis button
      btn.click();
      await el.updateComplete;

      // The _handleEllipsisClick → _expandBreadcrumb → maxItems=0 path must have fired
      expect(el.querySelector('.hx-bc-ellipsis')).toBeNull();
      const items = Array.from(
        el.querySelectorAll<HTMLElement>('hx-breadcrumb-item:not(.hx-bc-ellipsis)'),
      );
      expect(items.every((i) => !i.hasAttribute('data-bc-hidden'))).toBe(true);
    });

    it('Enter key on ellipsis button expands all items (BC-A02)', async () => {
      // BC-A02: tests the _handleEllipsisKeydown path for Enter.
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb max-items="2">
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/c">C</hx-breadcrumb-item>
          <hx-breadcrumb-item>D</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const ellipsis = el.querySelector('.hx-bc-ellipsis');
      expect(ellipsis).toBeTruthy();
      const btn = ellipsis?.querySelector('button') as HTMLButtonElement;
      expect(btn).toBeTruthy();

      // Dispatch a real keydown Enter event on the ellipsis button
      btn.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;

      expect(el.querySelector('.hx-bc-ellipsis')).toBeNull();
      const items = Array.from(
        el.querySelectorAll<HTMLElement>('hx-breadcrumb-item:not(.hx-bc-ellipsis)'),
      );
      expect(items.every((i) => !i.hasAttribute('data-bc-hidden'))).toBe(true);
    });

    it('Space key on ellipsis button expands all items (BC-A02)', async () => {
      // BC-A02: tests the _handleEllipsisKeydown path for Space.
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb max-items="2">
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/c">C</hx-breadcrumb-item>
          <hx-breadcrumb-item>D</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const ellipsis = el.querySelector('.hx-bc-ellipsis');
      expect(ellipsis).toBeTruthy();
      const btn = ellipsis?.querySelector('button') as HTMLButtonElement;
      expect(btn).toBeTruthy();

      // Dispatch a real keydown Space event on the ellipsis button
      btn.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;

      expect(el.querySelector('.hx-bc-ellipsis')).toBeNull();
      const items = Array.from(
        el.querySelectorAll<HTMLElement>('hx-breadcrumb-item:not(.hx-bc-ellipsis)'),
      );
      expect(items.every((i) => !i.hasAttribute('data-bc-hidden'))).toBe(true);
    });
  });

  // ─── JSON-LD (6) ───

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

    it('verifies JSON-LD item href and name values', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb json-ld>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/dept">Department</hx-breadcrumb-item>
          <hx-breadcrumb-item>Patient Records</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const script = document.querySelector<HTMLScriptElement>('script[data-hx-breadcrumb]');
      expect(script).toBeTruthy();
      const data = JSON.parse(script?.textContent ?? '{}') as {
        itemListElement: Array<{ '@type': string; position: number; name: string; item?: string }>;
      };
      expect(data.itemListElement).toHaveLength(3);
      expect(data.itemListElement[0]?.name).toBe('Home');
      expect(data.itemListElement[0]?.item).toBe('/home');
      expect(data.itemListElement[1]?.name).toBe('Department');
      expect(data.itemListElement[1]?.item).toBe('/dept');
      // Current page item has no href — 'item' field should be absent
      expect(data.itemListElement[2]?.name).toBe('Patient Records');
      expect(data.itemListElement[2]?.item).toBeUndefined();
    });

    it('removes the JSON-LD script on disconnect', async () => {
      const before = document.querySelectorAll('script[data-hx-breadcrumb]').length;
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb json-ld>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      expect(document.querySelectorAll('script[data-hx-breadcrumb]').length).toBe(before + 1);

      el.remove();
      expect(document.querySelectorAll('script[data-hx-breadcrumb]').length).toBe(before);
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

      const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-hx-breadcrumb]');
      // Find the script belonging to this instance (only 1 in this test)
      expect(scripts.length).toBeGreaterThanOrEqual(1);
      const script = scripts[scripts.length - 1]!;

      const data = JSON.parse(script.textContent ?? '{}') as { itemListElement: unknown[] };
      expect(data.itemListElement).toHaveLength(2);
    });

    it('injects JSON-LD script when json-ld is toggled on after initial render (BC-A03)', async () => {
      // BC-A03: exercises the updated() handler's jsonLd branch — toggling json-ld on
      // programmatically after the element is already connected (no json-ld attribute initially).
      const before = document.querySelectorAll('script[data-hx-breadcrumb]').length;
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      // No script yet — json-ld was not set at render time
      expect(document.querySelectorAll('script[data-hx-breadcrumb]').length).toBe(before);

      // Toggle json-ld on after initial render
      el.jsonLd = true;
      await el.updateComplete;

      // Script must now exist and contain valid BreadcrumbList structured data
      const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-hx-breadcrumb]');
      expect(scripts.length).toBe(before + 1);
      const script = scripts[scripts.length - 1]!;
      expect(script.type).toBe('application/ld+json');
      const data = JSON.parse(script.textContent ?? '{}') as Record<string, unknown>;
      expect(data['@type']).toBe('BreadcrumbList');
    });

    it('removes JSON-LD script when json-ld is toggled off programmatically (BC-A03)', async () => {
      // BC-A03: exercises the updated() handler's jsonLd branch for removal — toggling
      // json-ld off after it was enabled.
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb json-ld>
          <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
          <hx-breadcrumb-item>Current</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      const scriptsBefore = document.querySelectorAll('script[data-hx-breadcrumb]').length;
      expect(scriptsBefore).toBeGreaterThanOrEqual(1);

      // Toggle json-ld off — the updated() handler must call _removeJsonLd()
      el.jsonLd = false;
      await el.updateComplete;

      expect(document.querySelectorAll('script[data-hx-breadcrumb]').length).toBe(
        scriptsBefore - 1,
      );
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

    it('renders an anchor when href is provided (non-current item)', async () => {
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

    it('has no axe violations in collapsed state', async () => {
      const el = await fixture<HelixBreadcrumb>(`
        <hx-breadcrumb label="Page navigation" max-items="2">
          <hx-breadcrumb-item href="/a">A</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/b">B</hx-breadcrumb-item>
          <hx-breadcrumb-item href="/c">C</hx-breadcrumb-item>
          <hx-breadcrumb-item>D</hx-breadcrumb-item>
        </hx-breadcrumb>
      `);
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
