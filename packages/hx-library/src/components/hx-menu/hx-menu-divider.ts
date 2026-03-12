import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixMenuDividerStyles } from './hx-menu-divider.styles.js';

/**
 * A visual separator for grouping items within an `hx-menu`.
 *
 * @summary Horizontal divider between menu sections.
 *
 * @tag hx-menu-divider
 *
 * @csspart base - The root separator element.
 *
 * @cssprop [--hx-menu-divider-color=var(--hx-color-neutral-200)] - Divider line color.
 */
@customElement('hx-menu-divider')
export class HelixMenuDivider extends LitElement {
  static override styles = [tokenStyles, helixMenuDividerStyles];

  override render() {
    return html`<div
      part="base"
      class="menu-divider"
      role="separator"
      aria-orientation="horizontal"
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-menu-divider': HelixMenuDivider;
  }
}
