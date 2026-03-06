import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y, oneEvent } from '../../test-utils.js';
import type { HelixSplitPanel } from './hx-split-panel.js';
import './index.js';

afterEach(cleanup);

describe('hx-split-panel', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "start" CSS part', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      expect(shadowQuery(el, '[part~="start"]')).toBeTruthy();
    });

    it('exposes "divider" CSS part', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      expect(shadowQuery(el, '[part~="divider"]')).toBeTruthy();
    });

    it('exposes "end" CSS part', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      expect(shadowQuery(el, '[part~="end"]')).toBeTruthy();
    });
  });

  // ─── Property: position ───

  describe('Property: position', () => {
    it('defaults to 50', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      expect(el.position).toBe(50);
    });

    it('reflects position attribute', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="30"></hx-split-panel>');
      expect(el.position).toBe(30);
      expect(el.getAttribute('position')).toBe('30');
    });

    it('applies position as inline style on start panel', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="40"></hx-split-panel>');
      const start = shadowQuery<HTMLElement>(el, '[part="start"]');
      expect(start?.style.width).toBe('40%');
    });

    it('applies position as height when orientation is vertical', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel position="40" orientation="vertical"></hx-split-panel>',
      );
      const start = shadowQuery<HTMLElement>(el, '[part="start"]');
      expect(start?.style.height).toBe('40%');
    });
  });

  // ─── Property: orientation ───

  describe('Property: orientation', () => {
    it('defaults to horizontal', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      expect(el.orientation).toBe('horizontal');
    });

    it('reflects orientation attribute', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel orientation="vertical"></hx-split-panel>',
      );
      expect(el.getAttribute('orientation')).toBe('vertical');
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel disabled></hx-split-panel>');
      expect(el.disabled).toBe(true);
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('sets tabindex=-1 on divider when disabled', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel disabled></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('tabindex')).toBe('-1');
    });

    it('sets tabindex=0 on divider when not disabled', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('tabindex')).toBe('0');
    });
  });

  // ─── ARIA ───

  describe('ARIA', () => {
    it('divider has role="separator"', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('role')).toBe('separator');
    });

    it('divider has aria-valuenow reflecting position', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="30"></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-valuenow')).toBe('30');
    });

    it('divider has aria-valuemin="0"', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-valuemin')).toBe('0');
    });

    it('divider has aria-valuemax="100"', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-valuemax')).toBe('100');
    });

    it('divider aria-orientation is "vertical" for horizontal split', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel orientation="horizontal"></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      // A vertical divider bar separates content horizontally — aria-orientation is "vertical"
      expect(divider?.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('divider aria-orientation is "horizontal" for vertical split', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel orientation="vertical"></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-orientation')).toBe('horizontal');
    });
  });

  // ─── Keyboard Interaction ───

  describe('Keyboard interaction', () => {
    it('ArrowRight increases position by 1', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(51);
    });

    it('ArrowLeft decreases position by 1', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(49);
    });

    it('ArrowDown increases position by 1 (vertical)', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel position="50" orientation="vertical"></hx-split-panel>',
      );
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(51);
    });

    it('ArrowUp decreases position by 1 (vertical)', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel position="50" orientation="vertical"></hx-split-panel>',
      );
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(49);
    });

    it('Home moves divider to 0', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(0);
    });

    it('End moves divider to 100', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(100);
    });

    it('keyboard does nothing when disabled', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel position="50" disabled></hx-split-panel>',
      );
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(50);
    });

    it('clamps position at 100 on ArrowRight at max', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="100"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(100);
    });

    it('clamps position at 0 on ArrowLeft at min', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="0"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(0);
    });
  });

  // ─── Snap Points ───

  describe('Snap points', () => {
    it('snaps to nearest snap point within threshold', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50"></hx-split-panel>');
      el.snap = [25, 75];
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      // Move left 22 times from 50: 50 -> 28, which is within 5% of snap point 25
      for (let i = 0; i < 22; i++) {
        divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      }
      await el.updateComplete;
      expect(el.position).toBe(25); // snapped from 28 to nearest snap point 25
    });

    it('does not snap when outside threshold', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50"></hx-split-panel>');
      el.snap = [25];
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      // Move to 40 — not within 5% of 25
      for (let i = 0; i < 10; i++) {
        divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      }
      await el.updateComplete;
      expect(el.position).toBe(40); // no snap
    });
  });

  // ─── hx-reposition event ───

  describe('Event: hx-reposition', () => {
    it('fires hx-reposition on keyboard move', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      const eventPromise = oneEvent(el, 'hx-reposition');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const event = await eventPromise;
      expect((event as CustomEvent).detail.position).toBe(51);
    });

    it('does not fire hx-reposition when position does not change', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="100"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      const handler = vi.fn();
      el.addEventListener('hx-reposition', handler);
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('renders start slot content', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel><div slot="start" id="s">start</div></hx-split-panel>',
      );
      expect(el.querySelector('#s')).toBeTruthy();
    });

    it('renders end slot content', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel><div slot="end" id="e">end</div></hx-split-panel>',
      );
      expect(el.querySelector('#e')).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations — horizontal default', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel><div slot="start">Start</div><div slot="end">End</div></hx-split-panel>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — vertical', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel orientation="vertical"><div slot="start">Start</div><div slot="end">End</div></hx-split-panel>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — disabled', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel disabled><div slot="start">Start</div><div slot="end">End</div></hx-split-panel>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
