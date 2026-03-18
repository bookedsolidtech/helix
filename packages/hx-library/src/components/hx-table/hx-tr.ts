import { LitElement, html, nothing, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Semantic table row. Must be a child of `hx-thead`, `hx-tbody`, or `hx-tfoot`.
 * Contains `hx-th` or `hx-td` cells.
 *
 * @summary Table row (`<tr>`) for use inside `hx-thead`, `hx-tbody`, or `hx-tfoot`.
 *
 * @tag hx-tr
 *
 * @slot - Default slot for `hx-th` and `hx-td` elements.
 *
 * @csspart row - The `<tr>` element.
 */
@customElement('hx-tr')
export class HelixTableRow extends LitElement {
  static override styles = [
    css`
      :host {
        display: contents;
      }

      tr {
        background-color: var(--_hx-table-row-bg, transparent);
        transition: background-color var(--hx-transition-fast, 150ms ease);
      }

      tr:hover {
        background-color: var(--_hx-table-row-hover-bg, var(--hx-table-row-hover-bg, transparent));
      }

      :host([selected]) tr {
        background-color: var(--hx-table-row-selected-bg, var(--hx-color-primary-50, #eff6ff));
      }

      :host([disabled]) tr {
        opacity: 0.5;
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        tr {
          transition: none;
        }
      }
    `,
  ];

  /**
   * When true, marks the row as selected and applies selected styling.
   * @attr selected
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * When true, the row is visually disabled and non-interactive.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  override render() {
    return html`
      <tr
        part="row"
        role="row"
        aria-selected=${this.selected ? 'true' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
      >
        <slot></slot>
      </tr>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tr': HelixTableRow;
  }
}
