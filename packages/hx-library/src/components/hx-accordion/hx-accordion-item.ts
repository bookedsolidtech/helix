import { LitElement, html, svg, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixAccordionItemStyles } from './hx-accordion-item.styles.js';

const chevronIcon = svg`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
`;

/**
 * An individual accordion item with collapsible content.
 *
 * @summary Collapsible panel that can be expanded or collapsed.
 *
 * @tag hx-accordion-item
 *
 * @slot trigger - The heading/trigger content for this item.
 * @slot - Default slot for the collapsible body content.
 *
 * @attr {number} level - Heading level (1–6) for the trigger heading wrapper. Defaults to 3.
 *   Set this to match the document outline — e.g., use `level="2"` when the accordion
 *   appears under an `<h1>` landmark.
 *
 * @fires {CustomEvent<{expanded: boolean, itemId: string}>} hx-expand - Dispatched when the item is expanded.
 * @fires {CustomEvent<{expanded: boolean, itemId: string}>} hx-collapse - Dispatched when the item is collapsed.
 *
 * @csspart item - The outer details element container.
 * @csspart trigger - The summary/trigger element.
 * @csspart content - The collapsible content area.
 * @csspart icon - The expand/collapse icon.
 *
 * @cssprop [--hx-accordion-border-color=var(--hx-color-neutral-200)] - Border color between items.
 * @cssprop [--hx-accordion-trigger-padding=var(--hx-space-4)] - Trigger padding.
 * @cssprop [--hx-accordion-trigger-color=var(--hx-color-neutral-800)] - Trigger text color.
 * @cssprop [--hx-accordion-trigger-bg=transparent] - Trigger background color.
 * @cssprop [--hx-accordion-trigger-hover-bg=var(--hx-color-neutral-50)] - Trigger hover background.
 * @cssprop [--hx-accordion-icon-color=var(--hx-color-neutral-500)] - Icon color.
 * @cssprop [--hx-accordion-content-padding=0 var(--hx-space-4) var(--hx-space-4)] - Content padding.
 * @cssprop [--hx-accordion-content-color=var(--hx-color-neutral-600)] - Content text color.
 */
@customElement('hx-accordion-item')
export class HelixAccordionItem extends LitElement {
  static override styles = [tokenStyles, helixAccordionItemStyles];

  private static _counter = 0;
  private _uid = `hx-accordion-item-${++HelixAccordionItem._counter}`;

  /**
   * Whether this item is expanded.
   * @attr expanded
   */
  @property({ type: Boolean, reflect: true })
  expanded = false;

  /**
   * Whether this item is disabled (cannot be toggled).
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Heading level (1–6) for the heading element that wraps the trigger button.
   * Defaults to 3. Set to match the document outline around the accordion.
   * Per the WAI-ARIA Authoring Practices Guide, accordion triggers should be
   * wrapped in a heading element so the accordion structure is surfaced in the
   * screen reader heading list.
   * @attr level
   */
  @property({ type: Number })
  level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  // ─── Heading Render Helper ───

  private _renderTriggerHeading(summary: TemplateResult): TemplateResult {
    // Clamp level to valid heading range
    const level = Math.max(1, Math.min(6, this.level)) as 1 | 2 | 3 | 4 | 5 | 6;
    // Use unsafeHTML-free approach: map level to a static template
    switch (level) {
      case 1:
        return html`<h1 class="trigger__heading">${summary}</h1>`;
      case 2:
        return html`<h2 class="trigger__heading">${summary}</h2>`;
      case 4:
        return html`<h4 class="trigger__heading">${summary}</h4>`;
      case 5:
        return html`<h5 class="trigger__heading">${summary}</h5>`;
      case 6:
        return html`<h6 class="trigger__heading">${summary}</h6>`;
      case 3:
      default:
        return html`<h3 class="trigger__heading">${summary}</h3>`;
    }
  }

  // ─── Toggle Logic ───

  private _toggle(): void {
    if (this.disabled) return;

    const willExpand = !this.expanded;
    this.expanded = willExpand;

    this._dispatchToggleEvent(willExpand);
  }

  _dispatchToggleEvent(expanded: boolean): void {
    const detail = { expanded, itemId: this.id || '' };
    const options = { bubbles: true, composed: true, detail };

    if (expanded) {
      this.dispatchEvent(new CustomEvent('hx-expand', options));
    } else {
      this.dispatchEvent(new CustomEvent('hx-collapse', options));
    }
  }

  // ─── Event Handlers ───

  private _handleSummaryClick(e: MouseEvent): void {
    e.preventDefault();
    this._toggle();
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._toggle();
    }
  }

  // ─── Render ───

  override render() {
    const itemClasses = {
      item: true,
      'item--expanded': this.expanded,
      'item--disabled': this.disabled,
    };

    const summaryEl = html`
      <summary
        id=${`${this._uid}-trigger`}
        part="trigger"
        class="trigger"
        tabindex=${this.disabled ? '-1' : '0'}
        aria-expanded=${this.expanded ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-controls=${`${this._uid}-content`}
        @click=${this._handleSummaryClick}
        @keydown=${this._handleKeyDown}
      >
        <slot name="trigger"></slot>
        <span part="icon" class="icon">${chevronIcon}</span>
      </summary>
    `;

    return html`
      <details part="item" class=${classMap(itemClasses)} ?open=${this.expanded}>
        ${this._renderTriggerHeading(summaryEl)}
        <div class="content-wrapper">
          <div class="content-inner">
            <div
              id=${`${this._uid}-content`}
              part="content"
              class="content"
              role="region"
              aria-labelledby=${`${this._uid}-trigger`}
              aria-hidden=${this.expanded ? nothing : 'true'}
            >
              <slot></slot>
            </div>
          </div>
        </div>
      </details>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-accordion-item': HelixAccordionItem;
  }
}
