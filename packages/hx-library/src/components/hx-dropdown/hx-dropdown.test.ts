import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixDropdown } from './hx-dropdown.js';
import './index.js';

afterEach(cleanup);

const triggerHtml = `
  <hx-dropdown>
    <button slot="trigger" type="button">Open</button>
    <ul role="menu" aria-label="Actions">
      <li data-value="edit" role="menuitem" tabindex="-1">Edit</li>
      <li data-value="delete" role="menuitem" tabindex="-1">Delete</li>
    </ul>
  </hx-dropdown>
`;

describe('hx-dropdown', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders trigger part', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger).toBeTruthy();
    });

    it('renders panel with part="panel"', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel).toBeTruthy();
    });

    it('slotted content provides role="menu"', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const menu = el.querySelector('[role="menu"]');
      expect(menu).toBeTruthy();
    });

    it('panel is hidden by default', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-hidden')).toBe('true');
      expect(panel?.classList.contains('panel--visible')).toBe(false);
    });
  });

  // ─── Properties (4) ───

  describe('Properties', () => {
    it('defaults open to false', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      expect(el.open).toBe(false);
    });

    it('defaults disabled to false', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      expect(el.disabled).toBe(false);
    });

    it('defaults placement to "bottom-start"', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      expect(el.placement).toBe('bottom-start');
    });

    it('defaults distance to 4', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      expect(el.distance).toBe(4);
    });

    it('reflects open attribute', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown open><button slot="trigger">T</button><div role="menu" aria-label="Actions">Content</div></hx-dropdown>',
      );
      expect(el.open).toBe(true);
      expect(el.getAttribute('open')).not.toBeNull();
    });

    it('reflects disabled attribute', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown disabled><button slot="trigger">T</button><div role="menu" aria-label="Actions">Content</div></hx-dropdown>',
      );
      expect(el.disabled).toBe(true);
      expect(el.getAttribute('disabled')).not.toBeNull();
    });
  });

  // ─── Open/Close behavior (4) ───

  describe('Open/Close behavior', () => {
    it('opens on trigger click', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(true);
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.classList.contains('panel--visible')).toBe(true);
    });

    it('closes on second trigger click', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('closes on Escape key', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(true);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('closes on Tab key when open', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('does not open when disabled', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown disabled><button slot="trigger">T</button><div role="menu" aria-label="Actions">Content</div></hx-dropdown>',
      );
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('closes on outside click', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(true);
      // Simulate a click outside the component.
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Keyboard Interactions (P1-04 / P2-05) ───

  describe('Keyboard Interactions', () => {
    it('opens on Enter key on trigger', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const triggerWrapper = shadowQuery(el, '[part="trigger"]')!;
      triggerWrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('opens on Space key on trigger', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const triggerWrapper = shadowQuery(el, '[part="trigger"]')!;
      triggerWrapper.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('opens on ArrowDown key on trigger', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const triggerWrapper = shadowQuery(el, '[part="trigger"]')!;
      triggerWrapper.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('focuses first menu item on open via keyboard', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const triggerWrapper = shadowQuery(el, '[part="trigger"]')!;
      triggerWrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      await el.updateComplete;
      const firstItem = el.querySelector<HTMLElement>('[role="menuitem"]')!;
      expect(document.activeElement).toBe(firstItem);
    });

    it('navigates down through items on ArrowDown', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items[0]?.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
    });

    it('wraps from last to first on ArrowDown', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items[items.length - 1]?.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('navigates up through items on ArrowUp', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items[1]?.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('focuses last item on End key', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items[0]?.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('focuses first item on Home key', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items[items.length - 1]?.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('returns focus to trigger on Escape', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      trigger.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
      expect(document.activeElement).toBe(trigger);
    });
  });

  // ─── hx-select edge cases (P2-05) ───

  describe('hx-select edge cases', () => {
    it('dispatches hx-select with null value when no data-value is set', async () => {
      const noValueHtml = `
        <hx-dropdown>
          <button slot="trigger" type="button">Open</button>
          <ul role="menu" aria-label="Actions">
            <li role="menuitem" tabindex="-1">No Value</li>
          </ul>
        </hx-dropdown>
      `;
      const el = await fixture<HelixDropdown>(noValueHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      const item = el.querySelector<HTMLElement>('[role="menuitem"]')!;
      item.click();
      const event = await eventPromise;
      expect(event.detail.value).toBeNull();
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches hx-show when opened', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      const eventPromise = oneEvent(el, 'hx-show');
      trigger.click();
      const event = await eventPromise;
      expect(event.type).toBe('hx-show');
    });

    it('dispatches hx-hide when closed', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const eventPromise = oneEvent(el, 'hx-hide');
      trigger.click();
      const event = await eventPromise;
      expect(event.type).toBe('hx-hide');
    });

    it('dispatches hx-select when an item is clicked and closes', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      const item = el.querySelector<HTMLElement>('[data-value="edit"]')!;
      item.click();
      const event = await eventPromise;

      expect(event.type).toBe('hx-select');
      expect(event.detail.value).toBe('edit');
      expect(event.detail.label).toBe('Edit');

      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('exposes "trigger" part', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      expect(shadowQuery(el, '[part="trigger"]')).toBeTruthy();
    });

    it('exposes "panel" part', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      expect(shadowQuery(el, '[part="panel"]')).toBeTruthy();
    });
  });

  // ─── ARIA (3) ───

  describe('ARIA', () => {
    it('sets aria-haspopup="menu" on trigger element', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      await el.updateComplete;
      const trigger = el.querySelector('[slot="trigger"]');
      // P1-01: ARIA 1.1+ requires aria-haspopup="menu" for menu buttons.
      expect(trigger?.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('sets aria-controls on trigger element pointing to the panel', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      await el.updateComplete;
      const trigger = el.querySelector('[slot="trigger"]');
      const panelId = trigger?.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      // P1-02: aria-controls must reference the panel element.
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.id).toBe(panelId);
    });

    it('trigger aria-expanded is false by default', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      await el.updateComplete;
      const trigger = el.querySelector('[slot="trigger"]');
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    });

    it('trigger aria-expanded becomes true when open', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('panel aria-hidden is false when open', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-hidden')).toBe('false');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default (closed) state', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when open', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
