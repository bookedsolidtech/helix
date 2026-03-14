import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixContainerStyles } from './hx-container.styles.js';

/**
 * A layout container that constrains content width and provides
 * consistent vertical spacing and horizontal gutters.
 *
 * Uses a two-layer model: the outer host spans full width (background,
 * vertical padding), while the inner wrapper constrains max-width,
 * centers content, and applies horizontal gutters.
 *
 * ## Accessibility
 *
 * `hx-container` is a purely visual layout primitive with no semantic meaning.
 * It carries no ARIA role and is intentionally transparent to assistive
 * technologies. Screen readers announce the container's children directly,
 * not the container itself.
 *
 * The inner wrapper always centers content horizontally (via `margin: auto`).
 * This is by design for page-layout use cases. If you need non-centered
 * alignment at a specific breakpoint, override `margin-left` and
 * `margin-right` on `::part(inner)` from your stylesheet.
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
 * @cssprop [--hx-container-narrow=48rem] - Max-width for the narrow width preset.
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
   * @example
   * // Width presets and their default max-width values:
   * // full    → no max-width constraint
   * // content → 72rem (1152px)
   * // narrow  → 48rem (768px) — override with --hx-container-narrow
   * // sm      → 640px — override with --hx-container-sm
   * // md      → 768px — override with --hx-container-md
   * // lg      → 1024px — override with --hx-container-lg
   * // xl      → 1280px — override with --hx-container-xl
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

/** @deprecated Use `HelixContainer` directly. Alias kept for backward compatibility. */
export type WcContainer = HelixContainer;

declare global {
  interface HTMLElementTagNameMap {
    'hx-container': HelixContainer;
  }
}
