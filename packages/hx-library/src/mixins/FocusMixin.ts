import { LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

/**
 * Mixin constructor type — must use `any[]` args per TypeScript mixin requirements (TS2545).
 * @internal
 */
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * The public interface added by FocusMixin.
 * Consumers can use this type for typed references.
 *
 * @public
 */
export interface FocusMixinInterface {
  /** True when the component host has focus (including descendant focus). */
  readonly focused: boolean;
  /** True when focus arrived via keyboard (not pointer). */
  readonly focusedVisible: boolean;
}

/**
 * FocusMixin — standardized focus delegation for HELiX web components.
 *
 * Modeled after Lion's `FocusMixin` and Material Web's `mixinDelegatesAria`.
 * Provides:
 * - `_focusableNode` getter for subclasses to declare the inner focusable element
 * - `focused` reflected attribute as a styling hook for `:host([focused])`
 * - `focusedVisible` reflected attribute for keyboard-only focus rings
 * - Delegated `focus()` / `blur()` routing to the inner element
 * - Autofocus support after first render
 *
 * ### Usage
 *
 * ```ts
 * class MyInput extends FocusMixin(HelixElement) {
 *   @query('input') private _input: HTMLInputElement | undefined;
 *
 *   protected override get _focusableNode(): HTMLElement | null {
 *     return this._input ?? null;
 *   }
 * }
 * ```
 *
 * @param superClass - A Lit element constructor to mix into
 * @returns A new class with focus management capabilities
 *
 * @public
 */
export const FocusMixin = <T extends Constructor<LitElement>>(superClass: T) => {
  class FocusMixinClass extends superClass implements FocusMixinInterface {
    /**
     * True when the component or any of its descendants has focus.
     * Reflects to attribute `focused` for CSS selector use.
     *
     * @attr focused
     */
    @property({ type: Boolean, reflect: true })
    focused = false;

    /**
     * True when focus was reached via keyboard navigation (Tab / Shift+Tab)
     * rather than pointer interaction. Reflects to attribute `focused-visible`
     * for rendering keyboard-only focus rings.
     *
     * @attr focused-visible
     */
    @property({ type: Boolean, reflect: true, attribute: 'focused-visible' })
    focusedVisible = false;

    /** @internal — whether a `focus()` call was queued before first render */
    private _focusPending = false;

    /**
     * @internal — tracks whether the most recent interaction toward this
     * element was via pointer (true) or keyboard (false).
     *
     * Set to false on `pointerdown` so that the subsequent `focusin` can
     * determine it is not keyboard-initiated.
     */
    private _lastInteractionWasPointer = false;

    /**
     * Returns the inner focusable element that `focus()` and `blur()` will
     * delegate to. Subclasses MUST override this getter.
     *
     * @returns The inner focusable element, or `null` if not yet rendered.
     * @internal
     */
    protected get _focusableNode(): HTMLElement | null {
      return null;
    }

    /**
     * Delegates focus to the inner focusable element.
     * If the element has not yet rendered, queues the focus call for
     * `firstUpdated`.
     */
    override focus(options?: FocusOptions): void {
      const node = this._focusableNode;
      if (node !== null) {
        node.focus(options);
      } else {
        this._focusPending = true;
      }
    }

    /** Delegates blur to the inner focusable element. */
    override blur(): void {
      this._focusableNode?.blur();
    }

    override connectedCallback(): void {
      super.connectedCallback();
      this.addEventListener('focusin', this._handleFocusIn);
      this.addEventListener('focusout', this._handleFocusOut);
      this.addEventListener('pointerdown', this._handlePointerDown);
      this.addEventListener('keydown', this._handleKeyDown);
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();
      this.removeEventListener('focusin', this._handleFocusIn);
      this.removeEventListener('focusout', this._handleFocusOut);
      this.removeEventListener('pointerdown', this._handlePointerDown);
      this.removeEventListener('keydown', this._handleKeyDown);
    }

    override firstUpdated(changedProperties: PropertyValues): void {
      super.firstUpdated(changedProperties);

      // Honour the native `autofocus` attribute after the first render cycle
      if (this.hasAttribute('autofocus')) {
        this.focus();
      }

      // Flush any focus() call that arrived before the shadow DOM was stamped
      if (this._focusPending) {
        this._focusPending = false;
        this.focus();
      }
    }

    // ─── Private Event Handlers ────────────────────────────────────────────────

    /** @internal */
    private _handleFocusIn = (): void => {
      this.focused = true;
      // focusedVisible is true only when focus arrived via keyboard
      this.focusedVisible = !this._lastInteractionWasPointer;
    };

    /** @internal */
    private _handleFocusOut = (): void => {
      this.focused = false;
      this.focusedVisible = false;
      // Reset for the next interaction cycle
      this._lastInteractionWasPointer = false;
    };

    /**
     * Marks the next focusin as pointer-initiated.
     * @internal
     */
    private _handlePointerDown = (): void => {
      this._lastInteractionWasPointer = true;
    };

    /**
     * Ensures that keyboard navigation (Tab / Shift+Tab arriving from outside)
     * is correctly flagged as keyboard-initiated even when no prior `pointerdown`
     * fired on this element.
     *
     * This fires BEFORE `focusin` so the flag is in the correct state when
     * `_handleFocusIn` runs.
     * @internal
     */
    private _handleKeyDown = (): void => {
      this._lastInteractionWasPointer = false;
    };
  }

  return FocusMixinClass as unknown as T & Constructor<FocusMixinInterface>;
};
