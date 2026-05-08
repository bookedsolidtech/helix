import { html } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { helixActionBarStyles } from './hx-action-bar.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';

// Re-export size type for external consumers.
export type ActionBarSize = 'sm' | 'md' | 'lg';

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
 * @attr {string} accessible-label - Identifies the toolbar to assistive technology.
 *   When multiple toolbars appear on the same page, each must have a unique, descriptive label.
 *   Falls back to the native `aria-label` attribute if not set.
 *
 * @example
 * ```html
 * <hx-action-bar aria-label="Patient actions">
 *   <hx-button slot="start">Save</hx-button>
 *   <hx-button slot="end" variant="ghost">Cancel</hx-button>
 * </hx-action-bar>
 * ```
 * @cssprop [--hx-action-bar-padding-block-start=0px] - Padding.
 * @cssprop [--hx-action-bar-padding-block-end=0px] - Padding.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-color-neutral-50] - Color.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-space-4] - Spacing token.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-action-bar/AAA-AUDIT.md
 * @keyboard-contract navigate=Arrow; activate=Enter,Space; disabled-suppresses=true
 * @aria-pattern toolbar
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-action-bar
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-action-bar')
export class HelixActionBar extends HelixElement {
  static override styles = [helixActionBarStyles, forcedColorsInteractive];

  /**
   * Size of the action bar — propagated as a data attribute to slotted children.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
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

  // The deprecated `sticky` boolean property has been removed in 3.0.0.
  // Use `position="sticky"` instead.

  /**
   * Accessible label for the toolbar.
   * Required when multiple toolbars appear on the same page.
   *
   * Accepts both `accessible-label` and the standard `aria-label` HTML attribute.
   * The `accessible-label` attribute takes precedence when both are set.
   *
   * Previously this was exposed as the `ariaLabel` JS property, which shadowed
   * the native `HTMLElement.ariaLabel`. That shadowing is removed; use
   * `accessibleLabel` or the HTML attributes instead.
   *
   * @attr accessible-label
   */
  @property({ attribute: 'accessible-label' })
  accessibleLabel: string = '';

  /**
   * Observed mirror of the host's `aria-label` attribute so Lit re-renders
   * when consumers set `aria-label` (the standard HTML pattern).
   * @internal
   */
  @property({ attribute: 'aria-label' })
  private _ariaLabelAttr: string = '';

  /**
   * Returns the effective label for the toolbar, checking accessible-label first,
   * then the aria-label attribute, falling back to 'Actions'.
   * @internal
   */
  private get _effectiveLabel(): string {
    return this.accessibleLabel || this._ariaLabelAttr || 'Actions';
  }

  /** Cached list of focusable items — invalidated on slot change. */
  /** @internal */
  private _focusableCache: HTMLElement[] | null = null;

  /** Whether the overflow slot has assigned content.  * @internal
   */
  @state()
  private _hasOverflow = false;

  // ─── Lifecycle ───

  /** Arrow function field — stable reference for add/removeEventListener. */
  /** @internal */
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
    // Backward compat: accept legacy `size` attribute. When present and `hx-size`
    // is not set, map the value and emit a deprecation warning.
    const legacySize = this.getAttribute('size');
    if (legacySize !== null && !this.hasAttribute('hx-size')) {
      devWarn('hx-action-bar', 'The "size" attribute is deprecated. Use "hx-size" instead.');
      this.size = legacySize as ActionBarSize;
    }
    // Prevent dual aria-label announcement: the host carries the consumer's
    // aria-label attribute while the inner div[role="toolbar"] receives the
    // same value. Setting role="none" on the host hides it from the
    // accessibility tree so only the toolbar is announced.
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    } else if (this.getAttribute('role') !== 'none') {
      devWarn(
        'hx-action-bar',
        `Setting role="${this.getAttribute('role')}" on the host creates a duplicate toolbar announcement. ` +
          'The shadow DOM already contains role="toolbar". Set role="none" on the host to suppress it.',
      );
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

  /** @internal */
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

  /** @internal */
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

  /** @internal */
  private _initRovingTabindex(): void {
    this._focusableCache = null; // invalidate cache on slot change
    const items = this._getFocusableItems();
    if (!items.length) return;
    // Find the currently active item. If none exists (e.g. first render or active item was
    // removed), fall back to index 0. Then set ALL items explicitly so newly added items and
    // items whose tabindex changed externally are always in a correct state.
    const activeIndex = items.findIndex((el) => el.getAttribute('tabindex') === '0');
    const targetIndex = activeIndex === -1 ? 0 : activeIndex;
    items.forEach((el, i) => el.setAttribute('tabindex', i === targetIndex ? '0' : '-1'));
  }

  /** @internal */
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

  /** @internal */
  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    if (slot.name === 'overflow') {
      this._hasOverflow = slot.assignedElements({ flatten: true }).length > 0;
    }
    this._initRovingTabindex();
  }

  // ─── Render ───

  override render() {
    const isSticky = this.position === 'sticky';
    const isBottom = this.position === 'bottom';
    const positionClass = isSticky ? ' base--sticky' : isBottom ? ' base--bottom' : '';

    return html`
      <div
        part="base"
        role="toolbar"
        aria-label=${this._effectiveLabel}
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
