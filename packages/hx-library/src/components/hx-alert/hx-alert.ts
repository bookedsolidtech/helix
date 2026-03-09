import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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
 * @slot title - Optional title/headline for the alert.
 * @slot icon - Custom icon to override the default variant icon.
 * @slot actions - Action buttons rendered within the alert.
 *
 * @fires {CustomEvent<{reason: string}>} hx-close - Dispatched when the user dismisses the alert.
 * @fires {CustomEvent} hx-after-close - Dispatched after the alert is dismissed.
 *
 * @csspart alert - The outer alert container.
 * @csspart title - The title/headline container.
 * @csspart icon - The icon container.
 * @csspart message - The message content area.
 * @csspart close-button - The dismiss button (only rendered when dismissible).
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
 * @cssprop [--hx-touch-target-size=44px] - Minimum touch target size for the close button.
 * @cssprop [--hx-alert-accent-width=4px] - Width of the left border accent stripe.
 */
@customElement('hx-alert')
export class HelixAlert extends LitElement {
  static override styles = [tokenStyles, helixAlertStyles];

  // ─── Properties ───

  /**
   * Visual variant of the alert that determines colors and ARIA semantics.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: AlertVariant = 'info';

  /**
   * Whether the alert can be dismissed by the user.
   * @attr dismissible
   */
  @property({ type: Boolean, reflect: true })
  dismissible = false;

  /**
   * Whether the alert is visible. Set to false to hide the alert.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = true;

  /**
   * Whether to show the default variant icon. Set to false to hide the icon container entirely.
   * Note: Boolean attribute semantics apply — the attribute must be absent (not set to "false")
   * to hide the icon. `<hx-alert show-icon="false">` still shows the icon because the attribute
   * is present; use `<hx-alert>` (attribute absent) or `el.showIcon = false` to hide it.
   * @attr show-icon
   */
  @property({ type: Boolean, reflect: true, attribute: 'show-icon' })
  showIcon = true;

  /**
   * When true, applies a left border accent stripe instead of a full border.
   * Common healthcare/enterprise dashboard pattern for visual distinction of alert types.
   * @attr accent
   */
  @property({ type: Boolean, reflect: true })
  accent = false;

  /**
   * CSS selector for the element to return focus to after the alert is dismissed.
   * When set, the component will find and focus the matching element after dismissal.
   * If not set, focus management is the caller's responsibility via the hx-after-close event.
   * @attr return-focus-to
   */
  @property({ type: String, attribute: 'return-focus-to' })
  returnFocusTo: string | null = null;

  // ─── State ───

  @state()
  private _hasActions = false;

  @state()
  private _hasTitle = false;

  // ─── Private Helpers ───

  /** Returns true when the variant requires assertive announcement. */
  private get _isAssertive(): boolean {
    return this.variant === 'error' || this.variant === 'warning';
  }

  /**
   * Returns the appropriate ARIA role based on variant.
   * role="alert" implies aria-live="assertive"; role="status" implies aria-live="polite".
   * We do NOT set aria-live explicitly to avoid double-announcements in JAWS.
   */
  private get _role(): string {
    return this._isAssertive ? 'alert' : 'status';
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Apply ARIA role to the host element for reliable screen reader support across
    // Shadow DOM boundaries. Placing role on a shadow-internal element has inconsistent
    // AT support in JAWS+Chrome and VoiceOver+Safari combinations (particularly pre-2024).
    this.setAttribute('role', this._role);
    if (!this.open) {
      this.setAttribute('aria-hidden', 'true');
    }
  }

  override firstUpdated(): void {
    // Track actions slot content to avoid invisible spacing when no actions are slotted.
    const actionsSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="actions"]');
    if (actionsSlot) {
      actionsSlot.addEventListener('slotchange', () => {
        this._hasActions = actionsSlot.assignedNodes({ flatten: true }).length > 0;
      });
    }

    // Track title slot content so the title container doesn't create dead space when empty.
    const titleSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="title"]');
    if (titleSlot) {
      titleSlot.addEventListener('slotchange', () => {
        this._hasTitle = titleSlot.assignedNodes({ flatten: true }).length > 0;
      });
    }
  }

  protected override updated(changedProperties: Map<PropertyKey, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('variant')) {
      // Keep host ARIA role in sync with variant (assertive vs. polite).
      this.setAttribute('role', this._role);
    }
    if (changedProperties.has('open')) {
      // Manage aria-hidden in addition to display:none for reliable AT exclusion.
      // When open transitions from false→true, removing aria-hidden signals to AT
      // that the live region content should be announced.
      if (this.open) {
        this.removeAttribute('aria-hidden');
      } else {
        this.setAttribute('aria-hidden', 'true');
      }
    }
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

  private _handleDismiss(): void {
    this.open = false;

    /**
     * Dispatched when the user dismisses the alert.
     * @event hx-close
     */
    this.dispatchEvent(
      new CustomEvent('hx-close', {
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
      new CustomEvent('hx-after-close', {
        bubbles: true,
        composed: true,
      }),
    );

    // Return focus to a designated element if specified via returnFocusTo.
    if (this.returnFocusTo) {
      const target = document.querySelector(this.returnFocusTo);
      if (target instanceof HTMLElement) {
        target.focus();
      }
    }
  }

  // ─── Render ───

  override render() {
    const classes = {
      alert: true,
      [`alert--${this.variant}`]: true,
      'alert--accent': this.accent,
    };

    return html`
      <div part="alert" class=${classMap(classes)}>
        ${this.showIcon
          ? html`
              <div part="icon" class="alert__icon">
                <slot name="icon">${this._renderDefaultIcon()}</slot>
              </div>
            `
          : nothing}

        <div part="message" class="alert__message">
          <div part="title" class="alert__title ${this._hasTitle ? 'alert__title--visible' : ''}">
            <slot name="title"></slot>
          </div>
          <slot></slot>
          <div
            part="actions"
            class="alert__actions ${this._hasActions ? 'alert__actions--visible' : ''}"
          >
            <slot name="actions"></slot>
          </div>
        </div>

        ${this.dismissible
          ? html`
              <button
                part="close-button"
                class="alert__close-button"
                aria-label="Close"
                @click=${this._handleDismiss}
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
    'hx-alert': HelixAlert;
  }
}

export type { HelixAlert as HxAlert };
