import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/body-scroll-lock.js';
import { helixDialogStyles } from './hx-dialog.styles.js';

// D21 — deterministic monotonic counter instead of Math.random()
let _dialogCounter = 0;

// Module-level constant avoids rebuilding the selector string on every _getFocusableElements call.
// Pattern matches hx-drawer's FOCUSABLE_SELECTORS constant at module scope.
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(',');

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
 * @csspart close-button - The built-in close button in the dialog header.
 * @csspart body - The scrollable body region containing the default slot.
 * @csspart footer - The footer region containing the footer slot.
 *
 * @cssprop [--hx-dialog-bg=var(--hx-color-neutral-0)] - Dialog background color.
 * @cssprop [--hx-dialog-color=var(--hx-color-neutral-900)] - Dialog text color.
 * @cssprop [--hx-dialog-border-radius=var(--hx-border-radius-lg)] - Dialog corner radius.
 * @cssprop [--hx-dialog-shadow=var(--hx-shadow-xl)] - Dialog box shadow.
 * @cssprop [--hx-dialog-width=32rem] - Dialog width.
 * @cssprop [--hx-dialog-backdrop-color=var(--hx-color-neutral-900)] - Backdrop overlay color.
 * @cssprop [--hx-dialog-backdrop-opacity=0.5] - Backdrop overlay opacity (set to 0 to hide; note
 *   that opacity:0 makes the backdrop invisible but still present in the layout — use pointer-events
 *   carefully if you need a fully non-blocking backdrop).
 * @cssprop [--hx-dialog-header-padding] - Padding inside the dialog header.
 * @cssprop [--hx-dialog-header-border-color=var(--hx-color-neutral-200)] - Header bottom border color.
 * @cssprop [--hx-dialog-heading-color=var(--hx-color-neutral-900)] - Heading text color.
 * @cssprop [--hx-dialog-body-padding] - Padding inside the dialog body.
 * @cssprop [--hx-dialog-footer-padding] - Padding inside the dialog footer.
 * @cssprop [--hx-dialog-footer-border-color=var(--hx-color-neutral-200)] - Footer top border color.
 *
 * @remarks
 * **Browser support for `::backdrop`:** The `dialog::backdrop` pseudo-element inside Shadow DOM
 * is well-supported in Chrome/Chromium and Firefox 122+. For Firefox < 122, modal backdrop
 * animation will silently fall back to no animation. A non-modal backdrop fallback is rendered
 * for non-modal dialogs.
 *
 * **Drupal integration:** This component is Twig-renderable via attributes (`heading`, `open`,
 * `modal`, `close-on-backdrop`). For trigger-button wiring in Drupal behaviors:
 * ```js
 * Drupal.behaviors.hxDialog = {
 *   attach(context) {
 *     context.querySelectorAll('[data-hx-dialog-trigger]').forEach((btn) => {
 *       btn.addEventListener('click', () => {
 *         const id = btn.getAttribute('data-hx-dialog-trigger');
 *         document.getElementById(id)?.showModal();
 *       });
 *     });
 *   },
 * };
 * ```
 * Focus restoration to the trigger element is handled automatically by the component.
 */
@customElement('hx-dialog')
export class HelixDialog extends LitElement {
  static override styles = [tokenStyles, helixDialogStyles];

  // D10 — observe aria-label attribute without shadowing ARIAMixin.ariaLabel
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, 'aria-label'];
  }

  // ─── Queries ───

  /** @internal */
  @query('dialog')
  private _dialogEl: HTMLDialogElement | null | undefined;

  // ─── Internal state ───

  /** Tracks whether a header slot has been assigned content.  * @internal
   */
  @state()
  private _hasHeaderSlot = false;

  /** Tracks whether a footer slot has been assigned content.  * @internal
   */
  @state()
  private _hasFooterSlot = false;

  /** Cached focusable elements — populated on open, cleared on close. */
  /** @internal */
  private _cachedFocusableElements: HTMLElement[] = [];

  /** The element that had focus when the dialog opened — restored on close (D1). */
  /** @internal */
  private _triggerElement: HTMLElement | null = null;

  /** Pending returnValue to pass to native dialog.close() (D11). */
  /** @internal */
  private _pendingReturnValue: string | undefined = undefined;

  // ─── Unique IDs for aria-labelledby / aria-describedby ───

  /** @internal */
  private readonly _headingId = `hx-dialog-heading-${++_dialogCounter}`;
  /** @internal */
  private readonly _descriptionId = `hx-dialog-description-${_dialogCounter}`;

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
   * ARIA role variant. Use `'alertdialog'` for urgent dialogs requiring immediate attention
   * (e.g., drug interaction warnings, critical lab alerts). Defaults to `'dialog'`.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'dialog' | 'alertdialog' = 'dialog';

  /**
   * Optional description text linked to the dialog via `aria-describedby`.
   * When provided, screen readers will announce this text when the dialog receives focus.
   * Recommended for dialogs that surface critical clinical information.
   * @attr description
   */
  @property({ type: String })
  description = '';

  /** Accessible label for the close button. Override for localized text. */
  @property({ type: String, attribute: 'label-close' })
  labelClose = 'Close dialog';

  /**
   * Returns the dialog's return value — the string passed to `close(returnValue)`.
   * Mirrors `HTMLDialogElement.returnValue`.
   */
  get returnValue(): string {
    return this._dialogEl?.returnValue ?? '';
  }

  // ─── Lifecycle ───

  // D10 — re-render when aria-label attribute changes (without declaring a shadowing property)
  override attributeChangedCallback(
    name: string,
    oldVal: string | null,
    newVal: string | null,
  ): void {
    super.attributeChangedCallback(name, oldVal, newVal);
    if (name === 'aria-label' && oldVal !== newVal) {
      this.requestUpdate('aria-label', oldVal);
    }
  }

  override firstUpdated(): void {
    // Initialize header slot state without a querySelector in render()
    this._hasHeaderSlot = this.querySelector('[slot="header"]') !== null;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._removeGlobalListeners();
    // Restore body scroll if disconnected while open
    if (this.modal && this.open) {
      unlockBodyScroll();
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
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

  /**
   * Closes the dialog.
   * @param returnValue - Optional return value string stored as `dialog.returnValue`.
   */
  close(returnValue?: string): void {
    if (returnValue !== undefined) {
      this._pendingReturnValue = returnValue;
    }
    this.open = false;
  }

  // ─── Private: Open / Close ───

  /** @internal */
  private _openDialog(): void {
    const dialog = this._dialogEl;
    if (!dialog) return;

    // D1 — store the element that triggered the dialog open for focus restoration on close
    this._triggerElement = document.activeElement as HTMLElement | null;

    if (this.modal) {
      if (!dialog.open) {
        dialog.showModal();
      }
      // D4 — lock body scroll when modal dialog is open. Uses a shared reference-counted
      // lock so that simultaneous hx-dialog / hx-drawer instances don't clobber each other
      // when one closes before the other (see utils/body-scroll-lock.ts).
      lockBodyScroll();
    } else {
      if (!dialog.open) {
        dialog.show();
      }
    }

    this._addGlobalListeners();

    // Cache focusable elements after the dialog is open in the DOM
    void this.updateComplete.then(() => {
      this._cachedFocusableElements = this._getFocusableElements();
      // D3 — explicitly move initial focus to the first focusable element inside the dialog
      // (browser's built-in focus delegation cannot reach slotted light DOM through Shadow DOM)
      this._cachedFocusableElements[0]?.focus();
    });

    this.dispatchEvent(
      new CustomEvent<void>('hx-open', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** @internal */
  private _closeDialog(): void {
    const dialog = this._dialogEl;
    if (!dialog) return;

    const wasOpen = dialog.open;
    if (dialog.open) {
      // D11 — forward returnValue to native dialog.close() if provided
      if (this._pendingReturnValue !== undefined) {
        dialog.close(this._pendingReturnValue);
        this._pendingReturnValue = undefined;
      } else {
        dialog.close();
      }
    }

    // D4 — release body scroll lock. Uses shared counter so scroll is only restored
    // after every open overlay (hx-dialog + hx-drawer) has closed.
    unlockBodyScroll();

    this._removeGlobalListeners();
    this._cachedFocusableElements = [];

    // D1 — restore focus to the element that opened the dialog (WCAG 2.4.3)
    this._triggerElement?.focus();
    this._triggerElement = null;

    if (wasOpen) {
      this.dispatchEvent(
        new CustomEvent<void>('hx-close', {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // ─── Event Listeners ───

  /** @internal */
  private _addGlobalListeners(): void {
    this._dialogEl?.addEventListener('keydown', this._handleKeyDown);
    this._dialogEl?.addEventListener('click', this._handleDialogClick);
    this._dialogEl?.addEventListener('cancel', this._handleNativeCancel);
  }

  /** @internal */
  private _removeGlobalListeners(): void {
    this._dialogEl?.removeEventListener('keydown', this._handleKeyDown);
    this._dialogEl?.removeEventListener('click', this._handleDialogClick);
    this._dialogEl?.removeEventListener('cancel', this._handleNativeCancel);
  }

  // ─── Keyboard Handler ───

  /** @internal */
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

  /** @internal */
  private _getFocusableElements(): HTMLElement[] {
    // Collect focusable elements from slotted light DOM content only.
    // Shadow DOM elements (e.g., the built-in close button) remain accessible via
    // the native <dialog> tab order — including them here would cause focus to land
    // on shadow DOM elements whose document.activeElement resolves to the host,
    // breaking the test assertions and D7 initial focus behavior.
    const slots = this.shadowRoot?.querySelectorAll<HTMLSlotElement>('slot') ?? [];
    const lightFocusable: HTMLElement[] = [];

    slots.forEach((slot) => {
      slot.assignedElements({ flatten: true }).forEach((el) => {
        if (el instanceof HTMLElement) {
          if (el.matches(FOCUSABLE_SELECTORS)) {
            lightFocusable.push(el);
          }
          el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS).forEach((child) => {
            lightFocusable.push(child);
          });
        }
      });
    });

    const filtered = lightFocusable.filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1',
    );

    // WCAG 2.4.3: if no light DOM focusable elements exist, fall back to the shadow
    // close button so the dialog always has at least one reachable focus target.
    if (filtered.length === 0) {
      const closeBtn = this.shadowRoot?.querySelector<HTMLElement>('.dialog__close-btn');
      if (closeBtn) filtered.push(closeBtn);
    }

    return filtered;
  }

  /** @internal */
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

    // The shadow close button may be the first focusable element when no light DOM
    // content exists (WCAG 2.1.2). Check both the element reference and shadow root
    // active element so Shift+Tab wraps correctly across the shadow boundary.
    const closeBtn = this.shadowRoot?.querySelector<HTMLElement>('.dialog__close-btn');

    if (e.shiftKey) {
      // Shift+Tab: if focus is on first, wrap to last
      const isOnFirst =
        currentActive === first ||
        (closeBtn !== null && shadowActive === closeBtn && first === closeBtn);
      if (isOnFirst) {
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

  /** @internal */
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

  /** @internal */
  private _handleBackdropClick = (): void => {
    if (!this.closeOnBackdrop) return;
    this._cancel();
  };

  // ─── Native cancel (Escape via browser, before our handler runs) ───

  /** @internal */
  private _handleNativeCancel = (e: Event): void => {
    // We always prevent the native cancel so we can manage close state ourselves.
    e.preventDefault();
  };

  // ─── Cancel logic ───

  /** @internal */
  private _cancel(): void {
    this.dispatchEvent(
      new CustomEvent<void>('hx-cancel', {
        bubbles: true,
        composed: true,
      }),
    );

    this.open = false;
    // hx-close is dispatched by _closeDialog() which is called via the open property setter
  }

  // ─── Slot change handlers ───

  /** @internal */
  private _handleHeaderSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHeaderSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleFooterSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasFooterSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderHeader() {
    const hasHeading = this.heading.trim().length > 0;

    // Always render header to include the built-in close button (D17)
    return html`
      <div part="header" class="dialog__header">
        ${hasHeading
          ? html`<h2 id=${this._headingId} class="dialog__heading">${this.heading}</h2>`
          : nothing}
        <slot name="header" @slotchange=${this._handleHeaderSlotChange}></slot>
        <button
          part="close-button"
          class="dialog__close-btn"
          type="button"
          aria-label=${this.labelClose}
          @click=${() => this.close()}
        ></button>
      </div>
    `;
  }

  /** @internal */
  private _renderFooter() {
    return html`
      <div part="footer" class="dialog__footer" ?hidden=${!this._hasFooterSlot}>
        <slot name="footer" @slotchange=${this._handleFooterSlotChange}></slot>
      </div>
    `;
  }

  /** @internal */
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

  // D8 — render visually-hidden description for aria-describedby
  /** @internal */
  private _renderDescription() {
    if (!this.description) return nothing;
    return html`<span id=${this._descriptionId} class="dialog__description"
      >${this.description}</span
    >`;
  }

  // ─── Render ───

  override render() {
    const hasHeading = this.heading.trim().length > 0;
    // D10 — read aria-label via getAttribute to avoid shadowing ARIAMixin.ariaLabel
    const ariaLabel = this.getAttribute('aria-label');

    return html`
      ${this._renderNonModalBackdrop()}
      <dialog
        role=${this.variant !== 'dialog' ? this.variant : nothing}
        aria-labelledby=${hasHeading ? this._headingId : nothing}
        aria-label=${!hasHeading ? (ariaLabel ?? 'Dialog') : nothing}
        aria-describedby=${this.description ? this._descriptionId : nothing}
        aria-modal=${this.modal ? 'true' : nothing}
      >
        <div part="dialog" class="dialog">
          ${this._renderHeader()} ${this._renderDescription()}
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
