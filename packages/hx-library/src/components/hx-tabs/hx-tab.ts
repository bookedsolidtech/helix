import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixTabStyles } from './hx-tab.styles.js';

/**
 * An individual tab button, designed to be used inside an `<hx-tabs>` container.
 * Must be placed in the `tab` named slot of `<hx-tabs>`.
 *
 * @summary Presentational tab button that activates a corresponding panel.
 *
 * @tag hx-tab
 *
 * @slot - Default slot for the tab label text or content.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @csspart tab - The underlying button element.
 * @csspart prefix - The container for prefix slot content (e.g. icons).
 * @csspart suffix - The container for suffix slot content (e.g. badges).
 *
 * @cssprop [--hx-tabs-tab-color=var(--hx-color-neutral-600, #495057)] - Inactive tab text color.
 * @cssprop [--hx-tabs-tab-active-color=var(--hx-color-primary-600, #1d4ed8)] - Active tab text color.
 * @cssprop [--hx-tabs-tab-hover-color=var(--hx-color-neutral-800, #212529)] - Tab hover text color.
 * @cssprop [--hx-tabs-tab-hover-bg=var(--hx-color-neutral-50, #f8f9fa)] - Tab hover background.
 * @cssprop [--hx-tabs-tab-font-size=var(--hx-font-size-md, 1rem)] - Tab font size.
 * @cssprop [--hx-tabs-tab-font-weight=var(--hx-font-weight-medium, 500)] - Tab font weight.
 * @cssprop [--hx-tabs-tab-active-font-weight=var(--hx-font-weight-semibold, 600)] - Active tab font weight.
 * @cssprop [--hx-tabs-tab-padding-x=var(--hx-space-4, 1rem)] - Horizontal tab padding.
 * @cssprop [--hx-tabs-tab-padding-y=var(--hx-space-2, 0.5rem)] - Vertical tab padding.
 * @cssprop [--hx-tabs-indicator-color=var(--hx-color-primary-500, #2563eb)] - Active indicator color.
 * @cssprop [--hx-tabs-indicator-size=2px] - Active indicator thickness.
 * @cssprop [--hx-tabs-focus-ring-color=var(--hx-focus-ring-color, #2563eb)] - Focus ring color.
 */
@customElement('hx-tab')
export class HelixTab extends LitElement {
  static override styles = [tokenStyles, helixTabStyles];

  // ─── Properties ───

  /**
   * The name of the `<hx-tab-panel>` this tab controls. Must match the `name`
   * attribute on the corresponding `<hx-tab-panel>`.
   * @attr panel
   */
  @property({ type: String, reflect: true })
  panel = '';

  /**
   * Whether this tab is currently selected. Managed by the parent `<hx-tabs>`.
   * @attr selected
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * Whether this tab is disabled. Prevents selection and keyboard navigation.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The id of the panel this tab controls. Set by the parent `<hx-tabs>` to establish the
   * aria-controls relationship on the inner button element (which carries role="tab").
   * @internal
   */
  @property({ type: String, attribute: false })
  controls = '';

  // ─── Slot Visibility ───

  /** @internal */
  @state() private _hasPrefixSlot = false;
  /** @internal */
  @state() private _hasSuffixSlot = false;

  // ─── Event Handling ───

  private _handleClick(): void {
    if (this.disabled) {
      return;
    }
    /**
     * Internal event dispatched to signal tab selection to the parent container.
     * Not part of the public API.
     * @internal
     */
    this.dispatchEvent(
      new CustomEvent('hx-tab-select', {
        bubbles: true,
        composed: true,
        detail: { panel: this.panel },
      }),
    );
  }

  private _handlePrefixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasPrefixSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleSuffixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasSuffixSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Render ───

  override render() {
    return html`
      <button
        part="tab"
        class="tab"
        role="tab"
        aria-selected=${this.selected ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-controls=${this.controls || nothing}
        tabindex=${this.selected ? '0' : '-1'}
        @click=${this._handleClick}
      >
        <span part="prefix" class="tab__prefix" ?hidden=${!this._hasPrefixSlot}>
          <slot name="prefix" @slotchange=${this._handlePrefixSlotChange}></slot>
        </span>
        <slot></slot>
        <span part="suffix" class="tab__suffix" ?hidden=${!this._hasSuffixSlot}>
          <slot name="suffix" @slotchange=${this._handleSuffixSlotChange}></slot>
        </span>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tab': HelixTab;
  }
}
