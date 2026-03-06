import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixCodeSnippetStyles } from './hx-code-snippet.styles.js';

/**
 * A styled code block with optional copy button and max-lines truncation.
 * Supports block (`<pre><code>`) and inline (`<code>`) rendering modes.
 * No external syntax highlighting dependency — use the `language` attribute
 * as a hint; the component applies `class="language-<name>"` on the `<code>`
 * element so external highlighters (Prism, Shiki, highlight.js) can target it.
 *
 * **Note:** Slot content is extracted as plain text (`textContent`). Pre-highlighted
 * HTML markup passed into the slot will have its tags stripped.
 *
 * @summary Styled code display component with copy-to-clipboard and expand/collapse.
 *
 * @tag hx-code-snippet
 *
 * @slot - Code content as plain text.
 *
 * @fires {CustomEvent<{text: string}>} hx-copy - Dispatched when the copy button is clicked.
 *
 * @csspart base - The outermost container (block: `<div>`, inline: `<code>`).
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
 * @cssprop [--hx-code-snippet-inline-padding=var(--hx-space-half,0.125em) var(--hx-space-1-5,0.375em)] - Inline mode padding.
 * @cssprop [--hx-code-snippet-tab-size=2] - Tab size for code indentation.
 */
@customElement('hx-code-snippet')
export class HelixCodeSnippet extends LitElement {
  static override styles = [tokenStyles, helixCodeSnippetStyles];

  // ─── Public Properties ───

  /**
   * Language hint for consumers to apply syntax highlighting.
   * Applied as `class="language-<name>"` on the `<code>` element.
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
   *
   * **Note for HTML/Twig authors:** This is a boolean attribute. Setting
   * `copyable="false"` in HTML still enables the copy button because the
   * attribute is *present*. To disable, omit the attribute entirely or
   * set the property via JavaScript: `el.copyable = false`.
   * @attr copyable
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

  // ─── Internal State ───

  @state() private _copied: boolean = false;
  @state() private _expanded: boolean = false;
  @state() private _codeText: string = '';

  private _copyTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Lifecycle ───

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
      // Clipboard API unavailable in some environments — emit event only
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

  private _getDisplayText(): string {
    if (!this.maxLines || this.maxLines <= 0 || this._expanded) {
      return this._codeText;
    }
    const lines = this._codeText.split('\n');
    if (lines.length <= this.maxLines) {
      return this._codeText;
    }
    return lines.slice(0, this.maxLines).join('\n');
  }

  private _isTruncated(): boolean {
    if (!this.maxLines || this.maxLines <= 0) return false;
    const lines = this._codeText.split('\n');
    return lines.length > this.maxLines;
  }

  private _getCodeClasses(): string {
    const classes = ['code-snippet__code'];
    if (this.language) {
      classes.push(`language-${this.language}`);
    }
    return classes.join(' ');
  }

  private _getRegionLabel(): string {
    if (this.language) {
      return `Code snippet: ${this.language}`;
    }
    return 'Code snippet';
  }

  // ─── Render ───

  override render(): TemplateResult | typeof nothing {
    if (this.inline) {
      return html`
        <code
          part="base code"
          class="code-snippet code-snippet--inline ${this.language
            ? `language-${this.language}`
            : ''}"
        >
          <slot @slotchange=${this._handleSlotChange}></slot>
        </code>
      `;
    }

    const displayText = this._getDisplayText();
    const truncated = this._isTruncated();

    return html`
      <div part="base" class="code-snippet">
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

        <pre
          role="region"
          aria-label=${this._getRegionLabel()}
          class="code-snippet__pre ${this.wrap ? 'code-snippet__pre--wrap' : ''}"
          tabindex="0"
        ><code part="code" class=${this._getCodeClasses()}>${displayText}</code></pre>

        <!-- Hidden slot to capture text content for display and copy -->
        <slot class="code-snippet__slot" @slotchange=${this._handleSlotChange}></slot>

        <!-- Live region for copy confirmation announcements -->
        <span class="code-snippet__live-region" role="status" aria-live="polite">
          ${this._copied ? 'Code copied to clipboard' : ''}
        </span>

        ${truncated
          ? html`
              <button
                part="expand-button"
                class="code-snippet__expand-button"
                type="button"
                aria-expanded=${this._expanded}
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
