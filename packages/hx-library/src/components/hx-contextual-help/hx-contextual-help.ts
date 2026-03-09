import { LitElement, html, nothing, PropertyValues } from 'lit';
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
 * @csspart close-button - The close button inside the popover header.
 *
 * @cssprop [--hx-contextual-help-trigger-color=var(--hx-color-primary-500)] - Trigger icon color.
 * @cssprop [--hx-contextual-help-trigger-border-radius=var(--hx-border-radius-md)] - Trigger border radius.
 * @cssprop [--hx-contextual-help-trigger-hover-bg=var(--hx-color-neutral-100)] - Trigger hover background color.
 * @cssprop [--hx-contextual-help-trigger-active-bg=var(--hx-color-neutral-200)] - Trigger active background color.
 * @cssprop [--hx-contextual-help-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-contextual-help-bg=var(--hx-color-neutral-0)] - Popover background color.
 * @cssprop [--hx-contextual-help-color=var(--hx-color-neutral-900)] - Popover text color.
 * @cssprop [--hx-contextual-help-border-color=var(--hx-color-neutral-200)] - Popover border color.
 * @cssprop [--hx-contextual-help-border-radius=var(--hx-border-radius-md)] - Popover border radius.
 * @cssprop [--hx-contextual-help-shadow=var(--hx-shadow-lg)] - Popover box shadow.
 * @cssprop [--hx-contextual-help-padding=var(--hx-spacing-4)] - Popover padding.
 * @cssprop [--hx-contextual-help-max-width=280px] - Popover maximum width.
 * @cssprop [--hx-contextual-help-min-width=160px] - Popover minimum width.
 * @cssprop [--hx-contextual-help-heading-color=var(--hx-color-neutral-900)] - Heading text color.
 * @cssprop [--hx-contextual-help-z-index=9999] - Popover z-index.
 */
@customElement('hx-contextual-help')
export class HelixContextualHelp extends LitElement {
  static override styles = [tokenStyles, helixContextualHelpStyles];

  // ─── Queries ───

  @query('.trigger')
  private _triggerEl!: HTMLButtonElement | null;

  @query('.popover')
  private _popoverEl!: HTMLElement | null;

  @query('.popover__close')
  private _closeEl!: HTMLButtonElement | null;

  // ─── Internal state ───

  @state()
  private _open = false;

  // ─── Unique IDs (crypto.randomUUID for SSR safety) ───

  private readonly _headingId = `hx-contextual-help-heading-${crypto.randomUUID().split('-')[0]}`;
  private readonly _popoverId = `hx-contextual-help-popover-${crypto.randomUUID().split('-')[0]}`;

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
   * Also used as the dialog's accessible name when no `heading` is provided.
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

  override willUpdate(changedProperties: PropertyValues<this>): void {
    const validPlacements = ['top', 'bottom', 'left', 'right'] as const;
    const validSizes = ['sm', 'md'] as const;

    if (changedProperties.has('placement') && !validPlacements.includes(this.placement)) {
      console.warn(
        `hx-contextual-help: invalid placement "${this.placement}". Expected one of: ${validPlacements.join(', ')}. Falling back to "right".`,
      );
      this.placement = 'right';
    }

    if (changedProperties.has('size') && !validSizes.includes(this.size)) {
      console.warn(
        `hx-contextual-help: invalid hx-size "${this.size}". Expected one of: ${validSizes.join(', ')}. Falling back to "md".`,
      );
      this.size = 'md';
    }
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
    // Focus the close button (first focusable element) so keyboard users can interact
    (this._closeEl ?? this._popoverEl)?.focus();
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

  // ─── Focus Trap ───

  private _getFocusableElements(): HTMLElement[] {
    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const popover = this._popoverEl;
    if (!popover) return [];

    // Focusable elements within shadow DOM (e.g., close button)
    const shadowFocusable = Array.from(popover.querySelectorAll<HTMLElement>(FOCUSABLE));

    // Focusable elements within slotted light DOM content
    const slot = popover.querySelector<HTMLSlotElement>('slot');
    const slottedFocusable: HTMLElement[] = [];
    if (slot) {
      for (const assigned of slot.assignedElements({ flatten: true })) {
        if (assigned.matches(FOCUSABLE)) {
          slottedFocusable.push(assigned as HTMLElement);
        }
        for (const child of assigned.querySelectorAll<HTMLElement>(FOCUSABLE)) {
          slottedFocusable.push(child);
        }
      }
    }

    return [...shadowFocusable, ...slottedFocusable];
  }

  private _trapFocus(e: KeyboardEvent): void {
    const focusable = this._getFocusableElements();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    // Active element may be in shadow DOM or light DOM (slotted content)
    const activeEl = this.shadowRoot?.activeElement ?? document.activeElement;

    if (e.shiftKey) {
      // Shift+Tab from first focusable or popover container → wrap to last
      if (activeEl === first || activeEl === this._popoverEl) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab from last focusable → wrap to first
      if (activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    }
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
      return;
    }
    if (e.key === 'Tab' && this._open) {
      this._trapFocus(e);
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
        aria-label=${!hasHeading ? this.label : nothing}
        aria-labelledby=${hasHeading ? this._headingId : nothing}
        aria-modal="true"
        tabindex="-1"
      >
        <div class="popover__header">
          ${hasHeading
            ? html`<h3 id=${this._headingId} part="heading" class="popover__heading">
                ${this.heading}
              </h3>`
            : nothing}
          <button
            type="button"
            part="close-button"
            class="popover__close"
            aria-label="Close"
            @click=${this._hide}
          >
            &times;
          </button>
        </div>
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
