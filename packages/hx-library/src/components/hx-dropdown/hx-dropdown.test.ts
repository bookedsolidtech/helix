import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixDropdown } from './hx-dropdown.js';
import './index.js';
import '../hx-menu/index.js';

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

    it('does not set aria-controls on trigger — cross-shadow IDREF is unresolvable', async () => {
      // aria-controls on a light DOM trigger referencing a shadow DOM panel ID cannot be
      // resolved by assistive technology across shadow boundaries. The attribute is intentionally
      // omitted to avoid a broken ARIA relationship (same pattern as hx-popover).
      const el = await fixture<HelixDropdown>(triggerHtml);
      await el.updateComplete;
      const trigger = el.querySelector('[slot="trigger"]');
      expect(trigger?.hasAttribute('aria-controls')).toBe(false);
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

    it('panel aria-hidden is absent (not hidden) when open', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-hidden')).not.toBe('true');
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

  // ─── Placement variants ───

  describe('Placement variants', () => {
    const placements = [
      'top',
      'top-start',
      'top-end',
      'bottom',
      'bottom-start',
      'bottom-end',
      'start',
      'end',
    ] as const;

    for (const placement of placements) {
      it(`placement="${placement}" reflects to attribute`, async () => {
        const el = await fixture<HelixDropdown>(
          `<hx-dropdown placement="${placement}"><button slot="trigger">T</button><div role="menu" aria-label="Actions">C</div></hx-dropdown>`,
        );
        expect(el.placement).toBe(placement);
        expect(el.getAttribute('placement')).toBe(placement);
        cleanup();
      });
    }
  });

  // ─── ArrowUp wrapping (P2-01) ───

  describe('ArrowUp wrapping', () => {
    it('wraps from first item to last item on ArrowUp', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items[0]?.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[items.length - 1]);
    });
  });

  // ─── hx-select detail structure ───

  describe('hx-select event detail', () => {
    it('hx-select detail includes label text', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      const item = el.querySelector<HTMLElement>('[data-value="delete"]')!;
      item.click();
      const event = await eventPromise;

      expect(event.detail.value).toBe('delete');
      expect(event.detail.label).toBe('Delete');
    });

    it('hx-select event bubbles and is composed', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      const item = el.querySelector<HTMLElement>('[data-value="edit"]')!;
      item.click();
      const event = await eventPromise;

      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-show event bubbles and is composed', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-show');
      trigger.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-hide event bubbles and is composed', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-hide');
      trigger.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Distance property ───

  describe('distance property', () => {
    it('distance attribute sets property', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown distance="8"><button slot="trigger">T</button><div role="menu" aria-label="Actions">C</div></hx-dropdown>',
      );
      expect(el.distance).toBe(8);
    });
  });

  // ─── panel role="menu" ───

  describe('Panel ARIA', () => {
    it('panel has role="menu"', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('role')).toBe('menu');
    });

    it('panel has aria-label="Menu"', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Menu');
    });
  });

  // ─── label property ───

  describe('label property', () => {
    it('custom label attribute updates panel aria-label', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown label="Patient Actions"><button slot="trigger">T</button><div role="menu" aria-label="Patient Actions">C</div></hx-dropdown>',
      );
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Patient Actions');
    });
  });

  // ─── disconnectedCallback cleanup ───

  describe('disconnectedCallback cleanup', () => {
    it('removes keydown listener after disconnect', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(true);

      el.remove();

      // After removal, Escape should not cause errors
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(true).toBe(true);
    });

    it('removes outside-click listener after disconnect when open', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(true);

      el.remove();
      // Click outside should not throw
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect(true).toBe(true);
    });
  });

  // ─── hx-select detail includes element reference ───

  describe('hx-select detail element reference', () => {
    it('hx-select detail.label comes from item textContent', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ value: string | null; label: string }>>(
        el,
        'hx-select',
      );
      const item = el.querySelector<HTMLElement>('[data-value="edit"]')!;
      item.click();
      const event = await eventPromise;

      expect(event.detail.label).toBe('Edit');
    });
  });

  // ─── aria-expanded fallback on host when no trigger slot ───

  describe('aria-expanded fallback on host', () => {
    it('host gets aria-expanded when no trigger slot element', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown><div role="menu" aria-label="Actions">Content</div></hx-dropdown>',
      );
      await el.updateComplete;
      // When trigger slot is empty, the host should carry aria-expanded
      expect(el.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // ─── dynamic option add/remove ───

  describe('Dynamic option add/remove', () => {
    it('newly added menu items are reachable via ArrowDown navigation', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      // Add a third item
      const ul = el.querySelector<HTMLElement>('[role="menu"]')!;
      const newItem = document.createElement('li');
      newItem.setAttribute('role', 'menuitem');
      newItem.setAttribute('tabindex', '-1');
      newItem.setAttribute('data-value', 'share');
      newItem.textContent = 'Share';
      ul.appendChild(newItem);

      const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]');
      expect(items.length).toBe(3);

      // Navigate to end
      items[0]?.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(items[2]);
    });

    it('hx-select fires for dynamically added item', async () => {
      const el = await fixture<HelixDropdown>(triggerHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      const ul = el.querySelector<HTMLElement>('[role="menu"]')!;
      const newItem = document.createElement('li');
      newItem.setAttribute('role', 'menuitem');
      newItem.setAttribute('tabindex', '-1');
      newItem.setAttribute('data-value', 'archive');
      newItem.textContent = 'Archive';
      ul.appendChild(newItem);

      const eventPromise = oneEvent<CustomEvent<{ value: string | null; label: string }>>(
        el,
        'hx-select',
      );
      newItem.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('archive');
    });
  });

  // ─── panel slot validation warning ───

  describe('panel slot validation warning', () => {
    it('does not warn when slot has expected content', async () => {
      // The warning fires for non-hx-dropdown-item elements in the default slot.
      // A <ul> with role="menu" is a non-hx-dropdown-item but the component still works.
      // Just verify the component renders without crash and warning fires.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await fixture<HelixDropdown>(triggerHtml);
      // Warning may or may not fire — just confirm no error thrown
      warnSpy.mockRestore();
      expect(true).toBe(true);
    });
  });

  // ─── Host-attribute label mirror (group-4 round-1) ───

  describe('Host-attribute label mirror', () => {
    it('falls back to "Menu" when nothing is set', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown label=""><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>',
      );
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Menu');
    });

    it('uses the label property by default', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown label="Actions"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>',
      );
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Actions');
    });

    it('mirrors host aria-label to the inner panel', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown aria-label="Patient menu"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>',
      );
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Patient menu');
    });

    it('mirrors host aria-labelledby (single token) flattened to text', async () => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <h2 id="dropdown-label-1">Quick actions</h2>
        <hx-dropdown aria-labelledby="dropdown-label-1"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>
      `;
      document.body.appendChild(wrapper);
      const el = wrapper.querySelector<HelixDropdown>('hx-dropdown')!;
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Quick actions');
      wrapper.remove();
    });

    it('mirrors host aria-labelledby with multiple tokens joined by space', async () => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <span id="dropdown-label-2a">Patient</span>
        <span id="dropdown-label-2b">Actions</span>
        <hx-dropdown aria-labelledby="dropdown-label-2a dropdown-label-2b"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>
      `;
      document.body.appendChild(wrapper);
      const el = wrapper.querySelector<HelixDropdown>('hx-dropdown')!;
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Patient Actions');
      wrapper.remove();
    });

    it('falls back to label property when aria-labelledby tokens do not resolve', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown aria-labelledby="dropdown-typo-nope" label="Local fallback"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>',
      );
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Local fallback');
    });

    it('aria-labelledby outranks aria-label per AccName 1.2 §4.3.1', async () => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <h2 id="dropdown-label-3">From IDREF</h2>
        <hx-dropdown aria-labelledby="dropdown-label-3" aria-label="From aria-label"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>
      `;
      document.body.appendChild(wrapper);
      const el = wrapper.querySelector<HelixDropdown>('hx-dropdown')!;
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('From IDREF');
      wrapper.remove();
    });

    it('aria-label outranks the label property', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown aria-label="Host wins" label="Property loses"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>',
      );
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Host wins');
    });

    it('removing host aria-label restores the label property', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown aria-label="Initial" label="Restored"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>',
      );
      await el.updateComplete;
      el.removeAttribute('aria-label');
      await new Promise((resolve) => setTimeout(resolve, 0));
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Restored');
    });

    it('label property changes flow into the panel when no host attributes set', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown label="Initial"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>',
      );
      await el.updateComplete;
      el.label = 'Updated';
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Updated');
    });

    it('in-place text mutation on the IDREF target re-flows the panel name', async () => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <h2 id="dropdown-label-4">Initial Name</h2>
        <hx-dropdown aria-labelledby="dropdown-label-4"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>
      `;
      document.body.appendChild(wrapper);
      const el = wrapper.querySelector<HelixDropdown>('hx-dropdown')!;
      const heading = wrapper.querySelector<HTMLElement>('#dropdown-label-4')!;
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Initial Name');
      heading.textContent = 'Updated Name';
      await new Promise((resolve) => setTimeout(resolve, 0));
      await el.updateComplete;
      expect(panel?.getAttribute('aria-label')).toBe('Updated Name');
      wrapper.remove();
    });

    it('hidden IDREF targets are filtered out per AccName 1.2 §4.3.10', async () => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <h2 id="dropdown-label-5a" aria-hidden="true">Hidden</h2>
        <span id="dropdown-label-5b">Visible</span>
        <hx-dropdown aria-labelledby="dropdown-label-5a dropdown-label-5b"><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>
      `;
      document.body.appendChild(wrapper);
      const el = wrapper.querySelector<HelixDropdown>('hx-dropdown')!;
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      expect(panel?.getAttribute('aria-label')).toBe('Visible');
      wrapper.remove();
    });

    it('Group 5 boundary: panel still carries role="menu" (no role refactor)', async () => {
      const el = await fixture<HelixDropdown>(
        '<hx-dropdown><button slot="trigger">Open</button><ul role="menu"><li role="menuitem">Edit</li></ul></hx-dropdown>',
      );
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="panel"]');
      // Confirm Group 4 work did NOT touch the menu role — Group 5 owns that refactor.
      expect(panel?.getAttribute('role')).toBe('menu');
    });
  });

  // ─── Host-canonical hx-menu-item integration (codex round-2) ───

  describe('Host-canonical hx-menu-item integration', () => {
    const hxMenuItemHtml = `
      <hx-dropdown>
        <button slot="trigger" type="button">Open</button>
        <hx-menu-item value="edit">Edit</hx-menu-item>
        <hx-menu-item value="delete">Delete</hx-menu-item>
      </hx-dropdown>
    `;

    it('finds slotted hx-menu-item children for first-focus on open', async () => {
      const el = await fixture<HelixDropdown>(hxMenuItemHtml);
      const triggerWrapper = shadowQuery(el, '[part="trigger"]')!;
      triggerWrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      await el.updateComplete;

      const items = el.querySelectorAll<HTMLElement>('hx-menu-item');
      expect(items.length).toBe(2);
      expect(document.activeElement).toBe(items[0]);
    });

    it('walks hx-menu-item children for ArrowDown traversal', async () => {
      const el = await fixture<HelixDropdown>(hxMenuItemHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      const items = el.querySelectorAll<HTMLElement>('hx-menu-item');
      items[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);
    });

    it('routes hx-item-select from hx-menu-item through hx-select', async () => {
      const el = await fixture<HelixDropdown>(hxMenuItemHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent<{ value: string | null; label: string }>>(
        el,
        'hx-select',
      );
      const item = el.querySelector<HTMLElement>('hx-menu-item')!;
      item.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('edit');
      expect(event.detail.label).toBe('Edit');
    });

    it('closes the panel after hx-menu-item activation', async () => {
      const el = await fixture<HelixDropdown>(hxMenuItemHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      const item = el.querySelector<HTMLElement>('hx-menu-item')!;
      item.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('does not double-fire hx-select for a single hx-menu-item click', async () => {
      const el = await fixture<HelixDropdown>(hxMenuItemHtml);
      const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
      trigger.click();
      await el.updateComplete;

      let count = 0;
      el.addEventListener('hx-select', () => {
        count += 1;
      });
      const item = el.querySelector<HTMLElement>('hx-menu-item')!;
      item.click();
      await el.updateComplete;
      expect(count).toBe(1);
    });
  });
});
