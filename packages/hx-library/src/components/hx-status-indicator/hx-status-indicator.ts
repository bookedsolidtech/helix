import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { devWarn } from '../../utils/dev-warn.js';
import { helixStatusIndicatorStyles } from './hx-status-indicator.styles.js';

export type StatusIndicatorStatus = 'online' | 'offline' | 'away' | 'busy' | 'unknown';
export type StatusIndicatorSize = 'sm' | 'md' | 'lg';

const STATUS_LABELS: Record<StatusIndicatorStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  away: 'Away',
  busy: 'Busy',
  unknown: 'Unknown',
};

/**
 * A colored dot/badge indicating system or entity health status.
 * Supports an animated pulse ring and an optional visible text label.
 *
 * Status is conveyed through color AND an `aria-label` on the host element.
 * When `show-label` is set, a visible text label is rendered inside the component,
 * ensuring status is not communicated by color alone (WCAG 1.4.1 — Use of Color).
 *
 * Uses `role="img"` with an auto-generated `aria-label` (e.g. "Status: Online").
 * When used decoratively alongside visible text that conveys the same status information
 * (e.g. "Provider is available"), set `aria-hidden="true"` on the host element to prevent
 * duplicate announcements to screen reader users. This is the recommended composition
 * pattern in healthcare dashboards.
 *
 * @remarks
 * The status vocabulary (`online`, `offline`, `away`, `busy`, `unknown`) is the intentional
 * implementation canonical form for this component. Although a prior spec draft used
 * `active/inactive/error/warning`, the current vocabulary was approved as a deliberate
 * design decision for flexibility and UX clarity in healthcare dashboard contexts.
 *
 * @summary Status indicator dot component.
 *
 * @tag hx-status-indicator
 *
 * @csspart base - The dot element.
 * @csspart pulse-ring - The animated pulse ring element.
 * @csspart label - The visible status label text element (visible when show-label is set).
 *
 * @cssprop [--hx-status-indicator-color-online] - Override color for the "online" status dot.
 * @cssprop [--hx-status-indicator-color-offline] - Override color for the "offline" status dot.
 * @cssprop [--hx-status-indicator-color-away] - Override color for the "away" status dot.
 * @cssprop [--hx-status-indicator-color-busy] - Override color for the "busy" status dot.
 * @cssprop [--hx-status-indicator-color-unknown] - Override color for the "unknown" status dot.
 * @cssprop [--hx-status-indicator-size-sm] - Override size for the "sm" variant.
 * @cssprop [--hx-status-indicator-size-md] - Override size for the "md" variant.
 * @cssprop [--hx-status-indicator-size-lg] - Override size for the "lg" variant.
 * @cssprop [--hx-status-indicator-pulse-duration] - Override pulse animation duration.
 * @cssprop [--hx-status-indicator-pulse-scale] - Override pulse animation max scale.
 * @cssprop [--hx-status-indicator-pulse-color] - Override pulse ring color independently from dot color.
 * @cssprop [--hx-status-indicator-label-color] - Override label text color.
 * @cssprop [--hx-status-indicator-label-font-size] - Override label font size.
 */
@customElement('hx-status-indicator')
export class HelixStatusIndicator extends LitElement {
  static override styles = [tokenStyles, helixStatusIndicatorStyles];

  /**
   * The status to display.
   * @attr status
   */
  @property({ type: String, reflect: true })
  status: 'online' | 'offline' | 'away' | 'busy' | 'unknown' = 'unknown';

  /**
   * Size of the indicator dot.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether to show an animated pulse ring around the dot.
   * Animation is suppressed when prefers-reduced-motion is active.
   * @attr pulse
   * @remarks
   * In Twig (Drupal) templates, render as a bare attribute: `pulse` — NOT `pulse="true"`.
   * The value is ignored; only attribute presence matters.
   */
  @property({ type: Boolean, reflect: true })
  pulse = false;

  /**
   * Accessible label for the indicator. Defaults to "Status: {Status}".
   * Set aria-hidden="true" on the host when status is conveyed by adjacent text.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * When true, renders a visible text label next to the dot conveying the status.
   * Use this to satisfy WCAG 1.4.1 (Use of Color) when the indicator is not
   * accompanied by other visible text that conveys the same status information.
   * @attr show-label
   */
  @property({ type: Boolean, reflect: true, attribute: 'show-label' })
  showLabel = false;

  /** @internal */
  private _getLabel(): string {
    if (this.label) return this.label;
    const statusText = STATUS_LABELS[this.status] ?? 'Unknown';
    return `Status: ${statusText}`;
  }

  /** @internal */
  private _getStatusText(): string {
    return STATUS_LABELS[this.status] ?? 'Unknown';
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: accept legacy `size` attribute. When present and `hx-size`
    // is not set, map the value and emit a deprecation warning.
    const legacySize = this.getAttribute('size');
    if (legacySize !== null && !this.hasAttribute('hx-size')) {
      devWarn('hx-status-indicator', 'The "size" attribute is deprecated. Use "hx-size" instead.');
      this.size = legacySize as StatusIndicatorSize;
    }
    // T3-01-4: Place role="img" on the host element for robust AT traversal.
    // Some screen reader + browser combinations skip shadow children; host-level
    // ARIA attributes are more reliable across the flat accessibility tree.
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'img');
    }
    this.setAttribute('aria-label', this._getLabel());
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    // Keep host aria-label in sync when status or label properties change.
    if (changedProperties.has('status') || changedProperties.has('label')) {
      this.setAttribute('aria-label', this._getLabel());
    }
  }

  override render() {
    return html`
      <div class="indicator">
        <div class="indicator__pulse-ring" part="pulse-ring"></div>
        <div class="indicator__dot" part="base"></div>
      </div>
      ${this.showLabel
        ? html`<span class="indicator__label" part="label">${this._getStatusText()}</span>`
        : nothing}
      <!-- aria-live region announces dynamic status changes to screen readers -->
      <span class="indicator__live-region" aria-live="polite" aria-atomic="true"
        >${this._getLabel()}</span
      >
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-status-indicator': HelixStatusIndicator;
  }
}
