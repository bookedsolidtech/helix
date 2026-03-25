import { LitElement, html, svg, nothing } from 'lit';
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
 * @attr {number} level - Heading level (1–6) for the trigger via `role="heading" aria-level`.
 *   Defaults to 3. Set this to match the document outline — e.g., use `level="2"` when the
 *   accordion appears under an `<h1>` landmark.
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

  /** @internal */
  private static _counter = 0;
  /** @internal */
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
   * Heading level (1–6) applied via `role="heading" aria-level` on the summary
   * trigger. Defaults to 3. Set to match the document outline around the
   * accordion so screen readers surface accordion items in the heading list.
   * @attr level
   */
  @property({ type: Number })
  level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  // ─── Heading Level Helper ───

  /**
   * Returns a clamped heading level (1–6) for use as `aria-level` on the
   * `<summary>` element. Per the WAI-ARIA APG Accordion pattern, the
   * `<summary>` must be a **direct child** of `<details>` for native
   * disclosure behaviour to work. Instead of wrapping `<summary>` inside
   * an `<h3>` (which breaks the native toggle), we apply
   * `role="heading" aria-level="N"` directly on `<summary>`.
   */
  /** @internal */
  private get _headingLevel(): number {
    return Math.max(1, Math.min(6, this.level));
  }

  // ─── Toggle Logic ───

  /** @internal */
  private _toggle(): void {
    if (this.disabled) return;

    const willExpand = !this.expanded;
    this.expanded = willExpand;

    this._dispatchToggleEvent(willExpand);
  }

  /** @internal */
  _dispatchToggleEvent(expanded: boolean): void {
    const detail = { expanded, itemId: this.id || '' };
    const options = { bubbles: true, composed: true, detail };

    if (expanded) {
      this.dispatchEvent(
        new CustomEvent<{ expanded: boolean; itemId: string }>('hx-expand', options),
      );
    } else {
      this.dispatchEvent(
        new CustomEvent<{ expanded: boolean; itemId: string }>('hx-collapse', options),
      );
    }
  }

  // ─── Event Handlers ───

  /** @internal */
  private _handleSummaryClick(e: MouseEvent): void {
    e.preventDefault();
    this._toggle();
  }

  /** @internal */
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

    return html`
      <details part="item" class=${classMap(itemClasses)} ?open=${this.expanded}>
        <summary
          id=${`${this._uid}-trigger`}
          part="trigger"
          class="trigger"
          role="heading"
          aria-level=${this._headingLevel}
          tabindex=${this.disabled ? '-1' : '0'}
          aria-expanded=${this.expanded ? 'true' : 'false'}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-controls=${`${this._uid}-content`}
          @click=${this._handleSummaryClick}
          @keydown=${this._handleKeyDown}
        >
          <slot name="trigger"></slot>
          <span part="icon" class="icon">${chevronIcon}</span>
        </summary>
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
