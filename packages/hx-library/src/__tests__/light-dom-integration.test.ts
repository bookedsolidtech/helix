import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup } from '../test-utils.js';
import type { HxStyleScope } from '../components/hx-style-scope/hx-style-scope.js';
import '../components/hx-style-scope/index.js';
import { lightStyleRegistry } from '../utilities/lightStyleRegistry.js';
import { SheetManager } from '../utilities/sheetManager.js';

function cleanupStyles(prefix: string): void {
  for (const [name, el] of lightStyleRegistry.entries()) {
    if (name.startsWith(prefix)) {
      el.remove();
      lightStyleRegistry.delete(name);
    }
  }
}

afterEach(() => {
  cleanup();
  cleanupStyles('integ-');
});

describe('light DOM integration', () => {
  describe('end-to-end style injection', () => {
    it('injects a style into document.head when hx-style-scope connects with light-css', async () => {
      const name = 'integ-card';
      const before = document.head.querySelectorAll('style[data-hx-light-styles]').length;

      await fixture<HxStyleScope>(
        `<hx-style-scope component="${name}" light-css="p { color: red; }"></hx-style-scope>`,
      );

      const after = document.head.querySelectorAll('style[data-hx-light-styles]').length;
      expect(after).toBe(before + 1);
    });

    it('injected style scopes selectors under [data-hx-styled]', async () => {
      const name = 'integ-dialog';
      await fixture<HxStyleScope>(
        `<hx-style-scope component="${name}" light-css="p { font-size: var(--hx-font-size-md); }"></hx-style-scope>`,
      );

      const styleEl = document.head.querySelector(
        `style[data-hx-light-styles="${name}"]`,
      ) as HTMLStyleElement | null;
      expect(styleEl?.textContent).toContain(`[data-hx-styled="${name}"]`);
      expect(styleEl?.textContent).toContain('var(--hx-font-size-md)');
    });

    it('hx-style-scope element has data-hx-styled attribute set', async () => {
      const name = 'integ-banner';
      const el = await fixture<HxStyleScope>(
        `<hx-style-scope component="${name}"></hx-style-scope>`,
      );
      await el.updateComplete;
      expect(el.getAttribute('data-hx-styled')).toBe(name);
    });
  });

  describe('isolation between component types', () => {
    it('separate injections for different component names', async () => {
      const nameA = 'integ-type-a';
      const nameB = 'integ-type-b';

      await fixture<HxStyleScope>(
        `<hx-style-scope component="${nameA}" light-css="p { color: red; }"></hx-style-scope>`,
      );
      await fixture<HxStyleScope>(
        `<hx-style-scope component="${nameB}" light-css="p { color: blue; }"></hx-style-scope>`,
      );

      const elA = document.head.querySelector(`style[data-hx-light-styles="${nameA}"]`);
      const elB = document.head.querySelector(`style[data-hx-light-styles="${nameB}"]`);

      expect(elA).toBeTruthy();
      expect(elB).toBeTruthy();
      expect(elA).not.toBe(elB);
    });

    it('style from one component does not include scope for another', async () => {
      const nameA = 'integ-iso-a';
      const nameB = 'integ-iso-b';

      await fixture<HxStyleScope>(
        `<hx-style-scope component="${nameA}" light-css="p { color: red; }"></hx-style-scope>`,
      );
      await fixture<HxStyleScope>(
        `<hx-style-scope component="${nameB}" light-css="p { color: blue; }"></hx-style-scope>`,
      );

      const elA = document.head.querySelector(
        `style[data-hx-light-styles="${nameA}"]`,
      ) as HTMLStyleElement | null;

      expect(elA?.textContent).toContain(`[data-hx-styled="${nameA}"]`);
      expect(elA?.textContent).not.toContain(`[data-hx-styled="${nameB}"]`);
    });
  });

  describe('SheetManager integration', () => {
    it('SheetManager.inject adds a style to the document', () => {
      const manager = new SheetManager();
      const name = 'integ-sheet-mgr';

      manager.inject(name, 'p { margin: 0; }');

      const el = document.head.querySelector(`style[data-hx-light-styles="${name}"]`);
      expect(el).toBeTruthy();
      expect(manager.getInjectedCount()).toBe(1);

      manager.cleanupAll();
    });

    it('SheetManager.cleanup removes the style from the document', () => {
      const manager = new SheetManager();
      const name = 'integ-sheet-cleanup';

      manager.inject(name, 'p { color: teal; }');
      expect(document.head.querySelector(`style[data-hx-light-styles="${name}"]`)).toBeTruthy();

      manager.cleanup(name);
      expect(document.head.querySelector(`style[data-hx-light-styles="${name}"]`)).toBeNull();
      expect(lightStyleRegistry.has(name)).toBe(false);
      expect(manager.getInjectedCount()).toBe(0);
    });

    it('SheetManager.cleanupAll removes all injected styles', () => {
      const manager = new SheetManager();
      const names = ['integ-all-a', 'integ-all-b', 'integ-all-c'];

      for (const n of names) {
        manager.inject(n, 'p { color: teal; }');
      }
      expect(manager.getInjectedCount()).toBe(3);

      manager.cleanupAll();
      expect(manager.getInjectedCount()).toBe(0);

      for (const n of names) {
        expect(document.head.querySelector(`style[data-hx-light-styles="${n}"]`)).toBeNull();
      }
    });
  });
});
