/**
 * @file
 * Comprehensive test suite for HELiX Drupal behaviors.
 *
 * Tests behavior attachment, data-attribute parsing, event handling,
 * detach lifecycle, re-attachment (Drupal Ajax pattern), DOM mutation
 * handling, and error resilience using mocked Drupal globals.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

// ─── Drupal Global Mocks ──────────────────────────────────────────────────────

const mockDrupal = {
  behaviors: {} as Record<
    string,
    {
      attach: (ctx: Element | Document) => void;
      detach?: (
        ctx: Element | Document,
        settings: Record<string, unknown>,
        trigger: string,
      ) => void;
    }
  >,
  t: (str: string) => str,
  announce: vi.fn(),
};

// Track which elements have been processed by once()
const attachedElements = new Map<string, Set<Element>>();

const mockOnce = Object.assign(
  (key: string, selector: string, context: Element | Document): Element[] => {
    const all = Array.from(
      (context as Element).querySelectorAll
        ? (context as Element).querySelectorAll(selector)
        : [],
    );
    if (!attachedElements.has(key)) {
      attachedElements.set(key, new Set());
    }
    const set = attachedElements.get(key)!;
    const unattached = all.filter((el) => !set.has(el));
    unattached.forEach((el) => set.add(el));
    return unattached;
  },
  {
    remove: (key: string, selector: string, context: Element | Document): Element[] => {
      const all = Array.from(
        (context as Element).querySelectorAll
          ? (context as Element).querySelectorAll(selector)
          : [],
      );
      const set = attachedElements.get(key);
      if (!set) return [];
      const attached = all.filter((el) => set.has(el));
      attached.forEach((el) => set.delete(el));
      return attached;
    },
  },
);

// Inject globals before behaviors execute their IIFEs
(globalThis as Record<string, unknown>).Drupal = mockDrupal;
(globalThis as Record<string, unknown>).once = mockOnce;

// ─── Test Lifecycle ───────────────────────────────────────────────────────────

// Import behaviors once — IIFEs register on globalThis.Drupal at first execution
beforeAll(async () => {
  await import('../src/index.js');
});

beforeEach(() => {
  attachedElements.clear();
  mockDrupal.announce.mockClear();
  document.body.style.overflow = '';
});

// DOM cleanup registry
const cleanupFns: Array<() => void> = [];
afterEach(() => {
  cleanupFns.forEach((fn) => fn());
  cleanupFns.length = 0;
});

/** Creates a div appended to body, registers cleanup automatically. */
function createContainer(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  cleanupFns.push(() => el.parentNode?.removeChild(el));
  return el;
}

/** Creates a button appended to body, registers cleanup automatically. */
function createButton(id: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = id;
  document.body.appendChild(btn);
  cleanupFns.push(() => btn.parentNode?.removeChild(btn));
  return btn;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HELiX Drupal Behaviors', () => {
  // ─── Behavior Registration ─────────────────────────────────────────────────

  describe('Behavior registration', () => {
    const expectedBehaviors = [
      'hxAccordion',
      'hxDialog',
      'hxDrawer',
      'hxMenu',
      'hxTabs',
      'hxPopover',
      'hxToast',
      'hxTooltip',
    ];

    it('registers all 8 behaviors on the Drupal global', () => {
      for (const name of expectedBehaviors) {
        expect(mockDrupal.behaviors[name], `Missing behavior: ${name}`).toBeDefined();
      }
    });

    it('each behavior has an attach function', () => {
      for (const name of expectedBehaviors) {
        expect(typeof mockDrupal.behaviors[name].attach, `${name}.attach`).toBe('function');
      }
    });

    it('each behavior has a detach function', () => {
      for (const name of expectedBehaviors) {
        expect(typeof mockDrupal.behaviors[name].detach, `${name}.detach`).toBe('function');
      }
    });
  });

  // ─── hxAccordion ──────────────────────────────────────────────────────────

  describe('hxAccordion behavior', () => {
    it('attaches to [data-drupal-accordion] elements', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.appendChild(document.createElement('hx-accordion'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxAccordion.attach(container);

      const secondCall = mockOnce('hx-accordion', '[data-drupal-accordion]', container);
      expect(secondCall).toHaveLength(0);
    });

    it('does not attach the same element twice (once() compliance)', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.appendChild(document.createElement('hx-accordion'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxAccordion.attach(container);
      mockDrupal.behaviors.hxAccordion.attach(container);

      expect(attachedElements.get('hx-accordion')?.size).toBe(1);
    });

    it('opens first panel when data-open-first="true"', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.setAttribute('data-open-first', 'true');
      const accordion = document.createElement('hx-accordion');
      const panel = document.createElement('hx-accordion-panel');
      accordion.appendChild(panel);
      wrapper.appendChild(accordion);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxAccordion.attach(container);

      expect((panel as HTMLElement & { open?: boolean }).open).toBe(true);
    });

    it('does not open first panel when data-open-first is absent', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      const accordion = document.createElement('hx-accordion');
      const panel = document.createElement('hx-accordion-panel');
      accordion.appendChild(panel);
      wrapper.appendChild(accordion);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxAccordion.attach(container);

      expect((panel as HTMLElement & { open?: boolean }).open).toBeUndefined();
    });

    it('announces "Panel expanded" via Drupal.announce on hx-open', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      const accordion = document.createElement('hx-accordion');
      wrapper.appendChild(accordion);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxAccordion.attach(container);
      accordion.dispatchEvent(new CustomEvent('hx-open'));

      expect(mockDrupal.announce).toHaveBeenCalledWith('Panel expanded');
    });

    it('announces "Panel collapsed" via Drupal.announce on hx-close', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      const accordion = document.createElement('hx-accordion');
      wrapper.appendChild(accordion);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxAccordion.attach(container);
      accordion.dispatchEvent(new CustomEvent('hx-close'));

      expect(mockDrupal.announce).toHaveBeenCalledWith('Panel collapsed');
    });

    it('allows re-attachment after detach with trigger "unload"', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.appendChild(document.createElement('hx-accordion'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxAccordion.attach(container);
      mockDrupal.behaviors.hxAccordion.detach!(container, {}, 'unload');

      const reattached = mockOnce('hx-accordion', '[data-drupal-accordion]', container);
      expect(reattached).toHaveLength(1);
    });

    it('does not remove once() marker on non-unload detach triggers', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.appendChild(document.createElement('hx-accordion'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxAccordion.attach(container);
      mockDrupal.behaviors.hxAccordion.detach!(container, {}, 'serialize');

      // Element should still be marked as attached
      const tryAttach = mockOnce('hx-accordion', '[data-drupal-accordion]', container);
      expect(tryAttach).toHaveLength(0);
    });

    it('handles missing hx-accordion child element gracefully', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      container.appendChild(wrapper);

      expect(() => mockDrupal.behaviors.hxAccordion.attach(container)).not.toThrow();
    });

    it('simulates Drupal Ajax re-attach: detach then re-attach works', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.appendChild(document.createElement('hx-accordion'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxAccordion.attach(container);
      expect(attachedElements.get('hx-accordion')?.size).toBe(1);

      mockDrupal.behaviors.hxAccordion.detach!(container, {}, 'unload');
      expect(attachedElements.get('hx-accordion')?.size).toBe(0);

      mockDrupal.behaviors.hxAccordion.attach(container);
      expect(attachedElements.get('hx-accordion')?.size).toBe(1);
    });
  });

  // ─── hxDialog ──────────────────────────────────────────────────────────────

  describe('hxDialog behavior', () => {
    it('attaches to [data-drupal-dialog] elements', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-dialog', '');
      wrapper.appendChild(document.createElement('hx-dialog'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDialog.attach(container);

      const secondCall = mockOnce('hx-dialog', '[data-drupal-dialog]', container);
      expect(secondCall).toHaveLength(0);
    });

    it('opens dialog when trigger element is clicked', () => {
      const trigger = createButton('dialog-trigger-open');
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-dialog', '');
      wrapper.setAttribute('data-trigger-selector', '#dialog-trigger-open');
      const dialog = document.createElement('hx-dialog') as HTMLElement & { open?: boolean };
      wrapper.appendChild(dialog);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDialog.attach(container);
      trigger.click();

      expect(dialog.open).toBe(true);
    });

    it('closes dialog and returns focus to trigger on hx-close', () => {
      const trigger = createButton('dialog-trigger-close');
      const focusSpy = vi.spyOn(trigger, 'focus');
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-dialog', '');
      wrapper.setAttribute('data-trigger-selector', '#dialog-trigger-close');
      const dialog = document.createElement('hx-dialog') as HTMLElement & { open?: boolean };
      dialog.open = true;
      wrapper.appendChild(dialog);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDialog.attach(container);
      dialog.dispatchEvent(new CustomEvent('hx-close'));

      expect(dialog.open).toBe(false);
      expect(focusSpy).toHaveBeenCalled();
      focusSpy.mockRestore();
    });

    it('closes dialog and returns focus to trigger on hx-cancel', () => {
      const trigger = createButton('dialog-trigger-cancel');
      const focusSpy = vi.spyOn(trigger, 'focus');
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-dialog', '');
      wrapper.setAttribute('data-trigger-selector', '#dialog-trigger-cancel');
      const dialog = document.createElement('hx-dialog') as HTMLElement & { open?: boolean };
      dialog.open = true;
      wrapper.appendChild(dialog);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDialog.attach(container);
      dialog.dispatchEvent(new CustomEvent('hx-cancel'));

      expect(dialog.open).toBe(false);
      expect(focusSpy).toHaveBeenCalled();
      focusSpy.mockRestore();
    });

    it('attaches without a trigger selector without throwing', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-dialog', '');
      wrapper.appendChild(document.createElement('hx-dialog'));
      container.appendChild(wrapper);

      expect(() => mockDrupal.behaviors.hxDialog.attach(container)).not.toThrow();
    });

    it('handles missing hx-dialog child element gracefully', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-dialog', '');
      container.appendChild(wrapper);

      expect(() => mockDrupal.behaviors.hxDialog.attach(container)).not.toThrow();
    });

    it('allows re-attachment after detach', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-dialog', '');
      wrapper.appendChild(document.createElement('hx-dialog'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDialog.attach(container);
      mockDrupal.behaviors.hxDialog.detach!(container, {}, 'unload');

      const reattached = mockOnce('hx-dialog', '[data-drupal-dialog]', container);
      expect(reattached).toHaveLength(1);
    });
  });

  // ─── hxDrawer ──────────────────────────────────────────────────────────────

  describe('hxDrawer behavior', () => {
    it('attaches to [data-drupal-drawer] elements', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-drawer', '');
      wrapper.appendChild(document.createElement('hx-drawer'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDrawer.attach(container);

      const secondCall = mockOnce('hx-drawer', '[data-drupal-drawer]', container);
      expect(secondCall).toHaveLength(0);
    });

    it('applies data-direction attribute to hx-drawer element', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-drawer', '');
      wrapper.setAttribute('data-direction', 'left');
      const drawer = document.createElement('hx-drawer');
      wrapper.appendChild(drawer);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDrawer.attach(container);

      expect(drawer.getAttribute('direction')).toBe('left');
    });

    it('applies data-size attribute to hx-drawer element', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-drawer', '');
      wrapper.setAttribute('data-size', 'lg');
      const drawer = document.createElement('hx-drawer');
      wrapper.appendChild(drawer);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDrawer.attach(container);

      expect(drawer.getAttribute('size')).toBe('lg');
    });

    it('locks body scroll on hx-open event', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-drawer', '');
      const drawer = document.createElement('hx-drawer');
      wrapper.appendChild(drawer);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDrawer.attach(container);
      drawer.dispatchEvent(new CustomEvent('hx-open'));

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll on hx-close event', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-drawer', '');
      const drawer = document.createElement('hx-drawer');
      wrapper.appendChild(drawer);
      container.appendChild(wrapper);

      document.body.style.overflow = 'hidden';
      mockDrupal.behaviors.hxDrawer.attach(container);
      drawer.dispatchEvent(new CustomEvent('hx-close'));

      expect(document.body.style.overflow).toBe('');
    });

    it('opens drawer when trigger element is clicked', () => {
      const trigger = createButton('drawer-trigger-test');
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-drawer', '');
      wrapper.setAttribute('data-trigger-selector', '#drawer-trigger-test');
      const drawer = document.createElement('hx-drawer') as HTMLElement & { open?: boolean };
      wrapper.appendChild(drawer);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDrawer.attach(container);
      trigger.click();

      expect(drawer.open).toBe(true);
    });

    it('restores body scroll on detach with trigger "unload"', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-drawer', '');
      wrapper.appendChild(document.createElement('hx-drawer'));
      container.appendChild(wrapper);

      document.body.style.overflow = 'hidden';
      mockDrupal.behaviors.hxDrawer.attach(container);
      mockDrupal.behaviors.hxDrawer.detach!(container, {}, 'unload');

      expect(document.body.style.overflow).toBe('');
    });

    it('allows re-attachment after detach', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-drawer', '');
      wrapper.appendChild(document.createElement('hx-drawer'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxDrawer.attach(container);
      mockDrupal.behaviors.hxDrawer.detach!(container, {}, 'unload');

      const reattached = mockOnce('hx-drawer', '[data-drupal-drawer]', container);
      expect(reattached).toHaveLength(1);
    });

    it('handles missing hx-drawer child element gracefully', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-drawer', '');
      container.appendChild(wrapper);

      expect(() => mockDrupal.behaviors.hxDrawer.attach(container)).not.toThrow();
    });
  });

  // ─── hxMenu ────────────────────────────────────────────────────────────────

  describe('hxMenu behavior', () => {
    it('attaches to [data-drupal-menu] elements', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-menu', '');
      wrapper.appendChild(document.createElement('hx-menu'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxMenu.attach(container);

      const secondCall = mockOnce('hx-menu', '[data-drupal-menu]', container);
      expect(secondCall).toHaveLength(0);

      mockDrupal.behaviors.hxMenu.detach!(container, {}, 'unload');
    });

    it('stores _hxMenuCloseHandler on the wrapper element after attach', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-menu', '');
      wrapper.appendChild(document.createElement('hx-menu'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxMenu.attach(container);

      expect(
        (wrapper as HTMLElement & { _hxMenuCloseHandler?: unknown })._hxMenuCloseHandler,
      ).toBeDefined();

      mockDrupal.behaviors.hxMenu.detach!(container, {}, 'unload');
    });

    it('closes menu on document click outside the wrapper', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-menu', '');
      const menu = document.createElement('hx-menu') as HTMLElement & { open?: boolean };
      menu.open = true;
      wrapper.appendChild(menu);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxMenu.attach(container);
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(menu.open).toBe(false);
      mockDrupal.behaviors.hxMenu.detach!(container, {}, 'unload');
    });

    it('does not close menu on click inside the wrapper', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-menu', '');
      const menu = document.createElement('hx-menu') as HTMLElement & { open?: boolean };
      menu.open = true;
      wrapper.appendChild(menu);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxMenu.attach(container);
      // Dispatch click that bubbles from inside the wrapper
      menu.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(menu.open).toBe(true);
      mockDrupal.behaviors.hxMenu.detach!(container, {}, 'unload');
    });

    it('closes menu on Escape keydown', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-menu', '');
      const menu = document.createElement('hx-menu') as HTMLElement & { open?: boolean };
      menu.open = true;
      wrapper.appendChild(menu);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxMenu.attach(container);
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(menu.open).toBe(false);
      mockDrupal.behaviors.hxMenu.detach!(container, {}, 'unload');
    });

    it('does not close menu on non-Escape keydown', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-menu', '');
      const menu = document.createElement('hx-menu') as HTMLElement & { open?: boolean };
      menu.open = true;
      wrapper.appendChild(menu);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxMenu.attach(container);
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(menu.open).toBe(true);
      mockDrupal.behaviors.hxMenu.detach!(container, {}, 'unload');
    });

    it('removes _hxMenuCloseHandler on detach with trigger "unload"', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-menu', '');
      wrapper.appendChild(document.createElement('hx-menu'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxMenu.attach(container);
      mockDrupal.behaviors.hxMenu.detach!(container, {}, 'unload');

      expect(
        (wrapper as HTMLElement & { _hxMenuCloseHandler?: unknown })._hxMenuCloseHandler,
      ).toBeUndefined();
    });

    it('allows re-attachment after detach', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-menu', '');
      wrapper.appendChild(document.createElement('hx-menu'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxMenu.attach(container);
      mockDrupal.behaviors.hxMenu.detach!(container, {}, 'unload');

      const reattached = mockOnce('hx-menu', '[data-drupal-menu]', container);
      expect(reattached).toHaveLength(1);
    });

    it('handles missing hx-menu child element gracefully', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-menu', '');
      container.appendChild(wrapper);

      expect(() => mockDrupal.behaviors.hxMenu.attach(container)).not.toThrow();
    });
  });

  // ─── hxTabs ────────────────────────────────────────────────────────────────

  describe('hxTabs behavior', () => {
    it('attaches to [data-drupal-tabs] elements', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tabs', '');
      wrapper.appendChild(document.createElement('hx-tabs'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTabs.attach(container);

      const secondCall = mockOnce('hx-tabs', '[data-drupal-tabs]', container);
      expect(secondCall).toHaveLength(0);
    });

    it('sets active attribute from data-active-tab', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tabs', '');
      wrapper.setAttribute('data-active-tab', 'overview');
      const tabs = document.createElement('hx-tabs');
      wrapper.appendChild(tabs);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTabs.attach(container);

      expect(tabs.getAttribute('active')).toBe('overview');
    });

    it('prioritizes URL hash over data-active-tab', () => {
      history.pushState(null, '', '#profile');
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tabs', '');
      wrapper.setAttribute('data-active-tab', 'overview');
      const tabs = document.createElement('hx-tabs');
      wrapper.appendChild(tabs);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTabs.attach(container);

      expect(tabs.getAttribute('active')).toBe('profile');
      history.pushState(null, '', window.location.pathname);
    });

    it('does not set active attribute when no hash and no data-active-tab', () => {
      history.pushState(null, '', window.location.pathname);
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tabs', '');
      const tabs = document.createElement('hx-tabs');
      wrapper.appendChild(tabs);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTabs.attach(container);

      expect(tabs.getAttribute('active')).toBeNull();
    });

    it('syncs URL hash on hx-change event', () => {
      const replaceStateSpy = vi.spyOn(history, 'replaceState');
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tabs', '');
      const tabs = document.createElement('hx-tabs');
      wrapper.appendChild(tabs);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTabs.attach(container);
      tabs.dispatchEvent(new CustomEvent('hx-change', { detail: { value: 'settings' } }));

      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#settings');
      replaceStateSpy.mockRestore();
    });

    it('does not sync URL hash when hx-change detail has no value', () => {
      const replaceStateSpy = vi.spyOn(history, 'replaceState');
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tabs', '');
      const tabs = document.createElement('hx-tabs');
      wrapper.appendChild(tabs);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTabs.attach(container);
      tabs.dispatchEvent(new CustomEvent('hx-change', { detail: null }));

      expect(replaceStateSpy).not.toHaveBeenCalled();
      replaceStateSpy.mockRestore();
    });

    it('allows re-attachment after detach', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tabs', '');
      wrapper.appendChild(document.createElement('hx-tabs'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTabs.attach(container);
      mockDrupal.behaviors.hxTabs.detach!(container, {}, 'unload');

      const reattached = mockOnce('hx-tabs', '[data-drupal-tabs]', container);
      expect(reattached).toHaveLength(1);
    });

    it('handles missing hx-tabs child element gracefully', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tabs', '');
      container.appendChild(wrapper);

      expect(() => mockDrupal.behaviors.hxTabs.attach(container)).not.toThrow();
    });
  });

  // ─── hxPopover ─────────────────────────────────────────────────────────────

  describe('hxPopover behavior', () => {
    it('attaches to [data-drupal-popover] elements', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      wrapper.appendChild(document.createElement('hx-popover'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxPopover.attach(container);

      const secondCall = mockOnce('hx-popover', '[data-drupal-popover]', container);
      expect(secondCall).toHaveLength(0);
    });

    it('applies data-placement to hx-popover element', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      wrapper.setAttribute('data-placement', 'bottom');
      const popover = document.createElement('hx-popover');
      wrapper.appendChild(popover);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxPopover.attach(container);

      expect(popover.getAttribute('placement')).toBe('bottom');
    });

    it('closes popover on Escape keydown', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      const popover = document.createElement('hx-popover') as HTMLElement & { open?: boolean };
      popover.open = true;
      wrapper.appendChild(popover);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxPopover.attach(container);
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(popover.open).toBe(false);
    });

    it('does not close popover on non-Escape keydown', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      const popover = document.createElement('hx-popover') as HTMLElement & { open?: boolean };
      popover.open = true;
      wrapper.appendChild(popover);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxPopover.attach(container);
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(popover.open).toBe(true);
    });

    it('stores _hxPopoverCloseHandler when data-trigger="click"', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      wrapper.setAttribute('data-trigger', 'click');
      wrapper.appendChild(document.createElement('hx-popover'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxPopover.attach(container);

      expect(
        (wrapper as HTMLElement & { _hxPopoverCloseHandler?: unknown })._hxPopoverCloseHandler,
      ).toBeDefined();

      mockDrupal.behaviors.hxPopover.detach!(container, {}, 'unload');
    });

    it('does not store _hxPopoverCloseHandler for non-click triggers', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      wrapper.setAttribute('data-trigger', 'hover');
      wrapper.appendChild(document.createElement('hx-popover'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxPopover.attach(container);

      expect(
        (wrapper as HTMLElement & { _hxPopoverCloseHandler?: unknown })._hxPopoverCloseHandler,
      ).toBeUndefined();
    });

    it('closes click-triggered popover on document click outside', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      wrapper.setAttribute('data-trigger', 'click');
      const popover = document.createElement('hx-popover') as HTMLElement & { open?: boolean };
      popover.open = true;
      wrapper.appendChild(popover);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxPopover.attach(container);
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(popover.open).toBe(false);
      mockDrupal.behaviors.hxPopover.detach!(container, {}, 'unload');
    });

    it('removes _hxPopoverCloseHandler on detach with trigger "unload"', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      wrapper.setAttribute('data-trigger', 'click');
      wrapper.appendChild(document.createElement('hx-popover'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxPopover.attach(container);
      mockDrupal.behaviors.hxPopover.detach!(container, {}, 'unload');

      expect(
        (wrapper as HTMLElement & { _hxPopoverCloseHandler?: unknown })._hxPopoverCloseHandler,
      ).toBeUndefined();
    });

    it('allows re-attachment after detach', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      wrapper.appendChild(document.createElement('hx-popover'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxPopover.attach(container);
      mockDrupal.behaviors.hxPopover.detach!(container, {}, 'unload');

      const reattached = mockOnce('hx-popover', '[data-drupal-popover]', container);
      expect(reattached).toHaveLength(1);
    });

    it('handles missing hx-popover child element gracefully', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-popover', '');
      container.appendChild(wrapper);

      expect(() => mockDrupal.behaviors.hxPopover.attach(container)).not.toThrow();
    });
  });

  // ─── hxToast ───────────────────────────────────────────────────────────────

  describe('hxToast behavior', () => {
    it('attaches to [data-drupal-toast] elements', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-toast', '');
      wrapper.appendChild(document.createElement('hx-toast'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxToast.attach(container);

      const secondCall = mockOnce('hx-toast', '[data-drupal-toast]', container);
      expect(secondCall).toHaveLength(0);
    });

    it('sets duration attribute from data-duration', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-toast', '');
      wrapper.setAttribute('data-duration', '5000');
      const toast = document.createElement('hx-toast');
      wrapper.appendChild(toast);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxToast.attach(container);

      expect(toast.getAttribute('duration')).toBe('5000');
    });

    it('does not set duration attribute when data-duration is zero', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-toast', '');
      wrapper.setAttribute('data-duration', '0');
      const toast = document.createElement('hx-toast');
      wrapper.appendChild(toast);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxToast.attach(container);

      expect(toast.getAttribute('duration')).toBeNull();
    });

    it('does not set duration attribute when data-duration is non-numeric', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-toast', '');
      wrapper.setAttribute('data-duration', 'auto');
      const toast = document.createElement('hx-toast');
      wrapper.appendChild(toast);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxToast.attach(container);

      expect(toast.getAttribute('duration')).toBeNull();
    });

    it('auto-shows toast when data-show="true"', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-toast', '');
      wrapper.setAttribute('data-show', 'true');
      const toast = document.createElement('hx-toast') as HTMLElement & { open?: boolean };
      wrapper.appendChild(toast);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxToast.attach(container);

      expect(toast.open).toBe(true);
    });

    it('does not auto-show toast when data-show is absent', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-toast', '');
      const toast = document.createElement('hx-toast') as HTMLElement & { open?: boolean };
      wrapper.appendChild(toast);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxToast.attach(container);

      expect(toast.open).toBeUndefined();
    });

    it('closes toast when [data-toast-close] button is clicked', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-toast', '');
      const toast = document.createElement('hx-toast') as HTMLElement & { open?: boolean };
      toast.open = true;
      const closeBtn = document.createElement('button');
      closeBtn.setAttribute('data-toast-close', '');
      wrapper.appendChild(toast);
      wrapper.appendChild(closeBtn);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxToast.attach(container);
      closeBtn.click();

      expect(toast.open).toBe(false);
    });

    it('allows re-attachment after detach', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-toast', '');
      wrapper.appendChild(document.createElement('hx-toast'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxToast.attach(container);
      mockDrupal.behaviors.hxToast.detach!(container, {}, 'unload');

      const reattached = mockOnce('hx-toast', '[data-drupal-toast]', container);
      expect(reattached).toHaveLength(1);
    });

    it('handles missing hx-toast child element gracefully', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-toast', '');
      container.appendChild(wrapper);

      expect(() => mockDrupal.behaviors.hxToast.attach(container)).not.toThrow();
    });
  });

  // ─── hxTooltip ─────────────────────────────────────────────────────────────

  describe('hxTooltip behavior', () => {
    it('attaches to [data-drupal-tooltip] elements', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tooltip', '');
      wrapper.appendChild(document.createElement('hx-tooltip'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTooltip.attach(container);

      const secondCall = mockOnce('hx-tooltip', '[data-drupal-tooltip]', container);
      expect(secondCall).toHaveLength(0);
    });

    it('applies data-content to hx-tooltip element', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tooltip', '');
      wrapper.setAttribute('data-content', 'More information');
      const tooltip = document.createElement('hx-tooltip');
      wrapper.appendChild(tooltip);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTooltip.attach(container);

      expect(tooltip.getAttribute('content')).toBe('More information');
    });

    it('applies data-placement to hx-tooltip element', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tooltip', '');
      wrapper.setAttribute('data-placement', 'top');
      const tooltip = document.createElement('hx-tooltip');
      wrapper.appendChild(tooltip);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTooltip.attach(container);

      expect(tooltip.getAttribute('placement')).toBe('top');
    });

    it('dismisses tooltip on Escape keydown', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tooltip', '');
      const tooltip = document.createElement('hx-tooltip') as HTMLElement & { open?: boolean };
      tooltip.open = true;
      wrapper.appendChild(tooltip);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTooltip.attach(container);
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(tooltip.open).toBe(false);
    });

    it('does not dismiss tooltip on non-Escape keydown', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tooltip', '');
      const tooltip = document.createElement('hx-tooltip') as HTMLElement & { open?: boolean };
      tooltip.open = true;
      wrapper.appendChild(tooltip);
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTooltip.attach(container);
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(tooltip.open).toBe(true);
    });

    it('allows re-attachment after detach', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tooltip', '');
      wrapper.appendChild(document.createElement('hx-tooltip'));
      container.appendChild(wrapper);

      mockDrupal.behaviors.hxTooltip.attach(container);
      mockDrupal.behaviors.hxTooltip.detach!(container, {}, 'unload');

      const reattached = mockOnce('hx-tooltip', '[data-drupal-tooltip]', container);
      expect(reattached).toHaveLength(1);
    });

    it('handles missing hx-tooltip child element gracefully', () => {
      const container = createContainer();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tooltip', '');
      container.appendChild(wrapper);

      expect(() => mockDrupal.behaviors.hxTooltip.attach(container)).not.toThrow();
    });
  });

  // ─── DOM Mutation Handling ─────────────────────────────────────────────────

  describe('DOM mutation: dynamically added elements', () => {
    it('attaches to elements added to the DOM after initial load', () => {
      const container = createContainer();

      // Simulate Drupal AJAX: element added after initial page load
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.appendChild(document.createElement('hx-accordion'));
      container.appendChild(wrapper);

      // Behavior called on newly added context (AJAX response container)
      mockDrupal.behaviors.hxAccordion.attach(container);

      const secondCall = mockOnce('hx-accordion', '[data-drupal-accordion]', container);
      expect(secondCall).toHaveLength(0);
    });

    it('ignores elements outside the provided context', () => {
      const contextA = createContainer();
      const contextB = createContainer();

      const wrapperA = document.createElement('div');
      wrapperA.setAttribute('data-drupal-accordion', '');
      wrapperA.appendChild(document.createElement('hx-accordion'));
      contextA.appendChild(wrapperA);

      const wrapperB = document.createElement('div');
      wrapperB.setAttribute('data-drupal-accordion', '');
      wrapperB.appendChild(document.createElement('hx-accordion'));
      contextB.appendChild(wrapperB);

      // Only attach with contextA as the context
      mockDrupal.behaviors.hxAccordion.attach(contextA);

      // wrapperA is attached
      const checkA = mockOnce('hx-accordion', '[data-drupal-accordion]', contextA);
      expect(checkA).toHaveLength(0);

      // wrapperB is NOT attached (different context)
      expect(attachedElements.get('hx-accordion')?.has(wrapperA)).toBe(true);
      expect(attachedElements.get('hx-accordion')?.has(wrapperB)).toBe(false);
    });
  });
});
