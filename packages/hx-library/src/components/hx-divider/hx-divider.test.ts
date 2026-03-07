import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixDivider } from './hx-divider.js';
import './index.js';

afterEach(cleanup);

describe('hx-divider', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('renders two line spans', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const lines = el.shadowRoot?.querySelectorAll('.divider__line') ?? [];
      expect(lines.length).toBe(2);
    });
  });

  // ─── Property: orientation ───

  describe('Property: orientation', () => {
    it('defaults to horizontal', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      expect(el.orientation).toBe('horizontal');
    });

    it('reflects orientation="horizontal" to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider orientation="horizontal"></hx-divider>');
      expect(el.getAttribute('orientation')).toBe('horizontal');
    });

    it('reflects orientation="vertical" to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider orientation="vertical"></hx-divider>');
      expect(el.getAttribute('orientation')).toBe('vertical');
    });

    it('sets aria-orientation="horizontal" on base', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('sets aria-orientation="vertical" on base', async () => {
      const el = await fixture<HelixDivider>('<hx-divider orientation="vertical"></hx-divider>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('sets role="separator" on base', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('role')).toBe('separator');
    });
  });

  // ─── Property: spacing ───

  describe('Property: spacing', () => {
    it('defaults to md', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      expect(el.spacing).toBe('md');
    });

    it('reflects spacing="none" to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider spacing="none"></hx-divider>');
      expect(el.getAttribute('spacing')).toBe('none');
    });

    it('reflects spacing="sm" to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider spacing="sm"></hx-divider>');
      expect(el.getAttribute('spacing')).toBe('sm');
    });

    it('reflects spacing="lg" to host', async () => {
      const el = await fixture<HelixDivider>('<hx-divider spacing="lg"></hx-divider>');
      expect(el.getAttribute('spacing')).toBe('lg');
    });
  });

  // ─── Label slot ───

  describe('Label slot', () => {
    it('renders label part when slotted text is present', async () => {
      const el = await fixture<HelixDivider>('<hx-divider>Section</hx-divider>');
      await el.updateComplete;
      const label = shadowQuery(el, '[part~="label"]');
      expect(label).toBeTruthy();
    });

    it('slotted text is accessible as textContent', async () => {
      const el = await fixture<HelixDivider>('<hx-divider>Or</hx-divider>');
      expect(el.textContent?.trim()).toBe('Or');
    });

    it('does not render label part when slot is empty', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      await el.updateComplete;
      const label = shadowQuery(el, '[part~="label"]');
      expect(label).toBeNull();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations — horizontal default', async () => {
      const el = await fixture<HelixDivider>('<hx-divider></hx-divider>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — vertical', async () => {
      const el = await fixture<HelixDivider>('<hx-divider orientation="vertical"></hx-divider>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — with label', async () => {
      const el = await fixture<HelixDivider>('<hx-divider>Section</hx-divider>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
