import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixAlertStyles } from './hx-alert.styles.js';

/** Alert variant determines visual styling and ARIA semantics. */
type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * A feedback component for communicating status messages, warnings, and errors.
 * Critical for healthcare patient safety alerts.
 *
 * @summary Feedback alert for status messages with variant-based styling and ARIA live regions.
 *
 * @tag hx-alert
 *
 * @slot - Default slot for alert message content.
 * @slot icon - Custom icon to override the default variant icon.
 * @slot actions - Action buttons rendered within the alert.
 *
 * @fires {CustomEvent<{reason: string}>} hx-close - Dispatched when the user dismisses the alert.
 * @fires {CustomEvent} hx-after-close - Dispatched after the alert is dismissed.
 *
 * @csspart alert - The outer alert container.
 * @csspart icon - The icon container.
 * @csspart message - The message content area.
 * @csspart close-button - The dismiss button (only rendered when closable).
 * @csspart actions - The actions container.
 *
 * @cssprop [--hx-alert-bg=var(--hx-color-info-50)] - Alert background color.
 * @cssprop [--hx-alert-color=var(--hx-color-info-800)] - Alert text color.
 * @cssprop [--hx-alert-border-color=var(--hx-color-info-200)] - Alert border color.
 * @cssprop [--hx-alert-border-radius=var(--hx-border-radius-md)] - Alert border radius.
 * @cssprop [--hx-alert-border-width=var(--hx-border-width-thin)] - Alert border width.
 * @cssprop [--hx-alert-padding=var(--hx-space-4)] - Alert padding.
 * @cssprop [--hx-alert-gap=var(--hx-space-3)] - Gap between alert elements.
 * @cssprop [--hx-alert-icon-color=var(--hx-color-info-500)] - Alert icon color.
 * @cssprop [--hx-alert-font-family=var(--hx-font-family-sans)] - Alert font family.
 */
@customElement('hx-alert')
export class HelixAlert extends LitElement {
  static override styles = [tokenStyles, helixAlertStyles];

  // ─── Properties ───

  /**
   * Visual variant of the alert that determines colors and ARIA semantics.
   * @attr variant
   * @default 'info'
   */
  @property({ type: String, reflect: true })
  variant: AlertVariant = 'info';

  /**
   * Whether the alert can be dismissed by the user.
   * @attr closable
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  closable: boolean = false;

  /**
   * Whether the alert is visible. Set to false to hide the alert.
   * @attr open
   * @default true
   */
  @property({ type: Boolean, reflect: true })
  open: boolean = true;

  // ─── Private Helpers ───

  /** Returns true when the variant requires assertive announcement. */
  private get _isAssertive(): boolean {
    return this.variant === 'error' || this.variant === 'warning';
  }

  // ─── Default Icons ───

  private _renderInfoIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 4.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.25 9a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0V9z"
      />
    </svg>`;
  }

  private _renderSuccessIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.03 6.28a.75.75 0 00-1.06-1.06L9 10.19 7.78 8.97a.75.75 0 00-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.5-3.5z"
      />
    </svg>`;
  }

  private _renderWarningIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M8.49 2.92a1.75 1.75 0 013.02 0l6.25 10.83A1.75 1.75 0 0116.25 16H3.75a1.75 1.75 0 01-1.51-2.25L8.49 2.92zM10 7a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0110 7zm0 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
      />
    </svg>`;
  }

  private _renderErrorIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm-1.72 5.22a.75.75 0 011.06 0L10 7.94l.66-.72a.75.75 0 111.06 1.06L11.06 9l.66.72a.75.75 0 11-1.06 1.06L10 10.06l-.66.72a.75.75 0 01-1.06-1.06L8.94 9l-.66-.72a.75.75 0 010-1.06z"
      />
    </svg>`;
  }

  private _renderCloseIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
      />
    </svg>`;
  }

  // ─── Extension API ───

  /**
   * Override to customize the CSS classes applied to the alert container.
   * Called during render. Merge with super's result to preserve base styling.
   * @protected
   * @since 1.0.0
   */
  protected getAlertClasses(): Record<string, boolean> {
    return {
      alert: true,
      [`alert--${this.variant}`]: true,
    };
  }

  /**
   * Override to customize the ARIA role based on variant or custom logic.
   * Defaults to 'alert' for error/warning variants, 'status' for others.
   * @protected
   * @since 1.0.0
   */
  protected getAriaRole(): string {
    return this._isAssertive ? 'alert' : 'status';
  }

  /**
   * Override to customize the aria-live value based on variant or custom logic.
   * Defaults to 'assertive' for error/warning variants, 'polite' for others.
   * @protected
   * @since 1.0.0
   */
  protected getAriaLive(): string {
    return this._isAssertive ? 'assertive' : 'polite';
  }

  /**
   * Override to customize the default icon rendered for the current variant.
   * Subclasses can return custom icons or html`${nothing}` to suppress the icon.
   * @protected
   * @since 1.0.0
   */
  protected renderDefaultIcon(): unknown {
    switch (this.variant) {
      case 'success':
        return this._renderSuccessIcon();
      case 'warning':
        return this._renderWarningIcon();
      case 'error':
        return this._renderErrorIcon();
      case 'info':
      default:
        return this._renderInfoIcon();
    }
  }

  /**
   * Override to customize the close button rendered when closable is true.
   * Return nothing to suppress the close button entirely.
   * @protected
   * @since 1.0.0
   */
  protected renderCloseButton(): unknown {
    return html`
      <button
        part="close-button"
        class="alert__close-button"
        aria-label="Close"
        @click=${this.handleClose}
      >
        ${this._renderCloseIcon()}
      </button>
    `;
  }

  /**
   * Handles the close action: sets open to false and dispatches close events.
   * Override to add custom close behavior (e.g., animation before hiding).
   * @protected
   * @since 1.0.0
   */
  protected handleClose(): void {
    this.open = false;

    /**
     * Dispatched when the user dismisses the alert.
     * @event hx-close
     */
    this.dispatchEvent(
      new CustomEvent<{ reason: string }>('hx-close', {
        bubbles: true,
        composed: true,
        detail: { reason: 'user' },
      }),
    );

    /**
     * Dispatched after the alert is dismissed.
     * @event hx-after-close
     */
    this.dispatchEvent(
      new CustomEvent<void>('hx-after-close', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ─── Render ───

  override render(): TemplateResult {
    return html`
      <div
        part="alert"
        class=${classMap(this.getAlertClasses())}
        role=${this.getAriaRole()}
        aria-live=${this.getAriaLive()}
      >
        <div part="icon" class="alert__icon">
          <slot name="icon">${this.renderDefaultIcon()}</slot>
        </div>

        <div part="message" class="alert__message">
          <slot></slot>
          <div part="actions" class="alert__actions">
            <slot name="actions"></slot>
          </div>
        </div>

        ${this.closable ? this.renderCloseButton() : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-alert': HelixAlert;
  }
}
