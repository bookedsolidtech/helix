import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixCopyButtonStyles } from './hx-copy-button.styles.js';

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
 * @fires {CustomEvent<{value: string; error: unknown}>} hx-copy-error - Dispatched
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
 */
@customElement('hx-copy-button')
export class HelixCopyButton extends LitElement {
  static override styles = [tokenStyles, helixCopyButtonStyles];

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

  // ─── Private State ───

  /** True while the success feedback window is active. */
  @state() private _copied = false;

  /** Non-empty string shown in the aria-live region; cleared when not active. */
  @state() private _announcement = '';

  /** Timeout handle used to revert the copied state. */
  private _feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Lifecycle ───

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
  private _effectiveDuration(): number {
    return Math.max(this.feedbackDuration, MIN_FEEDBACK_DURATION);
  }

  /**
   * Returns the effective size, falling back to 'md' if the runtime value is
   * not in the set of valid sizes. Prevents `button--xl` and similar class
   * names that have no matching CSS rule.
   */
  private _effectiveSize(): 'sm' | 'md' | 'lg' {
    return VALID_SIZES.has(this.size) ? this.size : 'md';
  }

  private _clearFeedbackTimer(): void {
    if (this._feedbackTimer !== null) {
      clearTimeout(this._feedbackTimer);
      this._feedbackTimer = null;
    }
  }

  private async _copyToClipboard(): Promise<void> {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(this.value);
    } else {
      // Legacy execCommand fallback for environments without Clipboard API.
      const textarea = document.createElement('textarea');
      textarea.value = this.value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (!success) {
        throw new Error('execCommand("copy") returned false');
      }
    }
  }

  // ─── Event Handling ───

  private _handleClick(): void {
    if (this.disabled) {
      return;
    }

    void this._performCopy();
  }

  private async _performCopy(): Promise<void> {
    try {
      await this._copyToClipboard();
    } catch (error: unknown) {
      // Clipboard write failed — notify consumers and announce failure.
      this._announcement = 'Copy failed';

      /**
       * Dispatched when the clipboard write fails (permission denied, iframe
       * restriction, browser security policy, etc.).
       * @event hx-copy-error
       */
      this.dispatchEvent(
        new CustomEvent<{ value: string; error: unknown }>('hx-copy-error', {
          bubbles: true,
          composed: true,
          detail: { value: this.value, error },
        }),
      );
      return;
    }

    this._clearFeedbackTimer();
    this._copied = true;
    this._announcement = 'Copied';

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

  private _buttonClasses() {
    const size = this._effectiveSize();
    return {
      button: true,
      [`button--${size}`]: true,
      'button--copied': this._copied,
    };
  }

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
    const ariaLabel = this._copied ? `${this.label} — Copied` : this.label;

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
