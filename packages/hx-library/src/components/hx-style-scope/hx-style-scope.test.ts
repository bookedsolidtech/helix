import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HxStyleScope } from './hx-style-scope.js';
import './index.js';

afterEach(cleanup);

describe('hx-style-scope', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a default slot', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot');
      expect(slot).toBeTruthy();
    });

    it('slot has no name attribute (default slot)', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot');
      expect(slot?.name).toBe('');
    });
  });

  // ─── Slot rendering ───

  describe('Slot rendering', () => {
    it('projects slotted light DOM content', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope><p id="content">Hello</p></hx-style-scope>',
      );
      const content = el.querySelector('#content');
      expect(content).toBeTruthy();
      expect(content?.textContent).toBe('Hello');
    });

    it('slot reflects assigned elements', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope><span>Item 1</span><span>Item 2</span></hx-style-scope>',
      );
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot')!;
      const assigned = slot.assignedElements();
      expect(assigned.length).toBe(2);
    });

    it('renders empty state (no slot content) without error', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      expect(el.shadowRoot).toBeTruthy();
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot')!;
      expect(slot.assignedElements().length).toBe(0);
    });

    it('updates slotted content when children are appended programmatically', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      const child = document.createElement('p');
      child.id = 'dynamic';
      child.textContent = 'Dynamic content';
      el.appendChild(child);
      await el.updateComplete;

      const found = el.querySelector('#dynamic');
      expect(found).toBeTruthy();
    });
  });

  // ─── Property: component ───

  describe('Property: component', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      expect(el.component).toBe('');
    });

    it('reflects component attribute to property', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="hx-card"></hx-style-scope>',
      );
      expect(el.component).toBe('hx-card');
    });

    it('reflects component property to attribute', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      el.component = 'hx-button';
      await el.updateComplete;
      expect(el.getAttribute('component')).toBe('hx-button');
    });

    it('does not set data-hx-styled when component is empty', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      await el.updateComplete;
      expect(el.hasAttribute('data-hx-styled')).toBe(false);
    });

    it('sets data-hx-styled attribute when component is set via attribute', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="hx-card"></hx-style-scope>',
      );
      await el.updateComplete;
      expect(el.getAttribute('data-hx-styled')).toBe('hx-card');
    });

    it('sets data-hx-styled when component property is set programmatically', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      el.component = 'hx-text-input';
      await el.updateComplete;
      expect(el.getAttribute('data-hx-styled')).toBe('hx-text-input');
    });

    it('updates data-hx-styled when component property changes', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="hx-card"></hx-style-scope>',
      );
      await el.updateComplete;
      expect(el.getAttribute('data-hx-styled')).toBe('hx-card');

      el.component = 'hx-button';
      await el.updateComplete;
      expect(el.getAttribute('data-hx-styled')).toBe('hx-button');
    });
  });

  // ─── Property: lightCss ───

  describe('Property: lightCss', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      expect(el.lightCss).toBe('');
    });

    it('accepts lightCss property', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="hx-scope-test-a"></hx-style-scope>',
      );
      el.lightCss = 'p { color: red; }';
      await el.updateComplete;
      expect(el.lightCss).toBe('p { color: red; }');
    });
  });

  // ─── CSS injection ───

  describe('CSS injection into document.head', () => {
    beforeEach(() => {
      // Remove any previously injected test styles to keep tests isolated
      document
        .querySelectorAll('style[data-hx-light-styles^="hx-scope-inject"]')
        .forEach((s) => s.remove());
    });

    it('injects a <style> element into document.head when component and lightCss are set', async () => {
      const componentName = 'hx-scope-inject-1';
      // Remove pre-existing style for this component if it exists (registry dedup)
      document
        .querySelector(`style[data-hx-light-styles="${componentName}"]`)
        ?.remove();

      const el = await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}"></hx-style-scope>`,
      );
      el.lightCss = 'p { font-size: 1rem; }';
      await el.updateComplete;

      const styleEl = document.querySelector(`style[data-hx-light-styles="${componentName}"]`);
      expect(styleEl).toBeTruthy();
    });

    it('does not inject a style when lightCss is empty', async () => {
      const componentName = 'hx-scope-inject-no-css';
      document
        .querySelector(`style[data-hx-light-styles="${componentName}"]`)
        ?.remove();

      const el = await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}"></hx-style-scope>`,
      );
      // lightCss is empty (default) — no injection should occur
      await el.updateComplete;

      const styleEl = document.querySelector(`style[data-hx-light-styles="${componentName}"]`);
      expect(styleEl).toBeNull();
    });

    it('injected style is scoped under data-hx-styled attribute selector', async () => {
      const componentName = 'hx-scope-inject-2';
      document
        .querySelector(`style[data-hx-light-styles="${componentName}"]`)
        ?.remove();

      const el = await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}"></hx-style-scope>`,
      );
      el.lightCss = 'p { color: blue; }';
      await el.updateComplete;

      const styleEl = document.querySelector(`style[data-hx-light-styles="${componentName}"]`);
      // Scoped CSS should include the data-hx-styled selector
      expect(styleEl?.textContent).toContain(`[data-hx-styled="${componentName}"]`);
    });

    it('does not inject duplicate styles for the same component name', async () => {
      const componentName = 'hx-scope-inject-3';
      document
        .querySelector(`style[data-hx-light-styles="${componentName}"]`)
        ?.remove();

      const el1 = await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}"></hx-style-scope>`,
      );
      el1.lightCss = 'p { margin: 0; }';
      await el1.updateComplete;

      const el2 = await fixture<HxStyleScope>(
        `<hx-style-scope component="${componentName}"></hx-style-scope>`,
      );
      el2.lightCss = 'p { padding: 0; }';
      await el2.updateComplete;

      const styleEls = document.querySelectorAll(
        `style[data-hx-light-styles="${componentName}"]`,
      );
      // Deduplication should ensure only one <style> element per component
      expect(styleEls.length).toBe(1);
    });
  });

  // ─── connectedCallback ───

  describe('connectedCallback behavior', () => {
    it('sets data-hx-styled on connect when component is pre-set via attribute', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="hx-connected-test"></hx-style-scope>',
      );
      expect(el.getAttribute('data-hx-styled')).toBe('hx-connected-test');
    });

    it('does not set data-hx-styled on connect when no component attribute is set', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      expect(el.hasAttribute('data-hx-styled')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HxStyleScope>('<hx-style-scope></hx-style-scope>');
      await page.screenshot();
      // useElement: true so axe traverses the full composed tree including slotted light DOM
      const { violations } = await checkA11y(el, { useElement: true });
      expect(violations).toEqual([]);
    });

    it('has no axe violations with slotted content', async () => {
      const el = await fixture<HxStyleScope>(
        '<hx-style-scope component="hx-card"><p>Some healthcare content</p></hx-style-scope>',
      );
      await page.screenshot();
      // useElement: true so axe traverses the full composed tree including slotted light DOM
      const { violations } = await checkA11y(el, { useElement: true });
      expect(violations).toEqual([]);
    });
  });
});
