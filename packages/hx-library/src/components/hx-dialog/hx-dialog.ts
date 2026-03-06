import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixDialogStyles } from './hx-dialog.styles.js';

let _idCounter = 0;

/**
 * A modal and non-modal dialog component built on the native HTML `<dialog>` element.
 * Provides focus trapping, backdrop interaction, keyboard navigation, and full
 * ARIA labelling for enterprise healthcare accessibility requirements.
 *
 * @summary Accessible dialog overlay for confirmations, forms, and detailed content.
 *
 * @tag hx-dialog
 *
 * @slot - Default slot for the dialog body content.
 * @slot header - Slot for custom header content. When provided, replaces the built-in heading.
 * @slot footer - Slot for action buttons or footer content.
 *
 * @fires {CustomEvent<void>} hx-open - Fired when the dialog opens.
 * @fires {CustomEvent<void>} hx-close - Fired when the dialog closes for any reason.
 * @fires {CustomEvent<void>} hx-cancel - Fired when the dialog is dismissed via Escape key or cancel action.
 *
 * @csspart dialog - The inner container div that holds the dialog content.
 * @csspart backdrop - The non-modal backdrop overlay element.
 * @csspart header - The header region containing the heading and header slot.
 * @csspart body - The scrollable body region containing the default slot.
 * @csspart footer - The footer region containing the footer slot.
 *
 * @cssprop [--hx-dialog-bg=var(--hx-color-neutral-0)] - Dialog background color.
 * @cssprop [--hx-dialog-color=var(--hx-color-neutral-900)] - Dialog text color.
 * @cssprop [--hx-dialog-border-radius=var(--hx-border-radius-lg)] - Dialog corner radius.
 * @cssprop [--hx-dialog-shadow=var(--hx-shadow-xl)] - Dialog box shadow.
 * @cssprop [--hx-dialog-width=32rem] - Dialog width.
 * @cssprop [--hx-dialog-backdrop-color=var(--hx-color-neutral-900)] - Backdrop overlay color.
 * @cssprop [--hx-dialog-backdrop-opacity=0.5] - Backdrop overlay opacity.
 * @cssprop [--hx-dialog-header-padding] - Padding inside the dialog header.
 * @cssprop [--hx-dialog-header-border-color=var(--hx-color-neutral-200)] - Header bottom border color.
 * @cssprop [--hx-dialog-heading-color=var(--hx-color-neutral-900)] - Heading text color.
 * @cssprop [--hx-dialog-body-padding] - Padding inside the dialog body.
 * @cssprop [--hx-dialog-footer-padding] - Padding inside the dialog footer.
 * @cssprop [--hx-dialog-footer-border-color=var(--hx-color-neutral-200)] - Footer top border color.
 */
@customElement('hx-dialog')
export class HelixDialog extends LitElement {
  static override styles = [tokenStyles, helixDialogStyles];

  // ─── Queries ───

  @query('dialog')
  declare private _dialogEl: HTMLDialogElement | null;

  // ─── Internal state ───

  /** Tracks whether a header slot has been assigned content. */
  @state()
  private _hasHeaderSlot = false;

  /** Tracks whether a footer slot has been assigned content. */
  @state()
  private _hasFooterSlot = false;

  /** Cached focusable elements — populated on open, cleared on close. */
  private _cachedFocusableElements: HTMLElement[] = [];

  /** Element that had focus before the dialog opened — restored on close. */
  private _previouslyFocusedElement: HTMLElement | null = null;

  /** Stored body overflow value to restore after modal close. */
  private _previousBodyOverflow = '';

  // ─── Unique ID for aria-labelledby ───

  private readonly _headingId = `hx-dialog-heading-${++_idCounter}`;

  // ─── Public Properties ───

  /**
   * Controls whether the dialog is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * When true, renders as a modal dialog with a backdrop and focus trap.
   * When false, renders as a non-modal dialog.
   * @attr modal
   */
  @property({ type: Boolean, reflect: true })
  modal = true;

  /**
   * When true, clicking the backdrop closes the dialog.
   * @attr close-on-backdrop
   */
  @property({
    attribute: 'close-on-backdrop',
    reflect: true,
    converter: {
      fromAttribute: (value: string | null) => value !== 'false',
      toAttribute: (value: boolean) => String(value),
    },
  })
  closeOnBackdrop = true;

  /**
   * Text content for the dialog heading. Used as the accessible label via aria-labelledby.
   * @attr heading
   */
  @property({ type: String })
  heading = '';

  /**
   * Accessible label for dialogs that use a custom header slot instead of the `heading` attribute.
   * Required when `heading` is empty and no labelled heading is projected into the header slot.
   * @attr aria-label
   */
  @property({ type: String, attribute: 'aria-label' })
  ariaLabel = '';

  // ─── Lifecycle ───

  override firstUpdated(): void {
    // Initialize header slot state without a querySelector in render()
    this._hasHeaderSlot = this.querySelector('[slot="header"]') !== null;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._removeGlobalListeners();
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

  // ─── Public Methods ───

  /** Opens the dialog in the mode determined by the `modal` property. */
  show(): void {
    this.open = true;
  }

  /** Opens the dialog as a modal regardless of the `modal` property setting. */
  showModal(): void {
    this.modal = true;
    this.open = true;
  }

  /** Closes the dialog. */
  close(): void {
    this.open = false;
  }

  // ─── Private: Open / Close ───

  private _openDialog(): void {
    const dialog = this._dialogEl;
    if (!dialog) return;

    // D1: Store the currently focused element for restoration on close
    this._previouslyFocusedElement = document.activeElement as HTMLElement | null;

    if (this.modal) {
      if (!dialog.open) {
        dialog.showModal();
      }
      // D4: Lock body scroll while modal is open
      this._previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      if (!dialog.open) {
        dialog.show();
      }
    }

    this._addGlobalListeners();

    // Cache focusable elements and set initial focus after render
    void this.updateComplete.then(() => {
      this._cachedFocusableElements = this._getFocusableElements();
      // D3: Move focus to the first focusable element inside the dialog
      const firstFocusable = this._cachedFocusableElements[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    });

    this.dispatchEvent(
      new CustomEvent('hx-open', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _closeDialog(): void {
    const dialog = this._dialogEl;
    if (!dialog) return;

    const wasOpen = dialog.open;
    if (dialog.open) {
      dialog.close();
    }

    // D4: Restore body scroll
    if (this.modal) {
      document.body.style.overflow = this._previousBodyOverflow;
    }

    this._removeGlobalListeners();
    this._cachedFocusableElements = [];

    // D1: Restore focus to the element that opened the dialog
    if (wasOpen && this._previouslyFocusedElement) {
      this._previouslyFocusedElement.focus();
      this._previouslyFocusedElement = null;
    }

    if (wasOpen) {
      this.dispatchEvent(
        new CustomEvent('hx-close', {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // ─── Event Listeners ───

  private _addGlobalListeners(): void {
    this._dialogEl?.addEventListener('keydown', this._handleKeyDown);
    this._dialogEl?.addEventListener('click', this._handleDialogClick);
    this._dialogEl?.addEventListener('cancel', this._handleNativeCancel);
  }

  private _removeGlobalListeners(): void {
    this._dialogEl?.removeEventListener('keydown', this._handleKeyDown);
    this._dialogEl?.removeEventListener('click', this._handleDialogClick);
    this._dialogEl?.removeEventListener('cancel', this._handleNativeCancel);
  }

  // ─── Keyboard Handler ───

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      // Native dialog fires a 'cancel' event before close when Escape is pressed.
      // We prevent default here and handle it ourselves so we fire hx-cancel
      // before setting open = false (which triggers hx-close).
      e.preventDefault();
      this._cancel();
      return;
    }

    if (e.key === 'Tab' && this.modal) {
      this._trapFocus(e);
    }
  };

  // ─── Focus Trap ───

  private _getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'details > summary',
    ].join(',');

    // Collect focusable elements from shadow root
    const shadowFocusable = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>(focusableSelectors) ?? [],
    );

    // Collect focusable elements from slotted light DOM content
    const slots = this.shadowRoot?.querySelectorAll<HTMLSlotElement>('slot') ?? [];
    const lightFocusable: HTMLElement[] = [];

    slots.forEach((slot) => {
      slot.assignedElements({ flatten: true }).forEach((el) => {
        if (el instanceof HTMLElement) {
          if (el.matches(focusableSelectors)) {
            lightFocusable.push(el);
          }
          el.querySelectorAll<HTMLElement>(focusableSelectors).forEach((child) => {
            lightFocusable.push(child);
          });
        }
      });
    });

    return [...shadowFocusable, ...lightFocusable].filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1',
    );
  }

  private _trapFocus(e: KeyboardEvent): void {
    const focusable =
      this._cachedFocusableElements.length > 0
        ? this._cachedFocusableElements
        : this._getFocusableElements();
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const [first, ...rest] = focusable;
    const last = rest.length > 0 ? rest[rest.length - 1] : first;

    if (!first || !last) return;

    const active = document.activeElement;
    // Also check shadow root active element
    const shadowActive = this.shadowRoot?.activeElement;
    const currentActive = (shadowActive ?? active) as HTMLElement | null;

    if (e.shiftKey) {
      // Shift+Tab: if focus is on first, wrap to last
      if (currentActive === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if focus is on last, wrap to first
      if (currentActive === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ─── Backdrop Click ───

  private _handleDialogClick = (e: MouseEvent): void => {
    if (!this.closeOnBackdrop) return;

    // The native dialog element fills only the content area in showModal().
    // Clicks on the backdrop reach the <dialog> element itself.
    // We detect this by checking whether the click target is the dialog element.
    const target = e.target as HTMLElement;
    if (target === this._dialogEl) {
      this._cancel();
    }
  };

  // ─── Non-modal backdrop click ───

  private _handleBackdropClick = (): void => {
    if (!this.closeOnBackdrop) return;
    this._cancel();
  };

  // ─── Native cancel (Escape via browser, before our handler runs) ───

  private _handleNativeCancel = (e: Event): void => {
    // We always prevent the native cancel so we can manage close state ourselves.
    e.preventDefault();
  };

  // ─── Cancel logic ───

  private _cancel(): void {
    this.dispatchEvent(
      new CustomEvent('hx-cancel', {
        bubbles: true,
        composed: true,
      }),
    );

    this.open = false;
    // hx-close is dispatched by _closeDialog() which is called via the open property setter
  }

  // ─── Slot change handlers ───

  private _handleHeaderSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHeaderSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleFooterSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasFooterSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Render Helpers ───

  private _renderHeader() {
    const hasHeading = this.heading.trim().length > 0;
    if (!hasHeading && !this._hasHeaderSlot) return nothing;

    return html`
      <div part="header" class="dialog__header">
        ${hasHeading
          ? html`<h2 id=${this._headingId} class="dialog__heading">${this.heading}</h2>`
          : nothing}
        <slot name="header" @slotchange=${this._handleHeaderSlotChange}></slot>
      </div>
    `;
  }

  private _renderFooter() {
    return html`
      <div part="footer" class="dialog__footer" ?hidden=${!this._hasFooterSlot}>
        <slot name="footer" @slotchange=${this._handleFooterSlotChange}></slot>
      </div>
    `;
  }

  private _renderNonModalBackdrop() {
    if (this.modal || !this.open) return nothing;
    return html`
      <div
        part="backdrop"
        class="dialog-backdrop"
        @click=${this._handleBackdropClick}
        aria-hidden="true"
      ></div>
    `;
  }

  // ─── Render ───

  override render() {
    const hasHeading = this.heading.trim().length > 0;

    return html`
      ${this._renderNonModalBackdrop()}
      <dialog
        aria-labelledby=${hasHeading ? this._headingId : nothing}
        aria-label=${!hasHeading && this.ariaLabel ? this.ariaLabel : nothing}
        aria-modal=${this.modal ? 'true' : nothing}
      >
        <div part="dialog" class="dialog">
          ${this._renderHeader()}
          <div part="body" class="dialog__body">
            <slot></slot>
          </div>
          ${this._renderFooter()}
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
