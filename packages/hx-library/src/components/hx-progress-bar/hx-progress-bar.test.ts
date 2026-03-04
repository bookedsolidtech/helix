import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixProgressBar } from './hx-progress-bar.js';
import './index.js';

afterEach(cleanup);

describe('hx-progress-bar', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the bar container with part="bar"', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]');
      expect(bar).toBeTruthy();
    });

    it('renders the track with part="track"', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const track = shadowQuery(el, '[part="track"]');
      expect(track).toBeTruthy();
    });

    it('renders the fill with part="fill"', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const fill = shadowQuery(el, '[part="fill"]');
      expect(fill).toBeTruthy();
    });

    it('applies default variant class bar--primary', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.classList.contains('bar--primary')).toBe(true);
    });
  });

  // ─── Property: value (6) ───

  describe('Property: value', () => {
    it('defaults to 0', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      expect(el.value).toBe(0);
    });

    it('fill width is 0% at default value', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]')!;
      expect(fill.style.width).toBe('0%');
    });

    it('fill width is 50% when value=50', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]')!;
      expect(fill.style.width).toBe('50%');
    });

    it('fill width is 100% when value=100', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="100"></hx-progress-bar>');
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]')!;
      expect(fill.style.width).toBe('100%');
    });

    it('clamps fill width to 0% when value is negative', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      el.value = -20;
      await el.updateComplete;
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]')!;
      expect(fill.style.width).toBe('0%');
    });

    it('clamps fill width to 100% when value exceeds max', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      el.value = 200;
      await el.updateComplete;
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]')!;
      expect(fill.style.width).toBe('100%');
    });
  });

  // ─── Property: max (3) ───

  describe('Property: max', () => {
    it('defaults to 100', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      expect(el.max).toBe(100);
    });

    it('percentage calculation uses max (value=25, max=50 → 50%)', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="25" max="50"></hx-progress-bar>',
      );
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]')!;
      expect(fill.style.width).toBe('50%');
    });

    it('aria-valuemax reflects max', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar max="200"></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.getAttribute('aria-valuemax')).toBe('200');
    });
  });

  // ─── Property: indeterminate (5) ───

  describe('Property: indeterminate', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      expect(el.indeterminate).toBe(false);
    });

    it('applies bar--indeterminate class on bar when true', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar indeterminate></hx-progress-bar>',
      );
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.classList.contains('bar--indeterminate')).toBe(true);
    });

    it('applies bar__fill--indeterminate class on fill when true', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar indeterminate></hx-progress-bar>',
      );
      const fill = shadowQuery(el, '[part="fill"]')!;
      expect(fill.classList.contains('bar__fill--indeterminate')).toBe(true);
    });

    it('does not set aria-valuenow when indeterminate', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" indeterminate></hx-progress-bar>',
      );
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    });

    it('sets aria-valuenow when NOT indeterminate', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.getAttribute('aria-valuenow')).toBe('50');
    });
  });

  // ─── Property: variant (6) ───

  describe('Property: variant', () => {
    it('defaults to primary', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      expect(el.variant).toBe('primary');
    });

    it('applies bar--primary class', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar variant="primary"></hx-progress-bar>',
      );
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.classList.contains('bar--primary')).toBe(true);
    });

    it('applies bar--success class', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar variant="success"></hx-progress-bar>',
      );
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.classList.contains('bar--success')).toBe(true);
    });

    it('applies bar--warning class', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar variant="warning"></hx-progress-bar>',
      );
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.classList.contains('bar--warning')).toBe(true);
    });

    it('applies bar--danger class', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar variant="danger"></hx-progress-bar>',
      );
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.classList.contains('bar--danger')).toBe(true);
    });

    it('reflects variant attribute to host', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar variant="success"></hx-progress-bar>',
      );
      expect(el.getAttribute('variant')).toBe('success');
    });
  });

  // ─── Property: label (4) ───

  describe('Property: label', () => {
    it('shows label text in part="label" when label property is set', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Loading patient data"></hx-progress-bar>',
      );
      const labelEl = shadowQuery(el, '[part="label"]');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent?.trim()).toContain('Loading patient data');
    });

    it('hides label container when label is empty and no slot content', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const labelEl = shadowQuery(el, '[part="label"]');
      expect(labelEl).toBeNull();
    });

    it('sets aria-label on bar element when label property is set', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Upload progress"></hx-progress-bar>',
      );
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.getAttribute('aria-label')).toBe('Upload progress');
    });

    it('does not set aria-label when label is empty', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.hasAttribute('aria-label')).toBe(false);
    });
  });

  // ─── Property: show-value (3) ───

  describe('Property: show-value', () => {
    it('hides value element by default', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Progress" value="40"></hx-progress-bar>',
      );
      const valueEl = shadowQuery(el, '[part="value"]');
      expect(valueEl).toBeNull();
    });

    it('shows percentage in part="value" when showValue=true and label exists', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Progress" value="40" show-value></hx-progress-bar>',
      );
      const valueEl = shadowQuery(el, '[part="value"]');
      expect(valueEl).toBeTruthy();
      expect(valueEl?.textContent?.trim()).toBe('40%');
    });

    it('does not show value element when indeterminate', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Loading" show-value indeterminate></hx-progress-bar>',
      );
      const valueEl = shadowQuery(el, '[part="value"]');
      expect(valueEl).toBeNull();
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes part="bar" for external styling', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]');
      expect(bar?.getAttribute('part')).toBe('bar');
    });

    it('exposes part="track" for external styling', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const track = shadowQuery(el, '[part="track"]');
      expect(track?.getAttribute('part')).toBe('track');
    });

    it('exposes part="fill" for external styling', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const fill = shadowQuery(el, '[part="fill"]');
      expect(fill?.getAttribute('part')).toBe('fill');
    });

    it('exposes part="label" when label is present', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Test"></hx-progress-bar>',
      );
      const label = shadowQuery(el, '[part="label"]');
      expect(label?.getAttribute('part')).toBe('label');
    });

    it('exposes part="value" when showValue is true and label exists', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Test" show-value value="75"></hx-progress-bar>',
      );
      const valueEl = shadowQuery(el, '[part="value"]');
      expect(valueEl?.getAttribute('part')).toBe('value');
    });
  });

  // ─── Accessibility: ARIA Attributes (4) ───

  describe('Accessibility: ARIA Attributes', () => {
    it('has role="progressbar"', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.getAttribute('role')).toBe('progressbar');
    });

    it('has aria-valuemin="0"', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.getAttribute('aria-valuemin')).toBe('0');
    });

    it('has aria-valuemax matching the max property', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar max="50"></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.getAttribute('aria-valuemax')).toBe('50');
    });

    it('has aria-valuenow matching the clamped value (determinate)', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="30"></hx-progress-bar>');
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.getAttribute('aria-valuenow')).toBe('30');
    });
  });

  // ─── Dynamic Updates (4) ───

  describe('Dynamic Updates', () => {
    it('updates fill width when value property changes', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="10"></hx-progress-bar>');
      el.value = 75;
      await el.updateComplete;
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]')!;
      expect(fill.style.width).toBe('75%');
    });

    it('updates variant class when variant property changes', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar variant="primary"></hx-progress-bar>',
      );
      el.variant = 'danger';
      await el.updateComplete;
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.classList.contains('bar--danger')).toBe(true);
      expect(bar.classList.contains('bar--primary')).toBe(false);
    });

    it('removes aria-valuenow when indeterminate becomes true', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      el.indeterminate = true;
      await el.updateComplete;
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    });

    it('restores aria-valuenow when indeterminate becomes false', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="60" indeterminate></hx-progress-bar>',
      );
      el.indeterminate = false;
      await el.updateComplete;
      const bar = shadowQuery(el, '[part="bar"]')!;
      expect(bar.getAttribute('aria-valuenow')).toBe('60');
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('renders label slot content in the label container', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar><span slot="label">Custom Label</span></hx-progress-bar>',
      );
      // Wait for slotchange to fire
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const slotted = el.querySelector('[slot="label"]');
      expect(slotted?.textContent).toBe('Custom Label');
    });

    it('label slot content causes label container to be rendered', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar><span slot="label">Slot Label</span></hx-progress-bar>',
      );
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const labelEl = shadowQuery(el, '[part="label"]');
      expect(labelEl).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Loading" value="0"></hx-progress-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when labeled with show-value', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Upload progress" value="65" show-value></hx-progress-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in indeterminate state', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Please wait" indeterminate></hx-progress-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['primary', 'success', 'warning', 'danger']) {
        const el = await fixture<HelixProgressBar>(
          `<hx-progress-bar label="Status" variant="${variant}" value="50"></hx-progress-bar>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });
});
