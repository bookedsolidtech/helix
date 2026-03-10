import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTabPanelStyles } from './hx-tab-panel.styles.js';

/**
 * A content panel associated with an `<hx-tab>`, managed by a parent `<hx-tabs>`.
 *
 * @summary Tab content panel shown when its corresponding tab is selected.
 *
 * @tag hx-tab-panel
 *
 * @slot - Default slot for panel content.
 *
 * @csspart panel - The panel content wrapper.
 *
 * @cssprop [--hx-tabs-panel-padding=var(--hx-space-4, 1rem)] - Panel inner padding.
 * @cssprop [--hx-tabs-panel-color=var(--hx-color-neutral-700, #343a40)] - Panel text color.
 * @cssprop [--hx-tabs-focus-ring-color=var(--hx-focus-ring-color, #2563eb)] - Focus ring color.
 */
@customElement('hx-tab-panel')
export class HelixTabPanel extends LitElement {
  static override styles = [tokenStyles, helixTabPanelStyles];

  // ─── Properties ───

  /**
   * The name that corresponds to the `panel` attribute on the associated `<hx-tab>`.
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'tabpanel');
    // tabindex is managed dynamically by the parent hx-tabs component:
    // active panels get tabindex="0", hidden panels get tabindex="-1"
  }

  // ─── Render ───

  override render() {
    return html`
      <div part="panel" class="panel">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tab-panel': HelixTabPanel;
  }
}
