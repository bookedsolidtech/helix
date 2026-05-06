import { html } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement } from '../../base/index.js';
import { helixToastStackStyles } from './hx-toast.styles.js';

export type ToastStackPlacement =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

/**
 * A fixed-position container that stacks `hx-toast` elements at the specified
 * corner of the viewport. Enforces a maximum visible toast count via `stack-limit`.
 *
 * @summary Toast stack container managing position and count limits.
 *
 * @tag hx-toast-stack
 *
 * @slot - Accepts `hx-toast` elements.
 *
 * @csspart base - The inner stack container div.
 *
 * @cssprop [--hx-z-index-toast=9000] - Z-index for the fixed stack.
 *
 * ─── ARIA scope (group-6 §3.2 / §5.9) ─────────────────────────────────────
 *
 * `hx-toast-stack` deliberately has NO `role`, `aria-live`, `aria-atomic`,
 * or `aria-relevant` on its host or inner container. Each child `hx-toast`
 * is its own live region (role=alert/status via ElementInternals). Wrapping
 * those toasts in a second live region (e.g. `role="log"` on the stack)
 * would create nested live regions, which causes older NVDA/JAWS to
 * announce every toast TWICE — once for the toast's own role, once for the
 * surrounding log region.
 *
 * The stack is purely a positional/z-index container; it is invisible to
 * the AT tree. Do NOT add a container role unless this entire architecture
 * is rewritten so individual toasts no longer carry their own roles.
 */
@customElement('hx-toast-stack')
export class HelixToastStack extends HelixElement {
  static override styles = [helixToastStackStyles];

  /**
   * Corner of the viewport where toasts appear.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement:
    | 'top-start'
    | 'top-center'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-center'
    | 'bottom-end' = 'bottom-end';

  /**
   * Maximum number of simultaneously visible toasts. 0 = unlimited.
   * @attr stack-limit
   */
  @property({ type: Number, attribute: 'stack-limit' })
  stackLimit = 3;

  override render() {
    return html`
      <div
        part="base"
        class=${classMap({
          'toast-stack': true,
          [`toast-stack--${this.placement}`]: true,
        })}
      >
        <slot></slot>
      </div>
    `;
  }
}

// ─── Declarative Global Types ───

declare global {
  interface HTMLElementTagNameMap {
    'hx-toast-stack': HelixToastStack;
  }
}
