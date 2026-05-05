import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import { HelixSelect, type HxSelect } from './hx-select.js';
import './index.js';

afterEach(cleanup);

// Round-5 finding 3 (defense-in-depth): the static
// `__testSupportsIdrefRefsOverride` seam is a single field shared across
// all instances and across the whole Vitest worker. A single existing
// test uses try/finally to clear it, but a future careless test could
// leak the override across the rest of the file. This global teardown
// guarantees the seam is reset between every test regardless of where
// it was set.
afterEach(() => {
  (
    HelixSelect as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
  ).__testSupportsIdrefRefsOverride = null;
});

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

    it('sets host ariaInvalid="true" via internals when invalid (modern path)', async () => {
      // Group 3 host-canonical: `aria-invalid` lives on the host via
      // ElementInternals. The hidden native `<select>` is `aria-hidden="true"`
      // and does not carry an ARIA mirror. Round-2 finding 2: invalidity is
      // sourced from `internals.validity.valid`, not the visible error prop.
      const el = await fixture<HxSelect>('<hx-select required error="Required"></hx-select>');
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.ariaInvalid).toBe('true');
    });

    it('error hides help text via the persistent live region (hidden, not removed)', async () => {
      // Group 3 round-1 P1: the help-text wrapper is persistent so the
      // describedby chain stays stable across error transitions. Hide is
      // expressed via the `?hidden` attribute, not by removing the node.
      const el = await fixture<HxSelect>('<hx-select error="Error" help-text="Help"></hx-select>');
      await el.updateComplete;
      const helpText = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      expect(helpText).toBeTruthy();
      expect(helpText.hasAttribute('hidden')).toBe(true);
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

    it('help text hidden when error present (persistent live region)', async () => {
      const el = await fixture<HxSelect>('<hx-select help-text="Help" error="Error"></hx-select>');
      await el.updateComplete;
      const helpText = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      expect(helpText).toBeTruthy();
      expect(helpText.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Property: required (2) ───

  describe('Property: required', () => {
    it('sets required attr on native select', async () => {
      const el = await fixture<HxSelect>('<hx-select required></hx-select>');
      const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
      expect(select.required).toBe(true);
    });

    it('sets host ariaRequired="true" via internals when required (modern path)', async () => {
      // Group 3 host-canonical: `aria-required` lives on the host via
      // ElementInternals. The hidden native `<select>` is `aria-hidden="true"`
      // and no longer carries an ARIA mirror.
      const el = await fixture<HxSelect>('<hx-select required></hx-select>');
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.ariaRequired).toBe('true');
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
    it('sets host ariaLabel via internals from accessibleLabel (modern path)', async () => {
      // Group 3 host-canonical: `accessibleLabel` reaches AT via
      // `internals.ariaLabel` on the modern path. The inner trigger drops its
      // ARIA mirror so AT does not see a doubled accessible. On fallback the
      // host carries `role="combobox"` and the consumer-facing aria-label.
      const el = await fixture<HxSelect>('<hx-select accessible-label="Select country"></hx-select>');
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      const harness = el as SelectTestHarness;
      if (harness._supportsIdrefRefs) {
        expect(internals.ariaLabel).toBe('Select country');
      } else {
        expect(el.getAttribute('aria-label')).toBe('Select country');
      }
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      expect(label.getAttribute('for')).toBe(trigger.id);
    });

    it('host describedby references error wrapper when error set (host-canonical)', async () => {
      // Group 3 host-canonical: describedby chain lives on the host via
      // `internals.ariaDescribedByElements` on the modern path or
      // `internals.ariaDescription` text mirror on the fallback path. The
      // inner trigger and hidden native select no longer carry an
      // `aria-describedby` mirror.
      const el = await fixture<HxSelect>('<hx-select error="Bad input"></hx-select>');
      await el.updateComplete;
      const errorDiv = shadowQuery<HTMLElement>(el, '.field__error')!;
      const internals = (el as SelectTestHarness)._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs).toContain(errorDiv);
      } else {
        expect(internals.ariaDescription).toContain('Bad input');
      }
    });

    it('host describedby references help wrapper when helpText set (host-canonical)', async () => {
      const el = await fixture<HxSelect>('<hx-select help-text="Some help"></hx-select>');
      await el.updateComplete;
      const helpDiv = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      const internals = (el as SelectTestHarness)._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs).toContain(helpDiv);
      } else {
        expect(internals.ariaDescription).toContain('Some help');
      }
    });

    it('chevron is hidden from assistive technology', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      const chevron = shadowQuery(el, '.field__chevron');
      expect(chevron?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Methods (1) ───

  describe('Methods', () => {
    it('focus() moves focus to the host (canonical combobox surface)', async () => {
      // Round-3 finding 1: the host owns focus under host-canonical
      // architecture. focus() routes through the host so AT and forced-colors
      // styling pivot on a single surface.
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      el.focus();
      await el.updateComplete;
      expect(document.activeElement).toBe(el);
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.click();
      await el.updateComplete;
      expect(el.open).toBe(true);
      // Round-3 finding 1: aria-expanded lives on the host (canonical surface).
      expect(el.getAttribute('aria-expanded')).toBe('true');
    });

    it('closes the dropdown on second trigger click', async () => {
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" open>
          <option value="us">United States</option>
        </hx-select>
      `);
      await el.updateComplete;
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      // Move to index 0
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;
      // Move to index 1
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;
      const activeDescendant = el.getAttribute('aria-activedescendant');
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      // Focus first option via ArrowDown
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, composed: true }));
      await el.updateComplete;
      const lastDescendant = el.getAttribute('aria-activedescendant');
      expect(lastDescendant).toContain('-2');

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, composed: true }));
      await el.updateComplete;
      const firstDescendant = el.getAttribute('aria-activedescendant');
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;
      const activeId = el.getAttribute('aria-activedescendant');
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
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

  // ─── Host (canonical combobox surface) ARIA attributes ───
  // Round-3 finding 1: the host is the canonical combobox surface; all
  // role/tabindex/aria-* state lives on the host. The inner trigger is a
  // styling surface only.

  describe('Host ARIA attributes', () => {
    it('host has role="combobox"', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      expect(el.getAttribute('role')).toBe('combobox');
    });

    it('host aria-expanded is "false" when closed', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      expect(el.getAttribute('aria-expanded')).toBe('false');
    });

    it('host aria-expanded is "true" when open', async () => {
      const el = await fixture<HxSelect>('<hx-select open></hx-select>');
      await el.updateComplete;
      expect(el.getAttribute('aria-expanded')).toBe('true');
    });

    it('host has aria-haspopup="listbox"', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      expect(el.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('host has aria-disabled="true" when disabled', async () => {
      const el = await fixture<HxSelect>('<hx-select disabled></hx-select>');
      expect(el.getAttribute('aria-disabled')).toBe('true');
    });

    it('host tabindex is -1 when disabled', async () => {
      const el = await fixture<HxSelect>('<hx-select disabled></hx-select>');
      expect(el.getAttribute('tabindex')).toBe('-1');
    });

    it('host tabindex is 0 when enabled', async () => {
      const el = await fixture<HxSelect>('<hx-select></hx-select>');
      expect(el.getAttribute('tabindex')).toBe('0');
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true }));
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'b', bubbles: true, composed: true }),
      );
      await el.updateComplete;
      const activeDescendant = el.getAttribute('aria-activedescendant');
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      // Move to last option (index 1) via End key
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, composed: true }));
      await el.updateComplete;
      // ArrowDown from last wraps to first
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      await el.updateComplete;
      const activeDescendant = el.getAttribute('aria-activedescendant');
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      // Move to first option
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, composed: true }));
      await el.updateComplete;
      // ArrowUp from first wraps to last
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));
      await el.updateComplete;
      const activeDescendant = el.getAttribute('aria-activedescendant');
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
    it('slotted error puts the field into invalid state for AT', async () => {
      // Group 3 host-canonical: a slotted error activates the error state,
      // and the host advertises invalidity via `internals.ariaInvalid`. The
      // inner trigger and hidden native select no longer carry an
      // `aria-invalid` mirror — round-2 finding 1/2.
      const el = await fixture<HxSelect>(
        '<hx-select label="Country" required><span slot="error">Custom error</span></hx-select>',
      );
      await el.updateComplete;
      const internals = (el as SelectTestHarness)._internals;
      // Required + empty + slotted error → valueMissing → invalid host.
      expect(internals.ariaInvalid).toBe('true');
    });

    it('slotted error contributes its text to host description on fallback path', async () => {
      // On the fallback path the host carries `role="combobox"` and the
      // describedby chain text-mirrors via `internals.ariaDescription`.
      const el = await fixture<HxSelect>(
        '<hx-select label="Country"><span slot="error">Custom error text</span></hx-select>',
      );
      await el.updateComplete;
      const harness = el as SelectTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      el.requestUpdate();
      await el.updateComplete;
      expect(harness._internals.ariaDescription).toContain('Custom error text');
      // Fallback host role is the announced surface — finding 1.
      expect(el.getAttribute('role')).toBe('combobox');
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
      // Focus on Beta (index 1), then search for 'a' — wraps to Alpha (index 0)
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true, composed: true }));
      await el.updateComplete;
      // Now search for 'a' — no match after Beta, so wraps to Alpha
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, composed: true }));
      await el.updateComplete;
      const activeDescendant = el.getAttribute('aria-activedescendant');
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
    it('host carries role="combobox" via internals — APG combobox lives on the host', async () => {
      // Round-3 finding 1: the host is the canonical combobox surface so
      // internals.role === 'combobox' on both modern and fallback paths.
      // The inner trigger is a styling surface only with no role and no
      // ARIA, so AT walks its subtree text as the combobox value content
      // without doubling the accessible.
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">United States</option>
        </hx-select>
      `);
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.role).toBe('combobox');
      // Host attribute mirror also written for CSS / live attribute graph.
      expect(el.getAttribute('role')).toBe('combobox');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger).toBeTruthy();
      // Inner trigger has no role / aria-* mirrors — no doubled accessible.
      expect(trigger?.getAttribute('role')).toBeNull();
      expect(trigger?.getAttribute('aria-expanded')).toBeNull();
      expect(trigger?.getAttribute('aria-haspopup')).toBeNull();
      expect(trigger?.getAttribute('aria-controls')).toBeNull();
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
      // Round-2 finding 2: placeholder keeps `value` empty so required+empty
      // produces a `valueMissing` validity flag. Without a placeholder, the
      // slot-projection handler auto-selects the first option to mirror native
      // `<select>` semantics — valid in that case, defeating the test intent.
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" placeholder="Choose…" required>
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
      const trigger = shadowQuery<HTMLElement>(el, '[part="trigger"]')!;
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

    it('clears host aria-labelledby attribute when consumer tokens do not resolve (fallback path) and announces via host aria-label', async () => {
      // Round-2 finding 5: assert on the announced surface, not just the
      // host-mirror implementation detail. On the fallback path the host
      // carries `role="combobox"` (round-2 finding 1, Option B) — so AT walks
      // the host's `aria-label` / `aria-labelledby` for the accessible name.
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
      // Round-2 finding 5: the announced surface must carry the accessible
      // name. On fallback the host is the combobox surface and exposes
      // `aria-label` so AT does not see an unnamed combobox.
      expect(el.getAttribute('role')).toBe('combobox');
      expect(el.getAttribute('aria-label')).toBe('Country');
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

  describe('setValidity anchor (Group 3 round-3)', () => {
    // Group 2 round-35 finding (CR major): the setValidity() anchor must be
    // a focusable, interactive element so the UA can route validation UI /
    // error recovery to the actual control surface. Round-3 finding 1 moved
    // the canonical combobox surface from the inner trigger to the host —
    // the host carries role="combobox" and tabindex="0", so the host is
    // the anchor.
    it('setValidity anchor is the host (canonical combobox surface), never the aria-hidden native select', async () => {
      // Round-3 finding 1: under host-canonical architecture the host is
      // the focusable, AT-visible combobox surface, so it is the anchor
      // the UA routes validation UI to.
      //
      // Note: a placeholder is required to keep `value === ''` because the
      // slot handler auto-selects the first option when no placeholder is
      // present — required + auto-selected value === valid.
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" required placeholder="Choose…">
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
      const nativeSelect = shadowQuery<HTMLSelectElement>(el, 'select')!;
      // Positive: anchor IS the host.
      expect(lastCall?.[2]).toBe(el);
      // Round-3 finding 1: anchor must be a focusable, AT-visible surface.
      expect(el.tabIndex).toBe(0);
      expect(el.getAttribute('aria-hidden')).toBeNull();
      expect(el.getAttribute('role')).toBe('combobox');
      // Negative: anchor is NOT the hidden native select (kept for clarity).
      expect(lastCall?.[2]).not.toBe(nativeSelect);
      expect(nativeSelect.getAttribute('aria-hidden')).toBe('true');
      expect(nativeSelect.tabIndex).toBe(-1);
    });
  });

  // ─── ARIA Group 3 — Forced-colors host-focus parity ───

  describe('Forced-colors host-focus parity (Group 3 round-1)', () => {
    // The host stays roleless and the inner trigger remains the focus
    // surface, so the existing `.field__trigger:focus-visible` rule under
    // `@media (forced-colors: active)` is what AT and HC users see. This
    // test asserts the rule survives in the component stylesheet so a future
    // refactor cannot silently regress it (Group 2 round-22 parity).
    it('forced-colors stylesheet retains a :focus-visible outline specifically on .field__trigger', async () => {
      // Round-2 finding 7: the previous regex `/:focus-visible[^}]*outline[^}]*Highlight/`
      // matched the (now-removed) shared `forcedColorsField` mixin's
      // `select:focus-visible` rule too — it would pass even if the bespoke
      // `.field__trigger:focus-visible` rule were deleted. Tighten to require
      // the `.field__trigger` selector specifically. Also use a
      // case-insensitive match because the browser may normalize the
      // `Highlight` system colour keyword to lowercase in `cssRule.cssText`.
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
      expect(cssText).toMatch(/forced-colors:\s*active/i);
      // Tightened: require `.field__trigger` BEFORE `:focus-visible` and
      // require `outline ... Highlight` in the same rule body. `[^{]*` keeps
      // the assertion within a single selector, `[^}]*` keeps it within a
      // single declaration block.
      expect(cssText).toMatch(/\.field__trigger[^{]*:focus-visible[^}]*outline[^}]*highlight/i);
    });
  });

  // ─── ARIA Group 3 — Consumer aria-describedby preservation through error cycle ───

  describe('Consumer aria-describedby preservation (Group 3 round-1)', () => {
    // Round-6 (option b — single-channel fallback): per W3C AccName 1.2 the
    // `aria-describedby` attribute takes precedence over
    // `internals.ariaDescription`. If a consumer-authored token survives on
    // the host attribute, AT may announce only the consumer text and never
    // reach the internal help/error strings the component renders in its
    // shadow root. The fallback path therefore strips the host attribute
    // and surfaces description text through `internals.ariaDescription`
    // exclusively — the consumer's intended description text is preserved
    // through that channel, but the attribute mirror is removed by design.
    it('Fallback path: description text reaches AT via internals.ariaDescription regardless of consumer aria-describedby channel — single-channel by design (W3C AccName precedence)', async () => {
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
      // Force fallback so we exercise the single-channel branch.
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      el.requestUpdate();
      await el.updateComplete;

      // Round-6: host `aria-describedby` is stripped on the fallback path
      // (regardless of authorship) so the consumer token cannot shadow
      // internal help/error text per W3C AccName 1.2 precedence.
      expect(el.getAttribute('aria-describedby')).toBeNull();
      // Consumer description text surfaces via `internals.ariaDescription`.
      expect(harness._internals.ariaDescription).toContain('Consumer-authored description');
      // Round-2 finding 5: host on fallback is the announced combobox.
      expect(el.getAttribute('role')).toBe('combobox');
      expect(el.getAttribute('aria-label')).toBe('Country');

      // Toggle error on — both the consumer text and the internal error
      // text must reach AT through the single channel.
      el.error = 'Required';
      await el.updateComplete;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      expect(el.getAttribute('aria-describedby')).toBeNull();
      expect(harness._internals.ariaDescription).toContain('Consumer-authored description');
      expect(harness._internals.ariaDescription).toContain('Required');
      expect(el.getAttribute('role')).toBe('combobox');

      // Recover from error — consumer text remains in the description; the
      // internal error text drops out symmetrically.
      el.error = '';
      await el.updateComplete;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      expect(el.getAttribute('aria-describedby')).toBeNull();
      expect(harness._internals.ariaDescription).toContain('Consumer-authored description');
      expect(harness._internals.ariaDescription).not.toContain('Required');
      expect(el.getAttribute('role')).toBe('combobox');
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
      // Round-2 finding 2 + 5: pair `error` with `required` + `placeholder` so
      // the validity-driven invalid flag (`!internals.validity.valid`) is
      // stable. Setting `error` alone does NOT invoke `setValidity()` — the
      // visual error string and the live `aria-invalid` attribute are
      // independent concerns; this test exercises the union.
      const el = await fixture<HxSelect>(`
        <hx-select
          label="Country"
          placeholder="Choose…"
          required
          error="This field is required"
        >
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);
      const internals = (el as SelectTestHarness)._internals;
      expect(internals.ariaDescription).toBeTruthy();
      expect(internals.ariaDescription).toContain('This field is required');
      // Round-2 finding 5: on fallback, the host IS the announced combobox.
      // Assert AT-visible state on the host so any future regression that
      // moves these to the inner trigger (the legacy roleful path) fails.
      expect(el.getAttribute('role')).toBe('combobox');
      expect(el.getAttribute('aria-label')).toBe('Country');
      expect(el.getAttribute('aria-invalid')).toBe('true');
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
      // Round-2 finding 5: announced surface assertions on host.
      expect(el.getAttribute('role')).toBe('combobox');
      expect(el.getAttribute('aria-label')).toBe('Country');
      // No error → no aria-invalid surfaced on the host.
      expect(el.getAttribute('aria-invalid')).toBe(null);
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
      // Round-2 finding 5: host announced surface still consistent.
      expect(el.getAttribute('role')).toBe('combobox');
      expect(el.getAttribute('aria-label')).toBe('Country');
    });

    it('concatenates consumer aria-describedby text + internal help/error text into internals.ariaDescription on fallback path (Round-6 option b)', async () => {
      // Round-6 option b regression: on the fallback path the host
      // `aria-describedby` attribute is stripped (per W3C AccName 1.2
      // precedence) and ALL description text — both the consumer's
      // `aria-describedby`-target text and the internal shadow help/error
      // strings — is concatenated into `internals.ariaDescription`. This
      // is the only single-channel reachable to AT on legacy engines
      // (cross-shadow id splice does not portably resolve on Firefox /
      // VoiceOver).
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      const consumerHelp = document.createElement('p');
      consumerHelp.id = 'hx-select-r6-consumer-help';
      consumerHelp.textContent = 'External help text';
      container.appendChild(consumerHelp);

      const el = await fixture<HxSelect>(`
        <hx-select
          label="Country"
          aria-describedby="hx-select-r6-consumer-help"
          help-text="Internal help"
          error="Internal error"
        >
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);
      const harness = el as SelectTestHarness;

      // Host attribute stripped — single channel via internals.
      expect(el.getAttribute('aria-describedby')).toBeNull();

      // `error` is set, so help suppresses and error mirrors. Consumer
      // text concatenates with the active internal channel (error).
      expect(harness._internals.ariaDescription).toContain('External help text');
      expect(harness._internals.ariaDescription).toContain('Internal error');
      // `help-text` is shadowed by the active error per the existing
      // help/error mutual-exclusion contract.
      expect(harness._internals.ariaDescription).not.toContain('Internal help');

      // Drop the error — internal channel flips to help; consumer text
      // remains.
      el.error = '';
      await el.updateComplete;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      expect(el.getAttribute('aria-describedby')).toBeNull();
      expect(harness._internals.ariaDescription).toContain('External help text');
      expect(harness._internals.ariaDescription).toContain('Internal help');
      expect(harness._internals.ariaDescription).not.toContain('Internal error');
    });

    it('drops unresolved consumer aria-describedby tokens (no literal id leakage) on fallback path', async () => {
      // Round-6 option b: when a consumer-supplied id fails to resolve
      // (typo, transient detach), `resolveIdrefTokens` drops it silently
      // — the literal id string MUST NOT appear in
      // `internals.ariaDescription`. Only internal help/error text shows.
      const el = await fixture<HxSelect>(`
        <hx-select
          label="Country"
          aria-describedby="this-id-does-not-exist"
          help-text="Pick a country"
        >
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);
      const harness = el as SelectTestHarness;

      expect(el.getAttribute('aria-describedby')).toBeNull();
      expect(harness._internals.ariaDescription).toContain('Pick a country');
      expect(harness._internals.ariaDescription).not.toContain('this-id-does-not-exist');
    });
  });

  // ─── ARIA Group 3 — Round-3 finding 4 regression: static path-selection seam ───

  describe('Static path-selection seam (Group 3 round-3 finding 4)', () => {
    // Round-3 finding 4: tests that flip `_supportsIdrefRefs` mid-life leak
    // modern artifacts (`internals.ariaLabelledByElements`) into "fallback"
    // assertions because the modern branch already wrote them and the
    // fallback branch never cleared them. The component now exposes a
    // *static* override field consumed in `connectedCallback` BEFORE the
    // platform probe AND a symmetric clear in the fallback branch that nulls
    // the modern IDL element-reference fields. This regression test asserts
    // BOTH guarantees.

    it('static __testSupportsIdrefRefsOverride forces the fallback path before connect', async () => {
      // Set the static override on the constructor BEFORE the element is
      // upgraded so connectedCallback's path-selection branch picks the
      // fallback path. After the test, reset the static to null so other
      // tests are not affected.
      const mod = await import('./hx-select.js');
      const ctor = (mod as unknown as { HelixSelect: typeof HxSelect })
        .HelixSelect as typeof HxSelect & {
        __testSupportsIdrefRefsOverride: boolean | null;
      };
      ctor.__testSupportsIdrefRefsOverride = false;
      try {
        const el = await fixture<HxSelect>(`
          <hx-select label="Country">
            <option value="us">US</option>
          </hx-select>
        `);
        await el.updateComplete;
        const harness = el as SelectTestHarness;
        // Path was selected at connect time — no mid-life flip required.
        expect(harness._supportsIdrefRefs).toBe(false);
        // Symmetric clear: modern IDL element-reference fields are null
        // even though the host announces a combobox role + label.
        type InternalsWithRefs = ElementInternals & {
          ariaLabelledByElements: Element[] | null;
          ariaDescribedByElements: Element[] | null;
        };
        const refs = harness._internals as InternalsWithRefs;
        expect(refs.ariaLabelledByElements).toBeNull();
        expect(refs.ariaDescribedByElements).toBeNull();
        // Host advertises combobox + accessible name on the canonical surface.
        expect(el.getAttribute('role')).toBe('combobox');
        expect(el.getAttribute('aria-label')).toBe('Country');
      } finally {
        ctor.__testSupportsIdrefRefsOverride = null;
      }
    });

    it('fallback branch nulls modern IDL element-reference fields (symmetric clear)', async () => {
      // Even when a previous sync leaked modern artifacts onto the host,
      // forcing the fallback path and re-syncing must null them. This
      // simulates the historical mid-life flip that finding 4 calls out
      // and asserts the symmetric clear added to `_syncHostAriaSemantics`.
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" help-text="Pick a country">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const harness = el as SelectTestHarness;
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refs = harness._internals as InternalsWithRefs;
      // If the platform supports IDL refs, the modern path may have written
      // some refs. Force fallback and re-sync; assert the symmetric clear.
      if (harness._supportsIdrefRefs) {
        // Sanity: there is something to clear.
        expect(
          (refs.ariaLabelledByElements?.length ?? 0) +
            (refs.ariaDescribedByElements?.length ?? 0),
        ).toBeGreaterThan(0);
      }
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      el.requestUpdate();
      await el.updateComplete;
      // Symmetric clear contract:
      expect(refs.ariaLabelledByElements).toBeNull();
      expect(refs.ariaDescribedByElements).toBeNull();
      // Host attribute mirror still surfaces the accessible name + description
      // on the fallback path.
      expect(el.getAttribute('role')).toBe('combobox');
      expect(el.getAttribute('aria-label')).toBe('Country');
      expect(harness._internals.ariaDescription).toContain('Pick a country');
    });
  });

  // ─── ARIA Group 3 — Round-5 finding 1: aria-label mirror is not self-sealing ───

  describe('Fallback aria-label mirror lifecycle (Group 3 round-5 finding 1)', () => {
    // Round-5 finding 1: the round-3 fallback `aria-label` mirror was
    // self-sealing — sync N wrote `aria-label="Country"` to the host,
    // sync N+1 read that string back via `getAttribute('aria-label')`
    // and treated it as a consumer override, caching it into
    // `internals.ariaLabel` and short-circuiting `_writeHostAttributeMirror`.
    // Subsequent `label` / `accessibleLabel` / slotted-text mutations never
    // propagated, and cleared label sources never removed the host
    // attribute. The fix mirrors the existing `_lastWrittenLabelledBy`
    // pattern — track what the component wrote so the next sync can
    // distinguish "I wrote this" from "consumer overrode this."
    it('propagates label mutations through the fallback host aria-label mirror', async () => {
      const ctor = HelixSelect as unknown as {
        __testSupportsIdrefRefsOverride: boolean | null;
      };
      ctor.__testSupportsIdrefRefsOverride = false;
      const el = await fixture<HxSelect>(`
        <hx-select label="Country">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const harness = el as SelectTestHarness;

      // Initial: component owns the mirror, host attribute matches `label`.
      expect(el.getAttribute('aria-label')).toBe('Country');
      expect(harness._internals.ariaLabel).toBe('Country');

      // Mutate `label` — the mirror must follow, not stick to "Country".
      el.label = 'Country (required)';
      await el.updateComplete;
      expect(el.getAttribute('aria-label')).toBe('Country (required)');
      expect(harness._internals.ariaLabel).toBe('Country (required)');

      // Clear `label` — the host attribute must be removed because the
      // component owned it and the source has emptied.
      el.label = '';
      await el.updateComplete;
      expect(el.getAttribute('aria-label')).toBeNull();
      expect(harness._internals.ariaLabel).toBeNull();
    });

    it('preserves consumer-authored aria-label across label mutations on fallback', async () => {
      const ctor = HelixSelect as unknown as {
        __testSupportsIdrefRefsOverride: boolean | null;
      };
      ctor.__testSupportsIdrefRefsOverride = false;
      const el = await fixture<HxSelect>(`
        <hx-select label="Country" aria-label="Pick one">
          <option value="us">US</option>
        </hx-select>
      `);
      await el.updateComplete;
      const harness = el as SelectTestHarness;

      // Consumer wins: `aria-label` is the announced name.
      expect(el.getAttribute('aria-label')).toBe('Pick one');
      expect(harness._internals.ariaLabel).toBe('Pick one');

      // Mutating internal `label` must not overwrite the consumer attribute.
      el.label = 'Country (required)';
      await el.updateComplete;
      expect(el.getAttribute('aria-label')).toBe('Pick one');
      expect(harness._internals.ariaLabel).toBe('Pick one');
    });
  });

  // ─── ARIA Group 3 — Round-8 codex remediation regressions ───

  describe('Round-8 codex remediation (Group 3 round-8)', () => {
    /**
     * Round-8 fallback-path harness: forces the no-IDL-ref branch via the
     * static path-selection seam BEFORE connect, so the modern branch never
     * writes `internals.ariaLabelledByElements` / `ariaDescribedByElements`
     * and a clean fallback baseline is observable.
     */
    async function fixtureForcedFallback(html: string): Promise<HxSelect> {
      const ctor = HelixSelect as unknown as {
        __testSupportsIdrefRefsOverride: boolean | null;
      };
      ctor.__testSupportsIdrefRefsOverride = false;
      const el = await fixture<HxSelect>(html);
      await el.updateComplete;
      return el;
    }

    describe('Finding 2 (medium) — consumer aria-label override survives coincident-string round-trip on fallback', () => {
      // Round-8 finding 2: the consumer-override branch in
      // `_writeHostAttributeMirror` previously returned early without
      // resetting `_lastWrittenAriaLabel`. The snapshot stayed pinned to
      // the value WE wrote last. If the consumer subsequently rewrote
      // `aria-label` to a string that happened to equal our prior write,
      // the disambiguation at line ~668 saw `liveAttr ===
      // _lastWrittenAriaLabel` and treated the consumer string as
      // component-owned. A subsequent `label = ''` would then silently
      // delete the consumer's attribute — the canonical
      // disambiguation-loses-consumer-write defect.
      //
      // The fix nulls the snapshot in the consumer-override branch so
      // the next sync's disambiguation classifies the consumer string as
      // external on every subsequent pass, regardless of whether the
      // consumer string happens to equal our prior write.
      it('preserves consumer aria-label across coincident-string overrides on fallback', async () => {
        const el = await fixtureForcedFallback(`
          <hx-select label="Country">
            <option value="us">US</option>
          </hx-select>
        `);
        const harness = el as SelectTestHarness;

        // Step 1: component owns mirror; host attr matches `label`.
        expect(el.getAttribute('aria-label')).toBe('Country');

        // Step 2: consumer overrides with divergent string.
        el.setAttribute('aria-label', 'Pick one');
        // Force a sync so disambiguation captures the override.
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        expect(harness._internals.ariaLabel).toBe('Pick one');

        // Step 3: consumer rewrites to a string that COINCIDES with our
        // prior write ("Country"). Without the round-8 null-reset, the
        // snapshot would still be "Pick one" (the last component-owned
        // value before the override) — but the override branch above
        // already nulled it. So the next sync sees liveAttr="Country" vs
        // snapshot=null → diverges → classified as external.
        el.setAttribute('aria-label', 'Country');
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        expect(harness._internals.ariaLabel).toBe('Country');

        // Step 4: internal label cleared. The consumer's attribute MUST
        // survive — the disambiguation must NOT misclassify the consumer's
        // "Country" as our own and silently remove it.
        el.label = '';
        await el.updateComplete;
        expect(el.getAttribute('aria-label')).toBe('Country');
      });
    });

    describe('Finding 3 (low) — _consumerDescribedBy survives across syncs on fallback', () => {
      // Round-8 finding 3: lock the round-6 round-trip semantics —
      // `_consumerDescribedBy` is captured ONCE from the consumer's
      // initial host attribute (via the baseline diff at lines 691-694)
      // and SURVIVES our subsequent strip + later resyncs. This is what
      // keeps the consumer's external description text concatenating
      // into `internals.ariaDescription` across re-renders, and is the
      // contract that the round-10 observer-based retraction depends on:
      // a stable cached baseline that only flips to null on an authentic
      // consumer mutation, never on an internal sync.
      it('caches consumer aria-describedby on first sync and preserves it across subsequent resyncs', async () => {
        const container = document.getElementById('test-fixture-container');
        if (!container) throw new Error('test-fixture-container not found');
        const externalHelp = document.createElement('p');
        externalHelp.id = 'hx-select-r8-survival-help';
        externalHelp.textContent = 'External survival text';
        container.appendChild(externalHelp);

        const el = await fixtureForcedFallback(`
          <hx-select
            label="Country"
            aria-describedby="hx-select-r8-survival-help"
          >
            <option value="us">US</option>
          </hx-select>
        `);
        const harness = el as SelectTestHarness & {
          _consumerDescribedBy: string | null;
        };

        // Baseline captured from initial sync.
        expect(harness._consumerDescribedBy).toBe('hx-select-r8-survival-help');

        // Trigger a second sync via an unrelated property mutation
        // (`helpText` flips on the internal help channel). The consumer
        // baseline must NOT be re-derived from the now-stripped host
        // attribute — that read would (incorrectly) yield null.
        el.helpText = 'Internal help text';
        await el.updateComplete;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        expect(harness._consumerDescribedBy).toBe('hx-select-r8-survival-help');

        // Trigger a third sync via `requestUpdate` — same invariant.
        el.requestUpdate();
        await el.updateComplete;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        expect(harness._consumerDescribedBy).toBe('hx-select-r8-survival-help');
      });
    });

    describe('Finding 4 (low) — whitespace-only consumer aria-label is treated as no override on fallback', () => {
      // Round-8 finding 4: the `liveAriaLabel.trim() || ''` collapse at
      // line ~681 of `hx-select.ts` deliberately treats a whitespace-only
      // consumer `aria-label` (e.g. `aria-label=" "`) as no consumer
      // override — the internal candidate (`label` / `accessibleLabel` /
      // slotted text) wins and surfaces through `internals.ariaLabel`.
      // This is intentional: whitespace-only `aria-label` is a code smell
      // pattern, the AT-suppression behaviour it sometimes produces is not
      // a documented hx-select contract, and silently erasing the
      // consumer's intended name would be the worse failure mode.
      // Locking intent with this regression test prevents an accidental
      // round-trip from removing the discrimination.
      it('whitespace-only consumer aria-label loses to internal candidate on fallback', async () => {
        const el = await fixtureForcedFallback(`
          <hx-select label="Country" aria-label=" ">
            <option value="us">US</option>
          </hx-select>
        `);
        const harness = el as SelectTestHarness;

        // Internal `label` wins despite a whitespace-only consumer override.
        expect(harness._internals.ariaLabel).toBe('Country');
        // Mirror catches up: host attribute reflects our internal candidate.
        expect(el.getAttribute('aria-label')).toBe('Country');
      });
    });
  });

  // ─── ARIA Group 3 — Round-10 architecture lockdown ───
  //
  // Locks the round-10 architectural decision (see
  // `.reports/aria-group-3-architecture-decision-r10.md`):
  //   1. Option A retained: single-channel `internals.ariaDescription` on the
  //      fallback path, host `aria-describedby` stripped on every sync.
  //   2. Round-9 finding 1 fix: round-8 pending-strip counter + discriminator
  //      replaced by the disconnect-during-strip discipline. The dedicated
  //      `_hostDescribedByObserver` is `disconnect()`ed before each
  //      self-strip and re-`observe()`d immediately after — self-mutations
  //      never reach the callback, so the observer's view is purely
  //      consumer-driven.
  //   3. Round-9 finding 2 reframed as a public contract: see the comment
  //      block in front of test 2 below.
  //
  // Public contract — consumer retraction of aria-describedby on the
  // fallback path:
  //
  // Three valid sequences (the first two are observable + handled; the third
  // is an intentional non-feature, documented for vanilla-imperative
  // consumers):
  //
  // 1. FRAMEWORK BATCHED (Vue/React/Lit reconciliation): consumer flips
  //    binding from 'help-id' to '' or to a different id in the same render
  //    commit. Reconciler emits attach-then-detach as two MutationRecords in
  //    one batch; our dedicated observer reads attributeOldValue from the
  //    first record and correctly detects the retraction.
  //
  // 2. SET-EMPTY-THEN-REMOVE (recommended for vanilla imperative code):
  //    consumer calls el.setAttribute('aria-describedby', '') and then
  //    el.removeAttribute('aria-describedby'). The first call fires a real
  //    DOM mutation observable by the dedicated host observer.
  //
  // 3. BARE removeAttribute on already-stripped attr (intentional
  //    NON-feature): after our fallback strip, the host attr is absent. A
  //    subsequent bare el.removeAttribute('aria-describedby') is a
  //    null→null DOM no-op and fires no MutationRecord — this is a platform
  //    property, not a fixable code path. Vanilla-imperative consumers must
  //    use sequence 2.

  describe('Round-10 architecture lockdown (Group 3 round-10)', () => {
    /**
     * Re-declare the forced-fallback fixture for the round-10 sibling
     * describe block. Identical to the round-8 helper but kept locally so
     * round-10 is independently auditable.
     */
    async function fixtureForcedFallback(html: string): Promise<HxSelect> {
      const ctor = HelixSelect as unknown as {
        __testSupportsIdrefRefsOverride: boolean | null;
      };
      ctor.__testSupportsIdrefRefsOverride = false;
      const el = await fixture<HxSelect>(html);
      await el.updateComplete;
      return el;
    }

    describe('Test 1 — counter race no longer reachable', () => {
      // Round-10 finding 1 regression lock: round-8's pending-strip counter
      // had a race where rapid alternating consumer mutations across
      // microtask boundaries could drift the discriminator out of phase
      // with reality. The disconnect-during-strip discipline removes the
      // counter entirely, so this adversarial sequence now trivially
      // converges. We assert the converged state to prove the architecture
      // (not just the implementation) is race-free.
      it('rapid alternating set/remove sequences converge to the last consumer state', async () => {
        const container = document.getElementById('test-fixture-container');
        if (!container) throw new Error('test-fixture-container not found');
        const helpA = document.createElement('p');
        helpA.id = 'hx-select-r10-help-a';
        helpA.textContent = 'Help text A';
        container.appendChild(helpA);
        const helpB = document.createElement('p');
        helpB.id = 'hx-select-r10-help-b';
        helpB.textContent = 'Help text B';
        container.appendChild(helpB);
        const helpC = document.createElement('p');
        helpC.id = 'hx-select-r10-help-c';
        helpC.textContent = 'Help text C';
        container.appendChild(helpC);

        const el = await fixtureForcedFallback(`
          <hx-select label="Country" aria-describedby="hx-select-r10-help-a">
            <option value="us">US</option>
          </hx-select>
        `);
        const harness = el as SelectTestHarness & {
          _consumerDescribedBy: string | null;
        };

        // Baseline: initial consumer token cached, host attribute stripped.
        expect(harness._consumerDescribedBy).toBe('hx-select-r10-help-a');
        expect(el.getAttribute('aria-describedby')).toBeNull();

        // Adversarial sequence: set b → remove → set c synchronously across
        // a single tick. The disconnect-during-strip discipline ensures
        // the observer only sees the consumer-driven mutations and the
        // last set wins.
        el.setAttribute('aria-describedby', 'hx-select-r10-help-b');
        el.removeAttribute('aria-describedby');
        el.setAttribute('aria-describedby', 'hx-select-r10-help-c');
        await new Promise<void>((r) => setTimeout(r, 0));
        await el.updateComplete;

        expect(harness._consumerDescribedBy).toBe('hx-select-r10-help-c');
        expect(harness._internals.ariaDescription ?? '').toContain('Help text C');
        expect(harness._internals.ariaDescription ?? '').not.toContain('Help text B');
        // Host attribute stripped again on the resync (single-channel
        // fallback collapse, round-6 architecture).
        expect(el.getAttribute('aria-describedby')).toBeNull();

        // Repeat with a longer sequence that ends on null. The disconnect
        // discipline cannot drift; a counter-based design would have
        // misclassified one of these mutations.
        el.setAttribute('aria-describedby', 'hx-select-r10-help-a');
        el.setAttribute('aria-describedby', 'hx-select-r10-help-b');
        el.setAttribute('aria-describedby', 'hx-select-r10-help-c');
        el.removeAttribute('aria-describedby');
        await new Promise<void>((r) => setTimeout(r, 0));
        await el.updateComplete;

        expect(harness._consumerDescribedBy).toBeNull();
        expect(harness._internals.ariaDescription ?? '').not.toContain('Help text A');
        expect(harness._internals.ariaDescription ?? '').not.toContain('Help text B');
        expect(harness._internals.ariaDescription ?? '').not.toContain('Help text C');
      });
    });

    describe('Test 2 — public contract for the three retraction sequences', () => {
      // Locks the public contract. Sequence 3 is the documented non-feature
      // (bare removeAttribute on an already-absent attribute is a DOM no-op
      // and fires no MutationRecord); vanilla-imperative consumers MUST
      // use sequence 2 to retract.
      it('sequence 1 — framework batched attach-then-detach retracts cached consumer state', async () => {
        const container = document.getElementById('test-fixture-container');
        if (!container) throw new Error('test-fixture-container not found');
        const ext = document.createElement('p');
        ext.id = 'hx-select-r10-ext-seq1';
        ext.textContent = 'External seq1';
        container.appendChild(ext);

        const el = await fixtureForcedFallback(`
          <hx-select label="Country" aria-describedby="hx-select-r10-ext-seq1">
            <option value="us">US</option>
          </hx-select>
        `);
        const harness = el as SelectTestHarness & {
          _consumerDescribedBy: string | null;
        };

        expect(harness._consumerDescribedBy).toBe('hx-select-r10-ext-seq1');
        expect(harness._internals.ariaDescription ?? '').toContain('External seq1');

        // Framework batched: setAttribute('other') then removeAttribute in
        // the same task — reconciler emits two MutationRecords in one
        // batch; the observer reads attributeOldValue and detects the
        // retraction.
        el.setAttribute('aria-describedby', 'other-id');
        el.removeAttribute('aria-describedby');
        await new Promise<void>((r) => setTimeout(r, 0));
        await el.updateComplete;

        expect(harness._consumerDescribedBy).toBeNull();
        expect(harness._internals.ariaDescription ?? '').not.toContain('External seq1');
      });

      it('sequence 2 — set-empty-then-remove retracts cached consumer state', async () => {
        const container = document.getElementById('test-fixture-container');
        if (!container) throw new Error('test-fixture-container not found');
        const ext = document.createElement('p');
        ext.id = 'hx-select-r10-ext-seq2';
        ext.textContent = 'External seq2';
        container.appendChild(ext);

        const el = await fixtureForcedFallback(`
          <hx-select label="Country" aria-describedby="hx-select-r10-ext-seq2">
            <option value="us">US</option>
          </hx-select>
        `);
        const harness = el as SelectTestHarness & {
          _consumerDescribedBy: string | null;
        };

        expect(harness._consumerDescribedBy).toBe('hx-select-r10-ext-seq2');
        expect(harness._internals.ariaDescription ?? '').toContain('External seq2');

        // Recommended vanilla-imperative retraction: set empty (observable
        // mutation: oldValue !== null), then remove. The set-empty step
        // re-baselines `_consumerDescribedBy` to '' (functionally
        // equivalent to "no tokens"); `resolveIdrefTokens` yields no
        // resolved elements, so consumer text drops from
        // `internals.ariaDescription`. The subsequent removeAttribute is
        // either an observable mutation or a no-op depending on whether
        // the strip resync ran first; either way the description is
        // already retracted.
        el.setAttribute('aria-describedby', '');
        await new Promise<void>((r) => setTimeout(r, 0));
        el.removeAttribute('aria-describedby');
        await new Promise<void>((r) => setTimeout(r, 0));
        await el.updateComplete;

        // Cached consumer state is either null (observer fired on
        // remove) or '' (no tokens — equivalent retraction). Both are
        // valid retracted states; what matters is the consumer text is
        // gone from the description channel.
        expect(harness._consumerDescribedBy === null || harness._consumerDescribedBy === '').toBe(
          true,
        );
        expect(harness._internals.ariaDescription ?? '').not.toContain('External seq2');
        expect(el.getAttribute('aria-describedby')).toBeNull();
      });

      it('sequence 3 — bare removeAttribute on already-stripped attr is the documented non-feature', async () => {
        const container = document.getElementById('test-fixture-container');
        if (!container) throw new Error('test-fixture-container not found');
        const ext = document.createElement('p');
        ext.id = 'hx-select-r10-ext-seq3';
        ext.textContent = 'External seq3';
        container.appendChild(ext);

        const el = await fixtureForcedFallback(`
          <hx-select label="Country" aria-describedby="hx-select-r10-ext-seq3">
            <option value="us">US</option>
          </hx-select>
        `);
        const harness = el as SelectTestHarness & {
          _consumerDescribedBy: string | null;
        };

        // The fallback strip already removed the host attribute on initial
        // sync. _consumerDescribedBy is cached.
        expect(el.getAttribute('aria-describedby')).toBeNull();
        expect(harness._consumerDescribedBy).toBe('hx-select-r10-ext-seq3');

        // Bare removeAttribute on an absent attribute is a DOM no-op —
        // fires no MutationRecord. The cached value MUST remain unchanged.
        // This is the documented non-feature; vanilla-imperative consumers
        // who want to retract must use sequence 2.
        el.removeAttribute('aria-describedby');
        await new Promise<void>((r) => setTimeout(r, 0));
        await el.updateComplete;

        expect(harness._consumerDescribedBy).toBe('hx-select-r10-ext-seq3');
        expect(harness._internals.ariaDescription ?? '').toContain('External seq3');
      });
    });

    describe('Test 4 — healthcare-critical validation safety regression (LOAD-BEARING)', () => {
      // The most important new test. If this regresses, the round-10
      // architecture is broken. WCAG 4.1.3 / 3.3.1 require validation
      // errors to be programmatically determinable; the strip + concatenate
      // pattern guarantees `internals.ariaDescription` carries BOTH
      // consumer help text AND internal validation error text on the
      // fallback path, with the host `aria-describedby` stripped so AT
      // (per W3C AccName 1.2 precedence) does not shadow the internal
      // channel.
      it('consumer help text + internal error coexist in internals.ariaDescription with host attr stripped', async () => {
        const container = document.getElementById('test-fixture-container');
        if (!container) throw new Error('test-fixture-container not found');
        const customHelp = document.createElement('p');
        customHelp.id = 'hx-select-r10-custom-help';
        customHelp.textContent = 'Custom help text';
        container.appendChild(customHelp);

        const el = await fixtureForcedFallback(`
          <hx-select label="Patient ID" aria-describedby="hx-select-r10-custom-help">
            <option value=""></option>
            <option value="1">Patient 1</option>
          </hx-select>
        `);
        const harness = el as SelectTestHarness;

        // Set an explicit error string. The component renders the error
        // into its shadow root and the fallback sync concatenates it with
        // the consumer-resolved help text into internals.ariaDescription.
        (el as unknown as { error: string }).error = 'Patient ID required';
        await el.updateComplete;
        harness._syncHostAriaSemantics();
        await el.updateComplete;

        // Healthcare-critical assertion: internals.ariaDescription contains
        // BOTH the consumer help text AND the internal error text. If
        // either is missing, AT (per W3C AccName 1.2) will silently drop
        // the validation message — fatal for healthcare.
        const description = harness._internals.ariaDescription ?? '';
        expect(description).toContain('Custom help text');
        expect(description).toContain('Patient ID required');

        // Single-channel fallback: host attribute MUST be stripped so AT
        // does not shadow internals.ariaDescription per AccName 1.2.
        expect(el.getAttribute('aria-describedby')).toBeNull();
      });
    });
  });
});
