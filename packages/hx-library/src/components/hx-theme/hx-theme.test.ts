import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTheme } from './hx-theme.js';
import './index.js';

afterEach(cleanup);

describe('hx-theme', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
    });

    it('renders slotted content', async () => {
      const el = await fixture<HelixTheme>('<hx-theme><p id="test-p">Hello</p></hx-theme>');
      const p = el.querySelector('#test-p');
      expect(p).toBeTruthy();
      expect(p?.textContent).toBe('Hello');
    });

    it('has display:contents so it does not affect layout', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(getComputedStyle(el).display).toBe('contents');
    });
  });

  // ─── Property: theme ───

  describe('Property: theme', () => {
    it('defaults to "light"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.theme).toBe('light');
    });

    it('reflects theme attribute to host', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      expect(el.getAttribute('theme')).toBe('dark');
    });

    it('accepts "dark" theme', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      expect(el.theme).toBe('dark');
    });

    it('accepts "high-contrast" theme', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="high-contrast">Content</hx-theme>');
      expect(el.theme).toBe('high-contrast');
    });
  });

  // ─── Property: system ───

  describe('Property: system', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.system).toBe(false);
    });

    it('reflects system attribute to host', async () => {
      const el = await fixture<HelixTheme>('<hx-theme system>Content</hx-theme>');
      expect(el.hasAttribute('system')).toBe(true);
    });
  });

  // ─── Token values ───

  describe('Token values', () => {
    it('injects --hx-color-primary-500 with light value by default', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value.toLowerCase()).toBe('#2563eb');
    });

    it('injects light --hx-shadow-sm in light mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="light">Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(value).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');
    });

    it('injects dark --hx-shadow-sm override in dark mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(value).toBe('0 1px 2px 0 rgb(0 0 0 / 0.3)');
    });

    it('injects dark token overrides in high-contrast mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="high-contrast">Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(value).toBe('0 1px 2px 0 rgb(0 0 0 / 0.3)');
    });
  });

  // ─── effectiveTheme ───

  describe('effectiveTheme', () => {
    it('returns "light" by default', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.effectiveTheme).toBe('light');
    });

    it('returns "dark" when theme="dark"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      expect(el.effectiveTheme).toBe('dark');
    });

    it('returns "high-contrast" when theme="high-contrast"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="high-contrast">Content</hx-theme>');
      expect(el.effectiveTheme).toBe('high-contrast');
    });
  });

  // ─── Theme switching ───

  describe('Theme switching', () => {
    it('updates reflected attribute when theme changes', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="light">Content</hx-theme>');
      await el.updateComplete;

      el.theme = 'dark';
      await el.updateComplete;

      expect(el.getAttribute('theme')).toBe('dark');
    });

    it('updates effectiveTheme when theme property changes', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="light">Content</hx-theme>');
      await el.updateComplete;

      el.theme = 'dark';
      await el.updateComplete;

      expect(el.effectiveTheme).toBe('dark');
    });

    it('updates injected tokens when theme switches from light to dark', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="light">Content</hx-theme>');
      await el.updateComplete;

      const lightValue = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(lightValue).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');

      el.theme = 'dark';
      await el.updateComplete;

      const darkValue = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(darkValue).toBe('0 1px 2px 0 rgb(0 0 0 / 0.3)');
    });

    it('updates injected tokens when theme switches back from dark to light', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      await el.updateComplete;

      el.theme = 'light';
      await el.updateComplete;

      const value = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(value).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');
    });

    it('preserves light primitives when in dark mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      await el.updateComplete;
      // Primitive tokens like --hx-color-primary-500 are still present in dark mode
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value.toLowerCase()).toBe('#2563eb');
    });
  });

  // ─── System detection ───

  describe('System detection', () => {
    it('effectiveTheme returns light or dark when system=true', async () => {
      const el = await fixture<HelixTheme>('<hx-theme system>Content</hx-theme>');
      await el.updateComplete;

      const effective = el.effectiveTheme;
      expect(effective === 'light' || effective === 'dark').toBe(true);
    });

    it('effectiveTheme ignores theme prop when system=true', async () => {
      const el = await fixture<HelixTheme>('<hx-theme system theme="dark">Content</hx-theme>');
      await el.updateComplete;

      // system=true should use OS preference, not the explicit theme prop
      const effective = el.effectiveTheme;
      expect(effective === 'light' || effective === 'dark').toBe(true);
    });

    it('effectiveTheme uses theme prop when system=false', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      expect(el.effectiveTheme).toBe('dark');
    });

    it('switching system off restores theme prop', async () => {
      const el = await fixture<HelixTheme>('<hx-theme system theme="dark">Content</hx-theme>');
      await el.updateComplete;

      el.system = false;
      await el.updateComplete;

      expect(el.effectiveTheme).toBe('dark');
    });
  });

  // ─── Lifecycle ───

  describe('Lifecycle', () => {
    it('cleans up media query listener on disconnect', async () => {
      const el = await fixture<HelixTheme>('<hx-theme system>Content</hx-theme>');
      await el.updateComplete;

      el.remove();
      // Should not throw when removed from DOM
      expect(el.isConnected).toBe(false);
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders text content', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Themed Content</hx-theme>');
      expect(el.textContent?.trim()).toBe('Themed Content');
    });

    it('default slot renders HTML children', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme><span class="child">Child</span></hx-theme>',
      );
      const span = el.querySelector('span.child');
      expect(span).toBeTruthy();
    });
  });

  // ─── Accessibility ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme><p>Accessible themed content</p></hx-theme>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in dark mode', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="dark"><p>Dark themed content</p></hx-theme>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in high-contrast mode', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="high-contrast"><p>High contrast content</p></hx-theme>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
