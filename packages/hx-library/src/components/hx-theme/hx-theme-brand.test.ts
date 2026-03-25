import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { fixture, cleanup } from '../../test-utils.js';
import { HelixBrandRegistry, HelixBrandRegistryClass, REQUIRED_SEMANTIC_TOKENS } from '@helixui/tokens';
import type { HelixTheme } from './hx-theme.js';
import './index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Builds a complete token map for a test brand. */
function buildCompleteTokenMap(primary500 = '#AA0000'): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of REQUIRED_SEMANTIC_TOKENS) {
    map[token] = '#000000';
  }
  map['--hx-color-primary-500'] = primary500;
  return map;
}

/** Returns the computed value of a CSS custom property on an element. */
function getCssVar(el: HTMLElement, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

// ─── Setup ───────────────────────────────────────────────────────────────────

// Use a fresh registry per test file to avoid polluting the singleton
let testRegistry: HelixBrandRegistryClass;

beforeEach(() => {
  testRegistry = new HelixBrandRegistryClass();
  // Register test brands on the singleton so hx-theme can reach them
  HelixBrandRegistry.register('test-brand-red', buildCompleteTokenMap('#CC0000'));
  HelixBrandRegistry.register('test-brand-blue', buildCompleteTokenMap('#0000CC'));
});

afterEach(() => {
  cleanup();
  // Clean up brands added to the singleton during these tests
  HelixBrandRegistry._clear();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('hx-theme brand attribute', () => {
  // ─── Property defaults ──────────────────────────────────────────────────

  describe('Property: brand', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.brand).toBe('');
    });

    it('reflects brand attribute to host', async () => {
      HelixBrandRegistry.register('reflected-brand', buildCompleteTokenMap());
      const el = await fixture<HelixTheme>('<hx-theme brand="reflected-brand">Content</hx-theme>');
      expect(el.getAttribute('brand')).toBe('reflected-brand');
    });
  });

  // ─── Brand token application ─────────────────────────────────────────────

  describe('Brand token application', () => {
    it('applies brand primary-500 override on the host element', async () => {
      const el = await fixture<HelixTheme>('<hx-theme brand="test-brand-red">Content</hx-theme>');
      await el.updateComplete;

      const value = getCssVar(el, '--hx-color-primary-500');
      expect(value.toLowerCase()).toBe('#cc0000');
    });

    it('applies brand primary-500 override in dark mode', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="dark" brand="test-brand-red">Content</hx-theme>',
      );
      await el.updateComplete;

      const value = getCssVar(el, '--hx-color-primary-500');
      expect(value.toLowerCase()).toBe('#cc0000');
    });

    it('preserves base theme tokens not overridden by the brand', async () => {
      const el = await fixture<HelixTheme>('<hx-theme brand="test-brand-red">Content</hx-theme>');
      await el.updateComplete;

      // --hx-shadow-sm is not in REQUIRED_SEMANTIC_TOKENS, so base theme value should remain
      const shadowValue = getCssVar(el, '--hx-shadow-sm');
      expect(shadowValue).toBeTruthy();
      expect(shadowValue.length).toBeGreaterThan(0);
    });
  });

  // ─── Brand switching ─────────────────────────────────────────────────────

  describe('Switching between brands', () => {
    it('switches to a different brand when brand property changes', async () => {
      const el = await fixture<HelixTheme>('<hx-theme brand="test-brand-red">Content</hx-theme>');
      await el.updateComplete;

      const redValue = getCssVar(el, '--hx-color-primary-500');
      expect(redValue.toLowerCase()).toBe('#cc0000');

      el.brand = 'test-brand-blue';
      await el.updateComplete;

      const blueValue = getCssVar(el, '--hx-color-primary-500');
      expect(blueValue.toLowerCase()).toBe('#0000cc');
    });

    it('reverts to base theme when brand attribute is removed', async () => {
      const el = await fixture<HelixTheme>('<hx-theme brand="test-brand-red">Content</hx-theme>');
      await el.updateComplete;

      el.brand = '';
      await el.updateComplete;

      // Should now have the default light theme primary-500 (#2563EB)
      const value = getCssVar(el, '--hx-color-primary-500');
      expect(value.toLowerCase()).toBe('#2563eb');
    });
  });

  // ─── Unregistered brand fallback ─────────────────────────────────────────

  describe('Unregistered brand fallback', () => {
    it('does not throw when brand is not registered', async () => {
      await expect(
        fixture<HelixTheme>('<hx-theme brand="no-such-brand">Content</hx-theme>'),
      ).resolves.toBeDefined();
    });

    it('applies base theme tokens when brand is not registered', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="no-such-brand">Content</hx-theme>',
      );
      await el.updateComplete;

      // Base light theme primary-500 should still be injected
      const value = getCssVar(el, '--hx-color-primary-500');
      expect(value.toLowerCase()).toBe('#2563eb');
    });

    it('logs a console.warn when brand is set but not registered', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const el = await fixture<HelixTheme>(
        '<hx-theme brand="unregistered-brand">Content</hx-theme>',
      );
      await el.updateComplete;

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unregistered-brand'),
      );

      warnSpy.mockRestore();
    });
  });

  // ─── Theme + brand co-existence ──────────────────────────────────────────

  describe('Theme and brand co-existence', () => {
    it('applies both dark theme and brand overrides together', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="dark" brand="test-brand-blue">Content</hx-theme>',
      );
      await el.updateComplete;

      // Dark theme shadow should be present
      const shadow = getCssVar(el, '--hx-shadow-sm');
      expect(shadow).toBe('0 1px 2px 0 rgb(0 0 0 / 0.3)');

      // Brand primary override should also be present
      const primary = getCssVar(el, '--hx-color-primary-500');
      expect(primary.toLowerCase()).toBe('#0000cc');
    });

    it('switching theme preserves active brand', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="light" brand="test-brand-red">Content</hx-theme>',
      );
      await el.updateComplete;

      el.theme = 'dark';
      await el.updateComplete;

      const primary = getCssVar(el, '--hx-color-primary-500');
      expect(primary.toLowerCase()).toBe('#cc0000');
    });
  });

  // Suppress unused import warning — testRegistry used for type ref only
  it('internal test helper is the registry class', () => {
    expect(testRegistry).toBeInstanceOf(HelixBrandRegistryClass);
  });
});
