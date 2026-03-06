import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y, oneEvent } from '../../test-utils.js';
import type { HelixProgressBar } from './hx-progress-bar.js';
import './index.js';

afterEach(cleanup);

describe('hx-progress-bar', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "indicator" CSS part', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const indicator = shadowQuery(el, '[part="indicator"]');
      expect(indicator).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });
  });

  // ─── ARIA: Determinate (5) ───

  describe('ARIA: Determinate', () => {
    it('has role="progressbar" on base', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('role')).toBe('progressbar');
    });

    it('sets aria-valuenow to value', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="42"></hx-progress-bar>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-valuenow')).toBe('42');
    });

    it('sets aria-valuemin to 0', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-valuemin')).toBe('0');
    });

    it('sets aria-valuemax to max', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" max="200"></hx-progress-bar>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-valuemax')).toBe('200');
    });

    it('sets aria-label from label prop', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" label="Upload progress"></hx-progress-bar>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-label')).toBe('Upload progress');
    });
  });

  // ─── ARIA: Indeterminate (3) ───

  describe('ARIA: Indeterminate', () => {
    it('omits aria-valuenow when value is null', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.hasAttribute('aria-valuenow')).toBe(false);
    });

    it('still has role="progressbar" in indeterminate state', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('role')).toBe('progressbar');
    });

    it('applies indeterminate class when value is null', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--indeterminate')).toBe(true);
    });
  });

  // ─── Property: value (3) ───

  describe('Property: value', () => {
    it('reflects value attr to host', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="75"></hx-progress-bar>');
      expect(el.getAttribute('value')).toBe('75');
    });

    it('sets indicator width based on value', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator.style.width).toBe('50%');
    });

    it('clamps value to 0–max range', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="150" max="100"></hx-progress-bar>',
      );
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator.style.width).toBe('100%');
    });

    it('renders 0% width when value is 0', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="0"></hx-progress-bar>');
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator.style.width).toBe('0%');
    });

    it('clamps negative value to 0%', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="-10"></hx-progress-bar>');
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator.style.width).toBe('0%');
    });
  });

  // ─── Property: max (2) ───

  describe('Property: max', () => {
    it('reflects max attr to host', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" max="200"></hx-progress-bar>',
      );
      expect(el.getAttribute('max')).toBe('200');
    });

    it('calculates percentage relative to max', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" max="200"></hx-progress-bar>',
      );
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator.style.width).toBe('25%');
    });
  });

  // ─── Property: variant (4) ───

  describe('Property: variant', () => {
    it('applies default variant class', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--default')).toBe(true);
    });

    it('applies success variant class', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="100" variant="success"></hx-progress-bar>',
      );
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--success')).toBe(true);
    });

    it('applies warning variant class', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" variant="warning"></hx-progress-bar>',
      );
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--warning')).toBe(true);
    });

    it('applies danger variant class', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="25" variant="danger"></hx-progress-bar>',
      );
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--danger')).toBe(true);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm size class', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" hx-size="sm"></hx-progress-bar>',
      );
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--sm')).toBe(true);
    });

    it('applies md size class by default', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--md')).toBe(true);
    });

    it('applies lg size class', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" hx-size="lg"></hx-progress-bar>',
      );
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--lg')).toBe(true);
    });
  });

  // ─── Property: indeterminate (2) ───

  describe('Property: indeterminate', () => {
    it('applies indeterminate class when indeterminate attr is set', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" indeterminate></hx-progress-bar>',
      );
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--indeterminate')).toBe(true);
    });

    it('omits aria-valuenow when indeterminate is true', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" indeterminate></hx-progress-bar>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.hasAttribute('aria-valuenow')).toBe(false);
    });
  });

  // ─── Completion event (3) ───

  describe('Completion event', () => {
    it('dispatches hx-complete when value reaches max', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const eventPromise = oneEvent(el, 'hx-complete');
      el.value = 100;
      await el.updateComplete;
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('shows completion text in live region when value reaches max', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      el.value = 100;
      await el.updateComplete;
      // _complete state change triggers a second render cycle
      await el.updateComplete;
      const live = shadowQuery(el, '.progress-bar__live')!;
      expect(live.textContent?.trim()).toBe('Complete');
    });

    it('does not dispatch hx-complete when already at max', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="100"></hx-progress-bar>');
      let fired = false;
      el.addEventListener('hx-complete', () => {
        fired = true;
      });
      el.value = 100;
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── ARIA: Label linking (2) ───

  describe('ARIA: Label linking', () => {
    it('uses aria-labelledby when label attribute is empty', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50"><span slot="label">Progress</span></hx-progress-bar>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      const labelSpan = shadowQuery(el, '[part="label"]')!;
      expect(base.getAttribute('aria-labelledby')).toBe(labelSpan.id);
    });

    it('uses aria-label instead of aria-labelledby when label is set', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" label="Upload"><span slot="label">Upload</span></hx-progress-bar>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-label')).toBe('Upload');
      expect(base.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  // ─── Slots (1) ───

  describe('Slots', () => {
    it('label slot renders slotted content', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50"><span slot="label">Upload progress</span></hx-progress-bar>',
      );
      const slotted = el.querySelector('[slot="label"]');
      expect(slotted).toBeTruthy();
      expect(slotted?.textContent).toBe('Upload progress');
    });
  });

  // ─── Dynamic Updates (2) ───

  describe('Dynamic Updates', () => {
    it('updates indicator width when value changes', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="30"></hx-progress-bar>');
      el.value = 70;
      await el.updateComplete;
      const indicator = shadowQuery(el, '[part="indicator"]') as HTMLElement;
      expect(indicator.style.width).toBe('70%');
    });

    it('updates aria-label when label changes', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" label="Uploading"></hx-progress-bar>',
      );
      el.label = 'Processing';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-label')).toBe('Processing');
    });

    it('switches to indeterminate when value set to null', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      el.value = null;
      await el.updateComplete;
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--indeterminate')).toBe(true);
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.hasAttribute('aria-valuenow')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in determinate state', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="60" label="Upload progress"></hx-progress-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in indeterminate state', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Loading"></hx-progress-bar>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['default', 'success', 'warning', 'danger']) {
        const el = await fixture<HelixProgressBar>(
          `<hx-progress-bar value="50" variant="${variant}" label="Progress"></hx-progress-bar>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });
});
