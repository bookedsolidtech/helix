import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';
import { helixFormScopedCss } from './hx-form.styles.js';

/**
 * A Light DOM form wrapper that styles native HTML form elements and
 * wc-* components with the design system's form styles.
 *
 * When `action` is set, renders a `<form>` wrapper around slotted content.
 * When no `action` is set (the Drupal pattern), renders only a `<slot>`
 * so Drupal can provide its own `<form>` tag.
 *
 * Uses adopted stylesheets to inject scoped CSS into the document without
 * Shadow DOM, keeping native form participation and Drupal compatibility.
 *
 * @summary Light DOM form wrapper with scoped styles for native and wc-* form elements.
 *
 * @tag hx-form
 *
 * @slot - Default slot for form fields and controls.
 *
 * @fires {CustomEvent<{valid: boolean, values: Record<string, FormDataEntryValue | FormDataEntryValue[]>}>} hx-submit - Dispatched on valid client-side submit when no action is set.
 * @fires {CustomEvent<{errors: Array<{name: string, message: string}>}>} hx-invalid - Dispatched when validation fails on submit.
 * @fires {CustomEvent} hx-reset - Dispatched when the form is reset.
 *
 * @cssprop [--hx-form-gap=var(--hx-space-4)] - Gap between form fields.
 * @cssprop [--hx-form-max-width=none] - Maximum width of the form.
 * @cssprop [--hx-form-padding=0] - Internal padding of the form.
 */
@customElement('hx-form')
export class HelixForm extends LitElement {
  // ─── Light DOM ───

  override createRenderRoot(): HTMLElement {
    return this;
  }

  // ─── Adopted Stylesheets ───

  private _styles = new AdoptedStylesheetsController(this, helixFormScopedCss, document);

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('submit', this._handleSubmit);
    this.addEventListener('reset', this._handleReset);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('submit', this._handleSubmit);
    this.removeEventListener('reset', this._handleReset);
  }

  // ─── Properties ───

  /**
   * The URL to submit the form to. When empty, the form handles
   * submission client-side only and dispatches `wc-submit`.
   * @attr action
   */
  @property({ type: String })
  action = '';

  /**
   * The HTTP method used when submitting the form.
   * @attr method
   */
  @property({ type: String })
  method: 'get' | 'post' = 'post';

  /**
   * When true, disables the browser's built-in constraint validation
   * on form submission.
   * @attr novalidate
   */
  @property({ type: Boolean })
  novalidate = false;

  /**
   * Identifies the form for scripting and form discovery.
   * @attr name
   */
  @property({ type: String })
  name = '';

  // ─── Public Methods ───

  /**
   * Checks the validity of all child form elements without showing
   * validation UI. Returns `true` if all elements are valid.
   */
  checkValidity(): boolean {
    const formElements = this._getAllValidatableElements();
    return formElements.every((el) => {
      if ('checkValidity' in el && typeof el.checkValidity === 'function') {
        return (el as HTMLInputElement).checkValidity();
      }
      return true;
    });
  }

  /**
   * Checks validity and triggers the browser's constraint validation UI
   * on each invalid element. Returns `true` if all elements are valid.
   */
  reportValidity(): boolean {
    const formElements = this._getAllValidatableElements();
    let allValid = true;
    for (const el of formElements) {
      if ('reportValidity' in el && typeof el.reportValidity === 'function') {
        if (!(el as HTMLInputElement).reportValidity()) {
          allValid = false;
        }
      }
    }
    return allValid;
  }

  /**
   * Collects form data from all child form elements (native and wc-*).
   * Returns a `FormData` object.
   */
  getFormData(): FormData {
    // If there is a native <form> child, use it directly
    const formEl = this.querySelector('form');
    if (formEl) {
      return new FormData(formEl);
    }

    // Otherwise, manually collect from all named inputs
    const formData = new FormData();
    const elements = this.getNativeFormElements();
    for (const el of elements) {
      const input = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (!input.name) continue;

      if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          if (input.checked) {
            formData.append(input.name, input.value || 'on');
          }
        } else {
          formData.append(input.name, input.value);
        }
      } else {
        formData.append(input.name, input.value);
      }
    }

    return formData;
  }

  /**
   * Returns all child wc-* form components (elements whose tag starts
   * with `wc-` and that have a `name` property or a `value` property).
   */
  getFormElements(): HTMLElement[] {
    return Array.from(
      this.querySelectorAll<HTMLElement>(
        'hx-text-input, hx-select, hx-checkbox, hx-textarea, hx-radio-group, hx-switch',
      ),
    );
  }

  /**
   * Returns all native form elements (input, select, textarea, button)
   * found within this component's light DOM.
   */
  getNativeFormElements(): Array<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement
  > {
    return Array.from(
      this.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement
      >('input, select, textarea, button'),
    );
  }

  // ─── Private Helpers ───

  /**
   * Returns all elements that support constraint validation, including
   * both native form elements and wc-* components with `checkValidity`.
   */
  private _getAllValidatableElements(): HTMLElement[] {
    const native = Array.from(this.querySelectorAll<HTMLElement>('input, select, textarea'));
    const wcElements = this.getFormElements().filter(
      (el) =>
        'checkValidity' in el &&
        typeof (el as Record<string, unknown>).checkValidity === 'function',
    );
    return [...native, ...wcElements];
  }

  // ─── Event Handling ───

  private _handleSubmit = (e: Event): void => {
    // If there is an action, let native form submission happen
    if (this.action) {
      return;
    }

    // Client-side only: prevent default and dispatch wc-submit or wc-invalid
    e.preventDefault();

    if (!this.novalidate && !this.checkValidity()) {
      const errors = this._collectValidationErrors();

      /**
       * Dispatched when validation fails on submit.
       * @event hx-invalid
       */
      this.dispatchEvent(
        new CustomEvent('hx-invalid', {
          bubbles: true,
          composed: true,
          detail: { errors },
        }),
      );
      return;
    }

    const formData = this.getFormData();
    const values: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
    for (const key of new Set(formData.keys())) {
      const all = formData.getAll(key);
      if (all.length === 1 && all[0] !== undefined) {
        values[key] = all[0];
      } else {
        values[key] = all;
      }
    }

    /**
     * Dispatched on valid client-side submit.
     * @event hx-submit
     */
    this.dispatchEvent(
      new CustomEvent('hx-submit', {
        bubbles: true,
        composed: true,
        detail: { valid: true, values },
      }),
    );
  };

  private _handleReset = (): void => {
    /**
     * Dispatched when the form is reset.
     * @event hx-reset
     */
    this.dispatchEvent(
      new CustomEvent('hx-reset', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _collectValidationErrors(): Array<{ name: string; message: string }> {
    const errors: Array<{ name: string; message: string }> = [];
    const elements = this._getAllValidatableElements();

    for (const el of elements) {
      if ('validity' in el && 'validationMessage' in el) {
        const validatable = el as HTMLInputElement;
        if (!validatable.validity.valid) {
          errors.push({
            name: validatable.name || validatable.tagName.toLowerCase(),
            message: validatable.validationMessage,
          });
        }
      }
    }

    return errors;
  }

  // ─── Render ───

  override render() {
    if (this.action) {
      return html`
        <form
          action=${this.action}
          method=${this.method}
          name=${ifDefined(this.name || undefined)}
          ?novalidate=${this.novalidate}
        >
          <slot></slot>
        </form>
      `;
    }

    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-form': HelixForm;
  }
}

/** @deprecated Use `HelixForm` directly. Alias for backwards compatibility with tests that import `WcForm`. */
export type WcForm = HelixForm;
