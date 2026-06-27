import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement } from '../../base/index.js';
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';
import { helixFormScopedCss } from './hx-form.styles.js';

/** Custom-element constructor that may opt into form association. */
interface FormAssociatedConstructor {
  formAssociated?: boolean;
}

/**
 * A Light DOM form wrapper that styles native HTML form elements and
 * hx-* components with the design system's form styles.
 *
 * Render mode: hx-form renders its OWN `<form>` when `action` is a non-empty
 * string AND either no host (direct-child) `<form>` is present OR orphaned direct
 * controls remain. If the consumer provides its own `<form>` (the Drupal pattern)
 * and no orphaned controls remain, hx-form renders a bare `<slot>` and never wraps
 * it — so the host form's native submission is preserved. With an empty `action`
 * it also renders only a `<slot>`.
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

  /**
   * Whether the consumer supplied its own (slotted) `<form>` in our light DOM.
   * When true, hx-form never renders its own wrapping `<form>` — it would create
   * a second/sibling form and break the host form's native submission. Computed
   * in `willUpdate` from the light DOM, excluding hx-form's own rendered form.
   * @internal
   */
  @state()
  private _hasSlottedForm = false;

  /**
   * Whether form-associated controls (`input`/`select`/`textarea`/`button`) exist
   * in our light DOM that are NOT inside any `<form>`. When a host form is present
   * but such orphaned direct controls also remain, hx-form keeps rendering its own
   * `<form>` so those controls retain a form owner (two sibling forms, not nested).
   * @internal
   */
  @state()
  private _hasOrphanedControls = false;

  /**
   * Observes light-DOM child changes so the render-mode decision stays correct
   * when consumers swap `<hx-form>`'s children after mount (React wrapper
   * children, Drupal behaviors, etc.). Lit does not run an update cycle on
   * light-DOM mutations, so without this the slot-vs-own-form choice goes stale.
   * @internal
   */
  private _childObserver: MutationObserver | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('submit', this._handleSubmit);
    this.addEventListener('reset', this._handleReset);

    if (typeof MutationObserver !== 'undefined') {
      this._childObserver = new MutationObserver(this._onChildMutation);
      // `subtree` is needed: orphaned-control detection scans the whole light-DOM
      // subtree, so a control added/removed anywhere (not just as a direct child)
      // must re-evaluate the render mode. Recompute is change-guarded by Lit's
      // reactive setters, so deep mutations that don't flip a signal are cheap
      // no-ops with no re-render.
      this._childObserver.observe(this, { childList: true, subtree: true });
    }
  }

  /**
   * Detects a consumer-provided host-owned `<form>` in our light DOM. Matches
   * only a TOP-LEVEL (direct-child) `<form>` — the host-owned-form pattern
   * places the form as a direct child of `<hx-form>`. An unrelated `<form>`
   * nested deeper in consumer markup is NOT the host's submission form and must
   * not suppress hx-form's own wrapper. hx-form's own rendered form is a direct
   * child too but carries `data-hx-own-form`, so it is excluded.
   * @internal
   */
  private _detectSlottedForm(): boolean {
    return this.querySelector(':scope > form:not([data-hx-own-form])') !== null;
  }

  /**
   * Detects form-associated controls in our light DOM that are not inside any
   * `<form>` (the host's or hx-form's own). `closest('form')` attributes each
   * control to its nearest ancestor form; a `null` result means the control has
   * no form owner and would be left orphaned if hx-form dropped its own form.
   * @internal
   */
  private _detectOrphanedControls(): boolean {
    for (const el of this.querySelectorAll('*')) {
      if (this._isFormControl(el) && el.closest('form') === null) {
        return true;
      }
    }
    return false;
  }

  /**
   * Native form-control tag names. Native controls are not registered custom
   * elements, so they are matched by tag rather than by a `formAssociated` flag.
   * @internal
   */
  private static readonly _nativeControlTags: ReadonlySet<string> = new Set([
    'input',
    'select',
    'textarea',
    'button',
  ]);

  /**
   * Whether an element is a form-associated control — a native
   * `input`/`select`/`textarea`/`button`, OR a registered custom element whose
   * constructor declares `static formAssociated = true` (every hx-* form control:
   * hx-text-input, hx-select, hx-checkbox, hx-radio-group, hx-textarea, etc.).
   * The generic `formAssociated` check avoids a hardcoded hx-* tag allowlist that
   * would silently rot as new form controls are added.
   * @internal
   */
  private _isFormControl(el: Element): boolean {
    const tag = el.tagName.toLowerCase();
    if (HelixForm._nativeControlTags.has(tag)) {
      return true;
    }
    if (typeof customElements === 'undefined') {
      return false;
    }
    const ctor = customElements.get(tag);
    return (
      ctor !== undefined &&
      (ctor as CustomElementConstructor & FormAssociatedConstructor).formAssociated === true
    );
  }

  /**
   * Recomputes the render-mode signals from the current light DOM. Lit's reactive
   * setters change-guard each assignment, so a re-render is requested only when a
   * signal actually flips. hx-form's own rendered form is excluded from
   * slotted-form detection and contains no controls, so its own insertion/removal
   * never flips a signal — preventing an observe → render → observe loop.
   * @internal
   */
  private _syncFormModeState(): void {
    this._hasSlottedForm = this._detectSlottedForm();
    this._hasOrphanedControls = this._detectOrphanedControls();
  }

  /**
   * MutationObserver callback — resyncs the render-mode signals on light-DOM
   * child changes between Lit updates.
   * @internal
   */
  private readonly _onChildMutation = (): void => {
    this._syncFormModeState();
  };

  /**
   * Recomputes the render-mode signals before each render (the per-render source
   * of truth); the MutationObserver only triggers a re-render when consumer
   * children change between updates.
   * @internal
   */
  override willUpdate(): void {
    this._syncFormModeState();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('submit', this._handleSubmit);
    this.removeEventListener('reset', this._handleReset);
    this._childObserver?.disconnect();
    this._childObserver = null;
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
    return this._checkValidity(this._getAllValidatableElements());
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
   * Collects form data from the form's controls and returns a `FormData` object.
   *
   * Precedence: when hx-form rendered its OWN `<form>` (`data-hx-own-form`), data
   * is collected for that form's controls — so a sibling host form prepended
   * earlier in DOM order (Drupal/React) cannot hijack the payload. In slot-only
   * mode (no own form), it falls back to the consumer's first `<form>` (the host
   * form), or, when there is no `<form>` at all, to every named control.
   */
  getFormData(): FormData {
    const ownForm = this.querySelector<HTMLFormElement>('form[data-hx-own-form]');
    if (ownForm !== null) {
      return this._collectFormData(ownForm);
    }
    return this._collectFormData(this.querySelector<HTMLFormElement>('form'));
  }

  /**
   * Form-associated controls (native AND hx-*) that belong to the given form:
   * those whose nearest ancestor `<form>` is `scopeForm`, or which are not inside
   * any form (hx-form's own rendered form projects via `<slot>`, so its controls
   * are orphaned light children). Controls inside a different (sibling) form are
   * excluded. With no scope, returns every form-associated control.
   * @internal
   */
  private _scopedFormControls(scopeForm: HTMLFormElement | null): Element[] {
    const all = Array.from(this.querySelectorAll('*')).filter((el) => this._isFormControl(el));
    if (scopeForm === null) {
      return all;
    }
    return all.filter((el) => {
      const owner = el.closest('form');
      return owner === null || owner === scopeForm;
    });
  }

  /**
   * Whether a `<form>` contains any form-associated control (native or hx-*) in
   * its subtree, i.e. it has its own fields. hx-form's own rendered form holds
   * only a `<slot>`, so this is `false` for it.
   * @internal
   */
  private _formContainsControl(form: HTMLFormElement): boolean {
    for (const el of form.querySelectorAll('*')) {
      if (this._isFormControl(el)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Collects `FormData` for the controlled submit bridge, scoped to the
   * submitting form.
   *
   * When that form contains its own fields — native OR hx-* form-associated
   * controls — the native `FormData` constructor captures them all (hx-*
   * controls contribute via their `ElementInternals.setFormValue`). When it does
   * not (hx-form's own slot-projecting form, whose logical fields are orphaned
   * light children), data is gathered manually from the in-scope controls,
   * reading each control's submission value via its public API. Single-value
   * controls (native inputs/select/textarea, hx-text-input, hx-select,
   * hx-number-input, hx-textarea) and boolean controls (native checkbox/radio,
   * hx-checkbox, hx-switch) are covered; multi-value/grouped/file hx-* controls
   * fall back to reading `.value` and may not round-trip every entry.
   * @internal
   */
  private _collectFormData(scopeForm: HTMLFormElement | null): FormData {
    if (scopeForm !== null && this._formContainsControl(scopeForm)) {
      return new FormData(scopeForm);
    }

    const formData = new FormData();
    for (const el of this._scopedFormControls(scopeForm)) {
      const name = (el as { name?: unknown }).name;
      if (typeof name !== 'string' || name === '') continue;

      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          if (el.checked) {
            formData.append(name, el.value || 'on');
          }
        } else {
          formData.append(name, el.value);
        }
      } else if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        formData.append(name, el.value);
      } else if (el instanceof HTMLButtonElement) {
        // Preserve prior behavior: a named native button contributes its value.
        formData.append(name, el.value);
      } else {
        // hx-* form-associated custom element: read its public value API.
        const control = el as { value?: unknown; checked?: unknown };
        if (typeof control.checked === 'boolean') {
          // Boolean controls (hx-checkbox, hx-switch): submit only when checked.
          if (control.checked) {
            const value =
              typeof control.value === 'string' && control.value !== '' ? control.value : 'on';
            formData.append(name, value);
          }
        } else if (typeof control.value === 'string') {
          formData.append(name, control.value);
        }
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
   * Returns elements that support constraint validation, including both native
   * form elements and hx-* components with `checkValidity`.
   *
   * When `scopeForm` is provided, only controls that BELONG to that form are
   * returned: a control whose nearest ancestor `<form>` is `scopeForm`, or which
   * is not inside any form at all (hx-form's own rendered form projects its
   * controls via `<slot>`, so they sit outside it as orphaned light children).
   * Controls inside a DIFFERENT (sibling) form are excluded — so a coexisting
   * host form can neither block the controlled submit with its own invalid fields
   * nor leak into the emitted payload.
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
    return all.filter((el) => {
      const owner = el.closest('form');
      return owner === null || owner === scopeForm;
    });
  }

  /**
   * Runs `checkValidity()` over the given controls (native and hx-*).
   * @internal
   */
  private _checkValidity(elements: HTMLElement[]): boolean {
    return elements.every((el) => {
      if ('checkValidity' in el && typeof el.checkValidity === 'function') {
        return (el as HTMLInputElement).checkValidity();
      }
      return true;
    });
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
   * The decision is made purely from the SUBMITTING form (and its submitter),
   * never from hx-form's own `action` prop — so a slotted action-less host form
   * is still bridged even when `<hx-form>` carries an `action`. Submission is
   * left native iff the submitting `<form>` declares its own NON-EMPTY `action`
   * attribute, OR the submit button carries a NON-EMPTY `formaction` (a
   * multi-submit host form — e.g. Drupal's Save vs Preview buttons — overrides
   * the form action per-submitter). Otherwise it is the controlled client-side
   * case and is bridged.
   *
   * hx-form's OWN rendered `<form>` gets its `action` attribute only when
   * `_hasOwnAction` (trimmed non-empty), so the form-action check below already
   * covers the own-form-with-action native case: a whitespace-only `action`
   * renders the own form WITHOUT an attribute → controlled.
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
    // `action`. A missing or empty action (`<form>`, `<form action="">`, e.g.
    // templated Twig/Drupal markup binding a value that renders empty, OR
    // hx-form's own whitespace-action form which omits the attribute) is the
    // controlled client-side case and is bridged.
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

    // Scope the bridge to the form that actually submitted, so a coexisting
    // sibling host form neither blocks validation with its own invalid fields nor
    // contributes to the emitted payload (regardless of DOM order).
    const submittingForm = e.target instanceof HTMLFormElement ? e.target : null;

    if (!this.novalidate && !this._checkValidity(this._getAllValidatableElements(submittingForm))) {
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

    const formData = this._collectFormData(submittingForm);
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

    // Render mode is decoupled from the submit-intercept decision. hx-form
    // renders its OWN `<form>` when `action` is a non-empty string (whitespace
    // included) AND either no host form is present OR orphaned direct controls
    // remain:
    //  - Host form present, NO orphaned controls (just the host form) → slot-only
    //    mode, single form — never beside/around the host form (would break its
    //    native action/formaction submission).
    //  - Host form present AND orphaned direct controls present → KEEP the own
    //    form so those controls retain a form owner. Two SIBLING forms (own +
    //    host), each owning its own content — valid HTML, not nested.
    //  - No host form + non-empty `action` (incl. whitespace) → render our own
    //    `<form>` so direct controls get a form owner, even when a templated
    //    action collapses to whitespace.
    //  - Truly-empty `action=""` → slot-only mode.
    // The `action` ATTRIBUTE is set only for a non-empty trimmed value, so a
    // whitespace-only action yields `<form>` without a meaningless action attr.
    // The own form is tagged `data-hx-own-form` so the slotted-form detection can
    // exclude it.
    if (this.action !== '' && (!this._hasSlottedForm || this._hasOrphanedControls)) {
      return html`
        ${errorSummary}
        <form
          data-hx-own-form
          action=${ifDefined(this._hasOwnAction ? this.action : undefined)}
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
