import { LitElement } from 'lit';

/**
 * `HelixElement` extends `LitElement` with shared infrastructure for all HELiX
 * components: lazy `ElementInternals` access, form lifecycle hook delegation,
 * and convenience validity getters.
 *
 * All subclasses get a lazy `_internals` accessor that calls
 * `attachInternals()` on first access — useful for both form participation
 * and ARIA role/state management via `ElementInternals`.
 *
 * Form association is opt-in via `static formAssociated = true` on the subclass.
 *
 * Form components should also override the `_onForm*` hook methods rather than
 * re-declaring the raw browser callbacks (`formResetCallback`, etc.).
 *
 * @example Non-form component — no configuration required:
 * ```ts
 * class HxCard extends HelixElement {
 *   // no formAssociated needed
 * }
 * ```
 *
 * @example Form-associated component:
 * ```ts
 * class HxTextInput extends HelixElement {
 *   static override formAssociated = true;
 *
 *   override _onFormReset(): void {
 *     this.value = '';
 *     this._internals.setFormValue('');
 *   }
 *
 *   override _onFormDisabled(disabled: boolean): void {
 *     this.disabled = disabled;
 *   }
 * }
 * ```
 *
 * @public
 */
export class HelixElement extends LitElement {
  /**
   * Set to `true` on the subclass to enable ElementInternals form association.
   *
   * IMPORTANT: This MUST be redeclared as `static override formAssociated = true`
   * on each form-associated subclass. The browser's form association mechanism
   * inspects `formAssociated` on the *registered* custom element class, not
   * on ancestor classes.
   *
   * @internal
   */
  static formAssociated = false;

  #internals: ElementInternals | undefined;

  /**
   * Lazy accessor for `ElementInternals`. Calls `attachInternals()` on first
   * access and caches the result.
   *
   * Available to ALL components — not just form-associated ones.
   * `ElementInternals` is also the standard mechanism for setting ARIA roles,
   * states, and properties from within Shadow DOM (e.g., `this._internals.role`).
   *
   * @internal
   */
  get _internals(): ElementInternals {
    const cached = this.#internals;
    if (cached !== undefined) {
      return cached;
    }
    const internals = this.attachInternals();
    this.#internals = internals;
    return internals;
  }

  // ─── Browser Form Callbacks (delegate to hook methods) ───

  /**
   * Called by the browser when the element's form-associated disabled state
   * changes (e.g., a parent `<fieldset disabled>` is toggled).
   *
   * Delegates to `_onFormDisabled`. Override that method in subclasses.
   * @internal
   */
  formDisabledCallback(disabled: boolean): void {
    this._onFormDisabled(disabled);
  }

  /**
   * Called by the browser when the owning form is reset.
   *
   * Delegates to `_onFormReset`. Override that method in subclasses.
   * @internal
   */
  formResetCallback(): void {
    this._onFormReset();
  }

  /**
   * Called by the browser to restore form state (e.g., back/forward cache).
   *
   * Delegates to `_onFormStateRestore`. Override that method in subclasses.
   * @internal
   */
  formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this._onFormStateRestore(state, mode);
  }

  // ─── Hook Methods (override in subclasses) ───

  /**
   * Override in subclass to react to the element being disabled or enabled
   * via a parent `<fieldset>`.
   *
   * @param _disabled - `true` when the element is being disabled
   * @internal
   */
  protected _onFormDisabled(_disabled: boolean): void {}

  /**
   * Override in subclass to reset component state when the owning form resets.
   * @internal
   */
  protected _onFormReset(): void {}

  /**
   * Override in subclass to restore component state from saved form state.
   *
   * @param _state - The saved state value, or `null` if none
   * @param _mode - `'restore'` for bfcache navigation, `'autocomplete'` for autofill
   * @internal
   */
  protected _onFormStateRestore(
    _state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {}

  // ─── Convenience Getters ───

  /**
   * The associated form element, or `null` if not form-associated or not yet
   * connected to a form.
   *
   * Form-associated subclasses that need a guaranteed non-null return type
   * should redeclare this getter and delegate to `this._internals.form`.
   *
   * @internal
   */
  get form(): HTMLFormElement | null {
    if (!(this.constructor as typeof HelixElement).formAssociated) {
      return null;
    }
    return this._internals.form;
  }

  /**
   * The current `ValidityState` for this element, or `null` if not
   * form-associated.
   *
   * Form-associated subclasses that need a guaranteed `ValidityState` return
   * should redeclare this getter and delegate to `this._internals.validity`.
   *
   * @internal
   */
  get validity(): ValidityState | null {
    if (!(this.constructor as typeof HelixElement).formAssociated) {
      return null;
    }
    return this._internals.validity;
  }

  /**
   * The current validation message, or an empty string if not form-associated
   * or if the element is valid.
   *
   * @internal
   */
  get validationMessage(): string {
    if (!(this.constructor as typeof HelixElement).formAssociated) {
      return '';
    }
    return this._internals.validationMessage;
  }
}
