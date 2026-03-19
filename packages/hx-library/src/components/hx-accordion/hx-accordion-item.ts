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
 * @fires {CustomEvent<{expanded: boolean, itemId: string}>} hx-expand - Dispatched when the item is expanded.
 * @fires {CustomEvent<{expanded: boolean, itemId: string}>} hx-collapse - Dispatched when the item is collapsed.
 *
 * @csspart item - The outer container wrapping the heading and panel.
 * @csspart heading - The heading element wrapping the trigger button.
 * @csspart trigger - The button trigger element.
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
  // Delegate focus so that focusing hx-accordion-item routes into the inner button.
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

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
   * Heading level for the trigger (1–6). Controls the `<h*>` element wrapping
   * the button, which is required by the ARIA APG Accordion pattern.
   * @attr heading-level
   */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel: 1 | 2 | 3 | 4 | 5 | 6 = 3;

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

  private _handleButtonClick(): void {
    this._toggle();
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    // Enter and Space are native button activations and fire click automatically.
    // Intercept only to prevent default scroll on Space, then delegate to toggle.
    if (e.key === ' ') {
      e.preventDefault();
      this._toggle();
    }
    // Arrow / Home / End keys bubble up to hx-accordion for inter-item navigation.
  }

  // ─── Render ───

  private _renderHeading(content: unknown) {
    // Dynamic heading level per ARIA APG — heading level must be configurable
    // so consumers can place the accordion in the correct document outline.
    const level = Math.max(1, Math.min(6, this.headingLevel)) as 1 | 2 | 3 | 4 | 5 | 6;
    switch (level) {
      case 1:
        return html`<h1 part="heading" class="heading">${content}</h1>`;
      case 2:
        return html`<h2 part="heading" class="heading">${content}</h2>`;
      case 3:
        return html`<h3 part="heading" class="heading">${content}</h3>`;
      case 4:
        return html`<h4 part="heading" class="heading">${content}</h4>`;
      case 5:
        return html`<h5 part="heading" class="heading">${content}</h5>`;
      case 6:
        return html`<h6 part="heading" class="heading">${content}</h6>`;
    }
  }

  override render() {
    const itemClasses = {
      item: true,
      'item--expanded': this.expanded,
      'item--disabled': this.disabled,
    };

    const trigger = html`
      <button
        id=${`${this._uid}-trigger`}
        part="trigger"
        class="trigger"
        type="button"
        tabindex=${this.disabled ? '-1' : '0'}
        aria-expanded=${this.expanded ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-controls=${`${this._uid}-content`}
        @click=${this._handleButtonClick}
        @keydown=${this._handleKeyDown}
      >
        <slot name="trigger"></slot>
        <span part="icon" class="icon" aria-hidden="true">${chevronIcon}</span>
      </button>
    `;

    return html`
      <div part="item" class=${classMap(itemClasses)}>
        ${this._renderHeading(trigger)}
        <div class="content-wrapper">
          <div class="content-inner">
            <div
              id=${`${this._uid}-content`}
              part="content"
              class="content"
              role="region"
              aria-labelledby=${`${this._uid}-trigger`}
              ?hidden=${!this.expanded}
            >
              <slot></slot>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-accordion-item': HelixAccordionItem;
  }
}
