import { LitElement, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import {
  computePosition,
  flip,
  shift,
  offset,
  type Placement as FloatingPlacement,
} from '@floating-ui/dom';
import { helixDropdownStyles } from './hx-dropdown.styles.js';

// P2-03: Export so TypeScript consumers can import this type for prop typing.
export type DropdownPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'start'
  | 'end';

/**
 * A dropdown component — a button that opens a floating panel on click.
 *
 * @summary Button that opens a floating menu panel on click.
 *
 * @tag hx-dropdown
 *
 * @slot trigger - The element that opens the dropdown (e.g. hx-button).
 * @slot - Default slot for dropdown panel content (e.g. menu items).
 *
 * @fires {CustomEvent<void>} hx-show - Dispatched when the dropdown is opened.
 * @fires {CustomEvent<void>} hx-hide - Dispatched when the dropdown is closed.
 * @fires {CustomEvent<{value: string | null; label: string}>} hx-select - Dispatched when a menu item is selected.
 *
 * @csspart trigger - The trigger wrapper element.
 * @csspart panel - The floating panel element.
 *
 * @cssprop [--hx-dropdown-panel-bg=var(--hx-color-neutral-0)] - Panel background color.
 * @cssprop [--hx-dropdown-panel-border-color=var(--hx-color-neutral-200)] - Panel border color.
 * @cssprop [--hx-dropdown-panel-border-radius=var(--hx-border-radius-md)] - Panel border radius.
 * @cssprop [--hx-dropdown-panel-shadow=0 4px 16px rgba(0,0,0,0.12)] - Panel box shadow.
 * @cssprop [--hx-dropdown-panel-z-index=1000] - Panel z-index.
 * @cssprop [--hx-dropdown-panel-min-width=160px] - Panel minimum width.
 *
 * @example
 * ```html
 * <hx-dropdown>
 *   <button slot="trigger">Open Menu</button>
 *   <ul>
 *     <li data-value="edit">Edit</li>
 *     <li data-value="delete">Delete</li>
 *   </ul>
 * </hx-dropdown>
 * ```
 */
@customElement('hx-dropdown')
export class HelixDropdown extends LitElement {
  static override styles = [tokenStyles, helixDropdownStyles];

  // ─── Public Properties ───

  /**
   * Whether the dropdown panel is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Preferred placement of the panel relative to the trigger.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: DropdownPlacement = 'bottom-start';

  /**
   * Whether the dropdown is disabled. Prevents opening.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Gap in pixels between the trigger and the panel.
   * @attr distance
   */
  @property({ type: Number })
  distance = 4;

  // ─── Internal State ───

  @state() private _panelVisible = false;

  // P1-02: Unique panel ID for aria-controls.
  private static _instanceCounter = 0;
  private _panelId = `hx-dropdown-panel-${++HelixDropdown._instanceCounter}`;

  @query('[part="panel"]') private _panel!: HTMLElement;
  @query('[part="trigger"]') private _triggerWrapper!: HTMLElement;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
    document.removeEventListener('click', this._handleOutsideClick);
  }

  // ─── Open/Close ───

  private async _show(): Promise<void> {
    if (this.open || this.disabled) return;
    this.open = true;
    this._panelVisible = true;
    // Add outside-click listener synchronously before any await so it is registered
    // by the time the test fires an outside click after a single await el.updateComplete.
    document.addEventListener('click', this._handleOutsideClick, { capture: true });
    await this.updateComplete;
    // P0-01: Fix focus management — use slot.assignedElements() to traverse slotted (light DOM) content.
    // Focus is set after updateComplete (panel is rendered) but before _updatePosition so
    // it executes in the same microtask as the test's await-continuation.
    const panel = this._panel;
    if (panel) {
      const firstFocusable = this._getFirstFocusableItem();
      firstFocusable?.focus();
    }
    await this._updatePosition();
    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));
  }

  // P2-02: returnFocus=true only on Escape; Tab should let focus advance naturally.
  private _hide(returnFocus = true): void {
    if (!this.open) return;
    this.open = false;
    this._panelVisible = false;
    document.removeEventListener('click', this._handleOutsideClick);
    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));
    if (returnFocus) {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
      const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;
      trigger?.focus();
    }
  }

  // ─── Positioning ───

  private async _updatePosition(): Promise<void> {
    const reference = this._triggerWrapper;
    const panel = this._panel;
    if (!reference || !panel) return;

    // Map 'start' and 'end' to floating-ui's 'left'/'right'
    const floatingPlacement = this.placement
      .replace(/^start$/, 'left')
      .replace(/^end$/, 'right') as FloatingPlacement;

    const { x, y } = await computePosition(reference, panel, {
      placement: floatingPlacement,
      strategy: 'fixed',
      middleware: [offset(this.distance), flip(), shift({ padding: 8 })],
    });

    Object.assign(panel.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  // ─── Event Handlers ───

  private _handleTriggerClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this.open) {
      this._hide();
    } else {
      void this._show();
    }
  }

  private _handleTriggerKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      void this._show();
    }
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.open) {
      e.stopPropagation();
      this._hide(true); // return focus to trigger on Escape
    } else if (e.key === 'Tab' && this.open) {
      // P2-02: Do not return focus to trigger on Tab — let focus advance naturally to next page element.
      this._hide(false);
    } else if (
      this.open &&
      (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')
    ) {
      // P2-01: Arrow key roving within panel per APG Menu Button pattern.
      e.preventDefault();
      this._handleMenuNavigation(e.key);
    }
  }

  // P2-01: Move focus among menuitem elements using arrow keys.
  private _handleMenuNavigation(key: string): void {
    const items = this._getFocusableMenuItems();
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number;
    if (key === 'ArrowDown') {
      nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else if (key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else {
      nextIndex = items.length - 1;
    }
    items[nextIndex]?.focus();
  }

  // P0-01 / P2-01: Get focusable menu items from slotted content.
  private _getFocusableMenuItems(): HTMLElement[] {
    const panel = this._panel;
    if (!panel) return [];
    const slot = panel.querySelector<HTMLSlotElement>('slot');
    const assignedNodes = slot?.assignedElements({ flatten: true }) ?? [];
    const items: HTMLElement[] = [];
    for (const node of assignedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches('[role="menuitem"]')) {
        items.push(node);
      } else {
        node.querySelectorAll<HTMLElement>('[role="menuitem"]').forEach((item) => items.push(item));
      }
    }
    return items;
  }

  // P0-01: Find the first focusable element in slotted panel content.
  private _getFirstFocusableItem(): HTMLElement | null {
    const panel = this._panel;
    if (!panel) return null;
    const slot = panel.querySelector<HTMLSlotElement>('slot');
    const assignedNodes = slot?.assignedElements({ flatten: true }) ?? [];
    const focusableSelector =
      '[role="menuitem"], button, [tabindex]:not([tabindex="-1"]), a[href], input, select, textarea';
    for (const node of assignedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches(focusableSelector)) return node;
      const found = node.querySelector<HTMLElement>(focusableSelector);
      if (found) return found;
    }
    return null;
  }

  private _handleOutsideClick(e: MouseEvent): void {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._hide();
    }
  }

  private _handlePanelClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    // P2-06: Narrow selector — bare 'li' and 'button' cause spurious hx-select events.
    const item = target.closest<HTMLElement>('[role="menuitem"], [data-value]');
    if (!item) return;

    const value = item.dataset['value'] ?? item.getAttribute('value') ?? null;
    const label = item.textContent?.trim() ?? '';

    this.dispatchEvent(
      new CustomEvent('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value, label },
      }),
    );

    this._hide();
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        part="trigger"
        class="trigger-wrapper"
        @click=${this._handleTriggerClick}
        @keydown=${this._handleTriggerKeydown}
      >
        <slot name="trigger" @slotchange=${this._onTriggerSlotChange}></slot>
      </div>
      <div
        part="panel"
        id=${this._panelId}
        aria-hidden=${this._panelVisible ? 'false' : 'true'}
        class=${this._panelVisible ? 'panel panel--visible' : 'panel'}
        @click=${this._handlePanelClick}
      >
        <slot></slot>
      </div>
    `;
  }

  // ─── ARIA setup for trigger slot ───

  private _onTriggerSlotChange(): void {
    this._setupTriggerAria();
  }

  override firstUpdated(): void {
    this._setupTriggerAria();
  }

  private _setupTriggerAria(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
    if (!slot) return;
    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;
    if (trigger) {
      // P1-01: Use aria-haspopup="menu" per ARIA 1.1+ / APG Menu Button pattern.
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', String(this.open));
      // P1-02: Link trigger to panel for screen reader navigation.
      trigger.setAttribute('aria-controls', this._panelId);
    }
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open')) {
      // Keep aria-expanded in sync
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
      const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;
      if (trigger) {
        trigger.setAttribute('aria-expanded', String(this.open));
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-dropdown': HelixDropdown;
  }
}
