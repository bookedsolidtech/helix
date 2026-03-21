import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixBannerStyles } from './hx-banner.styles.js';

/** Banner variant determines visual styling and ARIA semantics. */
export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

/** Banner position determines CSS positioning behavior. */
export type BannerPosition = 'sticky' | 'fixed';

/**
 * A full-width page-level banner for persistent notifications and announcements.
 * Designed for healthcare applications requiring prominent system-level messaging.
 *
 * @summary Full-width page-level banner for persistent notifications with variant-based styling and ARIA live regions.
 *
 * @tag hx-banner
 *
 * @slot - Default slot for banner message content.
 * @slot action - Optional slot to override the built-in action link with custom content.
 *
 * @fires {CustomEvent<{reason: string}>} hx-dismiss - Dispatched when the user dismisses the banner.
 *
 * @csspart banner - The outer banner container.
 * @csspart icon - The icon container.
 * @csspart message - The message content area.
 * @csspart action - The action link element (only rendered when action-label and action-href are set).
 * @csspart close-button - The dismiss button (only rendered when dismissible).
 *
 * @cssprop [--hx-banner-bg=var(--hx-color-info-50)] - Banner background color.
 * @cssprop [--hx-banner-color=var(--hx-color-info-800)] - Banner text color.
 * @cssprop [--hx-banner-border-color=var(--hx-color-info-200)] - Banner bottom border color.
 * @cssprop [--hx-banner-border-width=var(--hx-border-width-thin)] - Banner bottom border width.
 * @cssprop [--hx-banner-padding=var(--hx-space-3) var(--hx-space-4)] - Banner padding.
 * @cssprop [--hx-banner-gap=var(--hx-space-3)] - Gap between banner elements.
 * @cssprop [--hx-banner-icon-color=var(--hx-color-info-500)] - Banner icon color.
 * @cssprop [--hx-banner-font-family=var(--hx-font-family-sans)] - Banner font family.
 * @cssprop [--hx-banner-action-color=var(--hx-banner-color)] - Action link color.
 * @cssprop [--hx-banner-position=sticky] - CSS position value (sticky or fixed).
 * @cssprop [--hx-banner-z-index=100] - Banner z-index for stacking context.
 * @cssprop [--hx-touch-target-size=44px] - Minimum touch target size for the close button.
 */
@customElement('hx-banner')
export class HelixBanner extends LitElement {
  static override styles = [tokenStyles, helixBannerStyles];

  // ─── Properties ───

  /**
   * Visual variant of the banner that determines colors and ARIA semantics.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: BannerVariant = 'info';

  /**
   * CSS positioning behavior. "sticky" keeps the banner in flow; "fixed" pins it to the viewport.
   * @attr position
   */
  @property({ type: String, reflect: true })
  position: BannerPosition = 'sticky';

  /**
   * Whether the banner can be dismissed by the user.
   * @attr dismissible
   */
  @property({ type: Boolean, reflect: true })
  dismissible = false;

  /**
   * Heading text for the banner, used to provide context in the action link's and
   * close button's accessible labels.
   * @attr heading
   */
  @property({ type: String })
  heading = '';

  /**
   * Label text for the optional action link. Requires action-href to render.
   * @attr action-label
   */
  @property({ type: String, attribute: 'action-label' })
  actionLabel = '';

  /**
   * URL for the optional action link. Requires action-label to render.
   * @attr action-href
   */
  @property({ type: String, attribute: 'action-href' })
  actionHref = '';

  /**
   * Whether the banner is visible. Defaults to true — banners are shown by default.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = true;

  /** Accessible label for the dismiss button. Override for localized text. */
  @property({ type: String, attribute: 'close-label' })
  closeLabel = 'Dismiss banner';

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

  // ─── Public Methods ───

  /**
   * Programmatically dismisses the banner. Sets open=false and dispatches hx-dismiss.
   */
  dismiss(): void {
    this._handleDismiss();
  }

  // ─── Event Handling ───

  private _handleDismiss(): void {
    this.open = false;

    /**
     * Dispatched when the user (or caller) dismisses the banner.
     * @event hx-dismiss
     */
    this.dispatchEvent(
      new CustomEvent<{ reason: string }>('hx-dismiss', {
        bubbles: true,
        composed: true,
        detail: { reason: 'user' },
      }),
    );
  }

  // ─── Render ───

  override render() {
    const classes = {
      banner: true,
      [`banner--${this.variant}`]: true,
    };

    const hasAction = this.actionLabel.length > 0 && this.actionHref.length > 0;

    return html`
      <div part="banner" class=${classMap(classes)}>
        <div part="icon" class="banner__icon">${this._renderDefaultIcon()}</div>

        <div part="message" class="banner__message">
          <slot></slot>
        </div>

        ${hasAction
          ? html`
              <a
                part="action"
                class="banner__action"
                href=${ifDefined(this.actionHref || undefined)}
                aria-label=${this.heading
                  ? `${this.actionLabel}: ${this.heading}`
                  : this.actionLabel}
              >
                <slot name="action">${this.actionLabel}</slot>
              </a>
            `
          : nothing}
        ${this.dismissible
          ? html`
              <button
                part="close-button"
                class="banner__close-button"
                aria-label=${this.closeLabel}
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
    'hx-banner': HelixBanner;
  }
}

export type { HelixBanner as HxBanner };
