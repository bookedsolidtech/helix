import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixListItemStyles } from './hx-list-item.styles.js';

/**
 * A rich list item for use inside `hx-list`.
 *
 * @summary Individual list item with optional prefix, suffix, description, link, and disabled/selected states.
 *
 * @tag hx-list-item
 *
 * @slot - Default slot for the item label text.
 * @slot prefix - Icon, avatar, or content rendered before the label.
 * @slot suffix - Icon, badge, or text rendered after the label.
 * @slot description - Secondary descriptive text rendered below the label.
 *
 * @fires {CustomEvent<{item: HelixListItem, value: string | undefined}>} hx-list-item-click -
 *   Dispatched when the item is clicked and not disabled.
 *
 * @csspart base - The root item element (li, dt, dd, or wrapper).
 * @csspart prefix - The prefix slot container.
 * @csspart label - The label slot container.
 * @csspart description - The description slot container.
 * @csspart suffix - The suffix slot container.
 *
 * @cssprop [--hx-list-item-padding=var(--hx-space-3)] - Item padding.
 * @cssprop [--hx-list-item-color=var(--hx-color-neutral-900)] - Item text color.
 * @cssprop [--hx-list-item-bg-hover=var(--hx-color-neutral-50)] - Item hover background.
 * @cssprop [--hx-list-item-bg-selected=var(--hx-color-primary-50)] - Selected item background.
 * @cssprop [--hx-list-item-color-selected=var(--hx-color-primary-700)] - Selected item text color.
 * @cssprop [--hx-list-item-description-color=var(--hx-color-neutral-500)] - Description text color.
 */
@customElement('hx-list-item')
export class HelixListItem extends LitElement {
  static override styles = [tokenStyles, helixListItemStyles];

  /**
   * Whether the item is disabled. Prevents interaction.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the item is selected (used in interactive mode).
   * @attr selected
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * When set, renders the item as a link (only in non-interactive variants).
   * @attr href
   */
  @property({ type: String })
  href: string | undefined = undefined;

  /**
   * The value associated with this item (used with hx-select).
   * @attr value
   */
  @property({ type: String })
  value: string | undefined = undefined;

  /**
   * Set by the parent hx-list to indicate this item is part of an interactive listbox.
   * Controls CSS styling and ARIA role via host attributes.
   * @attr interactive
   */
  @property({ type: Boolean, reflect: true })
  interactive = false;

  /**
   * Item type for description list variant. Use 'term' for <dt> and 'definition' for <dd>.
   * @attr type
   */
  @property({ type: String, reflect: true })
  type: 'default' | 'term' | 'definition' = 'default';

  override updated(changedProps: Map<string, unknown>): void {
    super.updated(changedProps);
    if (
      changedProps.has('interactive') ||
      changedProps.has('selected') ||
      changedProps.has('disabled')
    ) {
      this._syncHostAria();
    }
  }

  /**
   * Syncs ARIA attributes to the host element when in interactive (listbox option) mode.
   * This ensures correct ARIA ownership: ul[role=listbox] > hx-list-item[role=option].
   */
  private _syncHostAria(): void {
    if (this.interactive) {
      this.setAttribute('role', 'option');
      this.setAttribute('aria-selected', String(this.selected));
      if (this.disabled) {
        this.setAttribute('aria-disabled', 'true');
      } else {
        this.removeAttribute('aria-disabled');
      }
      if (!this.disabled) {
        this.setAttribute('tabindex', '0');
      } else {
        this.removeAttribute('tabindex');
      }
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-selected');
      this.removeAttribute('aria-disabled');
      this.removeAttribute('tabindex');
    }
  }

  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent('hx-list-item-click', {
        bubbles: true,
        composed: true,
        detail: { item: this, value: this.value },
      }),
    );
  }

  private _renderContent() {
    return html`
      <span part="prefix" class="list-item__prefix">
        <slot name="prefix"></slot>
      </span>
      <span class="list-item__body">
        <span part="label" class="list-item__label">
          <slot></slot>
        </span>
        <span part="description" class="list-item__description">
          <slot name="description"></slot>
        </span>
      </span>
      <span part="suffix" class="list-item__suffix">
        <slot name="suffix"></slot>
      </span>
    `;
  }

  override render() {
    // Description list: render as <dt> (term) or <dd> (definition)
    if (this.type === 'term') {
      return html`
        <dt
          part="base"
          class="list-item ${this.disabled ? 'list-item--disabled' : ''}"
          aria-disabled=${this.disabled ? 'true' : nothing}
        >
          ${this._renderContent()}
        </dt>
      `;
    }

    if (this.type === 'definition') {
      return html`
        <dd
          part="base"
          class="list-item ${this.disabled ? 'list-item--disabled' : ''}"
          aria-disabled=${this.disabled ? 'true' : nothing}
        >
          ${this._renderContent()}
        </dd>
      `;
    }

    // Interactive mode: role is on the host element (ARIA ownership across shadow DOM).
    // Internal <li> uses role="presentation" so AT sees: listbox > option (host).
    if (this.interactive) {
      // In interactive mode, links are not rendered as <a> to avoid
      // invalid ARIA: focusable content inside role="option" is prohibited.
      return html`
        <li
          part="base"
          role="presentation"
          class="list-item ${this.selected ? 'list-item--selected' : ''} ${this.disabled
            ? 'list-item--disabled'
            : ''}"
          @click=${this._handleClick}
          @keydown=${this._handleKeydown}
        >
          ${this._renderContent()}
        </li>
      `;
    }

    // Non-interactive with href: render as link
    if (this.href !== undefined && !this.disabled) {
      return html`
        <li
          part="base"
          class="list-item"
          role="listitem"
          aria-disabled=${this.disabled ? 'true' : nothing}
        >
          <a class="list-item__link" href=${ifDefined(this.href)} @click=${this._handleClick}>
            ${this._renderContent()}
          </a>
        </li>
      `;
    }

    // Default non-interactive
    return html`
      <li
        part="base"
        class="list-item ${this.selected ? 'list-item--selected' : ''} ${this.disabled
          ? 'list-item--disabled'
          : ''}"
        role="listitem"
        aria-disabled=${this.disabled ? 'true' : nothing}
        @click=${this._handleClick}
        @keydown=${this._handleKeydown}
      >
        ${this._renderContent()}
      </li>
    `;
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!this.disabled) {
        this._handleClick(e as unknown as MouseEvent);
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-list-item': HelixListItem;
  }
}
