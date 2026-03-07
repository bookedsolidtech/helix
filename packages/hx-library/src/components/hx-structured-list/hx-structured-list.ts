import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import {
  helixStructuredListStyles,
  helixStructuredListRowStyles,
} from './hx-structured-list.styles.js';

/**
 * Container for structured key-value data display. Renders as a description
 * list for accessible term/definition semantics. Use `hx-structured-list-row`
 * as direct children.
 *
 * @summary Key-value data display container for detail and summary views.
 *
 * @tag hx-structured-list
 *
 * @slot - One or more `hx-structured-list-row` elements.
 *
 * @csspart base - The root list element.
 *
 * @cssprop [--hx-structured-list-border-color=var(--hx-color-neutral-200)] - Border color when bordered.
 * @cssprop [--hx-structured-list-border-width=var(--hx-border-width-thin)] - Border width when bordered.
 * @cssprop [--hx-structured-list-stripe-bg=var(--hx-color-neutral-50)] - Stripe background color.
 * @cssprop [--hx-structured-list-padding-block=var(--hx-space-4)] - Row block padding.
 * @cssprop [--hx-structured-list-padding-inline=var(--hx-space-4)] - Row inline padding.
 * @cssprop [--hx-structured-list-condensed-padding-block=var(--hx-space-2)] - Row block padding (condensed).
 * @cssprop [--hx-structured-list-condensed-padding-inline=var(--hx-space-3)] - Row inline padding (condensed).
 */
@customElement('hx-structured-list')
export class HelixStructuredList extends LitElement {
  static override styles = [tokenStyles, helixStructuredListStyles];

  /**
   * Renders a border around the entire list.
   * @attr bordered
   */
  @property({ type: Boolean, reflect: true })
  bordered = false;

  /**
   * Reduces row padding for denser layouts.
   * @attr condensed
   */
  @property({ type: Boolean, reflect: true })
  condensed = false;

  /**
   * Alternates row background colors for easier scanning.
   * @attr striped
   */
  @property({ type: Boolean, reflect: true })
  striped = false;

  override render() {
    return html`
      <div part="base" class="list">
        <slot></slot>
      </div>
    `;
  }
}

/**
 * A single row within an `hx-structured-list`. Renders a label/value pair
 * with an optional actions area.
 *
 * @summary A label-value row for use inside `hx-structured-list`.
 *
 * @tag hx-structured-list-row
 *
 * @slot label - The term or key label (`<dt>` semantics).
 * @slot - The value or definition (`<dd>` semantics).
 * @slot actions - Optional action controls (edit button, etc.).
 *
 * @csspart base - The root row element.
 * @csspart label - The label (`dt`) cell.
 * @csspart value - The value (`dd`) cell.
 * @csspart actions - The actions cell.
 */
@customElement('hx-structured-list-row')
export class HelixStructuredListRow extends LitElement {
  static override styles = [tokenStyles, helixStructuredListRowStyles];

  override render() {
    return html`
      <div part="base" class="row">
        <div part="label" class="row__label" role="term">
          <slot name="label"></slot>
        </div>
        <div part="value" class="row__value" role="definition">
          <slot></slot>
          <div part="actions" class="row__actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-structured-list': HelixStructuredList;
    'hx-structured-list-row': HelixStructuredListRow;
  }
}
