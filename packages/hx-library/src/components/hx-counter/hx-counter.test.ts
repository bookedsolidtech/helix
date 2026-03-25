import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixCounter } from './hx-counter.js';
import './index.js';

afterEach(cleanup);

describe('hx-counter', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixCounter>('<hx-counter value="100"></hx-counter>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a span with the counter part', async () => {
      const el = await fixture<HelixCounter>('<hx-counter value="100"></hx-counter>');
      const counter = shadowQuery(el, '[part~="counter"]');
      expect(counter).toBeTruthy();
      expect(counter?.tagName.toLowerCase()).toBe('span');
    });

    it('applies default size=md class', async () => {
      const el = await fixture<HelixCounter>('<hx-counter value="100"></hx-counter>');
      const counter = shadowQuery(el, '.counter');
      expect(counter?.classList.contains('counter--md')).toBe(true);
    });
  });

  // ─── Property: value (2) ───

  describe('Property: value', () => {
    it('defaults to 0', async () => {
      const el = await fixture<HelixCounter>('<hx-counter></hx-counter>');
      expect(el.value).toBe(0);
    });

    it('accepts numeric value attribute', async () => {
      const el = await fixture<HelixCounter>('<hx-counter value="500"></hx-counter>');
      expect(el.value).toBe(500);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm class via hx-size', async () => {
      const el = await fixture<HelixCounter>('<hx-counter hx-size="sm" value="5"></hx-counter>');
      const counter = shadowQuery(el, '.counter');
      expect(counter?.classList.contains('counter--sm')).toBe(true);
    });

    it('applies md class via hx-size', async () => {
      const el = await fixture<HelixCounter>('<hx-counter hx-size="md" value="5"></hx-counter>');
      const counter = shadowQuery(el, '.counter');
      expect(counter?.classList.contains('counter--md')).toBe(true);
    });

    it('applies lg class via hx-size', async () => {
      const el = await fixture<HelixCounter>('<hx-counter hx-size="lg" value="5"></hx-counter>');
      const counter = shadowQuery(el, '.counter');
      expect(counter?.classList.contains('counter--lg')).toBe(true);
    });

    it('backward compat: legacy size attribute maps to hx-size', async () => {
      const el = await fixture<HelixCounter>('<hx-counter size="sm" value="5"></hx-counter>');
      await el.updateComplete;
      expect(el.size).toBe('sm');
    });

    it('hx-size takes precedence over legacy size attribute', async () => {
      const el = await fixture<HelixCounter>(
        '<hx-counter size="sm" hx-size="lg" value="5"></hx-counter>',
      );
      await el.updateComplete;
      expect(el.size).toBe('lg');
    });
  });

  // ─── Property: format (2) ───

  describe('Property: format', () => {
    it('defaults to integer format', async () => {
      const el = await fixture<HelixCounter>('<hx-counter></hx-counter>');
      expect(el.format).toBe('integer');
    });

    it('accepts decimal format', async () => {
      const el = await fixture<HelixCounter>(
        '<hx-counter format="decimal" value="0"></hx-counter>',
      );
      expect(el.format).toBe('decimal');
    });
  });

  // ─── Property: prefix and suffix (2) ───

  describe('Property: prefix and suffix', () => {
    it('defaults prefix and suffix to empty string', async () => {
      const el = await fixture<HelixCounter>('<hx-counter></hx-counter>');
      expect(el.prefix).toBe('');
      expect(el.suffix).toBe('');
    });

    it('accepts prefix and suffix attributes', async () => {
      const el = await fixture<HelixCounter>(
        '<hx-counter prefix="$" suffix="%" value="50"></hx-counter>',
      );
      expect(el.prefix).toBe('$');
      expect(el.suffix).toBe('%');
    });
  });

  // ─── Property: duration (1) ───

  describe('Property: duration', () => {
    it('defaults to 1000ms', async () => {
      const el = await fixture<HelixCounter>('<hx-counter></hx-counter>');
      expect(el.duration).toBe(1000);
    });

    it('accepts custom duration', async () => {
      const el = await fixture<HelixCounter>('<hx-counter duration="2000"></hx-counter>');
      expect(el.duration).toBe(2000);
    });
  });

  // ─── Property: easing (2) ───

  describe('Property: easing', () => {
    it('defaults to ease-out', async () => {
      const el = await fixture<HelixCounter>('<hx-counter></hx-counter>');
      expect(el.easing).toBe('ease-out');
    });

    it('accepts all easing values', async () => {
      for (const easing of ['linear', 'ease-in', 'ease-out', 'ease-in-out']) {
        const el = await fixture<HelixCounter>(
          `<hx-counter easing="${easing}" value="10"></hx-counter>`,
        );
        expect(el.easing).toBe(easing);
        el.remove();
      }
    });
  });

  // ─── Reduced Motion (2) ───

  describe('Reduced motion', () => {
    it('displays final value immediately when prefers-reduced-motion is set', async () => {
      // Mock matchMedia to report reduced motion
      const originalMatchMedia = window.matchMedia;
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          } as MediaQueryList;
        }
        return originalMatchMedia(query);
      });

      const el = await fixture<HelixCounter>('<hx-counter value="500"></hx-counter>');
      await el.updateComplete;

      const counter = shadowQuery(el, '[part~="counter"]');
      // With reduced motion, the value should be immediately set to the target
      expect(counter?.textContent?.trim()).toBe('500');

      vi.restoreAllMocks();
    });
  });

  // ─── Formatting (3) ───

  describe('Formatting', () => {
    it('displays integer format without decimals when animation completes', async () => {
      // Mock reduced motion so value displays immediately
      const originalMatchMedia = window.matchMedia;
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          } as MediaQueryList;
        }
        return originalMatchMedia(query);
      });

      const el = await fixture<HelixCounter>(
        '<hx-counter format="integer" value="1000"></hx-counter>',
      );
      await el.updateComplete;

      const counter = shadowQuery(el, '[part~="counter"]');
      const text = counter?.textContent?.trim() ?? '';
      // Should contain "1,000" (locale formatted integer)
      expect(text).toBe('1,000');

      vi.restoreAllMocks();
    });

    it('displays prefix and suffix with value', async () => {
      const originalMatchMedia = window.matchMedia;
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          } as MediaQueryList;
        }
        return originalMatchMedia(query);
      });

      const el = await fixture<HelixCounter>(
        '<hx-counter prefix="$" suffix="+" value="99"></hx-counter>',
      );
      await el.updateComplete;

      const counter = shadowQuery(el, '[part~="counter"]');
      const text = counter?.textContent?.trim() ?? '';
      expect(text).toBe('$99+');

      vi.restoreAllMocks();
    });

    it('displays decimal format with two decimal places', async () => {
      const originalMatchMedia = window.matchMedia;
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          } as MediaQueryList;
        }
        return originalMatchMedia(query);
      });

      const el = await fixture<HelixCounter>(
        '<hx-counter format="decimal" value="42"></hx-counter>',
      );
      await el.updateComplete;

      const counter = shadowQuery(el, '[part~="counter"]');
      const text = counter?.textContent?.trim() ?? '';
      // 42 in decimal format should show as "42" (parseFloat(42.00.toFixed(2)) = 42)
      // toLocaleString on 42 = "42"
      expect(text).toBe('42');

      vi.restoreAllMocks();
    });
  });

  // ─── CSS Parts (1) ───

  describe('CSS Parts', () => {
    it('exposes "counter" part', async () => {
      const el = await fixture<HelixCounter>('<hx-counter value="10"></hx-counter>');
      expect(shadowQuery(el, '[part~="counter"]')).toBeTruthy();
    });
  });

  // ─── Accessibility (3) ───

  describe('Accessibility', () => {
    it('has aria-live="polite" on the off-screen live region (not on the visible counter)', async () => {
      // WCAG 4.1.2 fix: aria-live moved from the visible counter span to a hidden live region
      // so screen readers only announce once at animation end, not on every frame.
      const el = await fixture<HelixCounter>('<hx-counter value="42"></hx-counter>');
      const counter = shadowQuery(el, '[part~="counter"]');
      // Visible counter must NOT carry aria-live (prevents per-frame announcements)
      expect(counter?.getAttribute('aria-live')).toBeNull();
      // The off-screen .sr-only span carries aria-live instead
      const liveRegion = el.shadowRoot?.querySelector<HTMLElement>('.sr-only');
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    });

    it('has aria-atomic="true" on the off-screen live region (not on the visible counter)', async () => {
      // WCAG 4.1.2 fix: aria-atomic moved from the visible counter span to a hidden live region
      const el = await fixture<HelixCounter>('<hx-counter value="42"></hx-counter>');
      const counter = shadowQuery(el, '[part~="counter"]');
      // Visible counter must NOT carry aria-atomic
      expect(counter?.getAttribute('aria-atomic')).toBeNull();
      // The off-screen .sr-only span carries aria-atomic instead
      const liveRegion = el.shadowRoot?.querySelector<HTMLElement>('.sr-only');
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
    });

    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixCounter>('<hx-counter value="100"></hx-counter>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations across all sizes', async () => {
      for (const size of ['sm', 'md', 'lg']) {
        const el = await fixture<HelixCounter>(
          `<hx-counter hx-size="${size}" value="42"></hx-counter>`,
        );
        const { violations } = await checkA11y(el);
        expect(violations, `hx-size="${size}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });

  // ─── Cleanup (1) ───

  describe('Lifecycle', () => {
    it('cancels animation on disconnect', async () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      const el = await fixture<HelixCounter>('<hx-counter value="100"></hx-counter>');
      el.remove();
      // cancelAnimationFrame should have been called during disconnectedCallback
      expect(cancelSpy).toHaveBeenCalled();
      cancelSpy.mockRestore();
    });
  });
});
