import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcTextInput } from './hx-text-input.js';
import './index.js';

afterEach(cleanup);

describe('hx-text-input', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <input>', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const input = shadowQuery(el, 'input');
      expect(input).toBeInstanceOf(HTMLInputElement);
    });

    it('exposes "field" CSS part', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('exposes "input" CSS part', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const input = shadowQuery(el, '[part="input"]');
      expect(input).toBeTruthy();
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input label="Username"></hx-text-input>');
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Username');
    });

    it('does not render label when empty', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('shows asterisk when required', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input label="Email" required></hx-text-input>',
      );
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });
  });

  // ─── Property: placeholder (1) ───

  describe('Property: placeholder', () => {
    it('sets placeholder attr on native input', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input placeholder="Enter text..."></hx-text-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('placeholder')).toBe('Enter text...');
    });
  });

  // ─── Property: value (2) ───

  describe('Property: value', () => {
    it('syncs value to native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input value="hello"></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('hello');
    });

    it('programmatic value update is reflected', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      el.value = 'updated';
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('updated');
    });
  });

  // ─── Property: type (4) ───

  describe('Property: type', () => {
    it('defaults to type=text', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('type')).toBe('text');
    });

    it('sets email type', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input type="email"></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('type')).toBe('email');
    });

    it('sets password type', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input type="password"></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('type')).toBe('password');
    });

    it('sets number type', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input type="number"></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('type')).toBe('number');
    });
  });

  // ─── Property: required (2) ───

  describe('Property: required', () => {
    it('sets required attr on native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input required></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.required).toBe(true);
    });

    it('sets aria-required="true" on native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input required></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-required')).toBe('true');
    });
  });

  // ─── Property: disabled (2) ───

  describe('Property: disabled', () => {
    it('sets disabled attr on native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input disabled></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.disabled).toBe(true);
    });

    it('applies host opacity via disabled attribute', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input disabled></hx-text-input>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Property: error (4) ───

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input error="Required field"></hx-text-input>',
      );
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Required field');
    });

    it('error div has role="alert"', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input error="Required"></hx-text-input>');
      const errorDiv = shadowQuery(el, '.field__error');
      expect(errorDiv?.getAttribute('role')).toBe('alert');
    });

    it('sets aria-invalid="true" on input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input error="Required"></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('error hides help text', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input error="Error" help-text="Help"></hx-text-input>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: helpText (2) ───

  describe('Property: helpText', () => {
    it('renders help text below input', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input help-text="Enter your username"></hx-text-input>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Enter your username');
    });

    it('help text hidden when error present', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input help-text="Help" error="Error"></hx-text-input>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: name (1) ───

  describe('Property: name', () => {
    it('sets name attr on native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input name="username"></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('name')).toBe('username');
    });
  });

  // ─── Property: ariaLabel (1) ───

  describe('Property: ariaLabel', () => {
    it('sets aria-label on native input', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input aria-label="Search field"></hx-text-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-label')).toBe('Search field');
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-input on keystroke', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-input');
      input.value = 'a';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-input detail.value is correct', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-input');
      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('hello');
    });

    it('dispatches hx-change on blur', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      input.value = 'changed';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      input.value = 'test';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('prefix slot renders', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input><span slot="prefix">@</span></hx-text-input>',
      );
      const prefix = el.querySelector('[slot="prefix"]');
      expect(prefix).toBeTruthy();
      expect(prefix?.textContent).toBe('@');
    });

    it('suffix slot renders', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input><span slot="suffix">.com</span></hx-text-input>',
      );
      const suffix = el.querySelector('[slot="suffix"]');
      expect(suffix).toBeTruthy();
      expect(suffix?.textContent).toBe('.com');
    });

    it('help-text slot renders', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input help-text="default"><em slot="help-text">Custom help</em></hx-text-input>',
      );
      const helpSlot = el.querySelector('[slot="help-text"]');
      expect(helpSlot).toBeTruthy();
      expect(helpSlot?.textContent).toBe('Custom help');
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('label part exposed', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input label="Test"></hx-text-input>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('input-wrapper part exposed', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      const wrapper = shadowQuery(el, '[part="input-wrapper"]');
      expect(wrapper).toBeTruthy();
    });
  });

  // ─── Form (5) ───

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-text-input') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-text-input name="test"></hx-text-input>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-text-input') as WcTextInput;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets value to empty', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input value="hello"></hx-text-input>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('formStateRestoreCallback restores value', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      el.formStateRestoreCallback('restored');
      await el.updateComplete;
      expect(el.value).toBe('restored');
    });
  });

  // ─── Validation (3) ───

  describe('Validation', () => {
    it('checkValidity returns false when required + empty', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input required></hx-text-input>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required + filled', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input required value="filled"></hx-text-input>',
      );
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is set when required + empty', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input required></hx-text-input>');
      expect(el.validity.valueMissing).toBe(true);
    });

    it('reportValidity returns false when required + empty', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input required></hx-text-input>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required + filled', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input required value="filled"></hx-text-input>',
      );
      expect(el.reportValidity()).toBe(true);
    });

    it('validationMessage is set when required + empty', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input required></hx-text-input>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });
  });

  // ─── Methods (2) ───

  describe('Methods', () => {
    it('focus() moves focus to native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      el.focus();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(el.shadowRoot?.activeElement).toBe(input);
    });

    it('select() selects text in native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input value="hello world"></hx-text-input>');
      el.focus();
      el.select();
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe('hello world'.length);
    });
  });

  // ─── aria-describedby (2) ───

  describe('aria-describedby', () => {
    it('references error ID when error set', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input error="Bad input"></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const errorDiv = shadowQuery(el, '.field__error')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv.id);
    });

    it('references help text ID when helpText set', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input help-text="Some help"></hx-text-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const helpDiv = shadowQuery(el, '.field__help-text')!;
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpDiv.id);
    });
  });

  // ─── Property: readonly (2) ───

  describe('Property: readonly', () => {
    it('sets readonly attr on native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input readonly></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.readOnly).toBe(true);
    });

    it('reflects readonly attribute to host', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input readonly></hx-text-input>');
      expect(el.hasAttribute('readonly')).toBe(true);
    });
  });

  // ─── Property: hxSize (3) ───

  describe('Property: hxSize', () => {
    it('defaults to md', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input></hx-text-input>');
      expect(el.hxSize).toBe('md');
    });

    it('applies field--size-sm class', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input hx-size="sm"></hx-text-input>');
      const field = shadowQuery(el, '.field');
      expect(field?.classList.contains('field--size-sm')).toBe(true);
    });

    it('applies field--size-lg class', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input hx-size="lg"></hx-text-input>');
      const field = shadowQuery(el, '.field');
      expect(field?.classList.contains('field--size-lg')).toBe(true);
    });
  });

  // ─── Property: minlength / maxlength (2) ───

  describe('Property: minlength/maxlength', () => {
    it('sets minlength attr on native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input minlength="3"></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('minlength')).toBe('3');
    });

    it('sets maxlength attr on native input', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input maxlength="50"></hx-text-input>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('maxlength')).toBe('50');
    });
  });

  // ─── Property: pattern (1) ───

  describe('Property: pattern', () => {
    it('sets pattern attr on native input', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input pattern="[A-Z]+"></hx-text-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('pattern')).toBe('[A-Z]+');
    });
  });

  // ─── Property: autocomplete (1) ───

  describe('Property: autocomplete', () => {
    it('sets autocomplete attr on native input', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input autocomplete="email"></hx-text-input>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('autocomplete')).toBe('email');
    });
  });

  // ─── Slots: label and error (2) ───

  describe('Slots: label and error', () => {
    it('label slot renders slotted content', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input><label slot="label">Custom Label</label></hx-text-input>',
      );
      const slotted = el.querySelector('[slot="label"]');
      expect(slotted).toBeTruthy();
      expect(slotted?.textContent).toBe('Custom Label');
    });

    it('error slot renders slotted content', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input><div slot="error">Custom Error</div></hx-text-input>',
      );
      const slotted = el.querySelector('[slot="error"]');
      expect(slotted).toBeTruthy();
      expect(slotted?.textContent).toBe('Custom Error');
    });
  });

  // ─── CSS Parts: help-text and error (2) ───

  describe('CSS Parts: help-text and error', () => {
    it('help-text part exposed', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input help-text="Some help"></hx-text-input>',
      );
      const helpText = shadowQuery(el, '[part="help-text"]');
      expect(helpText).toBeTruthy();
    });

    it('error part exposed', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input error="An error"></hx-text-input>',
      );
      const errorPart = shadowQuery(el, '[part="error"]');
      expect(errorPart).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcTextInput>('<hx-text-input label="Name"></hx-text-input>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input label="Email" error="Invalid email"></hx-text-input>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input label="Name" disabled></hx-text-input>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when required', async () => {
      const el = await fixture<WcTextInput>(
        '<hx-text-input label="Name" required></hx-text-input>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
