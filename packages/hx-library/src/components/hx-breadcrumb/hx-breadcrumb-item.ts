import { html, nothing } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { helixBreadcrumbItemStyles } from './hx-breadcrumb-item.styles.js';

/**
 * A single breadcrumb navigation item.
 *
 * @summary A navigation item within an hx-breadcrumb component. Renders as a link when `href` is
 * provided, or as static text for the current page item. The current page item is determined by
 * the `current` attribute (set explicitly or automatically by the parent `hx-breadcrumb`).
 *
 * @tag hx-breadcrumb-item
 *
 * @slot - The link or page text content. Accepts text, HTML, or icon elements.
 *
 * @csspart item - Wrapper around the link or text content.
 * @csspart link - The anchor element when href is provided (non-current items only).
 * @csspart text - The span element for the current page or items without href.
 * @csspart separator - The separator element rendered after non-last items.
 *
 * @cssprop [--hx-breadcrumb-link-color=var(--hx-color-primary-600)] - Link text color.
 * @cssprop [--hx-breadcrumb-link-hover-color=var(--hx-color-primary-700)] - Link hover text color.
 * @cssprop [--hx-breadcrumb-text-color=var(--hx-color-neutral-700)] - Current page text color.
 * @cssprop [--hx-breadcrumb-separator-content='/'] - Separator character displayed after non-last items.
 * @cssprop [--hx-breadcrumb-separator-color=var(--hx-color-neutral-400)] - Separator color.
 * @cssprop [--hx-breadcrumb-separator-gap=var(--hx-space-1)] - Horizontal margin around separator.
 * @cssprop [--hx-breadcrumb-item-max-width] - Optional max-width for text truncation.
 * @cssprop [--hx-breadcrumb-link-focus-ring-color=var(--hx-focus-ring-color, var(--hx-color-primary-500))] - Focus ring color for breadcrumb links.
 */
@customElement('hx-breadcrumb-item')
export class HelixBreadcrumbItem extends HelixElement {
  static override styles = [helixBreadcrumbItemStyles, forcedColorsInteractive];

  override connectedCallback(): void {
    super.connectedCallback();
    // Host carries role="listitem" so the composed-tree walk from
    // hx-breadcrumb's <div role="list"> finds a valid listitem child
    // directly, with no shadow boundary in the way. Newer Chromium AT
    // tree computation refuses to bridge from the inner span to the
    // outer list across shadow roots (verified PR #1742 audit). Using
    // a static attribute (not ElementInternals) so axe sees the role
    // natively without depending on the host-defined IDL surface.
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
    }
  }

  /**
   * The URL for this breadcrumb link. Omit for the current page item.
   * When `current` is true, this attribute is ignored and the item always
   * renders as static text per WAI-ARIA APG breadcrumb guidance.
   * @attr href
   */
  @property({ type: String, reflect: true })
  href: string | undefined = undefined;

  /**
   * Whether this is the last item in the breadcrumb trail. Set by the parent
   * hx-breadcrumb component via the `data-bc-last` boolean attribute. When
   * present the trailing separator is hidden.
   *
   * @attr data-bc-last
   * @internal
   */
  @property({ type: Boolean, attribute: 'data-bc-last', reflect: true })
  dataBcLast = false;

  /**
   * Marks this item as the current page. When set, the item always renders as
   * static text (never a navigable link) and `aria-current="page"` is placed on
   * the inner text element per WAI-ARIA APG breadcrumb guidance, yielding the
   * canonical AT announcement ("current page, Patient Records").
   *
   * Can be set explicitly by consumers (e.g. Drupal Twig templates) to override
   * the default positional last-item detection in `hx-breadcrumb`. When any item
   * in the breadcrumb has an explicit `current` attribute, the parent will not
   * override it.
   *
   * @attr current
   */
  @property({ type: Boolean, reflect: true })
  current = false;

  override render() {
    // Per WAI-ARIA APG, the current page item MUST NOT be a navigable link.
    // aria-current="page" is placed on the inner element for canonical AT
    // announcement ("current page, Patient Records").
    //
    // role="listitem" lives on the HOST (set in connectedCallback) — the
    // inner wrapper is purely presentational. This keeps the composed-tree
    // walk simple: hx-breadcrumb's role="list" finds role="listitem" hosts
    // as direct children without crossing shadow boundaries to find an
    // inner ARIA role.
    return html`
      <span part="item">
        ${this.current
          ? html`<span part="text" aria-current="page"><slot></slot></span>`
          : this.href
            ? html`<a part="link" href=${this.href}><slot></slot></a>`
            : html`<span part="text"><slot></slot></span>`}
      </span>
      ${!this.dataBcLast
        ? html`<span class="separator" part="separator" aria-hidden="true"></span>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-breadcrumb-item': HelixBreadcrumbItem;
  }
}
