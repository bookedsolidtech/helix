import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTileStyles } from './hx-tile.styles.js';

/**
 * A clickable tile component for dashboards, navigation grids, and selection patterns.
 *
 * @summary Clickable tile with icon, label, description, and badge slots.
 *
 * @tag hx-tile
 *
 * @slot icon - Large icon or illustration displayed at the top of the tile.
 * @slot label - The tile label/title content.
 * @slot description - Optional descriptive text below the label.
 * @slot badge - Optional overlay badge positioned at the top-right corner.
 *
 * @fires {CustomEvent<{href: string, originalEvent: MouseEvent | KeyboardEvent}>} hx-click - Dispatched when a link tile is clicked.
 * @fires {CustomEvent<{selected: boolean, originalEvent: MouseEvent | KeyboardEvent}>} hx-select - Dispatched when a selectable tile is toggled.
 *
 * @csspart base - The outer tile container element.
 * @csspart icon - The icon slot container.
 * @csspart label - The label slot container.
 * @csspart description - The description slot container.
 * @csspart badge - The badge slot container.
 *
 * @cssprop [--hx-tile-bg=var(--hx-color-neutral-0)] - Tile background color.
 * @cssprop [--hx-tile-color=var(--hx-color-neutral-800)] - Tile text color.
 * @cssprop [--hx-tile-border-color=var(--hx-color-neutral-200)] - Tile border color.
 * @cssprop [--hx-tile-border-radius=var(--hx-border-radius-lg)] - Tile border radius.
 * @cssprop [--hx-tile-padding=var(--hx-space-5)] - Internal padding.
 * @cssprop [--hx-tile-gap=var(--hx-space-3)] - Gap between tile sections.
 * @cssprop [--hx-tile-icon-size=2.5rem] - Icon size.
 * @cssprop [--hx-tile-label-color=var(--hx-color-neutral-800)] - Label text color.
 * @cssprop [--hx-tile-description-color=var(--hx-color-neutral-600)] - Description text color.
 */
@customElement('hx-tile')
export class HelixTile extends LitElement {
  static override styles = [tokenStyles, helixTileStyles];

  /**
   * Optional URL. When set, the tile renders as a link and fires `hx-click` on activation.
   * @attr href
   */
  @property({ type: String, reflect: true })
  href = '';

  /**
   * Whether the tile is in a selected/pressed state.
   * Only meaningful when the tile is selectable (no href).
   * @attr selected
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * When true, the tile is non-interactive and visually dimmed.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Visual style variant of the tile.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'outlined' | 'filled' = 'default';

  // ─── Slot Detection ───

  @state() private _hasIcon = false;
  @state() private _hasLabel = false;
  @state() private _hasDescription = false;
  @state() private _hasBadge = false;

  private _onIconSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasIcon = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _onLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabel = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _onDescriptionSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasDescription = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _onBadgeSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasBadge = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Event Handling ───

  private _handleClick(e: MouseEvent): void {
    if (this.disabled) return;

    if (this.href) {
      e.preventDefault(); // Prevent browser navigation; consumers handle routing via hx-click
      this.dispatchEvent(
        new CustomEvent('hx-click', {
          bubbles: true,
          composed: true,
          detail: { href: this.href, originalEvent: e },
        }),
      );
    } else {
      this.selected = !this.selected;
      this.dispatchEvent(
        new CustomEvent('hx-select', {
          bubbles: true,
          composed: true,
          detail: { selected: this.selected, originalEvent: e },
        }),
      );
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this.disabled) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;

    e.preventDefault();

    if (this.href) {
      this.dispatchEvent(
        new CustomEvent('hx-click', {
          bubbles: true,
          composed: true,
          detail: { href: this.href, originalEvent: e },
        }),
      );
    } else {
      this.selected = !this.selected;
      this.dispatchEvent(
        new CustomEvent('hx-select', {
          bubbles: true,
          composed: true,
          detail: { selected: this.selected, originalEvent: e },
        }),
      );
    }
  }

  // ─── Render ───

  override render() {
    const isLink = !!this.href;
    const isInteractive = !this.disabled;

    const classes = {
      tile: true,
      [`tile--${this.variant}`]: true,
      'tile--interactive': isInteractive,
      'tile--selected': this.selected && !isLink,
      'tile--disabled': this.disabled,
    };

    if (isLink) {
      return html`
        <a
          part="base"
          class=${classMap(classes)}
          href=${this.disabled ? nothing : this.href}
          aria-disabled=${this.disabled ? 'true' : nothing}
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
        >
          <div class="tile__icon" part="icon" ?hidden=${!this._hasIcon}>
            <slot name="icon" @slotchange=${this._onIconSlotChange}></slot>
          </div>
          <div class="tile__label" part="label" ?hidden=${!this._hasLabel}>
            <slot name="label" @slotchange=${this._onLabelSlotChange}></slot>
          </div>
          <div class="tile__description" part="description" ?hidden=${!this._hasDescription}>
            <slot name="description" @slotchange=${this._onDescriptionSlotChange}></slot>
          </div>
          <div class="tile__badge" part="badge" ?hidden=${!this._hasBadge}>
            <slot name="badge" @slotchange=${this._onBadgeSlotChange}></slot>
          </div>
        </a>
      `;
    }

    return html`
      <div
        part="base"
        class=${classMap(classes)}
        role="button"
        tabindex=${this.disabled ? '-1' : '0'}
        aria-pressed=${this.selected ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : nothing}
        @click=${this._handleClick}
        @keydown=${this._handleKeyDown}
      >
        <div class="tile__icon" part="icon" ?hidden=${!this._hasIcon}>
          <slot name="icon" @slotchange=${this._onIconSlotChange}></slot>
        </div>
        <div class="tile__label" part="label" ?hidden=${!this._hasLabel}>
          <slot name="label" @slotchange=${this._onLabelSlotChange}></slot>
        </div>
        <div class="tile__description" part="description" ?hidden=${!this._hasDescription}>
          <slot name="description" @slotchange=${this._onDescriptionSlotChange}></slot>
        </div>
        <div class="tile__badge" part="badge" ?hidden=${!this._hasBadge}>
          <slot name="badge" @slotchange=${this._onBadgeSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tile': HelixTile;
  }
}
