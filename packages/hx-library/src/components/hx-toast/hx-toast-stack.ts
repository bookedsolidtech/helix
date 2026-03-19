import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
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
 */
@customElement('hx-toast-stack')
export class HelixToastStack extends LitElement {
  static override styles = [tokenStyles, helixToastStackStyles];

  /**
   * Corner of the viewport where toasts appear.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: ToastStackPlacement = 'bottom-end';

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
