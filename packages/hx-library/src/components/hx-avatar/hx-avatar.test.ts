import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixAvatar } from './hx-avatar.js';
import './index.js';

afterEach(cleanup);

describe('hx-avatar', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "avatar" CSS part', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar).toBeTruthy();
    });

    it('applies default size=md class (.avatar--md)', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--md')).toBe(true);
    });

    it('applies default shape=circle class (.avatar--circle)', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--circle')).toBe(true);
    });
  });

  // ─── Fallback chain (4) ───

  describe('Fallback chain', () => {
    it('shows fallback icon when no src, no initials, no slot', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const icon = shadowQuery(el, '[part="fallback-icon"]');
      expect(icon).toBeTruthy();
    });

    it('shows initials span when initials is set and no src', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar initials="JD"></hx-avatar>');
      await el.updateComplete;
      const initials = shadowQuery(el, '[part="initials"]');
      expect(initials).toBeTruthy();
      expect(initials?.textContent?.trim()).toBe('JD');
    });

    it('shows image when src is set', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://example.com/avatar.png" alt="Jane Doe"></hx-avatar>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, '[part="image"]');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('https://example.com/avatar.png');
    });

    it('shows fallback icon when initials is empty string', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar initials=""></hx-avatar>');
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const icon = shadowQuery(el, '[part="fallback-icon"]');
      expect(icon).toBeTruthy();
      const initials = shadowQuery(el, '[part="initials"]');
      expect(initials).toBeNull();
    });
  });

  // ─── Property: size (6) ───

  describe('Property: size', () => {
    it('applies xs class', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar hx-size="xs"></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--xs')).toBe(true);
    });

    it('applies sm class', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar hx-size="sm"></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--sm')).toBe(true);
    });

    it('applies md class (default)', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar hx-size="md"></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--md')).toBe(true);
    });

    it('applies lg class', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar hx-size="lg"></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--lg')).toBe(true);
    });

    it('applies xl class', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar hx-size="xl"></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--xl')).toBe(true);
    });

    it('reflects hx-size attribute to host', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar hx-size="lg"></hx-avatar>');
      expect(el.getAttribute('hx-size')).toBe('lg');
    });
  });

  // ─── Property: shape (3) ───

  describe('Property: shape', () => {
    it('applies circle class (default)', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--circle')).toBe(true);
    });

    it('applies square class', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar shape="square"></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--square')).toBe(true);
    });

    it('reflects shape attribute to host', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar shape="square"></hx-avatar>');
      expect(el.getAttribute('shape')).toBe('square');
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot: when content is slotted, no role on avatar div', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar><img src="https://example.com/custom.png" alt="Custom" /></hx-avatar>',
      );
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.hasAttribute('role')).toBe(false);
    });

    it('default slot: slotted content is rendered', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar><span class="custom-content">Custom</span></hx-avatar>',
      );
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const slottedContent = el.querySelector('span.custom-content');
      expect(slottedContent).toBeTruthy();
      expect(slottedContent?.textContent).toBe('Custom');
    });

    it('badge slot: renders slotted badge content', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar initials="JD"><span slot="badge" class="status-dot"></span></hx-avatar>',
      );
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const badge = el.querySelector('span.status-dot');
      expect(badge).toBeTruthy();
    });
  });

  // ─── CSS Parts (4) ───

  describe('CSS Parts', () => {
    it('exposes "avatar" part', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar).toBeTruthy();
      expect(avatar?.getAttribute('part')).toBe('avatar');
    });

    it('exposes "initials" part when initials set', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar initials="AB"></hx-avatar>');
      await el.updateComplete;
      const initials = shadowQuery(el, '[part="initials"]');
      expect(initials).toBeTruthy();
      expect(initials?.getAttribute('part')).toBe('initials');
    });

    it('exposes "fallback-icon" part when no src or initials', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const icon = shadowQuery(el, '[part="fallback-icon"]');
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute('part')).toBe('fallback-icon');
    });

    it('exposes "badge" part', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      const badge = shadowQuery(el, '[part="badge"]');
      expect(badge).toBeTruthy();
      expect(badge?.getAttribute('part')).toBe('badge');
    });
  });

  // ─── Accessibility (axe-core) (2) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state (fallback icon)', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with initials', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar initials="JD"></hx-avatar>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
