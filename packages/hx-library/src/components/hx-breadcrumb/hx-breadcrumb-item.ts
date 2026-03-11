import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
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
 */
@customElement('hx-breadcrumb-item')
export class HelixBreadcrumbItem extends LitElement {
  static override styles = [tokenStyles, helixBreadcrumbItemStyles];

  override connectedCallback(): void {
    super.connectedCallback();
    // Only apply role="listitem" when this item is a direct child of an
    // hx-breadcrumb element. Setting the role unconditionally when used
    // standalone (outside a list context) creates an invalid ARIA hierarchy
    // because listitem requires a list ancestor.
    //
    // IMPORTANT: If programmatically creating an ellipsis element, set aria-hidden
    // BEFORE inserting into the DOM. connectedCallback fires on insertion and sets
    // role="listitem"; setting aria-hidden after would momentarily expose an
    // un-hidden listitem to the accessibility tree.
    if (this.closest('hx-breadcrumb') !== null) {
      this.setAttribute('role', 'listitem');
    } else {
      this.removeAttribute('role');
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
    // aria-current="page" is placed on the inner element (not the listitem host)
    // for canonical AT announcement ("current page, Patient Records" vs
    // "current page, list item").
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
