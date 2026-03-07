import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSideNavStyles } from './hx-side-nav.styles.js';

/**
 * A collapsible left-side navigation panel with nested menu item support.
 * Designed for clinical portals, admin dashboards, and department navigation.
 * Renders a `<nav>` landmark with `aria-label` for screen readers.
 * Supports keyboard navigation via ArrowUp/ArrowDown among child hx-nav-item elements.
 *
 * @summary Collapsible side navigation panel for enterprise healthcare applications.
 *
 * @tag hx-side-nav
 *
 * @slot - Default slot for hx-nav-item children.
 * @slot header - Logo or branding content.
 * @slot footer - User profile or settings content.
 *
 * @fires {CustomEvent<{ collapsed: boolean }>} hx-collapse - Dispatched when the nav collapses to icon-only mode.
 * @fires {CustomEvent<{ collapsed: boolean }>} hx-expand - Dispatched when the nav expands to full width.
 *
 * @csspart nav - The outer nav element.
 * @csspart header - The header section.
 * @csspart toggle - The collapse/expand toggle button.
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
 * @cssprop [--hx-side-nav-toggle-color=var(--hx-color-neutral-400)] - Toggle button color.
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

  // ─── Lifecycle ───

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('collapsed')) {
      this._propagateCollapsedToChildren();
    }
  }

  // ─── Collapsed State Propagation ───

  /**
   * Propagates the collapsed state to all slotted hx-nav-item children by
   * setting or removing the `data-collapsed` attribute. This allows child
   * items to respond to collapsed mode via their CSS selectors.
   */
  private _propagateCollapsedToChildren(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const navItems = slot
      .assignedElements({ flatten: true })
      .filter((el) => el.tagName.toLowerCase() === 'hx-nav-item');

    for (const item of navItems) {
      if (!(item instanceof HTMLElement)) continue;
      if (this.collapsed) {
        item.setAttribute('data-collapsed', '');
      } else {
        item.removeAttribute('data-collapsed');
      }
    }
  }

  /**
   * Handles the default slot's slotchange event so that if items are added
   * after initial render, they immediately receive the correct collapsed state.
   */
  private _onDefaultSlotChange(): void {
    this._propagateCollapsedToChildren();
  }

  // ─── Keyboard Navigation ───

  /**
   * Implements roving tabindex-style ArrowUp/ArrowDown keyboard navigation
   * among direct hx-nav-item children in the body slot. Disabled items are
   * skipped. Focus is applied to the interactive element inside the shadow DOM
   * of each item (anchor or button with part="link").
   */
  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const navItems = slot
      .assignedElements({ flatten: true })
      .filter(
        (el): el is HTMLElement =>
          el.tagName.toLowerCase() === 'hx-nav-item' && !el.hasAttribute('disabled'),
      );

    if (navItems.length === 0) return;

    // Find which item currently contains focus
    const activeEl = document.activeElement;
    let currentIndex = -1;
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i];
      if (!item) continue;
      if (
        item === activeEl ||
        item.contains(activeEl) ||
        item.shadowRoot?.contains(activeEl) === true
      ) {
        currentIndex = i;
        break;
      }
    }

    e.preventDefault();

    let nextIndex: number;
    if (e.key === 'ArrowDown') {
      nextIndex = currentIndex < navItems.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : navItems.length - 1;
    }

    const targetItem = navItems[nextIndex];
    if (!targetItem) return;
    const focusTarget = targetItem.shadowRoot?.querySelector<HTMLElement>('[part="link"]');
    focusTarget?.focus();
  }

  // ─── Event Handling ───

  private _handleToggle(): void {
    this.collapsed = !this.collapsed;

    if (this.collapsed) {
      /**
       * Dispatched when the nav collapses to icon-only mode.
       * @event hx-collapse
       */
      this.dispatchEvent(
        new CustomEvent<{ collapsed: boolean }>('hx-collapse', {
          bubbles: true,
          composed: true,
          detail: { collapsed: true },
        }),
      );
    } else {
      /**
       * Dispatched when the nav expands to full width.
       * @event hx-expand
       */
      this.dispatchEvent(
        new CustomEvent<{ collapsed: boolean }>('hx-expand', {
          bubbles: true,
          composed: true,
          detail: { collapsed: false },
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
            part="toggle"
            class="side-nav__toggle"
            aria-label=${this.collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded=${!this.collapsed}
            aria-controls="side-nav-body"
            @click=${this._handleToggle}
          >
            ${this._renderToggleIcon()}
          </button>
        </div>

        <div part="body" class="side-nav__body" id="side-nav-body" @keydown=${this._handleKeydown}>
          <slot @slotchange=${this._onDefaultSlotChange}></slot>
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
