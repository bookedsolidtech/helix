import { html } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { helixMenuDividerStyles } from './hx-menu-divider.styles.js';
import { supportsIdrefElementReferences } from '../../utils/aria-idref.js';

/**
 * A visual separator for grouping items within an `hx-menu`.
 *
 * Group 5b host-canonical: `role="separator"` lives on the **host** via
 * `_internals.role` so the parent `<hx-menu>` (`role="menu"`) sees the
 * separator as a direct child. `aria-orientation` is mirrored onto the host
 * via `internals.ariaOrientation`. The inner div is presentational on the
 * modern path and stripped of its role; the legacy fallback keeps the
 * inner role for engines without ElementInternals IDL accessors.
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
export class HelixMenuDivider extends HelixElement {
  static override styles = [helixMenuDividerStyles, forcedColorsInteractive];

  /** @internal */
  private _supportsIdrefRefs = true;

  override connectedCallback(): void {
    super.connectedCallback();
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    const internals = this._internals;
    internals.role = 'separator';
    internals.ariaOrientation = 'horizontal';
  }

  override render() {
    if (this._supportsIdrefRefs) {
      // Modern path: role lives on host via internals; inner div is
      // presentational.
      return html`<div part="base" class="menu-divider"></div>`;
    }
    // Legacy fallback: keep role/aria-orientation on the inner div for AT
    // without IDL accessors on ElementInternals.
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
