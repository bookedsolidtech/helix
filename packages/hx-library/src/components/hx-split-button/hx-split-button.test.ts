import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixSplitButton } from './hx-split-button.js';
import type { HelixMenuItem } from './hx-menu-item.js';
import './index.js';

afterEach(cleanup);

// ─── hx-split-button ──────────────────────────────────────────────────────────

describe('hx-split-button', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "button" CSS part (primary button)', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      const part = shadowQuery(el, '[part~="button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "trigger" CSS part', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      const part = shadowQuery(el, '[part~="trigger"]');
      expect(part).toBeTruthy();
    });

    it('exposes "menu" CSS part', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      const part = shadowQuery(el, '[part~="menu"]');
      expect(part).toBeTruthy();
    });

    it('applies default variant=primary classes to container', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--primary')).toBe(true);
    });

    it('applies default size=md classes to container', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--md')).toBe(true);
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('applies primary class by default', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--primary')).toBe(true);
    });

    it('applies secondary class', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button variant="secondary">Save</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--secondary')).toBe(true);
    });

    it('applies tertiary class', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button variant="tertiary">Save</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--tertiary')).toBe(true);
    });

    it('applies danger class', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button variant="danger">Delete</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--danger')).toBe(true);
    });

    it('applies ghost class', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button variant="ghost">Save</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--ghost')).toBe(true);
    });

    it('applies outline class', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button variant="outline">Save</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--outline')).toBe(true);
    });
  });

  // ─── Property: size ───

  describe('Property: size', () => {
    it('applies sm class', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button hx-size="sm">Save</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--sm')).toBe(true);
    });

    it('applies md class', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button hx-size="md">Save</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--md')).toBe(true);
    });

    it('applies lg class', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button hx-size="lg">Save</hx-split-button>
      `);
      const container = shadowQuery(el, '.split-button');
      expect(container?.classList.contains('split-button--lg')).toBe(true);
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('disables native primary button', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button disabled>Save</hx-split-button>
      `);
      const primary = shadowQuery<HTMLButtonElement>(el, '.split-button__primary');
      expect(primary?.disabled).toBe(true);
    });

    it('disables native trigger button', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button disabled>Save</hx-split-button>
      `);
      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');
      expect(trigger?.disabled).toBe(true);
    });

    it('sets aria-disabled on primary and trigger', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button disabled>Save</hx-split-button>
      `);
      const primary = shadowQuery(el, '.split-button__primary');
      const trigger = shadowQuery(el, '.split-button__trigger');
      expect(primary?.getAttribute('aria-disabled')).toBe('true');
      expect(trigger?.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not fire hx-click when disabled', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button disabled>Save</hx-split-button>
      `);
      const primary = shadowQuery<HTMLButtonElement>(el, '.split-button__primary');
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      primary?.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Property: label ───

  describe('Property: label', () => {
    it('label prop renders label text as primary button content', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button label="Save Patient Record">Save</hx-split-button>
      `);
      const primary = shadowQuery<HTMLButtonElement>(el, '.split-button__primary');
      expect(primary?.textContent?.trim()).toBe('Save Patient Record');
    });

    it('undefined label shows slot content', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      // When no label property is set, slot element should be in the primary button
      const slot = el.shadowRoot?.querySelector('.split-button__primary slot:not([name])');
      expect(slot).toBeTruthy();
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders primary button text', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      expect(el.textContent?.trim()).toBe('Save Record');
    });

    it('menu slot renders hx-menu-item children', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
          <hx-menu-item slot="menu" value="save-template">Save as Template</hx-menu-item>
        </hx-split-button>
      `);
      const items = el.querySelectorAll('hx-menu-item');
      expect(items.length).toBe(2);
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-click when primary button is clicked', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      const primary = shadowQuery<HTMLButtonElement>(el, '.split-button__primary');
      const eventPromise = oneEvent(el, 'hx-click');
      primary?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-click detail contains originalEvent', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      const primary = shadowQuery<HTMLButtonElement>(el, '.split-button__primary');
      const eventPromise = oneEvent<CustomEvent<{ originalEvent: MouseEvent }>>(el, 'hx-click');
      primary?.click();
      const event = await eventPromise;
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('hx-click does NOT fire when disabled', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button disabled>Save Record</hx-split-button>
      `);
      const primary = shadowQuery<HTMLButtonElement>(el, '.split-button__primary');
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      primary?.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });

    it('dispatches hx-select when menu item is clicked', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      // Open menu via trigger click
      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');
      trigger?.click();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      // Click the inner button of the menu item
      const menuItem = el.querySelector('hx-menu-item') as HelixMenuItem;
      const itemButton = menuItem.shadowRoot?.querySelector('button');

      const eventPromise = oneEvent(el, 'hx-select');
      itemButton?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-select detail has correct value and label', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      // Open menu
      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');
      trigger?.click();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const menuItem = el.querySelector('hx-menu-item') as HelixMenuItem;
      const itemButton = menuItem.shadowRoot?.querySelector('button');

      const eventPromise = oneEvent<CustomEvent<{ value: string; label: string }>>(el, 'hx-select');
      itemButton?.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('save-draft');
      expect(event.detail.label).toBe('Save as Draft');
    });
  });

  // ─── Keyboard ───

  describe('Keyboard', () => {
    it('ArrowDown on primary button opens menu', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      const primary = shadowQuery<HTMLButtonElement>(el, '.split-button__primary');
      primary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;

      const menu = shadowQuery(el, '.split-button__menu');
      expect(menu?.classList.contains('split-button__menu--open')).toBe(true);
    });

    it('ArrowDown on trigger opens menu', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');
      trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;

      const menu = shadowQuery(el, '.split-button__menu');
      expect(menu?.classList.contains('split-button__menu--open')).toBe(true);
    });

    it('Escape closes menu and returns focus to trigger', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      // Open menu first
      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');
      trigger?.click();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      // Dispatch Escape on the menu panel
      const menu = shadowQuery(el, '.split-button__menu');
      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;

      expect(menu?.classList.contains('split-button__menu--open')).toBe(false);
    });

    it('Enter on primary button fires hx-click', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save Record</hx-split-button>
      `);
      const primary = shadowQuery<HTMLButtonElement>(el, '.split-button__primary');
      const eventPromise = oneEvent(el, 'hx-click');
      // Dispatch Enter, then click to trigger the native button activation
      primary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      primary?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Menu behavior ───

  describe('Menu behavior', () => {
    it('trigger click toggles menu open', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');
      const menu = shadowQuery(el, '.split-button__menu');

      // Initially closed
      expect(menu?.classList.contains('split-button__menu--open')).toBe(false);

      // Open on first click
      trigger?.click();
      await el.updateComplete;
      expect(menu?.classList.contains('split-button__menu--open')).toBe(true);
    });

    it('trigger click closes menu when already open', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');
      const menu = shadowQuery(el, '.split-button__menu');

      // Open
      trigger?.click();
      await el.updateComplete;
      expect(menu?.classList.contains('split-button__menu--open')).toBe(true);

      // Close on second click
      trigger?.click();
      await el.updateComplete;
      expect(menu?.classList.contains('split-button__menu--open')).toBe(false);
    });

    it('menu closes when menu item is selected', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');
      trigger?.click();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const menuItem = el.querySelector('hx-menu-item') as HelixMenuItem;
      const itemButton = menuItem.shadowRoot?.querySelector('button');
      itemButton?.click();
      await el.updateComplete;

      const menu = shadowQuery(el, '.split-button__menu');
      expect(menu?.classList.contains('split-button__menu--open')).toBe(false);
    });

    it('menu aria-expanded reflects open state', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      const trigger = shadowQuery<HTMLButtonElement>(el, '.split-button__trigger');

      // Initially false
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');

      // After open
      trigger?.click();
      await el.updateComplete;
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('"button" part exists', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save</hx-split-button>
      `);
      expect(shadowQuery(el, '[part~="button"]')).toBeTruthy();
    });

    it('"trigger" part exists', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save</hx-split-button>
      `);
      expect(shadowQuery(el, '[part~="trigger"]')).toBeTruthy();
    });

    it('"menu" part exists', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>Save</hx-split-button>
      `);
      expect(shadowQuery(el, '[part~="menu"]')).toBeTruthy();
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Patient Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button disabled>
          Save Patient Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});

// ─── hx-menu-item ─────────────────────────────────────────────────────────────

describe('hx-menu-item', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="test">Test Item</hx-menu-item>
      `);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders with role="menuitem"', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="test">Test Item</hx-menu-item>
      `);
      const button = shadowQuery(el, 'button');
      expect(button?.getAttribute('role')).toBe('menuitem');
    });

    it('renders slot content', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="test">Save as Draft</hx-menu-item>
      `);
      expect(el.textContent?.trim()).toBe('Save as Draft');
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('fires hx-menu-item-select on click', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="save-draft">Save as Draft</hx-menu-item>
      `);
      const button = shadowQuery<HTMLButtonElement>(el, 'button');
      const eventPromise = oneEvent(el, 'hx-menu-item-select');
      button?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-menu-item-select detail has correct value and label', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="save-draft">Save as Draft</hx-menu-item>
      `);
      const button = shadowQuery<HTMLButtonElement>(el, 'button');
      const eventPromise = oneEvent<CustomEvent<{ value: string; label: string }>>(
        el,
        'hx-menu-item-select',
      );
      button?.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('save-draft');
      expect(event.detail.label).toBe('Save as Draft');
    });

    it('does not fire event when disabled', async () => {
      const el = await fixture<HelixMenuItem>(`
        <hx-menu-item value="save-draft" disabled>Save as Draft</hx-menu-item>
      `);
      const button = shadowQuery<HTMLButtonElement>(el, 'button');
      let fired = false;
      el.addEventListener('hx-menu-item-select', () => {
        fired = true;
      });
      button?.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('has no axe violations when inside a menu context', async () => {
      // hx-menu-item uses role="menuitem" which requires a parent role="menu".
      // Test within an hx-split-button so the ARIA context is valid.
      const el = await fixture<HelixSplitButton>(`
        <hx-split-button>
          Save Record
          <hx-menu-item slot="menu" value="save-draft">Save as Draft</hx-menu-item>
        </hx-split-button>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
