import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixStat } from './hx-stat.js';
import './index.js';

afterEach(cleanup);

describe('hx-stat', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Users" value="42"></hx-stat>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the value text', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Users" value="1,234"></hx-stat>');
      const valuePart = shadowQuery(el, '[part~="value"]');
      expect(valuePart).toBeTruthy();
      expect(valuePart?.textContent).toBe('1,234');
    });

    it('renders the label text', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Active Users" value="42"></hx-stat>');
      const labelPart = shadowQuery(el, '[part~="label"]');
      expect(labelPart).toBeTruthy();
      expect(labelPart?.textContent).toBe('Active Users');
    });

    it('applies default size=md class', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Users" value="42"></hx-stat>');
      const container = shadowQuery(el, '.stat');
      expect(container?.classList.contains('stat--md')).toBe(true);
    });
  });

  // ─── Property: value (2) ───

  describe('Property: value', () => {
    it('reflects value attribute', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="99"></hx-stat>');
      expect(el.getAttribute('value')).toBe('99');
    });

    it('updates displayed value when property changes', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="10"></hx-stat>');
      el.value = '200';
      await el.updateComplete;
      const valuePart = shadowQuery(el, '[part~="value"]');
      expect(valuePart?.textContent).toBe('200');
    });
  });

  // ─── Property: label (2) ───

  describe('Property: label', () => {
    it('reflects label attribute', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Patients"></hx-stat>');
      expect(el.getAttribute('label')).toBe('Patients');
    });

    it('updates displayed label when property changes', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Old Label"></hx-stat>');
      el.label = 'New Label';
      await el.updateComplete;
      const labelPart = shadowQuery(el, '[part~="label"]');
      expect(labelPart?.textContent).toBe('New Label');
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm class via hx-size', async () => {
      const el = await fixture<HelixStat>('<hx-stat hx-size="sm" value="5"></hx-stat>');
      const container = shadowQuery(el, '.stat');
      expect(container?.classList.contains('stat--sm')).toBe(true);
    });

    it('applies md class via hx-size', async () => {
      const el = await fixture<HelixStat>('<hx-stat hx-size="md" value="5"></hx-stat>');
      const container = shadowQuery(el, '.stat');
      expect(container?.classList.contains('stat--md')).toBe(true);
    });

    it('applies lg class via hx-size', async () => {
      const el = await fixture<HelixStat>('<hx-stat hx-size="lg" value="5"></hx-stat>');
      const container = shadowQuery(el, '.stat');
      expect(container?.classList.contains('stat--lg')).toBe(true);
    });

    it('backward compat: legacy size attribute maps to hx-size', async () => {
      const el = await fixture<HelixStat>('<hx-stat size="sm" value="5"></hx-stat>');
      await el.updateComplete;
      expect(el.size).toBe('sm');
    });

    it('hx-size takes precedence over legacy size attribute', async () => {
      const el = await fixture<HelixStat>('<hx-stat size="sm" hx-size="lg" value="5"></hx-stat>');
      await el.updateComplete;
      expect(el.size).toBe('lg');
    });
  });

  // ─── Property: trend (4) ───

  describe('Property: trend', () => {
    it('defaults to neutral (no trend element rendered)', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      const trendPart = shadowQuery(el, '[part~="trend"]');
      expect(trendPart).toBeNull();
    });

    it('renders trend indicator when trend is "up"', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42" trend="up"></hx-stat>');
      const trendPart = shadowQuery(el, '[part~="trend"]');
      expect(trendPart).toBeTruthy();
      expect(trendPart?.classList.contains('stat__trend--up')).toBe(true);
    });

    it('renders trend indicator when trend is "down"', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42" trend="down"></hx-stat>');
      const trendPart = shadowQuery(el, '[part~="trend"]');
      expect(trendPart).toBeTruthy();
      expect(trendPart?.classList.contains('stat__trend--down')).toBe(true);
    });

    it('includes aria-label on trend element', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42" trend="up"></hx-stat>');
      const trendPart = shadowQuery(el, '[part~="trend"]');
      expect(trendPart?.getAttribute('aria-label')).toBe('Trend: up');
    });

    it('renders SVG arrow inside trend indicator', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42" trend="down"></hx-stat>');
      const trendPart = shadowQuery(el, '[part~="trend"]');
      const svg = trendPart?.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('removes trend indicator when changed to neutral', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42" trend="up"></hx-stat>');
      expect(shadowQuery(el, '[part~="trend"]')).toBeTruthy();

      el.trend = 'neutral';
      await el.updateComplete;
      expect(shadowQuery(el, '[part~="trend"]')).toBeNull();
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "container" part', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      expect(shadowQuery(el, '[part~="container"]')).toBeTruthy();
    });

    it('exposes "header" part', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      expect(shadowQuery(el, '[part~="header"]')).toBeTruthy();
    });

    it('exposes "value" part', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      expect(shadowQuery(el, '[part~="value"]')).toBeTruthy();
    });

    it('exposes "label" part', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Test"></hx-stat>');
      expect(shadowQuery(el, '[part~="label"]')).toBeTruthy();
    });

    it('exposes "icon" part', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      expect(shadowQuery(el, '[part~="icon"]')).toBeTruthy();
    });

    it('exposes "trend" part when trend is set', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42" trend="up"></hx-stat>');
      expect(shadowQuery(el, '[part~="trend"]')).toBeTruthy();
    });

    it('stylesheet includes forced-colors media query with distinct trend styles', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42" trend="up"></hx-stat>');
      await el.updateComplete;

      // Verify the trend element renders with the correct class
      const trend = shadowQuery(el, '.stat__trend');
      expect(trend).toBeTruthy();
      expect(trend?.classList.contains('stat__trend--up')).toBe(true);

      // Verify the component's adopted stylesheets contain forced-colors rules
      const sheets = el.shadowRoot?.adoptedStyleSheets ?? [];
      const cssText = sheets.map((s) => [...s.cssRules].map((r) => r.cssText).join('\n')).join('\n');
      expect(cssText).toContain('forced-colors: active');

      // Verify up and down trends map to different border styles in the stylesheet
      expect(cssText).toContain('.stat__trend--up');
      expect(cssText).toContain('.stat__trend--down');
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('renders icon slot content', async () => {
      const el = await fixture<HelixStat>(
        '<hx-stat value="42"><span slot="icon">ICON</span></hx-stat>',
      );
      const slottedIcon = el.querySelector('[slot="icon"]');
      expect(slottedIcon).toBeTruthy();
      expect(slottedIcon?.textContent).toBe('ICON');
    });

    it('hides icon container when no icon is slotted', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      const iconPart = shadowQuery(el, '[part~="icon"]');
      expect(iconPart?.hasAttribute('hidden')).toBe(true);
    });

    it('shows icon container when icon is slotted', async () => {
      const el = await fixture<HelixStat>(
        '<hx-stat value="42"><span slot="icon">IC</span></hx-stat>',
      );
      // Wait for slotchange event to fire
      await el.updateComplete;
      const iconPart = shadowQuery(el, '[part~="icon"]');
      expect(iconPart?.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── Accessibility (3) ───

  describe('Accessibility', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixStat>(
        '<hx-stat label="Active patients" value="1,234"></hx-stat>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with trend up', async () => {
      const el = await fixture<HelixStat>(
        '<hx-stat label="Revenue" value="$5,000" trend="up"></hx-stat>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with trend down', async () => {
      const el = await fixture<HelixStat>(
        '<hx-stat label="Errors" value="12" trend="down"></hx-stat>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations across all sizes', async () => {
      for (const size of ['sm', 'md', 'lg']) {
        const el = await fixture<HelixStat>(
          `<hx-stat label="Metric" value="42" hx-size="${size}"></hx-stat>`,
        );
        const { violations } = await checkA11y(el);
        expect(violations, `hx-size="${size}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });

  // ─── aria-live region (4) ───

  describe('aria-live region', () => {
    it('renders a visually-hidden live region element', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Users" value="42"></hx-stat>');
      const live = el.shadowRoot?.querySelector('.stat__live-region');
      expect(live).toBeTruthy();
      expect(live?.getAttribute('aria-live')).toBe('polite');
      expect(live?.getAttribute('aria-atomic')).toBe('true');
    });

    it('live region contains value and label text', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Patients" value="1,234"></hx-stat>');
      const live = el.shadowRoot?.querySelector('.stat__live-region');
      expect(live?.textContent).toContain('1,234');
      expect(live?.textContent).toContain('Patients');
    });

    it('live region updates when value changes', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Users" value="10"></hx-stat>');
      el.value = '999';
      await el.updateComplete;
      const live = el.shadowRoot?.querySelector('.stat__live-region');
      expect(live?.textContent).toContain('999');
    });

    it('live region includes trend direction when set', async () => {
      const el = await fixture<HelixStat>(
        '<hx-stat label="Revenue" value="$5,000" trend="up"></hx-stat>',
      );
      const live = el.shadowRoot?.querySelector('.stat__live-region');
      expect(live?.textContent).toContain('up');
    });
  });

  // ─── Property: labelTrend (i18n) ───

  describe('Property: labelTrend', () => {
    it('defaults to "Trend"', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42" trend="up"></hx-stat>');
      const trendPart = shadowQuery(el, '[part~="trend"]');
      expect(trendPart?.getAttribute('aria-label')).toBe('Trend: up');
    });

    it('uses custom label-trend for aria-label', async () => {
      const el = await fixture<HelixStat>(
        '<hx-stat value="42" trend="up" label-trend="Tendencia"></hx-stat>',
      );
      const trendPart = shadowQuery(el, '[part~="trend"]');
      expect(trendPart?.getAttribute('aria-label')).toBe('Tendencia: up');
    });

    it('live region uses custom label-trend', async () => {
      const el = await fixture<HelixStat>(
        '<hx-stat label="Métrica" value="42" trend="up" label-trend="Tendencia"></hx-stat>',
      );
      const live = el.shadowRoot?.querySelector('.stat__live-region');
      expect(live?.textContent).toContain('Tendencia');
    });
  });

  // ─── role="group" and aria-label ───

  describe('role="group" and aria-label', () => {
    it('container has role="group"', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Patients" value="42"></hx-stat>');
      const container = shadowQuery(el, '[part~="container"]');
      expect(container?.getAttribute('role')).toBe('group');
    });

    it('aria-label on group is "value: label" when both are set', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Patients" value="42"></hx-stat>');
      const container = shadowQuery(el, '[part~="container"]');
      expect(container?.getAttribute('aria-label')).toBe('42: Patients');
    });

    it('aria-label on group is just value when label is empty', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      const container = shadowQuery(el, '[part~="container"]');
      expect(container?.getAttribute('aria-label')).toBe('42');
    });

    it('aria-label on group is just label when value is empty', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Patients"></hx-stat>');
      const container = shadowQuery(el, '[part~="container"]');
      expect(container?.getAttribute('aria-label')).toBe('Patients');
    });
  });

  // ─── aria-hidden on visible value and label ───

  describe('aria-hidden on visible value and label elements', () => {
    it('value span has aria-hidden="true"', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      const valuePart = shadowQuery(el, '[part~="value"]');
      expect(valuePart?.getAttribute('aria-hidden')).toBe('true');
    });

    it('label span has aria-hidden="true"', async () => {
      const el = await fixture<HelixStat>('<hx-stat label="Patients"></hx-stat>');
      const labelPart = shadowQuery(el, '[part~="label"]');
      expect(labelPart?.getAttribute('aria-hidden')).toBe('true');
    });

    it('trend element has role="img"', async () => {
      const el = await fixture<HelixStat>('<hx-stat value="42" trend="down"></hx-stat>');
      const trendPart = shadowQuery(el, '[part~="trend"]');
      expect(trendPart?.getAttribute('role')).toBe('img');
    });
  });

  // ─── _hasWarnedUnnamed resets when value/label provided ───

  describe('_hasWarnedUnnamed guard resets', () => {
    it('allows warning again after value is cleared', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const el = await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      // No warning yet since value is set
      el.value = '';
      await el.updateComplete;
      // Now both value and label are empty — warning should fire
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unnamed hx-stat'));

      warnSpy.mockRestore();
    });
  });

  // ─── devWarn for empty state (2) ───

  describe('devWarn for empty state', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('warns when both value and label are empty', async () => {
      await fixture<HelixStat>('<hx-stat></hx-stat>');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('unnamed hx-stat'),
      );
    });

    it('warns only once across multiple updates (_hasWarnedUnnamed guard)', async () => {
      const el = await fixture<HelixStat>('<hx-stat></hx-stat>');
      expect(console.warn).toHaveBeenCalledTimes(1);

      el.requestUpdate();
      await el.updateComplete;
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('does not warn about unnamed stat when value is provided', async () => {
      await fixture<HelixStat>('<hx-stat value="42"></hx-stat>');
      const unnamedCalls = (console.warn as ReturnType<typeof vi.spyOn>).mock.calls.filter(
        (args) => String(args[0]).includes('unnamed hx-stat'),
      );
      expect(unnamedCalls).toHaveLength(0);
    });
  });
});
