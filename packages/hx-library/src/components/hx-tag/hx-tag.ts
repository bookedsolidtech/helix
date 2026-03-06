import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTagStyles } from './hx-tag.styles.js';

/**
 * A compact label for categorization, filtering, and selection.
 *
 * @summary Compact tag/chip for categorization, filtering, and selection.
 *
 * @tag hx-tag
 *
 * @slot - Default slot for tag label text.
 * @slot prefix - Icon or avatar rendered before the label.
 * @slot suffix - Content rendered after the label.
 *
 * @fires {CustomEvent<void>} hx-remove - Dispatched when the user clicks the remove button.
 *
 * @csspart base - The root tag element.
 * @csspart prefix - The prefix slot wrapper.
 * @csspart label - The label slot wrapper.
 * @csspart remove-button - The remove/dismiss button.
 *
 * @cssprop [--hx-tag-bg=var(--hx-color-neutral-100)] - Tag background color.
 * @cssprop [--hx-tag-color=var(--hx-color-neutral-700)] - Tag text color.
 * @cssprop [--hx-tag-border-color=var(--hx-color-neutral-200)] - Tag border color.
 * @cssprop [--hx-tag-font-size] - Tag font size (set per size variant).
 * @cssprop [--hx-tag-font-weight=var(--hx-font-weight-medium)] - Tag font weight.
 * @cssprop [--hx-tag-font-family=var(--hx-font-family-sans)] - Tag font family.
 * @cssprop [--hx-tag-border-radius=var(--hx-border-radius-sm)] - Tag border radius.
 * @cssprop [--hx-tag-padding-x] - Tag horizontal padding (set per size variant).
 * @cssprop [--hx-tag-padding-y] - Tag vertical padding (set per size variant).
 */
@customElement('hx-tag')
export class HelixTag extends LitElement {
  static override styles = [tokenStyles, helixTagStyles];

  /**
   * Visual style variant of the tag.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';

  /**
   * Size of the tag.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the tag uses fully rounded (pill) styling.
   * @attr pill
   */
  @property({ type: Boolean, reflect: true })
  pill = false;

  /**
   * Whether the tag renders a dismiss button.
   * @attr removable
   */
  @property({ type: Boolean, reflect: true })
  removable = false;

  /**
   * Whether the tag is disabled. When disabled, interactions are suppressed.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // ─── Event Handling ───

  private _handleRemove(): void {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent('hx-remove', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ─── Render ───

  override render() {
    const labelText = this.textContent?.trim() ?? '';

    const classes = {
      tag: true,
      [`tag--${this.variant}`]: true,
      [`tag--${this.size}`]: true,
      'tag--pill': this.pill,
    };

    return html`
      <span
        part="base"
        class=${classMap(classes)}
        aria-disabled=${this.disabled ? 'true' : nothing}
      >
        <span part="prefix" class="tag__prefix">
          <slot name="prefix"></slot>
        </span>
        <span part="label" class="tag__label">
          <slot></slot>
        </span>
        <span class="tag__suffix">
          <slot name="suffix"></slot>
        </span>
        ${this.removable
          ? html`<button
              part="remove-button"
              class="tag__remove-button"
              aria-label=${`Remove ${labelText}`}
              ?disabled=${this.disabled}
              @click=${this._handleRemove}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true" width="10" height="10">
                <path
                  d="M2.22 2.22a.75.75 0 011.06 0L6 4.94l2.72-2.72a.75.75 0 011.06 1.06L7.06 6l2.72 2.72a.75.75 0 01-1.06 1.06L6 7.06 3.28 9.78a.75.75 0 01-1.06-1.06L4.94 6 2.22 3.28a.75.75 0 010-1.06z"
                  fill="currentColor"
                />
              </svg>
            </button>`
          : nothing}
      </span>
    `;
  }
}

export type WcTag = HelixTag;

declare global {
  interface HTMLElementTagNameMap {
    'hx-tag': HelixTag;
  }
}
