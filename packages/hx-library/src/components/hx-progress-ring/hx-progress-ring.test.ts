import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixProgressRing } from './hx-progress-ring.js';
import './index.js';

afterEach(cleanup);

describe('hx-progress-ring', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders SVG base element', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      const svg = shadowQuery(el, '[part="base"]');
      expect(svg).toBeTruthy();
      expect(svg?.tagName.toLowerCase()).toBe('svg');
    });

    it('renders track and indicator circles', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring value="50"></hx-progress-ring>');
      const track = shadowQuery(el, '[part="track"]');
      const indicator = shadowQuery(el, '[part="indicator"]');
      expect(track).toBeTruthy();
      expect(indicator).toBeTruthy();
    });

    it('renders label part for center slot', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring value="50"></hx-progress-ring>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });
  });

  // ─── Property: value (4) ───

  describe('Property: value', () => {
    it('defaults to null (indeterminate)', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.value).toBeNull();
    });

    it('sets aria-valuenow when value is provided', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring value="75"></hx-progress-ring>');
      expect(el.getAttribute('aria-valuenow')).toBe('75');
    });

    it('clamps value above 100 to 100', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring value="150"></hx-progress-ring>');
      await el.updateComplete;
      expect(el.getAttribute('aria-valuenow')).toBe('100');
    });

    it('clamps value below 0 to 0', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring value="-10"></hx-progress-ring>');
      await el.updateComplete;
      expect(el.getAttribute('aria-valuenow')).toBe('0');
    });
  });

  // ─── Indeterminate mode (3) ───

  describe('Indeterminate mode', () => {
    it('sets indeterminate attribute when value is null', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.hasAttribute('indeterminate')).toBe(true);
    });

    it('removes aria-valuenow in indeterminate mode', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.hasAttribute('aria-valuenow')).toBe(false);
    });

    it('removes indeterminate attribute when value is set', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.hasAttribute('indeterminate')).toBe(true);
      el.value = 50;
      await el.updateComplete;
      expect(el.hasAttribute('indeterminate')).toBe(false);
      expect(el.getAttribute('aria-valuenow')).toBe('50');
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('defaults to md', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.size).toBe('md');
    });

    it('reflects size attribute sm', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring size="sm"></hx-progress-ring>');
      expect(el.getAttribute('size')).toBe('sm');
    });

    it('reflects size attribute lg', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring size="lg"></hx-progress-ring>');
      expect(el.getAttribute('size')).toBe('lg');
    });
  });

  // ─── Property: strokeWidth (2) ───

  describe('Property: strokeWidth', () => {
    it('defaults to 4', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.strokeWidth).toBe(4);
    });

    it('reflects stroke-width attribute', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring stroke-width="8"></hx-progress-ring>');
      expect(el.strokeWidth).toBe(8);
    });
  });

  // ─── Property: variant (4) ───

  describe('Property: variant', () => {
    it('defaults to default', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.variant).toBe('default');
    });

    it('reflects success variant', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring variant="success"></hx-progress-ring>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('reflects warning variant', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring variant="warning"></hx-progress-ring>');
      expect(el.getAttribute('variant')).toBe('warning');
    });

    it('reflects danger variant', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring variant="danger"></hx-progress-ring>');
      expect(el.getAttribute('variant')).toBe('danger');
    });
  });

  // ─── Property: label / ARIA (3) ───

  describe('Property: label / ARIA', () => {
    it('sets aria-label from label prop', async () => {
      const el = await fixture<HelixProgressRing>(
        '<hx-progress-ring value="50" label="Upload progress"></hx-progress-ring>',
      );
      expect(el.getAttribute('aria-label')).toBe('Upload progress');
    });

    it('sets role=progressbar', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.getAttribute('role')).toBe('progressbar');
    });

    it('sets aria-valuemin=0 and aria-valuemax=100', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring></hx-progress-ring>');
      expect(el.getAttribute('aria-valuemin')).toBe('0');
      expect(el.getAttribute('aria-valuemax')).toBe('100');
    });
  });

  // ─── CSS Parts (4) ───

  describe('CSS Parts', () => {
    it('exposes "base" part on SVG', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring value="50"></hx-progress-ring>');
      expect(shadowQuery(el, '[part~="base"]')).toBeTruthy();
    });

    it('exposes "track" part', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring value="50"></hx-progress-ring>');
      expect(shadowQuery(el, '[part~="track"]')).toBeTruthy();
    });

    it('exposes "indicator" part', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring value="50"></hx-progress-ring>');
      expect(shadowQuery(el, '[part~="indicator"]')).toBeTruthy();
    });

    it('exposes "label" part', async () => {
      const el = await fixture<HelixProgressRing>('<hx-progress-ring value="50"></hx-progress-ring>');
      expect(shadowQuery(el, '[part~="label"]')).toBeTruthy();
    });
  });

  // ─── Slots (1) ───

  describe('Slots', () => {
    it('default slot renders center content', async () => {
      const el = await fixture<HelixProgressRing>(
        '<hx-progress-ring value="50"><span class="pct">50%</span></hx-progress-ring>',
      );
      const span = el.querySelector('span.pct');
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe('50%');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in determinate state', async () => {
      const el = await fixture<HelixProgressRing>(
        '<hx-progress-ring value="65" label="Loading: 65%"></hx-progress-ring>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in indeterminate state', async () => {
      const el = await fixture<HelixProgressRing>(
        '<hx-progress-ring label="Loading, please wait"></hx-progress-ring>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for success variant', async () => {
      const el = await fixture<HelixProgressRing>(
        '<hx-progress-ring value="100" variant="success" label="Complete"></hx-progress-ring>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for danger variant', async () => {
      const el = await fixture<HelixProgressRing>(
        '<hx-progress-ring value="90" variant="danger" label="Critical: 90%"></hx-progress-ring>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
