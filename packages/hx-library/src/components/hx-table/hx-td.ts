import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * Semantic table data cell. Must be a child of `hx-tr`.
 *
 * @summary Table data cell (`<td>`) for use inside `hx-tr`.
 *
 * @tag hx-td
 *
 * @slot - Default slot for cell content.
 *
 * @csspart cell - The `<td>` element.
 *
 * @cssprop [--hx-table-cell-color=var(--hx-color-neutral-900, #0f172a)] - Cell text color.
 */
@customElement('hx-td')
export class HelixTableCell extends LitElement {
  static override styles = [
    css`
      :host {
        display: contents;
      }

      td {
        padding: var(--_hx-table-cell-padding, var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem));
        text-align: left;
        color: var(--hx-table-cell-color, var(--hx-color-neutral-900, #0f172a));
        border-bottom: var(--hx-border-width-thin, 1px) solid
          var(--hx-table-border-color, var(--hx-color-neutral-200, #e2e8f0));
        vertical-align: middle;
      }

      :host([align='center']) td {
        text-align: center;
      }

      :host([align='right']) td {
        text-align: right;
      }

      td:focus-visible {
        outline: var(--hx-focus-ring-width, 2px) solid
          var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
        outline-offset: var(--hx-focus-ring-offset, -2px);
        border-radius: var(--hx-border-radius-sm, 2px);
      }

      /* ─── Mobile card layout ─── */

      @media (max-width: 768px) {
        :host {
          display: block;
        }

        td {
          display: block;
          text-align: right;
          padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
          border-bottom: none;
          position: relative;
        }

        td::before {
          content: attr(data-label);
          font-weight: var(--hx-font-weight-semibold, 600);
          float: left;
          color: var(--hx-table-header-color, var(--hx-color-neutral-700, #334155));
        }
      }
    `,
  ];

  /**
   * Horizontal alignment for cell content.
   * @attr align
   */
  @property({ type: String, reflect: true })
  align: 'left' | 'center' | 'right' = 'left';

  /**
   * Column label for mobile card layout. Forwarded as `data-label` to the
   * inner `<td>` so the CSS `attr(data-label)` pseudo-element resolves.
   * @attr data-label
   */
  @property({ type: String, attribute: 'data-label' })
  dataLabel: string | undefined;

  /**
   * Number of columns this cell spans.
   * @attr colspan
   */
  @property({ type: Number })
  colspan = 0;

  /**
   * Number of rows this cell spans.
   * @attr rowspan
   */
  @property({ type: Number })
  rowspan = 0;

  override render() {
    return html`
      <td
        part="cell"
        role="cell"
        data-label=${ifDefined(this.dataLabel)}
        colspan=${ifDefined(this.colspan > 0 ? this.colspan : undefined)}
        rowspan=${ifDefined(this.rowspan > 0 ? this.rowspan : undefined)}
      >
        <slot></slot>
      </td>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-td': HelixTableCell;
  }
}
