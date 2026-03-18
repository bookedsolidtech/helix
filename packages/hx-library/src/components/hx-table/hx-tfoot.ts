import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { helixTableSectionBaseStyles } from './hx-table.styles.js';

/**
 * Semantic table foot section. Must be a direct child of `hx-table`.
 * Typically contains summary or totals rows.
 *
 * @summary Table foot section (`<tfoot>`) for use inside `hx-table`.
 *
 * @tag hx-tfoot
 *
 * @slot - Default slot for `hx-tr` elements.
 *
 * @csspart tfoot - The `<tfoot>` element.
 */
@customElement('hx-tfoot')
export class HelixTableFoot extends LitElement {
  static override styles = [helixTableSectionBaseStyles];

  override render() {
    return html`<tfoot part="tfoot" role="rowgroup">
      <slot></slot>
    </tfoot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tfoot': HelixTableFoot;
  }
}
