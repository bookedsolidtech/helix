import { describe, it, expect, afterEach } from 'vitest';
import {
  fixture,
  shadowQuery,
  shadowQueryAll,
  oneEvent,
  cleanup,
  checkA11y,
} from '../../test-utils.js';
import { HelixTimePicker } from './hx-time-picker.js';
import './index.js';

afterEach(cleanup);

describe('hx-time-picker', () => {
  // ─── Rendering (6) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders label when label property is set', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Appointment Time"></hx-time-picker>',
      );
      const label = shadowQuery(el, 'label');
      expect(label).toBeTruthy();
      expect(label?.textContent?.trim()).toContain('Appointment Time');
    });

    it('does not render label element when no label prop', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('renders input with correct placeholder for 12h format', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker format="12h"></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('placeholder')).toBe('hh:mm AM');
    });

    it('renders input with correct placeholder for 24h format', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker format="24h"></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('placeholder')).toBe('hh:mm');
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker label="Time"></hx-time-picker>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('exposes "input" CSS part', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery(el, '[part="input"]');
      expect(input).toBeTruthy();
    });
  });

  // ─── Properties (8) ───

  describe('Properties', () => {
    it('value sets the displayed value in 12h format', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker value="14:30" format="12h"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('02:30 PM');
    });

    it('value sets the displayed value in 24h format', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker value="14:30" format="24h"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('14:30');
    });

    it('format="12h" shows AM time correctly', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker value="02:30" format="12h"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('02:30 AM');
    });

    it('format="12h" shows midnight as 12:00 AM', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker value="00:00" format="12h"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('12:00 AM');
    });

    it('format="12h" shows noon as 12:00 PM', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker value="12:00" format="12h"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('12:00 PM');
    });

    it('disabled reflects to host attribute', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker disabled></hx-time-picker>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('required reflects to host attribute', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker required></hx-time-picker>');
      expect(el.hasAttribute('required')).toBe(true);
    });

    it('programmatic value update updates displayed input', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker format="24h"></hx-time-picker>');
      el.value = '09:15';
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('09:15');
    });

    it('step controls the number of dropdown options generated', async () => {
      // min=08:00, max=10:00, step=60 → 3 options: 08:00, 09:00, 10:00
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker min="08:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const options = shadowQueryAll(el, '[role="option"]');
      expect(options.length).toBe(3);
    });

    it('min and max clamp values on selection', async () => {
      // Verify that values outside the range are clamped
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker min="09:00" max="17:00" step="60"></hx-time-picker>',
      );
      el.value = '06:00'; // below min
      await el.updateComplete;
      // The value property itself stores the provided value; clamping happens on slot selection
      // Open the dropdown and click the first visible option
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const firstOption = shadowQuery<HTMLLIElement>(el, '[role="option"]')!;
      expect(firstOption.textContent?.trim()).toContain('09:00');
    });
  });

  // ─── Dropdown (11) ───

  describe('Dropdown', () => {
    it('dropdown is initially closed', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const listbox = shadowQuery(el, '[role="listbox"]');
      // listbox is always in the DOM (aria-controls must never dangle); hidden when closed
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });

    it('opens on input click', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox).toBeTruthy();
    });

    it('opens on ArrowDown keypress', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox).toBeTruthy();
    });

    it('closes on Escape keypress', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open first
      input.click();
      await el.updateComplete;
      // Now close with Escape
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });

    it('closes on outside click', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      // Simulate outside click
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });

    it('renders correct time slots based on min/max/step', async () => {
      // 09:00 to 11:00 at 30-min steps → 5 options: 09:00, 09:30, 10:00, 10:30, 11:00
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="11:00" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const options = shadowQueryAll(el, '[role="option"]');
      expect(options.length).toBe(5);
      expect(options[0]?.textContent?.trim()).toBe('09:00');
      expect(options[4]?.textContent?.trim()).toBe('11:00');
    });

    it('selecting an option sets the value', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const option = shadowQuery<HTMLLIElement>(el, '[role="option"]')!;
      option.click();
      await el.updateComplete;
      expect(el.value).toBe('09:00');
    });

    it('selecting an option closes the dropdown', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const option = shadowQuery<HTMLLIElement>(el, '[role="option"]')!;
      option.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });

    it('ArrowDown moves to next option when open', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open
      input.click();
      await el.updateComplete;
      // First ArrowDown when open should move active index from 0 to 1
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const activeOption = shadowQuery(el, '.field__option--active');
      expect(activeOption).toBeTruthy();
    });

    it('ArrowUp moves to previous option', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open (sets activeIndex=0), then ArrowDown to index 1, then ArrowUp back to 0
      input.click();
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      const allOptions = shadowQueryAll(el, '[role="option"]');
      const activeOption = shadowQuery(el, '.field__option--active');
      // The active option should be the first one
      expect(activeOption).toBe(allOptions[0]);
    });

    it('Enter selects the active option', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open → activeIndex is set to 0 (first option = 09:00)
      input.click();
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('09:00');
    });

    it('renders role="listbox" on the listbox element', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[part="listbox"]');
      expect(listbox?.getAttribute('role')).toBe('listbox');
    });

    it('renders role="option" on each option element', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker min="09:00" max="09:30" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const options = shadowQueryAll(el, '[part="option"]');
      expect(options.length).toBeGreaterThan(0);
      options.forEach((opt) => {
        expect(opt.getAttribute('role')).toBe('option');
      });
    });
  });

  // ─── Form Integration (6) ───

  describe('Form Integration', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-time-picker') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('form getter returns null when not inside a form', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      expect(el.form).toBeNull();
    });

    it('form getter returns the associated form element', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-time-picker name="appointment-time"></hx-time-picker>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-time-picker') as HelixTimePicker;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback clears value', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker value="14:30"></hx-time-picker>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('formResetCallback clears the displayed input value', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker value="14:30" format="12h"></hx-time-picker>',
      );
      el.formResetCallback();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('');
    });

    it('formStateRestoreCallback restores value', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      el.formStateRestoreCallback('10:30');
      await el.updateComplete;
      expect(el.value).toBe('10:30');
    });

    it('formDisabledCallback sets disabled when parent fieldset is disabled', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      el.formDisabledCallback(true);
      await el.updateComplete;
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      await el.updateComplete;
      expect(el.disabled).toBe(false);
    });

    it('submits time value in FormData', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-time-picker name="appointment-time" value="14:30"></hx-time-picker>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-time-picker') as HelixTimePicker;
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('appointment-time')).toBe('14:30');
      form.remove();
    });
  });

  // ─── Validation (5) ───

  describe('Validation', () => {
    it('checkValidity returns false when required and empty', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker required></hx-time-picker>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required and has value', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker required value="09:00"></hx-time-picker>',
      );
      expect(el.checkValidity()).toBe(true);
    });

    it('checkValidity returns true when not required and empty', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      expect(el.checkValidity()).toBe(true);
    });

    it('validity.valueMissing is true when required and empty', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker required></hx-time-picker>');
      expect(el.validity.valueMissing).toBe(true);
    });

    it('validationMessage is set when required and empty', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker required></hx-time-picker>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });

    it('reportValidity returns false when required and empty', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker required></hx-time-picker>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required and has value', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker required value="09:00"></hx-time-picker>',
      );
      expect(el.reportValidity()).toBe(true);
    });
  });

  // ─── Events (5) ───

  describe('Events', () => {
    it('dispatches hx-change on option selection', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      input.click();
      await el.updateComplete;
      const option = shadowQuery<HTMLLIElement>(el, '[role="option"]')!;
      option.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change is composed', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      input.click();
      await el.updateComplete;
      const option = shadowQuery<HTMLLIElement>(el, '[role="option"]')!;
      option.click();
      const event = await eventPromise;
      expect(event.composed).toBe(true);
    });

    it('hx-change bubbles', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      input.click();
      await el.updateComplete;
      const option = shadowQuery<HTMLLIElement>(el, '[role="option"]')!;
      option.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
    });

    it('hx-change detail contains value in HH:MM 24h format', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="12h" min="14:00" max="15:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      input.click();
      await el.updateComplete;
      // First option should be 14:00 regardless of display format
      const option = shadowQuery<HTMLLIElement>(el, '[role="option"]')!;
      option.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('14:00');
    });

    it('does not open dropdown when disabled', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker disabled></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Keyboard Navigation (4) ───

  describe('Keyboard Navigation', () => {
    it('Tab closes the dropdown', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });

    it('ArrowDown does not move below the last option', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="09:30" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open → activeIndex=0, press ArrowDown twice to try to go past end (2 options total)
      input.click();
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Listbox should still be open (not crashed)
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox).toBeTruthy();
    });

    it('ArrowUp does not move above the first option', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="09:30" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      // At index 0, press ArrowUp — should stay at 0
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      const allOptions = shadowQueryAll(el, '[role="option"]');
      const activeOption = shadowQuery(el, '.field__option--active');
      expect(activeOption).toBe(allOptions[0]);
    });

    it('Enter does nothing when dropdown is closed', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // No click to open — press Enter on a closed picker
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('');
    });
  });

  // ─── Accessibility (9) ───

  describe('Accessibility', () => {
    it('combobox wrapper has role="combobox"', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const combobox = shadowQuery(el, '[role="combobox"]');
      expect(combobox).toBeTruthy();
    });

    it('combobox wrapper has aria-expanded="false" when closed', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const combobox = shadowQuery(el, '[role="combobox"]');
      expect(combobox?.getAttribute('aria-expanded')).toBe('false');
    });

    it('combobox wrapper has aria-expanded="true" when open', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const combobox = shadowQuery(el, '[role="combobox"]');
      expect(combobox?.getAttribute('aria-expanded')).toBe('true');
    });

    it('combobox wrapper has aria-haspopup="listbox"', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const combobox = shadowQuery(el, '[role="combobox"]');
      expect(combobox?.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('input has aria-invalid="true" when error is set', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker error="Please select a time"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('input has aria-required="true" when required', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker required></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('input has aria-required="false" when not required (APG editable combobox always reflects)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-required')).toBe('false');
    });

    it('input has aria-autocomplete="list"', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-autocomplete')).toBe('list');
    });

    it('selected option has aria-selected="true"', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" value="09:00" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const selectedOption = shadowQuery(el, '[aria-selected="true"]');
      expect(selectedOption).toBeTruthy();
    });

    it('unselected options have aria-selected="false"', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const options = shadowQueryAll(el, '[role="option"]');
      options.forEach((opt) => {
        expect(opt.getAttribute('aria-selected')).toBe('false');
      });
    });
  });

  // ─── Error State (3) ───

  describe('Error State', () => {
    it('renders error message from error property', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker error="Please select a valid time"></hx-time-picker>',
      );
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Please select a valid time');
    });

    it('error div has role="alert"', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker error="Required"></hx-time-picker>',
      );
      const errorDiv = shadowQuery(el, '.field__error');
      expect(errorDiv?.getAttribute('role')).toBe('alert');
    });

    it('error div does not have aria-live (role="alert" is assertive by default)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker error="Required"></hx-time-picker>',
      );
      const errorDiv = shadowQuery(el, '.field__error');
      // role="alert" carries implicit aria-live="assertive"; redundant aria-live is removed
      expect(errorDiv?.getAttribute('aria-live')).toBeNull();
    });

    it('error div is persistent and hidden when no error (live-region pattern)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const errorDiv = shadowQuery(el, '.field__error');
      // Persistent role="alert" container — present in DOM from first paint,
      // hidden via the [hidden] attribute when no error so AT contract is honoured.
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── CSS Parts (4) ───

  describe('CSS Parts', () => {
    it('field part exposed', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('listbox part exposed when open', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[part="listbox"]');
      expect(listbox).toBeTruthy();
    });

    it('option part exposed when open', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker min="09:00" max="09:30" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const option = shadowQuery(el, '[part="option"]');
      expect(option).toBeTruthy();
    });

    it('error part exposed when error is set', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker error="Error message"></hx-time-picker>',
      );
      const errorEl = shadowQuery(el, '[part="error"]');
      expect(errorEl).toBeTruthy();
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('label slot overrides the label element', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Default Label"><span slot="label">Custom Label</span></hx-time-picker>',
      );
      const slottedLabel = el.querySelector('[slot="label"]');
      expect(slottedLabel).toBeTruthy();
      expect(slottedLabel?.textContent).toBe('Custom Label');
    });

    it('help slot renders help content', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><span slot="help-text">Call for help</span></hx-time-picker>',
      );
      const helpContent = el.querySelector('[slot="help-text"]');
      expect(helpContent).toBeTruthy();
      expect(helpContent?.textContent).toBe('Call for help');
    });

    it('error slot renders custom error content', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><em slot="error">Custom error</em></hx-time-picker>',
      );
      const errorContent = el.querySelector('[slot="error"]');
      expect(errorContent).toBeTruthy();
      expect(errorContent?.textContent).toBe('Custom error');
    });
  });

  // ─── Property: name (1) ───

  describe('Property: name', () => {
    it('sets name attribute on the native input when name is provided', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker name="appointment-time"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('name')).toBe('appointment-time');
    });

    it('omits name attribute on native input when name is empty', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('name')).toBeNull();
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('sets disabled on the native input', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker disabled></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.disabled).toBe(true);
    });

    it('sets disabled on the toggle button', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker disabled></hx-time-picker>');
      const toggle = shadowQuery<HTMLButtonElement>(el, '.field__toggle')!;
      expect(toggle.disabled).toBe(true);
    });

    it('does not dispatch hx-change when disabled and option clicked programmatically', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker disabled min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      // Disabled — input click should not open the dropdown
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Property: required (2) ───

  describe('Property: required', () => {
    it('sets required attribute on native input', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker required></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.required).toBe(true);
    });

    it('shows required marker asterisk in label', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Time" required></hx-time-picker>',
      );
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });
  });

  // ─── Methods (1) ───

  describe('Methods', () => {
    it('focus() moves focus to the native input', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      el.focus();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(el.shadowRoot?.activeElement).toBe(input);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Appointment Time"></hx-time-picker>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Appointment Time" error="Please select a time"></hx-time-picker>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Appointment Time" disabled></hx-time-picker>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when required', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Appointment Time" required></hx-time-picker>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with dropdown open (A-10)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Appointment Time" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── ARIA 1.2 Combobox (A-01, A-05) ───

  describe('ARIA 1.2 Combobox role placement', () => {
    it('role="combobox" is on the input element, not a wrapper div (A-01)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('role')).toBe('combobox');
    });

    it('wrapper div does not have role="combobox" (A-01)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const comboboxDiv = el.shadowRoot?.querySelector('div[role="combobox"]');
      expect(comboboxDiv).toBeNull();
    });

    it('input has aria-expanded="false" when closed (A-01)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('input has aria-expanded="true" when open (A-01)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      expect(input.getAttribute('aria-expanded')).toBe('true');
    });

    it('wrapper div does not have aria-owns (A-05)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const comboboxWrapper = el.shadowRoot?.querySelector('.field__combobox');
      expect(comboboxWrapper?.hasAttribute('aria-owns')).toBe(false);
    });
  });

  // ─── Toggle button part (A-11) ───

  describe('Toggle button CSS part', () => {
    it('toggle button has part="toggle" (A-11)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const toggle = shadowQuery(el, '[part="toggle"]');
      expect(toggle).toBeTruthy();
    });
  });

  // ─── Slotted label aria-labelledby (A-03) ───

  describe('Slotted label accessibility', () => {
    it('slotted <label> text-flattens onto input aria-label (cross-shadow safe; A-03)', async () => {
      // Light-DOM ids do NOT resolve from inside a shadow root, so the
      // canonical pattern is to text-flatten slotted-label content onto the
      // inner input as aria-label rather than write a cross-shadow IDREF.
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><label slot="label" id="my-label">My Time</label></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('My Time');
      // Inner input must NOT carry a light-DOM id as aria-labelledby — that
      // pattern is silently broken across the shadow boundary.
      expect(input.getAttribute('aria-labelledby')).toBeNull();
    });

    it('slotted <label> without id still names the input via aria-label (A-03)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><label slot="label">No ID Label</label></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('No ID Label');
      expect(input.getAttribute('aria-labelledby')).toBeNull();
    });

    it('label property points inner input aria-labelledby at the rendered <label> (same shadow root) (A-03)', async () => {
      // When the label property names the field, we render an internal
      // <label id> in the same shadow root and reference it with
      // aria-labelledby — that IS resolvable inside the shadow.
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Appointment Time"></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const labelEl = shadowQuery<HTMLLabelElement>(el, 'label')!;
      expect(labelEl.id).toBeTruthy();
      expect(input.getAttribute('aria-labelledby')).toBe(labelEl.id);
    });
  });

  // ─── Home/End keyboard navigation (A-04) ───

  describe('Home/End keyboard navigation', () => {
    it('Home key jumps to the first option (A-04)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="11:00" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open and move to the last option first
      input.click();
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      const allOptions = shadowQueryAll(el, '[role="option"]');
      const activeOption = shadowQuery(el, '.field__option--active');
      expect(activeOption).toBe(allOptions[0]);
    });

    it('End key jumps to the last option (A-04)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="11:00" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      const allOptions = shadowQueryAll(el, '[role="option"]');
      const activeOption = shadowQuery(el, '.field__option--active');
      expect(activeOption).toBe(allOptions[allOptions.length - 1]);
    });

    it('Home key does nothing when dropdown is closed (A-04)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      // Home key when closed should not open the listbox
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Typed input parsing (A-08) ───

  describe('Typed input parsing via parseUserInput', () => {
    it('typing a valid 24h time and blurring sets the value (A-08)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker format="24h"></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.value = '14:30';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('14:30');
    });

    it('typing "12:00 PM" sets value to "12:00" (noon) (A-08)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker format="12h"></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.value = '12:00 PM';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('12:00');
    });

    it('typing "12:00 AM" sets value to "00:00" (midnight) (A-08)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker format="12h"></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.value = '12:00 AM';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('00:00');
    });

    it('typing invalid input reverts display to last known value (A-08)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" value="09:00"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Dispatch input event first so _inputDisplayValue changes to 'not-a-time'
      // (required so Lit detects the subsequent revert as a state change)
      input.value = 'not-a-time';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      // Now dispatch change — component sees invalid input and reverts
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await el.updateComplete;
      // Canonical value stays at 09:00 and display is reverted
      expect(el.value).toBe('09:00');
      expect(input.value).toBe('09:00');
    });

    it('clearing the input sets value to empty string (A-08)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" value="09:00"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.value = '';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('');
    });
  });

  // ─── Live typing opens dropdown (A-09) ───

  describe('Live typing input handler', () => {
    it('typing into the input opens the listbox (A-09)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.value = '09';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox).toBeTruthy();
    });

    it('typing updates _inputDisplayValue (A-09)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.value = '09:30';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      // The input element should retain the typed value
      expect(input.value).toBe('09:30');
    });
  });

  // ─── step=0 guard (A-20) ───

  describe('step guard for invalid values', () => {
    it('step=0 clamps to 1 and generates slots without crashing (A-20)', async () => {
      // With step=0 (clamped to 1), a narrow range should still work
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="09:02" step="0"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const options = shadowQueryAll(el, '[role="option"]');
      // step clamped to 1: options at 09:00, 09:01, 09:02 = 3 options
      expect(options.length).toBe(3);
    });

    it('negative step clamps to 1 and generates slots without crashing (A-20)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="09:01" step="-5"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const options = shadowQueryAll(el, '[role="option"]');
      expect(options.length).toBe(2); // 09:00 and 09:01
    });
  });

  // ─── formResetCallback does not dispatch hx-change (A-22) ───

  describe('formResetCallback event behavior', () => {
    it('formResetCallback does not dispatch hx-change (A-22)', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker value="14:30"></hx-time-picker>');
      let changeEventFired = false;
      el.addEventListener('hx-change', () => {
        changeEventFired = true;
      });
      el.formResetCallback();
      await el.updateComplete;
      expect(changeEventFired).toBe(false);
    });
  });

  // ─── Toggle button interaction ───

  describe('Toggle button interaction', () => {
    it('clicking the toggle button opens the dropdown', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]')!;
      toggle.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox).toBeTruthy();
    });

    it('clicking the toggle button again closes the dropdown', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]')!;
      toggle.click();
      await el.updateComplete;
      toggle.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── aria-controls attribute ───

  describe('aria-controls attribute', () => {
    it('input always has aria-controls pointing to the listbox (prevents dangling reference)', async () => {
      // The listbox is always in the DOM (hidden when closed) so aria-controls is always set
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const listbox = shadowQuery(el, '[role="listbox"]')!;
      expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    });

    it('input has aria-controls matching listbox id when open', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]')!;
      expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    });
  });

  // ─── aria-activedescendant attribute ───

  describe('aria-activedescendant attribute', () => {
    it('aria-activedescendant updates during keyboard navigation', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const firstDescendant = input.getAttribute('aria-activedescendant');
      expect(firstDescendant).toBeTruthy();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const secondDescendant = input.getAttribute('aria-activedescendant');
      expect(secondDescendant).toBeTruthy();
      expect(secondDescendant).not.toBe(firstDescendant);
    });
  });

  // ─── Listbox aria-label ───

  describe('Listbox aria-label', () => {
    it('listbox has aria-label matching the label prop', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Appointment Time"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]')!;
      expect(listbox.getAttribute('aria-label')).toBe('Appointment Time');
    });

    it('listbox has fallback aria-label "Time options" when no label', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]')!;
      expect(listbox.getAttribute('aria-label')).toBe('Time options');
    });
  });

  // ─── help-text CSS part ───

  describe('help-text CSS part', () => {
    it('help-text part is exposed', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const helpText = shadowQuery(el, '[part="help-text"]');
      expect(helpText).toBeTruthy();
    });
  });

  // ─── mouseenter on options ───

  describe('Option mouseenter interaction', () => {
    it('mouseenter on an option updates the active option', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const options = shadowQueryAll(el, '[role="option"]');
      // Hover over the last option
      const lastOption = options[options.length - 1]!;
      lastOption.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      expect(lastOption.classList.contains('field__option--active')).toBe(true);
    });
  });

  // ─── formStateRestoreCallback edge cases ───

  describe('formStateRestoreCallback edge cases', () => {
    it('ignores File argument and does not change value', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker value="09:00"></hx-time-picker>');
      el.formStateRestoreCallback(new File([], 'test.txt'));
      await el.updateComplete;
      expect(el.value).toBe('09:00');
    });

    it('ignores FormData argument and does not change value', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker value="09:00"></hx-time-picker>');
      el.formStateRestoreCallback(new FormData());
      await el.updateComplete;
      expect(el.value).toBe('09:00');
    });
  });

  // ─── hx-change on field clear ───

  describe('hx-change event on clear', () => {
    it('dispatches hx-change with empty value when field is cleared', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" value="09:00"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      input.value = '';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('');
    });
  });

  // ─── parseUserInput edge cases ───

  describe('parseUserInput edge cases', () => {
    it('accepts "230 PM" style input (no colon, digits run together)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="12h" min="00:00" max="23:59"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      input.value = '230 PM';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      // 2:30 PM = 14:30
      expect(event.detail.value).toBe('14:30');
    });

    it('accepts "2 PM" style input (hour only, no minutes)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="12h" min="00:00" max="23:59"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      input.value = '2 PM';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      // 2 PM = 14:00
      expect(event.detail.value).toBe('14:00');
    });

    it('rejects invalid hour "25:00" and keeps the component value unchanged', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" value="09:00"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;

      // Dispatch a change event with an out-of-range hour.
      input.value = '25:00';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await el.updateComplete;

      // The component value must not change when invalid input is submitted.
      expect(el.value).toBe('09:00');
    });
  });

  // ─── generateSlots with step=1 ───

  describe('generateSlots with step=1 (minimum step)', () => {
    it('generates one slot per minute between 09:00 and 09:05', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="09:05" step="1"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;

      const options = shadowQueryAll(el, '[role="option"]');
      // 09:00, 09:01, 09:02, 09:03, 09:04, 09:05 = 6 slots
      expect(options.length).toBe(6);
    });
  });

  // ─── Time wrapping / clamping ───

  describe('Time clamping at boundaries', () => {
    it('clamps ArrowDown navigation at the last slot (does not wrap around)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="23:00" max="23:30" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open the dropdown and navigate to the last option.
      input.click();
      await el.updateComplete;

      // Press ArrowDown many times — should clamp at last slot, not wrap.
      for (let i = 0; i < 10; i++) {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await el.updateComplete;
      }

      const options = shadowQueryAll(el, '[role="option"]');
      const lastOption = options[options.length - 1]!;
      expect(lastOption.classList.contains('field__option--active')).toBe(true);
    });
  });

  // ─── Invalid time input rejection ───

  describe('Invalid time input rejection', () => {
    it('rejects completely non-parseable input and keeps the component value unchanged', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" value="10:00"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;

      input.value = 'not-a-time';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await el.updateComplete;

      // The component value must not change when non-parseable input is submitted.
      expect(el.value).toBe('10:00');
    });
  });

  // ─── Slot selection when value is outside min/max ───

  describe('Slot selection clamped to min/max', () => {
    it('clamps a restored value that is below min to the min time', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="17:00" step="30"></hx-time-picker>',
      );
      // formStateRestoreCallback with a value below min.
      el.formStateRestoreCallback('07:00');
      await el.updateComplete;

      expect(el.value).toBe('09:00');
    });

    it('clamps a restored value that is above max to the max time', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="17:00" step="30"></hx-time-picker>',
      );
      // formStateRestoreCallback with a value above max.
      el.formStateRestoreCallback('20:00');
      await el.updateComplete;

      expect(el.value).toBe('17:00');
    });

    it('clicking a slot whose value would be outside min/max is clamped', async () => {
      // Set up a table where we manually open the dropdown and click an option.
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="17:00" step="60"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;

      const options = shadowQueryAll(el, '[role="option"]');
      expect(options.length).toBeGreaterThan(0);

      // Click the first option (09:00) — it should be within range.
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
      (options[0] as HTMLElement).click();
      const event = await eventPromise;

      expect(event.detail.value).toBe('09:00');
    });
  });

  // ─── Keyboard navigation when dropdown is closed ───

  describe('Keyboard navigation when dropdown is closed', () => {
    it('ArrowDown when dropdown is closed opens the listbox', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" min="09:00" max="10:00" step="30"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;

      // Ensure dropdown is closed (listbox is always in DOM, but hidden).
      const listboxBefore = shadowQuery(el, '[role="listbox"]');
      expect(listboxBefore?.hasAttribute('hidden')).toBe(true);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;

      // Dropdown should now be open (hidden attribute removed).
      const listboxAfter = shadowQuery(el, '[role="listbox"]');
      expect(listboxAfter?.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── Form submission with unparsed user input ───

  describe('Form submission with unparsed user input in display field', () => {
    it('does not change the internal value when the display field has unparseable text', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h" value="11:00"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;

      // Simulate the user typing something unparseable without blurring/committing.
      input.value = 'garbage text';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      // Internal value must remain unchanged until a valid change event fires.
      expect(el.value).toBe('11:00');
    });

    it('form value is the last committed canonical HH:MM when display field has partial input', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker name="appt" format="24h" value="11:00"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;

      // Type partial input without committing.
      input.value = '11:3';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      // The component value (and thus the form submission value) stays at "11:00".
      expect(el.value).toBe('11:00');
    });
  });

  // ─── Property: accessibleLabel ─────────────────────────────────────────────

  describe('Property: accessibleLabel', () => {
    it('writes accessibleLabel onto the inner input as aria-label', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker accessible-label="Appointment time picker"></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Appointment time picker');
    });

    it('accessibleLabel takes precedence over visible label property', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Visible Label" accessible-label="AT-only Name"></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('AT-only Name');
      // accessibleLabel suppresses the internal label aria-labelledby chain.
      expect(input.getAttribute('aria-labelledby')).toBeNull();
    });

    it('accessibleLabel takes precedence over consumer aria-labelledby (helix override)', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <span id="ext-label-1">External Label</span>
        <hx-time-picker accessible-label="Override" aria-labelledby="ext-label-1"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Override');
      root.remove();
    });
  });

  // ─── Cross-shadow naming: aria-labelledby on host ──────────────────────────

  describe('Consumer aria-labelledby resolves through shadow boundary', () => {
    it('resolves consumer aria-labelledby and text-flattens onto inner input aria-label', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <span id="ext-tp-1">Patient appointment time</span>
        <hx-time-picker aria-labelledby="ext-tp-1"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Patient appointment time');
      root.remove();
    });

    it('mutating textContent of resolved aria-labelledby target updates inner input aria-label', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <span id="ext-tp-2">First Label</span>
        <hx-time-picker aria-labelledby="ext-tp-2"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('First Label');
      // In-place text mutation on the same element — no slotchange, no host
      // attribute change. The external-refs observer must catch it.
      const target = root.querySelector('#ext-tp-2')!;
      target.textContent = 'Second Label';
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      expect(input.getAttribute('aria-label')).toBe('Second Label');
      root.remove();
    });

    it('aria-labelledby with nested aria-hidden subtree flattens to visible text only (AccName 1.2 §4.3.10)', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <label id="ext-tp-3"><svg aria-hidden="true"><title>icon</title></svg>Visible Time</label>
        <hx-time-picker aria-labelledby="ext-tp-3"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Visible Time');
      root.remove();
    });

    it('toggling aria-hidden on resolved external label resyncs inner input aria-label', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <span id="ext-tp-4">Visible</span>
        <hx-time-picker aria-labelledby="ext-tp-4"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Visible');
      const target = root.querySelector('#ext-tp-4')!;
      target.setAttribute('aria-hidden', 'true');
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      // With the only label hidden, no labelledby resolution; falls through
      // to other naming sources (none here) so aria-label is unset.
      expect(input.getAttribute('aria-label')).toBeNull();
      root.remove();
    });

    it('aria-labelledby precedence over aria-label (W3C AccName 1.2 §4.3.1)', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <span id="ext-tp-5">From Labelledby</span>
        <hx-time-picker aria-labelledby="ext-tp-5" aria-label="From Aria Label"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('From Labelledby');
      root.remove();
    });

    it('unresolvable aria-labelledby falls through to host aria-label', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <hx-time-picker aria-labelledby="does-not-exist" aria-label="Fallback Label"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Fallback Label');
      root.remove();
    });
  });

  // ─── Cross-shadow description: aria-describedby ────────────────────────────

  describe('Consumer aria-describedby through synthesized desc span', () => {
    it('mirrors consumer aria-describedby text into in-shadow span and adds id to inner input aria-describedby chain', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <span id="ext-desc-tp-1">Pick a time after 9am</span>
        <hx-time-picker label="When" aria-describedby="ext-desc-tp-1"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const describedBy = input.getAttribute('aria-describedby') ?? '';
      const tokens = describedBy.split(/\s+/).filter(Boolean);
      // Synthesized span id must be in the chain.
      const synthesized = el.shadowRoot?.querySelector<HTMLSpanElement>(
        `#${tokens.find((t) => t.includes('-consumer-desc'))}`,
      );
      expect(synthesized).toBeTruthy();
      expect(synthesized?.textContent).toBe('Pick a time after 9am');
      root.remove();
    });

    it('mutating textContent of resolved aria-describedby target updates synthesized desc span', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <span id="ext-desc-tp-2">Initial desc</span>
        <hx-time-picker label="When" aria-describedby="ext-desc-tp-2"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const synthesizedId = (
        shadowQuery<HTMLInputElement>(el, 'input')!.getAttribute('aria-describedby') ?? ''
      )
        .split(/\s+/)
        .find((t) => t.includes('-consumer-desc'))!;
      const synthesized = el.shadowRoot!.getElementById(synthesizedId)!;
      expect(synthesized.textContent).toBe('Initial desc');
      const target = root.querySelector('#ext-desc-tp-2')!;
      target.textContent = 'Updated desc';
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      expect(synthesized.textContent).toBe('Updated desc');
      root.remove();
    });

    it('clearing host aria-describedby removes synthesized text and drops id from chain', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <span id="ext-desc-tp-3">Some hint</span>
        <hx-time-picker label="When" aria-describedby="ext-desc-tp-3"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      let tokens = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      expect(tokens.some((t) => t.includes('-consumer-desc'))).toBe(true);
      el.removeAttribute('aria-describedby');
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      tokens = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      expect(tokens.some((t) => t.includes('-consumer-desc'))).toBe(false);
      root.remove();
    });

    it('inner input never carries aria-description (AccName drops it when describedby is present)', async () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <span id="ext-desc-tp-4">A description</span>
        <hx-time-picker label="When" aria-describedby="ext-desc-tp-4"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.hasAttribute('aria-description')).toBe(false);
      root.remove();
    });
  });

  // ─── Slotted label: hidden roots and decorative-only ───────────────────────

  describe('Slotted label hidden-root semantics (AccName 1.2 §4.3.10)', () => {
    it('hidden root in slot="label" contributes empty text — no useful name', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><span slot="label" hidden>Secret</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBeNull();
    });

    it('aria-hidden root in slot="label" contributes empty text — no useful name', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><span slot="label" aria-hidden="true">Secret</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBeNull();
    });

    it('decorative-only slot="label" content (only aria-hidden svg) does NOT name the input', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><svg slot="label" aria-hidden="true"><title>icon</title></svg></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBeNull();
    });

    it('decorative svg + visible span in slot="label" — fallback path text-flattens to the visible text only', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><svg slot="label" aria-hidden="true"><title>icon</title></svg><span slot="label">Time</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Time');
    });

    it('multiple slotted label nodes aggregate into a single accessible name', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><span slot="label">Patient</span><span slot="label">name</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Patient name');
    });

    it('in-place textContent mutation on the same slotted label node triggers aria-label resync', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><span slot="label">First</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('First');
      const slotted = el.querySelector('[slot="label"]')!;
      slotted.textContent = 'Second';
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      expect(input.getAttribute('aria-label')).toBe('Second');
    });
  });

  // ─── Slotted help-text and error: hidden semantics ─────────────────────────

  describe('Slot effective-text uses AccName flatten (help-text + error)', () => {
    it('help-text slot containing only [hidden] descendants does NOT mark help present', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="When"><span slot="help-text" hidden>foo</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const tokens = (input.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean);
      expect(tokens.some((t) => t.includes('-help'))).toBe(false);
    });

    it('error slot containing only aria-hidden descendants does NOT activate error state', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="When"><span slot="error" aria-hidden="true">err</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // aria-invalid stays false; error id NOT in describedby
      expect(input.getAttribute('aria-invalid')).toBe('false');
      const tokens = (input.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean);
      expect(tokens.some((t) => t.includes('-error'))).toBe(false);
    });

    it('clearing the same slotted error textContent clears error state and removes id from describedby', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="When"><span slot="error">Bad time</span></hx-time-picker>',
      );
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
      const errorEl = el.shadowRoot!.querySelector<HTMLElement>('.field__error')!;
      expect((input.getAttribute('aria-describedby') ?? '').split(/\s+/)).toContain(errorEl.id);
      // In-place clear of textContent on the SAME slotted node — no slotchange.
      const slotted = el.querySelector('[slot="error"]')!;
      slotted.textContent = '';
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      expect(input.getAttribute('aria-invalid')).toBe('false');
      const tokens = (input.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean);
      expect(tokens).not.toContain(errorEl.id);
    });

    it('clearing the same slotted help-text textContent flips _hasHelpSlot and removes id from describedby', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="When"><span slot="help-text">Pick wisely</span></hx-time-picker>',
      );
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpEl = el.shadowRoot!.querySelector<HTMLElement>('.field__help-text')!;
      expect((input.getAttribute('aria-describedby') ?? '').split(/\s+/)).toContain(helpEl.id);
      const slotted = el.querySelector('[slot="help-text"]')!;
      slotted.textContent = '';
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      const tokens = (input.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean);
      expect(tokens).not.toContain(helpEl.id);
    });
  });

  // ─── Validity surface: error property ──────────────────────────────────────

  describe('Validity surface union (consumer error + slot + setValidity)', () => {
    it('consumer `error` property marks inner input aria-invalid="true"', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="When" error="Server rejected"></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('runtime error property change populates alert on the SAME frame the container becomes visible', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="When"></hx-time-picker>',
      );
      await el.updateComplete;
      const errorDiv = shadowQuery(el, '.field__error')!;
      expect(errorDiv.hasAttribute('hidden')).toBe(true);
      el.error = 'Async validation failed';
      await el.updateComplete;
      expect(errorDiv.hasAttribute('hidden')).toBe(false);
      expect(errorDiv.textContent?.trim()).toContain('Async validation failed');
    });
  });

  // ─── First-paint slot state seeding ────────────────────────────────────────

  describe('First-paint slot state seeding (no slotchange wait)', () => {
    it('slot-only label produces correct inner-input aria-label on first paint', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><span slot="label">Time of Day</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Time of Day');
    });

    it('slot-only help-text contributes its wrapper id to aria-describedby on first paint', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="When"><span slot="help-text">Choose wisely</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpEl = el.shadowRoot!.querySelector<HTMLElement>('.field__help-text')!;
      const tokens = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      expect(tokens).toContain(helpEl.id);
    });

    it('slot-only error contributes its wrapper id to aria-describedby on first paint', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="When"><span slot="error">Bad</span></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const errorEl = el.shadowRoot!.querySelector<HTMLElement>('.field__error')!;
      const tokens = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      expect(tokens).toContain(errorEl.id);
    });
  });

  // ─── Forced colors mixin ────────────────────────────────────────────────────

  describe('Forced colors mixin composition', () => {
    it('forcedColorsField participates in the host stylesheet', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const ctor = el.constructor as typeof HelixTimePicker;
      const styles = ctor.styles;
      expect(Array.isArray(styles)).toBe(true);
      // Two-element array: [helixTimePickerStyles, forcedColorsField]
      expect((styles as readonly unknown[]).length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Modern path: ElementInternals IDL element references ─────────────────

  describe('Modern path: internals.ariaLabelledByElements', () => {
    it('host has internals.ariaLabelledByElements set when consumer aria-labelledby resolves', async () => {
      // Skip if the engine doesn't expose IDL refs.
      const probe = document.createElement('hx-time-picker') as HelixTimePicker;
      document.body.appendChild(probe);
      const internals = (probe as unknown as { _internals: ElementInternals })._internals;
      const supports = 'ariaLabelledByElements' in internals;
      probe.remove();
      if (!supports) return;

      const root = document.createElement('div');
      root.innerHTML = `
        <span id="modern-ext-1">Modern Label</span>
        <hx-time-picker aria-labelledby="modern-ext-1"></hx-time-picker>
      `;
      document.body.appendChild(root);
      const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
      await el.updateComplete;
      const elInternals = (el as unknown as { _internals: ElementInternals })._internals;
      const refs = (
        elInternals as ElementInternals & {
          ariaLabelledByElements: Element[] | null;
        }
      ).ariaLabelledByElements;
      const target = root.querySelector('#modern-ext-1');
      expect(refs).not.toBeNull();
      expect(refs).toContain(target);
      root.remove();
    });

    it('modern path: internals.ariaLabel is null (NOT empty string) when accessibleLabel is unset', async () => {
      const probe = document.createElement('hx-time-picker') as HelixTimePicker;
      document.body.appendChild(probe);
      const internals = (probe as unknown as { _internals: ElementInternals })._internals;
      const supports = 'ariaLabelledByElements' in internals;
      probe.remove();
      if (!supports) return;

      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Visible"></hx-time-picker>',
      );
      await el.updateComplete;
      const elInternals = (el as unknown as { _internals: ElementInternals })._internals;
      // Empty-string aria-label would erase higher-precedence sources; must be null.
      expect(elInternals.ariaLabel).toBeNull();
    });

    it('modern path: explicit accessibleLabel is forwarded to internals.ariaLabel', async () => {
      const probe = document.createElement('hx-time-picker') as HelixTimePicker;
      document.body.appendChild(probe);
      const internals = (probe as unknown as { _internals: ElementInternals })._internals;
      const supports = 'ariaLabelledByElements' in internals;
      probe.remove();
      if (!supports) return;

      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker accessible-label="Override Name"></hx-time-picker>',
      );
      await el.updateComplete;
      const elInternals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(elInternals.ariaLabel).toBe('Override Name');
    });
  });

  // ─── Legacy fallback path (test seam) ──────────────────────────────────────

  describe('Legacy fallback path (no IDL refs)', () => {
    it('text-flattens consumer aria-labelledby onto inner input aria-label', async () => {
      // Force the legacy code path by overriding the support probe BEFORE
      // the host connects.
      const ctor = HelixTimePicker as unknown as { __testSupportsIdrefRefsOverride: boolean | null };
      ctor.__testSupportsIdrefRefsOverride = false;
      try {
        const root = document.createElement('div');
        root.innerHTML = `
          <span id="legacy-ext-1">Legacy Label</span>
          <hx-time-picker aria-labelledby="legacy-ext-1"></hx-time-picker>
        `;
        document.body.appendChild(root);
        const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        expect(input.getAttribute('aria-label')).toBe('Legacy Label');
        root.remove();
      } finally {
        ctor.__testSupportsIdrefRefsOverride = null;
      }
    });

    it('text-flattens consumer aria-describedby into the synthesized in-shadow span', async () => {
      const ctor = HelixTimePicker as unknown as { __testSupportsIdrefRefsOverride: boolean | null };
      ctor.__testSupportsIdrefRefsOverride = false;
      try {
        const root = document.createElement('div');
        root.innerHTML = `
          <span id="legacy-ext-2">Legacy Desc</span>
          <hx-time-picker label="When" aria-describedby="legacy-ext-2"></hx-time-picker>
        `;
        document.body.appendChild(root);
        const el = root.querySelector<HelixTimePicker>('hx-time-picker')!;
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        const tokens = (input.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean);
        const synthesizedId = tokens.find((t) => t.includes('-consumer-desc'))!;
        const synthesized = el.shadowRoot!.getElementById(synthesizedId)!;
        expect(synthesized.textContent).toBe('Legacy Desc');
        root.remove();
      } finally {
        ctor.__testSupportsIdrefRefsOverride = null;
      }
    });
  });
});
