import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTagStyles } from './hx-tag.styles.js';

/**
 * A removable or static label for categories, filters, and selections.
 * Distinct from badge — tags represent user-applied or filterable labels.
 *
 * @summary Removable or static label for categories, filters, and selections.
 *
 * @tag hx-tag
 *
 * @slot - Default slot for tag label text.
 * @slot prefix - Icon or prefix content displayed before the label.
 *
 * @fires {CustomEvent<{selected: boolean}>} hx-select - Dispatched when the tag is clicked in toggle mode.
 * @fires {CustomEvent} hx-remove - Dispatched when the remove button is clicked.
 *
 * @csspart tag - The main tag container element.
 * @csspart remove-button - The remove button (only rendered when removable is true).
 * @csspart prefix - The prefix slot wrapper.
 *
 * @cssprop [--hx-tag-bg=var(--hx-color-neutral-100)] - Tag background color.
 * @cssprop [--hx-tag-color=var(--hx-color-neutral-700)] - Tag text color.
 * @cssprop [--hx-tag-border-color=var(--hx-color-neutral-200)] - Tag border color.
 * @cssprop [--hx-tag-border-radius=var(--hx-border-radius-md)] - Tag border radius.
 * @cssprop [--hx-tag-font-size] - Tag font size (set per size variant).
 * @cssprop [--hx-tag-font-weight=var(--hx-font-weight-medium)] - Tag font weight.
 * @cssprop [--hx-tag-font-family=var(--hx-font-family-sans)] - Tag font family.
 * @cssprop [--hx-tag-padding-x] - Tag horizontal padding (set per size variant).
 * @cssprop [--hx-tag-padding-y] - Tag vertical padding (set per size variant).
 */
@customElement('hx-tag')
export class HelixTag extends LitElement {
  static override styles = [tokenStyles, helixTagStyles];

  // ─── Properties ───

  /**
   * Visual style variant of the tag.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'neutral' | 'outline' = 'neutral';

  /**
   * Size of the tag.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the tag displays a remove button to allow dismissal.
   * @attr removable
   */
  @property({ type: Boolean, reflect: true })
  removable = false;

  /**
   * Whether the tag is in a disabled state, preventing interaction.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the tag is in a selected/active state, used for filter toggle mode.
   * @attr selected
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  // ─── Internal State ───

  @state()
  private _hasPrefixContent = false;

  // ─── Slot Handling ───

  private _handlePrefixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasPrefixContent = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Event Handling ───

  private _handleTagClick(): void {
    if (this.disabled) return;
    this.selected = !this.selected;
    this.dispatchEvent(
      new CustomEvent('hx-select', {
        bubbles: true,
        composed: true,
        detail: { selected: this.selected },
      }),
    );
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this.disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._handleTagClick();
    }
  }

  private _handleRemoveClick(e: Event): void {
    e.stopPropagation();
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent('hx-remove', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleRemoveKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      this._handleRemoveClick(e);
    }
  }

  // ─── Render ───

  override render() {
    const tagClasses = {
      tag: true,
      [`tag--${this.variant}`]: true,
      [`tag--${this.size}`]: true,
      'tag--removable': this.removable,
      'tag--selected': this.selected,
      'tag--disabled': this.disabled,
    };

    // When removable, the remove button is the interactive element — the outer
    // span must NOT also carry role="button" (nested-interactive a11y violation).
    const isInteractiveTag = !this.removable;

    return html`
      <span
        part="tag"
        class=${classMap(tagClasses)}
        role=${isInteractiveTag ? 'button' : nothing}
        tabindex=${isInteractiveTag ? (this.disabled ? '-1' : '0') : nothing}
        aria-disabled=${this.disabled && isInteractiveTag ? 'true' : nothing}
        aria-pressed=${isInteractiveTag ? (this.selected ? 'true' : 'false') : nothing}
        @click=${isInteractiveTag ? this._handleTagClick : nothing}
        @keydown=${isInteractiveTag ? this._handleKeyDown : nothing}
      >
        <span part="prefix" class="tag__prefix" ?hidden=${!this._hasPrefixContent}>
          <slot name="prefix" @slotchange=${this._handlePrefixSlotChange}></slot>
        </span>

        <slot></slot>

        ${this.removable
          ? html`
              <button
                part="remove-button"
                class="tag__remove"
                type="button"
                aria-label="Remove"
                ?disabled=${this.disabled}
                aria-disabled=${this.disabled ? 'true' : nothing}
                @click=${this._handleRemoveClick}
                @keydown=${this._handleRemoveKeyDown}
              >
                &#x2715;
              </button>
            `
          : nothing}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tag': HelixTag;
  }
}
