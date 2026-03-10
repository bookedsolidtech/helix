import { LitElement, html, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixCodeSnippetStyles } from './hx-code-snippet.styles.js';

/**
 * A styled code block with optional copy button and max-lines truncation.
 * Supports block (`<pre><code>`) and inline (`<code>`) rendering modes.
 * No external syntax highlighting dependency — use the `language` attribute
 * as a hint for consumers integrating their own highlighter via slotted content.
 *
 * @summary Styled code display component with copy-to-clipboard and expand/collapse.
 *
 * @tag hx-code-snippet
 *
 * @slot - Code content as plain text. Note: HTML markup in slot content will be
 *   stripped — only text content is extracted. Pre-highlighted HTML is not supported.
 *
 * @fires {CustomEvent<{text: string}>} hx-copy - Dispatched when the copy button is clicked.
 *
 * @csspart base - The outermost container (block: `<div>`, inline: `<code>`).
 * @csspart header - The header bar containing the copy button (block mode only).
 * @csspart code - The `<code>` element containing the content.
 * @csspart copy-button - The copy-to-clipboard button.
 * @csspart expand-button - The "Show more / Show less" button.
 *
 * @cssprop [--hx-code-snippet-bg=var(--hx-color-neutral-900,#0f172a)] - Background color.
 * @cssprop [--hx-code-snippet-color=var(--hx-color-neutral-100,#f1f5f9)] - Text color.
 * @cssprop [--hx-code-snippet-font-family=var(--hx-font-family-mono,monospace)] - Font family.
 * @cssprop [--hx-code-snippet-font-size=var(--hx-font-size-sm,0.875rem)] - Font size.
 * @cssprop [--hx-code-snippet-border-radius=var(--hx-border-radius-md,0.375rem)] - Border radius.
 * @cssprop [--hx-code-snippet-padding=var(--hx-space-4,1rem)] - Inner padding (block mode).
 */
@customElement('hx-code-snippet')
export class HelixCodeSnippet extends LitElement {
  static override styles = [tokenStyles, helixCodeSnippetStyles];

  // ─── Public Properties ───

  /**
   * Language hint for consumers to apply syntax highlighting.
   * Does not affect rendering directly; it is applied as a `language-*` class
   * on the `<code>` element so external highlighters can target it.
   * @attr language
   */
  @property({ type: String, reflect: true })
  language: string = '';

  /**
   * When true, renders as an inline `<code>` element instead of a `<pre><code>` block.
   * @attr inline
   */
  @property({ type: Boolean, reflect: true })
  inline: boolean = false;

  /**
   * When true, enables word-wrap in block mode.
   * @attr wrap
   */
  @property({ type: Boolean, reflect: true })
  wrap: boolean = false;

  /**
   * When true, shows a copy-to-clipboard button.
   * @attr copyable
   *
   * IMPORTANT: This is a standard boolean attribute. Setting `copyable="false"` in HTML
   * will NOT disable the copy button — the attribute presence alone signals `true`.
   * To disable programmatically, set `el.copyable = false` via JavaScript.
   * In Lit/HTML templates, use `?copyable=${false}` (Lit boolean binding) to remove the attribute.
   */
  @property({ type: Boolean, reflect: true })
  copyable: boolean = true;

  /**
   * Maximum number of lines to display before showing a "Show more" button.
   * Set to 0 (default) to disable truncation.
   * @attr max-lines
   */
  @property({ type: Number, attribute: 'max-lines', reflect: true })
  maxLines: number = 0;

  /**
   * When true, prepends line numbers to each displayed line in block mode.
   * Line numbers are rendered as `aria-hidden` spans so screen readers skip them.
   * @attr line-numbers
   */
  @property({ type: Boolean, attribute: 'line-numbers', reflect: true })
  lineNumbers: boolean = false;

  // ─── Internal State ───

  @state() private _copied: boolean = false;
  @state() private _expanded: boolean = false;
  @state() private _codeText: string = '';

  private _copyTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Lifecycle ───

  override firstUpdated(): void {
    // Prevent flash of empty <code> before slotchange fires by eagerly reading
    // text content from host children that are already present on first render.
    if (!this._codeText) {
      const text = this.textContent?.trim() ?? '';
      if (text) {
        this._codeText = text;
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._copyTimer !== null) {
      clearTimeout(this._copyTimer);
      this._copyTimer = null;
    }
  }

  // ─── Event Handlers ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement | null;
    if (!slot) return;
    const nodes = slot.assignedNodes({ flatten: true });
    this._codeText = nodes.map((n) => n.textContent ?? '').join('');
  }

  private _handleCopy(): void {
    const text = this._codeText;

    navigator.clipboard.writeText(text).catch(() => {
      // Clipboard API unavailable (non-HTTPS environments such as Drupal staging) — emit event only.
      // Note: navigator.clipboard requires a secure context (HTTPS or localhost).
      // On HTTP, the copy event still fires but the clipboard is not populated.
    });

    this.dispatchEvent(
      new CustomEvent('hx-copy', {
        bubbles: true,
        composed: true,
        detail: { text },
      }),
    );

    this._copied = true;
    if (this._copyTimer !== null) clearTimeout(this._copyTimer);
    this._copyTimer = setTimeout(() => {
      this._copied = false;
    }, 2000);
  }

  private _handleExpand(): void {
    this._expanded = !this._expanded;
  }

  // ─── Helpers ───

  private _getDisplayLines(): string[] {
    const lines = this._codeText.split('\n');
    if (!this.maxLines || this.maxLines <= 0 || this._expanded) {
      return lines;
    }
    if (lines.length <= this.maxLines) {
      return lines;
    }
    return lines.slice(0, this.maxLines);
  }

  private _isTruncated(): boolean {
    if (!this.maxLines || this.maxLines <= 0) return false;
    const lines = this._codeText.split('\n');
    return lines.length > this.maxLines;
  }

  private _renderLines(lines: string[]): TemplateResult {
    if (!this.lineNumbers) {
      return html`${lines.join('\n')}`;
    }
    return html`${lines.map(
      (line, i) =>
        html`<span aria-hidden="true" class="code-snippet__line-number">${i + 1}</span>${line} `,
    )}`;
  }

  // ─── Render ───

  override render(): TemplateResult | typeof nothing {
    if (this.inline) {
      return html`
        <code part="base code" class="code-snippet code-snippet--inline">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </code>
      `;
    }

    const displayLines = this._getDisplayLines();
    const truncated = this._isTruncated();
    const preLabel = this.language ? `Code snippet: ${this.language}` : 'Code snippet';
    const codeClasses = classMap({
      'code-snippet__code': true,
      [`language-${this.language}`]: Boolean(this.language),
    });

    return html`
      <div part="base" class="code-snippet">
        <div part="header" class="code-snippet__header">
          ${this.copyable
            ? html`
                <button
                  part="copy-button"
                  class="code-snippet__copy-button"
                  type="button"
                  aria-label=${this._copied ? 'Copied!' : 'Copy code'}
                  @click=${this._handleCopy}
                >
                  ${this._copied ? 'Copied!' : 'Copy'}
                </button>
              `
            : nothing}
        </div>

        <!-- Visually-hidden live region announces copy confirmation to assistive technology -->
        <span
          aria-live="polite"
          style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;"
          >${this._copied ? 'Copied!' : ''}</span
        >

        <pre
          role="region"
          aria-label=${preLabel}
          class=${classMap({
            'code-snippet__pre': true,
            'code-snippet__pre--wrap': this.wrap,
          })}
        ><code part="code" class=${codeClasses}>${this._renderLines(displayLines)}</code></pre>

        <!-- Hidden slot to capture text content for display and copy -->
        <slot class="code-snippet__slot" @slotchange=${this._handleSlotChange}></slot>

        ${truncated
          ? html`
              <button
                part="expand-button"
                class="code-snippet__expand-button"
                type="button"
                aria-expanded=${this._expanded ? 'true' : 'false'}
                @click=${this._handleExpand}
              >
                ${this._expanded ? 'Show less' : 'Show more'}
              </button>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-code-snippet': HelixCodeSnippet;
  }
}
