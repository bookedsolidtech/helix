import type { PropertyValues } from 'lit';
import { HelixElement } from '../base/helix-element.js';

/**
 * Constructor type for the mixin pattern.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * The public interface that FormMixin adds to any host element.
 *
 * @public
 */
export interface FormMixinInterface {
  /** True after the user has modified the field value at least once. */
  readonly dirty: boolean;
  /** True after the field has received and lost focus at least once. */
  readonly touched: boolean;
  /** True while the field has never been modified (opposite of dirty). */
  readonly pristine: boolean;

  /** Delegates to ElementInternals.checkValidity(). */
  checkValidity(): boolean;
  /** Delegates to ElementInternals.reportValidity(). */
  reportValidity(): boolean;

  /**
   * Advance `dirty` state. Call from the native input's `input` event handler.
   *
   * Part of the FormMixin subclassing contract (stable across minor/patch
   * releases; breaking changes gated to major releases).
   *
   * @protected
   */
  _handleInteractionInput(): void;

  /**
   * Advance `touched` state. Call from the native input's `blur` event handler.
   *
   * Part of the FormMixin subclassing contract (stable across minor/patch
   * releases; breaking changes gated to major releases).
   *
   * @protected
   */
  _handleInteractionBlur(): void;

  /**
   * Reset interaction flags. Call from `_onFormReset()` in the host component.
   *
   * Part of the FormMixin subclassing contract (stable across minor/patch
   * releases; breaking changes gated to major releases).
   *
   * @protected
   */
  _resetInteractionState(): void;

  /**
   * Override in the host component to run constraint validation logic.
   * Called automatically by `updated()`. Use `this._internals.setValidity()`
   * inside this method.
   *
   * Part of the FormMixin subclassing contract (stable across minor/patch
   * releases; breaking changes gated to major releases).
   *
   * @protected
   */
  _updateValidity(...args: unknown[]): void;
}

/**
 * FormMixin adds shared form infrastructure to any HelixElement subclass:
 *
 * - Interaction state tracking: `dirty`, `touched`, `pristine`
 * - `checkValidity()` / `reportValidity()` delegation to `ElementInternals`
 * - A `_updateValidity()` lifecycle hook called automatically after every
 *   `updated()` cycle — subclasses override this to run constraint checks
 * - `_handleInteractionBlur()` and `_handleInteractionInput()` helpers that
 *   components wire to their native inputs to advance interaction state
 *
 * @example
 * ```ts
 * class HxTextInput extends FormMixin(HelixElement) {
 *   override _updateValidity(): void {
 *     if (this.required && !this.value) {
 *       this._internals.setValidity({ valueMissing: true }, 'Required', this._inputEl);
 *     } else {
 *       this._internals.setValidity({});
 *     }
 *   }
 * }
 * ```
 *
 * @param superClass - A HelixElement-derived constructor to mix into
 * @returns The mixed class constructor with form interaction state tracking
 *
 * @public
 */
export function FormMixin<TBase extends Constructor<HelixElement>>(
  superClass: TBase,
): TBase & Constructor<FormMixinInterface> {
  class FormMixinClass extends (superClass as Constructor<HelixElement>) {
    // ─── Interaction State ───────────────────────────────────────────────────

    /** @internal */
    private _dirty = false;

    /** @internal */
    private _touched = false;

    // ─── Public Getters ──────────────────────────────────────────────────────

    /**
     * True after the user has modified the field value at least once.
     * Resets to false on form reset.
     */
    get dirty(): boolean {
      return this._dirty;
    }

    /**
     * True after the field has received and lost focus at least once.
     * Resets to false on form reset.
     */
    get touched(): boolean {
      return this._touched;
    }

    /**
     * True while the field has never been modified. Opposite of `dirty`.
     */
    get pristine(): boolean {
      return !this._dirty;
    }

    // ─── Validity Delegation ─────────────────────────────────────────────────

    /**
     * Delegates to `ElementInternals.checkValidity()`.
     * The host element must have `static formAssociated = true`.
     */
    checkValidity(): boolean {
      return this._internals.checkValidity();
    }

    /**
     * Delegates to `ElementInternals.reportValidity()`.
     * The host element must have `static formAssociated = true`.
     */
    reportValidity(): boolean {
      return this._internals.reportValidity();
    }

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    /**
     * Calls `_updateValidity()` after every Lit update cycle.
     * @internal
     */
    override updated(changedProperties: PropertyValues): void {
      super.updated(changedProperties);
      this._updateValidity();
    }

    // ─── Hook Methods ────────────────────────────────────────────────────────

    /**
     * Override in the host component to run constraint validation logic.
     * Called automatically by `updated()`. Use `this._internals.setValidity()`
     * inside this method.
     *
     * Part of the FormMixin subclassing contract.
     *
     * @protected
     */
    _updateValidity(): void {
      // Default: valid. Subclasses override to apply constraints.
    }

    // ─── Interaction State Helpers ───────────────────────────────────────────

    /**
     * Advance `dirty` state. Call from the native input's `input` event.
     *
     * Part of the FormMixin subclassing contract.
     *
     * @protected
     */
    _handleInteractionInput(): void {
      if (!this._dirty) {
        const prev = this._dirty;
        this._dirty = true;
        this.requestUpdate('_dirty', prev);
      }
    }

    /**
     * Advance `touched` state. Call from the native input's `blur` event.
     *
     * Part of the FormMixin subclassing contract.
     *
     * @protected
     */
    _handleInteractionBlur(): void {
      if (!this._touched) {
        const prev = this._touched;
        this._touched = true;
        this.requestUpdate('_touched', prev);
      }
    }

    /**
     * Reset interaction state to initial values.
     * Call from `_onFormReset()` in the host component.
     *
     * Part of the FormMixin subclassing contract.
     *
     * @protected
     */
    _resetInteractionState(): void {
      if (this._dirty || this._touched) {
        const prevDirty = this._dirty;
        const prevTouched = this._touched;
        this._dirty = false;
        this._touched = false;
        this.requestUpdate('_dirty', prevDirty);
        this.requestUpdate('_touched', prevTouched);
      }
    }
  }

  return FormMixinClass as unknown as TBase & Constructor<FormMixinInterface>;
}
