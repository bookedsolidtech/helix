import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';
import { helixProseScopedCss } from './hx-prose.styles.js';

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
 * @tag hx-prose
 *
 * @slot - Default slot for rich text content (headings, paragraphs, lists, tables, etc.).
 *
 * @cssprop [--hx-prose-max-width=720px] - Maximum content width.
 * @cssprop [--hx-prose-font-size=var(--hx-font-size-base)] - Base font size.
 * @cssprop [--hx-prose-line-height=var(--hx-line-height-relaxed)] - Base line height.
 * @cssprop [--hx-prose-color=var(--hx-color-text)] - Body text color.
 * @cssprop [--hx-prose-heading-color=var(--hx-color-text-strong)] - Heading color.
 * @cssprop [--hx-prose-link-color=var(--hx-color-primary)] - Link color.
 */
@customElement('hx-prose')
export class HelixProse extends LitElement {
  // ─── Light DOM ───

  override createRenderRoot(): this {
    return this;
  }

  // ─── Adopted Stylesheets ───

  /** Injects scoped prose CSS into the document via adopted stylesheets. */
  private _styles = new AdoptedStylesheetsController(this, helixProseScopedCss, document);

  // ─── Properties ───

  /**
   * Typography scale for the prose content.
   * @attr size
   */
  @property({ type: String, reflect: true })
  size: 'sm' | 'base' | 'lg' = 'base';

  /**
   * Maximum content width. When set, overrides the --hx-prose-max-width token.
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
      sm: 'var(--hx-font-size-sm, 0.875rem)',
      base: '',
      lg: 'var(--hx-font-size-lg, 1.125rem)',
    };

    const fontSize = sizeMap[this.size];
    if (fontSize) {
      this.style.setProperty('--hx-prose-font-size', fontSize);
    } else {
      this.style.removeProperty('--hx-prose-font-size');
    }
  }

  // ─── Render ───

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-prose': HelixProse;
  }
}
