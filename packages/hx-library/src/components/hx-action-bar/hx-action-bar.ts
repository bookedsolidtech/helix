import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
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
 * @slot overflow - Actions hidden in an overflow menu when space is limited.
 *
 * @csspart base - The root toolbar container element.
 * @csspart start - The start (left) slot wrapper.
 * @csspart center - The center (default) slot wrapper.
 * @csspart end - The end (right) slot wrapper.
 *
 * @cssprop [--hx-action-bar-bg=transparent] - Bar background color (default variant).
 * @cssprop [--hx-action-bar-border=none] - Bar border (default variant).
 * @cssprop [--hx-action-bar-padding=var(--hx-space-2,0.5rem) var(--hx-space-3,0.75rem)] - Inner padding.
 * @cssprop [--hx-action-bar-gap=var(--hx-space-2,0.5rem)] - Gap between slotted items.
 * @cssprop [--hx-action-bar-z-index=10] - Z-index when sticky.
 *
 * @example
 * ```html
 * <hx-action-bar aria-label="Patient actions">
 *   <slot name="start">
 *     <hx-button>Save</hx-button>
 *   </slot>
 *   <slot name="end">
 *     <hx-button variant="ghost">Cancel</hx-button>
 *   </slot>
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
   * When true, the bar sticks to the top of its scroll container.
   * @attr sticky
   */
  @property({ type: Boolean, reflect: true })
  sticky = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._handleKeydown = this._handleKeydown.bind(this);
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
  }

  // ─── Focusable item discovery ───

  private _getFocusableItems(): HTMLElement[] {
    const slots = this.shadowRoot?.querySelectorAll('slot') ?? [];
    const items: HTMLElement[] = [];
    for (const slot of Array.from(slots)) {
      const assigned = (slot as HTMLSlotElement).assignedElements({ flatten: true });
      for (const el of assigned) {
        if (el instanceof HTMLElement && this._isFocusable(el)) {
          items.push(el);
        }
        // Also gather focusable descendants
        const descendants = (el as HTMLElement).querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        for (const d of Array.from(descendants)) {
          items.push(d);
        }
      }
    }
    return items;
  }

  private _isFocusable(el: HTMLElement): boolean {
    if (el.hasAttribute('disabled')) return false;
    const tag = el.tagName.toLowerCase();
    if (
      tag === 'button' ||
      tag === 'a' ||
      tag === 'input' ||
      tag === 'select' ||
      tag === 'textarea'
    ) {
      return true;
    }
    const tabIndex = el.getAttribute('tabindex');
    return tabIndex !== null && tabIndex !== '-1';
  }

  // ─── Roving tabindex helpers ───

  private _initRovingTabindex(): void {
    const items = this._getFocusableItems();
    if (!items.length) return;
    const hasActive = items.some((el) => el.getAttribute('tabindex') === '0');
    items.forEach((el, i) => {
      el.setAttribute('tabindex', !hasActive && i === 0 ? '0' : '-1');
    });
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

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this._moveFocus('next');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this._moveFocus('prev');
    } else if (e.key === 'Home') {
      e.preventDefault();
      this._moveFocus('prev'); // go to first via wrap
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
  }

  private _handleSlotChange(): void {
    this._initRovingTabindex();
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        part="base"
        role="toolbar"
        aria-label=${this.getAttribute('aria-label') ?? 'Actions'}
        class="base base--${this.size} base--${this.variant}${this.sticky ? ' base--sticky' : ''}"
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
        <div class="section section--overflow" hidden>
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
