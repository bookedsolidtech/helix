import { html, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement } from '../../base/index.js';
import { helixToggleButtonStyles } from './hx-toggle-button.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

/** Detail for the hx-toggle event dispatched by hx-toggle-button. */
export interface HxToggleDetail {
  pressed: boolean;
}

/**
 * A two-state toggle button that communicates a pressed/unpressed status to
 * assistive technology via `aria-pressed`. Supports multiple visual variants
 * and sizes, prefix/suffix slots, full ElementInternals form association, and
 * a distinct pressed visual state for every variant.
 *
 * @summary Two-state toggle button with pressed/unpressed ARIA semantics.
 *
 * @tag hx-toggle-button
 *
 * @slot - Default slot for the button label text or content.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @fires {CustomEvent<{pressed: boolean}>} hx-toggle - Dispatched when the
 *   toggle state changes. Not dispatched when the button is disabled.
 *
 * @csspart button - The native `<button>` element.
 * @csspart label - The label text wrapper span.
 * @csspart prefix - The prefix slot container span.
 * @csspart suffix - The suffix slot container span.
 *
 * @cssprop [--hx-toggle-button-bg=var(--hx-color-primary-500)] - Button background color.
 * @cssprop [--hx-toggle-button-color=var(--hx-color-neutral-0)] - Button text color.
 * @cssprop [--hx-toggle-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-toggle-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-toggle-button-font-family=var(--hx-font-family-sans)] - Button font family.
 * @cssprop [--hx-toggle-button-font-weight=var(--hx-font-weight-semibold)] - Button font weight.
 * @cssprop [--hx-toggle-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-toggle-button-pressed-bg=var(--hx-color-primary-500)] - Background when pressed (variant-specific fallback applies).
 * @cssprop [--hx-toggle-button-pressed-color=var(--hx-color-neutral-0)] - Text color when pressed (variant-specific fallback applies).
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-filter-brightness-hover] - CSS filter.
 * @cssprop [--hx-filter-brightness-active] - CSS filter.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-space-6] - Spacing token.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-color-primary-50] - Color.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-color-primary-700] - Color.
 * @cssprop [--hx-color-primary-100] - Color.
 * @cssprop [--hx-color-neutral-50] - Color.
 * @cssprop [--hx-color-neutral-500] - Color.
 */
@customElement('hx-toggle-button')
export class HelixToggleButton extends HelixElement {
  static override styles = [helixToggleButtonStyles, forcedColorsInteractive];

  // ─── Form Association ───

  /** @internal */
  static override formAssociated = true;

  /** @internal */
  @query('slot:not([name])') private _defaultSlot!: HTMLSlotElement | null;

  // ─── Public Properties ───

  /**
   * Whether the toggle button is in the pressed state.
   * Reflected as an attribute so CSS selectors like `:host([pressed])` work.
   * @attr pressed
   */
  @property({ type: Boolean, reflect: true })
  pressed = false;

  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline' = 'secondary';

  /**
   * Size of the button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled. Prevents all interaction and form actions.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Form field name submitted via ElementInternals when the button is pressed.
   * @attr name
   */
  @property({ type: String })
  name: string | undefined = undefined;

  /**
   * Form field value submitted via ElementInternals when the button is pressed.
   * @attr value
   */
  @property({ type: String })
  value: string | undefined = undefined;

  /**
   * Accessible label forwarded to the inner `<button>` as `aria-label`.
   * Required for icon-only toggle buttons where no visible text is present.
   * @attr label
   */
  @property({ type: String })
  label: string | undefined = undefined;

  /**
   * When true, the button must be in the pressed state for the form to be submitted.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  // ─── Form API ───

  /** Returns the ValidityState object. */
  override get validity(): ValidityState {
    return this._internals.validity;
  }

  /** Returns the current validation message. */
  override get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** Checks whether the button satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  /**
   * Handle for the shared IDREF observer. See `installAriaIdrefMirror()`.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Default-slot text content captured for use as the host's accessible name
   * when no explicit `label`/`aria-label`/`aria-labelledby` is supplied.
   * Codex round-1 finding #9.
   * @internal
   */
  @state() private _slotLabelText: string = '';

  /** No-IDL-ref fallback tokens applied to the inner button. @internal */
  @state() private _fallbackAriaLabelledBy: string | null = null;
  /** @internal */
  @state() private _fallbackAriaDescribedBy: string | null = null;
  /** @internal */
  @state() private _fallbackAriaLabel: string | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Seed root-independent semantics from the moment of connection so AT
    // sees the toggle role + pressed state before the first paint.
    this._syncHostAriaSemantics();
    // Codex round-1 finding #1: host is the canonical announced surface;
    // make it the focus target so the inner `<button>` can be demoted via
    // `aria-hidden + tabindex=-1` without violating the aria-hidden-focus
    // rule.
    if (!this.hasAttribute('tabindex') && !this.disabled) {
      this.setAttribute('tabindex', '0');
    }
    this.addEventListener('keydown', this._handleHostKeyDown);
    this.addEventListener('click', this._handleHostClickRouted);
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleHostKeyDown);
    this.removeEventListener('click', this._handleHostClickRouted);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  /** @internal */
  private _handleHostKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    if (e.target !== this) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._invokeToggle();
    }
  };

  /**
   * Host-level click router. The inner `<button>` is `aria-hidden + tabindex=-1`
   * but still receives clicks via mouse activation; toggling is handled by
   * the inner `_handleClick`. Host-level clicks (composed path origin === host)
   * only come from AT activation or programmatic triggers, so we route those
   * to the toggle pipeline.
   * @internal
   */
  private _handleHostClickRouted = (e: MouseEvent): void => {
    if (this.disabled) return;
    // Only fire when the host itself originated the click — inner-button
    // clicks bubble through here too but are handled by `_handleClick`.
    const path = e.composedPath();
    if (path[0] !== this) return;
    this._invokeToggle();
  };

  /** @internal */
  private _invokeToggle(): void {
    this.pressed = !this.pressed;
    this._syncFormValue();
    this.dispatchEvent(
      new CustomEvent<{ pressed: boolean }>('hx-toggle', {
        bubbles: true,
        composed: true,
        detail: { pressed: this.pressed },
      }),
    );
  }

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);

    // Track default-slot text content so it can serve as the accessible
    // name when no explicit label is set. Codex round-1 finding #9.
    this._captureSlotLabelText();

    if (!this.label) {
      const slot = this._defaultSlot;
      const hasSlotText = slot
        ? slot.assignedNodes({ flatten: true }).some((n) => n.textContent?.trim())
        : false;
      if (!hasSlotText) {
        console.warn(
          '[hx-toggle-button] No accessible label found. Set the `label` attribute or provide slot text content for WCAG 4.1.2 compliance.',
        );
      }
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (
      changedProperties.has('pressed') ||
      changedProperties.has('value') ||
      changedProperties.has('required')
    ) {
      this._syncFormValue();
    }

    if (changedProperties.has('disabled')) {
      this.setAttribute('tabindex', this.disabled ? '-1' : '0');
    }

    // Host-elevated ARIA semantics — see _syncHostAriaSemantics.
    this._syncHostAriaSemantics();
  }

  /**
   * Reads the default slot's flattened text content into `_slotLabelText`.
   * Called from `firstUpdated()` and `slotchange` so host-canonical semantics
   * pick up slotted label text. Codex round-1 finding #9.
   * @internal
   */
  private _captureSlotLabelText(): void {
    const slot = this._defaultSlot;
    if (!slot) {
      this._slotLabelText = '';
      return;
    }
    const text = slot
      .assignedNodes({ flatten: true })
      .map((n) => n.textContent ?? '')
      .join(' ')
      .trim();
    this._slotLabelText = text;
  }

  /** @internal */
  private _handleDefaultSlotChange(): void {
    this._captureSlotLabelText();
    this._syncHostAriaSemantics();
  }

  /**
   * Mirrors toggle-button semantics onto the host via ElementInternals so that
   * consumer-supplied `aria-label`, `aria-labelledby`, and `aria-describedby`
   * on `<hx-toggle-button>` reach the announced control. The codex aria-group-2
   * finding identified that the inner shadow `<button>` was the only carrier of
   * the toggle role + pressed state, leaving host-level IDREF tokens stranded
   * across the shadow boundary.
   *
   * The shadow `<button>` keeps `aria-pressed`/`aria-label` mirrored for
   * backwards-compat with existing tests and for browsers without IDL element
   * references; the host is the canonical announced surface.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    internals.role = 'button';
    internals.ariaPressed = this.pressed ? 'true' : 'false';
    internals.ariaDisabled = this.disabled ? 'true' : 'false';
    // Codex round-1 finding #6: drive aria-invalid from the live ValidityState
    // so a required-but-unpressed toggle is announced as invalid even before
    // any visible affordance renders. `_updateValidity()` calls this method
    // synchronously after every `setValidity()`.
    internals.ariaInvalid = !internals.validity.valid ? 'true' : 'false';

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const hasLabelledBy = !!this.getAttribute('aria-labelledby');
    let resolvedLabel: string | null;
    if (hostAriaLabel) {
      resolvedLabel = hostAriaLabel;
    } else if (hasLabelledBy) {
      resolvedLabel = null;
    } else if (this.label) {
      resolvedLabel = this.label;
    } else {
      // Codex round-1 finding #9: default-slot text becomes the accessible
      // name when no explicit label is provided. Without this, slotted text
      // never reaches the host's announced surface.
      resolvedLabel = this._slotLabelText || null;
    }
    internals.ariaLabel = resolvedLabel;

    if (supportsIdrefElementReferences(internals)) {
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;

      const externalLabelTokens = this.getAttribute('aria-labelledby');
      const externalDescTokens = this.getAttribute('aria-describedby');

      const labelEls = resolveIdrefTokens(this, externalLabelTokens);
      refsInternals.ariaLabelledByElements = labelEls.length > 0 ? labelEls : null;

      const descEls = resolveIdrefTokens(this, externalDescTokens);
      refsInternals.ariaDescribedByElements = descEls.length > 0 ? descEls : null;
      // Clear fallbacks when IDL refs are available.
      this._fallbackAriaLabelledBy = null;
      this._fallbackAriaDescribedBy = null;
      this._fallbackAriaLabel = null;
    } else {
      // Codex round-1 finding #8: mirror consumer tokens onto the inner
      // button so it has an accessible name on no-IDL-ref browsers.
      this._fallbackAriaLabelledBy = this.getAttribute('aria-labelledby') || null;
      this._fallbackAriaDescribedBy = this.getAttribute('aria-describedby') || null;
      this._fallbackAriaLabel = resolvedLabel;
    }
  }

  protected override _onFormReset(): void {
    this.pressed = false;
  }

  protected override _onFormStateRestore(
    state: string | File | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    this.pressed = typeof state === 'string' && state === 'pressed';
  }

  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Private Helpers ───

  /** @internal */
  private _syncFormValue(): void {
    if (this.pressed && this.value !== undefined) {
      // Pass explicit state 'pressed' so formStateRestoreCallback can reliably detect it.
      this._internals.setFormValue(this.value, 'pressed');
    } else {
      this._internals.setFormValue(null);
    }
    this._updateValidity();
  }

  /** @internal */
  private _updateValidity(): void {
    if (this.required && !this.pressed) {
      this._internals.setValidity(
        { valueMissing: true },
        'Please activate this toggle button.',
        this.shadowRoot?.querySelector<HTMLElement>('[part="button"]') ?? undefined,
      );
    } else {
      this._internals.setValidity({});
    }
    // Codex round-1 finding #6: keep `internals.ariaInvalid` aligned with the
    // current `ValidityState`.
    this._syncHostAriaSemantics();
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this.pressed = !this.pressed;
    this._syncFormValue();

    /**
     * Dispatched when the toggle state changes.
     * @event hx-toggle
     */
    this.dispatchEvent(
      new CustomEvent<{ pressed: boolean }>('hx-toggle', {
        bubbles: true,
        composed: true,
        detail: { pressed: this.pressed },
      }),
    );
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderInner() {
    return html`
      <span part="prefix" class="button__prefix">
        <slot name="prefix"></slot>
      </span>
      <span part="label" class="button__label">
        <slot @slotchange=${this._handleDefaultSlotChange}></slot>
      </span>
      <span part="suffix" class="button__suffix">
        <slot name="suffix"></slot>
      </span>
    `;
  }

  // ─── Render ───

  override render() {
    const classes = {
      button: true,
      [`button--${this.variant}`]: true,
      [`button--${this.size}`]: true,
      'button--pressed': this.pressed,
    };

    // Codex round-1 finding #8: on no-IDL-ref browsers fall back to mirroring
    // host aria tokens onto the inner button so it has an accessible name
    // when focused.
    const innerAriaLabel = this._fallbackAriaLabel ?? this.label ?? undefined;
    const innerAriaLabelledBy = this._fallbackAriaLabelledBy ?? undefined;
    const innerAriaDescribedBy = this._fallbackAriaDescribedBy ?? undefined;

    return html`
      <button
        part="button"
        class=${classMap(classes)}
        ?disabled=${this.disabled}
        type="button"
        tabindex="-1"
        aria-pressed=${this.pressed ? 'true' : 'false'}
        aria-label=${ifDefined(innerAriaLabel)}
        aria-labelledby=${ifDefined(innerAriaLabelledBy)}
        aria-describedby=${ifDefined(innerAriaDescribedBy)}
        aria-hidden="true"
        @click=${this._handleClick}
      >
        ${this._renderInner()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-toggle-button': HelixToggleButton;
  }
}
