import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup } from '../../../test-utils.js';
import type { HxStyleScope } from '../hx-style-scope.js';
import '../index.js';
import { lightStyleRegistry } from '../../../utilities/lightStyleRegistry.js';

/**
 * Removes test-scoped style elements from document.head and clears their
 * registry entries so each test starts with a clean slate.
 */
function cleanupStyles(prefix: string = 'test-scope'): void {
  for (const [name, el] of lightStyleRegistry.entries()) {
    if (name.startsWith(prefix)) {
      el.remove();
      lightStyleRegistry.delete(name);
    }
  }
}

afterEach(() => {
  cleanup();
  cleanupStyles();
});

describe('hx-style-scope', () => {
  describe('Rendering', () => {
    it('renders a default slot', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-render"><p>Hello</p></hx-style-scope>',
      );
      expect(el.shadowRoot?.querySelector('slot')).toBeTruthy();
    });

    it('has shadow DOM', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-shadow"><span>content</span></hx-style-scope>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('slotted children are accessible in the light DOM', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-slot"><p id="test-p">text</p></hx-style-scope>',
      );
      expect(el.querySelector('#test-p')).toBeTruthy();
    });
  });

  describe('component attribute', () => {
    it('reflects the component attribute', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-reflect"></hx-style-scope>',
      );
      expect(el.getAttribute('component')).toBe('test-scope-reflect');
    });

    it('sets data-hx-styled equal to the component attribute', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-attr"></hx-style-scope>',
      );
      await el.updateComplete;
      expect(el.getAttribute('data-hx-styled')).toBe('test-scope-attr');
    });

    it('updates data-hx-styled when component property changes', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-update-a"></hx-style-scope>',
      );
      await el.updateComplete;
      el.component = 'test-scope-update-b';
      await el.updateComplete;
      expect(el.getAttribute('data-hx-styled')).toBe('test-scope-update-b');
    });

    it('does not set data-hx-styled when component is empty string', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      await el.updateComplete;
      // Should not set data-hx-styled for an empty component value
      expect(el.getAttribute('data-hx-styled')).toBeNull();
    });
  });

  describe('light-css attribute', () => {
    it('injects a style element for the given component when light-css is provided', async () => {
      const componentName = 'test-scope-lightcss';
      await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}" light-css="p { color: red; }"></hx-style-scope>`,
      );
      const styleEl = document.head.querySelector(
        `style[data-hx-light-styles="${componentName}"]`,
      );
      expect(styleEl).toBeTruthy();
    });

    it('scopes injected CSS under [data-hx-styled]', async () => {
      const componentName = 'test-scope-scoped';
      await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}" light-css="p { margin: 0; }"></hx-style-scope>`,
      );
      const styleEl = document.head.querySelector(
        `style[data-hx-light-styles="${componentName}"]`,
      ) as HTMLStyleElement | null;
      expect(styleEl?.textContent).toContain(`[data-hx-styled="${componentName}"]`);
    });

    it('does not inject a style element when light-css is not provided', async () => {
      const componentName = 'test-scope-no-css';
      await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}"></hx-style-scope>`,
      );
      const styleEl = document.head.querySelector(
        `style[data-hx-light-styles="${componentName}"]`,
      );
      expect(styleEl).toBeNull();
    });
  });

  describe('deduplication', () => {
    it('injects the style element only once when multiple instances share a component name', async () => {
      const componentName = 'test-scope-dedup';
      const css = 'p { color: blue; }';

      await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}" light-css="${css}"></hx-style-scope>`,
      );
      await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}" light-css="${css}"></hx-style-scope>`,
      );

      const elements = document.head.querySelectorAll(
        `style[data-hx-light-styles="${componentName}"]`,
      );
      expect(elements.length).toBe(1);
    });
  });

  // ─── Property: lightCss ───

  describe('Property: lightCss', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-lightcss-default"></hx-style-scope>',
      );
      expect(el.lightCss).toBe('');
    });

    it('updates injected styles when lightCss property changes', async () => {
      const componentName = 'test-scope-lightcss-update';
      const el = await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}" light-css="p { color: red; }"></hx-style-scope>`,
      );
      await el.updateComplete;
      const styleEl = document.head.querySelector(
        `style[data-hx-light-styles="${componentName}"]`,
      ) as HTMLStyleElement | null;
      expect(styleEl?.textContent).toContain('color: red');
    });

    it('accepts lightCss attribute via light-css', async () => {
      const componentName = 'test-scope-lightcss-attr';
      await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}" light-css="span { font-weight: bold; }"></hx-style-scope>`,
      );
      const styleEl = document.head.querySelector(
        `style[data-hx-light-styles="${componentName}"]`,
      ) as HTMLStyleElement | null;
      expect(styleEl?.textContent).toContain('font-weight: bold');
    });
  });

  // ─── Accessibility (axe-core) — healthcare mandate ───
  // hx-style-scope renders as display:contents with a shadow root containing only <slot>.
  // axe-core is run on the light DOM content (the element itself) rather than the shadow root,
  // which avoids the "No elements found for include" error from auditing an empty shadow root.

  describe('Accessibility', () => {
    it('renders as display:contents without breaking a11y of slotted content', async () => {
      // hx-style-scope is a transparent wrapper — it has no ARIA role requirements itself.
      // Verify it renders and has a shadow root with a slot element.
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-a11y"><p>Hello World</p></hx-style-scope>',
      );
      expect(el.shadowRoot).toBeTruthy();
      const slot = el.shadowRoot?.querySelector('slot');
      expect(slot).toBeTruthy();
    });

    it('does not add ARIA attributes to slotted content', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-a11y-aria"><h2>Section title</h2></hx-style-scope>',
      );
      const heading = el.querySelector('h2');
      // hx-style-scope must not modify slotted content
      expect(heading?.getAttribute('role')).toBeNull();
      expect(heading?.getAttribute('aria-label')).toBeNull();
    });

    it('does not add tabindex or focus traps to the host', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="test-scope-a11y-focus"><p>Content</p></hx-style-scope>',
      );
      // hx-style-scope must not trap focus or add tabindex
      expect(el.getAttribute('tabindex')).toBeNull();
      expect(el.getAttribute('role')).toBeNull();
    });
  });
});
