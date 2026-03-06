import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import { helixContextualHelpStyles } from './hx-contextual-help.styles.js';

/**
 * A contextual help component that displays an informational popover when the
 * user activates a question-mark icon button. Designed for enterprise healthcare
 * UIs where inline field-level guidance improves form accuracy.
 *
 * @summary Question-mark trigger that opens an accessible help popover.
 *
 * @tag hx-contextual-help
 *
 * @slot - Help content to display inside the popover (text, links, rich HTML).
 *
 * @fires {CustomEvent<void>} hx-open - Fired when the help popover opens.
 * @fires {CustomEvent<void>} hx-close - Fired when the help popover closes.
 *
 * @csspart trigger - The question-mark icon button element.
 * @csspart popover - The floating help panel container.
 * @csspart heading - The heading element inside the popover.
 *
 * @cssprop [--hx-contextual-help-trigger-color=var(--hx-color-primary-500)] - Trigger icon color.
 * @cssprop [--hx-contextual-help-trigger-border-radius=var(--hx-border-radius-md)] - Trigger border radius.
 * @cssprop [--hx-contextual-help-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-contextual-help-bg=var(--hx-color-neutral-0)] - Popover background color.
 * @cssprop [--hx-contextual-help-color=var(--hx-color-neutral-900)] - Popover text color.
 * @cssprop [--hx-contextual-help-border-color=var(--hx-color-neutral-200)] - Popover border color.
 * @cssprop [--hx-contextual-help-border-radius=var(--hx-border-radius-md)] - Popover border radius.
 * @cssprop [--hx-contextual-help-shadow=var(--hx-shadow-lg)] - Popover box shadow.
 * @cssprop [--hx-contextual-help-padding=var(--hx-spacing-4)] - Popover padding.
 * @cssprop [--hx-contextual-help-max-width=280px] - Popover maximum width.
 * @cssprop [--hx-contextual-help-heading-color=var(--hx-color-neutral-900)] - Heading text color.
 * @cssprop [--hx-contextual-help-z-index=9999] - Popover z-index.
 */
@customElement('hx-contextual-help')
export class HelixContextualHelp extends LitElement {
  static override styles = [tokenStyles, helixContextualHelpStyles];

  // ─── Queries ───

  @query('.trigger')
  declare private _triggerEl: HTMLButtonElement | null;

  @query('.popover')
  declare private _popoverEl: HTMLElement | null;

  // ─── Internal state ───

  @state()
  private _open = false;

  // ─── Unique IDs ───

  private readonly _headingId = `hx-contextual-help-heading-${Math.random().toString(36).slice(2, 9)}`;
  private readonly _popoverId = `hx-contextual-help-popover-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Public Properties ───

  /**
   * Preferred placement of the popover relative to the trigger.
   * The popover flips automatically if there is insufficient viewport space.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: 'top' | 'bottom' | 'left' | 'right' = 'right';

  /**
   * Title text rendered as a heading inside the popover.
   * When provided, it also serves as the accessible label via `aria-labelledby`.
   * @attr heading
   */
  @property({ type: String })
  heading = '';

  /**
   * Size of the trigger icon button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' = 'md';

  /**
   * Accessible label for the trigger button. Rendered as `aria-label`.
   * @attr label
   */
  @property({ type: String })
  label = 'Help';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
    document.removeEventListener('click', this._handleOutsideClick);
  }

  // ─── Public Methods ───

  /** Opens the help popover. */
  show(): void {
    void this._show();
  }

  /** Closes the help popover. */
  hide(): void {
    this._hide();
  }

  // ─── Open / Close ───

  private async _show(): Promise<void> {
    if (this._open) return;
    this._open = true;
    await this.updateComplete;
    await this._updatePosition();
    // Focus the popover so Escape key handling works for keyboard users
    this._popoverEl?.focus();
    document.addEventListener('click', this._handleOutsideClick);
    this.dispatchEvent(
      new CustomEvent('hx-open', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _hide(): void {
    if (!this._open) return;
    this._open = false;
    document.removeEventListener('click', this._handleOutsideClick);
    // Return focus to the trigger button
    this._triggerEl?.focus();
    this.dispatchEvent(
      new CustomEvent('hx-close', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ─── Positioning ───

  private async _updatePosition(): Promise<void> {
    const triggerEl = this._triggerEl;
    const popoverEl = this._popoverEl;
    if (!triggerEl || !popoverEl) return;

    const { x, y } = await computePosition(triggerEl, popoverEl, {
      placement: this.placement,
      strategy: 'fixed',
      middleware: [offset(8), flip(), shift({ padding: 8 })],
    });

    Object.assign(popoverEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  // ─── Event Handlers ───

  private _handleTriggerClick(): void {
    if (this._open) {
      this._hide();
    } else {
      void this._show();
    }
  }

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._open) {
      e.stopPropagation();
      this._hide();
    }
  };

  private _handleOutsideClick = (e: MouseEvent): void => {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._hide();
    }
  };

  // ─── Render Helpers ───

  private _renderQuestionIcon() {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    `;
  }

  private _renderPopover() {
    if (!this._open) return nothing;

    const hasHeading = this.heading.trim().length > 0;

    return html`
      <div
        part="popover"
        class="popover"
        id=${this._popoverId}
        role="dialog"
        aria-labelledby=${hasHeading ? this._headingId : nothing}
        aria-modal="false"
        tabindex="-1"
      >
        ${hasHeading
          ? html`<h3 id=${this._headingId} part="heading" class="popover__heading">
              ${this.heading}
            </h3>`
          : nothing}
        <div class="popover__body">
          <slot></slot>
        </div>
      </div>
    `;
  }

  // ─── Render ───

  override render() {
    const triggerClasses = {
      trigger: true,
      [`trigger--${this.size}`]: true,
    };

    return html`
      <button
        part="trigger"
        class=${classMap(triggerClasses)}
        type="button"
        aria-label=${this.label}
        aria-expanded=${this._open ? 'true' : 'false'}
        aria-controls=${this._open ? this._popoverId : nothing}
        @click=${this._handleTriggerClick}
      >
        <span class="trigger-icon">${this._renderQuestionIcon()}</span>
      </button>
      ${this._renderPopover()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-contextual-help': HelixContextualHelp;
  }
}
