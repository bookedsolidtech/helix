import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  fixture,
  shadowQuery,
  oneEvent,
  cleanup,
  checkA11y,
  formFixture,
  getFormData,
  resetForm,
} from '../../test-utils.js';
import { HelixCombobox, type HxCombobox } from './hx-combobox.js';
import './index.js';

afterEach(cleanup);

// Round-5 finding 3 (defense-in-depth): the static
// `__testSupportsIdrefRefsOverride` seam is a single field shared across
// all instances and across the whole Vitest worker. This global teardown
// guarantees the seam is reset between every test regardless of where
// it was set.
afterEach(() => {
  (
    HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
  ).__testSupportsIdrefRefsOverride = null;
});

/**
 * Strongly-typed harness for the private internals the suite reaches into.
 * Mirrors the Group 2 hx-radio-group test pattern.
 */
type ComboboxTestHarness = HxCombobox & {
  _internals: ElementInternals;
  _supportsIdrefRefs: boolean;
  _syncHostAriaSemantics(): void;
};

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

  // ─── APG editable-combobox ARIA (option I) ───

  describe('APG editable-combobox ARIA (option I)', () => {
    it('inner input has role="combobox" (replaces implicit textbox)', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('role')).toBe('combobox');
    });

    it('host has NO role attribute (F1 regression)', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      expect(el.getAttribute('role')).toBeNull();
    });

    it('host has NO tabindex attribute (F1 regression)', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      expect(el.hasAttribute('tabindex')).toBe(false);
    });

    it('host has NO combobox-state aria-* attributes (F1/F2 regression)', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit" required loading></hx-combobox>',
      );
      await el.updateComplete;
      // No host-level combobox state ARIA: AT must read these from the inner input.
      expect(el.hasAttribute('aria-expanded')).toBe(false);
      expect(el.hasAttribute('aria-controls')).toBe(false);
      expect(el.hasAttribute('aria-haspopup')).toBe(false);
      expect(el.hasAttribute('aria-autocomplete')).toBe(false);
      expect(el.hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('inner input aria-expanded is "false" when closed', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-expanded')).toBe('false');
    });

    it('inner input aria-expanded is "true" when open', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      expect(input.getAttribute('aria-expanded')).toBe('true');
    });

    it('inner input has aria-haspopup="listbox"', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('inner input has aria-autocomplete="list"', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-autocomplete')).toBe('list');
    });

    it('inner input aria-controls points to listbox id (same shadow root)', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(input?.getAttribute('aria-controls')).toBe(listbox?.id);
    });

    it('inner input aria-controls references an element in the same shadow root', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const input = shadowQuery(el, 'input');
      const controlsId = input?.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
      const referencedEl = el.shadowRoot?.getElementById(controlsId!);
      expect(referencedEl).toBeTruthy();
      expect(referencedEl?.getAttribute('role')).toBe('listbox');
    });

    it('inner input is the focusable surface (uses native disabled instead of tabindex)', async () => {
      const enabled = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      const enabledInput = shadowQuery<HTMLInputElement>(enabled, 'input');
      // Native form input is focusable when not disabled; no tabindex override.
      expect(enabledInput?.disabled).toBe(false);

      const disabled = await fixture<HxCombobox>('<hx-combobox disabled></hx-combobox>');
      const disabledInput = shadowQuery<HTMLInputElement>(disabled, 'input');
      expect(disabledInput?.disabled).toBe(true);
    });

    it('inner input has aria-disabled="true" when disabled', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox disabled></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-disabled')).toBe('true');
    });

    it('inner input aria-required="true" when required', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox required></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-required')).toBe('true');
    });

    it('inner input aria-invalid="true" when invalid (required + empty)', async () => {
      const el = await fixture<HxCombobox>(
        '<form><hx-combobox required></hx-combobox></form>',
      );
      const combobox = el.querySelector('hx-combobox') as HxCombobox;
      await combobox.updateComplete;
      const input = shadowQuery(combobox, 'input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('inner input aria-busy="true" when loading', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox loading></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-busy')).toBe('true');
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

    it('sets aria-required="true" on inner input when required (APG editable combobox)', async () => {
      // W3C APG editable combobox: `aria-required` lives on the inner input,
      // which carries `role="combobox"`. The host carries no combobox ARIA.
      const el = await fixture<HxCombobox>('<hx-combobox required></hx-combobox>');
      await el.updateComplete;
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

    it('sets aria-invalid="true" on inner input when invalid (APG editable combobox)', async () => {
      // W3C APG editable combobox: `aria-invalid` lives on the inner input.
      const el = await fixture<HxCombobox>(
        '<form><hx-combobox required error="Required"></hx-combobox></form>',
      );
      const combobox = el.querySelector('hx-combobox') as HxCombobox;
      await combobox.updateComplete;
      const input = shadowQuery(combobox, 'input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('error div does not override role="alert" with aria-live (P1-5 fix)', async () => {
      // role="alert" already implies aria-live="assertive" — explicit aria-live="polite" was invalid
      const el = await fixture<HxCombobox>('<hx-combobox error="Oops"></hx-combobox>');
      const errorEl = shadowQuery(el, '[role="alert"]');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.getAttribute('aria-live')).toBeNull();
    });

    it('error hides help text via the persistent live region (hidden, not removed)', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox error="Error" help-text="Help"></hx-combobox>',
      );
      await el.updateComplete;
      const helpText = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      expect(helpText).toBeTruthy();
      expect(helpText.hasAttribute('hidden')).toBe(true);
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

    it('help text hidden when error present (persistent live region)', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox help-text="Help" error="Error!"></hx-combobox>',
      );
      await el.updateComplete;
      const helpText = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      expect(helpText).toBeTruthy();
      expect(helpText.hasAttribute('hidden')).toBe(true);
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
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
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

    it('dispatches hx-hide when listbox closes (P2-9)', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open first
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      // Close with Escape and capture hx-hide
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

    it('ArrowUp opens listbox and focuses last option (P2-11)', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(false);
      // Last option should be focused (cherry = index 2)
      const focusedOption = shadowQuery(el, '.field__option--focused');
      expect(focusedOption).toBeTruthy();
    });

    it('Home key focuses first enabled option (P1-1)', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Open and navigate down past first option
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Press Home to jump to first
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      const options = el.shadowRoot?.querySelectorAll('.field__option--focused');
      expect(options?.length).toBe(1);
    });

    it('End key focuses last enabled option (P1-1)', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(false);
      const focusedOption = shadowQuery(el, '.field__option--focused');
      expect(focusedOption).toBeTruthy();
    });

    it('disabled options are skipped during keyboard navigation (P2-12)', async () => {
      const el = await fixture<HxCombobox>(`
        <hx-combobox>
          <option slot="option" value="apple">Apple</option>
          <option slot="option" value="banana" disabled>Banana</option>
          <option slot="option" value="cherry">Cherry</option>
        </hx-combobox>
      `);
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // ArrowDown twice should skip "banana" (disabled) and land on "cherry"
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      // Select with Enter — should be cherry (not banana)
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe('cherry');
    });
  });

  // ─── Form Integration (5) ───

  // ─── Form Association ───

  describe('Form Association', () => {
    it('submits value in FormData when value is set', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-combobox name="fruit" value="banana">
          <option slot="option" value="apple">Apple</option>
          <option slot="option" value="banana">Banana</option>
        </hx-combobox>
      `;
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-combobox') as HxCombobox;
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('fruit')).toBe('banana');
      form.remove();
    });
  });

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
      // P1-6: Updated signature includes optional mode param
      el.formStateRestoreCallback('cherry', 'restore');
      expect(el.value).toBe('cherry');
    });

    it('checkValidity returns false when required and empty', async () => {
      const el = await fixture<HxCombobox>('<form><hx-combobox required></hx-combobox></form>');
      const combobox = el.querySelector('hx-combobox') as HxCombobox;
      await combobox.updateComplete;
      expect(combobox.checkValidity()).toBe(false);
    });

    it('formDisabledCallback sets disabled when parent fieldset is disabled', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      el.formDisabledCallback(true);
      await el.updateComplete;
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      await el.updateComplete;
      expect(el.disabled).toBe(false);
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

  // ─── Multiple Selection (P0-1) ───

  describe('Multiple Selection', () => {
    it('selecting two options accumulates comma-separated value', async () => {
      const el = await fixture<HxCombobox>(withOptions('multiple'));
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      const options = el.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]');
      options?.[0]?.click(); // apple
      await el.updateComplete;
      options?.[1]?.click(); // banana
      await el.updateComplete;
      expect(el.value).toBe('apple,banana');
    });

    it('clicking selected option in multiple mode deselects it', async () => {
      const el = await fixture<HxCombobox>(withOptions('multiple'));
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      const options = el.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]');
      options?.[0]?.click(); // select apple
      await el.updateComplete;
      options?.[0]?.click(); // deselect apple
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('renders chips for selected values in multiple mode', async () => {
      const el = await fixture<HxCombobox>(withOptions('multiple value="apple,banana"'));
      await el.updateComplete;
      const chips = el.shadowRoot?.querySelectorAll('.field__chip');
      expect(chips?.length).toBe(2);
    });

    it('chip remove button removes that value', async () => {
      const el = await fixture<HxCombobox>(withOptions('multiple value="apple,banana"'));
      await el.updateComplete;
      const removeBtn = shadowQuery<HTMLButtonElement>(el, '.field__chip-remove')!;
      removeBtn.click();
      await el.updateComplete;
      expect(el.value).toBe('banana');
    });

    it('listbox stays open after selection in multiple mode', async () => {
      const el = await fixture<HxCombobox>(withOptions('multiple'));
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      const options = el.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]');
      options?.[0]?.click();
      await el.updateComplete;
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(false);
    });

    it('clear button clears all selected values in multiple mode', async () => {
      const el = await fixture<HxCombobox>(withOptions('multiple value="apple,banana" clearable'));
      await el.updateComplete;
      const clearBtn = shadowQuery<HTMLButtonElement>(el, '[part="clear-button"]')!;
      clearBtn.click();
      await el.updateComplete;
      expect(el.value).toBe('');
      expect(el.shadowRoot?.querySelectorAll('.field__chip').length).toBe(0);
    });
  });

  // ─── Methods (1) ───

  describe('Methods', () => {
    it('focus() moves focus to native input (text entry surface)', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox></hx-combobox>');
      el.focus();
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Shadow DOM focus causes the host to become document.activeElement even
      // though the inner <input> is the actual focused node inside shadow root.
      expect(document.activeElement).toBe(el);
      expect(input).toBeTruthy();
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

  // ─── Property: name (1) ───

  describe('Property: name', () => {
    it('sets name attribute on native input', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox name="fruit"></hx-combobox>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('name')).toBe('fruit');
    });
  });

  // ─── Property: accessibleLabel (2) ───

  describe('Property: accessibleLabel', () => {
    it('writes accessibleLabel onto the inner input as aria-label', async () => {
      // W3C APG editable combobox: accessibleLabel reaches AT via the inner
      // input's aria-label (the input owns role="combobox").
      const el = await fixture<HxCombobox>(
        '<hx-combobox accessible-label="Search fruits"></hx-combobox>',
      );
      await el.updateComplete;
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-label')).toBe('Search fruits');
    });

    it('label property points the inner input aria-labelledby at the rendered <label>', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      const input = shadowQuery(el, 'input');
      const label = shadowQuery(el, 'label');
      expect(label?.id).toBeTruthy();
      expect(input?.getAttribute('aria-labelledby')).toBe(label?.id ?? null);
    });

    it('slotted <span slot="label">Fruit</span> with no id resolves via fallback to input aria-label (F3)', async () => {
      // F3 (P2): on the no-IDL-ref fallback path, slotted element labels
      // without an id must still name the input via aria-label derived from
      // the slotted element's textContent.
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = false;
      const el = await fixture<HxCombobox>(
        '<hx-combobox><span slot="label">Fruit</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery(el, 'input');
      // Either aria-label (fallback when slotted element has no id) or
      // aria-labelledby (if Lit auto-id'd the slotted element, which we don't).
      const ariaLabel = input?.getAttribute('aria-label');
      const ariaLabelledBy = input?.getAttribute('aria-labelledby');
      const named = (ariaLabel ?? '').trim() === 'Fruit' || (ariaLabelledBy ?? '') !== '';
      expect(named).toBe(true);
      // Specifically: when the slotted element has no id, fall back to aria-label.
      expect(input?.getAttribute('aria-label')).toBe('Fruit');
    });

    it('multiple slotted label nodes aggregate into a single accessible name (round-4 F1)', async () => {
      // Round-4 F1 (P2): composed labels (multi-span or icon + text) must
      // expose every assigned element on the modern path and text-flatten
      // every assigned node on the fallback path.
      const el = await fixture<HxCombobox>(
        '<hx-combobox><span slot="label">First</span> <span slot="label">name</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input');
      expect(input).toBeTruthy();
      if (!harness._supportsIdrefRefs) {
        // Fallback path: inner input announces the joined text.
        expect(input?.getAttribute('aria-label')).toMatch(/First.*name/);
      } else {
        // Modern path: internals.ariaLabelledByElements references both spans.
        type InternalsWithIdrefRefs = ElementInternals & {
          ariaLabelledByElements: Element[] | null;
        };
        const internals = harness._internals as InternalsWithIdrefRefs;
        expect(internals.ariaLabelledByElements?.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('multiple slotted label nodes aggregate on the no-IDL-ref fallback path (round-4 F1)', async () => {
      // Force the fallback path so the assertion is unconditional.
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = false;
      const el = await fixture<HxCombobox>(
        '<hx-combobox><svg slot="label" aria-hidden="true"><title>icon</title></svg><span slot="label">Patient</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input');
      // Both fragments contribute to the inner input's aria-label. The svg
      // <title> and the span text both flatten in.
      const ariaLabel = input?.getAttribute('aria-label') ?? '';
      expect(ariaLabel).toContain('Patient');
    });

    it('slotted label in-place textContent mutation triggers aria-label resync (round-4 F2)', async () => {
      // Round-4 F2 (P2): when the consumer mutates the same slotted node's
      // textContent (i18n re-render), `slotchange` does NOT fire; a dedicated
      // MutationObserver must keep the inner input's announced name in sync.
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = false;
      const el = await fixture<HxCombobox>(
        '<hx-combobox><span slot="label">Original</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input');
      expect(input?.getAttribute('aria-label')).toBe('Original');

      const labelEl = el.querySelector('span[slot="label"]');
      expect(labelEl).toBeTruthy();
      labelEl!.textContent = 'Updated';
      // MutationObserver callbacks are async — wait for one rAF + Lit update.
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await el.updateComplete;
      expect(input?.getAttribute('aria-label')).toBe('Updated');
    });

    it('consumer aria-label on host is mirrored onto inner input', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      el.setAttribute('aria-label', 'Custom override');
      await el.updateComplete;
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-label')).toBe('Custom override');
    });

    it('consumer aria-label removal resumes component-driven label write on inner input', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      el.setAttribute('aria-label', 'Custom override');
      await el.updateComplete;
      el.removeAttribute('aria-label');
      await el.updateComplete;
      (el as unknown as { _syncHostAriaSemantics(): void })._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery(el, 'input');
      // After the consumer retracts the override, the component re-writes the
      // label-property-driven name onto the inner input (either as aria-label
      // or aria-labelledby pointing at the internal <label>).
      const named =
        (input?.getAttribute('aria-label') ?? '').includes('Fruit') ||
        !!input?.getAttribute('aria-labelledby');
      expect(named).toBe(true);
    });
  });

  // ─── ARIA: describedby (inner input) ───

  describe('ARIA: describedby (inner input)', () => {
    it('inner input aria-describedby references help wrapper when helpText set', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit" help-text="Pick one"></hx-combobox>',
      );
      await el.updateComplete;
      const helpDiv = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      const input = shadowQuery(el, 'input');
      const describedBy = input?.getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(/\s+/)).toContain(helpDiv.id);
    });

    it('inner input aria-describedby references error wrapper when error set', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit" error="Required"></hx-combobox>',
      );
      await el.updateComplete;
      const errorDiv = shadowQuery<HTMLElement>(el, '.field__error')!;
      const input = shadowQuery(el, 'input');
      const describedBy = input?.getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(/\s+/)).toContain(errorDiv.id);
    });

    it('drops help wrapper from describedby chain when error is active', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit" help-text="Pick one" error="Required"></hx-combobox>',
      );
      await el.updateComplete;
      const helpDiv = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      const errorDiv = shadowQuery<HTMLElement>(el, '.field__error')!;
      const input = shadowQuery(el, 'input');
      const describedBy = input?.getAttribute('aria-describedby') ?? '';
      const tokens = describedBy.split(/\s+/).filter(Boolean);
      expect(tokens).toContain(errorDiv.id);
      expect(tokens).not.toContain(helpDiv.id);
    });

    it('host has no aria-describedby/aria-labelledby unless the consumer set them', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit" help-text="Pick one"></hx-combobox>',
      );
      await el.updateComplete;
      // The component never WRITES naming/description attributes onto the
      // host — internal label/help/error are forwarded onto the inner input.
      // Round-12 F4: when the consumer does set them, they are preserved on
      // both paths (modern + fallback) so dynamic retraction is observable.
      expect(el.hasAttribute('aria-describedby')).toBe(false);
      expect(el.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  // ─── ARIA: loading and multiple ───

  describe('ARIA: loading and multiple', () => {
    it('sets aria-busy="true" on inner input when loading (APG editable combobox)', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit" loading></hx-combobox>');
      const input = shadowQuery(el, 'input');
      expect(input?.getAttribute('aria-busy')).toBe('true');
    });

    it('sets aria-multiselectable="true" on listbox when multiple', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit" multiple></hx-combobox>');
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.getAttribute('aria-multiselectable')).toBe('true');
    });
  });

  // ─── Additional CSS Parts (4) ───

  describe('CSS Parts (additional)', () => {
    it('label part exposed when label is set', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Test"></hx-combobox>');
      const part = shadowQuery(el, '[part="label"]');
      expect(part).toBeTruthy();
    });

    it('option part exposed when dropdown is open', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      const options = el.shadowRoot?.querySelectorAll('[part="option"]');
      expect(options?.length).toBeGreaterThan(0);
    });

    it('error part exposed when error is set', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox error="Oops"></hx-combobox>');
      const part = shadowQuery(el, '[part="error"]');
      expect(part).toBeTruthy();
    });

    it('help-text part exposed when help-text is set', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox help-text="Help"></hx-combobox>');
      const part = shadowQuery(el, '[part="help-text"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Outside Click (1) ───

  describe('Outside click', () => {
    it('closes dropdown on outside click', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      // Verify open
      const listbox = shadowQuery(el, '[role="listbox"]');
      expect(listbox?.hasAttribute('hidden')).toBe(false);
      // Click outside
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(shadowQuery(el, '[role="listbox"]')?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Filter Debounce (1) ───

  describe('Filter debounce', () => {
    it('delays hx-input event when filterDebounce > 0', async () => {
      vi.useFakeTimers();
      try {
        const el = await fixture<HxCombobox>(withOptions('filter-debounce="200"'));
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        let eventFired = false;
        el.addEventListener('hx-input', () => {
          eventFired = true;
        });
        input.value = 'app';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        // Event should NOT have fired immediately
        expect(eventFired).toBe(false);
        // Advance past the 200ms debounce
        await vi.advanceTimersByTimeAsync(250);
        expect(eventFired).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ─── Accessibility: open state (1) ───

  describe('Accessibility (open state)', () => {
    it('has no axe violations when open with options', async () => {
      const el = await fixture<HxCombobox>(
        `<hx-combobox label="Fruit" placeholder="Search...">
          <option slot="option" value="apple">Apple</option>
          <option slot="option" value="banana">Banana</option>
        </hx-combobox>`,
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      await checkA11y(el, { rules: { 'color-contrast': { enabled: false } } });
    });
  });

  // ─── Slot projection ───

  describe('Slot projection', () => {
    it('projects option elements into the option slot', async () => {
      const el = await fixture<HxCombobox>(
        `<hx-combobox label="Fruit">
          <option slot="option" value="apple">Apple</option>
          <option slot="option" value="banana">Banana</option>
        </hx-combobox>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="option"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(2);
      expect((assigned[0] as HTMLElement).textContent).toContain('Apple');
    });

    it('projects content into the label slot', async () => {
      const el = await fixture<HxCombobox>(
        `<hx-combobox><span slot="label">Choose fruit</span></hx-combobox>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="label"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Choose fruit');
    });

    it('projects content into the error slot', async () => {
      const el = await fixture<HxCombobox>(
        `<hx-combobox label="Fruit"><span slot="error">Required</span></hx-combobox>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="error"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Required');
    });

    it('projects content into the help-text slot', async () => {
      const el = await fixture<HxCombobox>(
        `<hx-combobox label="Fruit" help-text=" "><span slot="help-text">Type to search</span></hx-combobox>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="help-text"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Type to search');
    });
  });

  // ─── i18n / label overrides ───

  describe('i18n / label overrides', () => {
    it('labelRemoveOption returns default English format', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      expect(el.labelRemoveOption('Apple')).toBe('Remove Apple');
    });

    it('labelRemoveOption can be overridden with a custom function', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      el.labelRemoveOption = (option: string) => `Supprimer ${option}`;
      await el.updateComplete;
      expect(el.labelRemoveOption('Pomme')).toBe('Supprimer Pomme');
    });
  });

  // ─── Multiple Selection: edge cases (3) ─────────────────────────────────

  describe('Multiple Selection: edge cases', () => {
    it('handles trailing commas in value without creating empty selections', async () => {
      const el = await fixture<HxCombobox>(withOptions('multiple'));
      el.value = 'apple,,banana,';
      await el.updateComplete;
      const chips = el.shadowRoot?.querySelectorAll('.field__chip');
      expect(chips?.length).toBe(2);
    });

    it('empty value string in multiple mode produces no chips', async () => {
      const el = await fixture<HxCombobox>(withOptions('multiple value=""'));
      await el.updateComplete;
      const chips = el.shadowRoot?.querySelectorAll('.field__chip');
      expect(chips?.length ?? 0).toBe(0);
    });

    it('form value is null when multiple=true and no option is selected', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-combobox name="fruit" multiple>
          <option slot="option" value="apple">Apple</option>
        </hx-combobox>
      `;
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-combobox') as HxCombobox;
      await el.updateComplete;
      expect(el.value).toBe('');
      const data = new FormData(form);
      expect(data.get('fruit')).toBeNull();
      form.remove();
    });
  });

  // ─── Filter: special regex characters in labels (1) ─────────────────────

  describe('Filter: special regex characters in option labels', () => {
    it('does not throw when filtering options with special characters in labels', async () => {
      const el = await fixture<HxCombobox>(`
        <hx-combobox label="Tech">
          <option slot="option" value="cpp">C++</option>
          <option slot="option" value="item1">Item (1)</option>
          <option slot="option" value="dot">file.ext</option>
        </hx-combobox>
      `);
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      let threw = false;
      try {
        input.value = 'C++';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await el.updateComplete;
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
      const options = el.shadowRoot?.querySelectorAll('[role="option"]');
      expect(options?.length).toBe(1);
    });

    it('does not throw when filtering with parentheses in label', async () => {
      const el = await fixture<HxCombobox>(`
        <hx-combobox label="Items">
          <option slot="option" value="item1">Item (1)</option>
          <option slot="option" value="item2">Item (2)</option>
        </hx-combobox>
      `);
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      let threw = false;
      try {
        input.value = 'Item (1)';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await el.updateComplete;
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
      const options = el.shadowRoot?.querySelectorAll('[role="option"]');
      expect(options?.length).toBe(1);
    });
  });

  // ─── filterDebounce === 0: immediate filter (1) ──────────────────────────

  describe('filterDebounce === 0: immediate emission', () => {
    it('fires hx-input immediately without debounce when filterDebounce is 0', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      let eventFired = false;
      el.addEventListener('hx-input', () => {
        eventFired = true;
      });
      input.value = 'app';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(eventFired).toBe(true);
    });
  });

  // ─── Keyboard navigation when all options filtered out (1) ───────────────

  describe('Keyboard navigation: all options filtered out', () => {
    it('arrow keys do not throw when all options are filtered out', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.value = 'zzz';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      const options = el.shadowRoot?.querySelectorAll('[role="option"]');
      expect(options?.length ?? 0).toBe(0);
      let threw = false;
      try {
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
        );
        await el.updateComplete;
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
        );
        await el.updateComplete;
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
        );
        await el.updateComplete;
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
        );
        await el.updateComplete;
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    it('Enter key does nothing when all options filtered out', async () => {
      const el = await fixture<HxCombobox>(withOptions());
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      input.value = 'zzz';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      const valueBefore = el.value;
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;
      expect(el.value).toBe(valueBefore);
    });
  });

  // ─── Slot projection: option elements recognised (1) ─────────────────────

  describe('Slot projection: option element recognition', () => {
    it('slotted option elements are parsed into internal option models', async () => {
      const el = await fixture<HxCombobox>(`
        <hx-combobox label="Fruit">
          <option slot="option" value="mango">Mango</option>
          <option slot="option" value="papaya">Papaya</option>
        </hx-combobox>
      `);
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      const renderedOptions = el.shadowRoot?.querySelectorAll('[role="option"]');
      expect(renderedOptions?.length).toBe(2);
      const labels = Array.from(renderedOptions ?? []).map(
        (o) => o.querySelector('.field__option-label')?.textContent?.trim(),
      );
      expect(labels).toContain('Mango');
      expect(labels).toContain('Papaya');
    });

    it('disabled slotted options are reflected as aria-disabled in the listbox', async () => {
      const el = await fixture<HxCombobox>(`
        <hx-combobox label="Fruit">
          <option slot="option" value="apple">Apple</option>
          <option slot="option" value="durian" disabled>Durian</option>
        </hx-combobox>
      `);
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      input.dispatchEvent(new Event('focus'));
      await el.updateComplete;
      const disabledOption = el.shadowRoot?.querySelector('[role="option"][aria-disabled="true"]');
      expect(disabledOption).toBeTruthy();
      expect(disabledOption?.querySelector('.field__option-label')?.textContent?.trim()).toBe(
        'Durian',
      );
    });
  });

  // ─── Form Integration (ElementInternals lifecycle) ───

  describe('Form Integration (ElementInternals lifecycle)', () => {
    it('FormData contains the selected value on submit', async () => {
      const { el, form } = await formFixture<HxCombobox>(
        'hx-combobox',
        { name: 'fruit', value: 'banana' },
        `<option slot="option" value="apple">Apple</option>
         <option slot="option" value="banana">Banana</option>
         <option slot="option" value="cherry">Cherry</option>`,
      );
      await el.updateComplete;
      const data = getFormData(form);
      expect(data.get('fruit')).toBe('banana');
    });

    it('FormData updates when selection changes programmatically', async () => {
      const { el, form } = await formFixture<HxCombobox>(
        'hx-combobox',
        { name: 'fruit', value: 'apple' },
        `<option slot="option" value="apple">Apple</option>
         <option slot="option" value="cherry">Cherry</option>`,
      );
      await el.updateComplete;
      el.value = 'cherry';
      await el.updateComplete;
      const data = getFormData(form);
      expect(data.get('fruit')).toBe('cherry');
    });

    it('multi-select: FormData contains comma-separated value for all selections', async () => {
      const { el, form } = await formFixture<HxCombobox>(
        'hx-combobox',
        { name: 'fruits', multiple: '' },
        `<option slot="option" value="apple">Apple</option>
         <option slot="option" value="banana">Banana</option>
         <option slot="option" value="cherry">Cherry</option>`,
      );
      await el.updateComplete;
      el.value = 'apple,cherry';
      await el.updateComplete;
      const data = getFormData(form);
      expect(data.get('fruits')).toBe('apple,cherry');
    });

    it('multi-select: FormData is null/empty after all selections are cleared', async () => {
      const { el, form } = await formFixture<HxCombobox>(
        'hx-combobox',
        { name: 'fruits', multiple: '', value: 'apple,banana' },
        `<option slot="option" value="apple">Apple</option>
         <option slot="option" value="banana">Banana</option>`,
      );
      await el.updateComplete;
      el.value = '';
      await el.updateComplete;
      const data = getFormData(form);
      expect(data.get('fruits')).toBeNull();
    });

    it('form.reset() clears selection via formResetCallback', async () => {
      const { el, form } = await formFixture<HxCombobox>(
        'hx-combobox',
        { name: 'fruit', value: 'banana' },
        `<option slot="option" value="apple">Apple</option>
         <option slot="option" value="banana">Banana</option>`,
      );
      await el.updateComplete;
      await resetForm(form);
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('form.reset() causes FormData to omit the field (null value)', async () => {
      const { el, form } = await formFixture<HxCombobox>(
        'hx-combobox',
        { name: 'fruit', value: 'apple' },
        `<option slot="option" value="apple">Apple</option>`,
      );
      await el.updateComplete;
      await resetForm(form);
      await el.updateComplete;
      const data = getFormData(form);
      expect(data.get('fruit')).toBeNull();
    });

    it('required field with no selection fails validity (valueMissing)', async () => {
      const { el } = await formFixture<HxCombobox>(
        'hx-combobox',
        { name: 'required-fruit', required: '' },
        `<option slot="option" value="apple">Apple</option>`,
      );
      await el.updateComplete;
      expect(el.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
    });

    it('required field with a selection passes validity', async () => {
      const { el } = await formFixture<HxCombobox>(
        'hx-combobox',
        { name: 'required-fruit', required: '', value: 'apple' },
        `<option slot="option" value="apple">Apple</option>`,
      );
      await el.updateComplete;
      expect(el.checkValidity()).toBe(true);
    });
  });

  // ─── setValidity anchor (APG editable combobox) ───

  describe('setValidity anchor (inner input)', () => {
    it('setValidity anchor is the inner input (canonical combobox surface)', async () => {
      const el = await fixture<HxCombobox>(
        '<form><hx-combobox label="Fruit" required></hx-combobox></form>',
      );
      const combobox = el.querySelector('hx-combobox') as HxCombobox;
      await combobox.updateComplete;
      const internals = (combobox as ComboboxTestHarness)._internals;
      const input = shadowQuery(combobox, 'input');
      const setValiditySpy = vi.spyOn(internals, 'setValidity');
      // Re-trigger validity by toggling required.
      combobox.required = false;
      await combobox.updateComplete;
      combobox.required = true;
      await combobox.updateComplete;
      // The third argument to setValidity must be the inner input — native
      // validation popups attach to the focusable form-control surface per
      // W3C APG editable combobox pattern.
      const callsWithAnchor = setValiditySpy.mock.calls.filter(
        (args) => args[2] !== undefined,
      );
      if (callsWithAnchor.length > 0) {
        const anchor = callsWithAnchor[callsWithAnchor.length - 1]![2];
        expect(anchor).toBe(input);
      }
    });
  });

  // ─── Round-10 architecture lockdown contracts ───
  // These tests lock in the disconnect-during-strip discipline that eliminates
  // the MutationObserver counter-race defect class.

  describe('Round-10 architecture lockdown: observer counter-race', () => {
    it('rapid setAttribute/removeAttribute cycle does NOT produce infinite loop or thrown error', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      // Force fallback path to exercise the observer strip branch.
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      let threw = false;
      try {
        // Rapid fire: set then remove aria-describedby multiple times.
        for (let i = 0; i < 5; i++) {
          el.setAttribute('aria-describedby', 'some-external-id');
          await el.updateComplete;
          harness._syncHostAriaSemantics();
          await el.updateComplete;
          el.removeAttribute('aria-describedby');
          await el.updateComplete;
          harness._syncHostAriaSemantics();
          await el.updateComplete;
        }
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    it('three retraction sequences complete without observer re-entry', async () => {
      // Three sequences: set-then-consumer-retract (the primary retraction path),
      // set-then-component-strip (the disconnect-during-strip path), and
      // null-on-already-absent (no-op, unobservable).
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      let syncCount = 0;
      const origSync = harness._syncHostAriaSemantics.bind(harness);
      harness._syncHostAriaSemantics = () => {
        syncCount++;
        origSync();
      };

      // Sequence 1: consumer sets, then consumer retracts.
      el.setAttribute('aria-describedby', 'ext-1');
      await el.updateComplete;
      const countBefore1 = syncCount;
      el.removeAttribute('aria-describedby');
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      // Should not spiral — bounded sync count.
      expect(syncCount - countBefore1).toBeLessThan(5);

      // Sequence 2: component-driven strip (sync while attr present).
      el.setAttribute('aria-describedby', 'ext-2');
      await el.updateComplete;
      const countBefore2 = syncCount;
      harness._syncHostAriaSemantics();
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      expect(syncCount - countBefore2).toBeLessThan(5);

      // Sequence 3: removeAttribute when already absent (no-op).
      const countBefore3 = syncCount;
      el.removeAttribute('aria-describedby');
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      // No mutation → observer cannot fire → syncCount unchanged.
      expect(syncCount - countBefore3).toBeLessThan(3);
    });

    it('_syncHostAriaSemantics() must be callable after updateComplete (healthcare-critical LOAD-BEARING)', async () => {
      // This test locks in the explicit-sync contract. On the fallback path,
      // _syncHostAriaSemantics must reliably propagate property changes onto
      // the inner input's ARIA attributes.
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery(el, 'input');

      // Label change propagates to the inner input's accessible name.
      el.label = 'Updated Fruit';
      await el.updateComplete;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const labelEl = shadowQuery(el, 'label');
      const named =
        input?.getAttribute('aria-labelledby') === labelEl?.id ||
        input?.getAttribute('aria-label') === 'Updated Fruit';
      expect(named).toBe(true);

      // Error change propagates: inner input's aria-describedby includes the error wrapper id.
      el.error = 'Required field';
      await el.updateComplete;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const errorEl = shadowQuery<HTMLElement>(el, '.field__error')!;
      const describedBy1 = input?.getAttribute('aria-describedby') ?? '';
      expect(describedBy1.split(/\s+/)).toContain(errorEl.id);

      // Clearing error removes it from the description chain.
      el.error = '';
      await el.updateComplete;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const describedBy2 = input?.getAttribute('aria-describedby') ?? '';
      expect(describedBy2.split(/\s+/)).not.toContain(errorEl.id);
    });
  });

  // ─── F1: cross-shadow consumer aria-labelledby/aria-describedby ───
  // Regression suite for the codex F1 (HIGH) finding: writing
  // `aria-labelledby="<light-DOM id>"` on the shadow-DOM inner input is
  // AT-anonymous because light-DOM ids do not resolve from inside a shadow
  // root. The fix is belt-and-suspenders: ElementInternals IDL element
  // references on the host (modern path) PLUS text-flatten onto the inner
  // input's `aria-label` / synthesized in-shadow `aria-describedby` mirror
  // (works on every AT). Round-5 F1 (P1): descriptions are unified through
  // `aria-describedby` only — `aria-description` is never written, since
  // W3C AccName ignores it whenever `aria-describedby` is also present.

  describe('F1 regression: consumer aria-labelledby/aria-describedby with light-DOM target', () => {
    it('consumer aria-labelledby on host with light-DOM target — modern path uses internals.ariaLabelledByElements + flattened aria-label', async () => {
      const ext = document.createElement('label');
      ext.id = 'ext-name';
      ext.textContent = 'Patient name';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="ext-name"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        // Force modern path explicitly so this assertion is platform-stable.
        harness._supportsIdrefRefs = true;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        type InternalsWithRefs = ElementInternals & {
          ariaLabelledByElements: Element[] | null;
        };
        const internals = harness._internals as InternalsWithRefs;
        // Modern path: ElementInternals carries the live element reference.
        expect(internals.ariaLabelledByElements).not.toBeNull();
        expect(internals.ariaLabelledByElements).toContain(ext);
        // Belt-and-suspenders: inner input has the flattened text as aria-label.
        expect(input.getAttribute('aria-label')).toBe('Patient name');
        // Modern path preserves the host attribute so AT walking the DOM also
        // resolves the reference.
        expect(el.getAttribute('aria-labelledby')).toBe('ext-name');
        // Inner input does NOT receive the bogus light-DOM id reference.
        expect(input.getAttribute('aria-labelledby')).not.toBe('ext-name');
      } finally {
        ext.remove();
      }
    });

    it('consumer aria-labelledby on host with light-DOM target — fallback path text-flattens to inner input aria-label', async () => {
      const ext = document.createElement('label');
      ext.id = 'ext-name-fb';
      ext.textContent = 'Patient name';
      document.body.appendChild(ext);
      try {
        (
          HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
        ).__testSupportsIdrefRefsOverride = false;
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="ext-name-fb"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        // Fallback path: inner input announces via text-flattened aria-label.
        expect(input.getAttribute('aria-label')).toBe('Patient name');
        // Inner input does NOT carry the bogus cross-shadow id reference.
        expect(input.getAttribute('aria-labelledby')).not.toBe('ext-name-fb');
        // Round-12 F4: fallback path leaves the host attribute IN PLACE so
        // dynamic retraction is observable via live `getAttribute`. Host is
        // roleless so the attribute has no AT effect.
        expect(el.getAttribute('aria-labelledby')).toBe('ext-name-fb');
      } finally {
        ext.remove();
      }
    });

    it('consumer aria-describedby on host with light-DOM target — modern path uses internals.ariaDescribedByElements + synthesized in-shadow describedby span', async () => {
      const help = document.createElement('span');
      help.id = 'ext-help';
      help.textContent = 'Type to filter';
      document.body.appendChild(help);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox label="Search" aria-describedby="ext-help"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._supportsIdrefRefs = true;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        type InternalsWithRefs = ElementInternals & {
          ariaDescribedByElements: Element[] | null;
        };
        const internals = harness._internals as InternalsWithRefs;
        expect(internals.ariaDescribedByElements).not.toBeNull();
        expect(internals.ariaDescribedByElements).toContain(help);
        // Round-5 F1 (P1): consumer description is mirrored into a
        // synthesized in-shadow span and surfaced through aria-describedby
        // so AT picks it up through the standard channel. aria-description
        // is NOT used (W3C AccName ignores it once aria-describedby exists).
        expect(input.hasAttribute('aria-description')).toBe(false);
        const consumerSpan = el.shadowRoot!.querySelector<HTMLElement>(
          '[id$="-consumer-desc"]',
        );
        expect(consumerSpan).toBeTruthy();
        expect(consumerSpan!.textContent).toBe('Type to filter');
        const innerDescribedBy = input.getAttribute('aria-describedby') ?? '';
        const tokens = innerDescribedBy.split(/\s+/).filter(Boolean);
        expect(tokens).toContain(consumerSpan!.id);
        // The inner input's aria-describedby still does NOT carry the
        // cross-shadow consumer id directly — only the in-shadow mirror id.
        expect(tokens).not.toContain('ext-help');
        // Modern path preserves the host attribute.
        expect(el.getAttribute('aria-describedby')).toBe('ext-help');
      } finally {
        help.remove();
      }
    });

    it('consumer aria-describedby on host with light-DOM target — fallback path mirrors text into synthesized in-shadow describedby span', async () => {
      const help = document.createElement('span');
      help.id = 'ext-help-fb';
      help.textContent = 'Type to filter';
      document.body.appendChild(help);
      try {
        (
          HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
        ).__testSupportsIdrefRefsOverride = false;
        const el = await fixture<HxCombobox>(
          '<hx-combobox label="Search" aria-describedby="ext-help-fb"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        // Round-5 F1 (P1): aria-description must NOT be present on the
        // inner input — descriptions flow through aria-describedby exclusively.
        expect(input.hasAttribute('aria-description')).toBe(false);
        const consumerSpan = el.shadowRoot!.querySelector<HTMLElement>(
          '[id$="-consumer-desc"]',
        );
        expect(consumerSpan).toBeTruthy();
        expect(consumerSpan!.textContent).toBe('Type to filter');
        const innerDescribedBy = input.getAttribute('aria-describedby') ?? '';
        const tokens = innerDescribedBy.split(/\s+/).filter(Boolean);
        expect(tokens).toContain(consumerSpan!.id);
        expect(tokens).not.toContain('ext-help-fb');
        // Round-12 F4: fallback path leaves the host attribute IN PLACE so
        // dynamic retraction is observable via live `getAttribute`. Host is
        // roleless so the attribute has no AT effect.
        expect(el.getAttribute('aria-describedby')).toBe('ext-help-fb');
      } finally {
        help.remove();
      }
    });
  });

  // ─── Round-5 codex push-gate regressions ───
  // Coverage for the round-5 push-gate findings against the round-4 head.
  // F1 (P1): aria-describedby unification — consumer descriptions cannot be
  // routed through aria-description when help/error text is also present,
  // because W3C AccName drops aria-description whenever aria-describedby is
  // also set. F2 (P2): slot-derived ARIA state must be available on the
  // first sync so AT does not see a transient unnamed control.

  describe('Round-5 F1: consumer descriptions preserved when help/error text is present', () => {
    it('inner input aria-describedby contains BOTH the synthesized consumer-desc id AND the internal help id', async () => {
      const ext = document.createElement('span');
      ext.id = 'ext-help-merged';
      ext.textContent = 'External';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox help-text="Pick one" aria-describedby="ext-help-merged"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        const consumerSpan = el.shadowRoot!.querySelector<HTMLElement>(
          '[id$="-consumer-desc"]',
        )!;
        const helpDiv = shadowQuery<HTMLElement>(el, '.field__help-text')!;
        // Both descriptions are reachable through the same channel.
        const tokens = (input.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean);
        expect(tokens).toContain(consumerSpan.id);
        expect(tokens).toContain(helpDiv.id);
        // The synthesized span carries the consumer-resolved description text.
        expect(consumerSpan.textContent).toBe('External');
        // aria-description is NEVER written — it would be dropped by AccName
        // whenever aria-describedby is also present (always true here once
        // help/error contributes an internal id).
        expect(input.hasAttribute('aria-description')).toBe(false);
      } finally {
        ext.remove();
      }
    });

    it('inner input aria-describedby contains BOTH the synthesized consumer-desc id AND the internal error id when error active', async () => {
      const ext = document.createElement('span');
      ext.id = 'ext-help-err';
      ext.textContent = 'External help';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox help-text="Pick one" error="Required" aria-describedby="ext-help-err"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        const consumerSpan = el.shadowRoot!.querySelector<HTMLElement>(
          '[id$="-consumer-desc"]',
        )!;
        const errorDiv = shadowQuery<HTMLElement>(el, '.field__error')!;
        const helpDiv = shadowQuery<HTMLElement>(el, '.field__help-text')!;
        const tokens = (input.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean);
        // Error displaces the help id but the consumer id stays.
        expect(tokens).toContain(consumerSpan.id);
        expect(tokens).toContain(errorDiv.id);
        expect(tokens).not.toContain(helpDiv.id);
        expect(consumerSpan.textContent).toBe('External help');
        expect(input.hasAttribute('aria-description')).toBe(false);
      } finally {
        ext.remove();
      }
    });

    it('consumer-desc span exists in shadow root from first paint (visually hidden)', async () => {
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      const consumerSpan = el.shadowRoot!.querySelector<HTMLElement>('[id$="-consumer-desc"]');
      expect(consumerSpan).toBeTruthy();
      // No consumer description set → empty content → not contributed to
      // aria-describedby chain.
      expect(consumerSpan!.textContent).toBe('');
      expect(consumerSpan!.classList.contains('field__sr-only')).toBe(true);
    });

    it('clearing consumer aria-describedby empties the synthesized span and drops it from the chain', async () => {
      const ext = document.createElement('span');
      ext.id = 'ext-help-clear';
      ext.textContent = 'External';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox help-text="Pick one" aria-describedby="ext-help-clear"></hx-combobox>',
        );
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        const consumerSpan = el.shadowRoot!.querySelector<HTMLElement>(
          '[id$="-consumer-desc"]',
        )!;
        // Sanity: consumer id is in the chain initially.
        let tokens = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
        expect(tokens).toContain(consumerSpan.id);
        // Retract aria-describedby on the host.
        el.removeAttribute('aria-describedby');
        // Wait for the host MutationObserver to fire and re-sync.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await el.updateComplete;
        tokens = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
        expect(tokens).not.toContain(consumerSpan.id);
        expect(consumerSpan.textContent).toBe('');
        // Internal help id is still in the chain.
        const helpDiv = shadowQuery<HTMLElement>(el, '.field__help-text')!;
        expect(tokens).toContain(helpDiv.id);
      } finally {
        ext.remove();
      }
    });
  });

  describe('Round-5 F2: slot-derived ARIA state seeded before first sync', () => {
    it('slot-only label produces correct inner-input aria-label on first paint (no slotchange wait)', async () => {
      // The component must not require the microtask `slotchange` to have
      // fired before the inner input is named — focusing immediately after
      // mount must report the correct accessible name to AT.
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = false;
      const el = await fixture<HxCombobox>(
        '<hx-combobox><span slot="label">Patient</span></hx-combobox>',
      );
      // After fixture+updateComplete the first updated() cycle has run and
      // firstUpdated() has seeded slot state synchronously. No additional
      // slotchange wait should be required for the inner input to be named.
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Patient');
    });

    it('slot-only help-text contributes its wrapper id to aria-describedby on first paint', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="help-text">Pick one</span></hx-combobox>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpDiv = shadowQuery<HTMLElement>(el, '.field__help-text')!;
      const tokens = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      expect(tokens).toContain(helpDiv.id);
      // The help wrapper itself must NOT be hidden — it has slotted content.
      expect(helpDiv.hasAttribute('hidden')).toBe(false);
    });

    it('slot-only error contributes its wrapper id to aria-describedby on first paint', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="error">Required</span></hx-combobox>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const errorDiv = shadowQuery<HTMLElement>(el, '.field__error')!;
      const tokens = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      expect(tokens).toContain(errorDiv.id);
      // Error wrapper must NOT be hidden — it has slotted content.
      expect(errorDiv.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── slotted error activates inner-input describedby ───

  describe('Slot: error slot activates error state (inner input)', () => {
    it('slotted error contributes the error wrapper id to inner input aria-describedby', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="error">Custom error text</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      el.requestUpdate();
      await el.updateComplete;
      const input = shadowQuery(el, 'input');
      const errorEl = shadowQuery<HTMLElement>(el, '.field__error')!;
      const describedBy = input?.getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(/\s+/)).toContain(errorEl.id);
      // Inner input is the announced combobox surface.
      expect(input?.getAttribute('role')).toBe('combobox');
      // Host has no role.
      expect(el.getAttribute('role')).toBeNull();
    });
  });

  // ─── Round-12 codex push-gate regressions ───
  // Coverage for the four push-gate findings shipped by the deeper codex
  // review against the round-11 head. Each test names the finding (F1-F4)
  // so subsequent regressions trace cleanly.

  describe('Round-12 F1: slotted label with id MUST text-flatten on legacy path', () => {
    it('legacy fallback text-flattens slotted-label textContent and does NOT write the light-DOM id as aria-labelledby', async () => {
      // Round-12 F1 (P1): on engines without ElementInternals IDL element
      // refs, the previous code wrote `slottedLabelEl.id` directly onto the
      // inner input's `aria-labelledby`. That id lives in the light DOM and
      // does NOT resolve from inside the shadow root, so AT saw an unnamed
      // control. The fix is to ALWAYS text-flatten on the legacy path.
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = false;
      const el = await fixture<HxCombobox>(
        '<hx-combobox><span slot="label" id="fruit-label">Fruit</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Inner input announces via flattened textContent.
      expect(input.getAttribute('aria-label')).toBe('Fruit');
      // Inner input MUST NOT carry the light-DOM id reference.
      expect(input.getAttribute('aria-labelledby')).not.toBe('fruit-label');
      expect(input.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('Round-12 F2: accessibleLabel takes precedence over visible label', () => {
    it('explicit accessibleLabel overrides the `label` property on the inner input', async () => {
      // Round-12 F2 (P2): the docstring on `accessibleLabel` describes it
      // as the screen-reader name when it should differ from the visible
      // label. The previous template let `accessible-label` replace
      // `aria-labelledby`; the round-11 head dropped that contract. The
      // fix restores `accessibleLabel` as the top-precedence override.
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Start date" accessible-label="Start date, required"></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // The visible <label> still renders (consumers want both).
      const labelEl = shadowQuery(el, 'label');
      expect(labelEl?.textContent?.trim()).toContain('Start date');
      // But the inner input announces the explicit AT name.
      expect(input.getAttribute('aria-label')).toBe('Start date, required');
      // And does NOT pull the visible label via aria-labelledby.
      expect(input.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  // ─── Round-13 F1 (P2): aria-labelledby outranks aria-label ───
  // W3C AccName 1.2 §4.3.1 precedence: aria-labelledby > aria-label > native.
  // The previous order put host aria-label above a resolved aria-labelledby,
  // so a consumer setting BOTH attributes saw the inner input announce the
  // aria-label string instead of the referenced label's text. The helix-
  // specific `accessibleLabel` property still outranks both — that is
  // documented public-API behavior (Round-3 F2).
  describe('Round-13 F1: aria-labelledby precedence over aria-label', () => {
    it('aria-labelledby + aria-label both set — modern path: ariaLabelledByElements is set, internals.ariaLabel is null', async () => {
      const ext = document.createElement('label');
      ext.id = 'r13-ext-name';
      ext.textContent = 'Patient name';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="r13-ext-name" aria-label="Ignored fallback"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._supportsIdrefRefs = true;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        type InternalsWithRefs = ElementInternals & {
          ariaLabelledByElements: Element[] | null;
          ariaLabel: string | null;
        };
        const internals = harness._internals as InternalsWithRefs;
        // Modern path: live IDREF chain wins.
        expect(internals.ariaLabelledByElements).not.toBeNull();
        expect(internals.ariaLabelledByElements).toContain(ext);
        // internals.ariaLabel must remain null so AccName picks the labelled-
        // by element (an empty/non-null string here would override per spec).
        expect(internals.ariaLabel).toBeNull();
      } finally {
        ext.remove();
      }
    });

    it('aria-labelledby + aria-label both set — fallback path: inner input aria-label is the labelledby text, NOT the host aria-label', async () => {
      const ext = document.createElement('label');
      ext.id = 'r13-ext-name-fb';
      ext.textContent = 'Patient name';
      document.body.appendChild(ext);
      try {
        (
          HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
        ).__testSupportsIdrefRefsOverride = false;
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="r13-ext-name-fb" aria-label="Ignored fallback"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        // Fallback path: inner input announces the LABELLEDBY text, not the
        // host aria-label string. This is the bug fix.
        expect(input.getAttribute('aria-label')).toBe('Patient name');
        expect(input.getAttribute('aria-label')).not.toBe('Ignored fallback');
        // The inner input still does not carry the cross-shadow id reference.
        expect(input.getAttribute('aria-labelledby')).not.toBe('r13-ext-name-fb');
      } finally {
        ext.remove();
      }
    });

    it('aria-labelledby with unresolvable typo + aria-label set — falls through to host aria-label', async () => {
      // Per AccName 1.2: when aria-labelledby cannot be resolved (no element
      // matches the IDREF) it falls through to aria-label. Same here: the
      // labelledby-resolution branch sees an empty element list, the
      // `labelledByFlat` is empty, and we fall to the `hostAriaLabel` branch.
      const el = await fixture<HxCombobox>(
        '<hx-combobox aria-labelledby="r13-typo-does-not-exist" aria-label="Visible name"></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Falls through to aria-label.
      expect(input.getAttribute('aria-label')).toBe('Visible name');
    });

    it('accessibleLabel + aria-labelledby + aria-label all set — accessibleLabel wins (helix override)', async () => {
      // Round-13 F1 (P2): the helix-specific `accessibleLabel` property
      // remains the top of the precedence chain — it is documented public
      // API for AT-only naming (Round-3 F2). Setting it alongside the two
      // standard attributes still produces an inner input named with the
      // accessibleLabel text.
      const ext = document.createElement('label');
      ext.id = 'r13-ext-all';
      ext.textContent = 'Labelledby text';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="r13-ext-all" aria-label="Aria-label text" accessible-label="Override AT name"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._supportsIdrefRefs = false;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        expect(input.getAttribute('aria-label')).toBe('Override AT name');
      } finally {
        ext.remove();
      }
    });
  });

  describe('Round-12 F3: explicit error states mark the field invalid', () => {
    it('inner input has aria-invalid="true" when consumer sets the `error` property', async () => {
      // Round-12 F3 (P2): the round-11 head derived `_invalid` only from
      // `internals.validity.valid`, which `hx-combobox` mutates only for
      // the required-empty case. Server-side / async validation surfaced
      // via `error="..."` did not set `aria-invalid`. The fix ORs the
      // hasError signal into `_invalid` so AT announces invalidity.
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit" error="Server rejected"></hx-combobox>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });

  // ─── Round-6 codex push-gate regressions (group-3 round-6) ───
  // F1 (P2): in-place clear of slotted error/help textContent must flip the
  // corresponding `_has*Slot` state back to false. Without this, the slot
  // observer fires `_syncHostAriaSemantics()` but `_hasErrorSlot` /
  // `_hasHelpSlot` stay `true` indefinitely.
  // F2 (P2): a slotted-label slot containing only decorative (aria-hidden)
  // or empty elements is NOT a usable accessible name — `_labelSource` must
  // fall through to other naming sources (or to the firstUpdated devWarn).

  describe('Round-6 F1: in-place clear of slotted error textContent clears error state', () => {
    it('clearing the same <span slot="error"> textContent flips _hasErrorSlot, clears aria-invalid, and removes error id from inner-input aria-describedby', async () => {
      // Round-6 F1 (P2): consumer keeps the same slotted error node and
      // sets `textContent = ''` (e.g. error toast cleared on next async
      // validation pass). The MutationObserver fires but the previous
      // implementation never re-evaluated `_hasErrorSlot`, leaving the
      // combobox stuck in its error state.
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="error">Required</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const errorEl = shadowQuery<HTMLElement>(el, '.field__error')!;

      // Pre-condition: error state is active.
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect((input.getAttribute('aria-describedby') ?? '').split(/\s+/)).toContain(errorEl.id);

      // Consumer clears textContent on the SAME slotted node — no
      // slotchange, only the in-place text observer fires.
      const errorSpan = el.querySelector('span[slot="error"]')!;
      errorSpan.textContent = '';
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await el.updateComplete;

      // Error state must clear: aria-invalid drops to false (or absent),
      // and the error id is removed from aria-describedby.
      const ariaInvalid = input.getAttribute('aria-invalid');
      expect(ariaInvalid === null || ariaInvalid === 'false').toBe(true);
      const describedBy = input.getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(/\s+/).filter((t) => t)).not.toContain(errorEl.id);
    });
  });

  describe('Round-6 F1: in-place clear of slotted help-text clears help state', () => {
    it('clearing the same <span slot="help-text"> textContent flips _hasHelpSlot and removes help id from inner-input aria-describedby', async () => {
      // Round-6 F1 (P2): same defect class on the help-text slot. An
      // in-place `textContent = ''` must remove the help wrapper id from
      // `aria-describedby`.
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="help-text">Pick one</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpEl = shadowQuery<HTMLElement>(el, '.field__help-text')!;

      // Pre-condition: help id is in aria-describedby.
      expect((input.getAttribute('aria-describedby') ?? '').split(/\s+/)).toContain(helpEl.id);

      // Consumer clears the help text in place.
      const helpSpan = el.querySelector('span[slot="help-text"]')!;
      helpSpan.textContent = '';
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await el.updateComplete;

      // Help id must be gone.
      const describedBy = input.getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(/\s+/).filter((t) => t)).not.toContain(helpEl.id);
    });
  });

  describe('Round-6 F2: decorative-only slotted label is NOT a usable accessible name', () => {
    it('aria-hidden svg alone in slot="label" falls through to other naming sources and devWarn fires when none', async () => {
      // Round-6 F2 (P2): `<svg slot="label" aria-hidden="true">` alone has
      // no accessible-name contribution per AccName 1.2 §4.3.10. The slot
      // must NOT be treated as a usable name, `_labelSource` must NOT be
      // 'slot', and the firstUpdated() devWarn for unnamed combobox must
      // fire.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox><svg slot="label" aria-hidden="true"><title>icon</title></svg></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as unknown as HxCombobox & {
          _hasLabelSlot: boolean;
          _labelSource: 'string' | 'slot' | 'none';
        };
        // Slot is decorative only — no usable name.
        expect(harness._hasLabelSlot).toBe(false);
        expect(harness._labelSource).not.toBe('slot');
        // devWarn fired (no other naming source provided).
        const messages = warnSpy.mock.calls.map((c) => String(c.join(' ')));
        expect(messages.some((m) => m.includes('No accessible label'))).toBe(true);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('decorative svg + visible <span> in slot="label" — fallback path text-flattens to the visible text only, modern path projects ONLY the visible <span> (round-9 F1)', async () => {
      // Round-9 F1 (P2): the modern `internals.ariaLabelledByElements` path
      // MUST filter top-level aria-hidden / hidden slotted elements so AT
      // does not recursively read their <title> / textContent. Otherwise an
      // `<svg slot="label" aria-hidden="true"><title>icon</title></svg>`
      // alongside a visible `<span slot="label">Patient</span>` would
      // announce "icon Patient" on engines with IDL element refs while the
      // fallback path correctly announces only "Patient".
      // Fallback path assertion:
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = false;
      const elFallback = await fixture<HxCombobox>(
        '<hx-combobox><svg slot="label" aria-hidden="true"><title>icon</title></svg><span slot="label">Patient</span></hx-combobox>',
      );
      await elFallback.updateComplete;
      const harnessFallback = elFallback as ComboboxTestHarness;
      harnessFallback._syncHostAriaSemantics();
      await elFallback.updateComplete;
      const inputFallback = shadowQuery<HTMLInputElement>(elFallback, 'input')!;
      // Text flattens to "Patient" — aria-hidden svg contributes zero.
      expect(inputFallback.getAttribute('aria-label')).toBe('Patient');

      // Modern path assertion: ONLY the visible <span> projects via IDL refs.
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = true;
      const elModern = await fixture<HxCombobox>(
        '<hx-combobox><svg slot="label" aria-hidden="true"><title>icon</title></svg><span slot="label">Patient</span></hx-combobox>',
      );
      await elModern.updateComplete;
      const harnessModern = elModern as ComboboxTestHarness;
      harnessModern._syncHostAriaSemantics();
      await elModern.updateComplete;
      type InternalsWithIdrefRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const internals = harnessModern._internals as InternalsWithIdrefRefs;
      // Modern path projects ONLY the visible <span>; the aria-hidden svg
      // is filtered before being forwarded to internals.ariaLabelledByElements.
      expect(internals.ariaLabelledByElements?.length).toBe(1);
      const span = elModern.querySelector('span[slot="label"]');
      expect(internals.ariaLabelledByElements?.[0]).toBe(span);
      // _labelSource is 'slot' because the visible <span> contributes text.
      expect(
        (elModern as unknown as { _labelSource: 'string' | 'slot' | 'none' })._labelSource,
      ).toBe('slot');
    });
  });

  describe('Round-12 F4: legacy fallback retracts host IDREF overrides cleanly', () => {
    it('removing host aria-labelledby on the legacy path clears the cached label and unflattens the inner input', async () => {
      // Round-12 F4 (P2): the round-11 head stripped host
      // `aria-labelledby` immediately on the fallback path, so a later
      // `removeAttribute` was a no-op and the cached consumer token kept
      // flattening stale text onto the inner input. The fix is to leave
      // the host attribute IN PLACE (the host is roleless on both paths,
      // so this has no AT effect) — `getAttribute` becomes the live
      // source of truth and retraction is observable on the next sync.
      const ext = document.createElement('label');
      ext.id = 'ext-name-retract';
      ext.textContent = 'Patient name';
      document.body.appendChild(ext);
      try {
        (
          HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
        ).__testSupportsIdrefRefsOverride = false;
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="ext-name-retract"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        // Pre-condition: inner input flattens the external label text.
        expect(input.getAttribute('aria-label')).toBe('Patient name');

        // Consumer dynamically retracts the host attribute.
        el.removeAttribute('aria-labelledby');
        await el.updateComplete;
        harness._syncHostAriaSemantics();
        await el.updateComplete;

        // Stale flattened text must NOT persist after retraction.
        expect(input.getAttribute('aria-label')).not.toBe('Patient name');
        // Host attribute is gone (consumer retracted it; component never re-adds).
        expect(el.hasAttribute('aria-labelledby')).toBe(false);
      } finally {
        ext.remove();
      }
    });
  });

  describe('Round-7 F1: external IDREF text mutations re-flow into inner input', () => {
    it('mutating textContent of resolved aria-labelledby target updates inner input aria-label', async () => {
      const ext = document.createElement('label');
      ext.id = 'ext-r7-label';
      ext.textContent = 'Patient';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="ext-r7-label"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        expect(input.getAttribute('aria-label')).toBe('Patient');

        // Consumer mutates the resolved external element's text in place.
        // No `slotchange`, no host-attribute change — only the MutationObserver
        // installed by `_installExternalRefsObserver` can detect this.
        ext.textContent = 'Member';

        // Wait for the MutationObserver microtask + Lit re-render.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        await el.updateComplete;

        expect(input.getAttribute('aria-label')).toBe('Member');
      } finally {
        ext.remove();
      }
    });

    it('mutating textContent of resolved aria-describedby target updates synthesized in-shadow desc span', async () => {
      const help = document.createElement('span');
      help.id = 'ext-r7-desc';
      help.textContent = 'Type to filter';
      document.body.appendChild(help);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox label="Search" aria-describedby="ext-r7-desc"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const consumerSpan = el.shadowRoot!.querySelector<HTMLElement>(
          '[id$="-consumer-desc"]',
        );
        expect(consumerSpan).toBeTruthy();
        expect(consumerSpan!.textContent).toBe('Type to filter');

        // In-place mutation on the resolved external description target.
        help.textContent = 'Filter by name';

        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        await el.updateComplete;

        expect(consumerSpan!.textContent).toBe('Filter by name');
      } finally {
        help.remove();
      }
    });
  });

  describe('Round-7 F2: initial error renders without waiting for second update', () => {
    it('error="..." set as initial property renders into the live region on first update', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Search" error="Server rejected"></hx-combobox>',
      );
      // Single updateComplete await — no extra rAF ticks. The eager
      // willUpdate seed must put the text in place before first paint.
      await el.updateComplete;
      const errorSpan = el.shadowRoot!.querySelector<HTMLElement>('.field__error');
      expect(errorSpan).toBeTruthy();
      // The slot fallback (inside the alert region) must already carry the
      // error text — there must be no empty-flash on first paint.
      expect(errorSpan!.textContent?.trim()).toBe('Server rejected');
      // The container is visible (not hidden) because hasError is true.
      expect(errorSpan!.hasAttribute('hidden')).toBe(false);
      // role=alert is set from first paint per the existing contract.
      expect(errorSpan!.getAttribute('role')).toBe('alert');
    });
  });

  // ─── Round-8 codex follow-ups ───

  describe('Round-8 F1: clear internals.ariaLabel with null (not empty string) when accessibleLabel is absent', () => {
    it('modern path leaves internals.ariaLabel === null when label property names the combobox', async () => {
      // Round-8 F1 (P2): per W3C AccName, an explicit empty `aria-label`
      // STILL has higher precedence than `aria-labelledby`. Writing `''`
      // would erase any name resolved from `ariaLabelledByElements`, the
      // `label` property, the slot, or host `aria-labelledby`. The fix
      // CLEARS the override with `null` instead.
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      // Force the modern (IDL refs) path on for this assertion.
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = true;
      harness._supportsIdrefRefs = true;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const internals = harness._internals as ElementInternals & {
        ariaLabel: string | null;
        ariaLabelledByElements: Element[] | null;
      };
      // Critical: must be null, NOT ''.
      expect(internals.ariaLabel).toBeNull();
      // The internal label element should be projected via IDL refs so AT
      // walking up from the focused inner input still finds the name.
      const internalLabel = el.shadowRoot!.querySelector('label');
      expect(internalLabel).toBeTruthy();
      expect(internals.ariaLabelledByElements).not.toBeNull();
      expect(internals.ariaLabelledByElements!.length).toBeGreaterThan(0);
    });

    it('modern path leaves internals.ariaLabel === null when slotted label provides the name', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox><span slot="label">Patient</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = true;
      harness._supportsIdrefRefs = true;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const internals = harness._internals as ElementInternals & {
        ariaLabel: string | null;
        ariaLabelledByElements: Element[] | null;
      };
      expect(internals.ariaLabel).toBeNull();
      // The slotted span MUST be projected via IDL refs.
      expect(internals.ariaLabelledByElements).not.toBeNull();
      expect(internals.ariaLabelledByElements!.length).toBeGreaterThan(0);
    });

    it('modern path forwards explicit accessibleLabel to internals.ariaLabel (regression guard)', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Visible"></hx-combobox>',
      );
      el.accessibleLabel = 'Screen reader name';
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = true;
      harness._supportsIdrefRefs = true;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const internals = harness._internals as ElementInternals & {
        ariaLabel: string | null;
      };
      expect(internals.ariaLabel).toBe('Screen reader name');
    });
  });

  describe('Round-8 F2: flattenText skips aria-hidden / hidden subtrees per AccName 1.2 §4.3.10', () => {
    it('external aria-labelledby target with nested aria-hidden svg/title flattens to the visible text only', async () => {
      // Round-8 F2 (P2): a consumer label like
      //   <label id="x"><svg aria-hidden="true"><title>icon</title></svg>Search</label>
      // MUST flatten to "Search" (not "icon Search") on the inner input
      // fallback aria-label.
      const ext = document.createElement('label');
      ext.id = 'ext-r8-aria-hidden';
      ext.innerHTML =
        '<svg aria-hidden="true" width="12" height="12"><title>icon</title></svg>Search';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="ext-r8-aria-hidden"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        expect(input.getAttribute('aria-label')).toBe('Search');
      } finally {
        ext.remove();
      }
    });

    it('external aria-labelledby target with nested [hidden] descendant flattens to visible text only', async () => {
      // The `hidden` attribute also hides content from AT — must be skipped
      // by the deep walker.
      const ext = document.createElement('label');
      ext.id = 'ext-r8-hidden-attr';
      ext.innerHTML = '<span hidden>foo</span>bar';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="ext-r8-hidden-attr"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        expect(input.getAttribute('aria-label')).toBe('bar');
      } finally {
        ext.remove();
      }
    });

    it('external aria-describedby target with nested aria-hidden content excludes hidden text from synthesized in-shadow desc', async () => {
      const ext = document.createElement('span');
      ext.id = 'ext-r8-desc-aria-hidden';
      ext.innerHTML =
        '<svg aria-hidden="true"><title>icon</title></svg>Type to filter';
      document.body.appendChild(ext);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox label="Search" aria-describedby="ext-r8-desc-aria-hidden"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const consumerSpan = el.shadowRoot!.querySelector<HTMLElement>(
          '[id$="-consumer-desc"]',
        );
        expect(consumerSpan).toBeTruthy();
        expect(consumerSpan!.textContent).toBe('Type to filter');
      } finally {
        ext.remove();
      }
    });

    it('slotted label with nested aria-hidden svg inside a parent span flattens to the visible text only on the fallback path', async () => {
      // Round-8 F2 (P2): a slotted parent like
      //   <span slot="label"><svg aria-hidden="true"><title>icon</title></svg>Patient</span>
      // MUST flatten to "Patient" on the legacy fallback path. The previous
      // code only checked TOP-LEVEL slotted-element aria-hidden — nested
      // decorative content leaked through.
      const el = await fixture<HxCombobox>(
        '<hx-combobox><span slot="label"><svg aria-hidden="true"><title>icon</title></svg>Patient</span></hx-combobox>',
      );
      await el.updateComplete;
      // Force legacy fallback so we hit the text-flatten path on the inner input.
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = false;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Patient');
    });
  });

  // ─── Round-9 codex push-gate findings ───
  describe('Round-9 F1: hidden slotted label/desc elements stay out of internals refs', () => {
    it('aria-hidden svg + visible span in slot="label" — modern path projects ONLY the span', async () => {
      // Round-9 F1 (P2): top-level aria-hidden / hidden slotted nodes MUST
      // be filtered before populating `internals.ariaLabelledByElements`
      // because AT recursively reads referenced elements (including their
      // <title> children) on engines with IDL element refs.
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = true;
      const el = await fixture<HxCombobox>(
        '<hx-combobox><svg slot="label" aria-hidden="true"><title>Search</title></svg><span slot="label">Patient</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      type InternalsWithIdrefRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const internals = harness._internals as InternalsWithIdrefRefs;
      expect(internals.ariaLabelledByElements?.length).toBe(1);
      const span = el.querySelector('span[slot="label"]');
      expect(internals.ariaLabelledByElements?.[0]).toBe(span);
      // The aria-hidden svg is NOT in the projection — its <title> can't
      // leak "Search" into the modern-path accessible name.
      const svg = el.querySelector('svg[slot="label"]');
      expect(internals.ariaLabelledByElements).not.toContain(svg);
    });

    it('hidden attribute on slotted label element also filters from internals refs', async () => {
      (
        HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
      ).__testSupportsIdrefRefsOverride = true;
      const el = await fixture<HxCombobox>(
        '<hx-combobox><span slot="label" hidden>Hidden</span><span slot="label">Patient</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._syncHostAriaSemantics();
      await el.updateComplete;
      type InternalsWithIdrefRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const internals = harness._internals as InternalsWithIdrefRefs;
      expect(internals.ariaLabelledByElements?.length).toBe(1);
      const visible = el.querySelectorAll('span[slot="label"]')[1];
      expect(internals.ariaLabelledByElements?.[0]).toBe(visible);
    });

    it('consumer-resolved external label with aria-hidden top-level is filtered from internals refs', async () => {
      const hiddenExt = document.createElement('label');
      hiddenExt.id = 'r9-ext-hidden';
      hiddenExt.setAttribute('aria-hidden', 'true');
      hiddenExt.textContent = 'Decorative';
      const visibleExt = document.createElement('label');
      visibleExt.id = 'r9-ext-visible';
      visibleExt.textContent = 'Patient name';
      document.body.appendChild(hiddenExt);
      document.body.appendChild(visibleExt);
      try {
        (
          HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
        ).__testSupportsIdrefRefsOverride = true;
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="r9-ext-hidden r9-ext-visible"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        type InternalsWithIdrefRefs = ElementInternals & {
          ariaLabelledByElements: Element[] | null;
        };
        const internals = harness._internals as InternalsWithIdrefRefs;
        expect(internals.ariaLabelledByElements).not.toContain(hiddenExt);
        expect(internals.ariaLabelledByElements).toContain(visibleExt);
      } finally {
        hiddenExt.remove();
        visibleExt.remove();
      }
    });
  });

  describe('Round-9 F2: external label/desc visibility-attr changes resync the inner input', () => {
    it('toggling aria-hidden on the resolved external label resyncs the inner input aria-label', async () => {
      const ext = document.createElement('label');
      ext.id = 'r9-ext-ariahidden-toggle';
      ext.textContent = 'Patient';
      document.body.appendChild(ext);
      try {
        // Force the fallback path so the mirrored aria-label is the
        // observable surface we assert against.
        (
          HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
        ).__testSupportsIdrefRefsOverride = false;
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="r9-ext-ariahidden-toggle"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        // Pre-condition: external label text is mirrored onto the inner input.
        expect(input.getAttribute('aria-label')).toBe('Patient');

        // Consumer hides the label in place — flattenAccName now skips it,
        // so the mirrored aria-label must resync (drop "Patient").
        ext.setAttribute('aria-hidden', 'true');
        // Yield to MutationObserver microtask.
        await new Promise((r) => setTimeout(r, 0));
        await el.updateComplete;
        // The mirrored aria-label should no longer expose stale "Patient".
        expect(input.getAttribute('aria-label')).not.toBe('Patient');
      } finally {
        ext.remove();
      }
    });

    it('toggling hidden attribute on the resolved external label resyncs the inner input aria-label', async () => {
      const ext = document.createElement('label');
      ext.id = 'r9-ext-hidden-toggle';
      ext.textContent = 'Patient';
      document.body.appendChild(ext);
      try {
        (
          HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
        ).__testSupportsIdrefRefsOverride = false;
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="r9-ext-hidden-toggle"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        expect(input.getAttribute('aria-label')).toBe('Patient');

        // Consumer toggles `hidden` on the label.
        ext.setAttribute('hidden', '');
        await new Promise((r) => setTimeout(r, 0));
        await el.updateComplete;
        expect(input.getAttribute('aria-label')).not.toBe('Patient');

        // Removing `hidden` restores the mirrored text.
        ext.removeAttribute('hidden');
        await new Promise((r) => setTimeout(r, 0));
        await el.updateComplete;
        expect(input.getAttribute('aria-label')).toBe('Patient');
      } finally {
        ext.remove();
      }
    });

    it('toggling aria-hidden on a nested descendant of the external label resyncs (subtree attr observation)', async () => {
      const ext = document.createElement('label');
      ext.id = 'r9-ext-nested-toggle';
      const inner = document.createElement('span');
      inner.textContent = 'Patient';
      ext.appendChild(inner);
      document.body.appendChild(ext);
      try {
        (
          HelixCombobox as unknown as { __testSupportsIdrefRefsOverride: boolean | null }
        ).__testSupportsIdrefRefsOverride = false;
        const el = await fixture<HxCombobox>(
          '<hx-combobox aria-labelledby="r9-ext-nested-toggle"></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as ComboboxTestHarness;
        harness._syncHostAriaSemantics();
        await el.updateComplete;
        const input = shadowQuery<HTMLInputElement>(el, 'input')!;
        expect(input.getAttribute('aria-label')).toBe('Patient');

        // Consumer toggles aria-hidden on the inner span (descendant) — only
        // works if the observer enables `subtree: true` + `attributes: true`.
        inner.setAttribute('aria-hidden', 'true');
        await new Promise((r) => setTimeout(r, 0));
        await el.updateComplete;
        expect(input.getAttribute('aria-label')).not.toBe('Patient');
      } finally {
        ext.remove();
      }
    });
  });

  // ─── Round-10 codex follow-ups ───

  describe('Round-10 F1: forcedColorsField is composed into static styles', () => {
    it('forcedColorsField (Field/FieldText/Highlight overrides) participates in the host stylesheet', async () => {
      // Round-10 F1 (P2): the forced-colors mixin emits @media
      // (forced-colors: active) overrides using system colors (Field,
      // FieldText, Highlight, etc.). Dropping it from `static styles`
      // regressed Windows High Contrast accessibility. We verify the mixin
      // is present in the composed styles array AND that one of its
      // signature system-color tokens reaches the adopted stylesheet text.
      const stylesArray = (HelixCombobox as unknown as { styles: unknown[] }).styles;
      expect(Array.isArray(stylesArray)).toBe(true);
      expect(stylesArray.length).toBeGreaterThanOrEqual(2);

      // Render and inspect the adopted stylesheet text for the signature
      // forced-colors block.
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;
      const sheets = el.shadowRoot!.adoptedStyleSheets;
      const allText = Array.from(sheets)
        .flatMap((s) => Array.from(s.cssRules))
        .map((r) => r.cssText)
        .join('\n');
      expect(allText).toMatch(/forced-colors:\s*active/);
      // System-color tokens land somewhere inside the forced-colors block.
      // CSS system-color keywords are case-insensitive and the parsed
      // cssText may serialize them lowercased. Asserting at least one
      // (fieldtext is the most stable across the mixin's history) keeps
      // the test resilient if other tokens churn.
      expect(allText).toMatch(/fieldtext|highlight|field\b/i);
    });
  });

  describe('Round-10 F2: runtime error change populates alert before unhide', () => {
    it('programmatic `el.error = "..."` renders alert text in the SAME frame the container becomes visible', async () => {
      // Round-10 F2 (P2): `error` flips from "" → "Server rejected" at
      // runtime via async/server-side validation. Before the fix,
      // `_announcedError` was updated only in `updated()`, so the first
      // visible frame had a non-hidden alert container with empty
      // textContent — and aria-describedby pointed at the empty wrapper
      // for one cycle. Seeding from `willUpdate` keeps the first visible
      // frame populated.
      const el = await fixture<HxCombobox>('<hx-combobox label="Fruit"></hx-combobox>');
      await el.updateComplete;

      // Pre-condition: no error → alert container is hidden.
      const errorElInitial = el.shadowRoot!.querySelector<HTMLElement>('.field__error');
      expect(errorElInitial?.hasAttribute('hidden') ?? true).toBe(true);

      // Programmatic runtime change.
      el.error = 'Server rejected';
      await el.updateComplete;

      const errorEl = el.shadowRoot!.querySelector<HTMLElement>('.field__error');
      expect(errorEl).toBeTruthy();
      // Container is now visible AND populated in the same frame.
      expect(errorEl!.hasAttribute('hidden')).toBe(false);
      expect(errorEl!.textContent?.trim()).toBe('Server rejected');
      expect(errorEl!.getAttribute('role')).toBe('alert');

      // aria-describedby on the inner input now references the populated
      // error wrapper (not an empty node).
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const describedBy = (input.getAttribute('aria-describedby') ?? '').split(/\s+/);
      expect(describedBy).toContain(errorEl!.id);
    });
  });

  describe('Round-10 F3: slotted help/error effective-text uses AccName flatten', () => {
    it('help slot containing only `<span hidden>foo</span>` does NOT mark the field as having help text', async () => {
      // Round-10 F3 (P3): raw textContent treats `<span hidden>foo</span>`
      // as non-empty, leaving the help wrapper attached and the help id
      // in aria-describedby. The fix uses flattenAccName which honors
      // both `aria-hidden="true"` and the `hidden` attribute per
      // W3C AccName 1.2 §4.3.10.
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="help-text"><span hidden>foo</span></span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpEl = el.shadowRoot!.querySelector<HTMLElement>('.field__help-text');
      // Either the help element is not rendered, or its id is not in
      // aria-describedby. Both outcomes confirm `_hasHelpSlot` is false.
      const describedBy = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(
        (t) => t,
      );
      if (helpEl) {
        expect(describedBy).not.toContain(helpEl.id);
      }
    });

    it('error slot containing only `<span aria-hidden="true">foo</span>` does NOT activate error state', async () => {
      // Round-10 F3 (P3): same defect class on the error slot — purely
      // aria-hidden content must not keep the combobox in its error
      // state. Without flattenAccName, raw textContent would report
      // "foo" and `_hasErrorSlot` would stay true.
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="error"><span aria-hidden="true">foo</span></span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const ariaInvalid = input.getAttribute('aria-invalid');
      expect(ariaInvalid === null || ariaInvalid === 'false').toBe(true);

      const errorEl = el.shadowRoot!.querySelector<HTMLElement>('.field__error');
      const describedBy = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(
        (t) => t,
      );
      if (errorEl) {
        expect(describedBy).not.toContain(errorEl.id);
      }
    });
  });

  describe('Round-11 F1/F2: hidden ROOTS in slot=label/help-text/error contribute zero accessible text', () => {
    // Round-11 F1 (P2): `flattenAccName`'s TreeWalker filter inspects only
    // visited descendants — it never tests the root itself. So a slotted
    // root carrying `hidden` or `aria-hidden="true"` would still flatten
    // its descendants' text, leaving `_hasLabelSlot` / `_hasHelpSlot` /
    // `_hasErrorSlot` true for content the consumer has explicitly hidden.
    // Per AccName 1.2 §4.3.10 a hidden root contributes the empty string.
    // The fix gates on root visibility at the top of `flattenAccName`.

    it('F1: <span slot="label" hidden>Secret</span> — _hasLabelSlot is false; _labelSource !== "slot"', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox><span slot="label" hidden>Secret</span></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as unknown as HxCombobox & {
          _hasLabelSlot: boolean;
          _labelSource: 'string' | 'slot' | 'none';
        };
        expect(harness._hasLabelSlot).toBe(false);
        expect(harness._labelSource).not.toBe('slot');
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('F1: <span slot="label" aria-hidden="true">Secret</span> — _hasLabelSlot is false; _labelSource !== "slot"', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      try {
        const el = await fixture<HxCombobox>(
          '<hx-combobox><span slot="label" aria-hidden="true">Secret</span></hx-combobox>',
        );
        await el.updateComplete;
        const harness = el as unknown as HxCombobox & {
          _hasLabelSlot: boolean;
          _labelSource: 'string' | 'slot' | 'none';
        };
        expect(harness._hasLabelSlot).toBe(false);
        expect(harness._labelSource).not.toBe('slot');
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('F2: <span slot="help-text" hidden>foo</span> — _hasHelpSlot is false; help id NOT in inner-input aria-describedby', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="help-text" hidden>foo</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const internalHasHelpSlot = (
        el as unknown as { _hasHelpSlot: boolean }
      )._hasHelpSlot;
      expect(internalHasHelpSlot).toBe(false);

      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpEl = el.shadowRoot!.querySelector<HTMLElement>('.field__help-text');
      const describedBy = (input.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((t) => t);
      if (helpEl) {
        expect(describedBy).not.toContain(helpEl.id);
      }
    });

    it('F2: <span slot="error" aria-hidden="true">err</span> — _hasErrorSlot false; aria-invalid not on; error id NOT in aria-describedby', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="error" aria-hidden="true">err</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const internalHasErrorSlot = (
        el as unknown as { _hasErrorSlot: boolean }
      )._hasErrorSlot;
      expect(internalHasErrorSlot).toBe(false);

      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const ariaInvalid = input.getAttribute('aria-invalid');
      expect(ariaInvalid === null || ariaInvalid === 'false').toBe(true);

      const errorEl = el.shadowRoot!.querySelector<HTMLElement>('.field__error');
      const describedBy = (input.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((t) => t);
      if (errorEl) {
        expect(describedBy).not.toContain(errorEl.id);
      }
    });

    it('F2 dynamic toggle: visible help slot → hidden=true on root flips _hasHelpSlot to false on next sync', async () => {
      const el = await fixture<HxCombobox>(
        '<hx-combobox label="Fruit"><span slot="help-text">helpful</span></hx-combobox>',
      );
      await el.updateComplete;
      const harness = el as ComboboxTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      await el.updateComplete;

      const stateRef = el as unknown as { _hasHelpSlot: boolean };
      // Sanity: initially visible help slot registers as content.
      expect(stateRef._hasHelpSlot).toBe(true);

      const helpRoot = el.querySelector('span[slot="help-text"]') as HTMLElement;
      // Round-9 F2 (P2) installed a MutationObserver that watches the `hidden`
      // attribute on the slotted root. Toggling it triggers the async MO,
      // which re-reads slot state via `_readHelpSlotStateSync` — and round-11
      // F2 means a hidden root now flattens to "", flipping `_hasHelpSlot`.
      helpRoot.setAttribute('hidden', '');

      // Yield a microtask + macrotask so the MO callback runs and any state
      // change propagates through `_syncHostAriaSemantics`.
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;

      expect(stateRef._hasHelpSlot).toBe(false);

      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpEl = el.shadowRoot!.querySelector<HTMLElement>('.field__help-text');
      const describedBy = (input.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((t) => t);
      if (helpEl) {
        expect(describedBy).not.toContain(helpEl.id);
      }
    });
  });
});
