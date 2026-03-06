import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixActionBar } from './hx-action-bar.js';
import './index.js';

afterEach(cleanup);

describe('hx-action-bar', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders [part="base"] with role="toolbar"', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
      expect(base?.getAttribute('role')).toBe('toolbar');
    });

    it('exposes start, center, end CSS parts', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      expect(shadowQuery(el, '[part="start"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="center"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="end"]')).toBeTruthy();
    });

    it('does not render an overflow slot', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      const overflowSlot = el.shadowRoot?.querySelector('slot[name="overflow"]');
      expect(overflowSlot).toBeNull();
    });
  });

  // ─── Property: label ───

  describe('Property: label', () => {
    it('defaults aria-label to "Actions"', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Actions');
    });

    it('uses label property for aria-label', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar label="Patient actions"></hx-action-bar>',
      );
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Patient actions');
    });

    it('reactively updates aria-label when label changes', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      el.label = 'Updated toolbar';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Updated toolbar');
    });
  });

  // ─── Property: size ───

  describe('Property: size', () => {
    it('defaults to md', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      expect(el.size).toBe('md');
    });

    it('reflects size attribute to host', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar size="sm"></hx-action-bar>');
      expect(el.getAttribute('size')).toBe('sm');
    });

    it('applies size class to base element', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar size="lg"></hx-action-bar>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.classList.contains('base--lg')).toBe(true);
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('defaults to default', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      expect(el.variant).toBe('default');
    });

    it('reflects variant attribute to host', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar variant="outlined"></hx-action-bar>',
      );
      expect(el.getAttribute('variant')).toBe('outlined');
    });

    it('applies variant class to base element', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar variant="filled"></hx-action-bar>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.classList.contains('base--filled')).toBe(true);
    });
  });

  // ─── Property: sticky ───

  describe('Property: sticky', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      expect(el.sticky).toBe(false);
    });

    it('reflects sticky attribute to host', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar sticky></hx-action-bar>');
      expect(el.hasAttribute('sticky')).toBe(true);
    });

    it('applies sticky class when sticky is true', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar sticky></hx-action-bar>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.classList.contains('base--sticky')).toBe(true);
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('renders start slot content', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar><button slot="start">Save</button></hx-action-bar>',
      );
      const btn = el.querySelector('[slot="start"]');
      expect(btn).toBeTruthy();
      expect(btn?.textContent).toBe('Save');
    });

    it('renders default (center) slot content', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar><span>Title</span></hx-action-bar>');
      const span = el.querySelector('span');
      expect(span?.textContent).toBe('Title');
    });

    it('renders end slot content', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar><button slot="end">Cancel</button></hx-action-bar>',
      );
      const btn = el.querySelector('[slot="end"]');
      expect(btn?.textContent).toBe('Cancel');
    });
  });

  // ─── Keyboard Navigation ───

  describe('Keyboard Navigation', () => {
    it('ArrowRight moves focus to next item', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="start" id="btn2">B</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn2 = el.querySelector<HTMLButtonElement>('#btn2');
      btn1?.focus();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(btn2);
    });

    it('ArrowLeft moves focus to previous item', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="start" id="btn2">B</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;

      const btn2 = el.querySelector<HTMLButtonElement>('#btn2');
      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      btn2?.focus();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(btn1);
    });

    it('ArrowRight wraps from last to first item', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="end" id="btn2">B</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn2 = el.querySelector<HTMLButtonElement>('#btn2');
      btn2?.focus();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(btn1);
    });

    it('ArrowLeft wraps from first to last item', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="end" id="btn2">B</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn2 = el.querySelector<HTMLButtonElement>('#btn2');
      btn1?.focus();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(btn2);
    });

    it('Home key moves focus to first item', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="start" id="btn2">B</button>
          <button slot="end" id="btn3">C</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn3 = el.querySelector<HTMLButtonElement>('#btn3');
      btn3?.focus();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(btn1);
    });

    it('End key moves focus to last item', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="start" id="btn2">B</button>
          <button slot="end" id="btn3">C</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn3 = el.querySelector<HTMLButtonElement>('#btn3');
      btn1?.focus();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(btn3);
    });

    it('skips disabled items in focusable discovery', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="start" id="btn2" disabled>B</button>
          <button slot="start" id="btn3">C</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn3 = el.querySelector<HTMLButtonElement>('#btn3');
      btn1?.focus();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(btn3);
    });

    it('skips aria-disabled items in focusable discovery', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <span slot="start" id="btn2" tabindex="0" aria-disabled="true">B</span>
          <button slot="start" id="btn3">C</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn3 = el.querySelector<HTMLButtonElement>('#btn3');
      btn1?.focus();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(btn3);
    });

    it('sets first focusable item to tabindex=0 on slotchange', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="start" id="btn2">B</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;
      // slotchange fires async after initial render — wait a microtask
      await new Promise((r) => setTimeout(r, 0));

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn2 = el.querySelector<HTMLButtonElement>('#btn2');
      expect(btn1?.getAttribute('tabindex')).toBe('0');
      expect(btn2?.getAttribute('tabindex')).toBe('-1');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar label="Actions"><button slot="start">Save</button></hx-action-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with outlined variant', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar label="Actions" variant="outlined"><button slot="start">Save</button><button slot="end">Cancel</button></hx-action-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with filled variant', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar label="Actions" variant="filled"><button slot="start">Save</button></hx-action-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with sticky', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar label="Actions" sticky><button slot="start">Save</button></hx-action-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
