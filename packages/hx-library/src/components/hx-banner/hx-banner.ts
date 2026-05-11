import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../hx-icon/hx-icon.js';
import { HelixElement } from '../../base/index.js';
import { helixBannerStyles } from './hx-banner.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';

/** Banner variant determines visual styling and ARIA semantics. */
export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

/** Banner position determines CSS positioning behavior. */
export type BannerPosition = 'sticky' | 'fixed';

// ─── ARIA naming disambiguation (group-6) ───
//
// IMPORTANT: the component name `hx-banner` refers to the visual UX pattern
// (full-width page-level notification surface). It is NOT a semantic mapping
// to the HTML5 LANDMARK role `role="banner"` (which marks the page-level
// header/masthead).
//
// The ARIA role this component sets on its host is `alert` or `status`,
// derived from `variant`. A regression test in `hx-banner.test.ts` asserts
// that `role="banner"` (the LANDMARK role) is NEVER applied. Do NOT "fix"
// this by adding the LANDMARK role.
//
// APG caveat: NVDA + JAWS do not announce alerts that are present in the DOM
// at page-load. A `<hx-banner open>` rendered server-side will not be
// announced on first paint. Consumers needing first-paint announcement
// should mount with `open=false` and flip to `open=true` after window load,
// or use a sticky `hx-alert` instead.

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
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-color-info-50] - Color.
 * @cssprop [--hx-color-info-800] - Color.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-info-200] - Color.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-info-500] - Color.
 * @cssprop [--hx-space-5] - Spacing token.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-opacity-90] - Opacity.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-opacity-75] - Opacity.
 * @cssprop [--hx-opacity-100] - Opacity.
 * @cssprop [--hx-color-success-50] - Color.
 * @cssprop [--hx-color-success-200] - Color.
 * @cssprop [--hx-color-success-800] - Color.
 * @cssprop [--hx-color-success-500] - Color.
 * @cssprop [--hx-color-warning-50] - Color.
 * @cssprop [--hx-color-warning-200] - Color.
 * @cssprop [--hx-color-warning-800] - Color.
 * @cssprop [--hx-color-warning-500] - Color.
 * @cssprop [--hx-color-error-50] - Color.
 * @cssprop [--hx-color-error-200] - Color.
 * @cssprop [--hx-color-error-800] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 *
 * @aaa-certified 2026-05-09
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-banner/AAA-AUDIT.md
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
 * @figma-component-name hx-banner
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-banner')
export class HelixBanner extends HelixElement {
  static override styles = [helixBannerStyles, forcedColorsSurface];

  // ─── Properties ───

  /**
   * Visual variant of the banner that determines colors and ARIA semantics.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'info' | 'success' | 'warning' | 'error' = 'info';

  /**
   * CSS positioning behavior. "sticky" keeps the banner in flow; "fixed" pins it to the viewport.
   * @attr position
   */
  @property({ type: String, reflect: true })
  position: 'sticky' | 'fixed' = 'sticky';

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
  @property({ type: String, attribute: 'label-close' })
  labelClose = 'Dismiss banner';

  /**
   * Override for the severity prefix announced to screen readers (e.g., "Info:", "Error:").
   * When not set, defaults to the English label matching the current variant.
   * @attr severity-label
   */
  @property({ attribute: 'severity-label' })
  severityLabel: string | undefined;

  // ─── Private Helpers ───

  /** Returns the default English severity label for the current variant. */
  private _defaultSeverityLabel(): string {
    const labels: Record<string, string> = {
      info: 'Info:',
      success: 'Success:',
      warning: 'Warning:',
      error: 'Error:',
    };
    return labels[this.variant] ?? '';
  }

  /** Returns the effective severity label, using the override if provided. */
  private get _effectiveSeverityLabel(): string {
    return this.severityLabel ?? this._defaultSeverityLabel();
  }

  /**
   * Returns true when the variant requires assertive announcement.
   *
   * (group-6) Harmonized with `hx-alert` and `hx-toast`: only `error` is
   * assertive. Previous behavior also escalated `warning` to assertive on
   * `hx-banner`, which diverged from the rest of the live-region surface.
   * Warnings are non-urgent and use a polite live region (role="status").
   * Critical/error messages remain assertive (role="alert").
   */
  /** @internal */
  private get _isAssertive(): boolean {
    return this.variant === 'error';
  }

  /**
   * Returns the appropriate ARIA role based on variant.
   * role="alert" implies aria-live="assertive"; role="status" implies aria-live="polite".
   * We do NOT set aria-live explicitly to avoid double-announcements in JAWS.
   */
  /** @internal */
  private get _role(): string {
    return this._isAssertive ? 'alert' : 'status';
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Apply ARIA role to the host element for reliable screen reader support across
    // Shadow DOM boundaries. Placing role on a shadow-internal element has inconsistent
    // AT support in JAWS+Chrome and VoiceOver+Safari combinations (particularly pre-2024).
    //
    // (group-6) Dual-write: `internals.role` is the modern IDL-based source of
    // truth; the `role` attribute is retained as a legacy fallback for older AT
    // that don't yet honour ElementInternals ARIA reflection. Per ARIA spec,
    // role implies aria-live (`alert`→assertive, `status`→polite); we therefore
    // do NOT set an explicit `aria-live` attribute (avoids §5.1 double-announce).
    this._internals.role = this._role;
    this.setAttribute('role', this._role);
    if (!this.open) {
      this.setAttribute('aria-hidden', 'true');
    }
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('variant')) {
      // Keep host ARIA role in sync with variant (assertive vs. polite).
      this._internals.role = this._role;
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

  /** @internal */
  private _renderDefaultIcon() {
    const name = this.variant === 'info' ? 'info' : this.variant;
    return html`<hx-icon
      class="banner__glyph"
      library="helix"
      name=${name}
      aria-hidden="true"
    ></hx-icon>`;
  }

  /** @internal */
  private _renderCloseIcon() {
    return html`<hx-icon
      class="banner__glyph"
      library="helix"
      name="close"
      aria-hidden="true"
    ></hx-icon>`;
  }

  // ─── Public Methods ───

  /**
   * Programmatically dismisses the banner. Sets open=false and dispatches hx-dismiss.
   */
  dismiss(): void {
    this._handleDismiss();
  }

  // ─── Event Handling ───

  /** @internal */
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

    // WCAG 1.4.1: Always render a visually-hidden severity label so the variant
    // is never conveyed by color alone.
    const severityLabel = this._effectiveSeverityLabel;

    return html`
      <div part="banner" class=${classMap(classes)}>
        <span class="banner__severity-label">${severityLabel}</span>
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
                aria-label=${this.labelClose}
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
