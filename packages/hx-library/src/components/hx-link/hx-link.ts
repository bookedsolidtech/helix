import { html, nothing } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../hx-icon/hx-icon.js';
import { HelixElement } from '../../base/index.js';
import { mixinDelegatesAria } from '../../mixins/index.js';
import { helixLinkStyles } from './hx-link.styles.js';
import { forcedColorsLink } from '../../styles/forced-colors.js';

/**
 * Variant options for the link component.
 */
export type LinkVariant = 'default' | 'subtle' | 'danger';

/**
 * A semantic hyperlink component with accessibility-first design.
 * Renders a native `<a>` element for enabled state and a `<span>` for
 * disabled state with full keyboard and screen reader support.
 *
 * @summary Accessible hyperlink with external-link detection, disabled state,
 *   and download support.
 *
 * @tag hx-link
 *
 * @slot - Default slot for link label text or content.
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when
 *   the link is clicked and is not disabled.
 *
 * @csspart link - The inner anchor or span element.
 * @csspart external-icon - The external link icon SVG (when target="_blank").
 *
 * @cssprop [--hx-link-color=var(--hx-color-primary-500)] - Default link color.
 * @cssprop [--hx-link-color-hover=var(--hx-color-primary-700)] - Hover color.
 * @cssprop [--hx-link-color-active=var(--hx-color-primary-800)] - Active color.
 * @cssprop [--hx-link-color-disabled=var(--hx-color-neutral-400)] - Disabled color.
 * @cssprop [--hx-link-color-subtle=var(--hx-color-neutral-600)] - Subtle variant color.
 * @cssprop [--hx-link-color-danger=var(--hx-color-error-text)] - Danger variant color.
 * @cssprop [--hx-link-color-danger-hover=var(--hx-color-error-700)] - Danger variant hover color.
 * @cssprop [--hx-link-font-family=var(--hx-font-family-sans)] - Link font family.
 * @cssprop [--hx-link-text-decoration=underline] - Link text decoration.
 * @cssprop [--hx-link-text-decoration-hover=underline] - Hover text decoration.
 * @cssprop [--hx-link-underline-offset=2px] - Text underline offset.
 * @cssprop [--hx-link-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 *
 * @note The `:visited` pseudo-class does not work inside Shadow DOM due to
 *   browser privacy restrictions. This is a known platform limitation.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-color-primary-700] - Color.
 * @cssprop [--hx-color-primary-800] - Color.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-color-neutral-600] - Color.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-color-error-700] - Color.
 * @cssprop [--hx-color-neutral-400] - Color.
 */
@customElement('hx-link')
export class HelixLink extends mixinDelegatesAria(HelixElement) {
  static override styles = [helixLinkStyles, forcedColorsLink];

  /**
   * The URL the link points to.
   * @attr href
   */
  @property({ type: String })
  href: string | undefined = undefined;

  /**
   * Where to display the linked URL (_self, _blank, etc.).
   * When set to "_blank", automatically adds rel="noopener noreferrer"
   * and shows an external-link indicator.
   * @attr target
   */
  @property({ type: String })
  target: string | undefined = undefined;

  /**
   * Visual style variant of the link.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'subtle' | 'danger' = 'default';

  /**
   * Whether the link is disabled. Renders a span instead of an anchor.
   * The disabled span is keyboard-focusable (tabindex="0") and announces
   * as a disabled link to screen readers.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Prompts the user to download the linked URL. When set to a string,
   * the value is used as the suggested filename.
   * @attr download
   */
  @property({ type: String })
  download: string | undefined = undefined;

  /**
   * Relationship between the current document and the linked URL.
   * Automatically set to "noopener noreferrer" when target="_blank".
   * @attr rel
   */
  @property({ type: String })
  rel: string | undefined = undefined;

  /**
   * Localised announcement text appended (visually hidden) to the link's
   * accessible name when `target="_blank"`. Defaults to English. Override
   * for i18n contexts so AT users hear the new-tab notice in their locale.
   * @attr external-label
   */
  @property({ type: String, attribute: 'external-label' })
  externalLabel: string = '(opens in new tab)';

  // --- Event Handling ---

  /** @internal Blocks Enter and Space activation on disabled span. */
  private _handleDisabledKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
    }
  }

  /** @internal */
  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent<{ originalEvent: MouseEvent }>('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );
  }

  // --- Render Helpers ---

  /** @internal */
  private _computeRel(): string | undefined {
    if (this.rel) return this.rel;
    if (this.target === '_blank') return 'noopener noreferrer';
    return undefined;
  }

  /** @internal */
  private _renderExternalIcon() {
    if (this.target !== '_blank') return nothing;

    return html`
      <hx-icon
        class="link__external-icon"
        part="external-icon"
        library="helix"
        name="external-link"
        aria-hidden="true"
      ></hx-icon>
      <span class="sr-only">${this.externalLabel}</span>
    `;
  }

  // --- Render ---

  override render() {
    const classes = {
      link: true,
      [`link--${this.variant}`]: this.variant !== 'default',
      'link--disabled': this.disabled,
    };

    // mixinDelegatesAria forwarding: consumer-set aria-* land in
    // data-aria-* on the host. Project them onto the inner role-bearing
    // element (the <a> or the <span role="link">) so AT walks them
    // correctly without double-announcement on the host.
    const projectedLabel = this.getAttribute('data-aria-label');
    const projectedLabelledBy = this.getAttribute('data-aria-labelledby');
    const projectedDescribedBy = this.getAttribute('data-aria-describedby');
    const projectedCurrent = this.getAttribute('data-aria-current');

    if (this.disabled) {
      return html`
        <span
          part="link"
          class=${classMap(classes)}
          role="link"
          aria-disabled="true"
          aria-label=${ifDefined(projectedLabel ?? undefined)}
          aria-labelledby=${ifDefined(projectedLabelledBy ?? undefined)}
          aria-describedby=${ifDefined(projectedDescribedBy ?? undefined)}
          aria-current=${ifDefined(projectedCurrent ?? undefined)}
          tabindex="0"
          @click=${this._handleClick}
          @keydown=${this._handleDisabledKeydown}
        >
          <slot></slot>
        </span>
      `;
    }

    return html`
      <a
        part="link"
        class=${classMap(classes)}
        href=${ifDefined(this.href)}
        target=${ifDefined(this.target)}
        rel=${ifDefined(this._computeRel())}
        download=${ifDefined(this.download)}
        aria-label=${ifDefined(projectedLabel ?? undefined)}
        aria-labelledby=${ifDefined(projectedLabelledBy ?? undefined)}
        aria-describedby=${ifDefined(projectedDescribedBy ?? undefined)}
        aria-current=${ifDefined(projectedCurrent ?? undefined)}
        @click=${this._handleClick}
      >
        <slot></slot>
        ${this._renderExternalIcon()}
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-link': HelixLink;
  }
}
