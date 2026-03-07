import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
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
 * Purely visual — no slots. Supports an animated pulse ring.
 *
 * Uses `role="img"` with an auto-generated `aria-label` (e.g. "Status: Online").
 * Set `aria-hidden="true"` on the host when status is conveyed by adjacent text.
 *
 * @summary Status indicator dot component.
 *
 * @tag hx-status-indicator
 *
 * @csspart base - The dot element.
 * @csspart pulse-ring - The animated pulse ring element.
 *
 * @cssproperty [--hx-status-indicator-color-online] - Override color for the "online" status dot.
 * @cssproperty [--hx-status-indicator-color-offline] - Override color for the "offline" status dot.
 * @cssproperty [--hx-status-indicator-color-away] - Override color for the "away" status dot.
 * @cssproperty [--hx-status-indicator-color-busy] - Override color for the "busy" status dot.
 * @cssproperty [--hx-status-indicator-color-unknown] - Override color for the "unknown" status dot.
 * @cssproperty [--hx-status-indicator-size-sm] - Override size for the "sm" variant.
 * @cssproperty [--hx-status-indicator-size-md] - Override size for the "md" variant.
 * @cssproperty [--hx-status-indicator-size-lg] - Override size for the "lg" variant.
 * @cssproperty [--hx-status-indicator-pulse-duration] - Override pulse animation duration.
 * @cssproperty [--hx-status-indicator-pulse-scale] - Override pulse animation max scale.
 */
@customElement('hx-status-indicator')
export class HelixStatusIndicator extends LitElement {
  static override styles = [tokenStyles, helixStatusIndicatorStyles];

  /**
   * The status to display.
   * @attr status
   */
  @property({ type: String, reflect: true })
  status: StatusIndicatorStatus = 'unknown';

  /**
   * Size of the indicator dot.
   * @attr size
   */
  @property({ type: String, reflect: true })
  size: StatusIndicatorSize = 'md';

  /**
   * Whether to show an animated pulse ring around the dot.
   * Animation is suppressed when prefers-reduced-motion is active.
   * @attr pulse
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

  private _getLabel(): string {
    if (this.label) return this.label;
    const statusText = STATUS_LABELS[this.status] ?? 'Unknown';
    return `Status: ${statusText}`;
  }

  override render() {
    return html`
      <div class="indicator" role="img" aria-label=${this._getLabel()}>
        <div class="indicator__pulse-ring" part="pulse-ring"></div>
        <div class="indicator__dot" part="base"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-status-indicator': HelixStatusIndicator;
  }
}
