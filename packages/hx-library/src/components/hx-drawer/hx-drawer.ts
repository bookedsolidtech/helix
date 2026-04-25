import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/body-scroll-lock.js';
import { devWarn } from '../../utils/dev-warn.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixDrawerStyles } from './hx-drawer.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';

const _nextDrawerId = createIdCounter('hx-drawer');

type DrawerSizePreset = 'sm' | 'md' | 'lg' | 'full';
type DrawerSize = DrawerSizePreset | (string & Record<never, never>);

const DRAWER_SIZE_MAP: Record<DrawerSizePreset, string> = {
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
 * ## Architecture Note: Native `<dialog>` Migration
 *
 * This component currently uses `role="dialog"` + `aria-modal="true"` on a
 * `<div>` rather than the native `<dialog>` element. This is intentional for
 * the current release because:
 *
 * 1. **SSR compatibility**: Native `<dialog>` requires `showModal()` to activate
 *    its modal behavior (focus trapping, backdrop, top-layer). This JavaScript
 *    call is not available during server-side rendering, which is a primary
 *    consumption pattern for Drupal/Twig templates.
 *
 * 2. **Contained mode**: The `contained` property constrains the drawer to a
 *    positioned parent. Native `<dialog>` in modal mode renders in the top layer
 *    and cannot be constrained to a parent element.
 *
 * 3. **Animation control**: The current CSS transition approach provides precise
 *    control over slide-in/slide-out animations. Native `<dialog>` `::backdrop`
 *    animations have inconsistent cross-browser support.
 *
 * Migration to native `<dialog>` is tracked as a future enhancement. When browser
 * support for `CloseWatcher`, `::backdrop` transitions, and declarative dialog
 * opening stabilizes, this component will be migrated to native semantics.
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
 * **Event naming rationale:** hx-drawer uses the `hx-show`/`hx-hide`/`hx-after-show`/`hx-after-hide`
 * pattern shared by all overlay components (hx-popover, hx-tooltip, hx-dropdown). This differs from
 * hx-dialog's `hx-open`/`hx-close`/`hx-cancel` events, which align with native `<dialog>` semantics.
 * The distinction is intentional: overlays are transient visibility toggles, while dialog is a stateful
 * container with cancel semantics.
 *
 * @csspart overlay - The full-screen overlay container (includes backdrop and panel).
 * @csspart panel - The drawer panel itself.
 * @csspart header - The header region containing the title and actions.
 * @csspart title - The drawer title element.
 * @csspart close-button - The built-in close button.
 * @csspart close-btn - The visually-hidden close button rendered when noHeader is true.
 * @csspart body - The scrollable body region.
 * @csspart footer - The footer region.
 *
 * @attr [label] - Accessible label for the dialog when no visible label slot is provided.
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
 * @cssprop [--hx-z-index-modal] - Z-index layer.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-duration-slow] - Animation duration.
 * @cssprop [--hx-easing-out] - CSS custom property.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-shadow-xl] - Box shadow.
 * @cssprop [--hx-drawer-size-md=30rem] - CSS custom property.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-space-5] - Spacing token.
 * @cssprop [--hx-space-6] - Spacing token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-drawer-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-duration-fast] - Animation duration.
 * @cssprop [--hx-easing-default] - CSS custom property.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-drawer-close-btn-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-space-3] - Spacing token.
 */
@customElement('hx-drawer')
export class HelixDrawer extends HelixElement {
  static override styles = [helixDrawerStyles, forcedColorsSurface];

  // ─── Queries ───

  /**
   * Reference to the overlay element that wraps the backdrop and panel.
   * @internal
   */
  @query('.drawer-overlay')
  private _overlayEl: HTMLElement | null | undefined;

  /**
   * Reference to the drawer panel element used for focus management.
   * @internal
   */
  @query('.drawer-panel')
  private _panelEl: HTMLElement | null | undefined;

  // ─── Internal state ───

  /**
   * Whether the drawer is in the open state and visible to the user.
   * @internal
   */
  @state()
  private _isOpen = false;

  /**
   * Whether the header-actions slot has any assigned content.
   * @internal
   */
  @state()
  private _hasHeaderActionsSlot = false;

  /**
   * Whether the footer slot has any assigned content.
   * @internal
   */
  @state()
  private _hasFooterSlot = false;

  /**
   * Whether the label slot has any assigned content.
   * @internal
   */
  @state()
  private _hasLabelSlot = false;

  /**
   * Cached list of focusable elements within the drawer, used for focus trapping.
   * @internal
   */
  private _cachedFocusableElements: HTMLElement[] = [];
  /**
   * The element that triggered the drawer to open, restored focus when the drawer closes.
   * @internal
   */
  private _triggerElement: HTMLElement | null = null;
  /**
   * Handle for the pending animation end timeout, cleared when the drawer opens or closes again.
   * @internal
   */
  private _animationTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Whether this drawer instance currently holds a body-scroll lock. */
  /** @internal */
  private _hasScrollLock = false;
  /**
   * Elements outside the drawer that were given aria-hidden during open, restored on close.
   * @internal
   */
  private _siblingAriaHiddenElements: Element[] = [];

  /**
   * Unique ID for the title element, used by aria-labelledby to link the dialog to its label.
   * @internal
   */
  private readonly _titleId = `${_nextDrawerId()}-title`;

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
  placement: 'start' | 'end' | 'top' | 'bottom' = 'end';

  /**
   * The size of the drawer panel. Use 'sm', 'md', 'lg', 'full', or any valid CSS length.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' | 'full' | (string & Record<never, never>) = 'md';

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

  /**
   * Accessible label for the dialog when the `label` slot is not populated.
   * When the `label` slot is used, `aria-labelledby` takes precedence.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /** Accessible label for the built-in close button. Override for localized text. */
  @property({ type: String, attribute: 'label-close' })
  labelClose = 'Close drawer';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: accept legacy `size` attribute. When present and `hx-size`
    // is not set, map the value and emit a deprecation warning.
    const legacySize = this.getAttribute('size');
    if (legacySize !== null && !this.hasAttribute('hx-size')) {
      devWarn('hx-drawer', 'The "size" attribute is deprecated. Use "hx-size" instead.');
      this.size = legacySize as DrawerSize;
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._removeListeners();
    if (this._animationTimeout !== null) {
      clearTimeout(this._animationTimeout);
    }
    this._restoreBodyScroll();
  }

  override updated(changedProperties: PropertyValues<this>): void {
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

  /** @internal */
  private _applySizeVar(): void {
    const resolvedSize = DRAWER_SIZE_MAP[this.size as DrawerSizePreset] ?? this.size;
    this.style.setProperty('--_drawer-size', resolvedSize);
  }

  // ─── Private: Open / Close ───

  /** @internal */
  private _lockBodyScroll(): void {
    if (this.contained || this._hasScrollLock) return;
    // Uses a shared reference-counted lock so that simultaneous hx-dialog / hx-drawer
    // instances don't clobber each other when one closes before the other
    // (see utils/body-scroll-lock.ts).
    lockBodyScroll();
    this._hasScrollLock = true;
  }

  /** @internal */
  private _restoreBodyScroll(): void {
    if (!this._hasScrollLock) return;
    unlockBodyScroll();
    this._hasScrollLock = false;
  }

  /** @internal */
  private _openDrawer(): void {
    // Capture trigger for focus restoration (P2-04: use instanceof guard)
    const active = document.activeElement;
    this._triggerElement = active instanceof HTMLElement ? active : null;

    // P1-05: clear any pending animation timeout before scheduling a new one
    if (this._animationTimeout !== null) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }

    this._applySizeVar();
    this._lockBodyScroll();
    this._hideBackgroundFromScreenReaders();

    // Dispatch hx-show before visual update
    this.dispatchEvent(new CustomEvent<void>('hx-show', { bubbles: true, composed: true }));

    // Transition to open state
    void this.updateComplete
      .then(() => {
        this._isOpen = true;
        this._addListeners();

        // Set initial focus after next render
        return this.updateComplete;
      })
      .then(() => {
        this._cachedFocusableElements = this._getFocusableElements();
        this._setInitialFocus();

        // Dispatch hx-after-show when the panel's CSS transition completes.
        // If prefers-reduced-motion is active (duration === 0) or the element
        // is missing, fire immediately — transitionend will never fire.
        const duration = this._getAnimationDuration();
        const panel = this._panelEl;
        if (duration === 0 || !panel) {
          this.dispatchEvent(
            new CustomEvent<void>('hx-after-show', { bubbles: true, composed: true }),
          );
        } else {
          const emitAfterShow = () => {
            if (this._animationTimeout !== null) {
              clearTimeout(this._animationTimeout);
              this._animationTimeout = null;
            }
            this.dispatchEvent(
              new CustomEvent<void>('hx-after-show', { bubbles: true, composed: true }),
            );
          };
          panel.addEventListener('transitionend', emitAfterShow, { once: true });
          // Safety fallback: if transitionend never fires (e.g. transition
          // cancelled, element removed), ensure the event is still dispatched.
          this._animationTimeout = setTimeout(emitAfterShow, duration + 50);
        }
      })
      .catch(console.error);
  }

  /** @internal */
  private _closeDrawer(): void {
    // P1-05: clear any pending animation timeout before scheduling a new one
    if (this._animationTimeout !== null) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }

    this._isOpen = false;
    this._removeListeners();
    this._cachedFocusableElements = [];
    this._restoreBodyScroll();
    this._restoreBackgroundForScreenReaders();

    this.dispatchEvent(new CustomEvent<void>('hx-hide', { bubbles: true, composed: true }));

    // Restore focus to the trigger immediately — before any animation timeout.
    // WCAG 2.4.3: focus must never remain on invisible or inert content.
    if (this._triggerElement && typeof this._triggerElement.focus === 'function') {
      this._triggerElement.focus();
    }
    this._triggerElement = null;

    // Dispatch hx-after-hide when the panel's CSS transition completes.
    // If prefers-reduced-motion is active (duration === 0) or the element
    // is missing, fire immediately — transitionend will never fire.
    const duration = this._getAnimationDuration();
    const panel = this._panelEl;
    if (duration === 0 || !panel) {
      this.dispatchEvent(new CustomEvent<void>('hx-after-hide', { bubbles: true, composed: true }));
    } else {
      const emitAfterHide = () => {
        if (this._animationTimeout !== null) {
          clearTimeout(this._animationTimeout);
          this._animationTimeout = null;
        }
        this.dispatchEvent(
          new CustomEvent<void>('hx-after-hide', { bubbles: true, composed: true }),
        );
      };
      panel.addEventListener('transitionend', emitAfterHide, { once: true });
      // Safety fallback: if transitionend never fires (e.g. transition
      // cancelled, element removed), ensure the event is still dispatched.
      this._animationTimeout = setTimeout(emitAfterHide, duration + 50);
    }
  }

  /** @internal */
  private _getAnimationDuration(): number {
    if (typeof window === 'undefined') return 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
    return 300;
  }

  // ─── Background aria-hidden management (P1-03) ───

  /** @internal */
  private _hideBackgroundFromScreenReaders(): void {
    if (this.contained) return;
    this._siblingAriaHiddenElements = [];
    // Walk the parent chain once to find which body child is an ancestor of this component.
    // This avoids calling child.contains(this) in a loop (which is O(n * depth)).
    // Starting from parentElement avoids aliasing `this` to a local variable.
    let ancestorBodyChild: Element | null = null;
    let el: Element | null = this.parentElement;
    while (el && el.parentElement !== document.body) {
      el = el.parentElement;
    }
    if (el && el.parentElement === document.body) {
      ancestorBodyChild = el;
    }
    Array.from(document.body.children).forEach((child) => {
      if (child === this || child === ancestorBodyChild) return;
      if (!child.hasAttribute('aria-hidden')) {
        child.setAttribute('aria-hidden', 'true');
        this._siblingAriaHiddenElements.push(child);
      }
    });
  }

  /** @internal */
  private _restoreBackgroundForScreenReaders(): void {
    this._siblingAriaHiddenElements.forEach((el) => {
      el.removeAttribute('aria-hidden');
    });
    this._siblingAriaHiddenElements = [];
  }

  // ─── Event Listeners (P1-01: use only document listener, not overlay) ───

  /** @internal */
  private _addListeners(): void {
    document.addEventListener('keydown', this._handleKeyDown);
  }

  /** @internal */
  private _removeListeners(): void {
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  // ─── Keyboard Handler ───

  /**
   * Handles keyboard events on the document to trap focus and close the drawer on Escape.
   * @internal
   */
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

  /** @internal */
  private _setInitialFocus(): void {
    const event = new CustomEvent<void>('hx-initial-focus', {
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

  /** @internal */
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

    // P1-02: Use document.activeElement for reliable detection of slotted (light DOM) elements.
    // shadowRoot.activeElement returns the <slot> host for slotted content, not the actual element.
    const active = document.activeElement as HTMLElement | null;

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

  /**
   * Handles clicks on the overlay backdrop to close the drawer when the user clicks outside the panel.
   * @internal
   */
  private _handleOverlayClick = (e: MouseEvent): void => {
    // Only close when clicking the overlay itself (backdrop), not the panel
    const target = e.target as HTMLElement;
    if (target === this._overlayEl || target.classList.contains('drawer-backdrop')) {
      this.open = false;
    }
  };

  // ─── Slot change handlers ───

  /** @internal */
  private _handleHeaderActionsSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHeaderActionsSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleFooterSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasFooterSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderHeader() {
    if (this.noHeader) {
      // WCAG 4.1.2: When the header is hidden there must still be a reachable close
      // mechanism for keyboard and mouse/touch users. Render a visually-hidden close
      // button that is focusable and announced by screen readers.
      return html`
        <button
          part="close-btn"
          class="drawer-close-button drawer-close-button--sr-only"
          aria-label=${this.labelClose}
          @click=${() => {
            this.open = false;
          }}
        ></button>
      `;
    }

    return html`
      <div part="header" class="drawer-header">
        <h2 part="title" id=${this._titleId} class="drawer-title">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}></slot>
        </h2>
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
            aria-label=${this.labelClose}
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

  /** @internal */
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

    // P1-06: ensure the dialog always has an accessible name.
    // Priority: aria-labelledby (slot) > aria-label (prop) > aria-label (fallback "Drawer")
    const ariaLabelledby = this._hasLabelSlot ? this._titleId : undefined;
    const ariaLabel = !this._hasLabelSlot ? this.label || 'Drawer' : undefined;

    return html`
      <div
        part="overlay"
        class=${classMap(overlayClasses)}
        role="dialog"
        aria-modal="true"
        aria-labelledby=${ifDefined(ariaLabelledby)}
        aria-label=${ifDefined(ariaLabel)}
        tabindex="-1"
        @click=${this._handleOverlayClick}
      >
        <div class="drawer-backdrop" aria-hidden="true"></div>
        <div part="panel" class="drawer-panel" tabindex="-1">
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
  interface HTMLElementEventMap {
    'hx-show': CustomEvent<void>;
    'hx-after-show': CustomEvent<void>;
    'hx-hide': CustomEvent<void>;
    'hx-after-hide': CustomEvent<void>;
    'hx-initial-focus': CustomEvent<void>;
  }
}
