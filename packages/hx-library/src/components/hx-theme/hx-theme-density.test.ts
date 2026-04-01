import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup } from '../../test-utils.js';
import type { HelixTheme } from './hx-theme.js';
import './index.js';

afterEach(cleanup);

/** Returns the computed value of a CSS custom property on an element. */
function getCssVar(el: HTMLElement, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

describe('hx-theme density attribute', () => {
  // ─── Property defaults ──────────────────────────────────────────────────

  describe('Property: density', () => {
    it('defaults to "comfortable"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.density).toBe('comfortable');
    });

    it('reflects density attribute to host', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="compact">Content</hx-theme>');
      expect(el.getAttribute('density')).toBe('compact');
    });

    it('reflects "spacious" density attribute to host', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="spacious">Content</hx-theme>');
      expect(el.getAttribute('density')).toBe('spacious');
    });

    it('reflects "comfortable" density attribute to host', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="comfortable">Content</hx-theme>');
      expect(el.getAttribute('density')).toBe('comfortable');
    });

    it('accepts "compact" density', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="compact">Content</hx-theme>');
      expect(el.density).toBe('compact');
    });

    it('accepts "spacious" density', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="spacious">Content</hx-theme>');
      expect(el.density).toBe('spacious');
    });

    it('accepts "comfortable" density', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="comfortable">Content</hx-theme>');
      expect(el.density).toBe('comfortable');
    });
  });

  // ─── Compact density token overrides ────────────────────────────────────

  describe('Compact density token overrides', () => {
    it('applies --hx-space-4 = 0.75rem in compact mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="compact">Content</hx-theme>');
      await el.updateComplete;
      const value = getCssVar(el, '--hx-space-4');
      expect(value).toBe('0.75rem');
    });

    it('applies --hx-space-1 = 0.1875rem in compact mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="compact">Content</hx-theme>');
      await el.updateComplete;
      expect(getCssVar(el, '--hx-space-1')).toBe('0.1875rem');
    });

    it('applies --hx-space-8 = 1.5rem in compact mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="compact">Content</hx-theme>');
      await el.updateComplete;
      expect(getCssVar(el, '--hx-space-8')).toBe('1.5rem');
    });

    it('applies --hx-input-height-md = 2rem in compact mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="compact">Content</hx-theme>');
      await el.updateComplete;
      expect(getCssVar(el, '--hx-input-height-md')).toBe('2rem');
    });
  });

  // ─── Spacious density token overrides ───────────────────────────────────

  describe('Spacious density token overrides', () => {
    it('applies --hx-space-4 = 1.25rem in spacious mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="spacious">Content</hx-theme>');
      await el.updateComplete;
      const value = getCssVar(el, '--hx-space-4');
      expect(value).toBe('1.25rem');
    });

    it('applies --hx-space-1 = 0.3125rem in spacious mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="spacious">Content</hx-theme>');
      await el.updateComplete;
      expect(getCssVar(el, '--hx-space-1')).toBe('0.3125rem');
    });

    it('applies --hx-space-8 = 2.5rem in spacious mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="spacious">Content</hx-theme>');
      await el.updateComplete;
      expect(getCssVar(el, '--hx-space-8')).toBe('2.5rem');
    });

    it('applies --hx-input-height-md = 2.75rem in spacious mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="spacious">Content</hx-theme>');
      await el.updateComplete;
      expect(getCssVar(el, '--hx-input-height-md')).toBe('2.75rem');
    });
  });

  // ─── Comfortable density (default — no overrides) ───────────────────────

  describe('Comfortable density (default token values)', () => {
    it('does not apply compact --hx-space-4 in comfortable mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="comfortable">Content</hx-theme>');
      await el.updateComplete;
      const value = getCssVar(el, '--hx-space-4');
      // comfortable uses the base theme value — not the compact 0.75rem or spacious 1.25rem
      expect(value).not.toBe('0.75rem');
      expect(value).not.toBe('1.25rem');
    });

    it('injects a non-empty --hx-space-4 in comfortable mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="comfortable">Content</hx-theme>');
      await el.updateComplete;
      const value = getCssVar(el, '--hx-space-4');
      expect(value).toBeTruthy();
      expect(value.length).toBeGreaterThan(0);
    });

    it('does not override --hx-input-height-md from comfortable baseline', async () => {
      const comfortable = await fixture<HelixTheme>(
        '<hx-theme density="comfortable">Content</hx-theme>',
      );
      await comfortable.updateComplete;
      const comfortableHeight = getCssVar(comfortable, '--hx-input-height-md');

      // Comfortable value must differ from both compact (2rem) and spacious (2.75rem)
      expect(comfortableHeight).not.toBe('2rem');
      expect(comfortableHeight).not.toBe('2.75rem');
    });
  });

  // ─── Density switching ───────────────────────────────────────────────────

  describe('Density switching', () => {
    it('updates tokens when switching from comfortable to compact', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      await el.updateComplete;

      el.density = 'compact';
      await el.updateComplete;

      expect(getCssVar(el, '--hx-space-4')).toBe('0.75rem');
    });

    it('updates tokens when switching from comfortable to spacious', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      await el.updateComplete;

      el.density = 'spacious';
      await el.updateComplete;

      expect(getCssVar(el, '--hx-space-4')).toBe('1.25rem');
    });

    it('updates tokens when switching from compact back to comfortable', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="compact">Content</hx-theme>');
      await el.updateComplete;
      expect(getCssVar(el, '--hx-space-4')).toBe('0.75rem');

      el.density = 'comfortable';
      await el.updateComplete;

      const restored = getCssVar(el, '--hx-space-4');
      expect(restored).not.toBe('0.75rem');
      expect(restored).not.toBe('1.25rem');
    });

    it('updates tokens when switching from spacious to compact', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="spacious">Content</hx-theme>');
      await el.updateComplete;
      expect(getCssVar(el, '--hx-space-4')).toBe('1.25rem');

      el.density = 'compact';
      await el.updateComplete;

      expect(getCssVar(el, '--hx-space-4')).toBe('0.75rem');
    });

    it('reflects updated density attribute after property change', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      await el.updateComplete;

      el.density = 'spacious';
      await el.updateComplete;

      expect(el.getAttribute('density')).toBe('spacious');
    });
  });

  // ─── Density + theme co-existence ───────────────────────────────────────

  describe('Density and theme co-existence', () => {
    it('applies compact density tokens alongside dark theme tokens', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="dark" density="compact">Content</hx-theme>',
      );
      await el.updateComplete;

      // Dark theme shadow token should be present
      const shadow = getCssVar(el, '--hx-shadow-sm');
      expect(shadow).toBe('0 1px 2px 0 rgb(0 0 0 / 0.3)');

      // Compact space override should also be present
      expect(getCssVar(el, '--hx-space-4')).toBe('0.75rem');
    });

    it('applies spacious density tokens alongside dark theme tokens', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="dark" density="spacious">Content</hx-theme>',
      );
      await el.updateComplete;

      const shadow = getCssVar(el, '--hx-shadow-sm');
      expect(shadow).toBe('0 1px 2px 0 rgb(0 0 0 / 0.3)');

      expect(getCssVar(el, '--hx-space-4')).toBe('1.25rem');
    });

    it('applies compact density tokens alongside high-contrast theme', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="high-contrast" density="compact">Content</hx-theme>',
      );
      await el.updateComplete;

      // High-contrast text token should be present
      const textPrimary = getCssVar(el, '--hx-color-text-primary');
      expect(textPrimary.toLowerCase()).toBe('#ffffff');

      // Compact density override should also be present
      expect(getCssVar(el, '--hx-space-4')).toBe('0.75rem');
    });

    it('switching theme preserves active density override', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="light" density="compact">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(getCssVar(el, '--hx-space-4')).toBe('0.75rem');

      el.theme = 'dark';
      await el.updateComplete;

      expect(getCssVar(el, '--hx-space-4')).toBe('0.75rem');
    });
  });
});
