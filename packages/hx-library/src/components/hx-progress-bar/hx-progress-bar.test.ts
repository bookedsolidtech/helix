import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, shadowQueryAll, cleanup, checkA11y } from '../../test-utils.js';
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

    it('exposes "track" CSS part', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const track = shadowQuery(el, '[part="track"]');
      expect(track).toBeTruthy();
    });

    it('exposes "fill" CSS part', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const fill = shadowQuery(el, '[part="fill"]');
      expect(fill).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Upload progress"></hx-progress-bar>',
      );
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });
  });

  // ─── ARIA: Determinate (5) ───

  describe('ARIA: Determinate', () => {
    it('has role="progressbar" on track', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.getAttribute('role')).toBe('progressbar');
    });

    it('sets aria-valuenow to value', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="42"></hx-progress-bar>');
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.getAttribute('aria-valuenow')).toBe('42');
    });

    it('sets aria-valuemin to min (default 0)', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.getAttribute('aria-valuemin')).toBe('0');
    });

    it('sets aria-valuemin to custom min', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" min="20"></hx-progress-bar>',
      );
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.getAttribute('aria-valuemin')).toBe('20');
    });

    it('sets aria-valuemax to max', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" max="200"></hx-progress-bar>',
      );
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.getAttribute('aria-valuemax')).toBe('200');
    });

    it('sets aria-label from label prop', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" label="Upload progress"></hx-progress-bar>',
      );
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.getAttribute('aria-label')).toBe('Upload progress');
    });
  });

  // ─── ARIA: Indeterminate (3) ───

  describe('ARIA: Indeterminate', () => {
    it('omits aria-valuenow when value is null', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.hasAttribute('aria-valuenow')).toBe(false);
    });

    it('still has role="progressbar" in indeterminate state', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.getAttribute('role')).toBe('progressbar');
    });

    it('applies indeterminate class when value is null', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar></hx-progress-bar>');
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--indeterminate')).toBe(true);
    });

    it('applies indeterminate class when indeterminate attribute is set', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" indeterminate></hx-progress-bar>',
      );
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--indeterminate')).toBe(true);
    });
  });

  // ─── Property: value (5) ───

  describe('Property: value', () => {
    it('reflects value attr to host', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="75"></hx-progress-bar>');
      expect(el.getAttribute('value')).toBe('75');
    });

    it('renders indicator at 0% width for value=0', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="0"></hx-progress-bar>');
      await el.updateComplete;
      expect(el.style.getPropertyValue('--_value-ratio')).toBe('0');
    });

    it('sets fill width based on value', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      await el.updateComplete;
      expect(el.style.getPropertyValue('--_value-ratio')).toBe('0.5');
    });

    it('clamps value above max to 100%', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="150" max="100"></hx-progress-bar>',
      );
      await el.updateComplete;
      expect(el.style.getPropertyValue('--_value-ratio')).toBe('1');
    });

    it('clamps negative value to 0%', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="-10"></hx-progress-bar>');
      await el.updateComplete;
      expect(el.style.getPropertyValue('--_value-ratio')).toBe('0');
    });
  });

  // ─── Property: min (2) ───

  describe('Property: min', () => {
    it('reflects min attr to host', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" min="20"></hx-progress-bar>',
      );
      expect(el.getAttribute('min')).toBe('20');
    });

    it('calculates percentage relative to min offset', async () => {
      // value=60, min=20, max=100 → (60-20)/(100-20) = 40/80 = 0.5
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="60" min="20" max="100"></hx-progress-bar>',
      );
      await el.updateComplete;
      expect(el.style.getPropertyValue('--_value-ratio')).toBe('0.5');
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
      await el.updateComplete;
      expect(el.style.getPropertyValue('--_value-ratio')).toBe('0.25');
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

  // ─── Dynamic Updates (3) ───

  describe('Dynamic Updates', () => {
    it('updates fill ratio when value changes', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="30"></hx-progress-bar>');
      el.value = 70;
      await el.updateComplete;
      expect(el.style.getPropertyValue('--_value-ratio')).toBe('0.7');
    });

    it('switches to indeterminate when value set to null', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      el.value = null;
      await el.updateComplete;
      const wrapper = shadowQuery(el, '.progress-bar')!;
      expect(wrapper.classList.contains('progress-bar--indeterminate')).toBe(true);
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.hasAttribute('aria-valuenow')).toBe(false);
    });

    it('updates aria-label when label property changes', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar value="50" label="Upload progress"></hx-progress-bar>',
      );
      el.label = 'New label';
      await el.updateComplete;
      const track = shadowQuery(el, '[part="track"]')!;
      expect(track.getAttribute('aria-label')).toBe('New label');
    });
  });

  // ─── Events (1) ───

  describe('Events', () => {
    it('dispatches hx-complete event when value reaches max', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener('hx-complete', (e) => resolve(e as CustomEvent), { once: true });
      });
      el.value = 100;
      await el.updateComplete;
      const event = await eventPromise;
      expect(event.type).toBe('hx-complete');
    });
  });

  // ─── Warnings (1) ───

  describe('Warnings', () => {
    it('logs a warning when no accessible label is provided', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await fixture<HelixProgressBar>('<hx-progress-bar value="50"></hx-progress-bar>');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[hx-progress-bar]'));
      warnSpy.mockRestore();
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

  // ─── Property: description ───

  describe('Property: description', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar label="Loading"></hx-progress-bar>');
      expect(el.description).toBe('');
    });

    it('accepts description attribute', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Loading" description="Uploading patient records"></hx-progress-bar>',
      );
      expect(el.description).toBe('Uploading patient records');
    });

    it('renders sr-only description span with correct text when description is set', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Loading" description="Step 1 of 3"></hx-progress-bar>',
      );
      await el.updateComplete;
      // The description span has an ID and class="sr-only" — target it by its unique id prefix
      const descSpans = shadowQueryAll(el, '.sr-only');
      const descSpan = descSpans.find((s) => s.textContent?.trim() === 'Step 1 of 3');
      expect(descSpan).toBeTruthy();
    });

    it('does not render description sr-only span when description is empty', async () => {
      const el = await fixture<HelixProgressBar>('<hx-progress-bar label="Loading"></hx-progress-bar>');
      await el.updateComplete;
      // Only the aria-live sr-only div exists; the description-specific span should not exist
      const descSpans = shadowQueryAll(el, '.sr-only');
      const descTextSpan = descSpans.find((s) => s.tagName === 'SPAN' && s.id.includes('desc'));
      expect(descTextSpan).toBeUndefined();
    });

    it('links description via aria-describedby on the track', async () => {
      const el = await fixture<HelixProgressBar>(
        '<hx-progress-bar label="Loading" description="Processing"></hx-progress-bar>',
      );
      await el.updateComplete;
      const track = shadowQuery(el, '[part="track"]');
      const describedBy = track?.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
    });
  });
});
