import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTextStyles } from './hx-text.styles.js';

/**
 * A semantic typography wrapper that applies consistent text styles using design tokens.
 *
 * @summary Presentational text wrapper for consistent typography across variants, weights, and colors.
 *
 * @tag hx-text
 *
 * @slot - Default slot for text content.
 *
 * @csspart base - The inner span element.
 *
 * @cssprop [--hx-text-font-size] - Font size (set per variant).
 * @cssprop [--hx-text-font-weight] - Font weight (overridden by weight prop).
 * @cssprop [--hx-text-line-height] - Line height (set per variant).
 * @cssprop [--hx-text-letter-spacing] - Letter spacing (set per variant).
 * @cssprop [--hx-text-color] - Text color (set per color prop).
 */
@customElement('hx-text')
export class HelixText extends LitElement {
  static override styles = [tokenStyles, helixTextStyles];

  /**
   * Typography variant controlling font size, line height, and letter spacing.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'body' | 'body-sm' | 'body-lg' | 'label' | 'label-sm' | 'caption' | 'code' | 'overline' =
    'body';

  /**
   * Font weight override. When unset, the variant's default weight is used.
   * @attr weight
   */
  @property({ type: String, reflect: true })
  weight: 'regular' | 'medium' | 'semibold' | 'bold' | undefined = undefined;

  /**
   * Semantic color intent.
   * @attr color
   */
  @property({ type: String, reflect: true })
  color: 'default' | 'subtle' | 'disabled' | 'inverse' | 'danger' | 'success' | 'warning' =
    'default';

  /**
   * When true, clips text to a single line with an ellipsis overflow.
   * @attr truncate
   */
  @property({ type: Boolean, reflect: true })
  truncate = false;

  /**
   * Maximum number of lines to display before clamping with ellipsis.
   * When set, overrides `truncate`. Set to 0 to disable.
   * @attr lines
   */
  @property({ type: Number, reflect: true })
  lines = 0;

  override render() {
    const effectiveLines = Math.max(0, this.lines);
    const isTruncated = this.truncate && effectiveLines === 0;
    const isClamped = effectiveLines > 0;
    const classes = {
      text: true,
      [`text--${this.variant}`]: true,
      [`text--color-${this.color}`]: true,
      [`text--weight-${this.weight}`]: this.weight !== undefined,
      'text--truncate': isTruncated,
      'text--clamp': isClamped,
    };

    const inlineStyles = isClamped ? { '-webkit-line-clamp': String(effectiveLines) } : {};

    const titleText = isTruncated || isClamped ? this.textContent?.trim() : undefined;

    return html`
      <span
        part="base"
        class=${classMap(classes)}
        style=${styleMap(inlineStyles)}
        title=${ifDefined(titleText || undefined)}
      >
        <slot></slot>
      </span>
    `;
  }
}

export type WcText = HelixText;

declare global {
  interface HTMLElementTagNameMap {
    'hx-text': HelixText;
  }
}
