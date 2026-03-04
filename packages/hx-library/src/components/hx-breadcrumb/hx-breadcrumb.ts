import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixBreadcrumbStyles } from './hx-breadcrumb.styles.js';

/**
 * Hierarchical page path navigation showing current location in site structure.
 *
 * @summary Navigation breadcrumb showing the page hierarchy. Works with Drupal's breadcrumb system.
 *
 * @tag hx-breadcrumb
 *
 * @slot - Default slot for hx-breadcrumb-item children.
 *
 * @csspart nav - The nav landmark element.
 * @csspart list - The ordered list containing items.
 *
 * @cssprop [--hx-breadcrumb-separator-content='/'] - Separator character between items.
 * @cssprop [--hx-breadcrumb-separator-color=var(--hx-color-neutral-400)] - Separator color.
 * @cssprop [--hx-breadcrumb-separator-gap=var(--hx-space-1)] - Horizontal gap around separators.
 * @cssprop [--hx-breadcrumb-font-size=var(--hx-font-size-sm)] - Font size.
 * @cssprop [--hx-breadcrumb-link-color=var(--hx-color-primary-600)] - Link color.
 * @cssprop [--hx-breadcrumb-link-hover-color=var(--hx-color-primary-700)] - Link hover color.
 * @cssprop [--hx-breadcrumb-text-color=var(--hx-color-neutral-700)] - Current page text color.
 */
@customElement('hx-breadcrumb')
export class HelixBreadcrumb extends LitElement {
  static override styles = [tokenStyles, helixBreadcrumbStyles];

  /**
   * The separator character displayed between breadcrumb items.
   * @attr separator
   */
  @property({ type: String })
  separator = '/';

  /**
   * The accessible label for the nav landmark.
   * @attr label
   */
  @property({ type: String })
  label = 'Breadcrumb';

  @state() private _itemCount = 0;

  // ─── Slot Handling ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const items = slot
      .assignedElements({ flatten: true })
      .filter((el) => el.tagName.toLowerCase() === 'hx-breadcrumb-item');

    this._itemCount = items.length;

    items.forEach((item, i) => {
      const el = item as HTMLElement;
      const isLast = i === items.length - 1;

      if (isLast) {
        el.setAttribute('aria-current', 'page');
        el.setAttribute('data-bc-last', '');
      } else {
        el.removeAttribute('aria-current');
        el.removeAttribute('data-bc-last');
      }
    });
  }

  // ─── Lifecycle ───

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('separator')) {
      // JSON.stringify wraps the string in quotes so the value is valid
      // for use in the CSS `content` property (e.g. '/' becomes '"/"').
      this.style.setProperty('--hx-breadcrumb-separator-content', JSON.stringify(this.separator));
    }
  }

  // ─── Render ───

  override render() {
    // _itemCount is read to ensure Lit re-renders when the item count changes,
    // keeping the template reactive to slotchange updates.
    void this._itemCount;

    return html`
      <nav part="nav" aria-label=${this.label}>
        <div part="list" role="list">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-breadcrumb': HelixBreadcrumb;
  }
}
