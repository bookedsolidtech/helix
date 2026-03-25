import { describe, it, expect, afterEach } from 'vitest';
import { html, property } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fixture, cleanup } from '../test-utils.js';
import { HelixElement } from './helix-element.js';

// ─── Test-only custom elements ────────────────────────────────────────────────

/**
 * Non-form-associated element — verifies HelixElement works without form hooks.
 */
@customElement('test-helix-display')
class TestHelixDisplay extends HelixElement {
  override render() {
    return html`<span>display</span>`;
  }
}

/**
 * Form-associated element — exercises _internals, form callbacks, and hooks.
 */
@customElement('test-helix-form')
class TestHelixForm extends HelixElement {
  static override formAssociated = true;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  formDisabledWasCalled = false;
  formDisabledValue: boolean | undefined = undefined;
  formResetWasCalled = false;
  formStateRestoreWasCalled = false;
  formStateRestoreValue: File | string | FormData | null = null;
  formStateRestoreMode: 'restore' | 'autocomplete' | undefined = undefined;

  override _onFormDisabled(disabled: boolean): void {
    this.formDisabledWasCalled = true;
    this.formDisabledValue = disabled;
    this.disabled = disabled;
  }

  override _onFormReset(): void {
    this.formResetWasCalled = true;
    this.value = '';
    this._internals.setFormValue('');
  }

  override _onFormStateRestore(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formStateRestoreWasCalled = true;
    this.formStateRestoreValue = state;
    this.formStateRestoreMode = mode;
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  override render() {
    return html`<input class="inner" .value=${this.value} />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'test-helix-display': TestHelixDisplay;
    'test-helix-form': TestHelixForm;
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

afterEach(cleanup);

describe('HelixElement', () => {
  // ─── Base behaviour ───

  describe('non-form component', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<TestHelixDisplay>('<test-helix-display></test-helix-display>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('is an instance of LitElement and HelixElement', async () => {
      const el = await fixture<TestHelixDisplay>('<test-helix-display></test-helix-display>');
      expect(el).toBeInstanceOf(HelixElement);
    });

    it('throws when _internals is accessed on a non-form-associated element', async () => {
      const el = await fixture<TestHelixDisplay>('<test-helix-display></test-helix-display>');
      expect(() => el._internals).toThrow('[HelixElement]');
    });

    it('returns null for form getter when not form-associated', async () => {
      const el = await fixture<TestHelixDisplay>('<test-helix-display></test-helix-display>');
      expect(el.form).toBeNull();
    });

    it('returns null for validity getter when not form-associated', async () => {
      const el = await fixture<TestHelixDisplay>('<test-helix-display></test-helix-display>');
      expect(el.validity).toBeNull();
    });

    it('returns empty string for validationMessage when not form-associated', async () => {
      const el = await fixture<TestHelixDisplay>('<test-helix-display></test-helix-display>');
      expect(el.validationMessage).toBe('');
    });
  });

  // ─── Form association ───

  describe('form-associated component', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('provides _internals without throwing', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      expect(() => el._internals).not.toThrow();
      expect(el._internals).toBeDefined();
    });

    it('returns the same _internals instance on repeated access (lazy singleton)', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      const first = el._internals;
      const second = el._internals;
      expect(first).toBe(second);
    });

    it('_internals is an ElementInternals instance', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      expect(el._internals).toBeInstanceOf(ElementInternals);
    });

    it('exposes form getter returning the associated form (null when no form)', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      // Not inside a <form>, so form is null
      expect(el.form).toBeNull();
    });

    it('exposes validity getter returning a ValidityState', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      expect(el.validity).not.toBeNull();
    });

    it('exposes validationMessage getter returning a string', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      expect(typeof el.validationMessage).toBe('string');
    });

    it('exposes form getter returning the form when nested inside <form>', async () => {
      const container = document.createElement('div');
      container.innerHTML = '<form><test-helix-form></test-helix-form></form>';
      document.body.appendChild(container);
      const el = container.querySelector<TestHelixForm>('test-helix-form')!;
      await el.updateComplete;
      const form = container.querySelector('form')!;
      expect(el.form).toBe(form);
      document.body.removeChild(container);
    });
  });

  // ─── Form lifecycle hooks ───

  describe('_onFormDisabled hook', () => {
    it('is invoked when formDisabledCallback fires', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      el.formDisabledCallback(true);
      expect(el.formDisabledWasCalled).toBe(true);
      expect(el.formDisabledValue).toBe(true);
    });

    it('sets disabled=true on the element when called with true', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      el.formDisabledCallback(true);
      expect(el.disabled).toBe(true);
    });

    it('sets disabled=false on the element when called with false', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form disabled></test-helix-form>');
      el.formDisabledCallback(false);
      expect(el.disabled).toBe(false);
    });
  });

  describe('_onFormReset hook', () => {
    it('is invoked when formResetCallback fires', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form value="hello"></test-helix-form>');
      el.formResetCallback();
      expect(el.formResetWasCalled).toBe(true);
    });

    it('resets value to empty string', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form value="hello"></test-helix-form>');
      el.formResetCallback();
      expect(el.value).toBe('');
    });
  });

  describe('_onFormStateRestore hook', () => {
    it('is invoked when formStateRestoreCallback fires', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      el.formStateRestoreCallback('saved-value', 'restore');
      expect(el.formStateRestoreWasCalled).toBe(true);
    });

    it('passes state and mode to the hook', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      el.formStateRestoreCallback('my-value', 'autocomplete');
      expect(el.formStateRestoreValue).toBe('my-value');
      expect(el.formStateRestoreMode).toBe('autocomplete');
    });

    it('restores value from string state', async () => {
      const el = await fixture<TestHelixForm>('<test-helix-form></test-helix-form>');
      el.formStateRestoreCallback('restored', 'restore');
      expect(el.value).toBe('restored');
    });
  });
});
