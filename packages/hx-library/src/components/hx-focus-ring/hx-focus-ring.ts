import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixFocusRingStyles } from './hx-focus-ring.styles.js';

/**
 * A utility component that renders a consistent visible focus indicator around
 * a slotted element using CSS custom properties from the design token system.
 * Purely visual — no ARIA semantics. The slotted element manages its own ARIA.
 *
 * @summary Visual focus ring wrapper for consistent focus indication.
 *
 * @tag hx-focus-ring
 *
 * @slot - The focusable element being wrapped.
 *
 * @csspart base - The wrapper container element.
 * @csspart ring - The absolutely-positioned focus ring overlay.
 *
 * @cssprop [--hx-focus-ring-color=#2563eb] - Default ring color.
 * @cssprop [--hx-focus-ring-width=2px] - Default ring width.
 * @cssprop [--hx-focus-ring-offset=2px] - Default ring offset from content.
 */
@customElement('hx-focus-ring')
export class HelixFocusRing extends LitElement {
  static override styles = [tokenStyles, helixFocusRingStyles];

  /**
   * Whether the focus ring is visible.
   * @attr visible
   */
  @property({ type: Boolean, reflect: true })
  visible = false;

  /**
   * CSS color override for the ring. Falls back to `--hx-focus-ring-color`.
   * @attr color
   */
  @property({ type: String })
  color: string | undefined = undefined;

  /**
   * Ring width override. Falls back to `--hx-focus-ring-width`.
   * @attr width
   */
  @property({ type: String })
  width: string | undefined = undefined;

  /**
   * Ring offset override. Falls back to `--hx-focus-ring-offset`.
   * @attr offset
   */
  @property({ type: String })
  offset: string | undefined = undefined;

  /**
   * Shape of the focus ring.
   * @attr shape
   */
  @property({ type: String, reflect: true })
  shape: 'box' | 'circle' | 'pill' = 'box';

  override render() {
    const tokenOverrides: Record<string, string> = {};
    if (this.color) tokenOverrides['--_ring-color'] = this.color;
    if (this.width) tokenOverrides['--_ring-width'] = this.width;
    if (this.offset) tokenOverrides['--_ring-offset'] = this.offset;

    const hasOverrides = Object.keys(tokenOverrides).length > 0;

    return html`
      <div part="base" class="base" style=${hasOverrides ? styleMap(tokenOverrides) : ''}>
        <slot></slot>
        <div part="ring" class="ring ring--${this.shape}" aria-hidden="true"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-focus-ring': HelixFocusRing;
  }
}
