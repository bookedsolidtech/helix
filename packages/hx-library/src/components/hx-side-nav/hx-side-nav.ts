import { html, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
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
 * @fires {CustomEvent<{ collapsed: boolean }>} hx-collapse - Dispatched when the nav collapses to icon-only mode.
 * @fires {CustomEvent<{ collapsed: boolean }>} hx-expand - Dispatched when the nav expands to full width.
 *
 * @csspart nav - The outer nav element.
 * @csspart header - The header section.
 * @csspart body - The scrollable body section.
 * @csspart footer - The footer section.
 * @csspart toggle - The collapse/expand toggle button.
 *
 * @cssprop [--hx-side-nav-width=16rem] - Full expanded width.
 * @cssprop [--hx-side-nav-collapsed-width=3.5rem] - Collapsed icon-only width.
 * @cssprop [--hx-side-nav-bg=var(--hx-color-surface-inverse)] - Background color.
 * @cssprop [--hx-side-nav-color=var(--hx-color-text-inverse)] - Text color.
 * @cssprop [--hx-side-nav-border-color=var(--hx-color-border-on-dark-strong)] - Border color (against the dark surface-inverse host bg).
 * @cssprop [--hx-side-nav-header-padding=var(--hx-space-4)] - Header padding.
 * @cssprop [--hx-side-nav-footer-padding=var(--hx-space-4)] - Footer padding.
 * @cssprop [--hx-side-nav-toggle-color=var(--hx-color-text-inverse)] - Toggle button icon color (resting).
 * @cssprop [--hx-side-nav-toggle-hover-color=var(--hx-color-text-inverse)] - Toggle button icon color on hover.
 * @cssprop [--hx-color-surface-inverse] - Side-nav surface fill (resolves to neutral-900 light, near-black dark).
 * @cssprop [--hx-color-text-inverse] - Side-nav text color (resolves to neutral-0).
 * @cssprop [--hx-color-border-on-dark-strong] - Container/header/footer divider border (overlay-white-70 light, overlay-black-50 dark — sized for visibility on the mode-flipped surface-inverse).
 * @cssprop [--hx-color-border-on-dark-subtle] - Toggle button hover surface (overlay-white-10 primitive — semantic layer for inverted affordances).
 */
@customElement('hx-side-nav')
export class HelixSideNav extends HelixElement {
  // 3.2.1: forced-colors deference is owned by the bespoke @media block in
  // hx-side-nav.styles.ts (toggle button, header/footer borders). Do NOT also
  // compose forcedColorsInteractive — XOR rule per the mixin docstring.
  static override styles = [helixSideNavStyles];

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

  override updated(changedProperties: PropertyValues<this>): void {
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
  /** @internal */
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
  /** @internal */
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
  /** @internal */
  private _handleKeydown(e: KeyboardEvent): void {
    const validKeys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!validKeys.includes(e.key)) return;

    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const topLevelItems = slot
      .assignedElements({ flatten: true })
      .filter(
        (el): el is HTMLElement =>
          el.tagName.toLowerCase() === 'hx-nav-item' && !el.hasAttribute('disabled'),
      );

    if (topLevelItems.length === 0) return;

    // Build a flattened list of navigable items: direct children plus visible
    // child items from expanded parent items (per ARIA APG tree pattern).
    const navItems: HTMLElement[] = [];
    for (const item of topLevelItems) {
      navItems.push(item);
      // If this item is expanded, include its non-disabled children
      if (item.hasAttribute('expanded')) {
        const childrenSlot =
          item.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="children"]');
        if (childrenSlot) {
          const childItems = childrenSlot
            .assignedElements({ flatten: true })
            .filter(
              (el): el is HTMLElement =>
                el.tagName.toLowerCase() === 'hx-nav-item' && !el.hasAttribute('disabled'),
            );
          navItems.push(...childItems);
        }
      }
    }

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

    // Handle ArrowRight/ArrowLeft for expand/collapse (ARIA APG tree pattern)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentItem = currentIndex >= 0 ? navItems[currentIndex] : null;
      if (!currentItem) return;

      if (e.key === 'ArrowRight') {
        // If the item has children and is collapsed, expand it
        if (
          currentItem.hasAttribute('expanded') === false &&
          currentItem.querySelector('[slot="children"]')
        ) {
          currentItem.setAttribute('expanded', '');
          (currentItem as HTMLElement & { expanded?: boolean }).expanded = true;
        } else if (currentItem.hasAttribute('expanded')) {
          // Already expanded: move focus to first child item
          const childrenSlot =
            currentItem.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="children"]');
          if (childrenSlot) {
            const firstChild = childrenSlot
              .assignedElements({ flatten: true })
              .find(
                (el): el is HTMLElement =>
                  el.tagName.toLowerCase() === 'hx-nav-item' && !el.hasAttribute('disabled'),
              );
            if (firstChild) {
              firstChild.focus();
              return;
            }
          }
        }
      } else {
        // ArrowLeft: if expanded, collapse; if collapsed or non-expandable, find parent
        if (currentItem.hasAttribute('expanded')) {
          currentItem.removeAttribute('expanded');
          (currentItem as HTMLElement & { expanded?: boolean }).expanded = false;
        } else {
          // Move focus to parent item if this item is a child in another item's slot
          const parentNavItem =
            currentItem.closest<HTMLElement>('hx-nav-item:not(:scope)') ??
            currentItem.parentElement?.closest<HTMLElement>('hx-nav-item') ??
            null;
          if (parentNavItem && !parentNavItem.hasAttribute('disabled')) {
            parentNavItem.focus();
          }
        }
      }
      return;
    }

    e.preventDefault();

    let nextIndex: number;
    if (e.key === 'ArrowDown') {
      nextIndex = currentIndex < navItems.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : navItems.length - 1;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else {
      nextIndex = navItems.length - 1;
    }

    const targetItem = navItems[nextIndex];
    if (!targetItem) return;
    // WCAG 2.1.1: call the public focus() method on the nav item rather than
    // piercing its Shadow DOM directly. hx-nav-item.focus() delegates to the
    // internal [part="link"] element, preserving shadow encapsulation.
    targetItem.focus();
  }

  // ─── Event Handling ───

  /** @internal */
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

  /** @internal */
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

export type { HelixSideNav as HxSideNav };
