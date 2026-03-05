import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSideNavStyles } from './hx-side-nav.styles.js';

/**
 * A collapsible left-side navigation panel with nested menu item support.
 * Designed for clinical portals, admin dashboards, and department navigation.
 *
 * @summary Collapsible side navigation panel for enterprise healthcare applications.
 *
 * @tag hx-side-nav
 *
 * @slot - Default slot for hx-nav-item children.
 * @slot header - Logo or branding content.
 * @slot footer - User profile or settings content.
 *
 * @fires {CustomEvent} hx-collapse - Dispatched when the nav collapses to icon-only mode.
 * @fires {CustomEvent} hx-expand - Dispatched when the nav expands to full width.
 *
 * @csspart nav - The outer nav element.
 * @csspart header - The header section.
 * @csspart body - The scrollable body section.
 * @csspart footer - The footer section.
 *
 * @cssprop [--hx-side-nav-width=16rem] - Full expanded width.
 * @cssprop [--hx-side-nav-collapsed-width=3.5rem] - Collapsed icon-only width.
 * @cssprop [--hx-side-nav-bg=var(--hx-color-neutral-900)] - Background color.
 * @cssprop [--hx-side-nav-color=var(--hx-color-neutral-100)] - Text color.
 * @cssprop [--hx-side-nav-border-color=var(--hx-color-neutral-700)] - Border color.
 * @cssprop [--hx-side-nav-header-padding=var(--hx-space-4)] - Header padding.
 * @cssprop [--hx-side-nav-footer-padding=var(--hx-space-4)] - Footer padding.
 */
@customElement('hx-side-nav')
export class HelixSideNav extends LitElement {
  static override styles = [tokenStyles, helixSideNavStyles];

  // ─── Properties ───

  /**
   * When true, the nav collapses to show icons only.
   * @attr collapsed
   */
  @property({ type: Boolean, reflect: true })
  collapsed = false;

  /**
   * The accessible label for the nav landmark.
   * @attr label
   */
  @property({ type: String })
  label = 'Main Navigation';

  // ─── Event Handling ───

  private _handleToggle(): void {
    this.collapsed = !this.collapsed;

    if (this.collapsed) {
      /**
       * Dispatched when the nav collapses to icon-only mode.
       * @event hx-collapse
       */
      this.dispatchEvent(
        new CustomEvent('hx-collapse', {
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      /**
       * Dispatched when the nav expands to full width.
       * @event hx-expand
       */
      this.dispatchEvent(
        new CustomEvent('hx-expand', {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // ─── Render ───

  private _renderToggleIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
      />
    </svg>`;
  }

  override render() {
    return html`
      <nav part="nav" class="side-nav" aria-label=${this.label}>
        <div part="header" class="side-nav__header">
          <slot name="header"></slot>
          <button
            class="side-nav__toggle"
            aria-label=${this.collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded=${!this.collapsed}
            aria-controls="side-nav-body"
            @click=${this._handleToggle}
          >
            ${this._renderToggleIcon()}
          </button>
        </div>

        <div part="body" class="side-nav__body" id="side-nav-body">
          <slot></slot>
        </div>

        <div part="footer" class="side-nav__footer">
          <slot name="footer"></slot>
        </div>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-side-nav': HelixSideNav;
  }
}

export type { HelixSideNav as WcSideNav };
