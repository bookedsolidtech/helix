import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import {
  registerIconLibrary,
  unregisterIconLibrary,
  setBasePath,
  getBasePath,
} from '@helixui/icons';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixIcon } from './hx-icon.js';
import './index.js';

afterEach(cleanup);

/**
 * Waits for [part="svg"] to appear in the shadow root after an async inline
 * SVG fetch completes. Polls with progressively more microtask flushes and
 * Lit update cycles to accommodate mocked resolved promises.
 */
const waitForInlineSvg = async (el: HelixIcon): Promise<void> => {
  for (let i = 0; i < 20; i += 1) {
    // Flush pending microtasks (resolved promise chains from mocked fetch).
    await Promise.resolve();
    await Promise.resolve();
    await el.updateComplete;
    if (shadowQuery(el, '[part="svg"]')) return;
  }
  throw new Error('Timed out waiting for inline SVG render');
};

describe('hx-icon', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM when name is set', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders nothing when name and src are both empty', async () => {
      const el = await fixture<HelixIcon>('<hx-icon></hx-icon>');
      await el.updateComplete;
      const svgPart = shadowQuery(el, '[part="svg"]');
      expect(svgPart).toBeNull();
    });

    it('renders [part="svg"] in sprite mode when name is set', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const svgPart = shadowQuery(el, '[part="svg"]');
      expect(svgPart).toBeTruthy();
    });
  });

  // ─── Sprite Mode (5) ───

  describe('Sprite Mode', () => {
    it('renders <svg part="svg"> element in shadow root', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg).toBeTruthy();
      expect(svg?.tagName.toLowerCase()).toBe('svg');
    });

    it('renders <use> element inside the SVG', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
      expect(use).toBeTruthy();
    });

    it('<use> href is document-local "#check" when library is empty (pre-3.9.0 back-compat)', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
      // Empty default `library` preserves the pre-3.9.0 bare-name contract:
      // `<hx-icon name="check">` renders `<use href="#check">` for consumers
      // that ship their own document-local sprite. Consumers opt into the
      // registered libraries by setting `library="fa-free"` explicitly.
      expect(use?.getAttribute('href')).toBe('#check');
    });

    it('<use> href is "/icons/sprite.svg#check" when spriteUrl and name are set', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon name="check" sprite-url="/icons/sprite.svg"></hx-icon>',
      );
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toBe('/icons/sprite.svg#check');
    });

    it('<use> href uses name as-is when name starts with "#"', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="#custom-icon"></hx-icon>');
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toBe('#custom-icon');
    });

    it('renders a <title> element inside SVG when label is set', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" label="Checkmark"></hx-icon>');
      await el.updateComplete;
      const title = shadowQuery(el, 'svg[part="svg"] title');
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe('Checkmark');
    });

    it('does not render a <title> element inside SVG when label is empty (decorative)', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const title = shadowQuery(el, 'svg[part="svg"] title');
      expect(title).toBeNull();
    });

    it('renders an empty icon (invisible) when name does not match any sprite symbol', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="nonexistent-icon"></hx-icon>');
      await el.updateComplete;
      // With the empty-default `library`, the bare-name path renders a
      // document-local sprite reference. The icon is invisible because no
      // <symbol id="nonexistent-icon"> exists in any sprite the consumer
      // has loaded. This is the known silent failure mode for bare-name
      // usage; the test documents and asserts the contract.
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg).toBeTruthy();
      const use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toBe('#nonexistent-icon');
    });
  });

  // ─── Property: size (6) ───

  describe('Property: size', () => {
    it('default size is "md", reflected as hx-size="md" attribute', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      expect(el.size).toBe('md');
      expect(el.getAttribute('hx-size')).toBe('md');
    });

    it('reflects hx-size="xs" attribute to host', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" hx-size="xs"></hx-icon>');
      await el.updateComplete;
      expect(el.getAttribute('hx-size')).toBe('xs');
    });

    it('reflects hx-size="sm" attribute to host', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" hx-size="sm"></hx-icon>');
      await el.updateComplete;
      expect(el.getAttribute('hx-size')).toBe('sm');
    });

    it('reflects hx-size="md" attribute to host', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" hx-size="md"></hx-icon>');
      await el.updateComplete;
      expect(el.getAttribute('hx-size')).toBe('md');
    });

    it('reflects hx-size="lg" attribute to host', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" hx-size="lg"></hx-icon>');
      await el.updateComplete;
      expect(el.getAttribute('hx-size')).toBe('lg');
    });

    it('reflects hx-size="xl" attribute to host', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" hx-size="xl"></hx-icon>');
      await el.updateComplete;
      expect(el.getAttribute('hx-size')).toBe('xl');
    });

    it('JS property "size" and HTML attribute "hx-size" are equivalent', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      el.size = 'xl';
      await el.updateComplete;
      expect(el.getAttribute('hx-size')).toBe('xl');
    });

    it('maps legacy `size` attribute to size when `hx-size` is absent', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" size="lg"></hx-icon>');
      await el.updateComplete;
      expect(el.size).toBe('lg');
    });

    it('`hx-size` wins when both `size` and `hx-size` are set', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon name="check" size="sm" hx-size="lg"></hx-icon>',
      );
      await el.updateComplete;
      expect(el.size).toBe('lg');
    });
  });

  // ─── Accessibility (10) ───

  describe('Accessibility', () => {
    it('SVG part has role="img" and aria-label when label is set (sprite mode)', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon name="check" label="Checkmark icon"></hx-icon>',
      );
      await el.updateComplete;
      const svg = shadowQuery(el, '[part="svg"]');
      expect(svg?.getAttribute('role')).toBe('img');
      expect(svg?.getAttribute('aria-label')).toBe('Checkmark icon');
    });

    it('SVG part has no aria-hidden attribute when label is set (sprite mode)', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon name="check" label="Checkmark icon"></hx-icon>',
      );
      await el.updateComplete;
      const svg = shadowQuery(el, '[part="svg"]');
      expect(svg?.hasAttribute('aria-hidden')).toBe(false);
    });

    it('SVG part has aria-hidden="true" when label is empty (sprite mode)', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, '[part="svg"]');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('SVG part has no role attribute when label is empty (sprite mode)', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, '[part="svg"]');
      expect(svg?.hasAttribute('role')).toBe(false);
    });

    it('has no axe violations in sprite mode with label', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon name="check" label="Checkmark icon"></hx-icon>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in sprite mode without label (decorative)', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('inline mode wrapper [part="svg"] has role="img" and aria-label when label is set', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>(
          '<hx-icon src="/icon.svg" label="Accessible icon"></hx-icon>',
        );
        await waitForInlineSvg(el);

        const wrapper = shadowQuery(el, '[part="svg"]');
        expect(wrapper?.getAttribute('role')).toBe('img');
        expect(wrapper?.getAttribute('aria-label')).toBe('Accessible icon');
        expect(wrapper?.hasAttribute('aria-hidden')).toBe(false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('inline mode wrapper [part="svg"] has aria-hidden="true" when label is empty', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        const wrapper = shadowQuery(el, '[part="svg"]');
        expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
        expect(wrapper?.hasAttribute('role')).toBe(false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('has no axe violations in inline mode with label', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>(
          '<hx-icon src="/icon.svg" label="Inline check icon"></hx-icon>',
        );
        await waitForInlineSvg(el);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations).toEqual([]);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('has no axe violations in inline mode without label (decorative)', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations).toEqual([]);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('exposes "svg" part in sprite mode', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const svgPart = shadowQuery(el, '[part="svg"]');
      expect(svgPart).toBeTruthy();
    });

    it('[part="svg"] has part="svg" attribute', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const svgPart = shadowQuery(el, '[part="svg"]');
      expect(svgPart?.getAttribute('part')).toBe('svg');
    });
  });

  // ─── Property: src (4) ───

  describe('Property: src', () => {
    it('src="" is treated as absent — sprite mode still works', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" src=""></hx-icon>');
      await el.updateComplete;
      expect(el.src).toBe('');
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg).toBeTruthy();
    });

    it('src attribute reflects to src property', async () => {
      const el = await fixture<HelixIcon>('<hx-icon src="/icons/check.svg"></hx-icon>');
      await el.updateComplete;
      expect(el.src).toBe('/icons/check.svg');
    });

    it('renders nothing while src is set but fetch not yet resolved', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

        const el = await fixture<HelixIcon>('<hx-icon src="/test.svg"></hx-icon>');
        await el.updateComplete;

        const svgPart = shadowQuery(el, '[part="svg"]');
        expect(svgPart).toBeNull();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('renders nothing and clears state when src fetch returns a non-ok response', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/missing.svg"></hx-icon>');
        // Wait several microtask ticks for the async fetch to settle.
        await el.updateComplete;
        await el.updateComplete;

        const svgPart = shadowQuery(el, '[part="svg"]');
        expect(svgPart).toBeNull();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('renders nothing and clears state when src fetch throws a network error', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const el = await fixture<HelixIcon>('<hx-icon src="/error.svg"></hx-icon>');
        await el.updateComplete;
        await el.updateComplete;

        const svgPart = shadowQuery(el, '[part="svg"]');
        expect(svgPart).toBeNull();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ─── Sanitizer (8) ───

  describe('Sanitizer', () => {
    it('strips <script> elements from fetched SVG', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        expect(el.shadowRoot?.innerHTML).not.toContain('<script');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('strips on* event-handler attributes from child elements', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" onclick="alert(1)"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        expect(el.shadowRoot?.innerHTML).not.toContain('onclick');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('strips on* event-handler attributes from root svg element', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        const svgPart = shadowQuery(el, '[part="svg"]');
        const inlineSvg = svgPart?.querySelector('svg');
        expect(inlineSvg?.hasAttribute('onload')).toBe(false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('strips javascript: href values', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><path d="M0 0"/></a></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        expect(el.shadowRoot?.innerHTML).not.toContain('href="javascript:');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('strips <foreignObject> elements', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>XSS</div></foreignObject></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        expect(el.shadowRoot?.innerHTML).not.toContain('foreignObject');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('strips style attributes from SVG elements to prevent CSS injection', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" style="fill:url(javascript:alert(1))"><path d="M0 0" style="color:red"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        // No style attributes should survive sanitization.
        expect(el.shadowRoot?.innerHTML).not.toContain('style=');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('injects focusable="false" on the inner SVG element', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        const svgPart = shadowQuery(el, '[part="svg"]');
        const innerSvg = svgPart?.querySelector('svg');
        expect(innerSvg?.getAttribute('focusable')).toBe('false');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('strips ARIA attributes from inner SVG to prevent conflicts with wrapper ARIA', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Original label" aria-hidden="false"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>(
          '<hx-icon src="/icon.svg" label="Wrapper label"></hx-icon>',
        );
        await waitForInlineSvg(el);

        const svgPart = shadowQuery(el, '[part="svg"]');
        const innerSvg = svgPart?.querySelector('svg');
        // Inner SVG ARIA attrs must be stripped — the wrapper <span part="svg"> owns ARIA.
        expect(innerSvg?.hasAttribute('role')).toBe(false);
        expect(innerSvg?.hasAttribute('aria-label')).toBe(false);
        expect(innerSvg?.hasAttribute('aria-hidden')).toBe(false);
        // Wrapper still has correct ARIA.
        expect(svgPart?.getAttribute('role')).toBe('img');
        expect(svgPart?.getAttribute('aria-label')).toBe('Wrapper label');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ─── Sanitizer: data: URI stripped from href ───

  describe('Sanitizer: data: URI in href', () => {
    it('strips data: URI from href attributes in fetched SVG', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg"><a href="data:text/html,<script>alert(1)</script>"><path d="M0 0"/></a></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        expect(el.shadowRoot?.innerHTML).not.toContain('href="data:');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ─── Label whitespace-only treated as decorative ───

  describe('Label whitespace-only treated as decorative', () => {
    it('treats label with only whitespace as decorative in sprite mode', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" label="   "></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, '[part="svg"]');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.hasAttribute('role')).toBe(false);
    });

    it('treats label with only whitespace as decorative in inline mode', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg" label="   "></hx-icon>');
        await waitForInlineSvg(el);

        const wrapper = shadowQuery(el, '[part="svg"]');
        expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
        expect(wrapper?.hasAttribute('role')).toBe(false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ─── src whitespace-only triggers inline render path ───

  describe('src with only whitespace is treated as absent (sprite fallback)', () => {
    it('renders sprite SVG when src is whitespace-only and name is set', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check" src="   "></hx-icon>');
      await el.updateComplete;
      // src trim is empty → falls through to sprite mode
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg).toBeTruthy();
    });
  });

  // ─── spriteUrl without name ───

  describe('spriteUrl without name renders nothing', () => {
    it('renders nothing when sprite-url is set but name is empty', async () => {
      const el = await fixture<HelixIcon>('<hx-icon sprite-url="/icons/sprite.svg"></hx-icon>');
      await el.updateComplete;
      const svgPart = shadowQuery(el, '[part="svg"]');
      expect(svgPart).toBeNull();
    });
  });

  // ─── Sanitizer: SVG parse error returns empty ───

  describe('Sanitizer: malformed SVG parse error', () => {
    it('renders nothing when fetched content is not valid SVG', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () => 'this is not valid svg at all >>><<',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/bad.svg"></hx-icon>');
        // Wait for fetch to settle
        await el.updateComplete;
        await el.updateComplete;

        const svgPart = shadowQuery(el, '[part="svg"]');
        expect(svgPart).toBeNull();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ─── Fetch Cache (2) ───

  describe('Fetch Cache', () => {
    it('issues only one network request when two instances share the same src', async () => {
      const originalFetch = globalThis.fetch;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
      } as Response);
      globalThis.fetch = mockFetch;

      try {
        // Use a unique URL that won't be in the cache from other tests.
        const src = '/shared-icon-cache-test.svg';
        const [el1, el2] = await Promise.all([
          fixture<HelixIcon>(`<hx-icon src="${src}"></hx-icon>`),
          fixture<HelixIcon>(`<hx-icon src="${src}"></hx-icon>`),
        ]);
        await Promise.all([waitForInlineSvg(el1), waitForInlineSvg(el2)]);

        // Both icons rendered, but fetch was called at most once for this URL.
        expect(mockFetch).toHaveBeenCalledTimes(1);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ─── Registry Resolution (library attribute) ───

  describe('Library Registry Resolution', () => {
    it('library attribute defaults to the empty string (back-compat for bare-name document-local sprite)', async () => {
      // 3.9.0 ships an empty default for `library` to preserve the pre-3.9.0
      // contract where `<hx-icon name="foo">` rendered a document-local sprite
      // fragment (`<use href="#foo">`) without going through the registry.
      // Consumers opt INTO registry resolution by setting `library="fa-free"`
      // (or any registered library name) explicitly.
      const el = await fixture<HelixIcon>('<hx-icon name="circle"></hx-icon>');
      await el.updateComplete;
      expect(el.library).toBe('');
      const use = shadowQuery(el, 'use');
      // Document-local sprite reference, no library/basePath prefix.
      expect(use?.getAttribute('href')).toBe('#circle');
    });

    it('library="fa-free" explicitly resolves to the fa-free sprite href', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="fa-free" name="circle"></hx-icon>');
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toMatch(/\/fa-free-solid\.svg#circle$/);
    });

    it('library="helix" resolves to the helix sprite href', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="helix" name="check"></hx-icon>');
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toMatch(/\/helix\.svg#check$/);
    });

    it('library attribute reflects to host', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="helix" name="check"></hx-icon>');
      await el.updateComplete;
      expect(el.getAttribute('library')).toBe('helix');
    });

    it('changing library re-renders with the new href', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="helix" name="check"></hx-icon>');
      await el.updateComplete;
      let use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toMatch(/\/helix\.svg#check$/);

      el.library = 'fa-free';
      await el.updateComplete;
      use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toMatch(/\/fa-free-solid\.svg#check$/);
    });

    it('setBasePath reflects in the next render href', async () => {
      const original = getBasePath();
      try {
        setBasePath('/custom/cdn/path');
        const el = await fixture<HelixIcon>('<hx-icon library="helix" name="check"></hx-icon>');
        await el.updateComplete;
        const use = shadowQuery(el, 'use');
        expect(use?.getAttribute('href')).toBe('/custom/cdn/path/helix.svg#check');
      } finally {
        setBasePath(original);
      }
    });

    it('unknown library logs a warning and renders nothing', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = await fixture<HelixIcon>(
          '<hx-icon library="does-not-exist-xyz" name="abc"></hx-icon>',
        );
        await el.updateComplete;
        const svgPart = shadowQuery(el, '[part="svg"]');
        expect(svgPart).toBeNull();
        expect(warnSpy).toHaveBeenCalled();
        const msg = warnSpy.mock.calls
          .map((c) => c.map(String).join(' '))
          .find((m) => m.includes('does-not-exist-xyz'));
        expect(msg).toBeTruthy();
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('explicit sprite-url + name still wins over library resolution', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon library="helix" name="check" sprite-url="/local/sprite.svg"></hx-icon>',
      );
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toBe('/local/sprite.svg#check');
    });

    it('explicit src wins over library resolution', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>(
          '<hx-icon library="helix" name="check" src="/explicit.svg"></hx-icon>',
        );
        await waitForInlineSvg(el);

        // Inline wrapper is a <span part="svg">, not <svg part="svg">.
        const wrapper = shadowQuery(el, '[part="svg"]');
        expect(wrapper?.tagName.toLowerCase()).toBe('span');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('mutator runs AFTER sanitization on a fetch-mode library', async () => {
      const originalFetch = globalThis.fetch;
      const mutator = vi.fn((svg: SVGElement) => {
        // Mark the SVG so we can verify mutation persisted to the rendered DOM.
        svg.setAttribute('data-mutated', 'yes');
      });
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          // The script must be stripped by sanitization BEFORE the mutator
          // sees the SVG. If the mutator runs first, it would observe the
          // <script>; this test passes only when sanitization gates it.
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><script>1</script><path d="M0 0"/></svg>',
        } as Response);

        registerIconLibrary('test-mutator-lib', {
          resolver: () => '/test-mutator.svg',
          spriteSheet: false,
          mutator,
        });
        try {
          const el = await fixture<HelixIcon>(
            '<hx-icon library="test-mutator-lib" name="any"></hx-icon>',
          );
          await waitForInlineSvg(el);

          expect(mutator).toHaveBeenCalledTimes(1);
          // The mutator received an already-sanitized root (no <script> child).
          const passedSvg = mutator.mock.calls[0]?.[0];
          expect(passedSvg).toBeTruthy();
          expect(passedSvg!.querySelector('script')).toBeNull();

          // The mutation persisted to the rendered DOM.
          const wrapper = shadowQuery(el, '[part="svg"]');
          const innerSvg = wrapper?.querySelector('svg');
          expect(innerSvg?.getAttribute('data-mutated')).toBe('yes');
          // And the script is still gone after re-serialization.
          expect(el.shadowRoot?.innerHTML).not.toContain('<script');
        } finally {
          unregisterIconLibrary('test-mutator-lib');
        }
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('mutator that throws does not break render — un-mutated SVG still appears', async () => {
      const originalFetch = globalThis.fetch;
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        registerIconLibrary('test-throwing-mutator-lib', {
          resolver: () => '/test-throwing.svg',
          spriteSheet: false,
          mutator: () => {
            throw new Error('boom');
          },
        });
        try {
          const el = await fixture<HelixIcon>(
            '<hx-icon library="test-throwing-mutator-lib" name="any"></hx-icon>',
          );
          await waitForInlineSvg(el);

          const wrapper = shadowQuery(el, '[part="svg"]');
          const innerSvg = wrapper?.querySelector('svg');
          expect(innerSvg).toBeTruthy();
          expect(warnSpy).toHaveBeenCalled();
        } finally {
          unregisterIconLibrary('test-throwing-mutator-lib');
        }
      } finally {
        globalThis.fetch = originalFetch;
        warnSpy.mockRestore();
      }
    });
  });

  // ─── Paint Mode (stroke libraries: Feather, Lucide) ───

  describe('Paint Mode (sprite libraries)', () => {
    it('library="feather" renders a sprite svg[part="svg"] with data-paint-mode="stroke"', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="feather" name="check"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('data-paint-mode')).toBe('stroke');
    });

    it('library="feather" <use href> resolves to the feather.svg#name sprite reference', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="feather" name="check"></hx-icon>');
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toMatch(/\/feather\.svg#check$/);
    });

    it('library="lucide" renders a sprite svg[part="svg"] with data-paint-mode="stroke"', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="lucide" name="circle"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('data-paint-mode')).toBe('stroke');
    });

    it('library="lucide" <use href> resolves to the lucide.svg#name sprite reference', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="lucide" name="circle"></hx-icon>');
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
      expect(use?.getAttribute('href')).toMatch(/\/lucide\.svg#circle$/);
    });

    it('library="fa-free" (fill library) renders data-paint-mode="fill"', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="fa-free" name="circle"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg?.getAttribute('data-paint-mode')).toBe('fill');
    });

    it('library="helix" (fill library) renders data-paint-mode="fill"', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="helix" name="check"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg?.getAttribute('data-paint-mode')).toBe('fill');
    });

    it('bare name (no library) defaults to data-paint-mode="fill"', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg?.getAttribute('data-paint-mode')).toBe('fill');
    });

    it('stroke-mode svg computes fill:none and stroke matching currentColor', async () => {
      // Real-browser mode (Chromium) — the static stroke CSS rule
      // `svg[part="svg"][data-paint-mode="stroke"]` resolves deterministically.
      const el = await fixture<HelixIcon>('<hx-icon library="feather" name="check"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery<SVGElement>(el, 'svg[part="svg"]');
      expect(svg).toBeTruthy();
      const styles = getComputedStyle(svg!);
      expect(styles.fill).toBe('none');
      // stroke is `currentColor`, so it resolves to the same computed value as `color`.
      expect(styles.stroke).toBe(styles.color);
    });

    it('fill-mode svg computes fill matching currentColor (not none)', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="fa-free" name="circle"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery<SVGElement>(el, 'svg[part="svg"]');
      expect(svg).toBeTruthy();
      const styles = getComputedStyle(svg!);
      expect(styles.fill).not.toBe('none');
      // fill is `currentColor`, so it resolves to the same computed value as `color`.
      expect(styles.fill).toBe(styles.color);
    });
  });

  // ─── Public paint-mode override (explicit sprite-url / name="#" escape hatches) ───

  describe('Paint Mode (public paint-mode attribute)', () => {
    it('paint-mode="stroke" on an explicit sprite-url renders data-paint-mode="stroke"', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon sprite-url="/icons/feather.svg" name="activity" paint-mode="stroke"></hx-icon>',
      );
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg?.getAttribute('data-paint-mode')).toBe('stroke');
    });

    it('paint-mode="stroke" on a bare name renders data-paint-mode="stroke"', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="custom" paint-mode="stroke"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg?.getAttribute('data-paint-mode')).toBe('stroke');
    });

    it('an explicit paint-mode overrides the library-derived mode', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon library="fa-free" name="circle" paint-mode="stroke"></hx-icon>',
      );
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg?.getAttribute('data-paint-mode')).toBe('stroke');
    });

    it('no paint-mode falls back to the library-derived mode (feather → stroke)', async () => {
      const el = await fixture<HelixIcon>('<hx-icon library="feather" name="check"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, 'svg[part="svg"]');
      expect(svg?.getAttribute('data-paint-mode')).toBe('stroke');
    });
  });

  // ─── Security: re-sanitization AFTER the library mutator ───

  describe('Security: post-mutator re-sanitization', () => {
    it('strips a <script> injected by a fetch-mode library mutator', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        registerIconLibrary('test-hostile-script-lib', {
          resolver: () => '/test-hostile-script.svg',
          spriteSheet: false,
          // A hostile/compromised mutator reintroduces a <script> AFTER the
          // first sanitize pass. _applyLibraryMutator re-sanitizes, so it must
          // never reach the rendered DOM.
          mutator: (svg: SVGElement) => {
            const script = svg.ownerDocument.createElementNS(
              'http://www.w3.org/2000/svg',
              'script',
            );
            script.textContent = 'alert(1)';
            svg.appendChild(script);
          },
        });
        try {
          const el = await fixture<HelixIcon>(
            '<hx-icon library="test-hostile-script-lib" name="any"></hx-icon>',
          );
          await waitForInlineSvg(el);

          const wrapper = shadowQuery(el, '[part="svg"]');
          const innerSvg = wrapper?.querySelector('svg');
          expect(innerSvg).toBeTruthy();
          // Re-sanitization stripped the injected <script>.
          expect(innerSvg?.querySelector('script')).toBeNull();
          expect(el.shadowRoot?.innerHTML).not.toContain('<script');
          expect(el.shadowRoot?.innerHTML).not.toContain('alert(1)');
        } finally {
          unregisterIconLibrary('test-hostile-script-lib');
        }
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('strips an on* event-handler attribute injected by a fetch-mode library mutator', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
        } as Response);

        registerIconLibrary('test-hostile-onload-lib', {
          resolver: () => '/test-hostile-onload.svg',
          spriteSheet: false,
          // Mutator injects an onload handler onto the root SVG; the post-mutator
          // re-sanitize pass must strip it before it reaches unsafeHTML.
          mutator: (svg: SVGElement) => {
            svg.setAttribute('onload', 'alert(1)');
          },
        });
        try {
          const el = await fixture<HelixIcon>(
            '<hx-icon library="test-hostile-onload-lib" name="any"></hx-icon>',
          );
          await waitForInlineSvg(el);

          const wrapper = shadowQuery(el, '[part="svg"]');
          const innerSvg = wrapper?.querySelector('svg');
          expect(innerSvg).toBeTruthy();
          // Re-sanitization stripped the injected onload handler.
          expect(innerSvg?.hasAttribute('onload')).toBe(false);
          expect(el.shadowRoot?.innerHTML).not.toContain('onload');
        } finally {
          unregisterIconLibrary('test-hostile-onload-lib');
        }
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
