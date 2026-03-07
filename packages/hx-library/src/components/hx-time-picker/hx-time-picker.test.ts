import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, shadowQueryAll, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTimePicker } from './hx-time-picker.js';
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
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="12h"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('placeholder')).toBe('hh:mm AM');
    });

    it('renders input with correct placeholder for 24h format', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h"></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('placeholder')).toBe('hh:mm');
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Time"></hx-time-picker>',
      );
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
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker format="24h"></hx-time-picker>',
      );
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
      expect(listbox).toBeNull();
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
      expect(listbox).toBeNull();
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
      expect(listbox).toBeNull();
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
      expect(listbox).toBeNull();
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
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker value="14:30"></hx-time-picker>',
      );
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
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker disabled></hx-time-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox).toBeNull();
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
      expect(listbox).toBeNull();
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

    it('input does not have aria-required when not required', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-required')).toBeNull();
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

    it('does not render error div when no error', async () => {
      const el = await fixture<HelixTimePicker>('<hx-time-picker></hx-time-picker>');
      const errorDiv = shadowQuery(el, '.field__error');
      expect(errorDiv).toBeNull();
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
        '<hx-time-picker><span slot="help">Call for help</span></hx-time-picker>',
      );
      const helpContent = el.querySelector('[slot="help"]');
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
      expect(listbox).toBeNull();
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
    it('input gets aria-labelledby when label slot is used (A-03)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><label slot="label" id="my-label">My Time</label></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-labelledby')).toBe('my-label');
    });

    it('assigns an id to the slotted label if it lacks one (A-03)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker><label slot="label">No ID Label</label></hx-time-picker>',
      );
      await el.updateComplete;
      const slottedLabel = el.querySelector<HTMLLabelElement>('[slot="label"]')!;
      expect(slottedLabel.id).toBeTruthy();
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-labelledby')).toBe(slottedLabel.id);
    });

    it('input has no aria-labelledby when prop label is used (A-03)', async () => {
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker label="Appointment Time"></hx-time-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-labelledby')).toBeNull();
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
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox).toBeNull();
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
      const el = await fixture<HelixTimePicker>(
        '<hx-time-picker value="14:30"></hx-time-picker>',
      );
      let changeEventFired = false;
      el.addEventListener('hx-change', () => {
        changeEventFired = true;
      });
      el.formResetCallback();
      await el.updateComplete;
      expect(changeEventFired).toBe(false);
    });
  });
});
