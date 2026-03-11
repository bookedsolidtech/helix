import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import { helixOverflowMenuStyles } from './hx-overflow-menu.styles.js';

/**
 * An overflow menu (kebab/meatball menu) that reveals hidden actions via a
 * floating panel. Composed from a trigger button and a slotted menu panel.
 *
 * @summary "..." or kebab icon button that reveals hidden actions.
 *
 * @tag hx-overflow-menu
 *
 * @slot - Menu items (e.g. `<button role="menuitem">` or `<hx-menu-item>` elements).
 *
 * @fires {CustomEvent<{value: string}>} hx-select - Dispatched when a menu item is selected.
 * @fires {CustomEvent<void>} hx-show - Dispatched when the panel opens.
 * @fires {CustomEvent<void>} hx-hide - Dispatched when the panel closes.
 *
 * @csspart button - The trigger icon button element.
 * @csspart trigger - Alias for button — the trigger icon button element.
 * @csspart panel - The floating menu panel container.
 * @csspart menu - Alias for panel — the floating menu panel container.
 *
 * @cssprop [--hx-overflow-menu-panel-bg=var(--hx-color-neutral-0,#fff)] - Panel background color.
 * @cssprop [--hx-overflow-menu-panel-border=1px solid var(--hx-color-neutral-200,#e5e7eb)] - Panel border.
 * @cssprop [--hx-overflow-menu-panel-border-radius=var(--hx-border-radius-md)] - Panel border radius.
 * @cssprop [--hx-overflow-menu-panel-shadow=0 4px 16px rgba(0,0,0,0.12)] - Panel box shadow.
 * @cssprop [--hx-overflow-menu-panel-min-width=160px] - Minimum panel width.
 * @cssprop [--hx-overflow-menu-panel-z-index=1000] - Panel z-index.
 * @cssprop [--hx-overflow-menu-button-color=var(--hx-color-neutral-600)] - Trigger icon color.
 *
 * @example
 * ```html
 * <hx-overflow-menu>
 *   <button role="menuitem">Edit</button>
 *   <button role="menuitem">Delete</button>
 * </hx-overflow-menu>
 * ```
 */
@customElement('hx-overflow-menu')
export class HelixOverflowMenu extends LitElement {
  static override styles = [tokenStyles, helixOverflowMenuStyles];

  /**
   * Preferred placement of the floating panel relative to the trigger.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end' = 'bottom-end';

  /**
   * Size of the trigger button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the trigger button is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Icon orientation: vertical (kebab ⋮) or horizontal (meatball ···).
   * @attr icon
   */
  @property({ type: String, reflect: true })
  icon: 'vertical' | 'horizontal' = 'vertical';

  /**
   * Accessible label for the trigger button.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = 'More actions';

  @state() private _open = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleDocumentClick, true);
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleDocumentClick, true);
    this.removeEventListener('keydown', this._handleKeydown);
  }

  // ─── Open / Close ───

  private async _show(): Promise<void> {
    if (this._open || this.disabled) return;
    this._open = true;
    await this.updateComplete;
    await this._updatePosition();
    this._focusFirstItem();
    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));
  }

  private _hide(): void {
    if (!this._open) return;
    this._open = false;
    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));
  }

  private _toggle(): void {
    if (this._open) {
      this._hide();
    } else {
      void this._show();
    }
  }

  // ─── Positioning (Floating UI) ───

  private async _updatePosition(): Promise<void> {
    const trigger = this.shadowRoot?.querySelector('[part~="button"]') as HTMLElement | null;
    const panel = this.shadowRoot?.querySelector('[part~="panel"]') as HTMLElement | null;
    if (!trigger || !panel) return;

    const { x, y } = await computePosition(trigger, panel, {
      placement: this.placement,
      strategy: 'fixed',
      middleware: [offset(4), flip(), shift({ padding: 8 })],
    });

    Object.assign(panel.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  // ─── Focus management ───

  private _focusFirstItem(): void {
    const items = this._getMenuItems();
    items[0]?.focus();
  }

  private _getMenuItems(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    return (
      (slot
        ?.assignedElements({ flatten: true })
        .filter(
          (el) =>
            el instanceof HTMLElement &&
            !el.hasAttribute('disabled') &&
            !(el as HTMLButtonElement).disabled &&
            (el.getAttribute('role') === 'menuitem' ||
              el.getAttribute('role') === 'menuitemcheckbox' ||
              el.getAttribute('role') === 'menuitemradio' ||
              el.tagName.toLowerCase().startsWith('hx-')),
        ) as HTMLElement[]) ?? []
    );
  }

  // ─── Event Handlers (arrow function class fields — stable reference, no bind needed) ───

  private readonly _handleTriggerClick = (e: MouseEvent): void => {
    e.stopPropagation();
    this._toggle();
  };

  private readonly _handleDocumentClick = (e: MouseEvent): void => {
    if (!this._open) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._hide();
    }
  };

  private readonly _handleKeydown = (e: KeyboardEvent): void => {
    if (!this._open) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      this._hide();
      (this.shadowRoot?.querySelector('[part~="button"]') as HTMLElement | null)?.focus();
      return;
    }
    if (e.key === 'Tab') {
      this._hide();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      e.stopPropagation();
      const items = this._getMenuItems();
      if (items.length === 0) return;
      const focused = items.indexOf(document.activeElement as HTMLElement);
      let next: number;
      if (e.key === 'ArrowDown') {
        next = focused < 0 || focused >= items.length - 1 ? 0 : focused + 1;
      } else if (e.key === 'ArrowUp') {
        next = focused <= 0 ? items.length - 1 : focused - 1;
      } else if (e.key === 'Home') {
        next = 0;
      } else {
        next = items.length - 1;
      }
      items[next]?.focus();
    }
  };

  private readonly _handleSlotClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    const menuItem = target.closest(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ) as HTMLElement | null;
    if (!menuItem) return;
    if (menuItem.hasAttribute('disabled') || (menuItem as HTMLButtonElement).disabled) return;
    const value = menuItem.getAttribute('data-value') ?? menuItem.textContent?.trim() ?? '';
    this.dispatchEvent(
      new CustomEvent('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
    this._hide();
  };

  // ─── SVG Icons ───

  private _renderIcon() {
    if (this.icon === 'horizontal') {
      return html`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      `;
    }
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    `;
  }

  // ─── Render ───

  override render() {
    const btnClasses = {
      trigger: true,
      [`trigger--${this.size}`]: true,
      'trigger--open': this._open,
    };

    return html`
      <button
        part="button trigger"
        class=${classMap(btnClasses)}
        type="button"
        aria-label=${this.label}
        aria-haspopup="menu"
        aria-expanded=${this._open ? 'true' : 'false'}
        ?disabled=${this.disabled}
        @click=${this._handleTriggerClick}
      >
        ${this._renderIcon()}
      </button>
      ${this._open
        ? html`
            <div
              part="panel menu"
              role="menu"
              aria-label="Actions"
              class="panel"
              @click=${this._handleSlotClick}
            >
              <slot></slot>
            </div>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-overflow-menu': HelixOverflowMenu;
  }
}
