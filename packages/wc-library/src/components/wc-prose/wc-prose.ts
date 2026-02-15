import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';
import { wcProseScopedCss } from './wc-prose.styles.js';

/**
 * A Light DOM prose container that applies typographic styles to rich text
 * content such as CKEditor output, Markdown-rendered HTML, or any structured
 * body copy.
 *
 * Renders in the Light DOM (no Shadow DOM) so that global and scoped styles
 * can target child elements directly. Uses the AdoptedStylesheetsController
 * to inject scoped prose CSS into the document without duplication.
 *
 * @summary Light DOM typography wrapper for rich text and CMS content.
 *
 * @tag wc-prose
 *
 * @slot - Default slot for rich text content (headings, paragraphs, lists, tables, etc.).
 *
 * @cssprop [--wc-prose-max-width=720px] - Maximum content width.
 * @cssprop [--wc-prose-font-size=var(--wc-font-size-base)] - Base font size.
 * @cssprop [--wc-prose-line-height=var(--wc-line-height-relaxed)] - Base line height.
 * @cssprop [--wc-prose-color=var(--wc-color-text)] - Body text color.
 * @cssprop [--wc-prose-heading-color=var(--wc-color-text-strong)] - Heading color.
 * @cssprop [--wc-prose-link-color=var(--wc-color-primary)] - Link color.
 */
@customElement('wc-prose')
export class WcProse extends LitElement {
  // ─── Light DOM ───

  override createRenderRoot(): this {
    return this;
  }

  // ─── Adopted Stylesheets ───

  private _styles = new AdoptedStylesheetsController(this, wcProseScopedCss, document);

  // ─── Properties ───

  /**
   * Typography scale for the prose content.
   * @attr size
   */
  @property({ type: String, reflect: true })
  size: 'sm' | 'base' | 'lg' = 'base';

  /**
   * Maximum content width. When set, overrides the --wc-prose-max-width token.
   * Accepts any valid CSS width value (e.g., '640px', '80ch', '100%').
   * @attr max-width
   */
  @property({ type: String, reflect: true, attribute: 'max-width' })
  maxWidth = '';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.display = 'block';
    this._applyMaxWidth();
    this._applySize();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('maxWidth')) {
      this._applyMaxWidth();
    }
    if (changedProperties.has('size')) {
      this._applySize();
    }
  }

  // ─── Private ───

  private _applyMaxWidth(): void {
    if (this.maxWidth) {
      this.style.maxWidth = this.maxWidth;
    } else {
      this.style.maxWidth = '';
    }
  }

  private _applySize(): void {
    const sizeMap: Record<string, string> = {
      sm: 'var(--wc-font-size-sm, 0.875rem)',
      base: '',
      lg: 'var(--wc-font-size-lg, 1.125rem)',
    };

    const fontSize = sizeMap[this.size];
    if (fontSize) {
      this.style.setProperty('--wc-prose-font-size', fontSize);
    } else {
      this.style.removeProperty('--wc-prose-font-size');
    }
  }

  // ─── Render ───

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wc-prose': WcProse;
  }
}
