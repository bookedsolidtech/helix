import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';
import { helixFormScopedCss } from './hx-form.styles.js';

/**
 * A pure Light DOM form wrapper that styles native HTML form elements and
 * hx-* components with the design system's form styles. It NEVER renders its own
 * `<form>` — the consumer/host always provides the actual `<form>` (a Drupal or
 * Marketo host form, or an action-less `<form>` slotted for controlled behavior).
 *
 * The client-side submit bridge (validate + dispatch `hx-submit` / `hx-invalid`)
 * runs only for a submitted form that hx-form does not surrender to the host:
 * native submission proceeds when the submitting `<form>` declares its own
 * non-empty `action`, or its submit button carries a non-empty `formaction` (a
 * host-owned Drupal Form API or Marketo `mktoForm_*` form). Otherwise the submit
 * is bridged, scoped to that form's controls. If the consumer provides only loose
 * controls and NO `<form>`, no submit event fires and no bridge runs — wrap
 * controls in a `<form>` for controlled behavior. Set `no-intercept` to disable
 * the bridge entirely and use hx-form purely for styling.
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
   * The URL to submit the form to.
   *
   * @deprecated hx-form is a Light-DOM wrapper and no longer renders its own
   * `<form>`; provide your own `<form>` (the host/consumer owns posting via its
   * `action`). Retained for compatibility; has no rendering effect.
   * @attr action
   */
  @property({ type: String })
  action = '';

  /**
   * The HTTP method used when submitting the form.
   *
   * @deprecated hx-form no longer renders its own `<form>`, so this has no
   * effect. Set `method` on your own `<form>`. Retained for compatibility.
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
   *
   * @deprecated hx-form no longer renders its own `<form>`, so this has no
   * effect. Set `name` on your own `<form>`. Retained for compatibility.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The encoding type for form submission.
   *
   * @deprecated hx-form no longer renders its own `<form>`, so this has no
   * effect. Set `enctype` on your own `<form>`. Retained for compatibility.
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
    // If there is a native <form> child, use it directly (captures native and
    // hx-* form-associated controls via their ElementInternals).
    const formEl = this.querySelector('form');
    if (formEl) {
      return new FormData(formEl);
    }

    // No consumer <form>: collect from every named form-associated control in the
    // host light DOM — native AND hx-* components (so all-web-component layouts
    // return complete data, not just native fields).
    const formData = new FormData();
    for (const el of this._hostFormControls()) {
      const name = (el as { name?: unknown }).name;
      if (typeof name !== 'string' || name === '') continue;
      this._appendControlValue(formData, name, el);
    }

    return formData;
  }

  /**
   * Serializes a single form-associated control's submission value into
   * `formData`, handling all value shapes robustly:
   * - native `input`/`select`/`textarea`: existing handling (checkbox/radio
   *   `value || 'on'` when checked; file inputs append their `File`s, matching
   *   native `new FormData(form)` which appends one empty `File` for an empty
   *   file input; otherwise `.value`).
   * - boolean hx-* control (`typeof .checked === 'boolean'`, e.g. hx-checkbox/
   *   hx-switch): append `value || 'on'` only when checked, else omit.
   * - file hx-* control (`.files` is a `FileList`/`File[]`, or `.value` is a
   *   `File`): append each `File`; an EMPTY list contributes nothing — matching
   *   the component's `ElementInternals.setFormValue(null)` (no empty key).
   * - string `.value` → append as-is; number `.value` (not NaN) → `String(value)`.
   * - `null`/`undefined` value with no checked/file state → omit (matches
   *   ElementInternals form-value semantics). Other non-null shapes → `String`.
   * @internal
   */
  private _appendControlValue(formData: FormData, name: string, el: Element): void {
    // ── Native controls ──
    if (el instanceof HTMLInputElement) {
      if (el.type === 'file') {
        const files = el.files;
        if (files !== null && files.length > 0) {
          for (const file of Array.from(files)) {
            formData.append(name, file);
          }
        } else {
          // Native `new FormData(form)` appends one empty File for an empty file input.
          formData.append(name, new File([], ''));
        }
        return;
      }
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) {
          formData.append(name, el.value || 'on');
        }
        return;
      }
      formData.append(name, el.value);
      return;
    }
    if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
      formData.append(name, el.value);
      return;
    }

    // ── hx-* form-associated custom element: read its public value API by shape ──
    const control = el as { value?: unknown; checked?: unknown; files?: unknown };

    // Boolean controls (hx-checkbox, hx-switch): value || 'on' only when checked.
    if (typeof control.checked === 'boolean') {
      if (control.checked) {
        const value =
          typeof control.value === 'string' && control.value !== '' ? control.value : 'on';
        formData.append(name, value);
      }
      return;
    }

    // File controls (hx-file-upload): a FileList or File[] via `.files`, or a
    // single File `.value`. An empty list contributes nothing (the component's
    // own ElementInternals semantics set no form value when empty).
    const files = control.files;
    let fileList: readonly unknown[] | null = null;
    if (files instanceof FileList) {
      fileList = Array.from(files);
    } else if (Array.isArray(files)) {
      fileList = files as readonly unknown[];
    }
    if (fileList !== null) {
      const onlyFiles = fileList.filter((f): f is File => f instanceof File);
      if (onlyFiles.length === fileList.length) {
        for (const file of onlyFiles) {
          formData.append(name, file);
        }
        return;
      }
    }
    if (control.value instanceof File) {
      formData.append(name, control.value);
      return;
    }

    // Scalar value shapes.
    const value = control.value;
    if (typeof value === 'string') {
      formData.append(name, value);
    } else if (typeof value === 'number' && !Number.isNaN(value)) {
      formData.append(name, String(value));
    } else if (value === null || value === undefined) {
      // Omit — matches ElementInternals form-value semantics (no empty key).
    } else {
      formData.append(name, String(value));
    }
  }

  /**
   * Form-associated controls in the host light DOM — native `input`/`select`/
   * `textarea`, plus any registered custom element whose constructor declares
   * `static formAssociated = true` (every hx-* form control). Used by the
   * `getFormData()` fallback when the consumer supplies no `<form>`.
   * @internal
   */
  private _hostFormControls(): Element[] {
    return Array.from(this.querySelectorAll('*')).filter((el) => this._isFormControl(el));
  }

  /**
   * Whether an element is a form-associated control — a native
   * `input`/`select`/`textarea`, OR a registered custom element whose
   * constructor declares `static formAssociated = true`. The generic
   * `formAssociated` check auto-includes every hx-* form control without a
   * hardcoded tag allowlist.
   * @internal
   */
  private _isFormControl(el: Element): boolean {
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') {
      return true;
    }
    if (typeof customElements === 'undefined') {
      return false;
    }
    const ctor = customElements.get(tag);
    return (
      ctor !== undefined &&
      (ctor as CustomElementConstructor & { formAssociated?: boolean }).formAssociated === true
    );
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
   * Returns elements that support constraint validation, including both native
   * form elements and hx-* components with `checkValidity`.
   *
   * When `scopeForm` is provided (the controlled-submit bridge passes the form
   * that fired the submit), the result is scoped to controls that belong to that
   * form by actual form ASSOCIATION (`_formOf`, which honors `form="id"` and
   * `ElementInternals.form`, not just DOM descent). Controls inside a DIFFERENT
   * form — or not associated to any form — are excluded, so an unrelated form's
   * invalid field can't block the submit. With no scope (the public
   * `checkValidity`/`reportValidity` callers), every control is returned —
   * unchanged behavior.
   * @internal
   */
  private _getAllValidatableElements(scopeForm: HTMLFormElement | null = null): HTMLElement[] {
    const native = Array.from(this.querySelectorAll<HTMLElement>('input, select, textarea'));
    const wcElements = this.getFormElements().filter(
      (el): el is HTMLElement & { checkValidity: () => boolean } =>
        'checkValidity' in el &&
        typeof (el as { checkValidity: unknown }).checkValidity === 'function',
    );
    const all = [...native, ...wcElements];
    if (scopeForm === null) {
      return all;
    }
    return all.filter((el) => this._formOf(el) === scopeForm);
  }

  /**
   * The `<form>` a control is associated with, by actual form association rather
   * than DOM descent. Native controls and hx-* form-associated components expose
   * a `.form` property (the IDL form, which reflects both `form="id"` and
   * descendant association); it is used when present. Falls back to
   * `closest('form')` only when no `.form` property exists.
   * @internal
   */
  private _formOf(el: Element): HTMLFormElement | null {
    const candidate = (el as { form?: unknown }).form;
    if (candidate instanceof HTMLFormElement) {
      return candidate;
    }
    if (candidate === null) {
      return null;
    }
    return el.closest('form');
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
   * Sets `aria-invalid` based on native constraint validation state, scoped to
   * the submitting form's controls when provided.
   * @internal
   */
  private _applyAriaInvalidFromValidity(scopeForm: HTMLFormElement | null = null): void {
    const allElements = this._getAllValidatableElements(scopeForm);
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
   * Decides whether hx-form should intercept a given submit event and run its
   * client-side bridge (prevent native submission, validate, and dispatch
   * `hx-submit` / `hx-invalid`), or let the event proceed to native submission.
   *
   * The decision is made purely from the SUBMITTING form (and its submitter), so
   * hx-form never cancels a form the host owns. Submission is left native iff the
   * submitting `<form>` declares its own NON-EMPTY `action` attribute (trimmed),
   * OR the submit button carries a NON-EMPTY `formaction` (a multi-submit host
   * form — e.g. Drupal's Save vs Preview buttons — overrides the form action
   * per-submitter). Otherwise it is the controlled client-side case and is
   * bridged. `no-intercept` disables interception entirely.
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

    // Native submission iff the SUBMITTING form declares its own NON-EMPTY
    // `action` (trimmed). A missing, empty, or whitespace-only action (`<form>`,
    // `<form action="">`, `<form action="   ">`, e.g. templated Twig/Drupal markup
    // binding a value that renders empty) is the controlled client-side case and
    // is bridged.
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

    // Client-side only: prevent default and dispatch hx-submit or hx-invalid.
    e.preventDefault();

    // Scope the controlled bridge to the form that actually fired, so an
    // unrelated sibling form's invalid fields can't block this submit and the
    // payload comes from this form only.
    const submittingForm = e.target instanceof HTMLFormElement ? e.target : null;
    const scopedElements = this._getAllValidatableElements(submittingForm);
    const scopedValid = scopedElements.every((el) =>
      'checkValidity' in el && typeof el.checkValidity === 'function'
        ? (el as HTMLInputElement).checkValidity()
        : true,
    );

    if (!this.novalidate && !scopedValid) {
      const errors = this._collectValidationErrors(submittingForm);
      this._validationErrors = errors;
      this._applyAriaInvalidFromValidity(submittingForm);

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

    // Payload from the submitting form — `new FormData` captures controls
    // associated to it (descendant, `form="id"`, and hx-* via ElementInternals).
    // Defensively fall back to the public collector when the submit event has no
    // form target.
    const formData = submittingForm !== null ? new FormData(submittingForm) : this.getFormData();
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
   * Collects constraint validation errors from validatable elements after a
   * failed submit attempt, scoped to the submitting form's controls when provided.
   * @internal
   */
  private _collectValidationErrors(
    scopeForm: HTMLFormElement | null = null,
  ): Array<{ name: string; message: string }> {
    const errors: Array<{ name: string; message: string }> = [];
    const elements = this._getAllValidatableElements(scopeForm);

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
    // hx-form is a PURE Light-DOM wrapper: it never renders its own `<form>`. The
    // consumer/host provides the actual `<form>` (Drupal/Marketo host form, or an
    // action-less `<form>` slotted for the controlled bridge). The render is the
    // error-summary region (live `role="alert"`) plus the default `<slot>`.
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

    return html`${errorSummary}<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-form': HelixForm;
  }
}
