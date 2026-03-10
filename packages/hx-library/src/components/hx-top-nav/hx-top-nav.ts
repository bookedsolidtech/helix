import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTopNavStyles } from './hx-top-nav.styles.js';

/**
 * Top-of-page site navigation bar with logo, menu items, and utility area.
 * Supports sticky positioning, responsive hamburger menu, and full slot-driven
 * content composition for Drupal and other CMS consumers.
 *
 * @summary Site-level navigation bar with logo, nav items, and action slots.
 *
 * @tag hx-top-nav
 *
 * @slot logo - Brand area rendered on the left side.
 * @slot - Default slot for primary navigation items rendered in the center.
 *   IMPORTANT: Do NOT place a `<nav>` element in this slot — the component
 *   already renders a `<nav>` landmark internally. Use a `<div>` or bare links.
 * @slot actions - Utility area rendered on the right side (search, user menu, etc.).
 *
 * @fires {CustomEvent<{open: boolean}>} hx-mobile-toggle - Dispatched when the
 *   hamburger button is toggled. Detail contains the new open state.
 *
 * @csspart header - The outer `<header>` landmark element.
 * @csspart nav - The `<nav>` element inside the header.
 * @csspart logo - The logo slot container.
 * @csspart menu - The primary navigation slot container.
 * @csspart actions - The actions slot container.
 * @csspart mobile-toggle - The hamburger toggle button.
 *
 * @cssprop [--hx-top-nav-bg=var(--hx-color-neutral-0)] - Navigation bar background color.
 * @cssprop [--hx-top-nav-color=var(--hx-color-neutral-800)] - Navigation bar text color.
 * @cssprop [--hx-top-nav-border-color=var(--hx-color-neutral-200)] - Bottom border color.
 * @cssprop [--hx-top-nav-height=var(--hx-space-16)] - Navigation bar height.
 * @cssprop [--hx-top-nav-padding-x=var(--hx-space-6)] - Horizontal padding.
 * @cssprop [--hx-top-nav-z-index=var(--hx-z-index-sticky)] - Z-index for sticky mode.
 * @cssprop [--hx-top-nav-toggle-color=var(--hx-color-neutral-700)] - Hamburger icon color.
 */
@customElement('hx-top-nav')
export class HelixTopNav extends LitElement {
  static override styles = [tokenStyles, helixTopNavStyles];

  // ─── Public Properties ───

  /**
   * When true, the navigation bar sticks to the top of the viewport during scroll.
   * @attr sticky
   */
  @property({ type: Boolean, reflect: true })
  sticky = false;

  /**
   * Accessible label applied to the `<nav>` element via `aria-label`.
   * @attr label
   */
  @property({ type: String })
  label = 'Site Navigation';

  // ─── Private State ───

  /** Whether the mobile collapsible menu is currently open. */
  @state() private _mobileOpen = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
  }

  // ─── Event Handling ───

  private _handleMobileToggle(): void {
    this._mobileOpen = !this._mobileOpen;

    /**
     * Dispatched when the hamburger button is toggled.
     * @event hx-mobile-toggle
     */
    this.dispatchEvent(
      new CustomEvent<{ open: boolean }>('hx-mobile-toggle', {
        bubbles: true,
        composed: true,
        detail: { open: this._mobileOpen },
      }),
    );

    if (this._mobileOpen) {
      // Move focus to first interactive element in the default slot
      this.updateComplete.then(() => {
        const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
        const assigned = slot?.assignedElements({ flatten: true }) ?? [];
        const firstFocusable = assigned.find((el): el is HTMLElement => el instanceof HTMLElement);
        firstFocusable?.focus();
      });
    }
  }

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._mobileOpen) {
      this._mobileOpen = false;
      this.dispatchEvent(
        new CustomEvent<{ open: boolean }>('hx-mobile-toggle', {
          bubbles: true,
          composed: true,
          detail: { open: false },
        }),
      );
      // Return focus to the toggle button
      this.shadowRoot?.querySelector<HTMLButtonElement>('[part="mobile-toggle"]')?.focus();
    }
  };

  // ─── Render Helpers ───

  private _renderHamburgerIcon() {
    return html`
      <svg
        class="mobile-toggle__icon"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        ${this._mobileOpen
          ? html`
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            `
          : html`
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            `}
      </svg>
    `;
  }

  // ─── Render ───

  override render() {
    const menuClasses = {
      nav__collapsible: true,
      'nav__collapsible--open': this._mobileOpen,
    };

    return html`
      <header part="header">
        <nav part="nav" class="nav" aria-label=${this.label}>
          <div class="nav__bar">
            <div part="logo" class="nav__logo">
              <slot name="logo"></slot>
            </div>

            <button
              part="mobile-toggle"
              class="mobile-toggle"
              type="button"
              aria-expanded=${String(this._mobileOpen)}
              aria-controls="nav-menu"
              aria-label="Toggle navigation"
              @click=${this._handleMobileToggle}
            >
              ${this._renderHamburgerIcon()}
            </button>
          </div>

          <div id="nav-menu" class=${classMap(menuClasses)}>
            <div part="menu" class="nav__menu">
              <slot></slot>
            </div>

            <div part="actions" class="nav__actions">
              <slot name="actions"></slot>
            </div>
          </div>
        </nav>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-top-nav': HelixTopNav;
  }
}
