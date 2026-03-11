import { LitElement, html, nothing, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixLinkStyles } from './hx-link.styles.js';

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
 * @cssprop [--hx-link-color-danger=var(--hx-color-error-500)] - Danger variant color.
 * @cssprop [--hx-link-text-decoration=underline] - Link text decoration.
 * @cssprop [--hx-link-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 *
 * @note The `:visited` pseudo-class does not work inside Shadow DOM due to
 *   browser privacy restrictions. This is a known platform limitation.
 */
@customElement('hx-link')
export class HelixLink extends LitElement {
  static override styles = [tokenStyles, helixLinkStyles];

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
  variant: LinkVariant = 'default';

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

  // --- Event Handling ---

  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );
  }

  // --- Render Helpers ---

  private _computeRel(): string | undefined {
    if (this.rel) return this.rel;
    if (this.target === '_blank') return 'noopener noreferrer';
    return undefined;
  }

  private _renderExternalIcon() {
    if (this.target !== '_blank') return nothing;

    return html`
      <svg
        class="link__external-icon"
        part="external-icon"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        ${svg`<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />`}
      </svg>
      <span class="sr-only">(opens in new tab)</span>
    `;
  }

  // --- Render ---

  override render() {
    const classes = {
      link: true,
      [`link--${this.variant}`]: this.variant !== 'default',
      'link--disabled': this.disabled,
    };

    if (this.disabled) {
      return html`
        <span
          part="link"
          class=${classMap(classes)}
          role="link"
          tabindex="0"
          aria-disabled="true"
          @click=${this._handleClick}
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
