import { LitElement, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixDialogStyles } from './hx-dialog.styles.js';

/** Selector string matching all standard focusable elements. */
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal and non-modal dialog component built on the native `<dialog>` element.
 * Supports focus trapping, scroll locking, accessible labeling, and cancelable
 * close requests — suitable for confirmations, forms, and critical healthcare workflows.
 *
 * @summary Accessible dialog/modal built on the native dialog element with full focus management.
 *
 * @tag hx-dialog
 *
 * @slot header - Title or heading content rendered in the dialog header.
 * @slot - Default slot for dialog body content.
 * @slot footer - Action buttons rendered in the dialog footer.
 *
 * @fires {CustomEvent} hx-open - Dispatched when the dialog opens.
 * @fires {CustomEvent<{returnValue: string}>} hx-close - Dispatched when the dialog closes.
 * @fires {CustomEvent} hx-request-close - Dispatched when close is requested; call preventDefault() to cancel.
 *
 * @csspart dialog - The native `<dialog>` element.
 * @csspart overlay - The custom overlay div used for backdrop click detection.
 * @csspart header - The header section containing the label and close button.
 * @csspart body - The body section containing the default slot.
 * @csspart footer - The footer section containing action buttons.
 * @csspart close-button - The X close button in the header.
 *
 * @cssprop [--hx-dialog-bg=var(--hx-color-surface,#ffffff)] - Dialog background color.
 * @cssprop [--hx-dialog-color=var(--hx-color-text-primary,#111827)] - Dialog text color.
 * @cssprop [--hx-dialog-width=min(90vw,560px)] - Dialog width.
 * @cssprop [--hx-dialog-max-height=90vh] - Dialog maximum height.
 * @cssprop [--hx-dialog-overlay-bg=rgba(0,0,0,0.5)] - Backdrop/overlay color.
 * @cssprop [--hx-dialog-header-padding=var(--hx-space-4,1rem) var(--hx-space-6,1.5rem)] - Header padding.
 * @cssprop [--hx-dialog-body-padding=var(--hx-space-6,1.5rem)] - Body padding.
 * @cssprop [--hx-dialog-footer-padding=var(--hx-space-4,1rem) var(--hx-space-6,1.5rem)] - Footer padding.
 */
@customElement('hx-dialog')
export class HelixDialog extends LitElement {
  static override styles = [tokenStyles, helixDialogStyles];

  // ─── Internal References ───

  @query('dialog')
  declare private _dialogEl: HTMLDialogElement | null;

  // ─── Private State ───

  /** The element that had focus before the dialog opened; restored on close. */
  private _triggerElement: Element | null = null;

  /** The original body overflow value, saved on open and restored on close. */
  private _savedBodyOverflow = '';

  // ─── Properties ───

  /**
   * Controls dialog visibility. Set to true to open, false to close.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * When true (default), renders as a modal dialog with backdrop and focus trap.
   * When false, renders as a non-modal dialog.
   * @attr modal
   */
  @property({ type: Boolean, reflect: true })
  modal = true;

  /**
   * Accessible title for the dialog, referenced by aria-labelledby.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  /**
   * When true, clicking the backdrop overlay closes the dialog.
   * @attr close-on-overlay
   */
  @property({ type: Boolean, attribute: 'close-on-overlay', reflect: true })
  closeOnOverlay = false;

  /**
   * When true (default), pressing Escape closes the dialog.
   * @attr close-on-escape
   */
  @property({ type: Boolean, attribute: 'close-on-escape', reflect: true })
  closeOnEscape = true;

  /**
   * When true, hides the X close button in the dialog header.
   * @attr no-close-button
   */
  @property({ type: Boolean, attribute: 'no-close-button', reflect: true })
  noCloseButton = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeydown);
    this._restoreBodyScroll();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('open')) {
      if (this.open) {
        this._openDialog();
      } else {
        this._closeDialog();
      }
    }
  }

  // ─── Dialog Control ───

  private _openDialog(): void {
    const dialogEl = this._dialogEl;
    if (dialogEl === null) return;

    this._triggerElement = document.activeElement;

    if (this.modal) {
      this._savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialogEl.showModal();
    } else {
      dialogEl.show();
    }

    this.dispatchEvent(
      new CustomEvent('hx-open', {
        bubbles: true,
        composed: true,
      }),
    );

    void this.updateComplete.then(() => {
      this._focusFirstFocusable();
    });
  }

  private _closeDialog(): void {
    const dialogEl = this._dialogEl;
    if (dialogEl === null) return;

    dialogEl.close();
    this._restoreBodyScroll();

    if (
      this._triggerElement !== null &&
      this._triggerElement instanceof HTMLElement
    ) {
      this._triggerElement.focus();
    }
    this._triggerElement = null;

    this.dispatchEvent(
      new CustomEvent('hx-close', {
        bubbles: true,
        composed: true,
        detail: { returnValue: dialogEl.returnValue },
      }),
    );
  }

  private _restoreBodyScroll(): void {
    if (this.modal) {
      document.body.style.overflow = this._savedBodyOverflow;
      this._savedBodyOverflow = '';
    }
  }

  // ─── Focus Management ───

  private _focusFirstFocusable(): void {
    const dialogEl = this._dialogEl;
    if (dialogEl === null) return;

    const focusable = dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const first = focusable.item(0);
    if (first !== undefined && first !== null) {
      first.focus();
    } else {
      dialogEl.focus();
    }
  }

  private _getFocusableElements(): HTMLElement[] {
    const dialogEl = this._dialogEl;
    if (dialogEl === null) return [];
    return Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }

  // ─── Event Handlers ───

  /**
   * Arrow-function class field so `this` is always bound and the same reference
   * can be passed to both addEventListener and removeEventListener.
   * Handles Tab/Shift+Tab focus trap (modal only).
   */
  private _handleKeydown = (event: KeyboardEvent): void => {
    if (!this.open) return;

    if (event.key === 'Tab' && this.modal) {
      const focusable = this._getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
  };

  private _handleCancel(event: Event): void {
    // Always prevent the native dialog cancel so we own the close behavior.
    event.preventDefault();

    if (!this.closeOnEscape) return;

    const requestEvent = new CustomEvent('hx-request-close', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    this.dispatchEvent(requestEvent);

    if (!requestEvent.defaultPrevented) {
      this.open = false;
    }
  }

  private _handleOverlayClick(): void {
    if (!this.closeOnOverlay) return;

    const requestEvent = new CustomEvent('hx-request-close', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    this.dispatchEvent(requestEvent);

    if (!requestEvent.defaultPrevented) {
      this.open = false;
    }
  }

  private _handleCloseButton(): void {
    const requestEvent = new CustomEvent('hx-request-close', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    this.dispatchEvent(requestEvent);

    if (!requestEvent.defaultPrevented) {
      this.open = false;
    }
  }

  // ─── Icons ───

  private _renderCloseIcon() {
    return html`<svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
      />
    </svg>`;
  }

  // ─── Render ───

  override render() {
    const labelId = 'dialog-label';

    return html`
      <dialog
        part="dialog"
        aria-labelledby=${this.label ? labelId : nothing}
        aria-modal=${this.modal ? 'true' : nothing}
        @cancel=${this._handleCancel}
      >
        ${this.modal
          ? html`<div
              part="overlay"
              class="dialog__overlay"
              @click=${this._handleOverlayClick}
            ></div>`
          : nothing}

        <div class="dialog__panel">
          <div part="header" class="dialog__header">
            ${this.label
              ? html`<span id=${labelId} class="dialog__label">${this.label}</span>`
              : nothing}
            <slot name="header"></slot>
            ${!this.noCloseButton
              ? html`<button
                  part="close-button"
                  class="dialog__close-button"
                  aria-label="Close dialog"
                  @click=${this._handleCloseButton}
                >
                  ${this._renderCloseIcon()}
                </button>`
              : nothing}
          </div>

          <div part="body" class="dialog__body">
            <slot></slot>
          </div>

          <div part="footer" class="dialog__footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-dialog': HelixDialog;
  }
}
