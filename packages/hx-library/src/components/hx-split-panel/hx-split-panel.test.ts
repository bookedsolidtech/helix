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

  // ─── Property: min / max ───

  describe('Property: min / max', () => {
    it('defaults to min=0, max=100', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      expect(el.min).toBe(0);
      expect(el.max).toBe(100);
    });

    it('reflects min attribute', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel min="10"></hx-split-panel>');
      expect(el.min).toBe(10);
    });

    it('reflects max attribute', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel max="90"></hx-split-panel>');
      expect(el.max).toBe(90);
    });

    it('Home moves divider to min value', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50" min="20"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(20);
    });

    it('End moves divider to max value', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50" max="80"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(80);
    });

    it('clamps position to min on ArrowLeft', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="21" min="20"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(20);
    });

    it('clamps position to max on ArrowRight', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="89" max="90"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(90);
    });

    it('aria-valuemin reflects min', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel min="10"></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-valuemin')).toBe('10');
    });

    it('aria-valuemax reflects max', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel max="90"></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-valuemax')).toBe('90');
    });
  });

  // ─── Property: snap ───

  describe('Property: snap', () => {
    it('accepts snap as JSON array string via attribute', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel snap="[25,50,75]"></hx-split-panel>',
      );
      expect(el.snap).toEqual([25, 50, 75]);
    });

    it('accepts snap as comma-separated string via attribute', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel snap="25,50,75"></hx-split-panel>',
      );
      expect(el.snap).toEqual([25, 50, 75]);
    });

    it('empty snap attribute yields empty array', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      expect(el.snap).toEqual([]);
    });
  });

  // ─── ARIA ───

  describe('ARIA', () => {
    it('divider has role="separator"', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('role')).toBe('separator');
    });

    it('divider has aria-label="Resize panels"', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-label')).toBe('Resize panels');
    });

    it('divider has aria-valuenow reflecting position', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="30"></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-valuenow')).toBe('30');
    });

    it('divider has aria-valuemin="0" by default', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-valuemin')).toBe('0');
    });

    it('divider has aria-valuemax="100" by default', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-valuemax')).toBe('100');
    });

    it('divider aria-orientation is "vertical" for horizontal split', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel orientation="horizontal"></hx-split-panel>',
      );
      const divider = shadowQuery(el, '[part="divider"]');
      // A vertical divider bar separates content horizontally — aria-orientation is "vertical"
      expect(divider?.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('divider aria-orientation is "horizontal" for vertical split', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel orientation="vertical"></hx-split-panel>',
      );
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('aria-disabled is absent when not disabled', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.hasAttribute('aria-disabled')).toBe(false);
    });

    it('aria-disabled="true" when disabled', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel disabled></hx-split-panel>');
      const divider = shadowQuery(el, '[part="divider"]');
      expect(divider?.getAttribute('aria-disabled')).toBe('true');
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

    it('PageUp increases position by 10', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(60);
    });

    it('PageDown decreases position by 10', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="50"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(40);
    });

    it('PageUp clamps at max', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="95"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(100);
    });

    it('PageDown clamps at min', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel position="5"></hx-split-panel>');
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
      await el.updateComplete;
      expect(el.position).toBe(0);
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

  // ─── Pointer / Drag Interaction ───

  describe('Pointer drag interaction', () => {
    it('pointerdown on divider acquires pointer capture when not disabled', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel position="50" style="width:400px;"></hx-split-panel>',
      );
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      const spy = vi.spyOn(divider!, 'setPointerCapture').mockImplementation(() => {});
      divider?.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 200, pointerId: 1, bubbles: true }),
      );
      expect(spy).toHaveBeenCalledWith(1);
      spy.mockRestore();
    });

    it('pointerdown does nothing when disabled', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel position="50" disabled style="width:400px;"></hx-split-panel>',
      );
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      const spy = vi.spyOn(divider!, 'setPointerCapture').mockImplementation(() => {});
      divider?.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 200, pointerId: 1, bubbles: true }),
      );
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('pointermove changes position during drag', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel position="50" style="width:400px;display:block;"></hx-split-panel>',
      );
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      vi.spyOn(divider!, 'setPointerCapture').mockImplementation(() => {});

      divider?.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 200, pointerId: 1, bubbles: true }),
      );
      divider?.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 300, pointerId: 1, bubbles: true }),
      );
      await el.updateComplete;

      // If offsetWidth is 0 (test env), position won't change (hostSize === 0 guard)
      // If offsetWidth is non-zero, position should change
      if (el.offsetWidth > 0) {
        expect(el.position).toBeGreaterThan(50);
      } else {
        expect(el.position).toBe(50); // hostSize=0 guard fired
      }
    });

    it('pointermove does nothing when not dragging', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel position="50" style="width:400px;"></hx-split-panel>',
      );
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      divider?.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 300, pointerId: 1, bubbles: true }),
      );
      await el.updateComplete;
      expect(el.position).toBe(50);
    });

    it('pointerup stops dragging — subsequent pointermove has no effect', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel position="50" style="width:400px;"></hx-split-panel>',
      );
      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      vi.spyOn(divider!, 'setPointerCapture').mockImplementation(() => {});

      divider?.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 200, pointerId: 1, bubbles: true }),
      );
      divider?.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
      const positionAfterUp = el.position;
      divider?.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 350, pointerId: 1, bubbles: true }),
      );
      await el.updateComplete;
      expect(el.position).toBe(positionAfterUp);
    });

    it('drag fires hx-reposition event when position changes', async () => {
      const el = document.createElement('hx-split-panel') as HelixSplitPanel;
      el.position = 50;
      // Mock offsetWidth to 400 so drag math works
      Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => 400 });
      document.body.appendChild(el);
      await el.updateComplete;

      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      vi.spyOn(divider!, 'setPointerCapture').mockImplementation(() => {});

      const eventPromise = oneEvent(el, 'hx-reposition');
      divider?.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 200, pointerId: 1, bubbles: true }),
      );
      divider?.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 300, pointerId: 1, bubbles: true }),
      );
      const event = await eventPromise;
      expect((event as CustomEvent).detail.position).toBeGreaterThan(50);

      document.body.removeChild(el);
    });

    it('drag in vertical orientation uses clientY', async () => {
      const el = document.createElement('hx-split-panel') as HelixSplitPanel;
      el.orientation = 'vertical';
      el.position = 50;
      Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => 400 });
      document.body.appendChild(el);
      await el.updateComplete;

      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      vi.spyOn(divider!, 'setPointerCapture').mockImplementation(() => {});

      const eventPromise = oneEvent(el, 'hx-reposition');
      divider?.dispatchEvent(
        new PointerEvent('pointerdown', { clientY: 200, pointerId: 1, bubbles: true }),
      );
      divider?.dispatchEvent(
        new PointerEvent('pointermove', { clientY: 300, pointerId: 1, bubbles: true }),
      );
      const event = await eventPromise;
      expect((event as CustomEvent).detail.position).toBeGreaterThan(50);

      document.body.removeChild(el);
    });

    it('_dragging flag: pointermove with zero host size does nothing', async () => {
      const el = document.createElement('hx-split-panel') as HelixSplitPanel;
      el.position = 50;
      // Mock offsetWidth to 0 so the hostSize guard fires
      Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => 0 });
      document.body.appendChild(el);
      await el.updateComplete;

      const divider = shadowQuery<HTMLElement>(el, '[part="divider"]');
      vi.spyOn(divider!, 'setPointerCapture').mockImplementation(() => {});

      divider?.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 200, pointerId: 1, bubbles: true }),
      );
      divider?.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 300, pointerId: 1, bubbles: true }),
      );
      await el.updateComplete;
      expect(el.position).toBe(50);

      document.body.removeChild(el);
    });
  });

  // ─── Property: positionInPixels ───

  describe('Property: positionInPixels', () => {
    it('converts positionInPixels to percentage using _setPosition (fires event)', async () => {
      const el = document.createElement('hx-split-panel') as HelixSplitPanel;
      el.setAttribute('position', '30');
      el.setAttribute('position-in-pixels', '200');
      // Mock offsetWidth to 400 → 200/400 * 100 = 50%
      Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => 400 });

      const events: CustomEvent[] = [];
      el.addEventListener('hx-reposition', (e) => events.push(e as CustomEvent));

      document.body.appendChild(el);
      // Wait for rAF
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await el.updateComplete;
      document.body.removeChild(el);

      // 200/400 * 100 = 50%, different from position=30 → event should fire
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].detail.position).toBeCloseTo(50, 0);
    });

    it('positionInPixels with snap: snaps to nearest snap point', async () => {
      const el = document.createElement('hx-split-panel') as HelixSplitPanel;
      el.setAttribute('position', '30');
      el.setAttribute('position-in-pixels', '204'); // 204/400*100 = 51%, within 5% of snap 50
      el.snap = [25, 50, 75];
      Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => 400 });

      document.body.appendChild(el);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await el.updateComplete;
      document.body.removeChild(el);

      expect(el.position).toBe(50); // snapped to 50
    });

    it('positionInPixels: skips conversion when host size is 0', async () => {
      const el = document.createElement('hx-split-panel') as HelixSplitPanel;
      el.setAttribute('position', '30');
      el.setAttribute('position-in-pixels', '200');
      // Mock offsetWidth to 0 so hostSize guard fires
      Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => 0 });

      document.body.appendChild(el);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await el.updateComplete;
      document.body.removeChild(el);

      expect(el.position).toBe(30); // unchanged, hostSize=0
    });
  });

  // ─── Collapsible ───

  describe('Collapsible', () => {
    it('renders collapse buttons when collapsible=true', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel collapsible></hx-split-panel>');
      const buttons = el.shadowRoot?.querySelectorAll('.collapse-btn');
      expect(buttons?.length).toBe(2);
    });

    it('renders no collapse buttons when collapsible=false', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel></hx-split-panel>');
      const buttons = el.shadowRoot?.querySelectorAll('.collapse-btn');
      expect(buttons?.length).toBe(0);
    });

    it('collapses start panel when collapse-start button is clicked', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel collapsible position="50"></hx-split-panel>',
      );
      const btn = el.shadowRoot?.querySelector('[aria-label="Collapse start panel"]') as HTMLElement;
      btn?.click();
      await el.updateComplete;
      expect(el.collapsed).toBe('start');
      expect(el.position).toBe(0);
    });

    it('collapses end panel when collapse-end button is clicked', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel collapsible position="50"></hx-split-panel>',
      );
      const btn = el.shadowRoot?.querySelector('[aria-label="Collapse end panel"]') as HTMLElement;
      btn?.click();
      await el.updateComplete;
      expect(el.collapsed).toBe('end');
      expect(el.position).toBe(100);
    });

    it('expands start panel and restores previous position', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel collapsible position="60"></hx-split-panel>',
      );
      // Collapse start
      const collapseBtn = el.shadowRoot?.querySelector(
        '[aria-label="Collapse start panel"]',
      ) as HTMLElement;
      collapseBtn?.click();
      await el.updateComplete;
      expect(el.position).toBe(0);
      // Expand
      const expandBtn = el.shadowRoot?.querySelector(
        '[aria-label="Expand start panel"]',
      ) as HTMLElement;
      expandBtn?.click();
      await el.updateComplete;
      expect(el.collapsed).toBeNull();
      expect(el.position).toBe(60);
    });

    it('expands end panel and restores previous position', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel collapsible position="40"></hx-split-panel>',
      );
      const collapseBtn = el.shadowRoot?.querySelector(
        '[aria-label="Collapse end panel"]',
      ) as HTMLElement;
      collapseBtn?.click();
      await el.updateComplete;
      expect(el.position).toBe(100);

      const expandBtn = el.shadowRoot?.querySelector(
        '[aria-label="Expand end panel"]',
      ) as HTMLElement;
      expandBtn?.click();
      await el.updateComplete;
      expect(el.collapsed).toBeNull();
      expect(el.position).toBe(40);
    });

    it('setting collapsed="start" via property moves position to min', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel collapsible position="60"></hx-split-panel>',
      );
      el.collapsed = 'start';
      await el.updateComplete;
      expect(el.position).toBe(0);
    });

    it('setting collapsed="end" via property moves position to max', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel collapsible position="40"></hx-split-panel>',
      );
      el.collapsed = 'end';
      await el.updateComplete;
      expect(el.position).toBe(100);
    });

    it('setting collapsed=null restores pre-collapse position', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel collapsible position="70"></hx-split-panel>',
      );
      el.collapsed = 'start';
      await el.updateComplete;
      el.collapsed = null;
      await el.updateComplete;
      expect(el.position).toBe(70);
    });

    it('collapsed attribute reflected on host element', async () => {
      const el = await fixture<HelixSplitPanel>('<hx-split-panel collapsible></hx-split-panel>');
      el.collapsed = 'end';
      await el.updateComplete;
      expect(el.getAttribute('collapsed')).toBe('end');
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

    it('has no axe violations — collapsible', async () => {
      const el = await fixture<HelixSplitPanel>(
        '<hx-split-panel collapsible><div slot="start">Start</div><div slot="end">End</div></hx-split-panel>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
