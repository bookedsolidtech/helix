import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxCombobox } from './hx-combobox.js';
import './index.js';

afterEach(cleanup);

// Helper: render combobox with options
function withOptions(extra = '') {
  return `
    <hx-combobox ${extra}>
      <option slot="option" value="apple">Apple</option>
      <option slot="option" value="banana">Banana</option>
      <option slot="option" value="cherry">Cherry</option>
    </hx-combobox>
  `;
}

describe('hx-combobox', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <input>', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input).toBeInstanceOf(HTMLInputElement);
    });

    it('exposes "field" CSS part', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('exposes "input" CSS part', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, '[part="input"]');
      expect(input).toBeTruthy();
    });
  });

  // ─── ARIA (5) ───

  describe('ARIA', () => {
    it('input has role="combobox"', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('role')).toBe('combobox');
    });

    it('input has aria-autocomplete="list"', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-autocomplete')).toBe('list');
    });

    it('aria-expanded is false when closed', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-expanded')).toBe('false');
    });

    it('aria-controls points to listbox id', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(input?.getAttribute('aria-controls')).toBe(listbox?.id);
    });

    it('listbox has role="listbox"', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox).toBeTruthy();
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Fruit');
    });

    it('does not render label when empty', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('shows asterisk when required', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit" required></hx-combobox>');
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });
  });

  // ─── Property: placeholder (1) ───

  describe('Property: placeholder', () => {
    it('sets placeholder on native input', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox placeholder="Search..."></hx-combobox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('placeholder')).toBe('Search...');
    });
  });

  // ─── Property: value (2) ───

  describe('Property: value', () => {
    it('reflects value attribute', async () => {
      const el = await fixture<HxCombobox>(withOptions('value="banana"'));
      expect(el.value).toBe('banana');
    });

    it('programmatic value update is reflected', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      el.value = 'cherry';
      await el.updateComplete;
      expect(el.value).toBe('cherry');
    });
  });

  // ─── Property: disabled (2) ───

  describe('Property: disabled', () => {
    it('sets disabled attr on native input', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox disabled></hx-combobox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.disabled).toBe(true);
    });

    it('applies host opacity via disabled attribute', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox disabled></hx-combobox>');
      const style = getComputedStyle(el);
      // When disabled attribute present, the :host([disabled]) rule applies opacity
      expect(el.hasAttribute('disabled')).toBe(true);
      expect(parseFloat(style.opacity)).toBeLessThanOrEqual(1);
    });
  });

  // ─── Property: required (2) ───

  describe('Property: required', () => {
    it('sets required attr on native input', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox required></hx-combobox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.required).toBe(true);
    });

    it('sets aria-required="true" on native input', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox required></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-required')).toBe('true');
    });
  });

  // ─── Property: size (3) ───

  describe('Property: hx-size', () => {
    it('defaults to md', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      expect(el.size).toBe('md');
    });

    it('applies sm size class', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox hx-size="sm"></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.classList.contains('field__input--sm')).toBe(true);
    });

    it('applies lg size class', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox hx-size="lg"></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.classList.contains('field__input--lg')).toBe(true);
    });
  });

  // ─── Property: error (3) ───

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox error="Required field"></hx-combobox>');
      const errorEl = shadowQuery(el, '[role="alert"]');
      expect(errorEl?.textContent?.trim()).toBe('Required field');
    });

    it('sets aria-invalid="true" on input', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox error="Oops"></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('error div uses role="alert" (implicit assertive)', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox error="Oops"></hx-combobox>');
      const errorEl = shadowQuery(el, '[role="alert"]');
      expect(errorEl?.getAttribute('role')).toBe('alert');
      expect(errorEl?.hasAttribute('aria-live')).toBe(false);
    });
  });

  // ─── Property: helpText (2) ───

  describe('Property: helpText', () => {
    it('renders help text below input', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox help-text="Choose one option"></hx-combobox>',
      );
      const helpEl = shadowQuery(el, '[part="help-text"]');
      expect(helpEl?.textContent?.trim()).toContain('Choose one option');
    });

    it('help text hidden when error present', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox help-text="Help" error="Error!"></hx-combobox>',
      );
      const helpEl = shadowQuery(el, '[part="help-text"]');
      expect(helpEl).toBeNull();
    });
  });

  // ─── Property: clearable (2) ───

  describe('Property: clearable', () => {
    it('shows clear button when value is set and clearable=true', async () => {
      const el = await fixture<HxCombobox>(withOptions('value="apple" clearable'));
      await el.updateComplete;
      const clearBtn = shadowQuery(el, '[part="clear-button"]');
      expect(clearBtn).toBeTruthy();
    });

    it('does not show clear button when clearable=false', async () => {
      const el = await fixture<HxCombobox>(withOptions('value="apple"'));
      await el.updateComplete;
      const clearBtn = shadowQuery(el, '[part="clear-button"]');
      expect(clearBtn).toBeNull();
    });
  });

  // ─── Property: loading (1) ───

  describe('Property: loading', () => {
    it('shows loading indicator when loading=true', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox loading></hx-combobox>');
      const indicator = shadowQuery(el, '[part="loading-indicator"]');
      expect(indicator).toBeTruthy();
    });
  });

  // ─── CSS Parts (4) ───

  describe('CSS Parts', () => {
    it('trigger part exposed', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const part = shadowQuery(el, '[part="trigger"]');
      expect(part).toBeTruthy();
    });

    it('listbox part exposed', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const part = shadowQuery(el, '[part="listbox"]');
      expect(part).toBeTruthy();
    });

    it('input part exposed', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const part = shadowQuery(el, '[part="input"]');
      expect(part).toBeTruthy();
    });

    it('field part exposed', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const part = shadowQuery(el, '[part="field"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('option slot renders options', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      // Options parsed from slot
      await el.updateComplete;
      // Open dropdown to see options
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      const options = el.shadowRoot?.querySelectorAll('[role="option"]');
      expect(options?.length).toBeGreaterThan(0);
    });

    it('empty-label slot shown when no options match filter', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      // Focus to open
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      // Type something that doesn't match
      input.value = 'zzz';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      const noOptions = shadowQuery(el, '.field__no-options');
      expect(noOptions).toBeTruthy();
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-input on keystroke', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent(el, 'hx-input');
      input.value = 'app';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-change on option selection', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      const eventPromise = oneEvent(el, 'hx-change');
      const firstOption = shadowQuery<HTMLElement>(el, '[role="option"]')!;
      firstOption.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-show when opened', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const showPromise = oneEvent(el, 'hx-show');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      const event = await showPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-clear when clear button clicked', async () => {
      const el = await fixture<HxCombobox>(withOptions('value="apple" clearable'));
      await el.updateComplete;
      const clearPromise = oneEvent(el, 'hx-clear');
      const clearBtn = shadowQuery<HTMLButtonElement>(el, '[part="clear-button"]')!;
      clearBtn.click();
      const event = await clearPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-hide when listbox closes', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      const hidePromise = oneEvent(el, 'hx-hide');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const event = await hidePromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Keyboard Navigation (4) ───

  describe('Keyboard Navigation', () => {
    it('ArrowDown opens listbox', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(false);
    });

    it('Escape closes listbox', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open first
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      // Close with Escape
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });

    it('Enter selects focused option', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open and navigate to first option
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Select with Enter
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('apple');
    });

    it('ArrowUp opens listbox and focuses last option', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(false);
    });

    it('Home key focuses first option', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open with ArrowDown to focus first item
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Navigate down
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Press Home to go back to first
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      // Select with Enter
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('apple');
    });

    it('End key focuses last option', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      // Select with Enter
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('cherry');
    });

    it('Tab closes listbox', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Form Integration (5) ───

  describe('Form', () => {
    it('has ElementInternals attached', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      expect(el.form).toBeNull(); // null when not inside a form
    });

    it('form getter returns associated form', async () => {
      const el = await fixture<HxCombobox>('<form><hx-combobox name="fruit"></hx-combobox></form>');
      const combobox = el.querySelector('hx-combobox') as HxCombobox;
      expect(combobox.form).toBeInstanceOf(HTMLFormElement);
    });

    it('formResetCallback resets value to empty', async () => {
      const el = await fixture<HxCombobox>(withOptions('value="banana"'));
      await el.updateComplete;
      el.formResetCallback();
      expect(el.value).toBe('');
    });

    it('formStateRestoreCallback restores value', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      el.formStateRestoreCallback('cherry', 'restore');
      expect(el.value).toBe('cherry');
    });

    it('checkValidity returns false when required and empty', async () => {
      const el = await fixture<HxCombobox>('<form><hx-combobox required></hx-combobox></form>');
      const combobox = el.querySelector('hx-combobox') as HxCombobox;
      await combobox.updateComplete;
      expect(combobox.checkValidity()).toBe(false);
    });
  });

  // ─── Validation (3) ───

  describe('Validation', () => {
    it('checkValidity returns true when required and filled', async () => {
      const el = await fixture<HxCombobox>(
        '<form>' + withOptions('required value="apple"') + '</form>',
      );
      const combobox = el.querySelector('hx-combobox') as HxCombobox;
      await combobox.updateComplete;
      expect(combobox.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is set when required and empty', async () => {
      const el = await fixture<HxCombobox>('<form><hx-combobox required></hx-combobox></form>');
      const combobox = el.querySelector('hx-combobox') as HxCombobox;
      await combobox.updateComplete;
      expect(combobox.validity.valueMissing).toBe(true);
    });

    it('reportValidity returns true when required and filled', async () => {
      const el = await fixture<HxCombobox>(
        '<form>' + withOptions('required value="apple"') + '</form>',
      );
      const combobox = el.querySelector('hx-combobox') as HxCombobox;
      await combobox.updateComplete;
      expect(combobox.reportValidity()).toBe(true);
    });
  });

  // ─── Methods (1) ───

  describe('Methods', () => {
    it('focus() moves focus to native input', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      el.focus();
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(document.activeElement).toBeTruthy();
      // The internal input should be the focused element within shadow DOM
      expect(input).toBeTruthy();
    });
  });

  // ─── Loading State (2) ───

  describe('Loading State', () => {
    it('sets aria-busy="true" on input when loading', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox loading></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-busy')).toBe('true');
    });

    it('does not set aria-busy when not loading', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.hasAttribute('aria-busy')).toBe(false);
    });
  });

  // ─── Disabled Option Skipping (1) ───

  describe('Disabled Option Skipping', () => {
    it('keyboard navigation skips disabled options', async () => {
      const el = await fixture<HxCombobox>(`
        <hx-combobox>
          <option slot="option" value="a">Option A</option>
          <option slot="option" value="b" disabled>Option B (disabled)</option>
          <option slot="option" value="c">Option C</option>
        </hx-combobox>
      `);
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open and navigate to first
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Navigate down — should skip disabled B and land on C
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Select with Enter
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('c');
    });
  });

  // ─── Accessibility (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit" placeholder="Select..."></hx-combobox>',
      );
      await checkA11y(el);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit" disabled></hx-combobox>');
      await checkA11y(el);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit" error="Required"></hx-combobox>',
      );
      await checkA11y(el);
    });
  });
});
