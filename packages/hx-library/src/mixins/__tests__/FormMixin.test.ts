import { describe, it, expect, afterEach } from 'vitest';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { fixture, cleanup } from '../../test-utils.js';
import { FormMixin } from '../FormMixin.js';
import { HelixElement } from '../../base/helix-element.js';

// ─── Test Component ──────────────────────────────────────────────────────────
//
// A minimal form-associated element that uses FormMixin. Registered once for
// the entire test suite — vitest browser mode shares a single document.

@customElement('test-form-mixin-element')
class TestFormMixinElement extends FormMixin(HelixElement) {
  /** @internal */
  static override formAssociated = true;

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  override render() {
    return html`<input
      class="native-input"
      .value=${this.value}
      ?required=${this.required}
      @input=${this._onInput}
      @blur=${this._onBlur}
    />`;
  }

  protected override _updateValidity(): void {
    const input = this.shadowRoot?.querySelector<HTMLInputElement>('.native-input');
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', input);
    } else {
      this._internals.setValidity({});
    }
  }

  protected override _onFormReset(): void {
    this.value = '';
    this._internals.setFormValue('');
    this._resetInteractionState();
  }

  private _onInput(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this._internals.setFormValue(this.value);
    this._handleInteractionInput();
  }

  private _onBlur(): void {
    this._handleInteractionBlur();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'test-form-mixin-element': TestFormMixinElement;
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

afterEach(cleanup);

describe('FormMixin', () => {
  // ─── Mixin existence ─────────────────────────────────────────────────────

  describe('mixin application', () => {
    it('applies to a HelixElement subclass without errors', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      expect(el).toBeInstanceOf(HelixElement);
      expect(el).toBeInstanceOf(LitElement);
    });

    it('renders shadow DOM', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });
  });

  // ─── Interaction state: initial ──────────────────────────────────────────

  describe('interaction state — initial', () => {
    it('is pristine on mount', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      expect(el.pristine).toBe(true);
    });

    it('is not dirty on mount', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      expect(el.dirty).toBe(false);
    });

    it('is not touched on mount', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      expect(el.touched).toBe(false);
    });
  });

  // ─── Interaction state: input ────────────────────────────────────────────

  describe('interaction state — input event', () => {
    it('becomes dirty after an input event', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('.native-input')!;

      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      expect(el.dirty).toBe(true);
    });

    it('is no longer pristine after an input event', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('.native-input')!;

      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      expect(el.pristine).toBe(false);
    });

    it('remains not touched after only an input event', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('.native-input')!;

      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      expect(el.touched).toBe(false);
    });
  });

  // ─── Interaction state: blur ─────────────────────────────────────────────

  describe('interaction state — blur event', () => {
    it('becomes touched after a blur event', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('.native-input')!;

      input.dispatchEvent(new Event('blur', { bubbles: true }));
      await el.updateComplete;

      expect(el.touched).toBe(true);
    });

    it('dirty remains false after only a blur event', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('.native-input')!;

      input.dispatchEvent(new Event('blur', { bubbles: true }));
      await el.updateComplete;

      expect(el.dirty).toBe(false);
    });
  });

  // ─── Interaction state: reset ────────────────────────────────────────────

  describe('interaction state — form reset', () => {
    it('resets dirty to false after form reset', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<form><test-form-mixin-element></test-form-mixin-element></form>',
      );
      const component = el.querySelector<TestFormMixinElement>('test-form-mixin-element')!;
      const input = component.shadowRoot!.querySelector<HTMLInputElement>('.native-input')!;

      // Make dirty
      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await component.updateComplete;
      expect(component.dirty).toBe(true);

      // Reset form
      (el as HTMLFormElement).reset();
      await component.updateComplete;

      expect(component.dirty).toBe(false);
    });

    it('resets touched to false after form reset', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<form><test-form-mixin-element></test-form-mixin-element></form>',
      );
      const component = el.querySelector<TestFormMixinElement>('test-form-mixin-element')!;
      const input = component.shadowRoot!.querySelector<HTMLInputElement>('.native-input')!;

      // Make touched
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      await component.updateComplete;
      expect(component.touched).toBe(true);

      // Reset form
      (el as HTMLFormElement).reset();
      await component.updateComplete;

      expect(component.touched).toBe(false);
    });

    it('is pristine again after form reset', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<form><test-form-mixin-element></test-form-mixin-element></form>',
      );
      const component = el.querySelector<TestFormMixinElement>('test-form-mixin-element')!;
      const input = component.shadowRoot!.querySelector<HTMLInputElement>('.native-input')!;

      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await component.updateComplete;

      (el as HTMLFormElement).reset();
      await component.updateComplete;

      expect(component.pristine).toBe(true);
    });
  });

  // ─── Validity: checkValidity / reportValidity ─────────────────────────────

  describe('checkValidity()', () => {
    it('returns true when no constraints are violated', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element value="hello"></test-form-mixin-element>',
      );
      expect(el.checkValidity()).toBe(true);
    });

    it('returns false when required and value is empty', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element required></test-form-mixin-element>',
      );
      expect(el.checkValidity()).toBe(false);
    });
  });

  describe('reportValidity()', () => {
    it('returns true when valid', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element value="hello"></test-form-mixin-element>',
      );
      expect(el.reportValidity()).toBe(true);
    });

    it('returns false when invalid', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element required></test-form-mixin-element>',
      );
      expect(el.reportValidity()).toBe(false);
    });
  });

  // ─── Validity: constraint states ─────────────────────────────────────────

  describe('constraint state — valueMissing', () => {
    it('validity.valueMissing is true when required and empty', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element required></test-form-mixin-element>',
      );
      expect(el._internals.validity.valueMissing).toBe(true);
    });

    it('validity.valueMissing is false when required and has value', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element required value="hello"></test-form-mixin-element>',
      );
      expect(el._internals.validity.valueMissing).toBe(false);
    });

    it('validity is valid when not required and empty', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      expect(el._internals.validity.valid).toBe(true);
    });
  });

  // ─── _updateValidity hook ────────────────────────────────────────────────

  describe('_updateValidity hook', () => {
    it('is called automatically when reactive properties change', async () => {
      const el = await fixture<TestFormMixinElement>(
        '<test-form-mixin-element></test-form-mixin-element>',
      );
      // Initially not required — should be valid
      expect(el._internals.validity.valid).toBe(true);

      // Make required — should become invalid
      el.required = true;
      await el.updateComplete;
      expect(el._internals.validity.valueMissing).toBe(true);

      // Provide a value — should become valid again
      el.value = 'filled';
      await el.updateComplete;
      expect(el._internals.validity.valid).toBe(true);
    });
  });
});
