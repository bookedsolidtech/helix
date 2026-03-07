import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixMessageBarStyles } from './hx-message-bar.styles.js';

/** Message bar variant determines visual styling and ARIA semantics. */
type MessageBarVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * A full-width inline notification bar for page-level or section-level messages.
 * Distinct from hx-alert (component-level) — hx-message-bar is block-level and full-width.
 *
 * @summary Full-width inline message bar for page or section notifications.
 *
 * @tag hx-message-bar
 *
 * @slot - Default slot for message content.
 * @slot icon - Custom icon to override the default variant icon.
 * @slot action - CTA button or link rendered within the message bar.
 *
 * @fires {CustomEvent<{reason: string}>} hx-close - Dispatched when the user dismisses the message bar.
 *
 * @csspart base - The outer message bar container.
 * @csspart icon - The icon container.
 * @csspart message - The message content area.
 * @csspart action - The action slot container.
 * @csspart close-button - The dismiss button (only rendered when closable).
 *
 * @cssprop [--hx-message-bar-bg=var(--hx-color-info-50)] - Background color.
 * @cssprop [--hx-message-bar-color=var(--hx-color-info-800)] - Text color.
 * @cssprop [--hx-message-bar-border-color=var(--hx-color-info-200)] - Border color.
 * @cssprop [--hx-message-bar-icon-color=var(--hx-color-info-500)] - Icon color.
 * @cssprop [--hx-message-bar-padding=var(--hx-space-4)] - Padding.
 * @cssprop [--hx-message-bar-gap=var(--hx-space-3)] - Gap between elements.
 * @cssprop [--hx-message-bar-font-family=var(--hx-font-family-sans)] - Font family.
 */
@customElement('hx-message-bar')
export class HelixMessageBar extends LitElement {
  static override styles = [tokenStyles, helixMessageBarStyles];

  // ─── Properties ───

  /**
   * Visual variant that determines colors and ARIA semantics.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: MessageBarVariant = 'info';

  /**
   * Whether the message bar can be dismissed by the user.
   * @attr closable
   */
  @property({ type: Boolean, reflect: true })
  closable = false;

  /**
   * Whether the message bar is visible. Set to false to hide without removing from DOM.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = true;

  /**
   * Whether the message bar is sticky at the top of its scroll container.
   * @attr sticky
   */
  @property({ type: Boolean, reflect: true })
  sticky = false;

  // ─── Private Helpers ───

  private get _isAssertive(): boolean {
    return this.variant === 'error' || this.variant === 'warning';
  }

  private get _role(): string {
    return this._isAssertive ? 'alert' : 'status';
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

  private _renderDefaultIcon() {
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

  private _renderCloseIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
      />
    </svg>`;
  }

  // ─── Event Handling ───

  private _handleClose(): void {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('hx-close', {
        bubbles: true,
        composed: true,
        detail: { reason: 'user' },
      }),
    );
  }

  private _handleCloseKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this._handleClose();
    }
  }

  // ─── Render ───

  override render() {
    const classes = {
      'message-bar': true,
      [`message-bar--${this.variant}`]: true,
      'message-bar--sticky': this.sticky,
    };

    return html`
      <div part="base" class=${classMap(classes)} role=${this._role}>
        <div part="icon" class="message-bar__icon">
          <slot name="icon">${this._renderDefaultIcon()}</slot>
        </div>

        <div part="message" class="message-bar__message">
          <slot></slot>
        </div>

        <div part="action" class="message-bar__action">
          <slot name="action"></slot>
        </div>

        ${this.closable
          ? html`
              <button
                part="close-button"
                class="message-bar__close-button"
                aria-label="Close"
                @click=${this._handleClose}
                @keydown=${this._handleCloseKeydown}
              >
                ${this._renderCloseIcon()}
              </button>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-message-bar': HelixMessageBar;
  }
}

export type { HelixMessageBar as WcMessageBar };
