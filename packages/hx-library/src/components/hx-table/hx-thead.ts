import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { helixTableSectionBaseStyles } from './hx-table.styles.js';

/**
 * Semantic table head section. Must be a direct child of `hx-table`.
 * Contains `hx-tr` rows with `hx-th` header cells.
 *
 * @summary Table head section (`<thead>`) for use inside `hx-table`.
 *
 * @tag hx-thead
 *
 * @slot - Default slot for `hx-tr` elements.
 *
 * @csspart thead - The `<thead>` element.
 */
@customElement('hx-thead')
export class HelixTableHead extends LitElement {
  static override styles = [helixTableSectionBaseStyles];

  override render() {
    return html`<thead part="thead" role="rowgroup">
      <slot></slot>
    </thead>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-thead': HelixTableHead;
  }
}
