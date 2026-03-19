import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixTableStyles } from './hx-table.styles.js';
import { devWarn } from '../../utils/dev-warn.js';

/**
 * A semantic table container with variant styling and accessibility support.
 * Compose with `hx-thead`, `hx-tbody`, `hx-tfoot`, `hx-tr`, `hx-th`, and `hx-td`.
 *
 * @summary Semantic HTML table with variant styling, sticky header, and responsive layout.
 *
 * @tag hx-table
 *
 * @slot - Default slot for `hx-thead`, `hx-tbody`, and `hx-tfoot` sub-components.
 * @slot caption - Custom caption content rendered inside the `<caption>` element.
 *
 * @csspart table - The `<table>` element.
 * @csspart caption - The `<caption>` element.
 *
 * @cssprop [--hx-table-border-color=var(--hx-color-neutral-200, #e2e8f0)] - Cell border color.
 * @cssprop [--hx-table-header-bg=var(--hx-color-neutral-50, #f8fafc)] - Header row background.
 * @cssprop [--hx-table-header-color=var(--hx-color-neutral-700, #334155)] - Header text color.
 * @cssprop [--hx-table-cell-color=var(--hx-color-neutral-900, #0f172a)] - Cell text color.
 * @cssprop [--hx-table-row-hover-bg=var(--hx-color-neutral-50, #f8fafc)] - Row hover background.
 * @cssprop [--hx-table-stripe-bg=var(--hx-color-neutral-50, #f8fafc)] - Striped row background.
 */
@customElement('hx-table')
export class HelixTable extends LitElement {
  static override styles = [tokenStyles, helixTableStyles];

  // ─── Public Properties ───

  /**
   * Accessible name for the table (WCAG 4.1.2 requirement).
   * Exposed via `aria-label` on the `<table>` element.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Visible caption text. When set, renders a `<caption>` element.
   * Use the `caption` slot for richer caption content.
   * @attr caption
   */
  @property({ type: String })
  caption = '';

  /**
   * Visual variant that controls row styling.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'striped' | 'hover' | 'compact' = 'default';

  /**
   * When true, the header row stays fixed while the table body scrolls.
   * @attr sticky-header
   */
  @property({ type: Boolean, reflect: true, attribute: 'sticky-header' })
  stickyHeader = false;

  /**
   * When true, the table expands to fill 100% of its container width.
   * @attr full-width
   */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = true;

  // ─── Internal State ───

  @state() private _hasCaptionSlot = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._hasCaptionSlot = this.querySelector('[slot="caption"]') !== null;
  }

  override willUpdate(changed: PropertyValues<this>): void {
  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('label') && !this.label && changed.get('label') !== undefined) {
      devWarn(
        'hx-table',
        'No accessible name provided. Set the `label` attribute so screen readers can identify this table (WCAG 4.1.2).',
      );
    }
  }

  private _onCaptionSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasCaptionSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Render ───

  override render() {
    const hasCaption = this.caption || this._hasCaptionSlot;

    return html`
      <div class="table-wrapper">
        <!-- role="table" is required: sub-components use display:contents which can confuse assistive technology in Shadow DOM -->
        <table part="table" role="table" aria-label=${this.label || nothing}>
          ${hasCaption
            ? html`<caption part="caption">
                <slot name="caption" @slotchange=${this._onCaptionSlotChange}>${this.caption}</slot>
              </caption>`
            : nothing}
          <slot></slot>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-table': HelixTable;
  }
}
