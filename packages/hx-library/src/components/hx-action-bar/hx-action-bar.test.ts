import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixActionBar } from './hx-action-bar.js';
import './index.js';

afterEach(cleanup);

describe('hx-action-bar', () => {
  // ─── Rendering (4) ───

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

    it('uses aria-label from host attribute', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar aria-label="Patient actions"></hx-action-bar>',
      );
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Patient actions');
    });

    it('updates aria-label reactively after initial render', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar aria-label="Initial label"></hx-action-bar>',
      );
      el.setAttribute('aria-label', 'Updated label');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Updated label');
    });
  });

  // ─── Property: size (3) ───

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

  // ─── Property: variant (3) ───

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

  // ─── Property: position (4) ───

  describe('Property: position', () => {
    it('defaults to top', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      expect(el.position).toBe('top');
    });

    it('reflects position attribute to host', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar position="sticky"></hx-action-bar>');
      expect(el.getAttribute('position')).toBe('sticky');
    });

    it('applies sticky class when position="sticky"', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar position="sticky"></hx-action-bar>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.classList.contains('base--sticky')).toBe(true);
    });

    it('applies bottom class when position="bottom"', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar position="bottom"></hx-action-bar>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.classList.contains('base--bottom')).toBe(true);
    });

    it('legacy sticky boolean applies sticky class', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar sticky></hx-action-bar>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.classList.contains('base--sticky')).toBe(true);
    });
  });

  // ─── Slots (4) ───

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

    it('overflow slot is hidden when empty', async () => {
      const el = await fixture<HelixActionBar>('<hx-action-bar></hx-action-bar>');
      await el.updateComplete;
      const overflowSection = el.shadowRoot?.querySelector('.section--overflow');
      expect(overflowSection?.hasAttribute('hidden')).toBe(true);
    });

    it('overflow slot becomes visible when content is assigned', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar><button slot="overflow">More</button></hx-action-bar>',
      );
      await el.updateComplete;
      const overflowSection = el.shadowRoot?.querySelector('.section--overflow');
      expect(overflowSection?.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── Keyboard Navigation (7) ───

  describe('Keyboard Navigation', () => {
    it('_initRovingTabindex sets first item tabindex=0', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="start" id="btn2">B</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;
      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn2 = el.querySelector<HTMLButtonElement>('#btn2');
      expect(btn1?.getAttribute('tabindex')).toBe('0');
      expect(btn2?.getAttribute('tabindex')).toBe('-1');
    });

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

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn2 = el.querySelector<HTMLButtonElement>('#btn2');
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

    it('Home key moves focus directly to first item without visiting others', async () => {
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

      const focusEvents: string[] = [];
      el.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('focus', () => focusEvents.push(btn.id));
      });

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(btn1);
      // Only btn1 should have received a focus event — no spurious focus on last item
      expect(focusEvents).toEqual(['btn1']);
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

    it('disabled button is excluded from keyboard navigation', async () => {
      const el = await fixture<HelixActionBar>(
        `<hx-action-bar>
          <button slot="start" id="btn1">A</button>
          <button slot="start" id="btn2" disabled>B (disabled)</button>
          <button slot="end" id="btn3">C</button>
        </hx-action-bar>`,
      );
      await el.updateComplete;

      const btn1 = el.querySelector<HTMLButtonElement>('#btn1');
      const btn2 = el.querySelector<HTMLButtonElement>('#btn2');
      const btn3 = el.querySelector<HTMLButtonElement>('#btn3');

      // btn2 should not have a tabindex set by roving tabindex
      expect(btn2?.getAttribute('tabindex')).toBeNull();

      btn1?.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;

      // Focus skips disabled btn2 and goes to btn3
      expect(document.activeElement).toBe(btn3);
    });

    it('disconnectedCallback removes keydown listener', async () => {
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

      // Detach element from DOM
      el.remove();

      // Dispatch keydown — should not move focus (listener removed)
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).not.toBe(btn2);
    });
  });

  // ─── Accessibility (axe-core) (4) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar aria-label="Actions"><button slot="start">Save</button></hx-action-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with outlined variant', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar aria-label="Actions" variant="outlined"><button slot="start">Save</button><button slot="end">Cancel</button></hx-action-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with filled variant', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar aria-label="Actions" variant="filled"><button slot="start">Save</button></hx-action-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in sticky state', async () => {
      const el = await fixture<HelixActionBar>(
        '<hx-action-bar aria-label="Actions" position="sticky"><button slot="start">Save</button></hx-action-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
