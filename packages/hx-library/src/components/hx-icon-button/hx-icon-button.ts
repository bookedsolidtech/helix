import { html, nothing, type TemplateResult } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement } from '../../base/index.js';
import { FocusMixin, mixinDelegatesAria } from '../../mixins/index.js';
import { helixIconButtonStyles } from './hx-icon-button.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import { applyLegacySizeAlias } from '../../utils/apply-legacy-size-alias.js';

/**
 * An icon-only button component for compact, accessible actions.
 * Renders a square button or anchor element containing a single icon.
 * The `label` property is required and provides the accessible name
 * via `aria-label` and a native tooltip via the `title` attribute.
 *
 * @summary Icon-only action button with full accessibility support.
 *
 * @tag hx-icon-button
 *
 * @slot - Icon element to display (hx-icon, svg, or img).
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when the button is clicked (not disabled).
 *
 * @csspart button - The native button or anchor element.
 * @csspart icon - The icon container span wrapping the default slot.
 * @csspart spinner - The loading spinner SVG element shown when `loading` is true.
 *
 * @cssprop [--hx-icon-button-bg=transparent] - Button background color.
 * @cssprop [--hx-icon-button-color=var(--hx-color-primary-500)] - Icon color.
 * @cssprop [--hx-icon-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-icon-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-icon-button-size] - Explicit width and height override for the button.
 * @cssprop [--hx-icon-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-filter-brightness-active] - CSS filter.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-primary-600] - Color.
 * @cssprop [--hx-color-primary-50] - Color.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-color-error-600] - Color.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-icon-button/AAA-AUDIT.md
 * @keyboard-contract activate=Enter,Space; disabled-suppresses=true
 * @aria-pattern button
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/button/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated true
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-icon-button
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-icon-button')
export class HelixIconButton extends FocusMixin(mixinDelegatesAria(HelixElement)) {
  static override styles = [helixIconButtonStyles, forcedColorsInteractive];

  /**
   * Accessible name for the button. Required. Rendered as `aria-label` and
   * `title` on the underlying element. The component renders nothing when absent,
   * and a console warning is emitted to alert developers during authoring.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline' = 'ghost';

  /**
   * Size of the button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * The type attribute for the underlying button element.
   * Has no effect when `href` is set.
   * @attr type
   */
  @property({ type: String })
  type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Whether the button is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the button is in a loading state. Shows the spinner, prevents
   * activation, and sets `aria-busy="true"` on the inner element. Does NOT
   * set the native `disabled` attribute (loading is transient; disabled is
   * persistent, and AT announces them differently).
   * @attr loading
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * When set, renders an `<a>` element instead of a `<button>`.
   * @attr href
   */
  @property({ type: String })
  href: string | undefined = undefined;

  /**
   * Name submitted with form data. Only applicable when rendering as a button.
   * @attr name
   */
  @property({ type: String })
  name: string | undefined = undefined;

  /**
   * Value submitted with form data. Only applicable when rendering as a button.
   * @attr value
   */
  @property({ type: String })
  value: string | undefined = undefined;

  // ─── Form Association ───

  /** Marks this element as form-associated for ElementInternals support. @internal */
  static override formAssociated = true;

  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── FocusMixin integration ───

  /**
   * The inner natively-focusable element. Resolves to the `<button>` in button
   * mode or the `<a>` in href/anchor mode — only one is ever rendered.
   * @internal
   */
  @query('.button')
  private _focusEl?: HTMLElement;

  /**
   * Declares the inner focusable element for FocusMixin delegation.
   * @internal
   */
  protected get _focusableNode(): HTMLElement | null {
    // A disabled or loading icon button is inert. In anchor mode the inner node
    // is an <a tabindex="-1">, which — unlike a native disabled <button> — is
    // still programmatically focusable, so guard here to keep focus() from
    // landing on a control the consumer intentionally made inactive.
    if (this.disabled || this.loading) return null;
    return this._focusEl ?? null;
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: forward the legacy unprefixed `size` attribute to the
    // `hx-size`-mapped property (3.x shim, removed in 4.0). super chains
    // through FocusMixin.
    applyLegacySizeAlias<'sm' | 'md' | 'lg'>(this, 'hx-icon-button', (v) => {
      this.size = v;
    });
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleClick(e: MouseEvent): void {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /**
     * Dispatched when the button is clicked.
     * @event hx-click
     */
    this.dispatchEvent(
      new CustomEvent<{ originalEvent: MouseEvent }>('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );

    // Handle form submission/reset if form-associated and not in href/link mode
    if (!this.href) {
      if (this.type === 'submit' && this._internals.form) {
        this._internals.form.requestSubmit();
      } else if (this.type === 'reset' && this._internals.form) {
        this._internals.form.reset();
      }
    }
  }

  // ─── Render Helpers ───

  /** @internal */
  private _normalizedLabel(): string {
    return this.label.trim();
  }

  /** @internal */
  private _classes() {
    return {
      button: true,
      [`button--${this.variant}`]: true,
      [`button--${this.size}`]: true,
      'button--loading': this.loading,
    };
  }

  /** @internal */
  private _iconSlot() {
    return html`<span part="icon" class="icon"><slot></slot></span>`;
  }

  /** @internal */
  private _renderSpinner(): TemplateResult {
    return html`
      <svg
        class="button__spinner"
        part="spinner"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          class="button__spinner-track"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
          opacity="0.3"
        />
        <path
          class="button__spinner-arc"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    `;
  }

  // ─── Render ───

  override render() {
    const normalizedLabel = this._normalizedLabel();
    if (!normalizedLabel) {
      devWarn(
        'hx-icon-button',
        'The `label` property is required for accessibility. Render suppressed.',
      );
      return nothing;
    }

    // mixinDelegatesAria forwarding: consumer-set aria-* (aria-pressed,
    // aria-expanded, aria-haspopup, aria-controls, aria-describedby) lands
    // in data-aria-* on the host. Project them onto the inner element so the
    // a11y tree sees them on the role-bearing native element.
    const projectedDescribedBy = this.getAttribute('data-aria-describedby');
    const projectedPressed = this.getAttribute('data-aria-pressed');
    const projectedExpanded = this.getAttribute('data-aria-expanded');
    const projectedHasPopup = this.getAttribute('data-aria-haspopup');
    const projectedControls = this.getAttribute('data-aria-controls');
    const projectedCurrent = this.getAttribute('data-aria-current');

    if (this.href !== undefined) {
      // P1-03 fix: disabled anchor must set tabindex="-1" explicitly — an <a>
      // without href is non-focusable by default in most browsers, but this is
      // browser-dependent. Explicit tabindex="-1" guarantees keyboard exclusion
      // across all conforming browsers. Loading anchors are also tab-skipped
      // for consistency with disabled.
      // P1-07 note: aria-disabled IS required on the anchor branch because
      // <a> elements have no native disabled attribute; aria-disabled is the
      // only AT signal available.
      return html`
        <a
          part="button"
          class=${classMap(this._classes())}
          href=${ifDefined(this.disabled || this.loading ? undefined : this.href)}
          aria-label=${normalizedLabel}
          title=${normalizedLabel}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-busy=${this.loading ? 'true' : nothing}
          aria-pressed=${ifDefined(projectedPressed ?? undefined)}
          aria-expanded=${ifDefined(projectedExpanded ?? undefined)}
          aria-haspopup=${ifDefined(projectedHasPopup ?? undefined)}
          aria-controls=${ifDefined(projectedControls ?? undefined)}
          aria-describedby=${ifDefined(projectedDescribedBy ?? undefined)}
          aria-current=${ifDefined(projectedCurrent ?? undefined)}
          tabindex=${this.disabled || this.loading ? '-1' : nothing}
          @click=${this._handleClick}
        >
          ${this.loading ? this._renderSpinner() : this._iconSlot()}
        </a>
      `;
    }

    // P1-07 fix: aria-disabled is redundant on a natively disabled <button>.
    // The native disabled attribute already exposes aria-disabled="true"
    // implicitly in the accessibility tree. Duplicate explicit aria-disabled
    // creates ambiguity about design intent. Keep only native ?disabled.
    return html`
      <button
        part="button"
        class=${classMap(this._classes())}
        ?disabled=${this.disabled}
        type=${this.type}
        aria-label=${normalizedLabel}
        title=${normalizedLabel}
        aria-busy=${this.loading ? 'true' : nothing}
        aria-pressed=${ifDefined(projectedPressed ?? undefined)}
        aria-expanded=${ifDefined(projectedExpanded ?? undefined)}
        aria-haspopup=${ifDefined(projectedHasPopup ?? undefined)}
        aria-controls=${ifDefined(projectedControls ?? undefined)}
        aria-describedby=${ifDefined(projectedDescribedBy ?? undefined)}
        aria-current=${ifDefined(projectedCurrent ?? undefined)}
        name=${ifDefined(this.name)}
        value=${ifDefined(this.value)}
        @click=${this._handleClick}
      >
        ${this.loading ? this._renderSpinner() : this._iconSlot()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-icon-button': HelixIconButton;
  }
  interface HTMLElementEventMap {
    'hx-click': CustomEvent<{ originalEvent: MouseEvent }>;
  }
}
