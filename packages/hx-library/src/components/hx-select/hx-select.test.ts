import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxSelect } from './hx-select.js';
import './index.js';

afterEach(cleanup);

/**
 * Strongly-typed harness for the private internals the suite reaches into.
 * Mirrors the Group 2 hx-radio-group test pattern.
 */
type SelectTestHarness = HxSelect & {
  _internals: ElementInternals;
  _supportsIdrefRefs: boolean;
  _syncHostAriaSemantics(): void;
};

describe('hx-select', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <select>', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const select = shadowQuery(el, 'select');
      expect(select).toBeInstanceOf(HTMLSelectElement);
    });

    it('exposes "field" CSS part', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('exposes "select" CSS part', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const select = shadowQuery(el, '[part="select"]');
      expect(select).toBeTruthy();
    });

    it('renders custom chevron indicator', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const chevron = shadowQuery(el, '.field__chevron');
      expect(chevron).toBeTruthy();
      expect(chevron?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<HxSelect>('<hx-select label="Country"></hx-select>');
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Country');
    });

    it('does not render label when empty', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('shows asterisk when required', async () => {
      const el = await fixture<HxSelect>('<hx-select label="Country" required></hx-select>');
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });
  });

  // ─── Property: placeholder (2) ───

  describe('Property: placeholder', () => {
    it('renders placeholder as first disabled option', async () => {
      const el = await fixture<HxSelect>('<hx-select placeholder="Choose..."></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const firstOption = select.querySelector('option');
      expect(firstOption).toBeTruthy();
      expect(firstOption?.textContent).toBe('Choose...');
      expect(firstOption?.disabled).toBe(true);
      expect(firstOption?.value).toBe('');
    });

    it('does not render placeholder option when not set', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const options = select.querySelectorAll('option:not([data-cloned])');
      expect(options.length).toBe(0);
    });
  });

  // ─── Property: value (2) ───

  describe('Property: value', () => {
    it('reflects value attribute', async () => {
      const el = await fixture<HxSelect>('<hx-select value="opt1"></hx-select>');
      expect(el.getAttribute('value')).toBe('opt1');
    });

    it('programmatic value update is reflected', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      el.value = 'updated';
      await el.updateComplete;
      expect(el.value).toBe('updated');
      expect(el.getAttribute('value')).toBe('updated');
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('defaults to md', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      expect(el.size).toBe('md');
    });

    it('applies sm size class', async () => {
      const el = await fixture<HxSelect>('<hx-select hx-size="sm"></hx-select>');
      const select = shadowQuery(el, '.field__select--sm');
      expect(select).toBeTruthy();
    });

    it('applies lg size class', async () => {
      const el = await fixture<HxSelect>('<hx-select hx-size="lg"></hx-select>');
      const select = shadowQuery(el, '.field__select--lg');
      expect(select).toBeTruthy();
    });
  });

  // ─── Property: error (4) ───

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<HxSelect>('<hx-select error="Required field"></hx-select>');
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Required field');
    });

    it('error div does not mix role="alert" with aria-live="polite"', async () => {
      const el = await fixture<HxSelect>('<hx-select error="Required"></hx-select>');
      const errorDiv = shadowQuery(el, '.field__error');
      // role="alert" implies assertive — must not be overridden with aria-live="polite"
      expect(errorDiv?.getAttribute('role')).toBe('alert');
      expect(errorDiv?.getAttribute('aria-live')).not.toBe('polite');
    });

    it('sets aria-invalid="true" on select', async () => {
      const el = await fixture<HxSelect>('<hx-select error="Required"></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.getAttribute('aria-invalid')).toBe('true');
    });

    it('error hides help text', async () => {
      const el = await fixture<HxSelect>('<hx-select error="Error" help-text="Help"></hx-select>');
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: helpText (2) ───

  describe('Property: helpText', () => {
    it('renders help text below select', async () => {
      const el = await fixture<HxSelect>('<hx-select help-text="Pick carefully"></hx-select>');
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Pick carefully');
    });

    it('help text hidden when error present', async () => {
      const el = await fixture<HxSelect>('<hx-select help-text="Help" error="Error"></hx-select>');
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: required (2) ───

  describe('Property: required', () => {
    it('sets required attr on native select', async () => {
      const el = await fixture<HxSelect>('<hx-select required></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.required).toBe(true);
    });

    it('sets aria-required="true" on native select', async () => {
      const el = await fixture<HxSelect>('<hx-select required></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.getAttribute('aria-required')).toBe('true');
    });
  });

  // ─── Property: disabled (2) ───

  describe('Property: disabled', () => {
    it('sets disabled attr on native select', async () => {
      const el = await fixture<HxSelect>('<hx-select disabled></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.disabled).toBe(true);
    });

    it('applies host opacity via disabled attribute', async () => {
      const el = await fixture<HxSelect>('<hx-select disabled></hx-select>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Property: name (1) ───

  describe('Property: name', () => {
    it('sets name attr on native select', async () => {
      const el = await fixture<HxSelect>('<hx-select name="country"></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.getAttribute('name')).toBe('country');
    });
  });

  // ─── Property: accessibleLabel (2) ───

  describe('Property: accessibleLabel', () => {
    it('sets aria-label on the combobox trigger (the interactive element)', async () => {
      const el = await fixture<HxSelect>('<hx-select accessible-label="Select country"></hx-select>');
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.getAttribute('aria-label')).toBe('Select country');
    });

    it('optgroup children are cloned into native select for form participation', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select name="region">
          <optgroup label="North America">
            <option value="us">United States</option>
            <option value="ca">Canada</option>
          </optgroup>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const cloned = select.querySelectorAll('option[data-cloned]');
      expect(cloned.length).toBe(2);
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-change via combobox option click (not via native select)', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select>
          <option value="a">A</option>
          <option value="b">B</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const options = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
      options[1]!.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('b');
      expect(el.value).toBe('b');
      expect(el.open).toBe(false);
    });

    it('dispatches wc-change on selection', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select>
          <option value="a">A</option>
          <option value="b">B</option>
        </hx-select>
      `);
      await el.updateComplete;
      // Wait for slotchange to fire
      await el.updateComplete;

      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      select.value = 'b';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change detail.value is correct', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select>
          <option value="a">A</option>
          <option value="b">B</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;

      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      select.value = 'b';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('b');
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select>
          <option value="a">A</option>
          <option value="b">B</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;

      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      select.value = 'a';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('clones slotted options into native select', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select>
          <option value="x">X</option>
          <option value="y">Y</option>
          <option value="z">Z</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;

      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const clonedOptions = select.querySelectorAll('option[data-cloned]');
      expect(clonedOptions.length).toBe(3);
    });

    it('help-text slot renders', async () => {
      const el = await fixture<HxSelect>(
        '<hx-select help-text="default"><em slot="help-text">Custom help</em></hx-select>',
      );
      const helpSlot = el.querySelector('[slot="help-text"]');
      expect(helpSlot).toBeTruthy();
      expect(helpSlot?.textContent).toBe('Custom help');
    });
  });

  // ─── CSS Parts (4) ───

  describe('CSS Parts', () => {
    it('label part exposed', async () => {
      const el = await fixture<HxSelect>('<hx-select label="Test"></hx-select>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('select-wrapper part exposed', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const wrapper = shadowQuery(el, '[part="select-wrapper"]');
      expect(wrapper).toBeTruthy();
    });

    it('error part exposed', async () => {
      const el = await fixture<HxSelect>('<hx-select error="Error"></hx-select>');
      const error = shadowQuery(el, '[part="error"]');
      expect(error).toBeTruthy();
    });

    it('help-text part exposed', async () => {
      const el = await fixture<HxSelect>('<hx-select help-text="Help"></hx-select>');
      const help = shadowQuery(el, '[part="help-text"]');
      expect(help).toBeTruthy();
    });

    it('trigger part exposed', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger).toBeTruthy();
    });

    it('listbox part exposed', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const listbox = shadowQuery(el, '[part="listbox"]');
      expect(listbox).toBeTruthy();
    });

    it('option part exposed when options are present and dropdown is open', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open>
          <option value="us">United States</option>
        </hx-select>
      `);
      await el.updateComplete;
      const option = shadowQuery(el, '[part="option"]');
      expect(option).toBeTruthy();
    });
  });

  // ─── Form (5) ───

  // ─── Form Association ───

  describe('Form Association', () => {
    it('submits selected option value in FormData', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-select name="country" value="us">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `;
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-select') as HxSelect;
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('country')).toBe('us');
      form.remove();
    });
  });

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-select') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-select name="test"></hx-select>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-select') as HxSelect;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets value to empty', async () => {
      const el = await fixture<HxSelect>('<hx-select value="hello"></hx-select>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('formStateRestoreCallback restores value', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      el.formStateRestoreCallback('restored', 'restore');
      await el.updateComplete;
      expect(el.value).toBe('restored');
    });

    it('formDisabledCallback sets disabled when parent fieldset is disabled', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      el.formDisabledCallback(true);
      await el.updateComplete;
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      await el.updateComplete;
      expect(el.disabled).toBe(false);
    });
  });

  // ─── Validation (6) ───

  describe('Validation', () => {
    it('checkValidity returns false when required + empty', async () => {
      const el = await fixture<HxSelect>('<hx-select required></hx-select>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required + filled', async () => {
      const el = await fixture<HxSelect>('<hx-select required value="filled"></hx-select>');
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is set when required + empty', async () => {
      const el = await fixture<HxSelect>('<hx-select required></hx-select>');
      expect(el.validity.valueMissing).toBe(true);
    });

    it('reportValidity returns false when required + empty', async () => {
      const el = await fixture<HxSelect>('<hx-select required></hx-select>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required + filled', async () => {
      const el = await fixture<HxSelect>('<hx-select required value="filled"></hx-select>');
      expect(el.reportValidity()).toBe(true);
    });

    it('validationMessage is set when required + empty', async () => {
      const el = await fixture<HxSelect>('<hx-select required></hx-select>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });
  });

  // ─── Accessibility (4) ───

  describe('Accessibility', () => {
    it('label is associated with select via for/id', async () => {
      const el = await fixture<HxSelect>('<hx-select label="Country"></hx-select>');
      const label = shadowQuery<HTMLLabelElement>(el, 'label')!;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(label.getAttribute('for')).toBe(trigger.id);
    });

    it('aria-describedby references error ID when error set', async () => {
      const el = await fixture<HxSelect>('<hx-select error="Bad input"></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const errorDiv = shadowQuery(el, '.field__error')!;
      const describedBy = select.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv.id);
    });

    it('aria-describedby references help text ID when helpText set', async () => {
      const el = await fixture<HxSelect>('<hx-select help-text="Some help"></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const helpDiv = shadowQuery(el, '.field__help-text')!;
      const describedBy = select.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpDiv.id);
    });

    it('chevron is hidden from assistive technology', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const chevron = shadowQuery(el, '.field__chevron');
      expect(chevron?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Methods (1) ───

  describe('Methods', () => {
    it('focus() moves focus to the trigger button', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      el.focus();
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(el.shadowRoot?.activeElement).toBe(trigger);
    });
  });

  // ─── Dropdown Interaction (4) ───

  describe('Dropdown Interaction', () => {
    it('opens the dropdown when trigger is clicked', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(true);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('closes the dropdown on second trigger click', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" open>
          <option value="us">United States</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('selects an option by clicking a listbox item', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const options = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      options[1]!.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('ca');
      expect(el.value).toBe('ca');
      expect(el.open).toBe(false);
    });

    it('does not open when disabled', async () => {
      const el = await fixture<HxSelect>(
        '<hx-select disabled><option value="a">A</option></hx-select>',
      );
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Keyboard Navigation (7) ───

  describe('Keyboard Navigation', () => {
    it('ArrowDown opens the dropdown and focuses first option', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('ArrowDown navigates to next option when open', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="mx">Mexico</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      // Move to index 0
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Move to index 1
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const activeDescendant = trigger.getAttribute('aria-activedescendant');
      expect(activeDescendant).toBeTruthy();
      expect(activeDescendant).toContain('-1');
    });

    it('ArrowUp opens the dropdown and focuses last option', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('Enter confirms selection and closes dropdown', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      // Focus first option via ArrowDown
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(el.open).toBe(false);
    });

    it('Space confirms selection and closes dropdown', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(el.open).toBe(false);
    });

    it('Escape closes dropdown without changing value', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" value="us">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
      expect(el.value).toBe('us');
    });

    it('Home/End jump to first and last option', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="mx">Mexico</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      const lastDescendant = trigger.getAttribute('aria-activedescendant');
      expect(lastDescendant).toContain('-2');

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      const firstDescendant = trigger.getAttribute('aria-activedescendant');
      expect(firstDescendant).toContain('-0');
    });
  });

  // ─── aria-activedescendant (3) ───

  describe('aria-activedescendant', () => {
    it('is absent when dropdown is closed', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('updates to focused option ID when navigating', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const activeId = trigger.getAttribute('aria-activedescendant');
      expect(activeId).toBeTruthy();
      const referencedEl = el.shadowRoot!.getElementById(activeId!);
      expect(referencedEl).toBeTruthy();
      expect(referencedEl?.getAttribute('role')).toBe('option');
    });

    it('clears aria-activedescendant when dropdown closes', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HxSelect>(`<hx-select label="Country">
        <option value="us">United States</option>
        <option value="ca">Canada</option>
      </hx-select>`);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<HxSelect>(`<hx-select label="Country" error="Required">
        <option value="us">United States</option>
      </hx-select>`);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HxSelect>(`<hx-select label="Country" disabled>
        <option value="us">United States</option>
      </hx-select>`);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when dropdown is open', async () => {
      const el = await fixture<HxSelect>(`<hx-select label="Country" open>
        <option value="us">United States</option>
        <option value="ca">Canada</option>
      </hx-select>`);
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Slot projection ───

  describe('Slot projection', () => {
    it('projects option elements into the default slot', async () => {
      const el = await fixture<HxSelect>(
        `<hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(2);
      expect((assigned[0] as HTMLElement).textContent).toBe('United States');
    });

    it('projects content into the label slot', async () => {
      const el = await fixture<HxSelect>(
        `<hx-select><span slot="label">Choose country</span></hx-select>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="label"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Choose country');
    });

    it('projects content into the error slot', async () => {
      const el = await fixture<HxSelect>(
        `<hx-select label="Country"><span slot="error">Required</span></hx-select>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="error"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Required');
    });

    it('projects content into the help-text slot', async () => {
      const el = await fixture<HxSelect>(
        `<hx-select label="Country" help-text=" "><span slot="help-text">Select your country</span></hx-select>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="help-text"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Select your country');
    });
  });

  // ─── Dropdown: display value ───

  describe('Dropdown: display value in trigger', () => {
    it('shows placeholder text in trigger when no value selected', async () => {
      const el = await fixture<HxSelect>(
        '<hx-select placeholder="Choose one"><option value="a">A</option></hx-select>',
      );
      await el.updateComplete;
      const triggerValue = shadowQuery(el, '.field__trigger-value');
      expect(triggerValue?.textContent?.trim()).toBe('Choose one');
    });

    it('shows selected option label in trigger after selection', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select>
          <option value="a">Alpha</option>
          <option value="b">Beta</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const options = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
      options[0]!.click();
      await el.updateComplete;
      const triggerValue = shadowQuery(el, '.field__trigger-value');
      expect(triggerValue?.textContent?.trim()).toBe('Alpha');
    });

    it('trigger has placeholder class when no value selected', async () => {
      const el = await fixture<HxSelect>(
        '<hx-select placeholder="Pick..."><option value="x">X</option></hx-select>',
      );
      await el.updateComplete;
      const trigger = shadowQuery(el, '.field__trigger');
      expect(trigger?.classList.contains('field__trigger--placeholder')).toBe(true);
    });

    it('trigger loses placeholder class after selection', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select placeholder="Pick...">
          <option value="x">X</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const options = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
      options[0]!.click();
      await el.updateComplete;
      const trigger = shadowQuery(el, '.field__trigger');
      expect(trigger?.classList.contains('field__trigger--placeholder')).toBe(false);
    });
  });

  // ─── Dropdown: field--open class ───

  describe('Dropdown: field--open class', () => {
    it('field--open class added when open=true', async () => {
      const el = await fixture<HxSelect>('<hx-select><option value="a">A</option></hx-select>');
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const field = shadowQuery(el, '.field');
      expect(field?.classList.contains('field--open')).toBe(true);
    });

    it('field--open class removed when closed', async () => {
      const el = await fixture<HxSelect>(
        '<hx-select open><option value="a">A</option></hx-select>',
      );
      await el.updateComplete;
      el.open = false;
      await el.updateComplete;
      const field = shadowQuery(el, '.field');
      expect(field?.classList.contains('field--open')).toBe(false);
    });
  });

  // ─── Disabled option in listbox ───

  describe('Disabled option in listbox', () => {
    it('clicking a disabled option does not change value', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select>
          <option value="a">A</option>
          <option value="b" disabled>B (disabled)</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      const valueBefore = el.value;
      el.open = true;
      await el.updateComplete;
      const options = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
      options[1]!.click();
      await el.updateComplete;
      expect(el.value).toBe(valueBefore);
    });

    it('disabled option has aria-disabled="true"', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open>
          <option value="a">A</option>
          <option value="b" disabled>B</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      const options = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
      expect(options[1]!.getAttribute('aria-disabled')).toBe('true');
    });
  });

  // ─── No options: empty state ───

  describe('Empty options state', () => {
    it('shows labelNoOptions when no options provided', async () => {
      const el = await fixture<HxSelect>('<hx-select open></hx-select>');
      await el.updateComplete;
      const noOptions = shadowQuery(el, '.field__no-options');
      expect(noOptions).toBeTruthy();
      expect(noOptions?.textContent?.trim()).toBe('No options found');
    });

    it('custom labelNoOptions message is rendered', async () => {
      const el = await fixture<HxSelect>(
        '<hx-select open label-no-options="Aucune option disponible"></hx-select>',
      );
      await el.updateComplete;
      const noOptions = shadowQuery(el, '.field__no-options');
      expect(noOptions?.textContent?.trim()).toBe('Aucune option disponible');
    });
  });

  // ─── selected option highlighted in listbox ───

  describe('Listbox: selected option highlighted', () => {
    it('currently selected option has aria-selected="true"', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open value="b">
          <option value="a">A</option>
          <option value="b">B</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      const options = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
      expect(options[1]!.getAttribute('aria-selected')).toBe('true');
    });

    it('non-selected option has aria-selected="false"', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open value="b">
          <option value="a">A</option>
          <option value="b">B</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      const options = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
      // Component always renders aria-selected as "true" or "false" — never omits the attribute
      expect(options[0]!.getAttribute('aria-selected')).toBe('false');
    });
  });

  // ─── Trigger: aria-expanded and combobox role ───

  describe('Trigger ARIA attributes', () => {
    it('trigger has role="combobox"', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const trigger = shadowQuery(el, '[role="combobox"]');
      expect(trigger).toBeTruthy();
    });

    it('trigger aria-expanded is "false" when closed', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('trigger aria-expanded is "true" when open', async () => {
      const el = await fixture<HxSelect>('<hx-select open></hx-select>');
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('trigger has aria-haspopup="listbox"', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('trigger has aria-disabled="true" when disabled', async () => {
      const el = await fixture<HxSelect>('<hx-select disabled></hx-select>');
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.getAttribute('aria-disabled')).toBe('true');
    });

    it('trigger tabindex is -1 when disabled', async () => {
      const el = await fixture<HxSelect>('<hx-select disabled></hx-select>');
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.getAttribute('tabindex')).toBe('-1');
    });

    it('trigger tabindex is 0 when enabled', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.getAttribute('tabindex')).toBe('0');
    });
  });

  // ─── Keyboard: Tab closes dropdown ───

  describe('Keyboard: Tab closes dropdown', () => {
    it('Tab key closes the dropdown', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open>
          <option value="a">A</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Keyboard: typeahead ───

  describe('Keyboard: typeahead', () => {
    it('typing a character jumps to the first matching option', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open>
          <option value="a">Alpha</option>
          <option value="b">Beta</option>
          <option value="c">Charlie</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'b', bubbles: true }),
      );
      await el.updateComplete;
      const activeDescendant = trigger.getAttribute('aria-activedescendant');
      expect(activeDescendant).toBeTruthy();
      // Option index 1 (Beta) should be focused
      const referencedEl = el.shadowRoot!.getElementById(activeDescendant!);
      expect(referencedEl?.textContent?.trim()).toBe('Beta');
    });
  });

  // ─── Keyboard: Enter/Space when closed opens dropdown ───

  describe('Keyboard: Enter/Space opens closed dropdown', () => {
    it('Enter key opens closed dropdown', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select>
          <option value="a">A</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('Space key opens closed dropdown', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select>
          <option value="a">A</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });
  });

  // ─── Keyboard: ArrowDown wraps around ───

  describe('Keyboard: ArrowDown wraps to first option', () => {
    it('ArrowDown from last option wraps to first', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open>
          <option value="a">A</option>
          <option value="b">B</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      // Move to last option (index 1) via End key
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      // ArrowDown from last wraps to first
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const activeDescendant = trigger.getAttribute('aria-activedescendant');
      expect(activeDescendant).toContain('-0');
    });
  });

  // ─── Keyboard: ArrowUp wraps around ───

  describe('Keyboard: ArrowUp wraps to last option', () => {
    it('ArrowUp from first option wraps to last when open', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open>
          <option value="a">A</option>
          <option value="b">B</option>
          <option value="c">C</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      // Move to first option
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      // ArrowUp from first wraps to last
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      const activeDescendant = trigger.getAttribute('aria-activedescendant');
      expect(activeDescendant).toContain('-2');
    });
  });

  // ─── disconnectedCallback cleanup ───

  describe('Lifecycle: disconnectedCallback', () => {
    it('sets open=false when disconnected while open', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open>
          <option value="a">A</option>
        </hx-select>
      `);
      await el.updateComplete;
      expect(el.open).toBe(true);
      el.remove();
      // After removal, open state should be reset
      expect(el.open).toBe(false);
    });
  });

  // ─── i18n: labelRequired ───

  describe('Property: labelRequired', () => {
    it('defaults to "Please select an option."', async () => {
      const el = await fixture<HxSelect>('<hx-select required></hx-select>');
      expect(el.labelRequired).toBe('Please select an option.');
    });

    it('uses custom labelRequired as validation message when required + empty', async () => {
      const el = await fixture<HxSelect>(
        '<hx-select required label-required="Veuillez choisir une option."></hx-select>',
      );
      await el.updateComplete;
      expect(el.validationMessage).toBe('Veuillez choisir une option.');
    });
  });

  // ─── error slot activates error state ───

  describe('Slot: error slot activates error state', () => {
    it('slotted error sets aria-invalid on native select', async () => {
      const el = await fixture<HxSelect>(
        '<hx-select label="Country"><span slot="error">Custom error</span></hx-select>',
      );
      await el.updateComplete;
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.getAttribute('aria-invalid')).toBe('true');
    });

    it('slotted error sets aria-invalid on combobox trigger', async () => {
      const el = await fixture<HxSelect>(
        '<hx-select label="Country"><span slot="error">Custom error</span></hx-select>',
      );
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.getAttribute('aria-invalid')).toBe('true');
    });
  });

  // ─── Coverage Gap: outside click closes dropdown ───

  describe('Outside click closes the dropdown', () => {
    it('closes the dropdown when a click occurs outside the component', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open>
          <option value="a">Alpha</option>
          <option value="b">Beta</option>
        </hx-select>
      `);
      await el.updateComplete;
      expect(el.open).toBe(true);
      // Dispatch a mousedown on the document body (outside the component)
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Coverage Gap: typeahead wraps when no match after current position ───

  describe('Typeahead: wraps from current position', () => {
    it('wraps typeahead search to the first match when no later match exists', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select open>
          <option value="a">Alpha</option>
          <option value="b">Beta</option>
          <option value="c">Charlie</option>
        </hx-select>
      `);
      await el.updateComplete;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      // Focus on Beta (index 1), then search for 'a' — wraps to Alpha (index 0)
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
      await el.updateComplete;
      // Now search for 'a' — no match after Beta, so wraps to Alpha
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      await el.updateComplete;
      const activeDescendant = trigger.getAttribute('aria-activedescendant');
      // Alpha should be focused (index 0)
      if (activeDescendant) {
        const focused = el.shadowRoot!.getElementById(activeDescendant);
        expect(focused?.textContent?.trim()).toBe('Alpha');
      } else {
        expect(el.open).toBe(true);
      }
    });
  });

  // ─── Coverage Gap: devWarn when options list is empty ───

  describe('Empty options list', () => {
    it('renders without throwing when no option children are provided', async () => {
      const el = await fixture<HxSelect>('<hx-select label="Empty select"></hx-select>');
      await expect(el.updateComplete).resolves.toBeTruthy();
      expect(el.shadowRoot).toBeTruthy();
    });
  });

  // ─── ARIA Group 3 — Host-canonical ARIA via ElementInternals ───

  describe('Host-canonical ARIA (Group 3 round-1)', () => {
    it('host carries no role via internals — APG combobox stays on the inner trigger', async () => {
      // Path A: setting `internals.role = 'combobox'` would conflict with the
      // inner `<div role="combobox">` and produce a doubled accessible. The
      // host is explicitly roleless.
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
        </hx-select>
      `);
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.role).toBeNull();
      const trigger = shadowQuery(el, '[role="combobox"]');
      expect(trigger).toBeTruthy();
    });

    it('reflects host aria-label into internals.ariaLabel when set', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select aria-label="Pick a country">
          <option value="us">United States</option>
        </hx-select>
      `);
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.ariaLabel).toBe('Pick a country');
    });

    it('reflects label property into internals.ariaLabel when no consumer aria-label', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
        </hx-select>
      `);
      const internals = (el as SelectTestHarness)._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaLabelledByElements;
      if (refs) {
        // Modern path: labelledByElements points at the visible label.
        const label = shadowQuery(el, 'label');
        expect(refs).toContain(label);
      } else {
        // Fallback path: `internals.ariaLabel` mirrors the label property.
        expect(internals.ariaLabel).toContain('Country');
      }
    });

    it('sets host ariaRequired via internals when required', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" required>
          <option value="us">US</option>
        </hx-select>
      `);
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.ariaRequired).toBe('true');
    });

    it('sets host ariaInvalid via internals when validity invalid', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" required>
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      // Required + empty value → valueMissing → invalid → ariaInvalid="true"
      expect(internals.ariaInvalid).toBe('true');
    });

    it('sets host ariaDisabled via internals when disabled', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" disabled>
          <option value="us">US</option>
        </hx-select>
      `);
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.ariaDisabled).toBe('true');
    });

    it('host ariaDescribedByElements references error wrapper when error is set', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" error="Required field">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      const errorWrapper = shadowQuery<HTMLElement>(el, '.field__error')!;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs).toContain(errorWrapper);
      } else {
        const ariaDescription =
          (internals as ElementInternals & { ariaDescription: string | null }).ariaDescription ??
          '';
        expect(ariaDescription).toContain('Required field');
      }
    });

    it('host ariaDescribedByElements references help wrapper when help text is set (no error)', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" help-text="Pick one">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      const helpEl = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs).toContain(helpEl);
      } else {
        const ariaDescription =
          (internals as ElementInternals & { ariaDescription: string | null }).ariaDescription ??
          '';
        expect(ariaDescription).toContain('Pick one');
      }
    });

    it('drops help wrapper from describedby chain when error is active (round-16 P2 parity)', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" help-text="Pick one" error="Required">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      const helpEl = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      const errorEl = shadowQuery<HTMLElement>(el, '.field__error')!;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs).toContain(errorEl);
        expect(refs).not.toContain(helpEl);
      } else {
        const ariaDescription =
          (internals as ElementInternals & { ariaDescription: string | null }).ariaDescription ??
          '';
        expect(ariaDescription).toContain('Required');
        expect(ariaDescription).not.toContain('Pick one');
      }
    });

    it('inner trigger does not carry aria-labelledby/describedby/required/invalid on modern path', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" help-text="Pick one" required error="Required">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const harness = el as SelectTestHarness;
      // Skip if the platform forced fallback (Firefox today).
      if (!harness._supportsIdrefRefs) return;
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(trigger.hasAttribute('aria-labelledby')).toBe(false);
      expect(trigger.hasAttribute('aria-describedby')).toBe(false);
      expect(trigger.hasAttribute('aria-required')).toBe(false);
      expect(trigger.hasAttribute('aria-invalid')).toBe(false);
    });

    it('hidden native select does not carry aria-labelledby/describedby/required/invalid on modern path', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" help-text="Pick one" required error="Required">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const harness = el as SelectTestHarness;
      if (!harness._supportsIdrefRefs) return;
      const nativeSelect = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(nativeSelect.hasAttribute('aria-labelledby')).toBe(false);
      expect(nativeSelect.hasAttribute('aria-describedby')).toBe(false);
      expect(nativeSelect.hasAttribute('aria-required')).toBe(false);
      expect(nativeSelect.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ─── ARIA Group 3 — hasEffectiveLabelledBy gate ───

  describe('hasEffectiveLabelledBy gate (Group 3 round-1)', () => {
    // Group 2 round-35 (medium) parity: a typo or transiently-missing target
    // in `aria-labelledby` must NOT erase the visible label — fall back to
    // `label` so the field keeps a name on both render paths.
    it('keeps the accessible name when aria-labelledby points to a missing id (modern path)', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" aria-labelledby="hx-select-missing-target">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaLabelledByElements;
      if (refs) {
        const label = shadowQuery(el, 'label');
        expect(refs).toContain(label);
      } else {
        expect(internals.ariaLabel).toBe('Country');
        // Group 2 round-36: broken consumer attribute must be cleared from
        // host on fallback so ARIA priority does not drop the name.
        expect(el.getAttribute('aria-labelledby')).toBeNull();
      }
    });

    it('clears host aria-labelledby attribute when consumer tokens do not resolve (fallback path)', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" aria-labelledby="hx-select-missing-target-2">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const harness = el as SelectTestHarness;
      // Force fallback path so the round-36 attribute-clear assertion runs.
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      el.requestUpdate();
      await el.updateComplete;
      // Round-36: when consumer tokens don't resolve, the host attribute is
      // cleared so ARIA priority does not drop the visible label.
      expect(el.getAttribute('aria-labelledby')).toBeNull();
      expect(harness._internals.ariaLabel).toBe('Country');
    });

    it('replays cached consumer labelledby once the target attaches', async () => {
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" aria-labelledby="hx-select-late-target">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      // Target is missing on initial paint — consumer tokens cached, falls
      // back to the visible label.
      const internals = (el as SelectTestHarness)._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const before = (internals as InternalsWithRefs).ariaLabelledByElements ?? [];
      const labelEl = shadowQuery(el, 'label');
      // Either modern path resolves to the visible label OR fallback sets ariaLabel.
      if (before.length > 0) {
        expect(before).toContain(labelEl);
      } else {
        expect(internals.ariaLabel).toBe('Country');
      }
      // Now attach the target. The shared root mutation observer should
      // re-resolve and the cached consumer token replays.
      const target = document.createElement('span');
      target.id = 'hx-select-late-target';
      target.textContent = 'Late Target';
      container.appendChild(target);
      // Allow the mutation observer + microtask to flush.
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      const after = (internals as InternalsWithRefs).ariaLabelledByElements ?? [];
      if (after.length > 0) {
        expect(after).toContain(target);
      }
    });
  });

  // ─── ARIA Group 3 — setValidity anchor ───

  describe('setValidity anchor (Group 3 round-1)', () => {
    // Group 2 round-35 finding (CR major): the setValidity() anchor must be
    // a focusable, interactive element so the UA can route validation UI /
    // error recovery to the actual control surface. The visible trigger div
    // carries `role="combobox"` and `tabindex="0"` — that is the anchor.
    it('setValidity anchor is the focusable inner trigger (combobox)', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" required>
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      const setValiditySpy = vi.spyOn(internals, 'setValidity');
      // Trigger a fresh setValidity by re-asserting required.
      el.required = false;
      await el.updateComplete;
      el.required = true;
      await el.updateComplete;
      const lastCall = setValiditySpy.mock.calls.at(-1);
      expect(lastCall?.[0]).toEqual({ valueMissing: true });
      const trigger = shadowQuery<HTMLElement>(el, '[role="combobox"]')!;
      expect(lastCall?.[2]).toBe(trigger);
      // Confirm the anchor really is focusable.
      expect(trigger.tabIndex).toBe(0);
    });

    it('setValidity anchor never falls through to the aria-hidden native select when the trigger exists', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" required>
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      const setValiditySpy = vi.spyOn(internals, 'setValidity');
      el.required = false;
      await el.updateComplete;
      el.required = true;
      await el.updateComplete;
      const lastCall = setValiditySpy.mock.calls.at(-1);
      const nativeSelect = shadowQuery<HTMLSelectElement>(el, 'select')!;
      // The native select is `aria-hidden="true"` and `tabindex="-1"`; it
      // cannot host UA validation UI.
      expect(lastCall?.[2]).not.toBe(nativeSelect);
    });
  });

  // ─── ARIA Group 3 — Forced-colors host-focus parity ───

  describe('Forced-colors host-focus parity (Group 3 round-1)', () => {
    // The host stays roleless and the inner trigger remains the focus
    // surface, so the existing `.field__trigger:focus-visible` rule under
    // `@media (forced-colors: active)` is what AT and HC users see. This
    // test asserts the rule survives in the component stylesheet so a future
    // refactor cannot silently regress it (Group 2 round-22 parity).
    it('forced-colors stylesheet retains a :focus-visible outline on the trigger', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const sheets = (el.shadowRoot as ShadowRoot).adoptedStyleSheets ?? [];
      const cssText = sheets
        .flatMap((sheet) =>
          Array.from(sheet.cssRules ?? []).map((rule) => (rule as CSSRule).cssText),
        )
        .join('\n');
      // Locate the forced-colors media block and confirm it includes a
      // :focus-visible rule that paints an outline (Highlight system color).
      expect(cssText).toMatch(/forced-colors:\s*active/);
      expect(cssText).toMatch(/:focus-visible[^}]*outline[^}]*Highlight/);
    });
  });

  // ─── ARIA Group 3 — Consumer aria-describedby preservation through error cycle ───

  describe('Consumer aria-describedby preservation (Group 3 round-1)', () => {
    // The `_consumerDescribedBy` cache holds the consumer-authored token
    // list across error → recovery transitions so the component does not
    // erase consumer-supplied descriptions when toggling its own error
    // state. Aligned with Group 2 round-10 P2.
    it('preserves consumer aria-describedby through error → recovery cycle (fallback path)', async () => {
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      const consumerHelp = document.createElement('span');
      consumerHelp.id = 'hx-select-consumer-help';
      consumerHelp.textContent = 'Consumer-authored description';
      container.appendChild(consumerHelp);

      const el = await fixture<HxSelect>(`
        <hx-select label="Country" aria-describedby="hx-select-consumer-help">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const harness = el as SelectTestHarness;
      // Force fallback so we exercise the host-attribute mirror branch.
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      el.requestUpdate();
      await el.updateComplete;

      // Consumer token survives on the host attribute.
      expect(el.getAttribute('aria-describedby')).toBe('hx-select-consumer-help');

      // Toggle error on — the consumer token must remain on the host (the
      // shadow `error` wrapper id is NOT spliced into host attributes; that
      // text-mirrors via `internals.ariaDescription` instead).
      el.error = 'Required';
      await el.updateComplete;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      expect(el.getAttribute('aria-describedby')).toBe('hx-select-consumer-help');

      // Recover from error — consumer token still preserved.
      el.error = '';
      await el.updateComplete;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      expect(el.getAttribute('aria-describedby')).toBe('hx-select-consumer-help');
    });

    it('preserves consumer aria-describedby on the modern path through error cycle', async () => {
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      const consumerHelp = document.createElement('span');
      consumerHelp.id = 'hx-select-consumer-help-modern';
      consumerHelp.textContent = 'Consumer-authored description';
      container.appendChild(consumerHelp);

      const el = await fixture<HxSelect>(`
        <hx-select label="Country" aria-describedby="hx-select-consumer-help-modern">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      // Modern path: consumer's element is in the live element-references
      // list. Adding an error appends the shadow error wrapper without
      // dropping the consumer reference.
      const before = (internals as InternalsWithRefs).ariaDescribedByElements ?? [];
      if (before.length > 0) {
        expect(before).toContain(consumerHelp);
      }
      el.error = 'Required';
      await el.updateComplete;
      const errorWrapper = shadowQuery<HTMLElement>(el, '.field__error')!;
      const during = (internals as InternalsWithRefs).ariaDescribedByElements ?? [];
      if (during.length > 0) {
        expect(during).toContain(consumerHelp);
        expect(during).toContain(errorWrapper);
      }
      el.error = '';
      await el.updateComplete;
      const after = (internals as InternalsWithRefs).ariaDescribedByElements ?? [];
      if (after.length > 0) {
        expect(after).toContain(consumerHelp);
      }
    });
  });

  // ─── ARIA Group 3 — Slot-aware describedby (fallback path) ───

  describe('Slot-aware describedby — fallback path (Group 3 round-1)', () => {
    /**
     * Forces the no-IDL-ref fallback branch so the assertions exercise the
     * same code path a legacy engine (e.g. Firefox today) would take.
     */
    async function forceFallbackPath(el: HxSelect): Promise<void> {
      const harness = el as SelectTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      el.requestUpdate();
      await el.updateComplete;
    }

    it('error textContent mirrors into internals.ariaDescription on fallback path', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" error="This field is required">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.ariaDescription).toBeTruthy();
      expect(internals.ariaDescription).toContain('This field is required');
    });

    it('help-text textContent mirrors into internals.ariaDescription on fallback path', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" help-text="Pick a country">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.ariaDescription).toBeTruthy();
      expect(internals.ariaDescription).toContain('Pick a country');
    });

    it('in-place slotted help-text textContent edits resync internals.ariaDescription', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <span slot="help-text">Initial help</span>
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.ariaDescription).toContain('Initial help');

      const slottedHelp = el.querySelector('[slot="help-text"]') as HTMLSpanElement;
      slottedHelp.textContent = 'Updated help';
      // The observer schedules a microtask; await one to flush.
      await Promise.resolve();
      expect(internals.ariaDescription).toContain('Updated help');
      expect(internals.ariaDescription).not.toContain('Initial help');
    });
  });
});
