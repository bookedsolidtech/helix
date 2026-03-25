import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { HelixElement } from '../../base/index.js';
import { createIdCounter } from '../../base/index.js';
import { helixClinicalStatusStyles } from './hx-clinical-status.styles.js';

/** Severity levels for clinical status indicators. */
export type ClinicalStatusSeverity = 'info' | 'warning' | 'critical' | 'success';

/** Human-readable severity labels for screen reader announcements. */
const SEVERITY_LABELS: Record<ClinicalStatusSeverity, string> = {
  info: 'Information:',
  warning: 'Warning:',
  critical: 'Critical:',
  success: 'Success:',
};

/**
 * A healthcare-focused clinical status indicator designed to prevent alert fatigue.
 * Provides standardized severity levels with appropriate ARIA semantics —
 * `role="alert"` for critical (assertive announcement) and `role="status"` for
 * info, warning, and success (polite announcement).
 *
 * In healthcare contexts, critical alerts must never be silently dismissed.
 * The `persistent` property (default `true` for critical severity) prevents
 * accidental dismissal of patient-safety-relevant information.
 *
 * @summary Clinical status indicator for healthcare alert fatigue prevention.
 *
 * @tag hx-clinical-status
 *
 * @fires {CustomEvent} hx-dismiss - Dispatched when the user dismisses the status.
 * @fires {CustomEvent} hx-acknowledge - Dispatched when the user acknowledges a persistent status.
 *
 * @csspart container - The outer status container.
 * @csspart icon - The severity icon container.
 * @csspart message - The message text area.
 * @csspart dismiss-button - The dismiss/acknowledge button.
 *
 * @cssprop [--hx-clinical-status-bg] - Background color (set per severity).
 * @cssprop [--hx-clinical-status-color] - Text color (set per severity).
 * @cssprop [--hx-clinical-status-border-color] - Border color (set per severity).
 * @cssprop [--hx-clinical-status-accent-color] - Left accent stripe color (set per severity).
 * @cssprop [--hx-clinical-status-accent-width=4px] - Width of the left accent stripe.
 * @cssprop [--hx-clinical-status-border-radius] - Container border radius.
 * @cssprop [--hx-clinical-status-border-width] - Container border width.
 * @cssprop [--hx-clinical-status-padding] - Container padding.
 * @cssprop [--hx-clinical-status-padding-compact] - Container padding in compact mode.
 * @cssprop [--hx-clinical-status-gap] - Gap between elements.
 * @cssprop [--hx-clinical-status-gap-compact] - Gap between elements in compact mode.
 * @cssprop [--hx-clinical-status-icon-color] - Icon color (set per severity).
 * @cssprop [--hx-clinical-status-font-family] - Font family.
 * @cssprop [--hx-touch-target-size=44px] - Minimum touch target size for the dismiss button.
 */
const nextId = createIdCounter('hx-clinical-status');

@customElement('hx-clinical-status')
export class HelixClinicalStatus extends HelixElement {
  static override styles = [tokenStyles, helixClinicalStatusStyles];

  /** @internal SSR-safe unique ID for ARIA relationships. */
  private readonly _componentId = nextId();

  // ─── Properties ───

  /**
   * Severity level of the clinical status. Determines visual styling and ARIA semantics.
   * Critical severity uses `role="alert"` for immediate screen reader announcement.
   * @attr severity
   */
  @property({ type: String, reflect: true })
  severity: ClinicalStatusSeverity = 'info';

  /**
   * The status message text to display.
   * @attr message
   */
  @property({ type: String })
  message = '';

  /**
   * Whether the user can dismiss this status indicator.
   * @attr dismissible
   */
  @property({ type: Boolean, reflect: true })
  dismissible = false;

  /**
   * Whether the status survives dismiss — requires explicit acknowledgment instead.
   * Defaults to `true` for critical severity when not explicitly set.
   * @attr persistent
   */
  @property({ type: Boolean })
  persistent: boolean | undefined = undefined;

  /**
   * Compact mode for dense clinical UIs such as patient dashboards.
   * Reduces padding, gap, and icon size.
   * @attr compact
   */
  @property({ type: Boolean, reflect: true })
  compact = false;

  // ─── Computed helpers ───

  /** Returns the effective persistent value, defaulting based on severity. */
  private get _effectivePersistent(): boolean {
    if (this.persistent !== undefined) return this.persistent;
    return this.severity === 'critical';
  }

  /** Returns the ARIA role: alert for critical (assertive), status for others (polite). */
  private get _role(): string {
    return this.severity === 'critical' ? 'alert' : 'status';
  }

  /** Returns the severity label for screen readers. */
  private get _severityLabel(): string {
    return SEVERITY_LABELS[this.severity] ?? 'Information:';
  }

  /** Returns the dismiss button label based on persistent mode. */
  private get _dismissLabel(): string {
    return this._effectivePersistent ? 'Acknowledge status' : 'Dismiss status';
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', this._role);
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('severity')) {
      this.setAttribute('role', this._role);
    }
  }

  // ─── Default Icons ───

  /** @internal */
  private _renderInfoIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 4.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.25 9a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0V9z"
      />
    </svg>`;
  }

  /** @internal */
  private _renderSuccessIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.03 6.28a.75.75 0 00-1.06-1.06L9 10.19 7.78 8.97a.75.75 0 00-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.5-3.5z"
      />
    </svg>`;
  }

  /** @internal */
  private _renderWarningIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M8.49 2.92a1.75 1.75 0 013.02 0l6.25 10.83A1.75 1.75 0 0116.25 16H3.75a1.75 1.75 0 01-1.51-2.25L8.49 2.92zM10 7a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0110 7zm0 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
      />
    </svg>`;
  }

  /** @internal */
  private _renderCriticalIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm-1.72 5.22a.75.75 0 011.06 0L10 7.94l.66-.72a.75.75 0 111.06 1.06L11.06 9l.66.72a.75.75 0 11-1.06 1.06L10 10.06l-.66.72a.75.75 0 01-1.06-1.06L8.94 9l-.66-.72a.75.75 0 010-1.06z"
      />
    </svg>`;
  }

  /** @internal */
  private _renderDefaultIcon() {
    switch (this.severity) {
      case 'success':
        return this._renderSuccessIcon();
      case 'warning':
        return this._renderWarningIcon();
      case 'critical':
        return this._renderCriticalIcon();
      case 'info':
      default:
        return this._renderInfoIcon();
    }
  }

  /** @internal */
  private _renderCloseIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
      />
    </svg>`;
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleDismiss(): void {
    if (this._effectivePersistent) {
      /**
       * Dispatched when the user acknowledges a persistent clinical status.
       * The status remains visible; the consuming application decides the response.
       * @event hx-acknowledge
       */
      this.dispatchEvent(
        new CustomEvent<void>('hx-acknowledge', {
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      this.hidden = true;

      /**
       * Dispatched when the user dismisses a non-persistent clinical status.
       * @event hx-dismiss
       */
      this.dispatchEvent(
        new CustomEvent<void>('hx-dismiss', {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // ─── Render ───

  override render() {
    const classes = {
      'clinical-status': true,
      [`clinical-status--${this.severity}`]: true,
    };

    const severityLabel = this._severityLabel;

    return html`
      <div part="container" class=${classMap(classes)}>
        <div part="icon" class="clinical-status__icon">${this._renderDefaultIcon()}</div>

        <span class="sr-only">${severityLabel}</span>

        <div part="message" class="clinical-status__message">${this.message}</div>

        ${this.dismissible
          ? html`
              <button
                part="dismiss-button"
                class="clinical-status__dismiss"
                aria-label=${this._dismissLabel}
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
    'hx-clinical-status': HelixClinicalStatus;
  }
}
