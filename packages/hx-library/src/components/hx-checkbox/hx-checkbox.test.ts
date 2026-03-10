import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixCheckbox } from './hx-checkbox.js';
import './index.js';

afterEach(cleanup);

describe('hx-checkbox', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders hidden native <input type="checkbox">', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="checkbox"]');
      expect(input).toBeInstanceOf(HTMLInputElement);
    });

    it('renders visual checkbox box', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      const box = shadowQuery(el, '.checkbox__box');
      expect(box).toBeTruthy();
    });

    it('exposes "checkbox" CSS part', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      const part = shadowQuery(el, '[part="checkbox"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Property: checked (3) ───

  describe('Property: checked', () => {
    it('defaults to unchecked', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      expect(el.checked).toBe(false);
    });

    it('reflects checked attribute to host', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox checked></hx-checkbox>');
      expect(el.hasAttribute('checked')).toBe(true);
      expect(el.checked).toBe(true);
    });

    it('applies checked class to container', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox checked></hx-checkbox>');
      const container = shadowQuery(el, '.checkbox');
      expect(container?.classList.contains('checkbox--checked')).toBe(true);
    });
  });

  // ─── Property: indeterminate (2) ───

  describe('Property: indeterminate', () => {
    it('applies indeterminate class when set', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      el.indeterminate = true;
      await el.updateComplete;
      const container = shadowQuery(el, '.checkbox');
      expect(container?.classList.contains('checkbox--indeterminate')).toBe(true);
    });

    it('clears indeterminate on toggle', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      el.indeterminate = true;
      await el.updateComplete;
      // Simulate a toggle by clicking the control
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      await el.updateComplete;
      expect(el.indeterminate).toBe(false);
    });

    it('sets native input.indeterminate to true (P1-06)', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      el.indeterminate = true;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.indeterminate).toBe(true);
    });

    it('reflects indeterminate attribute to host (P1-09)', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      el.indeterminate = true;
      await el.updateComplete;
      expect(el.hasAttribute('indeterminate')).toBe(true);
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox label="Accept Terms"></hx-checkbox>');
      const label = shadowQuery(el, '.checkbox__label');
      expect(label?.textContent?.trim()).toContain('Accept Terms');
    });

    it('shows asterisk when required', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox label="Accept Terms" required></hx-checkbox>',
      );
      const marker = shadowQuery(el, '.checkbox__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox label="Test"></hx-checkbox>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });
  });

  // ─── Property: error (4) ───

  describe('Property: error', () => {
    it('renders error message in role="status" div', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox error="This is required"></hx-checkbox>',
      );
      const errorDiv = shadowQuery(el, '[role="status"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('This is required');
    });

    it('error div uses role="status" (implicit polite live region, no aria-live conflict)', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox error="Required"></hx-checkbox>');
      const errorDiv = shadowQuery(el, '.checkbox__error');
      expect(errorDiv?.getAttribute('role')).toBe('status');
      expect(errorDiv?.hasAttribute('aria-live')).toBe(false);
    });

    it('sets aria-invalid="true" on native input', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox error="Required"></hx-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('error hides help text', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox error="Error" help-text="Help"></hx-checkbox>',
      );
      const helpText = shadowQuery(el, '.checkbox__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: helpText (2) ───

  describe('Property: helpText', () => {
    it('renders help text below checkbox', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox help-text="Check to agree"></hx-checkbox>',
      );
      const helpText = shadowQuery(el, '.checkbox__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Check to agree');
    });

    it('help text hidden when error present', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox help-text="Help" error="Error"></hx-checkbox>',
      );
      const helpText = shadowQuery(el, '.checkbox__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: value (2) ───

  describe('Property: value', () => {
    it('defaults to "on"', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      expect(el.value).toBe('on');
    });

    it('uses custom value in change event', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox value="yes"></hx-checkbox>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('yes');
    });
  });

  // ─── Property: required (2) ───

  describe('Property: required', () => {
    it('sets required attr on native input', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox required></hx-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.required).toBe(true);
    });

    it('reflects required attribute to host', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox required></hx-checkbox>');
      expect(el.hasAttribute('required')).toBe(true);
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('sets disabled attr on native input', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox disabled></hx-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.disabled).toBe(true);
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox disabled></hx-checkbox>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('prevents toggle when disabled', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox disabled></hx-checkbox>');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches hx-change on toggle', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change detail has checked and value', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox value="agree"></hx-checkbox>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      const event = await eventPromise;
      expect(event.detail.checked).toBe(true);
      expect(event.detail.value).toBe('agree');
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('disabled checkbox does not dispatch hx-change on click', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox disabled></hx-checkbox>');
      let fired = false;
      el.addEventListener('hx-change', () => {
        fired = true;
      });
      const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
      control.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });

    it('clicking label text activates checkbox (P1-10)', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox label="Accept Terms"></hx-checkbox>');
      const label = shadowQuery<HTMLElement>(el, '.checkbox__label')!;
      label.click();
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders custom label content', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox><strong>Custom Label</strong></hx-checkbox>',
      );
      const slotted = el.querySelector('strong');
      expect(slotted).toBeTruthy();
      expect(slotted?.textContent).toBe('Custom Label');
    });

    it('help-text slot renders', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox help-text="default"><em slot="help-text">Custom help</em></hx-checkbox>',
      );
      const helpSlot = el.querySelector('[slot="help-text"]');
      expect(helpSlot).toBeTruthy();
      expect(helpSlot?.textContent).toBe('Custom help');
    });

    it('error slot renders and aria-describedby references wrapper (P0-01)', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox><span slot="error">Custom error</span></hx-checkbox>',
      );
      await el.updateComplete;
      const slotted = el.querySelector('[slot="error"]');
      expect(slotted).toBeTruthy();
      expect(slotted?.textContent).toBe('Custom error');
      // The error wrapper div should have the errorId
      const errorWrapper = shadowQuery(el, '.checkbox__error');
      expect(errorWrapper).toBeTruthy();
      // aria-describedby should reference the wrapper (not the slotted content)
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorWrapper!.id);
    });
  });

  // ─── CSS Parts (3) ───

  describe('CSS Parts', () => {
    it('control part exposed', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      const control = shadowQuery(el, '[part="control"]');
      expect(control).toBeTruthy();
    });

    it('checkbox part exposed', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      const checkbox = shadowQuery(el, '[part="checkbox"]');
      expect(checkbox).toBeTruthy();
    });

    it('error part exposed when error set', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox error="Error msg"></hx-checkbox>');
      const errorPart = shadowQuery(el, '[part="error"]');
      expect(errorPart).toBeTruthy();
    });

    it('checkmark part exposed (P2-14)', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox checked></hx-checkbox>');
      const checkmark = shadowQuery(el, '[part="checkmark"]');
      expect(checkmark).toBeTruthy();
    });
  });

  // ─── Property: hxSize (3) ───

  describe('Property: hxSize', () => {
    it('applies checkbox--sm class when hx-size="sm"', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox hx-size="sm"></hx-checkbox>');
      const container = shadowQuery(el, '.checkbox');
      expect(container?.classList.contains('checkbox--sm')).toBe(true);
    });

    it('applies checkbox--lg class when hx-size="lg"', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox hx-size="lg"></hx-checkbox>');
      const container = shadowQuery(el, '.checkbox');
      expect(container?.classList.contains('checkbox--lg')).toBe(true);
    });

    it('reflects hx-size attribute to host', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox hx-size="sm"></hx-checkbox>');
      expect(el.getAttribute('hx-size')).toBe('sm');
    });
  });

  // ─── Form (5) ───

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-checkbox') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-checkbox name="agree"></hx-checkbox>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-checkbox') as HelixCheckbox;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets checked to false', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox checked></hx-checkbox>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });

    it('formStateRestoreCallback restores checked state', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox value="yes"></hx-checkbox>');
      el.formStateRestoreCallback('yes', 'restore');
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('formStateRestoreCallback with null sets checked to false', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox value="yes" checked></hx-checkbox>');
      el.formStateRestoreCallback(null, 'restore');
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });
  });

  // ─── Validation (6) ───

  describe('Validation', () => {
    it('checkValidity returns false when required + unchecked', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox required></hx-checkbox>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required + checked', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox required checked></hx-checkbox>');
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is set when required + unchecked', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox required></hx-checkbox>');
      expect(el.validity.valueMissing).toBe(true);
    });

    it('reportValidity returns false when required + unchecked', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox required></hx-checkbox>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required + checked', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox required checked></hx-checkbox>');
      expect(el.reportValidity()).toBe(true);
    });

    it('validationMessage is set when required + unchecked', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox required></hx-checkbox>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });
  });

  // ─── Accessibility (3) ───

  describe('Accessibility', () => {
    it('aria-describedby references error ID when error set', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox error="Must check"></hx-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const errorDiv = shadowQuery(el, '.checkbox__error')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv.id);
    });

    it('aria-describedby references help text ID when helpText set', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox help-text="Some help"></hx-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpDiv = shadowQuery(el, '.checkbox__help-text')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpDiv.id);
    });

    it('no aria-invalid when no error', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ─── Keyboard (2) ───

  describe('Keyboard', () => {
    it('Space key toggles checked', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox label="Test"></hx-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('Enter key does NOT toggle checked', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox label="Test"></hx-checkbox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });
  });

  // ─── Methods (1) ───

  describe('Methods', () => {
    it('focus() moves focus to input element', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox label="Test"></hx-checkbox>');
      el.focus();
      // Allow brief settle time for focus to propagate into the shadow DOM input
      await new Promise((r) => setTimeout(r, 50));
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(el.shadowRoot?.activeElement).toBe(input);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox label="Accept terms"></hx-checkbox>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when checked', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox label="Accept terms" checked></hx-checkbox>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox label="Accept terms" error="Required"></hx-checkbox>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixCheckbox>(
        '<hx-checkbox label="Accept terms" disabled></hx-checkbox>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in indeterminate state (P1-05)', async () => {
      const el = await fixture<HelixCheckbox>('<hx-checkbox label="Accept terms"></hx-checkbox>');
      el.indeterminate = true;
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
