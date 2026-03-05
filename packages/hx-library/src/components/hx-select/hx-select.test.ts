import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxSelect } from './hx-select.js';
import './index.js';

// Backward-compat alias used by existing tests
type WcSelect = HxSelect;

afterEach(cleanup);

describe('hx-select', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <select>', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      const select = shadowQuery(el, 'select');
      expect(select).toBeInstanceOf(HTMLSelectElement);
    });

    it('exposes "field" CSS part', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('exposes "select" CSS part', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      const select = shadowQuery(el, '[part="select"]');
      expect(select).toBeTruthy();
    });

    it('renders custom chevron indicator', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      const chevron = shadowQuery(el, '.field__chevron');
      expect(chevron).toBeTruthy();
      expect(chevron?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<WcSelect>('<hx-select label="Country"></hx-select>');
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Country');
    });

    it('does not render label when empty', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('shows asterisk when required', async () => {
      const el = await fixture<WcSelect>('<hx-select label="Country" required></hx-select>');
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });
  });

  // ─── Property: placeholder (2) ───

  describe('Property: placeholder', () => {
    it('renders placeholder as first disabled option', async () => {
      const el = await fixture<WcSelect>('<hx-select placeholder="Choose..."></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const firstOption = select.querySelector('option');
      expect(firstOption).toBeTruthy();
      expect(firstOption?.textContent).toBe('Choose...');
      expect(firstOption?.disabled).toBe(true);
      expect(firstOption?.value).toBe('');
    });

    it('does not render placeholder option when not set', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const options = select.querySelectorAll('option:not([data-cloned])');
      expect(options.length).toBe(0);
    });
  });

  // ─── Property: value (2) ───

  describe('Property: value', () => {
    it('reflects value attribute', async () => {
      const el = await fixture<WcSelect>('<hx-select value="opt1"></hx-select>');
      expect(el.getAttribute('value')).toBe('opt1');
    });

    it('programmatic value update is reflected', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      el.value = 'updated';
      await el.updateComplete;
      expect(el.value).toBe('updated');
      expect(el.getAttribute('value')).toBe('updated');
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('defaults to md', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      expect(el.size).toBe('md');
    });

    it('applies sm size class', async () => {
      const el = await fixture<WcSelect>('<hx-select hx-size="sm"></hx-select>');
      const select = shadowQuery(el, '.field__select--sm');
      expect(select).toBeTruthy();
    });

    it('applies lg size class', async () => {
      const el = await fixture<WcSelect>('<hx-select hx-size="lg"></hx-select>');
      const select = shadowQuery(el, '.field__select--lg');
      expect(select).toBeTruthy();
    });
  });

  // ─── Property: error (4) ───

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<WcSelect>('<hx-select error="Required field"></hx-select>');
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Required field');
    });

    it('error div has aria-live="polite"', async () => {
      const el = await fixture<WcSelect>('<hx-select error="Required"></hx-select>');
      const errorDiv = shadowQuery(el, '.field__error');
      expect(errorDiv?.getAttribute('aria-live')).toBe('polite');
    });

    it('sets aria-invalid="true" on select', async () => {
      const el = await fixture<WcSelect>('<hx-select error="Required"></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.getAttribute('aria-invalid')).toBe('true');
    });

    it('error hides help text', async () => {
      const el = await fixture<WcSelect>('<hx-select error="Error" help-text="Help"></hx-select>');
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: helpText (2) ───

  describe('Property: helpText', () => {
    it('renders help text below select', async () => {
      const el = await fixture<WcSelect>('<hx-select help-text="Pick carefully"></hx-select>');
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Pick carefully');
    });

    it('help text hidden when error present', async () => {
      const el = await fixture<WcSelect>('<hx-select help-text="Help" error="Error"></hx-select>');
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: required (2) ───

  describe('Property: required', () => {
    it('sets required attr on native select', async () => {
      const el = await fixture<WcSelect>('<hx-select required></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.required).toBe(true);
    });

    it('sets aria-required="true" on native select', async () => {
      const el = await fixture<WcSelect>('<hx-select required></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.getAttribute('aria-required')).toBe('true');
    });
  });

  // ─── Property: disabled (2) ───

  describe('Property: disabled', () => {
    it('sets disabled attr on native select', async () => {
      const el = await fixture<WcSelect>('<hx-select disabled></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.disabled).toBe(true);
    });

    it('applies host opacity via disabled attribute', async () => {
      const el = await fixture<WcSelect>('<hx-select disabled></hx-select>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Property: name (1) ───

  describe('Property: name', () => {
    it('sets name attr on native select', async () => {
      const el = await fixture<WcSelect>('<hx-select name="country"></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.getAttribute('name')).toBe('country');
    });
  });

  // ─── Property: ariaLabel (1) ───

  describe('Property: ariaLabel', () => {
    it('sets aria-label on native select', async () => {
      const el = await fixture<WcSelect>('<hx-select aria-label="Select country"></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.getAttribute('aria-label')).toBe('Select country');
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches wc-change on selection', async () => {
      const el = await fixture<WcSelect>(`
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
      const el = await fixture<WcSelect>(`
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
      const el = await fixture<WcSelect>(`
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
      const el = await fixture<WcSelect>(`
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
      const el = await fixture<WcSelect>(
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
      const el = await fixture<WcSelect>('<hx-select label="Test"></hx-select>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('select-wrapper part exposed', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      const wrapper = shadowQuery(el, '[part="select-wrapper"]');
      expect(wrapper).toBeTruthy();
    });

    it('error part exposed', async () => {
      const el = await fixture<WcSelect>('<hx-select error="Error"></hx-select>');
      const error = shadowQuery(el, '[part="error"]');
      expect(error).toBeTruthy();
    });

    it('help-text part exposed', async () => {
      const el = await fixture<WcSelect>('<hx-select help-text="Help"></hx-select>');
      const help = shadowQuery(el, '[part="help-text"]');
      expect(help).toBeTruthy();
    });
  });

  // ─── Form (5) ───

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-select') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-select name="test"></hx-select>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-select') as WcSelect;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets value to empty', async () => {
      const el = await fixture<WcSelect>('<hx-select value="hello"></hx-select>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('formStateRestoreCallback restores value', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      el.formStateRestoreCallback('restored');
      await el.updateComplete;
      expect(el.value).toBe('restored');
    });
  });

  // ─── Validation (6) ───

  describe('Validation', () => {
    it('checkValidity returns false when required + empty', async () => {
      const el = await fixture<WcSelect>('<hx-select required></hx-select>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required + filled', async () => {
      const el = await fixture<WcSelect>('<hx-select required value="filled"></hx-select>');
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is set when required + empty', async () => {
      const el = await fixture<WcSelect>('<hx-select required></hx-select>');
      expect(el.validity.valueMissing).toBe(true);
    });

    it('reportValidity returns false when required + empty', async () => {
      const el = await fixture<WcSelect>('<hx-select required></hx-select>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required + filled', async () => {
      const el = await fixture<WcSelect>('<hx-select required value="filled"></hx-select>');
      expect(el.reportValidity()).toBe(true);
    });

    it('validationMessage is set when required + empty', async () => {
      const el = await fixture<WcSelect>('<hx-select required></hx-select>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });
  });

  // ─── Accessibility (4) ───

  describe('Accessibility', () => {
    it('label is associated with select via for/id', async () => {
      const el = await fixture<WcSelect>('<hx-select label="Country"></hx-select>');
      const label = shadowQuery<HTMLLabelElement>(el, 'label')!;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      expect(label.getAttribute('for')).toBe(trigger.id);
    });

    it('aria-describedby references error ID when error set', async () => {
      const el = await fixture<WcSelect>('<hx-select error="Bad input"></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const errorDiv = shadowQuery(el, '.field__error')!;
      const describedBy = select.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv.id);
    });

    it('aria-describedby references help text ID when helpText set', async () => {
      const el = await fixture<WcSelect>('<hx-select help-text="Some help"></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      const helpDiv = shadowQuery(el, '.field__help-text')!;
      const describedBy = select.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpDiv.id);
    });

    it('chevron is hidden from assistive technology', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      const chevron = shadowQuery(el, '.field__chevron');
      expect(chevron?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Methods (1) ───

  describe('Methods', () => {
    it('focus() moves focus to the trigger button', async () => {
      const el = await fixture<WcSelect>('<hx-select></hx-select>');
      el.focus();
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      expect(el.shadowRoot?.activeElement).toBe(trigger);
    });
  });

  // ─── Dropdown Interaction (4) ───

  describe('Dropdown Interaction', () => {
    it('opens the dropdown when trigger is clicked', async () => {
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(true);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('closes the dropdown on second trigger click', async () => {
      const el = await fixture<WcSelect>(`
        <hx-select label="Country" open>
          <option value="us">United States</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('selects an option by clicking a listbox item', async () => {
      const el = await fixture<WcSelect>(`
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
      const el = await fixture<WcSelect>('<hx-select disabled><option value="a">A</option></hx-select>');
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Keyboard Navigation (7) ───

  describe('Keyboard Navigation', () => {
    it('ArrowDown opens the dropdown and focuses first option', async () => {
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('ArrowDown navigates to next option when open', async () => {
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="mx">Mexico</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
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
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('Enter confirms selection and closes dropdown', async () => {
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
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
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
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
      const el = await fixture<WcSelect>(`
        <hx-select label="Country" value="us">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
      expect(el.value).toBe('us');
    });

    it('Home/End jump to first and last option', async () => {
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="mx">Mexico</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
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
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('updates to focused option ID when navigating', async () => {
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const activeId = trigger.getAttribute('aria-activedescendant');
      expect(activeId).toBeTruthy();
      const referencedEl = el.shadowRoot!.getElementById(activeId!);
      expect(referencedEl).toBeTruthy();
      expect(referencedEl?.getAttribute('role')).toBe('option');
    });

    it('clears aria-activedescendant when dropdown closes', async () => {
      const el = await fixture<WcSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
        </hx-select>
      `);
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, '[role="combobox"]')!;
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
      const el = await fixture<WcSelect>(`<hx-select label="Country">
        <option value="us">United States</option>
        <option value="ca">Canada</option>
      </hx-select>`);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<WcSelect>(`<hx-select label="Country" error="Required">
        <option value="us">United States</option>
      </hx-select>`);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<WcSelect>(`<hx-select label="Country" disabled>
        <option value="us">United States</option>
      </hx-select>`);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
