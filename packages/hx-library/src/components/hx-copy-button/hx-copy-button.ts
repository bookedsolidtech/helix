import { html, nothing } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement } from '../../base/index.js';
import { FocusMixin } from '../../mixins/index.js';
import { helixCopyButtonStyles } from './hx-copy-button.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { applyLegacySizeAlias } from '../../utils/apply-legacy-size-alias.js';

/** Minimum allowed value for feedbackDuration (ms). */
const MIN_FEEDBACK_DURATION = 300;

/** Allowed size values for runtime validation. */
const VALID_SIZES = new Set(['sm', 'md', 'lg']);

/**
 * A clipboard copy button component that writes a given value to the system
 * clipboard. Provides idle and success states with configurable feedback
 * duration, slot-based icon overrides, and an accessible live region that
 * announces copy completion to screen reader users.
 *
 * The `aria-label` reflects the current copy state: idle shows `label`,
 * copied state appends " — Copied" so screen reader users who re-focus the
 * button after copy receive an accurate accessible name.
 *
 * Note: `aria-pressed` is intentionally NOT used. This is not a toggle button;
 * copied is a transient feedback state, not a persistent on/off toggle.
 *
 * @summary One-click clipboard copy with accessible success feedback.
 *
 * @tag hx-copy-button
 *
 * @slot - Optional label text rendered inside the button alongside the icon.
 * @slot copy-icon - Icon shown in the idle (pre-copy) state.
 * @slot success-icon - Icon shown after a successful clipboard write.
 *
 * @fires {CustomEvent<{value: string}>} hx-copy - Dispatched after the value
 *   has been successfully written to the clipboard.
 * @fires {CustomEvent<{value: string; error: Error}>} hx-copy-error - Dispatched
 *   when the clipboard write fails (permission denied, iframe restriction, etc.).
 *   The `error` detail contains the caught error for diagnostic use.
 *
 * @csspart button - The native button element.
 * @csspart icon - The icon container span wrapping the active icon slot.
 *
 * @cssprop [--hx-copy-button-bg=transparent] - Button background color.
 * @cssprop [--hx-copy-button-color=var(--hx-color-primary-500)] - Icon and text color.
 * @cssprop [--hx-copy-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-copy-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-copy-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-color-success-500] - Color.
 * @cssprop [--hx-color-success-text] - Color.
 * @cssprop [--hx-copy-button-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-filter-brightness-active] - CSS filter.
 * @cssprop [--hx-filter-brightness-hover] - CSS filter.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-copy-button/AAA-AUDIT.md
 * @keyboard-contract activate=Enter,Space; disabled-suppresses=true
 * @aria-pattern button
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/button/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-copy-button
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-copy-button')
export class HelixCopyButton extends FocusMixin(HelixElement) {
  static override styles = [helixCopyButtonStyles, forcedColorsInteractive];

  // ─── Public Properties ───

  /**
   * The text value to write to the clipboard on click. Required for the
   * component to perform a copy operation.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * Accessible label applied as `aria-label` and `title` on the button.
   * @attr label
   */
  @property({ type: String })
  label = 'Copy to clipboard';

  /**
   * Duration in milliseconds to display the success (copied) state before
   * reverting to the idle state. Values below 300 ms are clamped to 300 ms
   * to ensure the success announcement remains visible long enough for
   * assistive technology and human perception.
   * @attr feedback-duration
   */
  @property({ type: Number, attribute: 'feedback-duration' })
  feedbackDuration = 2000;

  /**
   * Visual size of the button. Maps to fixed height and padding tokens.
   * Accepts: 'sm' | 'md' | 'lg'. Invalid values are silently coerced to 'md'.
   *
   * **Accessibility (WCAG 2.5.8):** The `sm` variant uses `--hx-size-8` for
   * its minimum width and height. Ensure this token resolves to at least 24×24 px
   * (WCAG 2.5.8 AA minimum target size). For touch-primary interfaces such as
   * mobile clinical apps, prefer `md` or `lg` to meet the 44×44 px recommended
   * target size (WCAG 2.5.5 AAA / Apple HIG / Android guidelines).
   *
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled. When true, click events are suppressed
   * and clipboard writes do not occur.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Text announced to screen readers and appended to aria-label after a
   * successful copy. Also used as the content of the aria-live announcement.
   * @attr label-copied
   */
  @property({ type: String, attribute: 'label-copied' })
  labelCopied = 'Copied';

  /**
   * Accessible label announced when copy fails. Override for i18n.
   * @attr label-error
   */
  @property({ type: String, attribute: 'label-error' })
  labelError = 'Copy failed';

  // ─── Private State ───

  /** True while the success feedback window is active. */
  /** @internal */
  @state() private _copied = false;

  /** Non-empty string shown in the aria-live region; cleared when not active. */
  /** @internal */
  @state() private _announcement = '';

  /** Timeout handle used to revert the copied state. */
  /** @internal */
  private _feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── FocusMixin integration ───

  /** The inner native `<button>` element. @internal */
  @query('.button')
  private _focusEl?: HTMLElement;

  /**
   * Declares the inner focusable element for FocusMixin delegation.
   * @internal
   */
  protected get _focusableNode(): HTMLElement | null {
    return this._focusEl ?? null;
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: forward the legacy unprefixed `size` attribute to the
    // `hx-size`-mapped property (3.x shim, removed in 4.0). super chains
    // through FocusMixin.
    applyLegacySizeAlias<'sm' | 'md' | 'lg'>(this, 'hx-copy-button', (v) => {
      this.size = v;
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearFeedbackTimer();
  }

  // ─── Private Helpers ───

  /**
   * Returns the effective feedback duration, clamped to the minimum allowed
   * value. Prevents zero/negative timeouts that would cause the success state
   * to immediately revert with no visible or audible feedback.
   */
  /** @internal */
  private _effectiveDuration(): number {
    return Math.max(this.feedbackDuration, MIN_FEEDBACK_DURATION);
  }

  /**
   * Returns the effective size, falling back to 'md' if the runtime value is
   * not in the set of valid sizes. Prevents `button--xl` and similar class
   * names that have no matching CSS rule.
   */
  /** @internal */
  private _effectiveSize(): 'sm' | 'md' | 'lg' {
    return VALID_SIZES.has(this.size) ? this.size : 'md';
  }

  /** @internal */
  private _clearFeedbackTimer(): void {
    if (this._feedbackTimer !== null) {
      clearTimeout(this._feedbackTimer);
      this._feedbackTimer = null;
    }
  }

  /** @internal */
  private async _copyToClipboard(): Promise<void> {
    await navigator?.clipboard?.writeText(this.value);
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleClick(): void {
    if (this.disabled) {
      return;
    }

    void this._performCopy();
  }

  /** @internal */
  private async _performCopy(): Promise<void> {
    try {
      await this._copyToClipboard();
    } catch (error: unknown) {
      // Clipboard write failed — notify consumers and announce failure.
      this._announcement = this.labelError;

      /**
       * Dispatched when the clipboard write fails (permission denied, iframe
       * restriction, browser security policy, etc.).
       * @event hx-copy-error
       */
      this.dispatchEvent(
        new CustomEvent<{ value: string; error: Error }>('hx-copy-error', {
          bubbles: true,
          composed: true,
          detail: {
            value: this.value,
            error: error instanceof Error ? error : new Error(String(error)),
          },
        }),
      );
      return;
    }

    this._clearFeedbackTimer();
    this._copied = true;
    this._announcement = this.labelCopied;

    /**
     * Dispatched after the value has been successfully written to the
     * clipboard.
     * @event hx-copy
     */
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-copy', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );

    this._feedbackTimer = setTimeout(() => {
      this._copied = false;
      this._announcement = '';
      this._feedbackTimer = null;
    }, this._effectiveDuration());
  }

  // ─── Render Helpers ───

  /** @internal */
  private _buttonClasses() {
    const size = this._effectiveSize();
    return {
      button: true,
      [`button--${size}`]: true,
      'button--copied': this._copied,
    };
  }

  /** @internal */
  private _renderIcon() {
    // Show success-icon slot when copied, copy-icon slot otherwise.
    return html`
      <span part="icon" class="icon">
        ${this._copied
          ? html`<slot name="success-icon"></slot>`
          : html`<slot name="copy-icon"></slot>`}
      </span>
    `;
  }

  // ─── Render ───

  override render() {
    // Reflect copied state in aria-label so re-focused button has an accurate
    // accessible name (WCAG 1.3.1). The live region handles the initial
    // announcement; this covers re-focus scenarios.
    const ariaLabel = this._copied ? `${this.label} — ${this.labelCopied}` : this.label;

    return html`
      <button
        part="button"
        class=${classMap(this._buttonClasses())}
        type="button"
        ?disabled=${this.disabled}
        aria-label=${ariaLabel}
        title=${this.label}
        @click=${this._handleClick}
      >
        ${this._renderIcon()}
        <slot></slot>
      </button>

      <span aria-live="polite" aria-atomic="true" class="sr-only">
        ${this._announcement || nothing}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-copy-button': HelixCopyButton;
  }
}
