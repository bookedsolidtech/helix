import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { css } from 'lit';
import { tokenStyles } from '@helix/tokens/lit';

const helixMenuDividerStyles = css`
  :host {
    display: block;
  }

  .menu-divider {
    height: var(--hx-border-width-thin, 1px);
    background-color: var(--hx-menu-divider-color, var(--hx-color-neutral-200, #e2e8f0));
    margin: var(--hx-space-1, 0.25rem) calc(-1 * var(--hx-space-1, 0.25rem));
  }
`;

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
