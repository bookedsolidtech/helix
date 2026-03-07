import { LitElement } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
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
 * @csspart base - The inner element (tag determined by the `as` property).
 *
 * @cssprop [--hx-text-font-size] - Font size (set per variant).
 * @cssprop [--hx-text-font-weight] - Font weight (overridden by weight prop).
 * @cssprop [--hx-text-line-height] - Line height (set per variant).
 * @cssprop [--hx-text-letter-spacing] - Letter spacing (set per variant).
 * @cssprop [--hx-text-color] - Text color (set per color prop).
 *
 * @example
 * <!-- Drupal/Twig usage (CDN):
 *   <hx-text variant="body" color="default">Patient name here</hx-text>
 *   <hx-text variant="label" weight="semibold">Date of Birth</hx-text>
 *   <hx-text variant="caption" color="subtle">Last reviewed on 2026-03-05</hx-text>
 *   <!-- Truncate (boolean attr — omit to disable, include to enable): -->
 *   <hx-text truncate>Long patient note that gets clipped</hx-text>
 *   <!-- Multi-line clamp (numeric attr): -->
 *   <hx-text lines="3">Paragraph of clinical notes...</hx-text>
 *   <!-- Semantic element override: -->
 *   <hx-text as="p" variant="body">Paragraph-level content.</hx-text>
 *   <hx-text as="strong" variant="label">Bold label</hx-text>
 * -->
 */
@customElement('hx-text')
export class HelixText extends LitElement {
  static override styles = [tokenStyles, helixTextStyles];

  /**
   * Typography variant controlling font size, line height, and letter spacing.
   *
   * Note: The public variant set (body / body-sm / body-lg / label / label-sm / caption / code /
   * overline) intentionally extends the original audit spec (body / lead / small / caption /
   * overline). `lead` and `small` were replaced with the more granular `body-lg`, `body-sm`,
   * `label`, `label-sm`, and `code` variants to better serve healthcare UI density requirements.
   * There are no `lead` or `small` variants — consumers must use `body-lg` and `body-sm`
   * respectively.
   *
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

  /**
   * The HTML element to render as the inner base element.
   * Use to produce semantically appropriate markup (e.g., `p`, `strong`, `em`).
   * Defaults to `span` for inline usage.
   *
   * In Drupal Twig: `<hx-text as="p" variant="body">...</hx-text>`
   *
   * @attr as
   */
  @property({ type: String, reflect: true })
  as: 'span' | 'p' | 'strong' | 'em' | 'div' = 'span';

  /** Validates `as` against the allowed element list to prevent injection. */
  private get _safeTag(): string {
    const allowed = new Set(['span', 'p', 'strong', 'em', 'div']);
    return allowed.has(this.as) ? this.as : 'span';
  }

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

    const tag = unsafeStatic(this._safeTag);

    return staticHtml`
      <${tag}
        part="base"
        class=${classMap(classes)}
        style=${styleMap(inlineStyles)}
        title=${ifDefined(titleText || undefined)}
      >
        <slot></slot>
      </${tag}>
    `;
  }
}

/** @deprecated Use `HelixText` directly. Kept for backward compatibility. */
export type WcText = HelixText;

declare global {
  interface HTMLElementTagNameMap {
    'hx-text': HelixText;
  }
}
