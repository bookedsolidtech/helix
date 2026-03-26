/**
 * @file
 * Integration tests for HELiX Drupal behaviors.
 *
 * Tests behavior attachment, data-attribute parsing, detach lifecycle,
 * and once() pattern compliance using mocked Drupal globals.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Drupal global
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

// Mock once() function
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

// Inject globals before loading behaviors
(globalThis as Record<string, unknown>).Drupal = mockDrupal;
(globalThis as Record<string, unknown>).once = mockOnce;

describe('HELiX Drupal Behaviors', () => {
  beforeEach(() => {
    // Clear attached elements tracking
    attachedElements.clear();
    // Reset behavior registrations
    mockDrupal.behaviors = {};
    mockDrupal.announce.mockClear();
  });

  describe('Behavior registration', () => {
    it('registers all expected behaviors on the Drupal global', async () => {
      // Dynamically import to trigger IIFE registration
      await import('../src/index.js');

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

      for (const name of expectedBehaviors) {
        expect(mockDrupal.behaviors[name], `Missing behavior: ${name}`).toBeDefined();
        expect(typeof mockDrupal.behaviors[name].attach).toBe('function');
      }
    });

    it('each behavior has an attach function', async () => {
      await import('../src/index.js');
      for (const [name, behavior] of Object.entries(mockDrupal.behaviors)) {
        expect(typeof behavior.attach, `${name}.attach must be a function`).toBe('function');
      }
    });

    it('each behavior has a detach function', async () => {
      await import('../src/index.js');
      for (const [name, behavior] of Object.entries(mockDrupal.behaviors)) {
        expect(typeof behavior.detach, `${name}.detach must be a function`).toBe('function');
      }
    });
  });

  describe('hxAccordion behavior', () => {
    it('attaches to [data-drupal-accordion] elements', async () => {
      await import('../src/index.js');

      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      const accordion = document.createElement('hx-accordion');
      wrapper.appendChild(accordion);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      mockDrupal.behaviors.hxAccordion.attach(container);

      // Element should now be in the once() set — second call returns empty
      const secondCall: Element[] = mockOnce('hx-accordion', '[data-drupal-accordion]', container);
      expect(secondCall).toHaveLength(0);

      document.body.removeChild(container);
    });

    it('initializes first panel open when data-open-first="true"', async () => {
      await import('../src/index.js');

      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.setAttribute('data-open-first', 'true');
      const accordion = document.createElement('hx-accordion');
      const panel = document.createElement('hx-accordion-panel');
      accordion.appendChild(panel);
      wrapper.appendChild(accordion);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      mockDrupal.behaviors.hxAccordion.attach(container);

      expect((panel as HTMLElement & { open?: boolean }).open).toBe(true);

      document.body.removeChild(container);
    });

    it('removes once() attachment on detach with trigger "unload"', async () => {
      await import('../src/index.js');

      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.appendChild(document.createElement('hx-accordion'));
      container.appendChild(wrapper);
      document.body.appendChild(container);

      mockDrupal.behaviors.hxAccordion.attach(container);
      mockDrupal.behaviors.hxAccordion.detach!(container, {}, 'unload');

      // Should be re-attachable after detach
      const reattached = mockOnce('hx-accordion', '[data-drupal-accordion]', container);
      expect(reattached).toHaveLength(1);

      document.body.removeChild(container);
    });
  });

  describe('hxDialog behavior', () => {
    it('attaches to [data-drupal-dialog] elements', async () => {
      await import('../src/index.js');

      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-dialog', '');
      wrapper.appendChild(document.createElement('hx-dialog'));
      container.appendChild(wrapper);
      document.body.appendChild(container);

      mockDrupal.behaviors.hxDialog.attach(container);

      const secondCall = mockOnce('hx-dialog', '[data-drupal-dialog]', container);
      expect(secondCall).toHaveLength(0);

      document.body.removeChild(container);
    });
  });

  describe('hxTabs behavior', () => {
    it('sets active tab from data-active-tab attribute', async () => {
      await import('../src/index.js');

      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-tabs', '');
      wrapper.setAttribute('data-active-tab', 'settings');
      const tabs = document.createElement('hx-tabs');
      wrapper.appendChild(tabs);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      mockDrupal.behaviors.hxTabs.attach(container);

      expect(tabs.getAttribute('active')).toBe('settings');

      document.body.removeChild(container);
    });
  });

  describe('once() pattern compliance', () => {
    it('does not attach the same element twice on repeated attach calls', async () => {
      await import('../src/index.js');

      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-drupal-accordion', '');
      wrapper.appendChild(document.createElement('hx-accordion'));
      container.appendChild(wrapper);
      document.body.appendChild(container);

      mockDrupal.behaviors.hxAccordion.attach(container);
      mockDrupal.behaviors.hxAccordion.attach(container); // Second call — should be no-op

      // Verify only attached once (set size = 1)
      expect(attachedElements.get('hx-accordion')?.size).toBe(1);

      document.body.removeChild(container);
    });
  });
});
