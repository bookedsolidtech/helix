import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@wc-2026/tokens/lit';
import { wcContainerStyles } from './wc-container.styles.js';

/**
 * A layout container that constrains content width and provides
 * consistent vertical spacing and horizontal gutters.
 *
 * Uses a two-layer model: the outer host spans full width (background,
 * vertical padding), while the inner wrapper constrains max-width,
 * centers content, and applies horizontal gutters.
 *
 * @summary Layout primitive for constraining content width with consistent spacing.
 *
 * @tag wc-container
 *
 * @slot - Default slot for container content.
 *
 * @csspart inner - The inner wrapper that constrains max-width and applies gutters.
 *
 * @cssprop [--wc-container-bg=transparent] - Background color on the outer wrapper.
 * @cssprop [--wc-container-gutter=var(--wc-space-6)] - Horizontal padding on the inner box.
 * @cssprop [--wc-container-max-width] - Override the max-width set by the width property.
 * @cssprop [--wc-container-content=72rem] - Max-width for the content width preset.
 * @cssprop [--wc-container-sm=640px] - Max-width for the sm width preset.
 * @cssprop [--wc-container-md=768px] - Max-width for the md width preset.
 * @cssprop [--wc-container-lg=1024px] - Max-width for the lg width preset.
 * @cssprop [--wc-container-xl=1280px] - Max-width for the xl width preset.
 */
@customElement('wc-container')
export class WcContainer extends LitElement {
  static override styles = [tokenStyles, wcContainerStyles];

  /**
   * Controls the max-width of the inner content wrapper.
   * @attr width
   */
  @property({ type: String, reflect: true })
  width: 'full' | 'content' | 'narrow' | 'sm' | 'md' | 'lg' | 'xl' = 'content';

  /**
   * Vertical padding applied to the outer wrapper.
   * @attr padding
   */
  @property({ type: String, reflect: true })
  padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'none';

  // ─── Render ───

  override render() {
    const classes = {
      container__inner: true,
      [`container__inner--${this.width}`]: true,
    };

    return html`
      <div part="inner" class=${classMap(classes)}>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wc-container': WcContainer;
  }
}
