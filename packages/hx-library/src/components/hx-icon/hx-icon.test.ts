import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixIcon } from './hx-icon.js';
import './index.js';

afterEach(cleanup);

const waitForInlineSvg = async (el: HelixIcon): Promise<void> => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
    await el.updateComplete;
    if (el.shadowRoot?.querySelector('[part="svg"]')) return;
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

    it('<use> href is "#check" when only name="check" is set (no spriteUrl)', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const use = shadowQuery(el, 'use');
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
  });

  // ─── Accessibility (6) ───

  describe('Accessibility', () => {
    it('SVG part has role="img" and aria-label when label is set', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon name="check" label="Checkmark icon"></hx-icon>',
      );
      await el.updateComplete;
      const svg = shadowQuery(el, '[part="svg"]');
      expect(svg?.getAttribute('role')).toBe('img');
      expect(svg?.getAttribute('aria-label')).toBe('Checkmark icon');
    });

    it('SVG part has no aria-hidden attribute when label is set', async () => {
      const el = await fixture<HelixIcon>(
        '<hx-icon name="check" label="Checkmark icon"></hx-icon>',
      );
      await el.updateComplete;
      const svg = shadowQuery(el, '[part="svg"]');
      expect(svg?.hasAttribute('aria-hidden')).toBe(false);
    });

    it('SVG part has aria-hidden="true" when label is empty', async () => {
      const el = await fixture<HelixIcon>('<hx-icon name="check"></hx-icon>');
      await el.updateComplete;
      const svg = shadowQuery(el, '[part="svg"]');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('SVG part has no role attribute when label is empty', async () => {
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

  // ─── Property: src (3) ───

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
  });

  // ─── Inline Mode Accessibility (4) ───

  describe('Inline Mode Accessibility', () => {
    it('wrapper has role="img" and aria-label when label is set', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () => '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>(
          '<hx-icon src="/icon.svg" label="Test icon"></hx-icon>',
        );
        await waitForInlineSvg(el);

        const wrapper = shadowQuery(el, '[part="svg"]');
        expect(wrapper?.getAttribute('role')).toBe('img');
        expect(wrapper?.getAttribute('aria-label')).toBe('Test icon');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('wrapper has aria-hidden="true" when label is empty in inline mode', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () => '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
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

    it('inner SVG has focusable="false" after sanitization', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () => '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        const wrapper = shadowQuery(el, '[part="svg"]');
        const innerSvg = wrapper?.querySelector('svg');
        expect(innerSvg?.getAttribute('focusable')).toBe('false');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('strips ARIA attributes from fetched SVG to avoid double-announcement', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Original label" aria-hidden="true"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>(
          '<hx-icon src="/icon.svg" label="Wrapper label"></hx-icon>',
        );
        await waitForInlineSvg(el);

        const wrapper = shadowQuery(el, '[part="svg"]');
        const innerSvg = wrapper?.querySelector('svg');
        expect(innerSvg?.hasAttribute('role')).toBe(false);
        expect(innerSvg?.hasAttribute('aria-label')).toBe(false);
        expect(innerSvg?.hasAttribute('aria-hidden')).toBe(false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ─── Fetch Error Handling (2) ───

  describe('Fetch Error Handling', () => {
    it('renders nothing when fetch returns HTTP error', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/missing.svg"></hx-icon>');
        await el.updateComplete;
        await Promise.resolve();
        await el.updateComplete;

        const svgPart = shadowQuery(el, '[part="svg"]');
        expect(svgPart).toBeNull();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('renders nothing when fetch throws a network error', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Network error'));

        const el = await fixture<HelixIcon>('<hx-icon src="/error.svg"></hx-icon>');
        await el.updateComplete;
        await Promise.resolve();
        await el.updateComplete;

        const svgPart = shadowQuery(el, '[part="svg"]');
        expect(svgPart).toBeNull();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ─── Sanitizer (7) ───

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

    it('strips style attributes to prevent CSS injection', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" style="fill:url(javascript:alert(1))"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        expect(el.shadowRoot?.innerHTML).not.toContain('style=');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('strips style attributes from root svg element', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" style="background:url(evil)"><path d="M0 0"/></svg>',
        } as Response);

        const el = await fixture<HelixIcon>('<hx-icon src="/icon.svg"></hx-icon>');
        await waitForInlineSvg(el);

        const wrapper = shadowQuery(el, '[part="svg"]');
        const innerSvg = wrapper?.querySelector('svg');
        expect(innerSvg?.hasAttribute('style')).toBe(false);
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
  });
});
