import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixActionBarStyles } from './hx-action-bar.styles.js';

/**
 * A horizontal toolbar container for grouping related action buttons and controls.
 * Implements the ARIA toolbar pattern with roving tabindex keyboard navigation.
 *
 * @summary Horizontal action bar for grouping related controls.
 *
 * @tag hx-action-bar
 *
 * @slot start - Left-aligned actions.
 * @slot - Center content (default slot).
 * @slot end - Right-aligned actions.
 * @slot overflow - Actions revealed when the bar is constrained for space.
 *
 * @csspart base - The root toolbar container element.
 * @csspart start - The start (left) slot wrapper.
 * @csspart center - The center (default) slot wrapper.
 * @csspart end - The end (right) slot wrapper.
 * @csspart overflow - The overflow slot wrapper (hidden when no overflow content).
 *
 * @cssprop [--hx-action-bar-bg=transparent] - Bar background color (default variant).
 * @cssprop [--hx-action-bar-border=none] - Bar border (default variant).
 * @cssprop [--hx-action-bar-padding=var(--hx-space-2,0.5rem) var(--hx-space-3,0.75rem)] - Inner padding.
 * @cssprop [--hx-action-bar-gap=var(--hx-space-2,0.5rem)] - Gap between slotted items.
 * @cssprop [--hx-action-bar-z-index=10] - Z-index when sticky or bottom position.
 *
 * @attr {string} aria-label - Required. Identifies the toolbar to assistive technology.
 *   When multiple toolbars appear on the same page, each must have a unique, descriptive label.
 *
 * @example
 * ```html
 * <hx-action-bar aria-label="Patient actions">
 *   <hx-button slot="start">Save</hx-button>
 *   <hx-button slot="end" variant="ghost">Cancel</hx-button>
 * </hx-action-bar>
 * ```
 */
@customElement('hx-action-bar')
export class HelixActionBar extends LitElement {
  static override styles = [tokenStyles, helixActionBarStyles];

  /**
   * Size of the action bar — propagated as a data attribute to slotted children.
   * @attr size
   */
  @property({ type: String, reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Visual variant controlling the bar background.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'outlined' | 'filled' = 'default';

  /**
   * Position and sticky behavior of the action bar.
   * - `top` — normal flow (default)
   * - `sticky` — sticks to the top of the scroll container; add `scroll-padding-top` to the
   *   scroll container equal to the bar height to prevent anchor targets from scrolling behind it
   * - `bottom` — sticks to the bottom of the scroll container with iOS safe-area-inset support
   * @attr position
   */
  @property({ type: String, reflect: true })
  position: 'top' | 'bottom' | 'sticky' = 'top';

  /**
   * @deprecated Use `position="sticky"` instead.
   * When true, the bar sticks to the top of its scroll container.
   * @attr sticky
   */
  @property({ type: Boolean, reflect: true })
  get sticky(): boolean {
    return this._sticky;
  }
  set sticky(value: boolean) {
    if (value) {
      console.warn(
        '[hx-action-bar] The `sticky` property is deprecated. Use `position="sticky"` instead.',
      );
    }
    const old = this._sticky;
    this._sticky = value;
    this.requestUpdate('sticky', old);
  }
  private _sticky = false;

  /**
   * Accessible label for the toolbar.
   * Required when multiple toolbars appear on the same page.
   * @attr aria-label
   */
  @property({ attribute: 'aria-label' })
  ariaLabel: string = 'Actions';

  /** Cached list of focusable items — invalidated on slot change. */
  private _focusableCache: HTMLElement[] | null = null;

  /** Whether the overflow slot has assigned content. */
  @state()
  private _hasOverflow = false;

  // ─── Lifecycle ───

  /** Arrow function field — stable reference for add/removeEventListener. */
  private _handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this._moveFocus('next');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this._moveFocus('prev');
    } else if (e.key === 'Home') {
      e.preventDefault();
      // Move directly to first item — do NOT call _moveFocus which would visit other items first.
      const items = this._getFocusableItems();
      if (items.length) {
        items.forEach((el, i) => el.setAttribute('tabindex', i === 0 ? '0' : '-1'));
        items[0]?.focus();
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      const items = this._getFocusableItems();
      const last = items.length - 1;
      if (items.length) {
        items.forEach((el, i) => el.setAttribute('tabindex', i === last ? '0' : '-1'));
        items[last]?.focus();
      }
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    // Prevent dual aria-label announcement: the host carries the consumer's
    // aria-label attribute while the inner div[role="toolbar"] receives the
    // same value. Setting role="none" on the host hides it from the
    // accessibility tree so only the toolbar is announced.
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
    this.addEventListener('keydown', this._handleKeydown);
  }

  override firstUpdated(): void {
    // Slot assignments are complete by firstUpdated; initialize roving tabindex
    // immediately rather than waiting for the async slotchange event.
    this._initRovingTabindex();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
  }

  // ─── Focusable item discovery ───

  private _isFocusable(el: HTMLElement): boolean {
    // Check disabled via DOM attribute (native elements) or property (custom elements)
    if (el.hasAttribute('disabled')) return false;
    const elWithDisabled = el as HTMLElement & { disabled?: boolean };
    if (elWithDisabled.disabled === true) return false;

    // Use the IDL tabIndex property — covers both DOM attribute and ElementInternals settings.
    // Custom elements (e.g. hx-button) that set tabIndex via ElementInternals are discoverable.
    if (el.tabIndex >= 0) return true;

    const tag = el.tagName.toLowerCase();
    return tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea';
  }

  private _getFocusableItems(): HTMLElement[] {
    if (this._focusableCache) return this._focusableCache;

    const slots = this.shadowRoot?.querySelectorAll('slot') ?? [];
    const items: HTMLElement[] = [];

    for (const slot of Array.from(slots)) {
      const assigned = (slot as HTMLSlotElement).assignedElements({ flatten: true });
      for (const el of assigned) {
        if (!(el instanceof HTMLElement)) continue;
        if (this._isFocusable(el)) {
          // Element is itself focusable — include it and do NOT also recurse into its children
          // to prevent double-counting compound components (e.g. <a><button>).
          items.push(el);
        } else {
          // Element is a non-focusable wrapper (e.g. <div>, <span>) — find focusable children.
          const descendants = el.querySelectorAll<HTMLElement>('*');
          for (const d of Array.from(descendants)) {
            if (this._isFocusable(d)) {
              items.push(d);
            }
          }
        }
      }
    }

    this._focusableCache = items;
    return items;
  }

  // ─── Roving tabindex helpers ───

  private _initRovingTabindex(): void {
    this._focusableCache = null; // invalidate cache on slot change
    const items = this._getFocusableItems();
    if (!items.length) return;
    const hasActive = items.some((el) => el.getAttribute('tabindex') === '0');
    if (!hasActive) {
      // No item is active yet — make the first item tabbable.
      items.forEach((el, i) => el.setAttribute('tabindex', i === 0 ? '0' : '-1'));
    } else {
      // An item is already active — ensure new items get tabindex="-1"
      // without disturbing the currently active item.
      items.forEach((el) => {
        if (el.getAttribute('tabindex') === null) el.setAttribute('tabindex', '-1');
      });
    }
  }

  private _moveFocus(direction: 'next' | 'prev'): void {
    const items = this._getFocusableItems();
    if (!items.length) return;

    const focused = document.activeElement as HTMLElement | null;
    const currentIndex = items.indexOf(focused as HTMLElement);

    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    }

    items.forEach((el, i) => {
      el.setAttribute('tabindex', i === nextIndex ? '0' : '-1');
    });

    items[nextIndex]?.focus();
  }

  // ─── Event Handlers ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    if (slot.name === 'overflow') {
      this._hasOverflow = slot.assignedElements({ flatten: true }).length > 0;
    }
    this._initRovingTabindex();
  }

  // ─── Render ───

  override render() {
    const isSticky = this.position === 'sticky' || this.sticky;
    const isBottom = this.position === 'bottom';
    const positionClass = isSticky ? ' base--sticky' : isBottom ? ' base--bottom' : '';

    return html`
      <div
        part="base"
        role="toolbar"
        aria-label=${this.ariaLabel}
        aria-orientation="horizontal"
        class="base base--${this.size} base--${this.variant}${positionClass}"
      >
        <div part="start" class="section section--start">
          <slot name="start" @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div part="center" class="section section--center">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div part="end" class="section section--end">
          <slot name="end" @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div part="overflow" class="section section--overflow" ?hidden=${!this._hasOverflow}>
          <slot name="overflow" @slotchange=${this._handleSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-action-bar': HelixActionBar;
  }
}
