import { describe, it, expect, afterEach, vi } from 'vitest';
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
      await el.updateComplete;
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
      await el.updateComplete;
      await el.updateComplete;
      const icon = shadowQuery(el, '[part="fallback-icon"]');
      expect(icon).toBeTruthy();
      const initials = shadowQuery(el, '[part="initials"]');
      expect(initials).toBeNull();
    });
  });

  // ─── Image error handling (3) — P1-4, P1-5 ───

  describe('Image error handling', () => {
    it('shows initials fallback when image fails to load', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://invalid.example.com/broken.jpg" alt="John Doe" initials="JD"></hx-avatar>',
      );
      await el.updateComplete;

      const img = shadowQuery(el, '[part="image"]') as HTMLImageElement;
      expect(img).toBeTruthy();

      img.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const initials = shadowQuery(el, '[part="initials"]');
      expect(initials).toBeTruthy();
      expect(initials?.textContent?.trim()).toBe('JD');
      expect(shadowQuery(el, '[part="image"]')).toBeNull();
    });

    it('shows icon fallback when image fails and no initials are set', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://invalid.example.com/broken.jpg" alt="Unknown user"></hx-avatar>',
      );
      await el.updateComplete;

      const img = shadowQuery(el, '[part="image"]') as HTMLImageElement;
      expect(img).toBeTruthy();

      img.dispatchEvent(new Event('error'));
      await el.updateComplete;

      expect(shadowQuery(el, '[part="fallback-icon"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="image"]')).toBeNull();
    });

    it('resets image error state when src property changes', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://invalid.example.com/broken.jpg" alt="John Doe" initials="JD"></hx-avatar>',
      );
      await el.updateComplete;

      // Simulate image load failure.
      const img = shadowQuery(el, '[part="image"]') as HTMLImageElement;
      img.dispatchEvent(new Event('error'));
      await el.updateComplete;

      // Verify fallback is active.
      expect(shadowQuery(el, '[part="initials"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="image"]')).toBeNull();

      // Update src — _imgError must reset so the new image renders.
      el.src = 'https://example.com/new-avatar.png';
      await el.updateComplete;
      await el.updateComplete; // extra await ensures all reactive state settles.

      expect(shadowQuery(el, '[part="image"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="initials"]')).toBeNull();
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
      await el.updateComplete;
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.hasAttribute('role')).toBe(false);
    });

    it('default slot: slotted content is rendered', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar><span class="custom-content">Custom</span></hx-avatar>',
      );
      await el.updateComplete;
      await el.updateComplete;
      const slottedContent = el.querySelector('span.custom-content');
      expect(slottedContent).toBeTruthy();
      expect(slottedContent?.textContent).toBe('Custom');
    });

    it('badge slot: renders slotted badge content', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar initials="JD"><span slot="badge" class="status-dot"></span></hx-avatar>',
      );
      await el.updateComplete;
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
      await el.updateComplete;
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

  // ─── Accessibility (axe-core) (5) — P2-8 ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state (fallback icon)', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar label="Anonymous user"></hx-avatar>');
      await el.updateComplete;
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with initials', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar initials="JD" label="Dr. John Doe"></hx-avatar>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with image src and alt', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://example.com/avatar.png" alt="Dr. Jane Doe"></hx-avatar>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with slotted content', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar><img src="https://example.com/custom.png" alt="System avatar" /></hx-avatar>',
      );
      await el.updateComplete;
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with badge slot', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar initials="JD" label="Dr. John Doe"><span slot="badge" role="img" aria-label="Online status: available"></span></hx-avatar>',
      );
      await el.updateComplete;
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Property: label (aria-label in non-image states) ───

  describe('Property: label (aria-label in non-image states)', () => {
    it('uses label as aria-label in fallback icon mode', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar label="Dr. Jane Doe"></hx-avatar>');
      await el.updateComplete;
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.getAttribute('aria-label')).toBe('Dr. Jane Doe');
    });

    it('uses label as aria-label in initials mode', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar initials="JD" label="Dr. Jane Doe"></hx-avatar>',
      );
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.getAttribute('aria-label')).toBe('Dr. Jane Doe');
    });

    it('uses initials as aria-label when label is absent in initials mode', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar initials="JD"></hx-avatar>');
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.getAttribute('aria-label')).toBe('JD');
    });

    it('uses "Avatar" as aria-label when no label, no initials, no src', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      await el.updateComplete;
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.getAttribute('aria-label')).toBe('Avatar');
    });

    it('uses alt as aria-label in image mode when src is provided', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://example.com/avatar.png" alt="Dr. Jane Doe"></hx-avatar>',
      );
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.getAttribute('aria-label')).toBe('Dr. Jane Doe');
    });

    it('uses label as aria-label in image mode when alt is absent', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://example.com/avatar.png" label="Dr. Jane Doe"></hx-avatar>',
      );
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.getAttribute('aria-label')).toBe('Dr. Jane Doe');
    });
  });

  // ─── Property: src with and without alt (devWarn) ───

  describe('Property: src without alt (devWarn)', () => {
    it('warns when src is provided without alt', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixAvatar>(
          '<hx-avatar src="https://example.com/avatar.png"></hx-avatar>',
        );
        await el.updateComplete;
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('"alt" attribute is required when "src" is provided'),
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not warn when src is provided with alt', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixAvatar>(
          '<hx-avatar src="https://example.com/avatar.png" alt="Dr. Jane Doe"></hx-avatar>',
        );
        await el.updateComplete;
        const relevantCalls = warnSpy.mock.calls.filter(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('"alt" attribute is required when "src" is provided'),
        );
        expect(relevantCalls).toHaveLength(0);
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  // ─── Invalid size/shape: safe class fallback ───

  describe('Invalid size/shape: safe class fallback', () => {
    it('uses "md" class for invalid size value', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar hx-size="huge"></hx-avatar>');
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--md')).toBe(true);
    });

    it('uses "circle" class for invalid shape value', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar shape="diamond"></hx-avatar>');
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.classList.contains('avatar--circle')).toBe(true);
    });

    it('warns when invalid size is provided', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixAvatar>('<hx-avatar hx-size="huge"></hx-avatar>');
        await el.updateComplete;
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid hx-size="huge"'));
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('warns when invalid shape is provided', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixAvatar>('<hx-avatar shape="diamond"></hx-avatar>');
        await el.updateComplete;
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid shape="diamond"'));
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  // ─── Badge slot visibility state ───

  describe('Badge slot visibility state', () => {
    it('badge span has avatar__badge--hidden class when no badge content', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar></hx-avatar>');
      await el.updateComplete;
      const badge = shadowQuery(el, '[part="badge"]');
      expect(badge?.classList.contains('avatar__badge--hidden')).toBe(true);
    });

    it('badge span does not have avatar__badge--hidden class when badge is slotted', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar initials="JD" label="John Doe"><span slot="badge" aria-label="Online"></span></hx-avatar>',
      );
      await el.updateComplete;
      await el.updateComplete;
      const badge = shadowQuery(el, '[part="badge"]');
      expect(badge?.classList.contains('avatar__badge--hidden')).toBe(false);
    });
  });

  // ─── Fallback chain: initials whitespace treated as empty ───

  describe('Fallback chain: initials whitespace', () => {
    it('shows fallback icon when initials is whitespace-only', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar initials="   "></hx-avatar>');
      await el.updateComplete;
      await el.updateComplete;
      const icon = shadowQuery(el, '[part="fallback-icon"]');
      expect(icon).toBeTruthy();
      const initials = shadowQuery(el, '[part="initials"]');
      expect(initials).toBeNull();
    });
  });

  // ─── Slot: default slot suppresses role and aria-label ───

  describe('Slot: default slot suppresses role', () => {
    it('avatar div has no role when default slot has element content', async () => {
      const el = await fixture<HelixAvatar>('<hx-avatar><span>Custom</span></hx-avatar>');
      await el.updateComplete;
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.hasAttribute('role')).toBe(false);
    });

    it('avatar div has no aria-label when default slot has element content', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar label="Should be suppressed"><span>Custom</span></hx-avatar>',
      );
      await el.updateComplete;
      await el.updateComplete;
      const avatar = shadowQuery(el, '[part="avatar"]');
      expect(avatar?.hasAttribute('aria-label')).toBe(false);
    });
  });

  // ─── CSS Part: image ───

  describe('CSS Part: image', () => {
    it('exposes "image" part on img element when src is provided', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://example.com/avatar.png" alt="Jane Doe"></hx-avatar>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, '[part="image"]');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('part')).toBe('image');
    });

    it('image has aria-hidden="true" (decorative — accessible name is on container)', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://example.com/avatar.png" alt="Jane Doe"></hx-avatar>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, '[part="image"]');
      expect(img?.getAttribute('aria-hidden')).toBe('true');
    });

    it('image has loading="lazy"', async () => {
      const el = await fixture<HelixAvatar>(
        '<hx-avatar src="https://example.com/avatar.png" alt="Jane Doe"></hx-avatar>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, '[part="image"]') as HTMLImageElement;
      expect(img?.getAttribute('loading')).toBe('lazy');
    });
  });

  // ─── Console warnings (P2-A, P2-C) ───

  describe('Console warnings', () => {
    it('warns when initials is set without label (P2-A)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixAvatar>('<hx-avatar initials="JD"></hx-avatar>');
        await el.updateComplete;
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('"label" attribute is recommended when "initials" is provided'),
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not warn when initials is set with label (P2-A)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixAvatar>(
          '<hx-avatar initials="JD" label="Dr. John Doe"></hx-avatar>',
        );
        await el.updateComplete;
        const relevantCalls = warnSpy.mock.calls.filter(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('"label" attribute is recommended when "initials" is provided'),
        );
        expect(relevantCalls).toHaveLength(0);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('warns when badge slot content lacks an accessible name (P2-C)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixAvatar>(
          '<hx-avatar initials="JD" label="John Doe"><span slot="badge" class="status-dot"></span></hx-avatar>',
        );
        await el.updateComplete;
        await el.updateComplete;
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('badge slot content should have an accessible name'),
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not warn when badge slot has aria-label (P2-C)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixAvatar>(
          '<hx-avatar initials="JD" label="John Doe"><span slot="badge" aria-label="Online"></span></hx-avatar>',
        );
        await el.updateComplete;
        await el.updateComplete;
        const relevantCalls = warnSpy.mock.calls.filter(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('badge slot content should have an accessible name'),
        );
        expect(relevantCalls).toHaveLength(0);
      } finally {
        warnSpy.mockRestore();
      }
    });
  });
});
