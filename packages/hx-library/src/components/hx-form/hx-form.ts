import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement } from '../../base/index.js';
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';
import { helixFormScopedCss } from './hx-form.styles.js';

/**
 * A Light DOM form wrapper that styles native HTML form elements and
 * hx-* components with the design system's form styles.
 *
 * When `action` is set, renders a `<form>` wrapper around slotted content.
 * When no `action` is set (the Drupal pattern), renders only a `<slot>`
 * so Drupal can provide its own `<form>` tag.
 *
 * The client-side submit bridge (validate + dispatch `hx-submit`) only runs for
 * a form that hx-form effectively owns: a slotted form with no `action` of its
 * own. A host-owned form that declares its own `action` (a Drupal Form API form
 * or a Marketo `mktoForm_*` form) submits natively and is never cancelled. Set
 * `no-intercept` to disable the bridge entirely and use hx-form purely for
 * styling.
 *
 * Uses adopted stylesheets to inject scoped CSS into the document without
 * Shadow DOM, keeping native form participation and Drupal compatibility.
 *
 * @summary Light DOM form wrapper with scoped styles for native and hx-* form elements.
 *
 * @tag hx-form
 *
 * @slot - Default slot for form fields and controls.
 *
 * @fires {CustomEvent<{valid: boolean, values: Record<string, FormDataEntryValue | FormDataEntryValue[]>, formData: FormData}>} hx-submit - Dispatched on valid client-side submit of an action-less form when `no-intercept` is not set.
 * @fires {CustomEvent<{errors: Array<{name: string, message: string}>}>} hx-invalid - Dispatched when validation fails on submit.
 * @fires {CustomEvent} hx-reset - Dispatched when the form is reset.
 *
 * @cssprop [--hx-form-gap=var(--hx-space-4)] - Gap between form fields.
 * @cssprop [--hx-form-max-width=none] - Maximum width of the form.
 * @cssprop [--hx-form-padding=0] - Internal padding of the form.
 *
 * @aaa-certified 2026-05-09
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-form/AAA-AUDIT.md
 * @keyboard-contract submit=Enter
 * @aria-pattern form
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/form.html
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-form
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-form')
export class HelixForm extends HelixElement {
  // ─── Light DOM ───

  override createRenderRoot(): HTMLElement {
    return this;
  }

  // ─── Adopted Stylesheets ───

  /**
   * Controller that injects scoped CSS into the document via adopted stylesheets for Light DOM styling.
   * @internal
   */
  private _styles = new AdoptedStylesheetsController(this, helixFormScopedCss, document);

  // ─── Internal State ───

  /**
   * Current list of validation errors rendered in the error summary and used to set aria-invalid on fields.
   * @internal
   */
  @state()
  private _validationErrors: Array<{ name: string; message: string }> = [];

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
   * submission client-side only and dispatches `hx-submit`.
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

  /**
   * The encoding type for form submission. Only used when `action` is set.
   * Use `multipart/form-data` for forms with file uploads.
   * @attr enctype
   */
  @property({ type: String })
  enctype: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain' =
    'application/x-www-form-urlencoded';

  /**
   * When true, hx-form acts as a purely presentational wrapper and never runs
   * its client-side submit bridge. Native submission of any contained or
   * slotted form proceeds untouched and no `hx-submit` / `hx-invalid` is
   * dispatched.
   *
   * Use this when a host owns its own posting form — e.g. a Drupal Form API
   * form or a Marketo (`mktoForm_*`) form — and hx-form is only meant to apply
   * the design system's form styles, not control submission.
   * @attr no-intercept
   */
  @property({ type: Boolean, attribute: 'no-intercept', reflect: true })
  noIntercept = false;

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
   * Collects form data from all child form elements (native and hx-*).
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
   * Returns all child hx-* form components that implement the form
   * component contract (hx-text-input, hx-select, hx-checkbox, hx-textarea,
   * hx-radio-group, hx-switch).
   *
   * Note: This uses a hardcoded allowlist. When a new hx-* form component
   * is added, update this selector to include it.
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

  /**
   * Programmatically sets server-side validation errors on the form.
   * Renders an error summary and sets `aria-invalid="true"` on named fields.
   *
   * Useful for surfacing Drupal server-side validation responses.
   *
   * @param errors - Array of `{name, message}` pairs matching field `name` attributes.
   */
  setErrors(errors: Array<{ name: string; message: string }>): void {
    this._validationErrors = errors;
    this._applyAriaInvalidFromErrors(errors);
  }

  /**
   * Programmatically sets a single field error. Merges with any existing errors.
   *
   * @param name - The `name` attribute of the field.
   * @param message - The error message to display.
   */
  setFieldError(name: string, message: string): void {
    const existing = this._validationErrors.filter((e) => e.name !== name);
    this.setErrors([...existing, { name, message }]);
  }

  /**
   * Clears all validation errors from the error summary and removes
   * `aria-invalid` from all fields.
   */
  clearErrors(): void {
    this._clearAriaInvalid();
    this._validationErrors = [];
  }

  // ─── Private Helpers ───

  /**
   * Returns all elements that support constraint validation, including
   * both native form elements and hx-* components with `checkValidity`.
   * @internal
   */
  private _getAllValidatableElements(): HTMLElement[] {
    const native = Array.from(this.querySelectorAll<HTMLElement>('input, select, textarea'));
    const wcElements = this.getFormElements().filter(
      (el): el is HTMLElement & { checkValidity: () => boolean } =>
        'checkValidity' in el &&
        typeof (el as { checkValidity: unknown }).checkValidity === 'function',
    );
    return [...native, ...wcElements];
  }

  /**
   * Sets `aria-invalid="true"` on fields with errors, removes it from valid fields.
   * @internal
   */
  private _applyAriaInvalidFromErrors(errors: Array<{ name: string; message: string }>): void {
    const errorNames = new Set(errors.map((e) => e.name));
    const allElements = this._getAllValidatableElements();
    for (const el of allElements) {
      const named = el as HTMLElement & { name?: string };
      const fieldName = named.name ?? el.tagName.toLowerCase();
      if (errorNames.has(fieldName)) {
        el.setAttribute('aria-invalid', 'true');
      } else {
        el.removeAttribute('aria-invalid');
      }
    }
  }

  /**
   * Sets `aria-invalid` based on native constraint validation state.
   * @internal
   */
  private _applyAriaInvalidFromValidity(): void {
    const allElements = this._getAllValidatableElements();
    for (const el of allElements) {
      if ('validity' in el) {
        const validatable = el as HTMLInputElement;
        if (!validatable.validity.valid) {
          el.setAttribute('aria-invalid', 'true');
        } else {
          el.removeAttribute('aria-invalid');
        }
      }
    }
  }

  /**
   * Removes `aria-invalid` from all validatable elements.
   * @internal
   */
  private _clearAriaInvalid(): void {
    const allElements = this._getAllValidatableElements();
    for (const el of allElements) {
      el.removeAttribute('aria-invalid');
    }
  }

  // ─── Event Handling ───

  /**
   * True when hx-form owns submission via its own non-empty `action`. A
   * whitespace-only `action` (e.g. a templated value that renders empty) is
   * treated as no action, matching the slotted-form / formaction discriminators
   * and the controlled-bridge case.
   * @internal
   */
  private get _hasOwnAction(): boolean {
    return this.action.trim() !== '';
  }

  /**
   * Decides whether hx-form should intercept a given submit event and run its
   * client-side bridge (prevent native submission, validate, and dispatch
   * `hx-submit` / `hx-invalid`), or let the event proceed to native submission.
   *
   * hx-form must NEVER cancel a form it does not itself own. It renders its own
   * `<form>` only when `action` is set, in which case native submission to that
   * action is the intended behaviour. When `action` is empty it renders no
   * `<form>` at all, so the submitting form is host-owned/slotted; in that case
   * the bridge applies ONLY to a form that does not declare its own `action`
   * (the controlled client-side pattern). A slotted form with its own `action`
   * (Drupal Form API, Marketo, etc.) owns its submission and must submit
   * natively.
   *
   * Override in a subclass to opt out of interception without monkey-patching.
   * Part of the hx-form subclassing contract.
   *
   * @param e - The native `submit` event bubbling up to the host.
   * @returns `true` to run the client-side bridge, `false` to allow native submission.
   * @protected
   */
  protected shouldInterceptSubmit(e: Event): boolean {
    // Explicit opt-out: presentational wrapper only.
    if (this.noIntercept) {
      return false;
    }

    // hx-form renders its own `<form action>`; native submission is intended.
    // A whitespace-only `action` is treated as empty (controlled), consistent
    // with the slotted-form / formaction checks below.
    if (this._hasOwnAction) {
      return false;
    }

    // No action: the submitting form is host-owned/slotted. Treat it as
    // host-owned (native) when EITHER the form declares a NON-EMPTY `action` of
    // its own, OR the submit button that triggered submission carries a
    // NON-EMPTY `formaction` (a multi-submit host form — e.g. Drupal's Save vs
    // Preview buttons — overrides the form action per-submitter). A missing or
    // empty action/formaction (`<form>`, `<form action="">`, e.g. templated
    // Twig/Drupal markup binding a value that renders empty) is the controlled
    // client-side case and is still bridged — mirroring how an empty
    // `this.action` is treated as the controlled case above.
    const target = e.target;
    const formAction = target instanceof HTMLFormElement ? target.getAttribute('action') : null;
    const formOwns = formAction !== null && formAction.trim() !== '';

    // Read the submitter's `formaction` ATTRIBUTE (not the `.formAction` IDL
    // property, which resolves to the document URL when unset).
    const submitter = e instanceof SubmitEvent ? e.submitter : null;
    const submitterFormAction = submitter?.getAttribute('formaction') ?? null;
    const submitterOwns = submitterFormAction !== null && submitterFormAction.trim() !== '';

    if (formOwns || submitterOwns) {
      return false;
    }

    return true;
  }

  /**
   * Handles native form submit events, intercepting for client-side validation and hx-submit dispatch.
   * @internal
   */
  private readonly _handleSubmit = (e: Event): void => {
    // Defer the intercept decision to the overridable hook. When it declines,
    // native submission proceeds untouched and no hx-* event is dispatched.
    if (!this.shouldInterceptSubmit(e)) {
      return;
    }

    // Client-side only: prevent default and dispatch hx-submit or hx-invalid
    e.preventDefault();

    if (!this.novalidate && !this.checkValidity()) {
      const errors = this._collectValidationErrors();
      this._validationErrors = errors;
      this._applyAriaInvalidFromValidity();

      // Move focus to the error summary after it renders so screen readers announce it
      // immediately. tabindex="-1" on the summary allows programmatic focus (WCAG 2.4.3).
      void this.updateComplete.then(() => {
        const summary = this.querySelector<HTMLElement>('.hx-form-error-summary');
        summary?.focus();
      });

      /**
       * Dispatched when validation fails on submit.
       * @event hx-invalid
       */
      this.dispatchEvent(
        new CustomEvent<{ errors: Array<{ name: string; message: string }> }>('hx-invalid', {
          bubbles: true,
          composed: true,
          detail: { errors },
        }),
      );
      return;
    }

    // Clear any previous errors on successful submit
    this._validationErrors = [];
    this._clearAriaInvalid();

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
      new CustomEvent<{
        valid: boolean;
        values: Record<string, FormDataEntryValue | FormDataEntryValue[]>;
        formData: FormData;
      }>('hx-submit', {
        bubbles: true,
        composed: true,
        detail: { valid: true, values, formData },
      }),
    );
  };

  /**
   * Handles native form reset events, clearing validation errors and dispatching hx-reset.
   * @internal
   */
  private _handleReset = (): void => {
    this._validationErrors = [];
    this._clearAriaInvalid();

    /**
     * Dispatched when the form is reset.
     * @event hx-reset
     */
    this.dispatchEvent(
      new CustomEvent<void>('hx-reset', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * Collects constraint validation errors from all validatable elements after a failed submit attempt.
   * @internal
   */
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
    const errorSummary =
      this._validationErrors.length > 0
        ? html`
            <div class="hx-form-error-summary" role="alert" aria-atomic="true" tabindex="-1">
              <ul>
                ${this._validationErrors.map(
                  (error) => html`<li>${error.message || error.name}</li>`,
                )}
              </ul>
            </div>
          `
        : nothing;

    if (this._hasOwnAction) {
      return html`
        ${errorSummary}
        <form
          action=${this.action}
          method=${this.method}
          enctype=${this.enctype}
          name=${ifDefined(this.name || undefined)}
          ?novalidate=${this.novalidate}
        >
          <slot></slot>
        </form>
      `;
    }

    return html`${errorSummary}<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-form': HelixForm;
  }
}
