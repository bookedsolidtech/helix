import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import '../hx-icon/hx-icon.js';
import { HelixElement } from '../../base/index.js';
import { createIdCounter } from '../../base/index.js';
import { helixClinicalStatusStyles } from './hx-clinical-status.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';

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
 * @fires {CustomEvent<void>} hx-dismiss - Dispatched when the user dismisses the status.
 * @fires {CustomEvent<{ severity: ClinicalSeverity; persistent: boolean }>} hx-acknowledge - Dispatched when the user acknowledges a critical/emergent status.
 *
 * @csspart container - The outer status container.
 * @csspart icon - The icon container.
 * @csspart message - The message content area.
 * @csspart actions - The actions container (dismiss/acknowledge buttons).
 * @csspart dismiss-button - The dismiss button (only rendered when dismissible).
 * @csspart acknowledge-button - The acknowledge button (only rendered when acknowledgeable).
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
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-error-200] - Color.
 * @cssprop [--hx-color-error-300] - Color.
 * @cssprop [--hx-color-error-50] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-color-error-700] - Color.
 * @cssprop [--hx-color-error-800] - Color.
 * @cssprop [--hx-color-error-900] - Color.
 * @cssprop [--hx-color-focus] - Color.
 * @cssprop [--hx-color-info-200] - Color.
 * @cssprop [--hx-color-info-50] - Color.
 * @cssprop [--hx-color-info-500] - Color.
 * @cssprop [--hx-color-info-800] - Color.
 * @cssprop [--hx-color-warning-200] - Color.
 * @cssprop [--hx-color-warning-50] - Color.
 * @cssprop [--hx-color-warning-500] - Color.
 * @cssprop [--hx-color-warning-800] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-letter-spacing-wide] - CSS custom property.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-space-5] - Spacing token.
 * @cssprop [--hx-space-8] - Spacing token.
 * @cssprop [--hx-touch-target-size] - Minimum touch target size.
 * @cssprop [--hx-transition-fast] - Transition timing.
 *
 * @aaa-certified 2026-05-09
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-clinical-status/AAA-AUDIT.md
 * @keyboard-contract dismiss=Escape
 * @aria-pattern alert
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-clinical-status
 * @priority-tier P0
 * @phi-handles true
 * @clinical-context healthcare-alert-fatigue-prevention
 */
@customElement('hx-clinical-status')
export class HelixClinicalStatus extends HelixElement {
  static override styles = [helixClinicalStatusStyles, forcedColorsSurface];

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

  /**
   * SSR-safe unique ID for ARIA relationships.
   * @internal
   */
  private _componentId = nextId();

  /**
   * Tracks whether `persistent` was explicitly set by the consumer.
   * @internal
   */
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
    this._internals.role = this._role;
  }

  override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, _old, value);
    if (name === 'persistent') {
      this._persistentExplicitlySet = value !== null;
    }
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('severity')) {
      this._internals.role = this._role;
    }
  }

  // ─── Default Icons ───

  /**
   * Maps clinical severity to the canonical helix status glyph.
   * `critical` and `emergent` both map to `error` because helix's curated
   * 32-glyph set provides four status glyphs (info/warning/error/success);
   * the two highest-severity clinical levels share the strongest signal.
   * @internal
   */
  private _renderDefaultIcon() {
    let name: 'info' | 'warning' | 'error';
    switch (this.severity) {
      case 'warning':
        name = 'warning';
        break;
      case 'critical':
      case 'emergent':
        name = 'error';
        break;
      case 'info':
      default:
        name = 'info';
        break;
    }
    return html`<hx-icon
      class="clinical-status__glyph"
      library="helix"
      name=${name}
      aria-hidden="true"
    ></hx-icon>`;
  }

  /** @internal */
  private _renderCloseIcon() {
    return html`<hx-icon
      class="clinical-status__glyph"
      library="helix"
      name="close"
      aria-hidden="true"
    ></hx-icon>`;
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

        <div part="icon" class="clinical-status__icon">
          ${this.icon
            ? html`<span class="clinical-status__custom-icon">${this.icon}</span>`
            : this._renderDefaultIcon()}
        </div>

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
                  part="acknowledge-button"
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

/** Canonical type alias for the hx-clinical-status component. */
export type HxClinicalStatus = HelixClinicalStatus;
