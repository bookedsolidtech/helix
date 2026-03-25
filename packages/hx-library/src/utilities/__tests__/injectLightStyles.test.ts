import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { injectLightStyles } from '../injectLightStyles.js';
import { lightStyleRegistry } from '../lightStyleRegistry.js';

/**
 * Cleanup helper: removes all injected test stylesheets from document.head
 * and clears the registry so tests are isolated.
 */
function cleanupInjectedStyles(): void {
  for (const [name, el] of lightStyleRegistry.entries()) {
    if (name.startsWith('test-')) {
      el.remove();
      lightStyleRegistry.delete(name);
    }
  }
}

describe('injectLightStyles', () => {
  beforeEach(cleanupInjectedStyles);
  afterEach(cleanupInjectedStyles);

  describe('injection', () => {
    it('injects a <style> element into document.head', () => {
      const beforeCount = document.head.querySelectorAll('style[data-hx-light-styles]').length;
      injectLightStyles('test-card', 'p { color: red; }');
      const afterCount = document.head.querySelectorAll('style[data-hx-light-styles]').length;
      expect(afterCount).toBe(beforeCount + 1);
    });

    it('sets data-hx-light-styles attribute to the componentName', () => {
      injectLightStyles('test-banner', 'p { margin: 0; }');
      const el = document.head.querySelector('style[data-hx-light-styles="test-banner"]');
      expect(el).toBeTruthy();
    });

    it('injects scoped CSS content (selector includes [data-hx-styled])', () => {
      injectLightStyles('test-dialog', 'p { font-size: 1rem; }');
      const el = document.head.querySelector(
        'style[data-hx-light-styles="test-dialog"]',
      ) as HTMLStyleElement | null;
      expect(el?.textContent).toContain('[data-hx-styled="test-dialog"]');
    });

    it('preserves CSS property values in the injected content', () => {
      injectLightStyles('test-alert', 'p { font-size: var(--hx-font-size-md); }');
      const el = document.head.querySelector(
        'style[data-hx-light-styles="test-alert"]',
      ) as HTMLStyleElement | null;
      expect(el?.textContent).toContain('var(--hx-font-size-md)');
    });
  });

  describe('deduplication', () => {
    it('only injects one <style> when called twice with the same componentName', () => {
      injectLightStyles('test-tooltip', 'p { color: blue; }');
      injectLightStyles('test-tooltip', 'p { color: green; }');

      const elements = document.head.querySelectorAll(
        'style[data-hx-light-styles="test-tooltip"]',
      );
      expect(elements.length).toBe(1);
    });

    it('keeps the first injection when called twice (second call is no-op)', () => {
      injectLightStyles('test-badge', 'span { color: blue; }');
      injectLightStyles('test-badge', 'span { color: green; }');

      const el = document.head.querySelector(
        'style[data-hx-light-styles="test-badge"]',
      ) as HTMLStyleElement | null;
      expect(el?.textContent).toContain('blue');
      expect(el?.textContent).not.toContain('green');
    });

    it('registers the component in lightStyleRegistry after injection', () => {
      injectLightStyles('test-avatar', 'img { border-radius: 50%; }');
      expect(lightStyleRegistry.has('test-avatar')).toBe(true);
    });

    it('stores the correct HTMLStyleElement in the registry', () => {
      injectLightStyles('test-chip', 'span { padding: 4px; }');
      const registered = lightStyleRegistry.get('test-chip');
      const inDocument = document.head.querySelector('style[data-hx-light-styles="test-chip"]');
      expect(registered).toBe(inDocument);
    });
  });

  describe('isolation between component types', () => {
    it('injects separate stylesheets for different component names', () => {
      injectLightStyles('test-comp-a', 'p { color: red; }');
      injectLightStyles('test-comp-b', 'p { color: blue; }');

      const elA = document.head.querySelector('style[data-hx-light-styles="test-comp-a"]');
      const elB = document.head.querySelector('style[data-hx-light-styles="test-comp-b"]');
      expect(elA).toBeTruthy();
      expect(elB).toBeTruthy();
      expect(elA).not.toBe(elB);
    });
  });
});
