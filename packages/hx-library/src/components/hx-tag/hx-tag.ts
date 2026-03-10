import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
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
 * @csspart suffix - The suffix slot wrapper.
 * @csspart remove-button - The remove/dismiss button.
 *
 * @cssprop [--hx-tag-bg=var(--hx-color-neutral-100)] - Tag background color.
 * @cssprop [--hx-tag-color=var(--hx-color-neutral-700)] - Tag text color.
 * @cssprop [--hx-tag-border-color=var(--hx-color-neutral-200)] - Tag border color.
 * @cssprop [--hx-tag-font-size] - Tag font size (set per size variant).
 * @cssprop [--hx-tag-font-weight=var(--hx-font-weight-medium)] - Tag font weight.
 * @cssprop [--hx-tag-font-family=var(--hx-font-family-sans)] - Tag font family.
 * @cssprop [--hx-tag-border-radius=var(--hx-border-radius-sm)] - Tag border radius (non-pill mode).
 * @cssprop [--hx-tag-border-radius-pill=var(--hx-border-radius-full)] - Border radius in pill mode. Independent of --hx-tag-border-radius so consumer overrides don't break pill shape.
 * @cssprop [--hx-tag-padding-x] - Tag horizontal padding (set per size variant).
 * @cssprop [--hx-tag-padding-y] - Tag vertical padding (set per size variant).
 *
 * @note Visual style variants (filled/outlined/ghost) are not supported. This component
 * intentionally provides only filled-style tags with color variation via the `variant` prop.
 *
 * @note aria-live removal announcements are the consuming application's responsibility.
 * When a tag is removed from the DOM, applications should announce the change via their
 * own aria-live region to inform screen reader users of clinical data filter changes.
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
   * @note The attribute name is `hx-size` (not `size`) to avoid conflict with the native
   * `size` attribute. Storybook autodocs controls bind to the property name `size`; when
   * writing HTML or Drupal Twig templates always use the `hx-size` attribute name.
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

  // ─── Internal State ───

  /**
   * Text from the default slot only (excludes prefix/suffix slotted content).
   * Used to build the remove button's aria-label without polluting it with icon text.
   * @internal
   */
  @state() private _defaultSlotText = '';

  /** @internal Whether the prefix slot has assigned content. */
  @state() private _hasPrefix = false;

  /** @internal Whether the suffix slot has assigned content. */
  @state() private _hasSuffix = false;

  // ─── Event Handling ───

  /** @internal */
  private _handleRemove(): void {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent('hx-remove', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** @internal Updates _defaultSlotText from only the default slot's text nodes. */
  private _onDefaultSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    this._defaultSlotText = nodes
      .filter((n): n is Text => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
  }

  /** @internal */
  private _onPrefixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasPrefix = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _onSuffixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasSuffix = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Render ───

  override render() {
    const classes = {
      tag: true,
      [`tag--${this.variant}`]: true,
      [`tag--${this.size}`]: true,
      'tag--pill': this.pill,
    };

    const prefixClasses = {
      tag__prefix: true,
      'tag__prefix--hidden': !this._hasPrefix,
    };

    const suffixClasses = {
      tag__suffix: true,
      'tag__suffix--hidden': !this._hasSuffix,
    };

    return html`
      <span part="base" class=${classMap(classes)}>
        <span part="prefix" class=${classMap(prefixClasses)}>
          <slot name="prefix" @slotchange=${this._onPrefixSlotChange}></slot>
        </span>
        <span part="label" class="tag__label">
          <slot @slotchange=${this._onDefaultSlotChange}></slot>
        </span>
        <span part="suffix" class=${classMap(suffixClasses)}>
          <slot name="suffix" @slotchange=${this._onSuffixSlotChange}></slot>
        </span>
        ${this.removable
          ? html`<button
              part="remove-button"
              class="tag__remove-button"
              aria-label=${`Remove ${this._defaultSlotText}`}
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

export type HxTag = HelixTag;

/** @deprecated Use {@link HxTag} instead. The `Wc` prefix was a legacy alias. */
export type WcTag = HelixTag;

declare global {
  interface HTMLElementTagNameMap {
    'hx-tag': HelixTag;
  }
}
