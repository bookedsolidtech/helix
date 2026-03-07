import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixDrawerStyles } from './hx-drawer.styles.js';

type DrawerPlacement = 'start' | 'end' | 'top' | 'bottom';
type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

const DRAWER_SIZE_MAP: Record<DrawerSize, string> = {
  sm: '20rem',
  md: '30rem',
  lg: '40rem',
  full: '100%',
};

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
 * A slide-in drawer panel that can appear from any edge of the viewport.
 * Supports focus trapping, overlay backdrop, keyboard navigation, and full
 * ARIA labelling for enterprise healthcare accessibility requirements.
 *
 * @summary Slide-in panel overlay from any viewport edge.
 *
 * @tag hx-drawer
 *
 * @slot label - The drawer title text.
 * @slot header-actions - Action buttons displayed in the header near the close button.
 * @slot - Default slot for the drawer body content.
 * @slot footer - Action buttons or footer content.
 *
 * @fires {CustomEvent<void>} hx-show - Fired when the drawer begins to open.
 * @fires {CustomEvent<void>} hx-after-show - Fired after the drawer open animation completes.
 * @fires {CustomEvent<void>} hx-hide - Fired when the drawer begins to close.
 * @fires {CustomEvent<void>} hx-after-hide - Fired after the drawer close animation completes.
 * @fires {CustomEvent<void>} hx-initial-focus - Fired when initial focus is set inside the drawer. Cancelable to override focus behavior.
 *
 * @csspart overlay - The full-screen overlay container (includes backdrop and panel).
 * @csspart panel - The drawer panel itself.
 * @csspart header - The header region containing the title and actions.
 * @csspart title - The drawer title element.
 * @csspart close-button - The built-in close button.
 * @csspart body - The scrollable body region.
 * @csspart footer - The footer region.
 *
 * @cssprop [--hx-drawer-bg=var(--hx-color-neutral-0)] - Drawer panel background color.
 * @cssprop [--hx-drawer-color=var(--hx-color-neutral-900)] - Drawer panel text color.
 * @cssprop [--hx-drawer-shadow=var(--hx-shadow-xl)] - Drawer panel box shadow.
 * @cssprop [--hx-drawer-backdrop-color=var(--hx-color-neutral-900)] - Backdrop color.
 * @cssprop [--hx-drawer-backdrop-opacity=0.5] - Backdrop opacity.
 * @cssprop [--hx-drawer-header-padding] - Padding inside the header.
 * @cssprop [--hx-drawer-header-border-color=var(--hx-color-neutral-200)] - Header border color.
 * @cssprop [--hx-drawer-title-color=var(--hx-color-neutral-900)] - Title text color.
 * @cssprop [--hx-drawer-body-padding] - Padding inside the body.
 * @cssprop [--hx-drawer-footer-padding] - Padding inside the footer.
 * @cssprop [--hx-drawer-footer-border-color=var(--hx-color-neutral-200)] - Footer border color.
 */
@customElement('hx-drawer')
export class HelixDrawer extends LitElement {
  static override styles = [tokenStyles, helixDrawerStyles];

  // ─── Queries ───

  @query('.drawer-overlay')
  declare private _overlayEl: HTMLElement | null;

  @query('.drawer-panel')
  declare private _panelEl: HTMLElement | null;

  @query('.drawer-close-button')
  declare private _closeButtonEl: HTMLButtonElement | null;

  // ─── Internal state ───

  @state()
  private _isOpen = false;

  @state()
  private _hasHeaderActionsSlot = false;

  @state()
  private _hasFooterSlot = false;

  @state()
  private _hasLabelSlot = false;

  private _cachedFocusableElements: HTMLElement[] = [];
  private _triggerElement: HTMLElement | null = null;
  private _animationTimeout: ReturnType<typeof setTimeout> | null = null;
  private _previousBodyOverflow: string | null = null;

  private readonly _titleId = `hx-drawer-title-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Public Properties ───

  /**
   * Controls whether the drawer is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Which edge of the viewport the drawer slides in from.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: DrawerPlacement = 'end';

  /**
   * The size of the drawer panel. Use 'sm', 'md', 'lg', 'full', or any valid CSS length.
   * @attr size
   */
  @property({ type: String, reflect: true })
  size: DrawerSize | string = 'md';

  /**
   * When true, the drawer is constrained to its positioned parent instead of the viewport.
   * The host element must have `position: relative` (or the library handles it via :host).
   * @attr contained
   */
  @property({ type: Boolean, reflect: true })
  contained = false;

  /**
   * When true, the header (title, header-actions, close button) is hidden.
   * @attr no-header
   */
  @property({ type: Boolean, reflect: true, attribute: 'no-header' })
  noHeader = false;

  /**
   * When true, the footer slot is hidden.
   * @attr no-footer
   */
  @property({ type: Boolean, reflect: true, attribute: 'no-footer' })
  noFooter = false;

  // ─── Lifecycle ───

  override firstUpdated(): void {
    this._hasHeaderActionsSlot = this.querySelector('[slot="header-actions"]') !== null;
    this._hasFooterSlot = this.querySelector('[slot="footer"]') !== null;
    this._hasLabelSlot = this.querySelector('[slot="label"]') !== null;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._removeListeners();
    if (this._animationTimeout !== null) {
      clearTimeout(this._animationTimeout);
    }
    this._restoreBodyScroll();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    if (changedProperties.has('open')) {
      if (this.open) {
        this._openDrawer();
      } else {
        this._closeDrawer();
      }
    }

    if (changedProperties.has('size')) {
      this._applySizeVar();
    }
  }

  // ─── Public Methods ───

  /** Opens the drawer. */
  show(): void {
    this.open = true;
  }

  /** Closes the drawer. */
  hide(): void {
    this.open = false;
  }

  // ─── Private: Size CSS variable ───

  private _applySizeVar(): void {
    const resolvedSize = DRAWER_SIZE_MAP[this.size as DrawerSize] ?? this.size;
    this.style.setProperty('--_drawer-size', resolvedSize);
  }

  // ─── Private: Open / Close ───

  private _lockBodyScroll(): void {
    if (this.contained) return;
    this._previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private _restoreBodyScroll(): void {
    if (this._previousBodyOverflow === null) return;
    document.body.style.overflow = this._previousBodyOverflow;
    this._previousBodyOverflow = null;
  }

  private _openDrawer(): void {
    // Capture trigger for focus restoration
    this._triggerElement = document.activeElement as HTMLElement | null;

    this._applySizeVar();
    this._lockBodyScroll();

    // Dispatch hx-show before visual update
    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));

    // Transition to open state
    void this.updateComplete.then(() => {
      this._isOpen = true;
      this._addListeners();

      // Set initial focus after next render
      void this.updateComplete.then(() => {
        this._cachedFocusableElements = this._getFocusableElements();
        this._setInitialFocus();

        // Dispatch hx-after-show after animation duration
        const duration = this._getAnimationDuration();
        this._animationTimeout = setTimeout(() => {
          this.dispatchEvent(new CustomEvent('hx-after-show', { bubbles: true, composed: true }));
        }, duration);
      });
    });
  }

  private _closeDrawer(): void {
    this._isOpen = false;
    this._removeListeners();
    this._cachedFocusableElements = [];
    this._restoreBodyScroll();

    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));

    // Restore focus to the trigger
    const duration = this._getAnimationDuration();
    this._animationTimeout = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('hx-after-hide', { bubbles: true, composed: true }));
      if (this._triggerElement && typeof this._triggerElement.focus === 'function') {
        this._triggerElement.focus();
      }
      this._triggerElement = null;
    }, duration);
  }

  private _getAnimationDuration(): number {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
    return 300;
  }

  // ─── Event Listeners ───

  private _addListeners(): void {
    this._overlayEl?.addEventListener('keydown', this._handleKeyDown);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  private _removeListeners(): void {
    this._overlayEl?.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  // ─── Keyboard Handler ───

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (!this._isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.open = false;
      return;
    }

    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  };

  // ─── Focus ───

  private _setInitialFocus(): void {
    const event = new CustomEvent('hx-initial-focus', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(event);

    if (!event.defaultPrevented) {
      const focusable = this._cachedFocusableElements;
      if (focusable.length > 0 && focusable[0]) {
        focusable[0].focus();
      } else {
        this._panelEl?.focus();
      }
    }
  }

  private _getFocusableElements(): HTMLElement[] {
    const shadowFocusable = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? [],
    );

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

    const shadowActive = this.shadowRoot?.activeElement;
    const active = (shadowActive ?? document.activeElement) as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ─── Overlay Click ───

  private _handleOverlayClick = (e: MouseEvent): void => {
    // Only close when clicking the overlay itself (backdrop), not the panel
    const target = e.target as HTMLElement;
    if (target === this._overlayEl || target.classList.contains('drawer-backdrop')) {
      this.open = false;
    }
  };

  // ─── Slot change handlers ───

  private _handleHeaderActionsSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHeaderActionsSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleFooterSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasFooterSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Render Helpers ───

  private _renderHeader() {
    if (this.noHeader) return nothing;

    return html`
      <div part="header" class="drawer-header">
        <p part="title" id=${this._titleId} class="drawer-title">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}></slot>
        </p>
        <div class="drawer-header-actions">
          ${this._hasHeaderActionsSlot
            ? html`<slot
                name="header-actions"
                @slotchange=${this._handleHeaderActionsSlotChange}
              ></slot>`
            : html`<slot
                name="header-actions"
                @slotchange=${this._handleHeaderActionsSlotChange}
                style="display:none"
              ></slot>`}
          <button
            part="close-button"
            class="drawer-close-button"
            aria-label="Close drawer"
            @click=${() => {
              this.open = false;
            }}
          >
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private _renderFooter() {
    if (this.noFooter) return nothing;

    return html`
      <div part="footer" class="drawer-footer" ?hidden=${!this._hasFooterSlot}>
        <slot name="footer" @slotchange=${this._handleFooterSlotChange}></slot>
      </div>
    `;
  }

  // ─── Render ───

  override render() {
    const overlayClasses = {
      'drawer-overlay': true,
      'is-open': this._isOpen,
    };

    return html`
      <div
        part="overlay"
        class=${classMap(overlayClasses)}
        role="dialog"
        aria-modal="true"
        aria-labelledby=${this._hasLabelSlot ? this._titleId : nothing}
        tabindex="-1"
        @click=${this._handleOverlayClick}
      >
        <div class="drawer-backdrop" aria-hidden="true"></div>
        <div part="panel" class="drawer-panel" tabindex="-1" role="document">
          ${this._renderHeader()}
          <div part="body" class="drawer-body">
            <slot></slot>
          </div>
          ${this._renderFooter()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-drawer': HelixDrawer;
  }
}
