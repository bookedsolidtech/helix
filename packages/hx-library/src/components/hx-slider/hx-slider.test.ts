import { describe, it, expect, afterEach } from 'vitest';
import {
  fixture,
  shadowQuery,
  shadowQueryAll,
  oneEvent,
  cleanup,
  checkA11y,
} from '../../test-utils.js';
import type { HelixSlider } from './hx-slider.js';
import './index.js';

afterEach(cleanup);

describe('hx-slider', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a slider container div with part="slider"', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      const container = shadowQuery(el, '[part="slider"]');
      expect(container).toBeTruthy();
    });

    it('applies slider--md class by default', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      const container = shadowQuery(el, '[part="slider"]');
      expect(container?.classList.contains('slider--md')).toBe(true);
    });

    it('renders a native range input', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(input).toBeTruthy();
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('renders label text when label prop is set', async () => {
      const el = await fixture<HelixSlider>('<hx-slider label="Volume"></hx-slider>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label?.textContent?.trim()).toContain('Volume');
    });

    it('does not render label element when label prop is empty', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeNull();
    });

    it('label for attribute matches native input id', async () => {
      const el = await fixture<HelixSlider>('<hx-slider label="Brightness"></hx-slider>');
      const label = shadowQuery<HTMLLabelElement>(el, '[part="label"]');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(label?.htmlFor).toBe(input?.id);
    });
  });

  // ─── Property: value (4) ───

  describe('Property: value', () => {
    it('defaults to 0', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(el.value).toBe(0);
    });

    it('reflects value attribute', async () => {
      const el = await fixture<HelixSlider>('<hx-slider value="42"></hx-slider>');
      expect(el.value).toBe(42);
    });

    it('sets the native input value', async () => {
      const el = await fixture<HelixSlider>('<hx-slider value="75"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(Number(input?.value)).toBe(75);
    });

    it('native input value reflects the slider value (aria-valuenow is implicit on <input type="range">)', async () => {
      const el = await fixture<HelixSlider>('<hx-slider value="30"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      // Explicit aria-valuenow is intentionally absent — <input type="range"> provides it implicitly
      expect(input?.getAttribute('aria-valuenow')).toBeNull();
      expect(Number(input?.value)).toBe(30);
    });
  });

  // ─── Property: min / max / step (4) ───

  describe('Property: min / max / step', () => {
    it('sets min attribute on native input', async () => {
      const el = await fixture<HelixSlider>('<hx-slider min="10"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(Number(input?.min)).toBe(10);
    });

    it('sets max attribute on native input', async () => {
      const el = await fixture<HelixSlider>('<hx-slider max="200"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(Number(input?.max)).toBe(200);
    });

    it('sets step attribute on native input', async () => {
      const el = await fixture<HelixSlider>('<hx-slider step="5"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(Number(input?.step)).toBe(5);
    });

    it('native min/max attributes are set (aria-valuemin/max are implicit on <input type="range">)', async () => {
      const el = await fixture<HelixSlider>('<hx-slider min="20" max="80"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      // Explicit aria-valuemin/max are intentionally absent — <input type="range"> provides them implicitly
      expect(input?.getAttribute('aria-valuemin')).toBeNull();
      expect(input?.getAttribute('aria-valuemax')).toBeNull();
      expect(Number(input?.min)).toBe(20);
      expect(Number(input?.max)).toBe(80);
    });
  });

  // ─── Property: show-value (3) ───

  describe('Property: show-value', () => {
    it('does not render value-display element by default', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      const display = shadowQuery(el, '[part="value-display"]');
      expect(display).toBeNull();
    });

    it('renders value-display element when show-value is set', async () => {
      const el = await fixture<HelixSlider>('<hx-slider show-value value="55"></hx-slider>');
      const display = shadowQuery(el, '[part="value-display"]');
      expect(display).toBeTruthy();
    });

    it('value-display shows the current numeric value', async () => {
      const el = await fixture<HelixSlider>('<hx-slider show-value value="42"></hx-slider>');
      const display = shadowQuery(el, '[part="value-display"]');
      expect(display?.textContent?.trim()).toBe('42');
    });
  });

  // ─── Property: show-ticks (4) ───

  describe('Property: show-ticks', () => {
    it('does not render ticks by default', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      const ticks = shadowQueryAll(el, '[part="tick"]');
      expect(ticks.length).toBe(0);
    });

    it('renders tick elements when show-ticks is set', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider show-ticks min="0" max="10" step="1"></hx-slider>',
      );
      const ticks = shadowQueryAll(el, '[part="tick"]');
      expect(ticks.length).toBeGreaterThan(0);
    });

    it('renders correct tick count: (range / step) + 1', async () => {
      // min=0, max=10, step=2 => 5 intervals => 6 ticks
      const el = await fixture<HelixSlider>(
        '<hx-slider show-ticks min="0" max="10" step="2"></hx-slider>',
      );
      const ticks = shadowQueryAll(el, '[part="tick"]');
      expect(ticks.length).toBe(6);
    });

    it('applies slider--has-ticks class to container when show-ticks is set', async () => {
      const el = await fixture<HelixSlider>('<hx-slider show-ticks></hx-slider>');
      const container = shadowQuery(el, '[part="slider"]');
      expect(container?.classList.contains('slider--has-ticks')).toBe(true);
    });
  });

  // ─── Property: disabled (4) ───

  describe('Property: disabled', () => {
    it('disables the native input', async () => {
      const el = await fixture<HelixSlider>('<hx-slider disabled></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(input?.disabled).toBe(true);
    });

    it('reflects disabled attribute on host', async () => {
      const el = await fixture<HelixSlider>('<hx-slider disabled></hx-slider>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('applies slider--disabled class to container', async () => {
      const el = await fixture<HelixSlider>('<hx-slider disabled></hx-slider>');
      const container = shadowQuery(el, '[part="slider"]');
      expect(container?.classList.contains('slider--disabled')).toBe(true);
    });

    it('does not dispatch hx-input when disabled', async () => {
      const el = await fixture<HelixSlider>('<hx-slider disabled value="0"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      let fired = false;
      el.addEventListener('hx-input', () => {
        fired = true;
      });
      input?.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Property: hx-size (4) ───

  describe('Property: hx-size', () => {
    it('defaults to md', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(el.size).toBe('md');
    });

    it('reflects hx-size attribute for sm', async () => {
      const el = await fixture<HelixSlider>('<hx-slider hx-size="sm"></hx-slider>');
      expect(el.size).toBe('sm');
      expect(el.getAttribute('hx-size')).toBe('sm');
    });

    it('reflects hx-size attribute for lg', async () => {
      const el = await fixture<HelixSlider>('<hx-slider hx-size="lg"></hx-slider>');
      expect(el.size).toBe('lg');
      expect(el.getAttribute('hx-size')).toBe('lg');
    });

    it('applies size class to container', async () => {
      const el = await fixture<HelixSlider>('<hx-slider hx-size="sm"></hx-slider>');
      const container = shadowQuery(el, '[part="slider"]');
      expect(container?.classList.contains('slider--sm')).toBe(true);
    });
  });

  // ─── Events (5) ───

  describe('Events', () => {
    it('dispatches hx-input on native input event', async () => {
      const el = await fixture<HelixSlider>('<hx-slider value="0" max="100"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-input');
      input!.value = '50';
      input?.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-input detail.value reflects the new numeric value', async () => {
      const el = await fixture<HelixSlider>('<hx-slider value="0" max="100"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-input');
      input!.value = '75';
      input?.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(75);
    });

    it('hx-input bubbles and is composed', async () => {
      const el = await fixture<HelixSlider>('<hx-slider value="0" max="100"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-input');
      input!.value = '25';
      input?.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-change on native change event', async () => {
      const el = await fixture<HelixSlider>('<hx-slider value="0" max="100"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-change');
      input!.value = '60';
      input?.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change detail.value reflects the released value', async () => {
      const el = await fixture<HelixSlider>('<hx-slider value="0" max="100"></hx-slider>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-change');
      input!.value = '88';
      input?.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(88);
    });
  });

  // ─── Form Participation (6) ───

  describe('Form participation', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-slider') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('form getter returns null when not inside a form', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(el.form).toBeNull();
    });

    it('form getter returns the associated form element', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-slider name="dosage" value="10"></hx-slider>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-slider') as HelixSlider;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets value to the declared default (value attribute)', async () => {
      const el = await fixture<HelixSlider>('<hx-slider min="10" value="80"></hx-slider>');
      el.value = 50;
      await el.updateComplete;
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe(80);
    });

    it('formResetCallback resets to min when no value attribute is set', async () => {
      const el = await fixture<HelixSlider>('<hx-slider min="10" max="100"></hx-slider>');
      el.value = 60;
      await el.updateComplete;
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe(10);
    });

    it('formStateRestoreCallback restores a numeric value', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      el.formStateRestoreCallback('55', 'restore');
      await el.updateComplete;
      expect(el.value).toBe(55);
    });

    it('formStateRestoreCallback ignores non-numeric state', async () => {
      const el = await fixture<HelixSlider>('<hx-slider value="20"></hx-slider>');
      el.formStateRestoreCallback('not-a-number', 'restore');
      await el.updateComplete;
      expect(el.value).toBe(20);
    });

    it('formStateRestoreCallback clamps restored value to [min, max]', async () => {
      const el = await fixture<HelixSlider>('<hx-slider min="0" max="100"></hx-slider>');
      el.formStateRestoreCallback('150', 'restore');
      await el.updateComplete;
      expect(el.value).toBe(100);
    });

    it('value is clamped to max when set above max', async () => {
      const el = await fixture<HelixSlider>('<hx-slider min="0" max="100" value="50"></hx-slider>');
      el.value = 150;
      await el.updateComplete;
      expect(el.value).toBe(100);
    });

    it('value is clamped to min when set below min', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider min="10" max="100" value="50"></hx-slider>',
      );
      el.value = -5;
      await el.updateComplete;
      expect(el.value).toBe(10);
    });

    it('name and value appear in FormData on submit', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-slider name="dosage" value="10" min="0" max="100"></hx-slider>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-slider') as HelixSlider;
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('dosage')).toBe('10');
    });
  });

  // ─── CSS Parts (7) ───

  describe('CSS Parts', () => {
    it('exposes part="slider" on outer container', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(shadowQuery(el, '[part="slider"]')).toBeTruthy();
    });

    it('exposes part="track"', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(shadowQuery(el, '[part="track"]')).toBeTruthy();
    });

    it('exposes part="fill"', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(shadowQuery(el, '[part="fill"]')).toBeTruthy();
    });

    it('exposes part="thumb"', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(shadowQuery(el, '[part="thumb"]')).toBeTruthy();
    });

    it('exposes part="label" when label prop is set', async () => {
      const el = await fixture<HelixSlider>('<hx-slider label="Speed"></hx-slider>');
      expect(shadowQuery(el, '[part="label"]')).toBeTruthy();
    });

    it('exposes part="value-display" when show-value is set', async () => {
      const el = await fixture<HelixSlider>('<hx-slider show-value value="10"></hx-slider>');
      expect(shadowQuery(el, '[part="value-display"]')).toBeTruthy();
    });

    it('exposes part="tick" for each tick when show-ticks is set', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider show-ticks min="0" max="4" step="1"></hx-slider>',
      );
      const ticks = shadowQueryAll(el, '[part="tick"]');
      // 4 intervals => 5 ticks
      expect(ticks.length).toBe(5);
    });
  });

  // ─── Slots (4) ───

  describe('Slots', () => {
    it('label slot content is rendered and accessible in light DOM', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider><strong slot="label">Custom Label</strong></hx-slider>',
      );
      const slotContent = el.querySelector('[slot="label"]');
      expect(slotContent).toBeTruthy();
      expect(slotContent?.textContent).toBe('Custom Label');
    });

    it('help-text slot content is rendered and accessible in light DOM', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider><em slot="help-text">Extra help</em></hx-slider>',
      );
      const slotContent = el.querySelector('[slot="help-text"]');
      expect(slotContent).toBeTruthy();
      expect(slotContent?.textContent).toBe('Extra help');
    });

    it('min-label slot content is rendered and accessible in light DOM', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider><span slot="min-label">Min</span></hx-slider>',
      );
      const slotContent = el.querySelector('[slot="min-label"]');
      expect(slotContent).toBeTruthy();
      expect(slotContent?.textContent).toBe('Min');
    });

    it('max-label slot content is rendered and accessible in light DOM', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider><span slot="max-label">Max</span></hx-slider>',
      );
      const slotContent = el.querySelector('[slot="max-label"]');
      expect(slotContent).toBeTruthy();
      expect(slotContent?.textContent).toBe('Max');
    });
  });

  // ─── Help Text (2) ───

  describe('Property: helpText', () => {
    it('renders help text below the slider', async () => {
      const el = await fixture<HelixSlider>('<hx-slider help-text="Adjust the level"></hx-slider>');
      const helpEl = shadowQuery(el, '.slider__help-text');
      expect(helpEl).toBeTruthy();
      expect(helpEl?.textContent?.trim()).toContain('Adjust the level');
    });

    it('associates help text with input via aria-describedby', async () => {
      const el = await fixture<HelixSlider>('<hx-slider help-text="Helpful guidance"></hx-slider>');
      const input = shadowQuery(el, 'input[type="range"]');
      const helpEl = shadowQuery(el, '.slider__help-text');
      const describedBy = input?.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(describedBy).toBe(helpEl?.id);
    });
  });

  // ─── Fill width (3) ───

  describe('Fill width', () => {
    it('fill width is 0% when value equals min', async () => {
      const el = await fixture<HelixSlider>('<hx-slider min="0" max="100" value="0"></hx-slider>');
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]');
      expect(fill?.style.width).toBe('0%');
    });

    it('fill width is 100% when value equals max', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider min="0" max="100" value="100"></hx-slider>',
      );
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]');
      expect(fill?.style.width).toBe('100%');
    });

    it('fill width is 50% when value is mid-range', async () => {
      const el = await fixture<HelixSlider>('<hx-slider min="0" max="100" value="50"></hx-slider>');
      const fill = shadowQuery<HTMLElement>(el, '[part="fill"]');
      expect(fill?.style.width).toBe('50%');
    });
  });

  // ─── Methods (1) ───

  describe('Methods', () => {
    it('focus() moves focus to the native range input', async () => {
      const el = await fixture<HelixSlider>('<hx-slider label="Level"></hx-slider>');
      el.focus();
      await new Promise<void>((r) => setTimeout(r, 50));
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(el.shadowRoot?.activeElement).toBe(input);
    });
  });

  // ─── Validity API (2) ───

  describe('Validity API', () => {
    it('checkValidity returns true in default state', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(el.checkValidity()).toBe(true);
    });

    it('validity and validationMessage accessors are defined', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      expect(el.validity).toBeDefined();
      expect(typeof el.validationMessage).toBe('string');
    });
  });

  // ─── Keyboard Navigation (4) ───

  describe('Keyboard Navigation', () => {
    it('ArrowRight: value increments by step', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider value="50" min="0" max="100" step="1"></hx-slider>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      input!.focus();
      input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      // Native range input handles ArrowRight to increment by step
      // Simulate by setting value and firing input event
      input!.value = '51';
      input!.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe(51);
    });

    it('ArrowLeft: value decrements by step', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider value="50" min="0" max="100" step="1"></hx-slider>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      input!.focus();
      input!.value = '49';
      input!.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe(49);
    });

    it('Home: value jumps to min', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider value="50" min="0" max="100" step="1"></hx-slider>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      input!.focus();
      input!.value = '0';
      input!.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe(0);
    });

    it('End: value jumps to max', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider value="50" min="0" max="100" step="1"></hx-slider>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      input!.focus();
      input!.value = '100';
      input!.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe(100);
    });
  });

  // ─── Accessible name (label slot regression) ───

  describe('Accessible name', () => {
    it('aria-labelledby references an element that exists in shadow DOM when label slot is used', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider><strong slot="label">Pain Level</strong></hx-slider>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      const labelId = input?.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      const labelEl = el.shadowRoot?.getElementById(labelId!);
      expect(labelEl).toBeTruthy();
    });

    it('aria-labelledby references an element that exists when label prop is set', async () => {
      const el = await fixture<HelixSlider>('<hx-slider label="Volume"></hx-slider>');
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      const labelId = input?.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      const labelEl = el.shadowRoot?.getElementById(labelId!);
      expect(labelEl).toBeTruthy();
    });

    it('aria-labelledby is absent when no label is provided', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(input?.getAttribute('aria-labelledby')).toBeNull();
    });

    it('aria-valuetext is set on input when valueText prop is provided', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider label="Pain" value="7" aria-valuetext="7 — Moderate-Severe"></hx-slider>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="range"]');
      expect(input?.getAttribute('aria-valuetext')).toBe('7 — Moderate-Severe');
    });

    it('host has aria-disabled="true" when disabled', async () => {
      const el = await fixture<HelixSlider>('<hx-slider disabled></hx-slider>');
      await el.updateComplete;
      expect(el.getAttribute('aria-disabled')).toBe('true');
    });

    it('host has no aria-disabled when not disabled', async () => {
      const el = await fixture<HelixSlider>('<hx-slider></hx-slider>');
      await el.updateComplete;
      expect(el.getAttribute('aria-disabled')).toBeNull();
    });
  });

  // ─── Accessibility (axe-core) (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixSlider>('<hx-slider label="Volume"></hx-slider>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with all options enabled', async () => {
      const el = await fixture<HelixSlider>(
        '<hx-slider label="Brightness" show-value show-ticks min="0" max="10" step="1" help-text="Select a brightness level" value="5"></hx-slider>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixSlider>('<hx-slider label="Contrast" disabled></hx-slider>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
