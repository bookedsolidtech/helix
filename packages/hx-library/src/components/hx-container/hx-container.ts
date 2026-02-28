import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixContainerStyles } from './hx-container.styles.js';

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
 * @tag hx-container
 *
 * @slot - Default slot for container content.
 *
 * @csspart inner - The inner wrapper that constrains max-width and applies gutters.
 *
 * @cssprop [--hx-container-bg=transparent] - Background color on the outer wrapper.
 * @cssprop [--hx-container-gutter=var(--hx-space-6)] - Horizontal padding on the inner box.
 * @cssprop [--hx-container-max-width] - Override the max-width set by the width property.
 * @cssprop [--hx-container-content=72rem] - Max-width for the content width preset.
 * @cssprop [--hx-container-sm=640px] - Max-width for the sm width preset.
 * @cssprop [--hx-container-md=768px] - Max-width for the md width preset.
 * @cssprop [--hx-container-lg=1024px] - Max-width for the lg width preset.
 * @cssprop [--hx-container-xl=1280px] - Max-width for the xl width preset.
 */
@customElement('hx-container')
export class HelixContainer extends LitElement {
  static override styles = [tokenStyles, helixContainerStyles];

  /**
   * Controls the max-width of the inner content wrapper.
   * @attr width
   * @default 'content'
   */
  @property({ type: String, reflect: true })
  width: 'full' | 'content' | 'narrow' | 'sm' | 'md' | 'lg' | 'xl' = 'content';

  /**
   * Vertical padding applied to the outer wrapper.
   * @attr padding
   * @default 'none'
   */
  @property({ type: String, reflect: true })
  padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'none';

  /**
   * Optional accessible label for the container region (maps to aria-label).
   * Use when the container represents a distinct landmark or region that
   * requires identification for screen reader users.
   * @attr label
   * @default ''
   */
  @property({ type: String, reflect: true })
  label: string = '';

  // ─── Extension API ───

  /**
   * Override to customize the CSS classes applied to the inner wrapper element.
   * Called during render. Merge with super's result to preserve base styling.
   * @protected
   * @since 1.0.0
   */
  protected getContainerClasses(): Record<string, boolean> {
    return {
      container__inner: true,
      [`container__inner--${this.width}`]: true,
    };
  }

  /**
   * Override to customize the content rendered inside the container.
   * @protected
   * @since 1.0.0
   */
  protected renderContent(): unknown {
    return html`<slot></slot>`;
  }

  // ─── Render ───

  override render(): TemplateResult {
    return html`
      <div
        part="inner"
        class=${classMap(this.getContainerClasses())}
        aria-label=${this.label || nothing}
      >
        ${this.renderContent()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-container': HelixContainer;
  }
}
