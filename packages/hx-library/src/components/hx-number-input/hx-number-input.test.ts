import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixNumberInput } from './hx-number-input.js';
import './index.js';

afterEach(cleanup);

describe('hx-number-input', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <input> of type number', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input');
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input?.getAttribute('type')).toBe('number');
    });

    it('renders field container', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('renders with default md size class', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--md')).toBe(true);
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input label="Dosage"></hx-number-input>',
      );
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Dosage');
    });

    it('does not render label when empty', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('shows required marker when required and label is set', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input label="Age" required></hx-number-input>',
      );
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });
  });

  // ─── Property: value (6) ───

  describe('Property: value', () => {
    it('is null by default', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(el.value).toBeNull();
    });

    it('accepts a numeric value via attribute', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="42"></hx-number-input>');
      expect(el.value).toBe(42);
    });

    it('converts empty string attribute to null', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value=""></hx-number-input>');
      expect(el.value).toBeNull();
    });

    it('reflects numeric value on the native input', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="10"></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('10');
    });

    it('programmatic value update is reflected on native input', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      el.value = 99;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('99');
    });
  });

  // ─── Property: required (3) ───

  describe('Property: required', () => {
    it('reflects required attribute on host', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input required></hx-number-input>');
      expect(el.hasAttribute('required')).toBe(true);
    });

    it('sets native required attribute on input', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input required></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.required).toBe(true);
    });

    it('marks validity as valueMissing when required and no value', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input required></hx-number-input>');
      expect(el.validity.valueMissing).toBe(true);
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('reflects disabled attribute on host', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input disabled></hx-number-input>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('sets disabled on the native input', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input disabled></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.disabled).toBe(true);
    });

    it('disables stepper increment and decrement buttons', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input disabled></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      const decrement = shadowQuery<HTMLButtonElement>(el, '[part="decrement"]')!;
      expect(increment.disabled).toBe(true);
      expect(decrement.disabled).toBe(true);
    });
  });

  // ─── Property: readonly (2) ───

  describe('Property: readonly', () => {
    it('reflects readonly attribute on host', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input readonly></hx-number-input>');
      expect(el.hasAttribute('readonly')).toBe(true);
    });

    it('sets readonly on the native input', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input readonly></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.readOnly).toBe(true);
    });
  });

  // ─── Property: min/max (5) ───

  describe('Property: min/max', () => {
    it('sets min attribute on native input', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input min="0"></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('min')).toBe('0');
    });

    it('sets max attribute on native input', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input max="100"></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('max')).toBe('100');
    });

    it('clamps value to min on change event', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input min="5"></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      input.value = '1';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await eventPromise;
      expect(el.value).toBe(5);
    });

    it('clamps value to max on change event', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input max="10"></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      input.value = '50';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await eventPromise;
      expect(el.value).toBe(10);
    });

    it('disables increment button when value is at max', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input value="10" max="10"></hx-number-input>',
      );
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      expect(increment.disabled).toBe(true);
    });

    it('disables decrement button when value is at min', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input value="0" min="0"></hx-number-input>',
      );
      const decrement = shadowQuery<HTMLButtonElement>(el, '[part="decrement"]')!;
      expect(decrement.disabled).toBe(true);
    });

    it('marks validity as rangeUnderflow when value is below min', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input min="10" value="5"></hx-number-input>',
      );
      expect(el.validity.rangeUnderflow).toBe(true);
    });

    it('marks validity as rangeOverflow when value is above max', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input max="10" value="20"></hx-number-input>',
      );
      expect(el.validity.rangeOverflow).toBe(true);
    });

    it('marks validity as stepMismatch when value does not match step from min', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input min="0" step="5" value="7"></hx-number-input>',
      );
      expect(el.validity.stepMismatch).toBe(true);
    });

    it('does not mark stepMismatch when value matches step from min', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input min="0" step="5" value="10"></hx-number-input>',
      );
      expect(el.validity.stepMismatch).toBe(false);
    });
  });

  // ─── Property: step (2) ───

  describe('Property: step', () => {
    it('defaults to step of 1', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(el.step).toBe(1);
    });

    it('stepper uses custom step value when incrementing', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input value="0" step="5"></hx-number-input>',
      );
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await eventPromise;
      expect(el.value).toBe(5);
    });

    it('stepper uses custom step value when decrementing', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input value="10" step="5"></hx-number-input>',
      );
      const decrement = shadowQuery<HTMLButtonElement>(el, '[part="decrement"]')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      decrement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await eventPromise;
      expect(el.value).toBe(5);
    });
  });

  // ─── Property: hx-size (3) ───

  describe('Property: hx-size', () => {
    it('applies field--sm class when hx-size="sm"', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input hx-size="sm"></hx-number-input>',
      );
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--sm')).toBe(true);
    });

    it('applies field--md class when hx-size="md" (default)', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--md')).toBe(true);
    });

    it('applies field--lg class when hx-size="lg"', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input hx-size="lg"></hx-number-input>',
      );
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--lg')).toBe(true);
    });
  });

  // ─── Property: no-stepper (2) ───

  describe('Property: no-stepper', () => {
    it('shows stepper by default', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const stepper = shadowQuery(el, '[part="stepper"]');
      expect(stepper).toBeTruthy();
    });

    it('hides stepper when no-stepper is set', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input no-stepper></hx-number-input>');
      const stepper = shadowQuery(el, '[part="stepper"]');
      expect(stepper).toBeNull();
    });
  });

  // ─── Property: error (4) ───

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input error="Value is required"></hx-number-input>',
      );
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Value is required');
    });

    it('error div has role="alert"', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input error="Invalid"></hx-number-input>',
      );
      const errorDiv = shadowQuery(el, '.field__error');
      expect(errorDiv?.getAttribute('role')).toBe('alert');
    });

    it('applies field--error class to field container', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input error="Out of range"></hx-number-input>',
      );
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--error')).toBe(true);
    });

    it('sets aria-invalid="true" on native input', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input error="Invalid"></hx-number-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });

  // ─── Property: help-text (2) ───

  describe('Property: help-text', () => {
    it('renders help text below input', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input help-text="Enter a value between 1 and 100"></hx-number-input>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Enter a value between 1 and 100');
    });

    it('help text is hidden when error is present', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input help-text="Some guidance" error="Invalid value"></hx-number-input>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText?.hidden).toBe(true);
    });
  });

  // ─── Stepper buttons (5) ───

  describe('Stepper buttons', () => {
    it('increment button increases value by step', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="5"></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await eventPromise;
      expect(el.value).toBe(6);
    });

    it('decrement button decreases value by step', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="5"></hx-number-input>');
      const decrement = shadowQuery<HTMLButtonElement>(el, '[part="decrement"]')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      decrement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await eventPromise;
      expect(el.value).toBe(4);
    });

    it('increment starts from 0 when value is null', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await eventPromise;
      expect(el.value).toBe(1);
    });

    it('increment button is exposed as CSS part', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const increment = shadowQuery(el, '[part="increment"]');
      expect(increment).toBeTruthy();
    });

    it('decrement button is exposed as CSS part', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const decrement = shadowQuery(el, '[part="decrement"]');
      expect(decrement).toBeTruthy();
    });
  });

  // ─── Stepper event contract (1) ───

  describe('Stepper event contract', () => {
    it('stepper fires only hx-change, not hx-input', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="5"></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;

      let inputFired = false;
      el.addEventListener('hx-input', () => {
        inputFired = true;
      });

      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await eventPromise;
      increment.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

      expect(inputFired).toBe(false);
      expect(el.value).toBe(6);
    });
  });

  // ─── Long-press stepper (5) ───

  describe('Long-press stepper', () => {
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    it('fires hx-change immediately on pointerdown', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="0"></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      let changeCount = 0;
      el.addEventListener('hx-change', () => changeCount++);

      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await el.updateComplete;
      expect(changeCount).toBe(1);
      expect(el.value).toBe(1);

      // Clean up: stop long-press before delay fires
      increment.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });

    it('fires hx-change repeatedly after 400ms hold', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="0"></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      let changeCount = 0;
      el.addEventListener('hx-change', () => changeCount++);

      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await el.updateComplete;
      expect(changeCount).toBe(1);

      // Wait past 400ms delay + at least one 100ms interval
      await wait(550);
      await el.updateComplete;
      expect(changeCount).toBeGreaterThanOrEqual(2);

      increment.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });

    it('pointerup stops repeat before delay fires', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="0"></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      let changeCount = 0;
      el.addEventListener('hx-change', () => changeCount++);

      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await el.updateComplete;
      // Immediately stop — no repeat should have started
      increment.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      const countAfterUp = changeCount;

      // Wait past delay + interval — no more events should fire
      await wait(550);
      expect(changeCount).toBe(countAfterUp);
    });

    it('pointerleave stops repeat', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="0"></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      let changeCount = 0;
      el.addEventListener('hx-change', () => changeCount++);

      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await el.updateComplete;
      increment.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
      const countAfterLeave = changeCount;

      await wait(550);
      expect(changeCount).toBe(countAfterLeave);
    });

    it('pointercancel stops repeat', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="0"></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      let changeCount = 0;
      el.addEventListener('hx-change', () => changeCount++);

      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await el.updateComplete;
      increment.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
      const countAfterCancel = changeCount;

      await wait(550);
      expect(changeCount).toBe(countAfterCancel);
    });

    it('disconnectedCallback clears long-press timer', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="0"></hx-number-input>');
      const increment = shadowQuery<HTMLButtonElement>(el, '[part="increment"]')!;
      let changeCount = 0;
      el.addEventListener('hx-change', () => changeCount++);

      increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await el.updateComplete;
      const countBeforeDisconnect = changeCount;

      el.remove();
      await wait(550);
      expect(changeCount).toBe(countBeforeDisconnect);
    });
  });

  // ─── Keyboard (4) ───

  describe('Keyboard', () => {
    it('ArrowUp increments value by step', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="10"></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await eventPromise;
      expect(el.value).toBe(11);
    });

    it('ArrowDown decrements value by step', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="10"></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await eventPromise;
      expect(el.value).toBe(9);
    });

    it('ArrowUp does not fire when disabled', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input value="10" disabled></hx-number-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      let fired = false;
      el.addEventListener('hx-change', () => {
        fired = true;
      });
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      expect(fired).toBe(false);
      expect(el.value).toBe(10);
    });

    it('ArrowDown does not fire when readonly', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input value="10" readonly></hx-number-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      let fired = false;
      el.addEventListener('hx-change', () => {
        fired = true;
      });
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(fired).toBe(false);
      expect(el.value).toBe(10);
    });
  });

  // ─── Events (6) ───

  describe('Events', () => {
    it('dispatches hx-input on typing', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-input');
      input.value = '7';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-input detail.value is numeric', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-input');
      input.value = '42';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(42);
    });

    it('dispatches hx-change on blur', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      input.value = '15';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change detail.value is numeric', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      input.value = '33';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(33);
    });

    it('hx-input bubbles and is composed', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-input');
      input.value = '1';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: number | null }>>(el, 'hx-change');
      input.value = '2';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Form integration (7) ───

  describe('Form integration', () => {
    it('has formAssociated=true on constructor', () => {
      const ctor = customElements.get('hx-number-input') as unknown as {
        formAssociated: boolean;
      };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached (form is null without parent form)', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(el.form).toBeNull();
    });

    it('form getter returns associated form element', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      try {
        const form = document.createElement('form');
        form.innerHTML = '<hx-number-input name="dosage"></hx-number-input>';
        container.appendChild(form);
        const el = form.querySelector('hx-number-input') as HelixNumberInput;
        await el.updateComplete;
        expect(el.form).toBe(form);
      } finally {
        document.body.removeChild(container);
      }
    });

    it('formResetCallback restores value to default', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input value="42"></hx-number-input>');
      el.value = 99;
      await el.updateComplete;
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe(42);
    });

    it('formResetCallback restores to null when no default value', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      el.value = 50;
      await el.updateComplete;
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBeNull();
    });

    it('checkValidity returns false when required and value is null', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input required></hx-number-input>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required and value is set', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input required value="5"></hx-number-input>',
      );
      expect(el.checkValidity()).toBe(true);
    });

    it('reportValidity returns false when required and value is null', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input required></hx-number-input>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required and value is set', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input required value="5"></hx-number-input>',
      );
      expect(el.reportValidity()).toBe(true);
    });

    it('validationMessage is set when required and value is null', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input required></hx-number-input>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });

    it('formStateRestoreCallback restores numeric value', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      el.formStateRestoreCallback('77');
      await el.updateComplete;
      expect(el.value).toBe(77);
    });

    it('formStateRestoreCallback sets null for non-numeric state', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      el.formStateRestoreCallback('not-a-number');
      await el.updateComplete;
      expect(el.value).toBeNull();
    });

    it('formStateRestoreCallback rejects partial numeric strings like "77abc"', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      el.formStateRestoreCallback('77abc');
      await el.updateComplete;
      expect(el.value).toBeNull();
    });
  });

  // ─── CSS Parts (9) ───

  describe('CSS Parts', () => {
    it('field part is present in shadow DOM', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(shadowQuery(el, '[part="field"]')).toBeTruthy();
    });

    it('label part is present when label is set', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input label="Measurement"></hx-number-input>',
      );
      expect(shadowQuery(el, '[part="label"]')).toBeTruthy();
    });

    it('input-wrapper part is present in shadow DOM', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(shadowQuery(el, '[part="input-wrapper"]')).toBeTruthy();
    });

    it('input part is present in shadow DOM', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(shadowQuery(el, '[part="input"]')).toBeTruthy();
    });

    it('stepper part is present in shadow DOM', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(shadowQuery(el, '[part="stepper"]')).toBeTruthy();
    });

    it('increment part is present in shadow DOM', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(shadowQuery(el, '[part="increment"]')).toBeTruthy();
    });

    it('decrement part is present in shadow DOM', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      expect(shadowQuery(el, '[part="decrement"]')).toBeTruthy();
    });

    it('help-text part is present when helpText is set', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input help-text="Range: 1-10"></hx-number-input>',
      );
      expect(shadowQuery(el, '[part="help-text"]')).toBeTruthy();
    });

    it('error-message part is present when error is set', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input error="Out of range"></hx-number-input>',
      );
      expect(shadowQuery(el, '[part="error-message"]')).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) (4) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input label="Dosage (mg)"></hx-number-input>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input label="Age" error="Must be a positive number"></hx-number-input>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input label="Weight (kg)" disabled></hx-number-input>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when required', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input label="Blood pressure" required></hx-number-input>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Slots (4) ───

  describe('Slots', () => {
    it('prefix slot renders content', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input><span slot="prefix">mg</span></hx-number-input>',
      );
      const prefix = el.querySelector('[slot="prefix"]');
      expect(prefix).toBeTruthy();
      expect(prefix?.textContent).toBe('mg');
    });

    it('suffix slot renders content', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input><span slot="suffix">kg</span></hx-number-input>',
      );
      const suffix = el.querySelector('[slot="suffix"]');
      expect(suffix).toBeTruthy();
      expect(suffix?.textContent).toBe('kg');
    });

    it('help-text slot renders custom content inside help-text container', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input help-text="fallback"><em slot="help-text">Custom help</em></hx-number-input>',
      );
      const helpSlot = el.querySelector('[slot="help-text"]');
      expect(helpSlot).toBeTruthy();
      expect(helpSlot?.textContent).toBe('Custom help');
    });

    it('error slot sets error state on field', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input><span slot="error">Custom error</span></hx-number-input>',
      );
      await el.updateComplete;
      const field = shadowQuery(el, '[part="field"]');
      expect(field?.classList.contains('field--error')).toBe(true);
    });

    it('slotted help-text sets aria-describedby without help-text prop', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input label="Qty"><em slot="help-text">Enter a number</em></hx-number-input>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
    });

    it('slotted error sets aria-describedby and aria-invalid without error prop', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input label="Qty"><span slot="error">Bad value</span></hx-number-input>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
    });
  });

  // ─── aria-describedby (2) ───

  describe('aria-describedby', () => {
    it('references error ID when error is set', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input error="Out of range"></hx-number-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const errorDiv = shadowQuery(el, '.field__error')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv.id);
    });

    it('references help text ID when helpText is set', async () => {
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input help-text="Enter a valid dosage"></hx-number-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpDiv = shadowQuery(el, '.field__help-text')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpDiv.id);
    });
  });

  // ─── Methods (2) ───

  describe('Methods', () => {
    it('focus() moves focus to the native input', async () => {
      const el = await fixture<HelixNumberInput>('<hx-number-input></hx-number-input>');
      el.focus();
      await new Promise<void>((r) => setTimeout(r, 50));
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(el.shadowRoot?.activeElement).toBe(input);
    });

    it('select() does not throw on type=number inputs', async () => {
      // selectionStart/selectionEnd are null on type="number" per spec
      const el = await fixture<HelixNumberInput>(
        '<hx-number-input value="12345"></hx-number-input>',
      );
      el.focus();
      // Should not throw
      expect(() => el.select()).not.toThrow();
    });
  });
});
