import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { HelixElement } from '../../base/index.js';
import { createIdCounter } from '../../base/index.js';
import { helixClinicalStatusStyles } from './hx-clinical-status.styles.js';

/** Clinical severity level for alert fatigue prevention. */
export type ClinicalSeverity = 'info' | 'warning' | 'critical' | 'emergent';

const nextId = createIdCounter('hx-clinical-status');

/**
 * A clinical status indicator designed for healthcare alert fatigue prevention.
 * Standardizes clinical alert presentations to reduce cognitive overload from
 * inconsistent color/icon combinations across healthcare interfaces.
 *
 * @summary Clinical status indicator for standardized healthcare alert fatigue prevention.
 *
 * @tag hx-clinical-status
 *
 * @slot - Default slot for additional message content.
 *
 * @fires {CustomEvent} hx-dismiss - Dispatched when the user dismisses the status.
 * @fires {CustomEvent} hx-acknowledge - Dispatched when the user acknowledges a critical/emergent status.
 *
 * @csspart container - The outer status container.
 * @csspart icon - The icon container.
 * @csspart message - The message content area.
 * @csspart actions - The actions container (dismiss/acknowledge buttons).
 * @csspart dismiss-button - The dismiss button (only rendered when dismissible).
 *
 * @cssprop [--hx-clinical-status-bg=var(--hx-color-info-50)] - Background color.
 * @cssprop [--hx-clinical-status-color=var(--hx-color-info-800)] - Text color.
 * @cssprop [--hx-clinical-status-border-color=var(--hx-color-info-200)] - Border color.
 * @cssprop [--hx-clinical-status-border-radius=var(--hx-border-radius-md)] - Border radius.
 * @cssprop [--hx-clinical-status-border-width=var(--hx-border-width-thin)] - Border width.
 * @cssprop [--hx-clinical-status-accent-color=var(--hx-color-info-500)] - Left accent stripe color.
 * @cssprop [--hx-clinical-status-accent-width=4px] - Left accent stripe width.
 * @cssprop [--hx-clinical-status-padding=var(--hx-space-4)] - Container padding.
 * @cssprop [--hx-clinical-status-gap=var(--hx-space-3)] - Gap between elements.
 * @cssprop [--hx-clinical-status-icon-color=var(--hx-color-info-500)] - Icon color.
 * @cssprop [--hx-clinical-status-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-clinical-status-compact-padding] - Padding in compact mode.
 * @cssprop [--hx-clinical-status-emergent-accent-width=6px] - Accent width for emergent severity.
 */
@customElement('hx-clinical-status')
export class HelixClinicalStatus extends HelixElement {
  static override styles = [tokenStyles, helixClinicalStatusStyles];

  // ─── Properties ───

  /**
   * Clinical severity level that determines visual styling and ARIA semantics.
   * - `info`: Informational, non-urgent (role="status")
   * - `warning`: Requires attention but not immediate (role="status")
   * - `critical`: Requires prompt clinical attention (role="alert")
   * - `emergent`: Life-threatening, immediate action required (role="alert")
   * @attr severity
   */
  @property({ type: String, reflect: true })
  severity: ClinicalSeverity = 'info';

  /**
   * Status message text. Displayed as the primary content of the indicator.
   * @attr message
   */
  @property({ type: String })
  message = '';

  /**
   * Whether the status can be dismissed by the user.
   * Critical and emergent statuses should require acknowledgment rather than simple dismissal.
   * @attr dismissible
   */
  @property({ type: Boolean, reflect: true })
  dismissible = false;

  /**
   * Whether the status survives page navigation.
   * Defaults to false for info/warning, true for critical/emergent.
   * When set explicitly, overrides the severity-based default.
   * @attr persistent
   */
  @property({ type: Boolean, reflect: true })
  persistent = false;

  /**
   * Optional custom icon name. When not set, a default severity-appropriate icon is shown.
   * @attr icon
   */
  @property({ type: String })
  icon = '';

  /**
   * Compact mode for dense clinical UIs (e.g. patient dashboards, bedside displays).
   * Reduces padding, font size, and icon size.
   * @attr compact
   */
  @property({ type: Boolean, reflect: true })
  compact = false;

  // ─── State ───

  /** @internal */
  @state()
  private _hasSlottedContent = false;

  /** @internal */
  @state()
  private _acknowledged = false;

  /** SSR-safe unique ID for ARIA relationships. */
  private _componentId = nextId();

  /** @internal Tracks whether `persistent` was explicitly set by the consumer. */
  private _persistentExplicitlySet = false;

  // ─── Private Helpers ───

  /** Returns true when the severity requires assertive announcement. */
  private get _isAssertive(): boolean {
    return this.severity === 'critical' || this.severity === 'emergent';
  }

  /** Returns the appropriate ARIA role based on severity. */
  private get _role(): string {
    return this._isAssertive ? 'alert' : 'status';
  }

  /** Returns the default severity label for screen readers (WCAG 1.4.1). */
  private _severityLabel(): string {
    const labels: Record<ClinicalSeverity, string> = {
      info: 'Info:',
      warning: 'Warning:',
      critical: 'Critical:',
      emergent: 'Emergent:',
    };
    return labels[this.severity] ?? '';
  }

  /** Returns true when the severity requires explicit acknowledgment. */
  private get _requiresAcknowledgment(): boolean {
    return this.severity === 'critical' || this.severity === 'emergent';
  }

  /** Effective persistent value, considering severity-based defaults. */
  private get _effectivePersistent(): boolean {
    if (this._persistentExplicitlySet) {
      return this.persistent;
    }
    return this._isAssertive;
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', this._role);
  }

  override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, _old, value);
    if (name === 'persistent') {
      this._persistentExplicitlySet = value !== null;
    }
  }

  protected override updated(changedProperties: Map<PropertyKey, unknown>): void {
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
  private _renderEmergentIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm-1 4a1 1 0 112 0v4a1 1 0 11-2 0V6zm1 9a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 15z"
      />
    </svg>`;
  }

  /** @internal */
  private _renderDefaultIcon() {
    switch (this.severity) {
      case 'warning':
        return this._renderWarningIcon();
      case 'critical':
        return this._renderCriticalIcon();
      case 'emergent':
        return this._renderEmergentIcon();
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

  // ─── Slot Change Handling ───

  /** @internal */
  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasSlottedContent = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleDismiss(): void {
    this.dispatchEvent(
      new CustomEvent<void>('hx-dismiss', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** @internal */
  private _handleAcknowledge(): void {
    this._acknowledged = true;
    this.dispatchEvent(
      new CustomEvent<{ severity: ClinicalSeverity; persistent: boolean }>('hx-acknowledge', {
        bubbles: true,
        composed: true,
        detail: {
          severity: this.severity,
          persistent: this._effectivePersistent,
        },
      }),
    );
  }

  // ─── Render ───

  override render() {
    const classes = {
      'clinical-status': true,
      [`clinical-status--${this.severity}`]: true,
      'clinical-status--compact': this.compact,
    };

    const severityLabel = this._severityLabel();
    const messageId = `${this._componentId}-message`;

    return html`
      <div part="container" class=${classMap(classes)} aria-labelledby=${messageId}>
        <span class="clinical-status__severity-label">${severityLabel}</span>

        <div part="icon" class="clinical-status__icon">${this._renderDefaultIcon()}</div>

        <div id=${messageId} part="message" class="clinical-status__message">
          ${this.message}
          ${this._hasSlottedContent
            ? html`<div class="clinical-status__slot-content">
                <slot @slotchange=${this._handleSlotChange}></slot>
              </div>`
            : html`<slot @slotchange=${this._handleSlotChange}></slot>`}
        </div>

        <div
          part="actions"
          class=${classMap({
            'clinical-status__actions': true,
            'clinical-status__actions--visible': this.dismissible || this._requiresAcknowledgment,
          })}
        >
          ${this._requiresAcknowledgment && !this._acknowledged
            ? html`
                <button
                  class="clinical-status__acknowledge-button"
                  @click=${this._handleAcknowledge}
                >
                  Acknowledge
                </button>
              `
            : nothing}
          ${this.dismissible
            ? html`
                <button
                  part="dismiss-button"
                  class="clinical-status__dismiss-button"
                  aria-label="Dismiss clinical status"
                  @click=${this._handleDismiss}
                >
                  ${this._renderCloseIcon()}
                </button>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-clinical-status': HelixClinicalStatus;
  }
}

export type { HelixClinicalStatus as HxClinicalStatus };
