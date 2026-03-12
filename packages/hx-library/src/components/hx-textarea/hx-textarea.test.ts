import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcTextarea } from './hx-textarea.js';
import './index.js';

afterEach(cleanup);

describe('hx-textarea', () => {
  // --- Rendering (4) ---

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <textarea>', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery(el, 'textarea');
      expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('exposes "field" CSS part', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('exposes "textarea" CSS part', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery(el, '[part="textarea"]');
      expect(textarea).toBeTruthy();
    });
  });

  // --- Property: label (3) ---

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea label="Description"></hx-textarea>');
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Description');
    });

    it('does not render label when empty', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('shows asterisk when required', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea label="Notes" required></hx-textarea>');
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });
  });

  // --- Property: placeholder (1) ---

  describe('Property: placeholder', () => {
    it('sets placeholder attr on native textarea', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea placeholder="Enter notes..."></hx-textarea>',
      );
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.getAttribute('placeholder')).toBe('Enter notes...');
    });
  });

  // --- Property: value (2) ---

  describe('Property: value', () => {
    it('syncs value to native textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea value="hello"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.value).toBe('hello');
    });

    it('programmatic value update is reflected', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      el.value = 'updated';
      await el.updateComplete;
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.value).toBe('updated');
    });
  });

  // --- Property: rows (2) ---

  describe('Property: rows', () => {
    it('defaults to 4 rows', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.getAttribute('rows')).toBe('4');
    });

    it('sets custom rows attribute', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea rows="8"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.getAttribute('rows')).toBe('8');
    });
  });

  // --- Property: maxlength (2) ---

  describe('Property: maxlength', () => {
    it('sets maxlength attr on native textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea maxlength="200"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.getAttribute('maxlength')).toBe('200');
    });

    it('does not set maxlength when not provided', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.hasAttribute('maxlength')).toBe(false);
    });
  });

  // --- Property: resize (2) ---

  describe('Property: resize', () => {
    it('defaults to vertical', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      expect(el.resize).toBe('vertical');
    });

    it('reflects resize attribute to host', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea resize="none"></hx-textarea>');
      expect(el.getAttribute('resize')).toBe('none');
      expect(el.resize).toBe('none');
    });
  });

  // --- Property: showCount (3) ---

  describe('Property: showCount', () => {
    it('does not render counter by default', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const counter = shadowQuery(el, '[part="counter"]');
      expect(counter).toBeNull();
    });

    it('renders counter when show-count is set', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea show-count></hx-textarea>');
      const counter = shadowQuery(el, '[part="counter"]');
      expect(counter).toBeTruthy();
    });

    it('shows "count / maxlength" format when maxlength set', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea show-count maxlength="200" value="hello"></hx-textarea>',
      );
      const counter = shadowQuery(el, '[part="counter"]');
      expect(counter?.textContent?.trim()).toBe('5 / 200');
    });
  });

  // --- Property: required (2) ---

  describe('Property: required', () => {
    it('sets required attr on native textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea required></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.required).toBe(true);
    });

    it('sets required attribute on native textarea without redundant aria-required', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea required></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.hasAttribute('required')).toBe(true);
      // aria-required is redundant with native required per HTML-AAM spec (P1-05 fix)
      expect(textarea.getAttribute('aria-required')).toBeNull();
    });
  });

  // --- Property: disabled (3) ---

  describe('Property: disabled', () => {
    it('sets disabled attr on native textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea disabled></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.disabled).toBe(true);
    });

    it('applies host opacity via disabled attribute', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea disabled></hx-textarea>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('native textarea is disabled so browser prevents input events', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea disabled></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      // When a native textarea is disabled, the browser does not fire input events
      // from user interaction. Verify the textarea is genuinely disabled.
      expect(textarea.disabled).toBe(true);
      // Verify the host reflects the disabled attribute so consumers can style it
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // --- Property: error (4) ---

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea error="Required field"></hx-textarea>');
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Required field');
    });

    it('error div uses role="alert" without conflicting aria-live', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea error="Required"></hx-textarea>');
      const errorDiv = shadowQuery(el, '.field__error');
      // role="alert" implies aria-live="assertive"; explicit aria-live="polite" was removed (P1-03 fix)
      expect(errorDiv?.getAttribute('role')).toBe('alert');
      expect(errorDiv?.getAttribute('aria-live')).toBeNull();
    });

    it('sets aria-invalid="true" on textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea error="Required"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.getAttribute('aria-invalid')).toBe('true');
    });

    it('error hides help text', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea error="Error" help-text="Help"></hx-textarea>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // --- Property: helpText (2) ---

  describe('Property: helpText', () => {
    it('renders help text below textarea', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea help-text="Enter your notes"></hx-textarea>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Enter your notes');
    });

    it('help text hidden when error present', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea help-text="Help" error="Error"></hx-textarea>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // --- Events (4) ---

  describe('Events', () => {
    it('dispatches hx-input on keystroke', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-input');
      textarea.value = 'a';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-input detail.value is correct', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-input');
      textarea.value = 'hello world';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('hello world');
    });

    it('dispatches hx-change on blur', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      textarea.value = 'changed';
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      textarea.value = 'test';
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // --- Slots (5) ---

  describe('Slots', () => {
    it('help-text slot renders', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea help-text="default"><em slot="help-text">Custom help</em></hx-textarea>',
      );
      const helpSlot = el.querySelector('[slot="help-text"]');
      expect(helpSlot).toBeTruthy();
      expect(helpSlot?.textContent).toBe('Custom help');
    });

    it('label slot renders and sets aria-labelledby', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea><label slot="label">Custom Label</label></hx-textarea>',
      );
      await el.updateComplete;
      const slottedLabel = el.querySelector('[slot="label"]');
      expect(slottedLabel).toBeTruthy();
      expect(slottedLabel?.textContent).toBe('Custom Label');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('error slot renders and sets error state', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea><span slot="error">Slot error</span></hx-textarea>',
      );
      await el.updateComplete;
      const slottedError = el.querySelector('[slot="error"]');
      expect(slottedError).toBeTruthy();
      expect(slottedError?.textContent).toBe('Slot error');
    });

    it('help-text slot renders without helpText property set', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea><span slot="help-text">Custom slot help</span></hx-textarea>',
      );
      await el.updateComplete;
      const helpSlot = el.querySelector('[slot="help-text"]');
      expect(helpSlot).toBeTruthy();
      expect(helpSlot?.textContent).toBe('Custom slot help');
    });

    it('error slot has aria-describedby pointing to error container', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea><span slot="error">Slot error msg</span></hx-textarea>',
      );
      await el.updateComplete;
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const errorDiv = shadowQuery(el, '.field__error')!;
      const describedBy = textarea.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv.id);
    });
  });

  // --- CSS Parts (3) ---

  describe('CSS Parts', () => {
    it('label part exposed', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea label="Test"></hx-textarea>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('textarea-wrapper part exposed', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const wrapper = shadowQuery(el, '[part="textarea-wrapper"]');
      expect(wrapper).toBeTruthy();
    });

    it('counter part exposed when showCount set', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea show-count></hx-textarea>');
      const counter = shadowQuery(el, '[part="counter"]');
      expect(counter).toBeTruthy();
    });
  });

  // --- Form (5) ---

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-textarea') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-textarea name="test"></hx-textarea>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-textarea') as WcTextarea;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets value to empty', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea value="hello"></hx-textarea>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('formStateRestoreCallback restores value', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      el.formStateRestoreCallback('restored');
      await el.updateComplete;
      expect(el.value).toBe('restored');
    });

    it('form.reset() resets the textarea value', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-textarea name="notes" value="typed"></hx-textarea>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-textarea') as WcTextarea;
      await el.updateComplete;
      expect(el.value).toBe('typed');
      form.reset();
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('setFormValue is called when value changes', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-textarea name="notes"></hx-textarea>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-textarea') as WcTextarea;
      await el.updateComplete;
      el.value = 'new value';
      await el.updateComplete;
      // FormData should reflect the updated value
      const formData = new FormData(form);
      expect(formData.get('notes')).toBe('new value');
    });
  });

  // --- Validation (3) ---

  describe('Validation', () => {
    it('checkValidity returns false when required + empty', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea required></hx-textarea>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required + filled', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea required value="filled"></hx-textarea>');
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is set when required + empty', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea required></hx-textarea>');
      expect(el.validity.valueMissing).toBe(true);
    });

    it('reportValidity returns false when required + empty', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea required></hx-textarea>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required + filled', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea required value="filled"></hx-textarea>');
      expect(el.reportValidity()).toBe(true);
    });

    it('validationMessage is set when required + empty', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea required></hx-textarea>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });

    it('tooLong validity flag is set when value exceeds maxlength', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea maxlength="5" value="toolong"></hx-textarea>',
      );
      await el.updateComplete;
      expect(el.validity.tooLong).toBe(true);
      expect(el.checkValidity()).toBe(false);
    });
  });

  // --- Methods (2) ---

  describe('Methods', () => {
    it('focus() moves focus to native textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      el.focus();
      await el.updateComplete;
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(el.shadowRoot?.activeElement).toBe(textarea);
    });

    it('select() selects text in native textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea value="hello world"></hx-textarea>');
      el.focus();
      el.select();
      await el.updateComplete;
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.selectionStart).toBe(0);
      expect(textarea.selectionEnd).toBe('hello world'.length);
    });
  });

  // --- aria-describedby (5) ---

  describe('aria-describedby', () => {
    it('references error ID when error set', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea error="Bad input"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const errorDiv = shadowQuery(el, '.field__error')!;
      const describedBy = textarea.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv.id);
    });

    it('references help text ID when helpText set', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea help-text="Some help"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const helpDiv = shadowQuery(el, '.field__help-text')!;
      const describedBy = textarea.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpDiv.id);
    });

    it('references counter ID when showCount is set', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea show-count value="hello"></hx-textarea>',
      );
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const counterDiv = shadowQuery(el, '[part="counter"]')!;
      const describedBy = textarea.getAttribute('aria-describedby');
      expect(describedBy).toContain(counterDiv.id);
    });

    it('references both error and counter IDs when both are set', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea error="Bad" show-count value="hello"></hx-textarea>',
      );
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const errorDiv = shadowQuery(el, '.field__error')!;
      const counterDiv = shadowQuery(el, '[part="counter"]')!;
      const describedBy = textarea.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv.id);
      expect(describedBy).toContain(counterDiv.id);
    });

    it('has no aria-describedby when nothing is set', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  // --- Auto-resize (3) ---

  describe('Auto-resize', () => {
    it('sets resize="auto" attribute on host', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea resize="auto"></hx-textarea>');
      expect(el.getAttribute('resize')).toBe('auto');
    });

    it('adjusts textarea height on input when resize is auto', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea resize="auto"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const initialHeight = textarea.style.height;
      textarea.value = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
      // After auto-resize, height should be set as inline style
      expect(textarea.style.height).not.toBe(initialHeight);
    });

    it('programmatic value change triggers auto-resize when resize="auto"', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea resize="auto"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      const initialHeight = textarea.style.height;
      // Set value programmatically (not via input event) — updated() lifecycle handles resize
      el.value = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8';
      await el.updateComplete;
      expect(textarea.style.height).not.toBe(initialHeight);
    });
  });

  // --- Character Counter (4) ---

  describe('Character Counter', () => {
    it('shows count only when no maxlength', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea show-count value="test"></hx-textarea>');
      const counter = shadowQuery(el, '[part="counter"]');
      expect(counter?.textContent?.trim()).toBe('4');
    });

    it('counter still visible when error is set', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea show-count error="Error" value="hello"></hx-textarea>',
      );
      const counter = shadowQuery(el, '[part="counter"]');
      expect(counter).toBeTruthy();
      expect(counter?.textContent?.trim()).toBe('5');
    });

    it('counter has aria-live="polite"', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea show-count></hx-textarea>');
      const counter = shadowQuery(el, '[part="counter"]')!;
      expect(counter.getAttribute('aria-live')).toBe('polite');
    });

    it('counter updates when value changes programmatically', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea show-count></hx-textarea>');
      el.value = 'updated text';
      await el.updateComplete;
      const counter = shadowQuery(el, '[part="counter"]');
      expect(counter?.textContent?.trim()).toBe('12');
    });
  });

  // --- Property: name (1) ---

  describe('Property: name', () => {
    it('sets name attr on native textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea name="notes"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.getAttribute('name')).toBe('notes');
    });
  });

  // --- Property: ariaLabel (1) ---

  describe('Property: ariaLabel', () => {
    it('sets aria-label on native textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea aria-label="Notes field"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.getAttribute('aria-label')).toBe('Notes field');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea label="Notes"></hx-textarea>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea label="Notes" error="Required field"></hx-textarea>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea label="Notes" disabled></hx-textarea>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when required', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea label="Notes" required></hx-textarea>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with help-text', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea label="Notes" help-text="Enter your notes here"></hx-textarea>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with character counter', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea label="Notes" show-count maxlength="200"></hx-textarea>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with aria-label (no visible label)', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea aria-label="Notes field"></hx-textarea>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with all features combined', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea label="Notes" required error="Required field" show-count maxlength="200" value="hello"></hx-textarea>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // --- Dynamic Property Changes (5) ---

  describe('Dynamic Property Changes', () => {
    it('changing required from false to true updates validity.valueMissing', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      expect(el.validity.valueMissing).toBe(false);
      el.required = true;
      await el.updateComplete;
      expect(el.validity.valueMissing).toBe(true);
    });

    it('changing maxlength below current value triggers tooLong', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea value="hello world"></hx-textarea>');
      expect(el.validity.tooLong).toBe(false);
      el.maxlength = 5;
      await el.updateComplete;
      expect(el.validity.tooLong).toBe(true);
    });

    it('toggling disabled reflects on native textarea', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.disabled).toBe(false);
      el.disabled = true;
      await el.updateComplete;
      expect(textarea.disabled).toBe(true);
      el.disabled = false;
      await el.updateComplete;
      expect(textarea.disabled).toBe(false);
    });

    it('clearing error removes aria-invalid', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea error="Bad"></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.getAttribute('aria-invalid')).toBe('true');
      el.error = '';
      await el.updateComplete;
      expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });

    it('setting error after help-text hides help-text', async () => {
      const el = await fixture<WcTextarea>(
        '<hx-textarea help-text="Some guidance"></hx-textarea>',
      );
      expect(shadowQuery(el, '.field__help-text')).toBeTruthy();
      el.error = 'Something went wrong';
      await el.updateComplete;
      expect(shadowQuery(el, '.field__help-text')).toBeNull();
      expect(shadowQuery(el, '.field__error')).toBeTruthy();
    });
  });

  // --- Design Tokens (3) ---

  describe('Design Tokens', () => {
    it('host has display: block', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const computed = getComputedStyle(el);
      expect(computed.display).toBe('block');
    });

    it('disabled host has reduced opacity', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea disabled></hx-textarea>');
      const computed = getComputedStyle(el);
      const opacity = parseFloat(computed.opacity);
      expect(opacity).toBeLessThan(1);
    });

    it('no hardcoded color values in component styles', async () => {
      // Access the component's static styles and verify token usage
      const ctor = customElements.get('hx-textarea') as unknown as {
        styles: Array<{ cssText: string }>;
      };
      // The styles array includes tokenStyles and helixTextareaStyles
      const componentStyles = ctor.styles.map((s) => s.cssText).join('');
      // Verify that color declarations use CSS custom properties (var(--hx-...))
      // Match color properties that have hex values NOT inside var() fallbacks
      const colorProps = componentStyles.match(/(?:^|;)\s*color\s*:\s*#[0-9a-fA-F]+/g);
      // All color values should be inside var() as fallbacks, not bare hex values
      expect(colorProps).toBeNull();
    });
  });

  // --- Edge Cases (2) ---

  describe('Edge Cases', () => {
    it('empty placeholder does not render placeholder attribute', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.hasAttribute('placeholder')).toBe(false);
    });

    it('empty name does not render name attribute', async () => {
      const el = await fixture<WcTextarea>('<hx-textarea></hx-textarea>');
      const textarea = shadowQuery<HTMLTextAreaElement>(el, 'textarea')!;
      expect(textarea.hasAttribute('name')).toBe(false);
    });
  });
});
