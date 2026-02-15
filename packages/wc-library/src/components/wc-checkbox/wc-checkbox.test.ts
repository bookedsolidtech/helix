import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcCheckbox } from './wc-checkbox.js';
import './index.js';

afterEach(cleanup);

describe('wc-checkbox', () => {

  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders hidden native <input type="checkbox">', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="checkbox"]');
      expect(input).toBeInstanceOf(HTMLInputElement);
    });

    it('renders visual checkbox box', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      const box = shadowQuery(el, '.checkbox__box');
      expect(box).toBeTruthy();
    });

    it('exposes "checkbox" CSS part', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      const part = shadowQuery(el, '[part="checkbox"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Property: checked (3) ───

  describe('Property: checked', () => {
    it('defaults to unchecked', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      expect(el.checked).toBe(false);
    });

    it('reflects checked attribute to host', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox checked></wc-checkbox>');
      expect(el.hasAttribute('checked')).toBe(true);
      expect(el.checked).toBe(true);
    });

    it('applies checked class to container', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox checked></wc-checkbox>');
      const container = shadowQuery(el, '.checkbox');
      expect(container?.classList.contains('checkbox--checked')).toBe(true);
    });
  });

  // ─── Property: indeterminate (2) ───

  describe('Property: indeterminate', () => {
    it('applies indeterminate class when set', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      el.indeterminate = true;
      await el.updateComplete;
      const container = shadowQuery(el, '.checkbox');
      expect(container?.classList.contains('checkbox--indeterminate')).toBe(true);
    });

    it('clears indeterminate on toggle', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      el.indeterminate = true;
      await el.updateComplete;
      // Simulate a toggle by clicking the control
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      await el.updateComplete;
      expect(el.indeterminate).toBe(false);
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox label="Accept Terms"></wc-checkbox>');
      const label = shadowQuery(el, '.checkbox__label');
      expect(label?.textContent?.trim()).toContain('Accept Terms');
    });

    it('shows asterisk when required', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox label="Accept Terms" required></wc-checkbox>');
      const marker = shadowQuery(el, '.checkbox__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox label="Test"></wc-checkbox>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });
  });

  // ─── Property: error (4) ───

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox error="This is required"></wc-checkbox>');
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('This is required');
    });

    it('error div has aria-live="polite"', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox error="Required"></wc-checkbox>');
      const errorDiv = shadowQuery(el, '.checkbox__error');
      expect(errorDiv?.getAttribute('aria-live')).toBe('polite');
    });

    it('sets aria-invalid="true" on native input', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox error="Required"></wc-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('error hides help text', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox error="Error" help-text="Help"></wc-checkbox>');
      const helpText = shadowQuery(el, '.checkbox__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: helpText (2) ───

  describe('Property: helpText', () => {
    it('renders help text below checkbox', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox help-text="Check to agree"></wc-checkbox>');
      const helpText = shadowQuery(el, '.checkbox__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Check to agree');
    });

    it('help text hidden when error present', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox help-text="Help" error="Error"></wc-checkbox>');
      const helpText = shadowQuery(el, '.checkbox__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: value (2) ───

  describe('Property: value', () => {
    it('defaults to "on"', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      expect(el.value).toBe('on');
    });

    it('uses custom value in change event', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox value="yes"></wc-checkbox>');
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-change');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('yes');
    });
  });

  // ─── Property: required (2) ───

  describe('Property: required', () => {
    it('sets required attr on native input', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox required></wc-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.required).toBe(true);
    });

    it('reflects required attribute to host', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox required></wc-checkbox>');
      expect(el.hasAttribute('required')).toBe(true);
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('sets disabled attr on native input', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox disabled></wc-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.disabled).toBe(true);
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox disabled></wc-checkbox>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('prevents toggle when disabled', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox disabled></wc-checkbox>');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches wc-change on toggle', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-change');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('wc-change detail has checked and value', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox value="agree"></wc-checkbox>');
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-change');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      const event = await eventPromise;
      expect(event.detail.checked).toBe(true);
      expect(event.detail.value).toBe('agree');
    });

    it('wc-change bubbles and is composed', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-change');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders custom label content', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox><strong>Custom Label</strong></wc-checkbox>');
      const slotted = el.querySelector('strong');
      expect(slotted).toBeTruthy();
      expect(slotted?.textContent).toBe('Custom Label');
    });

    it('help-text slot renders', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox help-text="default"><em slot="help-text">Custom help</em></wc-checkbox>');
      const helpSlot = el.querySelector('[slot="help-text"]');
      expect(helpSlot).toBeTruthy();
      expect(helpSlot?.textContent).toBe('Custom help');
    });
  });

  // ─── CSS Parts (3) ───

  describe('CSS Parts', () => {
    it('control part exposed', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      const control = shadowQuery(el, '[part="control"]');
      expect(control).toBeTruthy();
    });

    it('checkbox part exposed', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      const checkbox = shadowQuery(el, '[part="checkbox"]');
      expect(checkbox).toBeTruthy();
    });

    it('error part exposed when error set', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox error="Error msg"></wc-checkbox>');
      const errorPart = shadowQuery(el, '[part="error"]');
      expect(errorPart).toBeTruthy();
    });
  });

  // ─── Form (5) ───

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('wc-checkbox') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<wc-checkbox name="agree"></wc-checkbox>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('wc-checkbox') as WcCheckbox;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets checked to false', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox checked></wc-checkbox>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });

    it('formStateRestoreCallback restores checked state', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox value="yes"></wc-checkbox>');
      el.formStateRestoreCallback('yes');
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });
  });

  // ─── Validation (3) ───

  describe('Validation', () => {
    it('checkValidity returns false when required + unchecked', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox required></wc-checkbox>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required + checked', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox required checked></wc-checkbox>');
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is set when required + unchecked', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox required></wc-checkbox>');
      expect(el.validity.valueMissing).toBe(true);
    });
  });

  // ─── Accessibility (3) ───

  describe('Accessibility', () => {
    it('aria-describedby references error ID when error set', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox error="Must check"></wc-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const errorDiv = shadowQuery(el, '.checkbox__error')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv.id);
    });

    it('aria-describedby references help text ID when helpText set', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox help-text="Some help"></wc-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpDiv = shadowQuery(el, '.checkbox__help-text')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpDiv.id);
    });

    it('no aria-invalid when no error', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox></wc-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ─── Keyboard (2) ───

  describe('Keyboard', () => {
    it('Space key toggles checked', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox label="Test"></wc-checkbox>');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('Enter key does NOT toggle checked', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox label="Test"></wc-checkbox>');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox label="Accept terms"></wc-checkbox>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when checked', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox label="Accept terms" checked></wc-checkbox>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox label="Accept terms" error="Required"></wc-checkbox>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<WcCheckbox>('<wc-checkbox label="Accept terms" disabled></wc-checkbox>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

});
