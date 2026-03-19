import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * Semantic table body section. Must be a direct child of `hx-table`.
 * Contains `hx-tr` rows with `hx-td` data cells.
 *
 * @summary Table body section (`<tbody>`) for use inside `hx-table`.
 *
 * @tag hx-tbody
 *
 * @slot - Default slot for `hx-tr` elements.
 *
 * @csspart tbody - The `<tbody>` element.
 */
@customElement('hx-tbody')
export class HelixTableBody extends LitElement {
  static override styles = [
    css`
      :host {
        display: contents;
      }

      /*
       * Striped rows: only applies when the parent hx-table sets
       * --_hx-table-row-stripe-bg (via variant="striped"). Falls back
       * to transparent so non-striped variants are unaffected.
       */
      ::slotted(hx-tr:nth-child(even)) {
        --_hx-table-row-bg: var(--_hx-table-row-stripe-bg, transparent);
      }
    `,
  ];

  override render() {
    return html`<tbody part="tbody" role="rowgroup">
      <slot></slot>
    </tbody>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tbody': HelixTableBody;
  }
}
