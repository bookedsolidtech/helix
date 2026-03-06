import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixBreadcrumbItemStyles } from './hx-breadcrumb-item.styles.js';

/**
 * A single breadcrumb navigation item.
 *
 * @summary A navigation item within an hx-breadcrumb component. Renders as a link when `href` is
 * provided, or as static text for the current page (last item).
 *
 * @tag hx-breadcrumb-item
 *
 * @slot - The link or page text content.
 *
 * @csspart item - Wrapper around the link or text content.
 * @csspart link - The anchor element when href is provided.
 * @csspart text - The span element when no href (current page).
 * @csspart separator - The separator element rendered after non-last items.
 *
 * @cssprop [--hx-breadcrumb-link-color=var(--hx-color-primary-600)] - Link text color.
 * @cssprop [--hx-breadcrumb-link-hover-color=var(--hx-color-primary-700)] - Link hover text color.
 * @cssprop [--hx-breadcrumb-text-color=var(--hx-color-neutral-700)] - Current page text color.
 * @cssprop [--hx-breadcrumb-separator-content='/'] - Separator character displayed after non-last items.
 * @cssprop [--hx-breadcrumb-separator-color=var(--hx-color-neutral-400)] - Separator color.
 * @cssprop [--hx-breadcrumb-separator-gap=var(--hx-space-1)] - Horizontal margin around separator.
 */
@customElement('hx-breadcrumb-item')
export class HelixBreadcrumbItem extends LitElement {
  static override styles = [tokenStyles, helixBreadcrumbItemStyles];

  override connectedCallback(): void {
    super.connectedCallback();
    // Skip role assignment for the managed ellipsis element — it has its own
    // role="button" set by the parent breadcrumb.
    if (this.classList.contains('hx-bc-ellipsis')) return;

    // Only apply role="listitem" when this item is a direct child of an
    // hx-breadcrumb element. Setting the role unconditionally when used
    // standalone (outside a list context) creates an invalid ARIA hierarchy
    // because listitem requires a list ancestor.
    if (this.closest('hx-breadcrumb') !== null) {
      this.setAttribute('role', 'listitem');
    } else {
      this.removeAttribute('role');
    }
  }

  /**
   * The URL for this breadcrumb link. Omit for the current page (last item).
   * When `current` is true, this property is ignored and the item renders as
   * static text regardless.
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
   * Explicitly marks this item as the current page. Takes precedence over the
   * parent's positional last-item detection. When true, the item renders as
   * static text (never a link) even if `href` is set.
   *
   * Useful for Drupal integration where the current page item may not be the
   * last in the breadcrumb trail.
   * @attr current
   */
  @property({ type: Boolean, reflect: true })
  current = false;

  override render() {
    const isLink = this.href && !this.current;
    return html`
      <span part="item">
        ${isLink
          ? html`<a part="link" href=${this.href!}><slot></slot></a>`
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
