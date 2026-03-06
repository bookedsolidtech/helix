import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixLinkStyles } from './hx-link.styles.js';

/**
 * A styled anchor element with consistent design tokens. Supports inline
 * navigation, download, prefix/suffix slots, disabled state (renders as span),
 * and accessible new-tab indication.
 *
 * @summary Styled hyperlink component with variant support and accessibility.
 *
 * @tag hx-link
 *
 * @slot - Default slot for link text or content.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when
 *   the link is clicked and is not disabled.
 *
 * @csspart base - The native anchor element (or span when disabled).
 *
 * @cssprop [--hx-link-color=var(--hx-color-primary-500)] - Link text color.
 * @cssprop [--hx-link-color-hover=var(--hx-color-primary-700)] - Link color on hover.
 * @cssprop [--hx-link-color-visited=var(--hx-color-primary-700)] - Link color when visited.
 * @cssprop [--hx-link-font-family=inherit] - Link font family.
 * @cssprop [--hx-link-font-weight=inherit] - Link font weight.
 * @cssprop [--hx-link-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 */
@customElement('hx-link')
export class HelixLink extends LitElement {
  static override styles = [tokenStyles, helixLinkStyles];

  // ─── Public Properties ───

  /**
   * The URL the link points to.
   * @attr href
   */
  @property({ type: String })
  href: string | undefined = undefined;

  /**
   * Where to open the linked URL.
   * @attr target
   */
  @property({ type: String })
  target: '_blank' | '_self' | '_parent' | '_top' | undefined = undefined;

  /**
   * Custom rel attribute. When target="_blank", "noopener noreferrer" is
   * automatically added unless this is explicitly set.
   * @attr rel
   */
  @property({ type: String })
  rel: string | undefined = undefined;

  /**
   * When set, causes the browser to download the linked URL. Can be a boolean
   * (no suggested filename) or a string (suggested filename).
   * @attr download
   */
  @property({ type: String })
  download: string | boolean | undefined = undefined;

  /**
   * When true, renders as a <span role="link" aria-disabled="true"> instead of
   * an anchor. Prevents navigation and suppresses hx-click events.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Visual style variant of the link.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'subtle' | 'danger' = 'default';

  // ─── Private Helpers ───

  private _computedRel(): string | undefined {
    if (this.rel !== undefined) return this.rel;
    if (this.target === '_blank') return 'noopener noreferrer';
    return undefined;
  }

  private _downloadAttr(): string | undefined {
    if (this.download === undefined || this.download === false) return undefined;
    if (this.download === true) return '';
    return this.download;
  }

  // ─── Event Handling ───

  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /**
     * Dispatched when the link is clicked.
     * @event hx-click
     */
    this.dispatchEvent(
      new CustomEvent('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );
  }

  // ─── Render Helpers ───

  private _renderInner() {
    return html`
      <span part="prefix" class="link__prefix">
        <slot name="prefix"></slot>
      </span>
      <span part="label" class="link__label">
        <slot></slot>
      </span>
      <span part="suffix" class="link__suffix">
        <slot name="suffix"></slot>
      </span>
      ${this.target === '_blank'
        ? html`<span class="link__visually-hidden">(opens in new tab)</span>`
        : nothing}
    `;
  }

  // ─── Render ───

  override render() {
    const classes = {
      link: true,
      [`link--${this.variant}`]: true,
      'link--disabled': this.disabled,
    };

    if (this.disabled) {
      return html`
        <span part="base" class=${classMap(classes)} role="link" aria-disabled="true">
          ${this._renderInner()}
        </span>
      `;
    }

    return html`
      <a
        part="base"
        class=${classMap(classes)}
        href=${ifDefined(this.href)}
        target=${ifDefined(this.target)}
        rel=${ifDefined(this._computedRel())}
        download=${ifDefined(this._downloadAttr())}
        @click=${this._handleClick}
      >
        ${this._renderInner()}
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-link': HelixLink;
  }
}
