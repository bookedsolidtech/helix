import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixMeter } from './hx-meter.js';
import './index.js';

afterEach(cleanup);

describe('hx-meter', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "indicator" CSS part', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      const indicator = shadowQuery(el, '[part~="indicator"]');
      expect(indicator).toBeTruthy();
    });

    it('renders a native meter element for semantics', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      const native = shadowQuery(el, 'meter.meter__native');
      expect(native).toBeTruthy();
    });
  });

  // ─── Property: value ───

  describe('Property: value', () => {
    it('defaults to value=0', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      expect(el.value).toBe(0);
    });

    it('accepts value attribute', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="75"></hx-meter>');
      expect(el.value).toBe(75);
    });

    it('reflects value attribute to host', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="50"></hx-meter>');
      expect(el.getAttribute('value')).toBe('50');
    });

    it('clamps value below min to min', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="-10" min="0" max="100"></hx-meter>');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-valuenow')).toBe('0');
    });

    it('clamps value above max to max', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="150" min="0" max="100"></hx-meter>');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-valuenow')).toBe('100');
    });
  });

  // ─── Property: min/max ───

  describe('Property: min/max', () => {
    it('defaults to min=0 max=100', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      expect(el.min).toBe(0);
      expect(el.max).toBe(100);
    });

    it('accepts custom min and max', async () => {
      const el = await fixture<HelixMeter>('<hx-meter min="10" max="200"></hx-meter>');
      expect(el.min).toBe(10);
      expect(el.max).toBe(200);
    });

    it('sets aria-valuemin and aria-valuemax', async () => {
      const el = await fixture<HelixMeter>('<hx-meter min="5" max="50" value="25"></hx-meter>');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-valuemin')).toBe('5');
      expect(base?.getAttribute('aria-valuemax')).toBe('50');
    });
  });

  // ─── Property: label ───

  describe('Property: label', () => {
    it('defaults to undefined label', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      expect(el.label).toBeUndefined();
    });

    it('accepts label attribute', async () => {
      const el = await fixture<HelixMeter>('<hx-meter label="Disk usage"></hx-meter>');
      expect(el.label).toBe('Disk usage');
    });

    it('sets aria-label from label prop', async () => {
      const el = await fixture<HelixMeter>('<hx-meter label="Battery" value="80"></hx-meter>');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Battery');
    });

    it('shows label part when label is set', async () => {
      const el = await fixture<HelixMeter>('<hx-meter label="Storage"></hx-meter>');
      await el.updateComplete;
      const labelPart = shadowQuery(el, '[part="label"]');
      expect(labelPart).toBeTruthy();
    });

    it('renders label part even when label attribute is not set (for slot-based labeling)', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="50"></hx-meter>');
      await el.updateComplete;
      const labelPart = shadowQuery(el, '[part="label"]');
      expect(labelPart).toBeTruthy();
    });
  });

  // ─── Indicator width ───

  describe('Indicator width', () => {
    it('sets indicator width to 0% when value equals min', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="0" min="0" max="100"></hx-meter>');
      await el.updateComplete;
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator?.style.width).toBe('0%');
    });

    it('sets indicator width to 100% when value equals max', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="100" min="0" max="100"></hx-meter>');
      await el.updateComplete;
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator?.style.width).toBe('100%');
    });

    it('sets indicator width to 50% at mid-range', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="50" min="0" max="100"></hx-meter>');
      await el.updateComplete;
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator?.style.width).toBe('50%');
    });

    it('handles custom ranges correctly', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="15" min="10" max="20"></hx-meter>');
      await el.updateComplete;
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator?.style.width).toBe('50%');
    });
  });

  // ─── Threshold state ───

  describe('Threshold state', () => {
    it('has data-state="default" with no thresholds', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="50"></hx-meter>');
      await el.updateComplete;
      expect(el.dataset['state']).toBe('default');
    });

    it('has data-state="optimum" in middle zone when optimum is middle', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="50" min="0" max="100" low="25" high="75" optimum="50"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('optimum');
    });

    it('has data-state="warning" above high threshold when optimum is middle', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="80" min="0" max="100" low="25" high="75" optimum="50"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('warning');
    });

    it('has data-state="warning" below low threshold when optimum is middle', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="10" min="0" max="100" low="25" high="75" optimum="50"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('warning');
    });

    it('has data-state="danger" in low zone when optimum is high', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="10" min="0" max="100" low="25" high="75" optimum="90"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('danger');
    });

    it('has data-state="optimum" in high zone when optimum is high', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="90" min="0" max="100" low="25" high="75" optimum="90"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('optimum');
    });

    it('has data-state="optimum" without optimum in middle zone (low/high only)', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="50" min="0" max="100" low="25" high="75"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('optimum');
    });

    it('has data-state="warning" below low when no optimum set', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="10" min="0" max="100" low="25" high="75"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('warning');
    });

    it('has data-state="optimum" in low zone when optimum is low', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="10" min="0" max="100" low="25" high="75" optimum="10"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('optimum');
    });

    it('has data-state="warning" in middle zone when optimum is low', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="50" min="0" max="100" low="25" high="75" optimum="10"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('warning');
    });

    it('has data-state="danger" in high zone when optimum is low', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="90" min="0" max="100" low="25" high="75" optimum="10"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('danger');
    });

    it('has data-state="warning" in middle zone when optimum is high', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="50" min="0" max="100" low="25" high="75" optimum="90"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('warning');
    });

    it('has data-state="optimum" with only optimum set (no low/high)', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="50" min="0" max="100" optimum="50"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('optimum');
    });
  });

  // ─── ARIA ───

  describe('ARIA', () => {
    it('has role="meter" on the base element', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="50"></hx-meter>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('role')).toBe('meter');
    });

    it('has aria-valuenow matching value', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="42"></hx-meter>');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-valuenow')).toBe('42');
    });

    it('native meter has aria-hidden="true"', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="50"></hx-meter>');
      const native = shadowQuery(el, 'meter.meter__native');
      expect(native?.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not set aria-label when label is not provided', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="30" max="100"></hx-meter>');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.hasAttribute('aria-label')).toBe(false);
    });

    it('sets aria-valuetext with value and max in default state', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="30" max="100"></hx-meter>');
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-valuetext')).toBe('30 of 100');
    });

    it('sets aria-valuetext including state when thresholds produce optimum', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="50" min="0" max="100" low="25" high="75" optimum="50"></hx-meter>',
      );
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-valuetext')).toBe('50 of 100 (optimum)');
    });

    it('sets aria-valuetext including state when thresholds produce warning', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="80" min="0" max="100" low="25" high="75" optimum="50"></hx-meter>',
      );
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-valuetext')).toBe('80 of 100 (warning)');
    });

    it('sets aria-valuetext including state when thresholds produce danger', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="10" min="0" max="100" low="25" high="75" optimum="90"></hx-meter>',
      );
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-valuetext')).toBe('10 of 100 (danger)');
    });

    it('uses aria-labelledby when slot content is provided without label attribute', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="45" min="0" max="200"><span slot="label">Custom</span></hx-meter>',
      );
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-labelledby')).toBe('label');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "base" part', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      expect(shadowQuery(el, '[part~="base"]')).toBeTruthy();
    });

    it('exposes "indicator" part', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      expect(shadowQuery(el, '[part~="indicator"]')).toBeTruthy();
    });

    it('exposes "track" part', async () => {
      const el = await fixture<HelixMeter>('<hx-meter></hx-meter>');
      expect(shadowQuery(el, '[part~="track"]')).toBeTruthy();
    });

    it('exposes "label" part when label is set', async () => {
      const el = await fixture<HelixMeter>('<hx-meter label="Test"></hx-meter>');
      await el.updateComplete;
      expect(shadowQuery(el, '[part~="label"]')).toBeTruthy();
    });
  });

  // ─── Slot ───

  describe('Slot: label', () => {
    it('renders label slot content', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="50"><span slot="label">Custom label</span></hx-meter>',
      );
      const slotContent = el.querySelector('[slot="label"]');
      expect(slotContent).toBeTruthy();
      expect(slotContent?.textContent).toBe('Custom label');
    });
  });

  // ─── Boundary / Edge Cases ───

  describe('Boundary / Edge Cases', () => {
    it('value exactly at low threshold is in middle zone (optimum)', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="25" min="0" max="100" low="25" high="75" optimum="50"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('optimum');
    });

    it('value exactly at high threshold is in middle zone (optimum)', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="75" min="0" max="100" low="25" high="75" optimum="50"></hx-meter>',
      );
      await el.updateComplete;
      expect(el.dataset['state']).toBe('optimum');
    });

    it('handles min === max without throwing (zero-division guard)', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="5" min="5" max="5"></hx-meter>');
      await el.updateComplete;
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator?.style.width).toBe('0%');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixMeter>('<hx-meter value="50" label="Storage"></hx-meter>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with thresholds in optimum state', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="50" min="0" max="100" low="25" high="75" optimum="50" label="Score"></hx-meter>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with thresholds in warning state', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="80" min="0" max="100" low="25" high="75" optimum="50" label="Score"></hx-meter>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with full (100%) value', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="100" min="0" max="100" label="Full disk"></hx-meter>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with empty (0%) value', async () => {
      const el = await fixture<HelixMeter>(
        '<hx-meter value="0" min="0" max="100" label="Empty"></hx-meter>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
